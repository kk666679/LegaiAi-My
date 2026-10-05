/**
 * Suggested AI prompts, scoped to the open document (§10).
 *
 * These are prompts only — no legal conclusions are asserted here. The
 * answers themselves are generated and cited at request time, and every AI
 * output in this product is surfaced as a recommendation requiring human
 * review (AGENTS.md safety rules 5 and 9).
 */

/** Contract-focused prompts (§10). */
export const CONTRACT_SUGGESTIONS = [
  "Summarise this contract",
  "What are my obligations?",
  "When can this contract be terminated?",
  "What notice period is required?",
  "Find the renewal terms",
  "Identify unusual provisions",
  "What happens on breach?",
  "Extract the important dates",
] as const;

/** General document prompts (§7). */
export const DOCUMENT_SUGGESTIONS = [
  "Summarise this document",
  "What are the key obligations?",
  "Identify the risks",
  "Extract the important dates",
  "Which clauses are missing?",
  "Explain the governing law clause",
] as const;