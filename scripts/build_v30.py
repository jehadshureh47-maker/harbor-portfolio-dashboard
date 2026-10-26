"""Build v30 from v29: python3 build_v30.py <in.html> <out.html>
Exact-string CSS patches (count-asserted) + swap of the vfArNumJs body from scripts/vf_arnum.js."""
import sys, os
src, dst = sys.argv[1], sys.argv[2]
here = os.path.dirname(os.path.abspath(__file__))
h = open(src, encoding='utf-8').read()
def rep(s, old, new, n=1):
    c = s.count(old); assert c == n, f'{old[:50]!r}: expected {n}, found {c}'
    return s.replace(old, new)
h = rep(h, ".v6t-grid{display:grid; grid-template-columns:minmax(0,1.8fr) minmax(280px,1fr);", ".v6t-grid{display:grid; grid-template-columns:minmax(0,1.5fr) minmax(380px,1fr);")
h = rep(h, ".v6t-row{display:grid; grid-template-columns:minmax(0,1fr) auto auto;", ".v6t-row{display:grid; grid-template-columns:minmax(120px,1fr) auto auto;")
h = rep(h, ".v6t-rl{display:flex; align-items:center; gap:8px; min-width:0; color:var(--sub);}", ".v6t-rl{display:flex; align-items:center; gap:8px; min-width:0; color:var(--sub); overflow-wrap:anywhere;}")
h = rep(h, ".v6t-rv{font-weight:700; color:var(--text);}", ".v6t-rv{font-weight:700; color:var(--text); white-space:nowrap;}")
h = rep(h, ".changed-records-table td.cell-clip, .changed-records-table .cell-clip{overflow:hidden; text-overflow:ellipsis; max-width:min(300px,100%); display:inline-block; vertical-align:bottom;}",
 ".changed-records-table td.cell-clip, .changed-records-table .cell-clip{overflow:hidden; text-overflow:ellipsis; max-width:min(230px,100%); display:inline-block; vertical-align:bottom;}\n  .changed-records-table th, .changed-records-table td{padding:8px 8px;}\n  .changed-records-table td:nth-child(3){max-width:260px; overflow:hidden; text-overflow:ellipsis;}\n  .changed-table-scroll{overflow-x:auto;}")
js = open(os.path.join(here, 'vf_arnum.js'), encoding='utf-8').read()
m = '<script id="vfArNumJs">\n'
a = h.index(m) + len(m); b = h.index('\n</script>\n</body>', a)
h = h[:a] + js + h[b:]
open(dst, 'w', encoding='utf-8').write(h)
print('built', dst, len(h))
