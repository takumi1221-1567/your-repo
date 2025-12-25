# X (Twitter) API 投稿機能 設定ガイド

## 📝 概要

このガイドでは、ロックマンAI秘書からXへ投稿する機能を有効化する手順を説明します。

---

## 🚀 ステップ1: X Developer Portalでアプリを作成

### 1-1. X Developer Portalにアクセス

https://developer.twitter.com/en/portal/dashboard

### 1-2. プロジェクトとアプリを作成

1. **「+ Create Project」**をクリック
2. プロジェクト名を入力（例: `P69REAL`）
3. 用途を選択（例: `Making a bot`）
4. プロジェクトの説明を入力
5. **「+ Add App」**をクリック
6. アプリ名を入力（例: `P69REAL-Bot`）

### 1-3. API KeyとAPI Secretを取得

アプリ作成後、以下が表示されます：

```
API Key: xxxxxxxxxxxxxxxxxxxxx
API Secret: yyyyyyyyyyyyyyyyyyyyyyy
```

**⚠️ この画面は1度しか表示されないので、必ず保存してください！**

---

## 🔑 ステップ2: Access TokenとAccess Token Secretを生成

### 2-1. App Settingsを開く

1. 作成したアプリをクリック
2. 上部の **「Keys and tokens」** タブを選択

### 2-2. Access TokenとSecretを生成

1. **「Access Token and Secret」** セクションで **「Generate」** をクリック
2. 以下が表示されます：

```
Access Token: 1234567890-xxxxxxxxxxxxxxxxx
Access Token Secret: zzzzzzzzzzzzzzzzzzzz
```

**⚠️ この画面も1度しか表示されないので、必ず保存してください！**

---

## 🔧 ステップ3: App Permissionsを設定

### 3-1. 権限を「Read and Write」に変更

1. **「App permissions」** セクションで **「Edit」** をクリック
2. **「Read and Write」** を選択
3. **「Save」** をクリック

**⚠️ 重要**: 権限変更後、Access TokenとSecretを再生成してください！

1. **「Keys and tokens」** タブに戻る
2. **「Access Token and Secret」** の **「Regenerate」** をクリック
3. 新しいトークンを保存

---

## ⚙️ ステップ4: Renderに環境変数を設定

### 4-1. Renderダッシュボードを開く

https://dashboard.render.com/

### 4-2. あなたのサービスを選択

1. P69REALのサービスをクリック
2. 左メニューの **「Environment」** をクリック

### 4-3. 環境変数を追加

以下の4つの環境変数を追加します：

| Key | Value |
|-----|-------|
| `X_API_KEY` | ステップ1で取得したAPI Key |
| `X_API_SECRET` | ステップ1で取得したAPI Secret |
| `X_ACCESS_TOKEN` | ステップ2で取得したAccess Token |
| `X_ACCESS_SECRET` | ステップ2で取得したAccess Token Secret |

**追加方法:**

1. **「Add Environment Variable」** をクリック
2. **Key** に `X_API_KEY` を入力
3. **Value** に取得したAPI Keyを貼り付け
4. **「Save Changes」** をクリック
5. 残りの3つの変数も同様に追加

### 4-4. サービスを再デプロイ

環境変数を保存すると、自動的に再デプロイが開始されます。

---

## ✅ ステップ5: 動作確認

### 5-1. ログを確認

Renderのログに以下が表示されればOK：

```
✅ X (Twitter) API クライアント初期化完了
```

### 5-2. テスト投稿

ロックマンAI秘書に以下のように話しかけてみてください：

```
「Xに投稿して：こんにちは、ロックマンです！」
```

---

## 🔍 トラブルシューティング

### エラー: `⚠️ X API の設定が不足しています`

**原因**: 環境変数が正しく設定されていない

**解決方法**:
1. Renderの環境変数を確認
2. 4つすべての変数が設定されているか確認
3. 値にスペースや余計な文字が入っていないか確認
4. サービスを再デプロイ

### エラー: `403 Forbidden`

**原因**: App Permissionsが「Read and Write」になっていない

**解決方法**:
1. X Developer Portalで権限を確認
2. 「Read and Write」に変更
3. Access TokenとSecretを再生成
4. Renderの環境変数を更新

### エラー: `401 Unauthorized`

**原因**: Access TokenまたはSecretが間違っている

**解決方法**:
1. X Developer PortalでAccess TokenとSecretを再生成
2. Renderの環境変数を更新
3. サービスを再デプロイ

---

## 📚 参考リンク

- X Developer Portal: https://developer.twitter.com/
- Twitter API Documentation: https://developer.twitter.com/en/docs
- twitter-api-v2 (使用ライブラリ): https://github.com/PLhery/node-twitter-api-v2

---

## 🔒 セキュリティ注意事項

- **APIキーとシークレットは絶対に公開しないでください**
- GitHubなどのパブリックリポジトリにコミットしないでください
- 環境変数として安全に管理してください
- 定期的にトークンを再生成することを推奨します

---

**🎉 設定完了！これでロックマンAI秘書からXへ投稿できます！**
