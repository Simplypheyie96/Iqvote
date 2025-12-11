# File Copying Guide for Deployment

This guide explains exactly which files need to be copied from your current Figma Make environment to the deployment folder.

## 📁 Directory Structure to Create

First, create this directory structure in `vercel-deployment/`:

```
vercel-deployment/
├── src/
│   ├── components/
│   │   ├── ui/
│   │   └── figma/
│   ├── imports/
│   ├── styles/
│   ├── types/
│   ├── utils/
│   │   └── supabase/
│   └── assets/
├── supabase/
│   └── functions/
│       └── make-server-e2c9f810/
└── public/
```

## 📋 File Copying Checklist

### ✅ Main Application Files

| Source File | Destination | Status |
|------------|-------------|--------|
| `/App.tsx` | `src/App.tsx` | ⏳ TODO |
| `/types/index.ts` | `src/types/index.ts` | ⏳ TODO |

### ✅ Utilities

| Source File | Destination | Status |
|------------|-------------|--------|
| `/utils/api.ts` | `src/utils/api.ts` | ⏳ TODO |
| `/utils/supabase/client.ts` | `src/utils/supabase/client.ts` | ⏳ TODO |

**Note:** Do NOT copy `/utils/supabase/info.tsx` - we created a new version that uses environment variables.

### ✅ Styles

| Source File | Destination | Status |
|------------|-------------|--------|
| `/styles/globals.css` | `src/styles/globals.css` | ✅ DONE |

### ✅ Components (Main)

Copy all files from `/components/` to `src/components/`:

| Source File | Destination | Status |
|------------|-------------|--------|
| `/components/AdminPage.tsx` | `src/components/AdminPage.tsx` | ⏳ TODO |
| `/components/AuthPage.tsx` | `src/components/AuthPage.tsx` | ⏳ TODO |
| `/components/DemoSetup.tsx` | `src/components/DemoSetup.tsx` | ⏳ TODO |
| `/components/EmployeeCard.tsx` | `src/components/EmployeeCard.tsx` | ⏳ TODO |
| `/components/Header.tsx` | `src/components/Header.tsx` | ⏳ TODO |
| `/components/HistoricalDataImport.tsx` | `src/components/HistoricalDataImport.tsx` | ⏳ TODO |
| `/components/LeaderboardImport.tsx` | `src/components/LeaderboardImport.tsx` | ⏳ TODO |
| `/components/LeaderboardPage.tsx` | `src/components/LeaderboardPage.tsx` | ⏳ TODO |
| `/components/LoadingSpinner.tsx` | `src/components/LoadingSpinner.tsx` | ⏳ TODO |
| `/components/MyHistory.tsx` | `src/components/MyHistory.tsx` | ⏳ TODO |
| `/components/OgImagePage.tsx` | `src/components/OgImagePage.tsx` | ⏳ TODO |
| `/components/ResetData.tsx` | `src/components/ResetData.tsx` | ⏳ TODO |
| `/components/ResetPage.tsx` | `src/components/ResetPage.tsx` | ⏳ TODO |
| `/components/SystemActivity.tsx` | `src/components/SystemActivity.tsx` | ⏳ TODO |
| `/components/ThemeProvider.tsx` | `src/components/ThemeProvider.tsx` | ⏳ TODO |
| `/components/ThemeToggle.tsx` | `src/components/ThemeToggle.tsx` | ⏳ TODO |
| `/components/VoteManagement.tsx` | `src/components/VoteManagement.tsx` | ⏳ TODO |
| `/components/VotingPage.tsx` | `src/components/VotingPage.tsx` | ⏳ TODO |
| `/components/VotingReasonsModal.tsx` | `src/components/VotingReasonsModal.tsx` | ⏳ TODO |

### ✅ Components (UI - shadcn)

Copy all files from `/components/ui/` to `src/components/ui/`:

| Source File | Destination | Status |
|------------|-------------|--------|
| `/components/ui/accordion.tsx` | `src/components/ui/accordion.tsx` | ⏳ TODO |
| `/components/ui/alert-dialog.tsx` | `src/components/ui/alert-dialog.tsx` | ⏳ TODO |
| `/components/ui/alert.tsx` | `src/components/ui/alert.tsx` | ⏳ TODO |
| `/components/ui/aspect-ratio.tsx` | `src/components/ui/aspect-ratio.tsx` | ⏳ TODO |
| `/components/ui/avatar.tsx` | `src/components/ui/avatar.tsx` | ⏳ TODO |
| `/components/ui/badge.tsx` | `src/components/ui/badge.tsx` | ⏳ TODO |
| `/components/ui/breadcrumb.tsx` | `src/components/ui/breadcrumb.tsx` | ⏳ TODO |
| `/components/ui/button.tsx` | `src/components/ui/button.tsx` | ⏳ TODO |
| `/components/ui/calendar.tsx` | `src/components/ui/calendar.tsx` | ⏳ TODO |
| `/components/ui/card.tsx` | `src/components/ui/card.tsx` | ⏳ TODO |
| `/components/ui/carousel.tsx` | `src/components/ui/carousel.tsx` | ⏳ TODO |
| `/components/ui/chart.tsx` | `src/components/ui/chart.tsx` | ⏳ TODO |
| `/components/ui/checkbox.tsx` | `src/components/ui/checkbox.tsx` | ⏳ TODO |
| `/components/ui/collapsible.tsx` | `src/components/ui/collapsible.tsx` | ⏳ TODO |
| `/components/ui/command.tsx` | `src/components/ui/command.tsx` | ⏳ TODO |
| `/components/ui/context-menu.tsx` | `src/components/ui/context-menu.tsx` | ⏳ TODO |
| `/components/ui/dialog.tsx` | `src/components/ui/dialog.tsx` | ⏳ TODO |
| `/components/ui/drawer.tsx` | `src/components/ui/drawer.tsx` | ⏳ TODO |
| `/components/ui/dropdown-menu.tsx` | `src/components/ui/dropdown-menu.tsx` | ⏳ TODO |
| `/components/ui/form.tsx` | `src/components/ui/form.tsx` | ⏳ TODO |
| `/components/ui/hover-card.tsx` | `src/components/ui/hover-card.tsx` | ⏳ TODO |
| `/components/ui/input-otp.tsx` | `src/components/ui/input-otp.tsx` | ⏳ TODO |
| `/components/ui/input.tsx` | `src/components/ui/input.tsx` | ⏳ TODO |
| `/components/ui/label.tsx` | `src/components/ui/label.tsx` | ⏳ TODO |
| `/components/ui/menubar.tsx` | `src/components/ui/menubar.tsx` | ⏳ TODO |
| `/components/ui/navigation-menu.tsx` | `src/components/ui/navigation-menu.tsx` | ⏳ TODO |
| `/components/ui/pagination.tsx` | `src/components/ui/pagination.tsx` | ⏳ TODO |
| `/components/ui/popover.tsx` | `src/components/ui/popover.tsx` | ⏳ TODO |
| `/components/ui/progress.tsx` | `src/components/ui/progress.tsx` | ⏳ TODO |
| `/components/ui/radio-group.tsx` | `src/components/ui/radio-group.tsx` | ⏳ TODO |
| `/components/ui/resizable.tsx` | `src/components/ui/resizable.tsx` | ⏳ TODO |
| `/components/ui/scroll-area.tsx` | `src/components/ui/scroll-area.tsx` | ⏳ TODO |
| `/components/ui/select.tsx` | `src/components/ui/select.tsx` | ⏳ TODO |
| `/components/ui/separator.tsx` | `src/components/ui/separator.tsx` | ⏳ TODO |
| `/components/ui/sheet.tsx` | `src/components/ui/sheet.tsx` | ⏳ TODO |
| `/components/ui/sidebar.tsx` | `src/components/ui/sidebar.tsx` | ⏳ TODO |
| `/components/ui/skeleton.tsx` | `src/components/ui/skeleton.tsx` | ⏳ TODO |
| `/components/ui/slider.tsx` | `src/components/ui/slider.tsx` | ⏳ TODO |
| `/components/ui/sonner.tsx` | `src/components/ui/sonner.tsx` | ⏳ TODO |
| `/components/ui/switch.tsx` | `src/components/ui/switch.tsx` | ⏳ TODO |
| `/components/ui/table.tsx` | `src/components/ui/table.tsx` | ⏳ TODO |
| `/components/ui/tabs.tsx` | `src/components/ui/tabs.tsx` | ⏳ TODO |
| `/components/ui/textarea.tsx` | `src/components/ui/textarea.tsx` | ⏳ TODO |
| `/components/ui/toggle-group.tsx` | `src/components/ui/toggle-group.tsx` | ⏳ TODO |
| `/components/ui/toggle.tsx` | `src/components/ui/toggle.tsx` | ⏳ TODO |
| `/components/ui/tooltip.tsx` | `src/components/ui/tooltip.tsx` | ⏳ TODO |
| `/components/ui/use-mobile.ts` | `src/components/ui/use-mobile.ts` | ⏳ TODO |
| `/components/ui/utils.ts` | `src/components/ui/utils.ts` | ⏳ TODO |

### ✅ Components (Figma)

| Source File | Destination | Status |
|------------|-------------|--------|
| `/components/figma/ImageWithFallback.tsx` | `src/components/figma/ImageWithFallback.tsx` | ⏳ TODO |

### ✅ Imports

Copy all files from `/imports/` to `src/imports/`:

| Source File | Destination | Status |
|------------|-------------|--------|
| `/imports/OgImage.tsx` | `src/imports/OgImage.tsx` | ⏳ TODO |
| `/imports/svg-rouk5ilrbn.ts` | `src/imports/svg-rouk5ilrbn.ts` | ⏳ TODO |
| Any other files in /imports/ | `src/imports/` | ⏳ TODO |

### ✅ Supabase Edge Functions

| Source File | Destination | Status |
|------------|-------------|--------|
| `/supabase/functions/server/index.tsx` | `supabase/functions/make-server-e2c9f810/index.tsx` | ⏳ TODO |
| `/supabase/functions/server/kv_store.tsx` | `supabase/functions/make-server-e2c9f810/kv_store.tsx` | ⏳ TODO |

**Important:** The folder name changes from `server` to `make-server-e2c9f810` for deployment!

### ✅ Public Assets (if any)

If you have any public assets like the OG image, copy them to `public/`:

| Source File | Destination | Status |
|------------|-------------|--------|
| Any images for OG preview | `public/og-image.png` | ⏳ TODO |

## 🖼️ Handling Image Assets

Your current app uses special `figma:asset` imports. You need to convert these:

### Step 1: Find all figma:asset imports

Search your code for `figma:asset` and make a list. For example:
```typescript
import logoImageLight from 'figma:asset/adf5897e345947bbe763382a76a190054bc17e88.png';
import logoImageDark from 'figma:asset/edd81dc1188a78ee35f46489ff2f13306860893c.png';
import ogImage from 'figma:asset/6f65d30a8110ac76cf93c26c68bcbe5766e3e6bc.png';
```

### Step 2: Download the images

From your running Figma Make app:
1. Open browser DevTools (F12)
2. Go to Network tab
3. Reload the page
4. Find the image files in the network requests
5. Right-click each image → "Save as..."
6. Save with descriptive names like:
   - `logo-light.png`
   - `logo-dark.png`
   - `og-image.png`

### Step 3: Place in src/assets/

Create `src/assets/` folder and put all images there.

### Step 4: Update imports in code

Replace `figma:asset` imports with relative paths:

**Before:**
```typescript
import logoImageLight from 'figma:asset/adf5897e345947bbe763382a76a190054bc17e88.png';
```

**After:**
```typescript
import logoImageLight from './assets/logo-light.png';
```

Do this for ALL `figma:asset` imports in:
- `src/App.tsx`
- Any other components that import images

## 🔧 Required Code Changes

After copying files, you need to make these changes:

### 1. Update `src/utils/supabase/info.tsx`

**Create NEW file** (don't copy the old one):

```typescript
// src/utils/supabase/info.tsx
export const projectId = import.meta.env.VITE_SUPABASE_URL?.split('//')[1]?.split('.')[0] || ''
export const publicAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''
```

### 2. Update import paths in copied files

Since files are moving from `/` to `/src/`, you may need to update some import paths:

**Before (in Figma Make):**
```typescript
import { api } from './utils/api';
```

**After (in deployment):**
```typescript
import { api } from './utils/api'; // Same, relative paths should work
```

Most imports should work as-is, but check if any break during build.

### 3. Update ProfilePage import

If App.tsx imports ProfilePage but you don't have that component, either:
- Remove the import and any references to it
- Or create a simple placeholder component

## 🚀 Automated Copy Script

### For Unix/Linux/macOS:

Create `copy-files.sh`:

```bash
#!/bin/bash

echo "Creating directory structure..."
mkdir -p src/components/ui
mkdir -p src/components/figma
mkdir -p src/imports
mkdir -p src/types
mkdir -p src/utils/supabase
mkdir -p src/assets
mkdir -p public
mkdir -p supabase/functions/make-server-e2c9f810

echo "✅ Directory structure created!"
echo ""
echo "Now you need to manually copy files from your Figma Make environment."
echo "Follow the checklist in COPY_FILES_GUIDE.md"
echo ""
echo "After copying, run:"
echo "  npm install"
echo "  npm run dev"
```

Run with: `chmod +x copy-files.sh && ./copy-files.sh`

### For Windows (PowerShell):

Create `copy-files.ps1`:

```powershell
Write-Host "Creating directory structure..." -ForegroundColor Cyan

New-Item -ItemType Directory -Force -Path "src/components/ui" | Out-Null
New-Item -ItemType Directory -Force -Path "src/components/figma" | Out-Null
New-Item -ItemType Directory -Force -Path "src/imports" | Out-Null
New-Item -ItemType Directory -Force -Path "src/types" | Out-Null
New-Item -ItemType Directory -Force -Path "src/utils/supabase" | Out-Null
New-Item -ItemType Directory -Force -Path "src/assets" | Out-Null
New-Item -ItemType Directory -Force -Path "public" | Out-Null
New-Item -ItemType Directory -Force -Path "supabase/functions/make-server-e2c9f810" | Out-Null

Write-Host "✅ Directory structure created!" -ForegroundColor Green
Write-Host ""
Write-Host "Now you need to manually copy files from your Figma Make environment." -ForegroundColor Yellow
Write-Host "Follow the checklist in COPY_FILES_GUIDE.md" -ForegroundColor Yellow
Write-Host ""
Write-Host "After copying, run:" -ForegroundColor Cyan
Write-Host "  npm install" -ForegroundColor White
Write-Host "  npm run dev" -ForegroundColor White
```

Run with: `powershell -ExecutionPolicy Bypass -File copy-files.ps1`

## ✅ Verification Checklist

After copying all files, verify:

- [ ] All component files are in `src/components/`
- [ ] All UI components are in `src/components/ui/`
- [ ] Imports are in `src/imports/`
- [ ] Types are in `src/types/`
- [ ] Utils are in `src/utils/`
- [ ] Edge functions are in `supabase/functions/make-server-e2c9f810/`
- [ ] All `figma:asset` imports are replaced
- [ ] All images are in `src/assets/`
- [ ] `src/main.tsx` exists
- [ ] `src/utils/supabase/info.tsx` uses environment variables
- [ ] `.env` file created with Supabase credentials

## 🧪 Test Before Deploying

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Should open on http://localhost:3000
# Test:
# - Sign up/login works
# - Voting works
# - Leaderboard displays
# - Admin panel accessible
# - Theme toggle works
```

If everything works locally, you're ready to deploy!

## 📚 Next Steps

After all files are copied and verified:

1. ✅ Test locally (`npm run dev`)
2. ✅ Create `.env` with Supabase credentials
3. ✅ Push to GitHub
4. ✅ Deploy Supabase Edge Functions
5. ✅ Deploy to Vercel
6. ✅ Add environment variables in Vercel
7. ✅ Test production deployment

See [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for detailed deployment instructions.

---

**Good luck with your deployment! 🚀**
