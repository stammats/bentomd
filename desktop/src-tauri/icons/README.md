# App Icons

Place your app icons here before building for distribution.

Required files:
- 32x32.png
- 128x128.png
- 128x128@2x.png (256x256 for retina)
- icon.icns (macOS app icon bundle)
- icon.ico (Windows icon)

## Generating icons from a source image

If you have a 1024x1024 PNG source image, use Tauri's icon generator:

```
npx @tauri-apps/cli icon path/to/icon.png
```

This will auto-generate all required sizes.
