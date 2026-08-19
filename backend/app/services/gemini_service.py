import json
import os

import google.generativeai as genai
from pydantic import BaseModel, Field

# Configure Gemini
api_key = os.getenv("GEMINI_API_KEY")
if api_key:
    genai.configure(api_key=api_key)

# We define the JSON Schema manually because google-generativeai has bugs with nested Pydantic models ($ref and default fields)
contract_intelligence_schema = {
    "type": "OBJECT",
    "properties": {
        "contract_type": {"type": "STRING"},
        "parties": {
            "type": "ARRAY",
            "items": {
                "type": "OBJECT",
                "properties": {
                    "name": {"type": "STRING"},
                    "role": {"type": "STRING"}
                }
            }
        },
        "effective_date": {"type": "STRING"},
        "expiration_date": {"type": "STRING"},
        "renewal_date": {"type": "STRING"},
        "payment_terms": {"type": "STRING"},
        "confidence": {
            "type": "OBJECT",
            "properties": {
                "contract_type": {"type": "NUMBER"},
                "parties": {"type": "NUMBER"},
                "effective_date": {"type": "NUMBER"},
                "expiration_date": {"type": "NUMBER"},
                "renewal_date": {"type": "NUMBER"},
                "payment_terms": {"type": "NUMBER"}
            }
        }
    }
}

EXTRACTION_PROMPT = """
ROLE:
You are a contract intelligence extraction engine.

TASK:
Extract structured metadata from the supplied contract text.

RULES:
* Use only information present in the contract.
* Never invent or hallucinate missing information.
* Return null when information is unavailable.
* Preserve important legal meaning, especially for payment terms.
* Identify all relevant parties.
* Distinguish contract effective date from expiration/termination dates.
* Identify renewal dates or renewal mechanisms when explicitly present.
* Identify the contract type based on the actual content.
* Return valid structured JSON only, strictly matching the requested schema.
"""

def extract_contract_intelligence(text: str) -> dict:
    model_name = os.getenv("GEMINI_MODEL", "gemini-3.6-flash")
    model = genai.GenerativeModel(model_name)
    
    response = model.generate_content(
        f"{EXTRACTION_PROMPT}\n\nCONTRACT TEXT:\n{text}",
        generation_config=genai.GenerationConfig(
            response_mime_type="application/json",
            temperature=0.0
        )
    )
    
    try:
        data = json.loads(response.text)
        return data
    except Exception as e:
        raise ValueError(f"Failed to parse Gemini response: {e}")

