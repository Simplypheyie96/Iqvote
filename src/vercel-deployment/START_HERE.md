# 🚀 Start Here - IQ Vote Deployment Package

Welcome! This folder contains everything you need to deploy your IQ Vote application to Vercel.

## 📦 What's Included

This deployment package includes:

✅ **Configuration Files:**
- `package.json` - All dependencies
- `vite.config.ts` - Vite build configuration
- `tsconfig.json` - TypeScript configuration
- `vercel.json` - Vercel deployment settings
- `.gitignore` - Git ignore rules
- `.env.example` - Environment variable template

✅ **Setup Scripts:**
- `setup.sh` - Setup script for Mac/Linux
- `setup.ps1` - Setup script for Windows
- `index.html` - HTML entry point with OG tags

✅ **Documentation:**
- `README.md` - Project overview and features
- `QUICK_START.md` - Fast deployment guide (30 min)
- `DEPLOYMENT_GUIDE.md` - Comprehensive deployment guide
- `COPY_FILES_GUIDE.md` - Detailed file copying checklist
- `START_HERE.md` - This file!

✅ **Pre-configured Files:**
- `src/styles/globals.css` - Complete styling system
- `src/main.tsx` - React entry point

## 🎯 What You Need to Do

### 1. Run Setup Script (1 minute)

**Mac/Linux:**
```bash
chmod +x setup.sh
./setup.sh
```

**Windows:**
```powershell
powershell -ExecutionPolicy Bypass -File setup.ps1
```

This creates the directory structure you need.

### 2. Copy Your Files (10-15 minutes)

You need to copy files from your Figma Make environment to this folder.

**📋 See: `COPY_FILES_GUIDE.md` for the complete checklist**

**Most important files:**
- All components from `/components/` 
- All UI components from `/components/ui/`
- `/App.tsx` and `/types/index.ts`
- `/utils/api.ts` and `/utils/supabase/client.ts`
- Edge Functions from `/supabase/functions/server/`
- Import files from `/imports/`

**⚠️ Important:** Replace all `figma:asset` image imports with actual images!

### 3. Setup Supabase (5 minutes)

1. Create a free account at https://supabase.com
2. Create a new project
3. Get your credentials from Settings → API
4. Update `.env` file with your credentials

**📋 See: `DEPLOYMENT_GUIDE.md` Step 4 for details**

### 4. Test Locally (5 minutes)

```bash
npm install
npm run dev
```

Open http://localhost:3000 and verify everything works.

### 5. Deploy (10 minutes)

**Quick path:**
```bash
# Push to GitHub
git init
git add .
git commit -m "Initial commit"
git push

# Deploy to Vercel (via web interface)
# 1. Go to vercel.com
# 2. Import your GitHub repo
# 3. Add environment variables
# 4. Deploy!
```

**📋 See: `QUICK_START.md` for step-by-step instructions**

## 📖 Which Guide Should I Follow?

### 🏃 If you want to deploy FAST:
→ Follow `QUICK_START.md` (30 minutes, experienced developers)

### 📚 If you want detailed instructions:
→ Follow `DEPLOYMENT_GUIDE.md` (comprehensive guide with troubleshooting)

### 📋 If you need help copying files:
→ Follow `COPY_FILES_GUIDE.md` (complete file checklist)

## ⚡ Quick Reference

### File Structure You're Creating

```
vercel-deployment/
├── src/
│   ├── components/        ← Copy from /components/
│   │   ├── ui/           ← Copy from /components/ui/
│   │   └── figma/        ← Copy from /components/figma/
│   ├── imports/          ← Copy from /imports/
│   ├── types/            ← Copy from /types/
│   ├── utils/            ← Copy from /utils/
│   ├── assets/           ← Add your images here
│   ├── App.tsx           ← Copy from /App.tsx
│   └── main.tsx          ✅ Already created
├── supabase/
│   └── functions/
│       └── make-server-e2c9f810/  ← Copy from /supabase/functions/server/
├── public/               ← Optional: OG images
├── package.json          ✅ Already created
├── vite.config.ts        ✅ Already created
├── vercel.json           ✅ Already created
└── .env                  ← Create from .env.example
```

### Environment Variables Needed

```bash
# Frontend (Vercel)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Backend (Supabase Edge Functions)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### Important Code Changes Required

1. **Replace `figma:asset` imports:**
   ```typescript
   // Before
   import logo from 'figma:asset/abc123.png';
   
   // After
   import logo from './assets/logo.png';
   ```

2. **Download actual images** and place in `src/assets/`

3. **DON'T copy** `/utils/supabase/info.tsx` - we created a new one that uses env vars

## ✅ Deployment Checklist

Before you start:
- [ ] Node.js 18+ installed
- [ ] Git installed
- [ ] GitHub account created
- [ ] Vercel account created (free tier)
- [ ] Supabase account created (free tier)

Setup phase:
- [ ] Run setup script
- [ ] Copy all files (use checklist)
- [ ] Replace `figma:asset` imports
- [ ] Download and add images
- [ ] Create `.env` file
- [ ] Add Supabase credentials

Testing phase:
- [ ] `npm install` completes
- [ ] `npm run dev` works
- [ ] Sign up/login works
- [ ] Voting works
- [ ] Leaderboard displays

Deployment phase:
- [ ] Push to GitHub
- [ ] Deploy Edge Functions to Supabase
- [ ] Deploy to Vercel
- [ ] Add environment variables
- [ ] Test production site

## 🆘 Need Help?

### Common Issues

**"Module not found" errors**
→ Check file paths match new `src/` structure

**"figma:asset" errors**
→ You forgot to replace image imports

**Build fails**
→ Make sure `npm run build` works locally first

**Auth not working**
→ Check environment variables in Vercel

### Where to Get Help

1. Check the troubleshooting sections in `DEPLOYMENT_GUIDE.md`
2. Review `COPY_FILES_GUIDE.md` to ensure all files are copied
3. Check Vercel deployment logs
4. Check Supabase Edge Function logs
5. Check browser console for errors

## 🎉 Next Steps

1. **Read this file** ✅ (you're here!)
2. **Run setup script** → `./setup.sh` or `setup.ps1`
3. **Follow** → `QUICK_START.md` or `DEPLOYMENT_GUIDE.md`
4. **Copy files** → Use `COPY_FILES_GUIDE.md` checklist
5. **Deploy!** → You've got this! 🚀

## 💡 Pro Tips

1. **Test locally first** - Catch 90% of issues before deployment
2. **Use Git from the start** - Commit after each major step
3. **Keep `.env` safe** - Never commit it to GitHub
4. **Check logs often** - Vercel and Supabase have excellent logging
5. **Deploy early** - Don't wait for perfection

## 📚 Documentation Quick Links

- **[README.md](./README.md)** - What is IQ Vote?
- **[QUICK_START.md](./QUICK_START.md)** - Deploy in 30 minutes
- **[DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)** - Comprehensive guide
- **[COPY_FILES_GUIDE.md](./COPY_FILES_GUIDE.md)** - File copying checklist

---

**Ready to deploy?** Start with `./setup.sh` then follow `QUICK_START.md`!

**Need more guidance?** Follow `DEPLOYMENT_GUIDE.md` step by step.

**Questions about files?** Check `COPY_FILES_GUIDE.md`.

---

**Version:** 1.0.0  
**Last Updated:** December 2024  
**Support:** Check documentation for troubleshooting

Good luck! 🚀
