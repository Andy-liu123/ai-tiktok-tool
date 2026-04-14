export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { topic } = req.body;
  if (!topic?.trim()) return res.status(400).json({ error: 'Topic is required' });

  const API_KEY = process.env.API_KEY;
  if (!API_KEY) return res.status(500).json({ error: 'API_KEY not configured' });

  try {
    // 百度千帆新版API：直接用API Key调用，无需额外token
    const aiResp = await fetch(`https://aip.baidubce.com/rpc/2.0/ai_custom/v1/wenxinworkshop/chat/deepseek_v3?access_token=${API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [{
          role: "user",
          content: `Write a 15-second viral TikTok script with a STRONG hook in the first 3 seconds, natural spoken dialogue, clear value/entertainment, and 5 trending hashtags at the end. Topic: ${topic}. Keep language casual, conversational, and TikTok-friendly. Only output the script and hashtags, no extra explanation.`
        }],
        temperature: 0.85
      })
    });

    const aiData = await aiResp.json();
    if (aiData.error) throw new Error(aiData.error.message);

    res.status(200).json({ script: aiData.result });
  } catch (e) {
    console.error('API Error:', e);
    res.status(500).json({ error: e.message });
  }
}
