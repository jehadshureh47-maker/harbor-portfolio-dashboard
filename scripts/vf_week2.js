/* Week 2 (trial v16): contract-level drill-down.
   - Click a KPI tile inside any report: a drawer lists the contracts/lines behind that number and says whether it matches the tile.
   - "View contracts" on each report shows whatever the report is currently filtered to (chart-segment clicks included).
   - Click a contract number (or use "Find contract") for a one-page view of that contract across all four reports.
   Reads the report iframes already on the page; embedded data and calculations are never modified. */
(function(){
  if(window.MDDrill) return;
  var NAMES = {'bounced-cheques':'Bounced Cheques','new-lease':'New Lease','count-report':'Cheque Count','request-count':'Request Count'};
  var AR = {
    'View contracts':'عرض العقود','Find contract':'ابحث عن عقد','Contract number…':'رقم العقد…','Search…':'بحث…','Close':'إغلاق','Back to list':'العودة إلى القائمة',
    'Matches the tile':'يطابق الرقم في البطاقة','Tile shows':'البطاقة تعرض','this list shows':'وهذه القائمة تعرض','Showing the first':'عرض أول','of':'من','rows — export for all':'صفًا — صدّر للحصول على الكل',
    'No matching contracts':'لا توجد عقود مطابقة','Contract':'العقد','Tenant':'المستأجر','Property':'العقار','Date':'التاريخ','Amount (AED)':'المبلغ (درهم)','Bank':'البنك','Status':'الحالة',
    'Cheque no.':'رقم الشيك','Unit type':'نوع الوحدة','Fee type':'نوع الرسوم','PM user':'مدير العقار','Agent':'الوكيل','Description':'الوصف','Pay method':'طريقة الدفع','Cheque date':'تاريخ الشيك',
    'Lease type':'نوع العقد','Request type':'نوع الطلب','Lines':'عدد البنود','First date':'أول تاريخ','Rent value (AED)':'قيمة الإيجار (درهم)','Filters applied':'الفلاتر مفعّلة',
    'Contract not found':'لم يتم العثور على العقد','Lease period':'مدة العقد','Cheque Count':'عدد الشيكات','Request Count':'عدد الطلبات','New Lease':'عقد جديد','Bounced Cheques':'الشيكات المرتجعة',
    'Cheque lines':'بنود الشيكات','Requests':'الطلبات','New lease fees':'رسوم العقد الجديد','Rent value':'قيمة الإيجار','Bounced cheques':'الشيكات المرتجعة','Nothing recorded for this contract in this report':'لا توجد بيانات لهذا العقد في هذا التقرير',
    'Total':'الإجمالي','contracts':'عقود','lines':'بنود','Open this contract':'افتح هذا العقد','Not loaded yet':'لم يتم التحميل بعد'
  };
  try{ if(typeof REMAINING_UI === 'object') Object.keys(AR).forEach(function(k){ if(!(k in REMAINING_UI)) REMAINING_UI[k] = AR[k]; }); }catch(e){}
  function tr(s){ try{ return typeof remainingText === 'function' ? remainingText(s) : s; }catch(e){ return s; } }
  function el(tag, cls, txt){ var e = document.createElement(tag); if(cls) e.className = cls; if(txt != null) e.textContent = txt; return e; }
  function win(id){ try{ return (typeof embeddedWindows !== 'undefined' && embeddedWindows[id]) || null; }catch(e){ return null; } }

  /* ---------- data ---------- */
  function num(v){ if(typeof v === 'number') return isFinite(v) ? v : 0; if(v == null || v === '') return 0; var n = parseFloat(String(v).replace(/[^0-9.\-]/g, '')); return isFinite(n) ? n : 0; }
  function pad(n){ return (n < 10 ? '0' : '') + n; }
  function iso(w, v){
    if(v == null || v === '') return '';
    if(typeof v === 'string'){
      var s = v.trim(), m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s); if(m) return m[1] + '-' + m[2] + '-' + m[3];
      m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(s); if(m) return m[3] + '-' + pad(+m[2]) + '-' + pad(+m[1]);
    }
    try{ if(w && typeof w.toIsoDate === 'function'){ var r = w.toIsoDate(v); if(r) return r; } }catch(e){}
    if(v instanceof Date && !isNaN(v)) return v.getFullYear() + '-' + pad(v.getMonth() + 1) + '-' + pad(v.getDate());
    return '';
  }
  function ckey(c){ return String(c == null ? '' : c).trim().toUpperCase(); }
  function low(v){ return String(v == null ? '' : v).trim().toLowerCase(); }
  function norm(h){ return String(h == null ? '' : h).trim().toLowerCase().replace(/\s+/g, ' '); }
  var EXTRA = {
    contract: ['contract number', 'contract no', 'contract no.'], tenant: ['tenant name', 'tenant'], start: ['start date'], end: ['end date'],
    unit: ['unit #', 'unit number', 'unit'], chequeNo: ['cheque no.', 'cheque number', 'cheque no'], property: ['property', 'property name'], type: ['description'],
    leaseType: ['type of lease'], payMethod: ['pay. method', 'pay method'], chequeDate: ['cheque date']
  };
  function rawOf(id, filtered){
    var w = win(id); if(!w) return null;
    try{
      var o = w.eval('({rows:(typeof rawRowsState!=="undefined"?rawRowsState:null),map:(typeof colMapState!=="undefined"?colMapState:null)})');
      if(!(o && o.rows && o.rows.length > 1 && o.map)) return null;
      var rows = o.rows, applied = false;
      if(filtered){
        try{
          var src = String(w.exportFilteredCsv), tag = 'outRows.push(row);', p = src.indexOf(tag);
          if(p > 0){
            var fn = w.eval('(' + src.slice(0, p + tag.length) + '\n  }\n  return outRows;\n})');
            var got = fn(); if(got && got.length){ rows = got; applied = true; }
          }
        }catch(e){}
      }
      return {rows: rows, map: o.map, win: w, all: o.rows, filtersApplied: applied};
    }catch(e){ return null; }
  }
  function records(id, filtered){
    var o = rawOf(id, filtered); if(!o) return null;
    var hdr = o.rows[0] || [], hi = {}, i;
    for(i = 0; i < hdr.length; i++){ var nk = norm(hdr[i]); if(nk && hi[nk] === undefined) hi[nk] = i; }
    var idx = {}; Object.keys(o.map).forEach(function(k){ idx[k] = o.map[k]; });
    Object.keys(EXTRA).forEach(function(k){
      if(idx[k] !== undefined && idx[k] >= 0) return;
      for(var q = 0; q < EXTRA[k].length; q++) if(hi[EXTRA[k][q]] !== undefined){ idx[k] = hi[EXTRA[k][q]]; break; }
    });
    var keys = Object.keys(idx), out = [];
    for(i = 1; i < o.rows.length; i++){
      var r = o.rows[i]; if(!r) continue;
      var rec = {}, any = false;
      for(var k2 = 0; k2 < keys.length; k2++){ var ix = idx[keys[k2]]; var v = (ix === undefined || ix < 0) ? undefined : r[ix]; rec[keys[k2]] = (v == null ? '' : v); if(v !== '' && v != null) any = true; }
      if(!any) continue;
      rec.amountN = num(rec.amount); rec.dateISO = iso(o.win, rec.date); rec.chequeDateISO = iso(o.win, rec.chequeDate);
      rec.bankKey = (typeof o.win.normalizeBankName === 'function' && rec.bank) ? o.win.normalizeBankName(String(rec.bank).trim()) : String(rec.bank || '').trim();
      rec.startISO = iso(o.win, rec.start); rec.endISO = iso(o.win, rec.end); rec.ck = ckey(rec.contract);
      out.push(rec);
    }
    return {list: out, win: o.win, filtersApplied: o.filtersApplied, total: o.all.length - 1};
  }
  function summaryRent(id, c){
    try{
      var w = win(id), sm = w && w.eval('(typeof summaryState!=="undefined"?summaryState:null)');
      if(!sm || !sm.byContract) return null;
      var by = sm.byContract, k = Object.keys(by);
      for(var i = 0; i < k.length; i++) if(ckey(k[i]) === c) return by[k[i]];
    }catch(e){}
    return null;
  }

  /* ---------- KPI definitions: which lines stand behind each tile ---------- */
  function has(v, t){ return low(v).indexOf(t) >= 0; }
  function monthRange(){ var m = ''; try{ m = currentMonth; }catch(e){} var y = +m.slice(0, 4), mo = +m.slice(5, 7); if(!y || !mo) return null; var last = new Date(y, mo, 0).getDate(); return {s: m + '-01', e: m + '-' + pad(last)}; }
  function dated(kind){ return function(r){ var mr = monthRange(), d = r.chequeDateISO; if(!mr || !/^\d{4}-\d{2}-\d{2}$/.test(d)) return false; return kind === 'this' ? (d >= mr.s && d <= mr.e) : kind === 'past' ? d < mr.s : d > mr.e; }; }
  var KPI = {
    'bounced-cheques': {
      kpiCount: {m: 'count'}, kpiAmount: {m: 'sum'}, kpiAvgValue: {m: 'avg'},
      kpiLegal: {f: function(r){ return has(r.status, 'legal'); }, m: 'count'},
      kpiPaid: {f: function(r){ return low(r.status) === 'paid'; }, m: 'count'},
      kpiProcess: {f: function(r){ return has(r.status, 'process'); }, m: 'count'},
      kpiBanks: {m: 'distinct:bankKey', sort: ['bank', 'asc']},
      kpiLargest: {m: 'max', sort: ['amountN', 'desc']},
      kpiRepeat: {f: 'repeat', m: 'contracts'}
    },
    'new-lease': {
      kpiTotal: {group: true, m: 'contracts'}, kpiAmount: {m: 'sum'}, kpiRentValue: {group: true, m: 'rent'},
      kpiAmountRenewal: {f: function(r){ return has(r.type, 'rent installment'); }, m: 'sum'},
      kpiAmountNew: {f: function(r){ return has(r.type, 'security'); }, m: 'sum'}
    },
    'count-report': {
      kpiAmount: {m: 'sum'}, kpiTotalContractsSnap: {group: true, m: 'contracts'},
      kpiNewLease: {f: function(r){ return low(r.leaseType).indexOf('new lease') === 0; }, group: true, m: 'contracts'},
      kpiRenewalLease: {f: function(r){ return low(r.leaseType).indexOf('renewal lease') === 0; }, group: true, m: 'contracts'},
      kpiLines: {f: function(r){ return low(r.type) === 'rent installment'; }, group: true, m: 'contracts'},
      kpiContracts: {f: function(r){ return low(r.type) === 'rent installment'; }, m: 'count'},
      kpiAmountCheque: {f: function(r){ return has(r.payMethod, 'transfer'); }, m: 'sum'},
      kpiAmountCredit: {f: function(r){ return has(r.payMethod, 'cash'); }, m: 'sum'},
      kpiChequeDatedAmount: {f: dated('this'), m: 'sum'}, kpiChequeDatedAmount2: {f: dated('this'), m: 'sum'},
      kpiChequePastAmount: {f: dated('past'), m: 'sum'},
      kpiChequeFutureAmount: {f: dated('future'), m: 'sum'}, kpiChequeFutureAmountSnap: {f: dated('future'), m: 'sum'}
    },
    'request-count': {
      kpiTotal: {m: 'count'}, kpiAmount: {m: 'sum'}, kpiAvgValue: {m: 'avg'},
      kpiAmountRenewal: {f: function(r){ return low(r.type) === 'renewal lease'; }, m: 'sum'},
      kpiAmountNew: {f: function(r){ return low(r.type) === 'new lease'; }, m: 'sum'},
      kpiAmountOthers: {f: function(r){ return low(r.type) !== 'renewal lease' && low(r.type) !== 'new lease'; }, m: 'sum'}
    }
  };
  var COLS = {
    'bounced-cheques': [['dateISO', 'Date', 'date'], ['contract', 'Contract', 'contract'], ['tenant', 'Tenant'], ['amountN', 'Amount (AED)', 'num'], ['bank', 'Bank'], ['status', 'Status'], ['chequeNo', 'Cheque no.'], ['unitType', 'Unit type']],
    'new-lease': [['dateISO', 'Date', 'date'], ['contract', 'Contract', 'contract'], ['tenant', 'Tenant'], ['property', 'Property'], ['type', 'Fee type'], ['amountN', 'Amount (AED)', 'num'], ['pmUser', 'PM user'], ['agent', 'Agent']],
    'count-report': [['dateISO', 'Date', 'date'], ['contract', 'Contract', 'contract'], ['tenant', 'Tenant'], ['property', 'Property'], ['type', 'Description'], ['amountN', 'Amount (AED)', 'num'], ['payMethod', 'Pay method'], ['chequeDateISO', 'Cheque date', 'date'], ['bank', 'Bank'], ['leaseType', 'Lease type'], ['pmUser', 'PM user']],
    'request-count': [['dateISO', 'Date', 'date'], ['contract', 'Contract', 'contract'], ['tenant', 'Tenant'], ['property', 'Property'], ['type', 'Request type'], ['amountN', 'Amount (AED)', 'num'], ['pmUser', 'PM user'], ['bank', 'Bank']]
  };
  function groupCols(id){
    var c = [['contract', 'Contract', 'contract'], ['tenant', 'Tenant'], ['property', 'Property'], ['leaseType', 'Lease type'], ['pmUser', 'PM user'], ['dateISO', 'First date', 'date'], ['lines', 'Lines', 'num'], ['amountN', 'Amount (AED)', 'num']];
    if(id === 'new-lease'){ c = c.filter(function(x){ return x[0] !== 'leaseType'; }); c.splice(c.length - 1, 0, ['rent', 'Rent value (AED)', 'num']); }
    return c;
  }
  function groupRows(id, list){
    var map = {}, order = [];
    list.forEach(function(r){
      var g = map[r.ck];
      if(!g){ g = map[r.ck] = {contract: r.contract, ck: r.ck, tenant: '', property: '', leaseType: '', pmUser: '', dateISO: '', lines: 0, amountN: 0, rent: 0}; order.push(g); }
      g.lines++; g.amountN += r.amountN;
      ['tenant', 'property', 'leaseType', 'pmUser'].forEach(function(k){ if(!g[k] && r[k]) g[k] = r[k]; });
      if(r.dateISO && (!g.dateISO || r.dateISO < g.dateISO)) g.dateISO = r.dateISO;
    });
    if(id === 'new-lease') order.forEach(function(g){ var s = summaryRent(id, g.ck); g.rent = s ? num(s.rentAmount) : 0; if(s && !g.property) g.property = s.property || ''; });
    return order;
  }
  function measure(id, def, list){
    var m = def.m, n = 0, i, seen = {};
    if(m === 'count') return list.length;
    if(m === 'sum'){ for(i = 0; i < list.length; i++) n += list[i].amountN; return n; }
    if(m === 'avg'){ for(i = 0; i < list.length; i++) n += list[i].amountN; return list.length ? n / list.length : 0; }
    if(m === 'max'){ for(i = 0; i < list.length; i++) if(list[i].amountN > n) n = list[i].amountN; return n; }
    if(m === 'contracts'){ list.forEach(function(r){ seen[r.ck] = 1; }); return Object.keys(seen).length; }
    if(m === 'rent'){ list.forEach(function(r){ if(!seen[r.ck]){ seen[r.ck] = 1; var s = summaryRent(id, r.ck); if(s) n += num(s.rentAmount); } }); return n; }
    if(m.indexOf('distinct:') === 0){ var f = m.slice(9); list.forEach(function(r){ if(r[f] !== '' && r[f] != null) seen[String(r[f]).trim()] = 1; }); return Object.keys(seen).length; }
    return null;
  }
  function tileNumber(txt){ var m = /-?\d[\d,]*(?:\.\d+)?/.exec(String(txt || '')); return m ? parseFloat(m[0].replace(/,/g, '')) : null; }
  function fmt(n, dec){ if(n == null || isNaN(n)) return ''; return Number(n).toLocaleString('en-US', {minimumFractionDigits: dec == null ? 0 : dec, maximumFractionDigits: dec == null ? 2 : dec}); }

  /* ---------- drawer ---------- */
  var dlg = null, body = null, stack = [];
  function ensure(){
    if(dlg) return;
    dlg = document.createElement('dialog'); dlg.className = 'vf-drawer'; dlg.setAttribute('aria-label', 'Contracts');
    body = el('div', 'vf-d-body'); dlg.appendChild(body);
    dlg.addEventListener('click', function(e){ if(e.target === dlg) closeDrawer(); });
    dlg.addEventListener('close', function(){ stack = []; });
    document.body.appendChild(dlg);
  }
  function closeDrawer(){ if(!dlg) return; try{ dlg.close(); }catch(e){ dlg.removeAttribute('open'); } stack = []; }
  function show(){ ensure(); if(!dlg.open){ try{ dlg.showModal(); }catch(e){ dlg.setAttribute('open', ''); } } }
  function downloadBlob(blob, name){ var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click(); setTimeout(function(){ try{ URL.revokeObjectURL(a.href); }catch(e){} a.remove(); }, 500); }
  function fileBase(parts){ return parts.filter(Boolean).join('_').replace(/[^A-Za-z0-9_\-]+/g, '-'); }
  function pfLabel(){ try{ return (PORTFOLIO_LABELS && PORTFOLIO_LABELS[currentPortfolio]) || currentPortfolio; }catch(e){ return ''; } }
  function curMonth(){ try{ return currentMonth; }catch(e){ return ''; } }
  function xlsxOf(id){ try{ return win(id).XLSX || window.XLSX; }catch(e){ return window.XLSX; } }
  function exportSheets(sheets, name, anyId){
    var X = xlsxOf(anyId);
    if(X && X.utils && X.write){
      try{
        var wb = X.utils.book_new();
        sheets.forEach(function(s){
          var ws = X.utils.aoa_to_sheet(s.rows), n = 0, i, c;
          for(i = 0; i < s.rows.length; i++) if(s.rows[i].length > n) n = s.rows[i].length;
          var w = []; for(c = 0; c < n; c++){ var m = 8; for(i = 0; i < s.rows.length && i < 300; i++){ var v = s.rows[i][c]; if(v != null && String(v).length > m) m = String(v).length; } w.push({wch: Math.min(m + 2, 48)}); }
          ws['!cols'] = w; X.utils.book_append_sheet(wb, ws, s.name.slice(0, 31));
        });
        downloadBlob(new Blob([X.write(wb, {bookType: 'xlsx', type: 'array'})], {type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'}), name + '.xlsx');
        return;
      }catch(e){}
    }
    var esc = function(v){ v = v == null ? '' : String(v); return /[",\n\r]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; };
    downloadBlob(new Blob(['﻿' + sheets[0].rows.map(function(r){ return r.map(esc).join(','); }).join('\r\n')], {type: 'text/csv;charset=utf-8'}), name + '.csv');
  }
  function btn(label, cls, fn){ var b = el('button', cls || 'vf-btn', label); b.type = 'button'; b.addEventListener('click', fn); return b; }
  function head(title, sub, withBack){
    var h = el('div', 'vf-d-head'), t = el('div', 'vf-d-titles');
    t.appendChild(el('div', 'vf-d-title', title)); if(sub) t.appendChild(el('div', 'vf-d-sub', sub));
    h.appendChild(t);
    var right = el('div', 'vf-d-actions');
    if(withBack) right.appendChild(btn('← ' + tr('Back to list'), 'vf-btn', function(){ stack.pop(); render(); }));
    var x = btn('✕', 'vf-btn vf-x', closeDrawer); x.setAttribute('aria-label', tr('Close')); right.appendChild(x);
    h.appendChild(right); return h;
  }

  /* list view */
  function renderList(v){
    body.innerHTML = '';
    body.appendChild(head(v.title, v.sub, stack.length > 1));
    var tools = el('div', 'vf-d-tools');
    var q = el('input', 'vf-search'); q.type = 'search'; q.placeholder = tr('Search…'); q.value = v.q || ''; q.setAttribute('aria-label', tr('Search…'));
    tools.appendChild(q);
    if(v.check){
      var pill = el('span', 'vf-pill');
      if(v.check.ok){ pill.className += ' ok'; pill.textContent = '✓ ' + tr('Matches the tile') + ' (' + v.check.text + ')'; }
      else { pill.className += ' warn'; pill.textContent = tr('Tile shows') + ' ' + v.check.tile + ' · ' + tr('this list shows') + ' ' + v.check.text; }
      tools.appendChild(pill);
    }
    if(v.filtered){ tools.appendChild(el('span', 'vf-pill', tr('Filters applied'))); }
    var sum = el('span', 'vf-d-sum'); tools.appendChild(sum);
    tools.appendChild(btn(tr('Export Excel'), 'vf-btn', function(){
      var rows = view(), aoa = [v.cols.map(function(c){ return tr(c[1]); })];
      rows.forEach(function(r){ aoa.push(v.cols.map(function(c){ var x = r[c[0]]; return c[2] === 'num' ? (x === '' || x == null ? '' : Number(x)) : (x == null ? '' : String(x).trim()); })); });
      exportSheets([{name: 'Contracts', rows: aoa}], fileBase([pfLabel(), NAMES[v.id], v.fileTag, curMonth()]), v.id);
    }));
    body.appendChild(tools);
    var wrap = el('div', 'vf-d-tablewrap'), table = el('table', 'vf-table'), thead = el('thead'), tr0 = el('tr');
    v.cols.forEach(function(c){
      var th = el('th', c[2] === 'num' ? 'num' : '', tr(c[1])); th.tabIndex = 0; th.setAttribute('role', 'button');
      th.appendChild(el('span', 'vf-sort', ''));
      var go = function(){ v.sort = [c[0], v.sort && v.sort[0] === c[0] && v.sort[1] === 'asc' ? 'desc' : 'asc']; draw(); };
      th.addEventListener('click', go); th.addEventListener('keydown', function(e){ if(e.key === 'Enter' || e.key === ' '){ e.preventDefault(); go(); } });
      tr0.appendChild(th);
    });
    thead.appendChild(tr0); table.appendChild(thead);
    var tbody = el('tbody'); table.appendChild(tbody); wrap.appendChild(table); body.appendChild(wrap);
    var note = el('div', 'vf-d-note'); body.appendChild(note);
    function view(){
      var s = low(v.q), rows = v.rows.filter(function(r){ if(!s) return true; return v.cols.some(function(c){ return low(r[c[0]]).indexOf(s) >= 0; }); });
      if(v.sort){
        var k = v.sort[0], dir = v.sort[1] === 'asc' ? 1 : -1, kind = (v.cols.filter(function(c){ return c[0] === k; })[0] || [])[2];
        rows = rows.slice().sort(function(a, b){ var x = a[k], y = b[k]; if(kind === 'num') return (num(x) - num(y)) * dir; return String(x == null ? '' : x).localeCompare(String(y == null ? '' : y), undefined, {numeric: true}) * dir; });
      }
      return rows;
    }
    function draw(){
      var rows = view(), LIMIT = 1000, total = 0;
      thead.querySelectorAll('th').forEach(function(th, idx){ var c = v.cols[idx]; th.querySelector('.vf-sort').textContent = v.sort && v.sort[0] === c[0] ? (v.sort[1] === 'asc' ? ' ▲' : ' ▼') : ''; });
      tbody.innerHTML = '';
      if(!rows.length){ var er = el('tr'), ed = el('td', 'vf-empty', tr('No matching contracts')); ed.colSpan = v.cols.length; er.appendChild(ed); tbody.appendChild(er); }
      rows.slice(0, LIMIT).forEach(function(r){
        var row = el('tr');
        v.cols.forEach(function(c){
          var td = el('td', c[2] === 'num' ? 'num' : ''), x = r[c[0]];
          if(c[2] === 'num') td.textContent = fmt(x, c[0] === 'lines' ? 0 : 2);
          else if(c[2] === 'contract' && x){ var a = el('button', 'vf-link', String(x).trim()); a.type = 'button'; a.title = tr('Open this contract'); a.addEventListener('click', function(){ openContract(x); }); td.appendChild(a); }
          else td.textContent = x == null ? '' : String(x).trim();
          row.appendChild(td);
        });
        tbody.appendChild(row);
      });
      var seen = {}; rows.forEach(function(r){ total += num(r.amountN); if(r.ck) seen[r.ck] = 1; });
      var nc = Object.keys(seen).length;
      sum.textContent = fmt(rows.length) + ' ' + tr(v.grouped ? 'contracts' : 'lines') + (v.grouped ? '' : ' · ' + fmt(nc) + ' ' + tr('contracts')) + ' · AED ' + fmt(total, 2);
      note.textContent = rows.length > LIMIT ? tr('Showing the first') + ' ' + fmt(LIMIT) + ' ' + tr('of') + ' ' + fmt(rows.length) + ' ' + tr('rows — export for all') : '';
    }
    q.addEventListener('input', function(){ v.q = q.value; draw(); });
    draw();
  }

  /* contract view */
  function openContract(c){
    var ck = ckey(c); if(!ck) return;
    var data = {}; Object.keys(NAMES).forEach(function(id){ var r = records(id, false); data[id] = r ? r.list.filter(function(x){ return x.ck === ck; }) : []; });
    var any = Object.keys(data).some(function(id){ return data[id].length; });
    var canon = ''; Object.keys(data).some(function(id){ var f = data[id][0]; if(f && f.contract){ canon = String(f.contract).trim(); return true; } return false; });
    stack.push({kind: 'contract', ck: ck, label: canon || String(c).trim(), data: data, any: any}); show(); render();
  }
  function first(list, key){ for(var i = 0; i < list.length; i++) if(list[i][key]) return list[i][key]; return ''; }
  function renderContract(v){
    body.innerHTML = '';
    var D = v.data, cc = D['count-report'], rq = D['request-count'], nl = D['new-lease'], bc = D['bounced-cheques'];
    var tenant = first(cc, 'tenant') || first(bc, 'tenant') || first(nl, 'tenant') || first(rq, 'tenant');
    var prop = first(cc, 'property') || first(nl, 'property') || first(rq, 'property');
    body.appendChild(head(v.label, [tenant, prop].filter(Boolean).join(' · ') || '', stack.length > 1));
    if(!v.any){ body.appendChild(el('div', 'vf-empty pad', tr('Contract not found'))); return; }
    var start = first(cc, 'startISO'), end = first(cc, 'endISO');
    var info = el('div', 'vf-facts');
    function fact(l, val){ if(!val && val !== 0) return; var f = el('div', 'vf-fact'); f.appendChild(el('div', 'vf-fact-l', tr(l))); f.appendChild(el('div', 'vf-fact-v', String(val))); info.appendChild(f); }
    var sum = function(l){ return l.reduce(function(a, r){ return a + r.amountN; }, 0); };
    var sr = summaryRent('new-lease', v.ck);
    fact('Lease period', start || end ? (start || '—') + ' → ' + (end || '—') : '');
    fact('Lease type', first(cc, 'leaseType')); fact('PM user', first(cc, 'pmUser') || first(nl, 'pmUser') || first(rq, 'pmUser'));
    fact('Cheque lines', cc.length ? fmt(cc.length) + ' · AED ' + fmt(sum(cc), 2) : '');
    fact('Requests', rq.length ? fmt(rq.length) + ' · AED ' + fmt(sum(rq), 2) : '');
    fact('New lease fees', nl.length ? 'AED ' + fmt(sum(nl), 2) : ''); fact('Rent value', sr ? 'AED ' + fmt(num(sr.rentAmount), 2) : '');
    fact('Bounced cheques', bc.length ? fmt(bc.length) + ' · AED ' + fmt(sum(bc), 2) : '');
    var scroll = el('div', 'vf-d-tablewrap');
    var secs = [
      ['count-report', 'Cheque Count', [['dateISO', 'Date'], ['type', 'Description'], ['amountN', 'Amount (AED)', 'num'], ['payMethod', 'Pay method'], ['chequeDateISO', 'Cheque date'], ['bank', 'Bank']]],
      ['request-count', 'Request Count', [['dateISO', 'Date'], ['type', 'Request type'], ['amountN', 'Amount (AED)', 'num'], ['pmUser', 'PM user']]],
      ['new-lease', 'New Lease', [['dateISO', 'Date'], ['type', 'Fee type'], ['amountN', 'Amount (AED)', 'num'], ['pmUser', 'PM user'], ['agent', 'Agent']]],
      ['bounced-cheques', 'Bounced Cheques', [['dateISO', 'Date'], ['chequeNo', 'Cheque no.'], ['amountN', 'Amount (AED)', 'num'], ['bank', 'Bank'], ['status', 'Status']]]
    ];
    var sheets = [];
    secs.forEach(function(s){
      var list = D[s[0]]; scroll.appendChild(el('h4', 'vf-sec', tr(s[1]) + ' (' + fmt(list.length) + ')'));
      if(!list.length){ scroll.appendChild(el('div', 'vf-empty', tr('Nothing recorded for this contract in this report'))); return; }
      var t = el('table', 'vf-table'), th = el('thead'), hr = el('tr');
      s[2].forEach(function(c){ hr.appendChild(el('th', c[2] === 'num' ? 'num' : '', tr(c[1]))); }); th.appendChild(hr); t.appendChild(th);
      var tb = el('tbody'), aoa = [s[2].map(function(c){ return tr(c[1]); })];
      list.forEach(function(r){
        var row = el('tr');
        s[2].forEach(function(c){ row.appendChild(el('td', c[2] === 'num' ? 'num' : '', c[2] === 'num' ? fmt(r[c[0]], 2) : (r[c[0]] == null ? '' : String(r[c[0]]).trim()))); });
        tb.appendChild(row); aoa.push(s[2].map(function(c){ return c[2] === 'num' ? r[c[0]] : (r[c[0]] == null ? '' : String(r[c[0]]).trim()); }));
      });
      t.appendChild(tb); scroll.appendChild(t); sheets.push({name: s[1], rows: aoa});
    });
    var bar = el('div', 'vf-d-tools');
    bar.appendChild(btn(tr('Export Excel'), 'vf-btn', function(){ exportSheets(sheets, fileBase([pfLabel(), 'Contract', v.label, curMonth()]), 'count-report'); }));
    body.appendChild(info); body.appendChild(bar); body.appendChild(scroll);
  }
  function render(){ var v = stack[stack.length - 1]; if(!v) return; if(v.kind === 'contract') renderContract(v); else renderList(v); }

  /* ---------- open from a KPI tile / from the report's current filters ---------- */
  function openKpi(id, kid, tile){
    var def = (KPI[id] || {})[kid]; if(!def) return;
    var r = records(id, true); if(!r) return;
    var list = r.list.slice();
    if(def.f === 'repeat'){ var cnt = {}; list.forEach(function(x){ cnt[x.ck] = (cnt[x.ck] || 0) + 1; }); list = list.filter(function(x){ return cnt[x.ck] > 1; }); }
    else if(typeof def.f === 'function') list = list.filter(def.f);
    var label = ''; try{ label = tile.querySelector('.label').textContent.replace(/\s+/g, ' ').trim(); }catch(e){}
    var valEl = null; try{ valEl = tile.querySelector('.value'); }catch(e){}
    var tileTxt = valEl ? valEl.textContent.trim() : '', tn = tileNumber(tileTxt), got = measure(id, def, list), dec = (def.m === 'sum' || def.m === 'avg' || def.m === 'max' || def.m === 'rent') ? 2 : 0;
    var check = (tn != null && got != null) ? {ok: Math.abs(tn - got) < 0.011, tile: tileTxt, text: (dec ? 'AED ' : '') + fmt(got, dec)} : null;
    var cols = def.group ? groupCols(id) : COLS[id], rows = def.group ? groupRows(id, list) : list;
    push({kind: 'list', id: id, title: label || tr(NAMES[id]), sub: tr(NAMES[id]) + ' · ' + curMonth(), cols: cols, rows: rows, grouped: !!def.group, sort: def.sort || null, check: check, filtered: r.filtersApplied && r.list.length < r.total, fileTag: label});
  }
  function openFiltered(id){
    var r = records(id, true); if(!r) return;
    push({kind: 'list', id: id, title: tr('View contracts'), sub: tr(NAMES[id]) + ' · ' + curMonth(), cols: COLS[id], rows: r.list, grouped: false, sort: null, check: null, filtered: r.filtersApplied && r.list.length < r.total, fileTag: 'Contracts'});
  }
  function push(v){ stack = [v]; show(); render(); }

  /* ---------- wiring: tiles inside each report, buttons in each pane ---------- */
  var HINT_CSS = '.kpi[data-vf-drill],.kpi-mini[data-vf-drill]{cursor:pointer;position:relative}.kpi[data-vf-drill]:hover,.kpi-mini[data-vf-drill]:hover{box-shadow:0 0 0 1px var(--accent,#5b8cff)}.kpi[data-vf-drill]:focus-visible,.kpi-mini[data-vf-drill]:focus-visible{outline:2px solid var(--accent,#5b8cff);outline-offset:2px}.kpi[data-vf-drill]::after,.kpi-mini[data-vf-drill]::after{content:"\\2197";position:absolute;top:8px;inset-inline-end:10px;font-size:12px;opacity:.45}.kpi[data-vf-drill]:hover::after{opacity:1}@media print{.kpi[data-vf-drill]::after{display:none}}';
  function wire(id){
    var w = win(id), d; if(!w) return; try{ d = w.document; }catch(e){ return; }
    if(!d || !d.body || d.body.getAttribute('data-vf-drill') === '1') return;
    var ids = Object.keys(KPI[id] || {});
    if(!ids.some(function(k){ return d.getElementById(k); })) return;
    if(!d.getElementById('vfDrillCss')){ var st = d.createElement('style'); st.id = 'vfDrillCss'; st.textContent = HINT_CSS; d.head.appendChild(st); }
    ids.forEach(function(k){
      var v = d.getElementById(k), tile = v && v.closest ? v.closest('.kpi,.kpi-mini') : null; if(!tile || tile.getAttribute('data-vf-drill')) return;
      tile.setAttribute('data-vf-drill', k); tile.setAttribute('role', 'button'); tile.tabIndex = 0; tile.setAttribute('title', tr('View contracts'));
      var go = function(){ openKpi(id, k, tile); };
      tile.addEventListener('click', go);
      tile.addEventListener('keydown', function(e){ if(e.key === 'Enter' || e.key === ' '){ e.preventDefault(); go(); } });
    });
    d.body.setAttribute('data-vf-drill', '1');
  }
  function decorate(){
    document.querySelectorAll('.report-pane[data-report]').forEach(function(p){
      var id = p.dataset.report; if(!NAMES[id]) return;
      var bar = p.querySelector(':scope > .vf-bar'); if(!bar || bar.querySelector('[data-vf-contracts]')) return;
      var find = el('input', 'vf-find'); find.type = 'search'; find.placeholder = tr('Contract number…'); find.setAttribute('aria-label', tr('Find contract'));
      find.addEventListener('keydown', function(e){ if(e.key === 'Enter' && find.value.trim()){ openContract(find.value.trim()); find.value = ''; } });
      var b = el('button', 'theme-switch', tr('View contracts')); b.type = 'button'; b.setAttribute('data-vf-contracts', id);
      b.addEventListener('click', function(){ openFiltered(id); });
      bar.insertBefore(b, bar.firstChild); bar.insertBefore(find, bar.firstChild);
    });
  }
  function refreshLabels(){
    document.querySelectorAll('[data-vf-contracts]').forEach(function(b){ b.textContent = tr('View contracts'); });
    document.querySelectorAll('.vf-find').forEach(function(f){ f.placeholder = tr('Contract number…'); });
    Object.keys(NAMES).forEach(function(id){ try{ win(id).document.querySelectorAll('[data-vf-drill]').forEach(function(t){ t.title = tr('View contracts'); }); }catch(e){} });
  }
  document.addEventListener('click', function(e){ if(e.target && e.target.id === 'langBtn') setTimeout(refreshLabels, 60); });
  function tick(){ Object.keys(NAMES).forEach(wire); decorate(); }
  setInterval(tick, 1000); setTimeout(tick, 300);
  window.MDDrill = {records: records, kpi: KPI, openKpi: openKpi, openContract: openContract, openFiltered: openFiltered, close: closeDrawer, measure: measure, tileNumber: tileNumber, wire: wire, decorate: decorate, groupRows: groupRows};
})();
