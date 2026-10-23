import json, sys
"""What's New / Awqaf Updates entries for v21 (folder check + property administrator's rules).
Usage: python3 update_whatsnew_week5.py <in.html> <out.html>"""
src, dst = sys.argv[1], sys.argv[2]
s = open(src, encoding='utf-8').read()
WN = [("New Check month folder (Chrome or Edge on a computer): pick a month's folder and the page compares the four Excel files with the numbers the dashboard shows now, including rows, totals, splits, blank columns and the report month. Nothing is loaded or changed, and the files stay in your browser.",
       "جديد: «فحص مجلد الشهر» (في Chrome أو Edge على الحاسوب): اختر مجلد الشهر وستقارن الصفحة ملفات Excel الأربعة بالأرقام المعروضة الآن في لوحة المعلومات، بما في ذلك الصفوف والإجماليات والتقسيمات والأعمدة الفارغة وشهر التقرير. لا يتم تحميل أو تغيير أي شيء، وتبقى الملفات في متصفحك."),
      ("Needs attention now follows the property administrator's rules: a tenant is flagged at more than 3 bounced cheques across the loaded months, and a high-value bounced cheque is a warning only because all bounced cheques have the same priority. Targets & trends notes that there are no fixed monthly targets.",
       "«يحتاج إلى متابعة» يتبع الآن قواعد مديرة الأملاك: يُشار إلى المستأجر عند أكثر من 3 شيكات مرتجعة عبر الأشهر المحمّلة، ويكون الشيك المرتجع عالي القيمة تنبيهًا فقط لأن جميع الشيكات المرتجعة بنفس الأولوية. وتوضح «الأهداف والاتجاهات» أنه لا توجد أهداف شهرية ثابتة.")]
def grp(ind):
    pad = ' ' * ind
    return pad + "{ date: '2026-10-23', items: [\n" + ",\n".join(pad + '  ' + json.dumps(e, ensure_ascii=False) for e, _ in WN) + "\n" + pad + "] },\n"
a = "const WHATS_NEW = [\n  { date: '2026-10-22'"; assert s.count(a) == 1
s = s.replace(a, "const WHATS_NEW = [\n" + grp(2) + "  { date: '2026-10-22'")
b = "'awqaf': [\n    { date: '2026-10-22'"; assert s.count(b) == 1
s = s.replace(b, "'awqaf': [\n" + grp(4) + "    { date: '2026-10-22'")
k = "const REMAINING_UI = {"; assert s.count(k) == 1
s = s.replace(k, k + ", ".join(json.dumps(e, ensure_ascii=False) + ": " + json.dumps(ar, ensure_ascii=False) for e, ar in WN) + ", ")
open(dst, 'w', encoding='utf-8').write(s)
print('ok', len(s))
