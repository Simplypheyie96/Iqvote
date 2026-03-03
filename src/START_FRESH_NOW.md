# ✨ Start Fresh in 2 Minutes

## What You Need to Do

### 1️⃣ Reset the Database

Open your browser console (F12 → Console tab) and paste this:

```javascript
(async function() {
    const response = await fetch(window.location.origin + '/utils/supabase/info.tsx');
    const infoText = await response.text();
    const projectId = infoText.match(/projectId\s*=\s*['"]([^'"]+)['"]/)[1];
    const publicAnonKey = infoText.match(/publicAnonKey\s*=\s*['"]([^'"]+)['"]/)[1];
    
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
    console.log('✅ Reset complete:', data);
    localStorage.clear();
    setTimeout(() => window.location.reload(), 1000);
})();
```

### 2️⃣ Sign Up

After the page reloads:
- Sign up with: **ajayifey@gmail.com**
- You'll automatically be the admin!

### 3️⃣ Done! 🎉

You now have full control of a fresh IQ Vote system.

---

## That's It!

All former logins and votes are now cleared. You're ready to publish!
