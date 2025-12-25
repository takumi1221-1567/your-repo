// ============================================
// P69REAL - AI秘書ロックマン
// MongoDB クライアント
// ============================================

const { MongoClient } = require('mongodb');

// ============================================
// 設定
// ============================================
const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = process.env.MONGODB_DB_NAME || 'rockman_memory';
const COLLECTION_NAME = 'memories';

// ============================================
// MongoDB クライアント
// ============================================
let client = null;
let db = null;
let collection = null;

/**
 * MongoDB に接続
 */
async function connect() {
    try {
        if (!MONGODB_URI) {
            console.warn('⚠️ MONGODB_URI が設定されていません');
            return false;
        }

        if (client && client.topology && client.topology.isConnected()) {
            console.log('✅ MongoDB は既に接続されています');
            return true;
        }

        console.log('🔌 MongoDB に接続中...');

        client = new MongoClient(MONGODB_URI, {
            serverSelectionTimeoutMS: 10000,
            socketTimeoutMS: 45000,
            connectTimeoutMS: 30000,
            maxPoolSize: 10,
            minPoolSize: 1,
            retryWrites: true,
            retryReads: true
        });

        await client.connect();
        db = client.db(DB_NAME);
        collection = db.collection(COLLECTION_NAME);

        // インデックス作成（テキスト検索用）
        await collection.createIndex({ text: 'text' });
        await collection.createIndex({ timestamp: -1 });

        console.log(`✅ MongoDB 接続成功: ${DB_NAME}.${COLLECTION_NAME}`);
        return true;

    } catch (error) {
        console.error('❌ MongoDB 接続エラー:', error);
        return false;
    }
}

/**
 * MongoDB 接続をクローズ
 */
async function close() {
    try {
        if (client) {
            await client.close();
            console.log('✅ MongoDB 接続をクローズしました');
        }
    } catch (error) {
        console.error('❌ MongoDB クローズエラー:', error);
    }
}

/**
 * 接続状態を確認
 */
async function ensureConnection() {
    if (!client || !client.topology || !client.topology.isConnected()) {
        await connect();
    }
}

// ============================================
// メイン機能：記憶（保存）
// ============================================
/**
 * テキストを記憶（MongoDB に保存）
 * @param {string} text - 記憶するテキスト
 * @param {object} metadata - 追加のメタデータ（オプション）
 * @returns {Promise<object>} 保存結果
 */
async function remember(text, metadata = {}) {
    try {
        await ensureConnection();

        if (!collection) {
            throw new Error('MongoDB が接続されていません');
        }

        console.log(`💾 記憶: "${text}"`);

        // 記憶データの構築
        const memory = {
            text: text,
            timestamp: new Date(),
            metadata: metadata
        };

        // MongoDB に保存
        const result = await collection.insertOne(memory);

        console.log(`✅ 記憶成功: ID ${result.insertedId}`);

        return {
            success: true,
            id: result.insertedId,
            message: '記憶しました'
        };

    } catch (error) {
        console.error('❌ 記憶エラー:', error);
        throw error;
    }
}

// ============================================
// メイン機能：思い出す（検索）
// ============================================
/**
 * テキストを検索して思い出す
 * @param {string} query - 検索クエリ
 * @param {number} limit - 取得件数（デフォルト: 5）
 * @returns {Promise<string|null>} 検索結果
 */
async function recall(query, limit = 5) {
    try {
        await ensureConnection();

        if (!collection) {
            throw new Error('MongoDB が接続されていません');
        }

        console.log(`🔍 思い出し: "${query}"`);

        // テキスト検索
        const results = await collection
            .find(
                { $text: { $search: query } },
                { score: { $meta: 'textScore' } }
            )
            .sort({ score: { $meta: 'textScore' } })
            .limit(limit)
            .toArray();

        if (results.length === 0) {
            console.log('❌ 該当する記憶が見つかりませんでした');
            return null;
        }

        // 最も関連性の高い記憶を返す
        const bestMatch = results[0];
        console.log(`✅ 思い出し成功: "${bestMatch.text}"`);

        return bestMatch.text;

    } catch (error) {
        console.error('❌ 思い出しエラー:', error);
        throw error;
    }
}

// ============================================
// 補助機能：全記憶の取得
// ============================================
/**
 * すべての記憶を取得
 * @param {number} limit - 取得件数（デフォルト: 100）
 * @returns {Promise<Array>} 記憶のリスト
 */
async function getAllMemories(limit = 100) {
    try {
        await ensureConnection();

        if (!collection) {
            throw new Error('MongoDB が接続されていません');
        }

        const memories = await collection
            .find({})
            .sort({ timestamp: -1 })
            .limit(limit)
            .toArray();

        console.log(`✅ ${memories.length} 件の記憶を取得しました`);

        return memories;

    } catch (error) {
        console.error('❌ 記憶取得エラー:', error);
        throw error;
    }
}

// ============================================
// 補助機能：記憶の削除
// ============================================
/**
 * 特定の記憶を削除
 * @param {string} id - 記憶のID
 * @returns {Promise<object>} 削除結果
 */
async function deleteMemory(id) {
    try {
        await ensureConnection();

        if (!collection) {
            throw new Error('MongoDB が接続されていません');
        }

        const { ObjectId } = require('mongodb');
        const result = await collection.deleteOne({ _id: new ObjectId(id) });

        if (result.deletedCount === 1) {
            console.log(`✅ 記憶を削除しました: ID ${id}`);
            return { success: true, message: '記憶を削除しました' };
        } else {
            console.log(`❌ 記憶が見つかりませんでした: ID ${id}`);
            return { success: false, message: '記憶が見つかりませんでした' };
        }

    } catch (error) {
        console.error('❌ 削除エラー:', error);
        throw error;
    }
}

// ============================================
// 補助機能：すべての記憶を削除
// ============================================
/**
 * すべての記憶を削除（注意: 復元不可）
 * @returns {Promise<object>} 削除結果
 */
async function clearAllMemories() {
    try {
        await ensureConnection();

        if (!collection) {
            throw new Error('MongoDB が接続されていません');
        }

        const result = await collection.deleteMany({});

        console.log(`✅ ${result.deletedCount} 件の記憶を削除しました`);

        return {
            success: true,
            deletedCount: result.deletedCount,
            message: 'すべての記憶を削除しました'
        };

    } catch (error) {
        console.error('❌ 全削除エラー:', error);
        throw error;
    }
}

// ============================================
// 補助機能：キーワードで検索
// ============================================
/**
 * キーワードで記憶を検索（部分一致）
 * @param {string} keyword - 検索キーワード
 * @param {number} limit - 取得件数
 * @returns {Promise<Array>} 検索結果のリスト
 */
async function searchByKeyword(keyword, limit = 10) {
    try {
        await ensureConnection();

        if (!collection) {
            throw new Error('MongoDB が接続されていません');
        }

        const results = await collection
            .find({ text: { $regex: keyword, $options: 'i' } })
            .sort({ timestamp: -1 })
            .limit(limit)
            .toArray();

        console.log(`✅ ${results.length} 件の記憶が見つかりました`);

        return results;

    } catch (error) {
        console.error('❌ 検索エラー:', error);
        throw error;
    }
}

// ============================================
// 初期化時に自動接続
// ============================================
if (MONGODB_URI) {
    connect().catch(err => {
        console.error('❌ MongoDB 自動接続失敗:', err);
    });
}

// ============================================
// エクスポート
// ============================================
module.exports = {
    connect,
    close,
    remember,
    recall,
    getAllMemories,
    deleteMemory,
    clearAllMemories,
    searchByKeyword
};
