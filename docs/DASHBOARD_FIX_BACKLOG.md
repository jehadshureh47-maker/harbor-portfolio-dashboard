# Dashboard fix backlog

## STATUS 2026-10-04 - first fix pass applied locally (not pushed)
Fixed in Dashboard_v2.html / index.html (via scripts/patch_report_polish.py, 12 Awqaf report blobs):
- Cards touching: .grid followed by .kpis-split/.kpis-support (and similar) now get a 14px gap. Measured 0px before, 14px after; zero touching boxes left on all 4 report tabs at 1500px.
- Wrapped stat labels no longer push numbers down (stat labels reserve 2 lines; KPI labels stretch).
- Light-theme contrast: green "Paid"/"All records verified" text and pink "Under Legal Action" now use the darker light-theme colours; status pills match the main page's light pills.
- Donut slice outlines use the card colour instead of hard-coded near-black (the heavy outlines in light theme).
- AED/Count line charts: left padding raised so "AED 600.0K" is no longer clipped; plot area is the same width in both modes.
- "Non- Renewal" displays as "Non-Renewal" (display only, data untouched). 0% share shows "<1%" in the request type table.
- Request Count toggle buttons match the Cheque Count style.
- Keyboard focus rings added: dropdown pills (focus-within), sidebar tabs, search inputs, report buttons/selects.
- PIN-locked portfolios: selector note no longer changes before unlock (it described a portfolio that was not showing).
- Changed-records cell clip widened 220px -> up to 300px.
CORRECTIONS to earlier notes: the "Click to filter: RAK" tooltip is the browser's native SVG title tooltip, so its position cannot be controlled (could be replaced with a custom tooltip later). The "stale PIN/Not set up yet" text was mostly caused by the PIN-gated switch flow (fixed above), not a data bug.
PASS 2 (also applied locally): empty portfolios now say "(no data yet)" in the dropdown; the month you picked is remembered when you visit a July-only portfolio and return to Awqaf; x-axis first/last date labels centred under their own points; ownership legend and bounce status labels shown in consistent case (display only); lighter table row dividers in light theme.
NOT fixed (needs your decision or a bigger change): weekend gaps in daily charts (skipped days are plotted evenly - by design of the data); bounce-status shares summing to 101% (rounding); RTL for report iframes; print preview; 375px phone check; replacing native chart tooltips with custom ones.

# Original backlog (kept for reference)

Source: code-assisted audit of live site, Awqaf Sept 2026, all 9 tabs, light + dark. Plus items the owner sends (screenshots) - append below.

## Found by audit
1. Truncated names: `.tenant-cell` (Cheque Count), `.cell-clip` (Executive Summary, Bounced Cheques). Fixed width, up to 231px cut. Title tooltip exists.
2. Light-green text `rgb(79,208,122)` on light bg, contrast 1.78-2.86: "All records verified", "new leases this period" notes, "Cleared (Paid)" KPI.
3. Pink KPI number "Under Legal Action" 2.78 vs 3.0.
4. Small badges/icons just under 4.5: tab check/warn icons, PAID / Under Process pills, grain-tags, heatmap numbers (light theme 2.07-2.86).
5. Dark-mode active chips/toggles (Compare mode, metric chip, Count toggle) 3.16-3.80.
6. Chart title text "Daily activity..." 3.49-4.10.

## Done already
- Sidebar label truncation; numeric column right-alignment.

## NOT checked yet (still to audit)
- Other portfolios; July and August months; mobile/narrow widths
- Keyboard focus / tab order; hover and tooltip states
- Print / PDF export; Arabic (RTL) layout

## Unchecked-area audit (done 2026-10-04, live DOM + CSS source)
Other portfolios / months
- Only Awqaf has reports. Dubai Court, RTA, VIP, Police, Al Naser Club and National Bonds all show "0 / 0 reports loaded" and "Not set up yet", with zero tabs. They are all selectable in the dropdown, so the page looks broken rather than empty. Grey them out, label "no data yet", or hide them.
- Stale text leaks between portfolios: the "Not set up yet" card shows "Dubai Court" while RTA is selected; the PIN dialog says "Enter the PIN for RTA" on VIP and "for Al Naser" on National Bonds. Text is not cleared when the portfolio changes.
- Switching portfolio resets the month to July, even if September was selected. The month list collapses to a single "July 2026" for non-Awqaf portfolios.
- Banner text for RTA/Police/Al Naser says "Showing ... from the Rent Roll pivot..." while the same page says "0 / 0 reports loaded" - contradictory.
- Month dropdown option "August 2026 data is not yet available for this portfolio - still showing July 2026" appears as a banner but the dropdown still lists August as selectable for Awqaf.
- Compare tab lists Police/RTA/Al Naser in selectors although those portfolios have no loaded reports (comparison would be empty).
- Awqaf July: Bounced Cheques Report has about 16-22 truncated (ellipsis) cells and Cheque Count about 124 truncated cells; Compare tab 10. Same cause as audit item 1 (fixed-width name cells).
- Tab switching in the Awqaf iframes lags: content of the previous tab remained for 0.5s+ after the tab was marked active (stale iframe visible briefly). Needs a loading/transition guard.
Narrow width (pane measured about 578px wide)
- Layout is tested only at <=600/640/760/900px breakpoints in the main file; embedded report iframes have their own CSS and were not tested at phone width. Re-test at 375px and 768px with a real device-size window.
Keyboard / focus
- Dropdown selects (portfolio, month, etc.) and search inputs use `outline:none` with no `:focus-within` or `:focus-visible` replacement (CSS lines ~81, 157, 788 - 788 has a border-color change only). Keyboard focus is invisible there.
- `.tab-btn` (sidebar tabs) has hover and active styles but no `:focus-visible` style. It relies on the browser default.
- Heatmap and compare controls do have focus-visible outlines (consistent style to copy).
Print / PDF
- Print CSS exists (lines ~289 and ~919, `@page` margin 12mm, board-only and compare-only modes). Not yet exercised on the live site - needs an actual print preview for each tab. Iframe reports are not covered by the main print rules.
Arabic / RTL
- RTL rules exist (~50 selectors under `html[dir="rtl"]`) but none for the embedded iframe report pages, so charts, tables and legends inside reports will stay LTR when the AR toggle is on. Needs a live check.
- Numeric alignment fix (right-aligned columns) applies to LTR only; RTL rule `th, td {text-align:right}` (line 1080) may override numeric columns back to the wrong side.
Not possible to check
- The six non-Awqaf portfolios' report tabs, because they are PIN-locked/empty. Not bypassed.

## Owner's screenshot round 1 (pixel-level, found by looking at the screenshots)
Spacing / layout
- Stacked cards touch (about 2px vertical gap) while side-by-side cards have about 22px gutters: Request Count table card -> card group -> 3-card row; Activity chart -> Peak Request/Peak Value cards; donut cards -> Top Banks card. Cheque Count stat strip has a 16px gap, so spacing differs between reports.
- Request Count: the 4-card row sits inside an extra outer card, the 3-card row does not. Edges misalign (233 vs 212 left, 1913 vs 1935 right).
- Card top accent borders curve into "horns" at the rounded corners.
- Donut + legend group sits left of centre (Bounce Status about 147px off; Ownership/Unit Type leave about 200px empty on the right).
- Lease Activity: New Lease card has no donut, so its rows start at x=636 while the other two cards start at x=908 (columns do not line up).
- Cheque Count stat strip: "AVG FEE/CHEQUE RECORD VALUE" label wraps, so its number sits about 20px lower than the others. Same in Bounced Cheques Exposure Detail: "REPEAT BOUNCES (BY CONTRACT)" wraps and pushes its "0" down.
Charts
- X-axis labels do not sit under their points at the ends: first/last label inset about 17-20px, so "01/09 02/09" and "29/09 30/09" crowd while the middle is spaced evenly.
- Weekend dates skipped (04/09 then 07/09) but plotted evenly, so time spacing is distorted.
- Cheque Count AED chart: y-label clipped to "ED 600.0K"; labels mix "600.0K" and "1.8M".
- Plot area jumps horizontally when toggling Count <-> AED (plot starts x=293 vs 328).
- Hover tooltip "Click to filter: RAK - 39" appears about 490px above the RAK bar, covering the ownership donut legend.
- Donut slices have heavy near-black outlines; gridlines are heavy and baseline not distinguished.
Labels / data
- "Non- Renewal" stray space (table + card).
- Ownership legend: "ENDOWMENT / AMAF & MINORS / MINOR" upper case vs "Amaf and Minors-EIB" mixed case; near-duplicate categories.
- Bounced status: "PAID" upper case vs "Under Legal Action" / "Under Process" title case (pills and legend).
- Titles inconsistent: "By Ownership Type" vs "Unit Type".
- Orange means Endowment in one donut and Commercial in the other; orange vs amber slices hard to tell apart.
- Toggle styles differ: Request Count "Count / AED Value" vs Cheque Count "ACTIVITY COUNT / AED VALUE".
- Lease Activity: "Renewal Share of Lease Activity 501 (97%)" repeats "Renewal Lease contracts 501 (97%)" in the same card.
- Lease Activity: the 515-contracts and 380-requests sparklines look identical - verify they use different series.
- Table share shows "0%" for 2 non-renewal requests; Bounce Status value shares sum to 101%.
- Table row dividers are dark and heavy in light theme; card shadows look muddy.
