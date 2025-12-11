# Quick Start - Deploy IQ Vote to Vercel

Follow these steps to get your app deployed in under 30 minutes.

## ⚡ Fast Track (For Experienced Developers)

```bash
# 1. Run setup script
chmod +x setup.sh && ./setup.sh   # Mac/Linux
# OR
powershell -ExecutionPolicy Bypass -File setup.ps1   # Windows

# 2. Copy files from Figma Make (see COPY_FILES_GUIDE.md checklist)

# 3. Update .env with your Supabase credentials
# Get from: https://app.supabase.com/project/_/settings/api

# 4. Install and test
npm install
npm run dev

# 5. Push to GitHub
git init
git add .
git commit -m "Initial commit"
git remote add origin YOUR_REPO_URL
git push -u origin main

# 6. Deploy to Vercel
# - Import GitHub repo at vercel.com
# - Add environment variables
# - Deploy!

# 7. Deploy Edge Functions
npm install -g supabase
supabase login
supabase link --project-ref YOUR_PROJECT_ID
supabase functions deploy make-server-e2c9f810 --no-verify-jwt
```

## 📋 Detailed Steps

### Step 1: Setup Directory Structure (2 minutes)

```bash
# Clone or navigate to this folder
cd vercel-deployment

# Run setup script
./setup.sh   # Mac/Linux
# OR
setup.ps1    # Windows
```

### Step 2: Copy Files (10 minutes)

Use the checklist in `COPY_FILES_GUIDE.md`:

**Critical files to copy:**
- [ ] All files from `/components/` → `src/components/`
- [ ] All files from `/components/ui/` → `src/components/ui/`
- [ ] `/App.tsx` → `src/App.tsx`
- [ ] `/types/index.ts` → `src/types/index.ts`
- [ ] `/utils/api.ts` → `src/utils/api.ts`
- [ ] `/utils/supabase/client.ts` → `src/utils/supabase/client.ts`
- [ ] Edge Functions → `supabase/functions/make-server-e2c9f810/`

**Important:** Replace `figma:asset` imports with actual images!

### Step 3: Configure Supabase (5 minutes)

1. Create Supabase project at https://supabase.com
2. Get credentials from Settings → API
3. Update `.env`:
   ```
   VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
   VITE_SUPABASE_ANON_KEY=YOUR_ANON_KEY
   ```

### Step 4: Test Locally (3 minutes)

```bash
npm install
npm run dev
```

Visit http://localhost:3000 and test:
- ✅ Page loads
- ✅ Sign up works
- ✅ Theme toggle works

### Step 5: Deploy Edge Functions (5 minutes)

```bash
# Install Supabase CLI
npm install -g supabase

# Login
supabase login

# Link project
supabase link --project-ref YOUR_PROJECT_ID

# Deploy function
supabase functions deploy make-server-e2c9f810 --no-verify-jwt

# Set secrets
supabase secrets set SUPABASE_URL=https://YOUR_PROJECT.supabase.co
supabase secrets set SUPABASE_ANON_KEY=YOUR_ANON_KEY
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY
```

### Step 6: Push to GitHub (2 minutes)

```bash
git init
git add .
git commit -m "Initial commit - IQ Vote"

# Create repo on GitHub, then:
git remote add origin https://github.com/YOUR_USERNAME/iq-vote.git
git branch -M main
git push -u origin main
```

### Step 7: Deploy to Vercel (3 minutes)

1. Go to https://vercel.com/new
2. Import your GitHub repository
3. Configure:
   - Framework: Vite
   - Build Command: `npm run build`
   - Output Directory: `dist`
4. Add Environment Variables:
   ```
   VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
   VITE_SUPABASE_ANON_KEY=YOUR_ANON_KEY
   ```
5. Click "Deploy"

### Step 8: Verify Deployment (2 minutes)

1. Visit your Vercel URL
2. Test sign up/login
3. Create an employee
4. Create an election
5. Cast a vote
6. Check leaderboard

## 🎯 You're Done!

Your IQ Vote app is now live! 🎉

## 📝 Post-Deployment Tasks

### Update OG Image URLs

In `index.html`, replace:
```html
<meta property="og:image" content="https://YOUR_DOMAIN.vercel.app/og-image.png" />
```

### Add Custom Domain (Optional)

1. Go to Vercel Project Settings → Domains
2. Add your domain
3. Update DNS settings

### Monitor Your App

- **Vercel Logs:** Project → Deployments → View logs
- **Supabase Logs:** Dashboard → Logs
- **Edge Function Logs:** `supabase functions logs make-server-e2c9f810`

## 🐛 Troubleshooting

### "Module not found" errors
→ Check file paths match new `src/` structure

### "figma:asset" errors
→ Replace all with actual image imports

### Authentication not working
→ Verify environment variables in Vercel

### Edge Function errors
→ Check Supabase secrets are set correctly

### Build fails
→ Check `npm run build` works locally first

## 📚 Full Documentation

- `README.md` - Project overview
- `COPY_FILES_GUIDE.md` - Detailed file copying checklist
- `DEPLOYMENT_GUIDE.md` - Comprehensive deployment guide

## 💡 Tips

1. **Test locally first** - Catch issues before deployment
2. **Use environment variables** - Never hardcode credentials
3. **Check logs** - Vercel and Supabase have great logging
4. **Deploy early** - Don't wait for perfection
5. **Keep secrets safe** - Never commit `.env` files

---

**Total Time:** ~30 minutes  
**Difficulty:** Intermediate  
**Cost:** Free (using Vercel & Supabase free tiers)
