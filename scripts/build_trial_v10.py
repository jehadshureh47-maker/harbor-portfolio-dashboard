"""Build Dashboard_TRIAL_v10.html from Dashboard_TRIAL_v9.html (exact-match patches, each asserted).
Usage: python3 build_trial_v10.py <v9.html> <v10.html>
Round 3 review fixes: title/description, defer, dvh, error handling, translated no-data/N-A/PIN text,
month gating, KPI sizes, RTL gaps, search keyboard nav, Copy summary, Guide dialog."""
import re, sys
src, dst = sys.argv[1], sys.argv[2]
h = open(src, encoding='utf-8').read()
log = []

def rep(old, new, n=1, label=''):
    global h
    c = h.count(old)
    assert c == n, f'{label or old[:60]!r}: expected {n}, found {c}'
    h = h.replace(old, new)
    log.append(label or old[:50])

# 1 title + description (shown in tab, history, link previews)
rep('<meta name="description" content="Interactive portfolio reporting dashboard. Runs entirely in your browser — no server, no data upload.">',
    '<meta name="description" content="Internal portfolio dashboard.">', label='description')
rep('<title>Dashboard</title>', '<title>Harbor Portfolio</title>', label='title')

# 2 SheetJS: do not block first paint (only needed once someone uploads an Excel file)
rep('<script src="https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js"></script>',
    '<script src="https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js" defer></script>', label='xlsx defer')

# 3 iPhone/iPad Safari: sidebar height
rep('position:sticky; top:20px; max-height:calc(100vh - 40px); overflow-y:auto; overflow-x:hidden;',
    'position:sticky; top:20px; max-height:calc(100vh - 40px); max-height:calc(100dvh - 40px); overflow-y:auto; overflow-x:hidden;', label='dvh')

# 4 KPI legibility
rep('.kpi-pill .kpi-label{font-size:11px;', '.kpi-pill .kpi-label{font-size:12px;', label='kpi label')
rep('.kpi-pill .kpi-value{font-size:20px; font-weight:700; margin-top:4px;',
    '.kpi-pill .kpi-value{font-size:26px; font-weight:700; line-height:1.15; font-variant-numeric:tabular-nums; margin-top:4px;', label='kpi value')
rep('.exec-fit .kpi-pill{padding:10px 14px;}', '.exec-fit .kpi-pill{padding:10px 14px;} .exec-fit .kpi-pill .kpi-value{font-size:22px;}', label='exec-fit kpi')

# 5 RTL gaps found by review
rep('@media (max-width:600px){ .trend-delta{text-align:left;} }', '@media (max-width:600px){ .trend-delta{text-align:start;} }', label='trend-delta rtl')
rep('  .upload-toast.leaving{animation:uploadToastOut 220ms ease-in forwards;}',
    '  html[dir="rtl"] .upload-toast{border-left:1px solid var(--border); border-right:3px solid var(--ok);}\n  .upload-toast.leaving{animation:uploadToastOut 220ms ease-in forwards;}', label='toast rtl')

# 6 error handling: warn helper, global error bar, no more silent empty catch blocks
AR_ERR = 'حدث خطأ في التحميل، يرجى تحديث الصفحة.'
head_js = """<script>
function __warn(e){ try{ console.warn('[dash]', e); }catch(_){} }
(function(){
  var shown = false;
  function show(){
    if(shown) return; shown = true;
    var b = document.getElementById('errBar'); if(!b) return;
    var ar = document.documentElement.getAttribute('dir') === 'rtl';
    var s = b.querySelector('span');
    var en = "Something didn't load. Please refresh the page.", arT = '%s';
    if(s) s.textContent = (typeof t === 'function') ? t('err.load', ar ? arT : en) : (ar ? arT : en);
    b.hidden = false;
  }
  window.addEventListener('error', function(ev){
    var m = String(ev && ev.message || '');
    if(!ev || ev.target !== window) return;
    if(!m || m === 'Script error.' || /ResizeObserver/.test(m)) return;
    __warn(ev.error || m); show();
  });
  window.addEventListener('unhandledrejection', function(ev){ __warn(ev && ev.reason); show(); });
})();
</script>
""" % AR_ERR
rep('<title>Harbor Portfolio</title>\n', '<title>Harbor Portfolio</title>\n' + head_js, label='head js')
rep('<body>\n\n<div class="app-shell">',
    '<body>\n<div id="errBar" hidden role="alert" style="position:fixed;top:0;left:0;right:0;z-index:3000;display:flex;gap:12px;align-items:center;justify-content:center;padding:8px 14px;background:#7a2430;color:#fff;font-size:13px;"><span></span><button type="button" onclick="this.parentNode.hidden=true" aria-label="Close" style="background:transparent;border:1px solid rgba(255,255,255,.5);color:#fff;border-radius:6px;padding:2px 8px;cursor:pointer;">✕</button></div>\n\n<div class="app-shell">', label='errBar')
rep('<style>\n  :root{', '<style>\n  #errBar[hidden]{display:none !important;}\n  :root{', label='errBar hidden css')

n_catch = 0
out = []
pat = re.compile(r'catch\s*\((\w+)\)\s*\{\s*\}')
for line in h.split('\n'):
    if len(line) < 2500 and 'window.__V' not in line and pat.search(line):
        line, k = pat.subn(lambda m: "catch(%s){window.__warn&&window.__warn(%s)}" % (m.group(1), m.group(1)), line)
        n_catch += k
    out.append(line)
h = '\n'.join(out)
log.append(f'empty catch blocks now logged: {n_catch}')

# 7 translated empty / N-A / PIN wording
rep("'heatmap.na': 'N/A',",
    "'heatmap.na': 'No data',\n    'chart.noData': 'No data for this period',\n    'pin.wrong': 'Wrong PIN \\u2014 try again.',\n    'err.load': \"Something didn't load. Please refresh the page.\",\n    'execsum.copyBtn': 'Copy summary',\n    'execsum.copied': 'Copied',\n"
    "    'guide.btn': 'Guide', 'guide.title': 'How to read this dashboard',\n"
    "    'guide.installment': 'Installment: one cheque payment due under a contract.',\n"
    "    'guide.contract': 'Contract: one lease. A contract can have several installments.',\n"
    "    'guide.request': 'Request: one item in the Request Count report. Requests are not contract counts.',\n"
    "    'guide.bounced': 'Bounced cheque: a cheque that was returned unpaid.',\n"
    "    'guide.asof': 'Data as of: the reporting month chosen in the Month selector.',\n"
    "    'guide.close': 'Close',", label='EN keys')
ar_keys = {
    'heatmap.na': 'لا توجد بيانات',
    'chart.noData': 'لا توجد بيانات لهذه الفترة',
    'pin.wrong': 'الرمز السري غير صحيح، حاول مرة أخرى.',
    'err.load': AR_ERR,
    'execsum.copyBtn': 'نسخ الملخص',
    'execsum.copied': 'تم النسخ',
    'guide.btn': 'الدليل',
    'guide.title': 'كيف تقرأ لوحة المعلومات هذه',
    'guide.installment': 'الدفعة: شيك واحد مستحق ضمن عقد.',
    'guide.contract': 'العقد: عقد إيجار واحد. قد يحتوي العقد على عدة دفعات.',
    'guide.request': 'الطلب: بند واحد في تقرير عدد الطلبات. الطلبات ليست أعداد عقود.',
    'guide.bounced': 'الشيك المرتجع: شيك أُعيد دون صرف.',
    'guide.asof': 'البيانات كما في: شهر التقرير المختار في محدد الشهر.',
    'guide.close': 'إغلاق',
}
ar_block = ',\n    '.join("'%s': '%s'" % kv for kv in ar_keys.items())
rep("'heatmap.na': 'غير متاح',", ar_block + ',', label='AR keys')

NODATA_OLD = "if(entries.length === 0) return '<div style=\"color:var(--sub);font-size:12px;\">No data</div>';"
NODATA_NEW = "if(entries.length === 0) return '<div style=\"color:var(--sub);font-size:12px;\">' + (typeof t === 'function' ? t('chart.noData','No data for this period') : 'No data') + '</div>';"
rep(NODATA_OLD, NODATA_NEW, n=2, label='no data x2')
rep(NODATA_NEW + "\n  const {filterKey, selected} = opts;\n  const total = entries.reduce((a,[,v])=>a+v,0) || 1;",
    NODATA_NEW + "\n  if(entries.every(([,v]) => !(v > 0))) return '<div style=\"color:var(--sub);font-size:12px;\">' + (typeof t === 'function' ? t('chart.noData','No data for this period') : 'No data') + '</div>';\n  const {filterKey, selected} = opts;\n  const total = entries.reduce((a,[,v])=>a+v,0) || 1;", label='all-zero donut')

rep("errEl.textContent = 'Wrong PIN \\u2014 try again.';", "errEl.textContent = t('pin.wrong','Wrong PIN \\u2014 try again.');", label='pin text')
rep("badge.textContent = t('heatmap.na','N/A');", "badge.textContent = t('heatmap.na','No data');", label='heatmap na fallback')

# 8 month gating: an Awqaf month is only offered when its data really exists
rep("  return portfolioKey === 'awqaf';\n}",
    "  if(portfolioKey !== 'awqaf') return false;\n"
    "  // Only offer a month whose baked-in data exists, so a missing registration can never\n"
    "  // show July numbers under another month's label. Add each new month here.\n"
    "  if(monthCode === '2026-08') return typeof EMBEDDED_DASHBOARDS_AUG !== 'undefined';\n"
    "  if(monthCode === '2026-09') return typeof EMBEDDED_DASHBOARDS_SEPT !== 'undefined';\n"
    "  return false;\n}", label='month gating')

# 9 search keyboard navigation
rep("""document.getElementById('mdSearchInput').addEventListener('keydown', (e) => {
  if(e.key === 'Escape'){ mdSearchClear(); e.target.blur(); }
});""",
"""document.getElementById('mdSearchInput').addEventListener('keydown', (e) => {
  if(e.key === 'Escape'){ mdSearchClear(); e.target.blur(); return; }
  const box = document.getElementById('mdSearchResults');
  const items = box ? Array.from(box.querySelectorAll('.md-search-result')) : [];
  if(!items.length) return;
  let cur = items.findIndex(el => el.classList.contains('active'));
  if(e.key === 'ArrowDown' || e.key === 'ArrowUp'){
    e.preventDefault();
    if(cur >= 0) items[cur].classList.remove('active');
    cur = e.key === 'ArrowDown' ? (cur + 1) % items.length : (cur <= 0 ? items.length - 1 : cur - 1);
    items[cur].classList.add('active');
    items[cur].scrollIntoView({block:'nearest'});
  } else if(e.key === 'Enter'){
    e.preventDefault();
    items[cur >= 0 ? cur : 0].click();
  }
});""", label='search keys')
rep('  .upload-toast-container{', '  .md-search-result.active{background:var(--card2); outline:1px solid var(--accent);}\n  .upload-toast-container{', label='search active css')

# 10 Copy summary button on the Executive Summary
rep('<button class="exec-print-btn" type="button" onclick="printExecSummary()"',
    '<button class="exec-print-btn" type="button" id="execCopyBtn" data-i18n="execsum.copyBtn" onclick="mdCopyExecSummary(this)">${esc(t(\'execsum.copyBtn\',\'Copy summary\'))}</button>\n      <button class="exec-print-btn" type="button" onclick="printExecSummary()"', label='copy btn')
rep('function printExecSummary(){',
"""function mdCopyExecSummary(btn){
  const pane = document.getElementById('pane-execsummary');
  if(!pane) return;
  let txt = (pane.innerText || '').replace(/\\n{3,}/g, '\\n\\n').trim();
  txt += '\\n\\n' + location.href.split('#')[0];
  const done = () => {
    btn.textContent = t('execsum.copied','Copied');
    setTimeout(() => { btn.textContent = t('execsum.copyBtn','Copy summary'); }, 2000);
  };
  const fallback = () => {
    const ta = document.createElement('textarea'); ta.value = txt; ta.style.position = 'fixed'; ta.style.opacity = '0';
    document.body.appendChild(ta); ta.select();
    try{ document.execCommand('copy'); done(); }catch(e){ __warn(e); }
    ta.remove();
  };
  if(navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(txt).then(done, fallback);
  else fallback();
}
function printExecSummary(){""", label='copy fn')

# 11 Guide dialog ("How to read this dashboard") next to the Tour button
rep('<span data-i18n="nav.tour">Tour</span>\n        </button>',
    '<span data-i18n="nav.tour">Tour</span>\n        </button>\n'
    '        <button class="theme-switch" id="guideBtn" type="button" onclick="mdOpenGuide()" aria-label="How to read this dashboard" title="How to read this dashboard">\n'
    '          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 2-3 4"></path><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>\n'
    '          <span data-i18n="guide.btn">Guide</span>\n        </button>', label='guide btn')
rep('function mdCopyExecSummary(btn){',
"""function mdOpenGuide(){
  let d = document.getElementById('guideDlg');
  if(!d){
    d = document.createElement('dialog'); d.id = 'guideDlg';
    d.style.cssText = 'max-width:480px;width:calc(100% - 32px);border:1px solid var(--border);border-radius:14px;background:var(--card);color:var(--text);padding:20px 22px;';
    document.body.appendChild(d);
    d.addEventListener('click', ev => { if(ev.target === d) d.close(); });
  }
  const keys = [['guide.installment','Installment: one cheque payment due under a contract.'],
                ['guide.contract','Contract: one lease. A contract can have several installments.'],
                ['guide.request','Request: one item in the Request Count report. Requests are not contract counts.'],
                ['guide.bounced','Bounced cheque: a cheque that was returned unpaid.'],
                ['guide.asof','Data as of: the reporting month chosen in the Month selector.']];
  d.innerHTML = '<h3 style="margin:0 0 12px;font-size:16px;">' + esc(t('guide.title','How to read this dashboard')) + '</h3>'
    + '<ul style="margin:0 0 16px;padding-inline-start:18px;line-height:1.6;font-size:13.5px;">'
    + keys.map(k => '<li>' + esc(t(k[0], k[1])) + '</li>').join('') + '</ul>'
    + '<button type="button" class="theme-switch" onclick="this.closest(\\'dialog\\').close()">' + esc(t('guide.close','Close')) + '</button>';
  d.showModal();
}
function mdCopyExecSummary(btn){""", label='guide fn')

open(dst, 'w', encoding='utf-8').write(h)
print('\n'.join(' - ' + x for x in log))
print('wrote', dst, len(h))
