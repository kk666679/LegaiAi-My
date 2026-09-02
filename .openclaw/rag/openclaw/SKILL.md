---
name: rag-openclaw
description: Meta‑skill that performs Retrieval-Augmented Generation using pgVector and Ollama, with provenance and citation.
version: 1.0.0
author: LAW MATE
tools:
  - legal-retrieve
  - legal-analyse
  - legal-validate
hitl_level: 0
---

# Skill: RAG for OpenClaw

## Purpose
Orchestrate a complete RAG pipeline: retrieve evidence, generate a grounded answer, and validate citations.

## Instructions
1. Receive a user query.
2. Call `legal-retrieve` to fetch top‑k relevant documents from pgVector.
3. If documents are found, use them as context for `legal-analyse` (IRAC).
4. If the query asks for a draft, use `legal-draft`.
5. Always pass the retrieved evidence to `legal-validate` to check hallucinations.
6. Return the final answer with citations and confidence score.

## Input
- `query`: string – the legal question.
- `options`: object – optional `limit`, `court`, `docType`.

## Output
- `answer`: string – IRAC analysis or draft.
- `citations`: array – verified sources.
- `confidence`: number.
- `validation_report`: object – flags any hallucinated statements.

## Example
**Query:** "What are the requirements for a valid contract?"
**Output:** IRAC answer citing Contracts Act 1950 and case law, with validation report.

## Safety
- Never generate answer without evidence.
- If retrieval returns low‑similarity results, state: "Insufficient verified evidence."
