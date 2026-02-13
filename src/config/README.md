# Custom Domain Configuration

Maps external domains (e.g., `energysavings.colorado.gov`) to white-label routes (e.g., `/cesn`).

## How It Works

1. **Cloudflare Page Rules** (primary): Redirects at the edge before the request reaches the app.
2. **Client-side fallback** (`customDomains.ts`): Runs at app initialization if Cloudflare doesn't redirect (e.g., local dev, misconfiguration).

Both mechanisms preserve the path, query params, and hash.

## Adding a New Custom Domain

1. **Add to `customDomains.json`:**
   ```json
   {
     "example-domain.gov": {
       "whiteLabel": "your_white_label",
       "defaultPath": ""
     }
   }
   ```
   - `whiteLabel` must exist in `ALL_VALID_WHITE_LABELS`
   - `defaultPath` is appended when visiting the root (`/`). Empty string uses the white label's default landing page.

2. **Add a Cloudflare Page Rule** in the Cloudflare dashboard:
   - URL pattern: `example-domain.gov/*`
   - Forwarding URL (301): `https://example-domain.gov/your_white_label/$1`

3. **Configure DNS** to point the domain to the app.

## Legacy White Label Redirects

Legacy white label paths (e.g., `/co_energy_calculator/*`) are redirected to their new paths (e.g., `/cesn/*`) in `ValidateWhiteLabel.tsx`. These use `window.location.replace()` to force a full page reload so the app initializes with the correct white label config.

See `LEGACY_WHITE_LABEL_REDIRECTS` in `../Components/RouterUtil/ValidateWhiteLabel.tsx`.
