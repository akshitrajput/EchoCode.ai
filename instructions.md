# Project: Voice-Based Programming Assistant Website

 Build a full-stack web application with the following requirements:

## Core Idea
A website where users can **speak queries** like "Give me a program for Fibonacci series in Python" and the system provides:
1. **Explanation** of the program.
2. **Code** in the requested programming language.

## Features
- 🎤 **Voice Input**: Capture voice, convert to text (Speech-to-Text).
- 🌐 **Multi-language Support**: Users can speak in English, Hindi, or other languages. Translate to English before processing.
- 💻 **AI Code Generator**: Use Gemini LLM API to generate explanation + code.
- 📄 **Text Output**: Show nicely formatted explanation + syntax-highlighted code block.

## Tech Stack
- **Frontend**: React + CSS
  - Components:
    - Voice Recorder button (🎤)
    - Text display for recognized query
    - Code + Explanation display area
- **Backend**: FastAPI (Python)
  - Endpoints:
    - `/stt` → Accept audio, return text
    - `/generate` → Accept text query, return explanation + code
- **APIs/Services**:
  - Speech-to-Text: Whisper API (or Google Speech API)
  - Translation: Google Translate API
  - Gemini

## Workflow
1. User clicks 🎤 and speaks.
2. STT service converts speech → text.
3. Translation (if not English).
4. AI model generates:
   - Short explanation
   - Full code snippet
5. Display results in frontend.

## Requirements
- Highlight code using a React syntax highlighter.
- Use Tailwind for clean, minimal UI.
- Organize backend into modular routes: `stt.py`, `generate.py`.
- Add error handling for API calls.
- Write a simple README.md with setup instructions.

## Output
Generate:
1. Full folder structure (`frontend/`, `backend/`)
2. Example React frontend code (App.js, components).
3. FastAPI backend code (main.py + routes).
4. Package.json, requirements.txt.

  ## 1907  pip install -r requirements.txt
  ##  1908  pip install fastapi
  ##  1909  pip install speech_recognition
  ##  1910  pip install speechrecognition
    ## 1911  pip install python-multipart
  ##  1912  uvicorn main:app --reload
  ##  1913  echo 'export PATH=$HOME/.local/bin:$PATH' >> ~/.bashrc
    ## 1914  source ~/.bashrc
    ## 1915  uvicorn main:app --reload
  ##  1916  npm start
  ##  1917  uvicorn main:app --reload
