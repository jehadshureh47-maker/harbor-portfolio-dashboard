// ---- Lease Activity v4 helpers ----
function laStackBar(segs){
  const total = segs.reduce((a, s) => a + s.value, 0) || 1;
  const parts = segs.filter(s => s.value > 0).map(s => `<i style="flex:${Math.max(s.value / total, 0.012)} 1 0;background:${s.color}" title="${esc(s.label)}: ${s.value.toLocaleString()}"></i>`).join('');
  return `<div class="la4-bar" role="img" aria-label="${esc(segs.map(s => s.label + ' ' + s.value.toLocaleString()).join(', '))}">${parts}</div>`;
}
function laIsoParts(iso){ const p = iso.split('-'); return {y:+p[0], m:+p[1], d:+p[2]}; }
function laShort(iso){ const p = iso.split('-'); return p[2] + '/' + p[1]; }
function laNiceMax(v){
  if(v <= 5) return 5;
  const pow = Math.pow(10, Math.floor(Math.log10(v)));
  const n = v / pow;
  const step = n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10;
  return step * pow;
}
// One interactive daily chart for a list of series. Real calendar x-axis (days
// with no data are gaps, weekends shaded), y ticks, average line, peak marker,
// hover readout. Each series keeps its own scale so grains are never mixed.
function laBuildChart(host, series){
  const state = {i: 0};
  let lastW = 0, lastH = 0;
  const chipsHtml = series.map((s, i) => `<button type="button" class="la4-chip${i === 0 ? ' on' : ''}" data-i="${i}"><span class="la4-chip-dot" style="background:${s.color}"></span>${esc(s.label)}</button>`).join('');
  host.innerHTML = `<div class="la4-chips" role="tablist">${chipsHtml}</div><div class="la4-chart-meta"></div><div class="la4-chart-box"><div class="la4-chart-svg"></div><div class="la4-tip" hidden></div></div>`;
  const meta = host.querySelector('.la4-chart-meta');
  const box = host.querySelector('.la4-chart-svg');
  const tip = host.querySelector('.la4-tip');
  function draw(){
    const s = series[state.i];
    const e = Object.entries(s.daily || {}).sort((a, b) => a[0] < b[0] ? -1 : 1);
    if(e.length < 2){ box.innerHTML = '<div class="la2-empty">Not enough days to chart</div>'; meta.innerHTML = ''; return; }
    const first = e[0][0], last = e[e.length - 1][0];
    const f = laIsoParts(first), l = laIsoParts(last);
    const t0 = Date.UTC(f.y, f.m - 1, f.d), t1 = Date.UTC(l.y, l.m - 1, l.d);
    const dayMs = 86400000, span = Math.max((t1 - t0) / dayMs, 1);
    const fill = !!host.closest('.eb-chart');
    const W = Math.max(Math.round(box.clientWidth) || 760, 360);
    const fillH = fill ? Math.round(box.clientHeight) : 0;
    const H = fillH >= 150 ? Math.min(fillH, 420) : Math.min(Math.max(Math.round(W * 0.21), 170), 230);
    const pl = 44, pr = 24, pt = 14, pb = 26;
    lastW = W; lastH = fillH;
    const vals = e.map(x => x[1]);
    const rawMax = Math.max(...vals, 1);
    const top = laNiceMax(rawMax);
    const total = vals.reduce((a, b) => a + b, 0);
    const avg = total / vals.length;
    const px = iso => { const p = laIsoParts(iso); return pl + (W - pl - pr) * ((Date.UTC(p.y, p.m - 1, p.d) - t0) / dayMs) / span; };
    const py = v => pt + (H - pt - pb) * (1 - v / top);
    let bands = '';
    for(let k = 0; k <= span; k++){
      const dw = new Date(t0 + k * dayMs).getUTCDay();
      if(dw === 6 || dw === 0){
        const x0 = pl + (W - pl - pr) * (k - 0.5) / span, x1 = pl + (W - pl - pr) * (k + 0.5) / span;
        const a = Math.max(x0, pl), b = Math.min(x1, W - pr);
        bands += `<rect x="${a.toFixed(1)}" y="${pt}" width="${(b - a).toFixed(1)}" height="${H - pt - pb}" fill="var(--text)" opacity="0.05"/>`;
      }
    }
    const nT = [4, 5, 3, 2].find(n => Number.isInteger(top / n)) || 4;
    const ticks = Array.from({length: nT + 1}, (_, i) => i / nT).map(fr => {
      const v = top * fr, y = py(v);
      return `<line x1="${pl}" y1="${y.toFixed(1)}" x2="${W - pr}" y2="${y.toFixed(1)}" stroke="var(--border)" stroke-width="${fr === 0 ? 1 : 0.6}" opacity="${fr === 0 ? 0.9 : 0.45}"/><text x="${pl - 8}" y="${(y + 4).toFixed(1)}" text-anchor="end" class="la4-ax">${Math.round(v).toLocaleString()}</text>`;
    }).join('');
    const step = span > 20 ? 7 : span > 10 ? 3 : 1;
    let xlabels = '';
    for(let k = 0; k <= span; k += step){
      const dt = new Date(t0 + k * dayMs);
      xlabels += `<text x="${(pl + (W - pl - pr) * k / span).toFixed(1)}" y="${H - 8}" text-anchor="middle" class="la4-ax">${String(dt.getUTCDate()).padStart(2, '0')}/${String(dt.getUTCMonth() + 1).padStart(2, '0')}</text>`;
    }
    const pts = e.map(x => px(x[0]).toFixed(1) + ',' + py(x[1]).toFixed(1));
    const area = `${px(first).toFixed(1)},${py(0)} ${pts.join(' ')} ${px(last).toFixed(1)},${py(0)}`;
    const pk = vals.indexOf(rawMax);
    const avgLine = `<line x1="${pl}" y1="${py(avg).toFixed(1)}" x2="${W - pr}" y2="${py(avg).toFixed(1)}" stroke="${s.color}" stroke-width="1" stroke-dasharray="4 4" opacity="0.7"/>`;
    const dots = e.map(x => `<circle cx="${px(x[0]).toFixed(1)}" cy="${py(x[1]).toFixed(1)}" r="2.2" fill="${s.color}"/>`).join('');
    box.innerHTML = `<svg viewBox="0 0 ${W} ${H}" class="la4-svg" role="img" aria-label="${esc(s.label)} per day, peak ${rawMax} on ${laShort(e[pk][0])}">${bands}${ticks}${xlabels}<polygon points="${area}" fill="${s.color}" opacity="0.13"/>${avgLine}<polyline points="${pts.join(' ')}" fill="none" stroke="${s.color}" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round"/>${dots}<circle cx="${px(e[pk][0]).toFixed(1)}" cy="${py(rawMax).toFixed(1)}" r="5" fill="${s.color}" stroke="var(--card)" stroke-width="2"/><line class="la4-cross" x1="0" x2="0" y1="${pt}" y2="${H - pb}" stroke="var(--text)" stroke-width="1" opacity="0"/><rect class="la4-hit" x="${pl}" y="${pt}" width="${W - pl - pr}" height="${H - pt - pb}" fill="transparent"/></svg>`;
    meta.innerHTML = `<span class="la4-meta-main"><b class="bidi-ltr">${total.toLocaleString()}</b> ${esc(s.unit)} · <span class="la4-sub">${esc(s.source)}</span></span><span class="la4-meta-stats">${t('leaseActivity.v2.peak','Peak')} <b class="bidi-ltr">${rawMax.toLocaleString()}</b> · ${laShort(e[pk][0])} &nbsp;|&nbsp; ${esc(t('leaseActivity.v4.avg','Avg / active day'))} <b class="bidi-ltr">${avg.toFixed(avg >= 10 ? 0 : 1)}</b> &nbsp;|&nbsp; <span class="la4-sub">${esc(t('leaseActivity.v4.weekendNote','shaded = weekend'))}</span></span>`;
    const svg = box.querySelector('svg'), cross = svg.querySelector('.la4-cross'), hit = svg.querySelector('.la4-hit');
    const byIso = new Map(e);
    hit.addEventListener('mousemove', ev => {
      const r = svg.getBoundingClientRect();
      const vx = (ev.clientX - r.left) / r.width * W;
      const dayIdx = Math.min(Math.max(Math.round((vx - pl) / (W - pl - pr) * span), 0), span);
      const dt = new Date(t0 + dayIdx * dayMs);
      const iso = dt.getUTCFullYear() + '-' + String(dt.getUTCMonth() + 1).padStart(2, '0') + '-' + String(dt.getUTCDate()).padStart(2, '0');
      const v = byIso.get(iso);
      const cx = pl + (W - pl - pr) * dayIdx / span;
      cross.setAttribute('x1', cx); cross.setAttribute('x2', cx); cross.setAttribute('opacity', '0.35');
      const wd = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][dt.getUTCDay()];
      tip.hidden = false;
      tip.innerHTML = `<b>${wd} ${laShort(iso)}</b><br>${v === undefined ? '<span class="la4-sub">' + esc(t('leaseActivity.v4.noData', 'no activity recorded')) + '</span>' : '<span class="bidi-ltr"><b>' + v.toLocaleString() + '</b></span> ' + esc(s.unit)}`;
      const bx = box.getBoundingClientRect();
      let left = ev.clientX - bx.left + 14; if(left > bx.width - 150) left = ev.clientX - bx.left - 150;
      tip.style.left = Math.max(left, 4) + 'px'; tip.style.top = Math.max(ev.clientY - bx.top - 46, 2) + 'px';
    });
    hit.addEventListener('mouseleave', () => { tip.hidden = true; cross.setAttribute('opacity', '0'); });
  }
  host.querySelectorAll('.la4-chip').forEach(b => b.addEventListener('click', () => {
    state.i = +b.dataset.i;
    host.querySelectorAll('.la4-chip').forEach(x => x.classList.toggle('on', x === b));
    draw();
  }));
  draw();
  if(typeof ResizeObserver !== 'undefined'){
    new ResizeObserver(() => { const w = Math.round(box.clientWidth), h = Math.round(box.clientHeight); if(w > 0 && (Math.abs(w - lastW) > 3 || (host.closest('.eb-chart') && Math.abs(h - lastH) > 3))) draw(); }).observe(box);
  }
}
