// TRIAL v9 (shell): small cross-tab fixes from the round-2 review. Safe no-ops when an element is missing.
(function(){
  function ar(){ return document.documentElement.lang === 'ar'; }
  // search placeholder follows the language
  function ph(){ try{ var i = document.getElementById('mdSearchInput'); if(i){ var p = ar() ? 'اذهب إلى تقرير أو قيمة…' : 'Jump to a report or value…'; if(i.placeholder !== p) i.placeholder = p; } }catch(e){ console.warn('v9 placeholder', e); } }
  // dates and number ranges keep their own direction inside Arabic sentences
  var DATE_RE = /(\d{1,2}\s(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s\d{4}|\d{1,2}\s(?:يناير|فبراير|مارس|أبريل|مايو|يونيو|يوليو|أغسطس|سبتمبر|أكتوبر|نوفمبر|ديسمبر)\s\d{4})/g;
  var PAREN_RE = /\(\s*\d[\d,.%]*\s*\)/g;
  function isolate(root){
    if(!ar() || !root) return;
    try{
      var w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null), n, list = [];
      while((n = w.nextNode())){ var p = n.parentNode; if(!p || /^(SCRIPT|STYLE|BDI|TEXTAREA|INPUT)$/.test(p.nodeName)) continue; if(DATE_RE.test(n.nodeValue) || PAREN_RE.test(n.nodeValue)){ list.push(n); } DATE_RE.lastIndex = 0; PAREN_RE.lastIndex = 0; }
      list.forEach(function(t){ var span = document.createElement('span'); span.innerHTML = t.nodeValue.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(DATE_RE, '<bdi>$1</bdi>').replace(PAREN_RE, function(m){ return '<bdi style="white-space:nowrap">' + m.replace(/\s+/g, '') + '</bdi>'; }); t.parentNode.replaceChild(span, t); });
    }catch(e){ console.warn('v9 bidi', e); }
  }
  // Executive Summary daily chart: say why its total can differ from the sheet total
  function chartNote(){
    try{
      var host = document.getElementById('ebChartHost'); if(!host || host.__v9n) return;
      var card = host.closest('.eb-chart'); var cc = window.__v9CcForNote; if(!card || !cc || cc.sheet_installments_total === undefined) return;
      var d = cc.details_installments_total, s = cc.sheet_installments_total; if(d === s) return;
      var note = document.createElement('div'); note.className = 'v8-brief-note'; note.style.cssText = 'margin-top:8px;font-size:12px;opacity:.8';
      note.textContent = ar() ? ('الرسم اليومي يعرض ' + d.toLocaleString('en-US') + ' قسطاً له تاريخ في ورقة التفاصيل؛ إجمالي ورقة عدد الشيكات ' + s.toLocaleString('en-US') + '.')
                              : ('This chart shows the ' + d.toLocaleString('en-US') + ' installments dated in the Details sheet. The Cheque Count sheet total is ' + s.toLocaleString('en-US') + '.');
      card.appendChild(note); host.__v9n = 1;
    }catch(e){ console.warn('v9 chart note', e); }
  }
  var t = null;
  function tick(){ if(t) return; t = setTimeout(function(){ t = null; ph(); chartNote(); isolate(document.body); }, 120); }
  new MutationObserver(tick).observe(document.documentElement, {attributes:true, attributeFilter:['lang']});
  new MutationObserver(function(m){ for(var i=0;i<m.length;i++){ if(m[i].addedNodes.length){ tick(); return; } } }).observe(document.body, {childList:true, subtree:true});
  tick();
})();
