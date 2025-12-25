# 🔐 Render 環境変数設定ガイド

## ⚠️ 重要：環境変数のキー名は一字一句正確に入力してください

環境変数のキー名（左側）が1文字でも違うと、アプリが起動しません。
以下のリストをコピー＆ペーストして使用してください。

---

## ✅ 必須の環境変数（必ず設定してください）

### 1. GEMINI_API_KEY
```
キー名（正確にコピー）: GEMINI_API_KEY
値: あなたのGemini APIキー（AIzaSy で始まる文字列）
```

### 2. MONGODB_URI
```
キー名（正確にコピー）: MONGODB_URI
値: あなたのMongoDB接続文字列（mongodb+srv:// で始まる文字列）
```

### 3. MONGODB_DB_NAME
```
キー名（正確にコピー）: MONGODB_DB_NAME
値: rockman_memory
```

### 4. NODE_ENV
```
キー名（正確にコピー）: NODE_ENV
値: production
```

### 5. PORT
```
キー名（正確にコピー）: PORT
値: 3000
```

### 6. SESSION_SECRET
```
キー名（正確にコピー）: SESSION_SECRET
値: ランダムな文字列（例: my_super_secret_key_12345_change_this）
```

### 7. CASTOFF_PASSWORD
```
キー名（正確にコピー）: CASTOFF_PASSWORD
値: 214200
```

### 8. ALLOWED_ORIGINS
```
キー名（正確にコピー）: ALLOWED_ORIGINS
値: https://p69real-rockman.onrender.com
（※ サービス名を変更した場合は、それに合わせて変更）
```

### 9. NEWS_SCHEDULE_HOURS
```
キー名（正確にコピー）: NEWS_SCHEDULE_HOURS
値: 9,12,15,18
```

### 10. LOG_LEVEL
```
キー名（正確にコピー）: LOG_LEVEL
値: info
```

### 11. TZ
```
キー名（正確にコピー）: TZ
値: Asia/Tokyo
```

---

## 📱 オプションの環境変数（使う機能がある場合のみ設定）

### LINE API（LINE送信機能を使う場合）

#### LINE_CHANNEL_ACCESS_TOKEN
```
キー名（正確にコピー）: LINE_CHANNEL_ACCESS_TOKEN
値: あなたのLINEチャネルアクセストークン
```

#### LINE_CHANNEL_SECRET
```
キー名（正確にコピー）: LINE_CHANNEL_SECRET
値: あなたのLINEチャネルシークレット
```

---

### Slack API（Slack送信機能を使う場合）

#### SLACK_BOT_TOKEN
```
キー名（正確にコピー）: SLACK_BOT_TOKEN
値: あなたのSlack Botトークン（xoxb- で始まる）
```

#### SLACK_SIGNING_SECRET
```
キー名（正確にコピー）: SLACK_SIGNING_SECRET
値: あなたのSlackシークレット
```

---

### X (Twitter) API（X投稿機能を使う場合）

#### X_API_KEY
```
キー名（正確にコピー）: X_API_KEY
値: あなたのX APIキー
```

#### X_API_SECRET
```
キー名（正確にコピー）: X_API_SECRET
値: あなたのX APIシークレット
```

#### X_ACCESS_TOKEN
```
キー名（正確にコピー）: X_ACCESS_TOKEN
値: あなたのXアクセストークン
```

#### X_ACCESS_SECRET
```
キー名（正確にコピー）: X_ACCESS_SECRET
値: あなたのXアクセスシークレット
```

#### X_BEARER_TOKEN
```
キー名（正確にコピー）: X_BEARER_TOKEN
値: あなたのXベアラートークン
```

---

### 駅すぱあと API（ルート検索機能を使う場合）

#### EKISPERT_API_KEY
```
キー名（正確にコピー）: EKISPERT_API_KEY
値: あなたの駅すぱあと API フリープラン環境のアクセスキー
```

#### EKISPERT_ROUTE_MAP_KEY
```
キー名（正確にコピー）: EKISPERT_ROUTE_MAP_KEY
値: あなたの駅すぱあと路線図 フリープラン環境のアクセスキー
```

---

## 📋 Render での設定手順

### 1. Render ダッシュボードを開く

https://dashboard.render.com にアクセス

### 2. Web Service を選択

作成したサービス（p69real-rockman）をクリック

### 3. Environment タブを開く

左メニューから「Environment」をクリック

### 4. 環境変数を追加

「Add Environment Variable」をクリックして、以下のように入力：

1. **Key（キー）**: 上記のリストから**正確にコピー**
2. **Value（値）**: 対応する値を入力

例：
```
Key:   GEMINI_API_KEY
Value: AIzaSyBxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### 5. 保存

「Save Changes」をクリック
→ 自動的に再デプロイされます

---

## ❌ よくある間違い

### 間違い例

| ❌ 間違い | ✅ 正しい |
|---------|---------|
| `gemini_api_key` | `GEMINI_API_KEY` |
| `GeminiApiKey` | `GEMINI_API_KEY` |
| `GEMINI_APIKEY` | `GEMINI_API_KEY` |
| `mongodb_uri` | `MONGODB_URI` |
| `MongodbUri` | `MONGODB_URI` |
| `MONGO_URI` | `MONGODB_URI` |
| `lineChannelAccessToken` | `LINE_CHANNEL_ACCESS_TOKEN` |
| `slackBotToken` | `SLACK_BOT_TOKEN` |

---

## ✅ 設定確認チェックリスト

必須項目（必ず設定）:
- [ ] `GEMINI_API_KEY`
- [ ] `MONGODB_URI`
- [ ] `MONGODB_DB_NAME`
- [ ] `NODE_ENV`
- [ ] `PORT`
- [ ] `SESSION_SECRET`
- [ ] `CASTOFF_PASSWORD`
- [ ] `ALLOWED_ORIGINS`
- [ ] `NEWS_SCHEDULE_HOURS`
- [ ] `LOG_LEVEL`
- [ ] `TZ`

オプション項目（使う機能がある場合）:
- [ ] `LINE_CHANNEL_ACCESS_TOKEN`
- [ ] `LINE_CHANNEL_SECRET`
- [ ] `SLACK_BOT_TOKEN`
- [ ] `SLACK_SIGNING_SECRET`
- [ ] `X_API_KEY`
- [ ] `X_API_SECRET`
- [ ] `X_ACCESS_TOKEN`
- [ ] `X_ACCESS_SECRET`
- [ ] `X_BEARER_TOKEN`
- [ ] `EKISPERT_API_KEY`
- [ ] `EKISPERT_ROUTE_MAP_KEY`

---

## 🆘 トラブルシューティング

### アプリが起動しない場合

1. **環境変数のキー名を確認**
   - 大文字・小文字が正確か
   - アンダースコア `_` の位置が正確か
   - スペースが入っていないか

2. **必須の環境変数が全て設定されているか確認**
   - 上記のチェックリストを使用

3. **値が正しいか確認**
   - GEMINI_API_KEY: `AIzaSy` で始まる
   - MONGODB_URI: `mongodb+srv://` で始まる
   - PORT: `3000`（数字のみ）

4. **Render のログを確認**
   - 左メニュー「Logs」から詳細なエラーを確認

---

## 💡 コピー用テンプレート

以下をコピーして、値の部分だけ変更してください：

```
GEMINI_API_KEY=ここにあなたのGemini APIキー
MONGODB_URI=ここにあなたのMongoDB URI
MONGODB_DB_NAME=rockman_memory
NODE_ENV=production
PORT=3000
SESSION_SECRET=ここにランダムな文字列
CASTOFF_PASSWORD=214200
ALLOWED_ORIGINS=https://p69real-rockman.onrender.com
NEWS_SCHEDULE_HOURS=9,12,15,18
LOG_LEVEL=info
TZ=Asia/Tokyo
```

---

**🎉 全ての環境変数を設定したら、デプロイが自動で開始されます！**
