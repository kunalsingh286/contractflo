import os
from typing import Any

from qdrant_client import QdrantClient
from qdrant_client.http.models import Distance, VectorParams

# Environment Variables
QDRANT_URL = os.environ.get("QDRANT_URL", "http://localhost:6333")
QDRANT_COLLECTION = os.environ.get("QDRANT_COLLECTION", "contracts")

_client = None

def get_qdrant_client() -> QdrantClient:
    """Returns a singleton QdrantClient instance."""
    global _client
    if _client is None:
        _client = QdrantClient(url=QDRANT_URL)
        
        # Ensure collection exists
        # FastEmbed uses "BAAI/bge-small-en-v1.5" by default, which outputs 384 dimensions
        if not _client.collection_exists(collection_name=QDRANT_COLLECTION):
            _client.create_collection(
                collection_name=QDRANT_COLLECTION,
                vectors_config=VectorParams(size=384, distance=Distance.COSINE),
            )
            print(f"Created Qdrant collection: {QDRANT_COLLECTION}")
    return _client

def search_contract_chunks(organization_id: str, contract_id: str, query: str, limit: int = 5) -> list[dict[str, Any]]:
    """
    Embeds the user query and searches for relevant chunks, strictly scoped by org_id and contract_id.
    """
    client = get_qdrant_client()
    
    # We use Qdrant's built-in FastEmbed querying
    # This automatically embeds the query text before searching
    search_result = client.query_points(
        collection_name=QDRANT_COLLECTION,
        query=query,
        query_filter={
            "must": [
                {"key": "organization_id", "match": {"value": organization_id}},
                {"key": "contract_id", "match": {"value": contract_id}},
            ]
        },
        limit=limit
    )
    
    results = []
    for point in search_result.points:
        results.append({
            "chunk_id": point.id,
            "text": point.payload.get("text", ""),
            "page_number": point.payload.get("page_number"),
            "section_title": point.payload.get("section_title"),
            "score": point.score
        })
        
    return results
