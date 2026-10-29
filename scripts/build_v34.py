"""Build v34 from v33: python3 build_v34.py <in.html> <out.html>
Fixes: Executive Summary Trend/Changes (empty or ignoring the selected month, Awqaf and Dubai Court),
Arabic percentage order, Cheque Count group cards, Changes search placeholder."""
import sys, os, re
src, dst = sys.argv[1], sys.argv[2]
here = os.path.dirname(os.path.abspath(__file__))
h = open(src, encoding='utf-8').read()
blocks = re.findall(r'const EMBEDDED_DASHBOARDS(?:_AUG|_SEPT)? = \{.*?\n\};', h, re.S)
assert len(blocks) == 3, len(blocks)

def rep(s, old, new, n=1):
    c = s.count(old); assert c == n, f'{old[:70]!r}: expected {n}, found {c}'
    return s.replace(old, new)

# 1. "Changes" with nothing to compare: the renderer hid the pane (inline display:none), so the sub-tab was blank.
#    Keep the pane visible and let the empty-state message fill it.
h = rep(h, "  if(!diff){ wrap.style.display = 'none'; wrap.innerHTML = ''; return; }\n\n  wrap.style.display = 'block';",
           "  if(!diff){ wrap.style.display = 'block'; wrap.innerHTML = ''; if(window.__vfEmptyTick) window.__vfEmptyTick(); return; }\n\n  wrap.style.display = 'block';")
h = rep(h, "  if(history.length < 2){ wrap.style.display = 'none'; wrap.innerHTML = ''; return; }\n\n  if(selectedPeriod === 'monthly'){\n    const recent = history.slice(-6);",
           "  if(history.length < 2){ wrap.style.display = 'block'; wrap.innerHTML = ''; if(window.__vfEmptyTick) window.__vfEmptyTick(); return; }\n\n  if(selectedPeriod === 'monthly'){\n    const recent = history.slice(-6);")

# 2. Trend follows the month picked in the header / Executive Summary (history up to and including that month)
h = rep(h, "function renderMonthlyTrend(){\n  const wrap = document.getElementById('monthlyTrendWrap');\n  if(!wrap) return;\n  if(selectedPeriod === 'monthly'){\n    const history = getMonthlyHistory(currentPortfolio);",
"""function getTrendHistory(portfolioKey){
  const all = getMonthlyHistory(portfolioKey);
  return all.filter(e => !(e && /^\\d{4}-\\d{2}$/.test(e.periodKey || '')) || e.periodKey <= currentMonth);
}
function renderMonthlyTrend(){
  const wrap = document.getElementById('monthlyTrendWrap');
  if(!wrap) return;
  if(currentPortfolio === 'dubai-court' && typeof renderCourtTrend === 'function'){ renderCourtTrend(wrap); return; }
  if(selectedPeriod === 'monthly'){
    const history = getTrendHistory(currentPortfolio);""")
h = rep(h, "function renderMonthlyTrendLegacy(){\n  const wrap = document.getElementById('monthlyTrendWrap');\n  if(!wrap) return;\n  const history = getMonthlyHistory(currentPortfolio);",
           "function renderMonthlyTrendLegacy(){\n  const wrap = document.getElementById('monthlyTrendWrap');\n  if(!wrap) return;\n  const history = getTrendHistory(currentPortfolio);")
h = rep(h, "function renderChangedRecords(){\n  renderChangedRecordsLegacy();",
           "function renderChangedRecords(){\n  if(currentPortfolio === 'dubai-court' && typeof renderCourtChanges === 'function'){ renderCourtChanges(); return; }\n  renderChangedRecordsLegacy();")
h = rep(h, "function v6TrendBuild(wrap, history){\n  const avail = V6_TREND_METRICS.filter(",
           "function v6TrendBuild(wrap, history, metricsOverride){\n  const avail = (metricsOverride || V6_TREND_METRICS).filter(")

# 3. Dubai Court: real Trend and Changes from the independently recounted monthly figures (COURT_CONTROL)
COURT = r"""
/* ---------- v34: Dubai Court Executive Summary - Trend & Outlook and Changes ---------- */
function courtMonthKeys(){ return Object.keys(COURT_CONTROL.months || {}).sort(); }
function courtMonthFigs(k){
  const m = COURT_CONTROL.months[k];
  return {periodKey: k, period: monthLabel(k), rent: m.rent_m, cheques: m.nrent_m, other: m.other_m, hold: m.hold_m, bounced: m.bounced_m,
    pending: m.pending_m, uncollected: m.hold_m + m.bounced_m + m.pending_m, dist: m.dist_m, exp: m.exp_m, inprog: m.in_progress, upcoming: m.upcoming};
}
function courtTrendMetrics(){
  return [
    {key:'rent', label: courtMsg('Rent collected','الإيجار المحصّل'), color:'var(--accent)', kind:'aed'},
    {key:'uncollected', label: courtMsg('Uncollected','غير المحصّل'), color:'var(--bad)', kind:'aed', inverse:true},
    {key:'bounced', label: courtMsg('Bounced cheques','الشيكات المرتجعة'), color:'var(--amber)', kind:'aed', inverse:true},
    {key:'dist', label: courtMsg('Distribution','التوزيعات'), color:'var(--ok)', kind:'aed'},
    {key:'exp', label: courtMsg('Expenses','المصروفات'), color:'var(--accent2)', kind:'aed', inverse:true},
    {key:'cheques', label: courtMsg('Rent cheques paid','شيكات الإيجار المسدّدة'), color:'var(--accent)', kind:'n'},
  ];
}
function courtMtdNote(){
  const asof = COURT_CONTROL.asof || '';
  if(!asof || currentMonth !== asof.slice(0, 7)) return '';
  return courtMsg(`${monthLabel(currentMonth)} is month to date (data to ${asof.slice(8)} ${monthLabel(currentMonth).split(' ')[0]}), so it is not a full month.`,
                  `${monthLabel(currentMonth)} هو شهر حتى تاريخه (البيانات حتى ${Number(asof.slice(8))} ${monthLabel(currentMonth).split(' ')[0]})، فليس شهراً كاملاً.`);
}
function renderCourtTrend(wrap){
  const keys = courtMonthKeys().filter(k => k <= currentMonth);
  wrap.style.display = 'block';
  if(keys.length < 2){
    wrap.innerHTML = `<div class="section-note" style="margin-top:0;padding:18px 20px;">${esc(courtMsg(`${monthLabel(currentMonth)} is the first month loaded for Dubai Court, so there is no trend to show yet.`,
      `${monthLabel(currentMonth)} هو أول شهر محمّل لمحكمة دبي، فلا يوجد اتجاه لعرضه بعد.`))}</div>`;
    return;
  }
  wrap.removeAttribute('data-vf-empty'); wrap.style.padding = ''; wrap.style.opacity = ''; wrap.style.fontSize = '';
  const hist = keys.map(courtMonthFigs);
  if(!v6TrendBuild(wrap, hist, courtTrendMetrics())) return;
  const note = courtMtdNote();
  if(note) wrap.querySelector('.v6t').insertAdjacentHTML('beforeend', `<div class="section-note" style="margin-top:10px;">${esc(note)}</div>`);
}
function renderCourtChanges(){
  const wrap = document.getElementById('changedRecordsWrap');
  if(!wrap) return;
  wrap.style.display = 'block';
  const keys = courtMonthKeys(), i = keys.indexOf(currentMonth);
  wrap.removeAttribute('data-vf-empty'); wrap.style.padding = ''; wrap.style.opacity = ''; wrap.style.fontSize = '';
  if(i < 1){
    wrap.innerHTML = `<div class="section-title" style="margin-top:0;"><span class="h2-dot"></span>${esc(courtMsg('Changes since last month','التغييرات منذ الشهر الماضي'))}</div>
      <div class="section-note">${esc(courtMsg(`${monthLabel(currentMonth)} is the first month loaded for Dubai Court, so there is nothing to compare yet.`,
        `${monthLabel(currentMonth)} هو أول شهر محمّل لمحكمة دبي، فلا توجد مقارنة بعد.`))}</div>`;
    return;
  }
  const cur = courtMonthFigs(keys[i]), prev = courtMonthFigs(keys[i - 1]);
  const rows = [
    ['rent', courtMsg('Rent collected','الإيجار المحصّل'), 'aed', false],
    ['cheques', courtMsg('Rent cheques paid','شيكات الإيجار المسدّدة'), 'n', false],
    ['other', courtMsg('Other income','إيرادات أخرى'), 'aed', false],
    ['hold', courtMsg('Uncollected — on hold','غير محصّل — معلّق'), 'aed', true],
    ['bounced', courtMsg('Uncollected — bounced','غير محصّل — مرتجع'), 'aed', true],
    ['pending', courtMsg('Uncollected — other pending','غير محصّل — قيد التحصيل'), 'aed', true],
    ['uncollected', courtMsg('Total uncollected','إجمالي غير المحصّل'), 'aed', true],
    ['dist', courtMsg('Distribution','التوزيعات'), 'aed', false],
    ['exp', courtMsg('Expenses','المصروفات'), 'aed', true],
    ['inprog', courtMsg('Renewals in progress','التجديدات قيد التنفيذ'), 'n', true],
    ['upcoming', courtMsg('Upcoming renewals (31–90 days)','التجديدات القادمة (31–90 يوماً)'), 'n', false],
  ];
  const fmt = (kind, v) => kind === 'aed' ? courtAed(v) : courtN(v);
  const body = rows.map(([k, label, kind, inverse]) => {
    const d = cur[k] - prev[k];
    let cell;
    if(Math.abs(d) < 0.5) cell = `<span style="color:var(--sub);">${esc(courtMsg('no change','لا تغيير'))}</span>`;
    else {
      const up = d > 0, bad = inverse ? up : !up;
      const pct = prev[k] ? ` (${up ? '+' : '−'}${Math.abs(d / prev[k] * 100).toFixed(0)}%)` : '';
      cell = `<span style="color:${bad ? 'var(--bad)' : 'var(--ok)'};white-space:nowrap;">${up ? '&#9650;' : '&#9660;'} ${esc((up ? '+' : '−') + fmt(kind, Math.abs(d)) + pct)}</span>`;
    }
    return `<tr><td>${esc(label)}</td><td class="bidi-ltr">${esc(fmt(kind, prev[k]))}</td><td class="bidi-ltr">${esc(fmt(kind, cur[k]))}</td><td>${cell}</td></tr>`;
  }).join('');
  const note = courtMtdNote();
  wrap.innerHTML = `<div class="section-title" style="margin-top:0;"><span class="h2-dot"></span>${esc(courtMsg('Changes since last month','التغييرات منذ الشهر الماضي'))}</div>
    <div class="section-note">${esc(courtMsg(`${cur.period} compared with ${prev.period}, from the Dubai Courts workbook.`, `${cur.period} مقارنةً بـ ${prev.period}، من مصنّف محاكم دبي.`))}</div>
    <table class="trend-table"><caption class="visually-hidden">${esc(courtMsg('Month-over-month changes','التغييرات من شهر إلى آخر'))}</caption>
      <thead><tr><th scope="col">${esc(courtMsg('Measure','المقياس'))}</th><th scope="col">${esc(prev.period)}</th><th scope="col">${esc(cur.period)}</th><th scope="col">${esc(courtMsg('Change','التغيير'))}</th></tr></thead>
      <tbody>${body}</tbody></table>
    ${note ? `<div class="section-note">${esc(note)}</div>` : ''}`;
}
/* ---------- end v34 ---------- */
"""
h = rep(h, "/* ---------- end v33 Dubai Court ---------- */", COURT + "/* ---------- end v33 Dubai Court ---------- */")

# 4. Arabic layer
js = open(os.path.join(here, 'vf_arnum.js'), encoding='utf-8').read()
m = '<script id="vfArNumJs">\n'
a = h.index(m) + len(m); b = h.index('\n</script>\n</body>', a)
h = h[:a] + js + h[b:]

for blk in blocks:
    assert h.count(blk) == 1, 'an existing embedded block changed'
open(dst, 'w', encoding='utf-8').write(h)
print('built', dst, len(h))
