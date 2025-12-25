// ============================================
// P69REAL - AI秘書ロックマン
// メインサーバー
// ============================================

// ============================================
// 環境変数の読み込み（最初に実行）
// ============================================
require('dotenv').config();

// ============================================
// 必要なモジュールのインポート
// ============================================
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const session = require('express-session');
const path = require('path');
const crypto = require('crypto');

// ============================================
// カスタムモジュールのインポート
// ============================================
// 注意: これらのモジュールは後で作成します
let geminiClient, mongodbClient, lineClient, slackClient, xClient;
let ocrClient, newsScheduler, mcpClient;

try {
    geminiClient = require('./modules/geminiClient');
} catch (err) {
    console.warn('⚠️ geminiClient.js が見つかりません');
}

try {
    mongodbClient = require('./modules/mongodbClient');
} catch (err) {
    console.warn('⚠️ mongodbClient.js が見つかりません');
}

try {
    lineClient = require('./modules/lineClient');
} catch (err) {
    console.warn('⚠️ lineClient.js が見つかりません');
}

try {
    slackClient = require('./modules/slackClient');
} catch (err) {
    console.warn('⚠️ slackClient.js が見つかりません');
}

try {
    xClient = require('./modules/xClient');
} catch (err) {
    console.warn('⚠️ xClient.js が見つかりません');
}

try {
    ocrClient = require('./modules/ocrClient');
} catch (err) {
    console.warn('⚠️ ocrClient.js が見つかりません');
}

try {
    newsScheduler = require('./modules/newsScheduler');
} catch (err) {
    console.warn('⚠️ newsScheduler.js が見つかりません');
}

try {
    mcpClient = require('./modules/mcpClient');
} catch (err) {
    console.warn('⚠️ mcpClient.js が見つかりません');
}

// ============================================
// Express アプリケーションの作成
// ============================================
const app = express();
const PORT = process.env.PORT || 3000;

// ============================================
// ミドルウェアの設定
// ============================================

// CORS設定
const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',')
    : ['http://localhost:3000'];

app.use(cors({
    origin: allowedOrigins,
    credentials: true
}));

// ボディパーサー
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

// セッション管理
app.use(session({
    secret: process.env.SESSION_SECRET || 'your-secret-key-change-this',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60 * 1000 // 24時間
    }
}));

// 静的ファイルの配信（public フォルダ）
app.use(express.static(path.join(__dirname, '../public')));

// ログミドルウェア
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
});

// ============================================
// API エンドポイント
// ============================================

// --------------------------------------------
// ヘルスチェック
// --------------------------------------------
app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        message: 'P69REAL API is running',
        timestamp: new Date().toISOString()
    });
});

// --------------------------------------------
// 動画設定取得
// --------------------------------------------
app.get('/api/video-config', (req, res) => {
    try {
        const videoConfig = {
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

        res.json({
            success: true,
            config: videoConfig
        });
    } catch (error) {
        console.error('❌ 動画設定取得エラー:', error);
        res.status(500).json({
            success: false,
            error: '動画設定の取得に失敗しました'
        });
    }
});

// --------------------------------------------
// AI チャット（Gemini）
// --------------------------------------------
app.post('/api/chat', async (req, res) => {
    try {
        const { message, mode } = req.body;

        if (!message) {
            return res.status(400).json({
                success: false,
                error: 'メッセージが必要です'
            });
        }

        console.log('💬 チャットリクエスト:', { message, mode });

        // Geminiクライアントが利用可能かチェック
        if (!geminiClient) {
            return res.json({
                success: true,
                reply: 'Gemini APIが設定されていません。.envファイルを確認してください。'
            });
        }

        // Geminiに送信
        const reply = await geminiClient.chat(message, mode);

        res.json({
            success: true,
            reply: reply
        });

    } catch (error) {
        console.error('❌ チャットエラー:', error);
        res.status(500).json({
            success: false,
            error: 'AI応答でエラーが発生しました',
            details: error.message
        });
    }
});

// --------------------------------------------
// 記憶（MongoDB保存）
// --------------------------------------------
app.post('/api/remember', async (req, res) => {
    try {
        const { text } = req.body;

        if (!text) {
            return res.status(400).json({
                success: false,
                error: 'テキストが必要です'
            });
        }

        console.log('💾 記憶リクエスト:', text);

        // MongoDBクライアントが利用可能かチェック
        if (!mongodbClient) {
            return res.json({
                success: false,
                error: 'MongoDB が設定されていません'
            });
        }

        // MongoDBに保存
        await mongodbClient.remember(text);

        res.json({
            success: true,
            message: '記憶しました'
        });

    } catch (error) {
        console.error('❌ 記憶エラー:', error);
        res.status(500).json({
            success: false,
            error: '記憶に失敗しました',
            details: error.message
        });
    }
});

// --------------------------------------------
// 思い出す（MongoDB検索）
// --------------------------------------------
app.post('/api/recall', async (req, res) => {
    try {
        const { query } = req.body;

        if (!query) {
            return res.status(400).json({
                success: false,
                error: 'クエリが必要です'
            });
        }

        console.log('🔍 思い出しリクエスト:', query);

        // MongoDBクライアントが利用可能かチェック
        if (!mongodbClient) {
            return res.json({
                success: false,
                result: null
            });
        }

        // MongoDBから検索
        const result = await mongodbClient.recall(query);

        res.json({
            success: true,
            result: result
        });

    } catch (error) {
        console.error('❌ 思い出しエラー:', error);
        res.status(500).json({
            success: false,
            error: '思い出せませんでした',
            details: error.message
        });
    }
});

// --------------------------------------------
// メッセージ送信（LINE/Slack/X）
// --------------------------------------------
app.post('/api/send', async (req, res) => {
    try {
        const { target, recipient, message } = req.body;

        if (!target || !message) {
            return res.status(400).json({
                success: false,
                error: '送信先とメッセージが必要です'
            });
        }

        console.log('📮 送信リクエスト:', { target, recipient, message });

        let result;

        switch (target) {
            case 'line':
                if (!lineClient) {
                    return res.json({
                        success: false,
                        error: 'LINE API が設定されていません'
                    });
                }
                result = await lineClient.send(recipient, message);
                break;

            case 'slack':
                if (!slackClient) {
                    return res.json({
                        success: false,
                        error: 'Slack API が設定されていません'
                    });
                }
                result = await slackClient.send(recipient, message);
                break;

            case 'x':
                if (!xClient) {
                    return res.json({
                        success: false,
                        error: 'X API が設定されていません'
                    });
                }
                result = await xClient.post(message);
                break;

            default:
                return res.status(400).json({
                    success: false,
                    error: '不明な送信先です'
                });
        }

        res.json({
            success: true,
            message: '送信しました',
            result: result
        });

    } catch (error) {
        console.error('❌ 送信エラー:', error);
        res.status(500).json({
            success: false,
            error: '送信に失敗しました',
            details: error.message
        });
    }
});

// --------------------------------------------
// 最新ニュース取得
// --------------------------------------------
app.get('/api/news', async (req, res) => {
    try {
        console.log('📰 ニュース取得リクエスト');

        // ニューススケジューラーが利用可能かチェック
        if (!newsScheduler) {
            return res.json({
                success: false,
                error: 'ニュース機能が設定されていません'
            });
        }

        // 最新ニュースを取得
        const newsList = await newsScheduler.fetchLatestNews();

        if (!newsList || newsList.length === 0) {
            return res.json({
                success: true,
                message: '申し訳ありません。現在、最新のニュースを取得できませんでした。後でもう一度お試しください。',
                newsCount: 0
            });
        }

        // ニュースを整形してメッセージを作成
        let message = '最新のAIニュースをお伝えします。\n\n';

        newsList.forEach((news, index) => {
            message += `${index + 1}. ${news.source}: ${news.title}\n`;
            if (news.summary) {
                message += `   ${news.summary}\n`;
            }
            message += `\n`;
        });

        message += 'これらのニュースについて、詳しく知りたいことはありますか？';

        res.json({
            success: true,
            message: message,
            newsCount: newsList.length,
            news: newsList
        });

    } catch (error) {
        console.error('❌ ニュース取得エラー:', error);
        res.status(500).json({
            success: false,
            error: 'ニュース取得に失敗しました',
            details: error.message
        });
    }
});

// --------------------------------------------
// OCR（画像から文字認識）
// --------------------------------------------
app.post('/api/ocr', async (req, res) => {
    try {
        const { imageData } = req.body;

        if (!imageData) {
            return res.status(400).json({
                success: false,
                error: '画像データが必要です'
            });
        }

        console.log('📸 OCRリクエスト');

        // OCRクライアントが利用可能かチェック
        if (!ocrClient) {
            return res.json({
                success: false,
                error: 'OCR機能が設定されていません'
            });
        }

        // OCR実行
        const text = await ocrClient.recognize(imageData);

        res.json({
            success: true,
            text: text
        });

    } catch (error) {
        console.error('❌ OCRエラー:', error);
        res.status(500).json({
            success: false,
            error: 'OCRに失敗しました',
            details: error.message
        });
    }
});

// --------------------------------------------
// MCP（Chrome DevTools）
// --------------------------------------------
app.post('/api/mcp', async (req, res) => {
    try {
        const { command, params } = req.body;

        if (!command) {
            return res.status(400).json({
                success: false,
                error: 'コマンドが必要です'
            });
        }

        console.log('🌐 MCPリクエスト:', { command, params });

        // MCPクライアントが利用可能かチェック
        if (!mcpClient) {
            return res.json({
                success: false,
                error: 'MCP機能が設定されていません'
            });
        }

        // MCP実行
        const result = await mcpClient.execute(command, params);

        res.json({
            success: true,
            result: result
        });

    } catch (error) {
        console.error('❌ MCPエラー:', error);
        res.status(500).json({
            success: false,
            error: 'MCP実行に失敗しました',
            details: error.message
        });
    }
});

// --------------------------------------------
// X 連携状態確認
// --------------------------------------------
app.get('/api/x/status', (req, res) => {
    try {
        const connected = !!(req.session && req.session.xAccessToken);

        res.json({
            success: true,
            connected: connected,
            username: req.session?.xUsername || null
        });

    } catch (error) {
        console.error('❌ X連携状態確認エラー:', error);
        res.status(500).json({
            success: false,
            error: '連携状態の確認に失敗しました'
        });
    }
});

// --------------------------------------------
// X OAuth認証開始
// --------------------------------------------
app.get('/auth/x', async (req, res) => {
    try {
        const X_CLIENT_ID = process.env.X_CLIENT_ID;
        const X_CALLBACK_URL = process.env.X_CALLBACK_URL || 'http://localhost:3000/auth/x/callback';

        if (!X_CLIENT_ID) {
            return res.status(500).send(`
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <title>X連携エラー</title>
                </head>
                <body style="font-family: sans-serif; padding: 20px; background: #000; color: #fff;">
                    <h1>X API 設定エラー</h1>
                    <p>X_CLIENT_ID が設定されていません。</p>
                    <p>.env ファイルまたは Render の Environment Variables で設定してください。</p>
                    <a href="/" style="color: #1DA1F2;">アプリに戻る</a>
                </body>
                </html>
            `);
        }

        // PKCE用のcode_verifierとcode_challengeを生成
        const codeVerifier = crypto.randomBytes(32).toString('base64url');
        const codeChallenge = crypto
            .createHash('sha256')
            .update(codeVerifier)
            .digest('base64url');

        // セッションに保存
        req.session.codeVerifier = codeVerifier;

        // OAuth認証URLを構築
        const authUrl = new URL('https://twitter.com/i/oauth2/authorize');
        authUrl.searchParams.append('response_type', 'code');
        authUrl.searchParams.append('client_id', X_CLIENT_ID);
        authUrl.searchParams.append('redirect_uri', X_CALLBACK_URL);
        authUrl.searchParams.append('scope', 'tweet.read tweet.write users.read offline.access');
        authUrl.searchParams.append('state', crypto.randomBytes(16).toString('hex'));
        authUrl.searchParams.append('code_challenge', codeChallenge);
        authUrl.searchParams.append('code_challenge_method', 'S256');

        console.log('🔗 X OAuth認証開始:', authUrl.toString());

        // X認証ページにリダイレクト
        res.redirect(authUrl.toString());

    } catch (error) {
        console.error('❌ X OAuth認証開始エラー:', error);
        res.status(500).send(`
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>X連携エラー</title>
            </head>
            <body style="font-family: sans-serif; padding: 20px; background: #000; color: #fff;">
                <h1>認証エラー</h1>
                <p>X認証の開始に失敗しました。</p>
                <p>${error.message}</p>
                <a href="/" style="color: #1DA1F2;">アプリに戻る</a>
            </body>
            </html>
        `);
    }
});

// --------------------------------------------
// X OAuth認証コールバック
// --------------------------------------------
app.get('/auth/x/callback', async (req, res) => {
    try {
        const { code } = req.query;
        const codeVerifier = req.session.codeVerifier;

        if (!code || !codeVerifier) {
            throw new Error('認証コードまたはcode_verifierが見つかりません');
        }

        const X_CLIENT_ID = process.env.X_CLIENT_ID;
        const X_CLIENT_SECRET = process.env.X_CLIENT_SECRET;
        const X_CALLBACK_URL = process.env.X_CALLBACK_URL || 'http://localhost:3000/auth/x/callback';

        // アクセストークンを取得
        const tokenResponse = await fetch('https://api.twitter.com/2/oauth2/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': 'Basic ' + Buffer.from(`${X_CLIENT_ID}:${X_CLIENT_SECRET}`).toString('base64')
            },
            body: new URLSearchParams({
                code: code,
                grant_type: 'authorization_code',
                client_id: X_CLIENT_ID,
                redirect_uri: X_CALLBACK_URL,
                code_verifier: codeVerifier
            })
        });

        const tokenData = await tokenResponse.json();

        if (!tokenResponse.ok) {
            throw new Error(`トークン取得失敗: ${JSON.stringify(tokenData)}`);
        }

        // アクセストークンをセッションに保存
        req.session.xAccessToken = tokenData.access_token;
        req.session.xRefreshToken = tokenData.refresh_token;

        // ユーザー情報を取得
        const userResponse = await fetch('https://api.twitter.com/2/users/me', {
            headers: {
                'Authorization': `Bearer ${tokenData.access_token}`
            }
        });

        const userData = await userResponse.json();

        if (userResponse.ok && userData.data) {
            req.session.xUsername = userData.data.username;
        }

        console.log('✅ X OAuth認証成功:', userData.data?.username || 'Unknown');

        // アプリに戻る（自動的にリダイレクト）
        res.send(`
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>X連携完了</title>
                <style>
                    body {
                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                        background: #000;
                        color: #fff;
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        height: 100vh;
                        margin: 0;
                    }
                    .container {
                        text-align: center;
                    }
                    .checkmark {
                        width: 80px;
                        height: 80px;
                        border-radius: 50%;
                        display: block;
                        stroke-width: 2;
                        stroke: #1DA1F2;
                        stroke-miterlimit: 10;
                        margin: 0 auto 20px;
                        box-shadow: inset 0px 0px 0px #1DA1F2;
                        animation: fill .4s ease-in-out .4s forwards, scale .3s ease-in-out .9s both;
                    }
                    .checkmark__circle {
                        stroke-dasharray: 166;
                        stroke-dashoffset: 166;
                        stroke-width: 2;
                        stroke-miterlimit: 10;
                        stroke: #1DA1F2;
                        fill: none;
                        animation: stroke 0.6s cubic-bezier(0.65, 0, 0.45, 1) forwards;
                    }
                    .checkmark__check {
                        transform-origin: 50% 50%;
                        stroke-dasharray: 48;
                        stroke-dashoffset: 48;
                        animation: stroke 0.3s cubic-bezier(0.65, 0, 0.45, 1) 0.8s forwards;
                    }
                    @keyframes stroke {
                        100% {
                            stroke-dashoffset: 0;
                        }
                    }
                    @keyframes scale {
                        0%, 100% {
                            transform: none;
                        }
                        50% {
                            transform: scale3d(1.1, 1.1, 1);
                        }
                    }
                    @keyframes fill {
                        100% {
                            box-shadow: inset 0px 0px 0px 30px #1DA1F2;
                        }
                    }
                    h1 {
                        font-size: 24px;
                        margin-bottom: 10px;
                    }
                    p {
                        color: #888;
                        font-size: 14px;
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <svg class="checkmark" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
                        <circle class="checkmark__circle" cx="26" cy="26" r="25" fill="none"/>
                        <path class="checkmark__check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8"/>
                    </svg>
                    <h1>X連携完了</h1>
                    <p>自動的にアプリに戻ります...</p>
                </div>
                <script>
                    // 2秒後に自動的にアプリに戻る
                    setTimeout(() => {
                        window.location.href = '/';
                    }, 2000);
                </script>
            </body>
            </html>
        `);

    } catch (error) {
        console.error('❌ X OAuth認証コールバックエラー:', error);
        res.status(500).send(`
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>X連携エラー</title>
            </head>
            <body style="font-family: sans-serif; padding: 20px; background: #000; color: #fff;">
                <h1>認証失敗</h1>
                <p>X認証に失敗しました。</p>
                <p>${error.message}</p>
                <a href="/" style="color: #1DA1F2;">アプリに戻る</a>
            </body>
            </html>
        `);
    }
});

// ============================================
// ルートパス
// ============================================
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

// ============================================
// 404 エラーハンドリング
// ============================================
app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: 'エンドポイントが見つかりません'
    });
});

// ============================================
// エラーハンドリング
// ============================================
app.use((err, req, res, next) => {
    console.error('❌ サーバーエラー:', err);
    res.status(500).json({
        success: false,
        error: 'サーバーエラーが発生しました',
        details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// ============================================
// サーバー起動
// ============================================
app.listen(PORT, () => {
    console.log('============================================');
    console.log('🚀 P69REAL - AI秘書ロックマン');
    console.log('============================================');
    console.log(`📡 サーバー起動: http://localhost:${PORT}`);
    console.log(`🌍 環境: ${process.env.NODE_ENV || 'development'}`);
    console.log('============================================');

    // ニュース配信スケジューラーの起動
    if (newsScheduler) {
        newsScheduler.start();
        console.log('📰 ニュース配信スケジューラー起動');
    }

    console.log('✅ すべてのサービスが起動しました');
    console.log('============================================');
});

// ============================================
// グレースフルシャットダウン
// ============================================
process.on('SIGTERM', async () => {
    console.log('⏹️ シャットダウン開始...');

    // MongoDB接続クローズ
    if (mongodbClient && mongodbClient.close) {
        await mongodbClient.close();
    }

    // ニュース配信スケジューラー停止
    if (newsScheduler && newsScheduler.stop) {
        newsScheduler.stop();
    }

    console.log('✅ シャットダウン完了');
    process.exit(0);
});
