// api/generate.js （必须放在 api 目录下！）
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
    const { topic } = await req.json();
    if (!topic?.trim()) throw new Error('请输入视频主题');

    const API_KEY = process.env.API_KEY;
    if (!API_KEY) throw new Error('API_KEY 环境变量未设置');

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
          content: `写一个15秒爆款抖音脚本：前3秒强钩子，口语化对话，清晰价值，结尾5个热门标签。主题：${topic}。只输出脚本+标签，不要多余文字。`
        }],
        temperature: 0.7,
        max_tokens: 800
      })
    });

    const aiData = await aiResp.json();
    if (aiData.error) throw new Error(`千帆API错误：${aiData.error.message}`);

    return new Response(JSON.stringify({
      script: aiData.choices[0].message.content
    }), { headers });

  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers
    });
  }
}
