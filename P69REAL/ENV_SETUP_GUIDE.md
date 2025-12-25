# 🔐 .env 設定ガイド - P69REAL

このガイドでは、`.env` ファイルの設定方法を**初心者にもわかりやすく**説明します。

---

## 📋 目次

1. [.envファイルの作成方法](#1-envファイルの作成方法)
2. [必須の設定](#2-必須の設定)
3. [オプションの設定](#3-オプションの設定)
4. [完成例](#4-完成例)

---

## 1. .envファイルの作成方法

### ステップ1: .env.example をコピー

```bash
cd P69REAL
cp .env.example .env
```

### ステップ2: .env ファイルを開く

テキストエディタで `.env` ファイルを開きます。

```bash
# Mac/Linux
nano .env

# または
code .env  # VS Code の場合
```

---

## 2. 必須の設定

最低限、以下の2つは**必ず**設定してください。

### ✅ Gemini API Key（必須）

**取得方法：**

1. https://ai.google.dev/ にアクセス
2. 「Get API Key」をクリック
3. Googleアカウントでログイン
4. 「Create API key」をクリック
5. 表示されたキーをコピー

**記載例：**

```env
GEMINI_API_KEY=AIzaSyBxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

⚠️ `AIzaSy` で始まる文字列です

---

### ✅ MongoDB URI（必須）

**取得方法：**

1. https://www.mongodb.com/cloud/atlas にアクセス
2. 「Try Free」でアカウント作成
3. 無料プラン（M0 Sandbox）を選択
4. クラスターを作成
5. 「Connect」→「Connect your application」を選択
6. 接続文字列をコピー
7. `<password>` の部分を実際のパスワードに置き換える

**記載例：**

```env
MONGODB_URI=mongodb+srv://username:your_password_here@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
MONGODB_DB_NAME=rockman_memory
```

⚠️ `mongodb+srv://` で始まる文字列です
⚠️ `<password>` は必ず実際のパスワードに置き換えてください

---

## 3. オプションの設定

以下は使用する機能に応じて設定してください。

### 📱 LINE API（LINE送信機能を使う場合）

**取得方法：**

1. https://developers.line.biz/ にアクセス
2. LINEアカウントでログイン
3. 「新規プロバイダー作成」
4. 「新規チャネル作成」→「Messaging API」を選択
5. チャネル設定から以下を取得：
   - Channel access token（発行）
   - Channel secret

**記載例：**

```env
LINE_CHANNEL_ACCESS_TOKEN=YOUR_LINE_CHANNEL_ACCESS_TOKEN_HERE
LINE_CHANNEL_SECRET=YOUR_LINE_CHANNEL_SECRET_HERE
```

---

### 💬 Slack API（Slack送信機能を使う場合）

**取得方法：**

1. https://api.slack.com/apps にアクセス
2. 「Create New App」をクリック
3. 「From scratch」を選択
4. アプリ名とワークスペースを選択
5. 「OAuth & Permissions」→「Bot Token Scopes」で権限追加：
   - `chat:write`
   - `channels:read`
   - `users:read`
6. 「Install to Workspace」をクリック
7. Bot User OAuth Token をコピー

**記載例：**

```env
SLACK_BOT_TOKEN=xoxb-YOUR-BOT-TOKEN-HERE
SLACK_SIGNING_SECRET=YOUR_SLACK_SIGNING_SECRET_HERE
```

⚠️ Botトークンは `xoxb-` で始まる文字列です

---

### 🐦 X (Twitter) API（X投稿機能を使う場合）

**取得方法：**

1. https://developer.twitter.com/ にアクセス
2. 開発者アカウントを申請（承認に数日かかる場合あり）
3. 「Projects & Apps」→「Create App」
4. アプリを作成後、「Keys and tokens」タブを開く
5. 以下を取得：
   - API Key
   - API Secret
   - Access Token
   - Access Token Secret
   - Bearer Token

**記載例：**

```env
X_API_KEY=YOUR_X_API_KEY_HERE
X_API_SECRET=YOUR_X_API_SECRET_HERE
X_ACCESS_TOKEN=YOUR_X_ACCESS_TOKEN_HERE
X_ACCESS_SECRET=YOUR_X_ACCESS_SECRET_HERE
X_BEARER_TOKEN=YOUR_X_BEARER_TOKEN_HERE
```

---

### 🚃 駅すぱあと API（ルート検索機能を使う場合）

**取得方法：**

1. https://ekispert.com/ にアクセス
2. 開発者向けAPIに申し込み
3. APIキーを取得

**記載例：**

```env
EKISPERT_API_KEY=your_ekispert_api_key_here
```

---

### 🔒 その他の設定

以下はそのままでOKです：

```env
# サーバー設定
PORT=3000
NODE_ENV=development

# キャストオフパスワード
CASTOFF_PASSWORD=214200

# ニュース配信時刻（日本時間）
NEWS_SCHEDULE_HOURS=9,12,15,18

# セッションシークレット（ランダムな文字列）
SESSION_SECRET=your_random_secret_string_here_change_this

# CORS設定
ALLOWED_ORIGINS=http://localhost:3000

# ログレベル
LOG_LEVEL=info

# タイムゾーン
TZ=Asia/Tokyo

# 音声認識の言語
SPEECH_LANGUAGE=ja-JP
```

---

## 4. 完成例

### 最小構成（Gemini + MongoDB のみ）

```env
# サーバー設定
PORT=3000
NODE_ENV=development

# Gemini API（必須）
GEMINI_API_KEY=AIzaSyBxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# MongoDB（必須）
MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
MONGODB_DB_NAME=rockman_memory

# キャストオフパスワード
CASTOFF_PASSWORD=214200

# ニュース配信時刻
NEWS_SCHEDULE_HOURS=9,12,15,18

# セッションシークレット
SESSION_SECRET=my_super_secret_key_12345

# CORS設定
ALLOWED_ORIGINS=http://localhost:3000

# ログレベル
LOG_LEVEL=info

# タイムゾーン
TZ=Asia/Tokyo

# 音声認識の言語
SPEECH_LANGUAGE=ja-JP
```

---

### 全機能対応版

```env
# サーバー設定
PORT=3000
NODE_ENV=development

# Gemini API（必須）
GEMINI_API_KEY=AIzaSyBxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# MongoDB（必須）
MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
MONGODB_DB_NAME=rockman_memory

# LINE API（オプション）
LINE_CHANNEL_ACCESS_TOKEN=YOUR_LINE_CHANNEL_ACCESS_TOKEN_HERE
LINE_CHANNEL_SECRET=YOUR_LINE_CHANNEL_SECRET_HERE

# Slack API（オプション）
SLACK_BOT_TOKEN=xoxb-YOUR-BOT-TOKEN-HERE
SLACK_SIGNING_SECRET=YOUR_SLACK_SIGNING_SECRET_HERE

# X (Twitter) API（オプション）
X_API_KEY=YOUR_X_API_KEY_HERE
X_API_SECRET=YOUR_X_API_SECRET_HERE
X_ACCESS_TOKEN=YOUR_X_ACCESS_TOKEN_HERE
X_ACCESS_SECRET=YOUR_X_ACCESS_SECRET_HERE
X_BEARER_TOKEN=YOUR_X_BEARER_TOKEN_HERE

# 駅すぱあと API（オプション）
EKISPERT_API_KEY=your_ekispert_api_key_here

# キャストオフパスワード
CASTOFF_PASSWORD=214200

# ニュース配信時刻
NEWS_SCHEDULE_HOURS=9,12,15,18

# セッションシークレット
SESSION_SECRET=my_super_secret_key_12345

# CORS設定
ALLOWED_ORIGINS=http://localhost:3000

# ログレベル
LOG_LEVEL=info

# タイムゾーン
TZ=Asia/Tokyo

# 音声認識の言語
SPEECH_LANGUAGE=ja-JP
```

---

## ⚠️ 重要な注意事項

### 🚫 やってはいけないこと

1. ❌ `.env` ファイルをGitにコミットしない
2. ❌ APIキーを誰かと共有しない
3. ❌ APIキーをスクリーンショットで公開しない
4. ❌ コード内に直接APIキーを書かない

### ✅ やるべきこと

1. ✅ `.env` は必ず `.gitignore` に含める（既に設定済み）
2. ✅ APIキーは定期的に再生成する
3. ✅ 本番環境ではRenderの環境変数設定を使う
4. ✅ テスト用と本番用でAPIキーを分ける

---

## 🆘 トラブルシューティング

### エラー: `GEMINI_API_KEY が設定されていません`

**解決方法：**
1. `.env` ファイルが `P69REAL/` フォルダにあるか確認
2. `GEMINI_API_KEY=` の後にスペースがないか確認
3. APIキーを `"` や `'` で囲まない

### エラー: `MongoDB 接続エラー`

**解決方法：**
1. MongoDB URIの `<password>` を実際のパスワードに置き換えたか確認
2. MongoDB Atlasで接続元IPアドレスを許可（`0.0.0.0/0` で全て許可）
3. データベースユーザーが作成されているか確認

### エラー: `APIキーが無効です`

**解決方法：**
1. APIキーをコピーする際に余分なスペースが入っていないか確認
2. APIキーが有効期限切れでないか確認
3. API管理画面でキーが有効化されているか確認

---

## 📞 サポート

わからないことがあれば、以下を確認してください：

1. `README.md` - プロジェクト全体の説明
2. `.env.example` - テンプレートファイル
3. 各APIの公式ドキュメント

---

**🎉 設定が完了したら `npm start` でアプリを起動できます！**
