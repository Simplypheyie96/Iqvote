# How to Reset All Data and Start Fresh

## Problem
You signed up but don't see the Admin tab because demo data exists in the database from previous testing. This means you weren't detected as the "first user" and didn't get admin rights.

## Solution: Reset All Data

### Option 1: Use Browser Console (Recommended - Fastest)

1. **Open the application in your browser**

2. **Open Developer Tools**:
   - Chrome/Edge: Press `F12` or `Ctrl+Shift+J` (Windows) / `Cmd+Option+J` (Mac)
   - Firefox: Press `F12` or `Ctrl+Shift+K` (Windows) / `Cmd+Option+K` (Mac)
   - Safari: Enable Developer Menu in Preferences, then press `Cmd+Option+C`

3. **Go to the Console tab**

4. **Copy and paste this entire code** and press Enter:

```javascript
(async function resetIQVote() {
    console.log('Starting IQ Vote data reset...');
    
    try {
        // Get project info from the page
        const response = await fetch(window.location.origin + '/utils/supabase/info.tsx');
        const infoText = await response.text();
        
        // Extract project ID and anon key
        const projectIdMatch = infoText.match(/projectId\s*=\s*['"]([^'"]+)['"]/);
        const anonKeyMatch = infoText.match(/publicAnonKey\s*=\s*['"]([^'"]+)['"]/);
        
        if (!projectIdMatch || !anonKeyMatch) {
            throw new Error('Could not find Supabase credentials');
        }
        
        const projectId = projectIdMatch[1];
        const publicAnonKey = anonKeyMatch[1];
        
        console.log('Found credentials, calling reset endpoint...');
        
        // Call reset endpoint
        const resetResponse = await fetch(
            `https://${projectId}.supabase.co/functions/v1/make-server-e2c9f810/reset`,
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${publicAnonKey}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        
        const data = await resetResponse.json();
        
        if (!resetResponse.ok) {
            throw new Error(data.error || 'Reset failed');
        }
        
        console.log('✅ Reset successful!');
        console.log('Clearing local storage and reloading...');
        
        // Clear local storage
        localStorage.clear();
        
        // Reload page
        setTimeout(() => {
            window.location.reload();
        }, 1000);
        
        return '✅ Data reset complete! Page will reload in 1 second...';
        
    } catch (error) {
        console.error('❌ Reset failed:', error);
        return `❌ Error: ${error.message}`;
    }
})();
```

5. **Wait for the message**: You should see "✅ Data reset complete! Page will reload in 1 second..."

6. **The page will reload automatically**

7. **Sign up again**: You'll now be the first user and get admin rights automatically!

---

### Option 2: Use the Reset Component (Alternative)

I've created a `ResetData` component. Here's how to use it:

1. **Temporarily modify App.tsx** to show the reset component:

Add this import at the top:
```typescript
import { ResetData } from './components/ResetData';
```

Then replace the return statement with:
```typescript
return <ResetData />;
```

2. **The reset UI will appear** with a confirmation form

3. **Type "RESET"** in the input field

4. **Click "Reset All Data"**

5. **Wait for success message** and automatic reload

6. **Revert the App.tsx changes** after reset completes

7. **Sign up fresh** as the first user (you'll get admin!)

---

### Option 3: Manual API Call

If you prefer, you can call the reset endpoint directly:

1. **Get your Supabase credentials** from `/utils/supabase/info.tsx`

2. **Use curl, Postman, or any HTTP client**:

```bash
curl -X POST \
  https://YOUR_PROJECT_ID.supabase.co/functions/v1/make-server-e2c9f810/reset \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json"
```

Replace `YOUR_PROJECT_ID` and `YOUR_ANON_KEY` with your actual values.

---

## What the Reset Does

The reset endpoint will:

✅ Delete ALL Supabase Auth users  
✅ Clear all employees from database  
✅ Clear all elections from database  
✅ Clear all votes/ballots from database  
✅ Clear all eligibility data  
✅ Clear all leaderboard cache  
✅ Delete all uploaded images from storage  

**This gives you a completely clean slate!**

---

## After Reset

1. **Go to the sign-up page**
2. **Create your account** with your real information
3. **You'll automatically be made admin** (first user privilege)
4. **You'll see the Admin tab** in the header with a shield icon 🛡️
5. **Start fresh** by adding employees, creating elections, etc.

---

## Troubleshooting

**Q: The console script says "Could not find Supabase credentials"**  
A: The info.tsx file might be protected. Use Option 2 (ResetData component) instead.

**Q: I get a 403 or 500 error**  
A: The reset endpoint might have an issue. Try refreshing and running the script again.

**Q: After reset, I still don't see the Admin tab**  
A: Make sure you:
1. Cleared localStorage (the script does this)
2. Refreshed the page completely
3. Signed up with a NEW account (not sign in with old one)
4. Are truly the first person to sign up after reset

**Q: Can I undo the reset?**  
A: No, the reset is permanent. All data is deleted and cannot be recovered.

---

## Need Help?

If you're having trouble, please let me know and I can:
- Help you run the reset
- Manually grant you admin rights without resetting
- Debug why the admin tab isn't showing

---

**Recommendation**: Use **Option 1** (Browser Console) - it's the fastest and most reliable method!
