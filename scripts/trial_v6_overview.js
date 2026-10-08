  // ---- TRIAL v6: Overview (Awqaf) as a briefing: headline, four report tiles, key changes ----
  (function(){
    const num = n => (n || 0).toLocaleString();
    const aedC = v => {
      const a = Math.abs(v || 0);
      if(a >= 1e6) return 'AED ' + parseFloat((v / 1e6).toFixed(2)) + 'M';
      if(a >= 1e3) return 'AED ' + Math.round(v / 1e3) + 'K';
      return 'AED ' + Math.round(v || 0);
    };
    const period = fmtPeriod(cc.date_min, cc.date_max);
    const rate = bounceRateAmt;
    const rateOk = rate !== null && rate < BOUNCE_TARGET;
    const renewShare = ccClassified ? Math.round((ccRenewal / ccClassified) * 100) : 0;
    const headline = `<b>${esc(period)}</b> · ${num(cc.total_lines)} cheque lines worth <b>${aedC(cc.total_amount)}</b>; `
      + `<b>${num(bc.total_count)}</b> bounced ` + (rate !== null ? `(<b class="${rateOk ? 'eb-ok' : 'eb-bad'}">${rate.toFixed(1)}%</b> of value, ${rateOk ? 'under' : 'over'} the ${BOUNCE_TARGET}% target). ` : '. ')
      + `<b>${num(ccClassified)}</b> lease contracts (${renewShare}% renewals) and <b>${num(rc.total_requests)}</b> requests processed.`;

    const leg = items => `<div class="eb-leg">${items.map(i => `<span><i style="background:${i.color}"></i>${esc(i.label)} <b>${i.text}</b></span>`).join('')}</div>`;
    // Interactive daily line: real calendar x-axis (gaps for days with no data, weekends shaded),
    // hover crosshair + tooltip with the exact date and value. Clicks on it don't open the tab.
    const sparks = [];
    const spark = (d, color, unit) => { sparks.push({daily: d, color: color, unit: unit}); return `<div class="ov6-spark" data-s="${sparks.length - 1}"></div>`; };
    const WD = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const drawSpark = (host, o) => {
      const e = Object.entries(o.daily || {}).sort((a, b) => a[0] < b[0] ? -1 : 1);
      if(e.length < 2){ host.innerHTML = ''; return; }
      const W = Math.max(Math.round(host.clientWidth) || 240, 120), H = 60, pl = 3, pr = 3, pt = 8, pb = 4;
      host.dataset.w = W;
      const f = laIsoParts(e[0][0]), l = laIsoParts(e[e.length - 1][0]);
      const t0 = Date.UTC(f.y, f.m - 1, f.d), t1 = Date.UTC(l.y, l.m - 1, l.d), dayMs = 86400000, span = Math.max((t1 - t0) / dayMs, 1);
      const max = Math.max(...e.map(x => x[1]), 1);
      const px = k => pl + (W - pl - pr) * k / span, py = v => pt + (H - pt - pb) * (1 - v / max);
      const dayIdx = iso => { const p = laIsoParts(iso); return (Date.UTC(p.y, p.m - 1, p.d) - t0) / dayMs; };
      let bands = '';
      for(let k = 0; k <= span; k++){ const dw = new Date(t0 + k * dayMs).getUTCDay(); if(dw === 6 || dw === 0){ const a = Math.max(px(k - 0.5), pl), b = Math.min(px(k + 0.5), W - pr); bands += `<rect x="${a.toFixed(1)}" y="0" width="${(b - a).toFixed(1)}" height="${H}" fill="var(--text)" opacity="0.05"/>`; } }
      const pts = e.map(x => px(dayIdx(x[0])).toFixed(1) + ',' + py(x[1]).toFixed(1));
      const area = `${px(dayIdx(e[0][0])).toFixed(1)},${H - pb} ${pts.join(' ')} ${px(dayIdx(e[e.length - 1][0])).toFixed(1)},${H - pb}`;
      const pk = e.reduce((b, x, i) => x[1] > e[b][1] ? i : b, 0);
      host.innerHTML = `<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="Daily trend, peak ${num(e[pk][1])} ${esc(o.unit)} on ${laShort(e[pk][0])}">${bands}<polygon points="${area}" fill="${o.color}" opacity="0.14"/><polyline points="${pts.join(' ')}" fill="none" stroke="${o.color}" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round"/><circle cx="${px(dayIdx(e[pk][0])).toFixed(1)}" cy="${py(e[pk][1]).toFixed(1)}" r="3.2" fill="${o.color}"/><line class="ov6-x" x1="0" x2="0" y1="0" y2="${H}" stroke="var(--text)" stroke-width="1" opacity="0"/><circle class="ov6-dot" r="3.6" cx="0" cy="0" fill="${o.color}" stroke="var(--card)" stroke-width="1.5" opacity="0"/></svg><div class="la4-tip ov6-tip" hidden></div>`;
      const svg = host.querySelector('svg'), tip = host.querySelector('.ov6-tip'), xl = svg.querySelector('.ov6-x'), dot = svg.querySelector('.ov6-dot');
      const byIso = new Map(e);
      svg.addEventListener('mousemove', ev => {
        const r = svg.getBoundingClientRect();
        const k = Math.min(Math.max(Math.round(((ev.clientX - r.left) / r.width * W - pl) / (W - pl - pr) * span), 0), span);
        const dt = new Date(t0 + k * dayMs);
        const iso = dt.getUTCFullYear() + '-' + String(dt.getUTCMonth() + 1).padStart(2, '0') + '-' + String(dt.getUTCDate()).padStart(2, '0');
        const v = byIso.get(iso), cx = px(k);
        xl.setAttribute('x1', cx); xl.setAttribute('x2', cx); xl.setAttribute('opacity', '0.35');
        if(v === undefined){ dot.setAttribute('opacity', '0'); } else { dot.setAttribute('cx', cx); dot.setAttribute('cy', py(v)); dot.setAttribute('opacity', '1'); }
        tip.hidden = false;
        tip.innerHTML = `<b>${WD[dt.getUTCDay()]} ${laShort(iso)}</b><br>${v === undefined ? '<span class="la4-sub">no activity recorded</span>' : '<b>' + num(v) + '</b> ' + esc(o.unit)}`;
        const hb = host.getBoundingClientRect();
        let left = ev.clientX - hb.left + 12; if(left > hb.width - 130) left = ev.clientX - hb.left - 130;
        tip.style.left = Math.max(left, 0) + 'px'; tip.style.top = '-34px';
      });
      svg.addEventListener('mouseleave', () => { tip.hidden = true; xl.setAttribute('opacity', '0'); dot.setAttribute('opacity', '0'); });
    };
    const sumDaily = (a, b) => { if(!a && !b) return null; const o = {}; [a, b].forEach(m => Object.entries(m || {}).forEach(([k, v]) => { o[k] = (o[k] || 0) + v; })); return o; };
    const tile = (o) => `<div class="ov6-tile${o.alert ? ' has-alert' : ''}" data-goto="${o.id}" role="link" tabindex="0">
      <div class="ov6-top"><span class="ov6-label">${esc(o.label)}</span><span class="ov6-go" aria-hidden="true">Open &rsaquo;</span></div>
      <div class="ov6-big">${o.big}</div>
      <div class="ov6-sub">${o.sub}</div>
      <div class="ov6-vis">${o.vis || ''}</div>
      ${o.spark || ''}
      <div class="ov6-foot">${o.foot}</div>
    </div>`;

    const bcN = k => (bc.status && bc.status[k]) || 0;
    const rcRen = (rc.type_counts && rc.type_counts['Renewal Lease']) || 0;
    const rcNew = (rc.type_counts && rc.type_counts['New Lease']) || 0;
    const laId = leaseActivityAvailable() ? 'lease-activity' : 'new-lease';

    const tiles = [
      tile({id: 'count-report', label: 'Cheque Count', big: num(cc.total_lines) + ' <small>lines</small>', sub: aedC(cc.total_amount) + ' recorded',
        spark: spark(cc.daily, 'var(--accent)', 'cheque lines'),
        foot: `<span><b>${num(cc.contracts_with_installments)}</b> contracts on installments</span><span><b>${num(cc.installments_total)}</b> installments · ${aedC(cc.install_amount)}</span>`}),
      tile({id: 'bounced-cheques', label: 'Bounced Cheques', big: num(bc.total_count) + ' <small>cheques</small>', alert: rate !== null && rate >= BOUNCE_TARGET,
        sub: aedC(bc.total_amount) + (rate !== null ? ` · <b class="${rateOk ? 'eb-ok' : 'eb-bad'}">${rate.toFixed(1)}%</b> of recorded value` : ''),
        vis: laStackBar([{label: 'Under Legal Action', value: bcN('Under Legal Action'), color: 'var(--bad)'}, {label: 'Under Process', value: bcN('Under Process'), color: 'var(--amber)'}, {label: 'Paid', value: bcN('PAID'), color: 'var(--ok)'}])
          + leg([{label: 'Legal', text: num(bcN('Under Legal Action')), color: 'var(--bad)'}, {label: 'Process', text: num(bcN('Under Process')), color: 'var(--amber)'}, {label: 'Paid', text: num(bcN('PAID')), color: 'var(--ok)'}]),
        spark: spark(bc.daily, 'var(--bad)', 'bounced cheques'),
        foot: `<span>Target &lt; <b>${BOUNCE_TARGET}%</b></span><span>${rateOk ? 'Within target' : 'Above target'}</span>`}),
      tile({id: laId, label: 'Lease Activity', big: num(ccClassified) + ' <small>contracts</small>', sub: `${renewShare}% renewals · ${num(ccNewLease)} new`,
        vis: laStackBar([{label: 'Renewal', value: ccRenewal, color: 'var(--accent)'}, {label: 'New', value: ccNewLease, color: 'var(--accent2)'}])
          + leg([{label: 'Renewal', text: num(ccRenewal), color: 'var(--accent)'}, {label: 'New', text: num(ccNewLease), color: 'var(--accent2)'}]),
        spark: (cc.new_lease_daily || cc.renewal_lease_daily) ? spark(sumDaily(cc.new_lease_daily, cc.renewal_lease_daily), 'var(--accent2)', 'lease contracts') : spark(cc.daily, 'var(--accent2)', 'cheque lines'),
        foot: `<span>New-lease rent <b>${aedC(nl.rent_value_total)}</b></span><span>Fees collected <b>${aedC(nl.total_amount)}</b></span>`}),
      tile({id: 'request-count', label: 'Request Count', big: num(rc.total_requests) + ' <small>requests</small>', sub: aedC(rc.total_amount),
        vis: laStackBar([{label: 'Renewal Lease', value: rcRen, color: 'var(--accent)'}, {label: 'New Lease', value: rcNew, color: 'var(--accent2)'}, {label: 'Other', value: rcOtherCount, color: 'var(--sub)'}])
          + leg([{label: 'Renewal', text: num(rcRen), color: 'var(--accent)'}, {label: 'New', text: num(rcNew), color: 'var(--accent2)'}, {label: 'Other', text: num(rcOtherCount), color: 'var(--sub)'}]),
        spark: spark(rc.daily, 'var(--accent)', 'requests'),
        foot: rcOtherEntries.length ? `<span>Largest other: <b>${esc(rcOtherEntries[0][0])}</b> (${num(rcOtherEntries[0][1])})</span>` : '<span>No other request types</span>'}),
    ].join('');

    wrap.innerHTML = `<div class="ov6"><div class="eb-headline">${headline}</div><div class="ov6-tiles">${tiles}</div>${keyChangesHtml || ''}</div>`;
    sparks.forEach((o, i) => {
      const host = wrap.querySelector('.ov6-spark[data-s="' + i + '"]');
      if(!host) return;
      host.addEventListener('click', ev => ev.stopPropagation());
      drawSpark(host, o);
      if(typeof ResizeObserver !== 'undefined') new ResizeObserver(() => { const w = Math.round(host.clientWidth); if(w > 0 && Math.abs(w - (+host.dataset.w || 0)) > 3) drawSpark(host, o); }).observe(host);
    });
    wrap.querySelectorAll('.ov6-tile').forEach(el => {
      const go = () => { if(document.getElementById('tab-' + el.dataset.goto)) selectTab(el.dataset.goto); };
      el.addEventListener('click', go);
      el.addEventListener('keydown', e => { if(e.key === 'Enter' || e.key === ' '){ e.preventDefault(); go(); } });
    });
  })();
