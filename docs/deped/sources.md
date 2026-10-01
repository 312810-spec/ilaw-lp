# Source registry — verification blocked
Last attempted: 2026-09-30. This environment cannot connect to its configured HTTP proxy (curl: connection refused). No live browsing/search tool is available. Therefore current ILAW issuances, Revised K–10 rollout, Strengthened SHS rollout, BOW, generative-AI policy, and exact current documentation requirements have **not** been verified. Do not treat this repository as authoritative policy advice.

These historical/primary-source entry points are research candidates, not confirmation of current applicability:

| Source / issuance | Date | Relevant section | Interpretation | Application behavior | Status |
| --- | --- | --- | --- | --- | --- |
| [DepEd Orders](https://www.deped.gov.ph/category/issuances/deped-orders/) | Ongoing | Latest lesson-preparation / curriculum issuances | Must identify newer requirements before asserting national ILAW mandate | No official-compliance claims; ILAW is the user's requested rendering | Awaiting verification |
| [DO 42 s. 2016](https://www.deped.gov.ph/2016/06/17/do-42-s-2016-policy-guidelines-on-daily-lesson-preparation-for-the-k-to-12-basic-education-program/) | 2016-06-17 | Policy Guidelines on Daily Lesson Preparation | Historical reference only; do not assume DLL/DLP remains controlling | Source card says historical; no imposed DLL/DLP requirement | Awaiting current applicability review |
| [DO 8 s. 2015](https://www.deped.gov.ph/2015/04/01/do-8-s-2015-policy-guidelines-on-classroom-assessment-for-the-k-to-12-basic-education-program/) | 2015-04-01 | Classroom Assessment | Historical assessment reference; exact provisions not read this session | Traceable assessments are pedagogical recommendations, not asserted current mandates | Awaiting current applicability review |
| [MATATAG portal](https://www.deped.gov.ph/matatag-curriculum/) | Version varies | Curriculum guides | Retrieve grade/subject PDF and rollout issuance; record effective dates | No inferred codes, standards, weeks, or automatic curriculum assignment | Awaiting verification |
| [DepEd home](https://www.deped.gov.ph/) | Ongoing | Revised K–10 / Strengthened SHS announcements and guides | Terminology may vary by grade, year, pilot, rollout | Teacher selects curriculum explicitly; current-policy warning persists | Awaiting verification |
| [Codex skills documentation](https://developers.openai.com/codex/skills/) | Ongoing | Skills, progressive disclosure | Requested best practices pending live inspection | Concise AGENTS, narrow skills, deterministic checks | Awaiting verification |
| [OpenAI Skills repository](https://github.com/openai/skills) | Ongoing | SKILL.md conventions | Do not claim current repository was inspected | Local specialized skills use familiar format | Awaiting verification |

## Adding verified evidence
Use `npm run research` to fetch candidates when the configured proxy is functioning. A successful fetch is not a policy review. Record issuance, publication date, exact section/page, interpretation, effective_from/effective_to, policy_version, curriculum_version, reviewer and verified_at. Curriculum imports require exact source excerpts and teacher confirmation. Manual teacher confirmation is labelled separately from independently verified records. Conflicts must be recorded, preferring the newer applicable issuance only after determining scope and effective dates.

## Compliance categories
- OFFICIAL REQUIREMENT: only after authoritative document and applicability are reviewed.
- RECOMMENDED PEDAGOGICAL PRACTICE: backward design, evidence links, supports, conditional follow-up.
- APP DEFAULT: 1–5 sessions, optional ILAW fields, timing allocations, guided evidence thresholds, offline-first resources.
- TEACHER PREFERENCE: language, grouping, pedagogy, context, modifications.

No official requirement has been verified in this build. The UI states this and never presents a compliance percentage.

## Policy update mechanism
An administrator can supply `ILAW_POLICY_FILE` after completing independent source review. `src/policy.js` caches the versioned registry and snapshots applicable sources into each generated plan. Required: status `operator-reviewed`, policyVersion, verifiedAt and nonempty sources with official DepEd URL, issuance/date/section/excerpt/interpretation/behavior/reviewer. Optional effective dates, gradeScope, curriculumScope and alternate section terminology. Out-of-scope or expired registries remain unverified. A registry does not prove the application implements every issuance provision; teacher documentation review is still required. Existing plans retain their policy snapshot. Never populate this file with invented research merely to remove warnings.
