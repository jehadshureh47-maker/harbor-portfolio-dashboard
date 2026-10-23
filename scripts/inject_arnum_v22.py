"""Inject the Arabic count-agreement script: python3 inject_arnum_v22.py <in.html> <out.html>
Adds <script id="vfArNumJs"> (scripts/vf_arnum.js) after the last script, before </body>. Nothing else changes."""
import os, sys
src, dst = sys.argv[1], sys.argv[2]
here = os.path.dirname(os.path.abspath(__file__))
h = open(src, encoding='utf-8').read()
js = open(os.path.join(here, 'vf_arnum.js'), encoding='utf-8').read()
assert 'id="vfArNumJs"' not in h
tail = '</script>\n</body>'
j = h.rindex(tail)
h = h[:j] + '</script>\n<script id="vfArNumJs">\n' + js + '\n</script>\n</body>' + h[j + len(tail):]
open(dst, 'w', encoding='utf-8').write(h)
print('built', dst, len(h))
