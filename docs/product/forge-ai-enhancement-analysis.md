# FORGE analysis: a dependable AI-driven ILAW lesson studio

Date: 2026-10-05, Philippines. Scope: project workflow adoption and enhancement analysis. Runtime enhancements below are proposed unless the status explicitly says existing or implemented in an open PR.

## Outcome and constraints

For a Philippine teacher preparing a real class, the app should turn an exact competency and a small amount of classroom context into a complete editable lesson, not a blank scaffold or a stream of errors. The teacher should feel that preparation is manageable, know what needs verification, and be able to teach from the result. Preserve IlawCraft's direct AI drafting experience and ILAW's protected source information, teacher edits and exports.

Success means: the requested sessions exist; objectives have meaningful tasks and complete worked keys; activities fit the available time/resources; support preserves the assessed learning; follow-up is conditional; the accepted lesson can be saved, reopened and exported with teacher edits intact. A model self-rating or valid JSON does not establish subject accuracy.

Use the user's free-API preference as a quota/call-budget constraint. A model name alone does not establish free availability for a particular account. No silent paid-model or cross-provider escalation. Missing curriculum material should be shown honestly while still supporting generation from the teacher's exact supplied competency.

## F — Current evidence

| Area | What the inspected project actually does | Enhancement implication |
| --- | --- | --- |
| Complete AI generation | `src/ai.js` on main calls `generateIlawCraft` for the default AI workflow, returning all structured stages in one response | Retain this as the primary experience |
| Provider recovery | Main makes one request. [PR4](https://github.com/312810-spec/ilaw-lp/pull/4) adds three-attempt request handling, schema/lesson repair and smaller-stage recovery; it is still open | Bring the verified recovery work into the release before claiming recovery is active |
| Interruptions | `src/db.js` marks queued/running jobs failed on restart; input is preserved but completed AI stages are not persisted | Add durable validated checkpoints and explicit resume |
| Teacher mode | `public/app.js` defaults to guided mode even when teachers can configure AI; the five-step wizard exposes workflow/detail/approach choices | Make the next configured-key flow favor complete AI drafting without overriding a teacher's explicit mode choice |
| Provider setup | Account keys are encrypted and scoped. Model IDs are fixed in `src/server.js`; a separate small connection test exists | Show verified key/model state and capability-aware selection; a tiny probe does not prove a full lesson succeeds |
| Quality | `src/quality.js` checks links/timing/resource risks and lexical alignment | Add targeted content review; structural alignment is weaker than instructional accuracy |
| Curriculum/BOW | Directory and sourced JSON imports exist; five built-in practice profiles do not constitute all-grade official coverage | Import and review a useful pilot corpus, then expand with measured coverage |
| Teacher control | Autosave, protected targeted revision, history and actual reflection exist | Keep these foundations and add previews for wider-impact revisions |
| Export | Current accepted data is exported to real DOCX and embedded-font PDF | Continue deriving learner tasks and teacher keys from the accepted lesson |
| Validation | PR4 workflow 36963795259 passed; its 64 tests use provider fixtures. Native E2E creates a guided lesson | Add a native AI recovery journey and opt-in real-provider lesson evaluation |
| Research accuracy | README and the historical verification report contain older limitations | Keep dated reports as history, but make current main/open-PR/live-tested status prominent |

Inspected ILAW main: `f5b796ad305119f72a391b0cc1f00408b51af7a3`. PR4 head: `c55757820e1a37bbc1a60d0d431787be00cea39f`. Re-check both before implementation.

The current IlawCraft reference was inspected at `7daf205cdd1a7a73cfab22919464deda00206e96`, in `alotski15-png/ilaw-app-2`. Its `app/api/generate/route.js` builds one detailed lesson prompt, validates session count and optionally COT evidence, and calls `runLessonPlanPipeline` with up to ten retry rounds. `lib/ai-providers.js` builds candidates from supplied Gemini model lists, runs concurrent candidate attempts and includes JSON recovery. These are source observations, not proof that every model or account works.

Useful ideas to adapt: complete drafts, capability-aware candidates, explicit abort, practical teaching flow and validation before accepting output. Improve on the reference by trying candidates sequentially within a teacher-visible budget, persisting validated work, and repairing specific defects. Do not accept a partial lesson merely because a truncated JSON fragment can be made parseable. COT preparation may map planned evidence when applicable tools are reviewed; generated planned evidence cannot become observed performance or a guaranteed rating.

LIKHA-SIS contribution: concise startup guidance, targeted retrieval, an outcome-led execution loop, changed hypotheses after failures, actual affected-behavior testing, and a small continuation file. Its Windows/Rust stack is not needed to apply that method here. FORGE definitions come from the user's saved v2 preference; the inspected LIKHA-SIS AGENTS/HARNESS files do not contain a verbatim FORGE specification.

## O — Desired teacher journey

1. Choose the saved class and planning period. Select an applicable competency or paste an exact excerpt; show source state beside it.
2. Confirm time, sessions, language, resource limits and essential learner context. Reuse class defaults and disclose assumptions. AI may recommend an approach.
3. Generate a complete AI lesson. Progress explains drafting, targeted repair or recovery. Closing/reopening the tab retains the job; future durable resume should survive server restart too.
4. Review teachability first: actual task/key, time, support and source. Edit or request a focused revision, then export the accepted saved lesson and classroom materials.

The app already implements pieces of this journey. This proposal simplifies the entry path and strengthens reliability/quality without requiring teachers to write the lesson themselves.

## R — Ambiguity and assumptions

The current user direction resolves the major choice: keep AI-driven IlawCraft-style generation. No clarification is needed to adopt the workflow or complete this analysis.

Assumptions for the next implementation: keep the existing Node/SQLite app; favor the teacher's configured provider and explicit free-API preference; do not add mandatory model-selection screens or require three full drafts. Start curriculum/content evaluation with the user's Grade 10 Mathematics and TLE-ICT context, then include other stages before broader claims. Exact official competencies and current subject applicability must come from the actual supplied sources.

Before live evaluation, account provider/key/quota state must be available through the app's setup flow. Do not ask for secrets in chat or claim a fixture is a live lesson. Before adding LIKHA-SIS synchronization, define ownership, consent and the minimal class-context contract; it is not a prerequisite for improving ILAW.

## G — Three distinct approaches

The grades below are engineering judgment from inspected source and teacher-workflow needs, not measured model performance or an official assessment.

| Approach | Teacher effort | Reliability potential | Quota/latency | Content-quality control | Judgment |
| --- | --- | --- | --- | --- | --- |
| A: Complete-draft call with retries only | Low | Handles transient failures; persistent long-output defects remain difficult | Lowest typical call count; repeats can still be costly | Whole-plan rejection/repair | Useful immediate baseline, insufficient for interruption/long-plan recovery |
| B: Every lesson through the full staged pipeline | Low teacher effort but more waiting | Small responses and stage validation; easy checkpoint boundaries | Eight successful calls before retries, larger round-trip overhead | More isolated checks; cross-stage coherence still needs review | Valuable recovery route, unnecessary default overhead for straightforward lessons |
| C: Complete AI draft, targeted repair, resumable staged recovery | Low | Fast complete-draft path plus recovery for specific failures | One typical drafting call; extra calls only when needed and budget permits | Local checks plus selective AI review/repair and teacher verification | Recommended balance; requires careful checkpoint/revision contracts |

Choose C. Keep deterministic guided drafting available only through an explicit teacher choice. FORGE's three approaches apply to substantial project decisions. For the product, an optional comparison of short teaching approaches can be added later; it should not triple full-lesson generation on every request.

## Fix the selected approach: implementation order

| Priority | Enhancement | Concrete acceptance evidence | Existing dependency/status |
| --- | --- | --- | --- |
| P0 | Integrate recovery into the released branch | A recoverable error leads to a saved valid AI lesson; refused/bad-key/exhausted-quota cases show the correct actionable reason | PR4 implemented and CI green, still unmerged |
| P0 | Verify the actual AI teacher journey | Browser test selects AI, displays retry/repair progress, receives a valid fixture-backed plan, preserves edits and downloads DOCX/PDF; separate opt-in live run evaluates a real full lesson | Current E2E covers guided generation only |
| P1 | Durable generation retention/resume | Kill/restart after a validated stage; resume the same owned job, reuse eligible stage outputs, save exactly one final plan; expired/mismatched checkpoints are rejected | Requires checkpoint store and worker coordination |
| P1 | AI-first setup and short planning path | With a working key, a new draft offers complete AI generation; remembered explicit choices remain honored; missing key leads to setup and restores unfinished input | Wizard/defaults/AI settings already exist |
| P1 | Targeted content critic and repair | A flagged wrong key or infeasible task identifies the exact component; repair leaves unrelated accepted content unchanged; unresolved content risk stays visible | Structural graph and protected revision exist |
| P1 | Quota-aware provider capability handling | Key/model probe records tested state; supported candidate retry respects the teacher's call/time budget; exhausted quota avoids an endless loop | Fixed account model IDs; one saved provider per account |
| P2 | Reviewed pilot BOW corpus and import UX | Real extracted rows have exact excerpts/page/period/grade/subject; teacher reviews before import; coverage reports actual rows rather than links | JSON imports/registry exist; complete corpus absent |
| P2 | Preview wider revisions | Before replacing objectives/session, show what changes and which dependent tasks become affected; teacher can keep the current saved version | Targeted preservation/history exist |
| P2 | Progressive teaching detail | Concise view is immediately teachable; expand scripts/materials without losing essential examples, checks or keys | Detail modes/classroom view exist |
| P2 | Observation preparation grounded in accepted plan | Show planned opportunities and readiness notes separately from factual post-observation evidence; no invented achievement/rating | Developmental observation module exists |
| P3 | LIKHA-SIS context bridge | Import only the selected assignment, class aggregate/context and period; show provenance; no identifiable learner payload to AI; reconciliation preserves ownership | Separate architecture/integration work, not needed for core AI drafting |

### Durable retention design

Store checkpointed **validated** stage outputs with owner/job ID, stage, schema/prompt versions, a canonical input/source fingerprint, model/workflow and usage. Exclude API keys. Checkpoint data includes lesson/class context: protect it with the same account ownership rules and avoid logging its contents. Revalidate checkpoints before reuse; a changed source, competency, context or contract invalidates incompatible outputs.

Use a worker lease/heartbeat and an atomic final save to avoid two resumed workers generating duplicate plans. Resume and cancel are explicit job actions. On interruption preserve existing teacher plans; an unfinished job is not yet a valid complete lesson. Retain completed stages across temporary errors and restart; expose what is reused rather than a misleading fresh-progress animation. Add a clear checkpoint retention/cleanup policy.

PR4's recovery stores successful stages only in process. It is a useful immediate improvement but cannot satisfy restart survival by itself.

### Quota and provider handling

Prefer the selected provider and a tested compatible model. Refresh candidate capabilities through a server adapter and validate the provider endpoint; do not let arbitrary client URLs receive stored credentials. Model availability is not proof of lesson quality. Use sequential authorized candidates and a total request/time budget; show when an additional attempt is being used. Give teachers a cancel/retry option and retain work.

Do not route a saved Gemini key to Groq or switch to another paid/unknown-cost model silently. If multi-provider keys are added, store each encrypted separately and make fallback order an account preference. Provider limits cannot be overridden by retention or retry logic. A wrong key, no quota or sustained outage remains a legitimate stop with retained input.

### Content quality without destroying AI flexibility

Separate structural checks from teachability checks. Inspect whether each task measures the objective, the answer key solves that actual task, examples introduce needed prior knowledge, class-size/time supports fit, activities work with selected resources, and multi-session learning progresses. Check exact arithmetic where a narrow deterministic checker is appropriate; do not pretend to automatically prove arbitrary mathematics or all subjects.

Use a selective critic on risky content or the teacher's request, not another mandatory full draft. Give it only the relevant accepted components and protected context. Ask for defect IDs and proposed fixes, validate proposals, and rerun affected checks. Automatic pre-save repair can fix a draft; modifications to accepted teacher content require review and must preserve unrelated edits. Model self-review is supporting evidence, not an independent teacher evaluation.

Reduce empty prose and generic phrases rather than dropping actual tasks/keys. Show no invented mastery results or diagnoses. For the user's compressed pacing needs, a teacher-selected minimum route and in-class/home alternative should retain the essential task and evidence; do not invent official pacing schedules.

## E — Verification and reusable delivery

Build a benchmark from exact reviewed or teacher-supplied competencies: Grade 10 Mathematics; Grade 10 TLE-ICT; primary literacy; junior-high science; an applicable SHS competency; mixed-readiness, multilingual, offline, large-class and multi-session variants. Include source/grade mismatches, a vague competency, conflicting resources, provider truncation, wrong key and exhausted quota. Use synthetic anonymous contexts.

Run the same inputs through candidate workflows/models within permitted free quotas. Record valid completion and recovery rates, call count, reported tokens, latency, teacher edits needed, task/key correctness and teachability review. Keep prompt/schema/model versions. Have teacher review assess content rather than model branding; no winner can be named from fixture tests alone. Small probes and schema-valid output are not full-lesson benchmarks.

For implementation, add focused integration/failure tests for checkpoints, leases, resume/cancel, source-fingerprint mismatch, cross-account access and single final save. Add native browser AI/recovery coverage with synthetic provider responses. Opt-in real-provider runs consume quota and must remain separate from CI fixtures. Regression checks must retain protected edits and valid latest-edit exports.

For this task, the committed deliverables are FORGE startup guidance, the reusable workflow, this comparison/roadmap and TASK continuation state. Runtime features in the roadmap have not been implemented by this analysis. PR4 remains a separate reviewable recovery change. No deployment, live model benchmark, complete BOW coverage or official compliance claim is made.

## Sources inspected

- [ILAW main](https://github.com/312810-spec/ilaw-lp/tree/f5b796ad305119f72a391b0cc1f00408b51af7a3): AGENTS/README, AI provider/orchestration, schema, jobs/storage, quality checks, wizard, tests and AI diagnostic.
- [AI recovery PR4](https://github.com/312810-spec/ilaw-lp/pull/4) and its successful [CI run](https://github.com/312810-spec/ilaw-lp/actions/runs/36963795259).
- [IlawCraft source](https://github.com/alotski15-png/ilaw-app-2/tree/7daf205cdd1a7a73cfab22919464deda00206e96): app/api/generate/route.js and lib/ai-providers.js.
- [LIKHA-SIS startup](https://github.com/312810-spec/likha-sis-0.2/blob/main/AGENTS.md) and [lean harness](https://github.com/312810-spec/likha-sis-0.2/blob/main/HARNESS.md), accessed 2026-10-05; user's saved FORGE v2 context.
