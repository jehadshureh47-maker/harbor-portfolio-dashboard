"""Build Dashboard_TRIAL_v15.html from Dashboard_TRIAL_v14.html: week 1 value features
(shared data layer, Excel export per report, saved view).
Usage: python3 build_trial_v15.py <v14.html> <v15.html> [portfolio:month:folder ...]
Each portfolio:month:folder embeds that month's four original workbooks (matched by name: bounce, new lease,
cheque count, request count) so Export Excel can hand back the exact original file."""
import sys, os
src, dst = sys.argv[1], sys.argv[2]
import json, base64, glob
KEYS = [('bounced-cheques', 'bounce'), ('new-lease', 'new lease'), ('count-report', 'cheque count'), ('request-count', 'request count')]
orig = {}
for spec in sys.argv[3:]:
    pf, mo, folder = spec.split(':', 2)
    for rid, kw in KEYS:
        hits = [f for f in sorted(glob.glob(os.path.join(os.path.expanduser(folder), '*.xlsx')))
                if not os.path.basename(f).startswith('~$') and kw in os.path.basename(f).lower()]
        assert len(hits) == 1, (spec, kw, hits)
        orig.setdefault(pf, {}).setdefault(mo, {})[rid] = {'n': os.path.basename(hits[0]), 'd': base64.b64encode(open(hits[0], 'rb').read()).decode()}
here = os.path.dirname(os.path.abspath(__file__))
h = open(src, encoding='utf-8').read()
css = open(os.path.join(here, 'vf_week1.css'), encoding='utf-8').read()
js = open(os.path.join(here, 'vf_week1.js'), encoding='utf-8').read()
assert 'id="vfWeek1Css"' not in h
i = h.index('</head>'); assert i < h.index('<body')
h = h[:i] + '<style id="vfWeek1Css">\n' + css + '\n</style>\n' + h[i:]
tail = '</script>\n</body>'
j = h.rindex(tail)
h = h[:j] + '</script>\n' + ('<script id="vfOriginals">window.__VF_ORIGINALS=' + json.dumps(orig, separators=(',', ':')) + ';</script>\n' if orig else '') + '<script id="vfWeek1Js">\n' + js + '\n' + tail[0:9] + h[j+9:]
open(dst, 'w', encoding='utf-8').write(h)
print('built', dst, len(h))
