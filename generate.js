export const config = { runtime: 'edge' };

export default async function handler(req) {
  // 1. 允许跨域
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  };

  // 2. 处理预检请求
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers });
  }

  // 3. 校验请求方法
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers
    });
  }

  // 4. 解析请求体
  const { topic } = await req.json();
  if (!topic?.trim()) {
    return new Response(JSON.stringify({ error: 'Please enter a valid topic' }), {
      status: 400,
      headers
    });
  }

  // 5. 从环境变量拿API Key
  const API_KEY = process.env.API_KEY;
  if (!API_KEY || !API_KEY.startsWith('bce-v3/')) {
    return new Response(JSON.stringify({ error: 'Invalid API_KEY' }), {
      status: 500,
      headers
    });
  }

  try {
    // 6. 第一步：后端获取Token（无跨域问题）
    const tokenResp = await fetch('https://aip.baidubce.com/oauth/2.0/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: API_KEY.split('/')[2],
        client_secret: ''
      })
    });

    const tokenData = await tokenResp.json();
    if (tokenData.error) throw new Error(tokenData.error_description);
    const access_token = tokenData.access_token;

    // 7. 第二步：调用DeepSeek-V3生成脚本
    const aiResp = await fetch(
      `https://aip.baidubce.com/rpc/2.0/ai_custom/v1/wenxinworkshop/chat/deepseek_v3?access_token=${access_token}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{
            role: 'user',
            content: `Write a 15-second viral TikTok script: STRONG hook in first 3 seconds, natural dialogue, clear value, 5 trending hashtags. Topic: ${topic}. Only output script + hashtags, no extra text.`
          }],
          temperature: 0.7,
          max_output_tokens: 1000
        })
      }
    );

    const aiData = await aiResp.json();
    if (aiData.error) throw new Error(aiData.error.message);

    // 8. 成功返回，带跨域头
    return new Response(JSON.stringify({ script: aiData.result }), {
      headers
    });

  } catch (e) {
    console.error('Server Error:', e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers
    });
  }
}
