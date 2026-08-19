import traceback

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from pydantic import BaseModel
from supabase import Client

from app.services.document_service import get_service_role_client
from app.services.obligation_service import extract_contract_obligations

from .deps import get_current_user, get_supabase_client

router = APIRouter(prefix="/contracts", tags=["Obligations"])

def process_obligation_background(contract_id: str, document_id: str, org_id: str):
    supabase = get_service_role_client()
    try:
        # 1. Update status to processing
        supabase.table("contract_documents").update({
            "obligation_extraction_status": "processing",
            "obligation_extraction_error": None
        }).eq("id", document_id).execute()

        # 2. Get extracted text
        doc_res = supabase.table("contract_documents").select("extracted_text, extraction_status").eq("id", document_id).execute()
        if not doc_res.data or doc_res.data[0]["extraction_status"] != "completed" or not doc_res.data[0]["extracted_text"]:
            raise Exception("Contract document text extraction is not complete.")
            
        text = doc_res.data[0]["extracted_text"]
        
        # 3. Get Intelligence for context
        intel_res = supabase.table("contract_intelligence").select("id, contract_type").eq("contract_id", contract_id).execute()
        intel_id = None
        contract_type = "Unknown"
        if intel_res.data:
            intel_id = intel_res.data[0]["id"]
            contract_type = intel_res.data[0].get("contract_type") or "Unknown"
            
        # 4. Analyze Obligations with Gemini
        analysis = extract_contract_obligations(text, contract_type)
        
        # 5. Store Results in DB
        # Delete existing obligations for this contract to prevent duplicates on re-run
        supabase.table("obligations").delete().eq("contract_id", contract_id).execute()
        
        insert_data = []
        for obs in analysis.obligations:
            insert_data.append({
                "organization_id": org_id,
                "contract_id": contract_id,
                "contract_document_id": document_id,
                "contract_intelligence_id": intel_id,
                
                "type": obs.type,
                "title": obs.title,
                "description": obs.description,
                "responsible_party": obs.responsible_party,
                "counterparty": obs.counterparty,
                
                "due_date": obs.due_date,
                "due_date_type": obs.due_date_type,
                "due_date_expression": obs.due_date_expression,
                "recurrence": obs.recurrence,
                "notice_period_days": obs.notice_period_days,
                
                "status": "open",
                "source_clause": obs.source_clause,
                "evidence": obs.evidence,
                "confidence": obs.confidence
            })
            
        if insert_data:
            supabase.table("obligations").insert(insert_data).execute()
            
        # 6. Mark as completed
        supabase.table("contract_documents").update({
            "obligation_extraction_status": "completed"
        }).eq("id", document_id).execute()
        
    except Exception as e:
        print(f"Background obligation extraction failed: {e}")
        print(traceback.format_exc())
        supabase.table("contract_documents").update({
            "obligation_extraction_status": "failed",
            "obligation_extraction_error": str(e)
        }).eq("id", document_id).execute()

@router.post("/{contract_id}/obligation-analysis")
def analyze_contract_obligations(
    contract_id: str,
    background_tasks: BackgroundTasks,
    user = Depends(get_current_user),
    supabase: Client = Depends(get_supabase_client)
):
    # 1. Verify contract exists and user has access
    contract_res = supabase.table("contracts").select("id, organization_id").eq("id", contract_id).execute()
    if not contract_res.data:
        raise HTTPException(status_code=404, detail="Contract not found or access denied")
        
    org_id = contract_res.data[0]["organization_id"]
        
    # 2. Check if Phase 3 is done
    doc_res = supabase.table("contract_documents").select("id, extraction_status").eq("contract_id", contract_id).execute()
    if not doc_res.data or doc_res.data[0]["extraction_status"] != "completed":
        raise HTTPException(status_code=400, detail="Contract document processing is not complete. Cannot run obligation analysis.")
        
    document_id = doc_res.data[0]["id"]

    # 3. Mark as pending
    supabase.table("contract_documents").update({
        "obligation_extraction_status": "pending",
        "obligation_extraction_error": None
    }).eq("id", document_id).execute()
        
    # 4. Dispatch background task
    background_tasks.add_task(process_obligation_background, contract_id, document_id, org_id)
    
    return {"message": "Obligation analysis started", "status": "pending"}

@router.get("/all/obligations")
def get_all_obligations(
    user = Depends(get_current_user),
    supabase: Client = Depends(get_supabase_client)
):
    """Get all obligations for the organization's contracts for the Obligation Center dashboard"""
    # RLS limits to the user's org
    obs_res = supabase.table("obligations").select("*, contracts(title)").order("due_date", nulls_last=True).execute()
    return obs_res.data

@router.get("/{contract_id}/obligations/status")
def get_obligation_status(
    contract_id: str,
    user = Depends(get_current_user),
    supabase: Client = Depends(get_supabase_client)
):
    doc_res = supabase.table("contract_documents").select("obligation_extraction_status, obligation_extraction_error").eq("contract_id", contract_id).execute()
    
    if not doc_res.data:
         return {"status": "none"}
         
    status = doc_res.data[0].get("obligation_extraction_status")
    if not status or status == 'none':
         return {"status": "none"}
         
    return {
        "status": status,
        "error": doc_res.data[0].get("obligation_extraction_error")
    }

@router.get("/all/obligations")
def get_all_obligations(
    user = Depends(get_current_user),
    supabase: Client = Depends(get_supabase_client)
):
    """Get all obligations for the organization's contracts for the Obligation Center dashboard"""
    # RLS limits to the user's org
    obs_res = supabase.table("obligations").select("*, contracts(title)").order("due_date", nulls_last=True).execute()
    return obs_res.data

@router.get("/{contract_id}/obligations")
def get_contract_obligations(
    contract_id: str,
    user = Depends(get_current_user),
    supabase: Client = Depends(get_supabase_client)
):
    obs_res = supabase.table("obligations").select("*").eq("contract_id", contract_id).order("created_at").execute()
    
    # We return the list even if empty, as the status endpoint dictates if it's done
    return obs_res.data

class ObligationUpdate(BaseModel):
    status: str | None = None
    title: str | None = None
    description: str | None = None
    due_date: str | None = None

@router.patch("/obligations/{obligation_id}")
def update_obligation(
    obligation_id: str,
    update_data: ObligationUpdate,
    user = Depends(get_current_user),
    supabase: Client = Depends(get_supabase_client)
):
    # The RLS ensures they can only update if they belong to the org
    update_dict = {k: v for k, v in update_data.model_dump().items() if v is not None}
    
    if not update_dict:
         return {"message": "Nothing to update"}
         
    res = supabase.table("obligations").update(update_dict).eq("id", obligation_id).execute()
    if not res.data:
         raise HTTPException(status_code=404, detail="Obligation not found or access denied")
         
    return res.data[0]
