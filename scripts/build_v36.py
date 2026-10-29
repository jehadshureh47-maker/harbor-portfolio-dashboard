"""Build v36 from v35: python3 build_v35.py <in.html> <out.html>
Daily-activity chart: never invisible (dm-pre), Arabic labels/units/sources."""
import sys, os, re
src, dst = sys.argv[1], sys.argv[2]
here = os.path.dirname(os.path.abspath(__file__))
h = open(src, encoding='utf-8').read()
blocks = re.findall(r'const EMBEDDED_DASHBOARDS(?:_AUG|_SEPT)? = \{.*?\n\};', h, re.S)
assert len(blocks) == 3, len(blocks)

def rep(s, old, new, n=1):
    c = s.count(old); assert c == n, f'{old[:70]!r}: expected {n}, found {c}'
    return s.replace(old, new)
AR = "(currentLang === 'ar' ? %s : %s)"
h = rep(h, "{label: 'Installments', unit: 'installments', source: 'Cheque Count · rent installments per day',",
  "{label: " + AR % ("'الأقساط'", "'Installments'") + ", unit: " + AR % ("'قسطاً'", "'installments'") + ", source: " + AR % ("'عدد الشيكات · أقساط الإيجار يومياً'", "'Cheque Count · rent installments per day'") + ",")
h = rep(h, "{label: 'Contracts', unit: 'contracts', source: 'Cheque Count · contracts per day (on their first installment)',",
  "{label: " + AR % ("'العقود'", "'Contracts'") + ", unit: " + AR % ("'عقداً'", "'contracts'") + ", source: " + AR % ("'عدد الشيكات · العقود يومياً (عند أول قسط)'", "'Cheque Count · contracts per day (on their first installment)'") + ",")
h = rep(h, "source: 'Bounced Cheques · per day', daily: bc.daily",
  "source: " + AR % ("'الشيكات المرتجعة · يومياً'", "'Bounced Cheques · per day'") + ", daily: bc.daily")
js = open(os.path.join(here, 'vf_arnum.js'), encoding='utf-8').read() + '\n' + open(os.path.join(here, 'vf_v35.js'), encoding='utf-8').read()
m = '<script id="vfArNumJs">\n'
a = h.index(m) + len(m); b = h.index('\n</script>\n</body>', a)
h = h[:a] + js + h[b:]
for blk in blocks:
    assert h.count(blk) == 1, 'an existing embedded block changed'
open(dst, 'w', encoding='utf-8').write(h)
print('built', dst, len(h))
