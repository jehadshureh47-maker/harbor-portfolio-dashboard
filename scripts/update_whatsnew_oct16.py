import json, sys
src, dst = sys.argv[1], sys.argv[2]
s = open(src, encoding='utf-8').read()
WN = [
 ("New TV button in the header: a full-screen wallboard for an office screen that rotates through Overview, Bounced cheques, Leasing and Requests every 20 seconds, in English or Arabic. Press Esc to exit.",
  "زر جديد للتلفاز في الأعلى: شاشة عرض كاملة لشاشة المكتب تتنقل كل 20 ثانية بين النظرة العامة والشيكات المرتجعة والتأجير والطلبات، بالإنجليزية أو العربية. اضغط Esc للخروج."),
 ("Charts now animate in: bars grow, donuts sweep and trend lines draw when a tab opens, when you switch a filter or chip, and as you scroll down to them. Fast scrolling skips the animation, and it is turned off for reduced-motion settings and printing.",
  "أصبحت الرسوم البيانية متحركة: تنمو الأعمدة وتدور الرسوم الدائرية وتُرسم خطوط الاتجاه عند فتح التبويب أو تبديل المرشح أو عند التمرير إليها. يتخطى التمرير السريع الحركة، وتُعطّل عند تفعيل خيار تقليل الحركة وعند الطباعة."),
 ("The dashboard now loads without the page jumping around: the Overview and data-health areas keep their space while the reports load.",
  "تُحمَّل اللوحة الآن دون قفز في الصفحة: تحتفظ النظرة العامة وحالة البيانات بمساحتها أثناء تحميل التقارير."),
]
PU = [
 ("September 2026 is loaded for all four Awqaf reports (Cheque Count, Bounced Cheques, Lease Activity, Request Count) and cross-checked against the source workbooks.",
  "تم تحميل بيانات سبتمبر 2026 لتقارير الأوقاف الأربعة (عدد الشيكات والشيكات المرتجعة ونشاط التأجير وعدد الطلبات) والتحقق منها مقابل ملفات المصدر."),
 ("September bounced cheques: 31 cheques worth AED 415K, 1.8% of recorded value, under the 2% target.",
  "الشيكات المرتجعة في سبتمبر: 31 شيكاً بقيمة 415 ألف درهم، أي 1.8% من القيمة المسجلة، وهي دون الهدف البالغ 2%."),
 ("Lease Activity: 515 lease contracts (501 renewals, 14 new), with AED 785K annual rent on the new leases, up from 11 new leases in the previous period.",
  "نشاط التأجير: 515 عقد إيجار (501 تجديد و14 جديداً)، بإيجار سنوي 785 ألف درهم للعقود الجديدة، مقابل 11 عقداً جديداً في الفترة السابقة."),
]
def js(items): return ",\n".join("    " + json.dumps(e, ensure_ascii=False) for e, _ in items)
a = "const WHATS_NEW = [\n"
assert s.count(a) == 1
s = s.replace(a, a + "  { date: '2026-10-16', items: [\n" + js(WN) + ",\n  ]},\n")
b = "  'awqaf': [\n"
assert s.count(b) == 1
s = s.replace(b, b + "    { date: '2026-10-16', items: [\n" + js(PU).replace("    ", "      ", 0) + ",\n    ]},\n")
k = "const REMAINING_UI = {"
assert s.count(k) == 1
add = ", ".join(json.dumps(e, ensure_ascii=False) + ": " + json.dumps(ar, ensure_ascii=False) for e, ar in WN + PU)
s = s.replace(k, k + add + ", ")
open(dst, 'w', encoding='utf-8').write(s)
