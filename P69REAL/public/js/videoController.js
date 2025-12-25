// ============================================
// P69REAL - AI秘書ロックマン
// 動画再生コントローラー
// ============================================

// ============================================
// 動画コントローラークラス
// ============================================
class VideoController {
    constructor() {
        // DOM要素
        this.videoElement = document.getElementById('character-video');
        this.loadingElement = document.getElementById('video-loading');

        // 現在の状態
        this.currentMode = 'armor'; // 'armor' or 'normal'
        this.currentState = 'idle'; // 'idle', 'speaking', 'action'
        this.isSpeaking = false;

        // タイマー
        this.idleTimer = null;
        this.idleTimeout = 3000; // 3秒

        // 動画パス（videoConfig.jsから取得）
        this.videoPaths = {
            normal: {
                idle: '/videos/normal/通常.mp4',
                speaking: '/videos/normal/喋り.mp4',
                idleAction1: '/videos/normal/腕組み.mp4',
                idleAction2: '/videos/normal/キョロ.mp4',
                changeReply: '/videos/normal/チェンジ.mp4'
            },
            armor: {
                idle: '/videos/armor/装甲通常.mp4',
                speaking: '/videos/armor/装甲通常.mp4',
                idleAction1: '/videos/armor/装甲腕組み.mp4',
                idleAction2: '/videos/armor/装甲キョロ.mp4',
                castoffReply: '/videos/armor/キャストオフ.mp4'
            }
        };

        // 初期化
        this.init();
    }

    // ============================================
    // 初期化
    // ============================================
    async init() {
        console.log('🎬 VideoController 初期化中...');

        // イベントリスナー設定
        this.setupEventListeners();

        // 初期動画読み込み
        await this.loadVideo(this.videoPaths.armor.idle, true);

        // 待機タイマー開始
        this.startIdleTimer();

        console.log('✅ VideoController 初期化完了');
    }

    // ============================================
    // イベントリスナー設定
    // ============================================
    setupEventListeners() {
        // 動画読み込み完了
        this.videoElement.addEventListener('loadeddata', () => {
            this.hideLoading();
            console.log('✅ 動画読み込み完了');
        });

        // 動画再生終了
        this.videoElement.addEventListener('ended', () => {
            this.handleVideoEnded();
        });

        // 動画再生エラー
        this.videoElement.addEventListener('error', (e) => {
            console.error('❌ 動画読み込みエラー:', e);
            this.hideLoading();
        });

        // ユーザー操作（タップ、入力）で待機タイマーリセット
        document.addEventListener('click', () => this.resetIdleTimer());
        document.addEventListener('keydown', () => this.resetIdleTimer());
    }

    // ============================================
    // 動画読み込み
    // ============================================
    async loadVideo(videoPath, autoplay = true) {
        return new Promise((resolve, reject) => {
            // ローディング表示
            this.showLoading();

            // 動画ソース設定
            this.videoElement.src = videoPath;
            this.videoElement.load();

            // 読み込み完了時
            this.videoElement.onloadeddata = () => {
                if (autoplay) {
                    this.videoElement.play().catch(err => {
                        console.error('自動再生エラー:', err);
                    });
                }
                this.hideLoading();
                resolve();
            };

            // エラー時
            this.videoElement.onerror = (error) => {
                console.error('動画読み込みエラー:', error);
                this.hideLoading();
                reject(error);
            };
        });
    }

    // ============================================
    // スムーズな動画切り替え（暗転なし）
    // ============================================
    async switchVideo(videoPath, loop = true) {
        // 新しい動画を事前読み込み
        const tempVideo = document.createElement('video');
        tempVideo.src = videoPath;
        tempVideo.preload = 'auto';
        tempVideo.loop = loop;
        tempVideo.muted = true;
        tempVideo.playsInline = true;

        return new Promise((resolve) => {
            tempVideo.onloadeddata = async () => {
                // 現在の動画を一時停止
                this.videoElement.pause();

                // ソースを切り替え
                this.videoElement.src = videoPath;
                this.videoElement.loop = loop;
                this.videoElement.load();

                // 即座に再生
                try {
                    await this.videoElement.play();
                    console.log('🎬 動画切り替え:', videoPath);
                    resolve();
                } catch (err) {
                    console.error('再生エラー:', err);
                    resolve();
                }
            };
        });
    }

    // ============================================
    // 動画再生終了時の処理
    // ============================================
    handleVideoEnded() {
        console.log('🎬 動画再生終了');

        // 話す動画が終わったら待機動画に戻る
        if (this.currentState === 'speaking') {
            this.stopSpeaking();
        }
        // アクション動画が終わったら待機動画に戻る
        else if (this.currentState === 'action') {
            this.playIdleVideo();
        }
    }

    // ============================================
    // モード切り替え
    // ============================================
    setMode(mode) {
        console.log('🔄 モード切り替え:', mode);
        this.currentMode = mode;
        this.playIdleVideo();
    }

    // ============================================
    // 待機動画再生
    // ============================================
    async playIdleVideo() {
        this.currentState = 'idle';
        const videoPath = this.videoPaths[this.currentMode].idle;
        await this.switchVideo(videoPath, true);
        this.resetIdleTimer();
    }

    // ============================================
    // 話す動画再生
    // ============================================
    async startSpeaking() {
        if (this.isSpeaking) return;

        console.log('🗣️ 話す動画開始');
        this.isSpeaking = true;
        this.currentState = 'speaking';
        this.stopIdleTimer();

        const videoPath = this.videoPaths[this.currentMode].speaking;
        await this.switchVideo(videoPath, true);
    }

    // ============================================
    // 話す動画停止
    // ============================================
    async stopSpeaking() {
        if (!this.isSpeaking) return;

        console.log('🗣️ 話す動画終了');
        this.isSpeaking = false;
        await this.playIdleVideo();
    }

    // ============================================
    // ランダム待機アクション動画再生
    // ============================================
    async playRandomIdleAction() {
        // 話している時はスキップ
        if (this.isSpeaking) {
            this.resetIdleTimer();
            return;
        }

        console.log('🎭 待機アクション動画再生');
        this.currentState = 'action';

        // ランダムに動画選択
        const random = Math.random();
        const actionType = random < 0.5 ? 'idleAction1' : 'idleAction2';
        const videoPath = this.videoPaths[this.currentMode][actionType];

        await this.switchVideo(videoPath, false); // ループなし
    }

    // ============================================
    // 「チェンジ」返信動画再生
    // ============================================
    async playChangeReply() {
        console.log('🎬 チェンジ返信動画再生');
        this.currentState = 'action';
        this.stopIdleTimer();

        const videoPath = this.videoPaths.normal.changeReply;
        await this.switchVideo(videoPath, false);

        // 動画終了後に装甲モードの待機動画へ
        return new Promise((resolve) => {
            const handleEnd = async () => {
                this.videoElement.removeEventListener('ended', handleEnd);
                this.currentMode = 'armor';
                await this.playIdleVideo();
                resolve();
            };
            this.videoElement.addEventListener('ended', handleEnd);
        });
    }

    // ============================================
    // 「キャストオフ」返信動画再生
    // ============================================
    async playCastoffReply() {
        console.log('🎬 キャストオフ返信動画再生');
        this.currentState = 'action';
        this.stopIdleTimer();

        const videoPath = this.videoPaths.armor.castoffReply;
        await this.switchVideo(videoPath, false);

        // 動画終了後に通常モードの待機動画へ
        return new Promise((resolve) => {
            const handleEnd = async () => {
                this.videoElement.removeEventListener('ended', handleEnd);
                this.currentMode = 'normal';
                await this.playIdleVideo();
                resolve();
            };
            this.videoElement.addEventListener('ended', handleEnd);
        });
    }

    // ============================================
    // 待機タイマー管理
    // ============================================
    startIdleTimer() {
        this.stopIdleTimer();
        this.idleTimer = setTimeout(() => {
            this.playRandomIdleAction();
        }, this.idleTimeout);
    }

    stopIdleTimer() {
        if (this.idleTimer) {
            clearTimeout(this.idleTimer);
            this.idleTimer = null;
        }
    }

    resetIdleTimer() {
        this.startIdleTimer();
    }

    // ============================================
    // ローディング表示/非表示
    // ============================================
    showLoading() {
        if (this.loadingElement) {
            this.loadingElement.classList.remove('hidden');
        }
    }

    hideLoading() {
        if (this.loadingElement) {
            this.loadingElement.classList.add('hidden');
        }
    }
}

// ============================================
// 初期化
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    window.videoController = new VideoController();
});

// ============================================
// エクスポート
// ============================================
window.VideoController = VideoController;
