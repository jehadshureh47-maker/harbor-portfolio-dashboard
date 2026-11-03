"""v44 (not live): merge every bank spelling in the Bounced Cheques reports (Jul/Aug/Sep) and fix New Lease wording.
Reads index.html (live v43), writes Dashboard_RELEASE_v44.html. index.html is not touched."""
import re, base64, sys
src = open('index.html', encoding='utf-8').read()
NORM = open('scripts/v44_bank_norm.js', encoding='utf-8').read()
OLD_FN = """function normalizeBankName(name){
  if(!name) return name;
  const key = name.replace(/\\s+/g,' ').trim();
  return BANK_NAME_MAP[key] || name;
}
"""
JUL_MAP = """const BANK_NAME_MAP = {};
"""
def patch_bc(h, month):
    if OLD_FN in h:
        assert h.count(OLD_FN) == 1; h = h.replace(OLD_FN, NORM + '\n')
    else:   # July build had no lookup at all: add an empty base map plus the new lookup before topNWithOther
        a = 'function topNWithOther(counts, topN){'; assert h.count(a) == 1
        h = h.replace(a, JUL_MAP + NORM + '\n' + a)
        a = "    const bank = (get(row,'bank') || 'Unknown').toString().trim();"; assert h.count(a) == 1, month
        h = h.replace(a, "    const bank = normalizeBankName((get(row,'bank') || 'Unknown').toString().trim());")
    a = "    const bank = (get(row,'bank')||'Unknown').toString().trim();"   # CSV export filter compares against merged names
    assert h.count(a) == 1, month
    h = h.replace(a, "    const bank = normalizeBankName((get(row,'bank')||'Unknown').toString().trim());")
    assert h.count('function normalizeBankName') == 1
    return h
NL_EN_OLD = "\\u2713 {n} {unit} this period, linked to Summary. Total Fees Recorded below still includes every fee/charge line in Details, including any tied to contracts from other periods."
NL_EN_NEW = "\\u2713 {n} {unit} this period, linked to Summary. Total Fees Recorded below includes every fee and charge in Details."
NL_AR_OLD = "✓ {n} {unit} هذه الفترة، مرتبطة بورقة Summary. إجمالي الرسوم المسجَّلة أدناه لا يزال يتضمن كل بند رسوم/تكلفة في ورقة التفاصيل، بما في ذلك ما يرتبط بعقود من فترات أخرى."
NL_AR_NEW = "✓ {n} {unit} هذه الفترة، مرتبطة بورقة Summary. إجمالي الرسوم المسجَّلة أدناه يشمل كل الرسوم والتكاليف في ورقة التفاصيل."
LEG_OLD = "${val} requests (${pct}%)"
LEG_NEW = "${val} ${unitWordNL(val,'payment','payments','nl.unitPayment')} (${pct}%)"
def patch_nl(h, month):
    n_en = h.count(NL_EN_OLD); assert n_en == 2, (month, n_en)   # default string in t() + English dictionary
    h = h.replace(NL_EN_OLD, NL_EN_NEW)
    assert h.count(NL_AR_OLD) == 1, month; h = h.replace(NL_AR_OLD, NL_AR_NEW)
    assert h.count(LEG_OLD) == 1, month; h = h.replace(LEG_OLD, LEG_NEW)
    a = '    "nl.unitNewLease": "new lease",'; assert h.count(a) == 1, month
    h = h.replace(a, a + '\n    "nl.unitPayment": "payments",')
    a = '    "nl.unitNewLease": "عقد إيجار جديد",'; assert h.count(a) == 1, month
    h = h.replace(a, a + '\n    "nl.unitPayment": "دفعات",')
    css = '/* v44: this panel counts payments, not requests (the shared Request Count label was showing here) */\n#chartType::before{content:"Share of payments (by count)" !important}\nhtml[lang="ar"] #chartType::before{content:"حصة الدفعات (حسب العدد)" !important}\n'
    i = h.index('</style>'); h = h[:i] + css + h[i:]
    return h
out = src; done = []
for obj in ('EMBEDDED_DASHBOARDS', 'EMBEDDED_DASHBOARDS_AUG', 'EMBEDDED_DASHBOARDS_SEPT'):
    st = out.index(obj + ' = {')
    for key, fn in (('bounced-cheques', patch_bc), ('new-lease', patch_nl)):
        tag = '"%s": "' % key; j = out.index(tag, st) + len(tag); k = out.index('"', j)
        h = base64.b64decode(out[j:k]).decode('utf-8'); h2 = fn(h, obj)
        b = base64.b64encode(h2.encode('utf-8')).decode('ascii')
        out = out[:j] + b + out[k:]; done.append((obj, key, len(h), len(h2)))

# shell (outside the report blobs): the New Lease note the dashboard actually shows, and Arabic names for the merged banks
SHELL_EDITS = [
  ("Total Fees also counts payments tied to contracts from other periods.", "Total Fees counts every payment in the file."),
  ("إجمالي الرسوم يشمل أيضاً دفعات عقود من فترات أخرى.", "إجمالي الرسوم يشمل كل الدفعات في الملف."),
  ("'janata':'جناتا',", "'janata':'جناتا', 'janata bank':'جناتا بنك', 'dib':'بنك دبي الإسلامي', 'eib':'مصرف الإمارات الإسلامي', 'fab':'بنك أبوظبي الأول', 'cbd':'بنك دبي التجاري', 'sib':'مصرف الشارقة الإسلامي', 'al maryah':'بنك المارية المحلي', 'rakbank':'بنك رأس الخيمة الوطني',"),
]
for a, b in SHELL_EDITS:
    assert out.count(a) == 1, a; out = out.replace(a, b)
open('Dashboard_RELEASE_v44.html', 'w', encoding='utf-8').write(out)
for d in done: print(d)
