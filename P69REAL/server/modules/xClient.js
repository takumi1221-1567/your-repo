// ============================================
// P69REAL - AI秘書ロックマン
// X (Twitter) API クライアント
// ============================================

const { TwitterApi } = require('twitter-api-v2');

// ============================================
// 設定
// ============================================
const X_CONFIG = {
    appKey: process.env.X_API_KEY || '',
    appSecret: process.env.X_API_SECRET || '',
    accessToken: process.env.X_ACCESS_TOKEN || '',
    accessSecret: process.env.X_ACCESS_SECRET || ''
};

// ============================================
// X クライアント初期化
// ============================================
let client = null;

if (X_CONFIG.appKey && X_CONFIG.appSecret && X_CONFIG.accessToken && X_CONFIG.accessSecret) {
    client = new TwitterApi({
        appKey: X_CONFIG.appKey,
        appSecret: X_CONFIG.appSecret,
        accessToken: X_CONFIG.accessToken,
        accessSecret: X_CONFIG.accessSecret
    });
    console.log('✅ X (Twitter) API クライアント初期化完了');
} else {
    console.warn('⚠️ X API の設定が不足しています');
}

// ============================================
// メイン機能：ツイート投稿
// ============================================
/**
 * ツイートを投稿
 * @param {string} text - ツイート本文（最大280文字）
 * @returns {Promise<object>} 投稿結果
 */
async function post(text) {
    try {
        if (!client) {
            throw new Error('X API が初期化されていません');
        }

        console.log(`📮 X 投稿: "${text}"`);

        // 文字数チェック
        if (text.length > 280) {
            throw new Error('ツイートは280文字以内にしてください');
        }

        // ツイート投稿
        const result = await client.v2.tweet(text);

        console.log('✅ X 投稿成功');

        return {
            success: true,
            message: 'Xに投稿しました',
            tweetId: result.data.id,
            text: result.data.text
        };

    } catch (error) {
        console.error('❌ X 投稿エラー:', error);
        throw error;
    }
}

// ============================================
// 補助機能：リプライ投稿
// ============================================
/**
 * 特定のツイートにリプライ
 * @param {string} tweetId - リプライ先のツイートID
 * @param {string} text - リプライ本文
 * @returns {Promise<object>} 投稿結果
 */
async function reply(tweetId, text) {
    try {
        if (!client) {
            throw new Error('X API が初期化されていません');
        }

        console.log(`💬 X リプライ: "${text}" -> ${tweetId}`);

        const result = await client.v2.reply(text, tweetId);

        console.log('✅ X リプライ成功');

        return {
            success: true,
            message: 'リプライしました',
            tweetId: result.data.id
        };

    } catch (error) {
        console.error('❌ X リプライエラー:', error);
        throw error;
    }
}

// ============================================
// 補助機能：ツイート削除
// ============================================
/**
 * 自分のツイートを削除
 * @param {string} tweetId - 削除するツイートID
 * @returns {Promise<object>} 削除結果
 */
async function deleteTweet(tweetId) {
    try {
        if (!client) {
            throw new Error('X API が初期化されていません');
        }

        console.log(`🗑️ X ツイート削除: ${tweetId}`);

        await client.v2.deleteTweet(tweetId);

        console.log('✅ X ツイート削除成功');

        return {
            success: true,
            message: 'ツイートを削除しました'
        };

    } catch (error) {
        console.error('❌ X ツイート削除エラー:', error);
        throw error;
    }
}

// ============================================
// 補助機能：自分のツイート取得
// ============================================
/**
 * 自分の最新ツイートを取得
 * @param {number} maxResults - 取得件数（デフォルト: 10）
 * @returns {Promise<Array>} ツイート一覧
 */
async function getMyTweets(maxResults = 10) {
    try {
        if (!client) {
            throw new Error('X API が初期化されていません');
        }

        // 自分のユーザーIDを取得
        const me = await client.v2.me();
        const userId = me.data.id;

        // ツイート取得
        const tweets = await client.v2.userTimeline(userId, {
            max_results: maxResults
        });

        console.log(`✅ ${tweets.data.data.length} 件のツイートを取得しました`);

        return tweets.data.data;

    } catch (error) {
        console.error('❌ ツイート取得エラー:', error);
        throw error;
    }
}

// ============================================
// 補助機能：ツイート検索
// ============================================
/**
 * キーワードでツイートを検索
 * @param {string} query - 検索クエリ
 * @param {number} maxResults - 取得件数（デフォルト: 10）
 * @returns {Promise<Array>} 検索結果
 */
async function searchTweets(query, maxResults = 10) {
    try {
        if (!client) {
            throw new Error('X API が初期化されていません');
        }

        console.log(`🔍 X 検索: "${query}"`);

        const result = await client.v2.search(query, {
            max_results: maxResults
        });

        console.log(`✅ ${result.data.data.length} 件のツイートが見つかりました`);

        return result.data.data;

    } catch (error) {
        console.error('❌ X 検索エラー:', error);
        throw error;
    }
}

// ============================================
// 補助機能：いいね
// ============================================
/**
 * ツイートにいいね
 * @param {string} tweetId - ツイートID
 * @returns {Promise<object>} 結果
 */
async function like(tweetId) {
    try {
        if (!client) {
            throw new Error('X API が初期化されていません');
        }

        // 自分のユーザーIDを取得
        const me = await client.v2.me();
        const userId = me.data.id;

        await client.v2.like(userId, tweetId);

        console.log('✅ X いいね成功');

        return {
            success: true,
            message: 'いいねしました'
        };

    } catch (error) {
        console.error('❌ X いいねエラー:', error);
        throw error;
    }
}

// ============================================
// 補助機能：リツイート
// ============================================
/**
 * ツイートをリツイート
 * @param {string} tweetId - ツイートID
 * @returns {Promise<object>} 結果
 */
async function retweet(tweetId) {
    try {
        if (!client) {
            throw new Error('X API が初期化されていません');
        }

        // 自分のユーザーIDを取得
        const me = await client.v2.me();
        const userId = me.data.id;

        await client.v2.retweet(userId, tweetId);

        console.log('✅ X リツイート成功');

        return {
            success: true,
            message: 'リツイートしました'
        };

    } catch (error) {
        console.error('❌ X リツイートエラー:', error);
        throw error;
    }
}

// ============================================
// エクスポート
// ============================================
module.exports = {
    post,
    reply,
    deleteTweet,
    getMyTweets,
    searchTweets,
    like,
    retweet
};
