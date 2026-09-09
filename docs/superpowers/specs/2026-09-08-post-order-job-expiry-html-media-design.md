# Post Ordering, Job Expiry, and HTML Media Design

## Goal

Make every public content section show the newest post first, hide jobs seven days after their effective closing date, and let an administrator choose either an uploaded image or safe HTML/CSS for each post's visual area.

## Approved Scope

The change applies to these collections:

- Services
- Jobs
- Products
- Downloads
- Govt Schemes
- Education Updates

Existing records and uploaded images must remain compatible. The public navigation, card layouts, search filters, caching, image optimization, and mobile behavior must continue to work.


## Public Ordering

Every collection is returned and rendered newest first.

The ordering timestamp is selected in this order:

1. `CreatedAt`
2. The collection's publication date, such as `AdDate`, `PublishDate`, or an existing date field
3. A timestamp encoded in the record ID, when available
4. Original sheet order as the final stable fallback

New records receive `CreatedAt` automatically on first save. Editing an existing record must not change its original `CreatedAt`, so editing does not incorrectly move an old post to the top.

Ordering is enforced in the Apps Script public payload and repeated defensively in the browser renderer.

## Job Expiry Rule

The effective closing date is:

1. `ExtendedDate` when present
2. Otherwise `LastDate`

A job remains public through the end of the seventh calendar day after that date. It becomes hidden from the public payload at the start of the eighth day.

Example: a job closing on 1 October remains visible through 8 October and is hidden on 9 October.

Jobs without either closing date remain visible. Hidden jobs are not deleted from Google Sheets and remain available in Admin for editing or manual deletion. The rule is calculated in the Apps Script timezone to avoid client-clock differences.

## Image or Safe HTML/CSS

Each collection receives one HTML visual field alongside its existing image field:

| Collection | Existing image field | New HTML field |
|---|---|---|
| Services | `ImageURL` | `ImageHTML` |
| Jobs | `BannerURL` | `BannerHTML` |
| Products | `ImageURL` | `ImageHTML` |
| Downloads | `ImageURL` | `ImageHTML` |
| Govt Schemes | `ImageURL` | `ImageHTML` |
| Education Updates | `ImageURL` | `ImageHTML` |

Admin shows a visual-type selector with two choices:

- Upload Image
- Safe HTML/CSS

Only one visual source may be active for a record. Selecting Image clears or disables the HTML field. Selecting HTML clears or disables the image URL and upload control. Admin blocks submission if both contain values.

Existing records without a visual-type value infer Image when an image URL exists and otherwise default to Image. No migration is required.

## Safe HTML Policy

HTML is treated as untrusted input. It is sanitized before saving and sanitized again before public rendering.

Allowed elements are limited to presentational content such as:

- `div`, `section`, `span`, `p`
- `h1`, `h2`, `h3`, `strong`, `em`
- `a`, `button`
- `ul`, `ol`, `li`, `br`

Allowed links use only `http:` or `https:` URLs. Inline event handlers, scripts, iframes, forms, embeds, SVG, external stylesheets, and executable/data URLs are removed.

Safe styling uses an allowlist of visual CSS properties such as colors, background colors, spacing, borders, alignment, font sizing, and responsive-safe width/height constraints. Properties capable of loading external resources, escaping the card, obscuring the page, or executing content are removed. HTML length is capped to protect Sheets, page speed, and the Admin UI.

Sanitized HTML is rendered inside the same fixed visual container used by images. Overflow is contained, and the existing responsive card dimensions remain authoritative.

## Backend and Cache Behavior

Apps Script table headers are extended with the corresponding HTML field. Header setup appends missing columns without removing or reordering existing user data.

The public payload:

- filters jobs using the seven-day rule;
- sorts every collection newest first;
- includes sanitized HTML only;
- clears the server cache after create, update, deactivate, or delete operations.

The browser cache schema version is incremented because the payload shape changes. Cached content still renders immediately while fresh data loads in the background.

## Admin Behavior

Every applicable form displays the visual selector beside the current upload controls. Editing a record restores the correct selected mode. List previews indicate whether the record uses an image or HTML without executing HTML inside the Admin table.

Validation messages are plain and actionable:

- Choose either Image or HTML, not both.
- HTML contains unsupported or unsafe content.
- The closing date is invalid.

## Error Handling and Compatibility

- Invalid or unsafe HTML is rejected or reduced to safe content; scripts never execute.
- An invalid job closing date does not trigger automatic hiding and is flagged in Admin.
- Missing images and empty HTML continue to use the existing HCS placeholder.
- Old cached payloads are ignored safely after the cache key change.
- Records manually edited in Sheets are revalidated before public output.

## Verification

Automated tests will cover:

- newest-first ordering for all six collections;
- stable `CreatedAt` behavior during edits;
- the exact seven-day job visibility boundary, extended dates, missing dates, and invalid dates;
- image/HTML mutual exclusion in Admin;
- safe HTML acceptance and script/event/iframe/unsafe-URL removal;
- public HTML containment and image fallback;
- cache-version compatibility;
- existing Jobs search, Read More, navigation, and page rendering regressions.

Before deployment, the complete frontend and backend test suites, JavaScript syntax checks, and whitespace checks must pass. Frontend publishing and Google Apps Script deployment remain separate verified steps.
