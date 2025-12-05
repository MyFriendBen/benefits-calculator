# How to Add a New Program (Frontend)

This guide covers all the frontend changes needed to add a new benefit program to the MyFriendBen benefits-calculator application.

> **Related Documentation**: For backend changes, see [benefits-api/HOW_TO_ADD_A_NEW_PROGRAM.md](../benefits-api/HOW_TO_ADD_A_NEW_PROGRAM.md)

## Table of Contents

1. [Overview](#overview)
2. [Step 1: Add to FormData Types](#step-1-add-to-formdata-types)
3. [Step 2: Add to API Types](#step-2-add-to-api-types)
4. [Step 3: Update Screen Mapping](#step-3-update-screen-mapping)
5. [Step 4: Update Form Data Utilities](#step-4-update-form-data-utilities)
6. [Step 5: Initialize Default Value](#step-5-initialize-default-value)
7. [Testing Your Changes](#testing-your-changes)
8. [Example PRs](#example-prs)

---

## Overview

The frontend is **data-driven** - most program information comes from the backend API. Frontend changes are minimal and focus on:

1. Adding the benefit boolean to `FormData` types
2. Mapping the benefit to the API request
3. Initializing the default value

**The backend handles**:
- Program display name, description, value
- Eligibility calculation
- Category organization
- Navigator and document information

**The frontend handles**:
- Collecting user input (household, income, etc.)
- "Already have this benefit" checkbox functionality
- Displaying programs returned by the backend

---

## Step 1: Add to FormData Types

### 1.1 Add to Benefits Type

Edit [src/Types/FormData.ts](src/Types/FormData.ts):

```typescript
export type Benefits = {
  acp: boolean;
  andcs: boolean;
  cccap: boolean;
  // ... existing benefits ...
  il_csfp: boolean;  // ← Add your new program here
  // ... more benefits ...
};
```

**Key naming convention**: The property name (e.g., `il_csfp`) must match:
- The key in the backend's `category_benefits` config
- The `has_*` field name on the backend `Screen` model

---

## Step 2: Add to API Types

### 2.1 Add to ApiFormData Type

Edit [src/Types/ApiFormData.ts](src/Types/ApiFormData.ts):

```typescript
export type ApiFormData = {
  white_label: string;
  is_test: boolean;
  // ... existing fields ...
  has_il_csfp: boolean | null;  // ← Add your new program here
  // ... more fields ...
};
```

**Naming convention**: `has_{benefit_key}`
- Frontend: `formData.benefits.il_csfp`
- API: `has_il_csfp`

---

## Step 3: Update Screen Mapping

### 3.1 Map FormData to API Request

Edit [src/Assets/updateScreen.ts](src/Assets/updateScreen.ts):

Find the `getScreensBody` function and add your mapping:

```typescript
const getScreensBody = (formData: FormData, languageCode: Language, whiteLabel: string) => {
  // ... existing code ...

  const screenBody: ApiFormData = {
    white_label: whiteLabel,
    is_test: formData.isTest ?? false,
    // ... existing mappings ...
    has_il_csfp: formData.benefits.il_csfp ?? null,  // ← Add your mapping here
    // ... more mappings ...
  };

  return screenBody;
};
```

**Pattern**: `has_{key}: formData.benefits.{key} ?? null`

This maps the frontend boolean to the backend API field.

---

## Step 4: Update Form Data Utilities

### 4.1 Add to updateFormData Utility

Edit [src/Assets/updateFormData.tsx](src/Assets/updateFormData.tsx):

Find the section where benefits are mapped from the API response and add your benefit:

```typescript
export const updateFormData = (screen: ApiFormData, formData: FormData): FormData => {
  return {
    ...formData,
    // ... existing mappings ...
    benefits: {
      ...formData.benefits,
      // ... existing benefits ...
      il_csfp: screen.has_il_csfp ?? false,  // ← Add your mapping here
      // ... more benefits ...
    },
  };
};
```

This allows the form to populate from saved screen data (e.g., when user returns to edit).

---

## Step 5: Initialize Default Value

### 5.1 Update Initial Form Data

Edit [src/Components/Wrapper/Wrapper.tsx](src/Components/Wrapper/Wrapper.tsx):

Find the `initialFormData` object and add your benefit to the benefits section:

```typescript
const initialFormData: FormData = {
  benefits: {
    acp: false,
    andcs: false,
    cccap: false,
    // ... existing benefits ...
    il_csfp: false,  // ← Add your new program here
    // ... more benefits ...
  },
  // ... other form fields ...
};
```

This ensures the benefit starts as `false` for new screens.

---

## Testing Your Changes

### Test 1: Type Checking

```bash
npm run type-check
```

Ensure there are no TypeScript errors.

### Test 2: "Already Have Benefits" Step

1. Start the development server:
   ```bash
   npm start
   ```

2. Navigate to the "Additional Resources" step (or "Already Have Benefits" step)

3. Verify your program appears in the list with:
   - Correct category (e.g., "Food & Nutrition")
   - Correct name (from backend config)
   - Correct description (from backend config)

4. Check the checkbox for your program

5. Continue to results

6. Verify the program does NOT appear in results (it's filtered out)

### Test 3: API Request

1. Open browser DevTools (Network tab)

2. Complete the screener

3. Find the `PUT /api/screens/{uuid}/` request

4. Verify the request body includes:
   ```json
   {
     "has_il_csfp": true
   }
   ```

### Test 4: Program Display

1. Complete a screener WITHOUT checking your program

2. Ensure you meet eligibility requirements (per backend calculator)

3. Verify the program appears in results with:
   - Correct name, description, value
   - Correct category
   - "Learn More" and apply links
   - Navigator contact information
   - Required documents

### Test 5: Form Persistence

1. Start a screener and check your program in "Additional Resources"

2. Navigate forward a few steps

3. Navigate BACK to "Additional Resources"

4. Verify your program checkbox is still checked

---

## Understanding the Data Flow

### Complete Flow for "Already Have" Functionality

```
┌─────────────────────────────────────────────────────────────────────┐
│ BACKEND: White Label Configuration                                  │
│ (benefits-api/configuration/white_labels/{state}.py)                │
│                                                                      │
│ category_benefits = {                                                │
│   "food": {                                                          │
│     "benefits": {                                                    │
│       "il_csfp": { ... }  ← Config key                              │
│     }                                                                │
│   }                                                                  │
│ }                                                                    │
└─────────────────────────────────────────────────────────────────────┘
                                  ↓
┌─────────────────────────────────────────────────────────────────────┐
│ FRONTEND: Configuration API Response                                 │
│ GET /api/configuration/il/                                           │
│                                                                      │
│ Returns category_benefits config to frontend                         │
└─────────────────────────────────────────────────────────────────────┘
                                  ↓
┌─────────────────────────────────────────────────────────────────────┐
│ FRONTEND: User Interaction                                           │
│ (src/Components/Steps/AlreadyHasBenefits.tsx)                       │
│                                                                      │
│ User checks "CSFP" checkbox                                          │
│ formData.benefits.il_csfp = true                                     │
└─────────────────────────────────────────────────────────────────────┘
                                  ↓
┌─────────────────────────────────────────────────────────────────────┐
│ FRONTEND: API Mapping                                                │
│ (src/Assets/updateScreen.ts)                                        │
│                                                                      │
│ has_il_csfp: formData.benefits.il_csfp  ← Sent to API               │
└─────────────────────────────────────────────────────────────────────┘
                                  ↓
┌─────────────────────────────────────────────────────────────────────┐
│ BACKEND: Database Storage                                            │
│ (screener/models.py)                                                 │
│                                                                      │
│ screen.has_il_csfp = True  ← Saved to database                      │
└─────────────────────────────────────────────────────────────────────┘
                                  ↓
┌─────────────────────────────────────────────────────────────────────┐
│ BACKEND: Calculator Check                                            │
│ (programs/programs/il/commodity_supplemental_food_program/          │
│  calculator.py)                                                      │
│                                                                      │
│ e.condition(not self.screen.has_benefit("il_csfp"))                 │
│                                                                      │
│ If True → ineligible (user already has it)                           │
└─────────────────────────────────────────────────────────────────────┘
                                  ↓
┌─────────────────────────────────────────────────────────────────────┐
│ BACKEND: Eligibility Results                                         │
│ (screener/serializers.py)                                           │
│                                                                      │
│ program.already_has = True                                           │
│ program.eligible = False  (due to has_benefit check)                 │
└─────────────────────────────────────────────────────────────────────┘
                                  ↓
┌─────────────────────────────────────────────────────────────────────┐
│ FRONTEND: Results Filtering                                          │
│ (src/Components/Results/filterPrograms.ts)                          │
│                                                                      │
│ Programs with already_has=True are filtered out                      │
│ CSFP does NOT appear in results                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Example PRs

For complete working examples, see:

- **Frontend PR**: [MyFriendBen/benefits-calculator#2003](https://github.com/MyFriendBen/benefits-calculator/pull/2003)
  - Added `il_csfp` to FormData types
  - Added `has_il_csfp` to API types
  - Added mapping in updateScreen.ts
  - Added mapping in updateFormData.tsx
  - Also included phone number formatting improvements
  - Also included program description ordering improvements

- **Backend PR**: [MyFriendBen/benefits-api#1274](https://github.com/MyFriendBen/benefits-api/pull/1274)
  - See [benefits-api/HOW_TO_ADD_A_NEW_PROGRAM.md](../benefits-api/HOW_TO_ADD_A_NEW_PROGRAM.md)

---

## Common Patterns

### Multiple Program Variants

If you have multiple variants of the same program (e.g., different screener flows), they should all map to the **same benefit key**:

**Frontend** (same for all):
```typescript
// All variants use the same FormData field
formData.benefits.snap = true;
```

**Backend** (maps all variants):
```python
# screener/models.py - has_benefit() method
name_map = {
    "snap": self.has_snap,
    "co_snap": self.has_snap,                    # Same field!
    "federal_snap": self.has_snap,               # Same field!
    "co_energy_calculator_snap": self.has_snap,  # Same field!
}
```

This ensures checking "SNAP" in the "Already Have Benefits" step filters out ALL SNAP variants.

---

## Display-Only Programs

If your program should appear in results but does NOT need an "already have" checkbox:

**Skip Steps 1-5 entirely**. The program will automatically display based on backend configuration.

**The frontend will**:
- Fetch program data from `/api/eligibility/{uuid}/`
- Display the program in the appropriate category
- Show all program details (name, description, value, etc.)

**No frontend code changes needed** for display-only programs!

---

## Component Locations

### Key Files for Program Display

| Component | Purpose |
|-----------|---------|
| [Results.tsx](src/Components/Results/Results.tsx) | Fetches eligibility results from API |
| [Programs.tsx](src/Components/Results/Programs/Programs.tsx) | Lists all programs by category |
| [ProgramCard.tsx](src/Components/Results/Programs/ProgramCard.tsx) | Individual program card |
| [ProgramPage.tsx](src/Components/Results/ProgramPage/ProgramPage.tsx) | Detailed program page |
| [AlreadyHasBenefits.tsx](src/Components/Steps/AlreadyHasBenefits.tsx) | "Already have" checkboxes |
| [filterPrograms.ts](src/Components/Results/filterPrograms.ts) | Filters programs by eligibility/citizenship |

**Note**: You typically don't need to modify these files - they automatically handle new programs from the API.

---

## Additional Resources

### Type Definitions

- **FormData**: [src/Types/FormData.ts](src/Types/FormData.ts)
- **ApiFormData**: [src/Types/ApiFormData.ts](src/Types/ApiFormData.ts)
- **Program**: [src/Types/Results.ts](src/Types/Results.ts)

### Configuration

- **Config Hook**: [src/Components/Config/configHook.tsx](src/Components/Config/configHook.tsx)
- **White Label Types**: [src/Types/WhiteLabel.ts](src/Types/WhiteLabel.ts)

### Backend Documentation

- **Backend Guide**: [benefits-api/HOW_TO_ADD_A_NEW_PROGRAM.md](../benefits-api/HOW_TO_ADD_A_NEW_PROGRAM.md)
- **Import Config Tool**: [benefits-api/programs/management/commands/import_program_config_data/README.md](../benefits-api/programs/management/commands/import_program_config_data/README.md)
- **White Label Template**: [benefits-api/configuration/white_labels/_template.py](../benefits-api/configuration/white_labels/_template.py)

---

## Quick Checklist

Before submitting your PR:

- [ ] Added benefit to `Benefits` type in FormData.ts
- [ ] Added `has_*` field to `ApiFormData` type
- [ ] Added mapping in `updateScreen.ts` (`has_*: formData.benefits.*`)
- [ ] Added mapping in `updateFormData.tsx` (reverse mapping)
- [ ] Added default value in `Wrapper.tsx` (`initialFormData.benefits.*`)
- [ ] TypeScript compiles without errors (`npm run type-check`)
- [ ] Program appears in "Already Have Benefits" step
- [ ] Checking the checkbox filters the program from results
- [ ] API request includes correct `has_*` field
- [ ] Backend changes complete (see [benefits-api/HOW_TO_ADD_A_NEW_PROGRAM.md](../benefits-api/HOW_TO_ADD_A_NEW_PROGRAM.md))

---

## ProgramCalculator vs PolicyEngineCalculator

The frontend doesn't need to know which calculator type is used on the backend. Both types:

- Return the same `Program` object structure
- Work with the same "already have" functionality
- Display the same way in the frontend
- Use the same TypeScript types

**The only difference is in backend implementation** (see backend guide for details).

---

## Questions?

For questions or issues:
- Review the example PRs linked above
- Check the detailed backend documentation
- Review existing program implementations in the codebase
- Ask in team Slack or GitHub discussions
