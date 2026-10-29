"""Build v31 from v30: python3 build_v31.py <in.html> <out.html>"""
import sys, os
src, dst = sys.argv[1], sys.argv[2]
here = os.path.dirname(os.path.abspath(__file__))
h = open(src, encoding='utf-8').read()
def rep(s, old, new, n=1):
    c = s.count(old); assert c == n, f'{old[:50]!r}: expected {n}, found {c}'
    return s.replace(old, new)
h = rep(h, ".v6t-grid{display:grid; grid-template-columns:minmax(0,1.5fr) minmax(380px,1fr);", ".v6t-grid{display:grid; grid-template-columns:minmax(0,1.25fr) minmax(440px,1fr);")
h = rep(h, ".v6t-row{display:grid; grid-template-columns:minmax(120px,1fr) auto auto;", ".v6t-row{display:grid; grid-template-columns:minmax(90px,1fr) max-content max-content;")
h = rep(h, ".v6t-rv{font-weight:700; color:var(--text); white-space:nowrap;}", ".v6t-rv{font-weight:700; color:var(--text); white-space:nowrap;}\n  .v6t-rd{white-space:nowrap;}")
h = rep(h, "@media (max-width:980px){ .v6t-grid{grid-template-columns:1fr;} }", "@media (max-width:1180px){ .v6t-grid{grid-template-columns:1fr;} }")
js = open(os.path.join(here, 'vf_arnum.js'), encoding='utf-8').read()
m = '<script id="vfArNumJs">\n'
a = h.index(m) + len(m); b = h.index('\n</script>\n</body>', a)
h = h[:a] + js + h[b:]
open(dst, 'w', encoding='utf-8').write(h)
print('built', dst, len(h))
