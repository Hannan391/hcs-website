# Govt Schemes and Education Updates Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add independently managed Govt Schemes and Education Updates pages, Admin tabs, Google Sheets storage, newest-first posts, optimized images, and fast cached loading.

**Architecture:** Extend the existing Google Apps Script table registry and public JSONP payload with two collections that share one update schema. The static site adds two pages rendered by the existing `assets/app.js`, while the Admin HTML reuses its current CRUD and optimized-upload flow. Browser and Apps Script caches continue to wrap the complete public payload.

**Tech Stack:** Static HTML/CSS/JavaScript, Google Apps Script, Google Sheets, Google Drive, Node.js built-in test runner, GitHub Pages.

**Spec:** `docs/superpowers/specs/2026-09-07-govt-schemes-education-updates-design.md`

## Global Constraints

- Navigation order is Home, Services, Jobs, Govt Schemes, Education Updates, Downloads, Catalog, Contact.
- Both collections use `ID`, `Title`, `Category`, `PublishDate`, `ImageURL`, `Description`, `OfficialLink`, `CreatedAt`, `Active`.
- Public cards are newest first and descriptions are limited to two lines until Read More is activated.
- Existing visual design, mobile behavior, WebP upload optimization, lazy images, and background refresh remain intact.
- Missing media/link/date data must degrade safely as defined in the spec.

---

### Task 1: Extend the Apps Script public data model

**Files:**
- Modify: `/workspace/scratch/09ee9ea50d18/deliverables/Code.gs`
- Modify: `/workspace/scratch/09ee9ea50d18/backend-tests/public-data-cache.test.mjs`

**Interfaces:**
- Consumes: existing `HCS_TABLES`, `save(token,type,record)`, `del(token,type,id)`, `publicData()`, `newestFirst_(records,type)`.
- Produces: `HCS_TABLES.schemes`, `HCS_TABLES.education`, plus `schemes` and `education` arrays in the public payload.

- [ ] **Step 1: Extend the fake spreadsheet fixtures and write failing assertions**

Add `GovtSchemes` and `EducationUpdates` header rows to the test fixture, then assert the returned public payload contains both arrays and that a second public API call performs no more sheet reads:

```js
assert.deepEqual(Array.from(first.schemes),[]);
assert.deepEqual(Array.from(first.education),[]);
assert.equal(sheetReads,readsAfterFirstRequest);
```

- [ ] **Step 2: Run the backend test and verify RED**

Run:

```bash
node --test /workspace/scratch/09ee9ea50d18/backend-tests/public-data-cache.test.mjs
```

Expected: FAIL because the public payload has no `schemes` or `education` keys.

- [ ] **Step 3: Add both table definitions and public collections**

Add:

```js
const UPDATE_HEADERS=["ID","Title","Category","PublishDate","ImageURL","Description","OfficialLink","CreatedAt","Active"];

// Inside HCS_TABLES
schemes:{sheet:"GovtSchemes",headers:UPDATE_HEADERS},
education:{sheet:"EducationUpdates",headers:UPDATE_HEADERS}
```

Build the public arrays with active filtering and newest-first ordering:

```js
schemes:newestFirst_(rows_("GovtSchemes").filter(active_),"updates"),
education:newestFirst_(rows_("EducationUpdates").filter(active_),"updates")
```

Extend `postTime_` so update records prefer `CreatedAt`, then `PublishDate`:

```js
const value=record.CreatedAt||(type==="jobs"?(record.AdDate||record.LastDate):record.PublishDate||"");
```

- [ ] **Step 4: Run the backend test and syntax check**

Run:

```bash
node --test /workspace/scratch/09ee9ea50d18/backend-tests/public-data-cache.test.mjs
cp /workspace/scratch/09ee9ea50d18/deliverables/Code.gs /tmp/hcs-Code.js
node --check /tmp/hcs-Code.js
```

Expected: PASS with zero test failures and zero syntax errors.

- [ ] **Step 5: Commit the backend source checkpoint if it is placed under version control**

Do not commit unrelated workspace files. If backend files remain Library-backed only, replace the existing Code.gs Library identity after verification instead.

---

### Task 2: Add Admin Panel CRUD tabs

**Files:**
- Modify: `/workspace/scratch/09ee9ea50d18/deliverables/Index.html`
- Create: `/workspace/scratch/09ee9ea50d18/backend-tests/admin-update-sections.test.mjs`

**Interfaces:**
- Consumes: Apps Script calls `list(token,type)`, `save(token,type,record)`, `del(token,type,id)`, `uploadMedia(token,fileData,section)`.
- Produces: Admin section types `schemes` and `education`, each submitting the common update schema.

- [ ] **Step 1: Write a failing Admin behavior test**

Load the Admin HTML into the existing VM/DOM test fixture and assert it exposes both navigation controls and forms with exact type identifiers:

```js
assert.ok(document.querySelector('[data-section="schemes"]'));
assert.ok(document.querySelector('[data-section="education"]'));
assert.equal(document.querySelector('#schemes-form [name="Title"]').required,true);
assert.equal(document.querySelector('#education-form [name="OfficialLink"]').type,"url");
```

- [ ] **Step 2: Run the Admin test and verify RED**

Run:

```bash
node --test /workspace/scratch/09ee9ea50d18/backend-tests/admin-update-sections.test.mjs
```

Expected: FAIL because the two tabs/forms do not exist.

- [ ] **Step 3: Add reusable update forms and list views**

For each section, render inputs for the approved schema:

```html
<input name="Title" required maxlength="180">
<input name="Category" maxlength="100">
<input name="PublishDate" type="date">
<input name="ImageURL" type="url">
<textarea name="Description" maxlength="4000"></textarea>
<input name="OfficialLink" type="url">
<label><input name="Active" type="checkbox" checked> Active</label>
```

Register both types in the existing Admin section configuration:

```js
schemes:{label:"Govt Schemes",form:"schemes-form",list:"schemes-list"},
education:{label:"Education Updates",form:"education-form",list:"education-list"}
```

Pass the section type to the existing optimized image uploader so files are placed under the matching Drive subfolder.

- [ ] **Step 4: Verify Admin CRUD wiring**

Run:

```bash
node --test /workspace/scratch/09ee9ea50d18/backend-tests/admin-update-sections.test.mjs
```

Expected: PASS. Manually verify create, edit, deactivate, and delete call the correct `type` value in the test double.

- [ ] **Step 5: Replace the existing Library-backed Index.html**

Preserve its Library identity and version history. Confirm the replacement operation succeeds before sharing it for Apps Script deployment.

---

### Task 3: Add public pages, navigation, and card renderer

**Files:**
- Create: `govt-schemes.html`
- Create: `education-updates.html`
- Modify: `assets/app.js`
- Modify: `assets/styles.css`
- Modify: `index.html`
- Modify: `services.html`
- Modify: `jobs.html`
- Modify: `downloads.html`
- Modify: `catalog.html`
- Modify: `contact.html`
- Create: `tests/update-pages.test.mjs`

**Interfaces:**
- Consumes: `DATA.schemes`, `DATA.education`, `imageButton(item,group,title)`, `newestFirst`, existing modal and Read More patterns.
- Produces: `renderUpdates(type,rootId)`, page modes `schemes` and `education`.

- [ ] **Step 1: Write failing public-page tests**

Assert both files exist, contain the right `data-page`, load the shared assets, and every public page contains navigation links in the required order. Add a renderer fixture that checks a newer `CreatedAt` item precedes an older `PublishDate` item.

```js
assert.match(schemesHtml,/data-page="schemes"/);
assert.match(educationHtml,/data-page="education"/);
assert.ok(nav.indexOf("jobs.html")<nav.indexOf("govt-schemes.html"));
assert.ok(nav.indexOf("govt-schemes.html")<nav.indexOf("education-updates.html"));
```

- [ ] **Step 2: Run the public-page tests and verify RED**

Run:

```bash
node --test tests/update-pages.test.mjs
```

Expected: FAIL because the pages and navigation entries are missing.

- [ ] **Step 3: Create the two page shells**

Use the current header/footer placeholders and page hero structure. Each page must include one content root:

```html
<div id="schemes-content" class="card-grid card-grid-3 loading-grid" aria-live="polite"></div>
```

and:

```html
<div id="education-content" class="card-grid card-grid-3 loading-grid" aria-live="polite"></div>
```

- [ ] **Step 4: Add navigation in the shared layout**

Insert:

```js
navLink("govt-schemes.html","Govt Schemes","schemes")
navLink("education-updates.html","Education Updates","education")
```

between Jobs and Downloads in desktop and mobile navigation.

- [ ] **Step 5: Implement the shared update-card renderer**

Add:

```js
function renderUpdates(type,rootId){
  const root=document.getElementById(rootId);if(!root)return;
  const rows=[...(DATA[type]||[])].sort(newestFirst);
  root.innerHTML=rows.map(updateCard).join("")||empty("No updates added yet.","bi-megaphone");
  bindUpdateReadMore(root);
}
```

`updateCard(item)` must escape all content, render the optimized image only when present, hide the link button when `OfficialLink` is empty, and render the two-line description with the existing Read More state pattern.

- [ ] **Step 6: Add responsive card styles**

Reuse `.content-card`, `.download-description`, `.job-read-more`, `.card-grid-3`, and current mobile breakpoints. Add only update-specific date/link styles that cannot reuse existing rules.

- [ ] **Step 7: Run page tests and complete suite**

Run:

```bash
node --test tests/*.test.mjs
node --check assets/app.js
git diff --check
```

Expected: all tests pass; no syntax or whitespace errors.

- [ ] **Step 8: Commit the public pages**

```bash
git add govt-schemes.html education-updates.html assets/app.js assets/styles.css index.html services.html jobs.html downloads.html catalog.html contact.html tests/update-pages.test.mjs
git commit -m "Add govt schemes and education update pages"
```

---

### Task 4: Extend instant browser caching safely

**Files:**
- Modify: `assets/data-cache.js`
- Modify: `tests/data-cache.test.mjs`

**Interfaces:**
- Consumes: `HCSDataCache.read()` and `HCSDataCache.write(data)`.
- Produces: cache validation for the complete payload including `schemes` and `education` arrays.

- [ ] **Step 1: Write a failing cache compatibility test**

```js
const payload={settings:{},services:[],jobs:[],downloads:[],products:[],schemes:[{ID:"S1"}],education:[{ID:"E1"}]};
assert.equal(cache.write(payload),true);
assert.deepEqual(cache.read().schemes,[{ID:"S1"}]);
assert.deepEqual(cache.read().education,[{ID:"E1"}]);
```

Also assert a payload with non-array `schemes` or `education` returns `false` and is not stored.

- [ ] **Step 2: Run the cache test and verify RED**

Run:

```bash
node --test tests/data-cache.test.mjs
```

Expected: FAIL because the current validator does not require the new arrays.

- [ ] **Step 3: Extend cache validation**

```js
function valid(data){
  return data&&typeof data==="object"&&
    ["jobs","downloads","schemes","education"].every(key=>Array.isArray(data[key]));
}
```

Increment the key to `hcs-public-data-v2` so an older payload cannot suppress the new sections.

- [ ] **Step 4: Run all frontend tests**

```bash
node --test tests/*.test.mjs
node --check assets/data-cache.js
```

Expected: all tests pass.

- [ ] **Step 5: Commit cache support**

```bash
git add assets/data-cache.js tests/data-cache.test.mjs
git commit -m "Cache scheme and education updates"
```

---

### Task 5: Deploy and verify the complete feature

**Files:**
- Deploy source: `/workspace/scratch/09ee9ea50d18/deliverables/Code.gs`
- Deploy source: `/workspace/scratch/09ee9ea50d18/deliverables/Index.html`
- Publish: GitHub `Hannan391/hcs-website` main branch

**Interfaces:**
- Consumes: verified frontend commit and Apps Script deployment.
- Produces: two live public pages and two working Admin content managers.

- [ ] **Step 1: Run the complete local verification**

```bash
node --test tests/*.test.mjs
node --test /workspace/scratch/09ee9ea50d18/backend-tests/*.test.mjs
node --check assets/app.js
node --check assets/data-cache.js
git diff --check
```

Expected: zero failures.

- [ ] **Step 2: Publish the frontend commit to `main`**

Use the connected GitHub repository, preserve unrelated changes, and perform only fast-forward updates.

- [ ] **Step 3: Deploy a new Google Apps Script version**

Replace `Code.gs` and `Index.html`, then use Deploy → Manage deployments → Edit → New version → Deploy. Keep “Execute as me” and public access settings unchanged.

- [ ] **Step 4: Verify the live API**

Call the public JSONP endpoint twice. Confirm HTTP 200, both new array keys, and a faster cached second response.

- [ ] **Step 5: Verify live pages and Admin operations**

Confirm navigation order on desktop/mobile; create one inactive test record in each Admin tab; verify it stays hidden; activate it; verify it appears newest first; expand Read More; open the official link; then delete the test records.

- [ ] **Step 6: Report deployment evidence**

Report the test count, live page URLs, API response status, and any remaining external latency without claiming unverified behavior.
