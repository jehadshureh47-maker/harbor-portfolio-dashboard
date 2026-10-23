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
  var OK11 = '(?=$|[^\\u0600-\\u06FF\\s]|[،؛؟]|\\s+[^\\u0600-\\u06FF\\s]|\\s+(?:من|في|على|عبر|مقابل|لدى|مع|بعد|قبل|حتى|إلى|عن|منها|فقط|يوم|بتاريخ|تحتاج|هذه|هذا)(?![\\u0600-\\u06FF])|\\s*و\\d)';
  var ADJW = 'مسجلة|مسجل|مرتجعة|مرتجع|جديدة|جديد|مقدّم|موقّع';
  var RX = new RegExp('(?<![\\d.,٫])(\\d+(?:,\\d{3})*)(\\s+)(' + alt + ')(?![ء-يً-ْ])(?:(\\s+)(' + ADJW + ')(?![ء-يً-ْ]))?', 'g');
  var ADJ_ACC = {'مسجلة':'مسجلاً','مسجل':'مسجلاً','مرتجعة':'مرتجعاً','مرتجع':'مرتجعاً','جديد':'جديداً','جديدة':'جديداً','مقدّم':'مقدّماً','موقّع':'موقّعاً'};
  var ADJ_PL = {'مسجل':'مسجلة','مرتجع':'مرتجعة','جديد':'جديدة','موقّع':'موقّعة','مقدّم':'مقدّمة'};
  var MASC = {'شيك':1,'عقد':1,'قسط':1,'طلب':1,'يوم':1,'سجل':1,'تقرير':1,'ملف':1,'فحص':1,'مستخدم':1,'نوع':1};
  function acc(sing){ return /ة$/.test(sing) ? sing + 'ً' : (/[ىي]$/.test(sing) ? sing : sing + 'اً'); }
  function agree(s){
    return s.replace(RX, function(m, num, sp, w, asp, aw, off, str){
      if(/^[.٫]\d/.test(str.slice(off + num.length))) return m;
      var after = str.slice(off + num.length + sp.length + w.length);
      var n = parseInt(num.replace(/,/g, ''), 10), k = form[w];
      if(isNaN(n) || !k) return m;
      var f = L[k], out = null, adj = null, prev = off > 0 ? str.charAt(off - 1) : '';
      if(prev === '-' || prev === '−'){ out = f[0]; }
      else if(n === 1) out = f[0];
      else if(n === 2) out = f[1];
      else if(n >= 3 && n <= 10){ out = f[2]; if(MASC[k]) adj = ADJ_PL; }
      else if(n >= 11){
        if(aw || new RegExp('^' + OK11).test(after)){ out = acc(f[0]); if(MASC[k]) adj = ADJ_ACC; }
        else out = f[0];
      }
      if(out === null) return m;
      var res = num + sp + out;
      if(aw) res += asp + ((adj && adj[aw]) || aw);
      return res;
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
    'automatic checks between overlapping reports.':'فحوصات تلقائية بين التقارير المتداخلة.', 'activity by day across the four reports.':'النشاط اليومي عبر التقارير الأربعة.',
    'report tabs':'تبويبات التقارير', 'how to read this dashboard':'كيفية قراءة هذه اللوحة', 'switch to light mode':'التبديل إلى الوضع الفاتح', 'switch to dark mode':'التبديل إلى الوضع الداكن', 'toggle light/dark mode':'تبديل الوضع الفاتح/الداكن', "what's changed in this portfolio's reports":'ما الذي تغيّر في تقارير هذه المحفظة', 'updates for this portfolio':'مستجدات هذه المحفظة',
    'installments per day':'أقساط يومياً', 'rent installments per day':'أقساط الإيجار يومياً',
    'no filters applied — showing all values.':'لا توجد مرشحات مطبّقة — تُعرض كل القيم.'
  };
  var MONF = {January:'يناير',February:'فبراير',March:'مارس',April:'أبريل',May:'مايو',June:'يونيو',July:'يوليو',August:'أغسطس',September:'سبتمبر',October:'أكتوبر',November:'نوفمبر',December:'ديسمبر'};
  var MON3 = {Jan:'يناير',Feb:'فبراير',Mar:'مارس',Apr:'أبريل',May:'مايو',Jun:'يونيو',Jul:'يوليو',Aug:'أغسطس',Sep:'سبتمبر',Oct:'أكتوبر',Nov:'نوفمبر',Dec:'ديسمبر'};
  var FEES = [[/Bounced Cheque Fee/gi,'رسوم الشيك المرتجع'],[/Renewal Fees?/gi,'رسوم التجديد'],[/Agency Fee/gi,'رسوم الوكالة'],[/Ejari/gi,'إيجاري'],[/\bVAT\b/g,'ضريبة القيمة المضافة']];
  var DIR = function(w){ return /^under$/i.test(w) ? 'أقل من' : 'أعلى من'; };
  var SRC = [[/Bounced Cheque List/g,'قائمة الشيكات المرتجعة'],[/Cheque Clearance/g,'مقاصة الشيكات'],[/Harbor Collections in Detail/g,'تفاصيل التحصيل'],[/\bOccupancy\b/g,'الإشغال']];
  var PARTS = [
    // --- full sentences (run first) ---
    [/(\d{2}\/\d{2} – \d{2}\/\d{2}) · ([\d,]+) installments on ([\d,]+) contracts, ([\d.,]+[MK]?) د\.إ recorded; (\d+) bounced \(([\d.]+)% of value, (under|above|over) the ([\d.]+)% target\)\. ([\d,]+) lease contracts \((\d+)% renewals\) and ([\d,]+) requests processed\./g,
      function(m,a,b,c,d,e,f,g,h,i,j,k){ return a + ' · ' + b + ' قسط على ' + c + ' عقد، بقيمة مسجلة ' + d + ' د.إ؛ منها ' + e + ' شيك مرتجع (' + f + '% من القيمة، ' + DIR(g) + ' الهدف ' + h + '%). ' + i + ' عقد إيجار (' + j + '% تجديدات) و' + k + ' طلب تمت معالجتها.'; }],
    [/(\S+ \d{4}) · Recorded ([\d.,]+[MK]?) د\.إ, of which ([\d.,]+[MK]?) د\.إ \(([\d.]+)%\) bounced — (under|above|over) the ([\d.]+)% target\. ([\d,]+) lease contracts \((\d+)% renewals\), ([\d,]+) new leases worth ([\d.,]+[MK]?) د\.إ\. (\d+) cross-checks? need a second look/g,
      function(m,a,b,c,d,e,f,g,h,i,j,k){ return a + ' · القيمة المسجلة ' + b + ' د.إ، منها ' + c + ' د.إ (' + d + '%) مرتجعة — ' + DIR(e) + ' الهدف ' + f + '%. ' + g + ' عقد إيجار (' + h + '% تجديدات)، و' + i + ' عقد جديد بقيمة ' + j + ' د.إ. الفحوصات المتقاطعة التي تحتاج مراجعة: ' + k; }],
    [/(\d+) critical · (\d+) \S+ · (\d+) notes? across the reports, plus (\d+) cross-checks? to review \(see Overview\)\.?/g,
      '$1 حرجة · $2 تحذير · $3 ملاحظة في التقارير، إضافة إلى فحوصات متقاطعة للمراجعة: $4 (راجع النظرة العامة).'],
    [/Leasing at a glance, from (.+?) and (.+?)\. Each figure shows its source\. Fee detail is in (.+)/g, 'نظرة سريعة على التأجير من $1 و$2. يوضح كل رقم مصدره. تفاصيل الرسوم في $3'],
    [/Showing (.+?) · (.+?), from (?:the )?(.+?)\./g, function(m,a,b,c){ var r = c.replace(/,?\s+and\s+/, '، و').replace(/,\s*/g, '، '); SRC.forEach(function(x){ r = r.replace(x[0], x[1]); }); r = r.replace(/\s*sheets?$/, ''); return 'عرض ' + a + ' · ' + b + '، من ' + r + '.'; }],
    [/Harbor Fees\(([^)]*)\)/gi, function(m,a){ var r = a; FEES.forEach(function(x){ r = r.replace(x[0], x[1]); }); return 'رسوم هاربر (' + r + ')'; }],
    [/Daily trend, peak ([\d,]+) [a-z ]+ on (\S+)/g, 'الاتجاه اليومي، الذروة $1 بتاريخ $2'],
    [/This month[’']s own figures above are still real\.?/g, 'أرقام هذا الشهر أعلاه حقيقية.'],
    [/(\d[\d,]*) (?:أيام|يوماً|يوم) نشاط/g, '$1 يوم من النشاط'],
    [/(\d+) جديد \/ (\d+) تجديد/g, '$1 جديدة / $2 تجديدات'],
    [/الذروة (\d[\d,]*) (?:يوماً|يومًا|أيام|يوم) /g, 'الذروة $1 في يوم '],
    [/\b(January|February|March|April|May|June|July|August|September|October|November|December) (\d{4})\b/g, function(m,a,b){ return MONF[a] + ' ' + b; }],
    [/\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) '(\d{2})\b/g, function(m,a,b){ return MON3[a] + " '" + b; }],
    [/\bin (يناير|فبراير|مارس|أبريل|مايو|يونيو|يوليو|أغسطس|سبتمبر|أكتوبر|نوفمبر|ديسمبر) '/g, 'في $1 \''],
    [/([+−-]?[\d.]+) pts\b/g, '$1 نقطة مئوية'],
    [/\bTotal (?=القيمة)/g, 'إجمالي '], [/\bNet (?=القيمة)/g, 'صافي '],
    [/\bvs\b\.?/g, 'مقارنة بـ'],
    [/(\S+ \d{4}) reports ·/g, 'تقارير $1 ·'],
    [/\bUnder Legal Action(?=\s*:?\s*\d)/g, 'قيد الإجراء القانوني'], [/\bUnder Process(?=\s*:?\s*\d)/g, 'قيد المعالجة'], [/\bPaid(?=\s*:?\s*\d)/g, 'مسدّد'],
    [/\bRenewal(?=\s*:?\s*\d)/g, 'تجديد'], [/\bThis month(?=\s*:\s*\d)/g, 'هذا الشهر'],
    [/(\d[\d,]*) contracts?\b/g, '$1 عقد'],
    [/(\d[\d,]*) payments?\b/g, '$1 دفعة'], [/(\d[\d,]*) requests?\b/g, '$1 طلب'], [/(\d[\d,]*) installments?\b/g, '$1 قسط'],
    [/\bOther \/ Unclassified\b/g, 'أخرى / غير مصنّفة'], [/\bSettlement\b/g, 'تسوية'], [/\bLegal Fees\b/g, 'رسوم قانونية'], [/\bGovernment Fees\b/g, 'رسوم حكومية'],
    [/(?<![\w(])VAT\b(?!\w)/g, 'ضريبة القيمة المضافة'],
    [/(^|\s)(\d[\d.,]*[MK]?) د\.إ rent\b/g, '$1$2 د.إ إيجار'], [/New-lease rent /g, 'إيجار العقود الجديدة '], [/Fees collected /g, 'الرسوم المسجلة '],
    [/\bOther fees /g, 'رسوم أخرى '], [/\bTotal fees /g, 'إجمالي الرسوم '], [/\bRent (?=[\d])/g, 'الإيجار '],
    [/Details \(bundled snapshot\)/g, 'التفاصيل (نسخة مضمّنة)'], [/^\(none\)$/g, '(لا شيء)'],
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
  var SKIP = {SCRIPT:1, STYLE:1, TEXTAREA:1, INPUT:1, SELECT:1};
  var ATTRS = ['title', 'aria-label', 'placeholder'];
  function active(doc){
    var r = doc.documentElement; return !!r && (r.getAttribute('lang') === 'ar' || r.getAttribute('dir') === 'rtl');
  }
  function fixText(n){
    var s = n.nodeValue;
    if(!s || s.length < 2) return;
    var r = s;
    // a number held in its own inline element (<b>102</b>) followed by the noun in the next text node
    var pe = n.previousSibling;
    if(pe && pe.nodeType === 1 && /^[\d,]+$/.test(pe.textContent || '') && /^\s+\S/.test(s)){
      var pp = pe.previousSibling, ppv = pp && pp.nodeType === 3 ? pp.nodeValue : '';
      if(/الذروة\s*$/.test(ppv)) r = r.replace(/^(\s*)(?:يوماً|يومًا|أيام|يوم)(\s)/, '$1في يوم$2');
      var num = pe.textContent, c = fix(num + r);
      r = c.indexOf(num) === 0 ? c.slice(num.length) : r;
    } else {
      r = fix(s);
    }
    if(r !== s) n.nodeValue = r;
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
