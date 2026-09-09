# Final review fixes report

## Implemented findings

- Added a server-derived `PublicHiddenFrom` epoch to each public job. Both Apps Script cache hits and every browser data source re-filter jobs against that epoch, so a job cached before expiry disappears exactly at the day-8 boundary.
- Applied `isJobPublic_()` to job share-page lookup so expired IDs receive the generic jobs page instead of expired metadata or a deep link.
- Revalidated legacy image URLs before image/HTML precedence. Unsafe image URLs are cleared and sanitized HTML remains available as the visual fallback.
- Rejected invalid `LastDate` and `ExtendedDate` values on job save. Existing invalid Sheet rows remain unchanged and Admin lists label them `Invalid closing date`.
- Reused `visualMedia()` in the product-details modal, preserving sandboxed HTML and placeholder fallback instead of creating a broken `<img>`.
- Added matching backend/frontend timestamp-encoded-ID fallbacks for newest-first ordering (`13-digit epoch`, `YYYYMMDD`, and `YYYYMMDDhhmmss`).

## TDD evidence

The focused tests first failed for all six missing behaviors: stale cached jobs, expired share IDs, invalid job dates/Admin flags, unsafe legacy image precedence, timestamp-ID ordering, and product modal HTML media. After implementation, focused and full suites passed.

## Verification

- Backend/Admin: 30 tests passed, 0 failed.
- Frontend: 23 tests passed, 0 failed.
- `node --check` passed for `Code.gs` (copied to `.js`), `assets/app.js`, and `assets/data-cache.js`.
- `git diff --check` passed.

## Files

Git-backed:

- `assets/app.js`
- `assets/styles.css`
- `tests/post-order-media.test.mjs`

External Apps Script/Admin deliverables and tests (not committed by design):

- `/workspace/scratch/09ee9ea50d18/deliverables/Code.gs`
- `/workspace/scratch/09ee9ea50d18/deliverables/Index.html`
- `/workspace/scratch/09ee9ea50d18/backend-tests/final-review-fixes.test.mjs`
- `/workspace/scratch/09ee9ea50d18/backend-tests/safe-html-media.test.mjs`
- `/workspace/scratch/09ee9ea50d18/backend-tests/admin-media-choice.test.mjs`

## Concern

No open implementation concern. The cache schema is now `v4`, so payloads that predate `PublicHiddenFrom` are ignored instead of being trusted across the expiry boundary.

## Final fix round 2

- Tightened the v4 browser cache contract: every cached job must carry a finite, non-negative `PublicHiddenFrom` value, including `0` for undated or invalid closing dates.
- Added `PublicHiddenFrom` to the checked-in inline job payload. Inline/offline rendering now fails closed for dated records missing server-derived metadata, while correctly retaining undated records marked with `0`.
- Preserved malformed legacy job dates in Admin by temporarily rendering their date control as text. Unchanged malformed values are blocked with an actionable message; the administrator must correct the value to `YYYY-MM-DD` or explicitly clear it.
- Rejected timestamp-ID times outside `00–23:00–59:00–59` in both backend and frontend parsers.
- Added offline, failed-fetch, inline-data, v4-cache, unchanged-invalid-date, and invalid timestamp regression coverage.

Round-2 verification: backend/Admin 31/31 and frontend 25/25 passed. Syntax checks for `Code.gs`, `assets/app.js`, `assets/data-cache.js`, and `assets/data.js` passed; `git diff --check` passed.
