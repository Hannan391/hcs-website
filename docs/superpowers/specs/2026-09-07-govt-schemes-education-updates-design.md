# Govt Schemes and Education Updates Design

## Goal

Add two independently managed public sections immediately after Jobs in the site navigation:

- Govt Schemes
- Education Updates

Both sections must keep the current HCS visual design, newest-first ordering, mobile responsiveness, image optimization, and fast cached loading.

## Public Pages

Create `govt-schemes.html` and `education-updates.html`. Each page displays cards with:

- Title
- Category
- Publication date
- Optimized image
- Description
- Official link

Cards are ordered newest first. Descriptions show two lines initially and expand through Read More / Read Less. An empty-state message appears when no active posts exist. Images use lazy loading, small thumbnails in the list, and the existing full-image viewer.

The desktop and mobile navigation order becomes: Home, Services, Jobs, Govt Schemes, Education Updates, Downloads, Catalog, Contact.

## Admin and Data Model

Add separate Admin Panel tabs for Govt Schemes and Education Updates. Each tab supports creating, editing, listing, and deleting records. Both use the same fields:

`ID`, `Title`, `Category`, `PublishDate`, `ImageURL`, `Description`, `OfficialLink`, `CreatedAt`, `Active`.

Google Apps Script creates and maintains separate `GovtSchemes` and `EducationUpdates` sheets. New records receive `CreatedAt` automatically. Public data returns both collections sorted newest first. Saving or deleting a record clears the public cache so updates appear on the next background refresh.

## Image and Performance Behaviour

The existing Admin upload flow compresses images before upload. The recommended source size is 1200 × 800 px; the browser upload step limits the longest edge and converts to WebP. Public cards request smaller Google Drive thumbnails, use explicit dimensions, lazy loading, and async decoding.

The existing local browser cache stores the expanded public payload. Cached content renders immediately while Google Apps Script refreshes it in the background. Invalid cached data is ignored safely.

## Error Handling

- Missing images use the existing HCS placeholder.
- Missing official links hide the Official Link button.
- Missing dates fall back to `CreatedAt` for ordering.
- Failed background refresh leaves the last successfully loaded content visible.
- Invalid or inactive records are not shown publicly.

## Verification

Automated tests cover newest-first sorting, public data cache compatibility, the two new collections, two-line descriptions, and required page/navigation assets. JavaScript syntax checks and the full existing test suite must pass. After publishing, both live pages and their navigation links are verified on `hannancs.com`.
