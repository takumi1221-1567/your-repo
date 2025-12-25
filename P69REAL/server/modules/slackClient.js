// ============================================
// P69REAL - AI秘書ロックマン
// Slack API クライアント
// ============================================

const { WebClient } = require('@slack/web-api');

// ============================================
// 設定
// ============================================
const SLACK_BOT_TOKEN = process.env.SLACK_BOT_TOKEN;

// ============================================
// Slack クライアント初期化
// ============================================
let client = null;

if (SLACK_BOT_TOKEN) {
    client = new WebClient(SLACK_BOT_TOKEN);
    console.log('✅ Slack API クライアント初期化完了');
} else {
    console.warn('⚠️ SLACK_BOT_TOKEN が設定されていません');
}

// ============================================
// メイン機能：メッセージ送信
// ============================================
/**
 * Slack にメッセージを送信
 * @param {string} recipient - チャンネル名またはユーザー名（例: #general, @username）
 * @param {string} message - 送信するメッセージ
 * @returns {Promise<object>} 送信結果
 */
async function send(recipient, message) {
    try {
        if (!client) {
            throw new Error('Slack API が初期化されていません');
        }

        console.log(`📮 Slack 送信: "${message}" -> ${recipient}`);

        // チャンネルIDを取得（名前から）
        const channelId = await getChannelId(recipient);

        if (!channelId) {
            throw new Error(`チャンネル/ユーザーが見つかりません: ${recipient}`);
        }

        // メッセージ送信
        const result = await client.chat.postMessage({
            channel: channelId,
            text: message
        });

        console.log('✅ Slack 送信成功');

        return {
            success: true,
            message: 'Slackに送信しました',
            result: result
        };

    } catch (error) {
        console.error('❌ Slack 送信エラー:', error);
        throw error;
    }
}

// ============================================
// 補助機能：チャンネルID取得
// ============================================
/**
 * チャンネル名またはユーザー名からIDを取得
 * @param {string} name - チャンネル名（#general）またはユーザー名（@username）
 * @returns {Promise<string|null>} チャンネルID
 */
async function getChannelId(name) {
    try {
        if (!client) {
            throw new Error('Slack API が初期化されていません');
        }

        // # で始まる場合はチャンネル
        if (name.startsWith('#')) {
            const channelName = name.slice(1); // # を削除
            const result = await client.conversations.list();
            const channel = result.channels.find(ch => ch.name === channelName);
            return channel ? channel.id : null;
        }

        // @ で始まる場合はユーザー
        if (name.startsWith('@')) {
            const username = name.slice(1); // @ を削除
            const result = await client.users.list();
            const user = result.members.find(u => u.name === username || u.real_name === username);
            return user ? user.id : null;
        }

        // それ以外はそのまま返す（既にIDの場合）
        return name;

    } catch (error) {
        console.error('❌ チャンネルID取得エラー:', error);
        return null;
    }
}

// ============================================
// 補助機能：リッチメッセージ送信
// ============================================
/**
 * ブロックを使ったリッチメッセージを送信
 * @param {string} channel - チャンネルID
 * @param {string} text - メインテキスト
 * @param {Array} blocks - ブロック配列（Slack Block Kit）
 * @returns {Promise<object>} 送信結果
 */
async function sendRichMessage(channel, text, blocks) {
    try {
        if (!client) {
            throw new Error('Slack API が初期化されていません');
        }

        const result = await client.chat.postMessage({
            channel: channel,
            text: text,
            blocks: blocks
        });

        console.log('✅ Slack リッチメッセージ送信成功');

        return {
            success: true,
            message: 'リッチメッセージを送信しました',
            result: result
        };

    } catch (error) {
        console.error('❌ Slack リッチメッセージ送信エラー:', error);
        throw error;
    }
}

// ============================================
// 補助機能：ファイルアップロード
// ============================================
/**
 * Slack にファイルをアップロード
 * @param {string} channel - チャンネルID
 * @param {string} filePath - ファイルパス
 * @param {string} comment - コメント
 * @returns {Promise<object>} アップロード結果
 */
async function uploadFile(channel, filePath, comment = '') {
    try {
        if (!client) {
            throw new Error('Slack API が初期化されていません');
        }

        const fs = require('fs');

        const result = await client.files.upload({
            channels: channel,
            file: fs.createReadStream(filePath),
            initial_comment: comment
        });

        console.log('✅ Slack ファイルアップロード成功');

        return {
            success: true,
            message: 'ファイルをアップロードしました',
            result: result
        };

    } catch (error) {
        console.error('❌ Slack ファイルアップロードエラー:', error);
        throw error;
    }
}

// ============================================
// 補助機能：チャンネル一覧取得
// ============================================
/**
 * チャンネル一覧を取得
 * @returns {Promise<Array>} チャンネルリスト
 */
async function listChannels() {
    try {
        if (!client) {
            throw new Error('Slack API が初期化されていません');
        }

        const result = await client.conversations.list();

        const channels = result.channels.map(ch => ({
            id: ch.id,
            name: ch.name,
            isMember: ch.is_member
        }));

        console.log(`✅ ${channels.length} 件のチャンネルを取得しました`);

        return channels;

    } catch (error) {
        console.error('❌ チャンネル一覧取得エラー:', error);
        throw error;
    }
}

// ============================================
// 補助機能：ユーザー一覧取得
// ============================================
/**
 * ユーザー一覧を取得
 * @returns {Promise<Array>} ユーザーリスト
 */
async function listUsers() {
    try {
        if (!client) {
            throw new Error('Slack API が初期化されていません');
        }

        const result = await client.users.list();

        const users = result.members
            .filter(u => !u.is_bot && !u.deleted)
            .map(u => ({
                id: u.id,
                name: u.name,
                realName: u.real_name
            }));

        console.log(`✅ ${users.length} 件のユーザーを取得しました`);

        return users;

    } catch (error) {
        console.error('❌ ユーザー一覧取得エラー:', error);
        throw error;
    }
}

// ============================================
// エクスポート
// ============================================
module.exports = {
    send,
    sendRichMessage,
    uploadFile,
    listChannels,
    listUsers,
    getChannelId
};
