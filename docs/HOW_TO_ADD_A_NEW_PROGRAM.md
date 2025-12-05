# How to Add a New Program (Frontend)

> **Related Documentation**: For backend changes, see [benefits-api/docs/HOW_TO_ADD_A_NEW_PROGRAM.md](../../benefits-api/docs/HOW_TO_ADD_A_NEW_PROGRAM.md)

## When Are Frontend Changes Needed?

**Programs display automatically** from the backend API - **no frontend changes required** for programs to appear in results!

**Frontend changes are ONLY needed if** you want an "I already have this benefit" checkbox in the "Current Benefits" step.

### What Happens Without Frontend Changes

If you complete backend Steps 4-6 (white label config) but skip frontend changes:
- ✅ Checkbox appears in "Current Benefits" step
- ❌ **Selecting the checkbox does nothing** (broken functionality)
- ❌ Selection is not sent to backend

**Bottom line**: If backend added the checkbox (Step 4), you should do frontend changes too.

---

## Quick Steps

All changes are in 5 files. Add your benefit key (e.g., `il_csfp`) to each:

### 1. Add to Benefits Type

**File**: [src/Types/FormData.ts](src/Types/FormData.ts)

```typescript
export type Benefits = {
  // ... existing benefits ...
  il_csfp: boolean;  // ← Add your benefit here
  // ... more benefits ...
};
```

### 2. Add to API Type

**File**: [src/Types/ApiFormData.ts](src/Types/ApiFormData.ts)

```typescript
export type ApiFormData = {
  // ... existing fields ...
  has_il_csfp: boolean | null;  // ← Add has_{benefit_key}
  // ... more fields ...
};
```

### 3. Map to API Request

**File**: [src/Assets/updateScreen.ts](src/Assets/updateScreen.ts)

In the `getScreensBody` function:

```typescript
const screenBody: ApiFormData = {
  // ... existing mappings ...
  has_il_csfp: formData.benefits.il_csfp ?? null,  // ← Add mapping
  // ... more mappings ...
};
```

### 4. Map from API Response

**File**: [src/Assets/updateFormData.tsx](src/Assets/updateFormData.tsx)

In the `updateFormData` function:

```typescript
benefits: {
  ...formData.benefits,
  // ... existing benefits ...
  il_csfp: screen.has_il_csfp ?? false,  // ← Add reverse mapping
  // ... more benefits ...
}
```

### 5. Initialize Default Value

**File**: [src/Components/Wrapper/Wrapper.tsx](src/Components/Wrapper/Wrapper.tsx)

In `initialFormData`:

```typescript
const initialFormData: FormData = {
  benefits: {
    // ... existing benefits ...
    il_csfp: false,  // ← Add default value
    // ... more benefits ...
  },
  // ... other fields ...
};
```

---

## Testing

### 1. Type Check
```bash
npm run type-check
```

### 2. Test Checkbox Functionality

> **Prerequisites**: Backend Step 4 (white label config) must be complete

1. Start dev server: `npm start`
2. Navigate to "Current Benefits" step
3. Check your program's checkbox
4. Complete screener
5. Verify program does NOT appear in results (filtered out)

**Troubleshooting**: If checkbox doesn't appear, verify backend has the program in `category_benefits` config.

### 3. Verify API Request

1. Open DevTools → Network tab
2. Complete screener
3. Find `PUT /api/screens/{uuid}/` request
4. Verify body includes: `"has_il_csfp": true`

---

## Example PR

**Frontend PR**: [MyFriendBen/benefits-calculator#2003](https://github.com/MyFriendBen/benefits-calculator/pull/2003)

---

## Naming Convention

The benefit key must match across all systems:

```
Frontend FormData → benefits.il_csfp
Frontend API Type → has_il_csfp
Backend API Field → has_il_csfp
Backend Model     → Screen.has_il_csfp
Backend Config    → category_benefits["..."]["benefits"]["il_csfp"]
```

**Pattern**: Use the same key everywhere, with `has_` prefix for backend fields.

---

## Multiple Program Variants

If you have variants of the same program (e.g., `snap`, `co_snap`, `federal_snap`), they all use the **same benefit key**:

```typescript
// Frontend - same for all variants
formData.benefits.snap = true;
```

```python
# Backend - all map to same field
name_map = {
    "snap": self.has_snap,
    "co_snap": self.has_snap,           # Same!
    "federal_snap": self.has_snap,      # Same!
}
```

---

## Quick Checklist

- [ ] Added to `Benefits` type (FormData.ts)
- [ ] Added to `ApiFormData` type (ApiFormData.ts)
- [ ] Added mapping in `updateScreen.ts`
- [ ] Added reverse mapping in `updateFormData.tsx`
- [ ] Added default in `Wrapper.tsx`
- [ ] Types compile without errors
- [ ] Checkbox appears in "Current Benefits" step
- [ ] Checking box filters program from results
- [ ] Backend changes complete (see backend guide)

---

## Questions?

- **Backend guide**: [benefits-api/docs/HOW_TO_ADD_A_NEW_PROGRAM.md](../../benefits-api/docs/HOW_TO_ADD_A_NEW_PROGRAM.md)
- **Example PR**: [#2003](https://github.com/MyFriendBen/benefits-calculator/pull/2003)
