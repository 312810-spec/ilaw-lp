# ILAW — Teacher lesson-planning workspace

A Node 24 / SQLite application for curriculum-grounded ILAW drafts, teacher edits, actual reflection, developmental observation/coaching and genuine Word/PDF/PowerPoint exports. Current source gaps and validation limits are documented in [research implementation](docs/product/research-implementation.md).

## Run

```sh
npm ci
npm start
```

Open `http://127.0.0.1:3000` and create the first teacher account. Node 24+ is required. PptxGenJS is pinned for editable PowerPoint export; no external database is needed. SQLite persists in `data/ilaw.sqlite`. Additional account registration requires administrator configuration `ILAW_REGISTRATION_ENABLED=true`; observers must have existing accounts before assignment. `.env` is loaded automatically; explicit environment values take precedence. Never commit credentials.

## Plan and teach

1. Select Kindergarten–Grade 12, subject, curriculum, school year, term, optional lesson date and division.
2. Select an applicable imported competency or enter an exact source excerpt. Practice examples remain clearly labeled.
3. Describe anonymous learner context and actual resources. Optionally record a minimum teaching route and a home/continuity alternative.
4. Choose guided design or live AI, concise/detailed output and focused/KSA objectives. These are app preferences, not universal DepEd requirements.
5. Edit ILAW sections; autosave, local recovery, optimistic revisions and history preserve teacher work. Targeted regeneration prepares a durable proposal: inspect Current / Proposed content, then accept or keep the current lesson. Proposals expire after 24 hours and cannot replace a newer saved revision.
6. Use Classroom view while teaching. Enter actual aggregate evidence and post-lesson reflection separately from anticipated Ways Forward.
7. Export the latest saved plan in concise/expanded DOCX or PDF. Companion tasks and answer keys come from the same accepted plan data. Separate teacher keys before distributing tasks. Teacher-reviewed plans also export 16:9 editable PowerPoint slides, with teacher instructions and keys in speaker notes.

Guided design uses five authored practice profiles. Other competencies receive an honest teacher-completed scaffold. It is not AI generation or an official curriculum catalog. Checks identify structural links, timing and resource issues; they do not certify subject correctness or DepEd compliance.

## IlawCraft-inspired AI

The reference is [alotski15-png/ilaw-app-2](https://github.com/alotski15-png/ilaw-app-2), branded IlawCraft. The default AI workflow drafts a complete structured lesson in one call, including practical teaching prompts, actual tasks, worked keys, access supports and conditional follow-up. An eight-call staged backward-design alternative remains available. Prompts do not force HOTS, KSA, core values, fixed mastery percentages or official COT scores into every lesson. Models cannot edit curriculum provenance or invent actual reflection.

This user-requested AI drafting workflow **does not establish compliance** with restrictions on fully AI-generated lesson plans. Signed applicable lesson-planning/AI guidance still needs review. Drafts disclose AI assistance and require teacher verification and adaptation.

Signed-in teachers open **AI settings** to save a masked Gemini or Groq key. Credentials are encrypted with AES-256-GCM, scoped to the account, used only on the server, and excluded from exports/device recovery. The last connection-test result is stored for the exact key/model configuration and cleared when credentials change. Saving is not a connection test; the separate Test connection action makes a small provider call and consumes provider quota. Free quotas and terms are provider-controlled; paid-account keys can incur charges. Gemini free-tier content may be used to improve Google products. Never send identifiable/sensitive learner information.

For administrator configuration, use `AI_API_KEY`, `AI_BASE_URL`, `AI_DESIGN_MODEL`, `AI_FAST_MODEL`. Account credentials override the administrator provider. AI calls make at most three attempts per stage: transient network/server/rate-limit failures retry with bounded backoff and Retry-After (up to 30 seconds); malformed JSON, timing and alignment failures request a corrected AI response. Provider schema/parameter incompatibility can use JSON-object mode with the original schema still enforced locally. A truncated or persistently invalid complete-plan response automatically continues through smaller AI stages, retaining completed stages during request retries. Recovery and provider calls are disclosed in progress/metadata. Missing/rejected keys, exhausted quotas and refusals stop with specific setup/retry options. Inputs remain stored; a separate teacher-selected guided draft is available. Validated stages persist in SQLite across failure and server restart. Resume generation revalidates and reuses eligible stages with matching input, source, models and contract within seven days of checkpoint activity. Final plan save and job completion are transactional. SQLite worker leases and heartbeats prevent duplicate workers on the same database. Expired workers lose permission to update or save. Cancel aborts provider requests and retains input and eligible stages. A persistent 27-request generation budget includes retries and resumes; token usage omitted by a provider remains unknown. Checkpoint lesson content is scrubbed after seven inactive days. No fake AI output or automatic guided substitute is used. Live provider validation still requires a working key; repeated calls can consume quota or incur charges.

Selected wording/translation assistance displays original and proposed text for acceptance; protected numbers and mathematical symbols are checked. Meaning and subject correctness require teacher review. Accepted wording assistance is disclosed and saved in revision history. Initial model IDs, workflow, prompt version and usage are recorded when available.

## Optional current technical grounding

For ICT/programming lessons, an operator can optionally enable **supplemental current software-library documentation** through Context7. This is disabled by default and does not add a production package.

Configure both:

```sh
ILAW_CONTEXT7_TECHNICAL_REFERENCES=true
CONTEXT7_API_KEY=...
```

The runtime integration uses Context7's Search Documentation API. The endpoint and behavior were re-checked against Context7's official documentation on **2026-10-07**; future development must re-check upstream rather than treating that checkpoint as permanent.

A teacher must still opt in for each lesson. The lookup sends only the subject, exact competency/topic and up to four public software-library hints. It deliberately does **not** send learner/class context, teacher identity, lesson references, reflections, evidence, credentials, or private source code. Returned documentation is capped before it enters the model context.

Context7 output is supplemental technical evidence only. It cannot establish curriculum applicability, DepEd policy, competency provenance or lesson correctness, and it never overrides the preserved curriculum source. If Context7 is unavailable, rate-limited or returns no documentation, generation continues without it and the saved plan records that the requested technical grounding was not used.

## Curriculum, BOW and policy

The central BOW directory covers Kindergarten–Grade 12. On 8 October 2026, readable text was retrieved for all 99 unique PDFs linked from its 13 grade directories. Sources & policy → Review BOW source files shows the extracted documents, original links and an exact-excerpt import queue. Extraction remains pending review; table mapping, curriculum version, school-year and week applicability are not inferred. Grade 11/12 academic/TechPro resources have differing coverage. No all-grade completion claim is made.

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

Browser setup resolves the installed Playwright CLI, including runtime-provided installations. Set `BROWSER_PATH` for an existing compatible Chromium, or `ILAW_SKIP_BROWSER_OS_DEPS=true` to skip OS dependency installation when they already exist. Browser checks use actual handlers, desktop/mobile screenshots and DOCX/PDF downloads. GitHub CI passed the native teacher journey, desktop/mobile checks and DOCX/PDF downloads on the merged baseline. GitHub Actions installs the browser and runs the checks.

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

## Mathematical notation and classroom slides

Use explicit `\( ... \)`, `\[ ... \]` or `$$ ... $$` delimiters for supported fractions, roots, scripts and common symbols. The editor and print preview use MathML; DOCX uses editable Office equations. PDF and PowerPoint use readable linear notation. Unsupported notation keeps its original source. Check arithmetic provides exact bounded rational checks for one supported equality/inequality, optionally with explicit numeric substitutions through the checker API. Unsupported symbols, units, domains and proofs require teacher review. It does not certify a complete answer key.

PowerPoint uses the latest saved teacher-reviewed revision. Storyboard roles come from intentions, learner activities, assessment and reflection; teacher instructions, supports and keys are in speaker notes. Slides contain editable text, not screenshots. Review mathematical notation and classroom pacing before use. See [dependency decision](docs/architecture/classroom-export-adr.md).

Context7 technical snapshots (including empty results) are retained with validated generation stages, so resumed stages use the same supplemental evidence. Cancellation aborts a pending lookup before model calls. No live Context7 account call was made during synthetic tests.

## Continued teacher workflows

**Images** stores bounded canonical PNGs (JPEG converts in the picker), with alt text, descriptions, attribution and rights. Owned images survive retained revisions and DOCX/PDF/PPTX exports. Teacher-only images are excluded from learner packets and slides. Coordinate diagrams use explicit points, equal x/y scale and editable source; editing creates a new asset so previous revisions keep their image. Raster images remain raster in exported files.

**Edit slides** saves editable learner text and private notes against the teacher-reviewed lesson revision, with version conflicts and a classroom preview. Lesson changes preserve edits but block stale PowerPoint downloads until deliberate rebuilding. **Export → Companion audience** separates learner tasks and teacher keys.

**Adapt class** creates a new draft with parent ancestry, chosen class context and optional minute reallocation. Actual evidence/reflection is cleared. It preserves original content for teacher adaptation. **Draft backup** downloads lesson JSON; IndexedDB device recovery has a localStorage fallback. Neither replaces the installation backup in [backup/restore](docs/operations-backup.md).

Preparation mappings are available in observation records through an [operator-reviewed tool registry](docs/deped/observation-tool-registry.md). No official tool is activated by default, and no rating is calculated.

`npm run benchmark` runs 30 Math/TLE practice briefs offline, preserving structural metrics and exports. It leaves all teacher quality scores blank. `npm run benchmark -- --live --limit=1` requires configured credentials and caps the entire run at 27 provider requests. It consumes provider quota; the default offline run makes no provider calls. This measures generation/assembly, not teacher preparation time or classroom outcomes.

The [free-cloud save spike](docs/architecture/free-cloud-spike.md) tests owner RLS, revision history and atomic saves on local PostgreSQL WASM. Production remains Node/SQLite. Hosted authentication, deployment and teacher-scored pilots require actual project configuration and review.
