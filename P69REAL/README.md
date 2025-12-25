# P69REAL - AI秘書ロックマン

## 📖 プロジェクト概要
AI秘書「ロックマン」は、音声・テキスト入力に対応した対話型AIアシスタントです。
キャラクター動画を使った視覚的なインターフェースで、様々なタスクをサポートします。

## 🎯 主な機能
- 🎤 音声入力・出力
- 🎬 キャラクターアニメーション（通常モード・装甲モード）
- 🧠 Gemini APIによるAI応答
- 💾 MongoDBによる記憶機能
- 📱 LINE/Slack/X連携
- 🚃 駅すぱあとAPI（ルート検索）
- 📸 OCR機能（カメラ撮影から文字認識）
- 📰 AI関連ニュース自動配信（9時、12時、15時、18時）
- 🌐 Chrome DevTools MCP連携

## 📁 プロジェクト構成

```
P69REAL/
├── README.md                      # このファイル
├── package.json                   # 依存関係
├── .env.example                   # API キーのテンプレート
├── .gitignore                     # Git除外設定
│
├── public/
│   └── videos/                    # 🎬 動画ファイル格納フォルダ（ここに動画を入れる！）
│       ├── 動画はここに格納してください.txt  # 👈 使い方の説明
│       ├── normal/                # 通常モードの動画をここに入れる
│       └── armor/                 # アーマーモードの動画をここに入れる
│
├── public/                        # フロントエンド
│   ├── index.html                # メインHTML
│   ├── css/
│   │   └── style.css            # iPhone15対応スタイル
│   └── js/
│       ├── app.js               # メインアプリロジック
│       └── videoController.js   # 動画制御
│
├── server/                        # バックエンド
│   ├── server.js                # メインサーバー
│   ├── config/
│   │   ├── videoConfig.js       # 📹 動画ファイル名設定
│   │   └── apiConfig.js         # API設定
│   │
│   └── modules/                  # 各機能モジュール
│       ├── geminiClient.js      # Gemini API
│       ├── mongodbClient.js     # MongoDB
│       ├── lineClient.js        # LINE API
│       ├── slackClient.js       # Slack API
│       ├── xClient.js           # X (Twitter) API
│       ├── ekispertClient.js    # 駅すぱあと API
│       ├── ocrClient.js         # OCR機能
│       ├── newsScheduler.js     # ニュース配信
│       └── mcpClient.js         # Chrome DevTools MCP
│
└── render.yaml                    # Render デプロイ設定

```

## 🎬 動画ファイルの配置方法

### ⚠️ 重要：最初に必ずこの手順を実行してください！

**手順1：動画ファイルを配置する**

1. 動画ファイルを準備します
2. 以下のフォルダに動画を入れます：

```
public/videos/normal/   👈 ここに通常モードの動画を入れる
public/videos/armor/    👈 ここにアーマーモードの動画を入れる
```

詳しい説明は `public/videos/動画はここに格納してください.txt` を確認してください。

**手順2：動画ファイル名を設定する**

動画を配置したら、以下のファイルを開いてください：

👉 **`server/config/videoConfig.js`**

ファイルを開くと、以下のような部分があります：

```javascript
idle: 'ここに通常モードの待機中の動画のファイル名を記載してください',
```

この「ここに〜を記載してください」の部分を、実際のファイル名に変更します：

```javascript
idle: 'rockman_idle.mp4',  // 👈 こんな感じに変更
```

**必要な動画の種類：**

- 待機中の動画（ループ再生される）
- 話している時の動画
- 待機アクション1の動画（3秒以上操作なし時）
- 待機アクション2の動画（3秒以上操作なし時）
- モード変更時の動画

※ 各モード（通常・アーマー）ごとに上記5種類の動画が必要です

## 🔧 セットアップ手順

### 1. 環境構築

```bash
# プロジェクトのクローン（または移動）
cd P69REAL

# 依存関係のインストール
npm install
```

### 2. 環境変数の設定

`.env.example` をコピーして `.env` を作成し、各APIキーを設定：

```bash
cp .env.example .env
```

以下のAPIキーを取得して `.env` に記入：
- Gemini API Key
- MongoDB URI
- LINE Messaging API
- Slack Bot Token
- X (Twitter) API Keys
- 駅すぱあと API Key

### 3. 動画ファイルの配置

上記の「動画ファイルの配置方法」を参照して、動画を配置してください。

### 4. アプリの起動

```bash
# 開発環境
npm run dev

# 本番環境
npm start
```

iPhone15のブラウザで `http://localhost:3000` にアクセス

## 🚀 Renderへのデプロイ

1. GitHubリポジトリにプッシュ
2. Renderでプロジェクトを接続
3. 環境変数を設定
4. デプロイ実行

詳細は `render.yaml` を参照

## 🎮 使い方

### 基本操作
- **テキスト入力**: 画面下部の入力欄に入力
- **音声入力**: マイクボタンをタップ

### 特殊コマンド
- `覚えて` - 情報をMongoDBに保存
- `覚えてる？` - 保存した情報を検索
- `送って` - LINE/Slack/Xへメッセージ送信
- `チェンジ` - 装甲モードに切り替え
- `キャストオフ` - 通常モードに切り替え（パスワード: 214200）

## 📝 ライセンス
MIT License

## 👨‍💻 開発者向けメモ

### コード追加時の注意
- APIキーは必ず `.env` に記載
- 動画ファイル名は `videoConfig.js` で管理
- 新機能は `server/modules/` に追加

### トラブルシューティング
- 動画が再生されない → `videoConfig.js` のパス確認
- API エラー → `.env` のキー確認
- MCP 接続エラー → Chrome DevTools MCP の起動確認
