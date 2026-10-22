import json, sys
src, dst = sys.argv[1], sys.argv[2]
s = open(src, encoding='utf-8').read()
WN = [("New Load history on Data Quality: every Excel file loaded in this browser is logged with when, which report, the file name, month, rows, how it read and who loaded it. It is kept in this browser and included in Backup.",
       "جديد: «سجل التحميل» في جودة البيانات: يُسجَّل كل ملف Excel يتم تحميله في هذا المتصفح (الوقت والتقرير واسم الملف والشهر والصفوف ونتيجة القراءة ومن حمّله). يُحفظ في هذا المتصفح ويُضمَّن في النسخة الاحتياطية."),
      ("Fixed: a Backup could fail to restore because of a leftover saved portfolio. Backups now include only the current portfolios.",
       "تم الإصلاح: كان يتعذّر أحيانًا استعادة النسخة الاحتياطية بسبب محفظة قديمة محفوظة. أصبحت النسخ الاحتياطية تتضمن المحافظ الحالية فقط."),
      ("Fixed: typing a target in Targets & trends no longer jumps the cursor when you move to the next field.",
       "تم الإصلاح: لم يعد المؤشر يقفز عند الانتقال إلى الحقل التالي أثناء إدخال الأهداف في «الأهداف والاتجاهات».")]
DQ = {"en": WN[0][0], "ar": WN[0][1]}
def js(items, ind): return ",\n".join(ind + json.dumps(e, ensure_ascii=False) for e, _ in items)
a = "const WHATS_NEW = [\n  { date: '2026-10-22', items: [\n"; assert s.count(a) == 1
s = s.replace(a, a + js(WN, "    ") + ",\n")
b = "  'awqaf': [\n    { date: '2026-10-22', items: [\n"; assert s.count(b) == 1
s = s.replace(b, b + js(WN[:1], "      ") + ",\n")
k = "const REMAINING_UI = {"; assert s.count(k) == 1
s = s.replace(k, k + ", ".join(json.dumps(e, ensure_ascii=False) + ": " + json.dumps(ar, ensure_ascii=False) for e, ar in WN) + ", ")
t = "'dataquality': [\n      {date: '2026-10-16'"; assert s.count(t) == 1
s = s.replace(t, "'dataquality': [\n      {date: '2026-10-22', items: [" + json.dumps(DQ, ensure_ascii=False) + "]},\n      {date: '2026-10-16'")
open(dst, 'w', encoding='utf-8').write(s)
print('ok', len(s))
