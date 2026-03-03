# How to Reset All Data and Start Fresh

## Problem
You need to start completely fresh, clearing all existing data from the database so the first person to sign up (you: ajayifey@gmail.com) will be automatically granted admin access.

## Complete Fresh Start (Recommended)

Since you mentioned "So we already have some data stored. Now we need to start afresh", here's how to do a complete database reset:

### Step 1: Clear the KV Store Database (via Supabase Dashboard)

1. **Go to your Supabase Project Dashboard**
2. **Navigate to**: Database > Tables
3. **Find the `kv_store_e2c9f810` table**
4. **Click on the table** to view its contents
5. **Delete all rows**: 
   - Click the checkbox at the top to select all rows
   - Click the "Delete" button
   - Or run this SQL query in the SQL Editor:
   ```sql
   DELETE FROM kv_store_e2c9f810;
   ```

### Step 2: Clear All Supabase Auth Users

1. **Still in Supabase Dashboard**
2. **Navigate to**: Authentication > Users
3. **Delete all existing users** one by one, or use the SQL Editor:
   ```sql
   -- This clears all auth users
   -- Run in SQL Editor
   ```
   Note: You may need to use the Supabase dashboard UI to delete auth users as they're managed separately.

### Step 3: Sign Up as the First User

1. **Refresh your IQ Vote application**
2. **Go to Sign Up**
3. **Create your account with**: ajayifey@gmail.com
4. **You will automatically be granted admin access** as the first user!

---

## Alternative: Quick Reset (If You Have Access)

If you're already logged in as an admin, you can use the built-in reset feature:

1. **Log in to IQ Vote**
2. **Go to Admin Dashboard**
3. **Navigate to**: Employees tab
4. **Scroll to the bottom**: Find the "Danger Zone" card
5. **Click "Reset Database"**
6. **Type "RESET" to confirm**
7. **Click "Reset Everything"**
8. **Wait for the reset to complete and page reload**
9. **Sign up again** with ajayifey@gmail.com

---

## Option 1: Use Browser Console (Recommended - Fastest)

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
            `https://${projectId}.supabase.co/functions/v1/make-server-e2c9f810/admin/reset-database`,
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
  https://YOUR_PROJECT_ID.supabase.co/functions/v1/make-server-e2c9f810/admin/reset-database \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json"
```

Replace `YOUR_PROJECT_ID` and `YOUR_ANON_KEY` with your actual values.

---

## What the Reset Does

The reset endpoint will:

✅ Delete ALL Supabase Auth users  
✅ Clear all user profiles (voters)  
✅ Clear all employees from database  
✅ Clear all elections from database  
✅ Clear all votes/ballots from database  
✅ Clear all tallies/vote counts  
✅ Clear all audit logs  

**This gives you a completely clean slate!**

### Security Note
- **If NO users exist**: Anyone can call the reset endpoint (for initial setup)
- **If users exist**: Only the super admin (ajayifey@gmail.com) can reset the database
- This ensures your data is protected once the system is in use

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