from fastapi import APIRouter, Request
import httpx
import os
from dotenv import load_dotenv
import re # Import the regular expression module

load_dotenv()
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent" # Note: Updated to a common model

router = APIRouter()

@router.post("/generate")
async def generate_code(request: Request):
    data = await request.json()
    query = data.get("query", "")

    # --- THIS IS THE NEW, STRUCTURED PROMPT ---
    # We are giving Gemini a strict template to follow.
    prompt_template = f"""
    User query: "{query}"

    You are a coding assistant.
    
    **CRITICAL INSTRUCTIONS:**
    1.  You MUST generate code that **directly answers the user's specific query**. Do not provide generic or unrelated examples. (For example, if the user asks for "palindrome", you MUST provide palindrome code).
    2.  The **explanation** must be simple, plain text, and **suitable for speech**. Do NOT use Markdown (like ` `), LaTeX (like `$n!$`), or dollar signs.
    3.  The **code snippet** must NOT include any comments.

    Format your response *exactly* as follows, with no other text before or after:

    [EXPLANATION]
    (Your explanation here)
    [CODE]
    (language, e.g., python, java, etc.)
    (Your code block starting on the next line)
    """

    headers = {"Content-Type": "application/json"}
    payload = {
        # Use the new prompt_template
        "contents": [{"parts": [{"text": prompt_template}]}]
    }
    params = {"key": GEMINI_API_KEY}
    
    try:
        async with httpx.AsyncClient(timeout=30.0) as client: # Added timeout
            response = await client.post(GEMINI_API_URL, headers=headers, params=params, json=payload)
            response.raise_for_status() # This will raise an error for 4xx/5xx responses
            
            result = response.json()

            # --- THIS IS THE NEW, RELIABLE PARSING LOGIC ---
            explanation = ""
            code = ""
            language = "plaintext" # Default language

            if "candidates" not in result or not result["candidates"]:
                raise Exception(f"Invalid response from Gemini: {result}")

            # Get the full text response
            text = result["candidates"][0]["content"]["parts"][0]["text"]

            # Use regex to find our [EXPLANATION] and [CODE] tags
            # re.DOTALL (s) makes '.' match newlines
            explanation_match = re.search(r"\[EXPLANATION\](.*)\[CODE\]", text, re.DOTALL | re.IGNORECASE)
            code_match = re.search(r"\[CODE\](.*)", text, re.DOTALL | re.IGNORECASE)

            if explanation_match:
                explanation = explanation_match.group(1).strip()

            if code_match:
                # The code block includes the language on the first line
                code_block = code_match.group(1).strip()
                
                # Split the block into language and code
                try:
                    lines = code_block.split('\n', 1) # Split at the first newline
                    language = lines[0].strip()
                    code = lines[1].strip()
                    
                    # Clean up markdown backticks if Gemini adds them
                    if code.startswith("```"):
                        code = re.sub(r"^```[a-zA-Z]*\n", "", code) # Remove top backticks
                    if code.endswith("```"):
                        code = re.sub(r"\n```$", "", code) # Remove bottom backticks
                        
                except Exception:
                    # If splitting fails, assign the whole block to code
                    code = code_block
                    language = "plaintext"

            if not explanation and not code:
                # If parsing fails, return the raw text as explanation
                explanation = "Could not parse Gemini's response, but here is the raw text:\n" + text
                
            return {"explanation": explanation, "code": code, "language": language}

    except httpx.HTTPStatusError as e:
        print(f"Gemini API returned an error: {e.response.text}")
        return {"error": f"Gemini API error: {e.response.text}"}
    except Exception as e:
        import traceback
        print("Error in generate_code:", traceback.format_exc())
        return {"error": f"An internal error occurred: {str(e)}"}