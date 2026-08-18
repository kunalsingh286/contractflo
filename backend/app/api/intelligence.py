import traceback

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from supabase import Client

from app.services.document_service import (
    extract_text_from_storage,
    get_service_role_client,
)
from app.services.embedding_service import process_document_embeddings
from app.services.gemini_service import extract_contract_intelligence

from .deps import get_current_user, get_supabase_client

router = APIRouter(prefix="/contracts", tags=["Intelligence"])

def process_contract_background(contract_id: str, document_id: str, storage_path: str):
    supabase = get_service_role_client()
    try:
        # 1. Extract text with Docling
        text = extract_text_from_storage(storage_path)
        
        # Save extracted text
        supabase.table("contract_documents").update({
            "extracted_text": text
        }).eq("id", document_id).execute()
        
        if not text or len(text.strip()) < 50:
            supabase.table("contract_documents").update({
                "extraction_status": "requires_ocr",
                "extraction_error": "Extracted text is too short or empty."
            }).eq("id", document_id).execute()
            return
            
        # 2. Generate chunks and embeddings in Qdrant
        # We need the org_id to properly isolate vectors
        org_res = supabase.table("contracts").select("organization_id").eq("id", contract_id).execute()
        if org_res.data:
            org_id = org_res.data[0]["organization_id"]
            process_document_embeddings(org_id, contract_id, document_id, text)
            
        # 3. Extract intelligence with Gemini
        intelligence = extract_contract_intelligence(text)
        
        # 3. Store intelligence in DB
        intel_data = intelligence.model_dump()
        
        db_data = {
            "contract_id": contract_id,
            "contract_document_id": document_id,
            "contract_type": intel_data.get("contract_type"),
            "parties": intel_data.get("parties"),
            "effective_date": intel_data.get("effective_date"),
            "expiration_date": intel_data.get("expiration_date"),
            "renewal_date": intel_data.get("renewal_date"),
            "payment_terms": intel_data.get("payment_terms"),
            "confidence": intel_data.get("confidence"),
            "model_name": "gemini-1.5-flash"
        }
        
        # Upsert intelligence (delete old if exists)
        supabase.table("contract_intelligence").delete().eq("contract_id", contract_id).execute()
        supabase.table("contract_intelligence").insert(db_data).execute()
        
        # 4. Mark completed
        supabase.table("contract_documents").update({
            "extraction_status": "completed"
        }).eq("id", document_id).execute()
        
    except Exception as e:
        print(f"Background extraction failed: {e}")
        print(traceback.format_exc())
        supabase.table("contract_documents").update({
            "extraction_status": "failed",
            "extraction_error": str(e)
        }).eq("id", document_id).execute()

@router.post("/{contract_id}/analyze")
def analyze_contract(
    contract_id: str,
    background_tasks: BackgroundTasks,
    user = Depends(get_current_user),
    supabase: Client = Depends(get_supabase_client)
):
    # 1. Verify contract exists and user has access
    contract_res = supabase.table("contracts").select("id, storage_path").eq("id", contract_id).execute()
    if not contract_res.data:
        raise HTTPException(status_code=404, detail="Contract not found or access denied")
        
    storage_path = contract_res.data[0]["storage_path"]
    
    # 2. Create or update contract_document record
    doc_res = supabase.table("contract_documents").select("id").eq("contract_id", contract_id).execute()
    if doc_res.data:
        document_id = doc_res.data[0]["id"]
        supabase.table("contract_documents").update({
            "extraction_status": "processing",
            "extraction_error": None
        }).eq("id", document_id).execute()
    else:
        new_doc = supabase.table("contract_documents").insert({
            "contract_id": contract_id,
            "extraction_status": "processing"
        }).execute()
        document_id = new_doc.data[0]["id"]
        
    # 3. Dispatch background task
    background_tasks.add_task(process_contract_background, contract_id, document_id, storage_path)
    
    return {"message": "Analysis started", "document_id": document_id, "status": "processing"}

@router.get("/{contract_id}/intelligence/status")
def get_intelligence_status(
    contract_id: str,
    user = Depends(get_current_user),
    supabase: Client = Depends(get_supabase_client)
):
    doc_res = supabase.table("contract_documents").select("extraction_status, extraction_error").eq("contract_id", contract_id).order("created_at", desc=True).limit(1).execute()
    
    if not doc_res.data:
        return {"status": "none"}
        
    return doc_res.data[0]

@router.get("/{contract_id}/intelligence")
def get_intelligence(
    contract_id: str,
    user = Depends(get_current_user),
    supabase: Client = Depends(get_supabase_client)
):
    intel_res = supabase.table("contract_intelligence").select("*").eq("contract_id", contract_id).execute()
    
    if not intel_res.data:
        raise HTTPException(status_code=404, detail="Intelligence not found")
        
    return intel_res.data[0]
