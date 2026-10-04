#!/usr/bin/env python3
"""Pass 2 of the report UX polish (run after patch_report_polish.py). Idempotent."""
import re, base64, pathlib
ROOT = pathlib.Path(__file__).resolve().parent.parent
f = ROOT / 'Dashboard_v2.html'
s = f.read_text(encoding='utf-8')
MARK = 'UX polish pass 2'
CSS = '''
  /* ---- UX polish pass 2 ---- */
  [data-theme="light"] th, [data-theme="light"] td{border-bottom-color:rgba(26,34,51,0.14);}
'''
SOFT = '''function softCase(s){
  // display-only: "ENDOWMENT" / "PAID" -> "Endowment" / "Paid"; mixed-case and short codes untouched
  if(typeof s !== 'string' || s.length < 4 || /\\d/.test(s) || s !== s.toUpperCase()) return s;
  return s.toLowerCase().replace(/(^|[\\s&\\/-])([a-z])/g, (m, a, b) => a + b.toUpperCase());
}
'''
stats = {'blobs': 0, 'skipped': 0}

def patch(h, key):
    if MARK in h:
        stats['skipped'] += 1; return h
    i = h.index('</style>'); h = h[:i] + CSS + h[i:]
    old = "const anchor = i===0 ? 'start' : (i===n-1 ? 'end' : 'middle');"
    assert old in h, key + ': anchor line'
    h = h.replace(old, "const anchor = 'middle'; // centred under its own point (UX polish pass 2)")
    m = re.search(r"if\(padL < 74\) padL = 74;[^\n]*", h); assert m, key + ': padL patch missing'
    h = h[:m.end()] + "\n  if(padR < 26) padR = 26; // room for the centred last date label" + h[m.end():]
    j = h.index('function lineChart('); h = h[:j] + SOFT + h[j:]
    if key == 'request-count':
        old = "return typeof label === 'string' ? label.replace(/Non-\\s+Renewal/g, 'Non-Renewal') : label;"
        assert old in h, 'dispType patch missing'
        h = h.replace(old, "if(field === 'ownership') label = softCase(label);\n  " + old)
    if key == 'bounced-cheques':
        assert 'esc(reportText(status))' in h
        h = h.replace('esc(reportText(status))', 'esc(softCase(reportText(status)))')
        h = h.replace('esc(reportText(label))', 'esc(softCase(reportText(label)))')
    stats['blobs'] += 1
    return h

def sub(m):
    key = m.group(1)
    h = patch(base64.b64decode(m.group(2)).decode('utf-8'), key)
    return '"%s": "%s"' % (key, base64.b64encode(h.encode('utf-8')).decode('ascii'))

s2 = re.sub(r'"(request-count|new-lease|count-report|bounced-cheques)"\s*:\s*"([A-Za-z0-9+/=]{100000,})"', sub, s)
f.write_text(s2, encoding='utf-8'); print(stats)
