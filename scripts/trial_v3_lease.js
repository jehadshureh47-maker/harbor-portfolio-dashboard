// ---- Lease Activity v2 helpers ----
function laBigDonut(segs, centerText, centerSub){
  const size = 150, stroke = 20, r = (size - stroke) / 2, c = 2 * Math.PI * r, cx = size / 2, cy = size / 2;
  const total = segs.reduce((a, s) => a + s.value, 0) || 1;
  let off = 0;
  const arcs = segs.filter(s => s.value > 0).map(s => {
    const len = (s.value / total) * c;
    const rot = (off / total) * 360 - 90;
    off += s.value;
    return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${s.color}" stroke-width="${stroke}" stroke-dasharray="${len.toFixed(2)} ${(c - len).toFixed(2)}" transform="rotate(${rot.toFixed(2)} ${cx} ${cy})"/>`;
  }).join('');
  const rings = `<circle cx="${cx}" cy="${cy}" r="${(r + stroke / 2).toFixed(1)}" fill="none" stroke="var(--border)" stroke-width="1.5"/><circle cx="${cx}" cy="${cy}" r="${(r - stroke / 2).toFixed(1)}" fill="none" stroke="var(--border)" stroke-width="1.5"/>`;
  const legend = segs.map(s => `<div class="la2-leg-row"><span class="la2-dot" style="background:${s.color}"></span><span class="la2-leg-label">${esc(s.label)}</span><span class="la2-leg-val bidi-ltr">${s.value.toLocaleString()} <em>(${Math.round(s.value / total * 100)}%)</em></span></div>`).join('');
  return `<div class="la2-donut"><svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" role="img" aria-label="${esc(centerSub || '')} ${esc(centerText)}"><circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="var(--card2)" stroke-width="${stroke}"/>${arcs}${rings}<text x="50%" y="46%" text-anchor="middle" dominant-baseline="central" class="la2-donut-num">${esc(centerText)}</text><text x="50%" y="63%" text-anchor="middle" dominant-baseline="central" class="la2-donut-sub">${esc(centerSub || '')}</text></svg><div class="la2-legend">${legend}</div></div>`;
}
function laTrendChart(daily, color){
  if(!daily) return {svg:'<div class="la2-empty">No daily data</div>', peak:'', axis:''};
  const e = Object.entries(daily).sort((a, b) => a[0] < b[0] ? -1 : (a[0] > b[0] ? 1 : 0));
  if(e.length < 2) return {svg:'<div class="la2-empty">Not enough days to chart</div>', peak:'', axis:''};
  const w = 320, h = 110, pl = 8, pr = 8, pt = 12, pb = 8;
  const vals = e.map(x => x[1]);
  const max = Math.max(...vals, 1);
  const px = i => pl + (w - pl - pr) * i / (e.length - 1);
  const py = v => pt + (h - pt - pb) * (1 - v / max);
  const pts = e.map((x, i) => px(i).toFixed(1) + ',' + py(x[1]).toFixed(1));
  const pk = vals.indexOf(max);
  const sd = iso => { const p = iso.split('-'); return p[2] + '/' + p[1]; };
  const area = `${pl},${h - pb} ${pts.join(' ')} ${w - pr},${h - pb}`;
  const svg = `<svg class="la2-trend-svg" viewBox="0 0 ${w} ${h}" role="img" aria-label="Daily activity, peak ${max} on ${sd(e[pk][0])}"><title>Daily activity ${sd(e[0][0])} – ${sd(e[e.length - 1][0])}</title><line x1="${pl}" y1="${h - pb}" x2="${w - pr}" y2="${h - pb}" stroke="var(--border)" stroke-width="1" vector-effect="non-scaling-stroke"/><polyline points="${area}" fill="${color}" opacity="0.14" stroke="none"/><polyline points="${pts.join(' ')}" fill="none" stroke="${color}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round" vector-effect="non-scaling-stroke"/><circle cx="${px(pk).toFixed(1)}" cy="${py(max).toFixed(1)}" r="3.5" fill="${color}" stroke="var(--card)" stroke-width="1.5"/></svg>`;
  return {svg, peak: `${t('leaseActivity.v2.peak','Peak')} <b>${max.toLocaleString()}</b> · ${sd(e[pk][0])}`, axis: `<span class="bidi-ltr">${sd(e[0][0])}</span><span class="bidi-ltr">${sd(e[e.length - 1][0])}</span>`};
}
