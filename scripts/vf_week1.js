/* Week 1 (trial v15): shared data layer (MDData), Excel export per report, saved view.
   Reads from the report iframes that are already on the page; embedded data is never modified. */
(function(){
  if(window.MDData) return;
  var NAMES = {'count-report':'Cheque Count','bounced-cheques':'Bounced Cheques','new-lease':'New Lease','request-count':'Request Count'};
  var AR = {'Export Excel':'تصدير إلى Excel','Report not loaded yet':'لم يتم تحميل التقرير بعد','Nothing to export':'لا توجد بيانات للتصدير'};
  try{ if(typeof REMAINING_UI === 'object') Object.keys(AR).forEach(function(k){ if(!(k in REMAINING_UI)) REMAINING_UI[k] = AR[k]; }); }catch(e){}
  function tr(s){ try{ return typeof remainingText === 'function' ? remainingText(s) : s; }catch(e){ return s; } }

  function win(id){ try{ return (typeof embeddedWindows !== 'undefined' && embeddedWindows[id]) || null; }catch(e){ return null; } }
  function rawOf(id){
    var w = win(id); if(!w) return null;
    try{
      var o = w.eval('({rows:(typeof rawRowsState!=="undefined"?rawRowsState:null),map:(typeof colMapState!=="undefined"?colMapState:null)})');
      return (o && o.rows && o.rows.length > 1 && o.map) ? o : null;
    }catch(e){ return null; }
  }
  var cache = {};
  function rows(id){
    var o = rawOf(id); if(!o) return [];
    var sig = o.rows.length + '|' + String(o.rows[1]).slice(0, 120) + '|' + String(o.rows[o.rows.length - 1]).slice(0, 120);
    if(cache[id] && cache[id].sig === sig) return cache[id].list;
    var keys = Object.keys(o.map), out = [];
    for(var i = 1; i < o.rows.length; i++){
      var r = o.rows[i], rec = {}, any = false;
      for(var k = 0; k < keys.length; k++){ var v = r[o.map[keys[k]]]; rec[keys[k]] = v; if(v !== '' && v != null) any = true; }
      if(any) out.push(rec);
    }
    cache[id] = {sig: sig, list: out};
    return out;
  }
  function ckey(c){ return String(c == null ? '' : c).trim().toUpperCase(); }
  window.MDData = {
    ids: Object.keys(NAMES),
    rows: rows,
    all: function(){ var o = {}; Object.keys(NAMES).forEach(function(id){ o[id] = rows(id); }); return o; },
    byContract: function(contract){
      var key = ckey(contract), res = {};
      Object.keys(NAMES).forEach(function(id){ res[id] = rows(id).filter(function(r){ return ckey(r.contract) === key; }); });
      return res;
    },
    header: function(id){ var o = rawOf(id); return o ? Array.prototype.slice.call(o.rows[0]) : []; }
  };

  function toast(msg){
    var t = document.createElement('div'); t.className = 'vf-toast'; t.setAttribute('role', 'status'); t.textContent = msg;
    document.body.appendChild(t); setTimeout(function(){ t.remove(); }, 2600);
  }
  function download(blob, name){
    var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name;
    document.body.appendChild(a); a.click(); setTimeout(function(){ try{ URL.revokeObjectURL(a.href); }catch(e){} a.remove(); }, 500);
  }
  function csvCell(v){ v = v == null ? '' : String(v); return /[",\n\r]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; }
  function ev(id, expr){ try{ return win(id).eval('(function(){try{return ' + expr + '}catch(e){return null}})()'); }catch(e){ return null; } }
  function widthsOf(data){
    var n = 0, i, c, w = [];
    for(i = 0; i < data.length; i++) if(data[i].length > n) n = data[i].length;
    for(c = 0; c < n; c++){
      var m = 8;
      for(i = 0; i < data.length && i < 400; i++){
        var v = data[i][c]; if(v == null) continue;
        var l = String(v).length; if(l > m) m = l;
      }
      w.push({wch: Math.min(m + 2, 48)});
    }
    return w;
  }
  function sheetFrom(X, data){
    var ws = X.utils.aoa_to_sheet(data);
    ws['!cols'] = widthsOf(data);
    var n = ws['!cols'].length;
    if(n && data.length > 1) ws['!autofilter'] = {ref: X.utils.encode_range({s: {r: 0, c: 0}, e: {r: data.length - 1, c: n - 1}})};
    return ws;
  }
  function exportReport(id){
    var o = rawOf(id);
    if(!o){ toast(tr('Report not loaded yet')); return; }
    var pf = ''; try{ pf = (PORTFOLIO_LABELS && PORTFOLIO_LABELS[currentPortfolio]) || currentPortfolio; }catch(e){}
    var month = ''; try{ month = currentMonth; }catch(e){}
    var name = [pf, NAMES[id], month].filter(Boolean).join('_').replace(/[^A-Za-z0-9_\-]+/g, '-');
    var X = null; try{ X = win(id).XLSX || window.XLSX; }catch(e){}
    var MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    if(X && X.utils && X.write){
      /* 1) a workbook was loaded into this report (Load Excel File, or restored from the browser cache): write that exact workbook back, every sheet as it was. */
      try{
        var wbk = ev(id, '(typeof workbookState!=="undefined"?workbookState:null)');
        if(wbk && wbk.SheetNames && wbk.SheetNames.length){
          download(new Blob([X.write(wbk, {bookType: 'xlsx', type: 'array', cellDates: true})], {type: MIME}), name + '.xlsx');
          return;
        }
      }catch(e){}
      /* 2) bundled snapshot: rebuild the workbook with the original sheet names and headers (Details, plus Summary for New Lease), readable column widths, filters on. */
      try{
        var data = [];
        for(var i = 0; i < o.rows.length; i++) data.push(Array.prototype.slice.call(o.rows[i]));
        if(data.length < 2){ toast(tr('Nothing to export')); return; }
        var wb = X.utils.book_new();
        X.utils.book_append_sheet(wb, sheetFrom(X, data), 'Details');
        if(id === 'new-lease'){
          var sm = ev(id, '(typeof summaryState!=="undefined"?summaryState:null)');
          if(sm && sm.byContract){
            var srows = [['Contract Number', 'Property Name', 'Unit Number', 'Cost Center', 'Rent Amount', 'Contract Date']];
            Object.keys(sm.byContract).forEach(function(k){ var x = sm.byContract[k]; srows.push([k, x.property, x.unit, x.costCenter, x.rentAmount, x.contractDate]); });
            X.utils.book_append_sheet(wb, sheetFrom(X, srows), sm.sheetName || 'Summary');
          }
        }
        download(new Blob([X.write(wb, {bookType: 'xlsx', type: 'array'})], {type: MIME}), name + '.xlsx');
        return;
      }catch(e){}
    }
    var csvData = [];
    for(var j = 0; j < o.rows.length; j++) csvData.push(Array.prototype.slice.call(o.rows[j]));
    if(csvData.length < 2){ toast(tr('Nothing to export')); return; }
    var csv = '﻿' + csvData.map(function(r){ return r.map(csvCell).join(','); }).join('\r\n');
    download(new Blob([csv], {type: 'text/csv;charset=utf-8'}), name + '.csv');
  }
  window.MDData.exportReport = exportReport;

  function decorate(){
    document.querySelectorAll('.report-pane[data-report]').forEach(function(p){
      var id = p.dataset.report;
      if(!NAMES[id] || p.querySelector(':scope > .vf-bar')) return;
      var bar = document.createElement('div'); bar.className = 'vf-bar';
      var b = document.createElement('button'); b.type = 'button'; b.className = 'theme-switch'; b.textContent = tr('Export Excel');
      b.setAttribute('data-vf-export', id); b.addEventListener('click', function(){ exportReport(id); });
      bar.appendChild(b); p.insertBefore(bar, p.firstChild);
    });
  }
  function refreshLabels(){ document.querySelectorAll('.vf-bar button').forEach(function(b){ b.textContent = tr('Export Excel'); }); }
  var panes = document.getElementById('panes');
  if(panes){ new MutationObserver(decorate).observe(panes, {childList: true}); decorate(); }
  document.addEventListener('click', function(e){ if(e.target && e.target.id === 'langBtn') setTimeout(refreshLabels, 60); });

  /* ---- Saved view: portfolio, month and tab ---- */
  var KEY = 'vfSavedView';
  function activeTab(){ var b = document.querySelector('.tab-btn.active'); return b ? b.dataset.id : null; }
  var restoring = true;
  function save(){
    if(restoring) return;
    try{ localStorage.setItem(KEY, JSON.stringify({p: currentPortfolio, m: currentMonth, t: activeTab()})); }catch(e){}
  }
  var orig = window.selectTab;
  if(typeof orig === 'function'){ window.selectTab = function(){ var r = orig.apply(this, arguments); save(); return r; }; }
  ['portfolioSelect', 'monthSelect'].forEach(function(id){
    var el = document.getElementById(id); if(el) el.addEventListener('change', function(){ setTimeout(save, 50); });
  });
  var navClicked = false;
  document.addEventListener('click', function(e){ if(e.isTrusted && e.target && e.target.closest && e.target.closest('.tab-btn')){ navClicked = true; restoring = false; save(); } }, true);
  ['portfolioSelect', 'monthSelect'].forEach(function(id){ var el = document.getElementById(id); if(el) el.addEventListener('change', function(e){ if(e.isTrusted){ navClicked = true; restoring = false; } }, true); });
  function apply(v){
    var ps = document.getElementById('portfolioSelect'), ms = document.getElementById('monthSelect');
    function has(sel, val){ return sel && Array.prototype.some.call(sel.options, function(o){ return o.value === val; }); }
    try{
      if(v.p && v.p !== currentPortfolio && has(ps, v.p) && PORTFOLIOS[v.p]){
        var locked = false; try{ locked = Object.prototype.hasOwnProperty.call(PORTFOLIO_PINS, v.p) && !isPortfolioPinVerified(v.p); }catch(e){}
        if(locked) return false;
        ps.value = v.p; ps.dispatchEvent(new Event('change'));
      }
      if(v.m && v.m !== currentMonth && has(ms, v.m)){ ms.value = v.m; ms.dispatchEvent(new Event('change')); }
      if(v.t && v.t !== 'overview' && activeTab() !== v.t && document.querySelector('.tab-btn[data-id="' + v.t + '"]')) window.selectTab(v.t);
    }catch(e){ return false; }
    return !v.t || activeTab() === v.t;
  }
  function restore(){
    var v = null; try{ v = JSON.parse(localStorage.getItem(KEY) || 'null'); }catch(e){}
    if(!v || (location.hash && location.hash.length > 1)) return;
    /* now, synchronously, so the first paint is already the saved tab; then twice more in case a tab/report was not built yet */
    var done = apply(v);
    var again = function(){ if(!navClicked && v.t && activeTab() !== v.t) apply(v); };
    if(!done){ setTimeout(again, 150); }
    window.addEventListener('load', function(){ setTimeout(again, 120); setTimeout(again, 700); });
  }
  restore();
  if(document.readyState === 'complete') restoring = false; else window.addEventListener('load', function(){ setTimeout(function(){ restoring = false; }, 1500); });
})();
