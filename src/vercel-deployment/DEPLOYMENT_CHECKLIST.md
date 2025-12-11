# 🎯 IQ Vote Deployment Checklist

Use this checklist to track your deployment progress. Check off each item as you complete it.

## 📋 Phase 1: Initial Setup (5 minutes)

- [ ] Navigated to `/vercel-deployment` folder
- [ ] Read `START_HERE.md`
- [ ] Chose deployment guide (QUICK_START or DEPLOYMENT_GUIDE)
- [ ] Have Node.js 18+ installed
- [ ] Have Git installed
- [ ] Have code editor ready (VS Code, etc.)

## 🛠️ Phase 2: Run Setup Script (2 minutes)

- [ ] Opened terminal in `/vercel-deployment`
- [ ] Ran setup script:
  - [ ] Mac/Linux: `chmod +x setup.sh && ./setup.sh`
  - [ ] Windows: `powershell -ExecutionPolicy Bypass -File setup.ps1`
- [ ] Verified directory structure created
- [ ] Verified `src/utils/supabase/info.tsx` created
- [ ] Verified `.env` file created

## 📁 Phase 3: Copy Files (15 minutes)

### Main Files
- [ ] Copied `/App.tsx` → `src/App.tsx`
- [ ] Copied `/types/index.ts` → `src/types/index.ts`

### Utils
- [ ] Copied `/utils/api.ts` → `src/utils/api.ts`
- [ ] Copied `/utils/supabase/client.ts` → `src/utils/supabase/client.ts`
- [ ] **Did NOT copy** `/utils/supabase/info.tsx` (using new env-based version)

### Components (Main)
- [ ] Copied `/components/AdminPage.tsx`
- [ ] Copied `/components/AuthPage.tsx`
- [ ] Copied `/components/DemoSetup.tsx`
- [ ] Copied `/components/EmployeeCard.tsx`
- [ ] Copied `/components/Header.tsx`
- [ ] Copied `/components/HistoricalDataImport.tsx`
- [ ] Copied `/components/LeaderboardImport.tsx`
- [ ] Copied `/components/LeaderboardPage.tsx`
- [ ] Copied `/components/LoadingSpinner.tsx`
- [ ] Copied `/components/MyHistory.tsx`
- [ ] Copied `/components/OgImagePage.tsx`
- [ ] Copied `/components/ResetData.tsx`
- [ ] Copied `/components/ResetPage.tsx`
- [ ] Copied `/components/SystemActivity.tsx`
- [ ] Copied `/components/ThemeProvider.tsx`
- [ ] Copied `/components/ThemeToggle.tsx`
- [ ] Copied `/components/VoteManagement.tsx`
- [ ] Copied `/components/VotingPage.tsx`
- [ ] Copied `/components/VotingReasonsModal.tsx`
- [ ] Copied `ProfilePage.tsx` if it exists, or removed import from App.tsx

### Components (UI - all from /components/ui/)
- [ ] Copied all 40+ UI component files to `src/components/ui/`
- [ ] Verified `button.tsx`, `card.tsx`, `input.tsx` present
- [ ] Verified `dialog.tsx`, `tabs.tsx`, `table.tsx` present
- [ ] Copied `use-mobile.ts` and `utils.ts`

### Components (Figma)
- [ ] Copied `/components/figma/ImageWithFallback.tsx`

### Imports
- [ ] Copied `/imports/OgImage.tsx`
- [ ] Copied `/imports/svg-rouk5ilrbn.ts`
- [ ] Copied any other files from `/imports/`

### Edge Functions
- [ ] Copied `/supabase/functions/server/index.tsx` → `supabase/functions/make-server-e2c9f810/index.tsx`
- [ ] Copied `/supabase/functions/server/kv_store.tsx` → `supabase/functions/make-server-e2c9f810/kv_store.tsx`
- [ ] **Note:** Folder renamed from `server` to `make-server-e2c9f810`

## 🖼️ Phase 4: Handle Images (10 minutes)

### Find Images
- [ ] Searched code for all `figma:asset` imports
- [ ] Listed all images needed (logo-light, logo-dark, og-image, etc.)

### Download Images
- [ ] Opened running Figma Make app
- [ ] Opened browser DevTools (F12)
- [ ] Downloaded logo-light image
- [ ] Downloaded logo-dark image
- [ ] Downloaded og-image
- [ ] Downloaded any other images

### Add Images
- [ ] Created `src/assets/` folder
- [ ] Saved logo-light.png to `src/assets/`
- [ ] Saved logo-dark.png to `src/assets/`
- [ ] Saved og-image.png to `src/assets/`
- [ ] Saved any other images with descriptive names

### Update Code
- [ ] Updated imports in `src/App.tsx` from `figma:asset` to relative paths
- [ ] Updated imports in other components if needed
- [ ] Verified no `figma:asset` imports remain (search in code)

Example:
```typescript
// Changed from:
import logoLight from 'figma:asset/adf5897e34.png';
// To:
import logoLight from './assets/logo-light.png';
```

## ☁️ Phase 5: Setup Supabase (10 minutes)

### Create Project
- [ ] Signed up at https://supabase.com (or logged in)
- [ ] Clicked "New Project"
- [ ] Named project: `iq-vote`
- [ ] Set strong database password (saved securely!)
- [ ] Selected region (closest to users)
- [ ] Waited for project to finish creating (~2 minutes)

### Get Credentials
- [ ] Opened project dashboard
- [ ] Navigated to Settings → API
- [ ] Copied Project URL
- [ ] Copied `anon` `public` key
- [ ] Copied `service_role` `secret` key (keep this secure!)

### Configure Environment
- [ ] Opened `.env` file in editor
- [ ] Added `VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co`
- [ ] Added `VITE_SUPABASE_ANON_KEY=your-anon-key`
- [ ] Saved `.env` file
- [ ] Verified `.env` is in `.gitignore` (should already be)

## 🧪 Phase 6: Test Locally (10 minutes)

### Install Dependencies
- [ ] Ran `npm install` (or `yarn install`)
- [ ] Waited for installation to complete
- [ ] Verified no errors in installation

### Run Development Server
- [ ] Ran `npm run dev`
- [ ] Server started successfully
- [ ] Opened http://localhost:3000 in browser
- [ ] Page loads without errors

### Test Functionality
- [ ] Sign up form displays
- [ ] Can create new account
- [ ] Can log in
- [ ] Theme toggle works (light/dark mode)
- [ ] Navigation works
- [ ] No console errors in browser DevTools

### Test Build
- [ ] Ran `npm run build`
- [ ] Build completes successfully
- [ ] No TypeScript errors
- [ ] No build errors
- [ ] `dist/` folder created

## 🔧 Phase 7: Deploy Edge Functions (10 minutes)

### Setup Supabase CLI
- [ ] Ran `npm install -g supabase`
- [ ] Ran `supabase --version` to verify installation
- [ ] Ran `supabase login`
- [ ] Logged in successfully via browser

### Link Project
- [ ] Ran `supabase link --project-ref YOUR_PROJECT_ID`
- [ ] Entered database password
- [ ] Successfully linked to project

### Deploy Function
- [ ] Navigated to project root
- [ ] Ran `supabase functions deploy make-server-e2c9f810 --no-verify-jwt`
- [ ] Function deployed successfully
- [ ] Verified function appears in Supabase dashboard

### Set Secrets
- [ ] Ran `supabase secrets set SUPABASE_URL=https://your-project.supabase.co`
- [ ] Ran `supabase secrets set SUPABASE_ANON_KEY=your-anon-key`
- [ ] Ran `supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your-service-role-key`
- [ ] Verified secrets are set: `supabase secrets list`

### Test Edge Function
- [ ] Edge Function responds to requests
- [ ] Check logs: `supabase functions logs make-server-e2c9f810`
- [ ] No errors in logs

## 📦 Phase 8: Push to GitHub (5 minutes)

### Initialize Git
- [ ] Ran `git init`
- [ ] Ran `git add .`
- [ ] Ran `git commit -m "Initial commit - IQ Vote"`
- [ ] Verified commit successful

### Create GitHub Repo
- [ ] Logged into GitHub
- [ ] Created new repository: `iq-vote`
- [ ] **Did NOT** initialize with README (already have one)
- [ ] Copied repository URL

### Push to GitHub
- [ ] Ran `git remote add origin YOUR_REPO_URL`
- [ ] Ran `git branch -M main`
- [ ] Ran `git push -u origin main`
- [ ] Code pushed successfully
- [ ] Verified files appear on GitHub
- [ ] Verified `.env` is NOT on GitHub (should be ignored)

## 🚀 Phase 9: Deploy to Vercel (10 minutes)

### Create Vercel Project
- [ ] Logged into https://vercel.com
- [ ] Clicked "New Project"
- [ ] Imported GitHub repository
- [ ] Selected `iq-vote` repository

### Configure Project
- [ ] Framework Preset: Vite (auto-detected)
- [ ] Root Directory: `./` (default)
- [ ] Build Command: `npm run build` (default)
- [ ] Output Directory: `dist` (default)

### Add Environment Variables
- [ ] Clicked "Environment Variables"
- [ ] Added `VITE_SUPABASE_URL` = your Supabase URL
- [ ] Added `VITE_SUPABASE_ANON_KEY` = your anon key
- [ ] Verified both variables added

### Deploy
- [ ] Clicked "Deploy"
- [ ] Waited for deployment (~2-3 minutes)
- [ ] Deployment succeeded
- [ ] Received deployment URL
- [ ] Visited deployment URL

## ✅ Phase 10: Test Production (10 minutes)

### Basic Tests
- [ ] Production site loads
- [ ] No console errors
- [ ] Theme toggle works
- [ ] Styling looks correct

### Authentication Tests
- [ ] Sign up form works
- [ ] Can create new account
- [ ] Can log in
- [ ] Can log out
- [ ] Session persists on refresh

### Functional Tests
- [ ] Admin panel accessible (with ajayifey@gmail.com)
- [ ] Can create employees
- [ ] Can create elections
- [ ] Can cast votes
- [ ] Leaderboard displays correctly
- [ ] Vote history shows

### Super Admin Tests (if you're ajayifey@gmail.com)
- [ ] Automatically granted super admin
- [ ] Can access Activity tab
- [ ] Can manage other admins
- [ ] Protected from being removed

## 🎨 Phase 11: Update OG Image (5 minutes)

### Update URLs
- [ ] Opened `index.html`
- [ ] Replaced `your-domain.vercel.app` with actual Vercel domain
- [ ] Updated `og:image` URL
- [ ] Updated `og:url` URL
- [ ] Updated `twitter:image` URL
- [ ] Saved file

### Deploy Update
- [ ] Committed changes: `git add index.html`
- [ ] Committed: `git commit -m "Update OG image URLs"`
- [ ] Pushed: `git push`
- [ ] Waited for Vercel to auto-deploy
- [ ] Verified changes on production

### Test Social Sharing
- [ ] Visited https://www.opengraph.xyz/
- [ ] Entered production URL
- [ ] Verified OG image displays
- [ ] Verified title and description correct
- [ ] Tested Twitter card preview

## 📊 Phase 12: Final Verification (5 minutes)

### Code Quality
- [ ] No TypeScript errors
- [ ] No console errors in production
- [ ] No broken images
- [ ] No broken links

### Functionality
- [ ] All pages work
- [ ] All features functional
- [ ] Responsive on mobile
- [ ] Fast loading times

### Security
- [ ] No credentials in GitHub
- [ ] `.env` file ignored
- [ ] Environment variables secure
- [ ] API keys protected

### Documentation
- [ ] README.md updated with production URL
- [ ] Environment variables documented
- [ ] Deployment process documented

## 🎉 Phase 13: Celebrate! (∞ minutes)

- [ ] Deployment complete! 🎊
- [ ] Shared with team
- [ ] Tested with real users
- [ ] Collected feedback
- [ ] Planned next features

---

## 📊 Progress Summary

**Total Phases:** 13  
**Estimated Time:** 90-120 minutes  
**Completed:** ___ / 13 phases

### Time Breakdown:
- Setup & Preparation: ~20 minutes
- File Copying & Images: ~25 minutes
- Supabase Setup: ~20 minutes
- Testing: ~15 minutes
- Deployment: ~25 minutes
- Verification: ~15 minutes

---

## 🆘 If Something Goes Wrong

### Build Fails
→ Check `DEPLOYMENT_GUIDE.md` troubleshooting section

### Import Errors
→ Verify all files copied, check `COPY_FILES_GUIDE.md`

### Image Errors
→ Ensure all `figma:asset` imports replaced

### Auth Errors
→ Check environment variables in Vercel

### Edge Function Errors
→ Check Supabase function logs: `supabase functions logs make-server-e2c9f810`

---

## 📚 Reference Documents

- `START_HERE.md` - Overview and entry point
- `QUICK_START.md` - Fast deployment guide
- `DEPLOYMENT_GUIDE.md` - Comprehensive guide
- `COPY_FILES_GUIDE.md` - File copying details
- `FILE_INDEX.md` - Package contents

---

**Current Status:**  
**Date Started:** ___________  
**Date Completed:** ___________  
**Deployed URL:** ___________  

**Notes:**
___________________________________________
___________________________________________
___________________________________________
