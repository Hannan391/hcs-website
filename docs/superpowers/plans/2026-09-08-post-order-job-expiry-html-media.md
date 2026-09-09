# Post Ordering, Job Expiry, and HTML Media Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Show every public collection newest first, hide jobs seven days after their effective closing date without deleting them, and support mutually exclusive uploaded-image or safe-HTML visuals on every post type.

**Architecture:** Extend the Apps Script schemas with stable creation timestamps and per-record HTML visual fields, centralize public ordering/expiry/HTML validation in backend helpers, and reuse one defensive media renderer in the static frontend. The Admin form owns the Image-versus-HTML choice, while the public renderer places sanitized markup in a sandboxed visual container.

**Tech Stack:** Google Apps Script, Google Sheets, static HTML/CSS/JavaScript, Node.js built-in test runner, GitHub Pages.

**Spec:** `docs/superpowers/specs/2026-09-08-post-order-job-expiry-html-media-design.md`

## Global Constraints

- Collections: Services, Jobs, Products, Downloads, Govt Schemes, and Education Updates.
- Effective job closing date: `ExtendedDate`, then `LastDate`.
- A job is visible through day 7 after closing and hidden at the start of day 8; it remains in Admin and Google Sheets.
- Image and HTML are mutually exclusive for each record.
- Allowed HTML is presentational only; scripts, iframes, forms, event handlers, executable URLs, and unsafe CSS are blocked.
- Existing records, optimized uploads, public navigation, search, Read More, caching, and mobile layouts remain compatible.

---

### Task 1: Enforce stable newest-first ordering and non-destructive job expiry

**Files:**
- Modify: `/workspace/scratch/09ee9ea50d18/deliverables/Code.gs`
- Modify: `/workspace/scratch/09ee9ea50d18/backend-tests/public-data-cache.test.mjs`
- Create: `/workspace/scratch/09ee9ea50d18/backend-tests/post-order-expiry.test.mjs`

**Interfaces:**
- Consumes: `rows_(sheetName)`, `newestFirst_(records,type)`, `save(token,type,record)`, `publicData()`.
- Produces: `postTime_(record,type) -> number`, `effectiveJobDate_(job) -> string`, `isJobPublic_(job,now?) -> boolean`.

- [ ] **Step 1: Write failing ordering and boundary tests**

Create fixtures for all six collections in deliberately oldest-first order. Assert public arrays return IDs newest-first. Add boundary cases using an injected date:

```js
assert.equal(context.isJobPublic_({LastDate:"2026-10-01"},new Date("2026-10-08T12:00:00Z")),true);
assert.equal(context.isJobPublic_({LastDate:"2026-10-01"},new Date("2026-10-09T00:00:00Z")),false);
assert.equal(context.isJobPublic_({LastDate:"2026-10-01",ExtendedDate:"2026-10-10"},new Date("2026-10-09T00:00:00Z")),true);
assert.equal(context.isJobPublic_({},new Date("2026-10-09T00:00:00Z")),true);
```

Assert `publicData()` does not call `deleteRow`, and `list(token,"jobs")` still includes an expired record.

- [ ] **Step 2: Run the backend tests and verify RED**

```bash
node --test /workspace/scratch/09ee9ea50d18/backend-tests/post-order-expiry.test.mjs
```

Expected: failures because services/products are unsorted and `cleanExpiredJobs_()` deletes old rows.

- [ ] **Step 3: Add stable timestamps and public sorting**

Append `CreatedAt` to the Services schema. Preserve existing `CreatedAt` on edits and assign it only on new records. Use exact type-specific fallbacks:

```js
function postTime_(record,type){
  const fallback=type==="jobs"?(record.AdDate||record.LastDate):
    (type==="schemes"||type==="education")?record.PublishDate:"";
  const value=record.CreatedAt||fallback||"";
  const time=value?new Date(String(value).replace(" ","T")).getTime():0;
  return isNaN(time)?0:time;
}
```

Wrap every public collection with `newestFirst_`, including Services and Products. Keep browser sorting as defense in depth.

- [ ] **Step 4: Replace deletion with visibility filtering**

Remove the `cleanExpiredJobs_()` call and deletion function. Add:

```js
function effectiveJobDate_(job){return clean_(job.ExtendedDate||job.LastDate,40)}
function isJobPublic_(job,now){
  const value=effectiveJobDate_(job);
  if(!value||!validDate_(value))return true;
  const today=now?new Date(now):new Date();
  today.setHours(0,0,0,0);
  const hiddenFrom=new Date(value+"T00:00:00");
  hiddenFrom.setDate(hiddenFrom.getDate()+8);
  return today<hiddenFrom;
}
```

Filter public jobs with `isJobPublic_` before sorting and status mapping. Do not filter Admin `list()`.

- [ ] **Step 5: Verify tests and syntax, then checkpoint external source**

```bash
node --test /workspace/scratch/09ee9ea50d18/backend-tests/*.test.mjs
cp /workspace/scratch/09ee9ea50d18/deliverables/Code.gs /tmp/hcs-Code-order.js
node --check /tmp/hcs-Code-order.js
```

Expected: all backend tests pass and no job-row deletion occurs.

---

### Task 2: Add safe HTML fields and backend validation

**Files:**
- Modify: `/workspace/scratch/09ee9ea50d18/deliverables/Code.gs`
- Create: `/workspace/scratch/09ee9ea50d18/backend-tests/safe-html-media.test.mjs`

**Interfaces:**
- Consumes: `HCS_TABLES`, `save(token,type,record)`, `publicData()`.
- Produces: `mediaFields_(type) -> {image:string,html:string}`, `sanitizeBannerHtml_(value) -> string`, `validateMediaChoice_(type,record) -> void`.

- [ ] **Step 1: Write failing schema, validation, and sanitizer tests**

Assert the exact field mapping:

```js
assert.deepEqual(context.mediaFields_("jobs"),{image:"BannerURL",html:"BannerHTML"});
assert.deepEqual(context.mediaFields_("products"),{image:"ImageURL",html:"ImageHTML"});
```

Test rejection when both fields are populated. Test that safe headings, paragraphs, links, and allowed inline colors survive while these are removed: `script`, `iframe`, `form`, `onclick`, `onerror`, `javascript:`, `data:`, `position:fixed`, `url(...)`, and markup beyond the length limit.

- [ ] **Step 2: Run the focused test and verify RED**

```bash
node --test /workspace/scratch/09ee9ea50d18/backend-tests/safe-html-media.test.mjs
```

Expected: failures because the fields and helper functions do not exist.

- [ ] **Step 3: Extend schemas without moving existing columns**

Append `ImageHTML` to Services, Products, Downloads, Govt Schemes, and Education Updates. Append `BannerHTML` to Jobs. Do not reorder existing headers; `ensureSheet_()` appends missing columns.

- [ ] **Step 4: Implement media mapping and mutual exclusion**

```js
function mediaFields_(type){
  return String(type)==="jobs"?{image:"BannerURL",html:"BannerHTML"}:{image:"ImageURL",html:"ImageHTML"};
}
function validateMediaChoice_(type,record){
  const fields=mediaFields_(type),image=clean_(record[fields.image],1000),html=clean_(record[fields.html],12000);
  if(image&&html)throw new Error("Choose either Image or HTML, not both");
  if(image&&!validHttpUrl_(image))throw new Error("Image link must use http or https");
  record[fields.image]=image;
  record[fields.html]=sanitizeBannerHtml_(html);
}
```

Call this validator for the six approved record types before saving.

- [ ] **Step 5: Implement the server sanitizer**

Build `sanitizeBannerHtml_` with explicit tag, attribute, URL, and CSS-property allowlists. Remove comments and whole blocked elements before processing remaining tags. Permit only `class`, safe `style`, and `a[href|target|rel]`; force links to `target="_blank" rel="noopener noreferrer"`. Reject input that becomes empty after sanitization.

The safe CSS allowlist is:

```js
const SAFE_BANNER_CSS=["color","background","background-color","padding","margin","border","border-radius","text-align","font-size","font-weight","line-height","width","max-width","height","min-height","display","gap","justify-content","align-items"];
```

Strip any CSS value containing `url`, `expression`, `javascript`, `@import`, backslashes, or control characters.

- [ ] **Step 6: Sanitize legacy sheet rows during public output**

Map all six public collections through a helper that copies each record and replaces its HTML field with `sanitizeBannerHtml_`. Records containing both sources prefer the existing image and expose an empty HTML field, preventing manually edited Sheets from bypassing mutual exclusion.

- [ ] **Step 7: Run backend verification**

```bash
node --test /workspace/scratch/09ee9ea50d18/backend-tests/*.test.mjs
cp /workspace/scratch/09ee9ea50d18/deliverables/Code.gs /tmp/hcs-Code-media.js
node --check /tmp/hcs-Code-media.js
```

Expected: all backend tests pass, dangerous markup is absent, and safe markup remains.

---

### Task 3: Add the Admin Image-or-HTML editor

**Files:**
- Modify: `/workspace/scratch/09ee9ea50d18/deliverables/Index.html`
- Modify: `/workspace/scratch/09ee9ea50d18/backend-tests/admin-update-sections.test.mjs`
- Create: `/workspace/scratch/09ee9ea50d18/backend-tests/admin-media-choice.test.mjs`

**Interfaces:**
- Consumes: `mediaFields_(type)` semantics from Task 2 and existing `uploadForField(key,button)`.
- Produces: `mediaConfig` map, `setMediaMode(mode)`, and mutually exclusive form records passed to `save`.

- [ ] **Step 1: Write failing Admin interaction tests**

For each collection, open a new/edit form and assert it contains Image and Safe HTML/CSS choices, the correct HTML textarea name, and the existing upload control. Simulate both values and assert submission is blocked with `Choose either Image or HTML, not both.` Simulate HTML mode and assert the outgoing record clears the image field.

- [ ] **Step 2: Run the focused test and verify RED**

```bash
node --test /workspace/scratch/09ee9ea50d18/backend-tests/admin-media-choice.test.mjs
```

Expected: failures because no media selector or HTML fields exist.

- [ ] **Step 3: Extend field configuration**

Add `ImageHTML` or `BannerHTML` to every approved form and define:

```js
const mediaConfig={
  services:{image:"ImageURL",html:"ImageHTML"},jobs:{image:"BannerURL",html:"BannerHTML"},
  products:{image:"ImageURL",html:"ImageHTML"},downloads:{image:"ImageURL",html:"ImageHTML"},
  schemes:{image:"ImageURL",html:"ImageHTML"},education:{image:"ImageURL",html:"ImageHTML"}
};
```

Use a 12,000-character HTML textarea limit.

- [ ] **Step 4: Render and restore the media selector**

Add a radio group before the visual inputs. `openEditor()` selects HTML only when the stored HTML field is non-empty; otherwise it selects Image. `setMediaMode()` disables the inactive controls and clears the inactive record value only when the user confirms switching away from non-empty content.

- [ ] **Step 5: Validate before Apps Script save**

In the submit handler, read both configured fields before `call("save",...)`. If both are non-empty, stop and show the mutual-exclusion message. Clear the inactive field in the outgoing object. Do not change optimized upload behavior.

- [ ] **Step 6: Show non-executing media labels in record lists**

Append `HTML visual` or `Image visual` to each record's text preview. Escape the label and never inject stored HTML into the Admin record list.

- [ ] **Step 7: Run complete Admin/backend tests**

```bash
node --test /workspace/scratch/09ee9ea50d18/backend-tests/*.test.mjs
```

Expected: all tests pass for create, edit, uploads, and the new media selector.

---

### Task 4: Render safe HTML media and keep all browser lists newest first

**Files:**
- Modify: `assets/app.js`
- Modify: `assets/styles.css`
- Modify: `assets/data-cache.js`
- Create: `tests/post-order-media.test.mjs`
- Modify: `tests/data-cache.test.mjs`
- Modify: `tests/update-pages.test.mjs`

**Interfaces:**
- Consumes: per-record `ImageHTML`/`BannerHTML`, existing `imageButton(...)`, and `newestFirst(a,b)`.
- Produces: `visualMedia(item,group,title,imageField?,htmlField?,className?) -> string`, `safeBannerDocument(html) -> string`.

- [ ] **Step 1: Write failing browser rendering tests**

Assert Services, Jobs, Products, Downloads, Schemes, and Education render a newer fixture before an older fixture. Assert a record with HTML emits a sandboxed visual frame/container and no image, while a record with an image emits the existing optimized image. Assert both supplied values prefer the image defensively.

Verify generated HTML documents contain a restrictive CSP and do not contain scripts, event attributes, forms, iframes, `javascript:`, or `data:` URLs.

- [ ] **Step 2: Run frontend tests and verify RED**

```bash
node --test tests/post-order-media.test.mjs tests/update-pages.test.mjs
```

Expected: failures because shared HTML media rendering does not exist and some collections use backend order directly.

- [ ] **Step 3: Implement the shared visual renderer**

```js
function visualMedia(item,group,title,imageField="ImageURL",htmlField="ImageHTML",className="image-button"){
  const image=String(item[imageField]||"").trim();
  const html=String(item[htmlField]||"").trim();
  if(image)return imageButton(item,group,title,imageField,className);
  if(!html)return imageButton(item,group,title,imageField,className);
  return `<iframe class="html-visual ${esc(className)}" sandbox="allow-popups" loading="lazy" title="${esc(title)}" srcdoc="${esc(safeBannerDocument(html))}"></iframe>`;
}
```

`safeBannerDocument()` applies the client allowlist again and prepends this CSP:

```html
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'; frame-src 'none'; connect-src 'none'">
```

Do not include `allow-scripts`, `allow-same-origin`, or `allow-forms` in the sandbox.

- [ ] **Step 4: Replace image-only calls in all six renderers**

Use `visualMedia()` for Services, Products, Downloads, Schemes, Education, and Jobs. Jobs pass `BannerURL`/`BannerHTML`; all others pass `ImageURL`/`ImageHTML`.

- [ ] **Step 5: Sort every renderer defensively**

Copy each collection before sorting:

```js
const rows=[...(DATA[type]||[])].sort(newestFirst);
```

Apply the same pattern to Services, Jobs before filtering/search, Products before catalog sorting, Downloads before grouping, Schemes, and Education.

- [ ] **Step 6: Add contained responsive styles**

Give `.html-visual` the same aspect ratio, border radius, width, and responsive height as the corresponding image area. Set `border:0`, `overflow:hidden`, and a neutral HCS background. Do not let iframe content change page layout.

- [ ] **Step 7: Increment and test browser cache compatibility**

Change the cache key from `hcs-public-data-v2` to `hcs-public-data-v3` and update its tests. The accepted payload collections remain arrays and cached content must still render before network completion.

- [ ] **Step 8: Run full frontend verification and commit**

```bash
node --test tests/*.test.mjs
node --check assets/app.js
node --check assets/data-cache.js
git diff --check
git add assets/app.js assets/styles.css assets/data-cache.js tests/post-order-media.test.mjs tests/data-cache.test.mjs tests/update-pages.test.mjs
git commit -m "Add ordered safe HTML post media"
```

Expected: complete frontend suite passes with zero syntax or whitespace errors.

---

### Task 5: Deploy and verify

**Files:**
- Deploy: `/workspace/scratch/09ee9ea50d18/deliverables/Code.gs`
- Deploy: `/workspace/scratch/09ee9ea50d18/deliverables/Index.html`
- Publish: GitHub repository `Hannan391/hcs-website`, branch `main`

**Interfaces:**
- Consumes: verified outputs from Tasks 1–4.
- Produces: live newest-first sections, non-destructive job expiry, and working Image/HTML Admin choices.

- [ ] **Step 1: Run fresh complete verification**

```bash
node --test tests/*.test.mjs
node --test /workspace/scratch/09ee9ea50d18/backend-tests/*.test.mjs
node --check assets/app.js
node --check assets/data-cache.js
cp /workspace/scratch/09ee9ea50d18/deliverables/Code.gs /tmp/hcs-Code-final.js
node --check /tmp/hcs-Code-final.js
git diff --check
```

Expected: zero failures.

- [ ] **Step 2: Publish frontend using a non-force main update**

Confirm remote `main` has not moved since the branch base. Push or update it only as a fast-forward; never force-push.

- [ ] **Step 3: Deploy Apps Script as a new version**

Replace `Code.gs` and `Index.html`, then choose Deploy → Manage deployments → Edit → New version → Deploy. Preserve Execute as me and existing access settings.

- [ ] **Step 4: Verify production behavior**

Create one test record in each collection and confirm newest-first ordering. Verify a boundary job remains visible on day 7 and is hidden on day 8 while still listed in Admin. For each section, test one uploaded image and one safe HTML banner; confirm scripts/iframes/event handlers are blocked. Delete the test records manually after verification.

- [ ] **Step 5: Report evidence**

Report frontend/backend test counts, the published commit URL, Apps Script deployment status, and any production step that requires user authentication.
