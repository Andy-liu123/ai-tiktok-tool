export const config = { runtime: 'edge' };

export default async function handler(req) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers });
  }

  try {
    // 1. 校验请求方法
    if (req.method !== 'POST') {
      throw new Error(`Method not allowed: ${req.method}`);
    }

    // 2. 解析请求体
    const { topic } = await req.json();
    if (!topic?.trim()) {
      throw new Error('Please enter a valid video topic');
    }

    // 3. 校验API Key（关键！）
    const API_KEY = process.env.API_KEY;
    if (!API_KEY) {
      throw new Error('API_KEY environment variable is not set');
    }
    if (!API_KEY.startsWith('bce-v3/')) {
      throw new Error(`Invalid API_KEY format: ${API_KEY.substring(0, 10)}...`);
    }

    // 4. 调用千帆API
    const aiResp = await fetch('https://qianfan.baidubce.com/v2/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      body: JSON.stringify({
        model: 'deepseek-v3',
        messages: [{
          role: 'user',
          content: `Write a 15-second TikTok script: hook, dialogue, 5 hashtags. Topic: ${topic}`
        }],
        max_tokens: 500
      })
    });

    // 5. 打印千帆返回的原始内容（调试用）
    const rawText = await aiResp.text();
    console.log('Qianfan raw response:', rawText);

    // 6. 解析JSON
    let aiData;
    try {
      aiData = JSON.parse(rawText);
    } catch (e) {
      throw new Error(`Qianfan returned non-JSON: ${rawText.substring(0, 200)}`);
    }

    // 7. 检查千帆API错误
    if (aiData.error) {
      throw new Error(`Qianfan API error: ${aiData.error.message || aiData.error}`);
    }

    // 8. 成功返回
    return new Response(JSON.stringify({
      script: aiData.choices[0].message.content
    }), { headers });

  } catch (e) {
    // 所有错误都以JSON格式返回，前端能看到具体错误
    console.error('Server Error:', e);
    return new Response(JSON.stringify({
      error: e.message,
      stack: e.stack
    }), {
      status: 500,
      headers
    });
  }
}
