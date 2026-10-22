"""Build Dashboard_TRIAL_v15.html from Dashboard_TRIAL_v14.html: week 1 value features
(shared data layer, Excel export per report, saved view).
Usage: python3 build_trial_v15.py <v14.html> <v15.html>"""
import sys, os
src, dst = sys.argv[1], sys.argv[2]
here = os.path.dirname(os.path.abspath(__file__))
h = open(src, encoding='utf-8').read()
css = open(os.path.join(here, 'vf_week1.css'), encoding='utf-8').read()
js = open(os.path.join(here, 'vf_week1.js'), encoding='utf-8').read()
assert 'id="vfWeek1Css"' not in h
i = h.index('</head>'); assert i < h.index('<body')
h = h[:i] + '<style id="vfWeek1Css">\n' + css + '\n</style>\n' + h[i:]
tail = '</script>\n</body>'
j = h.rindex(tail)
h = h[:j] + '</script>\n<script id="vfWeek1Js">\n' + js + '\n' + tail[0:9] + h[j+9:]
open(dst, 'w', encoding='utf-8').write(h)
print('built', dst, len(h))
