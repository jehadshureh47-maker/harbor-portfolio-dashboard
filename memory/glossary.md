# Glossary

| Term | Meaning |
|------|---------|
| Dashboard | Core project: interactive HTML dashboard ingesting monthly Excel reports per property portfolio. Local-only, no server. |
| v2 / `Dashboard_v2.html` | The live/production dashboard file. |
| NavTrial / `Dashboard_NavTrial.html` | Staging copy for testing changes before they're merged into v2. Kept byte-identical to v2 once changes are ported. |
| DEMO / `Dashboard_DEMO.html` | Scrubbed copy with synthetic data only, safe to show external prospects. Currently only Awqaf's 4 report types are built out with fake data; Al Naser Club is not yet in the demo. |
| Data Quality Validator | Standalone tool (distinct from the dashboard's own "Data Quality" tab) used to check a new portfolio's Excel structure during onboarding. |
| EMBEDDED_DASHBOARDS | The base64-encoded blob structure inside the dashboard HTML holding each report template's code + data. |
| Overview tab | Dashboard's summary tab: KPI cards + Cross-checks (automatic consistency checks between reports) + Activity heatmap. |
| Cross-checks | Automatic comparison between two different reports for the same portfolio to catch numeric inconsistencies. |
| Awqaf | Live portfolio #1. Report types: request-count, new-lease, count-report, bounced-cheques. |
| Al Naser Club | Live portfolio #2. Report types: al-bounced, al-clearance, al-collections, al-occupancy. |
| RTA | Roads and Transport Authority (Dubai) — prospect portfolio, contact Ibrahim Sijer Daghman. |
| VIP | Prospect portfolio, contacts Ahmed Bassyoni and Jona De Leon. |
| National Bonds | Prospect/onboarding portfolio, contact Lorie Ann Torio. |
| Dubai Court | Prospect portfolio, contact Preethi. |
| Dubai Police | Prospect portfolio, contact Diaa Ramadan. |
| 3amiya | Colloquial spoken Arabic, as opposed to formal MSA ("fosha"). Jehad's preferred register for personal Arabic notes — specifically Levantine, not Egyptian. |
