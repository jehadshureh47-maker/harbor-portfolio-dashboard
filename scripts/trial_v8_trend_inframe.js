var __v9L = window.__v9L || (window.__v9L = function(en, ar){ var a = false; try{ a = (typeof currentLangCC !== 'undefined' && currentLangCC === 'ar') || (typeof currentLangRC !== 'undefined' && currentLangRC === 'ar') || (typeof currentLangNL !== 'undefined' && currentLangNL === 'ar') || (typeof currentLangBC !== 'undefined' && currentLangBC === 'ar'); }catch(e){} return a ? ar : en; });
window.__v9Unit = window.__v9Unit || function(s){ if(!window.__v9L(false, true)) return s; var m = { 'records': 'سجل', 'record': 'سجل', 'requests': 'طلب', 'request': 'طلب', 'cheques': 'شيك', 'cheque': 'شيك', 'bounced cheques': 'شيك مرتجع', 'bounced cheque': 'شيك مرتجع', 'contracts': 'عقد', 'contract': 'عقد', 'installments': 'قسط', 'installment': 'قسط', 'line items': 'بند', 'line item': 'بند', 'fee lines': 'بند رسوم', 'fee line': 'بند رسوم' }; return String(s).replace(/\b(bounced cheques?|line items?|fee lines?|records?|requests?|cheques?|contracts?|installments?)\b/gi, function(w){ return m[w.toLowerCase()] || w; }); };

// TRIAL v8 (runs INSIDE each report iframe): trend charts drawn the way Lease Activity's "Daily activity" chart is.
// Real calendar x-axis (days with no data are gaps), weekends shaded, dashed average line, peak marker,
// peak/average header, hover readout through the report's own attachLineChartHover (data-points).
// The report's own lineChart is kept as lineChartLegacy and used if anything is unexpected.
function lineChart(dataDict, w, h){
  var a = Array.prototype.slice.call(arguments);
  try{ var out = v8Trend.apply(null, a); if(out) return out; }catch(e){ if(window.console) console.warn('v8Trend failed, legacy chart shown', e); (window.__v9Fallbacks = window.__v9Fallbacks || []).push('trend'); }
  return lineChartLegacy.apply(null, a);
}
function v8Trend(dataDict, w, h, padL, padR, padT, padB, unitLabel, secondaryDict, secondaryUnit){
  var keys = Object.keys(dataDict || {}).filter(function(k){ return /^\d{4}-\d{2}-\d{2}/.test(k); }).sort();
  if(keys.length < 2) return null;
  var isAed = unitLabel === 'AED', color = '#5b8cff', DAY = 86400000;
  var ts = function(k){ return Date.UTC(+k.slice(0,4), +k.slice(5,7) - 1, +k.slice(8,10)); };
  var t0 = ts(keys[0]), t1 = ts(keys[keys.length - 1]), span = Math.max((t1 - t0) / DAY, 1);
  var host = document.getElementById('chartTrend'), hw = host ? Math.round(host.getBoundingClientRect().width) : 0; var W = hw > 300 ? hw : 900, H = 240, pl = isAed ? 78 : 44, pr = 24, pt = 14, pb = 26;
  var vals = keys.map(function(k){ return +dataDict[k] || 0; });
  var rawMax = Math.max.apply(null, vals.concat([1]));
  var nice = function(v){ if(v <= 5) return 5; var p = Math.pow(10, Math.floor(Math.log10(v))), n = v / p; return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * p; };
  var top = nice(rawMax), total = vals.reduce(function(s, x){ return s + x; }, 0), avg = total / vals.length;
  var px = function(k){ return pl + (W - pl - pr) * ((ts(k) - t0) / DAY) / span; };
  var py = function(v){ return pt + (H - pt - pb) * (1 - v / top); };
  var fmt = function(v){ return isAed ? (typeof fmtAedCompact==='function'?fmtAedCompact(v):(v>=1e6?(v/1e6).toFixed(1)+'M':v>=1e3?Math.round(v/1e3)+'K':Math.round(v))) : Math.round(v).toLocaleString(); };
  var bands = '';
  for(var k = 0; k <= span; k++){
    var dw = new Date(t0 + k * DAY).getUTCDay();
    if(dw === 6 || dw === 0){
      var x0 = Math.max(pl + (W - pl - pr) * (k - .5) / span, pl), x1 = Math.min(pl + (W - pl - pr) * (k + .5) / span, W - pr);
      bands += '<rect x="' + x0.toFixed(1) + '" y="' + pt + '" width="' + (x1 - x0).toFixed(1) + '" height="' + (H - pt - pb) + '" fill="var(--text)" opacity="0.05"/>';
    }
  }
  var nT = [4, 5, 3, 2].filter(function(n){ return Number.isInteger(top / n); })[0] || 4, ticks = '';
  for(var i = 0; i <= nT; i++){
    var v = top * i / nT, y = py(v);
    ticks += '<line x1="' + pl + '" y1="' + y.toFixed(1) + '" x2="' + (W - pr) + '" y2="' + y.toFixed(1) + '" stroke="var(--border)" stroke-width="' + (i ? .6 : 1) + '" opacity="' + (i ? .45 : .9) + '" vector-effect="non-scaling-stroke"/>'
      + '<text x="' + (pl - 8) + '" y="' + (y + 4).toFixed(1) + '" text-anchor="end" font-size="11.5" fill="var(--sub)">' + fmt(v) + '</text>';
  }
  var step = span > 20 ? 7 : span > 10 ? 3 : 1, xl = '';
  for(var d = 0; d <= span; d += step){
    var dt = new Date(t0 + d * DAY);
    xl += '<text x="' + (pl + (W - pl - pr) * d / span).toFixed(1) + '" y="' + (H - 8) + '" text-anchor="middle" font-size="11" fill="var(--sub)">' + String(dt.getUTCDate()).padStart(2, '0') + '/' + String(dt.getUTCMonth() + 1).padStart(2, '0') + '</text>';
  }
  var pts = keys.map(function(k, i){ return px(k).toFixed(1) + ',' + py(vals[i]).toFixed(1); });
  var area = px(keys[0]).toFixed(1) + ',' + py(0) + ' ' + pts.join(' ') + ' ' + px(keys[keys.length - 1]).toFixed(1) + ',' + py(0);
  var pk = vals.indexOf(rawMax), wd = __v9L(['Sun','Mon','Tue','Wed','Thu','Fri','Sat'], ['الأحد','الاثنين','الثلاثاء','الأربعاء','الخميس','الجمعة','السبت']);
  var dots = keys.map(function(k, i){ return '<circle cx="' + px(k).toFixed(1) + '" cy="' + py(vals[i]).toFixed(1) + '" r="2.2" fill="' + color + '"/>'; }).join('');
  var peakDot = '<circle cx="' + px(keys[pk]).toFixed(1) + '" cy="' + py(rawMax).toFixed(1) + '" r="4.5" fill="none" stroke="' + color + '" stroke-width="1.6"/>';
  var meta = keys.map(function(k, i){
    var dd = new Date(ts(k));
    var o = { x: +px(k).toFixed(1), y: +py(vals[i]).toFixed(1), label: wd[dd.getUTCDay()] + ' ' + k.slice(8,10) + '/' + k.slice(5,7), value: isAed ? Math.round(vals[i]).toLocaleString() : vals[i], secondary: secondaryDict ? fmtAmt(secondaryDict[k] || 0) : null };
    return o;
  });
  var unit = window.__v9Unit(unitLabel || 'records');
  var head = '<div class="v8-tmeta"><span><b>' + (isAed ? __v9L('AED ', 'د.إ ') : '') + Math.round(total).toLocaleString() + '</b> ' + (isAed ? __v9L('in total', 'إجمالي') : esc(unit)) + '</span>'
    + '<span class="v8-tmeta-s">' + __v9L('Peak', 'الذروة') + ' <b>' + (isAed ? __v9L('AED ', 'د.إ ') : '') + Math.round(rawMax).toLocaleString() + '</b> ' + __v9L('on', 'يوم') + ' ' + wd[new Date(ts(keys[pk])).getUTCDay()] + ' ' + keys[pk].slice(8,10) + '/' + keys[pk].slice(5,7)
    + ' · ' + __v9L('Average', 'المتوسط') + ' <b>' + (isAed ? __v9L('AED ', 'د.إ ') : '') + Math.round(avg).toLocaleString() + '</b> ' + __v9L('per day with activity', 'لكل يوم فيه نشاط') + '</span></div>';
  return head + '<svg viewBox="0 0 ' + W + ' ' + H + '" xmlns="http://www.w3.org/2000/svg" data-points="' + escAttr(JSON.stringify(meta)) + '" data-unit="' + escAttr(unit) + '" data-secondary-unit="' + escAttr(secondaryUnit || '') + '">'
    + bands + ticks + xl
    + '<polygon points="' + area + '" fill="' + color + '" opacity="0.13"/>'
    + '<line x1="' + pl + '" y1="' + py(avg).toFixed(1) + '" x2="' + (W - pr) + '" y2="' + py(avg).toFixed(1) + '" stroke="' + color + '" stroke-width="1" stroke-dasharray="4 4" opacity="0.7" vector-effect="non-scaling-stroke"/>'
    + '<polyline points="' + pts.join(' ') + '" fill="none" stroke="' + color + '" stroke-width="2" stroke-linejoin="round" stroke-linecap="round" vector-effect="non-scaling-stroke"/>'
    + dots + peakDot
    + '<circle class="hover-dot" cx="-999" cy="-999" r="0" fill="none" stroke="' + color + '" stroke-width="2" vector-effect="non-scaling-stroke"/></svg>'
    + '<div class="v8-tleg">' + __v9L('Shaded columns are weekends. Dashed line is the daily average.', 'الأعمدة المظللة هي عطلات نهاية الأسبوع. الخط المتقطع هو المتوسط اليومي.') + '</div>';
}
