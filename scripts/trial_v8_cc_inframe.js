// TRIAL v8 - Cheque Count page (runs INSIDE the report iframe).
// Cheque count = how many installments are given to tenants (Bibin). The page is driven by the workbook's own
// "Installment count" sheet (plan size -> number of contracts), and answers one question first:
// which contract got how many installments. Installment = a "Rent Installment" line, whatever the payment method
// (fees such as Innovation Fee / Tariff / Harbor Fees / VAT are never installments).
// Reads: installmentSheetState {newLabels, renLabels, rows[{newVals, renVals}]}, lastDataCC.records / report_month.
(function(){
  var L = window.__v9L || (window.__v9L = function(en, ar){ var a = false; try{ a = (typeof currentLangCC !== 'undefined' && currentLangCC === 'ar'); }catch(e){} return a ? ar : en; });
  var AEDs = function(n){ return L('AED ' + n, n + ' د.إ'); };
  var AR_MONTHS = ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];
  var mode = 'all';      // all | renewal | new
  var planFilter = 0;    // 0 = every plan
  var query = '';
  var limit = 60;
  function num(l){ var x = parseInt(String(l), 10); return isNaN(x) ? 0 : x; }
  function aed(v){ return Math.round(v).toLocaleString(); }
  function esc(s){ return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function sheet(){ try{ return (typeof installmentSheetState !== 'undefined') ? installmentSheetState : null; }catch(e){ return null; } }
  function data(){ try{ return (typeof lastDataCC !== 'undefined') ? lastDataCC : null; }catch(e){ return null; } }
  function keep(kind){ return mode === 'all' || (mode === 'renewal' && kind === 'renewal') || (mode === 'new' && kind === 'new'); }
  function fmtDate(iso){ if(!iso) return '·'; var p = String(iso).slice(0, 10).split('-'); if(p.length !== 3) return String(iso); var M = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']; return p[2] + ' ' + L(M[+p[1] - 1], AR_MONTHS[+p[1] - 1]) + ' ' + p[0].slice(2); }
  function methodLabel(m){ m = String(m || ''); if(/credit/i.test(m)) return 'card'; if(/bank|transfer/i.test(m)) return 'transfer'; if(/cheque/i.test(m)) return 'cheque'; if(/cash/i.test(m)) return 'cash'; return m.toLowerCase() || 'other'; }
  var AR_METHOD = { cheque: 'شيك', card: 'بطاقة', transfer: 'تحويل', cash: 'نقداً', other: 'أخرى' };

  // plan size -> contracts, straight from the Installment count sheet
  function sheetPlans(st){
    var p = {}, nw = {}, rn = {};
    st.rows.forEach(function(r){
      st.newLabels.forEach(function(l, i){ var c = num(l), v = r.newVals[i] || 0; if(c){ nw[c] = (nw[c] || 0) + v; } });
      st.renLabels.forEach(function(l, i){ var c = num(l), v = r.renVals[i] || 0; if(c){ rn[c] = (rn[c] || 0) + v; } });
    });
    var keys = {};
    Object.keys(nw).concat(Object.keys(rn)).forEach(function(k){ keys[k] = 1; });
    Object.keys(keys).forEach(function(k){
      var c = +k; p[c] = { renewal: rn[c] || 0, nw: nw[c] || 0 };
      p[c].shown = (keep('renewal') ? p[c].renewal : 0) + (keep('new') ? p[c].nw : 0);
    });
    return p;
  }

  // per-contract view from Details: installments = Rent Installment lines
  function contractsFromDetails(){
    var d = data(); if(!d || !d.records) return null;
    var rm = d.report_month || null, by = {}, order = [];
    d.records.forEach(function(r){
      var k = by[r.contract];
      if(!k){ k = by[r.contract] = { id: r.contract, tenant: r.tenant, property: r.property, kind: /new lease/i.test(r.leaseType || '') ? 'new' : (/renewal/i.test(r.leaseType || '') ? 'renewal' : 'other'), n: 0, methods: {}, rent: 0, future: 0, due: 0, first: null, last: null }; order.push(r.contract); }
      if(!r.isInstallment) return;
      k.n++; var ml = methodLabel(r.payMethod); k.methods[ml] = (k.methods[ml] || 0) + 1;
      k.rent += r.amount || 0;
      var cd = r.chequeDate ? String(r.chequeDate).slice(0, 10) : null;
      if(cd){ if(!k.first || cd < k.first) k.first = cd; if(!k.last || cd > k.last) k.last = cd; var m = cd.slice(0, 7); if(rm){ if(m > rm) k.future += r.amount || 0; else if(m === rm) k.due += r.amount || 0; } }
    });
    return order.map(function(c){ return by[c]; }).filter(function(k){ return k.n > 0; });
  }

  function paidBy(k){
    var parts = ['cheque', 'card', 'transfer', 'cash', 'other'].filter(function(m){ return k.methods[m]; }).map(function(m){ var n = k.methods[m], pl = { cheque: 'cheques', card: 'cards', transfer: 'transfers' }; return n + ' ' + L(n > 1 && pl[m] ? pl[m] : m, AR_METHOD[m] || m); });
    return parts.join(' · ');
  }

  function render(){
    var st = sheet(), k = document.getElementById('v8InstKpis'), b = document.getElementById('v8InstBars'), t = document.getElementById('v8InstTabs');
    if(!k || !b || !t || !st || !st.rows || !st.rows.length) return;
    var plans = sheetPlans(st);
    var keys = Object.keys(plans).map(Number).sort(function(a, c){ return a - c; }).filter(function(c){ return plans[c].shown > 0; });
    if(planFilter && keys.indexOf(planFilter) === -1) planFilter = 0;
    var contracts = 0, inst = 0, topC = 0, topN = 0, nwTot = 0, rnTot = 0;
    keys.forEach(function(c){
      var s = plans[c]; contracts += s.shown; inst += c * s.shown;
      if(keep('renewal')) rnTot += s.renewal; if(keep('new')) nwTot += s.nw;
      if(s.shown > topN){ topN = s.shown; topC = c; }
    });
    var label = { all: L('All contracts', 'كل العقود'), renewal: L('Renewal Lease', 'عقود التجديد'), 'new': L('New Lease', 'عقود جديدة') };
    t.innerHTML = ['all', 'renewal', 'new'].map(function(m){
      var on = m === mode;
      return '<button type="button" data-m="' + m + '" style="cursor:pointer;border:1px solid ' + (on ? 'var(--accent)' : 'var(--border)') + ';background:' + (on ? 'var(--accent)' : 'var(--card2)') + ';color:' + (on ? '#fff' : 'var(--text)') + ';border-radius:999px;padding:7px 16px;font:inherit;font-size:12.5px;font-weight:700;margin-right:8px">' + label[m] + '</button>';
    }).join('');
    Array.prototype.forEach.call(t.querySelectorAll('button'), function(btn){ btn.onclick = function(){ mode = btn.getAttribute('data-m'); limit = 60; render(); }; });

    function tile(l, v, n){ return '<div class="kpi"><div class="label">' + l + '</div><div class="value">' + v + '</div><div class="note">' + n + '</div></div>'; }
    k.innerHTML = tile(L('Installments given', 'الأقساط المقدمة'), inst.toLocaleString(), L('rent installments handed to tenants', 'أقساط الإيجار المسلّمة للمستأجرين'))
      + tile(L('Contracts on a plan', 'عقود ضمن خطة'), contracts.toLocaleString(), mode === 'all' ? L('Renewal ' + rnTot + ' · New Lease ' + nwTot, 'تجديد ' + rnTot + ' · جديد ' + nwTot) : label[mode])
      + tile(L('Average per contract', 'المتوسط لكل عقد'), contracts ? (inst / contracts).toFixed(1) : '0', L('installments per contract', 'أقساط لكل عقد'))
      + tile(L('Most common plan', 'الخطة الأكثر شيوعاً'), topC ? L(topC + (topC === 1 ? ' installment' : ' installments'), topC + (topC === 1 ? ' قسط' : ' أقساط')) : '—', topN ? L(topN.toLocaleString() + ' contracts (' + Math.round(topN / contracts * 100) + '%)', topN.toLocaleString() + ' عقد (' + Math.round(topN / contracts * 100) + '%)') : '');

    var list = contractsFromDetails(), dm = {};
    if(list) list.forEach(function(c){
      if(!keep(c.kind)) return;
      var o = dm[c.n] || (dm[c.n] = { contracts: 0, rent: 0, future: 0, due: 0 });
      o.contracts++; o.rent += c.rent; o.future += c.future; o.due += c.due;
    });

    var max = Math.max.apply(null, keys.map(function(c){ return c * plans[c].shown; }).concat([1]));
    var totRent = 0, totFuture = 0, totDue = 0, dContracts = 0, dInst = 0;
    var planRows = keys.map(function(c){
      var s = plans[c], m = dm[c] || { contracts: 0, rent: 0, future: 0, due: 0 };
      totRent += m.rent; totFuture += m.future; totDue += m.due; dContracts += m.contracts; dInst += m.contracts * c;
      var rw = keep('renewal') ? s.renewal : 0, nw = keep('new') ? s.nw : 0, on = planFilter === c;
      return '<div class="v9-rank-row v9-plan-row' + (on ? ' on' : '') + '" data-plan="' + c + '" role="button" tabindex="0">'
        + '<span class="nm">' + L(c + (c === 1 ? ' installment' : ' installments'), c + (c === 1 ? ' قسط' : ' أقساط')) + '</span>'
        + '<span class="bar v9-stack"><i style="width:' + (c * rw / max * 100).toFixed(1) + '%;background:var(--accent)"></i><i style="width:' + (c * nw / max * 100).toFixed(1) + '%;background:var(--accent2,#2dd4bf)"></i></span>'
        + '<span class="pc">' + (inst ? (c * s.shown / inst * 100).toFixed(1) : '0.0') + '%</span>'
        + '<span class="v">' + L(s.shown.toLocaleString() + (s.shown === 1 ? ' contract' : ' contracts') + ' · ' + (c * s.shown).toLocaleString() + ' installments', s.shown.toLocaleString() + ' عقد · ' + (c * s.shown).toLocaleString() + ' قسط') + '<small>' + L('AED ' + aed(m.rent) + ' rent · ' + aed(m.future) + ' future-dated · ' + aed(m.due) + ' due this month', aed(m.rent) + ' د.إ إيجار · ' + aed(m.future) + ' مؤجلة · ' + aed(m.due) + ' مستحقة هذا الشهر') + '</small></span></div>';
    }).join('');
    var planTotal = '<div class="v9-plan-total"><b>' + L('Total', 'الإجمالي') + '</b><span>' + L(contracts.toLocaleString() + ' contracts · ' + inst.toLocaleString() + ' installments · AED ' + aed(totRent) + ' rent', contracts.toLocaleString() + ' عقد · ' + inst.toLocaleString() + ' قسط · ' + aed(totRent) + ' د.إ إيجار') + '<small>' + L('AED ' + aed(totFuture) + ' future-dated · ' + aed(totDue) + ' due this month', aed(totFuture) + ' د.إ مؤجلة · ' + aed(totDue) + ' د.إ مستحقة هذا الشهر') + '</small></span></div>';

    // sheet vs Details reconciliation (the sheet is the reference)
    var recon = '';
    if(list){
      var dc = dContracts, di = dInst, same = dc === contracts && di === inst;
      recon = '<div style="margin-top:12px;padding:10px 14px;border-radius:12px;border:1px solid ' + (same ? 'var(--border)' : 'var(--amber,#f59e0b)') + ';font-size:12.5px;line-height:1.5;color:var(--text)">'
        + '<b>' + L('Sheet vs Details.', 'الورقة مقابل التفاصيل.') + '</b> ' + L('The sheet has ' + contracts.toLocaleString() + ' contracts and ' + inst.toLocaleString() + ' installments; Details has ' + dc.toLocaleString() + ' contracts and ' + di.toLocaleString() + ' installments', 'الورقة فيها ' + contracts.toLocaleString() + ' عقد و' + inst.toLocaleString() + ' قسط؛ والتفاصيل فيها ' + dc.toLocaleString() + ' عقد و' + di.toLocaleString() + ' قسط')
        + (same ? L(' (they match).', ' (متطابقة).') : L(' (' + (dc - contracts >= 0 ? '+' : '') + (dc - contracts) + ' contracts, ' + (di - inst >= 0 ? '+' : '') + (di - inst) + ' installments). Usually a plan number entered twice or missing. The list below follows Details.', ' (' + (dc - contracts >= 0 ? '+' : '') + (dc - contracts) + ' عقد، ' + (di - inst >= 0 ? '+' : '') + (di - inst) + ' قسط). غالباً بسبب رقم خطة مكرر أو ناقص. القائمة أدناه تتبع التفاصيل.'))
        + '</div>';
    }

    var head = '<h3>' + L('Installments by plan', 'الأقساط حسب الخطة') + '</h3><div class="desc">' + L('Rent installments per contract, from the Installment count sheet. Click a plan to list its contracts.', 'أقساط الإيجار لكل عقد من ورقة عدد الأقساط. اضغط على خطة لعرض عقودها.') + '</div>'
      + '<div class="v9-rank v9-plan">' + planRows + '</div>' + planTotal
      + '<div style="display:flex;flex-wrap:wrap;gap:18px;margin-top:12px;font-size:12px;color:var(--sub)"><span><i style="display:inline-block;width:10px;height:10px;border-radius:3px;background:var(--accent);margin-right:6px"></i>' + L('Renewal Lease', 'عقود التجديد') + '</span><span><i style="display:inline-block;width:10px;height:10px;border-radius:3px;background:var(--accent2,#2dd4bf);margin-right:6px"></i>' + L('New Lease', 'عقود جديدة') + '</span></div>'
      + recon;

    // contract list: which contract got how many installments
    var listHtml = '';
    if(list){
      var q = query.trim().toLowerCase();
      var vis = list.filter(function(c){
        if(!keep(c.kind)) return false;
        if(planFilter && c.n !== planFilter) return false;
        if(q && (String(c.id) + ' ' + String(c.tenant || '') + ' ' + String(c.property || '')).toLowerCase().indexOf(q) === -1) return false;
        return true;
      }).sort(function(a, c){ return c.n - a.n || String(a.id).localeCompare(String(c.id)); });
      var shown = vis.slice(0, limit); var maxRent = Math.max.apply(null, list.map(function(c){ return c.rent || 0; }).concat([1])), totRentAll = list.reduce(function(t, c){ return t + (c.rent || 0); }, 0);
      var chip = function(v, text){ var on = planFilter === v; return '<button type="button" data-chip="' + v + '" class="la4-chip' + (on ? ' on' : '') + '">' + text + '</button>'; };
      var chips = chip(0, L('All plans', 'كل الخطط')) + keys.map(function(c){ return chip(c, L(c + (c === 1 ? ' installment' : ' installments'), c + (c === 1 ? ' قسط' : ' أقساط'))); }).join('');
      var body = shown.map(function(c){
        var bg = c.n >= 6 ? 'rgba(91,140,255,.22)' : 'var(--card2)';
        var kindTxt = c.kind === 'new' ? L('New Lease', 'جديد') : (c.kind === 'renewal' ? L('Renewal', 'تجديد') : '');
        var sub1 = [esc(c.tenant), kindTxt].filter(Boolean).join(' · ');
        return '<div class="v9-crk2"><span class="nm"><b>' + esc(c.id) + '</b><small>' + esc(c.property) + '</small><small>' + sub1 + '</small></span>'
          + '<span class="mid"><b>' + L(c.n + (c.n === 1 ? ' installment' : ' installments'), c.n + (c.n === 1 ? ' قسط' : ' أقساط')) + '</b><small>' + esc(paidBy(c)) + '</small><small>' + fmtDate(c.first) + ' → ' + fmtDate(c.last) + '</small></span>'
          + '<span class="v">' + AEDs(aed(c.rent)) + '</span></div>';
      }).join('');
      listHtml = '<h3 style="margin-top:22px">' + L('Contracts', 'العقود') + '</h3><div class="desc">' + L('Each contract with its installments and how they are paid. Showing ' + shown.length.toLocaleString() + ' of ' + vis.length.toLocaleString() + (planFilter ? ' (plan of ' + planFilter + ')' : '') + '.', 'كل عقد مع أقساطه وطريقة سدادها. عرض ' + shown.length.toLocaleString() + ' من ' + vis.length.toLocaleString() + (planFilter ? ' (خطة ' + planFilter + ')' : '') + '.') + '</div>'
        + '<div style="display:flex;flex-wrap:wrap;align-items:center;gap:6px 14px;margin-bottom:10px"><div>' + chips + '</div><input id="v8InstSearch" class="v9-search" type="search" placeholder="' + L('Search contract, tenant or property', 'ابحث بالعقد أو المستأجر أو العقار') + '" value="' + esc(query) + '" ></div>'
        + '<div class="v9-crk2 v9-crk2-head"><span>' + L('Contract, property, tenant', 'العقد والعقار والمستأجر') + '</span><span>' + L('Installments, payment, dates', 'الأقساط والدفع والتواريخ') + '</span><span>' + L('Rent', 'الإيجار') + '</span></div>'
        + '<div class="v9-clist2">' + (body || '<div class="v9-crow-empty">' + L('No contracts match.', 'لا توجد عقود مطابقة.') + '</div>') + '</div>'
        + (vis.length > shown.length ? '<div style="text-align:center;margin-top:10px"><button type="button" id="v8InstMore" class="btn secondary">' + L('Show ' + Math.min(200, vis.length - shown.length).toLocaleString() + ' more', 'عرض ' + Math.min(200, vis.length - shown.length).toLocaleString() + ' إضافية') + '</button></div>' : '');
    }
    b.innerHTML = head + listHtml;

    Array.prototype.forEach.call(b.querySelectorAll('.v9-plan-row'), function(tr){ tr.onclick = function(){ var p = +tr.getAttribute('data-plan'); planFilter = planFilter === p ? 0 : p; limit = 60; render(); }; });
    Array.prototype.forEach.call(b.querySelectorAll('button[data-chip]'), function(btn){ btn.onclick = function(){ planFilter = +btn.getAttribute('data-chip'); limit = 60; render(); }; });
    var more = document.getElementById('v8InstMore'); if(more) more.onclick = function(){ limit += 200; render(); };
    var inp = document.getElementById('v8InstSearch');
    var __srT; if(inp) inp.oninput = function(){ clearTimeout(__srT); __srT = setTimeout(function(){ query = inp.value; limit = 60; var pos = inp.selectionStart; render(); var n = document.getElementById('v8InstSearch'); if(n){ n.focus(); try{ n.setSelectionRange(pos, pos); }catch(e){} } }, 200); };
  }

  // Reference table (the workbook's own Installment count sheet): add a Total column and a second line under each
  // portfolio that turns contracts into installments (plan size x contracts), e.g. 8 contracts on a 4-installment plan = 32.
  function enhanceReference(){
    try{
      var st = sheet(), wrap = document.getElementById('crossTableWrap');
      if(!st || !wrap) return;
      var desc = document.querySelector('[data-i18n="cc.referenceCardDesc"]');
      if(desc && desc.getAttribute('data-v8') !== '1'){
        desc.textContent = L('The workbook\'s Installment count sheet, as entered. Each column is a plan size. Top number: contracts on the plan. Bottom number: contracts × plan size = installments.', 'ورقة عدد الأقساط في ملف العمل كما أُدخلت. كل عمود هو حجم خطة. الرقم العلوي: العقود ضمن الخطة. الرقم السفلي: العقود × حجم الخطة = الأقساط.');
        desc.setAttribute('data-v8', '1');
      }
      var tb = wrap.querySelector('table'); if(!tb || tb.getAttribute('data-v8')) return;
      var trs = Array.prototype.slice.call(tb.querySelectorAll('tr')); if(trs.length < 3) return;
      var nN = st.newLabels.length;
      var plan = st.newLabels.map(num).concat(st.renLabels.map(num));
      tb.setAttribute('data-v8', '1'); tb.classList.add('v8-ref');
      var g = trs[0].querySelectorAll('th');
      if(g[1]) g[1].classList.add('v8-gn'); if(g[2]) g[2].classList.add('v8-gr');
      var tot = document.createElement('th'); tot.setAttribute('rowspan', '2'); tot.className = 'num v8-tot'; tot.textContent = L('Total', 'الإجمالي'); trs[0].appendChild(tot);
      Array.prototype.forEach.call(trs[1].querySelectorAll('th'), function(th, i){ th.classList.add('v8-plan'); if(i === nN) th.classList.add('v8-split'); });
      trs.slice(2).forEach(function(tr, ri){
        var row = st.rows[ri]; if(!row) return;
        var vals = row.newVals.concat(row.renVals);
        var tds = tr.querySelectorAll('td');
        var contracts = 0, inst = 0;
        var sub = document.createElement('tr'); sub.className = 'v8-ref-inst';
        var first = document.createElement('td'); first.innerHTML = '<span class="v8-ref-k">' + L('Installments', 'الأقساط') + '</span><small>' + L('plan size × contracts', 'حجم الخطة × العقود') + '</small>'; sub.appendChild(first);
        vals.forEach(function(v, i){
          v = v || 0; var p = plan[i] || 0; contracts += v; inst += v * p;
          if(tds[i + 1] && i === nN) tds[i + 1].classList.add('v8-split');
          var c = document.createElement('td'); c.className = 'num' + (v ? '' : ' zero') + (i === nN ? ' v8-split' : '');
          c.innerHTML = v ? ((v * p).toLocaleString() + '<small>' + v.toLocaleString() + ' × ' + p + '</small>') : '·';
          sub.appendChild(c);
        });
        if(tds[0]) tds[0].innerHTML = esc(tds[0].textContent) + '<small>' + L('contracts on the plan', 'عقود ضمن الخطة') + '</small>';
        var tc = document.createElement('td'); tc.className = 'num v8-tot'; tc.innerHTML = contracts.toLocaleString() + '<small>' + L('contracts', 'عقد') + '</small>'; tr.appendChild(tc);
        var ti = document.createElement('td'); ti.className = 'num v8-tot'; ti.innerHTML = inst.toLocaleString() + '<small>' + L('installments', 'قسط') + '</small>'; sub.appendChild(ti);
        tr.parentNode.insertBefore(sub, tr.nextSibling);
      });
    }catch(e){}
  }

  // Extra series for the shell (Overview + Executive Summary), added onto window.__crossCheckData without touching
  // the embedded report's own code: installments per day, contracts per day, and cheque value due this month.
  function augment(x){
    try{
      if(!x) return x;
      var d = null;
      try{ d = (typeof lastExportDataCC !== 'undefined' && lastExportDataCC && lastExportDataCC.records) ? lastExportDataCC : null; }catch(e){}
      if(!d) d = data();
      if(!d || !d.records) return x;
      var rm = d.report_month || (d.date_min ? String(d.date_min).slice(0, 7) : null);
      var inst = {}, first = {}, cm = 0, cmN = 0, cl = 0, clN = 0;
      d.records.forEach(function(r){
        if(r.isInstallment){
          inst[r.date] = (inst[r.date] || 0) + 1;
          if(!first[r.contract] || r.date < first[r.contract]) first[r.contract] = r.date;
        }
        if(/^cheque$/i.test(String(r.payMethod || '')) && r.chequeDate && rm){
          var m = String(r.chequeDate).slice(0, 7);
          if(m === rm){ cm += r.amount || 0; cmN++; } else if(m > rm){ cl += r.amount || 0; clN++; }
        }
      });
      var con = {}; Object.keys(first).forEach(function(c){ con[first[c]] = (con[first[c]] || 0) + 1; });
      var sortKeys = function(o){ var out = {}; Object.keys(o).sort().forEach(function(k){ out[k] = o[k]; }); return out; };
      x.installments_daily = sortKeys(inst); x.contracts_daily = sortKeys(con);
      x.cheque_month_amount = cm; x.cheque_month_count = cmN; x.cheque_later_amount = cl; x.cheque_later_count = clN;
      // The Installment count sheet is the main source: the shell (Overview, Executive Summary) shows the sheet's totals,
      // and keeps the Details-derived totals so the difference can be reported on Data Quality.
      var st = sheet();
      if(st && st.rows && st.rows.length && x.details_installments_total === undefined){
        var sc = 0, si = 0;
        st.rows.forEach(function(r){
          st.newLabels.forEach(function(l, i){ var v = r.newVals[i] || 0; sc += v; si += v * num(l); });
          st.renLabels.forEach(function(l, i){ var v = r.renVals[i] || 0; sc += v; si += v * num(l); });
        });
        x.details_installments_total = x.installments_total; x.details_contracts_with_installments = x.contracts_with_installments;
        x.sheet_installments_total = si; x.sheet_contracts_with_installments = sc;
        x.installments_total = si; x.contracts_with_installments = sc;
      }
    }catch(e){}
    return x;
  }
  function withMismatchIssue(list){
    try{
      var x = window.__crossCheckData;
      if(!Array.isArray(list) || !x || x.sheet_installments_total === undefined) return list;
      var dc = x.details_contracts_with_installments, di = x.details_installments_total, sc = x.sheet_contracts_with_installments, si = x.sheet_installments_total;
      if(dc === sc && di === si) return list;
      var sg = function(n){ return (n >= 0 ? '+' : '') + n.toLocaleString(); };
      list.push({ severity: 'warning', metric: 'Installments given',
        message: L('The Installment count sheet has ' + sc.toLocaleString() + ' contracts and ' + si.toLocaleString() + ' installments; Details has ' + dc.toLocaleString() + ' contracts and ' + di.toLocaleString() + ' installments (' + sg(dc - sc) + ' contracts, ' + sg(di - si) + ' installments). Usually a plan number entered twice or missing. The dashboard follows the sheet.', 'ورقة عدد الأقساط فيها ' + sc.toLocaleString() + ' عقد و' + si.toLocaleString() + ' قسط؛ والتفاصيل فيها ' + dc.toLocaleString() + ' عقد و' + di.toLocaleString() + ' قسط (' + sg(dc - sc) + ' عقد، ' + sg(di - si) + ' قسط). غالباً بسبب رقم خطة مكرر أو ناقص. اللوحة تتبع الورقة.') });
    }catch(e){}
    return list;
  }
  try{
    var cur = window.__crossCheckData;
    Object.defineProperty(window, '__crossCheckData', { configurable: true, get: function(){ return cur; }, set: function(v){ cur = augment(v); } });
    if(cur) augment(cur);
    var curIssues = window.__dataIssues;
    // Lazy: the sheet may be parsed after the issue list is first assigned, so add the entry on read (once, without mutating the original).
    Object.defineProperty(window, '__dataIssues', { configurable: true,
      get: function(){
        if(!Array.isArray(curIssues)) return curIssues;
        var out = withMismatchIssue(curIssues.filter(function(i){ return !(i && i.metric === 'Installments given' && /Installment count sheet/.test(i.message || '')); }).slice());
        return out;
      },
      set: function(v){ curIssues = v; } });
  }catch(e){}

  // Snapshot keeps only figures not shown elsewhere: installments/contracts live in "Installments given" (sheet figures), the dated-cheque values in "Payment Pipeline"
  function tidySnapshot(){
    try{
      var sec = document.getElementById('sec-snapshot'); if(!sec || sec.getAttribute('data-v9')) return;
      var k = function(id){ var e = document.getElementById(id); return e && e.closest('.kpi'); };
      ['kpiLines','kpiContracts','kpiChequeFutureAmountSnap','kpiChequeDatedAmount'].forEach(function(id){ var e = k(id); if(e) e.style.display = 'none'; });
      var first = sec.querySelector('.kpis'), tc = k('kpiTotalContractsSnap'), rn = k('kpiRenewalNewSnap');
      if(first){ if(tc) first.appendChild(tc); if(rn) first.appendChild(rn); }
      var sp = sec.querySelector('.kpis-split'); if(sp && !sp.querySelector('.kpi')) sp.style.display = 'none';
      sec.setAttribute('data-v9', '1');
    }catch(e){}
  }
  function labelStatic(){
    try{
      var t1 = document.querySelector('#sec-installments .section-title span:last-child'); if(t1) t1.textContent = L('Installments given to tenants', 'الأقساط المقدمة للمستأجرين');
      var d1 = document.querySelector('#sec-installments .section-desc'); if(d1) d1.textContent = L('Installments (post-dated cheques) given to tenants per contract, from the Installment count sheet.', 'عدد الأقساط (الشيكات المؤجلة) المقدمة للمستأجرين لكل عقد، من ورقة عدد الأقساط.');
      var a1 = document.querySelector('a[href="#sec-installments"]'); if(a1) a1.textContent = L('Installments', 'الأقساط');
    }catch(e){}
  }
  function hookLang(){
    var orig = window.__mdSetReportLanguage;
    if(typeof orig !== 'function' || orig.__v9) return;
    var w = function(){
      var r = orig.apply(this, arguments);
      try{ var dd = document.querySelector('[data-i18n="cc.referenceCardDesc"]'); if(dd) dd.removeAttribute('data-v8'); labelStatic(); render(); enhanceReference(); }catch(e){}
      return r;
    };
    w.__v9 = 1; window.__mdSetReportLanguage = w;
  }
  function init(){
    hookLang(); labelStatic();
    tidySnapshot(); render(); enhanceReference();
    var w = document.getElementById('crossTableWrap');
    if(w && window.MutationObserver) new MutationObserver(function(){ render(); enhanceReference(); }).observe(w, { childList: true });
  }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function(){ setTimeout(init, 0); }); else setTimeout(init, 0);
})();
