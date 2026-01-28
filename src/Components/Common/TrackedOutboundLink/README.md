# TrackedOutboundLink

A reusable component for tracking outbound link clicks in Google Analytics.

## Component

### `TrackedOutboundLink`

A drop-in replacement for `<a>` tags that automatically tracks outbound clicks.

**Props:**
- `href` (required): The destination URL
- `action` (required): GA4 action name (e.g., "rebate_link_click")
- `label` (required): Human-readable label for the link
- `category` (optional): Category for grouping (e.g., "energy_rebates")
- `additionalData` (optional): Extra data to include in the analytics event
- `openInNewTab` (optional): Whether to open in new tab (default: true)
- `children` (required): Link content (text, components, etc.)
- All standard `<a>` tag props are supported

**Example:**
```tsx
import { TrackedOutboundLink } from '../../Common/TrackedOutboundLink';

<TrackedOutboundLink
  href="https://example.com"
  action="rebate_link_click"
  label="Energy Rebate Application"
  category="energy_rebates"
  additionalData={{ rebate_type: "tax_credit" }}
  className="my-link-style"
>
  Apply for Rebate
</TrackedOutboundLink>
```

## Analytics Event Structure

All tracking sends events with this structure:

```javascript
{
  event: 'outbound_click',
  action: 'your_action_name',
  label: 'Your Label',
  url: 'https://destination.com',
  category: 'your_category',
  // ...any additional data
}
```

## Current Usage

Currently implemented for rebate application links in the Colorado Energy Savings Navigator:

- **Rebate Links**: Tracks clicks on "Learn how to apply" links with program name, rebate type, and category

## Migration from Manual Tracking

**Before:**
```tsx
import dataLayerPush from '../../../Assets/analytics';

<a 
  href={url} 
  target="_blank"
  onClick={() => {
    dataLayerPush({
      event: 'outbound_click',
      action: 'my_action',
      label: 'My Label',
      url: url
    });
  }}
>
  Link Text
</a>
```

**After:**
```tsx
import { TrackedOutboundLink } from '../../Common/TrackedOutboundLink';

<TrackedOutboundLink
  href={url}
  action="my_action"
  label="My Label"
>
  Link Text
</TrackedOutboundLink>
```

## Benefits

- **Consistent**: Standardized event structure
- **Maintainable**: Centralized tracking logic
- **Type Safe**: TypeScript support with proper interfaces
- **Simple**: Easy to use drop-in replacement for `<a>` tags

## Future Expansion

This component is designed to be extended for tracking other outbound links throughout the application. See related GitHub issue for potential refactor opportunities. 