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
