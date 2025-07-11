document.addEventListener('DOMContentLoaded', () => {
    // --- 定数 ---
    const NORMAL_IMAGE = 'https://cdn.glitch.global/b6695808-4100-47b5-87a4-b9a0f7430888/IMG_3060.PNG?v=1751554837540';
    const TALKING_IMAGE = 'https://cdn.glitch.global/b6695808-4100-47b5-87a4-b9a0f7430888/IMG_3071.PNG?v=1751554879485';
    const SAD_IMAGE = NORMAL_IMAGE;

    // --- HTML要素の取得 ---
   const answerBox = document.getElementById('answer-box');
    const questionInput = document.getElementById('question-input');
    const sendButton = document.getElementById('send-button');
    const appLauncherButton = document.getElementById('app-launcher-button');
    const appDrawer = document.getElementById('app-drawer');
    const characterImage = document.getElementById('character-image');
    const cameraView = document.getElementById('camera-view');
    const faceCanvas = document.getElementById('face-canvas'); // ID名を変更
    const appIcons = document.querySelectorAll('.app-icon');
    const audioFileInput = document.getElementById('audio-file-input');
    const isIPhone = /iPhone/.test(navigator.userAgent);

    // --- グローバル変数 ---
    let conversationId = "";
    let lipSyncInterval;
    let isCameraOn = false; // これは元のカメラ機能用
    let localReminders = [];
    let notifiedReminders = new Set();
    
    // ▼▼▼ 顔認証用の変数を追加 ▼▼▼
    let isRegisteringFace = false;
    let capturedDescriptor = null;

    // --- コア機能・ヘルパー関数 ---
    const changeCharacterImage = (imageURL) => { characterImage.style.backgroundImage = `url("${imageURL}")`; };
    const typewriterEffect = (text, speed = 40) => { return new Promise((resolve) => { answerBox.innerHTML = ''; answerBox.classList.add('typing'); let i = 0; const type = () => { if (i < text.length) { answerBox.textContent += text.charAt(i); i++; answerBox.scrollTop = answerBox.scrollHeight; setTimeout(type, speed); } else { answerBox.classList.remove('typing'); resolve(); } }; type(); }); };
    const speak = (text) => { window.speechSynthesis.cancel(); const utterance = new SpeechSynthesisUtterance(text); const voices = window.speechSynthesis.getVoices(); utterance.voice = voices.find(voice => voice.lang === 'ja-JP') || voices[0]; utterance.rate = 1.0; utterance.pitch = 1.1; window.speechSynthesis.speak(utterance); };
    const toggleAppDrawer = () => { appDrawer.classList.toggle('visible'); };
    
    // --- 【ここから顔認証機能】 ---
    
    // 1. 顔認証のモデル（AI）を読み込む関数
    async function loadFaceApiModels() {
        await typewriterEffect("AIモデルを準備中...");
        await Promise.all([
            faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
            faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
            faceapi.nets.faceRecognitionNet.loadFromUri('/models')
        ]);
    }

    // 2. 顔認証を開始するメインの関数
    async function startFaceRecognition() {
        await typewriterEffect("カメラを起動します...");
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: {} });
            cameraView.srcObject = stream;
            cameraView.style.display = 'block';
            characterImage.style.display = 'none';
        } catch (err) {
            await typewriterEffect("カメラの起動に失敗しました。通常モードで起動します。");
            speak("カメラが使えませんでした。");
            fallbackToNormalStart(); // 通常起動に切り替え
            return;
        }

        const savedUserJSON = localStorage.getItem('pal_user_data');
        const faceMatcher = savedUserJSON ? await createFaceMatcher(savedUserJSON) : null;

        await typewriterEffect(faceMatcher ? "あなたを認識しています..." : "こんにちは！顔を登録します。カメラに顔を写してください。");

        const recognitionInterval = setInterval(async () => {
            if (cameraView.readyState < 3) return; // カメラの準備ができるまで待つ

            const detections = await faceapi.detectSingleFace(cameraView, new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks().withFaceDescriptor();

            if (detections) {
                clearInterval(recognitionInterval);

                if (faceMatcher) {
                    const bestMatch = faceMatcher.findBestMatch(detections.descriptor);
                    if (bestMatch.label !== 'unknown') {
                        const welcomeMessage = `こんにちは、${bestMatch.label}さん！`;
                        await typewriterEffect(welcomeMessage);
                        speak(welcomeMessage);
                        turnOffCamera();
                    } else {
                        await typewriterEffect("登録されている方と違うようです。新しく登録しますね。");
                        await registerNewUser(detections.descriptor);
                    }
                } else {
                    await registerNewUser(detections.descriptor);
                }
            }
        }, 500);
    }
    
    // 照合器を作成する関数
    async function createFaceMatcher(json) {
        const userData = JSON.parse(json);
        const descriptorArray = Object.values(userData.descriptor);
        const descriptor = new Float32Array(descriptorArray);
        const labeledDescriptor = new faceapi.LabeledFaceDescriptors(userData.name, [descriptor]);
        return new faceapi.FaceMatcher(labeledDescriptor, 0.5); 
    }

    // 新規ユーザー登録の準備をする関数
    async function registerNewUser(descriptor) {
        capturedDescriptor = descriptor;
        isRegisteringFace = true;
        await typewriterEffect("顔をスキャンしました。お名前を教えてください。");
        speak("お名前をどうぞ。");
    }

    // カメラをオフにする関数
    function turnOffCamera() {
        if (cameraView.srcObject) {
            cameraView.srcObject.getTracks().forEach(track => track.stop());
        }
        cameraView.style.display = 'none';
        faceCanvas.style.display = 'none';
        characterImage.style.display = 'block';
    }

    // --- 【顔認証機能ここまで】 ---

    // --- API連携・アプリ機能（元のコード） ---
    
    // 送信ボタンが押されたときの処理を分岐させる
    const handleSendClick = async () => {
        const inputText = questionInput.value;

        if (isRegisteringFace) {
            const userName = inputText.trim();
            if (userName && capturedDescriptor) {
                const userData = {
                    name: userName,
                    descriptor: Array.from(capturedDescriptor)
                };
                localStorage.setItem('pal_user_data', JSON.stringify(userData));
                
                isRegisteringFace = false;
                capturedDescriptor = null;
                questionInput.value = '';

                const message = `${userName}さん、覚えました！これからよろしくお願いします。`;
                await typewriterEffect(message);
                speak(message);
                turnOffCamera();
            }
        } else {
            await askDify(inputText);
        }
    };

    const askDify = async (question) => {
        if (!question.trim()) return;
        questionInput.value = '';
        await typewriterEffect('考え中...');
        try {
            const response = await fetch('/ask', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ question, conversation_id: conversationId, userId: 'pal-user-01' }) });
            if (!response.ok) {
                const errData = await response.json().catch(() => ({ answer: 'AIとの通信に失敗しました。'}));
                throw new Error(errData.answer || errData.message);
            }
            if(response.headers.get('content-type')?.includes('application/json')){
                const data = await response.json();
                await typewriterEffect(data.answer);
                speak(data.answer);
                return;
            }
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let fullAnswer = "";
            answerBox.textContent = "";
            answerBox.classList.add('typing');
            while(true) {
                const { value, done } = await reader.read();
                if (done) break;
                const chunk = decoder.decode(value, { stream: true });
                const lines = chunk.split('\n').filter(line => line.startsWith('data: '));
                for (const line of lines) {
                    try {
                        const jsonStr = line.substring(6);
                        if (jsonStr) { const data = JSON.parse(jsonStr); if (data.answer) { fullAnswer += data.answer; answerBox.textContent = fullAnswer; answerBox.scrollTop = answerBox.scrollHeight; } if (data.conversation_id) conversationId = data.conversation_id; }
                    } catch (e) {}
                }
            }
            answerBox.classList.remove('typing');
            speak(fullAnswer);
        } catch (error) {
            await typewriterEffect(error.message || `ごめんなさい、うまく考えられませんでした。`);
            speak("エラーが発生しました。");
        }
    };

    const getWeather = async () => { await typewriterEffect("東京の天気を調べています..."); try { const response = await fetch('/weather', {method: 'POST'}); const data = await response.json(); if (!response.ok) throw new Error(data.error || "天気情報の取得に失敗しました。"); const text = `現在の東京の天気は「${data.weather[0].description}」、気温は${Math.round(data.main.temp)}℃です。`; await typewriterEffect(text); speak(text); } catch (error) { await typewriterEffect(error.message); speak("ごめんなさい、天気情報を取得できませんでした。"); } };
    const searchGoogle = async () => { const query = prompt("🔎 何を調べますか？"); if (!query || !query.trim()) return; await typewriterEffect(`「${query}」について調べています...`); try { const response = await fetch('/google-search', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ query }) }); const data = await response.json(); if (!response.ok) throw new Error(data.error || "検索に失敗しました。"); if (!data.items || data.items.length === 0) { await typewriterEffect(`「${query}」に関する情報は見つかりませんでした。`); speak("情報が見つかりませんでした。"); return; } const snippet = data.items[0].snippet.replace(/\n/g, ''); const text = `「${query}」の検索結果です。 ${snippet}`; await typewriterEffect(text); speak(text); } catch (error) { await typewriterEffect(error.message); speak("ごめんなさい、検索中にエラーが起きました。"); } };
    const handleCamera = async () => { const cameraIcon = document.querySelector('[data-app="camera"] .app-icon-symbol'); if (isCameraOn) { const context = imageCanvas.getContext('2d'); imageCanvas.width = cameraView.videoWidth; imageCanvas.height = cameraView.videoHeight; context.drawImage(cameraView, 0, 0, imageCanvas.width, imageCanvas.height); const base64 = imageCanvas.toDataURL('image/jpeg').split(',')[1]; if (cameraView.srcObject) cameraView.srcObject.getTracks().forEach(track => track.stop()); cameraView.style.display = 'none'; characterImage.style.display = 'block'; isCameraOn = false; cameraIcon.textContent = '📷'; await typewriterEffect("画像を解析しています..."); try { const response = await fetch('/image-analysis', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ imageBase64: base64 }) }); const data = await response.json(); if (!response.ok) throw new Error(data.error || '解析サーバーでエラーが発生しました。'); const topConcept = data.outputs[0].data.concepts[0]; const text = `これは「${topConcept.name}」ですね！`; await typewriterEffect(text); speak(text); } catch (error) { await typewriterEffect(error.message); speak("ごめんなさい、うまく解析できませんでした。"); } } else { await typewriterEffect("カメラを起動します..."); try { const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } }); cameraView.srcObject = stream; cameraView.style.display = 'block'; characterImage.style.display = 'none'; isCameraOn = true; cameraIcon.textContent = '📸'; await typewriterEffect("スクリーンをタップして撮影します。"); cameraView.onclick = () => handleCamera(); } catch (error) { await typewriterEffect("カメラの起動に失敗しました。"); speak("カメラが使えませんでした。"); } } };
    const handleVoiceInput = () => { const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition; if (!SpeechRecognition) { typewriterEffect("お使いのブラウザは音声入力に対応していません。"); return; } const recognition = new SpeechRecognition(); recognition.lang = 'ja-JP'; recognition.onstart = () => { typewriterEffect("話しかけてください..."); }; recognition.onresult = (event) => { const spokenText = event.results[0][0].transcript; questionInput.value = spokenText; askDify(spokenText); }; recognition.onerror = (event) => { typewriterEffect("うまく聞き取れませんでした。"); }; try { recognition.start(); } catch (e) { typewriterEffect("音声認識を開始できませんでした。"); } };
    const handleTranscriptionUpload = async (file) => { await typewriterEffect("ファイルを解析・文字起こし中..."); const formData = new FormData(); formData.append('audio', file); try { const response = await fetch('/audio-transcript', { method: 'POST', body: formData }); const data = await response.json(); if (!response.ok) throw new Error(data.error || '文字起こしに失敗しました。'); let transcriptText = "【文字起こし結果】\n\n"; if (data.utterances && data.utterances.length > 0) { data.utterances.forEach(utterance => { transcriptText += `話者 ${utterance.speaker}: ${utterance.text}\n`; }); } else { transcriptText += data.text; } if (data.sentiment_analysis_results && data.sentiment_analysis_results.length > 0) { const sentiment = data.sentiment_analysis_results[0].sentiment; transcriptText += `\n\n【全体の感情: ${sentiment}】`; } await typewriterEffect(transcriptText); speak("文字起こしが完了しました。"); } catch (error) { await typewriterEffect(error.message); speak("ファイルの文字起こしに失敗しました。"); } };
    const handleSaveMemory = async () => { await typewriterEffect("今日の会話を記憶しています..."); try { const response = await fetch('/end-conversation', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: 'pal-user-01' }) }); const data = await response.json(); await typewriterEffect(data.message); speak(data.message); } catch (error) { await typewriterEffect("記憶中にエラーが発生しました。"); speak("うまく記憶できませんでした。"); } };
    const fetchReminders = async () => { try { const response = await fetch('/get-reminders', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: 'pal-user-01' }) }); const data = await response.json(); if (data.reminders) { localReminders = data.reminders; } } catch (error) { console.error("リマインダーの取得に失敗"); } };
    const checkReminders = () => { const now = new Date(); localReminders.forEach(reminder => { const eventDate = new Date(reminder.eventDate); const hoursUntilEvent = (eventDate - now) / 36e5; if (hoursUntilEvent > 1 && hoursUntilEvent <= 3 && !notifiedReminders.has(reminder._id)) { const message = `リマインダーです。「${reminder.eventName}」まであと${Math.floor(hoursUntilEvent)}時間くらいですよ。`; typewriterEffect(message); speak(message); notifiedReminders.add(reminder._id); } }); };
    const addReminder = async () => { const text = prompt("📅 リマインダーの内容を日時を含めて入力してください。\n例: 明日の15時から会議"); if (!text || !text.trim()) return; await typewriterEffect("新しい予定を覚えています..."); try { const response = await fetch('/add-reminder', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text }) }); const data = await response.json(); await typewriterEffect(data.message); speak(data.message); fetchReminders(); } catch (error) { await typewriterEffect("予定の登録に失敗しました。"); speak("エラーで覚えられませんでした。"); } };

    // --- イベントリスナー設定 ---
    appLauncherButton.addEventListener('click', toggleAppDrawer);
    sendButton.addEventListener('click', handleSendClick); // 呼び出す関数を変更
    questionInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); handleSendClick(); } });
    
    appIcons.forEach(icon => {
        icon.addEventListener('click', () => {
            toggleAppDrawer();
            switch (icon.dataset.app) {
                case 'weather': getWeather(); break;
                case 'google': searchGoogle(); break;
                case 'camera': handleCamera(); break; // 元のカメラ機能も残しておきます
                case 'mic': handleVoiceInput(); break;
                case 'transcribe': audioFileInput.click(); break;
                case 'reminder': if (isIPhone) addReminder(); else typewriterEffect("この機能はiPhoneでの利用を想定しています。"); break;
                case 'save-memory': handleSaveMemory(); break;
            }
        });
    });
    
    audioFileInput.addEventListener('change', (event) => { const file = event.target.files[0]; if (file) { handleTranscriptionUpload(file); } event.target.value = null; });
    
    // --- 初期化処理 ---
    const fallbackToNormalStart = async () => {
        let initialMessage = "こんにちは。僕の名前はパルだよ。";
        if (isIPhone) {
            await fetchReminders();
            const today = new Date().toDateString();
            const todaysReminder = localReminders.find(r => new Date(r.eventDate).toDateString() === today);
            if (todaysReminder) {
                initialMessage = `こんにちは！今日は「${todaysReminder.eventName}」の予定がありますね。お忘れなく！`;
            }
            setInterval(checkReminders, 60000);
        }
        await typewriterEffect(initialMessage);
        speak(initialMessage);
    };

    const init = async () => {
        if (speechSynthesis.onvoiceschanged !== undefined) { speechSynthesis.onvoiceschanged = () => window.speechSynthesis.getVoices(); }
        
        try {
            await loadFaceApiModels();
            await startFaceRecognition();
        } catch (error) {
            console.error("顔認証の初期化エラー:", error);
            await typewriterEffect("顔認証の準備に失敗しました。通常モードで起動します。");
            speak("顔認証の準備に失敗しました。");
            await fallbackToNormalStart();
        }
    };
    
    init();
});
