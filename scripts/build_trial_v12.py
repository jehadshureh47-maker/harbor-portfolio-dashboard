"""Build Dashboard_TRIAL_v12.html from Dashboard_TRIAL_v11.html: adds the dashboard entrance motion (staggered cards, chart draw-in, count-up).
Usage: python3 build_trial_v12.py <v11.html> <v12.html>"""
import sys, os
src, dst = sys.argv[1], sys.argv[2]
here = os.path.dirname(os.path.abspath(__file__))
h = open(src, encoding='utf-8').read()
css = open(os.path.join(here, 'dash_motion.css'), encoding='utf-8').read()
js = open(os.path.join(here, 'dash_motion.js'), encoding='utf-8').read()
assert 'id="dashMotionCss"' not in h
i = h.index('</head>'); assert i < h.index('<body')
h = h[:i] + '<style id="dashMotionCss">\n' + css + '\n</style>\n' + h[i:]
tail = '</script>\n</body>'
j = h.rindex(tail)
h = h[:j] + '</script>\n<script id="dashMotionJs">\n' + js + '\n' + tail[0:9] + h[j+9:]
open(dst, 'w', encoding='utf-8').write(h)
print('built', dst, len(h))
