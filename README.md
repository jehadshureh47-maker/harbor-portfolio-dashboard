# Mother Dashboard

Interactive HTML dashboard for Harbor Property Management. Ingests a portfolio's monthly Excel reports (bounced cheques, cheque clearance, collections, occupancy, etc.) and turns them into KPI cards, interactive charts, filterable tables, and cross-report data-quality checks — entirely client-side, no server or data upload.

## Files

- `Mother_Dashboard_v2.html` — live/production version.
- `Mother_Dashboard_NavTrial.html` — staging/testing copy, kept in sync with v2.
- `Mother_Dashboard_DEMO.html` — scrubbed demo with synthetic data.
- `Data_Quality_Validator.html` — standalone tool for checking a new portfolio's Excel structure before onboarding it.
- `docs/` — usage guides (loading a new portfolio, using the demo, using the Al Naser Club dashboard).
- `memory/` — project notes and context (status, decisions, contacts).

## Running locally

These are self-contained HTML files — open directly in a browser, or serve locally:

```
python3 -m http.server 8765
```

then visit `http://localhost:8765/Mother_Dashboard_v2.html`.

## Status

Live portfolios: Awqaf, Al Naser Club. See `memory/projects/mother-dashboard.md` for full history and what's still open.
