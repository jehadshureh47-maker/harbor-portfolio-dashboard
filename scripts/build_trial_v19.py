"""Build the Targets & trends trial: python3 build_trial_v19.py <in.html> <out.html>
Injects scripts/vf_week4.css before </head> and scripts/vf_week4.js after the week 3 script. Nothing else changes."""
import sys, os
src, dst = sys.argv[1], sys.argv[2]
here = os.path.dirname(os.path.abspath(__file__))
h = open(src, encoding='utf-8').read()
css = open(os.path.join(here, 'vf_week4.css'), encoding='utf-8').read()
js = open(os.path.join(here, 'vf_week4.js'), encoding='utf-8').read()
assert 'id="vfWeek3"' in h and 'id="vfWeek4"' not in h
i = h.index('</head>'); assert i < h.index('<body')
h = h[:i] + '<style id="vfWeek4Css">\n' + css + '\n</style>\n' + h[i:]
tail = '</script>\n</body>'
j = h.rindex(tail)
h = h[:j] + '</script>\n<script id="vfWeek4">\n' + js + '\n</script>\n</body>' + h[j + len(tail):]
open(dst, 'w', encoding='utf-8').write(h)
print('built', dst, len(h))
