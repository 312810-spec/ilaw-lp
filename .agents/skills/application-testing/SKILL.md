---
name: application-testing
description: Verify real teacher journey, auth, versioning and failures.
---
Run npm test, npm run check, npm run test:e2e. Browser tests use installed Playwright. Mock providers are only fixtures in tests, never production fallback. Cover multi-session, offline/resource conflict, lost-update conflict, authorization and DOCX contents.
