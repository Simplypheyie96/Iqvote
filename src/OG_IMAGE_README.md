# OG Image Implementation - Complete Guide

## ✅ What's Been Implemented

Your IQ Vote app now has everything needed to create and use a custom Open Graph (OG) preview image:

### 1. **OG Image Component** (`/imports/OgImage.tsx`)
   - Imported from your Figma design
   - Displays the IQ Vote branding with gradient backgrounds
   - Optimized for 1200x630px (standard OG image size)
   - Includes grid pattern, logo, and "Employee of the Month Voting" text

### 2. **Preview Route** (`/#og-preview`)
   - Access via: `https://your-app.com/#og-preview`
   - Shows just the OG image at exact dimensions
   - Ready for screenshot capture
   - Automatically sets viewport to 1200x630px

### 3. **Wrapper Component** (`/components/OgImagePage.tsx`)
   - Handles the preview route
   - Forces exact dimensions (1200x630px)
   - Logs "ready" state for screenshot automation
   - Cleans up styles when navigating away

### 4. **Static HTML Fallback** (`/public/og-image.html`)
   - Standalone HTML version
   - No dependencies required
   - Can be opened directly in browser
   - Alternative method for screenshot generation

### 5. **Meta Tags** (Already configured in `App.tsx`)
   - All OG tags properly set
   - Twitter Card support
   - LinkedIn preview support
   - Ready to use with your image URL

## 🚀 Quick Implementation (3 Steps)

### Step 1: Generate the Image

**Method A: Using Your Browser**
```bash
1. Open: https://your-app.com/#og-preview
2. Press F12 (DevTools)
3. Click device toolbar icon (Ctrl+Shift+M / Cmd+Shift+M)
4. Set: Width: 1200px, Height: 630px
5. DevTools menu (⋮) → Capture screenshot
6. Save as: og-image.png
```

**Method B: Using Puppeteer (Automated)**
```javascript
const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setViewport({ width: 1200, height: 630 });
  await page.goto('https://your-app.com/#og-preview');
  await page.waitForTimeout(1000); // Wait for rendering
  await page.screenshot({ 
    path: 'og-image.png',
    type: 'png'
  });
  await browser.close();
})();
```

**Method C: Use Screenshot API**
```bash
# ScreenshotAPI.net example
https://shot.screenshotapi.net/screenshot?url=YOUR_URL%23og-preview&width=1200&height=630&output=image&file_type=png
```

### Step 2: Upload the Image

Choose one option:

**Option A: Use Supabase Storage** (Recommended)
```bash
1. Open Supabase Dashboard → Storage
2. Create a public bucket: "public-assets"
3. Upload og-image.png
4. Copy the public URL
```

**Option B: Use Your Hosting**
```bash
# Place in public folder
cp og-image.png public/og-image.png
```

**Option C: Use CDN (Cloudinary, Imgix, etc.)**
```bash
# Upload to your CDN service and get URL
```

### Step 3: Update App.tsx

**For Supabase/CDN:**
```typescript
// In App.tsx, line 20, replace:
import ogImage from 'figma:asset/6f65d30a8110ac76cf93c26c68bcbe5766e3e6bc.png';

// With:
const ogImage = 'https://your-project.supabase.co/storage/v1/object/public/public-assets/og-image.png';
// Or your CDN URL
```

**For Public Folder:**
```typescript
// In App.tsx, line 20, replace:
import ogImage from 'figma:asset/6f65d30a8110ac76cf93c26c68bcbe5766e3e6bc.png';

// With:
const ogImage = '/og-image.png';
```

## 🧪 Testing Your OG Image

After deploying, test with these tools:

1. **Facebook Sharing Debugger**
   - URL: https://developers.facebook.com/tools/debug/
   - Enter your app URL and click "Scrape Again"
   - Verifies Facebook will show your image

2. **Twitter Card Validator**
   - URL: https://cards-dev.twitter.com/validator
   - Enter your app URL
   - Verifies Twitter card preview

3. **LinkedIn Post Inspector**
   - URL: https://www.linkedin.com/post-inspector/
   - Enter your app URL
   - Verifies LinkedIn preview

4. **OpenGraph.xyz**
   - URL: https://www.opengraph.xyz/
   - Universal OG preview checker
   - Shows how it appears on all platforms

## 📱 Where Your Image Will Appear

Once configured, your custom OG image will show when links are shared on:

- ✅ Facebook (news feed, groups, messages)
- ✅ Twitter/X (tweets, DMs)
- ✅ LinkedIn (posts, articles)
- ✅ Slack (channel messages, DMs)
- ✅ Discord (channels, embeds)
- ✅ WhatsApp (link previews)
- ✅ iMessage (link previews)
- ✅ Telegram (link previews)
- ✅ Microsoft Teams
- ✅ Reddit
- ✅ And many more!

## 🎨 What's in the OG Image

Your custom OG image includes:

1. **Dark Background** (#121212) - Professional, modern look
2. **Grid Pattern** - Subtle dashed grid for depth
3. **IQ Vote Logo** - BrainDAO logo in brand colors
4. **Brand Name** - "IQ VOTE" in Montserrat font
5. **Headline** - "Employee of the Month Voting" with gradient text shadow
6. **Gradient Blobs** - Pink/blue decorative elements in corners
7. **Geometric Shapes** - Rotated triangular shapes for visual interest

## 🔧 Troubleshooting

### "Image not showing when I share"
**Solution:**
- Use debug tools above to force re-scrape
- Social platforms cache for 7-30 days
- Add `?v=2` to your image URL: `og-image.png?v=2`
- Ensure URL is publicly accessible (no authentication required)
- Verify HTTPS (most platforms require it)

### "Image looks cut off or wrong size"
**Solution:**
- Verify dimensions: exactly 1200x630px
- Check aspect ratio: 1.91:1
- Ensure file size under 8MB
- Try PNG format (better quality than JPG for graphics)

### "Some platforms show old image"
**Solution:**
- Clear cache using platform debug tools
- Change image URL (add version parameter)
- Wait 24-48 hours for cache to expire
- Use different filename: `og-image-v2.png`

### "Preview route shows blank page"
**Solution:**
- Check browser console for errors
- Verify `/imports/OgImage.tsx` exists
- Ensure `/imports/svg-rouk5ilrbn.ts` is present
- Try clearing browser cache
- Use `/public/og-image.html` as fallback

## 📊 Technical Specifications

### OG Image Requirements
- **Minimum:** 200×200px
- **Recommended:** 1200×630px (what we use)
- **Aspect Ratio:** 1.91:1
- **Max File Size:** 8MB
- **Format:** PNG or JPG (PNG preferred for graphics)
- **Color Mode:** RGB
- **Protocol:** HTTPS required by most platforms

### Meta Tags (Already Configured)
```html
<!-- Open Graph -->
<meta property="og:title" content="IQ Vote - Employee of the Month Voting">
<meta property="og:description" content="Modern employee recognition platform with frictionless voting experience">
<meta property="og:image" content="[YOUR_IMAGE_URL]">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:type" content="website">
<meta property="og:url" content="[PAGE_URL]">

<!-- Twitter Card -->
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:image" content="[YOUR_IMAGE_URL]">
```

## 📚 Additional Resources

- [Open Graph Protocol](https://ogp.me/) - Official OG specification
- [Twitter Cards](https://developer.twitter.com/en/docs/twitter-for-websites/cards/overview/abouts-cards) - Twitter card docs
- [Facebook Sharing](https://developers.facebook.com/docs/sharing/webmasters/) - Facebook best practices
- [LinkedIn Sharing](https://www.linkedin.com/help/linkedin/answer/a521928) - LinkedIn guidelines

## 🎯 Quick Reference

| Action | Command/URL |
|--------|-------------|
| View OG Preview | `/#og-preview` |
| Static HTML | `/public/og-image.html` |
| Test Facebook | https://developers.facebook.com/tools/debug/ |
| Test Twitter | https://cards-dev.twitter.com/validator |
| Test LinkedIn | https://www.linkedin.com/post-inspector/ |
| Component File | `/imports/OgImage.tsx` |
| Wrapper Component | `/components/OgImagePage.tsx` |
| Meta Tags | `/App.tsx` lines 24-73 |

## ✨ You're All Set!

Once you complete the 3 implementation steps above, your IQ Vote links will display a beautiful, professional preview image across all social platforms!

Need help? See the comprehensive guide: [OG_IMAGE_GUIDE.md](./OG_IMAGE_GUIDE.md)

---

**Pro Tip:** After implementation, share a test link in a private Slack channel or Discord DM to yourself to verify the image appears correctly before sharing publicly!
