"""Build trial v21: python3 build_trial_v21.py <in.html> <out.html>
1. Injects scripts/vf_intake.js (read-only "Check month folder") after the audit trail script (vfAuditJs).
2. Replaces the shipped Needs-attention script (vfWeek3) with the updated scripts/vf_week3.js
   (property administrator's rules: more than 3 bounces across loaded months, top-% bounce is a warning only).
3. Adds the 'Low' risk pill style to the vfWeek3Css block. Nothing else changes."""
import sys, os
src, dst = sys.argv[1], sys.argv[2]
here = os.path.dirname(os.path.abspath(__file__))
h = open(src, encoding='utf-8').read()
intake = open(os.path.join(here, 'vf_intake.js'), encoding='utf-8').read()
w3 = open(os.path.join(here, 'vf_week3.js'), encoding='utf-8').read()
assert 'id="vfAuditJs"' in h and 'id="vfIntakeJs"' not in h

# 2. swap the week 3 script body (exactly one block)
a = h.find('<script id="vfWeek3">'); assert a >= 0 and h.find('<script id="vfWeek3">', a + 1) < 0
b = h.find('</script>', a); assert b > a
h = h[:a] + '<script id="vfWeek3">\n' + w3 + '\n' + h[b:]

# 3. Low pill style, appended to the week 3 style block
c = h.find('<style id="vfWeek3Css">'); assert c >= 0
d = h.find('</style>', c); assert d > c
low = '.vf-risk-low{background:rgba(147,160,189,.14);color:var(--sub,#93a0bd);border:1px solid rgba(147,160,189,.4)}\n'
h = h[:d] + low + h[d:]

# 4. Targets & trends: note that management has no fixed targets (patched into the SHIPPED vfWeek4 block, which carries the cursor fix)
src4 = open(os.path.join(here, 'vf_week4.js'), encoding='utf-8').read()
n1 = "wrap.appendChild(el('div', 'vf-risk-note', tr('Targets are typed by you and kept in this browser only."
n2 = "    'Targets are typed by you and kept in this browser only. Trends and the year-to-date column get richer as more months are loaded.':"
i1 = src4.find("wrap.appendChild(el('div', 'vf-risk-note', tr('There are no fixed monthly targets"); assert i1 >= 0
note_line = src4[i1:src4.find('\n', i1)].strip()
i2 = src4.find("    'There are no fixed monthly targets"); assert i2 >= 0
ar_line = src4[i2:src4.find('\n', i2)] + '\n'
e = h.find('<script id="vfWeek4">'); assert e >= 0
f = h.find('</script>', e); blk = h[e:f]
assert blk.count(n1) == 1 and blk.count(n2) == 1
blk = blk.replace(n1, note_line + '\n      ' + n1).replace(n2, ar_line + n2)
h = h[:e] + blk + h[f:]

# 1. intake script after the audit script
tail = '</script>\n</body>'
j = h.rindex(tail)
h = h[:j] + '</script>\n<script id="vfIntakeJs">\n' + intake + '\n</script>\n</body>' + h[j + len(tail):]
open(dst, 'w', encoding='utf-8').write(h)
print('built', dst, len(h))
