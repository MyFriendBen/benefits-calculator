# Navigation History Stack Implementation

## Overview

This document outlines the implementation of a centralized navigation context to replace the current scattered `location.state` approach for handling "return to previous page" navigation flows in the benefits screener.

## Problem Statement

Currently, when a user clicks "Edit" on the confirmation page to modify a previous answer, the app needs to:
1. Navigate them back to that step
2. After they submit, return them to the confirmation page (not the next step)

This is currently handled via `location.state` flags (`routedFromConfirmationPg`, `routeBackToResults`) that are:
- Scattered across multiple files
- Implicit and easy to forget when adding new navigation
- Checked in multiple places with duplicated logic

### Current Implementation Locations

- `src/Components/QuestionComponents/questionHooks.ts` - `useShouldRedirectToConfirmation()`, `useShouldRedirectToResults()`, `useGoToNextStep()`
- `src/Components/Confirmation/ConfirmationBlock.tsx` - Sets `location.state.routedFromConfirmationPg`
- `src/Components/PreviousButton/PreviousButton.tsx` - Has its own navigation logic
- `src/Types/FormData.ts` - Type definitions for `CustomTypedLocationState`

## Solution: Navigation History Stack

Create a React context that centralizes all "navigate with return" logic in one place.

### New File: `src/Components/NavigationContext/NavigationContext.tsx`

```typescript
import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';

type NavigationContextType = {
  /** The path to return to after the current edit flow, or null if normal navigation */
  returnTo: string | null;

  /** Navigate to a page while setting where to return after */
  navigateWithReturn: (to: string, returnPath: string) => void;

  /** Navigate to returnTo if set, otherwise to defaultNext */
  navigateNext: (defaultNext: string) => void;

  /** Clear the return destination (e.g., when user clicks Back instead of Continue) */
  clearReturn: () => void;
};

const NavigationContext = createContext<NavigationContextType | null>(null);

export function NavigationProvider({ children }: { children: ReactNode }) {
  const [returnTo, setReturnTo] = useState<string | null>(null);
  const navigate = useNavigate();

  const navigateWithReturn = useCallback((to: string, returnPath: string) => {
    setReturnTo(returnPath);
    navigate(to);
  }, [navigate]);

  const navigateNext = useCallback((defaultNext: string) => {
    if (returnTo) {
      const destination = returnTo;
      setReturnTo(null);
      navigate(destination);
    } else {
      navigate(defaultNext);
    }
  }, [returnTo, navigate]);

  const clearReturn = useCallback(() => setReturnTo(null), []);

  return (
    <NavigationContext.Provider value={{ returnTo, navigateWithReturn, navigateNext, clearReturn }}>
      {children}
    </NavigationContext.Provider>
  );
}

export function useNavigation() {
  const ctx = useContext(NavigationContext);
  if (!ctx) {
    throw new Error('useNavigation must be used within NavigationProvider');
  }
  return ctx;
}
```

### New File: `src/Components/NavigationContext/index.ts`

```typescript
export { NavigationProvider, useNavigation } from './NavigationContext';
```

## Files to Modify

### 1. `src/index.tsx`

Wrap the app with `NavigationProvider` inside `BrowserRouter`:

```typescript
import { NavigationProvider } from './Components/NavigationContext';

// ...

<BrowserRouter>
  <NavigationProvider>
    <Wrapper>
      <App />
    </Wrapper>
  </NavigationProvider>
</BrowserRouter>
```

### 2. `src/Components/Confirmation/ConfirmationBlock.tsx`

Replace the `Link` with a button using `navigateWithReturn`:

**Before:**
```typescript
<Link
  to={`/${whiteLabel}/${uuid}/step-${stepNumber}/${editUrlEnding}`}
  state={locationState}
  className="edit-button"
  aria-label={formatMessage(editAriaLabel)}
>
```

**After:**
```typescript
import { useNavigation } from '../NavigationContext';

// Inside component:
const { navigateWithReturn } = useNavigation();
const editUrl = `/${whiteLabel}/${uuid}/step-${stepNumber}/${editUrlEnding}`;
const confirmationUrl = `/${whiteLabel}/${uuid}/confirm-information`;

// If noReturn is true, use regular navigate; otherwise use navigateWithReturn
const handleEditClick = () => {
  if (noReturn) {
    navigate(editUrl);
  } else {
    navigateWithReturn(editUrl, confirmationUrl);
  }
};

<button
  onClick={handleEditClick}
  className="edit-button"
  aria-label={formatMessage(editAriaLabel)}
>
```

Note: You may need to add `useNavigate` import and update CSS if switching from `Link` to `button`.

### 3. `src/Components/QuestionComponents/questionHooks.ts`

Simplify `useGoToNextStep` to use the navigation context:

**Before:**
```typescript
export function useGoToNextStep(questionName: QuestionName, routeEnding: string = '') {
  // ... lots of setup
  const redirectToConfirmationPage = useShouldRedirectToConfirmation();
  const redirectToResults = useShouldRedirectToResults();

  return () => {
    if (redirectToConfirmationPage) {
      navigate(`/${whiteLabel}/${uuid}/confirm-information`);
      return;
    }
    if (redirectToResults) {
      navigate(`/${whiteLabel}/${uuid}/results/near-term-needs`);
      return;
    }
    // ... more logic
  };
}
```

**After:**
```typescript
import { useNavigation } from '../NavigationContext';

export function useGoToNextStep(questionName: QuestionName, routeEnding: string = '') {
  const { whiteLabel, uuid } = useParams();
  const stepNumber = useStepNumber(questionName);
  const stepDirectory = useStepDirectory();
  const totalStepCount = stepDirectory.length + STARTING_QUESTION_NUMBER - 1;
  const { navigateNext } = useNavigation();
  const navigate = useNavigate();

  return () => {
    // Final step goes to confirmation
    if (stepNumber === totalStepCount) {
      navigate(`/${whiteLabel}/${uuid}/confirm-information`);
      return;
    }

    // All other cases: go to next step OR return to where we came from
    const defaultNext = `/${whiteLabel}/${uuid}/step-${stepNumber + 1}/${routeEnding}`;
    navigateNext(defaultNext);
  };
}
```

You can also remove:
- `useShouldRedirectToConfirmation()`
- `useShouldRedirectToResults()`

Or keep them temporarily for backwards compatibility during migration.

### 4. `src/Components/PreviousButton/PreviousButton.tsx`

Add `clearReturn` call when user navigates backwards:

```typescript
import { useNavigation } from '../NavigationContext';

const PreviousButton = ({ navFunction }: Props) => {
  const { clearReturn } = useNavigation();
  // ... existing code

  const handleClick = () => {
    clearReturn(); // Cancel any pending return-to navigation
    navigationFunction();
  };

  return (
    <Button onClick={handleClick} /* ... */ >
```

### 5. `src/Components/Results/BackAndSaveButtons/BackAndSaveButtons.tsx`

If this component has similar "navigate back with return" logic, update it to use `navigateWithReturn`.

### 6. `src/Types/FormData.ts`

The `CustomTypedLocationState` type and `isCustomTypedLocationState` function can be deprecated/removed once migration is complete.

## Migration Strategy

1. **Phase 1**: Add `NavigationContext` and `NavigationProvider` without changing existing code
2. **Phase 2**: Update `ConfirmationBlock.tsx` to use `navigateWithReturn`
3. **Phase 3**: Update `useGoToNextStep` to use `navigateNext`
4. **Phase 4**: Update `PreviousButton` to call `clearReturn`
5. **Phase 5**: Test all edit flows from confirmation page
6. **Phase 6**: Remove deprecated `location.state` logic and types

## Testing Checklist

- [ ] From confirmation page, click edit on each section, modify value, click Continue → returns to confirmation
- [ ] From confirmation page, click edit, then click Back → goes to previous step (not confirmation)
- [ ] Normal forward flow (not from confirmation) still works as expected
- [ ] Results page "back" navigation still works
- [ ] Refreshing page mid-edit-flow continues forward normally (state resets - this is expected)

## Future Enhancements

### 1. sessionStorage Persistence

If user feedback indicates that refresh-during-edit is problematic, add persistence:

```typescript
const STORAGE_KEY = 'navigation_returnTo';

export function NavigationProvider({ children }: { children: ReactNode }) {
  const [returnTo, setReturnTo] = useState<string | null>(() => {
    return sessionStorage.getItem(STORAGE_KEY);
  });

  useEffect(() => {
    if (returnTo) {
      sessionStorage.setItem(STORAGE_KEY, returnTo);
    } else {
      sessionStorage.removeItem(STORAGE_KEY);
    }
  }, [returnTo]);

  // ... rest unchanged
}
```

### 2. Return Stack for Deep Navigation

If we need chained returns (Results → Confirmation → Step → Confirmation → Results):

```typescript
const [returnStack, setReturnStack] = useState<string[]>([]);

const navigateWithReturn = (to: string, returnPath: string) => {
  setReturnStack(prev => [...prev, returnPath]);
  navigate(to);
};

const navigateNext = (defaultNext: string) => {
  if (returnStack.length > 0) {
    const stack = [...returnStack];
    const destination = stack.pop()!;
    setReturnStack(stack);
    navigate(destination);
  } else {
    navigate(defaultNext);
  }
};
```

### 3. Analytics Integration

Track when users use edit flows:

```typescript
const navigateWithReturn = (to: string, returnPath: string) => {
  dataLayerPush({
    event: 'Edit Flow Started',
    from: returnPath,
    to: to,
  });
  setReturnTo(returnPath);
  navigate(to);
};
```

### 4. Typed Route Helpers

Create type-safe route builders to prevent URL typos:

```typescript
const routes = {
  step: (whiteLabel: string, uuid: string, stepNumber: number) =>
    `/${whiteLabel}/${uuid}/step-${stepNumber}`,
  confirmation: (whiteLabel: string, uuid: string) =>
    `/${whiteLabel}/${uuid}/confirm-information`,
  results: (whiteLabel: string, uuid: string, type: 'benefits' | 'near-term-needs') =>
    `/${whiteLabel}/${uuid}/results/${type}`,
};
```

## Architecture Decision Record

**Decision**: Use React Context with in-memory state for navigation return tracking.

**Alternatives Considered**:
1. **URL query parameters** (`?returnTo=...`) - More robust to refresh but uglier URLs
2. **State machine (XState)** - More powerful but higher implementation cost
3. **Keep location.state** - Current approach, but scattered and implicit

**Rationale**: Context-based approach provides centralized, explicit navigation logic with minimal changes to existing code. The trade-off of losing state on refresh is acceptable given the low likelihood of users refreshing mid-edit-flow.
