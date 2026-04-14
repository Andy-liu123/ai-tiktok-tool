export const config = { runtime: 'edge' };

export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const { topic } = await req.json();
  if (!topic?.trim()) {
    return new Response(JSON.stringify({ error: 'Please enter a valid topic' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const API_KEY = process.env.API_KEY;
  if (!API_KEY || !API_KEY.startsWith('bce-v3/')) {
    return new Response(JSON.stringify({ error: 'Invalid API_KEY (must start with bce-v3/)' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // 权限已通，直接调用DeepSeek-V3
  const aiResp = await fetch(
    `https://aip.baidubce.com/rpc/2.0/ai_custom/v1/wenxinworkshop/chat/deepseek_v3?access_token=${API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [{
          role: 'user',
          content: `Write a 15-second viral TikTok script:
          1. Strong hook in the first 3 seconds
          2. Natural, conversational dialogue
          3. Clear value/entertainment
          4. 5 trending hashtags at the end
          Topic: ${topic}
          Keep language casual, TikTok-friendly, only output script + hashtags.`
        }],
        temperature: 0.7,
        max_output_tokens: 1000
      })
    }
  );

  const aiData = await aiResp.json();
  if (aiData.error) {
    return new Response(JSON.stringify({ error: aiData.error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  return new Response(JSON.stringify({ script: aiData.result }), {
    headers: { 'Content-Type': 'application/json' }
  });
}
