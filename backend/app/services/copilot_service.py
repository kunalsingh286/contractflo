import json
import os
from typing import Any

import google.generativeai as genai
from pydantic import BaseModel, Field
# Schema for the final Copilot response
class CitationSchema(BaseModel):
    chunk_id: str | None = Field(None, description="The UUID of the Qdrant chunk.")
    page_number: int | None = Field(None, description="The page number from the source document.")
    section_title: str | None = Field(None, description="The section title or heading.")
    excerpt: str = Field(description="A short, exact quote from the source proving the answer.")

class CopilotResponseSchema(BaseModel):
    answer: str = Field(description="The grounded answer to the user's question.")
    citations: list[CitationSchema] = Field(default_factory=list, description="Citations supporting the answer.")
    confidence: float = Field(description="Confidence score (0.0 to 1.0).")


COPILOT_SYSTEM_PROMPT = """
ROLE:
You are ContractFlo Contract Copilot, an enterprise-grade AI legal assistant.

RULES:
1. Answer only using the supplied contract context.
2. Never invent contract facts or dates.
3. If the answer is not available in the context, explicitly say that the provided contract information does not establish the answer.
4. Do not rely on general legal knowledge to manufacture an answer.
5. Distinguish between contract language and your interpretation (if interpretation is useful).
6. Preserve important legal meaning.
7. Be concise but useful.
8. Cite the relevant source sections/pages when available using the JSON citations array.
9. Do not claim certainty when evidence is ambiguous.
10. Do not provide unsupported legal conclusions.

Context is provided in two parts: Structured Data (extracted metadata, risks, obligations) and Document Chunks (exact semantic text from the contract).
If the user asks for a summary, synthesize the structured data and chunks.
"""

def route_query(query: str) -> str:
    """
    Determines if the query primarily needs structured data or semantic chunks.
    Returns: 'structured', 'semantic', or 'hybrid'.
    """
    query_lower = query.lower()
    
    structured_keywords = ["expire", "expiration", "effective", "parties", "who is", "payment terms", "contract type", "risks", "obligations", "deliverables", "status"]
    
    if any(k in query_lower for k in structured_keywords) and len(query_lower.split()) < 15:
        return 'hybrid' # Always safe to use hybrid, but we weight structured data
        
    if "summarize" in query_lower or "summary" in query_lower:
        return 'hybrid'
        
    return 'hybrid'

def get_hybrid_context(supabase, organization_id: str, contract_id: str, query: str) -> dict[str, Any]:
    """
    Fetches structured data (Intelligence, Risks, Obligations) and semantic chunks from Qdrant.
    """
    context = {
        "structured_data": {},
        "chunks": []
    }
    
    # 1. Fetch Structured Data
    intel_res = supabase.table("contract_intelligence").select("*").eq("contract_id", contract_id).execute()
    if intel_res.data:
        context["structured_data"]["intelligence"] = intel_res.data[0]
        
    risk_res = supabase.table("contract_risks").select("*").eq("contract_id", contract_id).execute()
    if risk_res.data:
        context["structured_data"]["risks"] = risk_res.data[0]
        
    obs_res = supabase.table("obligations").select("*").eq("contract_id", contract_id).execute()
    if obs_res.data:
        context["structured_data"]["obligations"] = obs_res.data
        
    # 2. Fetch Semantic Chunks
    try:
        from app.services.embedding_service import embedding_model
        
        embeddings_generator = embedding_model.embed([query])
        query_embedding = list(embeddings_generator)[0].tolist()
        
        rpc_res = supabase.rpc(
            "match_contract_chunks",
            {
                "query_embedding": query_embedding,
                "match_threshold": 0.2,
                "match_count": 30, # Fetch more since we search whole org
                "org_id": organization_id
            }
        ).execute()
        
        chunks = []
        for row in (rpc_res.data or []):
            if row.get("contract_id") == contract_id:
                chunks.append({
                    "chunk_id": row.get("id"),
                    "section_title": row.get("section_title"),
                    "page_number": row.get("page_number"),
                    "text": row.get("text")
                })
                if len(chunks) >= 5:
                    break
                    
        context["chunks"] = chunks
    except Exception as e:
        print(f"pgvector retrieval failed: {e}")
        # Gracefully degrade to just structured data
        pass
        
    return context

def generate_copilot_response(
    supabase, 
    organization_id: str, 
    contract_id: str, 
    query: str, 
    history: list[dict] = None
) -> CopilotResponseSchema:
    """
    Builds the hybrid context, formats the prompt with history, and invokes Gemini.
    """
    # 1. Retrieve hybrid context
    context = get_hybrid_context(supabase, organization_id, contract_id, query)
    
    # 2. Construct Prompt
    prompt_parts = [COPILOT_SYSTEM_PROMPT]
    
    prompt_parts.append("\n--- STRUCTURED DATA ---")
    prompt_parts.append(json.dumps(context["structured_data"], indent=2, default=str))
    
    prompt_parts.append("\n--- DOCUMENT CHUNKS ---")
    for i, chunk in enumerate(context["chunks"]):
        prompt_parts.append(f"Chunk ID: {chunk.get('chunk_id')}")
        prompt_parts.append(f"Section: {chunk.get('section_title')}")
        prompt_parts.append(f"Text:\n{chunk.get('text')}\n")
        
    prompt_parts.append("\n--- CHAT HISTORY ---")
    if history:
        for msg in history[-4:]: # Keep last 4 messages for context
            prompt_parts.append(f"{msg['role'].upper()}: {msg['content']}")
    else:
        prompt_parts.append("No previous history.")
        
    prompt_parts.append("\n--- CURRENT QUESTION ---")
    prompt_parts.append(f"USER: {query}")
    prompt_parts.append("\nGenerate the grounded JSON response.")
    
    full_prompt = "\n".join(prompt_parts)
    
    # 3. Call Gemini
    model_name = os.getenv("GEMINI_MODEL", "gemini-1.5-flash")
    model = genai.GenerativeModel(model_name)
    
    response = model.generate_content(
        full_prompt,
        generation_config=genai.GenerationConfig(
            response_mime_type="application/json",
            response_schema=CopilotResponseSchema,
            temperature=0.1
        )
    )
    
    # 4. Parse and return
    try:
        data = json.loads(response.text)
        return CopilotResponseSchema.model_validate(data)
    except Exception as e:
        raise ValueError(f"Failed to parse Gemini copilot response: {e}\nResponse: {response.text}")
