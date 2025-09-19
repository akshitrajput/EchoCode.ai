from fastapi import APIRouter, Request
import httpx
import os
from dotenv import load_dotenv

load_dotenv()
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent"

router = APIRouter()

@router.post("/generate")
async def generate_code(request: Request):
    data = await request.json()
    query = data.get("query", "")
    # Translation logic can be added here if needed
    headers = {"Content-Type": "application/json"}
    payload = {
        "contents": [{"parts": [{"text": query}]}]
    }
    params = {"key": GEMINI_API_KEY}
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(GEMINI_API_URL, headers=headers, params=params, json=payload)
            try:
                result = response.json()
            except Exception:
                # If not JSON, return raw text and status code
                return {"error": f"Gemini API did not return JSON. Status: {response.status_code}, Body: {response.text}"}
            # Parse Gemini response
            explanation = ""
            code = ""
            language = "python"
            if "candidates" in result and result["candidates"]:
                parts = result["candidates"][0]["content"]["parts"]
                if len(parts) == 1 and "text" in parts[0]:
                    # Try to split explanation and code using markdown
                    text = parts[0]["text"]
                    if "```" in text:
                        before, after = text.split("```", 1)
                        explanation = before.strip()
                        # Try to get language and code
                        after_lines = after.strip().splitlines()
                        if after_lines:
                            if after_lines[0].strip() in ["python", "js", "javascript", "java", "c++", "c#", "go", "ruby", "php"]:
                                language = after_lines[0].strip()
                                code = "\n".join(after_lines[1:]).strip()
                            else:
                                code = "\n".join(after_lines).strip()
                    else:
                        explanation = text.strip()
                        code = ""
                else:
                    for part in parts:
                        if "text" in part:
                            if not explanation:
                                explanation = part["text"]
                            else:
                                code = part["text"]
            if not explanation and not code:
                return {"error": f"No valid response from Gemini: {result}"}
            return {"explanation": explanation, "code": code, "language": language}
    except Exception as e:
        import traceback
        print("Gemini API error:", traceback.format_exc())
        return {"error": str(e)}
