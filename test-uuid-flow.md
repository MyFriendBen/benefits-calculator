# UUID Data Restoration Flow Analysis

## Expected Flow when visiting /:whiteLabel/:uuid
1. User visits: `http://localhost:3000/co/abc-123-def`
2. LoadingRoutes matches catch-all `*` route → renders FetchScreen
3. FetchScreen extracts uuid="abc-123-def", whiteLabel="co"
4. FetchScreen calls fetchScreen() API
5. API returns screen data
6. updateFormData() updates context with restored data
7. handleScreenResponse() checks white label matches
8. setScreenLoading(false) completes loading
9. App switches from LoadingRoutes to AppRoutes
10. User sees their restored data

## Potential Issues

### Issue 1: Navigation in handleScreenResponse
Lines 47-51 call navigate() which could:
- Trigger route change before data settles
- Cause FetchScreen to unmount/remount
- Reset state unexpectedly

### Issue 2: useEffect dependency on whiteLabel  
Line 64: `useEffect(..., [uuid, whiteLabel])`
- If whiteLabel changes, initializeScreen() runs again
- Could cause duplicate API calls
- Could overwrite data

### Issue 3: useUrlParametersInit timing
- Runs on App mount (before FetchScreen)
- Updates formData with URL params
- Could be overwriting data from fetchScreen()

## Investigation Needed
1. Add console.logs to track:
   - When fetchScreen() is called
   - What data is returned
   - When updateFormData() runs
   - Final formData state
2. Check if navigation is interrupting data restoration
3. Verify useEffect isn't re-running unexpectedly
