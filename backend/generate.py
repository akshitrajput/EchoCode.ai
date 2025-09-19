from fastapi import APIRouter, Request
import httpx
import os
from dotenv import load_dotenv

load_dotenv()
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent"

router = APIRouter()

# System prompt to guide the AI model
SYSTEM_PROMPT = """You are EchoCode.ai, an expert programming and coding assistant. Your primary function is to understand user queries and provide two distinct outputs: a clear, easy-to-understand explanation, followed by a complete and accurate code snippet.

When a user asks for a program, an algorithm, or a code-related concept, you must structure your response as follows:

1.  **Explanation**: Start with a concise explanation of the concept or the code's logic. Keep it brief and to the point.
2.  **Code**: After the explanation, provide the complete code. The code should be enclosed in a single markdown code block (e.g., ```python ... ```).

Always assume the user is looking for both an explanation and code, unless they explicitly ask for only one. Be helpful, accurate, and format your response correctly."""

@router.post("/generate")
async def generate_code(request: Request):
    data = await request.json()
    query = data.get("query", "")
    headers = {"Content-Type": "application/json"}
    
    payload = {
        "contents": [{"parts": [{"text": query}]}],
        "system_instruction": {
            "parts": [
                {"text": SYSTEM_PROMPT}
            ]
        }
    }
    
    params = {"key": GEMINI_API_KEY}
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(GEMINI_API_URL, headers=headers, params=params, json=payload, timeout=30.0)
            try:
                result = response.json()
            except Exception:
                return {"error": f"Gemini API did not return JSON. Status: {response.status_code}, Body: {response.text}"}

            explanation = ""
            code = ""
            language = "python"
            if "candidates" in result and result["candidates"]:
                parts = result["candidates"][0]["content"]["parts"]
                if len(parts) == 1 and "text" in parts[0]:
                    text = parts[0]["text"]
                    if "```" in text:
                        # Split explanation and code using markdown format
                        try:
                            before, after = text.split("```", 1)
                            explanation = before.strip()
                            after_lines = after.strip().splitlines()
                            if after_lines:
                                lang_candidate = after_lines[0].strip()
                                # Check if language is specified and valid
                                if lang_candidate in ["python", "js", "javascript", "java", "c++", "c#", "go", "ruby", "php", "html", "css", "sql"]:
                                    language = lang_candidate
                                    code = "\n".join(after_lines[1:]).strip()
                                else:
                                    code = "\n".join(after_lines).strip()
                        except ValueError:
                            explanation = ""
                            code = text.strip()

                    else:
                        explanation = text.strip()
                        code = ""
                else:
                    # Fallback for unexpected structures
                    for part in parts:
                        if "text" in part:
                            if not explanation:
                                explanation = part["text"]
                            else:
                                code += part["text"] + "\n"

            if not explanation and not code and "error" not in result:
                 return {"error": f"No valid response from Gemini: {result}"}
            
            return {"explanation": explanation, "code": code.strip(), "language": language}

    except httpx.ReadTimeout:
        return {"error": "Request to Gemini API timed out. Please try again."}
    except Exception as e:
        import traceback
        print(f"Gemini API error: {traceback.format_exc()}")
        return {"error": str(e)}
