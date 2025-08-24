# RizzBite Backend

This is the backend server for the RizzBite recipe generator application.

## Setup Instructions

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Variables
Create a `.env` file in the backend directory with:
```
GEMINI_API_KEY=your_actual_gemini_api_key_here
PORT=5000
```

**Important:** Get your Gemini API key from [Google AI Studio](https://makersuite.google.com/app/apikey)

### 3. Start the Server
```bash
# Development mode (with auto-restart)
npm run dev

# Production mode
npm start
```

The server will run on `http://localhost:5000`

### 4. Test the API
- Health check: `GET http://localhost:5000/health`
- Recipe generation: `POST http://localhost:5000/api/generate`

## Troubleshooting

- **"Missing API Key" error**: Make sure your `.env` file has the correct `GEMINI_API_KEY`
- **CORS errors**: The server is configured to allow requests from your frontend
- **Port conflicts**: Change the PORT in `.env` if 5000 is already in use
