// ============================================
// P69REAL - AI秘書ロックマン
// 動画ファイル設定
// ============================================
//
// 📹 このファイルで動画ファイル名を管理します
//
// 動画ファイルの配置場所:
//   - 通常モード: videos/normal/
//   - 装甲モード: videos/armor/
//
// 動画ファイル名を変更する場合:
//   下記の設定を編集してください
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
    idle: 'idle.mp4',

    // 話している時の動画
    // AI が応答している時に再生されます
    speaking: 'speaking.mp4',

    // 3秒以上操作されていない時の動画 ①
    // ランダムで再生される待機アニメーション
    idleAction1: 'idle-action1.mp4',

    // 3秒以上操作されていない時の動画 ②
    // ランダムで再生される待機アニメーション
    idleAction2: 'idle-action2.mp4',

    // 「チェンジ」コマンド時の返信動画
    // 装甲モードに切り替わる前に再生されます
    changeReply: 'change-reply.mp4'
  },

  // ============================================
  // 装甲モード の動画設定
  // ============================================
  armor: {
    // 待機中の動画（デフォルト表示）
    // この動画がループ再生されます
    idle: 'idle.mp4',

    // 話している時の動画
    // AI が応答している時に再生されます
    speaking: 'speaking.mp4',

    // 3秒以上操作されていない時の動画 ①
    // ランダムで再生される待機アニメーション
    idleAction1: 'idle-action1.mp4',

    // 3秒以上操作されていない時の動画 ②
    // ランダムで再生される待機アニメーション
    idleAction2: 'idle-action2.mp4',

    // 「キャストオフ」コマンド時の返信動画
    // 通常モードに切り替わる前に再生されます
    castoffReply: 'castoff-reply.mp4'
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
