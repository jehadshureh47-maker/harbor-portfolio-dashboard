#!/usr/bin/env python3
"""Idempotent UX-polish patch for the 12 embedded Awqaf report blobs in Dashboard_v2.html.
Usage: python3 scripts/patch_report_polish.py   (run from repo root)"""
import re, base64, pathlib, sys
ROOT = pathlib.Path(__file__).resolve().parent.parent
f = ROOT / 'Dashboard_v2.html'
s = f.read_text(encoding='utf-8')
css = (ROOT / 'scripts' / 'report_polish.css').read_text(encoding='utf-8')
MARK = 'UX polish pass (Oct 2026)'
REQ_EXTRA = "\n  .seg-btn{font-size:11.5px; font-weight:600; letter-spacing:.3px; border-radius:7px;}\n"
stats = {'blobs': 0, 'skipped': 0}

def patch(html, key):
    if MARK in html:
        stats['skipped'] += 1
        return html
    extra = REQ_EXTRA if key == 'request-count' else ''
    i = html.index('</style>')
    html = html[:i] + css + extra + html[i:]
    html = html.replace('stroke="#161d2e" stroke-width="2"', 'stroke="var(--card)" stroke-width="2"')
    m = re.search(r"function lineChart\([^)]*\)\{\n  const labels = Object\.keys\(dataDict\);", html)
    assert m, key + ': lineChart signature not found'
    html = html[:m.end()] + "\n  if(padL < 74) padL = 74; // room for 'AED 600.0K' style tick labels, same plot width for count and AED" + html[m.end():]
    if key == 'request-count':
        old = "function dispType(field, label){\n  return label;\n}"
        assert old in html, 'dispType hook not found'
        html = html.replace(old, "function dispType(field, label){\n  // display-only: source roster spells it 'Non- Renewal' (stray space)\n  return typeof label === 'string' ? label.replace(/Non-\\s+Renewal/g, 'Non-Renewal') : label;\n}")
        html = html.replace("<td>${count}</td><td>${share}%</td>", "<td>${count}</td><td>${(share === 0 && count > 0) ? '<1' : share}%</td>")
    stats['blobs'] += 1
    return html

def sub(m):
    key, b64 = m.group(1), m.group(2)
    html = base64.b64decode(b64).decode('utf-8')
    return '"%s": "%s"' % (key, base64.b64encode(patch(html, key).encode('utf-8')).decode('ascii'))

s2 = re.sub(r'"(request-count|new-lease|count-report|bounced-cheques)"\s*:\s*"([A-Za-z0-9+/=]{100000,})"', sub, s)
f.write_text(s2, encoding='utf-8')
print(stats, len(s), '->', len(s2))
