import json, sys
src, dst = sys.argv[1], sys.argv[2]
s = open(src, encoding='utf-8').read()
WN = [("New Needs attention button on each report tab: a list of leases ending soon with no renewal and bounced cheques that stand out, ranked by risk and explained line by line. The rules are defaults and can be changed in the panel.",
       "زر جديد «يحتاج إلى متابعة» في كل تبويب تقرير: قائمة بالعقود القريبة من الانتهاء دون تجديد والشيكات المرتجعة اللافتة، مرتبة حسب الخطورة مع شرح السبب. القواعد افتراضية ويمكن تغييرها من اللوحة."),
      ("The buttons at the top of each report now sit in the same order on every tab, with Updates always last.",
       "أصبحت الأزرار أعلى كل تقرير بالترتيب نفسه في كل تبويب، ويأتي زر التحديثات دائمًا في الآخر.")]
PU = [WN[0]]
def js(items, ind): return ",\n".join(ind + json.dumps(e, ensure_ascii=False) for e, _ in items)
a = "const WHATS_NEW = [\n  { date: '2026-10-22', items: [\n"; assert s.count(a) == 1
s = s.replace(a, a + js(WN, "    ") + ",\n")
b = "  'awqaf': [\n    { date: '2026-10-22', items: [\n"; assert s.count(b) == 1
s = s.replace(b, b + js(PU, "      ") + ",\n")
k = "const REMAINING_UI = {"; assert s.count(k) == 1
s = s.replace(k, k + ", ".join(json.dumps(e, ensure_ascii=False) + ": " + json.dumps(ar, ensure_ascii=False) for e, ar in WN) + ", ")
open(dst, 'w', encoding='utf-8').write(s)
