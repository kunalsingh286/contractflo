-- Enable the pgvector extension to work with embedding vectors
CREATE EXTENSION IF NOT EXISTS vector;

-- Create the contract_chunks table to store document embeddings
CREATE TABLE contract_chunks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
    contract_document_id UUID REFERENCES contract_documents(id) ON DELETE CASCADE,
    section_title TEXT,
    page_number INTEGER,
    text TEXT NOT NULL,
    embedding VECTOR(384) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create an HNSW index for fast approximate nearest neighbor search
-- Using cosine distance (vector_cosine_ops)
CREATE INDEX contract_chunks_embedding_idx ON contract_chunks USING hnsw (embedding vector_cosine_ops);

-- Enable RLS
ALTER TABLE contract_chunks ENABLE ROW LEVEL SECURITY;

-- Standard tenant isolation policy
CREATE POLICY "Users can only see chunks in their organization"
ON contract_chunks FOR ALL TO authenticated
USING (
    organization_id IN (
        SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
    )
)
WITH CHECK (
    organization_id IN (
        SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
    )
);

-- Service role bypasses RLS for AI ingestion
CREATE POLICY "Service role manages all chunks"
ON contract_chunks FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Create a Postgres function for similarity search
CREATE OR REPLACE FUNCTION match_contract_chunks (
    query_embedding vector(384),
    match_threshold float,
    match_count int,
    org_id uuid
)
RETURNS TABLE (
    id uuid,
    contract_id uuid,
    section_title text,
    page_number integer,
    text text,
    similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        cc.id,
        cc.contract_id,
        cc.section_title,
        cc.page_number,
        cc.text,
        1 - (cc.embedding <=> query_embedding) AS similarity
    FROM contract_chunks cc
    WHERE cc.organization_id = org_id
      AND 1 - (cc.embedding <=> query_embedding) > match_threshold
    ORDER BY cc.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;
