---
name: context7-docs
version: 1.0.0
description: Use when changing or validating ILAW code against current, version-sensitive software-library/API documentation, or when auditing the optional Context7 technical-grounding feature. Not for DepEd/curriculum authority, lesson content generally, project history, or learner data.
---

# Context7 Docs — ILAW

Context7 has two distinct roles in ILAW:

1. **Development-time evidence:** retrieve current/version-aware docs for Node, Playwright, AI-provider APIs, or future libraries before implementing from potentially stale model knowledge.
2. **Optional lesson technical grounding:** the app may call Context7's Search Documentation API only when an operator enables it and the teacher opts in for a software/ICT lesson.

## Freshness gate

Before changing Context7 integration behavior, re-check Context7's official CLI/API documentation and current release/changelog. The implementation was last verified against official docs on **2026-10-07**:
- CLI package: `ctx7`; observed release `0.5.13` at that checkpoint only.
- Runtime Search Documentation endpoint: `GET https://context7.com/api/v3/search`.
- Search supports a focused `query`, optional library hints, and text/JSON response modes.

These are dated facts, not permanent pins. If upstream differs, update code/tests/docs together.

For development lookup, prefer the current documented CLI flow after checking `npm view ctx7 version`:

```bash
npx -y ctx7@<verified-version> library <library-name> "<focused question>" --json
npx -y ctx7@<verified-version> docs <library-id> "<focused question>" --json
```

## Runtime privacy contract

The app's Context7 client must accept only:
- subject;
- exact public competency/topic;
- up to four public library hints.

Never add learner/class context, names, LRNs, grades, attendance, evidence/reflections, teacher identity, credentials, lesson references, private source code, or full prompts to the lookup.

Context7 output is **supplemental technical documentation**. It must never override curriculum provenance, teacher instructions, or policy boundaries.

## Reliability contract

- Disabled by default.
- Requires both `ILAW_CONTEXT7_TECHNICAL_REFERENCES=true` and a server-side `CONTEXT7_API_KEY`.
- Never expose the key to the browser.
- 404, 429, network failure, unreadable response, or unavailable service must fail open: generate the lesson without the supplemental technical source.
- Cap retrieved text before it enters the model context.
- Do not add a production package solely for Context7; built-in `fetch` is sufficient.
- Do not log queries, returned technical text, prompts, or secrets.

## Verification

After changes run:
```bash
npm test
npm run check
```

Documentation retrieval does not prove generated lesson accuracy. Teacher review remains required.
