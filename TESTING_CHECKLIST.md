# Pass.me Integration Testing Script

## Quick Test Checklist

### ✅ Step 1: Verify Backend is Running

Open terminal and check:
```bash
curl http://localhost:3001/api/health
```

**Expected Response**:
```json
{
  "success": true,
  "message": "Pass.me Backend API is healthy",
  "timestamp": "2025-11-22T..."
}
```

---

### ✅ Step 2: Rebuild Extension

```bash
cd frontend_extension
npm run build:extension
```

**Expected Output**:
```
📁 Output: dist/extension/
✅ Build completed successfully
```

---

### ✅ Step 3: Reload Extension in Chrome

1. Go to `chrome://extensions/`
2. Enable "Developer mode" (top right)
3. Find "Pass.me" extension
4. Click the reload icon 🔄

---

### ✅ Step 4: Test Adding a Password

1. Click Pass.me extension icon
2. Click "Add Password" button
3. Fill in the form:
   - **Domain**: `facebook.com`
   - **Username**: `test@example.com`
   - **Password**: `SecurePass123!`
   - **Category**: `Social Media`
4. Click "Save Password"

**Open Browser Console (F12) and look for**:
```
✅ Password added successfully!
🔄 Syncing vault to Walrus and Sui...
✅ Uploaded to Walrus, blob ID: ...
✅ Vault synced to blockchain
```

**Check localStorage**:
```javascript
// In browser console
const vault = JSON.parse(localStorage.getItem('pass_me_vault_data'));
console.log('Total entries:', vault.vault.entries.length);
console.log('First entry:', vault.vault.entries[0]);
```

---

### ✅ Step 5: Test Auto-fill

1. Visit https://www.facebook.com/login
2. Look for the login form
3. You should see a "🔐 Pass.me" button next to the password field
4. Click the "🔐 Pass.me" button

**Expected Behavior**:
- Email field fills with `test@example.com`
- Password field fills with `SecurePass123!`
- Green notification appears: "Password filled successfully"

**Console Logs**:
```
Pass.me content script initialized for: facebook.com
🔍 Requesting passwords for domain: facebook.com
📚 Total entries in vault: 1
Comparing "facebook.com" with "facebook.com": true
✅ Found 1 matching entries for domain: facebook.com
✅ Form filled with credentials
```

---

### ✅ Step 6: Test Save Password from Web Page

1. Visit https://twitter.com/login (or any login page you haven't saved)
2. Enter any username and password
3. Click "Log in" or submit the form
4. Wait 1 second

**Expected Behavior**:
- A prompt appears in the top-right corner
- Prompt says: "Save password to Pass.me for twitter.com?"
- Two buttons: "Save" and "Not now"

5. Click "Save"

**Expected**:
- Green notification: "Password saved to Pass.me"
- Password is now in your vault

**Verify**:
```javascript
// In browser console
const vault = JSON.parse(localStorage.getItem('pass_me_vault_data'));
console.log('Total entries:', vault.vault.entries.length); // Should be 2 now
console.log('Domains:', vault.vault.entries.map(e => e.domain));
```

---

### ✅ Step 7: Verify Backend Logs

Check your backend terminal (where you ran `node dist/index.js`).

**Look for**:
```
📡 Vault data stored on Walrus
🔗 Creating vault transaction
✅ Transaction prepared for signing
```

---

### ✅ Step 8: Test Domain Matching Variations

Add passwords for these domains and test auto-fill:

| Saved Domain | Test URL | Should Match? |
|--------------|----------|---------------|
| `facebook.com` | `https://www.facebook.com` | ✅ Yes |
| `facebook.com` | `https://m.facebook.com` | ✅ Yes |
| `github.com` | `https://github.com/login` | ✅ Yes |
| `google.com` | `https://accounts.google.com` | ✅ Yes |

---

## 🐛 Troubleshooting

### Issue: "No password found for this site"

**Possible Causes**:
1. Domain mismatch - check console logs
2. Vault not loaded - check localStorage
3. Background script not running - reload extension

**Debug Steps**:
```javascript
// In browser console on the website
chrome.runtime.sendMessage({
  type: 'REQUEST_AUTO_FILL',
  payload: { domain: window.location.hostname }
}, response => {
  console.log('Response:', response);
});
```

---

### Issue: "Sync failed"

**Possible Causes**:
1. Backend not running
2. Walrus testnet down
3. Network error

**Debug Steps**:
```bash
# Check backend
curl http://localhost:3001/api/health

# Check Walrus
curl https://publisher.walrus-testnet.walrus.space/v1/health
```

---

### Issue: Extension not loading

**Fix**:
```bash
# Rebuild
cd frontend_extension
npm run build:extension

# Then reload in chrome://extensions
```

---

### Issue: Background script errors

**Check**:
1. Go to `chrome://extensions/`
2. Find Pass.me extension
3. Click "Errors" button
4. Check for JavaScript errors

**Common Fixes**:
- Reload extension
- Clear localStorage: `localStorage.clear()`
- Restart browser

---

## 📊 Success Indicators

### ✅ All Systems Working

You know everything is working when:

1. **Frontend**:
   - ✅ Extension popup opens without errors
   - ✅ Can add passwords
   - ✅ Passwords persist after refresh
   - ✅ No console errors

2. **Content Script**:
   - ✅ "Pass.me content script initialized" in console
   - ✅ Login forms detected
   - ✅ "🔐 Pass.me" button appears
   - ✅ Auto-fill works

3. **Background Script**:
   - ✅ Handles REQUEST_AUTO_FILL messages
   - ✅ Returns matching passwords
   - ✅ Saves passwords from web pages
   - ✅ No errors in extension console

4. **Backend**:
   - ✅ Server running on port 3001
   - ✅ Health check returns success
   - ✅ Accepts vault creation requests
   - ✅ Logs show Walrus uploads

5. **Walrus**:
   - ✅ Uploads succeed
   - ✅ Returns blob IDs
   - ✅ Data can be retrieved

6. **Sui**:
   - ✅ Transactions created
   - ✅ Events emitted
   - ✅ Backend listener catches events

---

## 🎯 Quick Verification Commands

```bash
# Check backend health
curl http://localhost:3001/api/health

# Check if backend is listening
netstat -an | findstr "3001"

# Rebuild extension
cd frontend_extension && npm run build:extension

# Check extension files
dir dist\extension
```

---

## 📝 Test Data

Use these test credentials for testing:

| Domain | Username | Password | Category |
|--------|----------|----------|----------|
| facebook.com | test@example.com | SecurePass123! | Social Media |
| twitter.com | user@test.com | Twitter2024! | Social Media |
| github.com | developer@email.com | GitPass456# | Development |
| google.com | myemail@gmail.com | GoogleSecure789$ | Email |

---

## ✅ Final Checklist

- [ ] Backend running on localhost:3001
- [ ] Extension built successfully
- [ ] Extension loaded in Chrome
- [ ] Can add passwords in popup
- [ ] Passwords saved to localStorage
- [ ] Auto-fill button appears on login forms
- [ ] Auto-fill works correctly
- [ ] Domain matching works
- [ ] Save password prompt appears
- [ ] Passwords sync to Walrus
- [ ] Backend logs show sync activity
- [ ] No console errors

**If all checkboxes are checked, your integration is complete!** 🎉

---

*Testing Guide Version: 1.0*
*Last Updated: November 22, 2025*
