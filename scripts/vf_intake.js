/* Week 5 (trial v21): "Check month folder" - pick a monthly folder, the four workbooks are matched by name and read in the page,
   then compared with the numbers each report is showing right now (rows, totals, splits, blank columns, month, stale summary).
   It is the in-page version of scripts/verify_awqaf_month.py. Nothing is loaded into the reports and nothing is changed or uploaded:
   the reports' own "different month" safeguard is left alone. Files are read in this browser only (File System Access API, Chrome and Edge). */
(function(){
  if(window.MDIntake) return;
  var IDS = ['bounced-cheques', 'new-lease', 'count-report', 'request-count'];
  var EN = {'count-report': 'Cheque Count', 'bounced-cheques': 'Bounced Cheques', 'new-lease': 'New Lease', 'request-count': 'Request Count'};
  var ARN = {'count-report': 'عدد الشيكات', 'bounced-cheques': 'الشيكات المرتجعة', 'new-lease': 'عقود الإيجار الجديدة', 'request-count': 'عدد الطلبات'};
  var AR = {
    'Check month folder': 'فحص مجلد الشهر', 'Reading the folder…': 'جارٍ قراءة المجلد…', 'Report': 'التقرير', 'File': 'الملف', 'Check': 'الفحص', 'Workbook': 'ملف Excel', 'Dashboard': 'لوحة المعلومات', 'Result': 'النتيجة',
    'Waiting': 'في الانتظار', 'Checking…': 'جارٍ الفحص…', 'Match': 'مطابق', 'Differs': 'مختلف', 'Close': 'إغلاق', 'Open Data Quality': 'فتح جودة البيانات',
    'Rows': 'الصفوف', 'Total amount (AED)': 'إجمالي المبلغ (درهم)', 'Residential': 'سكني', 'Commercial': 'تجاري', 'New lease contracts': 'عقود الإيجار الجديدة', 'New lease rent value (AED)': 'قيمة إيجار العقود الجديدة (درهم)',
    'Could not read this file: {m}': 'تعذّرت قراءة هذا الملف: {m}', 'No file found for this report': 'لم يتم العثور على ملف لهذا التقرير', 'Used the newest of {n} matching files': 'تم استخدام أحدث ملف من بين {n} ملفات مطابقة',
    'Not found in the workbook: {f}': 'غير موجود في ملف Excel: {f}', 'Filled in the workbook but blank in the dashboard: {f}': 'معبّأ في ملف Excel لكنه فارغ في لوحة المعلومات: {f}', 'Blank in both: {f}': 'فارغ في الاثنين: {f}',
    'The workbook dates are in {a}, but the month shown is {b}': 'تواريخ ملف Excel في {a}، لكن الشهر المعروض هو {b}', 'Some workbook dates are outside {b}: {a}': 'بعض تواريخ ملف Excel خارج {b}: {a}',
    'The workbook summary sheet shares no contracts with its details sheet (stale summary)': 'ورقة الملخص في ملف Excel لا تشترك في أي عقد مع ورقة التفاصيل (ملخص قديم)',
    'The dashboard summary shares no contracts with the dashboard rows (stale summary)': 'ملخص لوحة المعلومات لا يشترك في أي عقد مع صفوفها (ملخص قديم)',
    'File name says {a}, but the month shown is {b}': 'اسم الملف يشير إلى {a}، لكن الشهر المعروض هو {b}',
    'All four workbooks match the dashboard.': 'تتطابق ملفات Excel الأربعة مع لوحة المعلومات.', 'Checked, with {n} to look at.': 'تم الفحص، مع {n} تحتاج إلى مراجعة.', '{n} difference(s) found. Do not rely on this month until they are explained.': 'تم العثور على {n} اختلاف. لا تعتمد على هذا الشهر قبل تفسيرها.',
    'Ignored files: {f}': 'ملفات تم تجاهلها: {f}', 'No Excel files were found in that folder. Pick the folder that holds the four workbooks directly, not a folder above it.': 'لم يتم العثور على ملفات Excel في هذا المجلد. اختر المجلد الذي يحتوي مباشرة على الملفات الأربعة وليس مجلدًا أعلى منه.',
    'Folder checking works in Chrome or Edge on a computer.': 'فحص المجلد يعمل في Chrome أو Edge على الحاسوب.',
    'Compares the workbooks with the numbers the dashboard shows right now. Nothing is loaded or changed.': 'يقارن ملفات Excel بالأرقام التي تعرضها لوحة المعلومات الآن. لا يتم تحميل أو تغيير أي شيء.',
    'Files are read in this browser only and are not uploaded anywhere.': 'تُقرأ الملفات في هذا المتصفح فقط ولا تُرفع إلى أي مكان.',
    'The dashboard is not showing the built-in data for this month ({b} rows built in, {s} shown). A file loaded earlier in this browser is probably being restored.': 'لا تعرض لوحة المعلومات البيانات المدمجة لهذا الشهر ({b} صفًا مدمجًا، {s} معروضًا). من المرجّح أنه تتم استعادة ملف تم تحميله سابقًا في هذا المتصفح.',
    'Use built-in data': 'استخدام البيانات المدمجة',
    'Forget the Excel files loaded by hand in this browser and go back to the built-in data? Targets, thresholds and backups are not touched.': 'هل تريد نسيان ملفات Excel التي تم تحميلها يدويًا في هذا المتصفح والعودة إلى البيانات المدمجة؟ لن تتأثر الأهداف والحدود والنسخ الاحتياطية.',
    'Folder': 'المجلد', 'Not checked': 'لم يُفحص'
  };
  try{ if(typeof REMAINING_UI === 'object') Object.keys(AR).forEach(function(k){ if(!(k in REMAINING_UI)) REMAINING_UI[k] = AR[k]; }); }catch(e){}
  function tr(s){ try{ return typeof remainingText === 'function' ? remainingText(s) : s; }catch(e){ return s; } }
  function T(s, v){ var o = tr(s); if(v) Object.keys(v).forEach(function(k){ o = o.split('{' + k + '}').join(v[k]); }); return o; }
  function isAr(){ try{ return document.documentElement.lang === 'ar' || document.documentElement.dir === 'rtl'; }catch(e){ return false; } }
  function el(tag, cls, txt){ var e = document.createElement(tag); if(cls) e.className = cls; if(txt != null) e.textContent = txt; return e; }
  function win(id){ try{ return (typeof embeddedWindows !== 'undefined' && embeddedWindows[id]) || null; }catch(e){ return null; } }
  function curMonth(){ try{ return currentMonth || ''; }catch(e){ return ''; } }
  function pfLabel(){ try{ return (PORTFOLIO_LABELS && PORTFOLIO_LABELS[currentPortfolio]) || currentPortfolio || ''; }catch(e){ return ''; } }
  function num(n, d){ return n == null || isNaN(n) ? '—' : Number(n).toLocaleString('en-US', {minimumFractionDigits: d || 0, maximumFractionDigits: d || 0}); }

  /* ---- matching ---- */
  function classify(name){
    var n = String(name || '').toLowerCase().replace(/[_\-.()]+/g, ' ').replace(/\s+/g, ' ').trim();
    if(/bounc/.test(n)) return 'bounced-cheques';
    if(/request/.test(n)) return 'request-count';
    if(/lease/.test(n)) return 'new-lease';
    if(/(cheque|check)/.test(n) && /count/.test(n)) return 'count-report';
    return '';
  }
  var MON = {january: 1, jan: 1, february: 2, feb: 2, march: 3, mar: 3, april: 4, apr: 4, may: 5, june: 6, jun: 6, july: 7, jul: 7, august: 8, aug: 8, september: 9, sept: 9, sep: 9, october: 10, oct: 10, november: 11, nov: 11, december: 12, dec: 12};
  var MON_RE = /(?:^|[^a-z])(january|jan|february|feb|march|mar|april|apr|may|june|jun|july|jul|august|aug|september|sept|sep|october|oct|november|nov|december|dec)(?=[^a-z]|$)/;
  function nameMonth(name){
    var s = String(name || '').toLowerCase().replace(/\.[a-z0-9]+$/, ''), m = s.match(MON_RE); if(!m) return null;
    var y = s.match(/(?:^|[^0-9])(20\d\d)(?=[^0-9]|$)/);
    return {m: MON[m[1]], y: y ? +y[1] : null, label: m[1].charAt(0).toUpperCase() + m[1].slice(1)};
  }
  function humanKey(k){ return String(k).replace(/([a-z0-9])([A-Z])/g, '$1 $2').replace(/[_-]+/g, ' ').toLowerCase(); }

  /* ---- the comparison itself runs inside the report's own frame, using its own SheetJS and column detection ---- */
  function inFrame(buf, id, viewMonth){
    var out = {id: id};
    function nb(v){ return v !== null && v !== undefined && String(v).trim() !== ''; }
    function numv(v){ if(typeof v === 'number') return isFinite(v) ? v : 0; if(typeof v === 'string'){ var x = parseFloat(v.replace(/,/g, '')); return isFinite(x) ? x : 0; } return 0; }
    function r2(x){ return Math.round(x * 100) / 100; }
    function ck(c){ return String(c == null ? '' : c).trim().toUpperCase(); }
    var wb = XLSX.read(buf, {type: 'array', cellDates: true});
    var raw = XLSX.utils.sheet_to_json(wb.Sheets[pickBestSheet(wb)], {header: 1, raw: true, defval: null});
    var map = detectColumnMapping(raw[0] || []);
    var rr = raw.slice(1).filter(function(r){ return r.some(nb); });
    var sr = (typeof rawRowsState !== 'undefined' && rawRowsState ? rawRowsState : []).slice(1).filter(function(r){ return r.some(nb); });
    var sm = (typeof colMapState !== 'undefined' && colMapState) ? colMapState : {};
    out.sheetRows = rr.length; out.shownRows = sr.length;
    out.builtIn = (typeof INITIAL_ROWS !== 'undefined' && INITIAL_ROWS && INITIAL_ROWS.length) ? INITIAL_ROWS.slice(1).filter(function(r){ return r && r.some(nb); }).length : null;
    function colsum(rows, m){ var i = m.amount; if(i == null || i < 0) return null; return r2(rows.reduce(function(s, r){ return s + numv(r[i]); }, 0)); }
    out.rawTotal = colsum(rr, map); out.shownTotal = colsum(sr, sm);
    if(id === 'bounced-cheques'){
      var split = function(rows, m){ var i = m.unitType, o = {Residential: 0, Commercial: 0}; if(i == null || i < 0) return o; rows.forEach(function(r){ var v = String(r[i] == null ? '' : r[i]).trim(); if(v === 'Residential' || v === 'Commercial') o[v]++; }); return o; };
      out.rawSplit = split(rr, map); out.shownSplit = split(sr, sm);
    }
    if(id === 'new-lease' && typeof findSummarySheet === 'function'){
      var link = function(rows, m, sum){
        var ci = m.contract, set = {}, n = 0, rent = 0, keys = {};
        if(ci != null && ci >= 0) rows.forEach(function(r){ if(nb(r[ci])) set[ck(r[ci])] = 1; });
        var bc = (sum && sum.byContract) || {}; Object.keys(bc).forEach(function(k){ keys[ck(k)] = bc[k]; });
        var contracts = Object.keys(set), sumKeys = Object.keys(keys);
        contracts.forEach(function(c){ if(keys[c]){ n++; rent += numv(keys[c].rentAmount); } });
        return {n: n, rent: r2(rent), contracts: contracts.length, sumKeys: sumKeys.length, stale: sumKeys.length > 0 && contracts.length > 0 && n === 0};
      };
      var rs = null; try{ rs = findSummarySheet(wb); }catch(e){}
      var ss = (typeof INITIAL_SUMMARY !== 'undefined') ? INITIAL_SUMMARY : null;
      out.rawLink = link(rr, map, rs); out.shownLink = link(sr, sm, ss);
    }
    /* blank-column comparison on every field the dashboard maps */
    var keys2 = Object.keys(sm), notFound = [], droppedBlank = [], bothBlank = [];
    keys2.forEach(function(k){
      var si = sm[k]; if(si == null || si < 0) return;
      var ri = map[k], shownNb = sr.some(function(r){ return nb(r[si]); });
      if(ri == null || ri < 0){ notFound.push(k); return; }
      var rawNb = rr.some(function(r){ return nb(r[ri]); });
      if(rawNb && !shownNb) droppedBlank.push(k); else if(!rawNb && !shownNb) bothBlank.push(k);
    });
    out.notFound = notFound; out.droppedBlank = droppedBlank; out.bothBlank = bothBlank;
    /* which month do the workbook's own dates fall in */
    var months = {}, di = map.date, total = 0;
    if(di != null && di >= 0){ rr.forEach(function(r){ var v = r[di]; if(!nb(v)) return; var d; try{ d = toIsoDate(v); }catch(e){ d = null; } if(d){ var m = String(d).slice(0, 7); months[m] = (months[m] || 0) + 1; total++; } }); }
    out.months = months; out.dated = total;
    return JSON.stringify(out);
  }
  var FRAME_SRC = '(' + inFrame.toString() + ')';

  function runCheck(id, file){
    return file.arrayBuffer().then(function(buf){
      var w = win(id); if(!w || !w.XLSX) throw new Error('report not ready');
      var fn = w.eval(FRAME_SRC), u8 = new w.Uint8Array(buf);
      return JSON.parse(fn(u8, id, curMonth()));
    });
  }

  /* ---- turn a raw comparison into rows and flags ---- */
  function build(id, name, n, res, mo){
    var out = {rows: [], flags: []};
    function row(label, a, b, d){ var same = (a == null && b == null) || (a != null && b != null && Math.abs(a - b) <= 0.01); out.rows.push({label: label, a: a, b: b, d: d || 0, ok: same}); }
    if(n > 1) out.flags.push({lvl: 'info', t: T('Used the newest of {n} matching files', {n: n})});
    if(res.builtIn != null && res.builtIn > 0 && res.builtIn !== res.shownRows) out.flags.push({lvl: 'bad', cache: true, t: T('The dashboard is not showing the built-in data for this month ({b} rows built in, {s} shown). A file loaded earlier in this browser is probably being restored.', {b: res.builtIn, s: res.shownRows})});
    row('Rows', res.sheetRows, res.shownRows, 0);
    if(res.rawTotal != null || res.shownTotal != null) row('Total amount (AED)', res.rawTotal, res.shownTotal, 2);
    if(res.rawSplit){ row('Residential', res.rawSplit.Residential, res.shownSplit.Residential, 0); row('Commercial', res.rawSplit.Commercial, res.shownSplit.Commercial, 0); }
    if(res.rawLink){
      row('New lease contracts', res.rawLink.n, res.shownLink.n, 0); row('New lease rent value (AED)', res.rawLink.rent, res.shownLink.rent, 2);
      if(res.rawLink.stale) out.flags.push({lvl: 'bad', t: tr('The workbook summary sheet shares no contracts with its details sheet (stale summary)')});
      if(res.shownLink.stale) out.flags.push({lvl: 'bad', t: tr('The dashboard summary shares no contracts with the dashboard rows (stale summary)')});
    }
    if(res.droppedBlank.length) out.flags.push({lvl: 'bad', t: T('Filled in the workbook but blank in the dashboard: {f}', {f: res.droppedBlank.map(humanKey).join(', ')})});
    if(res.notFound.length) out.flags.push({lvl: 'warn', t: T('Not found in the workbook: {f}', {f: res.notFound.map(humanKey).join(', ')})});
    if(res.bothBlank.length) out.flags.push({lvl: 'info', t: T('Blank in both: {f}', {f: res.bothBlank.map(humanKey).join(', ')})});
    var ms = Object.keys(res.months || {}).sort();
    if(ms.length && mo){
      var inMo = res.months[mo] || 0;
      if(!inMo) out.flags.push({lvl: 'bad', t: T('The workbook dates are in {a}, but the month shown is {b}', {a: ms.join(', '), b: mo})});
      else if(inMo < res.dated) out.flags.push({lvl: 'warn', t: T('Some workbook dates are outside {b}: {a}', {a: ms.filter(function(m){ return m !== mo; }).join(', '), b: mo})});
    }
    var nm = nameMonth(name);
    if(nm && mo){ var y = +mo.slice(0, 4), m = +mo.slice(5, 7); if(nm.m !== m || (nm.y && nm.y !== y)) out.flags.push({lvl: 'warn', t: T('File name says {a}, but the month shown is {b}', {a: nm.label + (nm.y ? ' ' + nm.y : ''), b: mo})}); }
    return out;
  }
  function hasCacheFlag(state){
    return IDS.some(function(id){ var it = state.items[id]; return it && it.built && it.built.flags.some(function(f){ return f.cache; }); });
  }
  /* The only action in this feature that changes anything, and only when the person clicks it and confirms:
     forget the Excel files that were loaded by hand in this browser, so the reports go back to the built-in month data. */
  function clearSavedFiles(){
    var ok = true;
    try{ ok = window.confirm(tr('Forget the Excel files loaded by hand in this browser and go back to the built-in data? Targets, thresholds and backups are not touched.')); }catch(e){}
    if(!ok) return;
    try{
      var drop = [];
      for(var i = 0; i < localStorage.length; i++){ var k = localStorage.key(i); if(k && k.indexOf('md_upload_cache') === 0) drop.push(k); }
      drop.forEach(function(k){ localStorage.removeItem(k); });
    }catch(e){}
    try{ location.reload(); }catch(e){}
  }
  function counts(state){
    var bad = 0, warn = 0;
    IDS.forEach(function(id){
      var it = state.items[id]; if(!it) return;
      if(it.status === 'missing' || it.status === 'error' || (state.done && (it.status === 'wait' || it.status === 'checking'))) bad++;
      if(it.built){ it.built.rows.forEach(function(r){ if(!r.ok) bad++; }); it.built.flags.forEach(function(f){ if(f.lvl === 'bad') bad++; else if(f.lvl === 'warn') warn++; }); }
    });
    return {bad: bad, warn: warn};
  }

  /* ---- dialog ---- */
  var dlg, body, state = null, busy = false;
  function ensure(){
    if(dlg) return;
    dlg = document.createElement('dialog'); dlg.className = 'vf-drawer vf-intake'; dlg.setAttribute('aria-label', 'Check month folder');
    dlg.style.setProperty('width', 'min(980px,94vw)', 'important');
    body = el('div', 'vf-d-body'); dlg.appendChild(body); dlg.addEventListener('click', function(e){ if(e.target === dlg) close(); }); document.body.appendChild(dlg);
    var st = document.createElement('style'); st.textContent = '.vfIn{display:inline-block;unicode-bidi:isolate;direction:ltr;text-align:left;word-break:break-all}.vfIn::before{content:attr(data-n)}.vf-intake .vf-ck{margin:2px 0;font-size:.8rem}.vf-intake .vf-ck.bad{color:#ff8d8d}.vf-intake .vf-ck.warn{color:var(--amber,#e8a838)}.vf-intake .vf-ck.info{color:var(--sub,#93a0bd)}.vf-intake td{vertical-align:top}.vf-intake tr.vf-grp td{border-top:1px solid var(--border,#33405c)}'; document.head.appendChild(st);
  }
  function close(){ if(dlg){ try{ dlg.close(); }catch(e){ dlg.removeAttribute('open'); } } }
  function fileSpan(name){ var s = el('span', 'vfIn'); s.setAttribute('data-n', name); s.title = name; return s; }
  function render(){
    if(!dlg || !dlg.open || !state) return;
    body.innerHTML = '';
    var h = el('div', 'vf-d-head'), t = el('div', 'vf-d-titles'); t.appendChild(el('div', 'vf-d-title', tr('Check month folder')));
    var sub = el('div', 'vf-d-sub'); sub.appendChild(document.createTextNode(pfLabel() + ' · ' + curMonth() + ' · ' + tr('Folder') + ': ')); sub.appendChild(fileSpan(state.dir || '')); t.appendChild(sub); h.appendChild(t);
    var act = el('div', 'vf-d-actions');
    if(state.done && !state.empty && hasCacheFlag(state)){ var rb = el('button', 'vf-btn', tr('Use built-in data')); rb.type = 'button'; rb.addEventListener('click', clearSavedFiles); act.appendChild(rb); }
    if(state.done && !state.empty){ var dq = el('button', 'vf-btn', tr('Open Data Quality')); dq.type = 'button'; dq.addEventListener('click', function(){ close(); try{ selectTab('dataquality'); }catch(e){} }); act.appendChild(dq); }
    var x = el('button', 'vf-btn vf-x', '✕'); x.type = 'button'; x.setAttribute('aria-label', tr('Close')); x.addEventListener('click', close); act.appendChild(x); h.appendChild(act); body.appendChild(h);
    var wrap = el('div', 'vf-d-tablewrap');
    if(state.empty){ wrap.appendChild(el('div', 'vf-empty', tr('No Excel files were found in that folder. Pick the folder that holds the four workbooks directly, not a folder above it.'))); body.appendChild(wrap); return; }
    if(state.reading){ wrap.appendChild(el('div', 'vf-empty', tr('Reading the folder…'))); body.appendChild(wrap); return; }
    if(state.done){
      var v = counts(state), msg = v.bad ? T('{n} difference(s) found. Do not rely on this month until they are explained.', {n: v.bad}) : (v.warn ? T('Checked, with {n} to look at.', {n: v.warn}) : tr('All four workbooks match the dashboard.'));
      var sm = el('div', 'vf-risk-note', msg); sm.style.fontWeight = '700'; sm.style.color = v.bad ? '#ff8d8d' : (v.warn ? 'var(--amber,#e8a838)' : 'var(--ok,#3ecf8e)'); wrap.appendChild(sm);
    }
    wrap.appendChild(el('div', 'vf-risk-note', tr('Compares the workbooks with the numbers the dashboard shows right now. Nothing is loaded or changed.')));
    var tb = el('table', 'vf-table'), th = el('thead'), hr = el('tr'); ['Report', 'Check', 'Workbook', 'Dashboard', 'Result'].forEach(function(c){ var e = el('th', null, tr(c)); e.style.cursor = 'default'; hr.appendChild(e); }); th.appendChild(hr); tb.appendChild(th);
    var tbody = el('tbody');
    IDS.forEach(function(id){
      var it = state.items[id], first = true, head = isAr() ? ARN[id] : EN[id];
      function lead(tr_){ var c = el('td'); c.appendChild(el('div', null, head)); c.appendChild(el('div', 'vf-sub')); if(it.name){ var f = fileSpan(it.name); f.style.fontSize = '.75rem'; f.style.color = 'var(--sub,#93a0bd)'; c.appendChild(f); } tr_.appendChild(c); }
      function plain(cls){ var r = el('tr', first ? 'vf-grp' : ''); if(first){ lead(r); first = false; } else r.appendChild(el('td')); return r; }
      if(it.status === 'wait' || it.status === 'checking'){ var r0 = plain(); var c0 = el('td', null, tr(it.status === 'wait' ? 'Waiting' : 'Checking…')); c0.colSpan = 4; r0.appendChild(c0); tbody.appendChild(r0); return; }
      if(it.status === 'missing' || it.status === 'error'){ var r1 = plain(); var c1 = el('td'); c1.colSpan = 4; c1.appendChild(el('div', 'vf-ck bad', '✗ ' + (it.status === 'missing' ? tr('No file found for this report') : T('Could not read this file: {m}', {m: it.msg || '—'})))); r1.appendChild(c1); tbody.appendChild(r1); return; }
      var b = it.built;
      b.rows.forEach(function(r){
        var tr_ = plain(); tr_.appendChild(el('td', null, tr(r.label)));
        tr_.appendChild(el('td', 'num', num(r.a, r.d))); tr_.appendChild(el('td', 'num', num(r.b, r.d)));
        var rc = el('td'); rc.appendChild(el('span', 'vf-risk-pill ' + (r.ok ? 'vf-st-ok' : 'vf-st-off'), r.ok ? '✓ ' + tr('Match') : '✗ ' + tr('Differs'))); tr_.appendChild(rc); tbody.appendChild(tr_);
      });
      if(b.flags.length){
        var fr = plain(); var fc = el('td'); fc.colSpan = 4;
        b.flags.forEach(function(f){ fc.appendChild(el('div', 'vf-ck ' + f.lvl, (f.lvl === 'bad' ? '✗ ' : (f.lvl === 'warn' ? '! ' : 'i ')) + f.t)); });
        fr.appendChild(fc); tbody.appendChild(fr);
      }
    });
    tb.appendChild(tbody); wrap.appendChild(tb);
    if(state.ignored && state.ignored.length) wrap.appendChild(el('div', 'vf-risk-note', T('Ignored files: {f}', {f: state.ignored.slice(0, 8).join(', ') + (state.ignored.length > 8 ? ' …' : '')})));
    wrap.appendChild(el('div', 'vf-risk-note', tr('Files are read in this browser only and are not uploaded anywhere.')));
    body.appendChild(wrap);
  }
  function openDlg(){ ensure(); if(!dlg.open){ try{ dlg.showModal(); }catch(e){ dlg.setAttribute('open', ''); } } render(); }

  /* ---- main flow ---- */
  function chooseFiles(files){
    var by = {}, ignored = [];
    files.forEach(function(f){ var id = classify(f.name); if(!id){ ignored.push(f.name); return; } (by[id] = by[id] || []).push(f); });
    var pick = {};
    Object.keys(by).forEach(function(id){ var a = by[id].slice().sort(function(p, q){ return (q.lastModified || 0) - (p.lastModified || 0); }); pick[id] = {file: a[0], n: a.length}; a.slice(1).forEach(function(f){ ignored.push(f.name); }); });
    return {pick: pick, ignored: ignored};
  }
  async function collect(dir){
    var files = [];
    for await (var ent of dir.values()){
      if(ent.kind !== 'file') continue;
      var nm = ent.name; if(/^~\$/.test(nm) || nm.charAt(0) === '.' || !/\.(xlsx|xlsm|xls)$/i.test(nm)) continue;
      try{ files.push(await ent.getFile()); }catch(e){}
    }
    return files;
  }
  function pause(ms){ return new Promise(function(r){ setTimeout(r, ms); }); }
  async function run(dirOverride){
    if(busy) return;
    var dir = dirOverride;
    if(!dir){
      if(typeof window.showDirectoryPicker !== 'function'){ try{ alert(tr('Folder checking works in Chrome or Edge on a computer.')); }catch(e){} return; }
      try{ dir = await window.showDirectoryPicker({id: 'harbor-month', mode: 'read'}); }catch(e){ return; }
    }
    busy = true;
    state = {dir: dir.name, reading: true, done: false, items: {}, ignored: [], empty: false};
    IDS.forEach(function(id){ state.items[id] = {status: 'wait'}; });
    openDlg();
    try{
      var files = await collect(dir), sel = chooseFiles(files);
      state.ignored = sel.ignored; state.reading = false;
      if(!Object.keys(sel.pick).length){ state.empty = true; state.done = true; render(); return; }
      var mo = curMonth();
      IDS.forEach(function(id){ var p = sel.pick[id]; state.items[id] = p ? {status: 'wait', name: p.file.name, n: p.n} : {status: 'missing'}; });
      render();
      for(var i = 0; i < IDS.length; i++){
        var id = IDS[i], p = sel.pick[id], it = state.items[id]; if(!p) continue;
        it.status = 'checking'; render(); await pause(40);
        try{ var res = await runCheck(id, p.file); it.built = build(id, p.file.name, p.n, res, mo); it.status = 'done'; }
        catch(e){ it.status = 'error'; it.msg = String(e && e.message || e).slice(0, 160); }
        render();
      }
      state.done = true; render();
    }catch(e){
      state.reading = false;
      IDS.forEach(function(id){ var it = state.items[id]; if(it && (it.status === 'wait' || it.status === 'checking')){ it.status = 'error'; it.msg = String(e && e.message || e).slice(0, 160); } });
      state.done = true; render();
    }finally{ busy = false; }
  }

  /* ---- button ---- */
  function decorate(){
    if(typeof window.showDirectoryPicker !== 'function') return;
    var bar = document.querySelector('.summary-bar'); if(!bar) return;
    var b = bar.querySelector('[data-vf-intake]');
    if(!b){
      b = el('button', 'theme-switch', tr('Check month folder')); b.type = 'button'; b.setAttribute('data-vf-intake', '1'); b.addEventListener('click', function(){ run(); });
      var spacer = bar.children[1]; bar.insertBefore(b, spacer || null);
    } else { var t = tr('Check month folder'); if(b.textContent !== t) b.textContent = t; }
  }
  setInterval(decorate, 1500); setTimeout(decorate, 700);

  window.MDIntake = {classify: classify, nameMonth: nameMonth, chooseFiles: chooseFiles, build: build, run: run, FRAME_SRC: FRAME_SRC};
})();
