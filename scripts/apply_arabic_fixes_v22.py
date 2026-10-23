"""Apply the reviewed Arabic corrections: python3 apply_arabic_fixes_v22.py <in.html> <out.html>
Position-based fixes come from arabic_fixes_v22.json (positions refer to the v21 file); each is applied only if the
current text is found at that position. Then a small set of terminology-wide replacements."""
import json, os, sys
src, dst = sys.argv[1], sys.argv[2]
here = os.path.dirname(os.path.abspath(__file__))
h = open(src, encoding='utf-8').read()
fixes = json.load(open(os.path.join(here, 'arabic_fixes_v22.json'), encoding='utf-8'))
ok = bad = 0
for f in sorted(fixes, key=lambda f: -f['pos']):
    a = f['pos'] + 1; cur = f['current']
    if h[a:a + len(cur)] == cur:
        h = h[:a] + f['suggested'] + h[a + len(cur):]; ok += 1
    else:
        bad += 1; print('NO MATCH at', f['pos'], repr(cur[:50]))
print('position fixes applied', ok, 'not matched', bad)
G = [('الارتداد', 'الارتجاع'), ('يحتاج إلى متابعة', 'يتطلب الانتباه'), ('يحتاج إلى اهتمام', 'يتطلب الانتباه'),
     ('تستدعي الانتباه', 'تتطلب الانتباه'), ('يستدعي الانتباه', 'يتطلب الانتباه'), ('مديرة الأملاك', 'إدارة الأملاك'),
     ('نادي الناصر', 'نادي النصر'), ('مع أوقاف والناصر كلوب', 'مع الأوقاف ونادي النصر'),
     ('تحصيل الشيكات', 'مقاصة الشيكات'), ('ملف العمل', 'المصنّف'), ('ملفات العمل', 'المصنّفات'),
     ('حزمة المجلس', 'حزمة مجلس الإدارة'), ('1,609 دفعات', '1,609 قسطاً')]
for a, b in G:
    n = h.count(a); h = h.replace(a, b); print('global', a, '->', b, n)
open(dst, 'w', encoding='utf-8').write(h)
print('built', dst, len(h))
