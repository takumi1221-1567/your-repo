// ============================================
// P69REAL - AI秘書ロックマン
// メインアプリケーションロジック
// ============================================

// ============================================
// グローバル変数
// ============================================
let currentMode = 'armor'; // デフォルトは装甲モード
let isRecording = false; // 音声録音中フラグ
let isProcessing = false; // AI処理中フラグ
let recognition = null; // 音声認識オブジェクト
let speechSynthesis = window.speechSynthesis; // 音声合成

// 送信フロー用の一時変数
let sendFlow = {
    active: false,
    target: null, // 'line', 'slack', 'x'
    recipient: null,
    message: null
};

// ============================================
// DOM要素の取得
// ============================================
const userInput = document.getElementById('user-input');
const micButton = document.getElementById('mic-button');
const sendButton = document.getElementById('send-button');
const modeIndicator = document.getElementById('mode-indicator');
const modeText = document.getElementById('mode-text');
const statusIndicator = document.getElementById('status-indicator');
const statusText = document.getElementById('status-text');

// X連携ボタン
const xConnectButton = document.getElementById('x-connect-button');
const xConnectText = document.getElementById('x-connect-text');

// パスワードモーダル
const passwordModal = document.getElementById('password-modal');
const passwordInput = document.getElementById('password-input');
const passwordSubmit = document.getElementById('password-submit');
const passwordCancel = document.getElementById('password-cancel');

// 送信先選択モーダル
const sendTargetModal = document.getElementById('send-target-modal');
const sendCancel = document.getElementById('send-cancel');

// 宛名入力モーダル
const recipientModal = document.getElementById('recipient-modal');
const recipientInput = document.getElementById('recipient-input');
const recipientSubmit = document.getElementById('recipient-submit');
const recipientCancel = document.getElementById('recipient-cancel');

// メッセージ入力モーダル
const messageModal = document.getElementById('message-modal');
const messageInput = document.getElementById('message-input');
const messageSubmit = document.getElementById('message-submit');
const messageCancel = document.getElementById('message-cancel');

// ============================================
// 初期化処理
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 P69REAL 起動中...');

    // 音声認識の初期化
    initSpeechRecognition();

    // イベントリスナーの設定
    setupEventListeners();

    // 初期モード設定
    setMode('armor');

    // X連携状態を確認
    checkXConnectionStatus();

    console.log('✅ P69REAL 起動完了');
});

// ============================================
// 音声認識の初期化
// ============================================
function initSpeechRecognition() {
    // ブラウザの音声認識APIをチェック
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
        console.warn('⚠️ 音声認識APIが利用できません');
        return;
    }

    recognition = new SpeechRecognition();
    recognition.lang = 'ja-JP';
    recognition.continuous = false;
    recognition.interimResults = false;

    // 音声認識結果
    recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        console.log('🎤 音声認識結果:', transcript);

        // パスワードモーダルが開いている場合
        if (!passwordModal.classList.contains('hidden')) {
            passwordInput.value = transcript;
            return;
        }

        // 通常の音声入力
        userInput.value = transcript;
        handleUserInput(transcript);
    };

    // 音声認識終了
    recognition.onend = () => {
        isRecording = false;
        micButton.classList.remove('recording');
    };

    // エラーハンドリング
    recognition.onerror = (event) => {
        console.error('音声認識エラー:', event.error);
        isRecording = false;
        micButton.classList.remove('recording');
    };
}

// ============================================
// イベントリスナーの設定
// ============================================
function setupEventListeners() {
    // テキスト入力
    userInput.addEventListener('input', () => {
        if (userInput.value.trim()) {
            sendButton.classList.remove('hidden');
        } else {
            sendButton.classList.add('hidden');
        }
    });

    // Enterキーで送信
    userInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            const text = userInput.value.trim();
            if (text) {
                handleUserInput(text);
                userInput.value = '';
                sendButton.classList.add('hidden');
            }
        }
    });

    // 送信ボタン
    sendButton.addEventListener('click', () => {
        const text = userInput.value.trim();
        if (text) {
            handleUserInput(text);
            userInput.value = '';
            sendButton.classList.add('hidden');
        }
    });

    // マイクボタン
    micButton.addEventListener('click', toggleRecording);

    // X連携ボタン
    xConnectButton.addEventListener('click', handleXConnect);

    // パスワードモーダル
    passwordSubmit.addEventListener('click', handlePasswordSubmit);
    passwordCancel.addEventListener('click', () => closeModal(passwordModal));

    // 送信先選択モーダル
    document.querySelectorAll('.btn-option').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const target = e.target.dataset.target;
            handleSendTargetSelection(target);
        });
    });
    sendCancel.addEventListener('click', () => {
        closeModal(sendTargetModal);
        sendFlow = { active: false, target: null, recipient: null, message: null };
    });

    // 宛名入力モーダル
    recipientSubmit.addEventListener('click', handleRecipientSubmit);
    recipientCancel.addEventListener('click', () => {
        closeModal(recipientModal);
        sendFlow = { active: false, target: null, recipient: null, message: null };
    });

    // メッセージ入力モーダル
    messageSubmit.addEventListener('click', handleMessageSubmit);
    messageCancel.addEventListener('click', () => {
        closeModal(messageModal);
        sendFlow = { active: false, target: null, recipient: null, message: null };
    });
}

// ============================================
// 音声録音のトグル
// ============================================
function toggleRecording() {
    if (!recognition) {
        alert('音声認識が利用できません');
        return;
    }

    if (isRecording) {
        recognition.stop();
        isRecording = false;
        micButton.classList.remove('recording');
    } else {
        recognition.start();
        isRecording = true;
        micButton.classList.add('recording');
    }
}

// ============================================
// ユーザー入力の処理
// ============================================
async function handleUserInput(text) {
    if (isProcessing) {
        console.log('⏳ 処理中のため待機してください');
        return;
    }

    console.log('📝 ユーザー入力:', text);

    // 特殊コマンドのチェック
    const command = detectCommand(text);

    if (command) {
        await handleCommand(command, text);
    } else {
        // 通常のAI応答
        await sendToAI(text);
    }
}

// ============================================
// コマンド検出
// ============================================
function detectCommand(text) {
    const lowerText = text.toLowerCase().trim();

    if (lowerText.includes('チェンジ') || lowerText === 'change') {
        return 'change';
    }
    if (lowerText.includes('キャストオフ') || lowerText === 'castoff') {
        return 'castoff';
    }
    if (lowerText.includes('覚えて')) {
        return 'remember';
    }
    if (lowerText.includes('覚えてる')) {
        return 'recall';
    }
    if (lowerText.includes('送って')) {
        return 'send';
    }
    if (lowerText.includes('ニュース') || lowerText.includes('news')) {
        return 'news';
    }

    return null;
}

// ============================================
// コマンド処理
// ============================================
async function handleCommand(command, text) {
    switch (command) {
        case 'change':
            await handleChangeCommand();
            break;
        case 'castoff':
            await handleCastoffCommand();
            break;
        case 'remember':
            await handleRememberCommand(text);
            break;
        case 'recall':
            await handleRecallCommand(text);
            break;
        case 'send':
            await handleSendCommand();
            break;
        case 'news':
            await handleNewsCommand();
            break;
    }
}

// ============================================
// チェンジコマンド（装甲モードへ切り替え）
// ============================================
async function handleChangeCommand() {
    if (currentMode === 'armor') {
        speak('すでに装甲モードです');
        return;
    }

    // 返信動画再生
    if (window.videoController) {
        await window.videoController.playChangeReply();

        // videoController内で既にモード変更と動画再生を行っているので
        // ここではUIの更新のみを行う
        currentMode = 'armor';
        modeText.textContent = '装甲モード';
        modeIndicator.classList.remove('normal-mode');
        modeIndicator.classList.add('armor-mode');
        console.log('✅ 装甲モードに切り替わりました（UI更新完了）');
        speak('装甲モードに切り替えました');
    } else {
        setMode('armor');
        speak('装甲モードに切り替えました');
    }
}

// ============================================
// キャストオフコマンド（通常モードへ切り替え）
// ============================================
async function handleCastoffCommand() {
    if (currentMode === 'normal') {
        speak('すでに通常モードです');
        return;
    }

    // パスワード入力モーダルを表示
    openModal(passwordModal);
}

// パスワード確認
function handlePasswordSubmit() {
    const password = passwordInput.value.trim();
    const correctPassword = '214200';

    if (password === correctPassword) {
        closeModal(passwordModal);
        passwordInput.value = '';

        // 返信動画再生
        if (window.videoController) {
            window.videoController.playCastoffReply().then(() => {
                // videoController内で既にモード変更と動画再生を行っているので
                // ここではUIの更新のみを行う
                currentMode = 'normal';
                modeText.textContent = '通常モード';
                modeIndicator.classList.remove('armor-mode');
                modeIndicator.classList.add('normal-mode');
                console.log('✅ 通常モードに切り替わりました（UI更新完了）');
                speak('通常モードに切り替えました');
            });
        } else {
            setMode('normal');
            speak('通常モードに切り替えました');
        }
    } else {
        speak('パスワードが違います');
        passwordInput.value = '';
    }
}

// ============================================
// 覚えてコマンド（MongoDB保存）
// ============================================
async function handleRememberCommand(text) {
    showStatus('記憶中...');

    try {
        const response = await fetch('/api/remember', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text })
        });

        const data = await response.json();

        if (data.success) {
            speak('覚えました');
        } else {
            speak('記憶できませんでした');
        }
    } catch (error) {
        console.error('記憶エラー:', error);
        speak('記憶できませんでした');
    } finally {
        hideStatus();
    }
}

// ============================================
// 覚えてる？コマンド（MongoDB検索）
// ============================================
async function handleRecallCommand(text) {
    showStatus('思い出し中...');

    try {
        const response = await fetch('/api/recall', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query: text })
        });

        const data = await response.json();

        if (data.success && data.result) {
            speak(data.result);
        } else {
            // MongoDBになければGeminiに聞く
            await sendToAI(text);
        }
    } catch (error) {
        console.error('思い出しエラー:', error);
        await sendToAI(text);
    } finally {
        hideStatus();
    }
}

// ============================================
// 送ってコマンド（LINE/Slack/X送信）
// ============================================
async function handleSendCommand() {
    sendFlow.active = true;
    openModal(sendTargetModal);
}

// 送信先選択
function handleSendTargetSelection(target) {
    sendFlow.target = target;
    closeModal(sendTargetModal);

    if (target === 'x') {
        // Xの場合は直接メッセージ入力
        openModal(messageModal);
    } else {
        // LINE/Slackの場合は宛名入力
        openModal(recipientModal);
    }
}

// 宛名入力完了
function handleRecipientSubmit() {
    const recipient = recipientInput.value.trim();

    if (!recipient) {
        alert('宛名を入力してください');
        return;
    }

    sendFlow.recipient = recipient;
    recipientInput.value = '';
    closeModal(recipientModal);
    openModal(messageModal);
}

// メッセージ送信
async function handleMessageSubmit() {
    const message = messageInput.value.trim();

    if (!message) {
        alert('メッセージを入力してください');
        return;
    }

    sendFlow.message = message;
    messageInput.value = '';
    closeModal(messageModal);

    showStatus('送信中...');

    try {
        const response = await fetch('/api/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(sendFlow)
        });

        const data = await response.json();

        if (data.success) {
            speak('送信しました');
        } else {
            speak('送信できませんでした');
        }
    } catch (error) {
        console.error('送信エラー:', error);
        speak('送信できませんでした');
    } finally {
        hideStatus();
        sendFlow = { active: false, target: null, recipient: null, message: null };
    }
}

// ============================================
// ニュースコマンド（最新ニュース取得）
// ============================================
async function handleNewsCommand() {
    showStatus('ニュース取得中...');

    // 話す動画再生開始
    if (window.videoController) {
        window.videoController.startSpeaking();
    }

    try {
        const response = await fetch('/api/news', {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        });

        const data = await response.json();

        if (data.success && data.message) {
            speak(data.message);
        } else {
            speak('ニュースを取得できませんでした');
        }
    } catch (error) {
        console.error('ニュース取得エラー:', error);
        speak('ニュースを取得できませんでした');
    } finally {
        hideStatus();

        // 話す動画終了
        if (window.videoController) {
            window.videoController.stopSpeaking();
        }
    }
}

// ============================================
// AI応答（Gemini）
// ============================================
async function sendToAI(text) {
    showStatus('考え中...');

    // 話す動画再生開始
    if (window.videoController) {
        window.videoController.startSpeaking();
    }

    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: text, mode: currentMode })
        });

        const data = await response.json();

        if (data.success && data.reply) {
            speak(data.reply);
        } else {
            speak('すみません、わかりませんでした');
        }
    } catch (error) {
        console.error('AI応答エラー:', error);
        speak('エラーが発生しました');
    } finally {
        hideStatus();

        // 話す動画終了
        if (window.videoController) {
            window.videoController.stopSpeaking();
        }
    }
}

// ============================================
// 音声出力
// ============================================
function speak(text) {
    console.log('🔊 音声出力:', text);

    // 既存の発話を停止
    speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ja-JP';
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    // 話し始め
    utterance.onstart = () => {
        if (window.videoController) {
            window.videoController.startSpeaking();
        }
    };

    // 話し終わり
    utterance.onend = () => {
        if (window.videoController) {
            window.videoController.stopSpeaking();
        }
    };

    speechSynthesis.speak(utterance);
}

// ============================================
// モード切り替え
// ============================================
function setMode(mode) {
    currentMode = mode;

    if (mode === 'armor') {
        modeText.textContent = '装甲モード';
        modeIndicator.classList.remove('normal-mode');
        modeIndicator.classList.add('armor-mode');
    } else {
        modeText.textContent = '通常モード';
        modeIndicator.classList.remove('armor-mode');
        modeIndicator.classList.add('normal-mode');
    }

    // 動画コントローラーにモード変更を通知
    if (window.videoController) {
        window.videoController.setMode(mode);
    }

    console.log('🔄 モード切り替え:', mode);
}

// ============================================
// ステータス表示
// ============================================
function showStatus(text) {
    statusText.textContent = text;
    statusIndicator.classList.remove('hidden');
    isProcessing = true;
}

function hideStatus() {
    statusIndicator.classList.add('hidden');
    isProcessing = false;
}

// ============================================
// モーダル操作
// ============================================
function openModal(modal) {
    modal.classList.remove('hidden');
}

function closeModal(modal) {
    modal.classList.add('hidden');
}

// ============================================
// X連携関連
// ============================================

/**
 * X連携状態を確認
 */
async function checkXConnectionStatus() {
    try {
        const response = await fetch('/api/x/status');
        const data = await response.json();

        if (data.connected) {
            // 連携済み
            xConnectButton.classList.add('connected');
            xConnectText.textContent = '連携済';
            console.log('✅ X アカウント連携済み');
        } else {
            // 未連携
            xConnectButton.classList.remove('connected');
            xConnectText.textContent = 'X連携';
            console.log('⚠️ X アカウント未連携');
        }
    } catch (error) {
        console.error('❌ X連携状態の確認エラー:', error);
    }
}

/**
 * X連携ボタンクリック処理
 */
function handleXConnect() {
    console.log('🔗 X連携開始');

    // 連携済みの場合は何もしない
    if (xConnectButton.classList.contains('connected')) {
        speak('すでにXアカウントと連携しています');
        return;
    }

    // OAuth認証画面にリダイレクト
    window.location.href = '/auth/x';
}

// ============================================
// エクスポート（グローバル）
// ============================================
window.app = {
    handleUserInput,
    speak,
    setMode,
    currentMode,
    checkXConnectionStatus
};
