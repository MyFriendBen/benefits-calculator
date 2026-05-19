# EmbeddedDocumentFrame

Reusable responsive `<iframe>` wrapper for embedded documents (PDFs, hosted HTML, etc.).

## Usage

- Always pass a meaningful **`title`** (accessibility).
- Prefer a restrictive **`sandbox`**; widen only if the embed fails to load or a documented feature requires it.
- Host long-lived assets on your own CDN when possible; replace WIP URLs in app constants after stakeholder sign-off.

## Sandbox

The default (`DEFAULT_EMBEDDED_DOCUMENT_SANDBOX`) is tuned so typical browser PDF viewers can run while omitting permissions like `allow-top-navigation` and `allow-forms`. Review when adding a new `src` origin.
