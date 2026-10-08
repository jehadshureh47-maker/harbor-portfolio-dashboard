
  // ---- Executive Summary v5: one-screen briefing (Awqaf) ----
  // Same validated numbers as before, reorganised decision-first: headline
  // sentence -> four headline tiles with a visual each -> daily activity chart
  // + leasing/operations -> attention strip. Nothing new is calculated except
  // display shares of numbers already on this tab.
  (function(){
    const pane = document.getElementById('pane-execsummary');
    if(pane) pane.classList.add('exec-has-briefing');
    const aedC = v => { v = Number(v) || 0; const a = Math.abs(v); const s = a >= 1e6 ? (a / 1e6).toFixed(2) + 'M' : a >= 1e3 ? Math.round(a / 1e3) + 'K' : String(Math.round(a)); return 'AED ' + (v < 0 ? '-' : '') + s; };
    const monthName = (iso) => { if(!iso) return ''; const p = iso.split('-'); return new Date(Date.UTC(+p[0], +p[1] - 1, 1)).toLocaleString(currentLang === 'ar' ? 'ar-AE' : 'en-GB', {month: 'long', year: 'numeric', timeZone: 'UTC'}); };
    const reviewN = reviewCheckRows.length;
    const rate = bounceRatePct;
    const underTarget = rate !== null && rate < BOUNCE_TARGET;
    const periodName = monthName(cc.date_min);
    const headline = `<b>${esc(periodName || t('execsum.v5.thisPeriod', 'This period'))}</b> · ${esc(t('execsum.v5.recorded', 'Recorded'))} <b class="bidi-ltr">${aedC(cc.total_amount)}</b>, ${esc(t('execsum.v5.ofWhich', 'of which'))} <b class="bidi-ltr">${aedC(bc.total_amount)}</b>${rate !== null ? ` (<b class="${underTarget ? 'eb-ok' : 'eb-bad'}">${rate.toFixed(1)}%</b>)` : ''} ${esc(t('execsum.v5.bounced', 'bounced'))}${rate !== null ? ` — ${underTarget ? esc(t('execsum.v5.under', 'under the')) : esc(t('execsum.v5.over', 'at or above the'))} ${BOUNCE_TARGET}% ${esc(t('execsum.v5.target', 'target'))}` : ''}. <b class="bidi-ltr">${(cc.total_contracts || 0).toLocaleString()}</b> ${esc(t('execsum.v5.leaseContracts', 'lease contracts'))} (${ccClassified ? Math.round(ccRenewal / ccClassified * 100) : 0}% ${esc(t('execsum.v5.renewals', 'renewals'))}), <b class="bidi-ltr">${ccNewLease.toLocaleString()}</b> ${esc(t('execsum.v5.newLeases', 'new leases'))} ${esc(t('execsum.v5.worth', 'worth'))} <b class="bidi-ltr">${aedC(nl.rent_value_total)}</b>. ${reviewN ? `<span class="eb-warn"><b>${reviewN}</b> ${esc(t('execsum.v5.checksReview', reviewN === 1 ? 'cross-check needs a second look' : 'cross-checks need a second look'))}</span>` : `<span class="eb-ok">${esc(t('execsum.v5.allClear', 'All cross-checks clear.'))}</span>`}`;

    const stack = (segs) => laStackBar(segs.filter(s => s.value > 0));
    const legend = (segs) => `<div class="eb-leg">${segs.filter(s => s.value > 0).map(s => `<span><i style="background:${s.color}"></i>${esc(s.label)} <b class="bidi-ltr">${s.text}</b></span>`).join('')}</div>`;
    const tile = (label, big, note, delta, vis, bigClass) => `<div class="la4-tile eb-tile"><div class="la4-tile-label">${esc(label)}</div><div class="la4-tile-big bidi-ltr ${bigClass || ''}">${big}</div><div class="la4-tile-sub">${note}</div><div class="la4-tile-delta">${delta || '&nbsp;'}</div><div class="la4-tile-vis">${vis}</div></div>`;

    const timing = [
      {label: t('execsum.v5.thisMonth', 'This month'), value: cc.cheque_dated_this_month_amount || 0, color: 'var(--accent)', text: aedC(cc.cheque_dated_this_month_amount)},
      {label: t('execsum.v5.future', 'Future'), value: cc.cheque_future_dated_amount || 0, color: 'var(--accent2)', text: aedC(cc.cheque_future_dated_amount)},
      {label: t('execsum.v5.past', 'Past'), value: cc.cheque_past_dated_amount || 0, color: 'var(--amber)', text: aedC(cc.cheque_past_dated_amount)},
    ];
    const gaugeFill = rate === null ? 0 : Math.min(100, rate / (BOUNCE_TARGET * 2) * 100);
    const bounceVis = `<div class="eb-gauge" role="img" aria-label="Bounce rate ${rate !== null ? rate.toFixed(1) : '—'}% against ${BOUNCE_TARGET}% target"><i style="width:${gaugeFill.toFixed(1)}%;background:${underTarget ? 'var(--ok)' : 'var(--bad)'}"></i><u style="left:50%"></u></div><div class="eb-leg"><span>${rate !== null ? '<b>' + rate.toFixed(1) + '%</b>' : '—'} ${esc(t('execsum.v5.ofRecorded', 'of recorded value'))}</span><span>${esc(t('execsum.v5.target', 'target'))} &lt; <b>${BOUNCE_TARGET}%</b></span></div>`;
    const netVis = stack([{label: 'Net', value: Math.max(netCollected, 0), color: 'var(--ok)'}, {label: 'Bounced', value: bc.total_amount || 0, color: 'var(--bad)'}]) + legend([{label: t('execsum.v5.net', 'Net'), value: 1, color: 'var(--ok)', text: aedC(netCollected)}, {label: t('execsum.v5.bounced', 'bounced'), value: 1, color: 'var(--bad)', text: aedC(bc.total_amount)}]);
    const feeOther = Math.max((nl.total_amount || 0) - (nl.rent_value_total || 0), 0);
    const leaseVis = stack([{label: 'Rent', value: nl.rent_value_total || 0, color: 'var(--amber)'}, {label: 'Other fees', value: feeOther, color: 'var(--border)'}]) + legend([{label: t('execsum.v5.rent', 'Rent'), value: 1, color: 'var(--amber)', text: aedC(nl.rent_value_total)}, {label: t('execsum.v5.otherFees', 'Other fees'), value: feeOther, color: 'var(--border)', text: aedC(feeOther)}]);

    const nLeaseUnit = currentLang === 'ar' ? t('execsum.leaseUnit', 'lease') : pluralize(nl.total_new_leases, t('execsum.leaseUnit', 'lease'), t('execsum.leaseUnitPlural', 'leases'));
    const tiles = [
      tile(totalCollectedLabel('awqaf'), esc(fmtAed(cc.total_amount)), esc(t('execsum.v5.ledgerNote', 'Recorded ledger sum — not confirmed bank clearance')), heroDelta(cc.total_amount, 'totalCollected', true), stack(timing) + legend(timing)),
      tile(currentLang === 'ar' ? 'قيمة الشيكات المرتجعة المسجلة' : 'Reported bounced value', esc(fmtAed(bc.total_amount)), `${bc.total_count.toLocaleString()} ${esc(chequeUnit)} · ${esc(t('execsum.v5.allStatuses', 'all statuses, incl. Paid'))}`, heroDelta(bc.total_amount, 'bouncedAmount', true, true), bounceVis, 'eb-bad'),
      tile(netCollectedLabel('awqaf'), esc(fmtAed(netCollected)), esc(t('execsum.heroNetSub', 'Recorded value minus bounced')), heroDelta(netCollected, 'netCollected', true), netVis, 'eb-ok'),
      tile(t('execsum.heroNewLeaseLabel', 'New Lease Value'), esc(fmtAed(nl.rent_value_total)), `${nl.total_new_leases.toLocaleString()} ${esc(nLeaseUnit)} · ${esc(t('execsum.v5.newOnly', 'new-lease value only'))}`, heroDelta(nl.rent_value_total || 0, 'leaseRentValue', true), leaseVis),
    ].join('');

    const stat = (group, name, value, delta) => `<div class="x4-stat"><div class="x4-stat-group">${esc(group)}</div><div class="x4-stat-name">${esc(name)}</div><div class="x4-stat-value">${value}</div><div class="x4-stat-delta">${delta || '&nbsp;'}</div></div>`;
    const pctC = n => ccClassified ? Math.round(n / ccClassified * 100) : 0;
    const bstat = bc.status && typeof bc.status === 'object' ? Object.entries(bc.status).filter(e => e[1] > 0) : [];
    const bColor = k => /paid/i.test(k) ? 'var(--ok)' : /legal/i.test(k) ? 'var(--bad)' : 'var(--amber)';
    const bTotal = bstat.reduce((a, e) => a + e[1], 0);
    const softCaseStatus = s => /^[A-Z ]+$/.test(s) ? s.charAt(0) + s.slice(1).toLowerCase() : s;
    const bstatHtml = bstat.length ? `<div class="x4-comp"><div class="x4-comp-head"><span>${esc(t('execsum.v5.bounceStatus', 'Bounced cheques by status'))}</span><span><b>${bTotal.toLocaleString()}</b> ${esc(chequeUnit)}</span></div>${laStackBar(bstat.map(e => ({label: e[0], value: e[1], color: bColor(e[0])})))}<div class="x4-comp-legend">${bstat.map(e => `<span><i style="background:${bColor(e[0])}"></i><b>${e[1].toLocaleString()}</b> ${esc(softCaseStatus(e[0]))} (${bTotal ? Math.round(e[1] / bTotal * 100) : 0}%)</span>`).join('')}</div></div>` : '';
    const mixHtml = ccClassified ? `<div class="x4-comp"><div class="x4-comp-head"><span>${esc(t('execsum.x4.mix', 'Lease mix by contract'))}</span><span><b>${(cc.total_contracts || 0).toLocaleString()}</b> ${esc(t('leaseActivity.v2.contractsWord', 'contracts'))}</span></div>${laStackBar([{label: 'Renewal', value: ccRenewal, color: 'var(--accent)'}, {label: 'New', value: ccNewLease, color: 'var(--accent2)'}])}<div class="x4-comp-legend"><span><i style="background:var(--accent)"></i><b>${ccRenewal.toLocaleString()}</b> ${esc(t('leaseActivity.donut.renewal', 'Renewal'))} (${pctC(ccRenewal)}%)</span><span><i style="background:var(--accent2)"></i><b>${ccNewLease.toLocaleString()}</b> ${esc(t('leaseActivity.donut.new', 'New'))} (${pctC(ccNewLease)}%)</span></div></div>` : '';
    const side = `<div class="la4-card eb-side"><div class="la4-card-title">${esc(t('execsum.v5.leasingOps', 'Leasing & operations'))}</div><div class="x4-stats eb-stats">${stat(t('execsum.groupLeasing', 'Leasing'), t('execsum.rowRenewalContracts', 'Renewal Lease contracts'), ccRenewal.toLocaleString(), priorSnap ? momDeltaText(ccRenewal, priorSnap.renewalLeaseContracts, false) : null)}${stat(t('execsum.groupOperations', 'Operations'), t('execsum.rowRequestsProcessed', 'Requests processed (Request Count)'), rc.total_requests.toLocaleString(), priorSnap ? momDeltaText(rc.total_requests, priorSnap.totalRequests, false) : null)}</div>${mixHtml}${bstatHtml}</div>`;

    const issues = [...(dqStatusObj.criticalItems || []), ...(dqStatusObj.reviewItems || [])];
    const attn = `<div class="eb-attn dh-${dqStatusObj.status}">
      <div class="eb-attn-status"><div class="dh-status-label">${esc(t('execsum.dataStatusLabel', 'DATA STATUS'))}</div><div class="dh-status">${esc(dqStatusObj.statusLabel)}</div></div>
      <div class="eb-attn-pills">
        <div class="eb-pill"><span class="eb-pill-n" style="color:var(--ok)">${okCheckCount}<small>/${realCheckRows.length}</small></span><span class="eb-pill-l">${esc(t('execsum.crossChecksPassing', 'Cross-checks passing'))}</span></div>
        <div class="eb-pill"><span class="eb-pill-n" style="color:${reviewN ? 'var(--amber)' : 'var(--text)'}">${reviewN}</span><span class="eb-pill-l">${esc(t('execsum.needsSecondLook', 'Needs a second look'))}</span></div>
        <div class="eb-pill"><span class="eb-pill-n" style="color:${rate === null ? 'var(--text)' : underTarget ? 'var(--ok)' : 'var(--bad)'}">${rate !== null ? rate.toFixed(1) + '%' : '—'}</span><span class="eb-pill-l">${esc(t('execsum.bounceRateLabel', 'Bounce rate'))}</span></div>
      </div>
      <div class="eb-attn-list">${issues.length ? `<ul>${issues.slice(0, 2).map(x => `<li>${esc(x)}</li>`).join('')}</ul>${issues.length > 2 ? `<div class="la4-sub">${esc(t('execsum.moreSeeOverview', '+{n} more — see Overview for full details').replace('{n}', issues.length - 2))}</div>` : ''}` : `<div class="la4-sub">${esc(t('execsum.noCriticalClean', 'No critical data issues or reviews outstanding.'))}</div>`}</div>
    </div>`;

    heroWrap.innerHTML = `<div class="eb">
      <div class="eb-headline">${headline}</div>
      <div class="la4-tiles eb-tiles">${tiles}</div>
      <div class="eb-mid">
        <div class="la4-card eb-chart"><div class="la4-card-title">${esc(t('execsum.v5.dailyTitle', 'Daily activity'))}</div><div id="ebChartHost"></div></div>
        ${side}
      </div>
      ${attn}
    </div>`;
    laBuildChart(heroWrap.querySelector('#ebChartHost'), [
      {label: t('execsum.v5.serLines', 'Cheque lines'), unit: t('execsum.v5.linesUnit', 'cheque lines'), source: 'Cheque Count · fee/cheque lines per day', daily: cc.daily, color: 'var(--accent)'},
      {label: t('execsum.v5.serBounced', 'Bounced cheques'), unit: t('execsum.v5.bouncedUnit', 'bounced cheques'), source: 'Bounced Cheques · per day', daily: bc.daily, color: 'var(--bad)'},
    ]);
  })();
