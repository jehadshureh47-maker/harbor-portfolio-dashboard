  // ---- Lease Activity v2 layout (trial v3) ----
  // Same three validated sources and the same numbers as before; they are
  // never added together. New: headline tiles, bigger mix donuts with border
  // rings, per-source daily trend (own scale each, so grains are not
  // compared on one axis), and one comparison table instead of repeated rows.
  const laNlNew = nl.total_new_leases || 0;
  const agree = laNlNew === ccNewLease;
  const agreeHtml = `<div class="la2-agree${agree ? '' : ' warn'}"><span class="dot"></span>${agree
    ? t('leaseActivity.v2.agree', 'Sources agree') + ': <b>' + ccNewLease.toLocaleString() + '</b> ' + t('leaseActivity.v2.agreeTail', 'new-lease contracts in both Cheque Count and New Lease')
    : t('leaseActivity.v2.differ', 'Sources differ') + ': Cheque Count <b>' + ccNewLease.toLocaleString() + '</b> vs New Lease <b>' + laNlNew.toLocaleString() + '</b> — ' + t('leaseActivity.v2.seeCross', 'see Cross-checks')}</div>`;

  const tile = (label, big, sub, delta, spark) => `<div class="la2-tile"><div class="la2-tile-label">${esc(label)}</div><div class="la2-tile-big bidi-ltr">${big}</div><div class="la2-tile-sub">${sub}</div><div class="la2-tile-delta">${delta || ''}</div>${spark ? `<div class="oc-spark">${spark}</div>` : ''}</div>`;
  const tiles = [
    tile(t('leaseActivity.v2.tileContracts', 'Lease contracts'), (cc.total_contracts || 0).toLocaleString(), esc(t('leaseActivity.v2.tileContractsSub', 'Cheque Count · contract-level')), dClassifiedTotal, sparklineSvg(cc.daily)),
    tile(t('leaseActivity.v2.tileRenewalShare', 'Renewal share'), pct(ccRenewal, cc.total_contracts), withPct(ccRenewal, cc.total_contracts) + ' ' + esc(t('leaseActivity.v2.ofContracts', 'of contracts')), dRenewalContracts, ''),
    tile(t('leaseActivity.v2.tileNew', 'New leases'), ccNewLease.toLocaleString(), esc(t('leaseActivity.v2.tileNewSub', 'distinct new-lease contracts')), dNewLeaseContracts, sparklineSvg(nl.daily)),
    tile(t('leaseActivity.v2.tileRent', 'New-lease rent value'), fmtAed(nl.rent_value_total), esc(t('leaseActivity.v2.totalFees', 'Total fees')) + ' ' + fmtAed(nl.total_amount), dRentValue, ''),
  ].join('');

  const seg = (label, value, color) => ({label, value, color});
  const contractsDonut = ccClassified
    ? laBigDonut([seg(t('leaseActivity.donut.renewal', 'Renewal'), ccRenewal, 'var(--accent)'), seg(t('leaseActivity.donut.new', 'New'), ccNewLease, 'var(--accent2)')], ccClassified.toLocaleString(), t('leaseActivity.v2.contractsWord', 'contracts'))
    : '<div class="la2-empty">—</div>';
  const requestsDonut = rcLeaseTotal
    ? laBigDonut([seg(t('leaseActivity.donut.renewal', 'Renewal'), rcRenewal, 'var(--accent)'), seg(t('leaseActivity.donut.new', 'New'), rcNew, 'var(--accent2)')], rcLeaseTotal.toLocaleString(), t('leaseActivity.v2.requestsWord', 'requests'))
    : '<div class="la2-empty">—</div>';
  const card = (title, source, period, body) => `<div class="la2-card"><div class="la2-card-head"><div><div class="la2-card-title">${esc(title)}</div><div class="la2-card-source">${esc(source)}</div></div>${period ? `<div class="la2-card-period bidi-ltr">${esc(period)}</div>` : ''}</div>${body}</div>`;

  const trendCard = (title, source, period, daily, color) => {
    const c = laTrendChart(daily, color);
    return card(title, source, period, `<div class="la2-trend-head"><span></span><span class="la2-trend-peak">${c.peak}</span></div>${c.svg}<div class="la2-axis">${c.axis}</div>`);
  };

  const rowHtml = (src, grain, total, ren, nw, share, delta) => `<tr><td class="src">${esc(src)}<div class="grain">${esc(grain)}</div></td><td class="num bidi-ltr">${total}</td><td class="num bidi-ltr">${ren}</td><td class="num bidi-ltr">${nw}</td><td class="num bidi-ltr">${share}</td><td>${delta || '<span class="grain">—</span>'}</td></tr>`;
  const table = `<table class="la2-table"><thead><tr><th>${esc(t('leaseActivity.v2.thSource', 'Source'))}</th><th class="num">${esc(t('leaseActivity.v2.thTotal', 'Total'))}</th><th class="num">${esc(t('leaseActivity.donut.renewal', 'Renewal'))}</th><th class="num">${esc(t('leaseActivity.donut.new', 'New'))}</th><th class="num">${esc(t('leaseActivity.v2.thShare', 'Renewal share'))}</th><th>${esc(t('leaseActivity.v2.thChange', 'Change'))}</th></tr></thead><tbody>${
    rowHtml('Cheque Count', t('leaseActivity.v2.grainContract', 'contracts (leaseType)'), (cc.total_contracts || 0).toLocaleString(), ccRenewal.toLocaleString(), ccNewLease.toLocaleString(), pct(ccRenewal, cc.total_contracts), dClassifiedTotal) +
    rowHtml('New Lease', t('leaseActivity.v2.grainDistinct', 'distinct new-lease contracts'), laNlNew.toLocaleString(), '—', laNlNew.toLocaleString(), '—', dNewLeaseContracts) +
    rowHtml('Request Count', t('leaseActivity.v2.grainRequest', 'requests (renewal + new only)'), rcLeaseTotal.toLocaleString(), rcRenewal.toLocaleString(), rcNew.toLocaleString(), pct(rcRenewal, rcLeaseTotal), dRcRenewal)
  }</tbody></table><div class="la2-note">${esc(t('leaseActivity.v2.grainNote', 'Three sources, three grains: contracts and requests are never added together.'))}${ccUnclassified ? ' ' + esc(ccUnclassified.toLocaleString()) + ' ' + esc(t('leaseActivity.v2.unclassified', 'contracts in Cheque Count have no renewal/new lease type.')) : ''}</div>`;

  wrap.innerHTML = `<div class="la2">
    ${agreeHtml}
    <div class="la2-tiles">${tiles}</div>
    <div class="la2-mix">
      ${card(t('leaseActivity.s1.title', 'Renewal vs New Lease — Contracts'), t('leaseActivity.s1.sub', 'Source: Cheque Count — leaseType, contract-level (validated)'), fmtPeriod(cc.date_min, cc.date_max), contractsDonut)}
      ${card(t('leaseActivity.s3.title', 'Renewal / New Lease — Requests'), t('leaseActivity.s3.sub', 'Source: Request Count — request-level, not contract counts'), fmtPeriod(rc.date_min, rc.date_max), requestsDonut)}
    </div>
    <div class="la2-trends">
      ${trendCard(t('leaseActivity.v2.trendContracts', 'Contracts per day'), 'Cheque Count', fmtPeriod(cc.date_min, cc.date_max), cc.daily, 'var(--accent)')}
      ${trendCard(t('leaseActivity.v2.trendNew', 'New leases per day'), 'New Lease', fmtPeriod(nl.date_min, nl.date_max), nl.daily, 'var(--ok)')}
      ${trendCard(t('leaseActivity.v2.trendRequests', 'Requests per day'), 'Request Count', fmtPeriod(rc.date_min, rc.date_max), rc.daily, 'var(--amber)')}
    </div>
    <div class="la2-card">
      <div class="la2-card-head"><div><div class="la2-card-title">${esc(t('leaseActivity.v2.compareTitle', 'Source comparison'))}</div><div class="la2-card-source">${esc(t('leaseActivity.v2.compareSub', 'Same figures as above, side by side. For fee and line-item detail see the New Lease Detail tab.'))}</div></div></div>
      ${table}
    </div>
  </div>`;
