// TRIAL v9 - Cheque Count (runs INSIDE the report iframe).
// Lease type, ownership and unit type are shown as ranked rows: value, contracts and installments (no "records").
(function(){
  var L = window.__v9L || (window.__v9L = function(en, ar){ var a = false; try{ a = (typeof currentLangCC !== 'undefined' && currentLangCC === 'ar'); }catch(e){} return a ? ar : en; });
  function esc(s){ return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function T(s){ try{ return typeof reportText === 'function' ? reportText(s) : s; }catch(e){ return s; } }
  function data(){ try{ return (typeof lastDataCC !== 'undefined') ? lastDataCC : null; }catch(e){ return null; } }
  function aed(v){ var s = Math.round(v).toLocaleString(); return L('AED ' + s, s + ' د.إ'); }
  function plural(n, en1, enN, ar){ return n.toLocaleString() + ' ' + L(n === 1 ? en1 : enN, ar); }
  var NAMES = { 'New Lease': ['New Lease', 'عقود جديدة'], 'Renewal Lease': ['Renewal Lease', 'عقود التجديد'] };
  var CFG = [
    { id: 'chartLeaseType', field: 'leaseType', cap: ['By lease type: value, contracts and installments.', 'حسب نوع الإيجار: القيمة والعقود والأقساط.'] },
    { id: 'chartOwnership', field: 'ownership' },
    { id: 'chartUnit', field: 'unitType' }
  ];
  function groups(field){
    var d = data(); if(!d || !d.records) return null;
    var g = {}, total = 0;
    d.records.forEach(function(r){
      var k = (r[field] == null || r[field] === '') ? 'Unknown' : String(r[field]);
      var x = g[k] || (g[k] = { name: k, amt: 0, c: {}, inst: 0 });
      x.amt += r.amount || 0; total += r.amount || 0; x.c[r.contract] = 1; if(r.isInstallment) x.inst++;
    });
    var arr = Object.keys(g).map(function(k){ var x = g[k]; x.contracts = Object.keys(x.c).length; return x; }).sort(function(a, b){ return b.amt - a.amt; });
    return { rows: arr, total: total };
  }
  function draw(cfg){
    var el = document.getElementById(cfg.id); if(!el) return;
    var gr = groups(cfg.field); if(!gr || !gr.rows.length) return;
    var max = gr.rows[0].amt || 1;
    var html = (cfg.cap ? '<div class="v9-rank-cap">' + esc(L(cfg.cap[0], cfg.cap[1])) + '</div>' : '') + '<div class="v9-rank v9-grp">' + gr.rows.map(function(r){
      var nm = NAMES[r.name] ? L(NAMES[r.name][0], NAMES[r.name][1]) : T(r.name);
      var p = gr.total ? Math.round(r.amt / gr.total * 100) : 0;
      var sub = plural(r.contracts, 'contract', 'contracts', 'عقد') + ' · ' + plural(r.inst, 'installment', 'installments', 'قسط') + ' · ' + (p === 0 && r.amt > 0 ? '<1' : p) + '%';
      return '<div data-filter-field="' + cfg.field + '" data-filter-value="' + esc(r.name) + '" class="v9-rank-row v9-two clickable-seg" role="button" tabindex="0" title="' + esc(nm) + '"><span class="nm">' + esc(nm) + '</span><span class="bar"><i style="width:' + Math.max(r.amt / max * 100, r.amt > 0 ? 1.5 : 0).toFixed(1) + '%;background:var(--accent);opacity:' + (r === gr.rows[0] ? 1 : 0.55) + '"></i></span><span class="v">' + esc(aed(r.amt)) + '<small>' + esc(sub) + '</small></span></div>';
    }).join('') + '</div>';
    if(el.__v9html === html && el.querySelector('.v9-grp')) return;
    el.__v9html = html; el.innerHTML = html; el.style.flex = '1 1 100%';
    var card = el.closest('.card');
    if(card){
      var hint = card.querySelector('.chart-hint'); if(hint){ hint.removeAttribute('data-i18n'); hint.textContent = L('Click a bar to filter.', 'اضغط على شريط للتصفية.'); }
      var h3 = card.querySelector('h3'); var desc = card.querySelector('.desc');
      if(cfg.field === 'ownership' && desc){ desc.removeAttribute('data-i18n'); desc.textContent = L('Value, contracts and installments by ownership.', 'القيمة والعقود والأقساط حسب الملكية.'); }
      if(cfg.field === 'unitType' && desc){ desc.removeAttribute('data-i18n'); desc.textContent = L('Value, contracts and installments by unit type.', 'القيمة والعقود والأقساط حسب نوع الوحدة.'); }
      if(cfg.field === 'leaseType'){
        [].forEach.call(card.querySelectorAll('.grain-caption'), function(x){ x.style.display = 'none'; });
        [].forEach.call(card.querySelectorAll('.kpis-split, .grain-tag'), function(x){ x.style.display = 'none'; });
        var h = card.querySelector('.chart-hint'); if(h) h.style.display = 'none';
      }
    }
  }
  function drawAll(){ CFG.forEach(draw); }
  function hookLang(){
    var orig = window.__mdSetReportLanguage;
    if(typeof orig !== 'function' || orig.__v9g) return;
    var w = function(){ var r = orig.apply(this, arguments); try{ CFG.forEach(function(c){ var e = document.getElementById(c.id); if(e) e.__v9html = ''; }); drawAll(); }catch(e){} return r; };
    w.__v9g = 1; window.__mdSetReportLanguage = w;
  }
  function init(){
    hookLang(); setTimeout(hookLang, 800);
    drawAll();
    CFG.forEach(function(c){
      var e = document.getElementById(c.id); if(!e || !window.MutationObserver) return;
      new MutationObserver(function(){ if(!e.querySelector('.v9-grp')) draw(c); }).observe(e, { childList: true });
    });
    var tries = 0, iv = setInterval(function(){ drawAll(); if(++tries > 12) clearInterval(iv); }, 400);
  }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function(){ setTimeout(init, 50); }); else setTimeout(init, 50);
})();
