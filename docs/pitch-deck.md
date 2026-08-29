# LAW MATE Pitch Deck ⚖️🤖🇲🇾

## 1. Cover Slide
**LAW MATE**  
*Malaysia’s Modular Legal AI Toolkit for SMEs & Law Firms*  
v1.0 MVP Ready | Built on Next.js + pgVector + Ollama Swarm  
[Team/Founder] | [Date]

---

## 2. The Problem
**Malaysian businesses waste 20+ hours/week on legal admin:**
- SMEs: No affordable lawyers for contracts/compliance
- Law firms: Manual clause review (90% repetitive)
- PDPA/SSM compliance: Constant fire-drills
- Language barrier: BM/English case law buried in PDFs

**Market Gap**: Global tools (Harvey/Lexis) ignore MY law. Local = basic chatbots.

*\"90% of MY SMEs avoid legal advice due to cost\" - SME Corp MY*

---

## 3. The Solution
**Plug-and-Play Legal AI Components** (ai-elements style):

| Feature | What It Does |
|---------|--------------|
| 🧾 **Contract Analyzer** | Upload → Risk flags + redlines (5min → 30sec) |
| ⚖️ **Compliance Copilot** | PDPA/SSM auto-checks + alerts |
| 🤖 **Legal Chat** | MY case law RAG + IRAC reasoning |
| 📑 **Smart Templates** | Auto-generate NDAs/employment contracts |

**MVP Live**: /legalai (IRAC chat) + /contracts (analyzer pipeline)

---

## 4. Product Demo Flow
```
1. Upload Contract PDF
   ↓ <LegalDocUploader ai-elements>
2. AI Analysis (BullMQ Swarm)
   ↓ pgVector RAG → 12 Agents (retrieve/analyze/draft)
3. Results: Risk heatmap + IRAC summary
   ↓ <ClauseHighlighter /> + <LegalChatPanel />
4. Edit & Export (redline)
```

![Demo Flow](https://via.placeholder.com/800x400?text=MVP+Demo+-+Contract+Analyzer)

---

## 5. Tech Stack (Battle-Tested)
```
Frontend: Next.js 16 + ai-elements + shadcn/Tailwind
Backend: tRPC + Prisma/pgVector (MY case RAG)
AI: Ollama (llama3.1 + embed-large) + OpenClaw agents
Workflow: BullMQ (12 legal workers: retrieval→orchestrator)
Infra: Docker (Postgres/Redis/Ollama ready)
```

✅ **Private/on-device AI** (law firms demand)
✅ **Multimodal** (PDF/OCR via workers)
✅ **Agentic** (dynamic workflows)

---

## 6. Malaysia Data Moat
**RAG Sources (pgVector indexed)**:
- eLaw.my: 50k+ cases (Federal/Appeal/High Court)
- CLJLaw: Statutes (Contracts Act 1950, PDPA 2010)
- SSM.gov.my: Company filings/templates
- Bilingual: BM/English chunks

**Ingestion Pipeline**: legal-indexing.js (PDF→vector)

---

## 7. Traction & Roadmap
**Now (v1 MVP)**: Live demo, 100% automated pipeline  
**Q2 2026**: Shariah module, Litigation predictor  
**Q4 2026**: API + white-label for firms  

**Metrics Goal**: 1k SME users Y1 ($90k ARR)

---

## 8. Business Model
| Tier | Price | Features |
|------|-------|----------|
| Free | $0 | 5 docs/mo, basic chat |
| Pro | $9/mo | Unlimited analysis, templates |
| Firm | $99/mo/user | Custom agents, audit logs |
| API | $0.01/doc | Embed in apps |

**ACV**: $108/user | CAC: $20 (content/SEO)

---

## 9. Market Size
**Legal Tech MY**: $500M (growing 25% YoY)  
**SME Target**: 1.2M businesses (92% of MY enterprises)  
**TAM**: $100M (20% penetration conservative)

**Timing**: 2026 Vertical AI wave + PDPA enforcement

---

## 10. Competition
| Tool | MY Law | Modular | Private | Price |
|------|--------|---------|---------|-------|
| **LAW MATE** | ✅ | ✅ ai-el | ✅ Local | $9 |
| Harvey.ai | ❌ | ❌ | ❌ Cloud | $100+ |
| ChatGPT | ❌ | ❌ | ❌ | $20 |
| Local firms | Manual | ❌ | ✅ | $200/hr |

**Edge**: MY datasets + modular components = 10x faster iteration.

---

## 11. Team
- **Founder**: [Your Name] - Full-stack AI engineer (this repo built in 1 week)
- Advisors: [Legal expert TBC]
- OSS: 12 legal agents, pgVector MY law index

---

## 12. The Ask
**$250k Seed** for:
- 6mo runway
- Full MY dataset ingestion
- Beta launch (100 law firms)
- Hire: Legal data specialist

**Use of Funds**: 40% Eng, 30% Data, 20% Marketing, 10% Ops

**Contact**: [email] | Demo: localhost:3000/legalai

---

*LAW MATE: Powering Malaysia's Legal Future 🇲🇾⚖️🤖*

