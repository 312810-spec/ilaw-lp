# ILAW — Teacher lesson-planning workspace

A Node 24 / SQLite application for curriculum-grounded ILAW drafts, teacher edits, actual reflection, developmental observation/coaching and genuine Word/PDF exports. Current source gaps and validation limits are documented in [research implementation](docs/product/research-implementation.md).

## Run

```sh
npm start
```

Open `http://127.0.0.1:3000` and create the first teacher account. Node 24+ is required. No production packages or external database are needed. SQLite persists in `data/ilaw.sqlite`. Additional account registration requires administrator configuration `ILAW_REGISTRATION_ENABLED=true`; observers must have existing accounts before assignment. `.env` is loaded automatically; explicit environment values take precedence. Never commit credentials.

## Plan and teach

1. Select Kindergarten–Grade 12, subject, curriculum, school year, term, optional lesson date and division.
2. Select an applicable imported competency or enter an exact source excerpt. Practice examples remain clearly labeled.
3. Describe anonymous learner context and actual resources. Optionally record a minimum teaching route and a home/continuity alternative.
4. Choose guided design or live AI, concise/detailed output and focused/KSA objectives. These are app preferences, not universal DepEd requirements.
5. Edit ILAW sections; autosave, local recovery, optimistic revisions, history and targeted regeneration preserve teacher work.
6. Use Classroom view while teaching. Enter actual aggregate evidence and post-lesson reflection separately from anticipated Ways Forward.
7. Export the latest saved plan in concise/expanded DOCX or PDF. Companion tasks and answer keys come from the same accepted plan data. Separate teacher keys before distributing tasks.

Guided design uses five authored practice profiles. Other competencies receive an honest teacher-completed scaffold. It is not AI generation or an official curriculum catalog. Checks identify structural links, timing and resource issues; they do not certify subject correctness or DepEd compliance.

## IlawCraft-inspired AI

The reference is [alotski15-png/ilaw-app-2](https://github.com/alotski15-png/ilaw-app-2), branded IlawCraft. The default AI workflow drafts a complete structured lesson in one call, including practical teaching prompts, actual tasks, worked keys, access supports and conditional follow-up. An eight-call staged backward-design alternative remains available. Prompts do not force HOTS, KSA, core values, fixed mastery percentages or official COT scores into every lesson. Models cannot edit curriculum provenance or invent actual reflection.

This user-requested AI drafting workflow **does not establish compliance** with restrictions on fully AI-generated lesson plans. Signed applicable lesson-planning/AI guidance still needs review. Drafts disclose AI assistance and require teacher verification and adaptation.

Signed-in teachers open **AI settings** to save a masked Gemini or Groq key. Credentials are encrypted with AES-256-GCM, scoped to the account, used only on the server, and excluded from exports/device recovery. Saving is not a connection test; the separate Test connection action makes a small provider call and consumes provider quota. Free quotas and terms are provider-controlled; paid-account keys can incur charges. Gemini free-tier content may be used to improve Google products. Never send identifiable/sensitive learner information.

For administrator configuration, use `AI_API_KEY`, `AI_BASE_URL`, `AI_DESIGN_MODEL`, `AI_FAST_MODEL`. APIs must support the supplied JSON schema; provider-facing compatibility and lesson quality need live validation. No fake response or silent fallback is used. Account credentials override the administrator provider. Missing/refused/invalid/rate-limited output fails clearly while preserving input.

Selected wording/translation assistance displays original and proposed text for acceptance; protected numbers and mathematical symbols are checked. Meaning and subject correctness require teacher review. Accepted wording assistance is disclosed and saved in revision history. Initial model IDs, workflow, prompt version and usage are recorded when available.

## Curriculum, BOW and policy

The central BOW directory covers Kindergarten–Grade 12; its links are not populated competency data. Full embedded BOW retrieval remains incomplete. Grade 11/12 academic/TechPro resources have differing coverage. No all-grade completion claim is made.

Teachers can add one sourced competency or import 1–100 JSON rows at a time through Sources & policy / curriculum selection. All account imports remain **teacher-confirmed**, even if an uploaded row claims verification. Exact competencies, codes and supplied standards must occur in the excerpt. BOW rows additionally require exact curriculum version, school year, term and source week (or null). Batch imports are transactional. See [BOW import](docs/deped/bow-import.md).

Operators can load reviewed datasets through `ILAW_CURRICULUM_FILE` and `ILAW_BOW_FILE`. `node scripts/import-bow.js reviewed.json output.json` validates a reviewed BOW array before writing it. Official source identity and applicability are separate checks; codes/weeks/standards are never inferred.

`ILAW_POLICY_FILE` accepts an operator-reviewed registry with citations/version/effective dates and optional `gradeScope`, `curriculumScope`, `divisionScope`, `schoolYearScope`, plus ILAW section labels. Applicability uses the planned lesson date when supplied, otherwise today's date. Missing scoped context fails closed. Existing plans retain their snapshots. Full signed current orders and local instructions remain review dependencies; the source directory does not itself activate requirements.

## Observation and coaching

Open a saved lesson and choose **Observation**. Select developmental coaching or formal preparation, focus, optional agreed schedule and an existing observer account. Assignment grants that account access only to this observation and its preserved lesson snapshot. Teachers cannot claim observer-recorded evidence, and observers cannot write a teacher's reflection.

Notes distinguish observed, teacher-reported, planned and not-observed evidence; interpretation is separate. Draft notes recover locally; submitted notes and amendments retain author/timestamp. Reflection and coaching actions are versioned. Finalized records can be reopened by their owner for a recorded amendment. History shows prior records, and print export preserves evidence status. Observation evidence is not sent to AI.

Formal scores, fixed observation counts, current-year indicators, alternative modalities, approved COT forms and rating transmutations remain disabled until complete applicable signed tools are reviewed. This module is not an official appraisal system. No video/emotion/intelligence inference is performed.

## Exports and verification

DOCX is an editable ZIP/XML Word document. Direct PDF uses a bundled licensed DejaVu font and preserves supported Unicode mathematical symbols. Unsupported glyphs produce a useful error; use DOCX or browser print for those characters. PDF is text-based, not full LaTeX typesetting. Concise and expanded views share data; no fixed page limit is imposed.

```sh
npm test
npm run check
node scripts/export-check.js
npm run test:e2e
```

Request-handler tests exercise real server logic without sockets; the client harness tests logic without claiming native rendering. Native E2E requires Playwright/Chromium:

```sh
npm ci
npm run setup:browser
npm run test:e2e
```

Browser setup resolves the installed Playwright CLI, including runtime-provided installations. Set `BROWSER_PATH` for an existing compatible Chromium, or `ILAW_SKIP_BROWSER_OS_DEPS=true` to skip OS dependency installation when they already exist. Browser checks use actual handlers, desktop/mobile screenshots and DOCX/PDF downloads. Current Chromium download attempts failed; a native pass is not claimed. GitHub Actions installs the browser and runs the checks.

`npm run check:ai` is an opt-in eight-call live diagnostic requiring administrator credentials; it can consume quota/incur charges. No live provider comparison or teacher-scored benchmark has been completed.

## Security and operations

Password hashing, HttpOnly/SameSite sessions, CSRF/origin checks, ownership/assignment authorization, bounded requests, prepared queries and transactional revisions are retained. Initial keys use owner-only permissions in `<database>.keys`; protect and back up this encryption file with SQLite. Losing it makes account keys unreadable. Secrets and prompt contents are not logged.

For external serving, provision an HTTPS reverse proxy and exact `ILAW_PUBLIC_ORIGIN`; configure `HOST` appropriately. No deployment is created by these changes. Password-reset service, school multi-tenancy, production monitoring and formal appraisal authority are outside the current release. Review these needs before broad deployment.

## Project workflow and next enhancements

[FORGE v2](docs/workflow/FORGE.md) adapts the user's LIKHA-SIS workflow to this
project. The [AI enhancement analysis](docs/product/forge-ai-enhancement-analysis.md)
compares three approaches and prioritizes reliable complete AI drafting,
resumable recovery, teacher-friendly setup and content-quality validation.
Runtime proposals in that analysis are not implementation claims.
