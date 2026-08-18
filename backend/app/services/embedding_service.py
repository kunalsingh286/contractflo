import re
import uuid

from .vector_store import QDRANT_COLLECTION, get_qdrant_client


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
    Chunks a document and uploads embeddings to Qdrant.
    This uses FastEmbed under the hood via qdrant_client.add()
    """
    client = get_qdrant_client()
    
    chunks = chunk_markdown(text)
    
    if not chunks:
        return
        
    documents = []
    metadata = []
    ids = []
    
    for chunk in chunks:
        documents.append(chunk["text"])
        metadata.append({
            "organization_id": organization_id,
            "contract_id": contract_id,
            "contract_document_id": document_id,
            "section_title": chunk["section_title"]
        })
        ids.append(str(uuid.uuid4()))
        
    # qdrant_client.add will automatically generate embeddings using FastEmbed
    client.add(
        collection_name=QDRANT_COLLECTION,
        documents=documents,
        metadata=metadata,
        ids=ids,
        batch_size=32,
        parallel=0 # Use available CPU cores
    )
    print(f"Uploaded {len(chunks)} chunks to Qdrant for contract {contract_id}")
