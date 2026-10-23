/* Arabic display corrections (Arabic mode only): count agreement, leftover English, terminology.
   Display text only; no data is read or changed. Safe to run repeatedly (every rule is idempotent). */
(function(){
  if(window.__vfArNum) return; window.__vfArNum = true;

  /* ---------- 1. count agreement ---------- */
  // lemma -> [singular, dual, plural]
  var L = {
    'شيك':['شيك','شيكان','شيكات'], 'عقد':['عقد','عقدان','عقود'], 'طلب':['طلب','طلبان','طلبات'],
    'دفعة':['دفعة','دفعتان','دفعات'], 'قسط':['قسط','قسطان','أقساط'], 'سجل':['سجل','سجلان','سجلات'],
    'يوم':['يوم','يومان','أيام'], 'أسبوع':['أسبوع','أسبوعان','أسابيع'], 'شهر':['شهر','شهران','أشهر'],
    'تقرير':['تقرير','تقريران','تقارير'], 'محفظة':['محفظة','محفظتان','محافظ'], 'نوع':['نوع','نوعان','أنواع'],
    'مستخدم':['مستخدم','مستخدمان','مستخدمين'], 'صف':['صف','صفان','صفوف'], 'عنصر':['عنصر','عنصران','عناصر'],
    'ملف':['ملف','ملفان','ملفات'], 'اختلاف':['اختلاف','اختلافان','اختلافات'], 'تحذير':['تحذير','تحذيران','تحذيرات'],
    'ملاحظة':['ملاحظة','ملاحظتان','ملاحظات'], 'فحص':['فحص','فحصان','فحوصات'], 'مستأجر':['مستأجر','مستأجران','مستأجرين'],
    'وحدة':['وحدة','وحدتان','وحدات'], 'مبنى':['مبنى','مبنيان','مباني'], 'اجتماع':['اجتماع','اجتماعان','اجتماعات']
  };
  var form = {}, TAN = ['', 'اً', 'ًا', 'ً'];
  Object.keys(L).forEach(function(k){
    var forms = L[k];
    forms.forEach(function(f){ form[f] = k; });
    TAN.forEach(function(t){ form[forms[0] + t] = k; });
  });
  var alt = Object.keys(form).sort(function(a, b){ return b.length - a.length; }).join('|');
  // what may follow a counted noun for 11+ (tanween is only right when nothing is in construct with it)
  var OK11 = '(?=$|[^\\u0600-\\u06FF\\s]|\\s+[^\\u0600-\\u06FF\\s]|\\s+(?:من|في|على|عبر|مقابل|لدى|مع|بعد|قبل|حتى|إلى|عن|منها|فقط)(?![\\u0600-\\u06FF])|\\s*و\\d)';
  var RX = new RegExp('(?<![\\d.,٫])(\\d+(?:,\\d{3})*)(\\s+)(' + alt + ')(?![\\u0600-\\u06FF])', 'g');
  function acc(sing){ return /ة$/.test(sing) ? sing + 'ً' : (/[ىي]$/.test(sing) ? sing : sing + 'اً'); }
  function agree(s){
    return s.replace(RX, function(m, num, sp, w, off, str){
      var after = str.slice(off + m.length);
      if(/^[.٫]\d/.test(str.slice(off + num.length))) return m;
      var n = parseInt(num.replace(/,/g, ''), 10), k = form[w];
      if(isNaN(n) || !k) return m;
      var f = L[k], out = null;
      if(n === 1) out = f[0];
      else if(n === 2) out = f[1];
      else if(n >= 3 && n <= 10) out = f[2];
      else if(n >= 11 && new RegExp('^' + OK11).test(after)) out = acc(f[0]);
      return out === null || out === w ? m : num + sp + out;
    });
  }

  /* ---------- 2. leftover English and terminology ---------- */
  var EXACT = {
    'is the data safe to report from?':'هل البيانات آمنة للاعتماد عليها في التقارير؟',
    'do the reports agree with each other?':'هل التقارير متسقة مع بعضها؟',
    'when did the work happen?':'متى تم العمل؟',
    'data quality':'جودة البيانات', 'all clear':'لا توجد ملاحظات', 'data ok':'البيانات سليمة',
    'less':'أقل', 'more':'أكثر', 'close':'إغلاق', 'show':'عرض', 'unassigned':'غير مسند',
    'commercial leases':'عقود الإيجار التجارية', 'residential occupancy':'الإشغال السكني',
    'turn off keyboard shortcuts on this device':'إيقاف اختصارات لوحة المفاتيح على هذا الجهاز',
    'next month':'الشهر القادم', '2–3 months':'من شهرين إلى 3 أشهر', '4–6 months':'من 4 إلى 6 أشهر', '6+ months':'أكثر من 6 أشهر',
    'credit card':'بطاقة ائتمان', 'other / unclassified':'أخرى / غير مصنّفة', 'settlement':'تسوية',
    'legal fees':'رسوم قانونية', 'government fees':'رسوم حكومية', 'security deposit':'التأمين',
    'rent installment':'قسط إيجار', 'innovation fee':'رسوم الابتكار', 'tariff':'التعرفة', 'vat rent':'ضريبة الإيجار',
    'endowment':'وقف', 'amaf & minors':'أماف والقُصّر', 'amaf & endowments':'أماف والأوقاف',
    'renewal lease':'تجديد عقد الإيجار', 'contract transfer':'نقل العقد', 'noc':'شهادة عدم ممانعة',
    'tenant name change':'تغيير اسم المستأجر', 'non-renewal':'عدم التجديد', 'early termination':'إنهاء مبكر',
    'under legal action':'قيد الإجراء القانوني', 'paid':'مسدّد', 'commercial':'تجاري', 'residential':'سكني',
    'not started':'لم يبدأ', 'on going':'قيد التنفيذ', 'ongoing':'قيد التنفيذ', 'removed':'محذوف', 'legal':'قانوني',
    'total (filtered)':'الإجمالي (بعد التصفية)', 'al naser club':'نادي النصر', 'no change':'دون تغيير',
    'installments per day':'أقساط يومياً', 'rent installments per day':'أقساط الإيجار يومياً',
    'no filters applied — showing all values.':'لا توجد مرشحات مطبّقة — تُعرض كل القيم.'
  };
  var PARTS = [
    [/Each report tab has its own "Load Excel File" button to preview a newer export\.?/g, 'لكل تقرير زر «تحميل ملف إكسل» لمعاينة تصدير أحدث.'],
    [/Only real data for one quarter loaded so far[^.]*\.?/g, 'تم تحميل بيانات فعلية لربع واحد فقط حتى الآن، ويلزم ربع ثانٍ لإظهار المقارنة ربعاً بربع.'],
    [/Only real data for one year loaded so far[^.]*\.?/g, 'تم تحميل بيانات فعلية لسنة واحدة فقط حتى الآن، وتلزم سنة ثانية لإظهار المقارنة سنة بسنة.'],
    [/(\d[\d,]*) new bounced cheques?/g, 'شيكات مرتجعة جديدة ($1)'],
    [/(\d[\d,]*) no longer present/g, 'لم تعد موجودة ($1)'],
    [/\brecorded value\b/g, 'القيمة المسجلة'], [/\bbounced value\b/g, 'قيمة المرتجع'], [/\bbounce rate now\b/g, 'معدل الارتجاع الآن'],
    [/(\d{2}\/\d{2} – \d{2}\/\d{2}) vs (\d{2}\/\d{2} – \d{2}\/\d{2})/g, '$1 مقارنة بـ $2'],
    [/^(\s*)vs (\d{2}\/\d{2} – \d{2}\/\d{2})/, '$1مقارنة بـ $2'],
    [/منذ (\d{2}\/\d{2} – \d{2}\/\d{2})/g, 'مقارنة بـ $1'],
    [/across (\d[\d,]*) active days? this period/g, 'عبر $1 يوماً من النشاط في هذه الفترة'],
    [/^(\s*)(\d[\d,]*) requests?(\s*)$/, '$1$2 طلب$3'],
    [/^(\s*)(\d[\d,]*) payments?(\s*)$/, '$1$2 دفعة$3'],
    [/^(\s*)(\d[\d,]*) installments?(\s*)$/, '$1$2 قسط$3'],
    [/(\d[\d,]*) \((\d+)%\) of contracts/g, '$1 ($2%) من العقود'],
    [/(\d[\d.,]*)% closed \(completed or not renewing\)/g, '$1% مغلقة (مكتملة أو لن تتجدد)'],
    [/(\d[\d,]*) leased of (\d[\d,]*)/g, '$1 مؤجر من $2'],
    [/(\d[\d.,]*)% collected so far/g, 'تم تحصيل $1% حتى الآن'],
    [/(\d[\d.,]*)% collected\b/g, '$1% محصّلة'],
    [/(\d[\d,]*) payments?, this month/g, '$1 دفعة هذا الشهر'],
    [/(\d+) of (\d+) reports loaded/g, '$1 من $2 تقارير محمّلة'],
    [/^(\s*)status of the (?:four|two|\d+) reports\.(\s*)$/i, '$1حالة التقارير.$2'],
    [/^(\s*)([^\s\d]+ \d{4}) reports(\s*)$/, '$1تقارير $2$3'],
    [/AED ([\d.,]+[MK]?)/g, '$1 د.إ'],
    // terminology and wording
    [/إجمالي المحصّل \(درهم\)/g, 'إجمالي القيمة المسجلة (درهم)'], [/صافي المحصّل \(درهم\)/g, 'صافي القيمة المسجلة (درهم)'],
    [/غير مؤكدة كمحصّلة/g, 'غير مؤكدة كمقاصة'],
    [/المصنفة/g, 'المصنّفة'], [/تحصيل الشيكات/g, 'مقاصة الشيكات'],
    [/الذروة (\d[\d,]*) (?:يوماً|يومًا|أيام|يوم) /g, 'الذروة $1 شيك يوم '],
    [/بعد 0 (?:يومًا|يوماً|أيام|يوم)/g, 'اليوم'], [/بعد 1 (?:يومًا|يوماً|أيام|يوم)/g, 'بعد يوم'],
    [/بعد 2 (?:يومًا|يوماً|يومان|أيام|يوم)/g, 'بعد يومين'],
    [/(\d+) جديداً و(\d+) تجديداً/g, '$1 جديدة و$2 تجديدات'],
    [/(\d[\d,]*\.\d{2})\. د\.إ/g, '$1 د.إ.'],
  ];
  function fix(s){
    var core = s.trim();
    if(core.length > 1 && core.length < 140){
      var ex = EXACT[core.toLowerCase()];
      if(ex) return s.replace(core, ex);
    }
    var r = s;
    for(var i = 0; i < PARTS.length; i++) r = r.replace(PARTS[i][0], PARTS[i][1]);
    return agree(r);
  }

  /* ---------- 3. apply to the live DOM ---------- */
  var SKIP = {SCRIPT:1, STYLE:1, TEXTAREA:1, INPUT:1, SELECT:1, OPTION:1};
  var ATTRS = ['title', 'aria-label', 'placeholder'];
  function active(doc){
    var r = doc.documentElement; return !!r && (r.getAttribute('lang') === 'ar' || r.getAttribute('dir') === 'rtl');
  }
  function fixText(n){
    var s = n.nodeValue;
    if(!s || s.length < 2) return;
    var r = fix(s); if(r !== s) n.nodeValue = r;
  }
  function fixAttrs(el){
    ATTRS.forEach(function(a){
      var v = el.getAttribute && el.getAttribute(a);
      if(v){ var r = fix(v); if(r !== v) el.setAttribute(a, r); }
    });
  }
  function walk(root){
    if(!root) return;
    if(root.nodeType === 3){ fixText(root); return; }
    if(root.nodeType !== 1 || SKIP[root.tagName]) return;
    var doc = root.ownerDocument;
    fixAttrs(root);
    root.querySelectorAll && root.querySelectorAll('[title],[aria-label],[placeholder]').forEach(fixAttrs);
    var tw = doc.createTreeWalker(root, 4, {acceptNode:function(n){
      var p = n.parentNode; return p && !SKIP[p.tagName] ? 1 : 2; }});
    var n; while((n = tw.nextNode())) fixText(n);
  }
  function attach(doc){
    if(!doc || !doc.body || doc.__vfArNum) return; doc.__vfArNum = true;
    var pending = new Set(), timer = null;
    function flush(){ timer = null; var it = Array.from(pending); pending.clear();
      if(!active(doc)) return; it.forEach(function(x){ try{ walk(x); }catch(e){} }); }
    new MutationObserver(function(ms){
      ms.forEach(function(m){
        if(m.type === 'characterData') pending.add(m.target);
        else if(m.type === 'attributes') pending.add(m.target);
        else m.addedNodes.forEach(function(a){ pending.add(a); });
      });
      if(!timer) timer = setTimeout(flush, 60);
    }).observe(doc.body, {childList:true, subtree:true, characterData:true, attributes:true, attributeFilter:ATTRS});
    if(active(doc)) walk(doc.body);
    new MutationObserver(function(){ if(active(doc)) walk(doc.body); })
      .observe(doc.documentElement, {attributes:true, attributeFilter:['lang', 'dir']});
  }
  function scan(){
    attach(document);
    document.querySelectorAll('iframe').forEach(function(f){ try{ attach(f.contentDocument); }catch(e){} });
  }
  scan(); setInterval(scan, 2000);
  window.__vfArNumConv = agree;
  window.__vfArFixConv = fix;
})();

/* Empty-state messages for panes that stay blank when only one month is saved (both languages). */
(function(){
  if(window.__vfEmpty) return; window.__vfEmpty = true;
  var MSG = {
    monthlyTrendWrap: ['Trend & Outlook needs at least two saved months for this portfolio. Only one month is loaded so far.',
      'يحتاج قسم الاتجاه والتوقعات إلى شهرين محفوظين على الأقل لهذه المحفظة. لم يُحمَّل سوى شهر واحد حتى الآن.'],
    changedRecordsWrap: ['Changes compares this month with the previous one. Only one month is loaded so far, so there is nothing to compare yet.',
      'يقارن قسم التغييرات هذا الشهر بالشهر السابق. لم يُحمَّل سوى شهر واحد حتى الآن، فلا توجد مقارنة بعد.']
  };
  function ar(){ var r = document.documentElement; return r.getAttribute('lang') === 'ar' || r.getAttribute('dir') === 'rtl'; }
  function tick(){
    Object.keys(MSG).forEach(function(id){
      var el = document.getElementById(id); if(!el) return;
      var mine = el.getAttribute('data-vf-empty') === '1';
      if(!mine && (el.children.length || el.textContent.trim())) return;
      var txt = MSG[id][ar() ? 1 : 0];
      if(mine && el.textContent === txt) return;
      el.setAttribute('data-vf-empty', '1'); el.textContent = txt;
      el.style.padding = '18px 20px'; el.style.opacity = '.8'; el.style.fontSize = '14px';
    });
  }
  setInterval(tick, 1500); tick();
})();
