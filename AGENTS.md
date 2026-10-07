# ILAW
Read README.md before changing architecture. Node 24; no production dependencies.
Run `npm test` and `npm run check` after substantive changes.
- Never call app defaults, practice examples, teacher input, or AI output official DepEd requirements.
- Do not invent competency codes. Curriculum provenance is immutable during generation.
- Keep teacher edits outside targeted regeneration; save revisions transactionally.
- Secrets belong on the server. Never log prompts, learner context, or tokens.
- Relevant references: docs/deped (policy), docs/architecture (pipeline/security), docs/product (UX/reviews).
Specialized tasks: load only the matching .agents/skills/*/SKILL.md.

- For current/version-sensitive software-library facts, load `.agents/skills/context7-docs/SKILL.md` (or the Claude mirror). Re-check current official Context7 API/CLI docs before changing the integration; never use Context7 as DepEd/curriculum authority or send learner/class context through it.
