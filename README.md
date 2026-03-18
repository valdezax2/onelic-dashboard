# One LIC Neighborhood Plan — Public Commitment Tracker

A civic transparency dashboard for tracking promises and commitments made under the **One LIC Neighborhood Plan** in Long Island City, Queens, NYC.

Built with **Flask + Vanilla CSS**, pulling live data from a JSON file hosted on GitHub.

---

## Screenshots

| Overview | Projects | Detail | Timeline |
|----------|----------|--------|----------|
| KPI cards, key commitments table, priority areas | Full filterable table of all commitments | Per-commitment detail with verification link | Commitments grouped by category |

---

## Features

- **4-page dark dashboard** — Overview, Projects list, Commitment detail, Timeline
- **Live data** — JSON fetched from GitHub with a 5-minute in-memory cache
- **Filtering** — Filter commitments by category (Housing, Parks, NYCHA, Community) and status
- **Status tracking** — Color-coded badges: Planned / In Progress / Complete
- **Verification links** — Every commitment links to its source document or council page
- **Related commitments** — Detail page surfaces same-category items
- **Error handling** — Custom 404 and 500 pages

---

## Tech Stack

- **Backend:** Python 3 / Flask
- **Frontend:** HTML5, Vanilla CSS (dark theme), Vanilla JS
- **Icons:** [Lucide](https://lucide.dev/) (CDN)
- **Fonts:** Inter (Google Fonts CDN)
- **Data:** JSON file hosted on GitHub (raw URL), with local fallback

---

## Project Structure

```
lic-dashboard/
├── app.py                   # Flask routes
├── data.py                  # Data fetching, caching, helpers
├── lic_commitments.json     # Local fallback data (11 commitments)
├── requirements.txt
├── static/
│   ├── css/main.css         # Full design system
│   └── js/main.js           # Lucide icon init
└── templates/
    ├── base.html            # Shared layout + sidebar
    ├── macros.html          # Jinja macros (badges, KPI cards)
    ├── index.html           # Page 1: Overview
    ├── projects.html        # Page 2: All Commitments
    ├── detail.html          # Page 3: Commitment Detail
    ├── timeline.html        # Page 4: Timeline
    ├── 404.html
    └── 500.html
```

---

## Getting Started

### 1. Clone and set up

```bash
git clone <your-repo-url>
cd lic-dashboard

python3 -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 2. Configure the data source

Open `data.py` and update `DATA_URL` to point to your GitHub-hosted JSON file:

```python
DATA_URL = "https://raw.githubusercontent.com/YOUR_USER/YOUR_REPO/main/lic_commitments.json"
```

> During development the app falls back automatically to the local `lic_commitments.json` file if the GitHub URL is unreachable.

### 3. Run

```bash
flask run --port 5050
```

Visit **http://127.0.0.1:5050**

---

## Data Format

Commitments are stored in `lic_commitments.json`. To add or update a commitment, edit the JSON and push to GitHub — the app will pick up changes within 5 minutes.

```json
{
  "metadata": {
    "plan_name": "One LIC Neighborhood Plan",
    "geography": "Long Island City, Queens, NYC",
    "last_updated": "YYYY-MM-DD",
    "source_url": "https://council.nyc.gov/julie-won/one-lic/",
    "total_commitments": 11
  },
  "commitments": [
    {
      "id": "LIC-H-01",
      "category": "Housing",
      "promise": "New housing enabled by rezoning",
      "amount": "~14,700–15,000 units",
      "responsible_agency": "DCP / HPD",
      "geography_site": "Rezoning area-wide",
      "timeframe": "Long-term buildout",
      "status": "Planned",
      "notes": "Zoning capacity, not guaranteed construction",
      "verification_url": "https://council.nyc.gov/julie-won/one-lic/"
    }
  ]
}
```

### Status values

| Value | Meaning |
|-------|---------|
| `Planned` | Committed but not yet started |
| `In Progress` | Actively underway |
| `Complete` | Delivered |

### Categories

`Housing` · `Parks` · `NYCHA` · `Community`

---

## Pages & Routes

| Route | Page |
|-------|------|
| `/` | Overview dashboard — KPIs, key commitments, priority areas |
| `/projects` | Full commitments table with category + status filters |
| `/projects?category=Housing` | Pre-filtered table |
| `/detail/<id>` | Commitment detail (e.g. `/detail/LIC-P-02`) |
| `/timeline` | All commitments grouped by category |

---

## Deployment

Any WSGI-compatible host works (Render, Railway, Heroku, Fly.io).

**Example — Render:**
1. Push repo to GitHub
2. Create a new **Web Service** on Render
3. Build command: `pip install -r requirements.txt`
4. Start command: `gunicorn app:app`

Add `gunicorn` to `requirements.txt` for production.

---

## Roadmap

- [ ] Search bar (live JS filtering)
- [ ] Map view (Leaflet + lat/lng per commitment)
- [ ] CSV export
- [ ] `last_verified` timestamps per commitment
- [ ] `amount_disbursed` field for actual spend tracking
- [ ] Open Graph / social share cards
- [ ] Dark/light mode toggle
- [ ] Multilingual support (ES, KO, ZH)

---

## Data Sources

- [One LIC Neighborhood Plan — Council Member Julie Won](https://council.nyc.gov/julie-won/one-lic/)
- [NYC DCP — Draft OneLIC Neighborhood Plan (PDF)](https://www.nyc.gov/assets/planning/downloads/pdf/our-work/plans/queens/lic-neighborhood-plan/draft-onelic-neighborhood-plan-pages.pdf)
- [NYC Mayor's Office — Press Releases](https://www.nyc.gov/mayors-office/news/)

---

## Design

Visual design based on Pencil prototypes in `dashboard.pen` (Long Island City, Queens).  
Dark theme, Inter typeface, Lucide icons.
