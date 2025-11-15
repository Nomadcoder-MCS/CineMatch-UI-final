# 🧪 Testing Guide: Race Condition Fix

## ✅ Fix Implementation Status: COMPLETE

The race condition between auth initialization and the `/api/recommendations` API call has been fixed.

---

## 🎯 What Was Fixed

### Problem
- Recommendations were NOT loading on initial page load
- "Try again" button was needed to load recommendations
- Race condition: API call happened before user was hydrated from localStorage

### Solution Implemented
1. ✅ Added `authReady` flag to AuthContext
2. ✅ Updated HomePage to wait for `authReady` before fetching
3. ✅ Updated ProtectedRoute to wait for `authReady`
4. ✅ API client already correctly attaches `X-User-Id` header

---

## 🧪 Manual Testing Instructions

### Test 1: Sign In → Navigate to Home (First Time)

**Steps:**
1. Open browser: http://localhost:5173
2. You should see the Landing page
3. Fill in the "Get started" form:
   - Name: Test User
   - Email: test@example.com
4. Click "Get started"

**Expected Behavior:**
- ✅ Page navigates to /home
- ✅ Brief loading screen (🎬 icon)
- ✅ Recommendations load immediately (without clicking "Try again")
- ✅ You should see a list of movie recommendations

**What to Look For:**
- No "Try again" button should appear
- Movies should load smoothly
- Welcome message: "Welcome back, Test"

---

### Test 2: Page Refresh (Already Signed In)

**Steps:**
1. While on the Home page (from Test 1)
2. Press F5 or Cmd+R to refresh the page

**Expected Behavior:**
- ✅ Brief loading screen (🎬 icon, "Loading...")
- ✅ Recommendations load automatically after ~500ms
- ✅ No "Try again" button appears
- ✅ You remain signed in as "Test User"

**What to Look For:**
- localStorage contains your user data
- API call includes `X-User-Id` header
- Recommendations appear without manual intervention

---

### Test 3: Direct Access to /home (Not Signed In)

**Steps:**
1. Sign out (if you have a sign out button) or open an incognito window
2. Directly visit: http://localhost:5173/home

**Expected Behavior:**
- ✅ Brief loading screen
- ✅ Redirect to landing page (/)
- ✅ No error messages

**What to Look For:**
- ProtectedRoute correctly checks authReady
- Redirect happens smoothly

---

### Test 4: "Try Again" Button (Error Recovery)

**Steps:**
1. Sign in and navigate to Home
2. Stop the backend server:
   ```bash
   # Find and kill the backend process
   lsof -t -i:8000 | xargs kill
   ```
3. Refresh the page

**Expected Behavior:**
- ⚠️ Error state appears
- ✅ "Try again" button is shown
- Click "Try again"
- ❌ Should show error again (backend is down)

4. Restart the backend:
   ```bash
   cd backend
   source .venv/bin/activate
   uvicorn app.main:app --reload --port 8000
   ```
5. Click "Try again" again

**Expected Behavior:**
- ✅ Recommendations load successfully
- ✅ Error clears

**What to Look For:**
- "Try again" still works for retry scenarios
- Error handling is graceful

---

### Test 5: Browser DevTools Verification

**Steps:**
1. Open browser DevTools (F12)
2. Go to Network tab
3. Sign in and navigate to Home
4. Look for the request to `/api/recommendations`

**Expected Behavior:**
- ✅ Request is made only ONCE
- ✅ Request includes `X-User-Id` header
- ✅ Response status: 200 OK
- ✅ Response body contains `recommendations` array

**What to Look For:**
- No 401 errors
- No 422 errors
- No duplicate requests
- Header: `X-User-Id: <user_id>`

---

### Test 6: Console Logging

**Steps:**
1. Open browser DevTools Console
2. Sign in and navigate to Home
3. Watch the console output

**Expected Output:**
```
✓ Loaded 20 personalized recommendations
```

**Should NOT See:**
- ❌ "Cannot load recommendations: user not available"
- ❌ 401 Unauthorized errors
- ❌ "X-User-Id missing" errors

---

## 🔍 Technical Verification

### Check AuthContext State

**Browser Console:**
```javascript
// After signing in
localStorage.getItem('cinematch_user')
// Should return: {"id": 1, "name": "Test User", "email": "test@example.com", ...}
```

### Check API Request Headers

**Network Tab → /api/recommendations → Headers:**
```
X-User-Id: 1
Content-Type: application/json
```

---

## ✅ Success Criteria

All of these should be true:

- [ ] ✅ Recommendations load on first navigation to Home (no "Try again" needed)
- [ ] ✅ Recommendations load after page refresh (user persisted in localStorage)
- [ ] ✅ No 401/422 errors in Network tab
- [ ] ✅ API request includes `X-User-Id` header
- [ ] ✅ Loading state shows briefly then disappears
- [ ] ✅ "Try again" button only appears on actual errors
- [ ] ✅ Protected routes redirect correctly when not signed in
- [ ] ✅ Console shows success message (not warnings)

---

## 🐛 Troubleshooting

### If recommendations still don't load:

1. **Check backend is running:**
   ```bash
   curl http://localhost:8000/health
   # Should return: {"status": "ok", ...}
   ```

2. **Check user is stored in localStorage:**
   ```javascript
   // Browser console
   localStorage.getItem('cinematch_user')
   ```

3. **Check React DevTools:**
   - Install React DevTools extension
   - Look for AuthContext value
   - Verify `authReady = true` and `user` exists

4. **Clear localStorage and try again:**
   ```javascript
   // Browser console
   localStorage.clear()
   // Then sign in again
   ```

5. **Check for console errors:**
   - Open DevTools Console
   - Look for red error messages
   - Check Network tab for failed requests

---

## 📊 Before vs After

### Before (Broken)
```
1. Navigate to /home
2. HomePage mounts → user = null
3. useEffect runs → API call → No X-User-Id → 401 Error
4. User sees error state
5. Click "Try again" → API call → Success
```

### After (Fixed)
```
1. Navigate to /home
2. HomePage mounts → authReady = false
3. Show loading screen
4. AuthContext reads localStorage → Sets user
5. AuthContext sets authReady = true
6. HomePage: authReady = true → useEffect runs
7. API call → X-User-Id included → Success
8. Recommendations appear
```

---

## 🎉 Expected Result

The app should now work seamlessly:
- Sign in → Recommendations load immediately ✅
- Refresh page → Recommendations load automatically ✅
- No manual "Try again" needed ✅
- Protected routes work correctly ✅

---

## 📝 Notes

- The fix is **backward compatible** - no breaking changes
- The "Try again" button still works for error recovery
- Loading states are properly handled
- Auth hydration is now explicit and predictable

**Servers Status:**
- ✅ Frontend: http://localhost:5173
- ✅ Backend: http://localhost:8000
- ✅ Ready for testing!

