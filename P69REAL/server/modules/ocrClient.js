// ============================================
// P69REAL - AI秘書ロックマン
// OCR (文字認識) モジュール
// ============================================

const Tesseract = require('tesseract.js');
const fs = require('fs');
const path = require('path');

// ============================================
// 設定
// ============================================
const DEFAULT_LANGUAGE = 'jpn+eng'; // 日本語 + 英語
const TEMP_DIR = path.join(__dirname, '../../temp');

// ============================================
// 初期化
// ============================================
// 一時ディレクトリの作成
if (!fs.existsSync(TEMP_DIR)) {
    fs.mkdirSync(TEMP_DIR, { recursive: true });
    console.log('✅ OCR 一時ディレクトリ作成完了');
}

console.log('✅ OCR クライアント初期化完了');

// ============================================
// メイン機能：画像から文字認識
// ============================================
/**
 * 画像から文字を認識
 * @param {string|Buffer} imageData - 画像データ（パス、URL、またはBuffer）
 * @param {string} lang - 認識言語（デフォルト: 'jpn+eng'）
 * @returns {Promise<string>} 認識された文字列
 */
async function recognize(imageData, lang = DEFAULT_LANGUAGE) {
    try {
        console.log('📸 OCR 処理開始...');

        // Tesseract.js で文字認識
        const result = await Tesseract.recognize(
            imageData,
            lang,
            {
                logger: (info) => {
                    // 進捗ログ（オプション）
                    if (info.status === 'recognizing text') {
                        console.log(`OCR 進捗: ${Math.round(info.progress * 100)}%`);
                    }
                }
            }
        );

        const text = result.data.text.trim();

        console.log('✅ OCR 処理完了');
        console.log(`📝 認識結果: "${text.substring(0, 100)}..."`);

        return text;

    } catch (error) {
        console.error('❌ OCR エラー:', error);
        throw error;
    }
}

// ============================================
// 補助機能：Base64画像から文字認識
// ============================================
/**
 * Base64エンコードされた画像から文字を認識
 * @param {string} base64Data - Base64画像データ（data:image/png;base64,... 形式）
 * @param {string} lang - 認識言語
 * @returns {Promise<string>} 認識された文字列
 */
async function recognizeBase64(base64Data, lang = DEFAULT_LANGUAGE) {
    try {
        console.log('📸 Base64 OCR 処理開始...');

        // Base64データからBufferに変換
        const base64Image = base64Data.replace(/^data:image\/\w+;base64,/, '');
        const buffer = Buffer.from(base64Image, 'base64');

        // 一時ファイルとして保存
        const tempFilePath = path.join(TEMP_DIR, `ocr_${Date.now()}.png`);
        fs.writeFileSync(tempFilePath, buffer);

        // OCR実行
        const text = await recognize(tempFilePath, lang);

        // 一時ファイル削除
        fs.unlinkSync(tempFilePath);

        return text;

    } catch (error) {
        console.error('❌ Base64 OCR エラー:', error);
        throw error;
    }
}

// ============================================
// 補助機能：画像ファイルから文字認識
// ============================================
/**
 * ファイルパスから文字を認識
 * @param {string} filePath - 画像ファイルのパス
 * @param {string} lang - 認識言語
 * @returns {Promise<string>} 認識された文字列
 */
async function recognizeFile(filePath, lang = DEFAULT_LANGUAGE) {
    try {
        if (!fs.existsSync(filePath)) {
            throw new Error(`ファイルが見つかりません: ${filePath}`);
        }

        console.log(`📸 ファイル OCR 処理: ${filePath}`);

        const text = await recognize(filePath, lang);

        return text;

    } catch (error) {
        console.error('❌ ファイル OCR エラー:', error);
        throw error;
    }
}

// ============================================
// 補助機能：URL画像から文字認識
// ============================================
/**
 * URL画像から文字を認識
 * @param {string} imageUrl - 画像のURL
 * @param {string} lang - 認識言語
 * @returns {Promise<string>} 認識された文字列
 */
async function recognizeUrl(imageUrl, lang = DEFAULT_LANGUAGE) {
    try {
        console.log(`📸 URL OCR 処理: ${imageUrl}`);

        const text = await recognize(imageUrl, lang);

        return text;

    } catch (error) {
        console.error('❌ URL OCR エラー:', error);
        throw error;
    }
}

// ============================================
// 補助機能：詳細情報付きOCR
// ============================================
/**
 * 画像から文字を認識（詳細情報付き）
 * @param {string|Buffer} imageData - 画像データ
 * @param {string} lang - 認識言語
 * @returns {Promise<object>} 認識結果（テキスト、信頼度、座標など）
 */
async function recognizeDetailed(imageData, lang = DEFAULT_LANGUAGE) {
    try {
        console.log('📸 詳細 OCR 処理開始...');

        const result = await Tesseract.recognize(imageData, lang);

        const detailedResult = {
            text: result.data.text.trim(),
            confidence: result.data.confidence,
            words: result.data.words.map(word => ({
                text: word.text,
                confidence: word.confidence,
                bbox: word.bbox // 境界ボックス
            })),
            lines: result.data.lines.map(line => ({
                text: line.text,
                confidence: line.confidence,
                bbox: line.bbox
            }))
        };

        console.log(`✅ 詳細 OCR 完了 (信頼度: ${detailedResult.confidence.toFixed(2)}%)`);

        return detailedResult;

    } catch (error) {
        console.error('❌ 詳細 OCR エラー:', error);
        throw error;
    }
}

// ============================================
// 補助機能：複数言語対応OCR
// ============================================
/**
 * 複数の言語を試してOCRを実行
 * @param {string|Buffer} imageData - 画像データ
 * @param {Array<string>} languages - 試す言語のリスト
 * @returns {Promise<object>} 最も信頼度の高い結果
 */
async function recognizeMultiLang(imageData, languages = ['jpn+eng', 'eng', 'jpn']) {
    try {
        console.log('📸 多言語 OCR 処理開始...');

        const results = [];

        for (const lang of languages) {
            try {
                const result = await recognizeDetailed(imageData, lang);
                results.push({
                    language: lang,
                    text: result.text,
                    confidence: result.confidence
                });
            } catch (err) {
                console.warn(`⚠️ 言語 ${lang} での認識失敗`);
            }
        }

        // 最も信頼度の高い結果を返す
        const bestResult = results.reduce((prev, current) => {
            return (current.confidence > prev.confidence) ? current : prev;
        });

        console.log(`✅ 最適言語: ${bestResult.language} (信頼度: ${bestResult.confidence.toFixed(2)}%)`);

        return bestResult;

    } catch (error) {
        console.error('❌ 多言語 OCR エラー:', error);
        throw error;
    }
}

// ============================================
// 補助機能：一時ファイルのクリーンアップ
// ============================================
/**
 * 古い一時ファイルを削除
 * @param {number} maxAgeHours - 削除する最大経過時間（時間単位）
 */
function cleanupTempFiles(maxAgeHours = 24) {
    try {
        if (!fs.existsSync(TEMP_DIR)) {
            return;
        }

        const files = fs.readdirSync(TEMP_DIR);
        const now = Date.now();
        const maxAge = maxAgeHours * 60 * 60 * 1000;

        let deletedCount = 0;

        files.forEach(file => {
            const filePath = path.join(TEMP_DIR, file);
            const stats = fs.statSync(filePath);
            const age = now - stats.mtimeMs;

            if (age > maxAge) {
                fs.unlinkSync(filePath);
                deletedCount++;
            }
        });

        if (deletedCount > 0) {
            console.log(`✅ ${deletedCount} 件の古い一時ファイルを削除しました`);
        }

    } catch (error) {
        console.error('❌ 一時ファイルクリーンアップエラー:', error);
    }
}

// ============================================
// 定期的なクリーンアップ（1時間ごと）
// ============================================
setInterval(() => {
    cleanupTempFiles(24);
}, 60 * 60 * 1000);

// ============================================
// エクスポート
// ============================================
module.exports = {
    recognize,
    recognizeBase64,
    recognizeFile,
    recognizeUrl,
    recognizeDetailed,
    recognizeMultiLang,
    cleanupTempFiles
};
