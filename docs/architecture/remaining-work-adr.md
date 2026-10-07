# Remaining teacher workflows — 8 October 2026

The prior checkpoint understated the proposal backlog. Complete incremental adapters while keeping Node/SQLite as the writable authority.

Math options: unrestricted CAS (large dependency/domain burden), sampled numerical equivalence (counterexamples only), exact bounded rational arithmetic. Choose exact rational checks for supported statements, with explicit substitutions and unsupported/domain cases requiring teacher review. Do not claim word-problem or universal symbolic verification.

Editor options: rewrite everything in a rich editor, add a second writable block representation, derive a versioned LessonIR adapter from accepted strings. Choose reversible derived IR with stable IDs and source hashes; preserve the existing teacher editor and all revisions.

Slides: regenerate silently, block all edits, or preserve a teacher-edited storyboard against its lesson revision. Choose explicit saved storyboard edits, optimistic version checks and stale-export blocking. Rebuild is deliberate.

Assets: remote hotlinks, arbitrary executable SVG, or bounded locally stored raster bytes plus provenance. Choose PNG/JPEG with validated bytes/dimensions, owner-scoped storage, caption/alt/rights metadata and private-key audience separation. Exact diagrams use explicit data and scale labels.

Operations: rely on browser cache, copy a live SQLite file, or use consistent SQLite backup with encryption keys. Choose consistent backup and explicit restore to a new installation. Cloud migration remains a separate free-tier prototype; no unconfigured service is represented as deployed.

Cloud verification options: static SQL inspection, provision a service before testing, or run actual PostgreSQL locally through WASM. Choose PGlite 0.5.8 (Apache-2.0, checked npm/official docs on 2026-10-08) as a development-only exception for the isolated spike. It is not a production database, not served to browsers and not a replacement for Supabase's actual Auth/PostgREST tests. RLS tests use non-superuser roles and a fixture auth.uid() function. Production remains Node/SQLite, with one writable authority.

Official technical references: https://supabase.com/docs/guides/database/postgres/row-level-security ; https://supabase.com/docs/guides/auth/managing-user-data ; https://supabase.com/docs/guides/api/securing-your-api ; https://pglite.dev/docs/ . No service is provisioned and no free quota is assumed reserved.
