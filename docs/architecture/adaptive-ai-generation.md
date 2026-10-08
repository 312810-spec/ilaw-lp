# Adaptive complete AI drafting

Implemented on `feat/adaptive-ai-generation`, 8 October 2026. Research baseline was main `60326c9`. This preserves IlawCraft-style AI drafting and the existing Node/SQLite stack; no production package was added.

## Behavior

- Concise one/two-session requests retain the complete-plan fast path. Three-to-five sessions, or expanded multi-session requests, use shared unpacking/context/outcomes and one content request per session, followed by review. Five sessions normally need nine successful provider requests, not 28 individual section requests.
- Gemini 3 requests use explicit medium reasoning for core instructional generation and low for supporting sections. Complete output budgets are 9,000 tokens/session (12,000 expanded), capped at 32,000. Gemini supporting stage budgets include 2,000 additional tokens. These are engineering defaults awaiting live quality/latency comparison, not accuracy guarantees. Groq receives no Gemini-specific settings.
- The 120-second request deadline covers fetch and response JSON. Cancellation races both, including stalled body reads. Complete-plan timeout can recover into smaller requests after bounded retries. General network outages, exhausted quota, rejected credentials and refusals stop rather than fan out into more calls.
- Compatibility negotiation is remembered on the provider instance for subsequent stages. Transient retries retain Retry-After and add bounded jitter. All schema constraints still apply locally after JSON-object fallback.
- Parsed complete-plan candidates are independently validated in dependency order. Only valid sections with valid dependencies enter durable checkpoints. Bad assessment invalidates downstream experiences/differentiation/ways/review; bad timing retains outcomes/assessment/ways while repairing experiences and its dependents. No truncated JSON is guessed into content.
- Long requests retain complete validated sessions. Resume revalidates them and generates only missing sessions. Source/input/model/contract fingerprints prevent stale reuse; the contract changed to `adaptive-retention-v2`, so incompatible old checkpoints require a new generation with retained input.
- The durable 27-request ledger, worker leases, cancellation and atomic plan/job save remain. Each active job also has a 20-minute deadline. Resume shares the original request budget; starting again is not an unlimited retry loop.
- A complete valid AI content draft can be saved if only automatic critique fails. It stays a draft, has `automaticReview: pending`, a visible review warning and exported review text. The fallback is a status notice, not invented AI critique or teacher approval. Mandatory content failures never become completed lessons.

## Diagnostics

The owner-only job response returns bounded safe diagnostic events and retained-part names. A failed/cancelled generation offers **Download diagnostic summary**. Events include stage, attempt, adapter/schema mode, elapsed time, HTTP status, fixed failure category and recognized finish reason. The summary also contains aggregate known/unknown usage. It excludes prompts, lesson content, credentials, raw provider errors and administrative identities. Keep the summary with a bug report, not an API key. Diagnostic storage retains at most 80 events per job.

## Isolated native background prototype

`spikes/gemini-background/client.js` implements explicit opt-in creation, durable-ID callback, fingerprinted resume, bounded polling, schema validation, cancellation and deletion for Google's Interactions endpoint/API revision `2026-05-20`. It is **not wired to production account settings or the job worker**. Operators must persist its state callback in private storage and explicitly remove remote interactions after accepting or discarding content. Provider storage/privacy, quota, cost, model availability and live payload compatibility remain unverified. A POST interrupted before its ID is returned has ambiguous remote execution; the prototype deliberately does not blindly retry creation.

The prototype checks input/model/credential fingerprints before resuming. Only IDs and hashes go into its state callback; actual content remains at the provider until removed. Polling preserves the ID rather than starting another generation. No automatic provider switching, framework, file upload or external web retrieval was added.

## Evidence and remaining work

Automated tests use synthetic providers and exercise recovery, dependency retention, five-session resume, body timeouts, cancellation, critique failure, ownership/privacy and background lifecycle. These establish software behavior, not subject accuracy. The user's local Gemini connection probe succeeded; this executor cannot reuse that locally encrypted key. A live paired Math/TLE benchmark and teacher correctness/correction-time review remain needed. Native browser CI verifies real DOM interactions with synthetic AI responses.

No claim of universal completion or policy compliance: provider outages and quota can still block a valid draft. Official source provenance is immutable; uncertain BOW applicability stays uncertain. Previously reviewed DO 016 restrictions on full AI plans/core decisions remain disclosed; teacher review alone does not remove them.

## Official software references checked 8 October 2026

- [Gemini thinking and output cutoffs](https://ai.google.dev/gemini-api/docs/generate-content/thinking)
- [Gemini OpenAI compatibility](https://ai.google.dev/gemini-api/docs/openai)
- [Gemini structured outputs](https://ai.google.dev/gemini-api/docs/structured-output)
- [Project rate limits](https://ai.google.dev/gemini-api/docs/rate-limits)
- [Background execution](https://ai.google.dev/gemini-api/docs/background-execution)
- [Interactions API reference](https://ai.google.dev/api/interactions-api)
- [Groq strict structured outputs](https://console.groq.com/docs/structured-outputs)
- [Composable workflows](https://www.anthropic.com/engineering/building-effective-agents) — architectural principles, not a current SDK recommendation.
