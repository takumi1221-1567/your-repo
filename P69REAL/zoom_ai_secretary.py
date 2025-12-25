#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
=================================================
個人用AI秘書（Zoom会議対応版）
=================================================

【使い方】
1. 必要なライブラリをインストール:
   pip install pyaudio whisper google-generativeai pyttsx3 numpy

2. 環境変数にGemini APIキーを設定:
   export GEMINI_API_KEY="your_api_key_here"

   または、このファイル内の GEMINI_API_KEY を直接編集

3. 実行:
   python zoom_ai_secretary.py

4. 音声コマンド:
   - 「秘書さん聞いて」    → AI秘書を起動（会話開始）
   - 通常の会話           → AI秘書が応答
   - 「秘書さんありがとう」→ AI秘書を終了（会話終了）

【注意】
- 仮想マイク（VB-Audio Virtual Cable等）経由でZoomの音声を取得することを想定
- 実際のマイクデバイス名は環境に応じて変更してください
- Whisperモデルは初回実行時にダウンロードされます（数GB）
"""

import os
import sys
import wave
import time
import threading
import numpy as np
from enum import Enum
from collections import deque

# 音声入出力
import pyaudio

# 音声認識
import whisper

# Gemini API
import google.generativeai as genai

# TTS（音声読み上げ）
try:
    import pyttsx3
    TTS_AVAILABLE = True
except ImportError:
    TTS_AVAILABLE = False
    print("⚠️ pyttsx3がインストールされていません。音声出力は無効です。")

# =================================================
# 設定
# =================================================

# Gemini API キー（環境変数から取得、または直接設定）
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "ここにあなたのGemini APIキーを入力してください")

# Whisper モデル（tiny, base, small, medium, large）
WHISPER_MODEL = "base"  # baseが速度と精度のバランスが良い

# 音声録音設定
RATE = 16000            # サンプリングレート（Hz）
CHUNK = 1024            # バッファサイズ
CHANNELS = 1            # モノラル
FORMAT = pyaudio.paInt16

# 無音判定設定
SILENCE_THRESHOLD = 500  # 無音と判定する音量の閾値
SILENCE_DURATION = 2.0   # 無音が続いたら発話終了と判定する秒数

# 会話履歴の最大保持数
MAX_HISTORY = 10

# =================================================
# 状態管理
# =================================================

class State(Enum):
    """AI秘書の状態"""
    IDLE = "IDLE"              # 待機中（聞いていない）
    LISTENING = "LISTENING"    # 聞いている（会話中）

# =================================================
# AI秘書クラス
# =================================================

class AISecretary:
    def __init__(self):
        """初期化"""
        print("=" * 50)
        print("個人用AI秘書 起動中...")
        print("=" * 50)

        # 状態
        self.state = State.IDLE
        self.conversation_history = []

        # Whisperモデルのロード
        print(f"📝 Whisperモデル（{WHISPER_MODEL}）をロード中...")
        self.whisper_model = whisper.load_model(WHISPER_MODEL)
        print("✅ Whisperモデル ロード完了")

        # Gemini API の初期化
        if GEMINI_API_KEY and GEMINI_API_KEY != "ここにあなたのGemini APIキーを入力してください":
            print("🤖 Gemini API 初期化中...")
            genai.configure(api_key=GEMINI_API_KEY)
            self.gemini_model = genai.GenerativeModel('gemini-2.5-flash')
            print("✅ Gemini API 初期化完了")
        else:
            print("❌ GEMINI_API_KEY が設定されていません")
            sys.exit(1)

        # TTS エンジンの初期化
        self.tts_engine = None
        if TTS_AVAILABLE:
            try:
                self.tts_engine = pyttsx3.init()
                self.tts_engine.setProperty('rate', 150)  # 速度
                self.tts_engine.setProperty('volume', 0.9)  # 音量
                print("✅ TTS エンジン 初期化完了")
            except Exception as e:
                print(f"⚠️ TTS エンジン初期化失敗: {e}")
                self.tts_engine = None

        # PyAudio の初期化
        self.audio = pyaudio.PyAudio()

        # 録音用スレッド
        self.is_recording = False
        self.record_thread = None

        print("\n" + "=" * 50)
        print("✅ AI秘書 起動完了")
        print("=" * 50)
        print("\n【使い方】")
        print("  - 「秘書さん聞いて」と言うと会話開始")
        print("  - AI秘書があなたの発話に応答します")
        print("  - 「秘書さんありがとう」と言うと会話終了")
        print("\n録音を開始します...\n")

    def record_audio(self, duration=5):
        """
        音声を録音する

        Args:
            duration (int): 最大録音時間（秒）

        Returns:
            np.array: 録音された音声データ
        """
        stream = self.audio.open(
            format=FORMAT,
            channels=CHANNELS,
            rate=RATE,
            input=True,
            frames_per_buffer=CHUNK
        )

        frames = []
        silent_chunks = 0
        max_silent_chunks = int(SILENCE_DURATION * RATE / CHUNK)
        max_chunks = int(duration * RATE / CHUNK)

        for i in range(max_chunks):
            data = stream.read(CHUNK, exception_on_overflow=False)
            frames.append(data)

            # 音量チェック（無音判定）
            audio_data = np.frombuffer(data, dtype=np.int16)
            volume = np.abs(audio_data).mean()

            if volume < SILENCE_THRESHOLD:
                silent_chunks += 1
                if silent_chunks > max_silent_chunks:
                    # 一定時間無音が続いたら録音終了
                    break
            else:
                silent_chunks = 0

        stream.stop_stream()
        stream.close()

        # NumPy配列に変換
        audio_data = np.frombuffer(b''.join(frames), dtype=np.int16)
        audio_data = audio_data.astype(np.float32) / 32768.0  # 正規化

        return audio_data

    def transcribe(self, audio_data):
        """
        音声をテキストに変換（Whisper）

        Args:
            audio_data (np.array): 音声データ

        Returns:
            str: 変換されたテキスト
        """
        try:
            result = self.whisper_model.transcribe(
                audio_data,
                language='ja',
                fp16=False
            )
            text = result['text'].strip()
            return text
        except Exception as e:
            print(f"❌ 音声認識エラー: {e}")
            return ""

    def detect_command(self, text):
        """
        合言葉を検出して状態遷移

        Args:
            text (str): 認識されたテキスト

        Returns:
            bool: コマンドが検出された場合True
        """
        if "秘書さん聞いて" in text or "秘書さんきいて" in text:
            if self.state == State.IDLE:
                print("\n" + "=" * 50)
                print("🎧 AI秘書: 聞いています（会話開始）")
                print("=" * 50 + "\n")
                self.state = State.LISTENING
                self.conversation_history = []  # 会話履歴を初期化
                self.speak("はい、聞いています。")
                return True

        elif "秘書さんありがとう" in text or "秘書さんありがと" in text:
            if self.state == State.LISTENING:
                print("\n" + "=" * 50)
                print("💤 AI秘書: 待機中（会話終了）")
                print("=" * 50 + "\n")
                self.speak("了解しました。また呼んでください。")
                self.state = State.IDLE
                self.conversation_history = []  # 会話履歴を破棄
                return True

        return False

    def ask_gemini(self, user_message):
        """
        Gemini API に質問を送信

        Args:
            user_message (str): ユーザーのメッセージ

        Returns:
            str: Gemini の応答
        """
        try:
            # System Prompt
            system_prompt = """あなたは個人用のAI秘書です。
Zoom会議に同席し、ユーザーから『秘書さん聞いて』と呼ばれた時のみ応答してください。
回答は簡潔かつ要点のみ述べてください。
日本語で応答してください。"""

            # 会話履歴を構築
            messages = [system_prompt]

            # 過去の会話履歴を追加
            for msg in self.conversation_history[-MAX_HISTORY:]:
                messages.append(f"ユーザー: {msg['user']}")
                messages.append(f"AI秘書: {msg['assistant']}")

            # 現在のメッセージを追加
            messages.append(f"ユーザー: {user_message}")

            # Gemini API にリクエスト
            full_prompt = "\n\n".join(messages)
            response = self.gemini_model.generate_content(full_prompt)

            assistant_reply = response.text.strip()

            # 会話履歴に追加
            self.conversation_history.append({
                'user': user_message,
                'assistant': assistant_reply
            })

            return assistant_reply

        except Exception as e:
            print(f"❌ Gemini API エラー: {e}")
            return "すみません、エラーが発生しました。"

    def speak(self, text):
        """
        テキストを音声で読み上げる

        Args:
            text (str): 読み上げるテキスト
        """
        print(f"🤖 AI秘書: {text}")

        if self.tts_engine:
            try:
                self.tts_engine.say(text)
                self.tts_engine.runAndWait()
            except Exception as e:
                print(f"⚠️ TTS エラー: {e}")

    def process_audio(self, audio_data):
        """
        音声データを処理

        Args:
            audio_data (np.array): 音声データ
        """
        # 音声をテキストに変換
        text = self.transcribe(audio_data)

        if not text:
            return

        print(f"👤 あなた: {text}")

        # コマンド検出（状態遷移）
        is_command = self.detect_command(text)

        if is_command:
            return

        # LISTENING 状態の場合のみ Gemini API に送信
        if self.state == State.LISTENING:
            reply = self.ask_gemini(text)
            self.speak(reply)

    def run(self):
        """メインループ"""
        try:
            while True:
                # 音声録音
                audio_data = self.record_audio()

                # 音声が十分な長さかチェック
                if len(audio_data) < RATE * 0.5:  # 0.5秒未満はスキップ
                    continue

                # 音声処理
                self.process_audio(audio_data)

        except KeyboardInterrupt:
            print("\n\n👋 AI秘書を終了します...")
            self.cleanup()

    def cleanup(self):
        """リソースの解放"""
        if self.audio:
            self.audio.terminate()
        print("✅ 終了しました")

# =================================================
# メイン処理
# =================================================

def main():
    """メインエントリーポイント"""
    try:
        secretary = AISecretary()
        secretary.run()
    except Exception as e:
        print(f"\n❌ エラーが発生しました: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    main()
