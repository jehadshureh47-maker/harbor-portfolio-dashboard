"""Build v33 from v32: python3 build_v33.py <v32.html> <out.html>
Adds Dubai Court as a real portfolio inside the main dashboard (3 report tabs + Overview / Executive Summary / Compare
/ cross-checks), using the same report CSS and components as the Awqaf report pages. Every patch is count-asserted.
The existing EMBEDDED_DASHBOARDS / _AUG / _SEPT blocks are never touched (checked byte-for-byte at the end).
Data comes from scripts/court_data.json (built from For Data.xlsx); control figures from scripts/court_control.json
(scripts/court_independent.py recounts them straight from the workbook; verify_court_data.py compares them)."""
import sys, os, re, json, base64, hashlib

src, dst = sys.argv[1], sys.argv[2]
here = os.path.dirname(os.path.abspath(__file__))
def rd(name): return open(os.path.join(here, name), encoding='utf-8').read()
h = open(src, encoding='utf-8').read()
assert hashlib.md5(h.encode('utf-8')).hexdigest()[:12] == '85623bb57834', 'input is not v32'

def rep(s, old, new, n=1):
    c = s.count(old); assert c == n, f'{old[:60]!r}: expected {n}, found {c}'
    return s.replace(old, new)

# ---------------------------------------------------------------- data + strings
D = json.load(open(os.path.join(here, 'court_data.json'), encoding='utf-8'))
CTL = json.load(open(os.path.join(here, 'court_control.json'), encoding='utf-8'))
assert CTL['asof'] == D['asof']
I = json.load(open(os.path.join(here, 'court_i18n_base.json'), encoding='utf-8'))
EXTRA = {
 'en': {
  't_occ': 'Dubai Court — Occupancy & Renewals', 's_occ': 'Units, occupancy and lease renewals by portfolio and property',
  't_coll': 'Dubai Court — Collections', 's_coll': 'Rent collected, cheques, other income and uncollected amounts (on hold and bounced shown separately) by portfolio and property',
  't_dist': 'Dubai Court — Distributions & Expenses', 's_dist': 'Distributions to owners and expenses, for the month and year to date, by portfolio and property',
  'period': 'Period', 'print': 'Print / Export PDF', 'keyMetrics': 'Key Metrics', 'dataAsOf': 'Data as of',
  'src': 'from the Dubai Courts workbook (Master Sheet, Payments, Expenses)',
  'statusNote': 'Click ▸ next to a portfolio to open its properties. Use the portfolio filter and the search box to narrow the table.',
  'dqFlag': 'Source data quality flag: ',
  'noUnitsWarn': '{n} payment rows belong to properties with no unit list in the Master Sheet, so those properties are not counted here (see Data quality).',
  'mtdWarn': 'This month is not complete: the data runs to {d}.',
  'toggle': 'Show or hide properties', 'noData': 'No data for this selection.', 'noUncol': 'Nothing is uncollected for this selection.',
  'cUncol': 'Uncollected: on hold, bounced and other pending',
 },
 'ar': {
  't_occ': 'محكمة دبي — الإشغال والتجديدات', 's_occ': 'الوحدات والإشغال وتجديدات الإيجار حسب المحفظة والعقار',
  't_coll': 'محكمة دبي — التحصيلات', 's_coll': 'الإيجار المحصّل والشيكات والإيرادات الأخرى والمبالغ غير المحصّلة (المعلّقة والمرتجعة منفصلتان) حسب المحفظة والعقار',
  't_dist': 'محكمة دبي — التوزيعات والمصروفات', 's_dist': 'التوزيعات على الملّاك والمصروفات، للشهر ومنذ بداية العام، حسب المحفظة والعقار',
  'period': 'الفترة', 'print': 'طباعة / تصدير PDF', 'keyMetrics': 'المؤشرات الرئيسية', 'dataAsOf': 'البيانات حتى',
  'src': 'من مصنّف محاكم دبي (الورقة الرئيسية، الدفعات، المصروفات)',
  'statusNote': 'اضغط ▸ بجانب المحفظة لعرض عقاراتها. استخدم مرشح المحفظة ومربع البحث لتضييق الجدول.',
  'dqFlag': 'علامة جودة بيانات المصدر: ',
  'noUnitsWarn': '{n} صفاً من الدفعات تخص عقارات ليس لها قائمة وحدات في الورقة الرئيسية، لذلك لا تُحتسب هنا (راجع جودة البيانات).',
  'mtdWarn': 'هذا الشهر غير مكتمل: البيانات متاحة حتى {d}.',
  'toggle': 'إظهار العقارات أو إخفاؤها', 'noData': 'لا توجد بيانات لهذا الاختيار.', 'noUncol': 'لا يوجد مبلغ غير محصّل لهذا الاختيار.',
  'cUncol': 'غير المحصّل: معلّق ومرتجع وقيد التحصيل',
 },
}
for lg in ('en', 'ar'):
    for k, v in EXTRA[lg].items():
        assert k not in I['L'][lg] or k in ('period',), k
        I['L'][lg][k] = v
assert set(EXTRA['en']) == set(EXTRA['ar'])
I['L']['en'].pop('dqText', None)

def jscript(obj):
    return json.dumps(obj, ensure_ascii=False, separators=(',', ':')).replace('</', '<\\/').replace('<!--', '<\\!--')

SLICE = {
 'occ': ['asof', 'defaultMonth', 'months', 'lls', 'props', 'units', 'dq'],
 'coll': ['asof', 'defaultMonth', 'months', 'lls', 'props', 'collFields', 'coll', 'dq'],
 'dist': ['asof', 'defaultMonth', 'months', 'lls', 'props', 'expFields', 'exp', 'expc', 'cats', 'dq'],
}
BASE_CSS = rd('court_base.css') + '\n' + rd('court_report.css')
RUNTIME = rd('court_report.js')
PRINT_SVG = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>'

def page_html(page):
    extra_tools = ''
    if page == 'occ': extra_tools = '<label id="lblUp" for="selUp"></label><select id="selUp"></select>'
    if page == 'coll': extra_tools = '<label id="lblUb" for="selUb"></label><select id="selUb"></select>'
    data = {k: D[k] for k in SLICE[page]}
    js = RUNTIME.replace("'__PAGE__'", "'" + page + "'")
    assert js != RUNTIME
    return f'''<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Dubai Court</title>
<style>
{BASE_CSS}
</style>
</head>
<body>

<header>
  <div>
    <h1 id="ttl"></h1>
    <div class="sub" id="subttl"></div>
  </div>
  <div class="header-actions">
    <div class="period" id="periodLabel"></div>
    <button class="btn secondary" id="printBtn">{PRINT_SVG}<span id="printTxt"></span></button>
    <div class="print-generated" id="printGenerated"></div>
    <a class="print-report-link" id="printReportLink"></a>
  </div>
</header>

<div class="toolbar">
  <div class="tools">
    <label id="lblScope" for="selScope"></label><select id="selScope"></select>
    <input type="search" id="q" autocomplete="off">
    {extra_tools}
    <button class="btn secondary" id="bExp" type="button"></button>
    <button class="btn secondary" id="bCol" type="button"></button>
    <button class="btn secondary" id="bCsv" type="button"></button>
  </div>
  <div class="status" id="statusMsg"></div>
</div>
<div class="data-quality-note" id="dqNote" style="display:none;"></div>

<div class="section-head">
  <h3 id="kpiHead"></h3>
  <div class="desc" id="kpiDesc"></div>
</div>
<div class="kpis" id="kpis"></div>

<div class="grid" id="cards"></div>

<footer id="footerNote"></footer>

<script id="dcData" type="application/json">{jscript(data)}</script>
<script id="dcI18n" type="application/json">{jscript({'L': I['L'], 'DEFS': I['DEFS'], 'DQAR': I['DQAR']})}</script>
<script>
{js}
</script>
</body>
</html>
'''

EMBED = {}
for pid, page in (('court-occupancy', 'occ'), ('court-collections', 'coll'), ('court-distributions', 'dist')):
    ph = page_html(page)
    assert "'__PAGE__'" not in ph and ph.count("var MONTH = '__COURT_MONTH__'") == 1
    EMBED[pid] = base64.b64encode(ph.encode('utf-8')).decode('ascii')

# ---------------------------------------------------------------- selector note (one text node, <140 chars, month-agnostic)
import datetime
ad = datetime.date.fromisoformat(D['asof'])
MON = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
MONAR = ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر']
NOTE_EN = f'Dubai Court — occupancy, collections, distributions and expenses from the Dubai Courts workbook, data to {ad.day} {MON[ad.month-1]} {ad.year}.'
NOTE_AR = f'محكمة دبي — الإشغال والتحصيلات والتوزيعات والمصروفات من مصنّف محاكم دبي، البيانات حتى {ad.day} {MONAR[ad.month-1]} {ad.year}.'
assert len(NOTE_EN) < 140

shell = rd('court_shell.js')
shell = rep(shell, '__COURT_EMBED__', json.dumps(EMBED, separators=(',', ':')))
shell = rep(shell, '__COURT_CONTROL__', json.dumps({'units': CTL['units'], 'months': CTL['months']}, separators=(',', ':')))
shell = rep(shell, '__COURT_NOTE__', json.dumps(NOTE_EN, ensure_ascii=False))
assert '__COURT_' not in shell

# ---------------------------------------------------------------- existing embedded blocks (byte-identity check later)
blocks = re.findall(r'const EMBEDDED_DASHBOARDS(?:_AUG|_SEPT)? = \{.*?\n\};', h, re.S)
assert len(blocks) == 3, len(blocks)

# ---------------------------------------------------------------- shell patches
# 1/2. tabs for court ids are embedded iframes too
h = rep(h, "function renderPaneShell(r){\n  if(EMBEDDED_DASHBOARDS[r.id]){", "function renderPaneShell(r){\n  if(EMBEDDED_DASHBOARDS[r.id] || (window.__courtSet && window.__courtSet[r.id])){")
h = rep(h, "function wirePane(pane, r){\n  if(EMBEDDED_DASHBOARDS[r.id]){", "function wirePane(pane, r){\n  if(EMBEDDED_DASHBOARDS[r.id] || (window.__courtSet && window.__courtSet[r.id])){")
# 3. mount: the court pages come from their own set and receive the selected month
h = rep(h, "  const monthMap = (monthSet && monthSet[r.id]) ? monthSet : EMBEDDED_DASHBOARDS;\n  iframe.srcdoc = window.__v8PatchReport ? window.__v8PatchReport(base64ToUtf8(monthMap[r.id]), r.id) : base64ToUtf8(monthMap[r.id]);",
"  const isCourt = !!(window.__courtSet && window.__courtSet[r.id]);\n  const monthMap = isCourt ? window.__courtSet : ((monthSet && monthSet[r.id]) ? monthSet : EMBEDDED_DASHBOARDS);\n  let __html = base64ToUtf8(monthMap[r.id]);\n  if(isCourt) __html = __html.split('__COURT_MONTH__').join(currentMonth);\n  iframe.srcdoc = window.__v8PatchReport ? window.__v8PatchReport(__html, r.id) : __html;")
# 4. months offered for Dubai Court (July is already true above this line)
h = rep(h, "  if(portfolioKey !== 'awqaf') return false;", "  if(portfolioKey === 'dubai-court') return monthCode === '2026-08' || monthCode === '2026-09';\n  if(portfolioKey !== 'awqaf') return false;")
# 5. same client-side PIN gate as every other configured portfolio
h = rep(h, "  'police': '6776',\n};", "  'police': '6776',\n  'dubai-court': '6776',\n};")
# 6. tab labels (Arabic through the same dictionary mechanism as the Awqaf tabs)
h = rep(h, '"rta-occupancy": "shell.label.0",', '"rta-occupancy": "shell.label.0",\n"court-occupancy": "shell.label.c0",\n"court-collections": "shell.label.c1",\n"court-distributions": "shell.label.c2",')
h = rep(h, '"shell.label.0": "Asset Occupancy",', '"shell.label.0": "Asset Occupancy",\n"shell.label.c0": "Occupancy & Renewals",\n"shell.label.c1": "Collections",\n"shell.label.c2": "Distributions & Expenses",')
h = rep(h, '"shell.label.0": "إشغال الأصول",', '"shell.label.0": "إشغال الأصول",\n"shell.label.c0": "الإشغال والتجديدات",\n"shell.label.c1": "التحصيلات",\n"shell.label.c2": "التوزيعات والمصروفات",')
# 7. cross-check names
h = rep(h, "    'cc.waitingDetail': 'Waiting for both dashboards to finish loading…',",
"    'cc.waitingDetail': 'Waiting for both dashboards to finish loading…',\n    'cc.court.units.name': 'Unit counts add up and match the Master Sheet',\n    'cc.court.coll.name': 'Collections match an independent recount of the Payments sheet',\n    'cc.court.dist.name': 'Distributions and expenses match an independent recount of the Expenses sheet',")
h = rep(h, "    'cc.waitingDetail': 'بانتظار انتهاء تحميل كلتا اللوحتين…',",
"    'cc.waitingDetail': 'بانتظار انتهاء تحميل كلتا اللوحتين…',\n    'cc.court.units.name': 'أعداد الوحدات متسقة وتطابق الورقة الرئيسية',\n    'cc.court.coll.name': 'التحصيلات تطابق إعادة احتساب مستقلة لورقة الدفعات',\n    'cc.court.dist.name': 'التوزيعات والمصروفات تطابق إعادة احتساب مستقلة لورقة المصروفات',")
# 8. the portfolio itself (PORTFOLIOS is defined just above this line)
h = rep(h, "let currentPortfolio = 'awqaf';", shell + "\nlet currentPortfolio = 'awqaf';")
# 9. display names for the loading cards
h = rep(h, "[...REPORTS_AWQAF, ...REPORTS_ALNASER, ...REPORTS_RTA].forEach(r => { REPORT_DISPLAY_NAMES[r.id] = r.name; });", "[...REPORTS_AWQAF, ...REPORTS_ALNASER, ...REPORTS_RTA, ...REPORTS_COURT].forEach(r => { REPORT_DISPLAY_NAMES[r.id] = r.name; });")
# 10. What's New + portfolio updates (English; Arabic through REMAINING_UI)
WN_EN = "New Dubai Court portfolio: three tabs (Occupancy & Renewals, Collections, Distributions & Expenses) built from the Dubai Courts workbook, where each portfolio opens into its properties. Amounts on hold and bounced cheques are shown separately."
WN_AR = "محفظة محاكم دبي الجديدة: ثلاثة تبويبات (الإشغال والتجديدات، التحصيلات، التوزيعات والمصروفات) مبنية من مصنّف محاكم دبي، وتنفتح كل محفظة على عقاراتها. تُعرض المبالغ المعلّقة والشيكات المرتجعة منفصلة."
PU_EN = "Added Dubai Court as a full portfolio: Occupancy & Renewals, Collections, and Distributions & Expenses, with the properties listed under each portfolio."
PU_AR = "أُضيفت محاكم دبي كمحفظة كاملة: الإشغال والتجديدات، والتحصيلات، والتوزيعات والمصروفات، مع عرض العقارات تحت كل محفظة."
h = rep(h, "const WHATS_NEW = [\n", "const WHATS_NEW = [\n  { date: '2026-10-29', items: [\n    " + json.dumps(WN_EN, ensure_ascii=False) + ",\n  ] },\n")
h = rep(h, "const PORTFOLIO_UPDATES = {\n", "const PORTFOLIO_UPDATES = {\n  'dubai-court': [\n    { date: '2026-10-29', items: [\n      " + json.dumps(PU_EN, ensure_ascii=False) + ",\n    ]},\n  ],\n")
h = rep(h, "const REMAINING_UI = {", "const REMAINING_UI = {" + json.dumps(WN_EN, ensure_ascii=False) + ": " + json.dumps(WN_AR, ensure_ascii=False) + ", " + json.dumps(PU_EN, ensure_ascii=False) + ": " + json.dumps(PU_AR, ensure_ascii=False) + ", ")

# ---------------------------------------------------------------- Arabic layer (scripts/vf_arnum.js, now with the court selector-note rule)
js = rd('vf_arnum.js')
key = NOTE_EN.lower()
assert ("'" + key + "':'" + NOTE_AR + "'") in js, 'vf_arnum.js is missing the Dubai Court note rule for ' + key
m = '<script id="vfArNumJs">\n'
a = h.index(m) + len(m); b = h.index('\n</script>\n</body>', a)
h = h[:a] + js + h[b:]

# ---------------------------------------------------------------- checks
for blk in blocks:
    assert h.count(blk) == 1, 'an existing embedded block changed'
assert h.count('window.__courtSet') >= 5
open(dst, 'w', encoding='utf-8').write(h)
print('built', dst, len(h), 'bytes; pages:', {k: len(v) for k, v in EMBED.items()})
print('NOTE_EN', NOTE_EN)
