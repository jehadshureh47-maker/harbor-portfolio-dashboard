"""Build v32 from v31: python3 build_v32.py <in.html> <out.html>"""
import sys, os
src, dst = sys.argv[1], sys.argv[2]
here = os.path.dirname(os.path.abspath(__file__))
h = open(src, encoding='utf-8').read()
def rep(s, old, new, n=1):
    c = s.count(old); assert c == n, f'{old[:50]!r}: expected {n}, found {c}'
    return s.replace(old, new)
# collapsed sidebar stubs: Arabic drops the leading "ال" so stubs are distinct (نع / مت / مق / جب ...)
h = rep(h, "function shortCode(name){\n  const words = name.trim().split(/\\s+/);\n  if(words.length >= 2)",
"function shortCode(name){\n  let words = name.trim().split(/\\s+/);\n  if(/[\\u0600-\\u06FF]/.test(name)){\n    words = words.map(w => w.replace(/^ال(?=.)/, '')).filter(Boolean);\n    if(words.length >= 2) return words[0][0] + words[1][0];\n    return (words[0] || name).slice(0, 2);\n  }\n  if(words.length >= 2)")
# header search: placeholder now says what it actually finds
h = rep(h, 'placeholder="Jump to a report or value&hellip;"', 'placeholder="Jump to a report, bank or property&hellip;"')
h = rep(h, "'اذهب إلى تقرير أو قيمة…' : 'Jump to a report or value…'", "'اذهب إلى تقرير أو بنك أو عقار…' : 'Jump to a report, bank or property…'")
js = open(os.path.join(here, 'vf_arnum.js'), encoding='utf-8').read()
m = '<script id="vfArNumJs">\n'
a = h.index(m) + len(m); b = h.index('\n</script>\n</body>', a)
h = h[:a] + js + h[b:]
open(dst, 'w', encoding='utf-8').write(h)
print('built', dst, len(h))
