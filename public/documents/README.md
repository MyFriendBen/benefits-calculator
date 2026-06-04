# Static documents

PDFs and other static documents served directly by the app (no bundling/transform).
A file placed here at `public/documents/<name>` is served at `/<name>` (i.e.
`${process.env.PUBLIC_URL}/documents/<name>`).

## Files

### `how-to-find-hvac-contractor.pdf`

"How to find a good HVAC contractor" guide from Electrify Now. Shown on the
Connect Now page (Find a Contractor / Contractor Checklist) via the
`PagedDocumentViewer` component. Referenced as
`CONNECT_NOW_CONTRACTOR_GUIDE_PDF_URL` in
`src/Components/EnergyCalculator/Results/HeatPumpJourney/ConnectNowPage.tsx`.

The viewer's **Print / Download** action opens this PDF, so users always get a
real PDF — the images below are display-only.

### `hvac-contractor-guide/page-*.png`

Pre-rendered page images of the PDF above, one per page. `PagedDocumentViewer`
displays these (with a custom toolbar/pager) instead of the raw PDF so the chrome
can match the Figma design. Referenced as
`CONNECT_NOW_CONTRACTOR_GUIDE_PAGE_IMAGES` in `ConnectNowPage.tsx`.

> **Regenerate these whenever `how-to-find-hvac-contractor.pdf` changes.** They are
> NOT produced automatically. With poppler (`brew install poppler`):
>
> ```sh
> pdftoppm -png -r 150 \
>   public/documents/how-to-find-hvac-contractor.pdf \
>   public/documents/hvac-contractor-guide/page
> ```
>
> This writes `page-1.png`, `page-2.png`, … If the page count changes, update the
> `CONNECT_NOW_CONTRACTOR_GUIDE_PAGE_IMAGES` array in `ConnectNowPage.tsx`.
