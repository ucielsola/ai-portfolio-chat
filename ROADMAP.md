# AI Portfolio Chat roadmap

This is the durable execution plan for the starter. Keep it current at the end of each working session: move completed items, record decisions, and link the PR that changed status. It is deliberately ordered so every milestone can ship independently.

## Working agreement

- `Not started` → `In progress` → `Blocked` → `Done`.
- One pull request should normally complete one checklist item or a tightly related slice.
- Follow the repository-wide roadmap rule in [`AGENTS.md`](AGENTS.md): every change is recorded here, including maintenance-only work.
- Keep provider integrations, framework examples, and optional services behind the existing interfaces.
- Before starting a task, update its status and add an entry to the session log. Before pausing, record the next concrete action and any decision needed from the owner.

## Current baseline

| Area | Status | Notes |
| --- | --- | --- |
| Config and provider boundary | Done | Strict Zod config, custom provider registry, OpenAI-compatible adapter. |
| Prompt management | Done | Typed catalog, local fallback, optional Langfuse guidance and tracing. |
| Package distribution | Done | Build output and package exports are defined. |
| Production host integration | Done | Framework-neutral server handler, server-only documentation, and fake-provider integration coverage are complete. |

## Milestone 1 — Host integration example

**Goal:** prove the package can be safely used from a real server endpoint without choosing a frontend framework for every consumer.

- [x] Add a minimal server-side example that loads `SiteConfig`, environment variables, a provider, and optional Langfuse port.
- [x] Show a `POST /api/chat`-style handler using `createPortfolioChat`.
- [x] Document server-only environment loading and ensure no API key enters browser code.
- [x] Add an integration-style test with a fake provider and fake request.

**Acceptance criteria:** a new adopter can copy one documented server integration, ask a question, and receive an answer without exposing credentials.

## Milestone 2 — Public request boundary

**Goal:** make the reference handler resilient to untrusted browser input.

- [ ] Define Zod schemas for chat messages and public requests.
- [ ] Enforce message count, per-message size, allowed roles, and a total request-size limit.
- [ ] Add input normalization and a small, documented prompt-injection heuristic.
- [ ] Return stable, non-sensitive client errors; log internal failure detail only on the server.
- [ ] Add tests for malformed, oversized, and injection-shaped input.

**Acceptance criteria:** hostile or malformed requests cannot reach a provider with arbitrary structure or uncontrolled size.

## Milestone 3 — Streaming contract

**Goal:** support progressive answers while preserving the provider-agnostic boundary.

- [ ] Extend `ChatProvider` with a tested streaming method and cancellation behavior.
- [ ] Define an event format (`delta`, `error`, `done`) suitable for SSE or NDJSON.
- [ ] Add a reference adapter/handler that converts provider output to that format.
- [ ] Test cancellation, provider failure before first chunk, and failure mid-stream.

**Acceptance criteria:** a host can render streamed text, cancel a request, and reliably terminate its UI state on errors.

## Milestone 4 — Optional portfolio knowledge

**Goal:** improve factual answers for larger portfolios without making retrieval mandatory.

- [ ] Define a `KnowledgeSource`/retriever interface and a simple static implementation.
- [ ] Document chunking, metadata, source freshness, and retrieval thresholds.
- [ ] Add optional citations/source labels to answer events.
- [ ] Add retrieval evaluation fixtures that cover projects, experience, and contact facts.

**Acceptance criteria:** a site can opt into retrieval and test that relevant portfolio sections are selected; config-only chat remains usable.

## Milestone 5 — Production controls

**Goal:** provide composable operational safeguards without hard-wiring a platform.

- [ ] Add a rate-limiter interface and in-memory development implementation.
- [ ] Add output scanning hooks for credential-like strings, instruction leakage, and unsafe links.
- [ ] Define a privacy-aware logging/telemetry policy, including retention and opt-out guidance.
- [ ] Document deployment headers, CORS choices, and abuse-response behavior.

**Acceptance criteria:** a host can choose rate limiting and output safeguards with clear defaults, test seams, and documented privacy tradeoffs.

## Milestone 6 — Reference application

**Goal:** demonstrate the complete recommended path in one small, maintainable host app.

- [ ] Select one framework and explain why it is the reference only, not a package requirement.
- [ ] Build a basic accessible chat UI with loading, cancellation, error, and empty states.
- [ ] Use the server handler, validation, streaming, and optional Langfuse configuration from prior milestones.
- [ ] Add an end-to-end smoke test and deployment instructions.

**Acceptance criteria:** the reference app deploys with documented environment variables and exercises the public starter APIs end-to-end.

## Deferred decisions

| Decision | Needed by | Options / notes |
| --- | --- | --- |
| First reference framework | Milestone 1 | SvelteKit, Next.js, or a framework-neutral Node example. Start framework-neutral unless a target audience is chosen. |
| First streaming wire format | Milestone 3 | SSE is browser-friendly; NDJSON is simpler for generic HTTP clients. |
| Retrieval backend | Milestone 4 | Static in-memory corpus first; hosted vector stores remain adapters. |
| Default rate-limit store | Milestone 5 | Memory for development; adapter for Redis/KV in production. |

## Session log

Add newest entries at the top.

| Date | Session / PR | Completed | Next action | Decisions or blockers |
| --- | --- | --- | --- | --- |
| 2026-08-13 | PR #4 | Added the policy requiring completed, validated work to be pushed and opened as a ready-for-review PR. GitHub CLI authentication was verified through the host keychain. | Start Milestone 2 request schemas and request-size limits. | This policy applies to all future completed work unless the user explicitly requests otherwise. |
| 2026-08-13 | PR #4 | Completed Milestone 1: exported framework-neutral `POST` handler, server-only environment guidance, optional Langfuse port support, and fake-provider integration coverage. Validated with `npm run check`, `npm test` (9 tests), and `npm run build`. | Start Milestone 2 request schemas and request-size limits. | Framework-neutral standard `Request`/`Response` remains the reference; the handler keeps provider details server-side. |
| 2026-08-13 | PR #3 | Added repository-wide roadmap discipline for every change. | Start Milestone 1 with a framework-neutral server handler. | No blocker; framework-neutral is the current default. |
| 2026-08-13 | PR #2 | Added this roadmap and handoff conventions. | Choose the Milestone 1 reference handler shape. | Framework choice remains open. |
