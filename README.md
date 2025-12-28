# BAGDigital.tech (Beta)

This is the beta website for BAG DIGITAL — fixed-scope websites, automation, and digital setup for Beaufort & Lowcountry businesses.

## What this site is
- A lightweight single-page web app (SPA-style homepage) that renders content from `content.json`.
- A set of “Lab” pages that demonstrate design + operational patterns (not client portfolios).

## How to edit the site
### Update services, packages, pricing
Edit:
- `content.json` → `core_services` and `packages`

### Update hero text + themes
Edit:
- `content.json` → `themes`

### Update labs (add/remove)
Edit:
- `content.json` → `portfolio_labs`
Then create or remove the corresponding `*.html` lab files.

## Contact form
The contact form POSTs JSON to `global.gas_url` (Google Apps Script Web App).  
Because it uses `mode: "no-cors"`, the browser cannot confirm success reliably. Confirm submissions by checking the destination Google Sheet.

## Files
- `index.html` — homepage (single page)
- `style.css` — global styling for homepage + lab pages
- `app.js` — renders content from JSON, handles theme switch, submits form
- `content.json` — all content (services, packages, labs, hero themes)
- `robots.txt` — crawler rules
- `sitemap.xml` — pages list for SEO indexing
- `*.html` — lab pages

## Deployment (GitHub Pages)
1. Commit all files to the GitHub Pages repository.
2. Ensure Pages is configured to publish from the correct branch/folder.
3. Visit: https://bagdigital.tech

## Beta notes / planned improvements
- Replace placeholder lab copy with outcome-based case studies (when available).
- Add “Who it’s for” and “What happens next” blocks for conversion.
- Add local SEO pages later if needed (separate from SPA).
- Optionally add lightweight analytics (Plausible, Fathom, GA4).

## Image credits
Lab and hero images are from Pexels (linked on each lab page).
