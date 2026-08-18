import os
import tempfile

from docling.document_converter import DocumentConverter
from supabase import Client, create_client


def get_service_role_client() -> Client:
    url = os.environ.get("SUPABASE_URL")
    key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
    if not url or not key:
        raise ValueError("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set for background tasks")
    return create_client(url, key)

def extract_text_from_storage(storage_path: str) -> str:
    """
    Downloads a document from Supabase Storage and extracts text using Docling.
    """
    supabase = get_service_role_client()
    
    # Download file to memory
    response = supabase.storage.from_("contracts").download(storage_path)
    if not response:
        raise Exception("Failed to download file from storage")
    
    # Get original extension
    ext = ".pdf"
    if storage_path.lower().endswith(".docx"):
        ext = ".docx"
        
    # Write to temp file for Docling
    with tempfile.NamedTemporaryFile(delete=False, suffix=ext) as temp_file:
        temp_file.write(response)
        temp_file_path = temp_file.name
        
    try:
        # Convert using Docling
        converter = DocumentConverter()
        result = converter.convert(temp_file_path)
        
        # Extract text
        text = result.document.export_to_markdown()
        return text
    finally:
        # Clean up temp file
        if os.path.exists(temp_file_path):
            os.remove(temp_file_path)
