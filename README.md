# Rocket Catalog – React Single Page Application

This project rebuilds the Rocket Catalog experience as a single-page React application styled with Tailwind CSS. It reproduces the sticky navigation, catalog filtering controls, responsive product grid, and the interactive slide-in product detail drawer described in the project brief.

## Tech Stack

- [React](https://react.dev/) 19 with [Vite](https://vite.dev/) for lightning-fast development and builds.
- [Tailwind CSS](https://tailwindcss.com/) for utility-first styling that mirrors the original layout.
- [PapaParse](https://www.papaparse.com/) to transform the published Google Sheets CSV data into structured product and variant objects.

## Getting Started

1. **Install dependencies**
   ```bash
   npm install
   ```
2. **Run the development server**
   ```bash
   npm run dev
   ```
   The app will be served on the port reported in the terminal (typically http://localhost:5173).
3. **Lint the project**
   ```bash
   npm run lint
   ```
4. **Create a production build**
   ```bash
   npm run build
   ```

## Deploying to GitHub Pages

GitHub Pages is configured to serve files from the repository’s `docs/` directory. Running `npm run build` now writes the
optimized production bundle directly to that folder. To publish updates:

1. Run `npm run build`.
2. Commit the generated files under `docs/` together with your source changes.
3. Push to the default branch—GitHub Pages will immediately serve the new bundle from https://mcnish12.github.io/showroom/.

If you are using a different GitHub repository namespace, update the `base` option in `vite.config.js` so that static assets
resolve correctly for your deployment path.

## Data Sources

The catalog consumes the same read-only Google Sheets data as the legacy site:

- Products: <https://docs.google.com/spreadsheets/d/e/2PACX-1vRU7hseo3Sa3Y5oTSb5fIjItVIC8JKW0lJdRFK4bCpxQJHfz9nTQjSXrh2Bhkx5J5gG69PO4IRUYIg0/pub?gid=653601520&single=true&output=csv>
- Variants: <https://docs.google.com/spreadsheets/d/e/2PACX-1vRU7hseo3Sa3Y5oTSb5fIjItVIC8JKW0lJdRFK4bCpxQJHfz9nTQjSXrh2Bhkx5J5gG69PO4IRUYIg0/pub?gid=140795318&single=true&output=csv>

The CSV contents are never modified—only fetched at runtime to populate the interface. Products are filtered to show only approved items, and variants are grouped with their parent product to power pricing ranges and the detail table.

## Application Structure

```
src/
  App.jsx                # Fetches catalog data and orchestrates the layout
  RootErrorBoundary.jsx  # Top-level error boundary with a friendly fallback state
  components/
    ImageModal.jsx       # Accessible lightbox for enlarged product imagery
    ProductCard.jsx      # Clickable catalog tile with imagery and pricing callout
    ProductDrawer.jsx    # Slide-in drawer with gallery, links, and variant pricing table
    ProductGrid.jsx      # Responsive grid that renders ProductCard instances
  hooks/
    useFocusTrap.js      # Reusable focus management for modals and drawers
  utils/
    catalog.js           # CSV fetching, normalization, and enrichment helpers
  assets/
    rocket-logo.svg      # Source artwork for the Honors, Inc. branding
  index.css              # Tailwind directives and global design tokens
  main.jsx               # React entry point with StrictMode and error boundary wiring
```

## Feature Highlights

- Branded hero header that keeps the catalog focus on Honors, Inc. awards and recognition pieces.
- Responsive grid of product cards with graceful image fallbacks and clear pricing callouts.
- Slide-in product drawer featuring an image gallery, external resource links, and a structured variant pricing table.
- Accessible modal experiences (drawer and lightbox) powered by a shared focus-trapping hook.

Feel free to tailor the hero copy in `App.jsx` or swap the artwork in `src/assets/rocket-logo.svg` to match your organization.
