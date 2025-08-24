// File: backend/server.js

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: false
}));
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
      
      **CRITICAL:** You must respond with ONLY a valid JSON object. No markdown, no explanations, no text before or after.
      
      **REQUIRED JSON STRUCTURE:**
      {
        "title": "Recipe Name",
        "description": "One sentence description of the recipe",
        "calories": 350,
        "protein": 25,
        "carbs": 30,
        "fat": 15,
        "steps": [
          "Step 1 description",
          "Step 2 description",
          "Step 3 description"
        ]
      }
      
      **RULES:**
      - Use only the exact field names shown above
      - Ensure all numbers are integers (no decimals)
      - Make sure the JSON is properly formatted with correct quotes and commas
      - Do not include any text outside the JSON object
    `;

    console.log('⏳ Calling the Gemini AI...');
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    console.log('✅ AI responded!');
    console.log('📝 Raw AI response:', responseText);

    // Try to extract JSON from the response
    let jsonResponse;
    try {
      // First, try to parse the entire response
      jsonResponse = JSON.parse(responseText);
    } catch (parseError) {
      console.log('⚠️ Direct JSON parse failed, trying to extract JSON...');
      
      // Clean the response text - remove markdown code blocks and trim
      let cleanedText = responseText.trim();
      
      // Remove markdown code blocks if present
      cleanedText = cleanedText.replace(/```json\s*/g, '').replace(/```\s*$/g, '');
      
      // Try to find JSON within the cleaned response
      const jsonMatch = cleanedText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          console.log('🔧 Extracted JSON string:', jsonMatch[0]);
          jsonResponse = JSON.parse(jsonMatch[0]);
        } catch (extractError) {
          console.log('❌ JSON extraction failed:', extractError.message);
          console.log('🔍 Failed JSON string:', jsonMatch[0]);
          throw new Error('AI response could not be parsed as valid JSON');
        }
      } else {
        throw new Error('No valid JSON found in AI response');
      }
    }

    // Validate the required fields
    const requiredFields = ['title', 'description', 'calories', 'protein', 'carbs', 'fat', 'steps'];
    const missingFields = requiredFields.filter(field => !(field in jsonResponse));
    
    if (missingFields.length > 0) {
      throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
    }

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