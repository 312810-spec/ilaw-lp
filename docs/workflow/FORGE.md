# FORGE v2 for ILAW

Adopted 2026-10-05 from the user's saved FORGE v2 preference and the lean workflow inspected in LIKHA-SIS (`312810-spec/likha-sis-0.2`, AGENTS.md and HARNESS.md). This is an ILAW adaptation, not a verbatim copy of a FORGE file from that repository. The inspected LIKHA-SIS startup/harness documents describe the lean execution loop but do not define FORGE.

## Product outcome

A Philippine teacher supplies the competency and classroom context. AI produces a complete, usable IlawCraft-style ILAW lesson with actual learner tasks, worked keys, feasible activities, supports and conditional next steps. The teacher reviews, edits and exports it. Keep AI drafting central; preserve source provenance and teacher changes. Never pass deterministic guided output off as AI output.

## F — Feed it context

Establish the user's role, audience, resources, constraints and what a good result looks like. Use current source and known decisions before asking the user to repeat them. For ILAW, inspect the affected teacher journey, curriculum/source state, provider path and saved-plan/export contract. Distinguish implemented main, open PRs, verified behavior and proposals. Load relevant source/skills only; avoid repeatedly loading historical studies.

For lesson design, use the exact supplied competency, standards when supplied, grade, language, readiness, resources, time, sessions and actual anonymous evidence. Labels such as Mixed readiness do not prove mastery or a diagnosis. A reference link is not the contents of its document.

## O — Outcome, not task

Define what the teacher should receive, be able to do and feel afterward: a complete editable draft, confidence about what needs review, and control over changes. State observable acceptance criteria and limits. Prefer outcomes such as “the saved AI lesson contains solvable tasks and complete keys and survives interruption” over “add retries.”

Do not equate valid JSON, green tests or AI self-review with accurate classroom content. Separate structural checks, teacher content review, current source applicability and live provider readiness.

## R — Reverse interview

When a missing decision blocks correctness, ask one focused question at a time. Continue independent work while waiting. Infer routine choices from project context; identify optional assumptions in the brief. Do not add a ceremonial questionnaire to a clear bug fix.

In the product, require the competency and essential class/time context. Offer focused clarification for consequential ambiguity. Keep optional preparation detail optional and avoid asking teachers for information AI can propose for review.

## G — Generate three approaches, grade, fix

For a substantial design choice, compare three materially different approaches against teacher effort, lesson quality, reliability, quota use and implementation cost. Grade the approaches using evidence and explicit judgment; choose and improve the strongest. Routine fixes need a changed hypothesis and relevant evidence, not three artificial alternatives.

Three approaches are a development decision technique. They do not require three full model-generated lessons or a multi-agent debate for every teacher request. Any product option to compare teaching approaches should be lightweight, optional and explicit about additional provider calls.

## E — Export reusable results

Deliver the working change or concrete analysis, acceptance criteria and next useful step. Save project decisions and handoffs in git. Link the reviewable result and report what actually ran. Keep current state in TASK.md. During substantial work, checkpoint meaningful progress about every five minutes and before risky transitions; do not commit credentials or fabricate a pass.

For teachers, export the accepted saved lesson and latest edits to genuine DOCX/PDF. Preserve AI disclosure and source state. Derive classroom materials/keys from that same plan; separate teacher keys when distributing learner materials.

## Operating rules

Proceed autonomously within the user's requested scope. FORGE is not an approval gate, universal scoring system, fixed agent count or requirement to restart an analysis. Preserve ILAW's Node/SQLite architecture unless an actual outcome calls for a change. Reuse relevant LIKHA-SIS methods; do not transplant its Windows/Android stack into ILAW merely to adopt FORGE.

Before delivery check: audience; desired result/feeling; acceptance evidence; remaining ambiguity; changed files; actual validation; next unresolved step. Proposed runtime enhancements remain proposals until implemented and verified.
