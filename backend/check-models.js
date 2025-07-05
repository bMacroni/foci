import dotenv from 'dotenv';
dotenv.config();

import { GoogleGenerativeAI } from '@google/generative-ai';

async function checkModels() {
  console.log('🔍 Checking available Gemini models...\n');
  
  if (!process.env.GOOGLE_AI_API_KEY) {
    console.log('❌ GOOGLE_AI_API_KEY not found in environment variables');
    return;
  }
  
  console.log('✅ API key found\n');
  
  const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY);
  
  // Test different model names
  const modelNames = [
    "gemini-1.5-pro",
    "gemini-1.5-flash", 
    "gemini-pro",
    "gemini-1.0-pro",
    "gemini-1.0-pro-001"
  ];
  
  for (const modelName of modelNames) {
    try {
      console.log(`Testing model: ${modelName}`);
      const model = genAI.getGenerativeModel({ model: modelName });
      
      // Try a simple test
      const result = await model.generateContent("Hello");
      const response = await result.response;
      const text = response.text();
      
      console.log(`✅ ${modelName} - WORKS! Response: "${text}"\n`);
    } catch (error) {
      console.log(`❌ ${modelName} - FAILED: ${error.message}\n`);
    }
  }
  
  console.log('🎉 Model check completed!');
}

checkModels().catch(console.error); 