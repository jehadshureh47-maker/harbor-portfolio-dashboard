#!/usr/bin/env python3
"""Builds Dashboard_TRIAL_v5.html from Dashboard_TRIAL_v4.html (run build_trial_v4.py first if stale).
v5 = Executive Summary (Awqaf) rewritten as a one-screen briefing: headline sentence, four visual
tiles, daily activity chart + leasing/operations, attention strip. Trend and Changes views unchanged.
Run from repo root: python3 scripts/build_trial_v5.py"""
import pathlib
ROOT = pathlib.Path(__file__).resolve().parent.parent
s = (ROOT / 'Dashboard_TRIAL_v4.html').read_text(encoding='utf-8')
CSS = (ROOT / 'scripts' / 'trial_v5.css').read_text(encoding='utf-8')
JS = (ROOT / 'scripts' / 'trial_v5_exec.js').read_text(encoding='utf-8')

i = s.index('</style>')
s = s[:i] + CSS + s[i:]

anchor = "    forwardWrap.innerHTML = listHtml + trendNoteHtml;\n  }\n}\n\nfunction buildChecks(){"
assert s.count(anchor) == 1, s.count(anchor)
s = s.replace(anchor, "    forwardWrap.innerHTML = listHtml + trendNoteHtml;\n  }\n" + JS.rstrip('\n') + "\n}\n\nfunction buildChecks(){")

# Summary briefing grows taller than the window; don't let that overflow shrink --exec-h for Trend/Changes.
fit_old = "if(over > 0) pane.style.setProperty('--exec-h', (h - over) + 'px');"
assert s.count(fit_old) == 1, s.count(fit_old)
s = s.replace(fit_old, "if(over > 0 && !pane.classList.contains('exec-has-briefing')) pane.style.setProperty('--exec-h', (h - over) + 'px');")

out = ROOT / 'Dashboard_TRIAL_v5.html'
out.write_text(s, encoding='utf-8')
print('wrote', out.name, len(s))
