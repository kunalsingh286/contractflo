import asyncio
import os
import time
import uuid
from fpdf import FPDF
from dotenv import load_dotenv

# Load env before importing services
load_dotenv()

from app.api.deps import get_supabase_client
from app.api.intelligence import process_contract_background

# 1. Create a dummy PDF
print("Creating dummy NDA PDF...")
pdf = FPDF()
pdf.add_page()
pdf.set_font("Arial", size=12)
pdf_text = """NON-DISCLOSURE AGREEMENT

This Non-Disclosure Agreement (the "Agreement") is entered into by and between Acme Corp ("Disclosing Party") and Globex Inc ("Receiving Party").

1. Confidential Information. The Disclosing Party may share trade secrets, financial data, and technical specifications.
2. Obligations. The Receiving Party must not disclose any Confidential Information to third parties for a period of 5 years.
3. Penalties. A breach of this agreement will result in a $1,000,000 penalty.
4. Jurisdiction. This agreement shall be governed by the laws of the State of California.
"""
pdf.multi_cell(0, 10, txt=pdf_text)
pdf.output("dummy_nda.pdf")

# 2. Setup DB and Storage
print("Setting up Supabase DB & Storage...")
supabase = get_supabase_client()

# Hardcoded test org id from previous tests (or fetch one)
org_res = supabase.table("organizations").select("id").limit(1).execute()
if not org_res.data:
    print("No organizations found. Cannot run test.")
    exit(1)
org_id = org_res.data[0]["id"]

# Upload PDF
contract_id = str(uuid.uuid4())
storage_path = f"{org_id}/test_{contract_id}.pdf"
with open("dummy_nda.pdf", "rb") as f:
    supabase.storage.from_("contracts").upload(storage_path, f.read())

# Insert Contract
print("Inserting mock contract into DB...")
contract_res = supabase.table("contracts").insert({
    "id": contract_id,
    "organization_id": org_id,
    "title": "Test E2E NDA",
    "contract_type": "NDA",
    "status": "Review",
    "storage_path": storage_path,
    "file_name": "dummy_nda.pdf",
    "file_size": os.path.getsize("dummy_nda.pdf"),
    "mime_type": "application/pdf"
}).execute()

doc_res = supabase.table("contract_documents").insert({
    "contract_id": contract_id,
    "extraction_status": "processing"
}).execute()
doc_id = doc_res.data[0]["id"]

# 3. Run AI Pipeline
print("Running AI Pipeline (OCR + Gemini Extraction + Risks + Obligations)...")
process_contract_background(contract_id, doc_id, storage_path)

# 4. Verify Results
print("\n--- RESULTS ---")
status_res = supabase.table("contract_documents").select("extraction_status, extraction_error").eq("id", doc_id).execute()
print(f"Extraction Status: {status_res.data[0]}")

intel_res = supabase.table("contract_intelligence").select("*").eq("contract_id", contract_id).execute()
print(f"Intelligence Extracted: {len(intel_res.data)} rows")
if intel_res.data:
    print(f"Summary: {intel_res.data[0].get('summary')}")

risks_res = supabase.table("contract_risks").select("risk_level, findings").eq("contract_id", contract_id).execute()
print(f"Risks Extracted: {len(risks_res.data)} rows")
for r in risks_res.data:
    findings = r.get("findings", {})
    if isinstance(findings, dict):
        for severity, risk_list in findings.items():
            for f in risk_list:
                if isinstance(f, dict):
                    print(f" - [{severity.upper()}] {f.get('title', 'Unknown')}: {f.get('explanation', '')}")

obs_res = supabase.table("obligations").select("type, description").eq("contract_id", contract_id).execute()
print(f"Obligations Extracted: {len(obs_res.data)} rows")
for o in obs_res.data:
    print(f" - {o['type']}: {o['description']}")

# Clean up
try:
    os.remove("dummy_nda.pdf")
except:
    pass
