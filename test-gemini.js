const { GoogleGenerativeAI } = require('@google/generative-ai');

const apiKey = 'AIzaSyC9JlhE9djALEg6lPurAbV0PpWY-KdAK1g';
const genAI = new GoogleGenerativeAI(apiKey);

async function test() {
  try {
    // Try gemini-pro
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    const result = await model.generateContent('Hello');
    const response = await result.response;
    console.log('SUCCESS with gemini-pro:', response.text());
  } catch (error) {
    console.error('ERROR:', error.message);
  }
}

test();
