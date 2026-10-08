// TRIAL v9 (runs INSIDE each report iframe): Arabic polish after the page's own render.
// - "AED 1,234" becomes "1,234 د.إ" (restored when the language goes back to English)
// - leftover English labels are translated through the page's own reportText()
(function(){
  var AED = 'د.إ';
  var store = typeof WeakMap !== 'undefined' ? new WeakMap() : null, tracked = [];
  function rtl(){ return document.documentElement.getAttribute('dir') === 'rtl' || document.documentElement.lang === 'ar'; }
  function T(s){ try{ return typeof reportText === 'function' ? reportText(s) : s; }catch(e){ return s; } }
  var EXACT = {
    'contract transfer': 'نقل العقد',
    'early termination': 'إنهاء مبكر',
    'new lease': 'عقد إيجار جديد',
    'renewal lease': 'تجديد عقد الإيجار',
    'tenant name change': 'تغيير اسم المستأجر',
    'credit card': 'بطاقة ائتمان',
    'rent installment': 'قسط الإيجار',
    'security deposit': 'مبلغ التأمين',
    'tariff': 'التعرفة',
    'innovation fee': 'رسوم الابتكار',
    'vat rent': 'ضريبة الإيجار',
    'endowment': 'وقف',
    'amaf & endowments': 'أماف والأوقاف',
    'amaf & minors': 'أماف والقاصرين',
    'amaf and minors-eib': 'أماف والقاصرين - EIB',
    'minor': 'قاصر',
    'portfolio': '\u0627\u0644\u0645\u062d\u0641\u0638\u0629',
    'share of total value (aed)': '\u062d\u0635\u0629 \u0627\u0644\u0642\u064a\u0645\u0629 \u0627\u0644\u0625\u062c\u0645\u0627\u0644\u064a\u0629 (\u062f.\u0625)',
    'share of requests (by count)': '\u062d\u0635\u0629 \u0627\u0644\u0637\u0644\u0628\u0627\u062a (\u0628\u0627\u0644\u0639\u062f\u062f)',
    "uploading a file into this report only previews it here, in your own browser. it isn't shared with other viewers, sent anywhere, or saved outside this device.": '\u0631\u0641\u0639 \u0645\u0644\u0641 \u0641\u064a \u0647\u0630\u0627 \u0627\u0644\u062a\u0642\u0631\u064a\u0631 \u064a\u0639\u0631\u0636\u0647 \u0647\u0646\u0627 \u0641\u0642\u0637 \u062f\u0627\u062e\u0644 \u0645\u062a\u0635\u0641\u062d\u0643. \u0644\u0627 \u064a\u064f\u0634\u0627\u0631\u0643 \u0645\u0639 \u0627\u0644\u0622\u062e\u0631\u064a\u0646 \u0648\u0644\u0627 \u064a\u064f\u0631\u0633\u0644 \u0648\u0644\u0627 \u064a\u064f\u062d\u0641\u0638 \u062e\u0627\u0631\u062c \u0647\u0630\u0627 \u0627\u0644\u062c\u0647\u0627\u0632.'
  };
  function norm(s){ return String(s).replace(/[\u2018\u2019]/g, "'").replace(/\s+/g, ' ').trim().toLowerCase(); }
  var SKIP = { SCRIPT: 1, STYLE: 1, TEXTAREA: 1, INPUT: 1, NOSCRIPT: 1, SELECT: 1, OPTION: 1 };
  function esc(x){ return String(x).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
  function apply(root){
    // 1) AED symbol spans: symbol + number -> number + د.إ
    [].forEach.call(root.querySelectorAll('.aed-symbol'), function(sp){
      if(sp.getAttribute('data-v9rtl')) return;
      var m = (sp.textContent || '').replace(/\s+/g, ' ').trim().match(/^AED ([\d.,]+)$/);
      if(!m) return;
      store.set(sp, { html: sp.innerHTML, ar: null }); sp.setAttribute('data-v9rtl', '1');
      sp.innerHTML = esc(m[1]) + ' ' + AED; store.get(sp).ar = sp.innerHTML; tracked.push(sp);
    });
    // 2) text nodes
    var w = document.createTreeWalker(root, 4, null, false), n, nodes = [];
    while((n = w.nextNode())) nodes.push(n);
    nodes.forEach(function(n){
      try{
        var p = n.parentNode; if(!p || SKIP[p.nodeName] || (p.closest && (p.closest('svg') || p.closest('[data-v9rtl]')))) return;
        var cur = n.nodeValue; if(!/[A-Za-z]/.test(cur)) return;
        var rec = store.get(n); if(rec && rec.ar === cur) return;
        var out = cur;
        if(/AED\s?\d/.test(out)) out = out.replace(/AED\s?(\d[\d.,]*[MK]?)/g, '$1 ' + AED);
        else {
          var tr = cur.trim();
          if(/^[A-Za-z][A-Za-z0-9 &\-\/'.,()%#:·]+$/.test(tr)){ var x = EXACT[norm(tr)] || T(tr); if(x && x !== tr) out = cur.replace(tr, x); }
        }
        if(out !== cur){ store.set(n, { en: cur, ar: out }); tracked.push(n); n.nodeValue = out; }
      }catch(e){}
    });
  }
  function restore(){
    tracked.forEach(function(el){
      var r = store.get(el); if(!r) return;
      if(el.nodeType === 3){ if(el.nodeValue === r.ar) el.nodeValue = r.en; }
      else if(el.isConnected && el.innerHTML === r.ar){ el.innerHTML = r.html; el.removeAttribute('data-v9rtl'); }
    });
    tracked = [];
  }
  var busy = false, timer = null;
  function run(){
    if(busy || !store || !document.body) return; busy = true;
    try{
      tracked = tracked.filter(function(el){ return el.isConnected; });
      if(rtl()) apply(document.body); else if(tracked.length) restore();
    }catch(e){}
    busy = false;
  }
  function sched(){ clearTimeout(timer); timer = setTimeout(run, 80); }
  function init(){
    if(!document.body) return setTimeout(init, 50);
    if(window.MutationObserver){
      new MutationObserver(function(){ if(!busy) sched(); }).observe(document.body, { childList: true, subtree: true, characterData: true });
      new MutationObserver(sched).observe(document.documentElement, { attributes: true, attributeFilter: ['dir', 'lang'] });
    }
    sched();
  }
  init();
})();
