# Mother Dashboard

**What it is:** An interactive HTML dashboard that ingests a property portfolio's monthly Excel reports (bounced cheques, cheque clearance, collections, occupancy, etc.) and turns them into KPI cards, interactive charts, filterable tables, automatic data-quality checks, and cross-report consistency checks. Runs entirely client-side — no server, no data upload — the Excel file loads directly into the HTML page.

**Origin:** Built first for Awqaf and Al Naser Club. Haider (Harbor leadership) asked for it to be made scalable across all portfolios and connected Jehad to Harbor's Head of IT — the wider rollout is his mandate.

**Live portfolios:** Awqaf, Al Naser Club — both fully working, used monthly.

**In progress / pipeline:** Dubai Police (Diaa Ramadan), RTA (Ibrahim Sijer Daghman), National Bonds (Lorie Ann Torio), VIP (Ahmed Bassyoni / Jona De Leon), Dubai Court (Preethi).

**Files:**
- `Mother_Dashboard_v2.html` — live/production.
- `Mother_Dashboard_NavTrial.html` — staging/testing copy, kept in sync with v2.
- `Mother_Dashboard_DEMO.html` — scrubbed demo with synthetic data (Awqaf report types only so far).
- Standalone Data Quality Validator tool — used during onboarding to check a new portfolio's Excel structure before building.

**Onboarding a new portfolio:** (1) get one sample monthly report as-is, (2) review terminology/structure differences, (3) build + demo before final adoption. No changes required on the portfolio's side — the dashboard adapts to their file format.

**Shipped 8/18 (from Diaa's feedback):**
- Light/dark mode toggle — moved from a small sidebar icon-only button to a larger labeled pill button in the header (top-right, next to the title), always visible regardless of sidebar collapse state. Applies to the shell and every embedded report iframe, persisted via localStorage. Live in v2, NavTrial, and DEMO.
- Executive Summary — its own dedicated sidebar tab (not a toggle buried inside Overview), second in the tab order right after Overview. Contains: the period selector (Monthly/Quarterly/Yearly), 4 large headline cards (Total Collected, Bounced/At Risk, Net Collected, and a 4th portfolio-specific metric — New Lease Value for Awqaf, Occupancy Rate for Al Naser), an auto-generated plain-English narrative paragraph, and a Health Snapshot (cross-checks passing/failing + the key rate for that portfolio). All numbers reused from data each report already computes, nothing fabricated.
- Period selector — Quarterly/Yearly honestly show a placeholder note explaining only one month of data is loaded so far (no multi-month storage exists yet — that's tied to Rahul's folder-structure work). Will auto-populate with real trends once that infrastructure lands.
- (First pass shipped this as a toggle inside the Overview tab with a tiny sidebar theme icon; reworked same day after Jehad's feedback that he'd pictured the exec summary as its own full page and that the theme toggle was too easy to miss.)
- After researching 6 executive-dashboard-design articles (ClearPoint, FanRuan, Geckoboard, Diligent, Asana, InsiderOne), added a "Data as of [period]" line above the hero cards (closes the most common failure mode ClearPoint's data flagged — dashboards that look current but are stale, because nobody sees the last-updated date) and a visible 4% target next to Awqaf's bounce-rate figure in the Health Snapshot (was a bare number with no benchmark to judge it against). Skipped per-metric "owner" tracking — that's built for teams, not a single-person project.
- Fixed three light-mode contrast bugs found during a full visual QA pass: chart legend/axis text (donut, bar, line charts) was hardcoded to a dark-theme color and nearly invisible on a white background; the split KPI cards (Amount Collected by Request/Fee Type) had a hardcoded dark card background that never adapted to light theme, making the AED figures unreadable; and status pills (Cleared/Bounced/Settled/Pending, Open/Resolved, Legal/Paid/Process, Renewal/New/Unspecified) used hardcoded dark-tinted chip colors that clashed against the light page. All three were print-only patched before (hardcoded overrides existed for PDF export) but never mirrored for on-screen light mode. Fixed by adding equivalent `[data-theme="light"]` CSS overrides across all 8 report templates in v2/NavTrial and the matching subset in DEMO. Re-verified clean across every tab, both portfolios (Awqaf and Al Naser Club), both themes (light and dark, confirming no regression) — Overview, Executive Summary, Data Quality, and all 4 report tabs per portfolio.

**Shipped 8/18, part 2 (deep functional pass):**
- Fixed placeholder-portfolio background seam (Police/RTA/VIP/Dubai Court/National Bonds showed a visible color break at the bottom of the viewport) — `html` had no background and `body` had no `min-height`, so short/empty pages left the raw white page background exposed below the content.
- Fixed chart colors shifting when a chart's data was filtered/reordered (donut and bar charts across 7 of 8 report templates). Root cause: color assignment fell back to `PALETTE[index % length]`, so the same category could get different colors depending on what order it happened to render in. Replaced with a first-seen-order stable assignment cache, filtered to exclude colors already reserved by each field's pinned color map, so a category always keeps the same color regardless of filtering/sort order.
- Cheque Count card on the Overview tab: swapped "2,838 lines / 453 distinct contracts" for "2,838 lines / AED [total collected]" — the total-amount figure is more directly useful at a glance; distinct-contract count is still available in the card's expandable Details.
- Fixed filter dropdown buttons (Type, PM User, Ownership, Unit Type, Bank, Property) not updating their label after clicking a chart segment to filter. Root cause: the button-label-sync function queried the DOM for the button before it had been attached to the page during a full filter-panel rebuild, so the query silently found nothing and the button kept showing "All" even with a filter active. Only showed up after a chart-click filter (not on manual checkbox filtering), and was invisible on first page load since "All" was already correct there.
- Filter checklists (Type, PM User, Ownership, Unit Type, Bank, Property): clicking the label text next to a checkbox now toggles it too, not just the checkbox square itself.
- All fixes applied across every template that has this filter/color code (7 of 8 report templates; Occupancy has no filter UI) in v2, NavTrial, and DEMO.

**Still open:**
- Al Naser Club still needs to be added to the DEMO file with synthetic data (currently only Awqaf is there).
- Auto-updater (mentioned to Diaa as "on the roadmap") isn't built yet — still manual Excel upload.

**Future plans:** private GitHub repo for the codebase; LinkedIn post about the project (pending Abdul Rahman's approval).
