# Rocket Catalog Theme Starter

This is a minimal, dependency-light starter theme for your OMG Company Store look, designed for version control in GitHub.

## Structure
```
theme/
  layout/theme.liquid
  snippets/{header,notification,bootstrap-carousel,footer,minimal_footer,blocks_footer,under_construction_page}.liquid
  templates/403.liquid
  assets/{default-main.css,custom-main.css,sitewide.js,favicon.png}
  config/{settings_schema.json,settings_data.json}
```
- Cards are **horizontally centered** via `max-width` + `margin: 0 auto;` (not vertically centered).
- Switch footers & CSS by setting `current_theme` to `classic`, `modern`, or `stylistic`.
- Enable homepage slideshow by setting `display_slideshow: true`.
- Toggle the sitewide banner via `show_top_navbar_notification` and edit text/colors accordingly.
- Use the Under Construction snippet with `display_under_construction_page: true`.

## Local preview
Open any Liquid file in your storefront platform. For quick static testing, you can create a simple HTML page that includes the CSS from `assets` and copy snippet content.

## Packaging
Zip the `theme/` directory and upload to your OMG/BrightSites theme area, or use a GitHub Action to zip on tags.
