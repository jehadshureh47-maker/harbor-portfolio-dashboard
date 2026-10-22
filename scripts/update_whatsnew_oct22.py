import json, sys
src, dst = sys.argv[1], sys.argv[2]
s = open(src, encoding='utf-8').read()
WN = [
 ("Export Excel on every report tab: it downloads the month's original Excel file, with all its sheets and columns, or the file you loaded yourself.",
  "تصدير إلى Excel في كل تقرير: يحمّل ملف Excel الأصلي للشهر بجميع أوراقه وأعمدته، أو الملف الذي حمّلته بنفسك."),
 ("Click any figure on a report tab to see the contracts behind it. Each list checks itself against the figure and shows a green tick when they match. Click a contract number to see everything about that contract across the four reports, and use the Contract number box at the top of each report to jump straight to one.",
  "انقر على أي رقم في تبويب التقرير لعرض العقود التي يتكوّن منها. تتحقق كل قائمة من نفسها مقابل الرقم وتُظهر علامة خضراء عند التطابق. انقر على رقم العقد لرؤية كل ما يخصه في التقارير الأربعة، واستخدم خانة رقم العقد أعلى كل تقرير للانتقال إليه مباشرة."),
 ("The dashboard now reopens on the portfolio, month and tab you were last viewing.",
  "تُعيد اللوحة فتح المحفظة والشهر والتبويب الذي كنت تعرضه آخر مرة."),
]
PU = [
 ("Every headline figure on the Awqaf report tabs for August and September now opens the list of contracts behind it, checked against the figure itself.",
  "كل رقم رئيسي في تبويبات تقارير الأوقاف لشهري أغسطس وسبتمبر يفتح الآن قائمة العقود التي يتكوّن منها، بعد التحقق منها مقابل الرقم نفسه."),
 ("Export Excel on the Awqaf reports returns the original August and September workbooks, so the sheets and columns match the files you keep.",
  "يعيد تصدير Excel في تقارير الأوقاف ملفات أغسطس وسبتمبر الأصلية، فتتطابق الأوراق والأعمدة مع الملفات التي تحتفظون بها."),
]
def js(items): return ",\n".join("    " + json.dumps(e, ensure_ascii=False) for e, _ in items)
a = "const WHATS_NEW = [\n"
assert s.count(a) == 1
s = s.replace(a, a + "  { date: '2026-10-22', items: [\n" + js(WN) + ",\n  ]},\n")
b = "  'awqaf': [\n"
assert s.count(b) == 1
s = s.replace(b, b + "    { date: '2026-10-22', items: [\n" + js(PU).replace("    ", "      ", 0) + ",\n    ]},\n")
k = "const REMAINING_UI = {"
assert s.count(k) == 1
add = ", ".join(json.dumps(e, ensure_ascii=False) + ": " + json.dumps(ar, ensure_ascii=False) for e, ar in WN + PU)
s = s.replace(k, k + add + ", ")
open(dst, 'w', encoding='utf-8').write(s)
