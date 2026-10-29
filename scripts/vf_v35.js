/* v35 runtime fixes: interactive stacked charts, honest shares, alignment, Arabic wording (runs in the page and in every report iframe) */
(function(){
  'use strict';
  var CSS = '' +
    'html[dir="rtl"] table th:first-child,html[dir="rtl"] table td:first-child{text-align:right}' +
    'html[dir="rtl"] table th:not(:first-child),html[dir="rtl"] table td:not(:first-child){text-align:center}' +
    '.v9-rank-row.v9-two{grid-template-columns:minmax(0,min(300px,36%)) minmax(60px,1fr) max-content !important;column-gap:14px}' +
    '.v9-rank-row.v9-two .v{white-space:nowrap}' +
    '.v9-hb-row{min-height:44px}' +
    '.vf35-click{cursor:pointer}.vf35-click:hover{opacity:.85}.vf35-click:focus-visible{outline:2px solid #5b8cff;outline-offset:1px}' +
    '.eb-chart.dm-pre,.eb-chart .dm-pre{opacity:1 !important}' +
    '.x4-stat-delta,.ov6-foot{white-space:nowrap !important}' +
    '.la4-mix-total .la4-sub{margin-inline-start:.4em}' +
    'html[dir="rtl"] .vf35-range{direction:rtl;unicode-bidi:isolate;white-space:nowrap}';
  function css(doc){
    try{ if(doc.head && !doc.getElementById('vfV35Css')){ var s = doc.createElement('style'); s.id = 'vfV35Css'; s.textContent = CSS; doc.head.appendChild(s); } }catch(e){}
  }
  function isAr(doc){ var r = doc.documentElement; return r.getAttribute('lang') === 'ar' || r.getAttribute('dir') === 'rtl'; }

  /* ---- 1. stacked charts: make rows, segments and legend items filter buttons ---- */
  function msel(doc, field){ return [].slice.call(doc.querySelectorAll('.msel[data-field="' + field + '"] input[type=checkbox]')); }
  function rawFor(doc, field, text){
    var boxes = msel(doc, field), w = doc.defaultView, t = (text || '').replace(/[…\.]+$/, '').trim();
    if(!t) return null;
    for(var i = 0; i < boxes.length; i++){
      var v = boxes[i].value, lab = (boxes[i].parentNode.textContent || '').trim(), rt = '';
      try{ rt = String(w.reportText ? w.reportText(v) : ''); }catch(e){}
      if(v === t || lab === t || rt === t) return v;
    }
    for(var j = 0; j < boxes.length; j++){ var v2 = boxes[j].value; if(v2.indexOf(t) === 0 || t.indexOf(v2) === 0) return v2; }
    return null;
  }
  function mark(el, field, value, label){
    if(!el || value == null) return;
    el.setAttribute('data-filter-field', field); el.setAttribute('data-filter-value', value);
    el.setAttribute('role', 'button'); el.setAttribute('tabindex', '0'); el.setAttribute('title', label || value);
    el.classList.add('vf35-click');
  }
  function stacked(doc){
    var svg = doc.querySelector('#chartStacked svg'); if(!svg) return;
    if(svg.getAttribute('data-vf35') === String(svg.innerHTML.length)) return;
    var labels = [].slice.call(svg.querySelectorAll('text[text-anchor="end"]'));
    var legend = [];
    [].slice.call(svg.querySelectorAll('rect')).forEach(function(r){
      if(r.getAttribute('width') === '12' && r.getAttribute('height') === '12'){
        var t = r.nextElementSibling; if(t && t.tagName.toLowerCase() === 'text') legend.push({rect: r, text: t, fill: r.getAttribute('fill')});
      }
    });
    var byFill = {};
    legend.forEach(function(l){
      var tx = l.text.textContent.replace(/[‪-‮⁦-⁩]/g, '').replace(/\s*\(\d[\d,]*\)\s*$/, '').trim();
      var raw = rawFor(doc, 'type', tx); if(raw == null) return;
      byFill[l.fill] = raw; mark(l.rect, 'type', raw, tx); mark(l.text, 'type', raw, tx);
    });
    labels.forEach(function(t){
      var x = +t.getAttribute('x'); if(x < 100 || x > 200) return;
      var raw = rawFor(doc, 'pmUser', t.textContent); if(raw != null) mark(t, 'pmUser', raw, t.textContent);
    });
    [].slice.call(svg.querySelectorAll('rect')).forEach(function(r){
      if(r.getAttribute('height') === '22' && byFill[r.getAttribute('fill')] != null) mark(r, 'type', byFill[r.getAttribute('fill')]);
    });
    svg.setAttribute('data-vf35', String(svg.innerHTML.length));
  }

  /* ---- 2. honest shares in the attribution tables ---- */
  var SH = /^(\s*)([\d,]+) \((\d+)%\)(\s*)$/;
  function shares(doc){
    var ar = isAr(doc);
    [].slice.call(doc.querySelectorAll('table')).forEach(function(tb){
      var cols = {};
      [].slice.call(tb.querySelectorAll('td')).forEach(function(td){
        if(td.children.length) return; var m = SH.exec(td.getAttribute('data-vf35s') ? td.getAttribute('data-vf35s') : td.textContent);
        if(!m) return; var i = td.cellIndex; (cols[i] = cols[i] || []).push({td: td, n: +m[2].replace(/,/g, ''), raw: m[2]});
      });
      Object.keys(cols).forEach(function(i){
        var c = cols[i], tot = c.reduce(function(a, b){ return a + b.n; }, 0); if(!tot) return;
        c.forEach(function(o){
          var p = o.n / tot * 100, s;
          if(o.n > 0 && p < 1) s = ar ? 'أقل من 1%' : '<1%';
          else if(p > 99 && p < 100) s = (Math.floor(p * 10) / 10).toFixed(1) + '%';
          else s = Math.round(p) + '%';
          var t = o.raw + ' (' + s + ')';
          if(o.td.textContent !== t){ if(!o.td.getAttribute('data-vf35s')) o.td.setAttribute('data-vf35s', o.td.textContent); o.td.textContent = t; }
        });
      });
    });
  }

  /* ---- 3. text rewrites (date ranges, legend parentheses, units) ---- */
  var RNG = /(\d{1,2}) (\S+) (\d{2}) → (\d{1,2}) (\S+) (\d{2})(?!\d)/;
  function texts(doc){
    var ar = isAr(doc);
    if(!ar) return;
    [].slice.call(doc.querySelectorAll('small,span,div')).forEach(function(e){
      if(e.children.length) return; var s = e.textContent;
      if(s.indexOf('→') > -1 && RNG.test(s)){
        e.textContent = s.replace(RNG, '$1 $2 20$3 ← $4 $5 20$6'); e.classList.add('vf35-range');
      }
    });
    [].slice.call(doc.querySelectorAll('.la4-mix-total .la4-sub')).forEach(function(e){ if(e.textContent.trim() === 'العقود') e.textContent = 'عقداً'; });
    [].slice.call(doc.querySelectorAll('#chartStacked svg text')).forEach(function(t){
      var s = t.textContent;
      if(/[؀-ۿ]/.test(s) && /\(\d/.test(s) && s.charAt(0) !== '‫'){ t.textContent = '‫' + s.replace(/ x /g, ' × ') + '‬'; }
    });
  }

  /* ---- 4. the daily-activity chart should not stay blank while the reveal class waits ---- */
  function reveal(doc){ [].slice.call(doc.querySelectorAll('.eb-chart.dm-pre,.eb-chart .dm-pre')).forEach(function(e){ e.classList.remove('dm-pre'); }); }

  function run(doc){
    if(!doc || !doc.body) return;
    css(doc);
    try{ stacked(doc); }catch(e){}
    try{ shares(doc); }catch(e){}
    try{ texts(doc); }catch(e){}
    try{ reveal(doc); }catch(e){}
  }
  function tick(){
    run(document);
    [].slice.call(document.querySelectorAll('iframe')).forEach(function(f){ try{ run(f.contentDocument); }catch(e){} });
  }
  setInterval(tick, 700); tick();
  window.__vfV35 = tick;
})();
