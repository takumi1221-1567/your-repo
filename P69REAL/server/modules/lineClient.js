// ============================================
// P69REAL - AI秘書ロックマン
// LINE Messaging API クライアント
// ============================================

const line = require('@line/bot-sdk');

// ============================================
// 設定
// ============================================
const config = {
    channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN || '',
    channelSecret: process.env.LINE_CHANNEL_SECRET || ''
};

// ============================================
// LINE クライアント初期化
// ============================================
let client = null;

if (config.channelAccessToken && config.channelSecret) {
    client = new line.Client(config);
    console.log('✅ LINE API クライアント初期化完了');
} else {
    console.warn('⚠️ LINE API の設定が不足しています');
}

// ============================================
// メイン機能：メッセージ送信
// ============================================
/**
 * LINE にメッセージを送信
 * @param {string} recipient - 送信先（ユーザーID または グループID）
 * @param {string} message - 送信するメッセージ
 * @returns {Promise<object>} 送信結果
 */
async function send(recipient, message) {
    try {
        if (!client) {
            throw new Error('LINE API が初期化されていません');
        }

        console.log(`📮 LINE 送信: "${message}" -> ${recipient}`);

        // メッセージオブジェクトの作成
        const messageObj = {
            type: 'text',
            text: message
        };

        // メッセージ送信
        const result = await client.pushMessage(recipient, messageObj);

        console.log('✅ LINE 送信成功');

        return {
            success: true,
            message: 'LINEに送信しました',
            result: result
        };

    } catch (error) {
        console.error('❌ LINE 送信エラー:', error);
        throw error;
    }
}

// ============================================
// 補助機能：複数メッセージ送信
// ============================================
/**
 * 複数のメッセージを送信
 * @param {string} recipient - 送信先
 * @param {Array<string>} messages - メッセージの配列
 * @returns {Promise<object>} 送信結果
 */
async function sendMultiple(recipient, messages) {
    try {
        if (!client) {
            throw new Error('LINE API が初期化されていません');
        }

        const messageObjects = messages.map(msg => ({
            type: 'text',
            text: msg
        }));

        const result = await client.pushMessage(recipient, messageObjects);

        console.log(`✅ LINE 複数メッセージ送信成功 (${messages.length}件)`);

        return {
            success: true,
            message: `${messages.length}件のメッセージを送信しました`,
            result: result
        };

    } catch (error) {
        console.error('❌ LINE 複数送信エラー:', error);
        throw error;
    }
}

// ============================================
// 補助機能：リプライメッセージ送信
// ============================================
/**
 * リプライトークンを使ってメッセージを返信
 * @param {string} replyToken - リプライトークン
 * @param {string} message - 返信するメッセージ
 * @returns {Promise<object>} 送信結果
 */
async function reply(replyToken, message) {
    try {
        if (!client) {
            throw new Error('LINE API が初期化されていません');
        }

        const messageObj = {
            type: 'text',
            text: message
        };

        const result = await client.replyMessage(replyToken, messageObj);

        console.log('✅ LINE リプライ送信成功');

        return {
            success: true,
            message: 'リプライしました',
            result: result
        };

    } catch (error) {
        console.error('❌ LINE リプライエラー:', error);
        throw error;
    }
}

// ============================================
// 補助機能：ユーザープロフィール取得
// ============================================
/**
 * ユーザーのプロフィール情報を取得
 * @param {string} userId - ユーザーID
 * @returns {Promise<object>} プロフィール情報
 */
async function getProfile(userId) {
    try {
        if (!client) {
            throw new Error('LINE API が初期化されていません');
        }

        const profile = await client.getProfile(userId);

        console.log(`✅ プロフィール取得成功: ${profile.displayName}`);

        return {
            success: true,
            profile: {
                userId: profile.userId,
                displayName: profile.displayName,
                pictureUrl: profile.pictureUrl,
                statusMessage: profile.statusMessage
            }
        };

    } catch (error) {
        console.error('❌ プロフィール取得エラー:', error);
        throw error;
    }
}

// ============================================
// 補助機能：Webhookイベントハンドラー
// ============================================
/**
 * Webhook イベントを処理
 * @param {object} event - LINEから受け取ったイベント
 * @returns {Promise<void>}
 */
async function handleEvent(event) {
    try {
        // メッセージイベントの場合
        if (event.type === 'message' && event.message.type === 'text') {
            const userMessage = event.message.text;
            console.log(`📩 受信メッセージ: "${userMessage}"`);

            // ここでAIに問い合わせなどの処理を追加可能
            // 例: const reply = await geminiClient.chat(userMessage);

            // エコーバック（例）
            await reply(event.replyToken, `受け取りました: ${userMessage}`);
        }

    } catch (error) {
        console.error('❌ イベント処理エラー:', error);
    }
}

// ============================================
// エクスポート
// ============================================
module.exports = {
    send,
    sendMultiple,
    reply,
    getProfile,
    handleEvent,
    config
};
