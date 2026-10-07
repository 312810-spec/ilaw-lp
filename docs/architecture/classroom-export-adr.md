# Classroom export dependency decision — 2026-10-08

Outcome: create genuine editable PowerPoint slides with teacher notes from a reviewed lesson revision. Preserve Node/SQLite; no external service or provider call is needed for export.

Compared: handwritten OOXML (large compatibility/testing burden), browser-only/print slides (no editable PPTX), PptxGenJS (maintained OOXML serialization and native notes). Choose pinned PptxGenJS 4.0.1, the npm latest release checked today, as a narrow production dependency exception. Keep this isolated in src/presentations.js. Existing DOCX/PDF paths remain independent. No cloud database/hosting migration is introduced.

The app derives slide roles from intentions, learner activities and assessment prompts. Teacher instruction, differentiation and answer keys belong in notes. It does not call paragraph splitting a pedagogical storyboard. Long content may continue within its existing role without inventing new instructional content. The lesson must be teacher-reviewed and linked to its revision. No automatic correctness or DepEd approval claim.

Sources checked: https://github.com/gitbrent/PptxGenJS/releases ; https://gitbrent.github.io/PptxGenJS/docs/speaker-notes/ ; https://gitbrent.github.io/PptxGenJS/docs/usage-saving/ .

Validation: ZIP/XML relationships, editability/notes, latest saved data, supported mathematics, responsive preview and rendered layout. Unsupported mathematics must retain its source visibly, not disappear or silently change an answer. Full symbolic answer verification remains a separate review dependency.

Dependency audit found vulnerable image-size 2.0.2 transitively; override it with patched 2.0.3. npm audit --omit=dev reports zero vulnerabilities. Recheck on dependency upgrades.
