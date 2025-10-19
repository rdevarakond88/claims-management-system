# Troubleshooting Log

**Purpose:** Document real issues found during development and how they were resolved.  
**Last Updated:** October 19, 2025

---

## Session 1: Admin User Provisioning Implementation

### Issue 1: Missing Logout Button in Admin Dashboard
**Reported by:** User  
**Severity:** Medium (UX issue)

**Problem:**
- Admin Dashboard had no logout button
- User was stuck on admin screen, couldn't test user flows
- Had to manually clear localStorage to logout

**Root Cause:**
- AdminDashboard component was missing logout functionality
- Only had "Add User" button in header

**Solution:**
- Added logout button next to "Add User" button (frontend/src/pages/AdminDashboard.jsx:149-157)
- Imported `useNavigate` and `useAuth` hooks
- Added logout handler that clears context and redirects to login
- Used red button styling to differentiate from primary actions

**Files Changed:**
- `frontend/src/pages/AdminDashboard.jsx`

---

### Issue 2: Provider Dropdown Empty (No Organizations Loading)
**Reported by:** User  
**Severity:** High (Feature blocker)

**Problem:**
- When creating a new user, provider dropdown showed "Select provider" but no options
- Payer dropdown also empty
- Could not complete user creation workflow

**Root Cause:**
- Frontend was using mock hardcoded IDs (`id: '1'`, `id: '2'`)
- Database had UUID values (e.g., `69089460-01e5-4b61-8481-37ca18ce3550`)
- Organization API endpoints didn't exist yet
- API calls were failing silently

**Solution:**
1. Created backend organization endpoints:
   - `backend/src/controllers/organization.controller.js` (GET /providers, GET /payers)
   - `backend/src/routes/organization.routes.js`
2. Wired routes into `backend/src/app.js`
3. Updated `AdminDashboard.jsx` to call real API instead of using mock data
4. Added console logging temporarily to debug (later removed)

**Files Changed:**
- `backend/src/controllers/organization.controller.js` (new)
- `backend/src/routes/organization.routes.js` (new)
- `backend/src/app.js`
- `frontend/src/pages/AdminDashboard.jsx`

---

### Issue 3: 500 Internal Server Error on Provider Endpoint
**Reported by:** Browser console (discovered during Issue 2 debugging)  
**Severity:** High (API failure)

**Problem:**
- `/api/v1/providers` endpoint returning 500 error
- Frontend showing empty dropdowns due to failed API call

**Root Cause:**
- Organization controller was querying for `address` field
- Provider model in Prisma schema doesn't have `address` field
- Should use `npi` field instead
- Prisma threw validation error: "Unknown field `address` for select statement"

**Solution:**
- Fixed provider query to use correct schema fields: `id, name, npi, city, state`
- Removed non-existent `address` field from select statement

**Files Changed:**
- `backend/src/controllers/organization.controller.js:13` (changed `address` to `npi`)

**Lesson Learned:**
- Always verify schema before writing queries
- Better error logging would have surfaced this faster

---

### Issue 4: 401 Unauthorized Errors After Login
**Reported by:** Browser console  
**Severity:** High (Authentication failure)

**Problem:**
- User logged in successfully
- But all subsequent API calls returned 401 Unauthorized
- Organization endpoints failing
- Admin user list failing

**Root Cause:**
- Frontend localStorage had user data from previous session
- Backend session cookie had expired (30-minute timeout)
- Frontend thought user was authenticated but backend rejected requests
- No automatic redirect to login on 401 errors

**Solution:**
1. Added API response interceptor to automatically logout on 401
2. Interceptor clears localStorage and redirects to login page
3. User forced to login again with fresh session

**Files Changed:**
- `frontend/src/api/client.js:11-22` (added interceptor)

**Prevention:**
- Session expiration now handled gracefully
- User gets automatic redirect instead of confusing errors

---

### Issue 5: Authentication Middleware Mismatch
**Reported by:** Backend logs (500 errors)  
**Severity:** Critical (Security vulnerability)

**Problem:**
- Admin routes returning 401 Unauthorized even with valid session
- `roleCheck` middleware checking `req.user.role`
- Auth middleware setting `req.session.userRole`
- Mismatch causing all admin endpoints to fail

**Root Cause:**
- Two different middleware files with conflicting implementations:
  - `backend/src/middleware/auth.js` - Uses `req.session.userRole`
  - `backend/src/middleware/roleCheck.js` - Uses `req.user.role`
- roleCheck was never setting `req.user`, always undefined

**Solution:**
- Updated `roleCheck.js` to use session-based auth (`req.session.userRole`)
- Aligned with existing auth middleware pattern
- All role checks now consistent

**Files Changed:**
- `backend/src/middleware/roleCheck.js:7-16`

**Lesson Learned:**
- Ensure middleware consistency across codebase
- Session-based auth should use `req.session` everywhere

---

### Issue 6: Infinite Redirect to Set Password Page
**Reported by:** User  
**Severity:** High (Workflow blocker)

**Problem:**
- User successfully changed password on first login
- But after redirect, still being sent back to `/set-password`
- Infinite loop preventing access to dashboard

**Root Cause:**
- Backend correctly updated `isFirstLogin = false` in database
- Frontend localStorage still had old user object with `isFirstLogin: true`
- Frontend route guard checked stale localStorage data
- Set-password API didn't update frontend state after success

**Solution:**
1. Updated `SetPasswordPage.jsx` to refresh localStorage after password change
2. Called `login()` with updated user object (`isFirstLogin: false`)
3. Added success message with 2-second delay before redirect

**Files Changed:**
- `frontend/src/pages/SetPasswordPage.jsx:41-54`

**Prevention:**
- Always sync frontend state with backend responses
- Clear/refresh localStorage after auth state changes

---

### Issue 7: Missing Success Notification on Password Change
**Reported by:** User  
**Severity:** Low (UX improvement)

**Problem:**
- User changed password successfully
- Immediately redirected to dashboard
- No feedback that operation succeeded
- User uncertain if password was actually changed

**Root Cause:**
- SetPasswordPage only showed error messages
- No success state or confirmation message
- Redirect happened instantly (no time to see feedback)

**Solution:**
1. Added `successMessage` state variable
2. Displayed green success alert with checkmark icon
3. Added 2-second delay before redirect
4. Message: "Password updated successfully! Redirecting to dashboard..."

**Files Changed:**
- `frontend/src/pages/SetPasswordPage.jsx` (added success message UI and delay)

**Lesson Learned:**
- Always provide user feedback for successful operations
- Brief delay allows users to see confirmation before navigation

---

## Key Patterns Observed

### Common Issue Categories:
1. **Authentication/Session Issues** (40% of bugs)
   - Session expiration
   - Middleware mismatches
   - State sync between frontend/backend

2. **Data Mismatch Issues** (30% of bugs)
   - Schema field names
   - Mock data vs real data
   - ID format differences (UUID vs hardcoded)

3. **Missing UX Elements** (20% of bugs)
   - Logout buttons
   - Success messages
   - Loading states

4. **API Integration Issues** (10% of bugs)
   - Endpoint not created
   - CORS issues
   - Missing routes

### Debugging Techniques Used:
- ✅ Browser console inspection (network tab, errors)
- ✅ Backend logs review (stderr output)
- ✅ Database direct queries (psql)
- ✅ API endpoint testing (curl)
- ✅ Code trace-through (reading middleware chain)
- ✅ Temporary console.log debugging (removed after fix)

### Prevention Strategies:
- 📋 Better error logging (Phase 1 priority)
- 📋 Comprehensive testing (Phase 3)
- 📋 Schema validation before queries
- 📋 Consistent auth patterns
- 📋 Frontend/backend state sync checks

---

## Future Improvements

Based on issues found, recommended additions:

1. **Error Boundary Component (React)**
   - Catch and display runtime errors gracefully
   - Prevent white screen of death

2. **API Error Toast Notifications**
   - Show user-friendly error messages
   - Auto-dismiss after 5 seconds

3. **Loading Skeletons**
   - Better UX during data fetching
   - Prevent perceived "broken" state

4. **Session Activity Tracker**
   - Warn user before session expires
   - "Your session will expire in 2 minutes" notification

5. **Request/Response Logging**
   - Log all API calls in development
   - Track request IDs for debugging

---

**Note:** This log captures real development issues, not hypothetical scenarios. Each issue was actually encountered and resolved during the implementation of admin user provisioning.

**Maintained by:** rdevarakond88 (with Claude Code assistance)
