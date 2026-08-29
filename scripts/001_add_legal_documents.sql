-- Migration: Add legal_documents table
-- Created: 2026-04-30
-- Description: Creates the legal_documents table for document CRUD operations

CREATE TABLE IF NOT EXISTS legal_documents (
  id            TEXT PRIMARY KEY,
  title         TEXT NOT NULL,
  content       TEXT NOT NULL,
  doc_type      TEXT NOT NULL,
  status        TEXT NOT NULL DEFAULT 'draft',
  version       INTEGER NOT NULL DEFAULT 1,
  
  -- Metadata
  client_id     TEXT,
  case_number   TEXT,
  court         TEXT,
  jurisdiction  TEXT,
  tags          TEXT[] DEFAULT '{}',
  
  -- Parties involved (JSON)
  parties       JSONB,
  
  -- File info
  file_url      TEXT,
  file_size     INTEGER,
  mime_type     TEXT DEFAULT 'text/markdown',
  
  -- Audit
  created_by    TEXT,
  updated_by    TEXT,
  reviewed_by   TEXT,
  reviewed_at   TIMESTAMP WITH TIME ZONE,
  
  -- Timestamps
  created_at    TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_legal_documents_doc_type ON legal_documents(doc_type);
CREATE INDEX IF NOT EXISTS idx_legal_documents_status ON legal_documents(status);
CREATE INDEX IF NOT EXISTS idx_legal_documents_client_id ON legal_documents(client_id);
CREATE INDEX IF NOT EXISTS idx_legal_documents_case_number ON legal_documents(case_number);
CREATE INDEX IF NOT EXISTS idx_legal_documents_created_at ON legal_documents(created_at);

-- Add comment
COMMENT ON TABLE legal_documents IS 'Stores legal documents with full CRUD support including versioning, workflow status, and audit trail';
