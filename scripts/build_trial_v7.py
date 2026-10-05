#!/usr/bin/env python3
"""Builds Dashboard_TRIAL_v7.html from Dashboard_TRIAL_v6.html (run build_trial_v6.py first if stale).
v7 = Compare (headline + proportional bars, both modes) and Data Quality (status tiles + per-report chips).
Original renderers are kept as *Legacy and called first. Run from repo root: python3 scripts/build_trial_v7.py"""
import pathlib
ROOT = pathlib.Path(__file__).resolve().parent.parent
s = (ROOT / 'Dashboard_TRIAL_v6.html').read_text(encoding='utf-8')
CSS = (ROOT / 'scripts' / 'trial_v7.css').read_text(encoding='utf-8')
JS = (ROOT / 'scripts' / 'trial_v7_compare_dq.js').read_text(encoding='utf-8')

i = s.index('</style>')
s = s[:i] + CSS + s[i:]

# rename originals, inject wrappers (global function declarations hoist, call-time resolution finds the wrappers)
for old, new in [('function renderCompare(){', 'function renderCompareLegacy(){'),
                 ('function renderCompareMonth(){', 'function renderCompareMonthLegacy(){'),
                 ('function renderDataQuality(){', 'function renderDataQualityLegacy(){')]:
    assert s.count(old) == 1, (old, s.count(old))
    s = s.replace(old, new)

anchor = 'function renderCompareLegacy(){'
s = s.replace(anchor, JS + '\n' + anchor)

# move the A/B (and month) pickers directly under the mode toggle, above the metric chips
import re
m1 = re.search(r'    <div class="compare-selectors" id="cmpPortfolioSelectors">.*?\n    </div>\n', s, re.S)
m2 = re.search(r'    <div class="compare-selectors" id="cmpMonthSelectors" style="display:none;">.*?\n    </div>\n', s, re.S)
assert m1 and m2
block = m1.group(0) + m2.group(0)
s = s.replace(block, '')
chips = '    <div class="compare-metric-chips" id="cmpMetricChips"'
assert s.count(chips) == 1
s = s.replace(chips, block + chips)

out = ROOT / 'Dashboard_TRIAL_v7.html'
out.write_text(s, encoding='utf-8')
print('wrote', out.name, len(s))
