
// TRIAL v8 (runs INSIDE each report iframe): simpler donut.
// A plain ring (no figures printed on it, nothing in the middle) and a ranked legend where every row
// shows the name, the report's own figure for it (count / amount, parsed from the original legend) and a share bar.
// The report's own donutChart is kept as donutChartLegacy and used if anything is unexpected.
function donutChart(){ var a = Array.prototype.slice.call(arguments); try{ var o = v8Donut(a); if(o) return o; }catch(e){} return donutChartLegacy.apply(null, a); }
function v8Disp(f, l){ return (typeof dispType === 'function') ? dispType(f, l) : l; }
function v8Donut(a){
  var dict = a[0] || {}, field = a[4] || null;
  var legacy = donutChartLegacy.apply(null, a);
  var entries = Object.entries(dict);
  if(!entries.length) return legacy;
  var total = entries.reduce(function(s, e){ return s + (e[1] > 0 ? e[1] : 0); }, 0);
  if(!total) return legacy;
  // the report's own figure per row = the small grey line under each legend label, in entry order
  var det = []; var re = /font-size="10\.5" fill="var\(--sub\)">([^<]*)<\/text><\/g>/g, m;
  while((m = re.exec(legacy))) det.push(m[1]);
  if(det.length !== entries.length) return legacy;
  var order = entries.map(function(e, i){ return { l: e[0], v: e[1], i: i, d: det[i] }; }).sort(function(x, y){ return y.v - x.v; });
  var n = order.length, W = 560, rowH = 38, H = Math.max(190, n * rowH + 24), cx = 100, cy = H / 2, r = 80, ri = 52;
  var ang = -90, paths = '';
  order.forEach(function(o){
    if(o.v <= 0) return;
    var frac = o.v / total, sweep = Math.min(frac * 360, 359.99), end = ang + sweep, rad = Math.PI / 180, big = sweep > 180 ? 1 : 0;
    var p = function(R, A){ return (cx + R * Math.cos(A * rad)).toFixed(2) + ',' + (cy + R * Math.sin(A * rad)).toFixed(2); };
    var d = 'M ' + p(r, ang) + ' A ' + r + ',' + r + ' 0 ' + big + ' 1 ' + p(r, end) + ' L ' + p(ri, end) + ' A ' + ri + ',' + ri + ' 0 ' + big + ' 0 ' + p(ri, ang) + ' Z';
    var attrs = field ? ' data-filter-field="' + field + '" data-filter-value="' + escAttr(o.l) + '" class="clickable-seg" role="button" tabindex="0"' : '';
    var pct = frac * 100, ptxt = pct > 0 && pct < 1 ? '<1%' : Math.round(pct) + '%';
    paths += '<g' + attrs + '><title>' + (field ? reportText('Click to filter: ') : '') + esc(v8Disp(field, o.l)) + ' — ' + esc(o.d.replace(/\s*\((&lt;|<)?\d+%\)\s*$/, '')) + ' (' + ptxt + ')</title><path d="' + d + '" fill="' + colorFor(o.l, o.i) + '" stroke="var(--card)" stroke-width="2"/></g>';
    ang = end;
  });
  var lx = 210, lw = W - lx - 14, legend = '';
  order.forEach(function(o, k){
    var y = (H - n * rowH) / 2 + k * rowH, pct = o.v / total * 100, ptxt = pct > 0 && pct < 1 ? '<1%' : Math.round(pct) + '%';
    var attrs = field ? ' data-filter-field="' + field + '" data-filter-value="' + escAttr(o.l) + '" class="clickable-seg" role="button" tabindex="0"' : '';
    var name = v8Disp(field, o.l), maxc = Math.max(8, Math.floor((lw - 120) / 7));
    if(name.length > maxc) name = name.slice(0, maxc - 1) + '…';
    var detail = o.d.replace(/\s*\((&lt;|<)?\d+%\)\s*$/, '');
    legend += '<g' + attrs + '><rect x="' + lx + '" y="' + (y + 6) + '" width="10" height="10" rx="2" fill="' + colorFor(o.l, o.i) + '"/>'
      + '<text x="' + (lx + 18) + '" y="' + (y + 15) + '" font-size="12.5" fill="var(--text)">' + esc(reportText(name)) + '</text>'
      + '<text x="' + (lx + lw) + '" y="' + (y + 15) + '" font-size="12.5" font-weight="700" fill="var(--text)" text-anchor="end">' + esc(detail) + ' · ' + ptxt + '</text>'
      + '<rect x="' + (lx + 18) + '" y="' + (y + 22) + '" width="' + (lw - 18) + '" height="4" rx="2" fill="var(--border)" opacity=".6"/>'
      + '<rect x="' + (lx + 18) + '" y="' + (y + 22) + '" width="' + Math.max((lw - 18) * pct / 100, o.v > 0 ? 2 : 0).toFixed(1) + '" height="4" rx="2" fill="' + colorFor(o.l, o.i) + '"/></g>';
  });
  return '<svg class="donut-svg" viewBox="0 0 ' + W + ' ' + H + '" xmlns="http://www.w3.org/2000/svg">' + paths + legend + '</svg>';
}
