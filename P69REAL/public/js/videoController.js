// ============================================
// P69REAL - AI秘書ロックマン
// 動画再生コントローラー
// ============================================

// ============================================
// 動画コントローラークラス
// ============================================
class VideoController {
    constructor() {
        // DOM要素（2つのvideo要素）
        this.video1 = document.getElementById('character-video-1');
        this.video2 = document.getElementById('character-video-2');
        this.loadingElement = document.getElementById('video-loading');

        // アクティブな動画（現在表示中）
        this.activeVideo = this.video1;
        this.inactiveVideo = this.video2;

        // 現在の状態
        this.currentMode = 'armor'; // 'armor' or 'normal'
        this.currentState = 'idle'; // 'idle', 'speaking', 'action'
        this.isSpeaking = false;
        this.currentVideoPath = ''; // 現在再生中の動画パス

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
        // 動画1のイベント
        this.video1.addEventListener('loadeddata', () => {
            this.hideLoading();
            console.log('✅ 動画1 読み込み完了');
        });

        this.video1.addEventListener('ended', () => {
            if (this.video1 === this.activeVideo) {
                this.handleVideoEnded();
            }
        });

        this.video1.addEventListener('error', (e) => {
            console.error('❌ 動画1 読み込みエラー:', e);
            this.hideLoading();
        });

        // 動画2のイベント
        this.video2.addEventListener('loadeddata', () => {
            this.hideLoading();
            console.log('✅ 動画2 読み込み完了');
        });

        this.video2.addEventListener('ended', () => {
            if (this.video2 === this.activeVideo) {
                this.handleVideoEnded();
            }
        });

        this.video2.addEventListener('error', (e) => {
            console.error('❌ 動画2 読み込みエラー:', e);
            this.hideLoading();
        });

        // ユーザー操作（タップ、入力）で待機タイマーリセット
        document.addEventListener('click', () => this.resetIdleTimer());
        document.addEventListener('keydown', () => this.resetIdleTimer());
    }

    // ============================================
    // 動画読み込み（初回のみ）
    // ============================================
    async loadVideo(videoPath, autoplay = true, loop = true) {
        return new Promise((resolve, reject) => {
            // ローディング表示
            this.showLoading();

            // アクティブな動画に設定
            this.activeVideo.src = videoPath;
            this.activeVideo.loop = loop;
            this.activeVideo.load();
            this.currentVideoPath = videoPath;

            // 読み込み完了時
            this.activeVideo.onloadeddata = () => {
                if (autoplay) {
                    this.activeVideo.play().catch(err => {
                        console.error('自動再生エラー:', err);
                    });
                }
                this.hideLoading();
                resolve();
            };

            // エラー時
            this.activeVideo.onerror = (error) => {
                console.error('動画読み込みエラー:', error);
                this.hideLoading();
                reject(error);
            };
        });
    }

    // ============================================
    // スムーズな動画切り替え（暗転なし・2つの動画を重ねて切り替え）
    // ============================================
    async switchVideo(videoPath, loop = true) {
        // 同じ動画の場合は何もしない
        if (this.currentVideoPath === videoPath) {
            console.log('🎬 同じ動画なのでスキップ:', videoPath);
            this.activeVideo.loop = loop;
            return Promise.resolve();
        }

        console.log('🎬 動画切り替え開始:', videoPath);

        return new Promise((resolve) => {
            // 非アクティブな動画（背面）に次の動画を設定
            this.inactiveVideo.src = videoPath;
            this.inactiveVideo.loop = loop;
            this.inactiveVideo.currentTime = 0;
            this.inactiveVideo.load();

            // 動画が再生可能になったら
            this.inactiveVideo.oncanplay = async () => {
                try {
                    // 背面で動画再生を開始
                    await this.inactiveVideo.play();

                    // 少し待ってから切り替え（動画が実際に再生開始するまで）
                    setTimeout(() => {
                        // アクティブ/非アクティブを入れ替え
                        this.activeVideo.classList.remove('active');
                        this.inactiveVideo.classList.add('active');

                        // 参照を入れ替え
                        const temp = this.activeVideo;
                        this.activeVideo = this.inactiveVideo;
                        this.inactiveVideo = temp;

                        // 古い動画を停止
                        this.inactiveVideo.pause();

                        // 現在のパスを更新
                        this.currentVideoPath = videoPath;

                        console.log('✅ 動画切り替え完了:', videoPath);
                        resolve();
                    }, 50); // 50ms待機

                } catch (err) {
                    console.error('❌ 動画再生エラー:', err);
                    resolve();
                }
            };

            // タイムアウト処理（5秒）
            setTimeout(() => {
                console.warn('⚠️ 動画読み込みタイムアウト');
                resolve();
            }, 5000);
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

        // 動画終了後に装甲モードの待機動画へ
        return new Promise(async (resolve) => {
            // 先に動画切り替えを完了させる
            await this.switchVideo(videoPath, false);

            // 切り替え完了後のactiveVideoにイベントリスナーを追加
            const handleEnd = async () => {
                this.activeVideo.removeEventListener('ended', handleEnd);
                this.currentMode = 'armor';
                await this.playIdleVideo();
                resolve();
            };
            this.activeVideo.addEventListener('ended', handleEnd);
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

        // 動画終了後に通常モードの待機動画へ
        return new Promise(async (resolve) => {
            // 先に動画切り替えを完了させる
            await this.switchVideo(videoPath, false);

            // 切り替え完了後のactiveVideoにイベントリスナーを追加
            const handleEnd = async () => {
                this.activeVideo.removeEventListener('ended', handleEnd);
                this.currentMode = 'normal';
                await this.playIdleVideo();
                resolve();
            };
            this.activeVideo.addEventListener('ended', handleEnd);
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
