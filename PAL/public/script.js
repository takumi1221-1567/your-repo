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
    
    // 画像はアニメーションCSSで直接指定されているため、JSでの定義は不要になりました

    // --- グローバル変数 ---
    let conversationId = "";
    let isRegisteringFace = false; // 顔登録モードかを判定するフラグ
    let capturedDescriptor = null; // 撮影した顔のデータを一時保存する変数

    // --- コア機能・ヘルパー関数 ---
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
    
    // 音声合成は顔認証と干渉するため、一旦シンプルな形にします
    const speak = (text) => {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        const voices = window.speechSynthesis.getVoices();
        utterance.voice = voices.find(voice => voice.lang === 'ja-JP') || voices[0];
        utterance.rate = 1.0;
        utterance.pitch = 1.1;
        window.speechSynthesis.speak(utterance);
    };

    const toggleAppDrawer = () => appDrawer.classList.toggle('visible');

    // ---【ここから顔認証機能】---

    // 1. 顔認証のモデル（AI）を読み込む関数
    async function loadFaceApiModels() {
        await typewriterEffect("AIモデルを準備中...");
        // public/models/ フォルダからモデルを読み込みます
        await Promise.all([
            faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
            faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
            faceapi.nets.faceRecognitionNet.loadFromUri('/models'),
            faceapi.nets.faceExpressionNet.loadFromUri('/models')
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
            await typewriterEffect("カメラの起動に失敗しました。");
            speak("カメラが使えませんでした。");
            return;
        }

        // ユーザー情報が保存されているか確認
        const savedUserJSON = localStorage.getItem('pal_user_data');
        const faceMatcher = savedUserJSON ? await createFaceMatcher(savedUserJSON) : null;

        await typewriterEffect(faceMatcher ? "あなたを認識しています..." : "こんにちは！顔を登録します。カメラに顔を写してください。");

        const recognitionInterval = setInterval(async () => {
            const detections = await faceapi.detectAllFaces(cameraView, new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks().withFaceDescriptors();
            
            // 顔が検出されたら
            if (detections.length > 0) {
                // 認識処理中はインターバルを停止
                clearInterval(recognitionInterval);

                // もし保存されたユーザーがいるなら照合する
                if (faceMatcher) {
                    const bestMatch = faceMatcher.findBestMatch(detections[0].descriptor);
                    if (bestMatch.label !== 'unknown') {
                        // 顔が一致した場合
                        const welcomeMessage = `こんにちは、${bestMatch.label}さん！`;
                        await typewriterEffect(welcomeMessage);
                        speak(welcomeMessage);
                        turnOffCamera();
                    } else {
                        // 一致しなかった場合、再登録フローへ
                        await typewriterEffect("登録されている方と違うようです。新しく登録しますね。");
                        await registerNewUser(detections[0].descriptor);
                    }
                } else {
                    // 新規ユーザー登録
                    await registerNewUser(detections[0].descriptor);
                }
            }
        }, 1000); // 1秒ごとにカメラ映像をチェック
    }

    // 保存されたデータからFaceMatcher（照合器）を作成
    async function createFaceMatcher(json) {
        const userData = JSON.parse(json);
        const descriptor = new Float32Array(Object.values(userData.descriptor));
        const labeledDescriptor = new faceapi.LabeledFaceDescriptors(userData.name, [descriptor]);
        return new faceapi.FaceMatcher(labeledDescriptor, 0.5); // 0.5以下の距離なら同一人物と判断
    }

    // 新規ユーザーを登録する処理
    async function registerNewUser(descriptor) {
        capturedDescriptor = descriptor; // 検出した顔データを一時保存
        isRegisteringFace = true; // 登録モードON
        await typewriterEffect("顔をスキャンしました。お名前を教えてください。");
        speak("お名前をどうぞ。");
    }

    // カメラをオフにする関数
    function turnOffCamera() {
        if (cameraView.srcObject) {
            cameraView.srcObject.getTracks().forEach(track => track.stop());
        }
        cameraView.style.display = 'none';
        characterImage.style.display = 'block';
    }

    // ---【顔認証機能ここまで】---
    
    // --- API連携・アプリ機能（既存のものを一部改変） ---
    const handleSendClick = async () => {
        const inputText = questionInput.value;

        // 顔登録モードの場合の処理
        if (isRegisteringFace) {
            const userName = inputText.trim();
            if (userName && capturedDescriptor) {
                const userData = {
                    name: userName,
                    descriptor: capturedDescriptor
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
            return;
        }

        // 通常の会話処理
        await askDify(inputText);
    };
    
    // Dify APIを呼び出す関数
    const askDify = async (question) => { /* ...（この関数の中身は変更なし）... */ };
    // その他のアプリ機能の関数（getWeather, searchGoogleなど）も変更なし
    const getWeather = async () => { /* ... */ };
    const searchGoogle = async () => { /* ... */ };
    const handleCamera = async () => { /* ...（この機能は顔認証と競合するため、一旦無効化も検討）... */ };
    const handleVoiceInput = () => { /* ... */ };
    const handleTranscriptionUpload = async (file) => { /* ... */ };
    const handleSaveMemory = async () => { /* ... */ };
    const addReminder = async () => { /* ... */ };


    // --- イベントリスナー設定 ---
    appLauncherButton.addEventListener('click', toggleAppDrawer);
    sendButton.addEventListener('click', handleSendClick); // 呼び出す関数を変更
    questionInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleSendClick(); // 呼び出す関数を変更
        }
    });
    
    appIcons.forEach(icon => {
        icon.addEventListener('click', () => {
            toggleAppDrawer();
            switch (icon.dataset.app) {
                case 'weather': getWeather(); break;
                case 'google': searchGoogle(); break;
                // 他のアプリも同様...
            }
        });
    });

    audioFileInput.addEventListener('change', (event) => { /* ... */ });
    
    // --- 初期化処理 ---
    const init = async () => {
        // 音声合成の準備
        if (speechSynthesis.onvoiceschanged !== undefined) {
            speechSynthesis.onvoiceschanged = () => window.speechSynthesis.getVoices();
        }

        try {
            await loadFaceApiModels();
            await startFaceRecognition();
        } catch (error) {
            console.error("初期化エラー:", error);
            await typewriterEffect("起動シーケンス中にエラーが発生しました。");
            speak("起動中にエラーが起きました。");
        }
    };

    init();
});
