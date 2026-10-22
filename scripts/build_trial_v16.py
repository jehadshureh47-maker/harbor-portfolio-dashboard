"""Build Dashboard_TRIAL_v16.html from Dashboard_TRIAL_v15.html: week 2 contract drill-down.
Usage: python3 build_trial_v16.py <v15.html> <v16.html>
Injects scripts/vf_week2.css before </head> and scripts/vf_week2.js after the week 1 script. Nothing else is changed."""
import sys, os
src, dst = sys.argv[1], sys.argv[2]
here = os.path.dirname(os.path.abspath(__file__))
h = open(src, encoding='utf-8').read()
css = open(os.path.join(here, 'vf_week2.css'), encoding='utf-8').read()
js = open(os.path.join(here, 'vf_week2.js'), encoding='utf-8').read()
assert 'id="vfWeek1Js"' in h and 'id="vfWeek2Js"' not in h
i = h.index('</head>'); assert i < h.index('<body')
h = h[:i] + '<style id="vfWeek2Css">\n' + css + '\n</style>\n' + h[i:]
tail = '</script>\n</body>'
j = h.rindex(tail)
h = h[:j] + '</script>\n<script id="vfWeek2Js">\n' + js + '\n</script>\n</body>' + h[j + len(tail):]
open(dst, 'w', encoding='utf-8').write(h)
print('built', dst, len(h))
