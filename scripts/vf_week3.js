/* Week 3 (trial v18): "Needs attention" list - renewal and bounced-cheque risk flags.
   Rules are plain, visible and adjustable (defaults below are labelled as defaults until confirmed by the leasing and front-desk teams).
   Reads the report data already on the page. It never changes embedded data and never touches the bounce-rate calculation. */
(function(){
  if(window.MDRisk) return;
  var KEY = 'vfRiskRules';
  var DEF = {days: 90, bounces: 2, topPct: 10};
  var AR = {
    'Needs attention':'يحتاج إلى متابعة','Ranked by risk. These are default rules — change any number and the list updates.':'مرتبة حسب الخطورة. هذه قواعد افتراضية — غيّر أي رقم وستتحدث القائمة.',
    'Rules':'القواعد','Lease ends within':'ينتهي العقد خلال','days with no renewal':'يومًا دون تجديد','Tenant has':'لدى المستأجر','or more bounced cheques':'شيكات مرتجعة أو أكثر',
    'Bounced cheque in the top':'شيك مرتجع ضمن أعلى','% by amount this month':'% من حيث المبلغ هذا الشهر','Reset to defaults':'استعادة الافتراضي','Export Excel':'تصدير إلى Excel',
    'Risk':'الخطورة','High':'مرتفعة','Medium':'متوسطة','Tenant':'المستأجر','Contract':'العقد','Why flagged':'سبب الإشارة','Nothing needs attention under these rules':'لا شيء يحتاج إلى متابعة وفق هذه القواعد',
    'Lease ends {d} (in {n} days) — no later contract found for this tenant and unit':'ينتهي العقد في {d} (بعد {n} يومًا) — لا يوجد عقد لاحق لهذا المستأجر والوحدة',
    'Lease ended {d} ({n} days ago) — no later contract found for this tenant and unit':'انتهى العقد في {d} (قبل {n} يومًا) — لا يوجد عقد لاحق لهذا المستأجر والوحدة',
    '{n} bounced cheques this month':'{n} شيكات مرتجعة هذا الشهر','Bounced cheque of AED {a} — top {p}% this month':'شيك مرتجع بمبلغ {a} درهم — ضمن أعلى {p}% هذا الشهر',
    'Status: {s}':'الحالة: {s}','flagged':'مُشار إليه','Cheque Count and Bounced Cheques must be loaded':'يجب تحميل تقريري عدد الشيكات والشيكات المرتجعة',
    'Open this contract':'افتح هذا العقد','Close':'إغلاق','Search…':'بحث…','Needs attention list':'قائمة المتابعة','Rule for lease ends and renewals is based on contracts loaded for this month':'قاعدة انتهاء العقد والتجديد مبنية على العقود المحمّلة لهذا الشهر'
  };
  try{ if(typeof REMAINING_UI === 'object') Object.keys(AR).forEach(function(k){ if(!(k in REMAINING_UI)) REMAINING_UI[k] = AR[k]; }); }catch(e){}
  function tr(s){ try{ return typeof remainingText === 'function' ? remainingText(s) : s; }catch(e){ return s; } }
  function T(s, v){ var o = tr(s); if(v) Object.keys(v).forEach(function(k){ o = o.split('{' + k + '}').join(v[k]); }); return o; }
  function el(tag, cls, txt){ var e = document.createElement(tag); if(cls) e.className = cls; if(txt != null) e.textContent = txt; return e; }
  function fmt(n){ return Number(n).toLocaleString('en-US', {maximumFractionDigits: 0}); }
  function nk(s){ return String(s == null ? '' : s).trim().toUpperCase().replace(/\s+/g, ' '); }
  function loadRules(){
    var r = {days: DEF.days, bounces: DEF.bounces, topPct: DEF.topPct};
    try{ var s = JSON.parse(localStorage.getItem(KEY) || 'null'); if(s){ ['days','bounces','topPct'].forEach(function(k){ var n = +s[k]; if(isFinite(n) && n > 0) r[k] = n; }); } }catch(e){}
    return r;
  }
  function saveRules(r){ try{ localStorage.setItem(KEY, JSON.stringify(r)); }catch(e){} }
  function monthEnd(){ var m = ''; try{ m = currentMonth; }catch(e){} var y = +m.slice(0, 4), mo = +m.slice(5, 7); if(!y || !mo) return null; return new Date(Date.UTC(y, mo, 0)); }
  function dayDiff(iso, ref){ var p = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || ''); if(!p) return null; return Math.round((Date.UTC(+p[1], +p[2] - 1, +p[3]) - ref.getTime()) / 864e5); }

  /* ---------- the rules ---------- */
  function compute(rules){
    var D = window.MDDrill; if(!D) return null;
    var cr = D.records('count-report', false), bc = D.records('bounced-cheques', false), ref = monthEnd();
    var out = {items: [], loaded: {count: !!(cr && cr.list.length), bounced: !!(bc && bc.list.length)}};
    var map = {};
    function item(ck, contract, tenant){ tenant = String(tenant || '').trim(); var it = map[ck]; if(!it){ it = map[ck] = {ck: ck, contract: contract || ck, tenant: tenant || '', reasons: [], score: 0, extra: ''}; out.items.push(it); } if(!it.tenant && tenant) it.tenant = tenant; return it; }
    /* Rule 1: lease ending soon with no later contract for the same tenant and unit */
    if(cr && ref){
      var byCk = {}, byTU = {};
      cr.list.forEach(function(x){ if(!x.ck) return; var c = byCk[x.ck]; if(!c){ c = byCk[x.ck] = {ck: x.ck, contract: x.contract, tenant: x.tenant, start: x.startISO || '', end: x.endISO || '', tu: nk(x.tenant) + '|' + nk(x.property) + '|' + nk(x.unit)}; } else { if(!c.end && x.endISO) c.end = x.endISO; if(!c.start && x.startISO) c.start = x.startISO; } });
      Object.keys(byCk).forEach(function(k){ var c = byCk[k]; if(c.tu.indexOf('||') < 0 && nk(c.tenant)){ (byTU[c.tu] = byTU[c.tu] || []).push(c); } });
      var monthStart = new Date(Date.UTC(ref.getUTCFullYear(), ref.getUTCMonth(), 1));
      Object.keys(byCk).forEach(function(k){
        var c = byCk[k]; if(!c.end) return;
        var dEnd = dayDiff(c.end, ref), dStart = dayDiff(c.end, monthStart);
        if(dEnd == null || dStart == null || dStart < 0 || dEnd > rules.days) return;
        var peers = byTU[c.tu] || [], renewed = peers.some(function(p){ return p.ck !== c.ck && p.start && c.start && p.start > c.start; });
        if(renewed) return;
        var it = item(c.ck, c.contract, c.tenant);
        it.reasons.push(dEnd >= 0 ? T('Lease ends {d} (in {n} days) — no later contract found for this tenant and unit', {d: c.end, n: dEnd}) : T('Lease ended {d} ({n} days ago) — no later contract found for this tenant and unit', {d: c.end, n: -dEnd}));
        it.score += 40 + Math.max(0, Math.round((rules.days - Math.max(dEnd, 0)) / rules.days * 20)); it.end = c.end;
      });
    }
    /* Rules 2 and 3: bounced cheques */
    if(bc && bc.list.length){
      var byT = {};
      bc.list.forEach(function(x){ var t = nk(x.tenant) || ('C:' + x.ck); (byT[t] = byT[t] || []).push(x); });
      Object.keys(byT).forEach(function(t){ var l = byT[t]; if(l.length >= rules.bounces){ l.forEach(function(x, i){ if(i) return; var it = item(x.ck || t, x.contract, x.tenant); it.reasons.push(T('{n} bounced cheques this month', {n: l.length})); it.score += 50 + 10 * (l.length - rules.bounces); }); } });
      var am = bc.list.map(function(x){ return x.amountN || 0; }).sort(function(a, b){ return b - a; });
      var k = Math.max(1, Math.ceil(am.length * rules.topPct / 100)), cut = am[Math.min(k, am.length) - 1];
      bc.list.forEach(function(x){ if(x.amountN > 0 && x.amountN >= cut){ var it = item(x.ck || nk(x.tenant), x.contract, x.tenant); it.reasons.push(T('Bounced cheque of AED {a} — top {p}% this month', {a: fmt(x.amountN), p: rules.topPct})); if(x.status) it.extra = T('Status: {s}', {s: x.status}); it.score += 30; it.amount = (it.amount || 0) + x.amountN; } });
    }
    out.items.sort(function(a, b){ return b.score - a.score || String(a.tenant).localeCompare(String(b.tenant)); });
    out.items.forEach(function(it){ it.level = it.score >= 70 ? 'High' : 'Medium'; });
    return out;
  }

  /* ---------- dialog ---------- */
  var dlg, body, rules = loadRules();
  function ensure(){
    if(dlg) return;
    dlg = document.createElement('dialog'); dlg.className = 'vf-drawer vf-risk'; dlg.setAttribute('aria-label', 'Needs attention');
    body = el('div', 'vf-d-body'); dlg.appendChild(body);
    dlg.addEventListener('click', function(e){ if(e.target === dlg) close(); });
    document.body.appendChild(dlg);
  }
  function close(){ if(!dlg) return; try{ dlg.close(); }catch(e){ dlg.removeAttribute('open'); } }
  function csv(res){
    var esc = function(v){ v = v == null ? '' : String(v); return /[",\n\r]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; };
    var rows = [[tr('Risk'), tr('Tenant'), tr('Contract'), tr('Why flagged')]].concat(res.items.map(function(it){ return [tr(it.level), it.tenant, it.contract, it.reasons.join(' | ')]; }));
    var b = new Blob(['﻿' + rows.map(function(r){ return r.map(esc).join(','); }).join('\r\n')], {type: 'text/csv;charset=utf-8'});
    var a = document.createElement('a'); a.href = URL.createObjectURL(b); var m = ''; try{ m = currentMonth; }catch(e){} a.download = 'Needs-attention_' + m + '.csv'; document.body.appendChild(a); a.click(); setTimeout(function(){ try{ URL.revokeObjectURL(a.href); }catch(e){} a.remove(); }, 500);
  }
  function numInput(key, min, max){
    var i = el('input', 'vf-risk-num'); i.type = 'number'; i.min = min; i.max = max; i.step = 1; i.value = rules[key]; i.setAttribute('data-rule', key);
    i.addEventListener('change', function(){ var n = Math.round(+i.value); if(!isFinite(n) || n < min) n = min; if(n > max) n = max; rules[key] = n; saveRules(rules); render(); });
    return i;
  }
  function ruleRow(pre, key, post, min, max){ var r = el('label', 'vf-risk-rule'); r.appendChild(el('span', null, tr(pre))); r.appendChild(numInput(key, min, max)); r.appendChild(el('span', null, tr(post))); return r; }
  function render(){
    if(!dlg || !dlg.open) return;
    var res = compute(rules); body.innerHTML = '';
    var h = el('div', 'vf-d-head'), t = el('div', 'vf-d-titles');
    t.appendChild(el('div', 'vf-d-title', tr('Needs attention')));
    t.appendChild(el('div', 'vf-d-sub', tr('Ranked by risk. These are default rules — change any number and the list updates.')));
    h.appendChild(t);
    var act = el('div', 'vf-d-actions');
    if(res && res.items.length){ var ex = el('button', 'vf-btn', tr('Export Excel')); ex.type = 'button'; ex.addEventListener('click', function(){ csv(res); }); act.appendChild(ex); }
    var x = el('button', 'vf-btn vf-x', '✕'); x.type = 'button'; x.setAttribute('aria-label', tr('Close')); x.addEventListener('click', close); act.appendChild(x);
    h.appendChild(act); body.appendChild(h);
    var rb = el('div', 'vf-risk-rules'); rb.appendChild(el('div', 'vf-risk-rt', tr('Rules')));
    rb.appendChild(ruleRow('Lease ends within', 'days', 'days with no renewal', 1, 365));
    rb.appendChild(ruleRow('Tenant has', 'bounces', 'or more bounced cheques', 2, 20));
    rb.appendChild(ruleRow('Bounced cheque in the top', 'topPct', '% by amount this month', 1, 50));
    var rs = el('button', 'vf-btn', tr('Reset to defaults')); rs.type = 'button'; rs.addEventListener('click', function(){ rules = {days: DEF.days, bounces: DEF.bounces, topPct: DEF.topPct}; saveRules(rules); render(); }); rb.appendChild(rs);
    body.appendChild(rb);
    var wrap = el('div', 'vf-d-tablewrap');
    if(!res || (!res.loaded.count && !res.loaded.bounced)){ wrap.appendChild(el('div', 'vf-empty', tr('Cheque Count and Bounced Cheques must be loaded'))); }
    else if(!res.items.length){ wrap.appendChild(el('div', 'vf-empty', tr('Nothing needs attention under these rules'))); }
    else {
      var tb = el('table', 'vf-table'), th = el('thead'), hr = el('tr');
      ['Risk', 'Tenant', 'Contract', 'Why flagged'].forEach(function(c){ hr.appendChild(el('th', null, tr(c))); }); th.appendChild(hr); tb.appendChild(th);
      var tbody = el('tbody');
      res.items.forEach(function(it){
        var tr1 = el('tr'); var rk = el('td'); rk.appendChild(el('span', 'vf-risk-pill vf-risk-' + it.level.toLowerCase(), tr(it.level))); tr1.appendChild(rk);
        tr1.appendChild(el('td', null, it.tenant || '—'));
        var ct = el('td'); var a = el('button', 'vf-link', it.contract); a.type = 'button'; a.title = tr('Open this contract'); a.addEventListener('click', function(){ close(); try{ window.MDDrill.openContract(it.contract); }catch(e){} }); ct.appendChild(a); tr1.appendChild(ct);
        var why = el('td'); it.reasons.forEach(function(r){ why.appendChild(el('div', null, r)); }); if(it.extra) why.appendChild(el('div', 'vf-risk-x', it.extra)); tr1.appendChild(why);
        tbody.appendChild(tr1);
      });
      tb.appendChild(tbody); wrap.appendChild(tb);
      wrap.appendChild(el('div', 'vf-risk-note', res.items.length + ' ' + tr('flagged') + ' · ' + tr('Rule for lease ends and renewals is based on contracts loaded for this month')));
    }
    body.appendChild(wrap);
  }
  function open(){ ensure(); rules = loadRules(); if(!dlg.open){ try{ dlg.showModal(); }catch(e){ dlg.setAttribute('open', ''); } } render(); }

  /* ---------- button on each report toolbar ---------- */
  var IDS = {'bounced-cheques':1, 'new-lease':1, 'count-report':1, 'request-count':1};
  function decorate(){
    document.querySelectorAll('.report-pane[data-report]').forEach(function(p){
      if(!IDS[p.dataset.report]) return;
      var bar = p.querySelector(':scope > .vf-bar'); if(!bar) return;
      var b = bar.querySelector('[data-vf-risk]');
      if(!b){ b = el('button', 'theme-switch', tr('Needs attention')); b.type = 'button'; b.setAttribute('data-vf-risk', '1'); b.addEventListener('click', open); bar.insertBefore(b, bar.firstChild); }
      else { var t = tr('Needs attention'); if(b.textContent !== t) b.textContent = t; }
    });
    if(dlg && dlg.open){ var t2 = tr('Needs attention'); var tt = dlg.querySelector('.vf-d-title'); if(tt && tt.textContent !== t2) render(); }
  }
  document.addEventListener('click', function(e){ if(e.target && e.target.id === 'langBtn') setTimeout(function(){ decorate(); render(); }, 80); });
  setInterval(decorate, 1000); setTimeout(decorate, 400);
  window.MDRisk = {compute: compute, open: open, rules: loadRules, defaults: DEF};
})();
