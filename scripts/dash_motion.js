/* ---- Dashboard motion (v13): every tab of the dashboard, including the embedded reports, animates as its content comes into view.
   Cards and tiles rise in with a short stagger; horizontal bars grow; donuts sweep round; line and area charts wipe in; headline numbers
   count up from zero to their exact value. It replays each time a tab is opened and whenever a chart is re-rendered in place
   (for example switching Installments / Contracts / Bounced cheques). Scrolling reveals items as they approach the screen.
   Runs per document (the page and each report iframe). Skips users who prefer reduced motion. Nothing here changes data, colours or layout. ---- */
(function(){
  'use strict';
  var SEL = ['.la4-tile', '.la4-card', '.ov6-tile', '.eb-pill', '.x4-stat', '.dq7-tile', '.overview-card', '.exec-card',
             '.kpi', '.card', '.stat-item', '.top5-stat', '.quality-panel',
             '.v8-ohead', '.dh-panel', '.na-panel', '.check-row', '.heatmap-card', '.compare-card', '.compare-specific-col', '.dq-group', '.dq-summary-bar'].join(',');
  var BARS = 'i[style*="width"],i[style*="height"],svg';
  var NUMS = '.value,.stat-value,.la4-tile-big,.ov6-big,.x4-stat-value,.oc-big-num,.exec-value';
  var NUMRE = /^[A-Za-z\s.]*(-?[\d,]*\.?\d+)\s*([A-Za-z%\s.]*)$/;
  var SKIPCHANGE = '[class*="tip"],[class*="hover"],[data-dm-skip]';
  function cssText(){ var s = document.getElementById('dashMotionCss'); return s ? s.textContent : ''; }

  function install(doc){
    var W = doc.defaultView;
    if(!W || !doc.documentElement) return;
    if(W.__dm && W.__dm.doc === doc.documentElement) return;       /* already running on this document */
    if(W.__dm){ try{ W.__dm.stop(); }catch(e){} }                   /* document was rebuilt: tear the old one down first */
    try{ if(W.matchMedia && W.matchMedia('(prefers-reduced-motion: reduce)').matches) return; }catch(e){}
    if(!W.IntersectionObserver || !W.MutationObserver) return;
    var css = cssText(); if(!css) return;
    if(doc !== document){ var st = doc.createElement('style'); st.setAttribute('data-dm', '1'); st.textContent = css; (doc.head || doc.documentElement).appendChild(st); }
    var speed = 0, lastY = 0, lastT = 0, lastEv = 0;
    try{
      var TW = W.top; lastY = TW.scrollY; lastT = W.performance.now();
      TW.addEventListener('scroll', function(){
        var n = W.performance.now(), dy = Math.abs(TW.scrollY - lastY), dt = Math.max(1, n - lastT);
        speed = dy / dt; lastY = TW.scrollY; lastT = n; lastEv = n;
      }, {passive: true});
    }catch(e){}
    function fastScroll(){ return W.performance.now() - lastEv < 140 && speed > 1.6; }   /* px per ms: a quick flick */
    var seen = new W.WeakSet(), timer = null, pending = [], all = [], hiddenTicks = new W.WeakMap();

    function numberNode(el){
      var w = doc.createTreeWalker(el, 4, null), n;
      while((n = w.nextNode())){ if(/\d/.test(n.nodeValue)) return n; }
      return null;
    }
    function countUp(el){
      var node = numberNode(el); if(!node) return;
      var orig = node.nodeValue, m = NUMRE.exec(orig.trim());
      if(!m) return;
      var raw = m[1], end = parseFloat(raw.replace(/,/g, '')), dec = (raw.split('.')[1] || '').length, comma = raw.indexOf(',') >= 0;
      if(isNaN(end) || end === 0) return;
      if(!comma && !dec && end >= 1900 && end <= 2100) return;     /* a year, not a quantity */
      var i0 = orig.indexOf(raw), pre = orig.slice(0, i0), post = orig.slice(i0 + raw.length), t0 = W.performance.now(), last = orig;
      var fin = W.setTimeout(function(){ if(node.nodeValue === last) node.nodeValue = orig; }, 1100);   /* if frames stall (background tab), still land on the real value */
      (function f(t){
        if(!node.isConnected || node.nodeValue !== last) return;      /* something else wrote here: stop touching it */
        var p = Math.min(1, (t - t0) / 800);
        if(p >= 1){ node.nodeValue = orig; W.clearTimeout(fin); return; }
        if(p > 0){
          var v = end * (1 - Math.pow(1 - p, 3));
          last = pre + (comma ? v.toLocaleString('en-US', {minimumFractionDigits: dec, maximumFractionDigits: dec}) : v.toFixed(dec)) + post;
          node.nodeValue = last;
        }
        W.requestAnimationFrame(f);
      })(t0);
    }
    function clean(el, ms){
      if(el.__dmT) W.clearTimeout(el.__dmT);
      el.__dmT = W.setTimeout(function(){ el.classList.remove('dm-in'); el.style.animationDelay = ''; el.__dmT = 0; }, ms);
    }
    function reveal(el, delay){
      if(!el.isConnected) return;
      if(el.classList.contains('dm-bx') || el.classList.contains('dm-by')){ var ix = 0, sb = el.previousElementSibling; while(sb && ix < 12){ ix++; sb = sb.previousElementSibling; } delay += ix * 35; }
      el.classList.remove('dm-pre');
      if(fastScroll()) return;                                   /* a quick flick: show content as normal, no entrance, so nothing flashes */
      el.style.animationDelay = delay + 'ms';
      el.classList.add('dm-in');
      var nums = el.matches(NUMS) ? [el] : el.querySelectorAll(NUMS);
      for(var i = 0; i < nums.length && i < 6; i++) countUp(nums[i]);
      clean(el, 2400 + delay);
    }
    var io = new W.IntersectionObserver(function(es){
      var vis = es.filter(function(e){ return e.isIntersecting && e.target.isConnected; }).map(function(e){ return e.target; });
      vis.sort(function(a, b){ var p = a.compareDocumentPosition(b); return p & 4 ? -1 : p & 2 ? 1 : 0; });
      vis.forEach(function(el, i){ io.unobserve(el); reveal(el, Math.min(i, 8) * 40); });
    }, {threshold: .01, rootMargin: '0px 0px 30% 0px'});

    function kindOf(el){
      var n = el.tagName;
      if(n === 'I'){
        if(el.children.length) return '';
        var s = el.getAttribute('style') || '';
        if(/(?:^|;|\s)width:\s*[\d.]+%/.test(s)) return 'dm-bx';
        if(/(?:^|;|\s)height:\s*[\d.]+%/.test(s)) return 'dm-by';
        return '';
      }
      if(n === 'svg' || n === 'SVG'){
        if(el.closest('button,a,[role=button],.ov6-spark')) return '';
        var vb = (el.getAttribute('viewBox') || '').split(/[\s,]+/), w = parseFloat(vb[2]) || parseFloat(el.getAttribute('width')) || 0;
        if(w < 120) return '';
        return (el.getAttribute('class') || '').indexOf('donut') >= 0 ? 'dm-pp' : 'dm-sp';
      }
      return '';
    }
    function arm(el){
      el.classList.remove('dm-in'); el.classList.add('dm-pre'); el.style.animationDelay = '';
      if(el.__dmT){ W.clearTimeout(el.__dmT); el.__dmT = 0; }
      io.observe(el); pending.push({el: el, shown: 0});
    }
    function register(el){
      if(seen.has(el) || el.closest('#tvRoot')) return;
      var kind = kindOf(el);
      if(!kind){
        if(el.tagName === 'I' || el.tagName === 'svg' || el.tagName === 'SVG') return;
        var up = el.parentElement; if(up && up.closest(SEL)) return;
      }
      seen.add(el);
      if(kind) el.classList.add(kind);
      all.push(el);
      arm(el);
    }
    /* One timer per document: (1) safety net, anything on screen but still waiting after ~2 s is revealed directly so nothing can stay invisible;
       (2) re-arm, an element that has been hidden (its tab or section was closed) plays its entrance again when it is shown. */
    function rearm(now){
      if(doc.visibilityState === 'hidden') return;
      var todo = [];
      all = all.filter(function(el){ return el.isConnected; });
      for(var i = 0; i < all.length; i++){
        var el = all[i];
        if(el.getClientRects().length){ if(hiddenTicks.has(el)) hiddenTicks.delete(el); continue; }
        var n = (hiddenTicks.get(el) || 0) + 1; hiddenTicks.set(el, n);
        if((now || n >= 2) && !el.classList.contains('dm-pre')) todo.push(el);
      }
      todo.forEach(function(el){ hiddenTicks.delete(el); arm(el); });
    }
    var tick = W.setInterval(function(){
      if(doc.visibilityState === 'hidden') return;
      var nextPending = [], reveals = [];
      for(var i = 0; i < pending.length; i++){
        var p = pending[i];
        if(!p.el.isConnected || !p.el.classList.contains('dm-pre')) continue;
        var pr = p.el.parentElement, r = (pr || p.el).getBoundingClientRect(), self = p.el.getBoundingClientRect(), vh = W.innerHeight, off = 0;
        try{ if(W.top !== W && W.frameElement){ off = W.frameElement.getBoundingClientRect().top; vh = W.top.innerHeight; } }catch(e){}   /* a report iframe is as tall as its content, so measure against the real screen */
        if((self.width || r.width) && (self.height || r.height) && self.bottom + off > 0 && self.top + off < vh) p.shown++;
        if(p.shown >= 3) reveals.push(p.el); else nextPending.push(p);
      }
      pending = nextPending;
      reveals.forEach(function(el){ io.unobserve(el); reveal(el, 0); });
      rearm(false);
    }, 600);
    function scan(){ doc.querySelectorAll(SEL).forEach(register); doc.querySelectorAll(BARS).forEach(register); }
    var mo = new W.MutationObserver(function(list){
      var again = [];
      for(var a = 0; a < list.length; a++){
        var rec = list[a], tg = rec.target, ad = rec.addedNodes;
        /* a chart that is re-drawn in place (same <svg>, new contents) plays its entrance again */
        if(rec.type === 'childList' && ad.length >= 3 && tg.nodeType === 1 && tg.closest && !tg.closest(SKIPCHANGE)){
          var sv = tg.closest('svg');
          if(sv && seen.has(sv) && /dm-(sp|pp)/.test(sv.getAttribute('class') || '') && again.indexOf(sv) < 0) again.push(sv);
        }
        /* new nodes are prepared synchronously, before the browser paints them, so a re-render animates instead of flashing */
        for(var b = 0; b < ad.length; b++){
          var nd = ad[b]; if(nd.nodeType !== 1) continue;
          if(nd.matches(SEL) || nd.matches(BARS)) register(nd);
          if(nd.querySelectorAll){ nd.querySelectorAll(SEL).forEach(register); nd.querySelectorAll(BARS).forEach(register); }
        }
      }
      again.forEach(function(sv){ if(sv.isConnected) arm(sv); });
      if(timer) return;
      for(var i = 0; i < list.length; i++){ if(list[i].addedNodes.length){ timer = W.setTimeout(function(){ timer = null; scan(); }, 400); return; } }
    });
    mo.observe(doc.documentElement, {childList: true, subtree: true});
    W.__dm = {
      doc: doc.documentElement,
      rearm: function(){ rearm(true); },
      revealAll: function(){ all.forEach(function(el){ el.classList.remove('dm-pre'); }); },
      stop: function(){ W.clearInterval(tick); mo.disconnect(); io.disconnect(); if(timer) W.clearTimeout(timer); W.__dm = null; }
    };
    scan();
  }

  function installAll(){
    install(document);
    document.querySelectorAll('iframe').forEach(function(f){ try{ var d = f.contentDocument; if(d && d.documentElement && d.body) install(d); }catch(e){} });
  }
  function broadcast(fn){
    try{ if(window.__dm) window.__dm[fn](); }catch(e){}
    document.querySelectorAll('iframe').forEach(function(f){ try{ var w = f.contentWindow; if(w && w.__dm) w.__dm[fn](); }catch(e){} });
  }
  /* opening a tab: re-arm everything that is currently hidden, so the tab's content plays its entrance as it appears */
  if(typeof window.selectTab === 'function' && !window.selectTab.__dm){
    var orig = window.selectTab;
    window.selectTab = function(){ broadcast('rearm'); return orig.apply(this, arguments); };
    window.selectTab.__dm = 1;
  }
  window.__dmRevealAll = function(){ broadcast('revealAll'); };     /* call before exporting or snapshotting the page */
  installAll();
  setInterval(installAll, 1200);
})();
