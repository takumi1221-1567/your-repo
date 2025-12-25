# ❌ MongoDB 接続エラー 解決ガイド

## 🔍 エラー内容

```
❌ MongoDB 接続エラー: MongoNetworkTimeoutError: connection 1 to 159.143.223.156:27017 timeout
```

---

## 📊 原因分析

このエラーは、MongoDBサーバーへの接続がタイムアウトしたことを示しています。

**エラーから分かること：**
- 接続先IP: `159.143.223.156`
- ポート: `27017`（MongoDBのデフォルトポート）
- 問題: 接続がタイムアウトした

---

## 🔧 解決方法（優先順）

### ✅ 解決方法1: MongoDB Atlas のネットワークアクセス設定を確認

**最も可能性の高い原因です。**

#### 手順：

1. **MongoDB Atlas にログイン**
   - https://cloud.mongodb.com/

2. **クラスターを選択**
   - 使用しているクラスターをクリック

3. **Network Access を確認**
   - 左メニュー「Network Access」をクリック

4. **IPアドレスを追加**

   **オプション1: すべてのIPを許可（開発用）**
   ```
   IP Address: 0.0.0.0/0
   ```
   ⚠️ 本番環境では推奨しません

   **オプション2: Renderの IP を追加（本番用）**
   - Renderのログでサーバーの IP を確認
   - その IP を追加

5. **「Add IP Address」をクリック**

6. **数分待ってから再度接続**

---

### ✅ 解決方法2: 接続文字列を確認

MongoDB Atlas の接続文字列は `mongodb+srv://` で始まる必要があります。

#### 正しい形式：

```env
MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
```

#### 間違った形式：

```env
# ❌ mongodb:// で始まっている（srv がない）
MONGODB_URI=mongodb://username:password@159.143.223.156:27017/

# ❌ IPアドレス直接指定
MONGODB_URI=mongodb://159.143.223.156:27017/dbname
```

#### 確認方法：

1. MongoDB Atlas にログイン
2. クラスターの「Connect」をクリック
3. 「Connect your application」を選択
4. 接続文字列をコピー
5. `<password>` を実際のパスワードに置き換える

**正しい例：**
```env
MONGODB_URI=mongodb+srv://myuser:mypassword123@cluster0.abc12.mongodb.net/?retryWrites=true&w=majority
```

---

### ✅ 解決方法3: パスワードを確認

パスワードに特殊文字が含まれている場合、URLエンコードが必要です。

#### 問題のある文字：

```
@ # $ % ^ & * ( ) + = [ ] { } | \ : ; " ' < > , . ? /
```

#### 解決方法：

**オプション1: パスワードを変更**
- MongoDB Atlas でパスワードを変更
- 英数字のみのパスワードにする

**オプション2: URLエンコード**
- 特殊文字をエンコードする

例：
```
パスワード: p@ssw0rd!
エンコード後: p%40ssw0rd%21
```

エンコードツール: https://www.urlencoder.org/

---

### ✅ 解決方法4: MongoDB クラスターが起動しているか確認

#### 手順：

1. MongoDB Atlas にログイン
2. クラスターのステータスを確認
3. 「Paused」や「Stopped」になっていないか確認
4. もし停止していたら、「Resume」をクリック

---

### ✅ 解決方法5: タイムアウト設定を追加

接続時のタイムアウトを延長します。

#### mongodbClient.js を更新：

現在のコード（39-42行目）:
```javascript
client = new MongoClient(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
});
```

**修正後：**
```javascript
client = new MongoClient(MONGODB_URI, {
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
    connectTimeoutMS: 10000
});
```

⚠️ `useNewUrlParser` と `useUnifiedTopology` は非推奨なので削除

---

### ✅ 解決方法6: データベース名を確認

#### 手順：

1. `.env` ファイルを確認
   ```env
   MONGODB_DB_NAME=rockman_memory
   ```

2. MongoDB Atlas でデータベースが存在するか確認
   - 「Browse Collections」をクリック
   - データベースが表示されるか確認

3. 存在しない場合は自動作成されるので問題なし

---

## 🚀 修正したコードをデプロイ

### mongodbClient.js の修正版

```javascript
// 39-42行目を以下に変更
client = new MongoClient(MONGODB_URI, {
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
    connectTimeoutMS: 10000
});
```

---

## 📋 チェックリスト

### ローカル環境

- [ ] `.env` ファイルに `MONGODB_URI` が設定されている
- [ ] 接続文字列が `mongodb+srv://` で始まっている
- [ ] `<password>` を実際のパスワードに置き換えた
- [ ] MongoDB Atlas の Network Access で `0.0.0.0/0` を許可
- [ ] パスワードに特殊文字がない（またはURLエンコード済み）

### Render環境

- [ ] Environment Variables に `MONGODB_URI` を設定
- [ ] 接続文字列が正しい
- [ ] MongoDB Atlas の Network Access で `0.0.0.0/0` を許可

---

## 🧪 接続テスト方法

### 1. ローカルでテスト

```bash
# サーバーを起動
npm start

# ログを確認
# 成功の場合:
# ✅ MongoDB 接続成功: rockman_memory.memories

# 失敗の場合:
# ❌ MongoDB 接続エラー: MongoNetworkTimeoutError...
```

### 2. 接続確認API

```bash
# サーバー起動後、以下にアクセス
curl http://localhost:3000/api/health

# または
# ブラウザで http://localhost:3000/api/health を開く
```

---

## 🆘 それでも解決しない場合

### 詳細ログを確認

```bash
# .env ファイルに追加
LOG_LEVEL=debug

# サーバーを再起動してログを確認
npm start
```

### MongoDB Atlas サポートに問い合わせ

1. MongoDB Atlas にログイン
2. 右下のチャットアイコンをクリック
3. 「Connection issues」を選択
4. エラーメッセージを送信

---

## 📖 参考情報

### MongoDB Atlas 接続文字列の取得方法

1. https://cloud.mongodb.com/ にログイン
2. クラスターの「Connect」をクリック
3. 「Connect your application」を選択
4. Driver: `Node.js`、Version: `4.1 or later` を選択
5. 接続文字列をコピー
6. `<password>` を実際のパスワードに置き換える

### 接続文字列の例

```
mongodb+srv://myusername:mypassword@cluster0.abc12.mongodb.net/?retryWrites=true&w=majority
```

構成要素:
- `myusername`: MongoDB ユーザー名
- `mypassword`: パスワード
- `cluster0.abc12.mongodb.net`: クラスターのホスト名
- `?retryWrites=true&w=majority`: オプション

---

## ✅ 最も可能性の高い解決方法

**99%の確率でこれで解決します：**

### MongoDB Atlas の Network Access を設定

1. https://cloud.mongodb.com/ にログイン
2. 左メニュー「Network Access」
3. 「Add IP Address」
4. 「Allow Access from Anywhere」を選択
5. IP Address: `0.0.0.0/0` が自動入力される
6. 「Confirm」をクリック
7. **3〜5分待つ**（設定が反映されるまで時間がかかる）
8. サーバーを再起動
9. 再度接続を試す

---

**🎉 これで MongoDB 接続エラーは解決するはずです！**
