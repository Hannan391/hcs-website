# Task 4 Report — Ordered safe HTML post media

## Scope

Updated the public frontend only:

- `assets/app.js`
- `assets/styles.css`
- `assets/data-cache.js`
- `tests/post-order-media.test.mjs`
- `tests/update-pages.test.mjs`
- `tests/data-cache.test.mjs`

Delivered:

- a shared `visualMedia(item, group, title, imageField?, htmlField?, className?)`
  renderer that prefers the optimized image and falls back to a sandboxed HTML
  visual;
- a defensive `safeBannerDocument(html)` sanitizer with a restrictive CSP;
- newest-first sorting for the six public collections and the update/home
  displays that consume them;
- responsive iframe styling that matches the existing image card rhythm;
- a cache-key bump from `hcs-public-data-v2` to `hcs-public-data-v3`.

## RED evidence

Before the implementation, the focused Task 4 suite failed as expected:

```text
node --test tests/post-order-media.test.mjs tests/update-pages.test.mjs tests/data-cache.test.mjs
```

Result: 5 failures.

Observed gaps:

- Services was still rendering in source order instead of newest-first.
- HTML-only media produced no sandboxed iframe.
- The generated HTML document lacked the CSP and sanitizer behavior.
- Update pages still used image-only rendering for HTML media.
- The public cache key was still on `v2`, so the new cache test failed.

## GREEN evidence

Focused verification:

```text
node --test tests/post-order-media.test.mjs tests/update-pages.test.mjs tests/data-cache.test.mjs
```

Result: 13 passing tests, 0 failures.

Full verification:

```text
node --test tests/*.test.mjs
node --check assets/app.js
node --check assets/data-cache.js
git diff --check
```

Result: 16 passing tests, 0 failures; both syntax checks exited 0; `git diff --check`
reported no whitespace issues.

## Self-review

- The HTML renderer prefers the optimized image whenever an image URL is present,
  even if HTML is also supplied.
- HTML-only records render in an iframe with `sandbox="allow-popups"` and a
  CSP-protected `srcdoc`.
- Unsafe banner markup is removed or neutralized before it can reach the iframe
  document.
- Services, Jobs, Downloads, Schemes, Education, and Catalog products all sort
  defensively with copied arrays and the shared newest-first comparator.
- The public cache now uses `hcs-public-data-v3`, matching the updated cache
  expectations.
- `git diff --check` stayed clean after the final edits.

## Notes

No external deliverables were modified.

## Fix round 1/5 — backend-matched CSS function and entity decoding

### Root cause

The frontend sanitizer allowed a broader set of CSS properties than the backend
and only rejected plain-text `url`/`expression`/`data` strings. It did not
decode numeric HTML entities before inspecting CSS values, and it did not apply
the backend's explicit CSS function allowlist. That meant `image-set()` and
entity-obfuscated `expression` / `url` / `data` values could survive the client
allowlist even though the backend would reject them.

### RED evidence

Focused regression run after adding the tests:

```text
node --test tests/post-order-media.test.mjs
```

Result before the fix: 1 expected failure. The sanitizer kept `image-set(...)`
and the entity-obfuscated CSS hazards instead of filtering them.

### Fix

Replaced the frontend banner sanitizer with the backend's tag/attribute/CSS
policy:

- exact banner tag allowlist;
- blocked container and void tag removal;
- numeric entity decoding before inspecting attribute and CSS values;
- exact CSS property allowlist;
- exact CSS function allowlist;
- strict HTTP(S) URL validation for banner links.

### GREEN evidence

```text
node --test tests/post-order-media.test.mjs
node --test tests/*.test.mjs
node --check assets/app.js
node --check assets/data-cache.js
git diff --check
```

Result: focused regression 4/4 passing; full suite 17/17 passing; both syntax
checks and whitespace check exited 0.

## Fix round 2/5 — named entity parity for URLs and CSS

### Root cause

The frontend was still only decoding numeric entities before CSS and URL
validation. The backend also decodes named banner entities such as `&amp;`,
`&quot;`, `&apos;`, `&lt;`, `&gt;`, `&colon;`, `&tab;`, and `&newline;`.
Without those decodes, an entity-encoded URL or CSS hazard could slip through
or be rendered incorrectly in the sandboxed `srcdoc`.

### RED evidence

Focused regression run after updating the test:

```text
node --test tests/post-order-media.test.mjs
```

Result before the fix: the parity test failed because the frontend did not yet
apply the backend's named-entity decoding before URL/CSS checks.

### Fix

Extended the frontend banner entity decoder to mirror the backend's named
entity map before validation:

- `amp`
- `quot`
- `apos`
- `lt`
- `gt`
- `colon`
- `tab`
- `newline`

### GREEN evidence

```text
node --test tests/post-order-media.test.mjs
node --test tests/*.test.mjs
node --check assets/app.js
node --check assets/data-cache.js
git diff --check
```

Result: focused regression 4/4 passing; full suite 17/17 passing; both syntax
checks and whitespace check exited 0.

## Fix round 3/5 — restore full CSS hazard coverage and table-driven entity cases

### Root cause

The round-2 test revision had replaced the earlier `image-set()`,
numeric-`expression`, and numeric-`url(data:)` hazard assertions with a narrower
set of cases. That left an avoidable coverage hole exactly where the reviewer
called it out.

### RED evidence

After restoring the table-driven test structure, the focused suite surfaced a
single expectation mismatch in the href parity case:

```text
node --test tests/post-order-media.test.mjs
```

The failure showed that the serialized `srcdoc` still contained the entity-escaped
href form once, which is the behavior we wanted to assert explicitly.

### Fix

Reworked the Task 4 test coverage into three independent checks:

- named-entity href parity for `amp`, `quot`, `apos`, `lt`, and `gt`;
- restored CSS hazard coverage for `image-set()`, numeric `expression`, numeric
  `url(data:)`, and named `colon`/`tab`/`newline` obfuscation;
- a separate data-URL guard that keeps entity-obfuscated `data:` out of CSS.

### GREEN evidence

```text
node --test tests/post-order-media.test.mjs
node --test tests/*.test.mjs
node --check assets/app.js
node --check assets/data-cache.js
git diff --check
```

Result: focused regression 6/6 passing; full suite 19/19 passing; both syntax
checks and whitespace check exited 0.

## Fix round 4/5 — restore rejected href protocol coverage and `url(` assertion

### Root cause

Two reviewer-required assertions were still missing from the test file:

- the CSS `data:` check did not explicitly assert that `url(` was absent in the
  serialized document;
- the href coverage did not exercise rejected `javascript:` variants with named
  entity obfuscation such as `&colon;`, `&tab;`, and `&newline;`.

### RED evidence

The focused suite stayed green while the reviewer gap remained, which confirmed
that this was a coverage-only defect rather than a behavior regression.

### Fix

Extended the href table to include a rejected-protocol case with
`javascript&colon;`, `javascript&tab;`, and `javascript&newline;`, asserting
that no unsafe href or protocol survives.

Also strengthened the entity-obfuscated data URL assertion to check both
`data:` and `url(` are absent.

### GREEN evidence

```text
node --test tests/post-order-media.test.mjs
node --test tests/*.test.mjs
node --check assets/app.js
node --check assets/data-cache.js
git diff --check
```

Result: focused regression 6/6 passing; full suite 19/19 passing; both syntax
checks and whitespace check exited 0.

## Fix round 5/5 — pin the numeric URL assertion and restore obfuscated protocol fixtures

### Root cause

The previous round still had two test-coverage mismatches with the reviewer’s
requested shape:

- the numeric `url(data:)` case was only proving `data:` was absent, not that
  `url(` itself was removed there;
- the rejected href fixtures needed to be the actual obfuscated protocol forms
  (`java&tab;script:...` and `java&newline;script:...`) rather than the earlier
  shorthand.

### RED evidence

The focused suite remained green until the test structure was tightened, which
confirmed this remained a coverage-only change.

### Fix

Moved the explicit `url\s*\(` absence assertion onto the numeric URL case and
switched the rejected href table to the exact protocol-obfuscation fixtures the
reviewer requested:

- `javascript&colon;alert(1)`
- `java&tab;script:alert(1)`
- `java&newline;script:alert(1)`

### GREEN evidence

```text
node --test tests/post-order-media.test.mjs
node --test tests/*.test.mjs
node --check assets/app.js
node --check assets/data-cache.js
git diff --check
```

Result: focused regression 7/7 passing; full suite 20/20 passing; both syntax
checks and whitespace check exited 0.
