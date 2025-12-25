# 🧪 ローカルテストガイド

## 動画再生の問題を修正しました

### 🔍 発見した問題

GitHubフォルダ構成を再調査した結果、以下の3つの問題を発見しました：

#### 1. server.js の不要な動画フォルダ設定

**問題：**
```javascript
// 不要な設定（削除済み）
app.use('/videos', express.static(path.join(__dirname, '../videos')));
```

**原因：**
- `../videos` フォルダは存在しない
- 実際の動画は `../public/videos/` にある
- `app.use(express.static(path.join(__dirname, '../public')))` で既に配信されている

**修正：**
- この行を削除
- publicフォルダの設定だけで十分

---

#### 2. videoController.js の動画パスが間違っていた

**問題：**
```javascript
// 間違ったパス
idle: 'public/videos/normal/通常.mp4'
```

**原因：**
- ブラウザからアクセスする際、`public/` プレフィックスは不要
- Express の静的ファイル配信は `public` をルートとして扱う

**修正：**
```javascript
// 正しいパス
idle: '/videos/normal/通常.mp4'
```

---

#### 3. 動画設定APIエンドポイントがなかった

**追加：**
```javascript
app.get('/api/video-config', (req, res) => {
    res.json({
        success: true,
        config: videoConfig
    });
});
```

---

## 📂 正しいフォルダ構成

```
your-repo/（GitHubルート）
├── server/
│   └── server.js
├── public/
│   ├── videos/
│   │   ├── normal/
│   │   │   ├── 通常.mp4 ✅
│   │   │   ├── 喋り.mp4 ✅
│   │   │   ├── キョロ.mp4 ✅
│   │   │   ├── 腕組み.mp4 ✅
│   │   │   └── チェンジ.mp4 ✅
│   │   └── armor/
│   │       ├── 装甲通常.mp4 ✅
│   │       ├── 装甲キョロ.mp4 ✅
│   │       ├── 装甲腕組み.mp4 ✅
│   │       └── キャストオフ.mp4 ✅
│   ├── css/
│   ├── js/
│   └── index.html
└── package.json
```

---

## 🚀 ローカルでテストする方法

### 1. 依存関係のインストール

```bash
cd P69REAL
npm install
```

### 2. .env ファイルを作成

```bash
cp .env.example .env
```

### 3. .env ファイルを編集

最低限、以下の2つを設定：

```env
GEMINI_API_KEY=あなたのGemini APIキー
MONGODB_URI=あなたのMongoDB接続文字列
```

詳しくは `ENV_SETUP_GUIDE.md` を参照してください。

### 4. サーバーを起動

```bash
npm start
```

または開発モード（自動リロード）：

```bash
npm run dev
```

### 5. ブラウザでアクセス

```
http://localhost:3000
```

---

## ✅ 動画が正しく再生されるか確認

### テスト項目

1. **初期表示**
   - [ ] アーマーモードの待機動画（装甲通常.mp4）が再生される
   - [ ] ループ再生される

2. **3秒待機**
   - [ ] 3秒後にランダムでアクション動画が再生される
   - [ ] 装甲キョロ.mp4 または 装甲腕組み.mp4
   - [ ] アクション終了後、待機動画に戻る

3. **キャストオフ**
   - [ ] パスワード「214200」を入力
   - [ ] キャストオフ.mp4 が再生される
   - [ ] 終了後、通常モードの待機動画（通常.mp4）に切り替わる

4. **通常モードの待機アクション**
   - [ ] 3秒後にキョロ.mp4 または 腕組み.mp4 が再生される

5. **チェンジ**
   - [ ] 「チェンジ」と入力
   - [ ] チェンジ.mp4 が再生される
   - [ ] 終了後、アーマーモードの待機動画に戻る

---

## 🔍 デバッグ方法

### 1. ブラウザの開発者ツールを開く

- Chrome/Edge: `F12` または `Cmd+Option+I` (Mac)
- Console タブを確認

### 2. 動画読み込みエラーを確認

以下のようなエラーが表示される場合：

```
❌ 動画読み込みエラー: GET http://localhost:3000/videos/normal/通常.mp4 404 (Not Found)
```

**原因：**
- 動画ファイルが存在しない
- ファイル名が間違っている

**確認方法：**
```bash
ls -la public/videos/normal/
ls -la public/videos/armor/
```

### 3. ネットワークタブで確認

1. 開発者ツールの「Network」タブを開く
2. ページをリロード
3. `通常.mp4` などの動画ファイルを探す
4. ステータスコードを確認：
   - `200 OK` → 成功
   - `404 Not Found` → ファイルが見つからない
   - `403 Forbidden` → アクセス権限エラー

### 4. Console ログを確認

正常な場合：
```
🎬 VideoController 初期化中...
✅ 動画読み込み完了
✅ VideoController 初期化完了
```

エラーがある場合：
```
❌ 動画読み込みエラー: ...
```

---

## 📊 APIエンドポイントのテスト

### 動画設定取得

```bash
curl http://localhost:3000/api/video-config
```

**期待される結果：**
```json
{
  "success": true,
  "config": {
    "normal": {
      "idle": "/videos/normal/通常.mp4",
      "speaking": "/videos/normal/喋り.mp4",
      ...
    },
    "armor": {
      ...
    }
  }
}
```

### ヘルスチェック

```bash
curl http://localhost:3000/api/health
```

**期待される結果：**
```json
{
  "success": true,
  "message": "P69REAL API is running",
  "timestamp": "2025-12-25T..."
}
```

---

## ⚠️ よくあるエラーと解決方法

### エラー1: `Cannot find module '@google/generative-ai'`

**原因：** 依存関係がインストールされていない

**解決方法：**
```bash
npm install
```

---

### エラー2: `GEMINI_API_KEY が設定されていません`

**原因：** .env ファイルがない、または設定が間違っている

**解決方法：**
1. `.env` ファイルを作成
2. `GEMINI_API_KEY=...` を設定

---

### エラー3: 動画が404エラーで読み込めない

**原因：** 動画ファイルが正しい場所にない

**解決方法：**
```bash
# 動画ファイルの確認
ls -la public/videos/normal/
ls -la public/videos/armor/

# 正しい場所に動画を配置
# public/videos/normal/ に通常モードの動画
# public/videos/armor/ にアーマーモードの動画
```

---

### エラー4: 動画パスが間違っている

**確認方法：**
```bash
# ブラウザで直接アクセスしてみる
http://localhost:3000/videos/normal/通常.mp4
```

200 OKが返ってくれば正常です。

---

## 🎯 修正内容のまとめ

| ファイル | 修正内容 |
|---------|---------|
| `server/server.js` | 不要な動画フォルダ設定を削除 |
| `public/js/videoController.js` | 動画パスを `public/videos/...` → `/videos/...` に修正 |
| `server/server.js` | `/api/video-config` エンドポイントを追加 |

---

## ✅ 修正後の動画パス

### ブラウザからアクセスする際のパス

```
/videos/normal/通常.mp4
/videos/normal/喋り.mp4
/videos/normal/キョロ.mp4
/videos/normal/腕組み.mp4
/videos/normal/チェンジ.mp4

/videos/armor/装甲通常.mp4
/videos/armor/装甲キョロ.mp4
/videos/armor/装甲腕組み.mp4
/videos/armor/キャストオフ.mp4
```

### サーバー側のファイルシステムパス

```
public/videos/normal/通常.mp4
public/videos/normal/喋り.mp4
...
```

---

**🎉 これで動画が正常に再生されるはずです！**

問題が解決しない場合は、ブラウザの開発者ツールで詳細なエラーログを確認してください。
