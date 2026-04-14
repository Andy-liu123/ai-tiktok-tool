export const config = { runtime: 'edge' };

export default async function handler(req) {
  // 跨域头配置
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  };

  // 处理预检请求
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers });
  }

  // 校验请求方法
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers });
  }

  // 解析请求体
  const { topic } = await req.json();
  if (!topic?.trim()) {
    return new Response(JSON.stringify({ error: 'Please enter a valid video topic' }), { status: 400, headers });
  }

  // 校验API Key
  const API_KEY = process.env.API_KEY;
  if (!API_KEY || !API_KEY.startsWith('bce-v3/')) {
    return new Response(JSON.stringify({ error: 'Invalid API_KEY' }), { status: 500, headers });
  }

  try {
    // 调用千帆官方v2/chat/completions接口（你截图里的标准API）
    const aiResp = await fetch('https://qianfan.baidubce.com/v2/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      body: JSON.stringify({
        model: 'deepseek-v3',
        messages: [
          {
            role: 'user',
            content: `Write a 15-second viral TikTok script:
            1. STRONG hook in the first 3 seconds
            2. Natural, conversational spoken dialogue
            3. Clear value/entertainment
            4. 5 trending hashtags at the end
            Topic: ${topic}
            Keep language casual, TikTok-friendly, only output script + hashtags, no extra explanation.`
          }
        ],
        temperature: 0.7,
        max_tokens: 1000
      })
    });

    const aiData = await aiResp.json();
    if (aiData.error) {
      throw new Error(aiData.error.message);
    }

    // 成功返回脚本
    return new Response(JSON.stringify({
      script: aiData.choices[0].message.content
    }), { headers });

  } catch (e) {
    console.error('Server Error:', e);
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers });
  }
}
