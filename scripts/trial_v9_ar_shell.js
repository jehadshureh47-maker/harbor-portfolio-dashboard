// TRIAL v9 (shell): Arabic for the trial's own generated text (Overview, Executive Summary, Lease Activity, Compare, Data Quality, header controls).
// Runs only while the page language is Arabic: translates text nodes using exact phrases and sentence patterns, and restores the
// English text when the language is switched back. Report iframes are untouched (they translate themselves).
(function(){
  var MON = { January: 'يناير', February: 'فبراير', March: 'مارس', April: 'أبريل', May: 'مايو', June: 'يونيو', July: 'يوليو', August: 'أغسطس', September: 'سبتمبر', October: 'أكتوبر', November: 'نوفمبر', December: 'ديسمبر' };
  var MON3 = { Jan: 'يناير', Feb: 'فبراير', Mar: 'مارس', Apr: 'أبريل', May: 'مايو', Jun: 'يونيو', Jul: 'يوليو', Aug: 'أغسطس', Sep: 'سبتمبر', Oct: 'أكتوبر', Nov: 'نوفمبر', Dec: 'ديسمبر' };
  var EXACT = {
    'Dashboard': 'لوحة المعلومات', 'Dark': 'داكن', 'Light': 'فاتح', 'Updates': 'المستجدات', 'Open ›': 'فتح ›', 'Open': 'فتح',
    'Awqaf': 'الأوقاف', 'Dubai Court': 'محكمة دبي', 'Dubai Court (no data yet)': 'محكمة دبي (لا توجد بيانات بعد)', 'RTA': 'هيئة الطرق والمواصلات', 'VIP (no data yet)': 'VIP (لا توجد بيانات بعد)',
    'Police': 'الشرطة', 'Al Naser Club': 'نادي الناصر', 'National Bonds (no data yet)': 'السندات الوطنية (لا توجد بيانات بعد)', 'National Bonds': 'السندات الوطنية',
    'Installments': 'الأقساط', 'Contracts': 'العقود', 'Bounced cheques': 'الشيكات المرتجعة', 'Requests': 'الطلبات', 'Summary': 'الملخص', 'Trend & Outlook': 'الاتجاه والتوقعات', 'Changes': 'التغييرات',
    'Within target': 'ضمن الهدف', 'Over target': 'فوق الهدف', 'Daily activity': 'النشاط اليومي', 'Leasing & operations': 'التأجير والعمليات', 'LEASING': 'التأجير', 'OPERATIONS': 'العمليات',
    'Lease mix by contract': 'توزيع العقود حسب النوع', 'Bounced cheques by status': 'الشيكات المرتجعة حسب الحالة', 'Monthly Trend': 'الاتجاه الشهري',
    'Total recorded value': 'إجمالي القيمة المسجلة', 'Bounced / at risk': 'المرتجع / المعرّض للخطر', 'Net recorded value': 'صافي القيمة المسجلة', 'Bounce rate': 'معدل الارتجاع',
    'Renewal contracts': 'عقود التجديد', 'New-lease contracts': 'عقود الإيجار الجديدة', 'Forward View': 'نظرة للأمام', 'Items to review next period': 'بنود للمراجعة في الفترة القادمة',
    'Sources agree:': 'المصادر متفقة:', 'new-lease contracts in both Cheque Count and New Lease': 'العقود الجديدة نفسها في عدد الشيكات والإيجار الجديد',
    'Renewal vs new lease': 'التجديد مقابل الجديد', 'Two grains side by side — never added together': 'مستويان جنباً إلى جنب — لا يُجمعان أبداً', 'By contract': 'حسب العقد', 'By request': 'حسب الطلب',
    'Source comparison': 'مقارنة المصادر', 'Renewal contracts ': 'عقود التجديد', 'Cheque Count': 'عدد الشيكات', 'Request Count': 'عدد الطلبات', 'New Lease': 'الإيجار الجديد',
    'Same figures as above, side by side. For fee and line-item detail see the New Lease Detail tab.': 'نفس الأرقام أعلاه جنباً إلى جنب. لتفاصيل الرسوم والبنود راجع تفاصيل الإيجار الجديد.',
    'Three sources, three grains: contracts and requests are never added together.': 'ثلاثة مصادر وثلاثة مستويات: لا تُجمع العقود والطلبات معاً.',
    'contracts (leaseType)': 'عقود (نوع الإيجار)', 'distinct new-lease contracts': 'عقود جديدة مميزة', 'requests (renewal + new only)': 'طلبات (تجديد وجديد فقط)',
    'Cheque Count · contract-level': 'عدد الشيكات · على مستوى العقد', 'Cheque Count · leaseType': 'عدد الشيكات · نوع الإيجار', 'Request Count · request-level': 'عدد الطلبات · على مستوى الطلب',
    'Needs a look': 'يحتاج مراجعة', 'required data missing': 'بيانات مطلوبة مفقودة', 'skipped or normalised': 'تم تجاوزها أو توحيدها', 'worth knowing': 'للعلم', 'clean': 'سليم',
    'Nothing flagged in the currently loaded file.': 'لا شيء مُعلَّم في الملف المحمّل حالياً.',
    'Bounced Cheque Count': 'عدد الشيكات المرتجعة', 'Portfolio Highlight': 'أبرز ما في المحفظة', 'Load comparison': 'تحميل المقارنة',
    'Only one portfolio has been loaded this session. Choose a second portfolio to complete the comparison.': 'تم تحميل محفظة واحدة فقط في هذه الجلسة. اختر محفظة ثانية لإكمال المقارنة.',
    'Compare': 'مقارنة', 'Summary ': 'الملخص',
    'Changed Since Last Month — Bounced Cheques': 'التغيّر منذ الشهر الماضي — الشيكات المرتجعة',
    'NEW BOUNCED CHEQUES': 'شيكات مرتجعة جديدة', 'NO LONGER PRESENT': 'لم تعد موجودة', 'NET CHANGE IN BOUNCED VALUE': 'صافي التغيّر في القيمة المرتجعة',
    'New bounced cheques': 'شيكات مرتجعة جديدة', 'No longer present': 'لم تعد موجودة', 'Net change in bounced value': 'صافي التغيّر في القيمة المرتجعة',
    'Date': 'التاريخ', 'Contract': 'العقد', 'Tenant': 'المستأجر', 'Bank': 'البنك', 'Cheque #': 'رقم الشيك', 'Amount': 'المبلغ', 'Status': 'الحالة',
    'Lease contracts': 'عقود الإيجار', 'New leases': 'عقود جديدة', 'New-lease rent value': 'قيمة إيجار العقود الجديدة', 'Data status': 'حالة البيانات', 'Critical': 'حرج', 'Warnings': 'تحذيرات', 'Information': 'معلومات',
    "Uploading a file into this report only previews it here, in your own browser. It isn't shared with other viewers, sent anywhere, or saved outside this device.": 'رفع ملف في هذا التقرير يعرضه هنا فقط داخل متصفحك. لا يُشارك مع الآخرين ولا يُرسل ولا يُحفظ خارج هذا الجهاز.',
    'PAID': 'مدفوع', 'Paid ': 'مدفوع', 'WATCH': 'مراقبة', 'Watch': 'مراقبة',
    'Under Legal Action': 'تحت إجراء قانوني', 'Under Process': 'قيد المعالجة', 'Paid': 'مدفوع', 'Process': 'قيد المعالجة', 'Legal': 'قانوني',
    '2 to review': 'مراجعتان', '1 to review': 'مراجعة واحدة',
    'Privacy & data': 'الخصوصية والبيانات',
    'Overview': 'نظرة عامة', 'LEASE ACTIVITY': 'نشاط التأجير', 'BOUNCED CHEQUES': 'الشيكات المرتجعة', 'Lease Activity': 'نشاط التأجير', 'Contract Transfer': 'نقل العقد', 'Renewal Lease': 'تجديد عقد الإيجار', 'Tenant Name Change': 'تغيير اسم المستأجر', 'NOC': 'شهادة عدم ممانعة', 'Non-Renewal': 'عدم التجديد', 'Early Termination': 'إنهاء مبكر',
    'Sources agree: new-lease contracts in both Cheque Count and New Lease': 'المصادر متفقة: العقود الجديدة نفسها في عدد الشيكات والإيجار الجديد', 'Sources agree:': 'المصادر متفقة:', 'Source': 'المصدر', 'Total': 'الإجمالي', 'Renewal': 'تجديد', 'New': 'جديد', 'Renewal share': 'نسبة التجديد', 'Change': 'التغيّر',
    'Installments given': 'الأقساط المقدمة', 'By Bank': 'حسب البنك', 'Staff — PM User Workload': 'الموظفون — عبء مستخدمي PM', 'Staff — Agent Workload': 'الموظفون — عبء الوكلاء',
    'installments': 'قسط', 'contracts': 'عقد', 'cheques': 'شيك', 'by first date': 'حسب أول تاريخ', 'recorded value': 'القيمة المسجلة', 'new leases': 'عقود جديدة', 'requests': 'الطلبات', 'all statuses, incl. Paid': 'كل الحالات بما فيها المدفوع', 'new-lease value only': 'قيمة الإيجار الجديد فقط',
    'rent installments per day': 'أقساط الإيجار يومياً',
    'This month': 'هذا الشهر', 'Dated later': 'مؤرخة لاحقاً', 'Past': 'سابقة', 'Future': 'مستقبلية'
  };
  function aed(s){ return s.replace(/AED ([\d.,]+[MK]?)/g, '$1 د.إ'); }
  var RULES = [
    [/^Since (\d{2}\/\d{2} – \d{2}\/\d{2})$/, 'منذ $1'],
    [/^(recorded value|new leases|requests) ([▲▼]) (.+) vs last period$/, function(m){ return EXACT[m[1]] + ' ' + m[2] + ' ' + aed(m[3]) + ' مقارنة بالفترة السابقة'; }],
    [/^(.*?) · Recorded AED ([\d.,MK]+), of which AED ([\d.,MK]+) \(([\d.]+)%\) bounced — (under|over) the ([\d.]+)% target\. ([\d,]+) lease contracts \((\d+)% renewals\), (\d+) new leases worth AED ([\d.,MK]+)\.(?: (\d+) cross-checks? need a second look)?$/, function(m){ return m[1] + ' · القيمة المسجلة ' + m[2] + ' د.إ، منها ' + m[3] + ' د.إ (' + m[4] + '%) مرتجعة — ' + (m[5] === 'under' ? 'أقل من' : 'أعلى من') + ' هدف ' + m[6] + '%. ' + m[7] + ' عقد إيجار (' + m[8] + '% تجديد)، و' + m[9] + ' عقود جديدة بقيمة ' + m[10] + ' د.إ.' + (m[11] ? ' ' + m[11] + ' فحوصات متقاطعة تحتاج مراجعة.' : ''); }],
    [/^(\d+) new leases signed(.*)$/, '$1 عقد جديد موقّع$2'],
    [/^(.*?) · (\d+) of (\d+) reports loaded\. (\d+) critical · (\d+) warnings · (\d+) notes across the reports, plus (\d+) cross-checks to review \(see Overview\)\.$/, '$1 · $2 من $3 تقارير محمّلة. $4 حرج · $5 تحذيرات · $6 ملاحظات عبر التقارير، إضافة إلى $7 فحوصات متقاطعة للمراجعة (راجع النظرة العامة).'],
    [/^المقياس المتأثر: (.+)$/, function(m){ return 'المقياس المتأثر: ' + (EXACT[m[1]] || m[1]); }],
    [/^(\d{2}\/\d{2} – \d{2}\/\d{2}) · ([\d,]+) installments on ([\d,]+) contracts, AED ([\d.,MK]+) recorded; ([\d,]+) bounced \(([\d.]+)% of value, (under|over) the ([\d.]+)% target\)\. ([\d,]+) lease contracts \((\d+)% renewals\) and ([\d,]+) requests processed\.$/, function(m){ return m[1] + ' · ' + m[2] + ' قسط على ' + m[3] + ' عقد، قيمة مسجلة ' + m[4] + ' د.إ؛ ' + m[5] + ' شيك مرتجع (' + m[6] + '% من القيمة، ' + (m[7] === 'under' ? 'أقل من' : 'أعلى من') + ' هدف ' + m[8] + '%). ' + m[9] + ' عقد إيجار (' + m[10] + '% تجديد) و' + m[11] + ' طلب تمت معالجته.'; }],
    [/^([\d,]+) installments$/, '$1 قسط'], [/^([\d,]+) contracts$/, '$1 عقد'], [/^([\d,]+) requests$/, '$1 طلب'], [/^([\d,]+) cheques$/, '$1 شيك'],
    [/^([\d,]+) installments given on ([\d,]+) contracts \(sheet and Details differ by (\d+)\)\.$/, '$1 قسط مقدّم على $2 عقد (الورقة والتفاصيل تختلفان بمقدار $3).'],
    [/^([\d,]+) installments given on ([\d,]+) contracts\.$/, '$1 قسط مقدّم على $2 عقد.'],
    [/^bounce rate ([\d.]+)% against a ([\d.]+)% target · (\d+) cross-checks? to review\.$/, 'معدل الارتجاع $1% مقابل هدف $2% · $3 فحوصات تحتاج مراجعة.'],
    [/^AED ([\d.,MK]+) rent$/, '$1 د.إ إيجار'], [/^AED ([\d.,MK]+) · ([\d.]+)% of recorded value$/, '$1 د.إ · $2% من القيمة المسجلة'],
    [/^([\d.]+)% of recorded value$/, '$1% من القيمة المسجلة'], [/^target < ([\d.]+)%$/, 'الهدف < $1%'], [/^Target < ([\d.]+)%$/, 'الهدف < $1%'],
    [/^Legal (\d+)$/, 'قانوني $1'], [/^Process (\d+)$/, 'معالجة $1'], [/^Paid (\d+)$/, 'مدفوع $1'],
    [/^(\d+)% renewals · (\d+) new$/, '$1% تجديد · $2 جديد'], [/^Renewal (\d+)$/, 'تجديد $1'], [/^New (\d+)$/, 'جديد $1'], [/^Other (\d+)$/, 'أخرى $1'],
    [/^Renewal (\d+) \((\d+)%\)$/, 'تجديد $1 ($2%)'], [/^New (\d+) \((\d+)%\)$/, 'جديد $1 ($2%)'],
    [/^New-lease rent AED ([\d.,MK]+)$/, 'إيجار العقود الجديدة $1 د.إ'], [/^Fees collected AED ([\d.,MK]+)$/, 'الرسوم المحصّلة $1 د.إ'],
    [/^Largest other: (.+) \((\d+)\)$/, function(m){ return 'أكبر نوع آخر: ' + (EXACT[m[1]] || m[1]) + ' (' + m[2] + ')'; }],
    [/^(This month|Future|Past) AED ([\d.,MK]+)$/, function(m){ return EXACT[m[1]] + ' ' + m[2] + ' د.إ'; }],
    [/^Rent AED ([\d.,MK]+)$/, 'إيجار $1 د.إ'], [/^Other fees AED ([\d.,MK]+)$/, 'رسوم أخرى $1 د.إ'],
    [/^([\d,]+) installments · Cheque Count · rent installments per day$/, '$1 قسط · عدد الشيكات · أقساط الإيجار يومياً'],
    [/^([\d,]+) contracts · Cheque Count · by first date$/, '$1 عقد · عدد الشيكات · حسب أول تاريخ'],
    [/^Peak ([\d.,]+) · (\d{2}\/\d{2})\s*\|\s*Avg \/ active day ([\d.,]+)\s*\|\s*shaded = weekend$/, 'الذروة $1 · $2   |   المتوسط / يوم نشط $3   |   المظلل = نهاية الأسبوع'],
    [/^([\d,]+) (Paid|Under Legal Action|Under Process) \((\d+)%\)$/, function(m){ return m[1] + ' ' + EXACT[m[2]] + ' (' + m[3] + '%)'; }],
    [/^(\d+) (Paid|Under Legal Action|Under Process) \((\d+)%\)$/, function(m){ return m[1] + ' ' + EXACT[m[2]] + ' (' + m[3] + '%)'; }],
    [/^(\d+) cheques? · AED ([\d.,MK]+)$/, '$1 شيك · $2 د.إ'],
    [/^([\d,]+) \((\d+)%\) of contracts$/, '$1 ($2%) من العقود'],
    [/^Total fees AED ([\d.,]+)$/, 'إجمالي الرسوم $1 د.إ'],
    [/^(\d{2}\/\d{2}) – (\d{2}\/\d{2})$/, '$1 – $2'],
    [/^September 2026 reports · (.+)$/, 'تقارير سبتمبر 2026 · $1'],
    [/^(\w+) (\d{4}) reports · (.+)$/, function(m){ return 'تقارير ' + (MON[m[1]] || m[1]) + ' ' + m[2] + ' · ' + m[3]; }],
    [/^© (\d{4}) (.+?) · Internal portfolio reporting tool — runs entirely in your browser\. ?(.*)$/, function(m){ return '© ' + m[1] + ' ' + m[2] + ' · أداة داخلية لتقارير المحافظ — تعمل بالكامل داخل متصفحك. ' + (EXACT[m[3]] || m[3]); }],
    [/^(\d+) of (\d+) checks loaded$/, '$1 من $2 فحوصات محمّلة'], [/^(\d+) info$/, '$1 للعلم'], [/^(\d+) warnings?$/, '$1 تحذير'],
    [/^(\w+) (\d{4})$/, function(m){ return MON[m[1]] ? MON[m[1]] + ' ' + m[2] : m[0]; }],
    [/^(\w{3}) '(\d{2})$/, function(m){ return MON3[m[1]] ? MON3[m[1]] + " '" + m[2] : m[0]; }],
    [/^(\w{3}) '(\d{2}) vs (\w{3}) '(\d{2})$/, function(m){ return (MON3[m[1]] || m[1]) + " '" + m[2] + ' مقابل ' + (MON3[m[3]] || m[3]) + " '" + m[4]; }],
    [/^AED ([\d.,]+) in (\w{3}) '(\d{2}) (.*)$/, function(m){ return m[1] + ' د.إ في ' + (MON3[m[2]] || m[2]) + " '" + m[3] + ' ' + m[4].replace(/(\d+) months · hover a bar for detail/, '$1 أشهر · مرّر المؤشر على عمود للتفاصيل'); }],
    [/^(?:(\d+) )?months · hover a bar for detail$/, function(m){ return (m[1] ? m[1] + ' ' : '') + 'أشهر · مرّر المؤشر على عمود للتفاصيل'; }],
    [/^Comparing the real bounced-cheque list this month vs (.+?) — matched on the same identity .*$/, 'مقارنة قائمة الشيكات المرتجعة الفعلية لهذا الشهر مع $1، بالمطابقة على رقم العقد أو المستأجر/الشيك نفسه، وليس على المبالغ.'],
    [/^(\d{1,2}) (\w{3}) (\d{4})$/, function(m){ return MON3[m[2]] ? m[1] + ' ' + MON3[m[2]] + ' ' + m[3] : m[0]; }],
    [/^vs (\d{2}\/\d{2} – \d{2}\/\d{2})$/, 'مقارنة بـ $1'],
    [/^([\d.,KM]+) AED added$/, '$1 د.إ مضافة'], [/^([\d.,KM]+) AED cleared$/, '$1 د.إ تمت تسويتها'],
    [/^([^·]+) vs last period$/, function(m){ return aed(m[1]) + ' مقارنة بالفترة السابقة'; }],
    [/^(\d+) new leases signed — no equivalent metric for (.+)$/, function(m){ return m[1] + ' عقود جديدة — لا يوجد مقياس مماثل لـ ' + (EXACT[m[2]] || m[2]); }],
    [/^— no equivalent metric for (.+)$/, function(m){ return '— لا يوجد مقياس مماثل لـ ' + (EXACT[m[1]] || m[1]); }],
    [/^Cheque Count, this month — recorded ledger sum, not confirmed bank clearance$/, 'عدد الشيكات لهذا الشهر — قيمة مسجلة وليست مقاصة بنكية'],
    [/^bounced ÷ recorded value$/, 'المرتجع ÷ القيمة المسجلة'],
    [/^(NEEDS ATTENTION|Needs attention) · (\d+) of (\d+) reports loaded\. (\d+) critical · (\d+) warnings · (\d+) notes across the reports, plus (\d+) cross-checks to review \(see Overview\)\.$/, '$2 من $3 تقارير محمّلة. $4 حرج · $5 تحذيرات · $6 ملاحظات عبر التقارير، إضافة إلى $7 فحوصات متقاطعة للمراجعة (راجع النظرة العامة).'],
    [/^(\d+) of (\d+) reports loaded\. (\d+) critical · (\d+) warnings · (\d+) notes across the reports, plus (\d+) cross-checks to review \(see Overview\)\.$/, '$1 من $2 تقارير محمّلة. $3 حرج · $4 تحذيرات · $5 ملاحظات عبر التقارير، إضافة إلى $6 فحوصات متقاطعة للمراجعة (راجع النظرة العامة).']
  ];
  var store = typeof WeakMap !== 'undefined' ? new WeakMap() : null, tracked = [];
  function isAr(){ return document.documentElement.lang === 'ar'; }
  function norm(x){ return x.replace(/[ \s]+/g, ' ').trim(); }
  function trCore(t){
    if(EXACT.hasOwnProperty(t)) return EXACT[t];
    for(var i = 0; i < RULES.length; i++){
      var m = t.match(RULES[i][0]);
      if(m) return typeof RULES[i][1] === 'function' ? RULES[i][1](m) : t.replace(RULES[i][0], RULES[i][1]);
    }
    return null;
  }
  function mixedFix(t){
    var o = t;
    if(/AED [0-9]/.test(o)) o = aed(o);
    o = o.replace(/Al Naser Club/g, 'نادي الناصر').replace(/\bAwqaf\b/g, 'الأوقاف').replace(/\s+Report$/, ' في تقرير الإيجار الجديد');
    o = o.replace(/Request Count/g, 'عدد الطلبات').replace(/Cheque Count/g, 'عدد الشيكات').replace(/New Lease Detail/g, 'تفاصيل الإيجار الجديد').replace(/New Lease/g, 'الإيجار الجديد').replace(/Bounced Cheques/g, 'الشيكات المرتجعة');
    return o === t ? null : o;
  }
  function trText(t, strict){
    if(!t || !/[A-Za-z]{3}/.test(t)) return null;
    var out = trCore(t);
    if(out !== null || strict === 'el') return out;
    if(strict && /[\u0600-\u06FF]/.test(t)) return null;
    if(t.indexOf(' · ') > -1){
      var parts = t.split(' · '), any = false;
      var mapped = parts.map(function(p){ var r = trCore(p); if(r !== null){ any = true; return r; } return p; });
      if(any) return mapped.join(' · ');
    }
    if(/AED [0-9]/.test(t)) return aed(t);
    return null;
  }
  var INLINE = { B: 1, STRONG: 1, SPAN: 1, SMALL: 1, I: 1, EM: 1, A: 1, SUP: 1 };
  var SKIPT = { SCRIPT: 1, STYLE: 1, TEXTAREA: 1, IFRAME: 1, NOSCRIPT: 1, SVG: 1, svg: 1, SELECT: 0 };
  function inlineOnly(el){
    for(var c = el.firstChild; c; c = c.nextSibling){
      if(c.nodeType === 3) continue;
      if(c.nodeType !== 1 || !INLINE[c.nodeName] || !inlineOnly(c)) return false;
    }
    return true;
  }
  function joined(el){
    var r = '';
    for(var c = el.firstChild; c; c = c.nextSibling){
      if(c.nodeType === 3){ r += c.nodeValue; continue; }
      var d = ''; try{ d = getComputedStyle(c).display || ''; }catch(e){}
      var sep = d.indexOf('inline') === 0 ? '' : ' ';
      r += sep + joined(c) + sep;
    }
    return r;
  }
  function esc(x){ return x.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
  function apply(root){
    var els = root.querySelectorAll('*');
    for(var k = 0; k < els.length; k++){
      var el = els[k]; try{
      if(SKIPT[el.nodeName] || el.closest('[data-v9ar]') || !inlineOnly(el) || el.childNodes.length === 0) continue;
      var txt = norm(joined(el));
      var out = trText(txt, 'el');
      if(out === null || out === txt) continue;
      var bold = !!el.querySelector('b,strong');
      var rec = { html: el.innerHTML };
      var html = esc(out);
      if(bold) html = html.replace(/(\d[\d.,]*[MK%]?)/g, '<b>$1</b>');
      el.innerHTML = html; el.setAttribute('data-v9ar', '1'); rec.ar = el.innerHTML;
      store.set(el, rec); tracked.push(el);
      }catch(e){}
    }
    var w = document.createTreeWalker(root, 4, null, false), n, nodes = [];
    while((n = w.nextNode())) nodes.push(n);
    nodes.forEach(function(n){ try{
      var p = n.parentNode; if(!p || SKIPT[p.nodeName] || (p.closest && p.closest('[data-v9ar]'))) return;
      var rec = store.get(n), cur = n.nodeValue;
      if(rec && rec.ar === cur) return;
      var t = norm(cur), out = trText(t);
      if(out === null || out === t){ var mx = mixedFix(out === null ? t : out); if(mx !== null) out = mx; }
      if(out !== null && /AED [0-9]/.test(out)) out = aed(out);
      if(out !== null) out = out.replace(/Al Naser Club/g, 'نادي الناصر');
      if(out === null || out === t) return;
      var i = cur.indexOf(cur.trim()), res = cur.slice(0, i) + out + cur.slice(i + cur.trim().length);
      store.set(n, { node: true, en: cur, ar: res }); tracked.push(n); n.nodeValue = res;
    }catch(e){} });
  }
  function restore(){
    tracked.forEach(function(el){ var r = store.get(el); if(!r) return; if(r.node){ if(el.nodeValue === r.ar) el.nodeValue = r.en; return; } if(el.isConnected && el.innerHTML === r.ar){ el.innerHTML = r.html; } if(el.removeAttribute) el.removeAttribute('data-v9ar'); });
    tracked = [];
  }
  var busy = false, timer = null;
  function run(){
    if(busy || !store) return; busy = true;
    try{ if(isAr()){ tracked = tracked.filter(function(el){ if(!el.isConnected){ return false; } var r = store.get(el); if(!r) return false; if(r.node) return el.nodeValue === r.ar; if(el.innerHTML !== r.ar){ el.removeAttribute('data-v9ar'); return false; } return true; }); apply(document.body); } else if(tracked.length) restore(); } finally { busy = false; }
  }
  function schedule(){ clearTimeout(timer); timer = setTimeout(run, 60); }
  function start(){
    if(!document.body){ return setTimeout(start, 50); }
    new MutationObserver(function(){ if(!busy) schedule(); }).observe(document.body, { childList: true, subtree: true, characterData: true });
    new MutationObserver(schedule).observe(document.documentElement, { attributes: true, attributeFilter: ['lang', 'dir'] });
    schedule();
  }
  start();
})();
