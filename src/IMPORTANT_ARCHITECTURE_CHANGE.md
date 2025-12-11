# 🔄 CRITICAL ARCHITECTURE CHANGE - READ THIS!

## The Problem
You correctly pointed out that **voters** (including executives) are NOT the same as **employees** (candidates who can be voted for).

## The Solution
I've updated the system to properly separate these two groups:

### **VOTERS** (stored as `user:` prefix)
- People who can VOTE in elections
- Includes executives, managers, team members
- Created when someone signs up
- May or may not be eligible to receive votes
- Stored in database as `user:{id}`
- First user to sign up automatically gets `is_admin: true`

### **EMPLOYEES** (stored as `employee:` prefix)
- People who can be VOTED FOR (candidates)
- Added by admins through the Admin Panel
- NOT automatically created when someone signs up
- Stored in database as `employee:{id}`
- These are the people who appear on the ballot

## Key Changes Made

### 1. Sign-Up Flow (`/auth/signup`)
- Now creates a `user:` profile (voter)
- Does NOT create an `employee:` profile
- First user is detected by checking `user:` prefix count
- User can vote immediately but is NOT a candidate

### 2. Admin Checks
- All admin endpoints now check `user:${userId}` for `is_admin` flag
- This allows executives/managers to be admins without being candidates

### 3. Employee Management
- Admins manually add employees (candidates) via Admin Panel
- Employees are people who can be voted FOR
- Completely separate from the voter/user system

### 4. Reset Endpoint
- Now clears BOTH `user:` AND `employee:` prefixes
- Ensures clean slate for production

## Why This Matters

**Before:**
- ❌ Everyone who signed up was both a voter AND a candidate
- ❌ Executives would appear on ballots
- ❌ Confusing architecture

**After:**
- ✅ Voters and candidates are separate
- ✅ Executives can vote but not be voted for
- ✅ Clear separation of concerns

## What You Need To Do

### Step 1: Reset the Database
The old demo data has the wrong structure. You MUST reset to use the new architecture.

Run this script in your browser console (press F12, go to Console tab):

```javascript
(async () => {
    try {
        console.log('%c🚀 IQ Vote Data Reset Tool', 'font-size: 20px; font-weight: bold; color: #FF1A88');
        
        const info = await import('/utils/supabase/info.tsx');
        const projectId = info.projectId;
        const publicAnonKey = info.publicAnonKey;
        
        console.log('Calling reset endpoint...');
        
        const response = await fetch(
            `https://${projectId}.supabase.co/functions/v1/make-server-e2c9f810/reset`,
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${publicAnonKey}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        
        const data = await response.json();
        
        if (response.ok) {
            console.log('%c✅ RESET SUCCESSFUL!', 'font-size: 18px; font-weight: bold; color: #22c55e');
            console.log('Details:', data);
            localStorage.clear();
            setTimeout(() => {
                window.location.reload();
            }, 2000);
        } else {
            console.error('%c❌ Reset failed', 'font-size: 16px; font-weight: bold; color: #ef4444');
            console.error('Error:', data);
        }
    } catch (error) {
        console.error('%c❌ Error occurred', 'font-size: 16px; font-weight: bold; color: #ef4444');
        console.error(error);
    }
})();
```

### Step 2: Sign Up Fresh
After reset:
1. You'll be redirected to the sign-up page
2. Sign up with your real information
3. You'll be the first user = automatic admin
4. You'LL see the Admin tab (🛡️ shield icon)

### Step 3: Add Employees (Candidates)
In the Admin Panel:
1. Click "Employees" tab
2. Click "Add Employee"
3. Add each person who CAN BE VOTED FOR
4. These are your candidates (NOT voters)

### Step 4: Create Elections
Everyone who signed up can vote, but ONLY the employees you added can receive votes!

## New Workflow Example

### Scenario: Company with 50 employees and 10 executives

**Old Way (Wrong):**
- All 60 people sign up
- All 60 appear on the ballot ❌
- Executives get voted for ❌

**New Way (Correct):**
- All 60 people sign up (they're voters)
- Admin adds only the 50 employees as candidates
- Executives can vote but NOT be voted for ✅
- Only the 50 employees appear on ballots ✅

## Migration Path

If you already have users in your system:
1. Run the reset script above (wipes everything clean)
2. Have everyone sign up again
3. As admin, add only the votable employees
4. Create your first election

The reset is necessary because the old architecture mixed voters and candidates together.

## Summary

**Voters = `user:` prefix = People who can VOTE**  
**Employees = `employee:` prefix = People who can BE VOTED FOR**

These are now completely separate, giving you full control over who appears on ballots!

---

**Questions?** Let me know if you need clarification on this architecture change!
