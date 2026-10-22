"""Build the Needs attention release/trial: python3 build_trial_v17.py <in.html> <out.html>
Injects scripts/vf_week3.css before </head> and scripts/vf_week3.js after the per-tab Updates script. Nothing else changes."""
import sys, os
src, dst = sys.argv[1], sys.argv[2]
here = os.path.dirname(os.path.abspath(__file__))
h = open(src, encoding='utf-8').read()
css = open(os.path.join(here, 'vf_week3.css'), encoding='utf-8').read()
js = open(os.path.join(here, 'vf_week3.js'), encoding='utf-8').read()
assert 'id="vfWeek2Js"' in h and 'id="vfWeek3"' not in h
i = h.index('</head>'); assert i < h.index('<body')
h = h[:i] + '<style id="vfWeek3Css">\n' + css + '\n</style>\n' + h[i:]
tail = '</script>\n</body>'
j = h.rindex(tail)
h = h[:j] + '</script>\n<script id="vfWeek3">\n' + js + '\n</script>\n</body>' + h[j + len(tail):]
open(dst, 'w', encoding='utf-8').write(h)
print('built', dst, len(h))
