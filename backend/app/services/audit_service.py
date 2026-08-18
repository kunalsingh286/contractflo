from typing import Any

from supabase import Client


def log_audit_event(
    supabase: Client,
    organization_id: str,
    user_id: str,
    action: str,
    resource_type: str,
    resource_id: str | None = None,
    metadata: dict[str, Any] | None = None
) -> None:
    """
    Asynchronously or synchronously records an audit event to the database.
    This does NOT throw exceptions to the caller to prevent failing the core request.
    """
    try:
        supabase.table("audit_logs").insert({
            "organization_id": organization_id,
            "user_id": user_id,
            "action": action,
            "resource_type": resource_type,
            "resource_id": resource_id,
            "metadata": metadata or {}
        }).execute()
    except Exception as e:
        # In a real system, send this to a fallback logger (Sentry, DataDog, etc.)
        # We must not break the user flow just because the audit logger failed.
        print(f"Failed to write audit log: {e}")
