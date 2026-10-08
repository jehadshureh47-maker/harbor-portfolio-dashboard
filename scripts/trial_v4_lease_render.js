  // ---- Lease Activity v4 layout (trial v4) ----
  // Same three validated sources, never added together. Daily charts use the
  // real per-day CONTRACT counts (Cheque Count new_lease_daily / renewal_lease_daily,
  // each contract counted once on its first date) and Request Count's daily rows.
  const laNlNew = nl.total_new_leases || 0;
  const agree = laNlNew === ccNewLease;
  const agreeHtml = `<div class="la2-agree${agree ? '' : ' warn'}"><span class="dot"></span>${agree
    ? t('leaseActivity.v2.agree', 'Sources agree') + ': <b>' + ccNewLease.toLocaleString() + '</b> ' + t('leaseActivity.v2.agreeTail', 'new-lease contracts in both Cheque Count and New Lease')
    : t('leaseActivity.v2.differ', 'Sources differ') + ': Cheque Count <b>' + ccNewLease.toLocaleString() + '</b> vs New Lease <b>' + laNlNew.toLocaleString() + '</b> — ' + t('leaseActivity.v2.seeCross', 'see Cross-checks')}</div>`;

  const C_REN = 'var(--accent)', C_NEW = 'var(--accent2)';
  const rentVal = nl.rent_value_total || 0, feeTotal = nl.total_amount || 0;
  const tile = (label, big, sub, delta, visual) => `<div class="la4-tile"><div class="la4-tile-label">${esc(label)}</div><div class="la4-tile-big bidi-ltr">${big}</div><div class="la4-tile-sub">${sub}</div><div class="la4-tile-delta">${delta || '&nbsp;'}</div><div class="la4-tile-vis">${visual || ''}</div></div>`;
  const tiles = [
    tile(t('leaseActivity.v2.tileContracts', 'Lease contracts'), (cc.total_contracts || 0).toLocaleString(), esc(t('leaseActivity.v2.tileContractsSub', 'Cheque Count · contract-level')), dClassifiedTotal, laStackBar([{label: 'Renewal', value: ccRenewal, color: C_REN}, {label: 'New', value: ccNewLease, color: C_NEW}, {label: 'Other', value: ccUnclassified, color: 'var(--border)'}])),
    tile(t('leaseActivity.v2.tileRenewalShare', 'Renewal share'), pct(ccRenewal, cc.total_contracts), withPct(ccRenewal, cc.total_contracts) + ' ' + esc(t('leaseActivity.v2.ofContracts', 'of contracts')), dRenewalContracts, `<div class="la4-gauge"><i style="width:${cc.total_contracts ? Math.min(100, ccRenewal / cc.total_contracts * 100).toFixed(1) : 0}%;background:${C_REN}"></i></div>`),
    tile(t('leaseActivity.v2.tileNew', 'New leases'), ccNewLease.toLocaleString(), esc(t('leaseActivity.v2.tileNewSub', 'distinct new-lease contracts')), dNewLeaseContracts, `<div class="la4-gauge"><i style="width:${cc.total_contracts ? Math.max(2, ccNewLease / cc.total_contracts * 100).toFixed(1) : 0}%;background:${C_NEW}"></i></div>`),
    tile(t('leaseActivity.v2.tileRent', 'New-lease rent value'), fmtAed(rentVal), esc(t('leaseActivity.v2.totalFees', 'Total fees')) + ' ' + fmtAed(feeTotal), dRentValue, laStackBar([{label: 'Rent', value: rentVal, color: 'var(--amber)'}, {label: 'Other fees', value: Math.max(feeTotal - rentVal, 0), color: 'var(--border)'}])),
  ].join('');

  const mixRow = (title, source, a, b, unit) => {
    const tot = a + b;
    return `<div class="la4-mix-row"><div class="la4-mix-head"><div><div class="la4-mix-title">${esc(title)}</div><div class="la4-sub">${esc(source)}</div></div><div class="la4-mix-total bidi-ltr">${tot.toLocaleString()} <span class="la4-sub">${esc(unit)}</span></div></div>${laStackBar([{label: 'Renewal', value: a, color: C_REN}, {label: 'New', value: b, color: C_NEW}])}<div class="la4-mix-legend"><span><i style="background:${C_REN}"></i>${esc(t('leaseActivity.donut.renewal', 'Renewal'))} <b class="bidi-ltr">${a.toLocaleString()}</b> <em>${tot ? '(' + Math.round(a / tot * 100) + '%)' : ''}</em></span><span><i style="background:${C_NEW}"></i>${esc(t('leaseActivity.donut.new', 'New'))} <b class="bidi-ltr">${b.toLocaleString()}</b> <em>${tot ? '(' + Math.round(b / tot * 100) + '%)' : ''}</em></span></div></div>`;
  };
  const mixCard = `<div class="la4-card la4-mixcard"><div class="la4-card-title">${esc(t('leaseActivity.v4.mixTitle', 'Renewal vs new lease'))}</div><div class="la4-sub la4-card-note">${esc(t('leaseActivity.v4.mixNote', 'Two grains side by side — never added together'))}</div>${
    mixRow(t('leaseActivity.v4.byContract', 'By contract'), 'Cheque Count · leaseType', ccRenewal, ccNewLease, t('leaseActivity.v2.contractsWord', 'contracts')) +
    mixRow(t('leaseActivity.v4.byRequest', 'By request'), 'Request Count · request-level', rcRenewal, rcNew, t('leaseActivity.v2.requestsWord', 'requests'))
  }</div>`;

  const rowHtml = (src, grain, total, ren, nw, share, delta) => `<tr><td class="src">${esc(src)}<div class="grain">${esc(grain)}</div></td><td class="num"><span class="bidi-ltr">${total}</span></td><td class="num"><span class="bidi-ltr">${ren}</span></td><td class="num"><span class="bidi-ltr">${nw}</span></td><td class="num"><span class="bidi-ltr">${share}</span></td><td class="chg">${delta || '<span class="grain">—</span>'}</td></tr>`;
  const table = `<table class="la2-table"><thead><tr><th>${esc(t('leaseActivity.v2.thSource', 'Source'))}</th><th class="num">${esc(t('leaseActivity.v2.thTotal', 'Total'))}</th><th class="num">${esc(t('leaseActivity.donut.renewal', 'Renewal'))}</th><th class="num">${esc(t('leaseActivity.donut.new', 'New'))}</th><th class="num">${esc(t('leaseActivity.v2.thShare', 'Renewal share'))}</th><th>${esc(t('leaseActivity.v2.thChange', 'Change'))}</th></tr></thead><tbody>${
    rowHtml('Cheque Count', t('leaseActivity.v2.grainContract', 'contracts (leaseType)'), (cc.total_contracts || 0).toLocaleString(), ccRenewal.toLocaleString(), ccNewLease.toLocaleString(), pct(ccRenewal, cc.total_contracts), dClassifiedTotal) +
    rowHtml('New Lease', t('leaseActivity.v2.grainDistinct', 'distinct new-lease contracts'), laNlNew.toLocaleString(), '—', laNlNew.toLocaleString(), '—', dNewLeaseContracts) +
    rowHtml('Request Count', t('leaseActivity.v2.grainRequest', 'requests (renewal + new only)'), rcLeaseTotal.toLocaleString(), rcRenewal.toLocaleString(), rcNew.toLocaleString(), pct(rcRenewal, rcLeaseTotal), dRcRenewal)
  }</tbody></table><div class="la2-note">${esc(t('leaseActivity.v2.grainNote', 'Three sources, three grains: contracts and requests are never added together.'))}${ccUnclassified ? ' ' + esc(ccUnclassified.toLocaleString()) + ' ' + esc(t('leaseActivity.v2.unclassified', 'contracts in Cheque Count have no renewal/new lease type.')) : ''}</div>`;

  wrap.innerHTML = `<div class="la2 la4">
    ${agreeHtml}
    <div class="la4-tiles">${tiles}</div>
    <div class="la4-main">
      ${mixCard}
      <div class="la4-card la4-trendcard"><div class="la4-card-title">${esc(t('leaseActivity.v4.dailyTitle', 'Daily activity'))}</div><div id="la4ChartHost"></div></div>
    </div>
    <div class="la4-card"><div class="la4-card-title">${esc(t('leaseActivity.v2.compareTitle', 'Source comparison'))}</div><div class="la4-sub la4-card-note">${esc(t('leaseActivity.v2.compareSub', 'Same figures as above, side by side. For fee and line-item detail see the New Lease Detail tab.'))}</div>${table}</div>
  </div>`;
  laBuildChart(wrap.querySelector('#la4ChartHost'), [
    {label: t('leaseActivity.v4.serNew', 'New-lease contracts'), unit: t('leaseActivity.v2.contractsWord', 'contracts'), source: 'Cheque Count · by first date', daily: cc.new_lease_daily, color: 'var(--accent2)'},
    {label: t('leaseActivity.v4.serRen', 'Renewal contracts'), unit: t('leaseActivity.v2.contractsWord', 'contracts'), source: 'Cheque Count · by first date', daily: cc.renewal_lease_daily, color: 'var(--accent)'},
    {label: t('leaseActivity.v4.serReq', 'Requests'), unit: t('leaseActivity.v2.requestsWord', 'requests'), source: 'Request Count', daily: rc.daily, color: 'var(--amber)'},
  ]);
