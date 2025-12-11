# IQ Vote - Complete Deployment Guide for Vercel

This guide will help you deploy the IQ Vote application to Vercel with full functionality.

## 📋 Prerequisites

- Node.js 18+ installed
- Git installed
- GitHub account
- Vercel account (free tier works)
- Supabase account (free tier works)

## 🚀 Quick Start (5 Steps)

### Step 1: Prepare Your Files

The application files are currently in the Figma Make environment. You need to copy them to this deployment folder structure:

```
vercel-deployment/
├── src/
│   ├── components/         # Copy all files from /components/
│   ├── imports/           # Copy all files from /imports/
│   ├── styles/            # Copy /styles/globals.css
│   ├── types/             # Copy /types/index.ts
│   ├── utils/             # Copy all from /utils/
│   ├── App.tsx            # Copy from /App.tsx
│   └── main.tsx           # Create this file (see below)
├── supabase/
│   └── functions/
│       └── server/        # Copy from /supabase/functions/server/
├── public/                # Copy any public assets
├── package.json           # Already created ✓
├── vite.config.ts         # Already created ✓
├── tsconfig.json          # Already created ✓
├── vercel.json            # Already created ✓
├── .gitignore             # Already created ✓
└── index.html             # Already created ✓
```

### Step 2: Create Missing Files

Create `src/main.tsx`:
```typescript
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './styles/globals.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
```

Create `src/utils/supabase/info.tsx`:
```typescript
// IMPORTANT: Replace these with your actual Supabase project values
// Get them from: https://app.supabase.com/project/_/settings/api

export const projectId = import.meta.env.VITE_SUPABASE_URL?.split('//')[1]?.split('.')[0] || ''
export const publicAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''
```

### Step 3: Update Image Imports

In your `src/App.tsx`, update the image imports from `figma:asset/...` to regular imports:

**Before:**
```typescript
import logoImageLight from 'figma:asset/adf5897e345947bbe763382a76a190054bc17e88.png';
```

**After:**
```typescript
import logoImageLight from './assets/logo-light.png';
```

You'll need to:
1. Download the images from the current app
2. Place them in `src/assets/` folder
3. Update all imports in App.tsx and other components

### Step 4: Set Up Supabase

#### 4.1 Create Supabase Project
1. Go to https://supabase.com
2. Click "New Project"
3. Choose organization and set project name: `iq-vote`
4. Set a strong database password (save it!)
5. Choose region closest to your users
6. Click "Create new project" (takes ~2 minutes)

#### 4.2 Deploy Edge Functions

After your Supabase project is ready:

```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref your-project-id

# Deploy the Edge Function
supabase functions deploy make-server-e2c9f810 --no-verify-jwt

# Set environment secrets for Edge Function
supabase secrets set SUPABASE_URL=https://your-project-id.supabase.co
supabase secrets set SUPABASE_ANON_KEY=your-anon-key
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

**Note:** The Edge Function code is in `supabase/functions/server/index.tsx`. You'll need to:
1. Rename the folder from `server` to `make-server-e2c9f810`
2. Ensure `kv_store.tsx` is in the same directory

#### 4.3 Set Up Database Table

The KV store table is created automatically by the Edge Function, but you can verify it exists:

```sql
-- Run this in Supabase SQL Editor to verify table exists
SELECT * FROM kv_store_e2c9f810 LIMIT 1;
```

If it doesn't exist, create it:

```sql
CREATE TABLE IF NOT EXISTS kv_store_e2c9f810 (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_kv_store_key ON kv_store_e2c9f810(key);
```

### Step 5: Deploy to Vercel

#### 5.1 Push to GitHub

```bash
cd vercel-deployment

# Initialize git
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit - IQ Vote application"

# Create a new repository on GitHub, then:
git remote add origin https://github.com/YOUR-USERNAME/iq-vote.git
git branch -M main
git push -u origin main
```

#### 5.2 Deploy on Vercel

1. Go to https://vercel.com
2. Click "New Project"
3. Import your GitHub repository
4. Configure project:
   - **Framework Preset:** Vite
   - **Root Directory:** `./` (keep as is)
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`

5. **Add Environment Variables:**
   ```
   VITE_SUPABASE_URL = https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY = your-anon-key-here
   ```

6. Click "Deploy"

### Step 6: Update OG Image URLs

After deployment, update `index.html` with your actual Vercel URL:

```html
<meta property="og:image" content="https://your-app-name.vercel.app/og-image.png" />
<meta property="og:url" content="https://your-app-name.vercel.app" />
<meta name="twitter:image" content="https://your-app-name.vercel.app/og-image.png" />
```

## 🔧 File Copying Script

To help you copy files from Figma Make to this folder structure, use this script:

### For macOS/Linux:

Create `copy-files.sh`:
```bash
#!/bin/bash

# This script helps organize files for deployment
# Run from the vercel-deployment directory

# Create directory structure
mkdir -p src/components
mkdir -p src/components/ui
mkdir -p src/components/figma
mkdir -p src/imports
mkdir -p src/styles
mkdir -p src/types
mkdir -p src/utils/supabase
mkdir -p src/assets
mkdir -p public
mkdir -p supabase/functions/make-server-e2c9f810

echo "✓ Directory structure created"
echo "Now manually copy files from Figma Make to these folders:"
echo "  - Copy all from /components/ to src/components/"
echo "  - Copy all from /imports/ to src/imports/"
echo "  - Copy /styles/globals.css to src/styles/"
echo "  - Copy /types/index.ts to src/types/"
echo "  - Copy all from /utils/ to src/utils/"
echo "  - Copy /App.tsx to src/"
echo "  - Copy Edge Function files to supabase/functions/make-server-e2c9f810/"
```

### For Windows (PowerShell):

Create `copy-files.ps1`:
```powershell
# Create directory structure
New-Item -ItemType Directory -Force -Path "src/components"
New-Item -ItemType Directory -Force -Path "src/components/ui"
New-Item -ItemType Directory -Force -Path "src/components/figma"
New-Item -ItemType Directory -Force -Path "src/imports"
New-Item -ItemType Directory -Force -Path "src/styles"
New-Item -ItemType Directory -Force -Path "src/types"
New-Item -ItemType Directory -Force -Path "src/utils/supabase"
New-Item -ItemType Directory -Force -Path "src/assets"
New-Item -ItemType Directory -Force -Path "public"
New-Item -ItemType Directory -Force -Path "supabase/functions/make-server-e2c9f810"

Write-Host "✓ Directory structure created" -ForegroundColor Green
```

## 📝 Manual File Checklist

### Required Files to Copy:

- [ ] `src/App.tsx` - Main application component
- [ ] `src/main.tsx` - React entry point (create from template above)
- [ ] `src/styles/globals.css` - Global styles
- [ ] `src/types/index.ts` - TypeScript types
- [ ] `src/utils/api.ts` - API utilities
- [ ] `src/utils/supabase/client.ts` - Supabase client
- [ ] `src/utils/supabase/info.tsx` - Supabase config (update for env vars)

### Components (all from `/components/`):
- [ ] AdminPage.tsx
- [ ] AuthPage.tsx
- [ ] DemoSetup.tsx
- [ ] EmployeeCard.tsx
- [ ] Header.tsx
- [ ] HistoricalDataImport.tsx
- [ ] LeaderboardImport.tsx
- [ ] LeaderboardPage.tsx
- [ ] LoadingSpinner.tsx
- [ ] MyHistory.tsx
- [ ] OgImagePage.tsx
- [ ] ResetData.tsx
- [ ] ResetPage.tsx
- [ ] SystemActivity.tsx
- [ ] ThemeProvider.tsx
- [ ] ThemeToggle.tsx
- [ ] VoteManagement.tsx
- [ ] VotingPage.tsx
- [ ] VotingReasonsModal.tsx
- [ ] figma/ImageWithFallback.tsx
- [ ] All ui components from `/components/ui/`

### Imports:
- [ ] All files from `/imports/`

### Edge Functions:
- [ ] `supabase/functions/make-server-e2c9f810/index.tsx`
- [ ] `supabase/functions/make-server-e2c9f810/kv_store.tsx`

## 🎨 Handling Assets

### Images with `figma:asset` imports:

In Figma Make, images use special imports like:
```typescript
import img from 'figma:asset/abc123.png'
```

For deployment, you need to:
1. **Find these imports** in your code (search for `figma:asset`)
2. **Download the actual images** from the running app
3. **Save them** to `src/assets/` with descriptive names
4. **Update imports** to:
```typescript
import img from './assets/logo-light.png'
```

### SVG Files:

SVG imports from `/imports/` should work as-is after copying.

## 🔍 Testing Locally

Before deploying, test locally:

```bash
cd vercel-deployment

# Install dependencies
npm install

# Create .env file with your Supabase credentials
cp .env.example .env
# Edit .env and add your actual values

# Run development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## ⚙️ Environment Variables

### Vercel Environment Variables:
```
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### Supabase Edge Function Secrets:
```
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_DB_URL=postgresql://postgres:[YOUR-PASSWORD]@db.your-project-id.supabase.co:5432/postgres
```

## 🎯 Post-Deployment Steps

1. **Test Authentication:**
   - Sign up with test account
   - Verify email confirmation works
   - Test login/logout

2. **Grant Admin Access:**
   - Create your account: ajayifey@gmail.com
   - The system automatically grants you super admin
   - Test creating employees
   - Test creating elections

3. **Test Voting Flow:**
   - Create some test employees
   - Create an active election
   - Vote with different accounts
   - Verify leaderboard updates

4. **Test OG Image:**
   - Share your Vercel URL on social media
   - Verify the OG image displays correctly
   - Use https://www.opengraph.xyz/ to preview

## 🐛 Troubleshooting

### Build fails with import errors:
- Check all `figma:asset` imports are replaced
- Verify file paths match new structure
- Ensure all dependencies in package.json

### Edge Function errors:
- Check function is deployed: `supabase functions list`
- View logs: `supabase functions logs make-server-e2c9f810`
- Verify secrets are set correctly

### Database connection errors:
- Verify KV table exists in Supabase
- Check Edge Function has correct SUPABASE_SERVICE_ROLE_KEY
- Test with Supabase SQL Editor

### Authentication not working:
- Verify VITE_SUPABASE_URL is correct
- Check VITE_SUPABASE_ANON_KEY is set
- Enable Email auth in Supabase dashboard

## 📚 Additional Resources

- [Vite Documentation](https://vitejs.dev/)
- [Vercel Documentation](https://vercel.com/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Edge Functions Guide](https://supabase.com/docs/guides/functions)
- [React Documentation](https://react.dev/)

## 🎉 Success Checklist

- [ ] All files copied to correct directories
- [ ] Supabase project created
- [ ] Edge Function deployed
- [ ] Database table verified
- [ ] GitHub repository created
- [ ] Vercel project deployed
- [ ] Environment variables set
- [ ] Local testing passed
- [ ] Production authentication works
- [ ] Admin panel accessible
- [ ] Voting system functional
- [ ] Leaderboard displays correctly
- [ ] OG image shows on social media

## 💡 Tips

1. **Use environment variables** - Never hardcode credentials
2. **Test locally first** - Catch issues before deployment
3. **Check browser console** - Useful for debugging
4. **Monitor Edge Function logs** - See backend errors in real-time
5. **Keep Supabase keys secret** - Never commit to git

## 🆘 Need Help?

If you encounter issues:
1. Check Vercel deployment logs
2. Check Supabase Edge Function logs
3. Check browser console for frontend errors
4. Verify all environment variables are set correctly

---

**Last Updated:** December 2024
**Version:** 1.0.0
