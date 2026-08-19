import re
import uuid
from typing import List
from fastembed import TextEmbedding

from app.api.deps import get_supabase_client

# Load model globally to avoid reloading on every upload
# BAAI/bge-small-en-v1.5 outputs 384-dimensional embeddings
embedding_model = TextEmbedding(model_name="BAAI/bge-small-en-v1.5")

def chunk_markdown(text: str, max_chunk_length: int = 1000) -> list[dict]:
    """
    Intelligently chunks markdown text.
    Respects paragraph boundaries and tracks the current section heading.
    """
    chunks = []
    current_section = "General"
    
    # Split by paragraphs
    paragraphs = re.split(r'\n\s*\n', text)
    
    current_chunk_text = ""
    
    for para in paragraphs:
        para = para.strip()
        if not para:
            continue
            
        # Check if it's a heading
        match = re.match(r'^(#{1,6})\s+(.*)', para)
        if match:
            # If we have an accumulated chunk, save it before changing sections
            if current_chunk_text:
                chunks.append({
                    "text": current_chunk_text.strip(),
                    "section_title": current_section
                })
                current_chunk_text = ""
            current_section = match.group(2).strip()
            
            # Add heading to the new chunk context
            current_chunk_text = para + "\n\n"
            continue
            
        # If adding this paragraph exceeds max length, save current chunk
        if len(current_chunk_text) + len(para) > max_chunk_length and current_chunk_text:
            chunks.append({
                "text": current_chunk_text.strip(),
                "section_title": current_section
            })
            current_chunk_text = para + "\n\n"
        else:
            current_chunk_text += para + "\n\n"
            
    # Add any remaining text
    if current_chunk_text.strip():
        chunks.append({
            "text": current_chunk_text.strip(),
            "section_title": current_section
        })
        
    return chunks


def process_document_embeddings(organization_id: str, contract_id: str, document_id: str, text: str):
    """
    Chunks a document, generates embeddings locally using fastembed,
    and bulk inserts them into Supabase pgvector table `contract_chunks`.
    """
    supabase = get_supabase_client()
    
    chunks = chunk_markdown(text)
    
    if not chunks:
        return
        
    documents = [chunk["text"] for chunk in chunks]
    
    try:
        # Generate embeddings locally
        embeddings_generator = embedding_model.embed(documents)
        embeddings = list(embeddings_generator)
        
        records = []
        for i, chunk in enumerate(chunks):
            records.append({
                "organization_id": organization_id,
                "contract_id": contract_id,
                "contract_document_id": document_id,
                "section_title": chunk["section_title"],
                "text": chunk["text"],
                "embedding": embeddings[i].tolist() # convert numpy array for JSON serialization
            })
            
        # Bulk insert to Supabase pgvector
        supabase.table("contract_chunks").insert(records).execute()
        print(f"Uploaded {len(records)} chunk embeddings to Supabase pgvector for contract {contract_id}")
        
    except Exception as e:
        print(f"WARNING: pgvector embedding skipped due to: {e}")
