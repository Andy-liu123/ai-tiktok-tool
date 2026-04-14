export default async function handler(req, res) {
  // 1. 校验请求方法
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // 2. 校验主题参数
  const { topic } = req.body;
  if (!topic || typeof topic !== 'string' || topic.trim() === '') {
    return res.status(400).json({ error: 'Valid topic is required' });
  }

  // 3. 校验API Key环境变量
  const API_KEY = process.env.API_KEY;
  if (!API_KEY || !API_KEY.startsWith('bce-v3/')) {
    return res.status(500).json({ error: 'Valid API_KEY is not configured' });
  }

  try {
    // 4. 第一步：通过API Key获取有效access_token（百度千帆新版必须）
    const tokenResp = await fetch('https://aip.baidubce.com/oauth/2.0/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        grant_type: 'client_credentials',
        client_id: API_KEY.split('/')[2], // 从bce-v3/ALTAK-xxx/yyy中提取client_id
        client_secret: '' // 新版API Key无需Secret，留空即可
      })
    });

    const tokenData = await tokenResp.json();
    if (tokenData.error) {
      throw new Error(`Token Error: ${tokenData.error_description}`);
    }
    const access_token = tokenData.access_token;

    // 5. 第二步：用有效token调用DeepSeek-V3模型
    const aiResp = await fetch(`https://aip.baidubce.com/rpc/2.0/ai_custom/v1/wenxinworkshop/chat/deepseek_v3?access_token=${access_token}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [{
          role: "user",
          content: `Write a 15-second viral TikTok script with a STRONG hook in the first 3 seconds, natural spoken dialogue, clear value/entertainment, and 5 trending hashtags at the end. Topic: ${topic.trim()}. Keep language casual, conversational, and TikTok-friendly. Only output the script and hashtags, no extra explanation.`
        }],
        temperature: 0.85,
        max_output_tokens: 1000
      })
    });

    const aiData = await aiResp.json();
    if (aiData.error) {
      throw new Error(`API Error: ${aiData.error.message}`);
    }

    // 6. 成功返回脚本
    res.status(200).json({ script: aiData.result });
  } catch (e) {
    console.error('Server Error:', e);
    res.status(500).json({ error: `Failed: ${e.message}` });
  }
}
