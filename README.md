# Voice-Based Programming Assistant Website

## Setup Instructions

### Frontend
1. Go to `frontend/`
2. Run `npm install`
3. Run `npm start` to launch the React app

### Backend
1. Go to `backend/`
2. Create a `.env` file with your API keys (see example below)
3. Run `pip install -r requirements.txt`
4. Run `uvicorn main:app --reload` to start FastAPI server

#### Example .env file
GEMINI_API_KEY=your_gemini_api_key_here

### Usage
- Open the frontend in your browser
- Click the mic button, speak your query
- View explanation and code

---

See `instructions.md` for full requirements.
