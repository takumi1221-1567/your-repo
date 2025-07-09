document.addEventListener('DOMContentLoaded', () => {
    // --- 定数 ---
const SLEEPING_IMAGE = 'https://cdn.glitch.global/62146793-461b-4f49-9113-c0eabe1bacb6/IMG_3108.PNG?v=1751592307153'; // 眠っている画像のURL
const NORMAL_IMAGE = 'https://cdn.glitch.global/62146793-461b-4f49-9113-c0eabe1bacb6/IMG_3107.PNG?v=1751592292412';   // 通常時の画像のURL
const TALKING_IMAGE = 'https://cdn.glitch.global/62146793-461b-4f49-9113-c0eabe1bacb6/ChatGPT%20Image%202025%E5%B9%B47%E6%9C%883%E6%97%A5%2016_14_14.png?v=1751527086325';  // 応答中の画像のURL
const EXCITED_IMAGE = 'https://cdn.glitch.global/62146793-461b-4f49-9113-c0eabe1bacb6/ChatGPT%20Image%202025%E5%B9%B47%E6%9C%883%E6%97%A5%2016_14_14.png?v=1751527086325';  // 興奮している画像のURL
const SAD_IMAGE = 'https://cdn.glitch.global/62146793-461b-4f49-9113-c0eabe1bacb6/ChatGPT%20Image%202025%E5%B9%B47%E6%9C%883%E6%97%A5%2016_14_14.png?v=1751527086325';      // 落ち込んでいる画像のURL
// --- OpenWeatherMap APIキー ---
// 重要: 本番環境ではこのAPIキーをサーバーサイドで管理することを強く推奨します！
const OPENWEATHERMAP_API_KEY = "240647e0fe2bca93f218a85475def0d3"; // あなたのAPIキーに置き換えてください
// --- ▲▲▲ あなたの情報に書き換えてください ▲▲▲ ---

 // --- HTML要素の取得 ---
    const answerBox = document.getElementById('answer-box');
    const questionInput = document.getElementById('question-input');
    const sendButton = document.getElementById('send-button');
    const appLauncherButton = document.getElementById('app-launcher-button');
    const appDrawer = document.getElementById('app-drawer');
    const characterImage = document.getElementById('character-image');
    const cameraView = document.getElementById('camera-view');
    const imageCanvas = document.getElementById('image-canvas');
    const appIcons = document.querySelectorAll('.app-icon');
    const audioFileInput = document.getElementById('audio-file-input');

    // --- グローバル変数 ---
    let conversationId = "";
    let lipSyncInterval;
    let isCameraOn = false;
    let localReminders = [];
    let notifiedReminders = new Set();
    const isIPhone = /iPhone/.test(navigator.userAgent);

    // --- コア機能・ヘルパー関数 ---

    const changeCharacterImage = (imageURL) => {
        characterImage.style.backgroundImage = `url("${imageURL}")`;
    };

    const typewriterEffect = (text, speed = 40) => {
        return new Promise((resolve) => {
            answerBox.innerHTML = '';
            answerBox.classList.add('typing');
            let i = 0;
            const type = () => {
                if (i < text.length) {
                    answerBox.textContent += text.charAt(i);
                    i++;
                    answerBox.scrollTop = answerBox.scrollHeight;
                    setTimeout(type, speed);
                } else {
                    answerBox.classList.remove('typing');
                    resolve();
                }
            };
            type();
        });
    };

    const speak = (text, finalImage = NORMAL_IMAGE) => {
        if (lipSyncInterval) clearInterval(lipSyncInterval);
        window.speechSynthesis.cancel();
        
        const utterance = new SpeechSynthesisUtterance(text);
        const voices = window.speechSynthesis.getVoices();
        utterance.voice = voices.find(voice => voice.lang === 'ja-JP') || voices[0];
        utterance.rate = 1.0;
        utterance.pitch = 1.1;

        utterance.onstart = () => {
            let isMouthOpen = false;
            lipSyncInterval = setInterval(() => {
                changeCharacterImage(isMouthOpen ? finalImage : TALKING_IMAGE);
                isMouthOpen = !isMouthOpen;
            }, 150);
        };

        utterance.onend = () => {
            clearInterval(lipSyncInterval);
            changeCharacterImage(finalImage);
        };
        window.speechSynthesis.speak(utterance);
    };

    const toggleAppDrawer = () => {
        appDrawer.classList.toggle('visible');
    };

    // --- API連携・アプリ機能 ---

    const askDify = async (question) => {
        if (!question.trim()) return;
        questionInput.value = '';
        await typewriterEffect('考え中...');
        try {
            const response = await fetch('/ask', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ question, conversation_id: conversationId, userId: 'pal-user-01' })
            });
            if (!response.ok) throw new Error('AIとの通信に失敗しました。');
            
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let fullAnswer = "";
            answerBox.textContent = "";
            answerBox.classList.add('typing');

            const streamReader = async () => {
                while(true) {
                    const { value, done } = await reader.read();
                    if (done) break;
                    const decodedChunk = decoder.decode(value, { stream: true });
                    const lines = decodedChunk.split('\n').filter(line => line.startsWith('data: '));
                    for (const line of lines) {
                        try {
                            const jsonStr = line.substring(6);
                            if (jsonStr) {
                                const data = JSON.parse(jsonStr);
                                if (data.answer) {
                                    fullAnswer += data.answer;
                                    answerBox.textContent = fullAnswer;
                                    answerBox.scrollTop = answerBox.scrollHeight;
                                }
                                if (data.conversation_id) conversationId = data.conversation_id;
                            }
                        } catch (e) {}
                    }
                }
            };
            await streamReader();
            answerBox.classList.remove('typing');
            speak(fullAnswer, NORMAL_IMAGE);
        } catch (error) {
            await typewriterEffect(`ごめんなさい、うまく考えられませんでした。`);
            speak("エラーが発生しました。", SAD_IMAGE);
        }
    };

    const getWeather = async () => {
        await typewriterEffect("東京の天気を調べています...");
        try {
            const response = await fetch('/weather', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ city: 'tokyo' }) });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || "天気情報の取得に失敗しました。");
            const text = `現在の東京の天気は「${data.weather[0].description}」、気温は${Math.round(data.main.temp)}℃です。`;
            await typewriterEffect(text);
            speak(text, NORMAL_IMAGE);
        } catch (error) {
            await typewriterEffect(error.message);
            speak("ごめんなさい、天気情報を取得できませんでした。", SAD_IMAGE);
        }
    };

    const searchGoogle = async () => {
        const query = prompt("🔎 何を調べますか？");
        if (!query || !query.trim()) return;
        await typewriterEffect(`「${query}」について調べています...`);
        try {
            const response = await fetch('/google-search', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ query }) });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || "検索に失敗しました。");
            if (!data.items || data.items.length === 0) {
                await typewriterEffect(`「${query}」に関する情報は見つかりませんでした。`);
                speak("情報が見つかりませんでした。", SAD_IMAGE);
                return;
            }
            const snippet = data.items[0].snippet.replace(/\n/g, '');
            const text = `「${query}」の検索結果です。 ${snippet}`;
            await typewriterEffect(text);
            speak(text, EXCITED_IMAGE);
        } catch (error) {
            await typewriterEffect(error.message);
            speak("ごめんなさい、検索中にエラーが起きました。", SAD_IMAGE);
        }
    };

    const handleCamera = async () => {
        const cameraIcon = document.querySelector('[data-app="camera"] .app-icon-symbol');
        if (isCameraOn) {
            const context = imageCanvas.getContext('2d');
            imageCanvas.width = cameraView.videoWidth;
            imageCanvas.height = cameraView.videoHeight;
            context.drawImage(cameraView, 0, 0, imageCanvas.width, imageCanvas.height);
            const base64 = imageCanvas.toDataURL('image/jpeg').split(',')[1];
            if (cameraView.srcObject) cameraView.srcObject.getTracks().forEach(track => track.stop());
            cameraView.style.display = 'none';
            characterImage.style.display = 'block';
            isCameraOn = false;
            cameraIcon.textContent = '📷';
            await typewriterEffect("画像を解析しています...");
            try {
                const response = await fetch('/image-analysis', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ imageBase64: base64 }) });
                const data = await response.json();
                if (!response.ok) throw new Error(data.error || '解析サーバーでエラーが発生しました。');
                const topConcept = data.outputs[0].data.concepts[0];
                const text = `これは「${topConcept.name}」ですね！確からしさは${Math.round(topConcept.value * 100)}%くらいかな。`;
                await typewriterEffect(text);
                speak(text, EXCITED_IMAGE);
            } catch (error) {
                await typewriterEffect(error.message);
                speak("ごめんなさい、うまく解析できませんでした。", SAD_IMAGE);
            }
        } else {
            await typewriterEffect("カメラを起動します...");
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
                cameraView.srcObject = stream;
                cameraView.style.display = 'block';
                characterImage.style.display = 'none';
                isCameraOn = true;
                cameraIcon.textContent = '📸';
                await typewriterEffect("スクリーンをタップして撮影します。");
                cameraView.onclick = () => handleCamera();
            } catch (error) {
                await typewriterEffect("カメラの起動に失敗しました。権限を許可してください。");
                speak("カメラが使えませんでした。", SAD_IMAGE);
            }
        }
    };

    const handleVoiceInput = () => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            typewriterEffect("お使いのブラウザは音声入力に対応していません。");
            speak("ごめんなさい、このブラウザでは音声入力が使えないみたいです。", SAD_IMAGE);
            return;
        }
        const recognition = new SpeechRecognition();
        recognition.lang = 'ja-JP';
        recognition.interimResults = false;
        recognition.continuous = false;
        recognition.onstart = () => { typewriterEffect("話しかけてください..."); changeCharacterImage(TALKING_IMAGE); };
        recognition.onend = () => { changeCharacterImage(NORMAL_IMAGE); };
        recognition.onresult = (event) => { const spokenText = event.results[0][0].transcript; questionInput.value = spokenText; askDify(spokenText); };
        recognition.onerror = (event) => { if (event.error !== 'no-speech') { typewriterEffect(`音声認識エラー: ${event.error}`); speak("ごめんなさい、うまく聞き取れませんでした。", SAD_IMAGE); } else { typewriterEffect("マイクが音声を拾えませんでした。"); } };
        try { recognition.start(); } catch (e) { typewriterEffect("音声認識を開始できませんでした。"); }
    };

    const handleTranscriptionUpload = async (file) => {
        await typewriterEffect("ファイルを解析・文字起こし中...");
        const formData = new FormData();
        formData.append('audio', file);
        try {
            const response = await fetch('/audio-transcript', { method: 'POST', body: formData });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || '文字起こしに失敗しました。');
            let transcriptText = "【文字起こし結果】\n\n";
            if (data.utterances && data.utterances.length > 0) {
                data.utterances.forEach(utterance => { transcriptText += `話者 ${utterance.speaker}: ${utterance.text}\n`; });
            } else { transcriptText += data.text; }
            if (data.sentiment_analysis_results && data.sentiment_analysis_results.length > 0) {
                const overallSentiment = data.sentiment_analysis_results[0].sentiment;
                transcriptText += `\n\n【全体の感情: ${overallSentiment}】`;
            }
            await typewriterEffect(transcriptText);
            speak("文字起こしが完了しました。");
        } catch (error) {
            await typewriterEffect(error.message);
            speak("ごめんなさい、ファイルの文字起こしに失敗しました。", SAD_IMAGE);
        }
    };
    
    const handleSaveMemory = async () => {
        await typewriterEffect("今日の会話を記憶しています...");
        try {
            const response = await fetch('/end-conversation', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: 'pal-user-01' })
            });
            const data = await response.json();
            await typewriterEffect(data.message);
            speak(data.message);
        } catch (error) {
            await typewriterEffect("記憶中にエラーが発生しました。");
            speak("ごめんなさい、うまく記憶できませんでした。", SAD_IMAGE);
        }
    };
    
    const fetchReminders = async () => {
        try {
            const response = await fetch('/get-reminders', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: 'pal-user-01' }) });
            const data = await response.json();
            if (data.reminders) {
                localReminders = data.reminders;
                console.log('リマインダーを読み込みました:', localReminders);
            }
        } catch (error) {
            console.error("リマインダーの取得に失敗:", error);
        }
    };

    const checkReminders = () => {
        const now = new Date();
        localReminders.forEach(reminder => {
            const eventDate = new Date(reminder.eventDate);
            const hoursUntilEvent = (eventDate - now) / (1000 * 60 * 60);
            if (hoursUntilEvent > 1 && hoursUntilEvent <= 3 && !notifiedReminders.has(reminder._id)) {
                const message = `リマインダーです。「${reminder.eventName}」まであと${Math.floor(hoursUntilEvent)}時間くらいですよ。`;
                typewriterEffect(message);
                speak(message, EXCITED_IMAGE);
                notifiedReminders.add(reminder._id);
            }
        });
    };

    const addReminder = async () => {
        const text = prompt("📅 リマインダーの内容を日時を含めて入力してください。\n例: 明日の15時から会議");
        if (!text || !text.trim()) return;
        await typewriterEffect("新しい予定を覚えています...");
        try {
            const response = await fetch('/add-reminder', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: text }) });
            const data = await response.json();
            await typewriterEffect(data.message);
            speak(data.message);
            fetchReminders();
        } catch (error) {
            await typewriterEffect("ごめんなさい、予定の登録に失敗しました。");
            speak("エラーで覚えられませんでした。", SAD_IMAGE);
        }
    };

    // --- イベントリスナー設定 ---
    appLauncherButton.addEventListener('click', toggleAppDrawer);
    sendButton.addEventListener('click', () => askDify(questionInput.value));
    questionInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') { e.preventDefault(); askDify(questionInput.value); }
    });

    appIcons.forEach(icon => {
        icon.addEventListener('click', () => {
            const appName = icon.dataset.app;
            toggleAppDrawer();
            switch (appName) {
                case 'weather': getWeather(); break;
                case 'google': searchGoogle(); break;
                case 'camera': handleCamera(); break;
                case 'mic': handleVoiceInput(); break;
                case 'transcribe': audioFileInput.click(); break;
                case 'reminder':
                    if (isIPhone) { addReminder(); }
                    else { typewriterEffect("この機能はiPhoneでの利用を想定しています。"); }
                    break;
                case 'save-memory':
                    handleSaveMemory();
                    break;
            }
        });
    });
    
    audioFileInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file) { handleTranscriptionUpload(file); }
        event.target.value = null;
    });
    
    // --- 初期化処理 ---
    const init = async () => {
        if (speechSynthesis.onvoiceschanged !== undefined) {
            speechSynthesis.onvoiceschanged = () => window.speechSynthesis.getVoices();
        }
        changeCharacterImage(NORMAL_IMAGE);

        let initialMessage = "こんにちは。僕の名前はパルだよ。";

        if (isIPhone) {
            await fetchReminders();
            
            const today = new Date().toDateString();
            const todaysReminder = localReminders.find(r => new Date(r.eventDate).toDateString() === today);

            if (todaysReminder) {
                initialMessage = `こんにちは！今日は「${todaysReminder.eventName}」の予定がありますね。お忘れなく！`;
            }
            
            setInterval(checkReminders, 60 * 1000);
        }
        
        await typewriterEffect(initialMessage);
        speak(initialMessage, NORMAL_IMAGE);
    };

    init();
});
    init();
});
