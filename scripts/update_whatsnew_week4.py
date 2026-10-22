import json, sys
src, dst = sys.argv[1], sys.argv[2]
s = open(src, encoding='utf-8').read()
WN = [("New Targets & trends on the Executive Summary: set a target for each key figure and see how the month and the recent trend compare against it.",
       "جديد: «الأهداف والاتجاهات» في الملخص التنفيذي: حدّد هدفًا لكل رقم رئيسي وشاهد كيف يقارن الشهر والاتجاه الأخير به."),
      ("Panels now open in the centre of the screen, like What's New.",
       "تُفتح اللوحات الآن في وسط الشاشة، مثل «الجديد»."),
      ("Buttons are tidied across every tab: same style, same order, Print / Export PDF moved into the top row, and no more empty gaps.",
       "تم ترتيب الأزرار في كل التبويبات: شكل واحد وترتيب واحد، ونُقل زر الطباعة / تصدير PDF إلى الصف العلوي، دون فراغات.")]
PU = [WN[0]]
def js(items, ind): return ",\n".join(ind + json.dumps(e, ensure_ascii=False) for e, _ in items)
a = "const WHATS_NEW = [\n  { date: '2026-10-22', items: [\n"; assert s.count(a) == 1
s = s.replace(a, a + js(WN, "    ") + ",\n")
b = "  'awqaf': [\n    { date: '2026-10-22', items: [\n"; assert s.count(b) == 1
s = s.replace(b, b + js(PU, "      ") + ",\n")
k = "const REMAINING_UI = {"; assert s.count(k) == 1
s = s.replace(k, k + ", ".join(json.dumps(e, ensure_ascii=False) + ": " + json.dumps(ar, ensure_ascii=False) for e, ar in WN) + ", ")
t = "'execsummary': [\n      {date: '2026-10-16'"; assert s.count(t) == 1
tgt = {"en": WN[0][0], "ar": WN[0][1]}
tdy = {"en": "Buttons are tidied: Copy summary, Print / Export PDF, Targets & trends and Updates sit on one row.", "ar": "تم ترتيب الأزرار: نسخ الملخص وطباعة / تصدير PDF والأهداف والاتجاهات والتحديثات في صف واحد."}
s = s.replace(t, "'execsummary': [\n      {date: '2026-10-22', items: [" + json.dumps(tgt, ensure_ascii=False) + ", " + json.dumps(tdy, ensure_ascii=False) + "]},\n      {date: '2026-10-16'")
open(dst, 'w', encoding='utf-8').write(s)
