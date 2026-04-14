export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { topic } = req.body;
  if (!topic) {
    return res.status(400).json({ error: 'Topic is required' });
  }

  const API_KEY = process.env.API_KEY;
  const SECRET_KEY = process.env.SECRET_KEY;

  try {
    const tokenResp = await fetch(`https://aip.baidubce.com/oauth/2.0/token?grant_type=client_credentials&client_id=${API_KEY}&client_secret=${SECRET_KEY}`);
    const tokenData = await tokenResp.json();
    const token = tokenData.access_token;

    const aiResp = await fetch(`https://aip.baidubce.com/rpc/2.0/ai_custom/v1/wenxinworkshop/chat/deepseek_v3?access_token=${token}`, {
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
    res.json({ script: aiData.result });
  } catch (e) {
    res.status(500).json({ error: 'failed' });
  }
}
