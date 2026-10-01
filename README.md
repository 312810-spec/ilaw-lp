# ILAW — Intelligent Lesson Planning Assistant

A teacher-controlled lesson-design application: five-step planning, curriculum provenance, backward design, structured ILAW editing, explainable checks, durable history/versioning, targeted revision and DOCX/print exports.

**Delivery status:** implemented and tested at the application/request-handler and client-logic level. **Not declared production-ready.** Current authoritative DepEd policy/rollout research, independent market research, real-provider verification, native browser/mobile QA, live serving and deployment remain blocked by this environment. See [verification report](docs/product/verification.md). There is no fabricated deployment URL, AI response or official curriculum catalogue.

## Run

Node.js **24+**. No production package installation or database service required.

```sh
cd /workspace/ilaw
npm start
```

Open `http://127.0.0.1:3000`. Create the first teacher account with a display name, email and password of at least 12 characters. SQLite is created in `data/ilaw.sqlite`; plans survive restarts and browser changes. Initial registration is closed after the first account unless the administrator explicitly enables it.

This session's sandbox denies both TCP and Unix listeners (`EPERM`), so `npm start` cannot expose a preview here. Run in an environment that permits a local listener. No package downloads are needed to run the application.

## Real AI generation

Guided design works without a provider credential and is explicitly **not AI-generated**. Five subject profiles provide actual practice tasks and keys. Arbitrary custom competencies produce an honest teacher-completed scaffold with a warning; they are not silently treated as fully designed lessons.

For live AI, supply server-side environment variables:

```sh
cp .env.example .env
# Edit .env locally; never commit it or paste a key into the client.
set -a
. ./.env
set +a
npm start
```

Configure `AI_API_KEY`, `AI_BASE_URL` (OpenAI-compatible chat-completions API), `AI_DESIGN_MODEL`, and `AI_FAST_MODEL`. The default model names are configurable starting points, not a claim that current official model documentation was inspected. Node's environment proxy support is enabled; keep inherited proxy/CA settings when applicable. A model/provider must support strict JSON-schema outputs. Missing credentials, invalid JSON, refusals, rate limits and failures never cause a fake AI fallback.

Pipeline: curriculum resolution → competency unpacking → learner-context analysis → outcomes/evidence → assessment → learning experiences → differentiation → conditional Ways Forward → review → deterministic checks → save. Tokens are recorded when supplied by the provider. Full generation has eight focused model calls; component revision has one focused call, and session revision uses the staged pipeline.

## Teacher journey

1. Create a lesson from a class and a selected/pasted competency.
2. Verify provenance: practice example, teacher-provided, teacher-confirmed source, or operator-reviewed record.
3. Add optional anonymous learner context, real classroom resources and preferences.
4. Create a guided draft or use configured live AI.
5. Edit Intentions, Learning Experiences, Assessing Learning and Ways Forward. Autosave updates SQLite; temporary device recovery protects unsaved edits.
6. Reorder/duplicate activities; revise one component or session; reallocate time without replacing text. Check warnings.
7. Record anonymous session evidence, use it to adapt the next session, compare/restore revisions, duplicate a plan, or mark your professional review.
8. Export editable DOCX; print or save PDF from the print view.

Every edit resets review status. "Teacher-reviewed" does **not** mean DepEd-approved. Structural links are not a semantic or official-compliance certification. Current-policy warning remains visible because no current policy was verified.

## Curriculum and policies

Built-in Grade 1 reading, Grade 5 mathematics, Grade 7 science, Grade 10 mathematics and SHS communication records are authored **practice examples**, not official DepEd curriculum extracts. No invented codes are assigned. Custom competencies remain unverified.

Teachers can import an exact competency excerpt with an official DepEd HTTPS URL and section/page. Imports are labelled **teacher-confirmed**, not independently verified. An administrator may supply reviewed records through `ILAW_CURRICULUM_FILE`, pointing to a JSON array matching `src/curriculum.js`; verified records require verification date and policy version. Exact code text must occur in the excerpt. Effective dates and source/curriculum versions are carried in the model.

Research registry: [docs/deped/sources.md](docs/deped/sources.md). `npm run research` retrieves candidate sources when network access works; retrieval alone does not establish applicability or verification. Never assume DO 42 s. 2016 or DO 8 s. 2015 remains controlling, or that ILAW is nationally mandated, without reviewing current authoritative guidance.

## Testing

```sh
npm test
npm run check
npm run test:e2e
```

Unit/integration/client smoke tests need no third-party libraries. Integration tests invoke the application's actual HTTP request listener in-process because socket operations are denied here. The client smoke test executes the actual browser source against a small DOM test double; it does **not** prove native rendering or accessibility.

The separate browser test uses Playwright and Chromium, exercising real application handlers (not fake API fixtures), captures desktop/mobile layouts, checks labels/overflow and downloads DOCX. Set `BROWSER_PATH` when Chromium is installed elsewhere. This environment has Playwright and system Chromium, but Chromium fails on sandbox-blocked socket operations. Its failed/blocked result is recorded in `test-results/browser-status.json` rather than disguised as a pass.

`node scripts/export-check.js` independently validates DOCX ZIP CRC/XML with Python’s standard library and writes representative lesson artifacts in `test-results/`. API/provider fixtures live only in tests.

## Security and deployment

- Server-side credential use, scrypt password hashing with random salt, opaque hashed session tokens, HttpOnly/SameSite cookies, CSRF tokens, origin/host checks, ownership-scoped queries, prepared statements and bounded requests.
- Per-account generation limits and request/auth limits. Up to three active jobs per process and one per teacher; running jobs fail explicitly after restart, preserving input.
- No learner PII fields; no prompt/lesson/API-key logging. Device recovery is local and user-scoped; SQLite is authoritative.
- CSP forbids inline scripts, external embedding and unexpected external resource execution. XML/HTML exports escape teacher text.
- Loopback-only by default. Bootstrap the first account locally before exposure. For external serving, use an HTTPS reverse proxy, set `HOST` and `ILAW_PUBLIC_ORIGIN` to the exact HTTPS origin, and securely provision secrets. Secure cookies/HSTS are enabled for a configured public origin. Back up SQLite using the SQLite backup mechanism, with restrictive permissions.
- No password-reset email service, account sharing, school multi-tenancy, distributed job queue or production operations monitoring is included. Add these before a broad public launch as required by deployment scope.

Sites starter/publishing helpers were not installed in this executor and its configured proxy is unreachable. This Node/SQLite application cannot be falsely published as a static Site; production hosting or an edge/D1 adapter must be provisioned in an appropriate environment. No incomplete Site was registered.

## Maintainability

Concise `AGENTS.md`; specialized skills in `.agents/skills/`; evidence references under `docs/deped`; product reviews and constraints under `docs/product`; pipeline/security decisions under `docs/architecture`. Deterministic schemas and checks live in `src/schema.js` and `src/quality.js`, separate from provider prompts and curriculum metadata.

For policy updates, an administrator may supply `ILAW_POLICY_FILE` after verifying primary sources and effective scope. It supports versioned provenance, effective dates, grade/curriculum scope and section terminology, without rewriting generation code. Each plan retains its snapshot. See `src/policy.js` and `docs/deped/sources.md`. Default installation remains explicitly unverified.
