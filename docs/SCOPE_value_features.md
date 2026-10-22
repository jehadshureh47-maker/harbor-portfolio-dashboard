# Dashboard value features: scope (draft, 20 Oct 2026)

Scope for 10 features that would raise the value of the Harbor portfolio dashboard.
Nothing here is built yet. All building would happen on a trial version
(`Dashboard_TRIAL_v15.html`, built from the current v14), never on `index.html`.

## Ground rules

- Do not change the bounce-rate calculation (1.82% on all payments, as already reported).
- Keep the v12/v13 look (navy palette, serif numerals) and the EN/AR bilingual behaviour.
- Every feature must pass: the smoke test, the 8-point e2e check, and
  `scripts/verify_awqaf_month.py` for the loaded months before it is called done.
- New work goes into `scripts/` as separate JS/CSS files and is injected by a build
  script (same pattern as `build_trial_v11/v12.py`), so it can be rebuilt and reviewed.

## What the data already contains (checked in the September embedded reports)

| Report | Fields available |
|---|---|
| Bounced Cheques (31) | date, contract, amount, bank, status, tenant, cheque no., mobile, unit type |
| New Lease (14 new) | date, amount, type, PM user, ownership, unit type, bank, property, contract, agent |
| Cheque Count (3,250 rows) | contract, tenant, property, unit, **lease start and end dates**, pay method, PDC/CDC, cheque date, bank, amount, lease type, PM user, agent |
| Request Count (412) | date, contract, tenant, property, unit, amount, request type, PM user, ownership, unit type |

Important structural fact: each report is its own embedded mini-dashboard (an iframe).
Cross-report features (2, 3, 4, 7) need a small shared data layer that collects the
rows from all four reports. That layer is the first thing to build and is the main
technical dependency.

## The ten features

| # | Feature | What the user gets | Data / approach | Effort | Risk and dependencies | Trial-safe |
|---|---|---|---|---|---|---|
| 0 | **Shared data layer** (prerequisite) | Nothing visible. A single place that holds all four reports' rows, keyed by contract. | Collect rows from each report iframe via postMessage into the parent page; normalise dates and contract numbers. | 1 to 2 days | Contract-number formats may differ between reports (trailing spaces were an issue before). Must not alter existing numbers. | Yes |
| 1 | **Contract-level drill-down** | Click any KPI, chart segment or bar and see the underlying contracts, tenants, amounts, banks; export the list. | Uses fields already in each report. Side panel or modal with sortable table. | 2 to 3 days | Many charts to wire; iframe click events must reach the parent panel. | Yes |
| 2 | **Renewal and bounce risk flags** | A "Needs attention" list: leases ending soon with no renewal, tenants with repeat bounces, high-value cheques bouncing, ranked by risk. | Lease end dates from Cheque Count; bounced cheques joined by contract. Transparent rules (not a black box) with configurable thresholds in the existing Thresholds panel. | 3 to 4 days | Rules need sign-off from the property team. "No renewal" depends on the data showing renewals reliably. Does not touch the bounce-rate formula. | Yes |
| 3 | **Trends and seasonality** | Year-to-date, rolling averages, month-vs-same-month-last-year, quarterly view across all KPIs. | Builds on the existing Executive Summary trend once 2+ months are saved. | 2 days | Only Aug and Sept 2026 are embedded, so trends are thin until more months are loaded. | Yes |
| 4 | **Targets and variance** | Each KPI shows target, actual, gap and a status (on track / watch / off track). | Targets stored per portfolio and month, editable from Thresholds. Existing 2% bounce target stays. | 2 days | Needs real targets from management; without them it is empty. | Yes |
| 5 | **Scheduled outputs** | Monthly Board Pack PDF and email alerts without opening the dashboard. | A static dashboard cannot send email by itself. Needs a scheduler plus a small server or a hosted function. | 3 to 5 days | Needs Harbor hosting or a service account for email. Not possible as pure client-side code. Trial can only generate the PDF on demand. | Partly |
| 6 | **Excel export everywhere** | Every table and view downloadable as .xlsx or CSV with the current filters applied. | SheetJS is already loaded in the reports. Add an export button to each table and chart. | 1 to 2 days | Low. Needs consistent filenames and AR/EN headers. | Yes |
| 7 | **Audit trail** | A visible log of each file loaded (name, date, who, rows, verification result). | Store in the browser (and in Backup export); show in the Data Health area. | 1 to 2 days | Browser-only, so it records this browser's loads, not everyone's. A true shared log needs a backend (see 9). | Yes (local) |
| 8 | **Saved views** | Remembers each user's default portfolio, month, tab and filters. | localStorage with a per-user key; apply on load. | 1 day | Same browser-only limit. Low risk. | Yes |
| 9 | **Move off single-file** | Backend with database, logins, history, safe uploads; meets a proper security review. | New architecture (API, auth, database, hosting). Reuses the existing front-end and verify logic. | 3 to 6 weeks | Needs Harbor-controlled hosting and IT approval. Cannot be done as a trial file. This is the Awqaf security objection. | No (design only) |
| 10 | **Automatic data intake** | Pick a monthly folder and the dashboard loads all four workbooks and runs the verify checks automatically. | Step 1 (trial-safe): folder picker using the browser File System Access API, auto-matching the four files by name, running the same checks as `verify_awqaf_month.py` in the page. Step 2: unattended folder or email ingestion, which needs a backend. | Step 1: 3 to 4 days. Step 2: part of 9. | Folder access is Chrome and Edge only. Workbook layouts change month to month, so mapping must be checked each time. | Step 1 only |

Effort figures are working days of focused build and test on the trial version.
They are estimates, not commitments, and the data-layer work (item 0) shifts several
of them.

## Suggested order

1. **Item 0**, then **6** and **8** (quick wins, little risk, immediately visible).
2. **Item 1**, then **2** (the two features a manager would notice most).
3. **Items 4 and 3** (need real targets and more months loaded to be meaningful).
4. **Items 7 and 10 (step 1)** (trust and monthly workflow).
5. **Items 5 and 9** as a written proposal, because both need Harbor infrastructure.

## Open questions before building

- Who signs off the risk rules in item 2 and the targets in item 4?
- Is the dashboard still to be handed over, or kept by the author? (Ownership, see COPYRIGHT.md.)
- Which months of data will be loaded for trends in item 3?
- Where would Harbor host a backend for items 5 and 9?

## Not covered here

- Handover and runbook documentation, and gathering usage evidence from users.
  These add more value than any single feature and cost very little.
