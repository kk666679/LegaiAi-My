# @components/dashboard

A production-ready, legal-AI-focused component system for the LawMate /
LegalAI workspace. It replaces the previously ad-hoc, mock-data-backed
dashboard pieces with typed, composable, accessible components that share a
single **state model** and **source of truth for types**.

## Design principles

1. **No mock data is shipped.** Components receive every value from the caller.
   The legacy `defaultMetrics` / `defaultSteps` were removed; nothing in this
   folder fabricates real-looking authorities, queries or artefacts.
2. **Reuse, don't duplicate.** Domain primitives (`Document`, `Jurisdiction`,
   `LegalArea`, `SourceType`, `LegalSource`, `RecentActivity`, `SavedItem`) are
   imported from `@/types/lawmate` and widened by the `adapters.ts` helpers.
3. **One state model.** Every data-driven surface resolves its lifecycle
   through `DashboardStatus` (`loading | success | empty | error | partial`)
   via `DashboardStateBoundary`.
4. **Accessibility first.** Colour is never the only signal — status pills
   pair an icon with a text label, charts expose a hidden data table, and
   region changes are announced via `aria-live`.
5. **Readability over density.** Long IRAC analyses use height-capped,
   scrollable bodies with explicit "show full" toggles; sources sit behind
   native `<details>` disclosures that work with no JavaScript.
6. **Server components by default.** Only components that need events are
   marked `"use client"` (error states, charts, accordion, expandable bodies).

## Folder map

```
components/dashboard/
├── types.ts              Domain types (DashboardMetric, Query, QueryResult,
│                          Workflow, WorkflowStep, DocumentArtifact, Source,
│                          Citation, IRACAnalysis, UsageSummary, ActivityItem,
│                          SavedResearchItem) + display maps + IRAC_STAGES.
├── format.ts             Pure presentation formatters (no DOM/JSX).
├── adapters.ts           toSource / toActivityItem / toSavedResearchItem /
│                          toIRACAnalysis — bridge lawmate ↔ dashboard types.
├── DashboardState.tsx    StateBoundary, skeletons, partial notice, live status.
├── DashboardErrorStates  DashboardErrorState + Query/Workflow/Document variants.
├── Indicators.tsx        ConfidenceIndicator, RelevanceIndicator, StatusPill,
│                          MetricRow.
├── SourceCard.tsx        Source (verified / unverified / unavailable / loading)
│                          with snippet, court, jurisdiction, pinpoint, link.
├── SourceList.tsx        SourceList, CitationList, CitationBadge, SourceSummaryLine.
├── IRACReasoningTimeline  Four stage columns (Issue/Rule/Application/Conclusion),
│                          each with confidence, propositions, citations, sources.
├── DocumentArtifactCard  Per-artifact card: preview, copy, download, save,
│                          regenerate, provenance, citations.
├── DocumentArtifactsResults  Grouped artifact collection (state-boundary guarded).
├── CreditUsageDashboard   Allocation / usage / trend / projection / thresholds.
├── RecentActivityFeed    Chronological activity list (compact timeline option).
├── SavedResearch         Bookmarkable queries / sources / documents / artefacts.
├── DashboardMetrics      Metric summary tiles + agent swarm health rows.
├── AgentWorkflowExplorer Workflow trace (expansible agent tool per stage).
├── QueryResultsLayout    Tabbed Reasoning / Artifacts / Workflow container.
├── QueryResults          State-driven high-level entry point.
├── export.ts             Plain-text / HTML serialisation + browser download.
└── index.ts              Public barrel.
```

## Usage

```tsx
import {
  DashboardMetrics,
  CreditUsageDashboard,
  QueryResults,
  RecentActivityFeed,
  SavedResearch,
  toSource,
  type UsageSummary,
  type DashboardMetric,
} from "@/components/dashboard";
```

## Component reference

### DashboardMetrics
Renders headline tiles (jobs, success rate, latency, system status) and an
agent-swarm health list.

| Prop      | Type               | Notes                              |
| --------- | ------------------ | ---------------------------------- |
| `summary` | `{ jobsToday?, successRate?, avgLatency?, systemStatus? }` | Headline figures. |
| `metrics` | `DashboardMetric[]`| Health rows, rendered with `StatusPill`. |

### IRACReasoningTimeline
Structured reasoning visualisation.

| Prop               | Type                     | Notes                          |
| ------------------ | ------------------------ | ------------------------------ |
| `analysis`         | `IRACAnalysis`           | Four stage objects + sources.  |
| `status`           | `DashboardStatus`        | Drives loading/empty/error.    |
| `onRetry`          | `() => void`            | Surfaced in the error state.   |
| `openStages`       | `IRACStage[]`           | Controlled disclosure.         |
| `maxBodyHeight`    | `number`                | Stage body scroll cap (px).    |

**Loading** renders `IRACSkeleton`; **error** renders `QueryErrorState`; a
**partial** analysis shows a `PartialDataNotice` and marks pending stages.

### CreditUsageDashboard
Credit allocation, burn rate, trend, projection and thresholds.

| Prop             | Type           | Notes                          |
| ---------------- | -------------- | ------------------------------ |
| `summary`        | `UsageSummary` | Single source of all figures. |
| `status`         | `DashboardStatus` | `error` shows a retry state. |
| `upgradeHref`    | `string?`     | Call-to-action link when low.  |
| `onNavigateToUpgrade` | `() => void?` | Callback alternative. |

### QueryResults
State-driven entry point that wraps `QueryResultsLayout` in a
`DashboardStateBoundary`.

```tsx
<QueryResults
  status={status}
  result={result}
  error={error}
  onRetry={refetch}
/>
```

### SourceCard / SourceList / CitationList
- `SourceCard` renders every citable field (title, document, citation,
  jurisdiction, court, date, page/section, relevance, snippet) and one of four
  verification states — always with an icon + label, never colour alone.
- `CitationList` resolves `Citation.sourceId` against a `Source[]` registry and
  prints the citation → source relationship, with an in-page anchor link.

### DocumentArtifactsResults / DocumentArtifactCard
- Accepts `status`, `artifacts`, `sources`, `error`.
- Per card: preview (height-capped with "read full"), copy, download/export,
  save (when `onSave`), regenerate (when `canRegenerate`), plus a compact
  `DropdownMenu` action list on small screens.

### RecentActivityFeed / SavedResearch
- Data-driven via `ActivityItem[]` and `SavedResearchItem[]`.
- Both accept `status` and optional `onRetry`. SavedResearch adds kind tabs
  and `onRemove` / `onOpen` callbacks.

## Adapting existing data

`adapters.ts` widens the `@/types/lawmate` shapes:

```ts
import { toSource, toActivityItem, toSavedResearchItem } from "@/components/dashboard";

const sources = legalSources.map(toSource);
const activities = recentActivity.map(toActivityItem).filter(Boolean);
```

## Accessibility

- Colour is never the only signal: every status is paired with text + icon.
- Charts (`CreditUsageDashboard`) are `aria-hidden`; the numbers are mirrored
  in a visually-hidden `<table>`.
- `aria-live="polite"` announcements live-region in `LiveStatus`.
- Native `<details>`/`<summary>` disclosures need no JavaScript.
- Reduced-motion preference is honoured by the global stylesheet
  (`prefers-reduced-motion: reduce`); animated charts set `isAnimationActive={false}`.
- Focus rings are visible on every interactive element.

## Dependencies

No new runtime dependencies were added. The dashboard relies on libraries
already present in the repo:
- `recharts` (via the existing `components/ui/chart.tsx`) for trend plots.
- `@radix-ui/react-accordion` and `@radix-ui/react-dropdown-menu`.
- `lucide-react` for icons.
- `sonner` for toasts.
- `@/components/shared/EmptyState` for empty states.

## Validation

```bash
npm run type-check
npm run lint
npm run build
npm run test:autoclaw
```
