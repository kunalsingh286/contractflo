import os
import sys
from dotenv import load_dotenv
from supabase import create_client
import uuid
import re

load_dotenv()

supabase_url = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
supabase_key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

if not supabase_url or not supabase_key:
    print("Missing creds")
    sys.exit(1)

supabase = create_client(supabase_url, supabase_key)

email = "delusional282@gmail.com"

# Find user
users = supabase.auth.admin.list_users()
target_user = None
for u in users:
    if u.email == email:
        target_user = u
        break

if not target_user:
    print(f"User {email} not found!")
    sys.exit(1)

print(f"Found user: {target_user.id}")

# Check if they have an org
org_res = supabase.table("organization_members").select("organization_id").eq("user_id", target_user.id).execute()
if org_res.data:
    print(f"User already has org: {org_res.data[0]['organization_id']}")
    sys.exit(0)

print("Provisioning org...")
email_prefix = email.split("@")[0]
org_slug = re.sub(r'[^a-z0-9]', '-', email_prefix.lower()) + '-' + str(uuid.uuid4())[:8]

new_org = supabase.table("organizations").insert({
    "name": f"{email_prefix.capitalize()}'s Company",
    "slug": org_slug
}).execute()

if not new_org.data:
    print("Failed to create org")
    sys.exit(1)

org_id = new_org.data[0]["id"]
print(f"Created Org ID: {org_id}")

member_res = supabase.table("organization_members").insert({
    "organization_id": org_id,
    "user_id": target_user.id,
    "role": "admin"
}).execute()

print("Assigned to org successfully.")
