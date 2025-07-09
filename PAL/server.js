const express = require('express');
const app = express();
const fetch = require('node-fetch');
const multer = require('multer');
const mongoose = require('mongoose');
const chrono = require('chrono-node');
require('dotenv').config();

const upload = multer({ storage: multer.memoryStorage() });

const {
  DB_CONNECTION_STRING,
  DIFY_API_KEY, DIFY_API_URL,
  OPENWEATHER_API_KEY, CLARIFAI_API_KEY,
  ASSEMBLYAI_API_KEY, GOOGLE_CUSTOM_SEARCH_API_KEY, GOOGLE_CSE_ID
} = process.env;

mongoose.connect(DB_CONNECTION_STRING)
  .then(() => console.log('MongoDBに正常に接続しました。'))
  .catch(err => console.error('MongoDB接続エラー:', err));

const UserSchema = new mongoose.Schema({
    userId: { type: String, required: true, unique: true },
    name: { type: String, default: 'あなた' },
    currentChatLog: [String],
    memories: [String],
    reminders: [{
        eventName: String,
        eventDate: Date
    }]
});
const User = mongoose.model('User', UserSchema);

app.use(express.json({ limit: '50mb' }));
app.use(express.static('public'));

app.get('/', (request, response) => {
  response.sendFile(__dirname + '/public/index.html');
});

app.post('/ask', async (request, response) => {
  let { question, conversation_id, userId } = request.body;
  if (!userId) userId = 'pal-user-01';

  try {
    let user = await User.findOne({ userId: userId });
    if (!user) {
      user = new User({ userId: userId });
    }
    
    user.currentChatLog.push(`ユーザー: ${question}`);

    let promptContext = `あなたはAIアシスタントの「パル」です。ユーザーの名前は「${user.name}」です。`;
    if (user.memories && user.memories.length > 0) {
      promptContext += `あなたはユーザーに関する以下の事柄を記憶しています: ${user.memories.join('; ')}。`;
    }
    promptContext += `これらの情報を踏まえて、次の質問にフレンドリーに答えてください。「${question}」`;

    const apiResponse = await fetch(DIFY_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${DIFY_API_KEY}` },
      body: JSON.stringify({ "inputs": {}, "query": promptContext, "user": userId, "conversation_id": conversation_id || "", "response_mode": "streaming" })
    });

    if (!apiResponse.ok) throw new Error(`Dify API error: ${apiResponse.statusText}`);
    
    response.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    let fullAnswer = "";
    const decoder = new TextDecoder();

    for await (const chunk of apiResponse.body) {
        response.write(chunk);
        const decodedChunk = decoder.decode(chunk, { stream: true });
        const lines = decodedChunk.split('\n').filter(line => line.startsWith('data: '));
        for (const line of lines) {
             try {
                const jsonStr = line.substring(6);
                if (jsonStr) {
                    const data = JSON.parse(jsonStr);
                    if (data.answer) fullAnswer += data.answer;
                }
            } catch(e) {}
        }
    }

    if (fullAnswer) {
      user.currentChatLog.push(`AI: ${fullAnswer}`);
    }
    
    await user.save();
    response.end();

  } catch (error) {
    console.error("ask API Error:", error);
    if (!response.headersSent) {
      response.status(500).json({ error: "APIでエラーが発生しました。" });
    }
  }
});

app.post('/end-conversation', async (request, response) => {
    let { userId } = request.body;
    if (!userId) userId = 'pal-user-01';
    try {
        const user = await User.findOne({ userId });
        if (!user || user.currentChatLog.length < 2) {
            return response.json({ message: "記憶するほどの会話がありませんでした。" });
        }
        const logToSummarize = user.currentChatLog.join('\n');
        const summaryPrompt = `以下の会話ログから、ユーザーに関する重要な情報を3つの箇条書きで要約してください:\n\n${logToSummarize}`;
        
        const summaryResponse = await fetch(DIFY_API_URL.replace('chat-messages', 'completion-messages'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${DIFY_API_KEY}` },
            body: JSON.stringify({ "inputs": {}, "query": summaryPrompt, "user": userId, "response_mode": "blocking" })
        });
        if (!summaryResponse.ok) throw new Error('要約の生成に失敗しました。');
        const summaryData = await summaryResponse.json();
        const summaryText = summaryData.answer.trim();

        if (summaryText) {
            user.memories.push(summaryText);
            user.currentChatLog = [];
            await user.save();
            response.json({ message: "会話を記憶しました！", summary: summaryText });
        } else {
            response.json({ message: "要約を生成できませんでした。" });
        }
    } catch (error) {
        console.error("summarize API Error:", error);
        response.status(500).json({ error: "会話の記憶中にエラーが発生しました。" });
    }
});

app.post('/add-reminder', async (request, response) => {
    const { text, userId = 'pal-user-01' } = request.body;
    if (!text) return response.status(400).json({ error: 'リマインダーの内容がありません。' });

    const parsedResult = chrono.ja.parse(text);
    if (!parsedResult || parsedResult.length === 0) {
        return response.status(400).json({ message: "ごめんなさい、日時をうまく聞き取れませんでした。" });
    }

    const eventDate = parsedResult[0].start.date();
    const eventName = text.replace(parsedResult[0].text, '').trim();

    try {
        await User.findOneAndUpdate(
            { userId: userId },
            { $push: { reminders: { eventName: eventName, eventDate: eventDate } } },
            { upsert: true }
        );
        response.json({ message: `「${eventName}」を覚えました！` });
    } catch (error) {
        response.status(500).json({ error: 'リマインダーの保存に失敗しました。' });
    }
});

app.post('/get-reminders', async (request, response) => {
    const { userId = 'pal-user-01' } = request.body;
    try {
        const user = await User.findOne({ userId });
        if (user) {
            const upcomingReminders = user.reminders.filter(r => r.eventDate > new Date());
            response.json({ reminders: upcomingReminders });
        } else {
            response.json({ reminders: [] });
        }
    } catch (error) {
        response.status(500).json({ error: 'リマインダーの取得に失敗しました。' });
    }
});

app.post('/weather', async (request, response) => {
  const { city } = request.body;
  if (!city || (city !== 'tokyo' && city !== 'kanagawa')) {
    return response.status(400).json({ error: "都市名が無効です。'tokyo'または'kanagawa'を指定してください。" });
  }
  if (!OPENWEATHER_API_KEY) {
    return response.status(500).json({ error: "OpenWeather APIキーが設定されていません。" });
  }
  const url = `https://api.openweathermap.org/data/2.5/weather?q=${city},jp&appid=${OPENWEATHER_API_KEY}&units=metric&lang=ja`;
  try {
    const weatherResponse = await fetch(url);
    const weatherData = await weatherResponse.json();
    response.json(weatherData);
  } catch (error) {
    console.error("天気情報取得エラー:", error);
    response.status(500).json({ error: "天気情報の取得に失敗しました。" });
  }
});

app.post('/google-search', async (request, response) => {
  const { query } = request.body;
  if (!query) { return response.status(400).json({ error: "検索クエリが必要です。" }); }
  if (!GOOGLE_CUSTOM_SEARCH_API_KEY || !GOOGLE_CSE_ID) {
    return response.status(500).json({ error: "Google検索APIキーまたは検索エンジンIDが設定されていません。" });
  }
  const url = `https://www.googleapis.com/customsearch/v1?key=${GOOGLE_CUSTOM_SEARCH_API_KEY}&cx=${GOOGLE_CSE_ID}&q=${encodeURIComponent(query)}&hl=ja`;
  try {
    const searchResponse = await fetch(url);
    const searchData = await searchResponse.json();
    response.json(searchData);
  } catch (error) {
    console.error("Google検索エラー:", error);
    response.status(500).json({ error: "Google検索の実行に失敗しました。" });
  }
});

app.post('/image-analysis', async (request, response) => {
  const { imageBase64 } = request.body;
  if (!imageBase64) { return response.status(400).json({ error: "画像データが必要です。" }); }
  if (!CLARIFAI_API_KEY) { return response.status(500).json({ error: "Clarifai APIキーが設定されていません。" }); }
  const MODEL_ID = 'general-image-recognition';
  const url = `https://api.clarifai.com/v2/users/clarifai/apps/main/models/${MODEL_ID}/outputs`;
  try {
    const clarifaiResponse = await fetch(url, {
      method: 'POST',
      headers: { 'Authorization': `Key ${CLARIFAI_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ inputs: [{ data: { image: { base64: imageBase64 } } }] })
    });
    if (!clarifaiResponse.ok) {
      const errorBody = await clarifaiResponse.text();
      console.error("Clarifai API Error Body:", errorBody);
      throw new Error(`Clarifai API error: ${clarifaiResponse.statusText}`);
    }
    const analysisData = await clarifaiResponse.json();
    response.json(analysisData);
  } catch (error) {
    console.error("画像解析エラー:", error);
    response.status(500).json({ error: "画像解析に失敗しました。" });
  }
});

app.post('/audio-transcript', upload.single('audio'), async (request, response) => {
    if (!request.file) { return response.status(400).json({ error: "音声ファイルが見つかりません。" }); }
    if (!ASSEMBLYAI_API_KEY) { return response.status(500).json({ error: "AssemblyAI APIキーが設定されていません。" }); }
    try {
        const uploadResponse = await fetch('https://api.assemblyai.com/v2/upload', {
            method: 'POST',
            headers: { 'authorization': ASSEMBLYAI_API_KEY, 'Content-Type': 'application/octet-stream' },
            body: request.file.buffer
        });
        const uploadData = await uploadResponse.json();
        if (!uploadData.upload_url) { throw new Error('AssemblyAIへのファイルアップロードに失敗しました。'); }
        const transcriptResponse = await fetch("https://api.assemblyai.com/v2/transcript", {
            method: 'POST',
            headers: { 'authorization': ASSEMBLYAI_API_KEY, 'content-type': 'application/json' },
            body: JSON.stringify({
                audio_url: uploadData.upload_url,
                language_code: "ja",
                speaker_labels: true,
                sentiment_analysis: true
            }),
        });
        const transcriptData = await transcriptResponse.json();
        if (transcriptData.error) throw new Error(transcriptData.error);
        const transcriptId = transcriptData.id;
        while (true) {
            const pollResponse = await fetch(`https://api.assemblyai.com/v2/transcript/${transcriptId}`, {
                headers: { 'authorization': ASSEMBLYAI_API_KEY }
            });
            const pollData = await pollResponse.json();
            if (pollData.status === 'completed') { return response.json(pollData); }
            if (pollData.status === 'error') { throw new Error(`文字起こしエラー: ${pollData.error}`); }
            await new Promise(resolve => setTimeout(resolve, 3000));
        }
    } catch (error) {
        console.error("音声文字起こしエラー:", error);
        response.status(500).json({ error: "音声の文字起こしに失敗しました。" });
    }
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('パルのバックエンドサーバーが起動しました。ポート番号: ' + listener.address().port);
});