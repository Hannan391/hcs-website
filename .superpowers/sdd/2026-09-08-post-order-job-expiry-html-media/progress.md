# SDD ledger — plan: docs/superpowers/plans/2026-09-08-post-order-job-expiry-html-media.md

## Preflight interface scan

| Task(s) | Producer → consumer / internal check | Finding |
|---|---|---|
| 1 → 2 | Task 1 extends `HCS_TABLES`/ordering; Task 2 extends the same schemas with HTML media fields | Consistent. Task 2 must preserve Task 1's appended `CreatedAt` and non-destructive expiry helpers. |
| 1 → 4 | Backend produces all six arrays newest-first; frontend defensively sorts the same arrays | Consistent exact collection identifiers. |
| 1 → 5 | Backend expiry behavior is consumed by production verification | Consistent: hidden after day 7, never deleted. |
| 2 → 3 | Backend maps `{image,html}` fields; Admin submits the same names | Consistent exact names: Jobs uses `BannerURL`/`BannerHTML`; other collections use `ImageURL`/`ImageHTML`. |
| 2 → 4 | Backend sanitized media fields are rendered defensively by frontend | Consistent; frontend repeats sanitization and uses sandbox/CSP. |
| 2 → 5 | Backend sanitizer and schemas are deployed in Apps Script | Consistent. |
| 3 → 5 | Admin media selector is deployed through `Index.html` | Consistent; Apps Script deployment is an external checkpoint. |
| 4 → 5 | Frontend commit and cache v3 are published to GitHub Pages | Consistent; shared-branch push requires a user-side-effect checkpoint. |
| 1 | Tests specify sorting, exact day-7/day-8 boundary, no `deleteRow`, and Admin retention | Internally consistent. |
| 2 | Tests specify mutual exclusion and explicit HTML/CSS allowlists | Internally consistent. |
| 3 | Tests specify selector restoration, outgoing record clearing, and non-executing previews | Internally consistent. |
| 4 | Tests specify six renderers, sandbox/CSP, fallback, sorting, and cache v3 | Internally consistent. |
| 5 | Verification covers local suites, non-force publish, Apps Script deploy, and production checks | Internally consistent; external deployment cannot be claimed until performed. |

Ruling: The plan's sample `visualMedia()` escapes the CSS class value with an HTML-text escaper; implementation may instead use a fixed allowlisted class name because class names are internal constants — this avoids malformed attributes — cost if wrong: custom caller-provided class names would be rejected rather than rendered.

Task 1: Ruling: Reviewer requested a git checkpoint for external Apps Script sources — keep `Code.gs` and backend tests outside this public static-site repository as the approved plan specifies, and preserve the existing Library-backed `Code.gs` identity/version instead — cost if wrong: backend source history remains separate from Git history and cannot be reconstructed from the Git diff alone.

Task 1: fix round 1/5 (1 addressed, 0 open — backend public cache key bumped to v3; external Code.gs Library version 3)

Task 1: complete (external backend source; review clean)

Task 2: complete (external backend source; Library version 4; review clean)

Task 3: fix round 1/5 (1 addressed, 1 open — stale upload callback fixed; dynamic edit values not restored)

Task 3: minor (addressed during fix): edit-mode and confirmation-cancel test coverage added.
Task 3: fix round 1/5 (1 addressed, 0 open — stale upload callbacks cannot populate inactive media fields; external Admin source)

Task 3: fix round 2/5 (1 addressed, 0 open — dynamic service/job/product/download edit values restored; unchanged save preserves active media)

Task 3: complete (external Admin source; 25/25 tests; review clean)

Task 4: fix round 1/1 (3 addressed, 0 open — shared safe HTML visualMedia added for services/jobs/products/downloads/updates, all browser lists made defensive newest-first, public cache key bumped to v3)

Task 4: complete (public frontend source; 16/16 tests; syntax and diff checks clean)

Task 4: fix round 1/5 (1 addressed, 0 open — frontend banner sanitizer now matches backend tag/attribute/CSS/function allowlists and decodes numeric HTML entities before CSS inspection)

Task 4: round 1 green (public frontend source; focused regression 4/4; full suite 17/17; syntax and diff checks clean)

Task 4: fix round 2/5 (1 addressed, 0 open — frontend banner entity decoding now mirrors backend named entities before CSS/URL validation)

Task 4: round 2 green (public frontend source; focused regression 4/4; full suite 17/17; syntax and diff checks clean)

Task 4: fix round 3/5 (1 addressed, 0 open — Task 4 test coverage restored for image-set, numeric expression/url, named colon/tab/newline, and named href parity cases)

Task 4: round 3 green (public frontend source; focused regression 6/6; full suite 19/19; syntax and diff checks clean)

Task 4: fix round 4/5 (1 addressed, 0 open — Task 4 test coverage now asserts both no `url(` and no unsafe href/protocol survives for javascript&colon;/&tab;/&newline; cases)

Task 4: round 4 green (public frontend source; focused regression 6/6; full suite 19/19; syntax and diff checks clean)

Task 4: fix round 5/5 (1 addressed, 0 open — Task 4 test coverage now pins `url(` absence on the numeric-url case and restores the exact java&tab;/java&newline; protocol fixtures)

Task 4: round 5 green (public frontend source; focused regression 7/7; full suite 20/20; syntax and diff checks clean)

Task 4: complete (public frontend source; final scoped review clean; 20/20 frontend tests)

Final review fixes: complete (all Important findings addressed; safe timestamp-ID Minor addressed; backend/Admin 30/30 and frontend 23/23; syntax and diff checks clean)

Final review fix round 2: complete (inline/offline expiry metadata enforced; invalid legacy dates preserved until explicit correction/clear; timestamp time ranges validated; backend/Admin 31/31 and frontend 25/25; syntax/diff clean)
