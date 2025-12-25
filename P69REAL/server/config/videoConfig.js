// ============================================
// P69REAL - AI秘書ロックマン
// 動画ファイル設定
// ============================================
//
// 📹 このファイルで動画ファイル名を管理します
//
// ⚠️ 重要: 動画ファイルを配置したら、このファイルを編集してください！
//
// 【手順】
// 1. 動画ファイルを以下のフォルダに配置
//    - 通常モード: public/videos/normal/
//    - アーマーモード: public/videos/armor/
//
// 2. 下記の「'ここに〜'」の部分を実際のファイル名に変更
//    例: 'ここに待機中の動画のファイル名を記載してください'
//        ↓
//        'rockman_idle.mp4'
//
// ============================================

/**
 * 動画設定オブジェクト
 *
 * 各モードごとに使用する動画ファイル名を定義
 * ファイル名のみを記載（パスは自動で追加されます）
 */
const videoConfig = {
  // ============================================
  // 通常モード の動画設定
  // ============================================
  normal: {
    // 待機中の動画（デフォルト表示）
    // この動画がループ再生されます
    // 👉 ここに通常モードの待機中の動画のファイル名を記載してください
    idle: 'ここに通常モードの待機中の動画のファイル名を記載してください',

    // 話している時の動画
    // AI が応答している時に再生されます
    // 👉 ここに通常モードの話している時の動画のファイル名を記載してください
    speaking: 'ここに通常モードの話している時の動画のファイル名を記載してください',

    // 3秒以上操作されていない時の動画 ①
    // ランダムで再生される待機アニメーション
    // 👉 ここに通常モードの待機アクション1の動画のファイル名を記載してください
    idleAction1: 'ここに通常モードの待機アクション1の動画のファイル名を記載してください',

    // 3秒以上操作されていない時の動画 ②
    // ランダムで再生される待機アニメーション
    // 👉 ここに通常モードの待機アクション2の動画のファイル名を記載してください
    idleAction2: 'ここに通常モードの待機アクション2の動画のファイル名を記載してください',

    // 「チェンジ」コマンド時の返信動画
    // 装甲モードに切り替わる前に再生されます
    // 👉 ここに通常モードのモード変更時の動画のファイル名を記載してください
    changeReply: 'ここに通常モードのモード変更時の動画のファイル名を記載してください'
  },

  // ============================================
  // 装甲モード の動画設定
  // ============================================
  armor: {
    // 待機中の動画（デフォルト表示）
    // この動画がループ再生されます
    // 👉 ここにアーマーモードの待機中の動画のファイル名を記載してください
    idle: 'ここにアーマーモードの待機中の動画のファイル名を記載してください',

    // 話している時の動画
    // AI が応答している時に再生されます
    // 👉 ここにアーマーモードの話している時の動画のファイル名を記載してください
    speaking: 'ここにアーマーモードの話している時の動画のファイル名を記載してください',

    // 3秒以上操作されていない時の動画 ①
    // ランダムで再生される待機アニメーション
    // 👉 ここにアーマーモードの待機アクション1の動画のファイル名を記載してください
    idleAction1: 'ここにアーマーモードの待機アクション1の動画のファイル名を記載してください',

    // 3秒以上操作されていない時の動画 ②
    // ランダムで再生される待機アニメーション
    // 👉 ここにアーマーモードの待機アクション2の動画のファイル名を記載してください
    idleAction2: 'ここにアーマーモードの待機アクション2の動画のファイル名を記載してください',

    // 「キャストオフ」コマンド時の返信動画
    // 通常モードに切り替わる前に再生されます
    // 👉 ここにアーマーモードのキャストオフ時の動画のファイル名を記載してください
    castoffReply: 'ここにアーマーモードのキャストオフ時の動画のファイル名を記載してください'
  }
};

/**
 * 動画のベースパスを取得
 * @param {string} mode - 'normal' または 'armor'
 * @returns {string} 動画フォルダのパス
 */
function getVideoBasePath(mode) {
  return `/videos/${mode}/`;
}

/**
 * 完全な動画パスを取得
 * @param {string} mode - 'normal' または 'armor'
 * @param {string} videoType - 動画の種類（'idle', 'speaking', など）
 * @returns {string} 完全な動画ファイルパス
 */
function getVideoPath(mode, videoType) {
  const basePath = getVideoBasePath(mode);
  const fileName = videoConfig[mode][videoType];
  return basePath + fileName;
}

/**
 * 待機アクション動画をランダムに取得
 * @param {string} mode - 'normal' または 'armor'
 * @returns {string} ランダムな待機アクション動画のパス
 */
function getRandomIdleAction(mode) {
  const random = Math.random();
  const videoType = random < 0.5 ? 'idleAction1' : 'idleAction2';
  return getVideoPath(mode, videoType);
}

/**
 * 全ての動画パスを取得（デバッグ用）
 * @returns {object} 全モードの全動画パス
 */
function getAllVideoPaths() {
  return {
    normal: {
      idle: getVideoPath('normal', 'idle'),
      speaking: getVideoPath('normal', 'speaking'),
      idleAction1: getVideoPath('normal', 'idleAction1'),
      idleAction2: getVideoPath('normal', 'idleAction2'),
      changeReply: getVideoPath('normal', 'changeReply')
    },
    armor: {
      idle: getVideoPath('armor', 'idle'),
      speaking: getVideoPath('armor', 'speaking'),
      idleAction1: getVideoPath('armor', 'idleAction1'),
      idleAction2: getVideoPath('armor', 'idleAction2'),
      castoffReply: getVideoPath('armor', 'castoffReply')
    }
  };
}

// ============================================
// エクスポート
// ============================================
module.exports = {
  videoConfig,
  getVideoPath,
  getVideoBasePath,
  getRandomIdleAction,
  getAllVideoPaths
};

// ============================================
// 使用例
// ============================================
//
// const { getVideoPath, getRandomIdleAction } = require('./videoConfig');
//
// // 通常モードの待機動画を取得
// const normalIdle = getVideoPath('normal', 'idle');
// // => '/videos/normal/idle.mp4'
//
// // 装甲モードの話す動画を取得
// const armorSpeaking = getVideoPath('armor', 'speaking');
// // => '/videos/armor/speaking.mp4'
//
// // ランダムな待機アクション動画を取得
// const randomAction = getRandomIdleAction('normal');
// // => '/videos/normal/idle-action1.mp4' または '/videos/normal/idle-action2.mp4'
//
// ============================================
