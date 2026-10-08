var __v9L = window.__v9L || (window.__v9L = function(en, ar){ var a = false; try{ a = (typeof currentLangCC !== 'undefined' && currentLangCC === 'ar') || (typeof currentLangRC !== 'undefined' && currentLangRC === 'ar') || (typeof currentLangNL !== 'undefined' && currentLangNL === 'ar') || (typeof currentLangBC !== 'undefined' && currentLangBC === 'ar'); }catch(e){} return a ? ar : en; });
window.__v9Unit = window.__v9Unit || function(s){ if(!window.__v9L(false, true)) return s; var m = { 'records': 'سجل', 'record': 'سجل', 'requests': 'طلب', 'request': 'طلب', 'cheques': 'شيك', 'cheque': 'شيك', 'bounced cheques': 'شيك مرتجع', 'bounced cheque': 'شيك مرتجع', 'contracts': 'عقد', 'contract': 'عقد', 'installments': 'قسط', 'installment': 'قسط', 'line items': 'بند', 'line item': 'بند', 'fee lines': 'بند رسوم', 'fee line': 'بند رسوم' }; return String(s).replace(/\b(bounced cheques?|line items?|fee lines?|records?|requests?|cheques?|contracts?|installments?)\b/gi, function(w){ return m[w.toLowerCase()] || w; }); };

// TRIAL v8 (runs INSIDE each report iframe): simpler donut.
// A plain ring (no figures printed on it, nothing in the middle) and a ranked legend where every row
// shows the name, the report's own figure for it (count / amount, parsed from the original legend) and a share bar.
// The report's own donutChart is kept as donutChartLegacy and used if anything is unexpected.
function donutChart(){ var a = Array.prototype.slice.call(arguments); try{ var o = v8Donut(a); if(o) return o; }catch(e){ if(window.console) console.warn('v8Donut failed, legacy chart shown', e); (window.__v9Fallbacks = window.__v9Fallbacks || []).push('donut'); } return donutChartLegacy.apply(null, a); }
function v8Disp(f, l){ return (typeof dispType === 'function') ? dispType(f, l) : l; }
function v8Col(l, i){
  var k = String(l).toLowerCase();
  if(/^paid|cleared/.test(k)) return '#34d399';
  if(/legal/.test(k)) return '#f2698a';
  if(/process|pending/.test(k)) return '#f5b83d';
  return colorFor(l, i);
}
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
  var n = order.length;
  if(n > 4) return v9Rank(order, total, field);
  var W = 560, rowH = 34, H = Math.max(170, n * rowH + 24), cx = 90, cy = H / 2, r = 72, ri = 58;
  var ang = -90, paths = '';
  order.forEach(function(o){
    if(o.v <= 0) return;
    var frac = o.v / total, sweep = Math.min(frac * 360, 359.99), end = ang + sweep, rad = Math.PI / 180, big = sweep > 180 ? 1 : 0;
    var p = function(R, A){ return (cx + R * Math.cos(A * rad)).toFixed(2) + ',' + (cy + R * Math.sin(A * rad)).toFixed(2); };
    var d = 'M ' + p(r, ang) + ' A ' + r + ',' + r + ' 0 ' + big + ' 1 ' + p(r, end) + ' L ' + p(ri, end) + ' A ' + ri + ',' + ri + ' 0 ' + big + ' 0 ' + p(ri, ang) + ' Z';
    var attrs = field ? ' data-filter-field="' + field + '" data-filter-value="' + escAttr(o.l) + '" class="clickable-seg" role="button" tabindex="0"' : '';
    var pct = frac * 100, ptxt = pct > 0 && pct < 1 ? '<1%' : Math.round(pct) + '%';
    paths += '<g' + attrs + '><title>' + (field ? reportText('Click to filter: ') : '') + esc(v8Disp(field, o.l)) + ' — ' + esc(o.d.replace(/\s*\((&lt;|<)?\d+%\)\s*$/, '')) + ' (' + ptxt + ')</title><path d="' + d + '" fill="' + (a[4]==='status'?v8Col(o.l,o.i):colorFor(o.l, o.i)) + '" stroke="var(--card)" stroke-width="2"/></g>';
    ang = end;
  });
  var lx = 210, lw = W - lx - 14, legend = '';
  order.forEach(function(o, k){
    var y = (H - n * rowH) / 2 + k * rowH, pct = o.v / total * 100, ptxt = pct > 0 && pct < 1 ? '<1%' : Math.round(pct) + '%';
    var attrs = field ? ' data-filter-field="' + field + '" data-filter-value="' + escAttr(o.l) + '" class="clickable-seg" role="button" tabindex="0"' : '';
    var name = v8Disp(field, o.l), maxc = Math.max(8, Math.floor((lw - 120) / 7));
    if(name.length > maxc) name = name.slice(0, maxc - 1) + '…';
    var detail = o.d.replace(/\s*\((&lt;|<)?\d+%\)\s*$/, '').replace(/^1 (.+)s$/, '1 $1'); detail = window.__v9Unit(detail);
    legend += '<g' + attrs + '><rect x="' + lx + '" y="' + (y + 6) + '" width="10" height="10" rx="2" fill="' + (a[4]==='status'?v8Col(o.l,o.i):colorFor(o.l, o.i)) + '"/>'
      + '<text x="' + (lx + 18) + '" y="' + (y + 15) + '" font-size="12.5" fill="var(--text)">' + esc(reportText(name)) + '</text>'
      + '<text x="' + (lx + lw) + '" y="' + (y + 15) + '" font-size="12.5" font-weight="700" fill="var(--text)" text-anchor="end">' + (window.__v9L(false, true) ? '\u2066' + ptxt + '\u2069 \u00b7 ' + esc(detail) : esc(detail) + ' \u00b7 ' + ptxt) + '</text>'
      + '</g>';
  });
  return '<svg class="donut-svg" viewBox="0 0 ' + W + ' ' + H + '" xmlns="http://www.w3.org/2000/svg">' + paths + legend + '</svg>';
}

function v9Rank(order, total, field){
  var shown = order.slice(0, 6), rest = order.slice(6);
  var row = function(o, hidden){
    var pct = o.v / total * 100, ptxt = pct > 0 && pct < 1 ? '<1%' : Math.round(pct) + '%';
    var detail = o.d.replace(/\s*\((&lt;|<)?\d+%\)\s*$/, '').replace(/^1 (.+)s$/, '1 $1'); detail = window.__v9Unit(detail);
    var attrs = field ? ' data-filter-field="' + field + '" data-filter-value="' + escAttr(o.l) + '" class="v9-rank-row clickable-seg" role="button" tabindex="0"' : ' class="v9-rank-row"';
    var nm = v8Disp(field, o.l);
    return '<div' + attrs + (hidden ? ' data-more="1" style="display:none"' : '') + ' title="' + escAttr(nm) + '"><span class="nm">' + esc(reportText(nm)) + '</span><span class="bar"><i style="width:' + Math.max(pct, o.v > 0 ? 1.5 : 0).toFixed(1) + '%;background:' + (field==='status'?v8Col(o.l,o.i):colorFor(o.l, o.i)) + '"></i></span><span class="v">' + esc(detail) + '<small>' + ptxt + '</small></span></div>';
  };
  var html = '<div class="v9-rank">' + shown.map(function(o){ return row(o, false); }).join('') + rest.map(function(o){ return row(o, true); }).join('') + '</div>';
  if(rest.length) html += '<button type="button" class="v9-rank-more" onclick="var p=this.previousElementSibling;var on=this.getAttribute(\'data-on\')!==\'1\';p.querySelectorAll(\'[data-more]\').forEach(function(e){e.style.display=on?\'\':\'none\';});this.setAttribute(\'data-on\',on?\'1\':\'0\');this.textContent=on?\'' + __v9L('Show fewer', 'عرض أقل') + '\':\'' + __v9L('Show all ', 'عرض الكل ') + order.length + '\';">' + __v9L('Show all ', 'عرض الكل ') + order.length + '</button>';
  return html;
}
