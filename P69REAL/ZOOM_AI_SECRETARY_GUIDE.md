# 🎧 個人用AI秘書（Zoom会議対応版）使い方ガイド

## 📝 概要

このツールは、Zoom会議中に使用できる個人用AI秘書です。
音声コマンドで起動・終了し、会話中の内容をGemini APIで処理して応答します。

---

## 🚀 セットアップ

### 1. 必要なライブラリのインストール

```bash
pip install pyaudio whisper google-generativeai pyttsx3 numpy
```

#### macOSの場合（PyAudioのインストール）

```bash
# Homebrewでportaudioをインストール
brew install portaudio

# PyAudioをインストール
pip install pyaudio
```

#### Windowsの場合

```bash
# pipで直接インストール
pip install pyaudio
```

### 2. Gemini APIキーの設定

#### 方法1: 環境変数で設定（推奨）

```bash
export GEMINI_API_KEY="your_api_key_here"
```

#### 方法2: ファイル内で直接設定

`zoom_ai_secretary.py` の17行目を編集:

```python
GEMINI_API_KEY = "your_api_key_here"
```

---

## 🎬 使い方

### 1. AI秘書を起動

```bash
python zoom_ai_secretary.py
```

起動すると以下のように表示されます:

```
==================================================
個人用AI秘書 起動中...
==================================================
📝 Whisperモデル（base）をロード中...
✅ Whisperモデル ロード完了
🤖 Gemini API 初期化中...
✅ Gemini API 初期化完了
✅ TTS エンジン 初期化完了

==================================================
✅ AI秘書 起動完了
==================================================

【使い方】
  - 「秘書さん聞いて」と言うと会話開始
  - AI秘書があなたの発話に応答します
  - 「秘書さんありがとう」と言うと会話終了

録音を開始します...
```

### 2. AI秘書を起動（会話開始）

マイクに向かって以下のように言います:

```
「秘書さん聞いて」
```

すると、AI秘書が以下のように応答します:

```
==================================================
🎧 AI秘書: 聞いています（会話開始）
==================================================

🤖 AI秘書: はい、聞いています。
```

### 3. 会話する

AI秘書が起動している間、あなたの発話に応答します:

```
👤 あなた: この会議の要点をまとめてください

🤖 AI秘書: 承知しました。会議の要点は以下の通りです...
```

### 4. AI秘書を終了（会話終了）

会話を終了したい場合:

```
「秘書さんありがとう」
```

すると、AI秘書が待機状態に戻ります:

```
==================================================
💤 AI秘書: 待機中（会話終了）
==================================================

🤖 AI秘書: 了解しました。また呼んでください。
```

### 5. プログラムを終了

```
Ctrl + C
```

---

## 🎙️ Zoom会議での使い方

### 仮想マイクの設定（推奨）

Zoom会議の音声をAI秘書に取り込むには、**仮想マイク**を使用します。

#### 1. 仮想オーディオケーブルをインストール

**Windows:**
- [VB-Audio Virtual Cable](https://vb-audio.com/Cable/)

**macOS:**
- [BlackHole](https://github.com/ExistentialAudio/BlackHole)

```bash
brew install blackhole-2ch
```

#### 2. Zoomの設定

1. Zoom → 設定 → オーディオ
2. スピーカー: 仮想オーディオデバイス（VB-Audio Cable / BlackHole）
3. マイク: 通常のマイク

#### 3. AI秘書のマイク設定

AI秘書が仮想マイクから音声を取得するように設定します。

`zoom_ai_secretary.py` の `record_audio()` 関数を以下のように変更:

```python
stream = self.audio.open(
    format=FORMAT,
    channels=CHANNELS,
    rate=RATE,
    input=True,
    input_device_index=2,  # ← デバイスインデックスを指定
    frames_per_buffer=CHUNK
)
```

デバイスインデックスは以下のコードで確認できます:

```python
import pyaudio
p = pyaudio.PyAudio()
for i in range(p.get_device_count()):
    info = p.get_device_info_by_index(i)
    print(f"{i}: {info['name']}")
```

---

## ⚙️ カスタマイズ

### Whisperモデルの変更

速度と精度のトレードオフを調整できます。

`zoom_ai_secretary.py` の19行目を編集:

```python
WHISPER_MODEL = "base"  # tiny, base, small, medium, large
```

| モデル | 速度 | 精度 | サイズ |
|--------|------|------|--------|
| tiny | ⭐⭐⭐⭐⭐ | ⭐ | 39 MB |
| base | ⭐⭐⭐⭐ | ⭐⭐ | 74 MB |
| small | ⭐⭐⭐ | ⭐⭐⭐ | 244 MB |
| medium | ⭐⭐ | ⭐⭐⭐⭐ | 769 MB |
| large | ⭐ | ⭐⭐⭐⭐⭐ | 1550 MB |

### 無音判定の調整

音声の区切りを調整できます。

`zoom_ai_secretary.py` の27-28行目を編集:

```python
SILENCE_THRESHOLD = 500  # 小さい値 = より敏感に無音判定
SILENCE_DURATION = 2.0   # 無音が続く秒数
```

### System Promptの変更

AI秘書の性格や応答スタイルを変更できます。

`zoom_ai_secretary.py` の218-221行目を編集:

```python
system_prompt = """あなたは個人用のAI秘書です。
Zoom会議に同席し、ユーザーから『秘書さん聞いて』と呼ばれた時のみ応答してください。
回答は簡潔かつ要点のみ述べてください。
日本語で応答してください。"""
```

---

## 🔧 トラブルシューティング

### エラー: `ModuleNotFoundError: No module named 'pyaudio'`

**解決方法:**

```bash
# macOS
brew install portaudio
pip install pyaudio

# Windows
pip install pyaudio

# Linux
sudo apt-get install portaudio19-dev
pip install pyaudio
```

### エラー: `GEMINI_API_KEY が設定されていません`

**解決方法:**

1. Gemini APIキーを取得: https://ai.google.dev/
2. 環境変数に設定:
   ```bash
   export GEMINI_API_KEY="your_api_key_here"
   ```

### マイクが認識されない

**解決方法:**

利用可能なマイクデバイスを確認:

```python
import pyaudio
p = pyaudio.PyAudio()
for i in range(p.get_device_count()):
    info = p.get_device_info_by_index(i)
    print(f"{i}: {info['name']}")
```

### 音声認識の精度が低い

**解決方法:**

1. Whisperモデルを大きいものに変更:
   ```python
   WHISPER_MODEL = "medium"  # または "large"
   ```

2. マイクの音量を上げる

3. 静かな環境で使用する

---

## 📊 使用例

### 例1: 会議の要点まとめ

```
あなた: 「秘書さん聞いて」
AI秘書: 「はい、聞いています。」

あなた: 「今の会議の要点をまとめてください」
AI秘書: 「承知しました。会議の要点は以下の通りです...」

あなた: 「秘書さんありがとう」
AI秘書: 「了解しました。また呼んでください。」
```

### 例2: 用語の説明

```
あなた: 「秘書さん聞いて」
AI秘書: 「はい、聞いています。」

あなた: 「今出てきたKPIって何？」
AI秘書: 「KPIはKey Performance Indicatorの略で、重要業績評価指標のことです...」

あなた: 「秘書さんありがとう」
AI秘書: 「了解しました。また呼んでください。」
```

---

## 📖 仕組み

### 音声認識の流れ

1. **マイク入力** → PyAudioで録音
2. **無音検出** → 発話が終わったら次のステップへ
3. **音声認識** → Whisperでテキスト化
4. **コマンド検出** → 「秘書さん聞いて」「秘書さんありがとう」をチェック
5. **Gemini API** → LISTENING状態の場合のみ送信
6. **応答出力** → printまたはTTSで出力

### 状態遷移

```
[IDLE] ━━「秘書さん聞いて」━━> [LISTENING]
   ↑                                  │
   │                                  │
   └━━━「秘書さんありがとう」━━━━━━━┘
```

---

## 🔒 セキュリティとプライバシー

- **個人利用のみ**: 商用利用を想定していません
- **APIキーの管理**: 環境変数で管理し、コードにハードコードしないこと
- **会話履歴**: プログラム終了時に自動的に破棄されます
- **データ送信**: Gemini APIにのみデータを送信します

---

## 📝 ライセンス

個人利用のみ。商用利用禁止。

---

## 🆘 サポート

問題が発生した場合は、以下を確認してください:

1. すべての必要なライブラリがインストールされているか
2. Gemini APIキーが正しく設定されているか
3. マイクが正しく認識されているか
4. Python 3.7以降を使用しているか

---

**🎉 これでZoom会議用AI秘書の設定は完了です！**
