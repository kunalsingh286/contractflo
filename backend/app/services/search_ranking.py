from typing import Any

from supabase import Client

from app.api.schemas.search import SearchEvidence, SearchResultSchema
from app.services.vector_store import QDRANT_COLLECTION, get_qdrant_client


def perform_hybrid_search(
    supabase: Client,
    organization_id: str,
    filters: dict[str, Any]
) -> list[SearchResultSchema]:
    """
    Executes Postgres queries + Qdrant semantic queries and fuses them.
    """
    contract_map = {} # contract_id -> dict of data
    
    # --- 1. Postgres Base Contracts ---
    # We fetch all contracts for the org to act as the base truth
    # In production with thousands of contracts, we'd apply the SQL filters here
    # and only fetch the intersecting set. For this V1, we filter locally or via Supabase chained queries.
    
    query = supabase.table("contracts").select(
        "id, title, contract_type, status, counterparty, expiration_date"
    ).eq("organization_id", organization_id)
    
    # Apply strict postgres filters
    if filters.get("contract_type"):
        query = query.eq("contract_type", filters["contract_type"])
    if filters.get("expiration_from"):
        query = query.gte("expiration_date", filters["expiration_from"].isoformat())
    if filters.get("expiration_to"):
        query = query.lte("expiration_date", filters["expiration_to"].isoformat())
        
    res = query.execute()
    base_contracts = res.data if res.data else []
    
    valid_contract_ids = set()
    for c in base_contracts:
        valid_contract_ids.add(c["id"])
        contract_map[c["id"]] = {
            "metadata": c,
            "relevance_score": 0.0,
            "match_reasons": [],
            "evidence": []
        }
        
    if not valid_contract_ids:
        return [] # No base contracts match the strict filters
        
    # Apply "Match Reasons" for Postgres filters
    for cid in valid_contract_ids:
        if filters.get("contract_type"):
            contract_map[cid]["relevance_score"] += 0.5
            contract_map[cid]["match_reasons"].append(f"Contract type matches {filters['contract_type']}")
        if filters.get("expiration_from"):
            contract_map[cid]["relevance_score"] += 0.5
            contract_map[cid]["match_reasons"].append("Expiration date matches timeframe")

    # --- 2. Risk Data ---
    risk_query = supabase.table("contract_risks").select("contract_id, risk_level, risk_score").in_("contract_id", list(valid_contract_ids))
    if filters.get("risk_level"):
        risk_query = risk_query.eq("risk_level", filters["risk_level"])
    
    risk_res = risk_query.execute()
    for r in (risk_res.data or []):
        cid = r["contract_id"]
        contract_map[cid]["metadata"]["risk_level"] = r.get("risk_level")
        contract_map[cid]["metadata"]["risk_score"] = r.get("risk_score")
        
        if filters.get("risk_level"):
            contract_map[cid]["relevance_score"] += 1.0
            contract_map[cid]["match_reasons"].append(f"Risk level matches {filters['risk_level']}")
            
    # Remove contracts that failed the risk filter (if it was requested)
    if filters.get("risk_level"):
        matched_risk_cids = {r["contract_id"] for r in (risk_res.data or [])}
        valid_contract_ids = valid_contract_ids.intersection(matched_risk_cids)

    # --- 3. Obligation Data ---
    if filters.get("obligation_type"):
        ob_query = supabase.table("obligations").select("contract_id").in_("contract_id", list(valid_contract_ids)).eq("type", filters["obligation_type"]).execute()
        matched_ob_cids = {o["contract_id"] for o in (ob_query.data or [])}
        
        for cid in matched_ob_cids:
            contract_map[cid]["relevance_score"] += 1.0
            contract_map[cid]["match_reasons"].append(f"Contains {filters['obligation_type']} obligation")
            
        valid_contract_ids = valid_contract_ids.intersection(matched_ob_cids)

    if not valid_contract_ids:
        return []

    # --- 4. Semantic Search (Qdrant) ---
    q_str = filters.get("semantic_query", "").strip()
    if q_str:
        try:
            q_client = get_qdrant_client()
            search_result = q_client.query_points(
                collection_name=QDRANT_COLLECTION,
                query=q_str,
                query_filter={
                    "must": [
                        {"key": "organization_id", "match": {"value": organization_id}},
                    ]
                },
                limit=15 # Get top 15 chunks across org
            )
            
            for point in search_result.points:
                cid = point.payload.get("contract_id")
                if cid in valid_contract_ids:
                    # Semantic hit
                    contract_map[cid]["relevance_score"] += point.score
                    
                    reason = "Semantic match in contract text"
                    if reason not in contract_map[cid]["match_reasons"]:
                        contract_map[cid]["match_reasons"].append(reason)
                        
                    contract_map[cid]["evidence"].append(SearchEvidence(
                        section_title=point.payload.get("section_title"),
                        page_number=point.payload.get("page_number"),
                        excerpt=point.payload.get("text", "")[:300] + "..."
                    ))
        except Exception as e:
            print(f"Qdrant global search failed: {e}")
            # Do not fail entirely, just degrade gracefully
            
    # --- 5. Result Fusion & Formatting ---
    results = []
    for cid in valid_contract_ids:
        data = contract_map[cid]
        # Only return items that actually had a positive relevance score if a semantic query was present
        # If there was no semantic query but there were filters, we still return it
        if q_str and data["relevance_score"] == 0.0:
            # Meaning it didn't match semantic search AND didn't match any structured filters (score = 0)
            continue
            
        # Provide default match reason if none
        if not data["match_reasons"]:
            data["match_reasons"].append("Keyword match")
            
        results.append(SearchResultSchema(
            contract_id=cid,
            title=data["metadata"].get("title", "Unknown"),
            contract_type=data["metadata"].get("contract_type"),
            counterparty=data["metadata"].get("counterparty"),
            status=data["metadata"].get("status", "Unknown"),
            risk_level=data["metadata"].get("risk_level"),
            risk_score=data["metadata"].get("risk_score"),
            expiration_date=data["metadata"].get("expiration_date"),
            relevance_score=round(data["relevance_score"], 2),
            match_reasons=data["match_reasons"],
            evidence=data["evidence"][:2] # Limit to top 2 pieces of evidence per contract
        ))
        
    # Sort by relevance
    results.sort(key=lambda x: x.relevance_score, reverse=True)
    
    return results
