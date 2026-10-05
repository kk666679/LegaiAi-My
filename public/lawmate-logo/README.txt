This README is for the LawMate project logo structure.

## Logo Files Available

### Main Logo (lawmate-logo/)
- `lawmate.svg` - Full horizontal wordmark lockup (primary brand logo for landing, hero areas)
- `lawmate-logo.svg` - Horizontal logo: geometric mark + "LawMate" wordmark (sidebar header, headers)
- `lawmate-mark.svg` - Geometric icon-only mark (sidebar collapsed state, app icons, avatars)
- `lawmate.png` - Raster logo with transparent background
- Multiple favicon sizes (16px, 32px, 48px, 64px, 96px, 128px, 256px, 512px)
- Both light and dark variants for favicons
- Apple touch icon (180x180px)
- Web app manifest and browserconfig files

## Usage Guidelines

### Web Application
- Sidebar / header branding: `/lawmate-logo/lawmate-logo.svg` (mark + wordmark) or the mark alone via `lawmate-mark.svg`
- Landing / hero branding: `/lawmate-logo/lawmate.svg` (full wordmark lockup)
- Icon-only states (collapsed sidebar, avatars): `lawmate-mark.svg`
- Use PNG for specific use cases where SVG is not suitable
- Favicon files should be referenced according to the included HTML snippet

### React Components
- `@/components/navigation/Logo.tsx` uses `lawmate-logo.svg` (mark + wordmark)
- `@/components/lawmate/Sidebar.tsx` uses `lawmate-mark.svg` (icon-only) and renders the "LawMate" wordmark in text
- Components support different sizes and text visibility options
- Automatically handle correct paths and optimizations

### Email Headers, PDFs, etc.
- SVG logo is preferred for scalability
- PNG can be used for email clients with limited SVG support

### Favicon Setup
- Favicon files are located in `/public/lawmate-logo/`
- The HTML snippet in `html-snippet.txt` contains the complete favicon link tags
- The `site.webmanifest` references all favicon files with correct paths
- Dark mode favicons are served via `media="(prefers-color-scheme: dark)"`

## Branding Guidelines
- Logo should maintain horizontal spacing and clear visibility
- Use consistent colors (primary brand colors)
- Ensure adequate clear space around logo
- Follow existing design patterns in the interface

## Maintenance
- For logo updates, modify the source files in `lawmate-logo/`
- The Logo component automatically references the updated SVG
- Regenerate favicon pack if new favicon variants are needed
- Update any direct references to logo paths in components or assets

## Documentation
This README serves as documentation for logo usage across the project.
For specific implementation questions, refer to the Logo component documentation or project style guides.