# Budget of Work integration

The wizard includes centrally published source-directory links for Kindergarten and Grades 1–12. Source pages were checked on 2 October 2026. Kindergarten planning is supported with teacher-selected competencies; its source rows still require exact import and review. These links are not a populated competency catalog.

The central source pages embed files that could not be retrieved in this session. Grade 11 academic electives await updates; Grade 12 academic electives point to curriculum guides. Do not fabricate rows to make coverage appear complete.

An operator can import reviewed competency rows for all supported grades via `ILAW_BOW_FILE`. Use the curriculum record format plus `kind: "budget-of-work"`, exact `schoolYear`, `curriculumVersion`, `term` (Term 1–3), and `week` (source week or null when unspecified). Source requires status verified, exact excerpt containing the competency/code, section, verifiedAt, policyVersion and reviewer. Set the curriculum to an application-supported curriculum label. Source authenticity does not alone establish applicable rollout.

Validate a prepared JSON array with:

```
node scripts/import-bow.js reviewed-rows.json reviewed-bow.json
```

The output must not exist; validation finishes before writing. Set `ILAW_BOW_FILE` to its absolute path and restart. The wizard filters rows by grade, subject, curriculum, school year, term and exact source week where supplied. No term/week is inferred. Server-side resolution rejects mismatched selections. Plans retain a copy of the selected source record and exports retain curriculum provenance.

Coverage is a row count, not a completeness certification. Full automatic BOW population remains blocked pending retrieval and review of the embedded files. Primary entry point: https://sites.google.com/deped.gov.ph/lsguide/budgets-of-work .

Account batch imports are available in the app and always remain teacher-confirmed. Operator-reviewed files and teacher imports are counted separately; neither count proves complete coverage.
