# IQ Vote OG Image - Quick Reference Card

## 🚀 Three Steps to Beautiful Social Previews

### Step 1: Generate (2 minutes)
```
1. Open: https://your-app.com/#og-preview
2. Press F12 → Device Toolbar (Ctrl+Shift+M)
3. Set: 1200 x 630 pixels
4. DevTools menu → Capture screenshot
5. Save as: og-image.png
```

### Step 2: Upload (1 minute)
```
Option A: Supabase Storage (recommended)
- Dashboard → Storage → Upload og-image.png
- Copy public URL

Option B: Public folder
- Move og-image.png to /public/

Option C: CDN
- Upload to your CDN service
- Get public URL
```

### Step 3: Update (1 minute)
```typescript
// In /App.tsx line 20, replace:
import ogImage from 'figma:asset/...';

// With (Supabase/CDN):
const ogImage = 'https://your-url.com/og-image.png';

// Or (public folder):
const ogImage = '/og-image.png';
```

## 📱 Test Your Implementation

**Facebook**: https://developers.facebook.com/tools/debug/  
**Twitter**: https://cards-dev.twitter.com/validator  
**LinkedIn**: https://www.linkedin.com/post-inspector/  
**General**: https://www.opengraph.xyz/

## 📁 Key Files

| File | Purpose |
|------|---------|
| `/imports/OgImage.tsx` | The OG image design |
| `/components/OgImagePage.tsx` | Preview wrapper |
| `/App.tsx` (line 20) | Image URL config |
| `/#og-preview` | Preview route |

## 📖 Documentation

| Guide | When to Use |
|-------|-------------|
| `OG_IMAGE_IMPLEMENTATION_SUMMARY.md` | Overview & status |
| `QUICK_OG_IMAGE_SETUP.md` | Quick 5-min setup |
| `OG_IMAGE_README.md` | Complete guide |
| `OG_IMAGE_GUIDE.md` | All methods & options |

## 🎨 What Your OG Image Shows

- ✅ IQ Vote logo + branding
- ✅ "Employee of the Month Voting" headline
- ✅ Dark theme with gradient grid
- ✅ Brand colors (#FF1A88)
- ✅ 1200×630px (optimal size)

## 🌍 Where It Appears

Facebook • Twitter • LinkedIn • Slack • Discord  
WhatsApp • iMessage • Telegram • Teams • Reddit

## ⚡ Quick Troubleshooting

**Not showing?**
- Use debugger tools above
- Check URL is public
- Ensure HTTPS protocol

**Wrong size?**
- Must be exactly 1200×630px
- Use DevTools device mode

**Cached old image?**
- Add `?v=2` to URL
- Use platform debugger
- Wait 24-48 hours

## 🔧 Technical Specs

- **Size**: 1200 × 630 pixels
- **Ratio**: 1.91:1
- **Format**: PNG or JPG
- **Max**: 8MB
- **Protocol**: HTTPS

## ✅ Checklist

- [ ] Generate image via `#og-preview`
- [ ] Upload to hosting/CDN
- [ ] Update App.tsx line 20
- [ ] Test with platform debuggers
- [ ] Share and verify!

## 💡 Pro Tips

1. **Test first**: Share in private channel before going public
2. **Version URLs**: Add `?v=1`, `?v=2` to bust cache
3. **HTTPS only**: Social platforms require secure URLs
4. **File size**: Keep under 8MB for best performance
5. **Aspect ratio**: Maintain 1.91:1 (1200:630) for best display

## 📞 Need Help?

1. Read `OG_IMAGE_IMPLEMENTATION_SUMMARY.md` for overview
2. Follow `QUICK_OG_IMAGE_SETUP.md` for basic setup
3. Check `OG_IMAGE_README.md` for detailed guide
4. See `OG_IMAGE_GUIDE.md` for advanced options

## 🎉 Success Indicators

✅ Image displays on `#og-preview` route  
✅ Screenshot is exactly 1200×630px  
✅ Image uploaded and publicly accessible  
✅ App.tsx updated with image URL  
✅ Facebook Debugger shows your image  
✅ Twitter Validator shows your image  
✅ Link shares show custom preview!

---

**Current Status**: Implementation complete, ready for deployment  
**Time to Complete**: ~5 minutes  
**Difficulty**: Easy  
**Impact**: High (professional social sharing)

---

**Quick Access**:  
Preview: `/#og-preview`  
Config: `/App.tsx` line 20  
Docs: `/OG_IMAGE_IMPLEMENTATION_SUMMARY.md`
