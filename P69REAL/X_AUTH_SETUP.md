# 🔗 X アカウント連携機能 設定ガイド

## 📝 概要

このガイドでは、P69REALにXアカウント連携機能を追加するための設定方法を説明します。

**機能:**
- エージェント起動時にX連携ボタンを表示
- ボタンをクリックするとX認証画面に遷移
- 認証完了後、自動的にアプリ画面に戻る
- 連携状態を保持（セッション）

---

## 🚀 実装内容

### 追加されたファイル

1. **public/index.html** - X連携ボタンの追加
2. **public/css/style.css** - X連携ボタンのスタイル
3. **public/js/app.js** - X連携の処理ロジック
4. **server/server.js** - OAuth 2.0認証エンドポイント

### エンドポイント

- `GET /api/x/status` - X連携状態の確認
- `GET /auth/x` - OAuth認証開始（X認証画面にリダイレクト）
- `GET /auth/x/callback` - OAuth認証コールバック（認証完了後の処理）

---

## 🔑 X Developer Portal での設定

### ステップ1: X Developer Portalにアクセス

1. https://developer.twitter.com/ にアクセス
2. X（Twitter）アカウントでログイン
3. 「Developer Portal」を開く

---

### ステップ2: アプリを作成（または既存アプリを選択）

#### 新規作成の場合:

1. 「+ Create Project」をクリック
2. プロジェクト名を入力（例: `P69REAL`）
3. 用途を選択（例: `Making a bot`）
4. アプリ名を入力（例: `P69REAL AI Secretary`）

#### 既存アプリを使用する場合:

1. ダッシュボードから既存のアプリを選択
2. 「Settings」タブを開く

---

### ステップ3: OAuth 2.0を有効化

1. アプリの **Settings** タブを開く
2. 下にスクロールして **User authentication settings** を探す
3. 「Set up」または「Edit」ボタンをクリック

#### OAuth 2.0 の設定:

**1. App permissions（アプリの権限）:**
```
✅ Read
✅ Write
```

**2. Type of App（アプリの種類）:**
```
✅ Web App, Automated App or Bot
```

**3. App info（アプリ情報）:**

| 項目 | 値 |
|------|-----|
| **Callback URI / Redirect URL** | `http://localhost:3000/auth/x/callback` |
| **Website URL** | `http://localhost:3000` |

⚠️ **本番環境（Render）の場合:**
- Callback URI: `https://your-app.onrender.com/auth/x/callback`
- Website URL: `https://your-app.onrender.com`

**4. Save（保存）:**
- 「Save」ボタンをクリック

---

### ステップ4: Client IDとClient Secretを取得

1. 設定を保存すると、以下が表示されます:
   - **Client ID** - OAuth 2.0 クライアントID
   - **Client Secret** - OAuth 2.0 クライアントシークレット

2. **重要:** Client Secretは一度しか表示されないので、必ずコピーして保存してください

3. もしClient Secretを忘れた場合:
   - 「Regenerate」ボタンで再生成できます
   - ただし、古いシークレットは無効になります

---

## 🔧 .env ファイルへの設定

### ローカル環境

`.env` ファイルに以下を追加:

```env
# -----------------------------------------------
# X OAuth 2.0（Xアカウント連携機能）
# -----------------------------------------------

# Client ID（クライアントID）
X_CLIENT_ID=your_client_id_here

# Client Secret（クライアントシークレット）
X_CLIENT_SECRET=your_client_secret_here

# Callback URL（コールバックURL）
X_CALLBACK_URL=http://localhost:3000/auth/x/callback
```

#### 実際の記載例:

取得したキーが以下の場合:
- Client ID: `R2g3ZEhJYmNkZWZn`
- Client Secret: `abc123def456ghi789`

```env
X_CLIENT_ID=R2g3ZEhJYmNkZWZn
X_CLIENT_SECRET=abc123def456ghi789
X_CALLBACK_URL=http://localhost:3000/auth/x/callback
```

---

### Render環境

Renderダッシュボードで Environment Variables に以下を追加:

#### 1. X_CLIENT_ID
```
キー: X_CLIENT_ID
値: （あなたのClient ID）
```

#### 2. X_CLIENT_SECRET
```
キー: X_CLIENT_SECRET
値: （あなたのClient Secret）
```

#### 3. X_CALLBACK_URL
```
キー: X_CALLBACK_URL
値: https://your-app.onrender.com/auth/x/callback
```

⚠️ **重要:** `your-app` の部分は実際のRenderアプリ名に置き換えてください

---

## 🧪 動作確認

### ローカル環境でテスト

1. **サーバーを起動:**
   ```bash
   npm start
   ```

2. **ブラウザでアクセス:**
   ```
   http://localhost:3000
   ```

3. **X連携ボタンをクリック:**
   - 左上に「X連携」ボタンが表示される
   - クリックするとX認証画面に遷移

4. **X認証を実施:**
   - Xアカウントでログイン
   - アプリの権限を承認

5. **自動的に戻る:**
   - 「X連携完了」画面が表示される
   - 2秒後に自動的にアプリに戻る
   - ボタンが「連携済」に変わる

---

### 本番環境（Render）でテスト

1. **Renderにデプロイ:**
   - GitHubにプッシュ
   - Renderが自動デプロイ

2. **X Developer Portalでコールバック URLを更新:**
   - Callback URI: `https://your-app.onrender.com/auth/x/callback`
   - Website URL: `https://your-app.onrender.com`

3. **Renderの Environment Variables を設定:**
   - X_CLIENT_ID
   - X_CLIENT_SECRET
   - X_CALLBACK_URL

4. **デプロイされたURLにアクセス:**
   ```
   https://your-app.onrender.com
   ```

5. **X連携をテスト:**
   - 左上の「X連携」ボタンをクリック
   - X認証を実施
   - 自動的にアプリに戻る

---

## 🔍 トラブルシューティング

### エラー: `X_CLIENT_ID が設定されていません`

**原因:** 環境変数が設定されていない

**解決方法:**
1. `.env` ファイルに `X_CLIENT_ID=...` を追加
2. サーバーを再起動
   ```bash
   npm start
   ```

---

### エラー: `トークン取得失敗`

**原因:** Client IDまたはClient Secretが間違っている

**解決方法:**
1. X Developer Portalで Client IDとClient Secretを再確認
2. `.env` ファイルに正しい値を設定
3. サーバーを再起動

---

### エラー: `redirect_uri_mismatch`

**原因:** コールバックURLが一致していない

**解決方法:**
1. X Developer Portalで設定したコールバックURLを確認:
   ```
   ローカル: http://localhost:3000/auth/x/callback
   本番: https://your-app.onrender.com/auth/x/callback
   ```

2. `.env` ファイルまたはRenderの環境変数で `X_CALLBACK_URL` を確認

3. 両方が完全に一致していることを確認（末尾のスラッシュに注意）

---

### エラー: `認証コードまたはcode_verifierが見つかりません`

**原因:** セッションが保存されていない

**解決方法:**
1. `.env` ファイルに `SESSION_SECRET` を追加:
   ```env
   SESSION_SECRET=your_random_secret_string_here
   ```

2. サーバーを再起動

---

### 連携ボタンが表示されない

**原因:** JavaScriptエラーまたはDOM要素の読み込み失敗

**解決方法:**
1. ブラウザのコンソールを開く（F12キー）
2. エラーメッセージを確認
3. キャッシュをクリアして再読み込み（Ctrl+Shift+R / Cmd+Shift+R）

---

## 🔒 セキュリティに関する注意事項

### 1. Client Secretの管理

- **絶対に公開しない:** Client Secretは絶対にGitHubにコミットしないでください
- **.env ファイルは .gitignore に含まれています**
- Renderでは Environment Variables に設定

### 2. コールバックURLの制限

- X Developer Portalで設定したURLのみ有効
- 本番環境では必ずHTTPSを使用
- ローカル開発ではHTTPも可

### 3. スコープの最小化

- 必要最小限のスコープのみ要求:
  - `tweet.read` - ツイート読み取り
  - `tweet.write` - ツイート投稿
  - `users.read` - ユーザー情報読み取り
  - `offline.access` - リフレッシュトークン取得

---

## 📊 環境変数一覧（X連携関連）

| 環境変数名 | 説明 | 必須 | 例 |
|-----------|------|------|-----|
| `X_CLIENT_ID` | OAuth 2.0 クライアントID | ✅ はい | `R2g3ZEhJYmNkZWZn` |
| `X_CLIENT_SECRET` | OAuth 2.0 クライアントシークレット | ✅ はい | `abc123def456ghi789` |
| `X_CALLBACK_URL` | OAuth 2.0 コールバックURL | ✅ はい | `http://localhost:3000/auth/x/callback` |

---

## 🎨 UI/UX

### X連携ボタン

- **位置:** 画面左上
- **未連携時:** 「X連携」と表示
- **連携済み時:** 「連携済」と表示（青色）
- **スタイル:** スケルトンデザイン（半透明背景）

### 認証フロー

1. ユーザーが「X連携」ボタンをクリック
2. X認証ページにリダイレクト
3. ユーザーがXアカウントでログイン＆承認
4. 「X連携完了」画面が表示（チェックマークアニメーション）
5. 2秒後に自動的にアプリに戻る
6. ボタンが「連携済」に変わる

---

## 📖 参考リンク

- **X Developer Portal:** https://developer.twitter.com/
- **X API Documentation:** https://developer.twitter.com/en/docs
- **OAuth 2.0 Guide:** https://developer.twitter.com/en/docs/authentication/oauth-2-0

---

## ✅ チェックリスト

### ローカル環境

- [ ] X Developer Portalでアプリを作成
- [ ] OAuth 2.0を有効化
- [ ] Client IDとClient Secretを取得
- [ ] `.env` ファイルに設定を追加
- [ ] サーバーを起動（`npm start`）
- [ ] X連携ボタンが表示される
- [ ] 連携をテスト

### 本番環境（Render）

- [ ] X Developer PortalでコールバックURLを本番URLに変更
- [ ] RenderのEnvironment Variablesに設定
- [ ] Renderにデプロイ
- [ ] デプロイされたURLでX連携をテスト

---

**🎉 これでXアカウント連携機能の設定は完了です！**

わからないことがあれば、トラブルシューティングセクションを確認してください。
