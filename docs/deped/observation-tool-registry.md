# Reviewed observation preparation tools

`ILAW_OBSERVATION_TOOLS_FILE` loads a bounded JSON array of operator-reviewed reference tools. No reference tool ships activated. Each tool needs: id, purpose (`formal-pmes`, `promotion-reclassification`, `developmental`), issuer, version, schoolYear, careerStage, reviewer, reviewedAt, effectiveFrom/effectiveTo, signedSourceURL, sourceExcerpt, status `operator-reviewed`, and indicators with unique id and verbatim wording. Optional divisionScope limits applicability further.

The signed source must be an official DepEd HTTPS URL. The operator still must establish that the document is signed, complete and applicable; a valid URL is not proof. Draft guidance and unreviewed excerpts cannot activate a tool.

In an observation record, Preparation mappings selects the exact career stage and purpose, then applicable reviewed indicators. Each teacher-confirmed mapping names a preserved snapshot activity, intended action, anticipated learner evidence and rationale. Saving sets status `planned` regardless of submitted status. Mappings retain tool version/source; amendments are observation revisions. Observed notes remain restricted to the assigned observer. Scores, observation counts and rating transmutations are unavailable.
