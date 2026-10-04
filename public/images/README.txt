This file documents the logo structure for the LawMate project.

## Logo Files

The main logo is available in `/public/lawmate-logo/`:
- `lawmate.svg` - The primary SVG logo
- `lawmate.png` - The primary PNG logo (transparent background)

## Usage

1. **In components**: Use the Logo component from `@/components/navigation/Logo`
2. **Direct image usage**: Reference SVG or PNG files directly (e.g., `/lawmate-logo/lawmate.svg`)
3. **Favicon**: Various favicon sizes are available in the lawmate-logo directory

## Logo Component

The Logo component in `@/components/navigation/Logo.tsx`:
- Displays the lawmate logo
- Conditionally shows the "LAW MATE AI" text
- Supports different sizes (sm, md, lg)

## Additional Logos

- The `images/` directory can be used for additional brand assets
- Favicon pack available in `lawmate-logo/` with various sizes

## Notes

- The logo should be optimized for both light and dark modes
- All logo files are included in the project but may need optimization for production
- The SVG logo is preferred for scalability and quality
