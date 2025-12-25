# 🤖 Gemini モデル選択ガイド

## 📊 利用可能なモデル

### 1. gemini-2.5-flash（最新・推奨）

**特徴:**
- 最新のGemini 2.5モデル
- 高速で高性能
- 本番環境でも使用可能

**推奨用途:**
- すべての用途に推奨
- チャットボット
- リアルタイム応答
- 本番環境

**料金:**
- 競争力のある価格（詳細は公式サイト参照）

---

### 2. gemini-1.5-flash（安定版・高速）

**特徴:**
- 安定版の高速モデル
- 本番環境に最適
- コストパフォーマンスが高い

**推奨用途:**
- チャットボット
- リアルタイム応答
- 本番環境

**料金:**
- 入力: $0.075 / 1M tokens
- 出力: $0.30 / 1M tokens

---

### 3. gemini-1.5-pro（安定版・高性能）

**特徴:**
- 最も高性能な安定版モデル
- 複雑な推論に対応
- 長文生成に優れる

**推奨用途:**
- 複雑なタスク
- 高精度が必要な場合
- 長文生成

**料金:**
- 入力: $1.25 / 1M tokens
- 出力: $5.00 / 1M tokens

---

## 🔧 モデルの変更方法

### 方法1: 環境変数で指定（推奨）

#### ローカル環境（.env ファイル）

```env
GEMINI_MODEL_NAME=gemini-2.5-flash
```

#### Render環境（Environment Variables）

1. Renderダッシュボードを開く
2. Environment タブを選択
3. 新しい環境変数を追加:
   ```
   キー: GEMINI_MODEL_NAME
   値: gemini-2.5-flash
   ```

---

### 方法2: コードで直接変更

`server/modules/geminiClient.js` の13行目を編集:

```javascript
const MODEL_NAME = process.env.GEMINI_MODEL_NAME || 'gemini-2.5-flash';
```

デフォルト値を変更:

```javascript
const MODEL_NAME = process.env.GEMINI_MODEL_NAME || 'gemini-2.5-flash';
```

---

## 🧪 モデルのテスト方法

### 1. サーバーを起動

```bash
npm start
```

### 2. ログを確認

起動時に以下のログが表示されます:

```
✅ Gemini API クライアント初期化完了 (モデル: gemini-2.5-flash)
```

### 3. チャット機能をテスト

1. アプリにアクセス
2. メッセージを送信
3. 応答速度と品質を確認

---

## 📊 モデル比較表

| モデル名 | バージョン | 速度 | 精度 | 料金 | 安定性 | 推奨 |
|---------|----------|------|------|------|--------|------|
| gemini-2.5-flash | 2.5 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | 💰💰 | ✅ 安定 | ✅ 最新・推奨 |
| gemini-1.5-flash | 1.5 | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | 💰💰 | ✅ 安定 | ✅ 安定版 |
| gemini-1.5-pro | 1.5 | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | 💰💰💰💰 | ✅ 安定 | 🎯 高精度 |

---

## 🚨 よくあるエラーと解決方法

### エラー1: `models/gemini-pro is not found`

**原因:** 古いモデル名（gemini-pro）が使用されている

**解決方法:**
```env
GEMINI_MODEL_NAME=gemini-2.0-flash-exp
```

---

### エラー2: `models/gemini-3.0-flash is not found`

**原因:** モデル名が間違っている（3.0は存在しない）

**解決方法:**
正しいモデル名を使用:
- `gemini-2.0-flash-exp`（最新実験版）
- `gemini-1.5-flash`（安定版）

---

### エラー3: `Permission denied`

**原因:** APIキーに権限がない

**解決方法:**
1. Google AI Studio（https://ai.google.dev/）でAPIキーを確認
2. 新しいAPIキーを作成
3. `.env` ファイルに設定

---

## 📖 公式ドキュメント

- **Gemini API Documentation:** https://ai.google.dev/docs
- **Model List:** https://ai.google.dev/models/gemini
- **Pricing:** https://ai.google.dev/pricing

---

## 💡 推奨設定

### 本番環境（Render）

```env
GEMINI_MODEL_NAME=gemini-2.5-flash
```

理由:
- 最新で高性能
- 速度と精度のバランスが最適
- 本番環境でも使用可能

### 開発環境（ローカル）

```env
GEMINI_MODEL_NAME=gemini-2.5-flash
```

理由:
- 本番環境と同じモデルでテスト
- 最新機能を利用可能
- 速度が最速

### 高精度が必要な場合

```env
GEMINI_MODEL_NAME=gemini-1.5-pro
```

理由:
- 最も高精度
- 複雑な推論に対応
- 料金は高いが品質最優先

---

## ✅ チェックリスト

### モデル変更時

- [ ] `.env` または Render の Environment Variables に `GEMINI_MODEL_NAME` を設定
- [ ] サーバーを再起動
- [ ] ログでモデル名を確認
- [ ] チャット機能をテスト
- [ ] 応答速度と品質を確認

---

**🎉 これでGeminiモデルの選択と変更が完了です！**
