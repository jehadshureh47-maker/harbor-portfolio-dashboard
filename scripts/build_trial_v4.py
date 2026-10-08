#!/usr/bin/env python3
"""Builds Dashboard_TRIAL_v4.html from Dashboard_TRIAL_v3.html (run build_trial_v3.py first if v3 is stale).
v4 = Executive Summary that fills the screen (stat blocks, mix bar, status panel) + Lease Activity v4
(four visual tiles, stacked mix bars, one interactive daily chart on a real calendar axis, fixed table).
Run from repo root: python3 scripts/build_trial_v4.py"""
import pathlib
ROOT = pathlib.Path(__file__).resolve().parent.parent
s = (ROOT / 'Dashboard_TRIAL_v3.html').read_text(encoding='utf-8')

def rep(old, new):
    global s
    assert s.count(old) == 1, 'anchor count %d: %s' % (s.count(old), old[:80])
    s = s.replace(old, new)

CSS = (ROOT / 'scripts' / 'trial_v4.css').read_text(encoding='utf-8')
HELP = (ROOT / 'scripts' / 'trial_v4_lease.js').read_text(encoding='utf-8')
REND = (ROOT / 'scripts' / 'trial_v4_lease_render.js').read_text(encoding='utf-8')

# CSS after the v3 block
i = s.index('</style>')
s = s[:i] + CSS + s[i:]

# Lease helpers: swap v3 helpers for v4
a = s.index('// ---- Lease Activity v2 helpers ----')
b = s.index('function renderLeaseActivity(){')
s = s[:a] + HELP + '\n' + s[b:]
# Lease render block
a = s.index('  // ---- Lease Activity v2 layout (trial v3) ----')
b = s.index("\n}\n\n// Awqaf's own Executive Summary:", a)
s = s[:a] + REND.rstrip('\n') + s[b:]

# Exec Summary: delta on its own line inside each hero card
rep("const withHeroDelta = (sub, delta) => delta ? `${sub} · ${delta}` : sub;",
    "const withHeroDelta = (sub, delta) => delta ? `${sub}<span class=\"exec-delta\">${delta}</span>` : sub;")

# Exec Summary: Performance panel -> stat blocks + lease mix bar
old_perf = "    perfWrap.innerHTML = `\n      ${groupsHtml}\n      <div class=\"exec-comp-note\">${compNote}</div>\n    `;"
NEW_PERF = '''    const x4Stat = (g, [label, value, delta]) => `<div class="x4-stat"><div class="x4-stat-group">${esc(g.title)}</div><div class="x4-stat-name">${esc(label)}</div><div class="x4-stat-value">${value}</div><div class="x4-stat-delta">${delta || '&nbsp;'}</div></div>`;
    const x4Pct = n => ccClassified ? Math.round(n / ccClassified * 100) : 0;
    const x4Comp = ccClassified ? `<div class="x4-comp"><div class="x4-comp-head"><span>${esc(t('execsum.x4.mix', 'Lease mix by contract'))}</span><span><b>${(cc.total_contracts||0).toLocaleString()}</b> ${esc(contractUnit)}</span></div><div class="x4-bar"><i style="flex:${Math.max(ccRenewal / ccClassified, 0.02)} 1 0;background:var(--accent)"></i><i style="flex:${Math.max(ccNewLease / ccClassified, 0.02)} 1 0;background:var(--accent2)"></i></div><div class="x4-comp-legend"><span><i style="background:var(--accent)"></i><b>${ccRenewal.toLocaleString()}</b> ${esc(t('leaseActivity.donut.renewal','Renewal'))} (${x4Pct(ccRenewal)}%)</span><span><i style="background:var(--accent2)"></i><b>${ccNewLease.toLocaleString()}</b> ${esc(t('leaseActivity.donut.new','New'))} (${x4Pct(ccNewLease)}%)</span></div></div>` : '';
    perfWrap.innerHTML = `<div class="x4-stats">${groups.map(g => x4Stat(g, g.rows[0])).join('')}</div>${x4Comp}<div class="x4-caveat">${compNote}</div>`;'''
rep(old_perf, NEW_PERF)

out = ROOT / 'Dashboard_TRIAL_v4.html'
out.write_text(s, encoding='utf-8')
print('wrote', out.name, len(s))
