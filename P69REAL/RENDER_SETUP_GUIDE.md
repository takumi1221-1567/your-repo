# 🚀 Render デプロイ設定ガイド（完全版）

## ⚠️ 重要：GitHubの構成について

現在、GitHubリポジトリは以下の構成になっています：

```
your-repo/（ルート）
├── package.json
├── server/
├── public/
├── render.yaml
└── その他のファイル
```

**P69REALフォルダはありません**ので、Root Directoryは**空欄**にしてください。

---

## 📋 Render 初期設定画面での入力

### 1️⃣ リポジトリ選択

GitHubから `takumi1221-1567/your-repo` を選択して「Connect」

---

### 2️⃣ Web Service 設定

以下の通り、**正確に**入力してください：

| 項目 | 入力内容 | 備考 |
|------|---------|------|
| **Name** | `p69real-rockman` | サービス名（自由に変更可） |
| **Root Directory** | **空欄のまま** | ⭐最重要！何も入力しない |
| **Environment** | `Node` | ドロップダウンから選択 |
| **Region** | `Singapore` | 日本に最も近い |
| **Branch** | `main` | デフォルト |
| **Build Command** | `npm install` | そのまま |
| **Start Command** | `npm start` | そのまま |
| **Instance Type** | `Free` | 無料プランを選択 |

---

### ⚠️ Root Directory について

**間違い例：**
- ❌ `P69REAL`
- ❌ `/`
- ❌ `./`

**正しい：**
- ✅ **空欄のまま**（何も入力しない）

理由：GitHubリポジトリのルートに直接ファイルが配置されているため

---

## 🔐 環境変数設定

「Advanced」ボタンをクリックして、以下の環境変数を追加してください。

### ✅ 必須の環境変数（11個）

環境変数のキー名（左側）は**一字一句正確に**コピー＆ペーストしてください。
大文字・小文字、アンダースコアの位置が1つでも違うとアプリが起動しません。

---

#### 1. GEMINI_API_KEY
```
キー: GEMINI_API_KEY
値: （あなたのGemini APIキー - AIzaSy で始まる）
```

#### 2. MONGODB_URI
```
キー: MONGODB_URI
値: （あなたのMongoDB接続文字列 - mongodb+srv:// で始まる）
```

#### 3. MONGODB_DB_NAME
```
キー: MONGODB_DB_NAME
値: rockman_memory
```

#### 4. NODE_ENV
```
キー: NODE_ENV
値: production
```

#### 5. PORT
```
キー: PORT
値: 3000
```

#### 6. SESSION_SECRET
```
キー: SESSION_SECRET
値: my_super_secret_key_12345_change_this
```
※ ランダムな文字列に変更推奨

#### 7. CASTOFF_PASSWORD
```
キー: CASTOFF_PASSWORD
値: 214200
```

#### 8. ALLOWED_ORIGINS
```
キー: ALLOWED_ORIGINS
値: https://p69real-rockman.onrender.com
```
※ サービス名を変更した場合は、それに合わせて変更

#### 9. NEWS_SCHEDULE_HOURS
```
キー: NEWS_SCHEDULE_HOURS
値: 9,12,15,18
```

#### 10. LOG_LEVEL
```
キー: LOG_LEVEL
値: info
```

#### 11. TZ
```
キー: TZ
値: Asia/Tokyo
```

---

### 📱 オプションの環境変数

使う機能がある場合のみ設定してください。

#### LINE API
```
キー: LINE_CHANNEL_ACCESS_TOKEN
値: （あなたのLINEチャネルアクセストークン）

キー: LINE_CHANNEL_SECRET
値: （あなたのLINEチャネルシークレット）
```

#### Slack API
```
キー: SLACK_BOT_TOKEN
値: （あなたのSlack Botトークン - xoxb- で始まる）

キー: SLACK_SIGNING_SECRET
値: （あなたのSlackシークレット）
```

#### X (Twitter) API
```
キー: X_API_KEY
値: （あなたのX APIキー）

キー: X_API_SECRET
値: （あなたのX APIシークレット）

キー: X_ACCESS_TOKEN
値: （あなたのXアクセストークン）

キー: X_ACCESS_SECRET
値: （あなたのXアクセスシークレット）

キー: X_BEARER_TOKEN
値: （あなたのXベアラートークン）
```

#### 駅すぱあと API
```
キー: EKISPERT_API_KEY
値: （あなたの駅すぱあと API フリープラン環境のアクセスキー）

キー: EKISPERT_ROUTE_MAP_KEY
値: （あなたの駅すぱあと路線図 フリープラン環境のアクセスキー）
```

---

## 💡 コピー用テンプレート

以下をメモ帳などにコピーして、値を入力してから Render に貼り付けると便利です：

```
GEMINI_API_KEY=ここにあなたのGemini APIキー
MONGODB_URI=ここにあなたのMongoDB URI
MONGODB_DB_NAME=rockman_memory
NODE_ENV=production
PORT=3000
SESSION_SECRET=my_super_secret_key_12345_change_this
CASTOFF_PASSWORD=214200
ALLOWED_ORIGINS=https://p69real-rockman.onrender.com
NEWS_SCHEDULE_HOURS=9,12,15,18
LOG_LEVEL=info
TZ=Asia/Tokyo
```

---

## ✅ 設定完了後

1. 「Create Web Service」ボタンをクリック
2. 自動的にビルド＆デプロイが開始されます
3. ログを確認してエラーがないかチェック

---

## 🔍 デプロイ確認

デプロイ成功後、以下のURLにアクセスして確認：

```
https://p69real-rockman.onrender.com/api/health
```

正常なら以下のようなレスポンス：
```json
{
  "status": "ok",
  "timestamp": "2025-12-25T..."
}
```

---

## ❌ よくある間違いとエラー

### 1. Root Directory に P69REAL を入力してしまった

**エラー：**
```
Error: Cannot find module '/opt/render/project/src/P69REAL/server/server.js'
```

**解決方法：**
- Root Directory を**空欄**に戻す
- Settings → Root Directory → 空欄にして Save

---

### 2. 環境変数のキー名が違う

**エラー：**
```
⚠️ GEMINI_API_KEY が設定されていません
```

**よくある間違い：**
- `gemini_api_key` （小文字）
- `GeminiApiKey` （キャメルケース）
- `GEMINI_APIKEY` （アンダースコアなし）

**正しい：**
- `GEMINI_API_KEY` （全て大文字、アンダースコアあり）

---

### 3. ビルドエラー

**エラー：**
```
npm error code ETARGET
npm error notarget No matching version found
```

**解決方法：**
- package.jsonが最新版になっているか確認
- Renderで「Manual Deploy」→「Clear build cache & deploy」を試す

---

## 📊 更新された依存関係

以下のパッケージが最新版に更新されました：

| パッケージ | 旧バージョン | 新バージョン |
|-----------|------------|------------|
| `@google/generative-ai` | ^0.2.1 | **^0.14.1** |
| `express` | ^4.18.2 | **^4.19.2** |
| `express-session` | ^1.17.3 | **^1.18.0** |
| `mongodb` | ^6.3.0 | **^6.8.0** |
| `axios` | ^1.6.5 | **^1.7.2** |
| `twitter-api-v2` | ^1.16.1 | **^1.24.0** |
| `dotenv` | ^16.4.1 | **^16.4.5** |

新規追加：
- `connect-mongo`: ^5.1.0
- `form-data`: ^4.0.0

---

## 🆘 トラブルシューティング

### デプロイが失敗する場合

1. **ログを確認**
   - Render Dashboard → Logs
   - エラーメッセージを確認

2. **環境変数を再確認**
   - Environment タブで全ての必須変数が設定されているか
   - キー名が正確か（大文字・小文字、アンダースコア）

3. **キャッシュをクリア**
   - Manual Deploy → Clear build cache & deploy

4. **Node バージョン確認**
   - package.json で Node 18以上を指定済み
   - Renderは自動的に適切なバージョンを使用

---

## 📞 サポート

わからないことがあれば、以下を確認してください：

1. `README.md` - プロジェクト全体の説明
2. `ENV_SETUP_GUIDE.md` - .envファイルの設定
3. `RENDER_ENV_VARIABLES.md` - 環境変数の詳細
4. このファイル - Renderデプロイの完全ガイド

---

**🎉 設定が完了したら、自動でデプロイが開始されます！**
