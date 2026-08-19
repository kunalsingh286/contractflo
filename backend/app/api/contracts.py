import json
import os
import time
import uuid

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from supabase import Client

from app.api.deps import get_current_user, get_supabase_client
from app.api.models import ContractResponse
from app.services.audit_service import log_audit_event

router = APIRouter(prefix="/contracts", tags=["Contracts"])

@router.post("/upload", response_model=ContractResponse)
async def upload_contract(
    file: UploadFile = File(...),
    title: str = Form(...),
    contract_type: str = Form(...),
    status: str = Form(...),
    counterparty: str | None = Form(None),
    description: str | None = Form(None),
    tags: str | None = Form(None),  # JSON string of list
    user = Depends(get_current_user),
    supabase: Client = Depends(get_supabase_client)
):
    if file.content_type not in ["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"]:
        raise HTTPException(status_code=400, detail="Invalid file type. Only PDF and DOCX are allowed.")
    
    file_bytes = await file.read()
    if len(file_bytes) > 25 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File too large. Max 25MB.")
    
    # Get organization (assume first org for simplicity if user belongs to multiple, or require org_id in headers)
    org_res = supabase.table("organization_members").select("organization_id").eq("user_id", user.id).execute()
    if not org_res.data:
        raise HTTPException(status_code=403, detail="User does not belong to any organization")
    
    org_id = org_res.data[0]["organization_id"]
    contract_id = str(uuid.uuid4())
    storage_path = f"{org_id}/{contract_id}/{file.filename}"
    
    # Upload to storage
    # NOTE: Since the backend is acting on behalf of the user, the Supabase client initialized with NEXT_PUBLIC keys
    # might not pass RLS if it relies on anon key + JWT. In FastAPI deps.py, we created the client with anon key.
    # To pass RLS, we must set the auth session or JWT on the client. 
    # But for a backend service, it is often simpler to just use the service_role key to bypass RLS, 
    # and rely on the FastAPI code for authorization (which we just did by checking org_res).
    
    # Upload to Supabase Storage
    file_ext = os.path.splitext(file.filename)[1].lower() if file.filename else ".pdf"
    safe_filename = f"{uuid.uuid4()}{file_ext}"
    storage_path = f"{org_id}/{int(time.time())}_{safe_filename}"
    
    try:
        supabase.storage.from_("contracts").upload(storage_path, file_bytes)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Storage upload failed: {e}")

    # Insert into DB
    contract_data = {
        "organization_id": org_id,
        "uploaded_by": user.id,
        "title": title or (file.filename or "Untitled Contract"),
        "contract_type": contract_type,
        "status": status,
        "counterparty": counterparty,
        "description": description,
        "storage_path": storage_path,
        "file_name": file.filename,
        "file_size": len(file_bytes),
        "mime_type": file.content_type
    }
    
    try:
        res = supabase.table("contracts").insert(contract_data).execute()
        new_contract = res.data[0]
        contract_id = new_contract["id"]
        
        # Insert tags if provided
        if tags:
            try:
                tag_list = json.loads(tags)
                if tag_list:
                    tag_data = [{"contract_id": contract_id, "tag_name": t} for t in tag_list]
                    supabase.table("contract_tags").insert(tag_data).execute()
            except Exception:
                pass
                
        # Insert version
        version_data = {
            "contract_id": contract_id,
            "version_number": 1,
            "storage_path": storage_path,
            "uploaded_by": user.id
        }
        supabase.table("contract_versions").insert(version_data).execute()
        
        log_audit_event(
            supabase=supabase,
            organization_id=org_id,
            user_id=user.id,
            action="CONTRACT_CREATED",
            resource_type="contract",
            resource_id=contract_id,
            metadata={"title": new_contract["title"]}
        )
        
        return new_contract
    except Exception as e:
        # Rollback storage if db fails
        try:
            supabase.storage.from_("contracts").remove([storage_path])
        except Exception:
            pass
        raise HTTPException(status_code=500, detail=str(e))

@router.get("", response_model=list[ContractResponse])
def list_contracts(
    user = Depends(get_current_user),
    supabase: Client = Depends(get_supabase_client)
):
    res = supabase.table("contracts").select("*").order("created_at", desc=True).execute()
    return res.data

@router.get("/{contract_id}")
def get_contract(
    contract_id: str,
    user = Depends(get_current_user),
    supabase: Client = Depends(get_supabase_client)
):
    res = supabase.table("contracts").select("*, contract_tags(tag_name), contract_versions(*)").eq("id", contract_id).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Contract not found")
    return res.data[0]

@router.patch("/{contract_id}", response_model=ContractResponse)
def update_contract(
    contract_id: str,
    title: str | None = Form(None),
    contract_type: str | None = Form(None),
    status: str | None = Form(None),
    counterparty: str | None = Form(None),
    description: str | None = Form(None),
    user = Depends(get_current_user),
    supabase: Client = Depends(get_supabase_client)
):
    update_data = {}
    if title: 
        update_data["title"] = title
    if contract_type: 
        update_data["contract_type"] = contract_type
    if status: 
        update_data["status"] = status
    if counterparty is not None: 
        update_data["counterparty"] = counterparty
    if description is not None: 
        update_data["description"] = description
    
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")
        
    res = supabase.table("contracts").update(update_data).eq("id", contract_id).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Contract not found")
    return res.data[0]

@router.delete("/{contract_id}")
def delete_contract(
    contract_id: str,
    user = Depends(get_current_user),
    supabase: Client = Depends(get_supabase_client)
):
    contract_res = supabase.table("contracts").select("storage_path", "organization_id", "title").eq("id", contract_id).execute()
    if not contract_res.data:
        raise HTTPException(status_code=404, detail="Contract not found")
        
    storage_path = contract_res.data[0]["storage_path"]
    org_id = contract_res.data[0]["organization_id"]
    title = contract_res.data[0]["title"]
    
    # Delete from DB
    supabase.table("contracts").delete().eq("id", contract_id).execute()
    
    # Delete from storage
    try:
        supabase.storage.from_("contracts").remove([storage_path])
    except Exception:
        pass
        
    log_audit_event(
        supabase=supabase,
        organization_id=org_id,
        user_id=user.id,
        action="CONTRACT_DELETED",
        resource_type="contract",
        resource_id=contract_id,
        metadata={"title": title}
    )
    
    return {"message": "Contract deleted successfully"}

@router.get("/download/{contract_id}")
def download_contract(
    contract_id: str,
    user = Depends(get_current_user),
    supabase: Client = Depends(get_supabase_client)
):
    contract_res = supabase.table("contracts").select("storage_path").eq("id", contract_id).execute()
    if not contract_res.data:
        raise HTTPException(status_code=404, detail="Contract not found")
        
    storage_path = contract_res.data[0]["storage_path"]
    
    # Generate signed URL
    try:
        res = supabase.storage.from_("contracts").create_signed_url(storage_path, 3600)
        return {"url": res["signedURL"]}
    except Exception:
        raise HTTPException(status_code=500, detail="Could not generate download URL")
