from fastapi import APIRouter, Depends, HTTPException, Query
from supabase import Client

from app.api.schemas.search import SearchResponseSchema
from app.services.search_parser import parse_search_query
from app.services.search_ranking import perform_hybrid_search

from .deps import get_current_user, get_supabase_client

router = APIRouter(prefix="/search", tags=["Search"])

@router.get("", response_model=SearchResponseSchema)
def global_search(
    q: str | None = None,
    contract_type: str | None = None,
    status: str | None = None,
    risk_level: str | None = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    user = Depends(get_current_user),
    supabase: Client = Depends(get_supabase_client)
):
    # 1. Verify user belongs to an organization
    org_res = supabase.table("organization_members").select("organization_id").eq("user_id", user.id).execute()
    if not org_res.data:
        raise HTTPException(status_code=403, detail="User does not belong to any organization")
        
    org_id = org_res.data[0]["organization_id"]
    
    # 2. Parse natural language query
    filters = parse_search_query(q)
    
    # 3. Apply explicit overrides from query params
    if contract_type:
        filters["contract_type"] = contract_type
    if status:
        filters["status"] = status
    if risk_level:
        filters["risk_level"] = risk_level
        
    # 4. Perform Hybrid Search
    results = perform_hybrid_search(supabase, org_id, filters)
    
    # 5. Handle Pagination
    start_idx = (page - 1) * page_size
    end_idx = start_idx + page_size
    paginated_results = results[start_idx:end_idx]
    
    # Remove large objects if empty
    return SearchResponseSchema(
        results=paginated_results,
        total_count=len(results),
        page=page,
        page_size=page_size,
        applied_filters={k: str(v) for k, v in filters.items() if v}
    )
