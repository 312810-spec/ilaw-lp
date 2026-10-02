# Teacher workspace UI/UX deliberation — 2 October 2026

Two independent reviewers inspected the application source as UI and UX specialists and exchanged recommendations. The implementation was edited during their review, followed by a second review. This records design decisions, not a claim of real-teacher research or rendered browser verification.

## Shared design goal

Respect Philippine teachers' professional judgment while reducing planning effort, uncertainty about sources and fear of losing edits. Support varying familiarity with the app through optional explanations and concrete examples. Let teachers choose English, Filipino, Cebuano or other classroom languages; do not infer learner ability or language from location. Avoid approval claims unsupported by authoritative guidance.

## Debate and resolution

| Segment | UI position | UX position | Implemented decision |
|---|---|---|---|
| Account entry | Calm, clear labels | Explain password requirements without technical distraction | Unique-password guidance; clear account state on sign-out/expired session |
| Navigation | Five destinations need to fit narrow screens | AI setup must remain discoverable | Short mobile labels, full accessible names, 44px touch controls and safe-area spacing |
| Dashboard/history | Prioritize actual lesson work | Resume unfinished planning and avoid misleading empty lists | Resume card; history filters apply only in history and retain displayed selection |
| Class planning | Remove document clutter from first screen | Retain export details without making them prerequisites | Teaching essentials first; optional school/signatories disclosure |
| Curriculum | Selected state must be accessible | Keep source truth visible | Valid ARIA selected state; source status remains visible |
| Learner context | Examples improve scannability | Optional observations, no deficit assumptions | Short math/support examples; teacher-controlled classroom language and anonymous context |
| Classroom resources | Existing practical resource choices are useful | Preserve offline and low-resource choices | Existing choices retained; no decorative feature expansion |
| Planning navigation | Focus needs to follow step changes | Intermediate inputs must be checked | Sequential navigation, heading focus, focused competency error |
| Generation | Avoid unnecessary page rebuilding | Preserve focus and recover from connection loss | Skip unchanged-stage rebuild; retry polling after transient errors |
| ILAW editor | Internal IDs distract from teaching | Source/save feedback must remain visible | Hide display-only IDs, accessible session button group, live save status and retry action |
| Checks/review | Avoid a false compliance score | Preserve professional review meaning | Explainable checks and provenance retained; actionable policy-registry language |
| Evidence | Counts need immediate feedback | Never invent observations | Live observed-class count; anonymous teacher-entered evidence |
| Revisions/recovery | Clear scope before replacement | Preserve work and allow restoration | Existing version history retained; confirmation before replacing unfinished planning; completed jobs cannot clear unrelated newer input |
| AI settings | Named provider and inline errors | Saved does not mean provider-tested | Provider-specific saved status, masked key, inline errors and clear free-quota conditions |
| Export | Separate Word from PDF actions | Explain the browser print workflow | Existing genuine DOCX download retained; explicit print → Save as PDF instructions |
| Dialogs | Preserve established focus trap | Keep reversible decisions visible | Existing modal keyboard handling and cancel/restore actions retained |

## Verification

Application and client-harness tests cover generation/edit/export journeys, draft protection, sequential-step controls, account credential UI and sign-out state isolation. Native browser verification is separately required; the current executor lacks Chromium. No claim is made that all visual details or screen-reader behavior have been observed on real devices. Live API lesson quality remains untested without provider credentials.
