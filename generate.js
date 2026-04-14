export default async function handler(req, res) {
  // 1. 严格校验请求方法
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // 2. 严格校验主题参数
  const { topic } = req.body;
  if (!topic || typeof topic !== 'string' || topic.trim().length === 0) {
    return res.status(400).json({ error: 'Please enter a valid video topic' });
  }

  // 3. 严格校验API_KEY环境变量
  const API_KEY = process.env.API_KEY;
  if (!API_KEY || !API_KEY.startsWith('bce-v3/')) {
    return res.status(500).json({ error: 'API_KEY is invalid or not configured' });
  }

  try {
    // 4. 百度千帆新版API正确调用方式
    const aiResp = await fetch(
      `https://aip.baidubce.com/rpc/2.0/ai_custom/v1/wenxinworkshop/chat/deepseek_v3?access_token=${API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [
            {
              role: 'user',
              content: `Write a 15-second viral TikTok script with a STRONG hook in the first 3 seconds, natural spoken dialogue, clear value/entertainment, and 5 trending hashtags at the end. Topic: ${topic.trim()}. Keep language casual, conversational, and TikTok-friendly. Only output the script and hashtags, no extra explanation.`
            }
          ],
          temperature: 0.7,
          max_output_tokens: 800
        })
      }
    );

    // 5. 先校验HTTP状态，再解析JSON
    if (!aiResp.ok) {
      const errorText = await aiResp.text();
      throw new Error(`API request failed: ${aiResp.status} - ${errorText}`);
    }

    const aiData = await aiResp.json();
    
    // 6. 校验API返回的业务错误
    if (aiData.error) {
      throw new Error(`API error: ${aiData.error.message}`);
    }

    // 7. 确保返回合法JSON
    return res.status(200).json({
      script: aiData.result || 'No script generated'
    });

  } catch (e) {
    console.error('Server Error:', e);
    // 8. 错误时也返回合法JSON，避免前端解析崩溃
    return res.status(500).json({
      error: e.message || 'Unknown server error'
    });
  }
}
