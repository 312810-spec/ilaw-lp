# Free cloud save contract

The isolated spike in `spikes/free-cloud` has one PostgreSQL authority, owner-only reads, immutable revision history and an atomic optimistic save RPC. Anonymous roles cannot read or execute it. The actor comes from `auth.uid()`, never a caller-supplied owner ID. Advisory transaction locking covers concurrent creation as well as updates. Client conflicts preserve the device draft.

`npm test` executes the SQL on PGlite's actual PostgreSQL WASM engine with authenticated/anonymous roles. It checks cross-owner reads/writes, anonymous denial, revision conflicts and history protection. This proves the tested SQL behavior against a fixture authentication context. It does not prove hosted Supabase JWT, HTTP gateway, email delivery, pause recovery or service quotas.

The adapter uses an authenticated user bearer token and a public project key. It is deliberately excluded from production routes. A deployment must choose cloud authority explicitly; it must never write the same lesson to SQLite and Supabase with assumed sync.

Before hosted activation: configure a free Supabase project and verified authentication; apply the migration once; run the two-user/anonymous/conflict suite through real PostgREST; validate complete LessonIR payloads on a trusted server before this RPC; migrate selected owners/revisions; implement owned object storage and observation assignment rules; verify quotas, backup/restore and free-plan pause recovery. Cloudflare static client hosting cannot directly host this Node 24 SQLite/filesystem application. No hosted pilot exists yet.

Browser recovery uses IndexedDB with a localStorage fallback. Accepted server revisions remain authoritative. Device eviction, account/device loss and storage denial require exported drafts or installation backups. These caches contain anonymous lesson context and teacher notes, not API keys. A draft download is a portable JSON copy, not a server installation backup.
