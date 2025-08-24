// File: backend/server.js

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// The 'async' keyword here is essential
app.post('/api/generate', async (req, res) => {
  console.log('✅ API route hit');

  // All the AI logic MUST be inside this block
  try {
    const { goal, ingredients } = req.body;
    console.log('➡️ Received data:', { goal, ingredients });

    if (!ingredients) {
      throw new Error('Ingredients are required.');
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const prompt = `
      **ROLE:** Expert Indian Diet Nutritionist.
      **TASK:** Create a single, healthy recipe based on the user's goal and ingredients.
      **USER GOAL:** ${goal}
      **INGREDIENTS:** ${ingredients}
      **OUTPUT FORMAT:** Respond with ONLY a valid JSON object. Do not include markdown, backticks, or any text before or after the JSON object.
      **JSON STRUCTURE:** { "title": "String", "description": "String (one sentence)", "calories": Number, "protein": Number, "carbs": Number, "fat": Number, "steps": ["String", "String", ...] }
    `;

    console.log('⏳ Calling the Gemini AI...');
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    console.log('✅ AI responded!');

    const startIndex = responseText.indexOf('{');
    const endIndex = responseText.lastIndexOf('}');
    const jsonString = responseText.substring(startIndex, endIndex + 1);

    const jsonResponse = JSON.parse(jsonString);

    return res.status(200).json(jsonResponse);

  } catch (error) {
    console.error('❌ AN ERROR OCCURRED:', error);
    return res.status(500).json({ error: 'An internal server error occurred.' });
  }
});

app.listen(port, () => {
  console.log(`🚀 Server running on port ${port}`);
  console.log(`📝 Recipe generator available at http://localhost:${port}/api/generate`);
});