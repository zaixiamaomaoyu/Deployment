import OpenAI from 'openai';
import dotenv from 'dotenv';

// 加载环境变量
dotenv.config();

async function testKimiAPI() {
  const apiKey = process.env.KIMI_API_KEY;
  const apiURL = process.env.KIMI_API_URL?.replace(/\/$/, '') || 'https://api.kimi.com/coding';
  const model = process.env.KIMI_MODEL || 'glm-4.7-flash';

  console.log('=== Kimi API 测试 ===');
  console.log('API Key:', apiKey ? `${apiKey.substring(0, 10)}...` : '未配置');
  console.log('API URL:', apiURL);
  console.log('Model:', model);
  console.log('');

  if (!apiKey || apiKey === 'your_kimi_api_key') {
    console.error('❌ 错误：KIMI_API_KEY 未配置');
    process.exit(1);
  }

  const openai = new OpenAI({
    apiKey: apiKey,
    baseURL: apiURL,
  });

  try {
    console.log('正在调用 Kimi API...');
    const response = await openai.chat.completions.create({
      model: model,
      messages: [
        {
          role: 'user',
          content: '你好，请用一句话介绍你自己',
        },
      ],
      max_tokens: 100,
    });

    console.log('✅ API 调用成功！');
    console.log('回复内容:', response.choices[0]?.message?.content);
  } catch (error) {
    console.error('❌ API 调用失败:', error);
    if (error instanceof Error) {
      console.error('错误消息:', error.message);
    }
    process.exit(1);
  }
}

testKimiAPI();
