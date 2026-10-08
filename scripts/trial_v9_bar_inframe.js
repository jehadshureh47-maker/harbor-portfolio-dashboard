var __v9L = window.__v9L || (window.__v9L = function(en, ar){ var a = false; try{ a = (typeof currentLangCC !== 'undefined' && currentLangCC === 'ar') || (typeof currentLangRC !== 'undefined' && currentLangRC === 'ar') || (typeof currentLangNL !== 'undefined' && currentLangNL === 'ar') || (typeof currentLangBC !== 'undefined' && currentLangBC === 'ar'); }catch(e){} return a ? ar : en; });
window.__v9Aed = window.__v9Aed || function(v){ var s = Math.round(v).toLocaleString(); return window.__v9L('AED ' + s, s + ' د.إ'); };
function hbarChart(dataDict, w, h, color, labelW, field, fmt){
  var entries = Object.entries(dataDict || {});
  if(entries.length === 0) return '<div class="empty-note">' + reportText('No data') + '</div>';
  var fmtVal = function(v){ return typeof fmt === 'function' ? fmt(v) : v.toLocaleString(); };
  var total = entries.reduce(function(s, e){ return s + (e[1] > 0 ? e[1] : 0); }, 0) || 1;
  var vmax = Math.max.apply(null, entries.map(function(e){ return e[1]; }).concat([1]));
  var col = color || 'var(--accent)';
  // charts with a filter field are rankings (cap long lists); the others (e.g. month-by-month maturities) show everything in order
  var CAP = field ? 10 : 100;
  var row = function(e, hidden){
    var label = e[0], val = e[1], pct = val / total * 100, ptxt = pct > 0 && pct < 1 ? '<1%' : Math.round(pct) + '%';
    var clickable = field && label !== 'Other';
    var attrs = clickable ? ' data-filter-field="' + field + '" data-filter-value="' + escAttr(label) + '" class="v9-rank-row v9-hb-row clickable-seg" role="button" tabindex="0"' : ' class="v9-rank-row v9-hb-row"';
    var op = val === vmax ? 1 : 0.55;
    return '<div' + attrs + (hidden ? ' data-more="1" style="display:none"' : '') + ' title="' + escAttr(reportText(label)) + ' — ' + escAttr(fmtVal(val)) + ' (' + ptxt + ')"><span class="nm">' + esc(reportText(label)) + '</span><span class="bar"><i style="width:' + Math.max(val / vmax * 100, val > 0 ? 1.5 : 0).toFixed(1) + '%;background:' + col + ';opacity:' + op + '"></i></span><span class="v">' + esc(fmtVal(val)) + '<small>' + ptxt + '</small></span></div>';
  };
  var html = '<div class="v9-rank">' + entries.map(function(e, i){ return row(e, i >= CAP); }).join('') + '</div>';
  if(entries.length > CAP) html += '<button type="button" class="v9-rank-more" onclick="var p=this.previousElementSibling;var on=this.getAttribute(\'data-on\')!==\'1\';p.querySelectorAll(\'[data-more]\').forEach(function(e){e.style.display=on?\'\':\'none\';});this.setAttribute(\'data-on\',on?\'1\':\'0\');this.textContent=on?\'' + __v9L('Show fewer', 'عرض أقل') + '\':\'' + __v9L('Show all ', 'عرض الكل ') + entries.length + '\';">' + __v9L('Show all ', 'عرض الكل ') + entries.length + '</button>';
  return html;
}

// Bounced Cheques: Bank Exposure as one ranked list (value, cheque count and share together) so the separate full-breakdown table is not needed
function v9BankRank(data, mode){
  var amt = data.bank_amount || {}, cnt = data.bank_counts_all || {};
  var names = Object.keys(amt); Object.keys(cnt).forEach(function(k){ if(names.indexOf(k) < 0) names.push(k); });
  var byCount = mode === 'count';
  var rows = names.map(function(n){ return { n: n, a: amt[n] || 0, c: cnt[n] || 0 }; });
  rows.sort(function(x, y){ return byCount ? (y.c - x.c) || (y.a - x.a) : (y.a - x.a) || (y.c - x.c); });
  if(!rows.length) return '<div class="empty-note">' + reportText('No data') + '</div>';
  var tot = rows.reduce(function(s, r){ return s + (byCount ? r.c : r.a); }, 0) || 1;
  var vmax = Math.max.apply(null, rows.map(function(r){ return byCount ? r.c : r.a; }).concat([1]));
  var aed = function(v){ return window.__v9Aed(v); };
  var cq = function(c){ return c.toLocaleString() + ' ' + __v9L(c === 1 ? 'cheque' : 'cheques', 'شيك'); };
  var CAP = 8;
  var row = function(r, i){
    var v = byCount ? r.c : r.a, pct = v / tot * 100, ptxt = pct > 0 && pct < 1 ? '<1%' : Math.round(pct) + '%';
    var main = byCount ? cq(r.c) : aed(r.a), sub = byCount ? aed(r.a) : cq(r.c);
    return '<div data-filter-field="bank" data-filter-value="' + escAttr(r.n) + '" class="v9-rank-row v9-hb-row v9-bank-row clickable-seg" role="button" tabindex="0"' + (i >= CAP ? ' data-more="1" style="display:none"' : '') + ' title="' + escAttr(r.n) + ' — ' + escAttr(aed(r.a) + ' · ' + cq(r.c)) + '"><span class="nm">' + esc(r.n) + '</span><span class="bar"><i style="width:' + Math.max(v / vmax * 100, v > 0 ? 1.5 : 0).toFixed(1) + '%;background:#5ec6ff;opacity:' + (v === vmax ? 1 : 0.55) + '"></i></span><span class="v">' + esc(main) + '<small>' + esc(sub) + ' · ' + ptxt + '</small></span></div>';
  };
  var html = '<div class="v9-rank">' + rows.map(row).join('') + '</div>';
  if(rows.length > CAP) html += '<button type="button" class="v9-rank-more" onclick="var p=this.previousElementSibling;var on=this.getAttribute(\'data-on\')!==\'1\';p.querySelectorAll(\'[data-more]\').forEach(function(e){e.style.display=on?\'\':\'none\';});this.setAttribute(\'data-on\',on?\'1\':\'0\');this.textContent=on?\'' + __v9L('Show fewer', 'عرض أقل') + '\':\'' + __v9L('Show all ', 'عرض الكل ') + rows.length + '\';">' + __v9L('Show all ', 'عرض الكل ') + rows.length + '</button>';
  return html;
}
