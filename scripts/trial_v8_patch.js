
// At-a-glance strip: one sentence built from the page's own KPI tiles (no new data), plus the top slice of the first donut.
window.__v8Headline = function(doc){
  try{
    if(!doc || !doc.body) return;
    var tiles = Array.prototype.slice.call(doc.querySelectorAll('.kpis .kpi, .kpis-split .kpi')).slice(0, 3);
    if(!tiles.length) return;
    var parts = tiles.map(function(t){
      var l = (t.querySelector('.label') || {}).textContent || '', v = (t.querySelector('.value') || {}).textContent || '';
      var ar = doc.documentElement.lang === 'ar' || doc.documentElement.getAttribute('dir') === 'rtl', lab = l.trim();
      if(ar){ try{ var rt = doc.defaultView && doc.defaultView.reportText; if(typeof rt === 'function') lab = rt(lab); }catch(e){} return '<b>' + v.trim() + '</b> ' + lab; }
      return '<b>' + v.trim() + '</b> ' + lab.toLowerCase();
    });
    var top = '';
    var leg = doc.querySelector('#chartType, #chartFee, #chartFeeType');
    if(leg){
      var row = leg.querySelector('text'); // first legend label is the largest slice
      var texts = Array.prototype.slice.call(leg.querySelectorAll('text')).map(function(x){ return x.textContent; });
      var m = texts.filter(function(x){ return /\(\d+%\)|\(&lt;1%\)|\(<1%\)/.test(x); })[0];
      var name = texts.filter(function(x){ return x && !/total|%|requests|\d/.test(x); })[0];
      if(m && name) top = ' &nbsp;·&nbsp; ' + (doc.documentElement.lang === 'ar' ? 'أكبر مجموعة' : 'largest group') + ': <b>' + name + '</b> ' + m.replace(/^.*(\(.*\))$/, '$1');
    }
    var html = '<span class="v8-dot"></span><span>' + parts.join(' &nbsp;·&nbsp; ') + top + '</span>';
    var el = doc.getElementById('v8-headline');
    if(!el){
      el = doc.createElement('div'); el.id = 'v8-headline'; el.className = 'v8-headline';
      var anchor = doc.querySelector('.toolbar');
      if(anchor && anchor.parentNode) anchor.parentNode.insertBefore(el, anchor.nextSibling); else doc.body.insertBefore(el, doc.body.firstChild);
    }
    if(el.__v9h !== html){ el.__v9h = html; el.innerHTML = html; }
  }catch(e){ if(window.console) console.warn('v9 headline failed', e); }
};

// TRIAL v8 (shell side): patches a report page's HTML text before it is assigned to the iframe's srcdoc.
// Embedded report data is never touched - only code/CSS text around it.
window.__v8PatchReport = function(html, reportId){
  try{
    // 0. plain-language copy (EN + AR together, keyed by data-i18n key)
    html = html.split('>Total: ${totals[u]}</text>').join(">${(typeof __v9L === 'function' ? __v9L : function(a){ return a; })('Total', '\u0627\u0644\u0625\u062c\u0645\u0627\u0644\u064a')}: ${totals[u]}</text>");
    if(reportId === 'count-report'){
      // Cheque Count counts installments (Rent Installment lines), never "records"
      var __subs = [
        ["dailyCounts[iso] = (dailyCounts[iso]||0) + 1;", "if(isInstallLine) dailyCounts[iso] = (dailyCounts[iso]||0) + 1;"],
        ["const avgLinesPerActiveDay = activeDays ? totalLines / activeDays : 0;", "const avgLinesPerActiveDay = activeDays ? installmentsTotal / activeDays : 0;"],
        ["activityModeCC === 'amount' ? 'AED' : 'records',", "activityModeCC === 'amount' ? 'AED' : 'installments',"],
        ["formatAedSymbol(data.total_lines ? data.total_amount / data.total_lines : 0)", "formatAedSymbol((function(){ var n = 0, a = 0; (data.records || []).forEach(function(r){ if(r.isInstallment){ n++; a += r.amount || 0; } }); return n ? a / n : 0; })())"],
        ["payMethodCounts[payMethod] = (payMethodCounts[payMethod]||0) + 1;", "if(isInstallLine) payMethodCounts[payMethod] = (payMethodCounts[payMethod]||0) + 1;"],
        ["if(bank){ bankCounts[bank] = (bankCounts[bank]||0) + 1;", "if(bank){ if(isInstallLine) bankCounts[bank] = (bankCounts[bank]||0) + 1;"],
        ["pluralize(Math.round(v),'transaction','transactions')", "pluralize(Math.round(v),'installment','installments')"],
        ["pluralize(v,'transaction','transactions')", "pluralize(v,'installment','installments')"],
        ["leaseType, isInstallment: isInstallLine,", "leaseType, ownership, unitType, isInstallment: isInstallLine,"],
        ["pluralize(data.total_lines,'record','records')", "pluralize(data.total_lines,'payment','payments')"],
        ["unitWordCC(totalCount,'record','records','cc.recordUnit')", "(/rent installment/i.test(g.label) ? (currentLangCC === 'ar' ? '\u0642\u0633\u0637' : pluralize(totalCount,'installment','installments')) : unitWordCC(totalCount,'payment','payments','cc.recordUnit'))"],
        ["'record','records','cc.recordUnit'", "'payment','payments','cc.recordUnit'"],
        ["Explore Records", "Explore Payments"],
        ["by payment record", "by payment"],
        ["Record level", "Payment level"],
        ["Record Level", "Payment Level"],
        ["record level", "payment level"],
        ["RECORD LEVEL", "PAYMENT LEVEL"]
      ];
      __subs.forEach(function(x){ if(html.indexOf(x[0]) === -1){ (window.__v9PatchMisses = window.__v9PatchMisses || []).push(reportId + ': ' + x[0].slice(0, 60)); } html = html.split(x[0]).join(x[1]); });
    }
    var __C = window.__V9_COPY && window.__V9_COPY[reportId];
    if(__C){
      Object.keys(__C).forEach(function(k){
        var en = __C[k][0], ar = __C[k][1], ke = k.replace(/\./g, '\\.');
        html = html.replace(new RegExp('^(\\s*"' + ke + '":\\s*)"(?:[^"\\\\]|\\\\.)*"', 'gm'), function(m, pre){
          var cur = m.slice(pre.length);
          return pre + JSON.stringify(/[\u0600-\u06FF]/.test(cur) ? ar : en);
        });
        var eh = en.replace(/&/g, '&amp;').replace(/</g, '&lt;');
        html = html.replace(new RegExp('(data-i18n="' + ke + '"[^>]*>)[^<]*(<)', 'g'), function(m, a, b){ return a + eh + b; });
      });
    }
    if(reportId === 'count-report'){
      var _bt = "`AED, Pay. Method = Bank Transfer \u00b7 ${Math.round(bankTransferAmt/payTotal*100)}% of Bank Transfer+Cash`";
      var _cs = "`AED, Pay. Method = Cash \u00b7 ${Math.round(cashAmt/payTotal*100)}% of Bank Transfer+Cash`";
      var _bt2 = _bt.replace('\\u00b7', '\u00b7'), _cs2 = _cs.replace('\\u00b7', '\u00b7');
      [[_bt, _bt2, 'cc.payBankShare', 'bankTransferAmt'], [_cs, _cs2, 'cc.payCashShare', 'cashAmt']].forEach(function(x){
        var f = html.indexOf(x[0]) >= 0 ? x[0] : (html.indexOf(x[1]) >= 0 ? x[1] : null);
        if(!f) return;
        html = html.split(f).join("t('" + x[2] + "','').replace('{pct}', Math.round(" + x[3] + "/payTotal*100))");
      });
      // new dictionary keys (EN then AR) placed after the existing runtime payment keys
      var en = true;
      html = html.replace(/^(\s*)"cc\.runtime\.paymentCash":\s*"[^"]*",?/gm, function(m, ind){
        var isAr = /[\u0600-\u06FF]/.test(m); 
        return m.replace(/,?$/, ',') + '\n' + ind + (isAr
          ? '"cc.payBankShare": "د.إ، التحويلات البنكية · {pct}% من التحويلات + النقد",\n' + ind + '"cc.payCashShare": "د.إ، النقد · {pct}% من التحويلات + النقد",'
          : '"cc.payBankShare": "AED, bank transfers · {pct}% of transfers + cash",\n' + ind + '"cc.payCashShare": "AED, cash · {pct}% of transfers + cash",');
      });
    }
    // extra Arabic labels for chart/list names the pages left in English (the page's own entries win)
    html = html.replace('var REPORT_CHART_UI = {', 'var REPORT_CHART_UI = {"Contract Transfer": "نقل العقد", "Tenant Name Change": "تغيير اسم المستأجر", "NOC": "شهادة عدم ممانعة", "Non-Renewal": "عدم التجديد", "Early Termination": "إنهاء مبكر", "VAT Rent": "ضريبة الإيجار", "Rent Installment": "قسط الإيجار", "Security Deposit": "التأمين", "Agency Fee": "رسوم الوكالة", "Tariff": "التعرفة", "Innovation Fee": "رسوم الابتكار", "Harbor Fees": "رسوم Harbor", "Endowment": "وقف", "Minor": "قاصر", "Minors": "قاصرون", "Under Legal Action": "تحت إجراء قانوني", "Under Process": "قيد المعالجة", "Credit Card": "بطاقة ائتمان", "Bank Transfer": "تحويل بنكي", "Show all": "عرض الكل", ');
    // 1. clearer donut: keep the original as donutChartLegacy and add the enhancing wrapper in front of it
    var sig = /function donutChart\(([^)]*)\)\{/;
    if(sig.test(html)){
      html = html.replace(sig, function(m, args){ return window.__V8_DONUT_JS + '\nfunction donutChartLegacy(' + args + '){'; });
    }
    // 1a. tiles in one row keep their numbers on one line: labels share the tallest label's height
    html = html.replace('</body>', '<' + 'script>(function(){function eq(){try{var cs=document.querySelectorAll(".kpis,.kpis-split,.kpis-primary,.kpis-support,.v8-moved");cs.forEach(function(c){var ls=[].slice.call(c.querySelectorAll(":scope > .kpi > .label, :scope > .kpi-mini > .label"));ls.forEach(function(l){l.style.minHeight="";});var rows={};ls.forEach(function(l){var t=Math.round(l.closest(".kpi,.kpi-mini").offsetTop);(rows[t]=rows[t]||[]).push(l);});Object.keys(rows).forEach(function(k){var m=0;rows[k].forEach(function(l){m=Math.max(m,l.offsetHeight);});rows[k].forEach(function(l){l.style.minHeight=m+"px";});});});}catch(e){}}window.addEventListener("load",function(){eq();setTimeout(eq,800);setTimeout(eq,2500);});window.addEventListener("resize",eq);})();' + '<' + '/script></body>');
    // 1b. trend charts drawn like Lease Activity's Daily activity chart
    var lsig = /function lineChart\(([^)]*)\)\{/;
    if(lsig.test(html) && window.__V8_TREND_JS){
      html = html.replace(lsig, function(m, args){ return window.__V8_TREND_JS + '\nfunction lineChartLegacy(' + args + '){'; });
      html = html.replace('</head>', '<style>.v8-tmeta{display:flex; flex-wrap:wrap; justify-content:space-between; gap:4px 16px; margin:0 0 8px; font-size:13px;} .v8-tmeta b{font-weight:800;} .v8-tmeta-s{color:var(--sub); font-size:12px;} .v8-tleg{margin-top:6px; font-size:11.5px; color:var(--sub);}</style></head>');
    }
    // 1c. horizontal bar charts as ranked bars (thin bar, top one highlighted, value + share at the end)
    var hsig = /function hbarChart\(([^)]*)\)\{/;
    if(hsig.test(html) && window.__V9_BAR_JS){
      if(reportId === 'bounced-cheques'){
        // Bounced Cheques keeps its own bar function (bank list built separately): only the helper is added
        html = html.replace(hsig, function(m){ return window.__V9_BAR_JS.replace('function hbarChart(', 'function v9HbarUnused(') + '\n' + m; });
        var bcall = "document.getElementById('chartBank').innerHTML = hbarChart(bankChartDict, 1200, 280, \"#5ec6ff\", 150, 'bank', true);";
        if(html.indexOf(bcall) !== -1) html = html.replace(bcall, "document.getElementById('chartBank').innerHTML = v9BankRank(data, bankMode);");
      } else {
        html = html.replace(hsig, function(m, args){ return window.__V9_BAR_JS + '\nfunction hbarChartLegacy(' + args + '){'; });
      }
    }
    // 1d. ranking tables (properties, tenants) drawn as ranked bars
    if(window.__V9_RTL_JS){
      html = html.replace('</body>', '<' + 'script>' + String(window.__V9_RTL_JS).split('<' + '/script>').join('<\\/script>') + '<' + '/script></body>');
    }
    if(window.__V9_RANK_JS){
      html = html.replace('</body>', '<' + 'script>(function(){var o=window.__mdSetReportLanguage; if(typeof o!==\'function\'||o.__v9h) return; var w=function(){var r=o.apply(this,arguments); setTimeout(function(){try{ if(parent.__v8Headline) parent.__v8Headline(document); }catch(e){}}, 80); return r;}; w.__v9h=1; window.__mdSetReportLanguage=w;})();<' + '/script></body>');
      html = html.replace('</body>', '<' + 'script>window.__V9_RANK_ID=' + JSON.stringify(reportId) + ';' + String(window.__V9_RANK_JS).split('<' + '/script>').join('<\\/script>') + '<' + '/script></body>');
    }
    // 2. Request Count: a non-zero value share that rounds to 0% reads "<1%" (matches the table below)
    var tile = "<div class=\"value\">${pct}%</div><div class=\"note\">AED ${fmtAmt(amt)}";
    if(html.indexOf(tile) !== -1){
      html = html.replace(tile, "<div class=\"value\">${(pct===0&&amt>0)?'<1':pct}%</div><div class=\"note\">AED ${fmtAmt(amt)}");
    }
    // 2b. "rows" is a spreadsheet word, not a business one: say what the thing actually is (same strings in code, dictionary and static HTML)
    var swap = function(a, b){ html = html.split(a).join(b); };
    // Arabic twins of the English wording above (both languages are always kept in step)
    [['لكل صف نوع ومستخدم عقار معروف','لكل طلب نوع ومستخدم عقار معروف'],['لكل صف نوع رسوم وموظف معروفان','لكل دفعة نوع رسوم وموظف معروفان'],['لكل صف رقم عقد وتاريخ','لكل دفعة رقم عقد وتاريخ'],
     ['تم تجاوز أو توحيد بعض الصفوف','تم تجاوز أو توحيد بعض الإدخالات'],['بنود عقود الإيجار الجديدة','دفعات عقود الإيجار الجديدة'],['حجم البنود اليومي','حجم الدفعات اليومي'],
     ['حسب نوع الرسوم / البند','حسب نوع الدفعة'],['أعلى العقارات حسب عدد البنود','أعلى العقارات حسب عدد الدفعات']].forEach(function(x){ swap(x[0], x[1]); });
    swap('No rows match the current filters', 'No records match the current filters');
    swap('This sheet has no data rows at all', 'This sheet has no data at all');
    swap("pluralize(nonEmptyRows.length-1,'row','rows')", "pluralize(nonEmptyRows.length-1,'record','records')");
    swap("pluralize(nonEmptyRows.length-1, 'data row')", "pluralize(nonEmptyRows.length-1, 'data record')");
    swap('No dated report rows found', 'No dated records found');
    if(reportId === 'bounced-cheques'){
      swap('rows in Details', 'cheques recorded');
      swap('صفوف في ورقة التفاصيل', 'شيكات مسجلة');
      swap("'row','rows','bc.unitRow'", "'bounced cheque','bounced cheques','bc.unitBouncedCheque'");
      swap('the typical row on this sheet', 'the typical bounced cheque on this sheet');
    } else if(reportId === 'new-lease'){
      swap("'row','rows','nl.unitRow'", "'payment','payments','nl.unitRow'");
      swap('"nl.unitRow": "row"', '"nl.unitRow": "payment"');
      swap('"nl.unitRow": "صف"', '"nl.unitRow": "دفعة"');
      swap('Line-Item Count', 'Payment Count');
      swap('New Lease Line Items', 'New Lease Payments');
      swap('Daily Line-Item Volume', 'Daily Payments');
      swap('By Fee / Line Item Type', 'By Payment Type');
      swap('every row has a recognized Fee Type and Staff', 'every payment has a recognized Fee Type and Staff');
    } else if(reportId === 'request-count'){
      swap("'row','rc.unitRow'", "'request','rc.unitRow'");
      swap('"rc.unitRow": "row"', '"rc.unitRow": "request"');
      swap('"rc.unitRow": "صف"', '"rc.unitRow": "طلب"');
      swap('every row has a recognized Type and PM User', 'every request has a recognized Type and PM User');
      swap('The underlying request-level rows behind the figures above', 'The underlying requests behind the figures above');
    } else if(reportId === 'count-report'){
      swap('row(s) missing a Contract Number or Date', 'record(s) missing a Contract Number or Date');
      swap('Cheque Value Due This Month', 'Value Dated This Month (All Payment Types)');
      swap('Cheque Value Due This Month'.toUpperCase(), 'VALUE DATED THIS MONTH (ALL PAYMENT TYPES)');
      swap('every row has a Contract Number and Date', 'every record has a Contract Number and Date');
    }
    // 3. Cheque Count (per Bibin): cheque count = how many installments we give tenants -> lead with that
    if(reportId === 'count-report'){
      html = html.split('Rent &amp; Fee Cheques — Endowment &amp; AMAF Properties').join('Installments given to tenants — Endowment &amp; AMAF Properties');
      html = html.split('"cc.pageSub": "Rent & Fee Cheques — Endowment & AMAF Properties"').join('"cc.pageSub": "Installments given to tenants — Endowment & AMAF Properties"');
      // Reference sheet is the source of truth: always open, first on the page; everything else breaks it down underneath
      html = html.replace('</head>', '<style>#referenceAccordionBody{max-height:none !important; overflow:visible !important; margin-top:10px; padding-top:10px; border-top:1px solid var(--border);} #referenceAccordionHeader{cursor:default; pointer-events:none;} #referenceAccordionHeader .chev{display:none;}</style></head>');
      html = html.replace('id="referenceAccordionCard"', 'id="referenceAccordionCard" data-v8-open="1"');
      // page look: calmer section numbers, pill navigation, a readable reference table, no duplicate headline strip
      var CCSS = '#v8-headline{display:none !important;}'
        + '.section-title .sn{background:rgba(91,140,255,.16); color:var(--accent); border-radius:8px; padding:2px 9px; font-size:12px; font-weight:800; letter-spacing:.4px; margin-right:10px;}'
        + '.in-report-nav{display:flex; flex-wrap:wrap; gap:6px; padding:8px; border-radius:14px; position:sticky; top:0; z-index:6; background:var(--card); backdrop-filter:blur(6px);}'
        + '.in-report-nav a{padding:7px 14px; border-radius:999px; font-size:12.5px; font-weight:600; color:var(--sub); text-decoration:none; transition:background .15s,color .15s;}'
        + '.in-report-nav a:hover,.in-report-nav a:focus-visible{background:var(--card2); color:var(--text);}'
        + '.section-block{margin-top:26px;}'
        + '.v8-ref{table-layout:fixed; width:100%; border-collapse:separate; border-spacing:0; font-variant-numeric:tabular-nums;}'
        + '.v8-ref th,.v8-ref td{text-align:center !important; padding:11px 6px; border-bottom:1px solid var(--border); font-size:14px;}'
        + '.v8-ref th:first-child,.v8-ref td:first-child{text-align:left !important; width:168px; padding-left:16px; font-weight:700;}'
        + '.v8-ref small{display:block; font-size:10.5px; font-weight:600; color:var(--sub); letter-spacing:.2px; margin-top:2px;}'
        + '.v8-ref th{font-size:11px; font-weight:700; letter-spacing:.7px; text-transform:uppercase; color:var(--sub);}'
        + '.v8-ref th.v8-gn{border-bottom:3px solid var(--accent2,#2dd4bf); color:var(--text);}'
        + '.v8-ref th.v8-gr{border-bottom:3px solid var(--accent); color:var(--text);}'
        + '.v8-ref th.v8-plan{font-size:14px; color:var(--text); letter-spacing:0; text-transform:none;}'
        + '.v8-ref .v8-split{border-left:1px dashed var(--border);}'
        + '.v8-ref .zero{color:var(--sub); opacity:.55;}'
        + '.v8-ref td.num{font-weight:700;}'
        + '.v8-ref tr.v8-ref-inst td{background:rgba(91,140,255,.08);}'
        + '.v8-ref tr.v8-ref-inst td.num{font-weight:800; font-size:15px;}'
        + '.v8-ref .v8-ref-k{font-weight:800;}'
        + '.v8-ref .v8-tot{border-left:2px solid var(--border); background:rgba(91,140,255,.1); font-weight:800;}'
        + '.v8-ref th.v8-tot{color:var(--text);}'
        + '.kpis .kpi .value{font-variant-numeric:tabular-nums;}';
      html = html.replace('</head>', '<style>' + CCSS + '</style></head>');
      html = html.replace(/<span class="sn">(\d\d)<\/span>/g, function(m, n){ n = +n; return n >= 2 ? '<span class="sn">' + String(n + 1).padStart(2, '0') + '</span>' : m; });
      html = html.replace('<a href="#sec-snapshot"', '<a href="#sec-installments">Installments</a>\n  <a href="#sec-snapshot"');
      var secAnchor = '<!-- 02 SNAPSHOT -->';
      if(html.indexOf(secAnchor) !== -1){
        var sec = '<div class="section-block" id="sec-installments"><div class="section-title"><span class="sn">02</span><span>Installments given to tenants</span></div>'
          + '<div class="section-desc">Installments (post-dated cheques) given to tenants per contract, from the Installment count sheet.</div>'
          + '<div id="v8InstTabs" style="margin:6px 0 14px"></div><div class="kpis" id="v8InstKpis"></div><div class="card" id="v8InstBars"></div></div>\n';
        html = html.replace(secAnchor, sec + secAnchor);
        var CLOSE = '<' + '/script>';
        var js = '<script>' + String(window.__V8_CC_JS || '').split(CLOSE).join('<\\/script>') + CLOSE;
        var bi = html.lastIndexOf('</body>');
        if(bi !== -1) html = html.slice(0, bi) + js + html.slice(bi);
      }
    }
    // 4. the other three reports: main idea first, numbered breakdown steps, extra detail collapsed, repeated tiles removed
    var STEPS = {
      'bounced-cheques': { moves: [['Under Legal Action', 'main'], ['Cleared (Paid)', 'main'], ['Average Bounced Value', 'Exposure']], hide: ['Under Process', 'Largest Bounced Cheque'], more: 'Supporting' },
      'new-lease': { moves: [['Rent Installment Share', 'Amount Recorded'], ['Rent Installment Amount', 'Amount Recorded'], ['Security Deposit Amount', 'Amount Recorded']], hide: [], more: 'Supporting' },
      'request-count': { moves: [['Average Requests per Active Day', 'Activity'], ['Active Days', 'Activity'], ['Peak Request Day', 'Activity'], ['Peak Value Day', 'Activity'], ['Renewal Lease Amount', 'Composition'], ['New Lease Amount', 'Composition'], ['Other Request Types', 'Composition'], ['Top 5 Properties — Share of Requests', 'Concentration'], ['Top 5 Properties — Share of Value', 'Concentration']], hide: [], more: 'Supporting' }
    };
    if(STEPS[reportId] && window.__V8_STEPS_JS){
      var SSS = '.toolbar-row-actions .status{display:none !important;}'
        + '.v8-main-head::before{content:attr(data-v8-kicker); display:block; font-size:11px; font-weight:700; letter-spacing:.8px; text-transform:uppercase; color:var(--accent); margin-bottom:4px;}'
        + '.v8-steps{margin-top:8px;}'
        + '.v8-step{margin-top:28px;}'
        + '.v8-step-head{display:grid; grid-template-columns:auto 1fr; column-gap:12px; align-items:start;}'
        + '.v8-step-head .desc{grid-column:2;}'
        + '.v8-step-n{grid-row:1 / span 2; min-width:30px; height:30px; display:inline-flex; align-items:center; justify-content:center; border-radius:9px; background:rgba(91,140,255,.16); color:var(--accent); font-size:13px; font-weight:800;}'
        + '.v8-more{margin-top:30px; border:1px solid var(--border); border-radius:14px; background:var(--card); padding:4px 16px;}'
        + '.v8-more>summary{cursor:pointer; padding:12px 0; font-size:13px; font-weight:700; color:var(--sub);}'
        + '.v8-more[open]>summary{color:var(--text); border-bottom:1px solid var(--border); margin-bottom:6px;}'
        + '.v8-more-body .v8-step{margin-top:18px;}'
        + '.v8-moved{display:grid !important; grid-template-columns:repeat(auto-fill,minmax(220px,1fr)); gap:12px; margin:10px 0 14px; align-items:stretch;}'
        + '.kpis,.kpis-primary,.kpis-support,.kpis-split{align-items:stretch;}'
        + '.v8-moved .kpi,.v8-moved .kpi-mini{margin:0; min-height:0;}';
      html = html.replace('</head>', '<style>' + SSS + '</style></head>');
      var CLOSE2 = '<' + '/script>';
      var js2 = '<script>window.__V8_STEPS_CFG=' + JSON.stringify(STEPS[reportId]) + ';' + String(window.__V8_STEPS_JS).split(CLOSE2).join('<\\/script>') + CLOSE2;
      var bi2 = html.lastIndexOf('</body>');
      if(bi2 !== -1) html = html.slice(0, bi2) + js2 + html.slice(bi2);
    }
  }catch(e){ if(window.console) console.warn('v9 report patch failed for ' + reportId, e); (window.__v9PatchMisses = window.__v9PatchMisses || []).push(reportId + ': patch threw ' + (e && e.message)); }
  return html;
};
