# OG Image Generation Guide

This guide explains how to generate and use the custom OG (Open Graph) image for IQ Vote social sharing.

## What is an OG Image?

An OG image is the preview image that appears when you share a link on social media platforms (Facebook, Twitter, LinkedIn, Slack, etc.). For IQ Vote, we have a custom design that showcases the brand and purpose of the application.

## Current Setup

The OG image design has been imported from Figma and is available as a React component at `/imports/OgImage.tsx`. The app is configured to display this design at a special route for easy screenshot generation.

## Method 1: View in Browser (Recommended)

### Steps:

1. **Access the OG Preview Route**
   - Navigate to your app and add `#og-preview` to the URL
   - Example: `https://your-app.com/#og-preview`
   - This will display just the OG image at the correct dimensions (1200x630px)

2. **Take a Screenshot**
   - Open your browser's developer tools (F12)
   - Use device emulation to set exact dimensions:
     - Width: 1200px
     - Height: 630px
   - Take a screenshot using:
     - Chrome: DevTools > ⋮ menu > Capture screenshot
     - Firefox: DevTools > ⋮ menu > Take a screenshot > Save full page
     - Or use browser extensions like "Full Page Screen Capture"

3. **Save the Image**
   - Save as `og-image.png`
   - Ensure it's exactly 1200x630px

## Method 2: Use Screenshot Services

For automated or programmatic generation, use these services:

### Option A: Screenshot API

```bash
# Using screenshotapi.net
https://shot.screenshotapi.net/screenshot?token=YOUR_TOKEN&url=https://your-app.com/%23og-preview&width=1200&height=630&output=image&file_type=png&wait_for_event=load

# Using urlbox.io
https://api.urlbox.io/v1/YOUR_KEY/png?url=https://your-app.com/%23og-preview&width=1200&height=630
```

### Option B: Puppeteer Script

If you have Node.js, you can use this script:

```javascript
const puppeteer = require('puppeteer');

async function generateOGImage() {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  await page.setViewport({ width: 1200, height: 630 });
  await page.goto('https://your-app.com/#og-preview', {
    waitUntil: 'networkidle0'
  });
  
  await page.screenshot({ 
    path: 'og-image.png',
    type: 'png'
  });
  
  await browser.close();
  console.log('OG image generated: og-image.png');
}

generateOGImage();
```

## Method 3: Use the Static HTML File

A simplified static HTML version is available at `/public/og-image.html`. This can be:

1. Opened directly in a browser
2. Screenshot at 1200x630px
3. Used as a fallback if the React component has issues

## Deploying the OG Image

Once you have generated `og-image.png`:

### Option A: Use Figma Assets (Current Method)

The app currently uses: `import ogImage from 'figma:asset/...'`

Replace the existing Figma asset with your new PNG:
1. In Figma, replace the asset with the same ID
2. The app will automatically use the new image

### Option B: Upload to CDN/Hosting

1. **Upload to your hosting provider**
   ```bash
   # Example: Upload to /public folder
   cp og-image.png public/og-image.png
   ```

2. **Update App.tsx**
   ```typescript
   // Replace this line:
   import ogImage from 'figma:asset/6f65d30a8110ac76cf93c26c68bcbe5766e3e6bc.png';
   
   // With:
   const ogImage = '/og-image.png';
   // Or use absolute URL:
   const ogImage = 'https://your-cdn.com/og-image.png';
   ```

### Option C: Use Supabase Storage

1. **Upload to Supabase Storage**
   - Go to your Supabase Dashboard > Storage
   - Create a public bucket called `public-assets`
   - Upload `og-image.png`
   - Get the public URL

2. **Update App.tsx**
   ```typescript
   const ogImage = 'https://your-project.supabase.co/storage/v1/object/public/public-assets/og-image.png';
   ```

## Verifying the OG Image

After deploying, test your OG image:

1. **Facebook Sharing Debugger**
   - https://developers.facebook.com/tools/debug/
   - Enter your URL and click "Scrape Again"

2. **Twitter Card Validator**
   - https://cards-dev.twitter.com/validator
   - Enter your URL to see how it appears

3. **LinkedIn Post Inspector**
   - https://www.linkedin.com/post-inspector/
   - Inspect how the link appears on LinkedIn

4. **Open Graph Preview**
   - https://www.opengraph.xyz/
   - General OG tag checker

## Troubleshooting

### Image Not Updating

- **Cache Issue**: Social platforms cache OG images for 7-30 days
- **Solution**: Use the debug tools above to force a re-scrape
- **Or**: Add a version parameter: `og-image.png?v=2`

### Image Not Loading

- **Check CORS**: Ensure your CDN/hosting allows cross-origin requests
- **Check HTTPS**: Most platforms require HTTPS for OG images
- **Check Size**: Must be exactly 1200x630px (or maintain 1.91:1 ratio)

### Wrong Dimensions

- **Minimum**: 200x200px
- **Recommended**: 1200x630px (what we use)
- **Maximum**: 8MB file size
- **Aspect Ratio**: 1.91:1 is optimal

## Current Meta Tags

The app sets these OG tags automatically:

```html
<meta property="og:title" content="IQ Vote - Employee of the Month Voting">
<meta property="og:description" content="Modern employee recognition platform with frictionless voting experience">
<meta property="og:image" content="[URL to og-image.png]">
<meta property="og:image:secure_url" content="[URL to og-image.png]">
<meta property="og:image:type" content="image/png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:type" content="website">
<meta property="og:url" content="[Current URL]">
<meta property="og:site_name" content="IQ Vote">

<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="IQ Vote - Employee of the Month Voting">
<meta name="twitter:description" content="Modern employee recognition platform with frictionless voting experience">
<meta name="twitter:image" content="[URL to og-image.png]">
```

These are set in `/App.tsx` in the `useEffect` hook (lines 24-73).

## Need Help?

- The OG image component is at: `/imports/OgImage.tsx`
- The preview route is: `#og-preview`
- The static HTML is at: `/public/og-image.html`
- The OG image wrapper component is at: `/components/OgImagePage.tsx`

## Next Steps

1. Generate your OG image using Method 1 or 2
2. Upload it using one of the deployment methods
3. Update the `ogImage` import in `/App.tsx`
4. Test using the verification tools
5. Share your link and enjoy the beautiful preview!
