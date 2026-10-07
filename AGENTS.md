# ILAW
Read README.md before changing architecture. Node 24; PptxGenJS is the isolated presentation-export dependency. See docs/architecture/classroom-export-adr.md before adding packages.
Run `npm test` and `npm run check` after substantive changes.
- Never call app defaults, practice examples, teacher input, or AI output official DepEd requirements.
- Do not invent competency codes. Curriculum provenance is immutable during generation.
- Keep teacher edits outside targeted regeneration; save revisions transactionally.
- Secrets belong on the server. Never log prompts, learner context, or tokens.
- Relevant references: docs/deped (policy), docs/architecture (pipeline/security), docs/product (UX/reviews).
Specialized tasks: load only the matching .agents/skills/*/SKILL.md.

## FORGE v2
Use [docs/workflow/FORGE.md](docs/workflow/FORGE.md) for substantial work:
context -> teacher outcome -> focused clarification if blocked -> three distinct
approaches with evidence-based comparison -> improve, verify and export.
Keep IlawCraft-style complete AI lesson drafting central, with teacher review,
protected edits and genuine exports. Guided output must never masquerade as AI.
Keep context lean; compare alternatives for meaningful design choices, not every
small fix. Record main/open-PR/proposed status accurately. During long work save
meaningful git checkpoints and the next useful handoff in TASK.md about every
five minutes. FORGE adds no approval gate or mandatory multi-agent ceremony.

For current software facts, load `.agents/skills/context7-docs/SKILL.md`; Context7 is never curriculum authority.
