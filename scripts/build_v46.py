"""v46 (not live): October 2026 for Awqaf (all four reports) on top of v45 (v44 + Arabic Request Type headings).
Reads Dashboard_RELEASE_v45.html and the four October workbooks, writes Dashboard_RELEASE_v46.html.
The October report pages are the September pages with only the baked-in data swapped (rows, column map, Summary,
Installment count sheet, Counts roster, snapshot date); every other month is left byte-identical."""
import os, sys, re, json, base64
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import verify_awqaf_month as V
from awqaf_month_rows import all_month, colmap, CC_FIELDS, RC_FIELDS

OCT = sys.argv[1] if len(sys.argv) > 1 else os.path.expanduser('~/Desktop/July 2026 Reports/October Awqaf ')
src = open('Dashboard_RELEASE_v45.html', encoding='utf-8').read()
M = all_month(OCT)

def put(h, name, value, opn, cls):
    lit = V.extract_js_literal(h, name, opn, cls); assert lit, name
    i = h.index('const %s = ' % name) + len('const %s = ' % name); assert h[i:i + len(lit)] == lit
    return h[:i] + json.dumps(value, ensure_ascii=False) + h[i + len(lit):]

def month_page(key, edit):
    h = V.extract_embedded_html(src, 'EMBEDDED_DASHBOARDS_SEPT', key)
    h = edit(h)
    a = 'const SNAPSHOT_BUILT_DATE = "2026-10-02";'; assert h.count(a) == 1, key
    h = h.replace(a, 'const SNAPSHOT_BUILT_DATE = "2026-11-08";')
    return base64.b64encode(h.encode('utf-8')).decode('ascii')

pages = {
 'bounced-cheques': month_page('bounced-cheques', lambda h: put(h, 'INITIAL_ROWS', M['bc'], '[', ']')),
 'new-lease': month_page('new-lease', lambda h: put(put(h, 'INITIAL_ROWS', M['nl'], '[', ']'), 'INITIAL_SUMMARY', M['summ'], '{', '}')),
 'count-report': month_page('count-report', lambda h: put(put(put(h, 'INITIAL_ROWS', M['cc'], '[', ']'), 'INITIAL_COLMAP', colmap(M['cc'][0], CC_FIELDS), '{', '}'), 'INITIAL_INSTALLMENT', M['inst'], '{', '}')),
 'request-count': month_page('request-count', lambda h: put(put(put(h, 'INITIAL_ROWS', M['rc'], '[', ']'), 'INITIAL_COLMAP', colmap(M['rc'][0], RC_FIELDS), '{', '}'), 'INITIAL_ROSTER', M['roster'], '{', '}')),
}
out = src
# 1) the October set, right after September's
i = out.index('const EMBEDDED_DASHBOARDS_SEPT = {'); j = out.index('\n};', i) + 3
block = '\nconst EMBEDDED_DASHBOARDS_OCT = {\n' + ',\n'.join('  "%s": "%s"' % kv for kv in pages.items()) + '\n};'
out = out[:j] + block + out[j:]

def rep(a, b, n=1):
    global out
    c = out.count(a); assert c == n, (c, a[:100]); out = out.replace(a, b)

# 2) month registration
rep("                ['2026-09', typeof EMBEDDED_DASHBOARDS_SEPT !== 'undefined' ? EMBEDDED_DASHBOARDS_SEPT : null]];",
    "                ['2026-09', typeof EMBEDDED_DASHBOARDS_SEPT !== 'undefined' ? EMBEDDED_DASHBOARDS_SEPT : null],\n                ['2026-10', typeof EMBEDDED_DASHBOARDS_OCT !== 'undefined' ? EMBEDDED_DASHBOARDS_OCT : null]];")
rep("    '2026-09': (typeof EMBEDDED_DASHBOARDS_SEPT !== 'undefined') ? EMBEDDED_DASHBOARDS_SEPT : null\n",
    "    '2026-09': (typeof EMBEDDED_DASHBOARDS_SEPT !== 'undefined') ? EMBEDDED_DASHBOARDS_SEPT : null,\n    '2026-10': (typeof EMBEDDED_DASHBOARDS_OCT !== 'undefined') ? EMBEDDED_DASHBOARDS_OCT : null\n")
rep("const MONTH_LABELS = { '2026-07': 'July 2026', '2026-08': 'August 2026', '2026-09': 'September 2026' };",
    "const MONTH_LABELS = { '2026-07': 'July 2026', '2026-08': 'August 2026', '2026-09': 'September 2026', '2026-10': 'October 2026' };")
rep("const MONTH_LABELS_AR = { '2026-07': 'يوليو 2026', '2026-08': 'أغسطس 2026', '2026-09': 'سبتمبر 2026' };",
    "const MONTH_LABELS_AR = { '2026-07': 'يوليو 2026', '2026-08': 'أغسطس 2026', '2026-09': 'سبتمبر 2026', '2026-10': 'أكتوبر 2026' };")
rep("  if(monthCode === '2026-09') return typeof EMBEDDED_DASHBOARDS_SEPT !== 'undefined';\n",
    "  if(monthCode === '2026-09') return typeof EMBEDDED_DASHBOARDS_SEPT !== 'undefined';\n  if(monthCode === '2026-10') return typeof EMBEDDED_DASHBOARDS_OCT !== 'undefined';\n")

# 3) Export Excel returns the original October workbooks
names = {'bounced-cheques': 'bounce', 'new-lease': 'new lease', 'count-report': 'cheque count', 'request-count': 'request count'}
import glob
orig = {}
for key, kw in names.items():
    p = [x for x in glob.glob(os.path.join(OCT, '*.xlsx')) if kw.split()[0] in os.path.basename(x).lower() and kw.split()[-1] in os.path.basename(x).lower()]
    assert len(p) == 1, (key, p)
    orig[key] = {'n': os.path.basename(p[0]), 'd': base64.b64encode(open(p[0], 'rb').read()).decode('ascii')}
a = '<script id="vfOriginals">window.__VF_ORIGINALS={"awqaf":{'
assert out.count(a) == 1; k = out.index(a); e = out.index('}};</script>', k)
out = out[:e] + ',"2026-10":' + json.dumps(orig, separators=(',', ':')) + out[e:]

# 4) What's New and the per-tab update notes
WN_OLD = '    { date: \'2026-10-16\', items: [\n    "September 2026 is loaded for all four Awqaf reports'
WN_NEW = ('    { date: \'2026-11-08\', items: [\n'
          '    "October 2026 is loaded for all four Awqaf reports (Cheque Count, Bounced Cheques, Lease Activity, Request Count) and cross-checked against the source workbooks.",\n'
          '    "October bounced cheques: 57 cheques worth AED 791K, 1.8% of recorded value, under the 2% target.",\n'
          '    "October includes one whole-building lease (CT-26-0068861) worth AED 22.1M, so recorded value, new-lease rent and fees are much higher than in other months.",\n'
          '    "The Request Type panel headings now show in Arabic.",\n'
          '    ]},\n') + WN_OLD
rep(WN_OLD, WN_NEW)
T = {
 'overview': ("October 2026 is included for Awqaf: 1,640 installments on 424 contracts, AED 43.31M recorded, 57 bounced cheques (1.8%).",
              "تم إدراج أكتوبر 2026 للأوقاف: 1,640 قسطاً على 424 عقداً، و43.31 مليون درهم مسجلة، و57 شيكاً مرتجعاً (1.8%)."),
 'execsummary': ("October 2026 is included, with the changes against September.", "تم إدراج أكتوبر 2026 مع التغيرات مقارنة بسبتمبر."),
 'compare': ("October 2026 is available in the comparisons.", "أصبح أكتوبر 2026 متاحاً في المقارنات."),
 'dataquality': ("October 2026 is checked across the four reports, and the cross-checks to review are listed here.", "تم فحص أكتوبر 2026 عبر التقارير الأربعة، وتُعرض هنا عمليات التحقق المتقاطع التي تحتاج مراجعة."),
 'lease-activity': ("October 2026: 493 lease contracts (479 renewals, 14 new).", "أكتوبر 2026: 493 عقد إيجار (479 تجديداً و14 جديداً)."),
 'request-count': ("October 2026: 419 requests worth AED 1.05M. The Request Type headings now show in Arabic.", "أكتوبر 2026: 419 طلباً بقيمة 1.05 مليون درهم. وتظهر عناوين نوع الطلب الآن بالعربية."),
 'new-lease': ("October 2026: 15 new leases, AED 22.87M rent value and AED 23.81M fees recorded, mostly one whole-building lease.", "أكتوبر 2026: 15 عقداً جديداً، بقيمة إيجار 22.87 مليون درهم ورسوم مسجلة 23.81 مليون درهم، معظمها من عقد مبنى كامل واحد."),
 'bounced-cheques': ("October 2026: 57 bounced cheques worth AED 791K, 1.8% of recorded value, under the 2% target.", "أكتوبر 2026: 57 شيكاً مرتجعاً بقيمة 791 ألف درهم، أي 1.8% من القيمة المسجلة، دون الهدف 2%."),
 'count-report': ("October 2026: 1,640 installments on 424 contracts, AED 43.31M recorded.", "أكتوبر 2026: 1,640 قسطاً على 424 عقداً، و43.31 مليون درهم مسجلة."),
}
for tab, (en, ar) in T.items():
    a = "    '%s': [\n" % tab
    rep(a, a + "      {date: '2026-11-08', items: [{en: %s, ar: %s}]},\n" % (json.dumps(en), json.dumps(ar, ensure_ascii=False)))

open('Dashboard_RELEASE_v46.html', 'w', encoding='utf-8').write(out)
print('wrote Dashboard_RELEASE_v46.html', len(src), '->', len(out))
