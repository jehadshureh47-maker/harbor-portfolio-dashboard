"""Build v24 from v23: python3 build_v24.py <in.html> <out.html>
Exact-string replacements with count asserts. Report data blocks are not touched."""
import sys, os

src, dst = sys.argv[1], sys.argv[2]
here = os.path.dirname(os.path.abspath(__file__))
h = open(src, encoding='utf-8').read()

def rep(s, old, new, n=1, label=''):
    c = s.count(old)
    assert c == n, f'{label or old[:50]!r}: expected {n}, found {c}'
    return s.replace(old, new)

# 1. Arabic correction layer (count agreement, leftover English, terminology) + empty-state messages
js = open(os.path.join(here, 'vf_arnum.js'), encoding='utf-8').read()
a = h.index('<script id="vfArNumJs">\n') + len('<script id="vfArNumJs">\n')
b = h.index('\n</script>\n</body>', a)
h = h[:a] + js + h[b:]

# 2. Police report names used Al Naser's label keys (Collections Detail / Cheque Clearance)
h = rep(h, "nameKey:'shell.label.4', known:true},\n  {id:'police-residential-occupancy'",
           "nameKey:'shell.label.p0', known:true},\n  {id:'police-residential-occupancy'", label='police key0')
h = rep(h, "name:'Residential Occupancy',  nameKey:'shell.label.5'", "name:'Residential Occupancy',  nameKey:'shell.label.p1'", label='police key1')
h = rep(h, '"shell.label.5": "Cheque Clearance",', '"shell.label.5": "Cheque Clearance",\n"shell.label.p0": "Commercial Leases",\n"shell.label.p1": "Residential Occupancy",', label='en keys')
h = rep(h, '"shell.label.5": "مقاصة الشيكات",', '"shell.label.5": "مقاصة الشيكات",\n"shell.label.p0": "عقود الإيجار التجارية",\n"shell.label.p1": "الإشغال السكني",', label='ar keys')

# 3. "largest group" must be the largest slice, not the first legend entry
h = rep(h,
    "var m = texts.filter(function(x){ return /\\(\\d+%\\)|\\(&lt;1%\\)|\\(<1%\\)/.test(x); })[0];\n      var name = texts.filter(function(x){ return x && !/total|%|requests|\\d/.test(x); })[0];\n",
    "var pcts = texts.filter(function(x){ return /\\(\\d+%\\)|\\(&lt;1%\\)|\\(<1%\\)/.test(x); });\n      var names = texts.filter(function(x){ return x && !/total|%|requests|\\d/.test(x); });\n      var bi = 0;\n      if(pcts.length && pcts.length === names.length){ var bv = -1; pcts.forEach(function(p, i){ var v = parseInt((p.match(/\\((\\d+)%\\)/) || [0, 0])[1], 10) || 0; if(v > bv){ bv = v; bi = i; } }); }\n      var m = pcts[bi], name = names[bi];\n",
    label='largest group')

open(dst, 'w', encoding='utf-8').write(h)
print('built', dst, len(h))
