# One LIC Neighborhood Plan - Public Commitment Tracker

This dashboard now runs as a fully static JavaScript site, with no Python server required for production hosting.

## What changed

- Static entry file at `index.html`
- Client-side rendering and routing in `static/js/main.js`
- Data loaded from `lic_commitments.json` in the repository
- GitHub Pages deploy workflow in `.github/workflows/deploy-pages.yml`

## Runtime model

- The app loads commitment data in the browser using `fetch("lic_commitments.json")`
- A cache-busting query string is added every 5 minutes to reduce stale CDN/browser data
- Routes are hash-based so static hosting works without server rewrites:
  - `#/` overview
  - `#/projects`
  - `#/timeline`
  - `#/detail/<id>`

## Daily data overwrite behavior

If `lic_commitments.json` is overwritten once per day and pushed to `main`, GitHub Pages updates automatically through the deploy workflow. Users will see updated data on refresh.

## Google Sheets daily sync (automated)

This repo now includes a scheduled workflow at `.github/workflows/sync-google-sheet.yml`.

It runs once daily and can also be triggered manually, then:

1. Downloads a Google Sheet as CSV
2. Converts rows to the dashboard JSON schema
3. Writes `lic_commitments.json`
4. Commits and pushes only if content changed

### 1) Prepare your Google Sheet

Use a worksheet tab with a header row that matches these column names exactly:

- `id`
- `category`
- `promise`
- `amount`
- `responsible_agency`
- `geography_site`
- `timeframe`
- `status`
- `notes`
- `verification_url`

### 2) Make CSV readable by GitHub Actions

You have two options:

- Public link: publish the sheet or make it readable to anyone with the link.
- Private link: use a secured integration instead (service account); this repo is currently set up for public/anonymous CSV fetch.

Example CSV URL format:

`https://docs.google.com/spreadsheets/d/<SHEET_ID>/export?format=csv&gid=<GID>`

### 3) Add repository secret and variables

In GitHub repository settings:

- Add secret: `GOOGLE_SHEET_CSV_URL` with your CSV export URL.
- Optional repo variables:
  - `PLAN_NAME`
  - `PLAN_GEOGRAPHY`
  - `PLAN_SOURCE_URL`

If optional variables are not set, existing metadata/defaults are used.

### 4) Trigger and verify

- Run workflow manually once from Actions tab: `Sync commitments from Google Sheet`
- Confirm `lic_commitments.json` updates
- Confirm `Deploy static site to Pages` runs after commit

## Deploy on GitHub Pages

1. Push this repository to GitHub.
2. In repository Settings -> Pages, set Source to GitHub Actions.
3. The `Deploy static site to Pages` workflow will publish on every push to `main`.
4. Open your Pages URL once deployment succeeds.

## Local preview

You can preview locally with any static server:

```bash
python3 -m http.server 5050
```

Then open `http://127.0.0.1:5050`.

## Data contract

The app expects `lic_commitments.json` with:

- Top-level `metadata`
- Top-level `commitments` array
- Each commitment including `id`, `category`, `promise`, `amount`, `responsible_agency`, `geography_site`, `timeframe`, `status`, `notes`, `verification_url`

## Notes

- Existing Flask files (`app.py`, `data.py`, `templates/*`) can remain in the repo, but Pages uses only static files.
- If you later want true path-based URLs (`/projects` instead of `#/projects`), you can migrate to a host that supports SPA rewrites.
