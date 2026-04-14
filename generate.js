export const config = { runtime: 'edge' };

export default async function handler(req) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  };

  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers });
  if (req.method !== 'POST') return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers });

  const { topic } = await req.json();
  if (!topic?.trim()) return new Response(JSON.stringify({ error: 'Please enter a valid topic' }), { status: 400, headers });

  const API_KEY = process.env.API_KEY;
  if (!API_KEY || !API_KEY.startsWith('bce-v3/')) return new Response(JSON.stringify({ error: 'Invalid API_KEY' }), { status: 500, headers });

  try {
    // ✅ 后端统一调用千帆新版API，无跨域问题
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
          content: `Write a 15-second viral TikTok script: STRONG hook in first 3 seconds, natural dialogue, clear value, 5 trending hashtags. Topic: ${topic}. Only output script + hashtags.`
        }],
        temperature: 0.7,
        max_tokens: 1000
      })
    });

    const aiData = await aiResp.json();
    if (aiData.error) throw new Error(aiData.error.message);

    return new Response(JSON.stringify({ script: aiData.choices[0].message.content }), { headers });
  } catch (e) {
    console.error('Server Error:', e);
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers });
  }
}
