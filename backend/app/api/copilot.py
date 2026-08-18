from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from supabase import Client

from app.services.copilot_service import generate_copilot_response

from .deps import get_current_user, get_supabase_client

router = APIRouter(tags=["Copilot"])

class CreateSessionRequest(BaseModel):
    title: str | None = "New Chat"

class MessageRequest(BaseModel):
    content: str

@router.post("/contracts/{contract_id}/chat/sessions")
def create_chat_session(
    contract_id: str,
    request: CreateSessionRequest,
    user = Depends(get_current_user),
    supabase: Client = Depends(get_supabase_client)
):
    # Verify contract and get org
    contract_res = supabase.table("contracts").select("organization_id").eq("id", contract_id).execute()
    if not contract_res.data:
        raise HTTPException(status_code=404, detail="Contract not found or access denied")
        
    org_id = contract_res.data[0]["organization_id"]
    
    # Create session
    session_data = {
        "organization_id": org_id,
        "contract_id": contract_id,
        "user_id": user.id,
        "title": request.title
    }
    
    res = supabase.table("contract_chat_sessions").insert(session_data).execute()
    return res.data[0]

@router.get("/contracts/{contract_id}/chat/sessions")
def list_chat_sessions(
    contract_id: str,
    user = Depends(get_current_user),
    supabase: Client = Depends(get_supabase_client)
):
    res = supabase.table("contract_chat_sessions").select("*").eq("contract_id", contract_id).order("updated_at", desc=True).execute()
    return res.data

@router.get("/chat/sessions/{session_id}/messages")
def get_session_messages(
    session_id: str,
    user = Depends(get_current_user),
    supabase: Client = Depends(get_supabase_client)
):
    # RLS ensures user can only see messages in their org's sessions
    res = supabase.table("contract_chat_messages").select("*").eq("session_id", session_id).order("created_at").execute()
    return res.data

@router.delete("/chat/sessions/{session_id}")
def delete_chat_session(
    session_id: str,
    user = Depends(get_current_user),
    supabase: Client = Depends(get_supabase_client)
):
    res = supabase.table("contract_chat_sessions").delete().eq("id", session_id).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Session not found or access denied")
    return {"message": "Session deleted"}

@router.post("/chat/sessions/{session_id}/messages")
def send_chat_message(
    session_id: str,
    request: MessageRequest,
    user = Depends(get_current_user),
    supabase: Client = Depends(get_supabase_client)
):
    if not request.content or len(request.content.strip()) == 0:
        raise HTTPException(status_code=400, detail="Message cannot be empty")
        
    if len(request.content) > 2000:
        raise HTTPException(status_code=400, detail="Message exceeds maximum length of 2000 characters")

    # 1. Get Session details
    session_res = supabase.table("contract_chat_sessions").select("organization_id, contract_id").eq("id", session_id).execute()
    if not session_res.data:
        raise HTTPException(status_code=404, detail="Session not found or access denied")
        
    org_id = session_res.data[0]["organization_id"]
    contract_id = session_res.data[0]["contract_id"]
    
    # 2. Save User Message
    user_msg = {
        "session_id": session_id,
        "role": "user",
        "content": request.content
    }
    supabase.table("contract_chat_messages").insert(user_msg).execute()
    
    # 3. Get recent history
    history_res = supabase.table("contract_chat_messages").select("role, content").eq("session_id", session_id).order("created_at").execute()
    history = history_res.data if history_res.data else []
    
    # 4. Generate Copilot Response
    try:
        copilot_res = generate_copilot_response(
            supabase=supabase,
            organization_id=org_id,
            contract_id=contract_id,
            query=request.content,
            history=history
        )
    except Exception as e:
        print(f"Copilot generation failed: {e}")
        # Save error message so user sees it
        err_msg = {
            "session_id": session_id,
            "role": "assistant",
            "content": "I apologize, but I encountered an error while processing your request. Please try again."
        }
        err_res = supabase.table("contract_chat_messages").insert(err_msg).execute()
        return err_res.data[0]
        
    # 5. Save Assistant Message
    assistant_msg = {
        "session_id": session_id,
        "role": "assistant",
        "content": copilot_res.answer,
        "citations": [c.model_dump() for c in copilot_res.citations],
    }
    
    res = supabase.table("contract_chat_messages").insert(assistant_msg).execute()
    
    # Update session updated_at
    supabase.table("contract_chat_sessions").update({"title": request.content[:50] + "..."}).eq("id", session_id).execute()
    
    return res.data[0]
