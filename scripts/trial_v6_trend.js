// ================= TRIAL v6: Executive Summary — Trend & Outlook + Changes =================
// Month-by-month interactive chart, "latest vs previous" panel, watch-list, and a stats strip on Changes.
const V6_TREND_METRICS = [
  {key: 'totalCollected', label: 'Total recorded value', color: 'var(--accent)', kind: 'aed'},
  {key: 'bouncedAmount', label: 'Bounced / at risk', color: 'var(--bad)', kind: 'aed', inverse: true},
  {key: 'netCollected', label: 'Net recorded value', color: 'var(--ok)', kind: 'aed'},
  {key: 'bounceRatePct', label: 'Bounce rate', color: 'var(--amber)', kind: 'pct', inverse: true},
  {key: 'renewalLeaseContracts', label: 'Renewal contracts', color: 'var(--accent)', kind: 'n'},
  {key: 'newLeaseContracts', label: 'New-lease contracts', color: 'var(--accent2)', kind: 'n'},
  {key: 'totalRequests', label: 'Requests', color: 'var(--accent2)', kind: 'n'},
];
function v6Month(h){
  const k = h.periodKey || '', m = +k.slice(5, 7);
  return TREND_MONTH_NAMES[m] ? TREND_MONTH_NAMES[m] + " '" + k.slice(2, 4) : (h.period || k);
}
function v6Fmt(kind, v){
  if(v === null || v === undefined || isNaN(v)) return '—';
  if(kind === 'aed') return fmtAed(v);
  if(kind === 'pct') return v.toFixed(1) + '%';
  return Math.round(v).toLocaleString();
}
function v6FmtC(kind, v){
  if(kind === 'aed') return fmtAedCompact(v);
  if(kind === 'pct') return v.toFixed(1) + '%';
  return Math.round(v).toLocaleString();
}
function v6Delta(m, cur, prev){
  if(prev === null || prev === undefined || cur === null || cur === undefined) return '';
  const d = cur - prev;
  if(Math.abs(d) < 1e-9) return '<span class="v6d">no change</span>';
  const up = d > 0, bad = m.inverse ? up : !up;
  const arrow = up ? '&#9650;' : '&#9660;', sign = up ? '+' : '&minus;', a = Math.abs(d);
  let txt;
  if(m.kind === 'pct') txt = sign + a.toFixed(1) + ' pts';
  else {
    const pct = prev ? ' (' + sign + Math.round(a / Math.abs(prev) * 100) + '%)' : '';
    txt = sign + (m.kind === 'aed' ? fmtAedCompact(a) : Math.round(a).toLocaleString()) + pct;
  }
  return `<span class="v6d ${bad ? 'bad' : 'good'}">${arrow} ${txt}</span>`;
}
function v6TrendBuild(wrap, history){
  const avail = V6_TREND_METRICS.filter(m => history.filter(h => h[m.key] !== null && h[m.key] !== undefined).length >= 2);
  if(!avail.length) return false;
  let cur = 0;
  const chips = avail.map((m, i) => `<button type="button" class="la4-chip${i === 0 ? ' on' : ''}" data-i="${i}"><span class="la4-chip-dot" style="background:${m.color}"></span>${esc(m.label)}</button>`).join('');
  const last = history[history.length - 1], prev = history[history.length - 2];
  const rows = avail.map((m, i) => `<button type="button" class="v6t-row${i === 0 ? ' on' : ''}" data-i="${i}">
      <span class="v6t-rl"><i style="background:${m.color}"></i>${esc(m.label)}</span>
      <span class="v6t-rv bidi-ltr">${esc(v6Fmt(m.kind, last[m.key]))}</span>
      <span class="v6t-rd">${v6Delta(m, last[m.key], prev ? prev[m.key] : null)}</span></button>`).join('');
  wrap.innerHTML = `<div class="v6t">
    <div class="section-title" style="margin-top:0;"><span class="h2-dot"></span>Monthly Trend</div>
    <div class="section-note">Real totals from the ${history.length} months loaded so far — nothing projected or estimated.</div>
    <div class="v6t-grid">
      <div class="la4-card v6t-chartcard">
        <div class="la4-chips" role="tablist">${chips}</div>
        <div class="la4-chart-meta v6t-meta"></div>
        <div class="v6t-box"><div class="v6t-svg"></div><div class="la4-tip" hidden></div></div>
      </div>
      <div class="la4-card v6t-mom">
        <div class="la4-card-title">${esc(v6Month(last))} vs ${prev ? esc(v6Month(prev)) : 'previous'}</div>
        <div class="la4-sub v6t-momnote">Select a row to chart it</div>
        <div class="v6t-rows">${rows}</div>
      </div>
    </div></div>`;
  const meta = wrap.querySelector('.v6t-meta'), box = wrap.querySelector('.v6t-svg'), tip = wrap.querySelector('.la4-tip'), boxWrap = wrap.querySelector('.v6t-box');
  let lastW = 0;
  function draw(){
    const m = avail[cur];
    const pts = history.map((h, i) => ({h: h, i: i, v: h[m.key]})).filter(p => p.v !== null && p.v !== undefined);
    const W = Math.max(Math.round(box.clientWidth) || 560, 300), H = Math.min(Math.max(Math.round(W * 0.25), 190), 240);
    lastW = W;
    const pl = 52, pr = 18, pt = 24, pb = 30;
    const max = Math.max(...pts.map(p => p.v), 1) * (m.kind === 'pct' ? 1.25 : 1.12);
    const n = history.length, gap = (W - pl - pr) / n, bw = Math.min(gap * 0.5, 96);
    const cx = i => pl + gap * (i + 0.5), py = v => pt + (H - pt - pb) * (1 - v / max);
    let grid = '';
    for(let g = 0; g <= 4; g++){
      const v = max * g / 4, y = py(v);
      grid += `<line x1="${pl}" y1="${y.toFixed(1)}" x2="${W - pr}" y2="${y.toFixed(1)}" stroke="var(--border)" stroke-width="${g === 0 ? 1 : 0.6}" opacity="${g === 0 ? 0.9 : 0.45}"/><text x="${pl - 8}" y="${(y + 4).toFixed(1)}" text-anchor="end" class="la4-ax">${esc(v6FmtC(m.kind, v))}</text>`;
    }
    const latestI = pts[pts.length - 1].i;
    const bars = pts.map(p => `<rect x="${(cx(p.i) - bw / 2).toFixed(1)}" y="${py(p.v).toFixed(1)}" width="${bw.toFixed(1)}" height="${Math.max(py(0) - py(p.v), 1).toFixed(1)}" rx="6" fill="${m.color}" opacity="${p.i === latestI ? 0.92 : 0.5}"/>`).join('');
    const labels = pts.map(p => `<text x="${cx(p.i).toFixed(1)}" y="${(py(p.v) - 7).toFixed(1)}" text-anchor="middle" class="la4-ax v6t-val">${esc(v6FmtC(m.kind, p.v))}</text>`).join('');
    const months = history.map((h, i) => `<text x="${cx(i).toFixed(1)}" y="${H - 9}" text-anchor="middle" class="la4-ax">${esc(v6Month(h))}</text>`).join('');
    const line = pts.length > 1 ? `<polyline points="${pts.map(p => cx(p.i).toFixed(1) + ',' + py(p.v).toFixed(1)).join(' ')}" fill="none" stroke="var(--text)" stroke-opacity="0.55" stroke-width="1.6" stroke-linejoin="round"/>` + pts.map(p => `<circle cx="${cx(p.i).toFixed(1)}" cy="${py(p.v).toFixed(1)}" r="3.4" fill="var(--text)" fill-opacity="0.8"/>`).join('') : '';
    const hits = history.map((h, i) => `<rect class="v6t-hit" data-i="${i}" x="${(pl + gap * i).toFixed(1)}" y="${pt}" width="${gap.toFixed(1)}" height="${H - pt - pb}" fill="transparent"/>`).join('');
    box.innerHTML = `<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="${esc(m.label)} by month">${grid}${bars}${line}${labels}${months}<rect class="v6t-hl" x="0" y="${pt}" width="${gap.toFixed(1)}" height="${H - pt - pb}" fill="var(--text)" opacity="0"/>${hits}</svg>`;
    const lastV = pts[pts.length - 1], prevV = pts.length > 1 ? pts[pts.length - 2] : null;
    meta.innerHTML = `<span class="la4-meta-main"><b class="bidi-ltr">${esc(v6Fmt(m.kind, lastV.v))}</b> in ${esc(v6Month(lastV.h))} ${v6Delta(m, lastV.v, prevV ? prevV.v : null)}</span><span class="la4-meta-stats">${pts.length} months · hover a bar for detail</span>`;
    const svg = box.querySelector('svg'), hl = svg.querySelector('.v6t-hl');
    svg.querySelectorAll('.v6t-hit').forEach(r => {
      r.addEventListener('mousemove', ev => {
        const i = +r.dataset.i, h = history[i], pv = history.slice(0, i).reverse().find(x => x[m.key] !== null && x[m.key] !== undefined);
        hl.setAttribute('x', (pl + gap * i).toFixed(1)); hl.setAttribute('opacity', '0.06');
        tip.hidden = false;
        tip.innerHTML = `<b>${esc(v6Month(h))}</b><br>${h[m.key] === null || h[m.key] === undefined ? '<span class="la4-sub">not recorded</span>' : '<b class="bidi-ltr">' + esc(v6Fmt(m.kind, h[m.key])) + '</b>' + (pv ? '<br>' + v6Delta(m, h[m.key], pv[m.key]) + ' <span class="la4-sub">vs ' + esc(v6Month(pv)) + '</span>' : '')}`;
        const bx = boxWrap.getBoundingClientRect();
        let left = ev.clientX - bx.left + 14; if(left > bx.width - 190) left = ev.clientX - bx.left - 190;
        tip.style.left = Math.max(left, 4) + 'px'; tip.style.top = Math.max(ev.clientY - bx.top - 56, 2) + 'px';
      });
      r.addEventListener('mouseleave', () => { tip.hidden = true; hl.setAttribute('opacity', '0'); });
    });
  }
  function select(i){
    cur = i;
    wrap.querySelectorAll('.la4-chip').forEach(x => x.classList.toggle('on', +x.dataset.i === i));
    wrap.querySelectorAll('.v6t-row').forEach(x => x.classList.toggle('on', +x.dataset.i === i));
    draw();
  }
  wrap.querySelectorAll('.la4-chip, .v6t-row').forEach(b => b.addEventListener('click', () => select(+b.dataset.i)));
  draw();
  if(typeof ResizeObserver !== 'undefined') new ResizeObserver(() => { const w = Math.round(box.clientWidth); if(w > 0 && Math.abs(w - lastW) > 3) draw(); }).observe(box);
  return true;
}
function renderMonthlyTrend(){
  const wrap = document.getElementById('monthlyTrendWrap');
  if(!wrap) return;
  if(selectedPeriod === 'monthly'){
    const history = getMonthlyHistory(currentPortfolio);
    if(history.length >= 2){
      const recent = history.slice(-6);
      wrap.style.display = 'block';
      if(v6TrendBuild(wrap, recent)) return;
    }
  }
  renderMonthlyTrendLegacy();
}
function v6Forward(items, depth, listHtml, noteHtml){
  if(!items.length){
    return `<div class="v6w v6w-ok"><div class="v6w-head"><span class="v6w-dot"></span><b>All clear</b><span class="v6w-sub">No items outstanding based on today's cross-checks, thresholds and data-quality status.</span></div></div>` + noteHtml;
  }
  const shown = items.slice(0, 8);
  return `<div class="v6w"><div class="v6w-head"><b>Items to review next period</b><span class="v6w-count">${items.length}</span></div>
    <ul class="v6w-list">${shown.map(txt => `<li><span class="v6w-dot"></span><span>${txt}</span></li>`).join('')}</ul>
    ${items.length > 8 ? `<div class="v6w-more">+${items.length - 8} more</div>` : ''}</div>` + noteHtml;
}
function renderChangedRecords(){
  renderChangedRecordsLegacy();
  try{
    const wrap = document.getElementById('changedRecordsWrap');
    if(!wrap || wrap.style.display === 'none') return;
    const diff = computeChangedRecords(currentPortfolio);
    if(!diff || diff.unavailable) return;
    const toggle = wrap.querySelector('.changed-toggle');
    if(!toggle || wrap.querySelector('.chg6-stats')) return;
    const sum = list => list.reduce((s, x) => s + ((x.record && Number(x.record.amount)) || 0), 0);
    const addAmt = sum(diff.addedDetailed), resAmt = sum(diff.resolvedDetailed), net = addAmt - resAmt;
    const tile = (id, cls, label, big, sub, on) => `<button type="button" class="chg6-tile ${cls}${on ? ' on' : ''}" data-click="${id}"><span class="chg6-l">${label}</span><span class="chg6-b bidi-ltr">${big}</span><span class="chg6-s">${sub}</span></button>`;
    const addedOn = (typeof changedRecordsView === 'undefined') || changedRecordsView !== 'resolved';
    const html = `<div class="chg6-stats">
      ${tile('changedViewAdded', 'bad', 'New bounced cheques', diff.added.length, esc(fmtAedCompact(addAmt)) + ' AED added', addedOn)}
      ${tile('changedViewResolved', 'good', 'No longer present', diff.resolved.length, esc(fmtAedCompact(resAmt)) + ' AED cleared', !addedOn)}
      <div class="chg6-tile ${net > 0 ? 'bad' : 'good'} static"><span class="chg6-l">Net change in bounced value</span><span class="chg6-b bidi-ltr">${net > 0 ? '&#9650; +' : net < 0 ? '&#9660; &minus;' : ''}${esc(fmtAedCompact(Math.abs(net)))}</span><span class="chg6-s">vs ${esc(diff.prevPeriod)}</span></div>
    </div>`;
    toggle.insertAdjacentHTML('beforebegin', html);
    toggle.style.display = 'none';
    wrap.querySelectorAll('.chg6-tile[data-click]').forEach(b => b.addEventListener('click', () => { const t = document.getElementById(b.dataset.click); if(t) t.click(); }));
  } catch(e){ console.warn('v6 changes stats', e); }
}
