This file documents additional brand assets for the LawMate project.

## Logo Files

The primary logo and favicon assets are located in `/public/lawmate-logo/`:
- `lawmate.svg` - The primary SVG logo (full wordmark lockup)
- `lawmate-logo.svg` - Horizontal logo: geometric mark + "LawMate" wordmark
- `lawmate-mark.svg` - Geometric icon-only mark
- `lawmate.png` - The primary PNG logo (transparent background)
- Multiple favicon sizes (16px, 32px, 48px, 64px, 96px, 128px, 256px, 512px)
- Both light and dark variants for favicons
- Apple touch icon (180x180px)
- Web app manifest (`site.webmanifest`) and browserconfig files

## Usage

1. **In components**: Use the Logo component from `@/components/navigation/Logo`
2. **Direct image usage**: Reference SVG or PNG files directly (e.g., `/lawmate-logo/lawmate.svg`)
3. **Favicon**: Various favicon sizes are available in the lawmate-logo directory
4. **Favicon HTML snippet**: See `/lawmate-logo/html-snippet.txt` for the complete link tag setup

## Logo Component

The Logo component in `@/components/navigation/Logo.tsx`:
- Displays the lawmate-logo.svg (geometric mark + wordmark)
- Conditionally shows the "LAW MATE AI" text
- Supports different sizes (sm, md, lg)
- Uses correct path: `/lawmate-logo/lawmate-logo.svg`

## Additional Logos

- The `images/` directory can be used for additional brand assets
- Favicon pack available in `lawmate-logo/` with various sizes

## Notes
- The logo should be optimized for both light and dark modes
- All logo files are included in the project but may need optimization for production
- The SVG logo is preferred for scalability and quality
- Favicon paths in `site.webmanifest` and `html-snippet.txt` use `/lawmate-logo/` prefix