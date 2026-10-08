
// TRIAL v8 (in-report): main idea first, then numbered breakdown steps, extra detail collapsed, duplicated tiles removed.
// Works on the section-head / content flat layout of Bounced Cheques, New Lease and Request Count.
// Nodes are moved, never rebuilt, so every id, chart and click handler keeps working.
// Config (window.__V8_STEPS_CFG): { moves:[[label, 'main'|regex]], hide:[labels], more:regex }
(function(){
  var cfg = window.__V8_STEPS_CFG || {};
  var txt = function(n){ return ((n && n.textContent) || '').replace(/\s+/g, ' ').trim(); };
  var isHead = function(e){ return e && e.classList && e.classList.contains('section-head'); };
  var isBox = function(e){ return e && e.classList && e.classList.contains('section-primary') && !!e.querySelector(':scope > .section-head'); };
  var isStart = function(e){ return isHead(e) || isBox(e); };
  function run(){
    var body = document.body;
    if(!body || body.getAttribute('data-v8-steps')) return;
    var heads = Array.prototype.slice.call(body.children).filter(isStart);
    if(heads.length < 2) return;
    body.setAttribute('data-v8-steps', '1');
    var groups = heads.map(function(h){
      if(isBox(h)){ var hh = h.querySelector(':scope > .section-head'); return { head: hh, box: h, title: txt(hh.querySelector('h3')), nodes: [] }; }
      var nodes = [], n = h.nextElementSibling;
      while(n && !isStart(n) && n.tagName !== 'FOOTER' && n.tagName !== 'SCRIPT'){ nodes.push(n); n = n.nextElementSibling; }
      return { head: h, title: txt(h.querySelector('h3')), nodes: nodes };
    });
    var findGroup = function(re){ for(var i = 1; i < groups.length; i++){ if(re.test(groups[i].title)) return groups[i]; } return null; };

    // 1. move tiles to the step they belong to (or up into the main row), hide tiles that repeat a table/card
    var kpis = Array.prototype.slice.call(document.querySelectorAll('.kpi, .kpi-mini'));
    var byLabel = function(l){ return kpis.filter(function(k){ return txt(k.querySelector('.label')) === l; })[0]; };
    (cfg.moves || []).forEach(function(m){
      var k = byLabel(m[0]); if(!k) return;
      if(m[1] === 'main'){
        var row = groups[0].nodes.filter(function(x){ return x.classList.contains('kpis') || x.classList.contains('kpis-primary'); })[0];
        if(row) row.appendChild(k);
      } else {
        var g = findGroup(new RegExp(m[1], 'i')); if(!g) return;
        var existing = null;
        var scan = g.box ? Array.prototype.slice.call(g.box.children) : g.nodes;
        scan.forEach(function(nn){ if(!existing && nn.classList && (nn.classList.contains('kpis') || nn.classList.contains('kpis-split') || nn.classList.contains('risk-supporting') || nn.classList.contains('kpis-support')) && !nn.classList.contains('v8-moved')) existing = nn; });
        if(existing){ existing.appendChild(k); return; }
        var box = g.moved || (g.nodes[0] && g.nodes[0].classList.contains('v8-moved') ? g.nodes[0] : null);
        if(!box){ box = document.createElement('div'); box.className = 'kpis v8-moved'; g.head.parentNode.insertBefore(box, g.box ? g.head.nextSibling : (g.nodes[0] || g.head.nextSibling)); if(!g.box) g.nodes.unshift(box); g.moved = box; }
        box.appendChild(k);
      }
    });
    (cfg.hide || []).forEach(function(l){ var k = byLabel(l); if(k) k.style.display = 'none'; });
    Array.prototype.slice.call(document.querySelectorAll('.kpis, .kpis-split, .risk-supporting, .kpis-primary, .kpis-support')).forEach(function(c){
      var vis = Array.prototype.slice.call(c.querySelectorAll('.kpi, .kpi-mini')).filter(function(k){ return k.style.display !== 'none'; });
      if(!vis.length) c.style.display = 'none';
    });

    // 2. main idea stays at the top; the rest become numbered steps
    var moreRe = cfg.more ? new RegExp(cfg.more, 'i') : null;
    var exploreRe = /explore/i;
    var rest = groups.slice(1);
    var steps = rest.filter(function(g){ return !(moreRe && moreRe.test(g.title)) && !exploreRe.test(g.title); });
    var more = rest.filter(function(g){ return moreRe && moreRe.test(g.title); });
    var explore = rest.filter(function(g){ return exploreRe.test(g.title); });
    groups[0].head.classList.add('v8-main-head');
    var __kick = function(){ var a = false; try{ a = (typeof currentLangCC !== 'undefined' && currentLangCC === 'ar') || (typeof currentLangRC !== 'undefined' && currentLangRC === 'ar') || (typeof currentLangNL !== 'undefined' && currentLangNL === 'ar') || (typeof currentLangBC !== 'undefined' && currentLangBC === 'ar'); }catch(e){} return a ? '\u0627\u0644\u0641\u0643\u0631\u0629 \u0627\u0644\u0631\u0626\u064a\u0633\u064a\u0629' : 'The main idea'; };
    var __kh = groups[0].head; __kh.setAttribute('data-v8-kicker', __kick());
    (function(){ var hk = function(){ var o = window.__mdSetReportLanguage; if(typeof o !== 'function' || o.__v9k) return; var w = function(){ var r = o.apply(this, arguments); try{ __kh.setAttribute('data-v8-kicker', __kick()); }catch(e){} return r; }; w.__v9k = 1; window.__mdSetReportLanguage = w; }; hk(); setTimeout(hk, 800); setTimeout(hk, 2500); })();

    var lastMain = groups[0].nodes.length ? groups[0].nodes[groups[0].nodes.length - 1] : groups[0].head;
    var wrap = document.createElement('div'); wrap.className = 'v8-steps';
    lastMain.parentNode.insertBefore(wrap, lastMain.nextSibling);
    var build = function(g, label, host){
      var badge = document.createElement('span'); badge.className = 'v8-step-n'; badge.textContent = label;
      g.head.insertBefore(badge, g.head.firstChild);
      g.head.classList.add('v8-step-head');
      if(g.box){ g.box.classList.add('v8-step'); host.appendChild(g.box); return; }
      var sec = document.createElement('section'); sec.className = 'v8-step';
      sec.appendChild(g.head);
      g.nodes.forEach(function(n){ sec.appendChild(n); });
      host.appendChild(sec);
    };
    var num = 0;
    steps.forEach(function(g){ num++; build(g, String(num), wrap); });
    if(more.length){
      var det = document.createElement('details'); det.className = 'v8-more';
      var sum = document.createElement('summary'); sum.className = 'v9-more-sum';
      var isAr = function(){ try{ return (typeof currentLangCC !== 'undefined' && currentLangCC === 'ar') || (typeof currentLangRC !== 'undefined' && currentLangRC === 'ar') || (typeof currentLangNL !== 'undefined' && currentLangNL === 'ar') || (typeof currentLangBC !== 'undefined' && currentLangBC === 'ar'); }catch(e){ return false; } };
      var relabel = function(){ sum.textContent = isAr() ? '\u062a\u0641\u0627\u0635\u064a\u0644 \u0625\u0636\u0627\u0641\u064a\u0629' : 'More detail'; };
      relabel();
      var hook = function(){ var o = window.__mdSetReportLanguage; if(typeof o !== 'function' || o.__v9m) return; var w = function(){ var r = o.apply(this, arguments); try{ relabel(); }catch(e){} return r; }; w.__v9m = 1; window.__mdSetReportLanguage = w; };
      hook(); setTimeout(hook, 800); setTimeout(hook, 2500);
      det.appendChild(sum);
      var inner = document.createElement('div'); inner.className = 'v8-more-body'; det.appendChild(inner);
      more.forEach(function(g){ build(g, '+', inner); });
      wrap.appendChild(det);
    }
    explore.forEach(function(g){ num++; build(g, String(num), wrap); });
  }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run); else run();
})();
