/* ---------- v33: Dubai Court portfolio ---------- */
// Three report pages (Occupancy & Renewals, Collections, Distributions & Expenses) built from the Dubai Courts
// workbook (For Data.xlsx: Master Sheet, Payments, Expenses). They live in their own data set so the Awqaf /
// RTA / Police / Al Naser blocks above stay untouched. The month picked in the header is passed into each page
// (see mountEmbeddedDashboard). COURT_CONTROL holds figures recomputed independently from the workbook when
// this build was made (scripts/court_independent.py); the cross-checks compare the pages against it.
const EMBEDDED_DASHBOARDS_COURT = __COURT_EMBED__;
window.__courtSet = EMBEDDED_DASHBOARDS_COURT;
const COURT_CONTROL = __COURT_CONTROL__;
const REPORTS_COURT = [
  {id:'court-occupancy',     name:'Occupancy & Renewals',      nameKey:'shell.label.c0', known:true},
  {id:'court-collections',   name:'Collections',               nameKey:'shell.label.c1', known:true},
  {id:'court-distributions', name:'Distributions & Expenses',  nameKey:'shell.label.c2', known:true},
];
const OVERVIEW_REPORTS_COURT = ['court-occupancy','court-collections','court-distributions'];
const CROSS_CHECKS_COURT = [
  {key:'courtUnits', nameKey:'cc.court.units.name', name:'Unit counts add up and match the Master Sheet', detailKey:'cc.waitingDetail', detail:'Waiting for both dashboards to finish loading…'},
  {key:'courtCollections', nameKey:'cc.court.coll.name', name:'Collections match an independent recount of the Payments sheet', detailKey:'cc.waitingDetail', detail:'Waiting for both dashboards to finish loading…'},
  {key:'courtDistributions', nameKey:'cc.court.dist.name', name:'Distributions and expenses match an independent recount of the Expenses sheet', detailKey:'cc.waitingDetail', detail:'Waiting for both dashboards to finish loading…'},
];
function courtAr(){ return currentLang === 'ar'; }
function courtMsg(en, ar){ return courtAr() ? ar : en; }
function courtFig(id){ const w = embeddedWindows[id]; return (w && w.__crossCheckData) ? w.__crossCheckData : null; }
function courtN(n){ return Math.round(n || 0).toLocaleString('en-US'); }
function courtAed(n){ return courtN(n) + ' ' + courtMsg('AED', 'د.إ'); }
function courtPct(x){ return (x === null || x === undefined) ? '—' : (x * 100).toFixed(1) + '%'; }
function courtReady(){ return OVERVIEW_REPORTS.every(id => embeddedWindows[id] && embeddedWindows[id].__crossCheckData); }

function renderOverviewCourt(){
  const wrap = document.getElementById('overviewWrap');
  if(!wrap) return;
  if(!courtReady()){ renderLoadingState('overviewWrap', OVERVIEW_REPORTS, 'overview-grid'); return; }
  const o = courtFig('court-occupancy'), c = courtFig('court-collections'), d = courtFig('court-distributions');
  const month = monthLabel(currentMonth);
  const occPct = o.occupancy === null ? null : o.occupancy * 100;
  const cards = [
    {
      id:'court-occupancy', title: courtMsg('Occupancy & Renewals — ', 'الإشغال والتجديدات — ') + month, icon:'bldg',
      big: (occPct === null ? '—' : occPct.toFixed(1) + '%') + courtMsg(' rented', ' مؤجرة'),
      sub: courtMsg(`${courtN(o.rented)} of ${courtN(o.total_units)} units rented · ${courtN(o.vacant)} vacant`, `${courtN(o.rented)} من ${courtN(o.total_units)} وحدة مؤجرة · ${courtN(o.vacant)} شاغرة`),
      donut: o.total_units ? { centerText: courtN(o.total_units), segments: [
        {label: courtMsg('Rented','مؤجرة'), pct: (o.rented/o.total_units)*100, color:'var(--ok)'},
        {label: courtMsg('Vacant','شاغرة'), pct: (o.vacant/o.total_units)*100, color:'var(--amber)'},
        {label: courtMsg('Not recorded','غير مسجلة'), pct: (o.not_recorded/o.total_units)*100, color:'var(--sub)'},
      ]} : null,
      rows: [
        [courtMsg('Renewals in progress','التجديدات قيد التنفيذ'), courtN(o.in_progress)],
        [courtMsg('of which already expired','منها منتهية بالفعل'), courtN(o.expired)],
        [courtMsg('Upcoming renewals (31–90 days)','التجديدات القادمة (31–90 يوماً)'), courtN(o.upcoming)],
        [courtMsg('Properties with a unit list','العقارات التي لها قائمة وحدات'), courtN(o.property_count)],
      ],
      note: courtMsg('Occupancy uses the latest unit list as a snapshot; renewal windows are measured from the end of the selected month.', 'يعتمد الإشغال على آخر قائمة وحدات كصورة ثابتة؛ وتُحسب نوافذ التجديد من نهاية الشهر المحدد.'),
      period: courtMsg('From the Master Sheet', 'من الورقة الرئيسية'),
    },
    {
      id:'court-collections', title: courtMsg('Collections — ', 'التحصيلات — ') + month, icon:'inbox',
      big: courtN(c.rent_m) + courtMsg(' AED',' د.إ'),
      sub: courtMsg(`${courtN(c.nrent_m)} paid rent cheques · ${courtAed(c.rent_y)} year to date`, `${courtN(c.nrent_m)} شيك إيجار مسدّد · ${courtAed(c.rent_y)} منذ بداية العام`),
      alert: c.bounced_m > 0, alertText: courtMsg('Bounced: ' + courtAed(c.bounced_m), 'مرتجع: ' + courtAed(c.bounced_m)),
      rows: [
        [courtMsg('Other income (month)','إيرادات أخرى (الشهر)'), courtAed(c.other_m)],
        [courtMsg('Uncollected — on hold','غير محصّل — معلّق'), courtAed(c.hold_m)],
        [courtMsg('Uncollected — bounced','غير محصّل — مرتجع'), courtAed(c.bounced_m)],
        [courtMsg('Uncollected — other pending','غير محصّل — قيد التحصيل'), courtAed(c.pending_m)],
        [courtMsg('Total uncollected','إجمالي غير المحصّل'), courtAed(c.uncollected_m)],
      ],
      note: courtMsg('On hold and bounced amounts are shown separately and never added into one figure without the split.', 'تُعرض المبالغ المعلّقة والمرتجعة منفصلة ولا تُجمع في رقم واحد دون بيان التفصيل.'),
      period: courtMsg('From the Payments sheet', 'من ورقة الدفعات'),
    },
    {
      id:'court-distributions', title: courtMsg('Distributions & Expenses — ', 'التوزيعات والمصروفات — ') + month, icon:'doc',
      big: courtN(d.dist_m) + courtMsg(' AED',' د.إ'),
      sub: courtMsg(`distributed in the month · ${courtAed(d.exp_m)} expenses`, `موزّعة خلال الشهر · ${courtAed(d.exp_m)} مصروفات`),
      rows: [
        [courtMsg('Distribution (year to date)','التوزيعات (منذ بداية العام)'), courtAed(d.dist_y)],
        [courtMsg('Expenses (year to date)','المصروفات (منذ بداية العام)'), courtAed(d.exp_y)],
        [courtMsg('of which PM fee (year to date)','منها رسوم إدارة العقار (منذ بداية العام)'), courtAed(d.pmfee_y)],
        [courtMsg('Rent transferred to Dubai Courts (year to date)','إيجارات محوّلة إلى محاكم دبي (منذ بداية العام)'), courtAed(d.courtrent_y)],
        [courtMsg('Pending / not yet paid','قيد الدفع / لم تُسدَّد بعد'), courtAed(d.pending)],
      ],
      note: courtMsg('Distributions are recorded per owner in the source, so they appear at portfolio level.', 'تُسجَّل التوزيعات في المصدر لكل مالك، لذلك تظهر على مستوى المحفظة.'),
      period: courtMsg('From the Expenses sheet', 'من ورقة المصروفات'),
    },
  ];
  renderOverviewCards(wrap, cards);
}

function renderExecSummaryCourt(){
  const heroWrap = document.getElementById('execHeroWrap');
  const narrativeWrap = document.getElementById('execNarrative');
  const healthWrap = document.getElementById('execHealthWrap');
  const dataAsOfWrap = document.getElementById('execDataAsOf');
  if(!heroWrap) return;
  if(!courtReady()){
    renderLoadingState('execHeroWrap', OVERVIEW_REPORTS, 'exec-summary-grid');
    if(narrativeWrap) narrativeWrap.innerHTML = '';
    return;
  }
  const o = courtFig('court-occupancy'), c = courtFig('court-collections'), d = courtFig('court-distributions');
  const month = monthLabel(currentMonth);
  const occPct = o.occupancy === null ? null : o.occupancy * 100;
  const asof = c.asof;
  if(dataAsOfWrap){
    dataAsOfWrap.style.display = 'block';
    dataAsOfWrap.innerHTML = courtAr()
      ? `<b>البيانات حتى ${esc(asof)}</b> — الأرقام من مصنّف محاكم دبي (الورقة الرئيسية والدفعات والمصروفات). الشهر المعروض: ${esc(month)}.`
      : `<b>Data as of ${esc(asof)}</b> — figures are from the Dubai Courts workbook (Master Sheet, Payments, Expenses). Month shown: ${esc(month)}.`;
    const printSub = document.getElementById('execPrintHeaderSub');
    if(printSub) printSub.textContent = courtMsg('Dubai Court', 'محكمة دبي') + ' — ' + month + ' — ' + courtMsg('generated', 'أُعدّ في') + ' ' + new Date().toLocaleDateString(courtAr() ? 'ar-AE' : 'en-GB', {day:'numeric', month:'long', year:'numeric'});
  }
  renderExecCards(heroWrap, [
    {label: courtMsg('Rent Collected','الإيجار المحصّل'), value: courtAed(c.rent_m), sub: courtMsg(`${courtAed(c.rent_y)} year to date`, `${courtAed(c.rent_y)} منذ بداية العام`)},
    {label: courtMsg('Uncollected','غير المحصّل'), value: courtAed(c.uncollected_m), sub: courtMsg(`On hold ${courtAed(c.hold_m)} · Bounced ${courtAed(c.bounced_m)} · Other pending ${courtAed(c.pending_m)}`, `معلّق ${courtAed(c.hold_m)} · مرتجع ${courtAed(c.bounced_m)} · قيد التحصيل ${courtAed(c.pending_m)}`)},
    {label: courtMsg('Occupancy','الإشغال'), value: courtPct(o.occupancy), sub: courtMsg(`${courtN(o.vacant)} vacant of ${courtN(o.total_units)} units`, `${courtN(o.vacant)} شاغرة من ${courtN(o.total_units)} وحدة`)},
    {label: courtMsg('Renewals in Progress','التجديدات قيد التنفيذ'), value: courtN(o.in_progress), sub: courtMsg(`${courtN(o.upcoming)} more due in 31–90 days`, `${courtN(o.upcoming)} أخرى مستحقة خلال 31–90 يوماً`)},
  ]);
  if(narrativeWrap){
    narrativeWrap.innerHTML = courtAr()
      ? `<p>خلال ${esc(month)}، حصّلت محفظة محاكم دبي ${courtAed(c.rent_m)} من إيجارات مسدّدة عبر ${courtN(c.nrent_m)} شيكاً (${courtAed(c.rent_y)} منذ بداية العام)، إضافة إلى ${courtAed(c.other_m)} من إيرادات أخرى. بلغ غير المحصّل ${courtAed(c.uncollected_m)}، منها ${courtAed(c.hold_m)} معلّقة و${courtAed(c.bounced_m)} شيكات مرتجعة و${courtAed(c.pending_m)} قيد التحصيل. كانت ${courtN(o.rented)} وحدة من أصل ${courtN(o.total_units)} مؤجرة (${courtPct(o.occupancy)})، مع ${courtN(o.in_progress)} تجديداً قيد التنفيذ (منها ${courtN(o.expired)} منتهية بالفعل) و${courtN(o.upcoming)} تجديداً قادماً. وُزّع ${courtAed(d.dist_m)} على الملّاك، وبلغت المصروفات ${courtAed(d.exp_m)}.</p>`
      : `<p>In ${esc(month)}, the Dubai Court portfolio collected ${courtAed(c.rent_m)} in paid rent across ${courtN(c.nrent_m)} cheques (${courtAed(c.rent_y)} year to date), plus ${courtAed(c.other_m)} of other income. Uncollected amounts stood at ${courtAed(c.uncollected_m)}: ${courtAed(c.hold_m)} on hold, ${courtAed(c.bounced_m)} in bounced cheques and ${courtAed(c.pending_m)} otherwise pending. ${courtN(o.rented)} of ${courtN(o.total_units)} units were rented (${courtPct(o.occupancy)}), with ${courtN(o.in_progress)} renewals in progress (${courtN(o.expired)} of them already expired) and ${courtN(o.upcoming)} more upcoming. ${courtAed(d.dist_m)} was distributed to owners and expenses came to ${courtAed(d.exp_m)}.</p>`;
  }
  if(healthWrap){
    const checkRows = Array.from(document.querySelectorAll('#checksList .check-row'));
    const realCheckRows = checkRows.filter(r => !r.querySelector('.icon.explanation'));
    const okCount = realCheckRows.filter(r => r.querySelector('.icon.passed')).length;
    const badCount = realCheckRows.filter(r => r.querySelector('.icon.review')).length;
    const occupancyColor = occPct === null ? 'var(--text)' : (occPct >= 90 ? 'var(--ok)' : 'var(--amber)');
    healthWrap.innerHTML = `<div class="kpi-row">
      <div class="kpi-pill"><div class="kpi-label">${esc(t("shell.health.37"))}</div><div class="kpi-value" style="color:var(--ok);">${okCount} / ${realCheckRows.length}</div></div>
      <div class="kpi-pill"><div class="kpi-label">${esc(t("shell.health.38"))}</div><div class="kpi-value" style="color:${badCount ? 'var(--bad)' : 'var(--text)'};">${badCount}</div></div>
      <div class="kpi-pill"><div class="kpi-label">${esc(t("shell.health.40"))}</div><div class="kpi-value" style="color:${occupancyColor};">${courtPct(o.occupancy)}</div><div style="font-size:11px; color:var(--sub); margin-top:3px;">${courtN(o.vacant)} ${courtMsg('vacant units','وحدة شاغرة')}</div></div>
      <div class="kpi-pill"><div class="kpi-label">${courtMsg('Bounced cheques','الشيكات المرتجعة')}</div><div class="kpi-value" style="color:${c.bounced_m ? 'var(--bad)' : 'var(--text)'}; font-size:15px;">${courtAed(c.bounced_m)}</div><div style="font-size:11px; color:var(--sub); margin-top:3px;">${courtMsg('shown apart from amounts on hold','تُعرض منفصلة عن المبالغ المعلّقة')}</div></div>
    </div>`;
  }
  portfolioSnapshot['dubai-court'] = {
    period: month,
    periodKey: currentMonth,
    periodMismatch: null,
    historyEligible: false,
    totalCollected: c.rent_m,
    bouncedAmount: c.bounced_m,
    bouncedCount: null,
    netCollected: null,
    bounceRatePct: null,
    extraLabel: courtMsg('Occupancy','الإشغال'),
    extraValueFormatted: courtPct(o.occupancy),
    extraSub: courtMsg(`${courtN(o.rented)} of ${courtN(o.total_units)} units rented`, `${courtN(o.rented)} من ${courtN(o.total_units)} وحدة مؤجرة`),
    extraMetrics: [
      { label: courtMsg('Occupancy','الإشغال'), value: courtPct(o.occupancy), sub: courtMsg(`${courtN(o.rented)} of ${courtN(o.total_units)} units rented`, `${courtN(o.rented)} من ${courtN(o.total_units)} وحدة مؤجرة`) },
      { label: courtMsg('Uncollected','غير المحصّل'), value: courtAed(c.uncollected_m), sub: courtMsg(`On hold ${courtAed(c.hold_m)} · Bounced ${courtAed(c.bounced_m)}`, `معلّق ${courtAed(c.hold_m)} · مرتجع ${courtAed(c.bounced_m)}`) },
      { label: courtMsg('Distribution (month)','التوزيعات (الشهر)'), value: courtAed(d.dist_m), sub: courtMsg(`Expenses ${courtAed(d.exp_m)}`, `المصروفات ${courtAed(d.exp_m)}`) },
    ],
  };
  if(typeof renderCompare === 'function') renderCompare();
}

function tryRunCrossChecksCourt(){
  const o = courtFig('court-occupancy'), c = courtFig('court-collections'), d = courtFig('court-distributions');
  if(!o || !c || !d) return;
  const ctl = (COURT_CONTROL.months || {})[currentMonth];
  const near = (a, b) => Math.abs((a || 0) - (b || 0)) < 0.5;
  // 1. unit counts
  const sumOk = (o.rented + o.vacant + o.not_recorded) === o.total_units;
  const unitsOk = sumOk && o.total_units === COURT_CONTROL.units.total && o.rented === COURT_CONTROL.units.rented && o.vacant === COURT_CONTROL.units.vacant;
  const renOk = !ctl || (o.in_progress === ctl.in_progress && o.upcoming === ctl.upcoming);
  updateCheckRow('courtUnits', (unitsOk && renOk) ? 'passed' : 'review',
    (unitsOk && renOk)
      ? courtMsg(`Passed: ${courtN(o.rented)} rented + ${courtN(o.vacant)} vacant + ${courtN(o.not_recorded)} not recorded = ${courtN(o.total_units)} units, and the renewal counts (${courtN(o.in_progress)} in progress, ${courtN(o.upcoming)} upcoming) match a separate recount of the Master Sheet.`,
                 `نجح: ${courtN(o.rented)} مؤجرة + ${courtN(o.vacant)} شاغرة + ${courtN(o.not_recorded)} غير مسجلة = ${courtN(o.total_units)} وحدة، وتطابق أعداد التجديدات (${courtN(o.in_progress)} قيد التنفيذ و${courtN(o.upcoming)} قادمة) إعادة احتساب منفصلة للورقة الرئيسية.`)
      : courtMsg(`Review: unit counts (${o.rented}/${o.vacant}/${o.not_recorded} of ${o.total_units}) or renewal counts do not match the independent recount (${COURT_CONTROL.units.rented}/${COURT_CONTROL.units.vacant} of ${COURT_CONTROL.units.total}).`,
                 `مراجعة: أعداد الوحدات أو التجديدات لا تطابق إعادة الاحتساب المستقلة.`),
    (unitsOk && renOk) ? 'VERIFIED' : 'NEEDS_REVIEW');
  // 2. collections
  if(!ctl){
    updateCheckRow('courtCollections', 'review', courtMsg('No independent recount is stored for this month.', 'لا توجد إعادة احتساب مستقلة محفوظة لهذا الشهر.'), 'SOURCE_MISSING');
    updateCheckRow('courtDistributions', 'review', courtMsg('No independent recount is stored for this month.', 'لا توجد إعادة احتساب مستقلة محفوظة لهذا الشهر.'), 'SOURCE_MISSING');
    return;
  }
  const collPairs = [['rent_m'],['rent_y'],['nrent_m'],['other_m'],['hold_m'],['bounced_m'],['pending_m']];
  const collOk = collPairs.every(([k]) => near(c[k], ctl[k]));
  updateCheckRow('courtCollections', collOk ? 'passed' : 'review',
    collOk
      ? courtMsg(`Passed: rent collected ${courtAed(c.rent_m)} (${courtAed(c.rent_y)} year to date), ${courtN(c.nrent_m)} cheques, other income ${courtAed(c.other_m)}, on hold ${courtAed(c.hold_m)}, bounced ${courtAed(c.bounced_m)} and other pending ${courtAed(c.pending_m)} all match a separate recount of the Payments sheet.`,
                 `نجح: الإيجار المحصّل ${courtAed(c.rent_m)} (${courtAed(c.rent_y)} منذ بداية العام)، و${courtN(c.nrent_m)} شيكاً، وإيرادات أخرى ${courtAed(c.other_m)}، ومعلّق ${courtAed(c.hold_m)}، ومرتجع ${courtAed(c.bounced_m)}، وقيد التحصيل ${courtAed(c.pending_m)}، وكلها تطابق إعادة احتساب منفصلة لورقة الدفعات.`)
      : courtMsg('Review: at least one collections figure differs from the independent recount of the Payments sheet.', 'مراجعة: يختلف رقم واحد على الأقل من أرقام التحصيلات عن إعادة الاحتساب المستقلة لورقة الدفعات.'),
    collOk ? 'VERIFIED' : 'NEEDS_REVIEW');
  const distOk = ['dist_m','dist_y','exp_m','exp_y','courtrent_m'].every(k => near(d[k], ctl[k]));
  updateCheckRow('courtDistributions', distOk ? 'passed' : 'review',
    distOk
      ? courtMsg(`Passed: distribution ${courtAed(d.dist_m)} (${courtAed(d.dist_y)} year to date) and expenses ${courtAed(d.exp_m)} (${courtAed(d.exp_y)} year to date) match a separate recount of the Expenses sheet.`,
                 `نجح: التوزيعات ${courtAed(d.dist_m)} (${courtAed(d.dist_y)} منذ بداية العام) والمصروفات ${courtAed(d.exp_m)} (${courtAed(d.exp_y)} منذ بداية العام) تطابق إعادة احتساب منفصلة لورقة المصروفات.`)
      : courtMsg('Review: distributions or expenses differ from the independent recount of the Expenses sheet.', 'مراجعة: تختلف التوزيعات أو المصروفات عن إعادة الاحتساب المستقلة لورقة المصروفات.'),
    distOk ? 'VERIFIED' : 'NEEDS_REVIEW');
}

PORTFOLIOS['dubai-court'] = {
  label: 'Dubai Court',
  reports: REPORTS_COURT,
  crossChecks: CROSS_CHECKS_COURT,
  overviewReports: OVERVIEW_REPORTS_COURT,
  renderOverview: renderOverviewCourt,
  renderExecSummary: renderExecSummaryCourt,
  tryRunCrossChecks: tryRunCrossChecksCourt,
  note: __COURT_NOTE__,
};
/* ---------- end v33 Dubai Court ---------- */

