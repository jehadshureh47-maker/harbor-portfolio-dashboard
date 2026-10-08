#!/usr/bin/env python3
"""Builds Dashboard_TRIAL_v6.html from Dashboard_TRIAL_v5.html (run build_trial_v5.py first if stale).
v6 = Overview (Awqaf) rewritten as a briefing: headline sentence, four clickable report tiles
(Cheque Count, Bounced Cheques, Lease Activity, Request Count), then the existing Key Changes panel.
Other portfolios' Overview renderers are untouched. Run from repo root: python3 scripts/build_trial_v6.py"""
import pathlib
ROOT = pathlib.Path(__file__).resolve().parent.parent
s = (ROOT / 'Dashboard_TRIAL_v5.html').read_text(encoding='utf-8')
CSS = (ROOT / 'scripts' / 'trial_v6.css').read_text(encoding='utf-8')
JS = (ROOT / 'scripts' / 'trial_v6_overview.js').read_text(encoding='utf-8')

i = s.index('</style>')
s = s[:i] + CSS + s[i:]

anchor = "  renderOverviewCards(wrap, cards, keyChangesHtml);\n}\n\n\n// ---------- Lease Activity tab (Awqaf) ----------"
assert s.count(anchor) == 1, s.count(anchor)
s = s.replace(anchor, "  renderOverviewCards(wrap, cards, keyChangesHtml);\n" + JS.rstrip('\n') + "\n}\n\n\n// ---------- Lease Activity tab (Awqaf) ----------")

# ---- ES Trend & Outlook + Forward View + Changes (globals injected before the originals, which become *Legacy) ----
TREND = (ROOT / 'scripts' / 'trial_v6_trend.js').read_text(encoding='utf-8')

a = "function renderMonthlyTrend(){"
assert s.count(a) == 1, s.count(a)
s = s.replace(a, TREND + "\nfunction renderMonthlyTrendLegacy(){")

b = "function renderChangedRecords(){\n  const wrap = document.getElementById('changedRecordsWrap');"
assert s.count(b) == 1, s.count(b)
s = s.replace(b, "function renderChangedRecordsLegacy(){\n  const wrap = document.getElementById('changedRecordsWrap');")

c = "forwardWrap.innerHTML = listHtml + trendNoteHtml;"
assert s.count(c) == 1, s.count(c)
s = s.replace(c, "forwardWrap.innerHTML = (typeof v6Forward === 'function') ? v6Forward(watchItems, historyDepth, listHtml, trendNoteHtml) : listHtml + trendNoteHtml;")

out = ROOT / 'Dashboard_TRIAL_v6.html'
out.write_text(s, encoding='utf-8')
print('wrote', out.name, len(s))
