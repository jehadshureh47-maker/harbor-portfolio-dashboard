/* Arabic count agreement (Arabic mode only). Many labels are built as "<number> <noun>" at run time,
   so the noun cannot be fixed in the translation text alone. This corrects the noun after the number in what is
   on screen: 1 = singular, 2 = dual, 3 to 10 = plural. 11 and above are left as written. Display text only;
   no data is read or changed. Safe to run repeatedly. */
(function(){
  if(window.__vfArNum) return; window.__vfArNum = true;
  // lemma -> [singular, dual, plural]
  var L = {
    'شيك':['شيك','شيكان','شيكات'], 'عقد':['عقد','عقدان','عقود'], 'طلب':['طلب','طلبان','طلبات'],
    'دفعة':['دفعة','دفعتان','دفعات'], 'قسط':['قسط','قسطان','أقساط'], 'سجل':['سجل','سجلان','سجلات'],
    'يوم':['يوم','يومان','أيام'], 'أسبوع':['أسبوع','أسبوعان','أسابيع'], 'شهر':['شهر','شهران','أشهر'],
    'تقرير':['تقرير','تقريران','تقارير'], 'محفظة':['محفظة','محفظتان','محافظ'], 'نوع':['نوع','نوعان','أنواع'],
    'مستخدم':['مستخدم','مستخدمان','مستخدمين'], 'صف':['صف','صفان','صفوف'], 'عنصر':['عنصر','عنصران','عناصر'],
    'ملف':['ملف','ملفان','ملفات'], 'اختلاف':['اختلاف','اختلافان','اختلافات'], 'تحذير':['تحذير','تحذيران','تحذيرات'],
    'ملاحظة':['ملاحظة','ملاحظتان','ملاحظات']
  };
  var form = {}, TAN = ['', 'اً', 'ًا'];
  Object.keys(L).forEach(function(k){
    var forms = L[k];
    forms.forEach(function(f){ form[f] = k; });
    TAN.forEach(function(t){ form[forms[0] + t] = k; });   // singular with tanween spellings
  });
  var alt = Object.keys(form).sort(function(a, b){ return b.length - a.length; }).join('|');
  var RX = new RegExp('(?<![\\d.,٫])(\\d+(?:,\\d{3})*)(\\s+)(' + alt + ')(?![\\u0600-\\u06FF])', 'g');
  function conv(s){
    return s.replace(RX, function(m, num, sp, w, off, str){
      if(/^[.٫]\d/.test(str.slice(off + num.length))) return m;       // decimal such as 1.5
      var n = parseInt(num.replace(/,/g, ''), 10), k = form[w];
      if(isNaN(n) || !k) return m;
      var f = L[k], out = null;
      if(n === 1) out = f[0];
      else if(n === 2) out = f[1];
      else if(n >= 3 && n <= 10) out = f[2];
      return out === null || out === w ? m : num + sp + out;
    });
  }
  var SKIP = {SCRIPT:1, STYLE:1, TEXTAREA:1, INPUT:1, SELECT:1, OPTION:1};
  function active(doc){
    var r = doc.documentElement; return !!r && (r.getAttribute('lang') === 'ar' || r.getAttribute('dir') === 'rtl');
  }
  function fixText(n){
    var s = n.nodeValue;
    if(!s || s.length < 4 || !/\d\s+[؀-ۿ]/.test(s)) return;
    var r = conv(s); if(r !== s) n.nodeValue = r;
  }
  function walk(root){
    if(!root) return;
    if(root.nodeType === 3){ fixText(root); return; }
    if(root.nodeType !== 1 || SKIP[root.tagName]) return;
    var doc = root.ownerDocument, tw = doc.createTreeWalker(root, 4, {acceptNode:function(n){
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
        else m.addedNodes.forEach(function(a){ pending.add(a); });
      });
      if(!timer) timer = setTimeout(flush, 60);
    }).observe(doc.body, {childList:true, subtree:true, characterData:true});
    if(active(doc)) walk(doc.body);
    // language switch changes dir/lang, not the text nodes: re-scan once when it flips
    new MutationObserver(function(){ if(active(doc)) walk(doc.body); })
      .observe(doc.documentElement, {attributes:true, attributeFilter:['lang', 'dir']});
  }
  function scan(){
    attach(document);
    document.querySelectorAll('iframe').forEach(function(f){ try{ attach(f.contentDocument); }catch(e){} });
  }
  scan(); setInterval(scan, 2000);
  window.__vfArNumConv = conv;
})();
