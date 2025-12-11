# Quick OG Image Setup

## 🎯 Quick Start (5 minutes)

### Step 1: View the OG Image
Open your app and add `#og-preview` to the URL:
```
https://your-app.com/#og-preview
```

### Step 2: Take a Screenshot
1. Press **F12** to open DevTools
2. Click the device toolbar icon (or press **Ctrl+Shift+M** / **Cmd+Shift+M**)
3. Set dimensions to: **1200 x 630**
4. Click the DevTools menu (⋮) → **Capture screenshot**
5. Save as `og-image.png`

### Step 3: Upload the Image

**Option A: Simple (Public Folder)**
```bash
# Put the image in your public folder
mv og-image.png public/og-image.png
```

Then update `App.tsx` line 20:
```typescript
// From:
import ogImage from 'figma:asset/6f65d30a8110ac76cf93c26c68bcbe5766e3e6bc.png';

// To:
const ogImage = '/og-image.png';
```

**Option B: CDN/Cloud Storage**
1. Upload to your CDN or cloud storage (Supabase, Cloudinary, S3, etc.)
2. Get the public URL
3. Update `App.tsx` line 20:
```typescript
const ogImage = 'https://your-cdn.com/path/to/og-image.png';
```

### Step 4: Verify
Test your OG image with:
- [Facebook Debugger](https://developers.facebook.com/tools/debug/)
- [Twitter Card Validator](https://cards-dev.twitter.com/validator)
- [LinkedIn Inspector](https://www.linkedin.com/post-inspector/)

## 🎨 What You Get

When someone shares your IQ Vote link, they'll see:
- ✅ Custom branded OG image (1200x630px)
- ✅ "IQ Vote" logo and branding
- ✅ "Employee of the Month Voting" headline
- ✅ Beautiful gradient background with grid pattern
- ✅ Professional, modern aesthetic

## 📱 Where It Appears

Your OG image will show up on:
- Facebook posts and shares
- Twitter/X cards
- LinkedIn shares
- Slack unfurls
- Discord embeds
- WhatsApp previews
- iMessage link previews
- And more!

## 🔧 Troubleshooting

**"I don't see the image when I share"**
- Clear cache using the debugger tools above
- Make sure image URL is publicly accessible (no auth required)
- Ensure you're using HTTPS
- Add `?v=2` to your image URL to bust cache

**"Image looks wrong/cut off"**
- Ensure dimensions are exactly 1200x630px
- Check that the image file size is under 8MB
- Verify aspect ratio is 1.91:1

## 📚 Need More Details?

See the comprehensive guide: [OG_IMAGE_GUIDE.md](./OG_IMAGE_GUIDE.md)

## 🚀 You're Done!

Once complete, sharing your IQ Vote link will show the beautiful custom preview image!
