// TRIAL v9 (runs INSIDE each report iframe): shows ranking tables (property / tenant lists) as ranked bars.
// The page's own table code keeps building the rows (so filters, "View all" and numbers stay exactly as they were);
// this reads each rendered row and draws it as: name | bar | value + detail. The table itself is hidden.
(function(){
  var __v9L = window.__v9L || (window.__v9L = function(en, ar){ var a = false; try{ a = (typeof currentLangCC !== 'undefined' && currentLangCC === 'ar') || (typeof currentLangRC !== 'undefined' && currentLangRC === 'ar') || (typeof currentLangNL !== 'undefined' && currentLangNL === 'ar') || (typeof currentLangBC !== 'undefined' && currentLangBC === 'ar'); }catch(e){} return a ? ar : en; });
  window.__v9Aed = window.__v9Aed || function(v){ var s = Math.round(v).toLocaleString(); return window.__v9L('AED ' + s, s + ' د.إ'); };
  var ID = window.__V9_RANK_ID || '';
  function num(s){ var n = parseFloat(String(s == null ? '' : s).replace(/[^0-9.\-]/g, '')); return isNaN(n) ? 0 : n; }
  function fmt(n){ return Math.round(n).toLocaleString(); }
  function esc(s){ return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function T(s){ try{ return typeof reportText === 'function' ? reportText(s) : s; }catch(e){ return s; } }
  var AR_WORDS = { 'request': 'طلب', 'line item': 'بند', 'payment': 'دفعة', 'cheque': 'شيك', 'contract': 'عقد', 'installment': 'قسط' };
  function plural(n, a, b){ return n.toLocaleString() + ' ' + __v9L(n === 1 ? a : b, AR_WORDS[a] || a); }
  function AED(n){ return window.__v9Aed(n); }
  var SPECS = {
    'request-count': [{ body: 'propsBody', row: function(c, ctx){
        var n = num(c[1].textContent), share = (c[2].textContent || '').trim();
        return { name: c[0].textContent.trim(), v: n, main: plural(n, 'request', 'requests'), sub: AED(num(c[3].textContent)) + (share ? ' · ' + share : '') }; } }],
    'new-lease': [{ body: 'propsBody', row: function(c){
        var n = num(c[1].textContent);
        return { name: c[0].textContent.trim(), v: n, main: plural(n, 'payment', 'payments'), sub: '' }; } }],
    'bounced-cheques': [{ body: 'tenantBody', init: function(){ var k = document.getElementById('kpiAmount'); return { total: k ? num(k.textContent) : 0 }; }, row: function(c, ctx){
        var a = num(c[2].textContent), n = num(c[1].textContent), p = ctx.total ? a / ctx.total * 100 : 0;
        return { name: c[0].textContent.trim(), v: a, main: AED(a), sub: plural(n, 'cheque', 'cheques') + (ctx.total ? ' · ' + (p > 0 && p < 1 ? '<1' : Math.round(p)) + '%' : '') }; } }],
    'count-report': [{ body: 'propsBody', row: function(c){
        var a = num(c[1].textContent), share = (c[2].textContent || '').trim(), k = num(c[3].textContent), i = num(c[4].textContent);
        return { name: c[0].textContent.trim(), v: a, main: AED(a), sub: plural(k, 'contract', 'contracts') + ' · ' + plural(i, 'installment', 'installments') + (share ? ' · ' + share : '') }; } }]
  };
  function build(spec){
    var tb = document.getElementById(spec.body); if(!tb) return;
    var table = tb.closest('table'); if(!table) return;
    var host = table.nextElementSibling;
    if(!host || !host.classList.contains('v9-rank-host')){ host = document.createElement('div'); host.className = 'v9-rank-host'; table.parentNode.insertBefore(host, table.nextSibling); }
    table.classList.add('v9-rk-hidden');
    var busy = false;
    function draw(){
      if(busy) return; busy = true;
      try{
        var trs = [].slice.call(tb.querySelectorAll('tr')), ctx = spec.init ? spec.init() : {};
        if(!trs.length || trs[0].querySelector('.empty-note')){ host.innerHTML = '<div class="empty-note">' + esc(trs.length ? trs[0].textContent.trim() : '') + '</div>'; return; }
        var rows = trs.map(function(tr){ return spec.row([].slice.call(tr.children), ctx); });
        var max = Math.max.apply(null, rows.map(function(r){ return r.v; }).concat([1]));
        host.innerHTML = '<div class="v9-rank">' + rows.map(function(r){
          return '<div class="v9-rank-row v9-hb-row v9-two" title="' + esc(r.name) + '"><span class="nm">' + esc(r.name) + '</span><span class="bar"><i style="width:' + Math.max(r.v / max * 100, r.v > 0 ? 1.5 : 0).toFixed(1) + '%;background:var(--accent);opacity:' + (r.v === max ? 1 : 0.55) + '"></i></span><span class="v">' + esc(r.main) + (r.sub ? '<small>' + esc(r.sub) + '</small>' : '') + '</span></div>';
        }).join('') + '</div>';
      } finally { busy = false; }
    }
    draw();
    if(window.MutationObserver) new MutationObserver(draw).observe(tb, { childList: true });
  }
  function init(){ (SPECS[ID] || []).forEach(build); }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function(){ setTimeout(init, 0); }); else setTimeout(init, 0);
})();
