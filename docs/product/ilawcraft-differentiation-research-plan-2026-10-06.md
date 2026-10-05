# Ilawcraft differentiation: research and detailed implementation plan

Date: 6 October 2026, Asia/Manila.
Repository: 312810-spec/ilaw-lp.
Status: research-backed proposal; this document does not implement features or establish policy compliance.
Audience: project owner, implementing developer, teacher reviewers and instructional leaders.

## 1. Outcome brief using FORGE

Use the user's FORGE workflow: establish known context and audience, define outcomes and constraints, question assumptions, make concrete design decisions, and evaluate against classroom results. Do not invent expansions for FORGE letters absent from the supplied instructions.

Context: Francis James G. Alota teaches at Tingub National High School, Division of Mandaue City. Initial reference cases are Grade 10 Mathematics across multiple sections and Grade 10 TLE-ICT Contact Center Services. The project should retain intelligent assistance inspired by IlawCraft while becoming reliable, locally useful, visually elegant, and teacher controlled.

Desired outcome: a teacher selects an applicable competency, makes or confirms the instructional decisions, prepares concrete tasks and assessments, edits a readable lesson, presents connected materials, downloads usable files, and records actual reflection without duplicated work or lost edits.

Success is not the number of AI calls, features, or generated pages. It is a reduction in correction effort and preparation time while maintaining instructional meaning, source accuracy, mathematical accuracy, access supports, and teacher authorship.

Constraints:
- Maintain the existing Node 24 / SQLite architecture initially.
- Preserve account ownership, transactional revisions, observer assignments and server-side secrets.
- Keep teacher edits outside targeted changes.
- No invented competency codes, BOW weeks, official indicators, learner outcomes or compliance scores.
- No all-grade coverage claim until a coverage inventory supports it.
- Distinguish exact official source text, teacher-confirmed imports, reviewed resources, AI proposals and practice examples.
- Build on existing features rather than assume the application is empty.
- New production dependencies require a documented architecture decision: the current AGENTS.md states no production dependencies.
- Applicable signed lesson-planning and AI guidance must be reviewed before claiming permitted AI scope. Teacher approval alone does not necessarily resolve restrictions on core instructional decisions.

## 2. Research method and evidence limits

Research covered official DepEd resource guidance and observation documents; original research and research-provider publications; official software documentation and repositories; vendor documentation; accessibility guidance; and current project files.

Evidence categories:
1. Official source: evidence of what that source actually states, subject to scope and version.
2. Research: informs design; does not establish Philippine mandates or product efficacy.
3. Vendor documentation: evidence of advertised capabilities, not tested output quality.
4. Repository inspection: evidence from files read, not a full running-app audit.
5. Recommendation: original project proposal that must be tested.

Read current AGENTS.md, README.md, package.json, docs/product/research-implementation.md and src/schema.js through GitHub. These establish a credible baseline but are not a comprehensive source audit. Some guessed documentation paths returned 404; no findings are attributed to those paths.

Direct retrieval of the national DO 016, s. 2026 PDF and some observation material was blocked. Search surfaced reproductions describing substantial limits on full AI planning; those secondary reproductions are discovery leads, not authoritative verification. Reconcile the signed order and annexes before implementing or marketing the AI decision-making scope. The existing repository itself documents this unresolved issue.

The January 2026 alternative-observation document explicitly identifies itself as a discussion draft. No production rule should be activated from it.

No live competitor lesson generation, provider benchmark, new production code, model fine-tuning, teacher pilot or successful export rendering is claimed by this research.

## 3. Current repository baseline

Confirmed from the files read:
- Node 24 application, SQLite persistence, no production dependencies in package.json.
- One-call structured AI drafting and an eight-stage alternative.
- Five guided practice profiles; unsupported competencies receive an honest scaffold.
- Teacher/account imports and operator-reviewed curriculum/BOW loading.
- Immutable curriculum provenance; plan revisions and targeted regeneration.
- Selected-text wording/translation proposals with protected number/symbol checks.
- Classroom view, actual teacher reflection, companion tasks/keys.
- Assignment-based developmental observation and preserved lesson snapshots.
- Genuine DOCX and direct Unicode PDF exports.
- Documented limits: incomplete embedded BOW, text-based mathematics, no slides, no automatic source extraction, incomplete signed-tool review, no live-provider quality benchmark.
- Existing native browser validation was documented as blocked; fixture tests do not establish real-provider quality.

Implication: the next phase should deepen content and rendering, not rebuild authentication, basic revisions or observation notes.

## 4. Competitive findings

MagicSchool documents standards-aware lesson drafts, time/context inputs and differentiation. Eduaide documents an editable workspace with document chat, adaptation, evaluation and history. Brisk documents source-based materials and a District Library connected to uploaded scope and sequence. ILAW Planner documents editable ILAW drafts and exports. MANALIKSIK advertises BOW context, weekly sessions and optional teaching packages. EDORA advertises ILAW plans, slides, assessments, TOS and worksheets.

These capabilities mean that "AI plans + slides + downloads" is already a market baseline. Their documented capabilities do not establish their mathematical accuracy, offline resilience, complete Philippine curriculum coverage or detailed COT functionality. Absence from a public page is not evidence that a feature is absent.

Proposed position: a Philippine teaching workspace with traceable curriculum, practical class adaptations, reviewed resource assembly, mathematical integrity, evidence-aware observation preparation, and consistent materials from a shared accepted lesson.

## 5. Architecture decision: shared lesson representation

Introduce versioned LessonIR (a project-specific intermediate representation). Separate instructional relationships from visual formatting. Editor-specific JSON, HTML, Markdown and slide layouts must be adapters, not competing authoritative lessons.

Preserve existing objective/activity/assessment/follow-up IDs. Add content blocks gradually while retaining old strings during migration.

Suggested records:

| Entity | Essential attributes |
|---|---|
| LessonRevision | id, planId, schemaVersion, parentRevisionId, acceptedAt, author, input snapshot, source snapshot |
| ContentBlock | id, kind, role, content, sourceRefs, parentId, protected status |
| Equation | id, originalLaTeX, optional MathJSON, displayMode, assumptions, units, spoken description, validation status |
| Asset | id, hash, stored path, MIME, dimensions, caption, alt text, long description, attribution, rights, provenance |
| Activity | existing ID, objectives, blocks, duration, resources, grouping, access supports, assessment links |
| Assessment | existing ID, prompt blocks, key blocks, accepted alternatives, rubric, review status |
| ObservationMapping | activityId, toolVersionId, indicatorId, teacher rationale, evidence opportunity, review status |
| SlideStoryboard | lessonRevisionId, slide ID, source block IDs, purpose, visible content, notes, visual refs, timing |
| MaterialArtifact | type, lessonRevisionId, content hash, generator version, status, output location |

Every derived artifact records the exact source lesson revision. A later edit marks affected artifacts stale; it never silently overwrites a teacher's slides.

Migration:
1. Add schemaVersion and reversible plain-text-to-block conversion.
2. Preserve original strings and full prior revisions.
3. Pilot structured blocks in one selected section.
4. Round-trip old lesson content without data loss.
5. Enable mathematics and assets.
6. Derive exports/storyboards from the accepted revision.
7. Retire duplicate authoritative storage only after migration validation.

## 6. Curriculum and BOW knowledge system

### 6.1 Ingestion

Use official resource directories and authorized teacher uploads. Ingest asynchronously into a review queue, not directly into the production catalog.

Stages: obtain bytes and provenance; hash; identify format; extract text/tables; retain page/row locations; flag OCR uncertainty; compare candidate codes and standards against exact excerpts; review applicability; publish a versioned dataset.

Docling is a candidate for offline ingestion of tables and scanned documents. Its advertised parsing capabilities do not guarantee correct extraction. Keep it outside the Node request path and compare with a lightweight parser before adoption. Model dependencies have separate licenses.

Special review targets: merged table cells, repeated headings, hyphenated competency codes, footnotes, mathematical signs, term boundaries and SHS curriculum transitions.

### 6.2 Source and coverage registry

Record official URL, issuer, publication/version, retrieved date, content hash, applicable grade/subject/curriculum/year/term, source locations, rights, review author and corrections.

Publish coverage by grade × subject × curriculum × school year × term:
- linked only;
- extracted pending review;
- reviewed partial;
- reviewed complete relative to a named source;
- superseded;
- unavailable.

Completeness must be measured against the authoritative source inventory, not raw row counts.

### 6.3 Retrieval

Phase 1: exact applicability filters plus SQLite FTS5/BM25. Verify FTS5 is enabled in the actual Node SQLite build. Competency code and curriculum applicability outrank semantic resemblance.

Phase 2: evaluate semantic retrieval for activities and scenarios only after a labelled benchmark exists. Combine lexical and semantic candidates, then rerank within compatible scope. Never let similar wording override a mismatched curriculum or year.

Contextual retrieval is a useful experiment for chunks whose headings carry meaning. Include document/grade/subject context with each extracted chunk; treat generated contextual summaries as auxiliary, not official wording.

Keep prompts compact: source snippets, teacher decisions and selected components. More retrieved text is not automatically better.

Postgres/pgvector migration is conditional on measured search/concurrency/operations needs. A "powerful database" is not a substitute for reviewed content.

## 7. Reliable lesson assembly and AI assistance

### 7.1 Teacher decisions and component selection

Gather or reuse teacher decisions about the selected competency, intended outcome, evidence, activities, constraints and learner supports. Offer reviewed resource choices with applicability explanations. The software can assemble the selected components deterministically, preserve exact source references, and format them into ILAW.

Applicable signed policy review determines which AI actions are enabled. Do not imply that selecting a checkbox makes unrestricted AI instructional design compliant.

### 7.2 Job lifecycle

Proposed states:
queued → retrieving → assembling → assisting → validating → review_ready.
Alternate terminal states: cancelled, needs_teacher_input, partial_ready, failed_recoverable.

Job record: owner, request hash, base revision, stage, policy scope, selected source/component versions, model/prompt version if used, attempt count, timestamps and failure category.

Reliability rules:
- Save the input snapshot and source selection before contacting a model.
- Use schema-constrained outputs where supported, plus server validation.
- Maintain explicit provider capability profiles; no schema compatibility assumptions.
- Retry only transient errors with bounded backoff/jitter and Retry-After where available.
- Do not retry authentication failures or refusals as if transient.
- Repair only malformed/invalid targeted sections; preserve accepted sections.
- Use an idempotency key to avoid duplicate application jobs; provider billing may still require provider-specific controls.
- Cancel promptly; never let a late response overwrite a newer revision.
- Commit proposals against the expected base revision.
- Record usage and latency metadata without sensitive prompt logging.
- Provider switching is optional and disclosed because credentials, terms, billing and data handling differ.
- Show reviewed assembly, AI-assisted draft and teacher-completed scaffold as distinct output modes.
- An unsupported competency returns a useful guided outline, not a fabricated full verified plan.

### 7.3 Validation layers

Separate:
1. schema validity;
2. source/applicability integrity;
3. instructional links and duration/resources;
4. numbers, equations and units;
5. language and preservation;
6. teacher subject review.

A second model may detect issues but is not independent proof of correctness. Avoid a single "quality 98%" label.

## 8. Authentic localisation and class adaptation

Localisation includes cognitive demand, actual materials, time, learner language and the plausibility of the task. Geography alone is insufficient.

Class context: section, anonymous aggregate readiness, prerequisites, common difficulties, language support, resources, duration and participation barriers. Keep sensitive individual learner records out of external prompts.

Reviewed scenario packs: school/community measurements, transport, household quantities, fictional customer-service interactions and teacher-contributed contexts. Real local facts need a source; invented examples must be identified as illustrative.

Math illustration: a school-ground triangle with supplied dimensions. The task states whether a sketch is to scale, uses consistent labels/units, and has a checked solution.
TLE illustration: a fictional delayed-delivery call with agent/customer roles, clarification prompts and a performance rubric aligned to the skill.

Language support: preserve subject terms; maintain a teacher-reviewed English/Filipino/Cebuano glossary; distinguish translation from changing assessment demand. Do not treat UNESCO's general multilingual guidance as a current Philippine medium-of-instruction mandate.

Provide explicit adaptation choices rather than silent changes:
- shorter period;
- board/paper alternative;
- additional prerequisite practice;
- another section;
- substitute-teacher detail.

Assess supports against actual barriers; avoid fixed learning-style labels. Changing a response modality is appropriate only if it preserves the skill being assessed.

## 9. Smart editor: natural language with meaning preservation

Use an incremental editor spike before committing to a framework migration. Tiptap's headless core is a candidate; paid extensions/services are separate decisions. Build project AI proposal controls independently of proprietary AI features.

Actions:
- clarify selected text;
- make directions natural to speak;
- shorten redundant prose;
- translate teacher-approved text;
- organize existing content;
- identify missing concrete instructions;
- propose alternatives only within the verified AI scope.

Protected content: source text/codes, quantities, equations, units, answer keys, success criteria, accommodation conditions and teacher-entered actual evidence.

Proposal transaction:
1. capture selected block IDs and base revision;
2. send minimum necessary context;
3. receive proposed blocks and an explanation;
4. compare protected tokens and structural relationships;
5. show semantic risks alongside a textual diff;
6. accept/reject at block level;
7. save provenance and allow undo through a new revision.

Examples of meaningful changes to flag: "explain" becoming "identify", ≥ becoming >, 0.5 becoming 5, oral reasoning replacing assessed writing, or removal of an access support.

Number/symbol equality checks are necessary but not sufficient. Phrase changes can alter pedagogy without changing a number. Teacher review remains essential.

Natural output means specific classroom directions and appropriate tone. No AI-detector evasion claim. Allow a teacher-authored style sample with a reset control; do not infer a permanent style from every edit.

Acceptance: non-target blocks unchanged; original recoverable; stale proposals rejected; rejected edits not reused as preferences; no factual reflection fabricated.

## 10. Mathematical integrity and exports

### 10.1 Editing and representation

MathLive supplies a visual entry surface; KaTeX/Tiptap mathematics is a candidate for browser rendering. Store original LaTeX, stable equation ID, display mode and optional validated semantic representation.

MathJSON/computation should supplement, not replace, original notation. Preserve domain assumptions, degree/radian mode, units, rounding, precision and restrictions.

Examples requiring care:
- sqrt(x²) and |x|;
- division by a quantity that could be zero;
- inequality reversal under negative multiplication;
- extraneous roots;
- sine-rule ambiguity;
- bearing orientation;
- precision and units.

### 10.2 Checking

Use deterministic arithmetic and bounded symbolic checks where supported. Numerical samples can find counterexamples but are not universal proof. Unsupported proofs and word-problem interpretation remain teacher review.

Return labels such as arithmetic checked, symbolic check under stated assumptions, or teacher review required. Do not present a formula parser as a universal verifier.

### 10.3 Rendering matrix

| Destination | Proposed primary route | Fallback and limitation |
|---|---|---|
| Browser | LaTeX rendering with semantic/accessibility output | Preserve editable source; show clear unsupported syntax |
| DOCX | Office Math objects for supported constructs | Vector/raster fallback with source and description |
| PDF | Consistent browser print/render pipeline | Existing text PDF retained for compatible legacy lessons |
| PPTX | Editable equations only after a compatibility spike | SVG plus raster fallback; source LaTeX retained in notes/metadata |

Microsoft documents Office Math/MathML capabilities, and docx exposes math components. This does not prove our chosen conversion handles arbitrary LaTeX or that PptxGenJS writes native editable equations.

Fixture corpus: fractions, mixed numbers, radicals, aligned equations, matrices, Greek symbols, inequality chains, trig, bearings, currency, tables and long expressions.

Verify content, visual clarity and editability separately in Word/PowerPoint/LibreOffice where available. Round-trip transformations may preserve meaning without preserving identical markup.

## 11. Images, diagrams and resources

Asset flow: upload or select → check type/dimensions → store controlled bytes → set caption/alt text/attribution → link to block → export.

Avoid permanent dependence on remote image hotlinks. Preserve editable diagram source and export derivatives with content hashes.

Choose the rendering method by purpose:
- exact graph/geometry: controlled SVG/canvas or JSXGraph;
- conceptual sketch: Excalidraw;
- photo: teacher upload or correctly licensed source;
- illustrative scene: optional AI generation clearly labelled;
- exact numbers/charts: deterministic drawing.

For diagrams record labels, data/coordinates, units, scale status and assumptions. A decorative generated triangle cannot be relied on for exact geometry.

Accessible image design: concise alternative text plus a longer description for complex diagrams; readable labels; suitable contrast; captions near visuals; printable monochrome alternative. Alt text must not reveal an assessment answer unintentionally.

Keep asset provenance separate from source text. Wikimedia Commons licenses are file-specific. Preserve attribution and modification information in lesson and material exports where required.

Acceptance: assets survive save/reopen, copying and export; corrupt/missing assets have recovery; no answer-key image appears in learner slides; diagrams agree with calculations.

## 12. Content-aware PowerPoint and teacher spiel

Do not turn lesson paragraphs directly into slides. Introduce a teacher-reviewable instructional storyboard from an accepted lesson revision.

Slide roles: orient, activate prior knowledge, explain/model, guided practice, learner task, formative check, feedback/answer reveal and next step. These are available roles, not compulsory quotas.

Storyboard fields:
- source lesson revision and source block IDs;
- slide purpose and intended evidence;
- learner-visible text;
- equation/visual references;
- notes;
- timing and interaction;
- answer visibility;
- layout choice and accessibility description.

Notes structure: natural teacher spiel, question, anticipated response (explicitly predictive), misconception to listen for, conditional response, transition and approximate timing. Teachers may omit categories. Never script claims of actual success.

Keep explanations close to related figures, reveal worked steps in digestible stages, and avoid decorative density. Multimedia-learning principles inform this design; they do not mandate a fixed word count or guarantee improved outcomes in our pilot.

Generation:
1. freeze accepted revision;
2. derive storyboard;
3. teacher edits storyboard and notes;
4. assemble PPTX via PptxGenJS;
5. perform content/relationship checks;
6. render and inspect slide previews;
7. verify notes parts and file opening;
8. download and retain build metadata.

PptxGenJS documents addNotes; this solves file writing, not the quality of the teacher spiel.

Layout checks: no clipping/overlap; equations legible; images not distorted; contrast sufficient; text remains editable; repeated layouts restrained. Avoid simply shrinking overflowing text. Split a teaching step or suggest a revision.

Projection defaults such as 16:9 and approximate 24–32 pt body sizes are proposed starting points, not universal rules. Validate from classroom viewing distance.

Dependency tracking: changes to a task or answer mark linked slides/worksheet/key stale. Teacher-edited slides receive a suggested update, not automatic replacement.

## 13. COT preparation and developmental coaching

Build on the existing observation snapshot and assignment model.

Tool registry requires purpose, issuer, signed source, school year, career stage, indicator wording, version, applicability and reviewer. Drafts cannot activate formal rules. Do not infer current-year observation counts or rating transmutations from older exceptions.

Preparation mappings are teacher-confirmed:
activity → applicable indicator → intended teacher action → anticipated learner evidence → rationale.

Mapping links must identify a concrete opportunity. Merely writing "HOTS" or "differentiated" is insufficient. Prefer a small relevant set; do not pack every indicator into every lesson.

Keep these statuses distinct: planned, observed, teacher-reported, not observed. Evidence may inform multiple indicators without duplication. Not observed is not automatically the lowest rating.

Retain separate purposes: developmental coaching, formal PMES and promotion/reclassification. Formal rating remains unavailable until the complete applicable signed package is reviewed.

Coaching view: teacher reflection, factual notes, strength, manageable improvement, agreed support, follow-up. Research supports studying coaching and follow-through, but does not show that adding an app module creates those effects.

No AI-generated observation evidence or scores; no confidential observer notes sent through the lesson-assistance service.

## 14. Reuse, reflection and continuity

One accepted lesson can have class adaptations while preserving ancestry. Copying clears actual reflection and observation outcomes.

After teaching, the teacher records aggregate evidence, unfinished activity, difficulty and chosen next step. These facts remain teacher-authored. The system may surface previously selected resources and formatting assistance; any new instructional recommendations follow the reviewed policy scope.

Make resuming simple: show the latest revision, unsaved recovery status, class/date and the next practical action. Do not expose internal model/token/job details in ordinary teacher flows.

## 15. Candidate repository decisions

| Candidate | Use | Decision |
|---|---|---|
| Tiptap | Structured editor | Spike; respect separation of open core and paid extensions |
| MathLive | Visual formula entry | Spike after Equation schema |
| KaTeX | Browser mathematics | Test supported syntax/accessibility and print output |
| PptxGenJS | PPTX and notes | Preferred export candidate; native equations need separate proof |
| docx | Word images/equations | Compare incremental use with current exporter before replacement |
| Excalidraw | Conceptual diagrams | Lazy-load optional tool; preserve scene source |
| JSXGraph | Precise math visuals | Optional targeted tool, not core editor requirement |
| Docling | Source extraction | Offline ingestion experiment; review model licenses separately |
| Cortex Compute Engine | Bounded math checks | Evaluate assumptions and unsupported cases first |
| pgvector | Larger semantic search | Defer until benchmark/scale justify Postgres |
| Playwright | Browser/render QA | Reuse existing dependency; native pass must actually run |

Use releases checked at implementation time; pin tested versions and license identifiers. No latest-version claim is made here. Keep attribution and selected LICENSE files as required. The user's authorization to reuse repositories does not mean every hosted service or paid package is automatically selected.

## 16. API and data contracts proposed

Names are proposals, not existing endpoints.

- POST /api/lesson-jobs: create scoped job with base revision and idempotency key.
- GET /api/lesson-jobs/:id: owner-only status and recoverable proposals.
- POST /api/lesson-jobs/:id/cancel: stop pending work.
- POST /api/plans/:id/proposals: targeted edit against expected revision.
- POST /api/plans/:id/proposals/:proposalId/accept: transactional acceptance.
- POST /api/assets: authenticated bounded upload.
- GET /api/curriculum/coverage: applicability-aware coverage.
- POST /api/plans/:id/storyboards: derive from specified accepted revision.
- PATCH /api/storyboards/:id: revise with conflict detection.
- POST /api/storyboards/:id/export: frozen build and progress status.
- POST /api/observations/:id/preparation-mappings: teacher-confirmed links.

All mutations retain ownership/CSRF checks and optimistic concurrency. Large work runs outside synchronous request lifetimes. Reuse existing route conventions after the implementation source audit.

## 17. Implementation backlog and exit criteria

### Phase 0 — Baseline and decisions
Audit existing generation/save/export flows, current branch and dependency constraints. Record signed-policy/source gaps. Build representative fixtures and performance baseline. Approve architecture decisions for packages and LessonIR.
Exit: known baseline, preserved existing behaviour, no unsupported status claims.

### Phase 1 — LessonIR and protected editing
Versioned blocks, reversible migration, equation/asset references, editor spike, proposal diff/undo and stale-base handling.
Exit: existing lessons round-trip; targeted edits preserve unrelated content; migration rollback demonstrated.

### Phase 2 — Reviewed content and dependable assembly
Initial Math/TLE packs, ingestion review queue, coverage registry, SQLite search, resource-selection explanation, persisted jobs and honest fallbacks.
Exit: covered lessons assemble with AI unavailable; unsupported content remains labelled; wrong-version sources excluded.

### Phase 3 — Mathematics and visual exports
Math entry/rendering, bounded verification, asset workflow, controlled diagrams, supported Word math and robust PDF rendering.
Exit: mathematical fixtures render clearly and preserve source; images survive exports; editability limitations displayed.

### Phase 4 — Storyboard and PPTX
Lesson-linked slide roles, teacher notes, answer reveals, layouts, native speaker notes, export preview and stale-material warnings.
Exit: complete Math/TLE decks open, contain notes, preserve keys, avoid clipping and reflect accepted revisions.

### Phase 5 — COT preparation and continuity
Verified tool packages, teacher-confirmed activity links, separation of evidence statuses, class adaptations and reflection continuity.
Exit: planned links cannot masquerade as observed evidence; snapshots/permissions preserved.

### Phase 6 — Pilot and expansion
Teacher-scored comparison, failure injection, accessibility/mobile/projector checks, refined defaults and staged curriculum expansion.
Exit: pilot targets reported with actual measurements and source coverage limits.

No fixed delivery-date promise is made without a source audit and implementation capacity estimate.

## 18. Evaluation protocol

Create a benchmark of approximately 30 briefs as a proposed initial set:
- regular Math/TLE;
- time constraints;
- no projector/internet;
- prerequisite gaps;
- multiple sections;
- English/Filipino/Cebuano support;
- inclusion barriers;
- multi-session progression;
- COT preparation;
- source conflict/missing coverage;
- mathematical edge cases;
- long equations and assets.

Teacher reviewers score anonymised outputs on source fidelity, task specificity, answer accuracy, alignment, realistic timing, localisation, access supports, wording, observation mapping and revision effort. Rotate output order; document reviewer disagreement. Record which inputs competitors accept rather than pretending every system has identical controls.

Automated checks: schema, source applicability, graph links, duration sum, resource dependencies, protected edits, auth/conflicts, artefact revisions and OOXML relationships.

Retrieval evaluation: labelled correct sources, wrong-version exclusion, recall and precision at candidate cutoffs. RAGAS/ARES-style metrics can support diagnostics; AI judges do not replace teacher review.

Failure injection: rate limits, malformed response, missing credentials, refusal, cancellation, tab close, server restart, concurrent edit, missing asset, corrupted source and unavailable renderer.

Proposed pilot targets, not measured results:
- zero lost accepted edits in the defined recovery suite;
- all source references traceable in the benchmark;
- no wrong-version source selected in applicability tests;
- all covered briefs yield an honestly labelled editable result when AI is disabled;
- all benchmark math tasks checked by a subject reviewer before publication;
- all PPTX fixtures contain intended notes and separate learner questions from keys;
- median returning-teacher preparation time below five minutes for familiar covered lessons, measured separately from first-time setup;
- meaningful reduction in correction time against current app baseline;
- acceptable laptop/mobile/projector readability and keyboard access.

Small usability results do not establish causal gains in learner achievement.

## 19. Risks and alternatives

| Risk | Response |
|---|---|
| Policy limits differ from proposed full AI drafting | Verify signed scope; keep teacher decision-first assembly and bounded assistance |
| Database grows without quality | Require provenance/review/coverage; publish fewer reliable packs |
| Semantic retrieval chooses wrong curriculum | Exact filters first; labelled retrieval tests |
| Rich editor breaks old data | Reversible migration, legacy export support |
| Symbolic checker overclaims | State assumptions; unsupported results remain review-required |
| Diagram disagrees with key | Share data/labels and cross-check |
| Slides become paragraph dumps | Storyboard roles, render QA, teacher review |
| Revisions drift across materials | Revision-linked dependency tracking and stale status |
| Dependencies violate current architecture | Explicit ADR and incremental spikes |
| COT creates extra paperwork | Optional preparation; reuse evidence; concise everyday plan |
| Offline content becomes stale | Versioned packs and update notice |
| Visuals increase cognitive load | Purposeful images, proximity, manageable sequence |
| Benchmarks reward polished prose | Score correctness and correction effort separately |

## 20. Recommended first milestone

A complete Grade 10 Mathematics lesson and a Contact Center Services lesson, each with:
- a traceable teacher-selected competency;
- a reviewed activity/assessment pack;
- teacher-confirmed instructional choices;
- useful assembly with AI disabled;
- safe natural-language editing;
- mathematics or relevant visual assets;
- Word/PDF from the latest revision;
- an editable storyboard and PPTX with natural teacher notes;
- optional verified COT preparation links;
- no invented learner results.

This is the reviewable vertical slice before expanding to all grades.

## 21. Research sources and interpretation register

All accessed 6 October 2026 Philippine time unless a prior source is explicitly noted. Links identify primary source/documentation where available; blocked retrieval is disclosed.

### Project evidence
- https://github.com/312810-spec/ilaw-lp/blob/main/AGENTS.md — architecture and provenance constraints.
- https://github.com/312810-spec/ilaw-lp/blob/main/README.md — current documented features and limitations.
- https://github.com/312810-spec/ilaw-lp/blob/main/package.json — runtime/dependency baseline.
- https://github.com/312810-spec/ilaw-lp/blob/main/docs/product/research-implementation.md — implementation report; reported tests not rerun here.
- https://github.com/312810-spec/ilaw-lp/blob/main/src/schema.js — current string-based structures and existing IDs.
- https://github.com/alotski15-png/ilaw-app-2 — reference named by current README; public web retrieval failed; no new source audit claimed.

### Philippine planning and resources
- https://sites.google.com/deped.gov.ph/lsguide/lesson-planning — ILAW guide, exemplars, BOW directory and adaptation guidance.
- https://www.deped.gov.ph/wp-content/uploads/DO_s2026_016r.pdf — signed-policy target; direct retrieval blocked.
- https://www.deped.gov.ph/wp-content/uploads/DO_s2026_003r.pdf — AI-use policy source; exact applicability must be reconciled with lesson-planning order.
- https://lrmds.deped.gov.ph/guidelines — learning-resource management/redevelopment framework.
- https://lrmds.deped.gov.ph/detail/18292 — example resource-specific adaptation permissions.
- https://lrmds.deped.gov.ph/detail/17068 — example of different resource conditions.
- https://www.deped.gov.ph/wp-content/uploads/2018/10/DO_s2016_035.pdf — LAC/contextualisation material; older policy not a substitute for current instructions.

### Observation
- https://www.deped.gov.ph/2025/10/01/october-1-2025-dm-089-s-2025-guidelines-on-the-multi-year-performance-management-and-evaluation-system-for-teachers-from-school-years-2025-2026-to-2027-2028/ — official multi-year PMES listing.
- https://www.deped.gov.ph/wp-content/uploads/DM_s2025_089r.pdf — exact annex/tool review remains incomplete.
- https://www.deped.gov.ph/wp-content/uploads/v2_1.Draft-Guidelines-on-Flexibility-and-Alternative-Classroom-Observations-for-Teacher-Development-and-Performance-Evaluation.pdf — explicitly draft; not operative authority.
- https://scholar.harvard.edu/files/mkraft/files/kraft_blazar_hogan_2018_teacher_coaching.pdf — original coaching meta-analysis; international evidence, not proof of app effects.

### Pedagogy, language and interaction
- https://ies.ed.gov/ncee/wwc/PracticeGuide/1 — spaced study and interleaved worked examples/problem solving; contextual recommendations.
- https://educationendowmentfoundation.org.uk/education-evidence/evidence-reviews/cognitive-science-approaches-in-the-classroom — evidence review; limits and classroom transfer require care.
- https://udlguidelines.cast.org/ — UDL 3.0 framework; barrier-oriented design prompts.
- https://www.unesco.org/en/articles/languages-matter-global-guidance-multilingual-education?hub=66920 — multilingual guidance; not a Philippine policy mandate.
- https://www.microsoft.com/en-us/research/project/guidelines-for-human-ai-interaction/overview/ — validated interaction guidelines informing correction/control.
- https://assets.cambridge.org/052183/8738/excerpt/0521838738_excerpt.htm — multimedia-learning principles; use as design rationale, not automatic efficacy.

### Retrieval and evaluation
- https://www.sqlite.org/fts5.html — lexical retrieval/BM25 capabilities.
- https://www.anthropic.com/engineering/contextual-retrieval — contextualised chunks and hybrid retrieval; vendor experiments need local replication.
- https://arxiv.org/abs/2307.03172 — original long-context position study; model/task-specific effects.
- https://research.google/pubs/retrieval-quality-at-context-limit/ — newer counterpoint showing context behaviour varies by model/task.
- https://arxiv.org/abs/2309.15217 — RAGAS diagnostics.
- https://arxiv.org/abs/2311.09476 — ARES diagnostics.
- https://github.com/pgvector/pgvector — optional vector storage; no immediate migration requirement.
- https://github.com/docling-project/docling — extraction candidate; code/model licensing distinction.

### Editor, mathematics and exports
- https://github.com/ueberdosis/tiptap — headless editor, open core and separate paid features.
- https://tiptap.dev/docs/editor/extensions/nodes/mathematics — LaTeX math nodes using KaTeX.
- https://github.com/arnog/mathlive — visual equation entry candidate.
- https://github.com/KaTeX/KaTeX — rendering candidate.
- https://github.com/cortex-js/compute-engine — bounded symbolic/numeric candidate.
- https://mathlive.io/compute-engine/guides/assumptions/ — importance of explicit assumptions.
- https://mathlive.io/compute-engine/guides/symbolic-computing/ — structural versus mathematical reasoning.
- https://github.com/dolanmiu/docx — Word generation.
- https://docx.js.org/api/modules/math.html — math objects for supported constructs.
- https://learn.microsoft.com/en-us/office/math/mathml — Microsoft math interchange capabilities, not arbitrary conversion guarantee.
- https://github.com/gitbrent/PptxGenJS — PPTX generation.
- https://gitbrent.github.io/PptxGenJS/docs/speaker-notes/ — native speaker-note writing.
- https://github.com/excalidraw/excalidraw — conceptual diagram editor/export.
- https://github.com/jsxgraph/jsxgraph — mathematical geometry/plotting candidate.

### Accessibility, media and QA
- https://www.w3.org/WAI/tutorials/images/complex/ — short and long descriptions for complex visuals.
- https://www.w3.org/WAI/tutorials/images/textual/ — semantic mathematics preference; older browser details need current testing.
- https://commons.wikimedia.org/wiki/Commons:Reusing_content_outside_Wikimedia/en — asset-specific reuse/attribution.
- https://creativecommons.org/reusing-cc-licensed-content/ — attribution guidance.
- https://playwright.dev/docs/test-snapshots — visual comparison; run actual render checks.

### Competitive documentation
- https://www.magicschool.ai/tools/lesson-plan
- https://www.eduaide.ai/solutions/lesson-planning
- https://www.briskteaching.com/create-instructional-materials
- https://help.briskteaching.com/hc/en-us/articles/50948193511828-How-to-use-the-District-Library
- https://ilawplanner.com/generator
- https://www.manaliksik.com/
- https://www.edora.ph/

These pages support capability comparisons only. No competitor quality or reliability ranking has been established.

## 22. Handoff and execution checkpoint

Completed in this research run: accessible-repository confirmation; baseline file review; cross-domain source research; detailed architecture, backlog, acceptance and evaluation plan.

Next implementation action: inspect current complete source tree and matching .agents/skills instructions, record the dependency ADR, verify signed AI/ILAW scope, establish fixtures, then begin Phase 1. Keep checkpoints/handoffs at approximately five-minute intervals during sustained implementation, as requested by the user.

No feature implementation, dependency installation, live AI call or formal tool activation belongs to this documentation-only change.


## 23. Free-tier-only deployment decision (added after user clarification)

User constraint: use free tiers only. This supersedes any assumption that paid services can be provisioned. No services have been provisioned.

### 23.1 Recommendation

For a shared browser-based pilot, propose Cloudflare Pages static hosting + Supabase Free (Postgres/Auth/limited object storage) + IndexedDB for recoverable browser drafts. Keep the existing Node/SQLite application as the local/self-hosted mode during migration.

This is a conditional architecture recommendation, not a deployed system. Supabase is not required for lesson intelligence. Its value is shared accounts, relational records, permissions and optional cross-device access. Browser IndexedDB is not SQLite, not a permanent backup and not automatic conflict-free sync.

For a personal/school-PC installation, keep Node/SQLite and local files: no hosted database fee and less migration. External access then needs deliberate hosting/network provisioning; a powered computer and connectivity are operational costs, not a free hosting guarantee.

Do not run SQLite and Supabase as two writable authorities with assumed automatic sync. Each deployment mode has one server authority. Migration and optional sync require explicit contracts.

### 23.2 Current free allowances checked 6 October 2026

| Service | Published allowance relevant here | Consequence |
|---|---|---|
| Supabase Free | 500 MB database/project, 1 GB storage, 5 GB egress; two free projects | Store text/metadata compactly; do not upload every generated file |
| Supabase Free | Pausing after low activity over seven days; no included automatic database backups | Resume path, browser draft recovery and operator-exported backups required |
| Cloudflare Pages | Static requests free/unlimited; Functions count against Workers allowance | Prefer static client UI |
| Cloudflare Workers Free | 100,000 requests/day and 10 ms CPU/request | Use only thin authenticated API/proxy work after profiling; not PDF/OCR compute |
| Cloudflare D1 Free | 5 million rows read/day, 100,000 rows written/day, 5 GB total storage | Viable SQLite-family alternative, but endpoint/auth/adapter work still needed |
| Turso Free | 5 GB storage, 500 million monthly rows read, 10 million monthly rows written | Candidate for SQLite-oriented cloud migration; auth/storage still separate |
| Neon Free | Recent official announcement: 1 GB/project and 100 CU-hours/project/month | Postgres alternative; additional backend integration remains |

These are dated published allowances, not reservations or guarantees. Recheck console/terms at provisioning. Supabase "unlimited API requests" does not mean unlimited compute, storage, bandwidth or dependable service at every scale.

### 23.3 Division of work

Browser:
- editor, formula rendering, asset preview and storyboard;
- debounced local draft persistence;
- generate PPTX/DOCX on device where compatibility and performance permit;
- PDF through a verified browser print layout initially (clearly label Print / Save as PDF; do not call it a direct generated PDF download);
- downloaded reviewed curriculum packs for offline reuse.

Supabase:
- authenticated teacher accounts and accepted lesson revisions;
- reviewed curriculum/BOW metadata and applicable COT reference packages;
- observation assignment records and released feedback;
- bounded compressed teacher assets;
- row-level security for owner/assignment scope.

A lightweight server function:
- validate access and allowed action;
- contact an explicitly selected AI provider;
- protect provider credentials and enforce app quotas;
- validate returned proposal against the base revision.

Choose Supabase Edge Functions or a thin Cloudflare Worker after execution-limit profiling; do not adopt both by default. Neither is an automatic drop-in host for the existing Node 24 server, node:sqlite, filesystem and current persistence layer.

Local/offline mode:
- existing Node/SQLite application and local assets;
- same LessonIR and export conventions;
- optional explicit migration/import, not implicit dual-write.

### 23.4 Keeping actual spend at zero

- Stay on free plans; no automatic paid upgrade or paid-overage activation.
- Free database allowance does not pay for AI generation.
- Use a currently eligible free AI model/provider with documented quotas, or teacher-owned free-tier keys; no unlimited-generation promise.
- Never require a paid image-generation API: teacher uploads, licensed visuals and controlled SVG diagrams are first-release options.
- Disable provider billing-dependent features unless separately authorized; a paid key may incur charges despite an application label saying free.
- Store accepted JSON and asset metadata, not every DOCX/PPTX/PDF copy.
- Keep source packs as versioned static downloads where rights allow; avoid embedding source PDFs or image binaries in database rows.
- Compress uploaded images; set a proposed 1–2 MB upload cap; retain readable diagrams.
- Save meaningful edits in debounced batches rather than write per keystroke.
- Limit revision retention explicitly; never delete observation snapshots or accepted work silently.
- Begin without realtime subscriptions or universal vector embeddings.
- Use quota meters/warnings at proposed 70%, 85% and 95% levels.
- At a limit, preserve local work and offer exports rather than secretly upgrade.
- Maintain manual/exported backups and demonstrate restore.
- Use OAuth where appropriate or verified custom SMTP within a free allowance: Supabase's built-in mail is unsuitable for a general teacher rollout.
- Treat browser storage eviction/device loss as a real limitation; user exports and server backup address different failure modes.
- Review free AI data handling: Gemini pricing identifies free-tier product-improvement use; anonymous class context only.

### 23.5 Supabase versus alternatives

Choose Supabase for the initial shared pilot because it combines database, auth and storage; not because it has the largest free storage quota.

Choose Turso/D1 only if measured benefit outweighs the cost of new auth/storage/backend integration. Choose Neon when Postgres is desired but Supabase integration is unsuitable. Do not combine several databases merely to multiply free quotas.

An IndexedDB cache adds draft recovery. Full multi-device/offline synchronization is a separate feature requiring conflict handling, tombstones, authorization revalidation and clear last-synced status.

Suggested free pilot: a small invited teacher group. Do not promise a national-scale service on perpetual free resources. Record actual database bytes, storage/egress, function CPU, AI requests/tokens and export performance before expanding.

### 23.6 Next architecture tasks

1. Run Node/SQLite baseline and preserve it.
2. Write the free-cloud architecture ADR and package exceptions.
3. Prototype one authenticated lesson save with Supabase RLS.
4. Test another user's record is inaccessible and assigned observer access remains scoped.
5. Prototype IndexedDB recovery and explicit conflicts.
6. Profile browser PPTX/DOCX and print-PDF on representative Android/laptop hardware.
7. Profile a secure free-tier AI request and quota exhaustion.
8. Implement manual backup/restore and project-pause handling.
9. Migrate a copy of test data; preserve IDs/source versions and retain rollback.
10. Deploy only after the reviewed cloud spike works; this document authorizes no new service provisioning.

Additional current sources:
- https://supabase.com/pricing
- https://supabase.com/docs/guides/platform/billing-on-supabase
- https://supabase.com/docs/guides/platform/free-project-pausing
- https://supabase.com/docs/guides/auth/auth-smtp
- https://developers.cloudflare.com/pages/functions/pricing/
- https://developers.cloudflare.com/workers/platform/limits/
- https://developers.cloudflare.com/d1/platform/pricing/
- https://turso.tech/pricing
- https://neon.com/blog/neon-free-plan-1-gb-per-project
- https://ai.google.dev/gemini-api/docs/pricing
