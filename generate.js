export const config = {
  runtime: 'edge',
};

export default async function handler(req) {
  // 1. 只允许POST请求
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // 2. 解析请求体
  let body;
  try {
    body = await req.json();
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Invalid request body' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const topic = body.topic;
  if (!topic || typeof topic !== 'string' || topic.trim() === '') {
    return new Response(JSON.stringify({ error: 'Topic is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // 3. 校验API Key（从环境变量拿）
  const API_KEY = process.env.API_KEY;
  if (!API_KEY || !API_KEY.startsWith('bce-v3/')) {
    return new Response(JSON.stringify({ error: 'Invalid API_KEY' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    // 4. 调用百度千帆DeepSeek-V3
    const aiResp = await fetch(
      `https://aip.baidubce.com/rpc/2.0/ai_custom/v1/wenxinworkshop/chat/deepseek_v3?access_token=${API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            {
              role: 'user',
              content: `Write a 15-second TikTok script: strong opening hook, natural dialogue, clear value, 5 hashtags. Topic: ${topic}. Only output script + hashtags.`
            }
          ],
          temperature: 0.7,
        })
      }
    );

    // 5. 先拿文本，再转JSON，避免解析崩溃
    const respText = await aiResp.text();
    let aiData;
    try {
      aiData = JSON.parse(respText);
    } catch (e) {
      console.error('API返回非JSON:', respText.slice(0, 500));
      return new Response(JSON.stringify({ error: `API error: ${respText.slice(0, 200)}` }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (aiData.error) {
      return new Response(JSON.stringify({ error: aiData.error.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 6. 成功返回，确保是合法JSON
    return new Response(JSON.stringify({ script: aiData.result }), {
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (e) {
    console.error('Server Error:', e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
