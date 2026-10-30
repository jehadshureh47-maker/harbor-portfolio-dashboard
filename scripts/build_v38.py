"""Build v38 from v37: python3 build_v35.py <in.html> <out.html>
Arabic: target wording, last-month note, bank abbreviations."""
import sys, os, re
src, dst = sys.argv[1], sys.argv[2]
here = os.path.dirname(os.path.abspath(__file__))
h = open(src, encoding='utf-8').read()
blocks = re.findall(r'const EMBEDDED_DASHBOARDS(?:_AUG|_SEPT)? = \{.*?\n\};', h, re.S)
assert len(blocks) == 3, len(blocks)

js = open(os.path.join(here, 'vf_arnum.js'), encoding='utf-8').read() + '\n' + open(os.path.join(here, 'vf_v35.js'), encoding='utf-8').read()
m = '<script id="vfArNumJs">\n'
a = h.index(m) + len(m); b = h.index('\n</script>\n</body>', a)
h = h[:a] + js + h[b:]
for blk in blocks:
    assert h.count(blk) == 1, 'an existing embedded block changed'
open(dst, 'w', encoding='utf-8').write(h)
print('built', dst, len(h))
