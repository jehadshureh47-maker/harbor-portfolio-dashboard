/* Audit trail (trial v20): a visible log of each Excel file loaded into a report, kept in this browser, included in Backup, shown in Data Quality.
   Wraps handleFile inside each report iframe from outside; the embedded report code is not modified. */
(function(){
  if(window.MDAudit) return;
  var KEY = 'vfAuditLog_v1', WHO = 'vfAuditWho', CAP = 200;
  var NAMES = {'count-report': 'Cheque Count', 'bounced-cheques': 'Bounced Cheques', 'new-lease': 'New Lease', 'request-count': 'Request Count'};
  var NAMES_AR = {'count-report': 'عدد الشيكات', 'bounced-cheques': 'الشيكات المرتجعة', 'new-lease': 'عقود الإيجار الجديدة', 'request-count': 'عدد الطلبات'};
  var AR = {
    'Load history': 'سجل التحميل', 'Every Excel file loaded in this browser: what, when, by whom and how it read. Kept in this browser only and included in Backup.': 'كل ملف Excel تم تحميله في هذا المتصفح: ما هو ومتى ومن حمّله وكيف قُرئ. يُحفظ في هذا المتصفح فقط ويُضمَّن في النسخة الاحتياطية.',
    'No files loaded yet in this browser.': 'لم يتم تحميل أي ملف في هذا المتصفح بعد.', 'When': 'الوقت', 'Report': 'التقرير', 'File': 'الملف', 'Month': 'الشهر', 'Rows': 'الصفوف', 'Result': 'النتيجة', 'Loaded by': 'حُمّل بواسطة',
    'Read OK': 'قُرئ بنجاح', 'Not applied: same file already loaded': 'لم يُطبَّق: الملف نفسه محمّل مسبقًا', 'Could not read': 'تعذّرت القراءة', 'columns found': 'أعمدة موجودة', 'Your name (optional)': 'اسمك (اختياري)',
    'File period': 'فترة الملف', 'Differs from the month shown': 'تختلف عن الشهر المعروض', 'This browser could not save the load history; the list below is only kept until you close the page.': 'تعذّر على هذا المتصفح حفظ سجل التحميل؛ تبقى القائمة أدناه حتى إغلاق الصفحة فقط.', 'Clear history': 'مسح السجل', 'Clear the load history from this browser?': 'مسح سجل التحميل من هذا المتصفح؟', 'This browser': 'هذا المتصفح', 'Saved': 'تم الحفظ'
  };
  try{ if(typeof REMAINING_UI === 'object') Object.keys(AR).forEach(function(k){ if(!(k in REMAINING_UI)) REMAINING_UI[k] = AR[k]; }); }catch(e){}
  function tr(s){ try{ return typeof remainingText === 'function' ? remainingText(s) : s; }catch(e){ return s; } }
  function isAr(){ try{ return document.documentElement.lang === 'ar' || document.documentElement.dir === 'rtl'; }catch(e){ return false; } }
  function esc(s){ return String(s == null ? '' : s).replace(/[&<>"]/g, function(c){ return {'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'}[c]; }); }
  var mem = [], storeOk = true, corrupt = false;
  function read(){
    if(!storeOk) return mem.slice();
    try{ var raw = localStorage.getItem(KEY); corrupt = false; if(raw == null) return mem.slice(); var a = JSON.parse(raw); return Array.isArray(a) ? a : (corrupt = true, mem.slice()); }
    catch(e){ corrupt = true; return mem.slice(); }
  }
  function write(a){
    mem = a.slice(0, CAP);
    try{ localStorage.setItem(KEY, JSON.stringify(mem)); storeOk = true; return true; }catch(e){ storeOk = false; return false; }
  }
  function who(){ try{ return localStorage.getItem(WHO) || ''; }catch(e){ return ''; } }
  function add(entry){ var a = read(); a.unshift(entry); write(a); render(); }
  function monthNow(){ try{ return currentMonth || ''; }catch(e){ return ''; } }
  function pfNow(){ try{ return (PORTFOLIO_LABELS && PORTFOLIO_LABELS[currentPortfolio]) || currentPortfolio || ''; }catch(e){ return ''; } }
  function win(id){ try{ return (typeof embeddedWindows !== 'undefined' && embeddedWindows[id]) || null; }catch(e){ return null; } }

  function wbOf(w){ try{ return w.eval('(typeof workbookState!=="undefined"?workbookState:null)'); }catch(e){ return null; } }
  function wrap(id){
    var w = win(id); if(!w || w.__vfAuditWrapped || typeof w.handleFile !== 'function') return;
    w.__vfAuditWrapped = true;
    var orig = w.handleFile, origErr = w.showError, lastErr = '', seq = 0;
    if(typeof origErr === 'function'){ w.showError = function(m){ if(m) lastErr = String(m); return origErr.apply(this, arguments); }; }
    w.handleFile = function(file, opts){
      var fromCache = !!(opts && opts.fromCache);
      var prev = wbOf(w);
      lastErr = ''; var mySeq = ++seq;
      var r = orig.apply(this, arguments);
      if(fromCache || !file) return r;
      var t0 = Date.now(), done = false;
      var tick = setInterval(function(){
        if(done) return;
        if(mySeq !== seq){ done = true; clearInterval(tick); return; }
        var cur = wbOf(w);
        var timedOut = Date.now() - t0 > 10000;
        if(cur && cur !== prev){
          done = true; clearInterval(tick);
          var rows = 0, cols = 0, total = 0, sheet = '', period = '';
          try{ rows = (window.MDData && window.MDData.rows(id).length) || 0; }catch(e){}
          try{ var m = w.eval('(typeof colMapState!=="undefined"?colMapState:null)'); if(m){ var ks = Object.keys(m); total = ks.length; cols = ks.filter(function(k){ return m[k] != null && m[k] >= 0; }).length; } }catch(e){}
          try{ sheet = w.document.getElementById('sheetSelect').value; }catch(e){}
          try{ period = (w.document.getElementById('periodLabel').textContent || '').replace(/^\s*Period:\s*/i, '').trim(); }catch(e){}
          add({t: new Date().toISOString(), id: id, file: file.name, size: file.size || 0, month: monthNow(), pf: pfNow(), who: who(), rows: rows, cols: cols, total: total, sheet: sheet, period: period, res: 'ok'});
        }else if(lastErr && timedOut){
          done = true; clearInterval(tick);
          add({t: new Date().toISOString(), id: id, file: file.name, size: file.size || 0, month: monthNow(), pf: pfNow(), who: who(), res: 'err', msg: lastErr.replace(/^Could not read that file:\s*/, '').slice(0, 160)});
        }else if(timedOut){
          done = true; clearInterval(tick);
          add({t: new Date().toISOString(), id: id, file: file.name, size: file.size || 0, month: monthNow(), pf: pfNow(), who: who(), res: 'dup'});
        }
      }, 300);
      return r;
    };
  }
  function wrapAll(){ Object.keys(NAMES).forEach(wrap); }
  setInterval(wrapAll, 1200); setTimeout(wrapAll, 600);

  /* Anything coming from a backup file is untrusted: keep only known fields, coerce types, cap lengths */
  function clean(e){
    if(!e || typeof e !== 'object' || !e.t || !NAMES[e.id]) return null;
    var str = function(v, n){ return String(v == null ? '' : v).slice(0, n); };
    var out = {t: str(e.t, 40), id: e.id, file: str(e.file, 300), size: +e.size || 0, month: str(e.month, 7), pf: str(e.pf, 60), who: str(e.who, 40), res: (e.res === 'ok' || e.res === 'dup') ? e.res : 'err'};
    if(isNaN(Date.parse(out.t))) return null;
    if(out.res === 'ok'){ out.rows = +e.rows || 0; out.cols = +e.cols || 0; out.total = +e.total || 0; out.sheet = str(e.sheet, 80); out.period = str(e.period, 80); }
    if(out.res === 'err') out.msg = str(e.msg, 160);
    return out;
  }
  /* ---- Backup: carry the log in the backup file and merge it back on restore ---- */
  function wrapBackup(){
    if(typeof window.buildBackupPayload === 'function' && !window.buildBackupPayload.__vf){
      var ob = window.buildBackupPayload;
      window.buildBackupPayload = function(){ var p = ob.apply(this, arguments); try{ p.auditLog = read(); }catch(e){} return p; };
      window.buildBackupPayload.__vf = true;
    }
    if(typeof window.restoreFromBackupPayload === 'function' && !window.restoreFromBackupPayload.__vf){
      var orf = window.restoreFromBackupPayload;
      window.restoreFromBackupPayload = function(payload){
        var r = orf.apply(this, arguments);
        try{
          if(payload && Array.isArray(payload.auditLog)){
            var have = {}, cur = read();
            cur.forEach(function(e){ have[e.t + '|' + e.id + '|' + e.file] = 1; });
            payload.auditLog.forEach(function(raw){ var e = clean(raw); if(e && !have[e.t + '|' + e.id + '|' + e.file]){ have[e.t + '|' + e.id + '|' + e.file] = 1; cur.push(e); } });
            cur.sort(function(a, b){ return a.t < b.t ? 1 : -1; });
            write(cur); render();
          }
        }catch(e){}
        return r;
      };
      window.restoreFromBackupPayload.__vf = true;
    }
  }
  wrapBackup(); setTimeout(wrapBackup, 800);

  /* ---- Data Quality: the visible log ---- */
  function fmtDate(iso){ try{ return new Date(iso).toLocaleString(isAr() ? 'ar-AE' : 'en-GB', {day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'}); }catch(e){ return iso; } }
  function size(n){ return n > 1048576 ? (n / 1048576).toFixed(1) + ' MB' : Math.max(1, Math.round(n / 1024)) + ' KB'; }
  var AR_MONTHS = {'يناير':'Jan','فبراير':'Feb','مارس':'Mar','أبريل':'Apr','ابريل':'Apr','مايو':'May','يونيو':'Jun','يوليو':'Jul','أغسطس':'Aug','اغسطس':'Aug','سبتمبر':'Sep','أكتوبر':'Oct','اكتوبر':'Oct','نوفمبر':'Nov','ديسمبر':'Dec'};
  function enPeriod(p){ var s = String(p || '').replace(/^\s*(Period|الفترة)\s*[:：]\s*/i, ''); Object.keys(AR_MONTHS).forEach(function(k){ s = s.split(k).join(AR_MONTHS[k]); }); return s; }
  function periodMonth(p){ p = enPeriod(p); var m = String(p || '').match(/(\d{1,2}\s+[A-Za-z]{3,9}\s+\d{4})/); if(!m) return ''; var d = new Date(m[1] + ' UTC'); if(isNaN(d)) return ''; return d.getUTCFullYear() + '-' + String(d.getUTCMonth() + 1).padStart(2, '0'); }
  function ltr(t){ return '<span class="vfFn" dir="ltr" title="' + esc(t) + '" data-n="' + esc(t) + '"></span>'; }
  (function(){ var st = document.createElement('style'); st.textContent = '.vfFn{display:inline-block;unicode-bidi:isolate;direction:ltr;text-align:left}.vfFn::before{content:attr(data-n)}'; document.head.appendChild(st); })();
  function resCell(e){
    if(e.res === 'ok') return '<span style="color:var(--green,#34d399)">&#10003; ' + esc(tr('Read OK')) + '</span><div style="color:var(--sub);font-size:11.5px">' + (e.total ? esc((+e.cols || 0) + '/' + (+e.total || 0)) + ' ' + esc(tr('columns found')) : '') + (e.sheet ? ' · ' + esc(e.sheet) : '') + '</div>';
    if(e.res === 'dup') return '<span style="color:var(--sub)">' + esc(tr('Not applied: same file already loaded')) + '</span>';
    return '<span style="color:var(--red,#f87171)">&#10007; ' + esc(tr('Could not read')) + '</span><div style="color:var(--sub);font-size:11.5px">' + esc(e.msg || '') + '</div>';
  }
  function render(){
    var pane = document.getElementById('pane-dataquality'); if(!pane) return;
    var box = document.getElementById('vfAudit');
    if(!box){
      box = document.createElement('section'); box.id = 'vfAudit'; box.style.cssText = 'margin-top:22px';
      var legend = pane.querySelector('.dq-legend'); if(legend) pane.insertBefore(box, legend); else pane.appendChild(box);
    }
    var list = read(), ar = isAr();
    var head = '<div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:6px"><h3 style="margin:0;font-size:15px">' + esc(tr('Load history')) + '</h3><span style="flex:1"></span>' +
      '<input id="vfAuditWho" type="text" maxlength="40" placeholder="' + esc(tr('Your name (optional)')) + '" value="' + esc(who()) + '" style="background:var(--card2);border:1px solid var(--border);color:var(--text);border-radius:999px;padding:.4rem .9rem;font:inherit;font-size:13px;min-width:12rem">' +
      '<button type="button" id="vfAuditClear" class="theme-switch"' + (list.length ? '' : ' disabled') + '>' + esc(tr('Clear history')) + '</button></div>' +
      '<div style="color:var(--sub);font-size:12.5px;margin-bottom:10px">' + esc(tr('Every Excel file loaded in this browser: what, when, by whom and how it read. Kept in this browser only and included in Backup.')) + '</div>';
    var warn = (!storeOk || corrupt) ? '<div style="margin-bottom:8px;color:var(--amber,#fbbf24);font-size:12.5px">' + esc(tr('This browser could not save the load history; the list below is only kept until you close the page.')) + '</div>' : '';
    var body;
    if(!list.length) body = '<div style="padding:14px;border:1px solid var(--border);border-radius:12px;color:var(--sub)">' + esc(tr('No files loaded yet in this browser.')) + '</div>';
    else body = '<div style="overflow:auto;border:1px solid var(--border);border-radius:12px"><table style="width:100%;border-collapse:collapse;font-size:13px"><thead><tr style="text-align:start;color:var(--sub);font-size:11.5px;text-transform:uppercase;letter-spacing:.05em">' +
      ['When', 'Report', 'File', 'Month', 'Rows', 'Result', 'Loaded by'].map(function(h){ return '<th style="padding:8px 10px;text-align:start;font-weight:600">' + esc(tr(h)) + '</th>'; }).join('') + '</tr></thead><tbody>' +
      list.slice(0, 50).map(function(e){
        return '<tr style="border-top:1px solid var(--border);vertical-align:top"><td style="padding:8px 10px;white-space:nowrap">' + esc(fmtDate(e.t)) + '</td><td style="padding:8px 10px">' + esc(ar ? (NAMES_AR[e.id] || e.id) : (NAMES[e.id] || e.id)) + '<div style="color:var(--sub);font-size:11.5px">' + esc(e.pf || '') + '</div></td>' +
          '<td style="padding:8px 10px;word-break:break-all">' + ltr(e.file) + '<div style="color:var(--sub);font-size:11.5px">' + ltr(size(e.size || 0)) + '</div></td><td style="padding:8px 10px">' + ltr(e.month || '') + (e.period ? '<div style="font-size:11.5px;color:' + (periodMonth(e.period) && e.month && periodMonth(e.period) !== e.month ? 'var(--amber,#fbbf24)' : 'var(--sub)') + '">' + esc(tr('File period')) + ': ' + ltr(enPeriod(e.period)) + (periodMonth(e.period) && e.month && periodMonth(e.period) !== e.month ? '<br>' + esc(tr('Differs from the month shown')) : '') + '</div>' : '') + '</td>' +
          '<td style="padding:8px 10px">' + (e.res === 'ok' ? Number(e.rows || 0).toLocaleString('en-US') : '') + '</td><td style="padding:8px 10px">' + resCell(e) + '</td><td style="padding:8px 10px">' + esc(e.who || tr('This browser')) + '</td></tr>';
      }).join('') + '</tbody></table></div>';
    if(document.activeElement && document.activeElement.id === 'vfAuditWho') return;
    var sig = JSON.stringify([list.length, list[0] && list[0].t, ar, who(), storeOk, corrupt]);
    if(box.__sig === sig) return; box.__sig = sig;
    box.innerHTML = head + warn + body;
    var nm = box.querySelector('#vfAuditWho');
    if(nm){ var saveNm = function(){ try{ localStorage.setItem(WHO, nm.value.trim()); }catch(e){} }; nm.addEventListener('input', saveNm); nm.addEventListener('change', saveNm); }
    var cl = box.querySelector('#vfAuditClear');
    if(cl) cl.addEventListener('click', function(){ if(confirm(tr('Clear the load history from this browser?'))){ write([]); box.__sig = ''; render(); } });
  }

  /* ---- Backup dialog fixes ---- */
  /* 1) Leftover history from portfolios this dashboard no longer has (e.g. an old "meridian" key) made every backup unrestorable
        (the restore step rejects unknown portfolios). Only portfolios the dashboard knows are listed and backed up. */
  function wrapKeys(){
    if(typeof window.collectPortfolioHistoryKeys === 'function' && !window.collectPortfolioHistoryKeys.__vf){
      var ok = window.collectPortfolioHistoryKeys;
      window.collectPortfolioHistoryKeys = function(){ var ks = ok.apply(this, arguments) || []; try{ return ks.filter(function(k){ return !!PORTFOLIOS[k]; }); }catch(e){ return ks; } };
      window.collectPortfolioHistoryKeys.__vf = true;
    }
  }
  wrapKeys(); setTimeout(wrapKeys, 800);
  /* 2) Wording: singular month, and say the load history is part of the backup */
  var AR2 = {'The load history is also included.': 'يتضمن السجل أيضًا سجل التحميل.'};
  function patchBackupDialog(){
    var els = document.querySelectorAll('dialog[open] *, #bkModalOverlay *');
    for(var i = 0; i < els.length; i++){
      var el = els[i]; if(el.children.length) continue;
      var t = (el.textContent || '');
      if(t === '1 saved months'){ el.textContent = '1 saved month'; continue; }
      if(t.indexOf('saved monthly summaries and threshold settings only') > -1){
        el.textContent = t.replace('saved monthly summaries and threshold settings only', 'saved monthly summaries, threshold settings and the load history only'); continue;
      }
      if(isAr() && t.indexOf('الإعدادات') > -1 && t.length > 60 && t.indexOf('سجل التحميل') < 0 ){
        el.textContent = t + ' ' + tr('The load history is also included.');
      }
    }
  }
  try{ if(typeof REMAINING_UI === 'object') Object.keys(AR2).forEach(function(k){ if(!(k in REMAINING_UI)) REMAINING_UI[k] = AR2[k]; }); }catch(e){}
  setInterval(patchBackupDialog, 500);

  setInterval(render, 1500); render();
  window.MDAudit = {read: read, render: render, add: add};
})();
