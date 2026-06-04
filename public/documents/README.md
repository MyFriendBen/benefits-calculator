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

### `how-to-find-hvac-contractor.pdf`

"How to find a good HVAC contractor" guide from Electrify Now. Referenced as
`CONNECT_NOW_CONTRACTOR_GUIDE_PDF_URL`. The viewer's **Print / Download** action
opens this PDF, so users always get a real PDF — the page images are display-only.

### `page-*.png`

Pre-rendered page images of the PDF above, one per page, displayed by
`PagedDocumentViewer` (with a custom toolbar/pager) so the chrome can match the
Figma design. Referenced as `CONNECT_NOW_CONTRACTOR_GUIDE_PAGE_IMAGES`.

> **Regenerate these whenever `how-to-find-hvac-contractor.pdf` changes.** They are
> NOT produced automatically. With poppler (`brew install poppler`):
>
> ```sh
> pdftoppm -png -r 150 \
>   public/documents/heat-pump-journey/how-to-find-hvac-contractor.pdf \
>   public/documents/heat-pump-journey/page
> ```
>
> This writes `page-1.png`, `page-2.png`, … If the page count changes, update the
> `CONNECT_NOW_CONTRACTOR_GUIDE_PAGE_IMAGES` array in `ConnectNowPage.tsx`.
