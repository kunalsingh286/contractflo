from datetime import date, timedelta

from supabase import Client

from app.api.schemas.analytics import (
    AnalyticsDashboardSchema,
    ContractTypeCount,
    HighRiskContract,
    LifecycleCount,
    ObligationMetrics,
    RiskDistribution,
    UpcomingRenewal,
)


def get_dashboard_analytics(supabase: Client, organization_id: str) -> AnalyticsDashboardSchema:
    # 1. Total Contracts & Contracts by Type & Lifecycle
    contracts_res = supabase.table("contracts").select("id, title, contract_type, status, counterparty, expiration_date, renewal_date").eq("organization_id", organization_id).execute()
    contracts = contracts_res.data or []
    
    total_contracts = len(contracts)
    
    type_counts = {}
    lifecycle_counts = {}
    
    today = date.today()
    
    upcoming_renewals = []
    
    for c in contracts:
        c_type = c.get("contract_type") or "Uncategorized"
        type_counts[c_type] = type_counts.get(c_type, 0) + 1
        
        status = c.get("status") or "Unknown"
        lifecycle_counts[status] = lifecycle_counts.get(status, 0) + 1
        
        # Check upcoming renewals (within 90 days)
        # Use renewal_date primarily, fallback to expiration_date
        date_str = c.get("renewal_date") or c.get("expiration_date")
        if date_str:
            target_date = date.fromisoformat(date_str)
            days_remaining = (target_date - today).days
            if 0 <= days_remaining <= 90:
                upcoming_renewals.append(UpcomingRenewal(
                    contract_id=c["id"],
                    title=c["title"],
                    contract_type=c_type,
                    counterparty=c.get("counterparty"),
                    renewal_date=c.get("renewal_date"),
                    expiration_date=c.get("expiration_date"),
                    days_remaining=days_remaining,
                    risk_level=None # populated later
                ))
                
    # 2. Risk Distribution & High Risk Contracts
    valid_cids = [c["id"] for c in contracts]
    risk_distribution = RiskDistribution()
    high_risk_list = []
    
    if valid_cids:
        # Get risks
        risks_res = supabase.table("contract_risks").select("contract_id, risk_score, risk_level").in_("contract_id", valid_cids).execute()
        
        # Map for enrichment
        risk_map = {r["contract_id"]: r for r in (risks_res.data or [])}
        
        for r in (risks_res.data or []):
            level = r.get("risk_level", "").lower()
            if level == "high":
                risk_distribution.high += 1
            elif level == "medium":
                risk_distribution.medium += 1
            elif level == "low":
                risk_distribution.low += 1
            elif level == "critical":
                risk_distribution.critical += 1
                
            # If high or critical, potentially add to high risk list
            if level in ["high", "critical"] and r.get("risk_score") is not None:
                # Find contract meta
                c_meta = next((c for c in contracts if c["id"] == r["contract_id"]), None)
                if c_meta:
                    high_risk_list.append(HighRiskContract(
                        contract_id=c_meta["id"],
                        title=c_meta["title"],
                        contract_type=c_meta.get("contract_type"),
                        counterparty=c_meta.get("counterparty"),
                        risk_score=r["risk_score"],
                        risk_level=r["risk_level"]
                    ))
                    
        # Update upcoming renewals with risk
        for ur in upcoming_renewals:
            if ur.contract_id in risk_map:
                ur.risk_level = risk_map[ur.contract_id].get("risk_level")
                
    # Sort and limit
    high_risk_list.sort(key=lambda x: x.risk_score or 0, reverse=True)
    high_risk_contracts = high_risk_list[:5] # Top 5
    upcoming_renewals.sort(key=lambda x: x.days_remaining)
    upcoming_renewals = upcoming_renewals[:5] # Top 5 closest renewals

    # 3. Obligations
    ob_metrics = ObligationMetrics()
    if valid_cids:
        obs_res = supabase.table("obligations").select("status, due_date").in_("contract_id", valid_cids).eq("status", "open").execute()
        
        for o in (obs_res.data or []):
            ob_metrics.total += 1
            if o.get("due_date"):
                d_date = date.fromisoformat(o["due_date"])
                if d_date < today:
                    ob_metrics.overdue += 1
                elif d_date <= today + timedelta(days=30):
                    ob_metrics.due_soon += 1

    return AnalyticsDashboardSchema(
        total_contracts=total_contracts,
        contracts_by_type=[ContractTypeCount(contract_type=k, count=v) for k, v in type_counts.items()],
        risk_distribution=risk_distribution,
        lifecycle_distribution=[LifecycleCount(status=k, count=v) for k, v in lifecycle_counts.items()],
        upcoming_renewals=upcoming_renewals,
        open_obligations=ob_metrics,
        high_risk_contracts=high_risk_contracts
    )
