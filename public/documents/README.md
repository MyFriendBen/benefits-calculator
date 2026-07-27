# Static documents

PDFs and other static documents served directly by the app (no bundling/transform).
A file placed here at `public/documents/<path>` is served at `/documents/<path>`
(i.e. `${process.env.PUBLIC_URL}/documents/<path>`).

These live under `public/` — not next to their consuming component — because Create
React App only serves files in `public/` at a stable, referenceable URL. The
`PagedDocumentViewer` needs real URLs for its `<img>` page images and its
Print/Download link, so the assets cannot be imported from `src/`.

## `heat-pump-journey/`

Assets for the CESN heat pump journey "Connect Now / Contractor Checklist" page
(`src/Components/EnergyCalculator/Results/HeatPumpJourney/ConnectNowPage.tsx`).

One subdirectory per translated edition of the guide, named for the language it
serves (`en-us/`, `es/`). `getContractorGuideAssets()` in `ConnectNowPage.tsx`
picks the directory from the selected locale's language subtag and falls back to
`en-us/` for languages with no edition — cesn offers a dozen languages, but only
these editions exist.

### `<edition>/contractor-checklist.pdf`

"How to find a good HVAC contractor" guide from Electrify Now, in that edition's
language. The viewer's **Print / Download** action opens this PDF, so users always
get a real PDF — the page images are display-only.

### `<edition>/page-*.png`

Pre-rendered page images of the PDF beside them, one per page, displayed by
`PagedDocumentViewer` (with a custom toolbar/pager) so the chrome can match the
Figma design.

> **Regenerate these whenever that edition's PDF changes.** They are NOT produced
> automatically. With poppler (`brew install poppler`), from the repo root:
>
> ```sh
> pdftoppm -png -r 150 \
>   public/documents/heat-pump-journey/es/contractor-checklist.pdf \
>   public/documents/heat-pump-journey/es/page
> ```
>
> This writes `page-1.png`, `page-2.png`, … If the page count changes, update that
> edition's `pageCount` in `CONTRACTOR_GUIDE_EDITIONS` in `ConnectNowPage.tsx`.

### Adding an edition

Add `public/documents/heat-pump-journey/<lang>/contractor-checklist.pdf`, render its
page images as above, then add a `<lang>: { dir, pageCount }` entry to
`CONTRACTOR_GUIDE_EDITIONS` keyed by the language subtag of the app locale
(e.g. `zh` for `zh-hans`).
