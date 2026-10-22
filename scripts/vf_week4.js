/* Week 4 (trial v19): "Targets & trends" panel on the Executive Summary tab.
   Reads the months this browser has already recorded (the same store the Executive Summary and Compare tabs use).
   Shows this month against last month and the average of the months loaded, plus an optional target per measure with a status.
   Targets are typed in by the viewer and kept in this browser only. Nothing here changes any calculation or embedded figure. */
(function(){
  if(window.MDTargets) return;
  var BAND_KEY = 'vfTargetBand', BAND_DEF = 10;
  var AR = {
    'Targets & trends':'الأهداف والاتجاهات','Print / Export PDF':'طباعة / تصدير PDF','This month':'هذا الشهر','Last month':'الشهر السابق','Change':'التغيّر','Average of months loaded':'متوسط الأشهر المحمّلة','Target':'الهدف','Gap':'الفرق','Status':'الحالة','Trend':'الاتجاه','Measure':'المؤشر',
    'On track':'على المسار','Watch':'يحتاج متابعة','Off track':'خارج المسار','Year to date':'منذ بداية السنة','Same month last year':'الشهر نفسه من العام السابق',
    'Total collected (AED)':'إجمالي المحصّل (درهم)','Net collected (AED)':'صافي المحصّل (درهم)','Bounce rate (%)':'نسبة الارتجاع (%)','Bounced cheques':'الشيكات المرتجعة','New lease contracts':'عقود الإيجار الجديدة','Renewal lease contracts':'عقود التجديد','New lease rent value (AED)':'قيمة إيجار العقود الجديدة (درهم)','Requests':'الطلبات',
    'Watch band':'هامش المتابعة','% of the target':'% من الهدف',
    'Higher is better; a measure is on track at or above its target, on watch within the band below it, and off track beyond that. For bounce measures lower is better.':'الأعلى أفضل؛ يكون المؤشر على المسار عند الهدف أو أعلى، وتحت المتابعة ضمن الهامش دونه، وخارج المسار بعد ذلك. أما مؤشرات الارتجاع فالأقل أفضل.',
    'Set in Thresholds':'يُحدَّد من الحدود','Type a target':'اكتب هدفًا',
    'Only {n} month is recorded in this browser, so comparisons need a second month. Open the Executive Summary for another month to record it.':'تم تسجيل شهر واحد فقط ({n}) في هذا المتصفح، وتحتاج المقارنة إلى شهر ثانٍ. افتح الملخص التنفيذي لشهر آخر لتسجيله.',
    'This month is not recorded yet. Open the Executive Summary tab once, then reopen this panel.':'لم يُسجَّل هذا الشهر بعد. افتح تبويب الملخص التنفيذي مرة واحدة ثم أعد فتح هذه اللوحة.',
    'Targets are typed by you and kept in this browser only. Trends and the year-to-date column get richer as more months are loaded.':'الأهداف تكتبها أنت وتُحفظ في هذا المتصفح فقط. تزداد الاتجاهات وعمود منذ بداية السنة ثراءً كلما حُمّلت أشهر أكثر.',
    'months':'أشهر','Close':'إغلاق','Export Excel':'تصدير إلى Excel','Based on':'بناءً على'
  };
  try{ if(typeof REMAINING_UI === 'object') Object.keys(AR).forEach(function(k){ if(!(k in REMAINING_UI)) REMAINING_UI[k] = AR[k]; }); }catch(e){}
  function tr(s){ try{ return typeof remainingText === 'function' ? remainingText(s) : s; }catch(e){ return s; } }
  function T(s, v){ var o = tr(s); if(v) Object.keys(v).forEach(function(k){ o = o.split('{' + k + '}').join(v[k]); }); return o; }
  function el(tag, cls, txt){ var e = document.createElement(tag); if(cls) e.className = cls; if(txt != null) e.textContent = txt; return e; }
  var M = [
    {k: 'totalCollected', l: 'Total collected (AED)', f: 'aed', dir: 1, add: 1},
    {k: 'netCollected', l: 'Net collected (AED)', f: 'aed', dir: 1, add: 1},
    {k: 'bounceRatePct', l: 'Bounce rate (%)', f: 'pct', dir: -1, thr: 'bounceTarget'},
    {k: 'bouncedCount', l: 'Bounced cheques', f: 'int', dir: -1, add: 1},
    {k: 'newLeaseContracts', l: 'New lease contracts', f: 'int', dir: 1, add: 1},
    {k: 'renewalLeaseContracts', l: 'Renewal lease contracts', f: 'int', dir: 1, add: 1},
    {k: 'leaseRentValue', l: 'New lease rent value (AED)', f: 'aed', dir: 1, add: 1},
    {k: 'totalRequests', l: 'Requests', f: 'int', dir: 1, add: 1}
  ];
  function fmt(v, f){ if(v == null || isNaN(v)) return '—'; if(f === 'pct') return Number(v).toFixed(2) + '%'; return Number(v).toLocaleString('en-US', {maximumFractionDigits: 0}); }
  function pf(){ try{ return currentPortfolio; }catch(e){ return 'awqaf'; } }
  function tkey(){ return 'vfTargets__' + pf(); }
  function loadT(){ try{ return JSON.parse(localStorage.getItem(tkey()) || '{}') || {}; }catch(e){ return {}; } }
  function saveT(o){ try{ localStorage.setItem(tkey(), JSON.stringify(o)); }catch(e){} }
  function band(){ try{ var n = +localStorage.getItem(BAND_KEY); return n > 0 && n <= 100 ? n : BAND_DEF; }catch(e){ return BAND_DEF; } }
  function hist(){ try{ return getMonthlyHistory(pf()) || []; }catch(e){ return []; } }
  function thrTarget(m){ try{ var v = THRESHOLDS[pf()][m.thr]; return typeof v === 'number' ? v : null; }catch(e){ return null; } }
  function statusOf(m, actual, target, b){
    if(target == null || actual == null) return null;
    var p = b / 100;
    if(m.dir > 0) return actual >= target ? 'ok' : (actual >= target * (1 - p) ? 'watch' : 'off');
    return actual <= target ? 'ok' : (actual <= target * (1 + p) ? 'watch' : 'off');
  }
  function spark(vals){
    var v = vals.filter(function(x){ return x != null; }); if(v.length < 2) return null;
    var mn = Math.min.apply(null, v), mx = Math.max.apply(null, v), w = 70, h = 22, r = (mx - mn) || 1;
    var pts = v.map(function(y, i){ return (i * (w - 4) / (v.length - 1) + 2).toFixed(1) + ',' + (h - 3 - (y - mn) / r * (h - 6)).toFixed(1); }).join(' ');
    var ns = 'http://www.w3.org/2000/svg', s = document.createElementNS(ns, 'svg'); s.setAttribute('width', w); s.setAttribute('height', h); s.setAttribute('viewBox', '0 0 ' + w + ' ' + h); s.setAttribute('aria-hidden', 'true');
    var pl = document.createElementNS(ns, 'polyline'); pl.setAttribute('points', pts); pl.setAttribute('fill', 'none'); pl.setAttribute('stroke', '#5b8cff'); pl.setAttribute('stroke-width', '2'); pl.setAttribute('stroke-linejoin', 'round'); pl.setAttribute('stroke-linecap', 'round'); s.appendChild(pl);
    return s;
  }
  function compute(){
    var H = hist().slice().sort(function(a, b){ return a.periodKey < b.periodKey ? -1 : 1; }), cm = ''; try{ cm = currentMonth; }catch(e){}
    var ci = -1; H.forEach(function(h, i){ if(h.periodKey === cm) ci = i; });
    var out = {months: H.length, cur: ci >= 0 ? H[ci] : null, prev: ci > 0 ? H[ci - 1] : null, H: H, ci: ci, cm: cm, rows: [], lastYear: null};
    var yr = cm.slice(0, 4), mo = cm.slice(5, 7), ly = (+yr - 1) + '-' + mo; H.forEach(function(h){ if(h.periodKey === ly) out.lastYear = h; });
    var T0 = loadT(), b = band();
    M.forEach(function(m){
      var a = out.cur ? out.cur[m.k] : null; if(a == null) return;
      var pv = out.prev ? out.prev[m.k] : null, vals = H.map(function(h){ return h[m.k]; }).filter(function(x){ return x != null; });
      var avg = vals.length ? vals.reduce(function(s, x){ return s + x; }, 0) / vals.length : null;
      var tgt = m.thr ? thrTarget(m) : (T0[m.k] != null ? T0[m.k] : null);
      var ytd = null; if(m.add){ var s = 0, n = 0; H.forEach(function(h){ if(h.periodKey.slice(0, 4) === yr && h.periodKey <= cm && h[m.k] != null){ s += h[m.k]; n++; } }); ytd = n ? s : null; }
      out.rows.push({m: m, a: a, pv: pv, avg: avg, n: vals.length, tgt: tgt, fixed: !!m.thr, status: statusOf(m, a, tgt, b), ytd: ytd, ly: out.lastYear ? out.lastYear[m.k] : null, series: H.map(function(h){ return h[m.k]; })});
    });
    return out;
  }
  var dlg, body;
  function ensure(){ if(dlg) return; dlg = document.createElement('dialog'); dlg.className = 'vf-drawer vf-targets'; dlg.setAttribute('aria-label', 'Targets & trends'); body = el('div', 'vf-d-body'); dlg.appendChild(body); dlg.addEventListener('click', function(e){ if(e.target === dlg) close(); }); document.body.appendChild(dlg); }
  function close(){ if(dlg){ try{ dlg.close(); }catch(e){ dlg.removeAttribute('open'); } } }
  function csv(res){
    var esc = function(v){ v = v == null ? '' : String(v); return /[",\n\r]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; };
    var rows = [[tr('Measure'), tr('This month'), tr('Last month'), tr('Change'), tr('Average of months loaded'), tr('Year to date'), tr('Target'), tr('Gap'), tr('Status')]];
    res.rows.forEach(function(r){ rows.push([tr(r.m.l), r.a, r.pv, r.pv != null ? r.a - r.pv : '', r.avg != null ? Math.round(r.avg * 100) / 100 : '', r.ytd != null ? r.ytd : '', r.tgt != null ? r.tgt : '', r.tgt != null ? Math.round((r.a - r.tgt) * 100) / 100 : '', r.status ? tr({ok: 'On track', watch: 'Watch', off: 'Off track'}[r.status]) : '']); });
    var b = new Blob(['﻿' + rows.map(function(r){ return r.map(esc).join(','); }).join('\r\n')], {type: 'text/csv;charset=utf-8'});
    var a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = 'Targets-and-trends_' + pf() + '_' + res.cm + '.csv'; document.body.appendChild(a); a.click(); setTimeout(function(){ try{ URL.revokeObjectURL(a.href); }catch(e){} a.remove(); }, 500);
  }
  function signed(d, f){ return (d > 0 ? '+' : '') + (f === 'pct' ? d.toFixed(2) + ' pts' : Math.round(d).toLocaleString('en-US')); }
  function render(){
    if(!dlg || !dlg.open) return; var res = compute(); body.innerHTML = '';
    var h = el('div', 'vf-d-head'), t = el('div', 'vf-d-titles'); t.appendChild(el('div', 'vf-d-title', tr('Targets & trends')));
    var lbl = ''; try{ lbl = (PORTFOLIO_LABELS && PORTFOLIO_LABELS[pf()]) || pf(); }catch(e){}
    t.appendChild(el('div', 'vf-d-sub', lbl + ' · ' + res.cm + ' · ' + tr('Based on') + ' ' + res.months + ' ' + tr('months'))); h.appendChild(t);
    var act = el('div', 'vf-d-actions');
    if(res.rows.length){ var ex = el('button', 'vf-btn', tr('Export Excel')); ex.type = 'button'; ex.addEventListener('click', function(){ csv(res); }); act.appendChild(ex); }
    var x = el('button', 'vf-btn vf-x', '✕'); x.type = 'button'; x.setAttribute('aria-label', tr('Close')); x.addEventListener('click', close); act.appendChild(x); h.appendChild(act); body.appendChild(h);
    var bar = el('div', 'vf-risk-rules'); var bl = el('label', 'vf-risk-rule'); bl.appendChild(el('span', null, tr('Watch band')));
    var bi = el('input', 'vf-risk-num'); bi.type = 'number'; bi.min = 1; bi.max = 100; bi.value = band(); bi.setAttribute('data-band', '1');
    bi.addEventListener('change', function(){ var n = Math.round(+bi.value); if(!(n >= 1)) n = BAND_DEF; if(n > 100) n = 100; try{ localStorage.setItem(BAND_KEY, String(n)); }catch(e){} render(); });
    bl.appendChild(bi); bl.appendChild(el('span', null, tr('% of the target'))); bar.appendChild(bl);
    bar.appendChild(el('div', 'vf-risk-x', tr('Higher is better; a measure is on track at or above its target, on watch within the band below it, and off track beyond that. For bounce measures lower is better.'))); body.appendChild(bar);
    var wrap = el('div', 'vf-d-tablewrap');
    if(!res.cur){ wrap.appendChild(el('div', 'vf-empty', tr('This month is not recorded yet. Open the Executive Summary tab once, then reopen this panel.'))); }
    else {
      if(res.months < 2) wrap.appendChild(el('div', 'vf-risk-note', T('Only {n} month is recorded in this browser, so comparisons need a second month. Open the Executive Summary for another month to record it.', {n: res.months})));
      var showLY = res.rows.some(function(r){ return r.ly != null; });
      var cols = ['Measure', 'This month', 'Last month', 'Change', 'Average of months loaded', 'Year to date'].concat(showLY ? ['Same month last year'] : []).concat(['Trend', 'Target', 'Gap', 'Status']);
      var tb = el('table', 'vf-table'), th = el('thead'), hr = el('tr'); cols.forEach(function(c){ hr.appendChild(el('th', null, tr(c))); }); th.appendChild(hr); tb.appendChild(th);
      var tbody = el('tbody'), T0 = loadT();
      res.rows.forEach(function(r){
        var m = r.m, row = el('tr'); row.appendChild(el('td', null, tr(m.l)));
        row.appendChild(el('td', 'num', fmt(r.a, m.f))); row.appendChild(el('td', 'num', fmt(r.pv, m.f)));
        var cd = el('td', 'num');
        if(r.pv != null){ var d = r.a - r.pv, p = r.pv ? d / r.pv * 100 : null, good = d === 0 ? 0 : (d * m.dir > 0 ? 1 : -1); cd.textContent = signed(d, m.f) + (p != null && m.f !== 'pct' ? ' (' + (p > 0 ? '+' : '') + p.toFixed(1) + '%)' : ''); if(good > 0) cd.className += ' vf-good'; else if(good < 0) cd.className += ' vf-bad'; } else cd.textContent = '—';
        row.appendChild(cd);
        row.appendChild(el('td', 'num', r.n >= 2 ? fmt(r.avg, m.f) : '—')); row.appendChild(el('td', 'num', r.ytd != null ? fmt(r.ytd, m.f) : '—'));
        if(showLY) row.appendChild(el('td', 'num', fmt(r.ly, m.f)));
        var sp = el('td'), s = spark(r.series); if(s) sp.appendChild(s); else sp.textContent = '—'; row.appendChild(sp);
        var tt = el('td', 'num');
        if(r.fixed){ tt.textContent = r.tgt != null ? fmt(r.tgt, m.f) : '—'; tt.title = tr('Set in Thresholds'); }
        else {
          var ti = el('input', 'vf-risk-num vf-tgt'); ti.type = 'number'; ti.step = 'any'; ti.placeholder = '—'; ti.setAttribute('data-tgt', m.k); ti.setAttribute('aria-label', tr('Type a target') + ': ' + tr(m.l)); if(T0[m.k] != null) ti.value = T0[m.k];
          ti.addEventListener('change', function(){ var o = loadT(); if(ti.value === '' || isNaN(+ti.value)) delete o[m.k]; else o[m.k] = +ti.value; saveT(o); render(); }); tt.appendChild(ti);
        }
        row.appendChild(tt);
        row.appendChild(el('td', 'num', r.tgt != null ? signed(r.a - r.tgt, m.f) : '—'));
        var st = el('td'); if(r.status) st.appendChild(el('span', 'vf-risk-pill vf-st-' + r.status, tr({ok: 'On track', watch: 'Watch', off: 'Off track'}[r.status]))); else st.textContent = '—'; row.appendChild(st);
        tbody.appendChild(row);
      });
      tb.appendChild(tbody); wrap.appendChild(tb);
      wrap.appendChild(el('div', 'vf-risk-note', tr('Targets are typed by you and kept in this browser only. Trends and the year-to-date column get richer as more months are loaded.')));
    }
    body.appendChild(wrap);
  }
  function open(){ ensure(); if(!dlg.open){ try{ dlg.showModal(); }catch(e){ dlg.setAttribute('open', ''); } } render(); }
  function decorate(){
    var p = document.querySelector('.report-pane[data-report="execsummary"]'); if(!p) return;
    var bar = p.querySelector(':scope > .vf-bar'); if(!bar) return;
    var b = bar.querySelector('[data-vf-targets]');
    if(!b){ b = el('button', 'theme-switch', tr('Targets & trends')); b.type = 'button'; b.setAttribute('data-vf-targets', '1'); b.addEventListener('click', open); bar.insertBefore(b, bar.firstChild); }
    else { var t = tr('Targets & trends'); if(b.textContent !== t) b.textContent = t; }
  }
  document.addEventListener('click', function(e){ if(e.target && e.target.id === 'langBtn') setTimeout(function(){ decorate(); render(); }, 80); });
  setInterval(decorate, 1000); setTimeout(decorate, 500);

  // Tidy the four embedded reports' own buttons: period + Print on one line; Load / Export CSV on the left and Filters on the right of one row
  var REP_CSS = '#printBtn,#exportCsvBtn{display:none!important}.btn,.period,.filters-toggle-btn{border-radius:999px!important;padding:.5rem 1.05rem!important;font-size:13.5px!important;font-weight:600!important;line-height:1.2!important;min-height:2.4rem;box-sizing:border-box;display:inline-flex!important;align-items:center;justify-content:center;white-space:nowrap}.period{font-weight:500!important}' + 'header .header-actions{flex-direction:row!important;align-items:center!important;gap:10px!important;flex-wrap:wrap;justify-content:flex-end}' +
    '.toolbar{display:flex!important;flex-wrap:wrap;align-items:center;gap:10px}' +
    '.toolbar>.toolbar-row-actions{display:contents!important}' +
    '.toolbar .btn-group{order:1}' +
    '.toolbar .filters-toggle-btn{order:2;margin:0!important;margin-inline-start:auto!important}' +
    '.toolbar .status.empty-state-note,.toolbar .toolbar-row-actions>.status{order:3;flex:1 1 100%!important}' +
    '.toolbar>#filterPanel,.toolbar>#filterActionsRow,.toolbar>#rangePanel{order:4;flex:1 1 100%;margin-top:4px!important}';
  function tidyReports(){
    var w; try{ w = (typeof embeddedWindows !== 'undefined') ? embeddedWindows : null; }catch(e){} if(!w) return;
    Object.keys(w).forEach(function(k){
      try{
        var d = w[k] && w[k].document; if(!d || !d.head || d.getElementById('vfRepTidy')) return;
        var st = d.createElement('style'); st.id = 'vfRepTidy'; st.textContent = REP_CSS; d.head.appendChild(st);
      }catch(e){}
    });
  }
  setInterval(tidyReports, 1200); setTimeout(tidyReports, 600);

  var PRINT_IDS = ['count-report','bounced-cheques','new-lease','request-count'];
  function decoratePrint(){
    PRINT_IDS.forEach(function(id){
      var p = document.querySelector('.report-pane[data-report="' + id + '"]'); if(!p) return;
      var bar = p.querySelector(':scope > .vf-bar'); if(!bar) return;
      var b = bar.querySelector('[data-vf-print]');
      if(!b){
        b = el('button', 'theme-switch', tr('Print / Export PDF')); b.type = 'button'; b.setAttribute('data-vf-print', id);
        b.addEventListener('click', function(){ try{ var w = embeddedWindows[id]; var pb = w && w.document.getElementById('printBtn'); if(pb) pb.click(); }catch(e){} });
        bar.appendChild(b);
      } else { var t = tr('Print / Export PDF'); if(b.textContent !== t) b.textContent = t; }
    });
  }
  setInterval(decoratePrint, 1000); setTimeout(decoratePrint, 500);
  window.MDTargets = {compute: compute, open: open};
})();
