/* ---- TV mode (v11): full-screen, auto-rotating wallboard built from the data already loaded in the page ---- */
(function(){
  'use strict';
  var TVT = {
    en: {
      'nav.tv':'TV','nav.tvAria':'Open TV mode','nav.tvTitle':'Full-screen wallboard for an office TV',
      'tv.exit':'Exit','tv.s.headline':'Overview','tv.s.bounce':'Bounced cheques','tv.s.lease':'Leasing','tv.s.requests':'Requests','tv.s.health':'Data health',
      'tv.net':'Net recorded value','tv.total':'Total recorded value','tv.bounceRate':'Bounce rate','tv.target':'Target','tv.within':'Within target','tv.above':'Above target',
      'tv.contracts':'Lease contracts','tv.requests':'Requests processed','tv.status':'Data status',
      'tv.bounced':'Bounced value','tv.cheques':'cheques','tv.legal':'Under legal action','tv.process':'Under process','tv.paid':'Paid',
      'tv.residential':'Residential','tv.sh.net':'Net value','tv.sh.ren':'Renewals','tv.sh.rent':'New lease value','tv.sh.req':'Requests','tv.sh.bnc':'Bounced','tv.unitType':'Unit type','tv.commercial':'Commercial','tv.dailyBounced':'Bounced cheques by cheque date',
      'tv.renewal':'Renewal','tv.new':'New','tv.newLeaseValue':'Annual rent of new leases','tv.fees':'Payments recorded','tv.dailyLease':'Lease contracts per day',
      'tv.reqValue':'Fees recorded on requests','tv.reqTypes':'Request types','tv.dailyReq':'Requests per day',
      'tv.vsPrev':'vs','tv.avg':'avg','tv.period':'Period','tv.snapshot':'Snapshot','tv.waiting':'Waiting for the reports to finish loading','tv.unsupported':'TV mode is ready for the Awqaf portfolio. Switch to Awqaf to use it.',
      'tv.dailyVal':'Payments recorded per day','tv.newPerDay':'New leases per day','tv.avgWd':'weekday avg','tv.vOk':'Bounce rate within target','tv.vBad':'Bounce rate above target','tv.vUp':'Net value up','tv.vDown':'Net value down','tv.asOf':'Data as of','tv.daysOld':'days old','tv.unitM':'M','tv.unitK':'K','tv.cur':'AED','tv.critical':'Critical','tv.review':'Review','tv.warning':'Warning','tv.info':'Info','tv.nothing':'Nothing needs attention','tv.hint':'Esc to exit · arrow keys to change slide · space to pause'
    },
    ar: {
      'nav.tv':'التلفاز','nav.tvAria':'فتح وضع التلفاز','nav.tvTitle':'عرض بملء الشاشة على تلفاز المكتب',
      'tv.exit':'خروج','tv.s.headline':'نظرة عامة','tv.s.bounce':'الشيكات المرتجعة','tv.s.lease':'التأجير','tv.s.requests':'الطلبات','tv.s.health':'جودة البيانات',
      'tv.net':'صافي القيمة المسجلة','tv.total':'إجمالي القيمة المسجلة','tv.bounceRate':'معدل الارتجاع','tv.target':'الهدف','tv.within':'ضمن الهدف','tv.above':'فوق الهدف',
      'tv.contracts':'عقود الإيجار','tv.requests':'الطلبات المعالجة','tv.status':'حالة البيانات',
      'tv.bounced':'قيمة الشيكات المرتجعة','tv.cheques':'عدد الشيكات:','tv.legal':'إجراء قانوني','tv.process':'قيد المعالجة','tv.paid':'مدفوع',
      'tv.residential':'سكني','tv.sh.net':'صافي القيمة','tv.sh.ren':'التجديدات','tv.sh.rent':'قيمة الإيجار الجديد','tv.sh.req':'الطلبات','tv.sh.bnc':'المرتجعة','tv.unitType':'نوع الوحدة','tv.commercial':'تجاري','tv.dailyBounced':'الشيكات المرتجعة حسب تاريخ الشيك',
      'tv.renewal':'تجديد','tv.new':'عقد جديد','tv.newLeaseValue':'الإيجار السنوي للعقود الجديدة','tv.fees':'المدفوعات المسجلة','tv.dailyLease':'عقود الإيجار يومياً',
      'tv.reqValue':'الرسوم المسجلة على الطلبات','tv.reqTypes':'أنواع الطلبات','tv.dailyReq':'الطلبات يومياً',
      'tv.vsPrev':'مقابل','tv.avg':'المتوسط','tv.period':'الفترة','tv.snapshot':'البيانات كما في','tv.waiting':'في انتظار انتهاء تحميل التقارير','tv.unsupported':'وضع التلفاز متاح حالياً لمحفظة الأوقاف فقط. انتقل إلى الأوقاف لاستخدامه.',
      'tv.dailyVal':'المدفوعات المسجلة يوميًا','tv.newPerDay':'العقود الجديدة يوميًا','tv.avgWd':'متوسط أيام العمل','tv.vOk':'معدل الارتجاع ضمن الهدف','tv.vBad':'معدل الارتجاع فوق الهدف','tv.vUp':'ارتفاع صافي القيمة','tv.vDown':'انخفاض صافي القيمة','tv.asOf':'البيانات كما في','tv.daysOld':'يومًا مضت','tv.unitM':' مليون','tv.unitK':' ألف','tv.cur':'د.إ','tv.critical':'حرج','tv.review':'مراجعة','tv.warning':'تحذير','tv.info':'معلومة','tv.nothing':'لا يوجد ما يستدعي الانتباه','tv.hint':'Esc للخروج · الأسهم لتغيير الشريحة · مسافة للإيقاف المؤقت'
    }
  };
  try{ Object.assign(TRANSLATIONS.en, TVT.en); Object.assign(TRANSLATIONS.ar, TVT.ar); }catch(e){}

  var SLIDE_MS = 20000;
  var root = null, timer = null, clockTimer = null, driftTimer = null, slide = 0, slideStart = 0, paused = false;
  var triggerEl = null, hadFullscreen = false, wakeLock = null, activeTimer = null, gid = 0, observer = null;
  var enter = true, running = false, driftPx = [0,0], msgT = null;
  var SLIDES = ['headline','bounce','lease','requests'];

  function T(k, fb){ return t(k, fb); }
  function E(s){ return esc(s); }
  function N(n){ return Math.round(n).toLocaleString('en-US'); }
  function compact(n){
    var a = Math.abs(n);
    if(a >= 1e6) return +(n/1e6).toPrecision(3) + T('tv.unitM','M');
    if(a >= 1e3) return +(n/1e3).toPrecision(3) + T('tv.unitK','K');
    return String(Math.round(n));
  }
  function AR(){ return document.documentElement.lang === 'ar'; }
  function cparts(n){ var a = Math.abs(n); if(a >= 1e6) return [+(n/1e6).toFixed(2), T('tv.unitM','M')]; if(a >= 1e3) return [+(n/1e3).toFixed(1), T('tv.unitK','K')]; return [Math.round(n), '']; }
  function cv(n){ var p = cparts(n); return tvn(String(p[0])) + (p[1] ? '<span class="u">' + E(p[1]) + '</span>' : ''); }
  function money(n){ return AR() ? cv(n) + ' ' + E(CUR()) : E(CUR()) + ' ' + cv(n); }
  function CUR(){ return T('tv.cur','AED'); }
  function series(d){ return d ? Object.entries(d).sort(function(a,b){ return a[0] < b[0] ? -1 : 1; }).map(function(e){ return [e[0], +e[1] || 0]; }) : []; }
  function tvn(s){ return '<span class="tvn">' + E(s) + '</span>'; }

  /* ---------- charts (plain SVG) ---------- */
  function area(d, color, mx){
    var s = series(d); if(s.length < 2) return '';
    var W = 1000, H = 220, max = Math.max.apply(null, s.map(function(x){ return x[1]; }).concat([1])), id = 'tvg' + (++gid); if(mx) max = mx;
    var pts = s.map(function(x, i){ return [i/(s.length-1)*W, H - (x[1]/max)*(H-20) - 10]; });
    var line = pts.map(function(p, i){ return (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1); }).join(' ');
    return '<svg class="tv-area" viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="none" aria-hidden="true"><defs><linearGradient id="' + id + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + color + '" stop-opacity=".55"/><stop offset="1" stop-color="' + color + '" stop-opacity="0"/></linearGradient></defs>'
      + '<path d="' + line + ' L' + W + ' ' + H + ' L0 ' + H + ' Z" fill="url(#' + id + ')"/><path d="' + line + '" fill="none" stroke="' + color + '" stroke-width="4" vector-effect="non-scaling-stroke"/></svg>';
  }
  function marks(d){
    var s = series(d); if(s.length < 2) return '';
    var max = Math.max.apply(null, s.map(function(x){ return x[1]; }).concat([1])), pk = 0; s.forEach(function(x, i){ if(x[1] > s[pk][1]) pk = i; });
    var pos = function(i){ return 'inset-inline-start:' + (i/(s.length-1)*100).toFixed(2) + '%;top:calc(2.6rem + (100% - 2.6rem) * ' + ((220 - (s[i][1]/max)*200 - 10)/220).toFixed(4) + ')'; };
    return '<i class="mk pk" style="' + pos(pk) + '">' + '</i><i class="mk" style="' + pos(s.length-1) + '"></i>';
  }
  function fullMonth(o, d){
  if(!d.dMin) return o;
  var y = +d.dMin.slice(0,4), m = +d.dMin.slice(5,7), n = new Date(Date.UTC(y, m, 0)).getUTCDate(), r = {}, pad = function(v){ return ('0' + v).slice(-2); };
  for(var i = 1; i <= n; i++){ var k = y + '-' + pad(m) + '-' + pad(i); r[k] = (o && +o[k]) || 0; }
  return r; }
function cols(d, color){
    var s = series(d); if(!s.length) return '';
    var W = 1000, H = 220, max = Math.max.apply(null, s.map(function(x){ return x[1]; }).concat([1])), bw = W / s.length;
    var bars = s.map(function(x, i){
      var h = x[1] ? Math.max(6, x[1]/max*(H-16)) : 0;
      return '<rect x="' + (i*bw + bw*.15).toFixed(1) + '" y="' + (H - h).toFixed(1) + '" width="' + (bw*.7).toFixed(1) + '" height="' + h.toFixed(1) + '" rx="3" fill="' + color + '"/>';
    }).join('');
    return '<svg class="tv-cols" viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="none" aria-hidden="true">' + bars + '</svg>';
  }
  function donut(parts){
    var tot = parts.reduce(function(a, p){ return a + p.v; }, 0) || 1, R = 80, C = 2*Math.PI*R, off = 0;
    var arcs = parts.map(function(p){
      var len = p.v/tot*C, el = '<circle cx="100" cy="100" r="' + R + '" fill="none" stroke="' + p.c + '" stroke-width="28" stroke-dasharray="' + len.toFixed(2) + ' ' + (C-len).toFixed(2) + '" stroke-dashoffset="' + (-off).toFixed(2) + '" transform="rotate(-90 100 100)"/>';
      off += len; return el;
    }).join('');
    return '<svg viewBox="0 0 200 200" aria-hidden="true"><circle cx="100" cy="100" r="' + R + '" fill="none" stroke="var(--card2)" stroke-width="28"/>' + arcs + '</svg>';
  }
  function bullet(rate, target, big){
    var max = Math.max(5, Math.ceil(Math.max(rate, target) * 1.6)), px = function(v){ return Math.min(100, v/max*100); };
    var color = rate > target ? 'var(--bad)' : 'var(--ok)';
    return '<div class="tv-bullet' + (big ? ' big' : '') + '" dir="ltr"><i class="fill" style="width:' + px(rate).toFixed(1) + '%;background:' + color + '"></i><b class="tick" style="left:' + px(target).toFixed(1) + '%"></b></div>'
      + '<div class="tv-scale" dir="ltr"><span>0%</span><span>' + max + '%</span><span class="tg" style="left:' + px(target).toFixed(1) + '%">' + target + '% ' + E(T('tv.target','Target')) + '</span></div>';
  }

  /* ---------- data (read live from the report iframes already mounted) ---------- */
  function prevKey(m){ var y = +String(m).slice(0,4), mo = +String(m).slice(5,7) - 1; if(mo < 1){ mo = 12; y--; } return y + '-' + ('0' + mo).slice(-2); }
  function collect(){
    if(currentPortfolio !== 'awqaf') return {unsupported:true};
    var w = function(id){ try{ var x = embeddedWindows[id]; return x && x.__crossCheckData ? x.__crossCheckData : null; }catch(e){ return null; } };
    var cc = w('count-report'), bc = w('bounced-cheques'), nl = w('new-lease'), rc = w('request-count');
    if(!(cc && bc && nl && rc)) return {waiting:true};
    var total = cc.total_amount || 0, bounced = bc.total_amount || 0, target = (THRESHOLDS && THRESHOLDS.awqaf && THRESHOLDS.awqaf.bounceTarget) || 2;
    var d = {
      total: total, bounced: bounced, net: total - bounced, rate: total ? bounced/total*100 : 0, target: target,
      lines: cc.total_lines || 0, bCount: bc.total_count || 0,
      legal: (bc.status && bc.status['Under Legal Action']) || 0, proc: (bc.status && bc.status['Under Process']) || 0, paid: (bc.status && bc.status['PAID']) || 0,
      resid: (bc.unit_type && bc.unit_type['Residential']) || 0, comm: (bc.unit_type && bc.unit_type['Commercial']) || 0,
      ren: cc.renewal_lease_contracts || 0, nw: cc.new_lease_contracts || 0, rent: nl.rent_value_total || 0, fees: nl.total_amount || 0,
      reqs: rc.total_requests || 0, reqVal: rc.total_amount || 0, reqTypes: Object.entries(rc.type_counts || {}).sort(function(a,b){ return b[1]-a[1]; }),
      dChq: cc.daily, dBounce: bc.daily, dReq: rc.daily, dNew: cc.new_lease_daily, dRen: cc.renewal_lease_daily,
      dMin: cc.date_min || '', dMax: cc.date_max || '',
      period: (typeof fmtPeriod === 'function') ? fmtPeriod(cc.date_min, cc.date_max) : '', health: null, prev: null, snap: ''
    };
    try{ d.health = computeDataHealthStatus(); }catch(e){}
    try{
      var hist = getMonthlyHistory('awqaf').filter(function(h){ return h && h.periodKey && h.periodKey === prevKey(currentMonth); }).sort(function(a,b){ return a.periodKey < b.periodKey ? -1 : 1; });
      if(hist.length) d.prev = hist[hist.length-1];
    }catch(e){}
    try{ var f = embeddedWindows['count-report'].__mdFreshness; if(f && f.snapshotDate) d.snap = String(f.snapshotDate).slice(0,10); }catch(e){}
    return d;
  }

  /* ---------- slides ---------- */
  function bar(label, v, tot, color){
    var p = tot ? v/tot*100 : 0;
    return '<div class="tv-bar"><div class="r"><span>' + E(label) + '</span><b>' + tvn(N(v)) + '</b></div><div class="b"><i style="width:' + p.toFixed(1) + '%;background:' + color + '"></i></div></div>';
  }
  function bars(d, color, mn, mx, d2, color2){
    var m = {}, m2 = {}; series(d).forEach(function(x){ m[x[0]] = x[1]; }); series(d2).forEach(function(x){ m2[x[0]] = x[1]; });
    var days = [];
    if(mn && mx){ for(var t = new Date(mn + 'T00:00:00Z'), b = new Date(mx + 'T00:00:00Z'); t <= b; t = new Date(t.getTime() + 864e5)) days.push(t.toISOString().slice(0,10)); }
    else days = Object.keys(m).sort();
    if(!days.length) return '';
    var tot = days.map(function(k){ return (m[k] || 0) + (m2[k] || 0); }), max = Math.max.apply(null, tot.concat([1])), scale = max * 1.18;
    var sum = tot.reduce(function(a, v){ return a + v; }, 0), avg = sum / days.length, wdN = 0, wdS = 0, pk = tot.indexOf(max), lastNz = -1; tot.forEach(function(v, i){ if(v) lastNz = i; });
    days.forEach(function(k, i){ var w = new Date(k + 'T00:00:00Z').getUTCDay(); if(w !== 0 && w !== 6){ wdN++; wdS += tot[i]; } }); if(days.length >= 7 && wdN) avg = wdS / wdN;
    var cells = days.map(function(k, i){
      var a = m[k] || 0, b2 = m2[k] || 0, wd = new Date(k + 'T00:00:00Z').getUTCDay(), we = (wd === 0 || wd === 6);
      var seg = b2 ? '<i style="height:' + (b2/scale*100).toFixed(1) + '%;background:' + color2 + '"></i>' : '';
      var bar = a ? '<i style="height:' + (a/scale*100).toFixed(1) + '%;background:' + color + '"></i>' : '';
      return '<div class="c' + (we ? ' we' : '') + (i === pk ? ' pk' : '') + '"><div class="st" style="--h:' + ((a + b2)/scale*100).toFixed(1) + '%">' + (a + b2 && (i === pk || i === lastNz || (a + b2) >= avg*1.5) ? '<span class="v">' + (a + b2) + '</span>' : '') + seg + bar + '</div></div>';
    }).join('');
    var lbls = days.map(function(k, i){ return '<div class="' + (new Date(k + 'T00:00:00Z').getUTCDay() % 6 === 0 ? 'we' : '') + '">' + (days.length <= 31 || i % 2 === 0 ? +k.slice(8,10) : '') + '</div>'; }).join('');
    return '<div class="tv-b2" dir="' + (AR() ? 'rtl' : 'ltr') + '" style="--n:' + days.length + '"><div class="plot"><div class="g" style="bottom:' + (max/scale*100).toFixed(1) + '%"></div><div class="g" style="bottom:' + (max/scale*50).toFixed(1) + '%"></div>'
      + '<div class="avg" style="bottom:' + (avg/scale*100).toFixed(1) + '%"></div><div class="avgl">' + E(T('tv.avgWd','avg')) + ' ' + tvn(avg.toFixed(avg < 10 ? 1 : 0)) + '</div><div class="row">' + cells + '</div></div><div class="days">' + lbls + '</div></div>';
  }
  function dchip(cur, prev, badUp){
    if(prev === undefined || prev === null || isNaN(prev) || !prev) return '';
    var diff = (cur - prev)/Math.abs(prev)*100; if(Math.abs(diff) < 0.05) return '<span class="tv-chip sm">= 0%</span>'; var up = diff >= 0, good = badUp ? !up : up;
    return '<span class="tv-chip sm ' + (good ? 'ok' : 'bad') + '">' + (up ? '▲' : '▼') + ' ' + tvn(Math.abs(diff).toFixed(Math.abs(diff) < 100 ? 1 : 0) + '%') + '</span>';
  }
  function axis(d){
    var s = series(d); if(s.length < 2) return '';
    var f = function(k){ return k.slice(8,10) + '/' + k.slice(5,7); };
    return '<div class="tv-axis" dir="' + (AR() ? 'rtl' : 'ltr') + '"><span>' + f(s[0][0]) + '</span><span>' + f(s[s.length-1][0]) + '</span></div>';
  }
  function gauge(rate, target){
    var max = Math.max(5, Math.ceil(Math.max(rate, target) * 1.6)), R = 80, L = Math.PI * R, f = Math.max(0, Math.min(1, rate/max));
    var a = Math.PI * (1 - Math.min(1, target/max)), c = Math.cos(a), s = Math.sin(a), col = rate > target ? 'var(--bad)' : 'var(--ok)';
    var arc = 'M20 100 A80 80 0 0 1 180 100';
    return '<svg class="tv-gauge" viewBox="0 0 200 118" aria-hidden="true"><path d="' + arc + '" fill="none" stroke="rgba(255,255,255,.1)" stroke-width="18" stroke-linecap="round"/>'
      + '<path d="' + arc + '" fill="none" stroke="' + col + '" stroke-width="18" stroke-linecap="round" stroke-dasharray="' + (L*f).toFixed(1) + ' ' + L.toFixed(1) + '" style="filter:drop-shadow(0 0 6px ' + col + ')"/>'
      + '<line x1="' + (100 + (R-17)*c).toFixed(1) + '" y1="' + (100 - (R-17)*s).toFixed(1) + '" x2="' + (100 + (R+17)*c).toFixed(1) + '" y2="' + (100 - (R+17)*s).toFixed(1) + '" stroke="var(--text)" stroke-width="3.5" stroke-linecap="round"/></svg>';
  }
  function ring(parts, centerHtml){
    return '<div class="tv-ring">' + donut(parts) + '<div class="c">' + centerHtml + '</div></div>';
  }
  function ribbon(d){
    if(!d || !d.dMin || !d.dMax) return '';
    var y = +d.dMin.slice(0,4), m = +d.dMin.slice(5,7), n = new Date(Date.UTC(y, m, 0)).getUTCDate(), cells = '', pad = function(v){ return ('0' + v).slice(-2); }, today = new Date().toISOString().slice(0,10);
    for(var i = 1; i <= n; i++){ var k = y + '-' + pad(m) + '-' + pad(i), w = new Date(k + 'T00:00:00Z').getUTCDay(); cells += '<i class="' + (k >= d.dMin && k <= d.dMax ? 'cv' : '') + (w === 0 || w === 6 ? ' we' : '') + (k === today ? ' td' : '') + '"></i>'; }
    return '<div class="tv-rib" dir="' + (AR() ? 'rtl' : 'ltr') + '" style="--n:' + n + '">' + cells + '</div>';
  }
  function countUp(el){
    var s0 = el.textContent, m = /^(-?[\d,]*\.?\d+)(.*)$/.exec(s0);
    if(!m || (window.matchMedia && matchMedia('(prefers-reduced-motion:reduce)').matches)) return;
    var end = parseFloat(m[1].replace(/,/g, '')), dec = (m[1].split('.')[1] || '').length, t0 = performance.now(), comma = m[1].indexOf(',') >= 0;
    (function f(t){
      if(!root || !el.isConnected) return;
      var pr = Math.min(1, (t - t0)/900), v = end * (1 - Math.pow(1 - pr, 3));
      el.textContent = (comma ? v.toLocaleString('en-US', {maximumFractionDigits: dec}) : v.toFixed(dec)) + m[2];
      if(pr < 1) requestAnimationFrame(f); else el.textContent = s0;
    })(t0);
  }
  function status(d){ return d.rate > d.target ? 'bad' : 'ok'; }
  function lbl(k, fb){ return '<div class="tv-label">' + E(T(k, fb)) + '</div>'; }
  function highlights(d){
    var p = d.prev; if(!p) return '';
    var items = [
      [T('tv.sh.net','Net value'), dchip(d.net, p.netCollected)],
      [T('tv.sh.ren','Renewals'), dchip(d.ren, p.renewalLeaseContracts)],
      [T('tv.sh.rent','New lease value'), dchip(d.rent, p.leaseRentValue)],
      [T('tv.sh.req','Requests'), dchip(d.reqs, p.totalRequests)],
      [T('tv.sh.bnc','Bounced'), dchip(d.bounced, p.bouncedAmount, true)]
    ].filter(function(x){ return x[1]; });
    if(!items.length) return '';
    return '<div class="tv-ticker"><span class="cap">' + E(T('tv.vsPrev','vs')) + ' ' + E(monthLabel(prevKey(currentMonth))) + ' ' + tvn(p.period ? '(' + p.period + ')' : '') + '</span>' + items.map(function(x){ return '<span class="it">' + E(x[0]) + ' ' + x[1] + '</span>'; }).join('') + '</div>';
  }
  function sHeadline(d){
    var p = d.prev || {};
    var tile = function(label, body){ return '<div class="tv-card tv-tile">' + lbl(label[0], label[1]) + '<div class="tb">' + body + '</div></div>'; };
    return '<div class="tv-row">'
      + '<div class="tv-card tv-hero glow">' + lbl('tv.net','Net recorded value')
      + '<div class="tv-val"><small>' + CUR() + '</small>' + cv(d.net) + '</div>'
      + '<div class="tv-sub">' + dchip(d.net, p.netCollected) + ' <span style="margin-inline-start:.8rem">' + E(T('tv.total','Total recorded value')) + ' <b>' + money(d.total) + '</b></span></div>'
      + '<div class="tv-herochart"><span class="tv-cap">' + E(T('tv.dailyVal','Daily cheque value')) + '</span>' + area(d.dChq, 'var(--accent)') + marks(d.dChq) + axis(d.dChq) + '</div></div>'
      + '<div class="tv-col">'
      + tile(['tv.bounceRate','Bounce rate'], '<div class="gw">' + bullet(d.rate, d.target) + '</div><div class="gn"><div class="v ' + status(d) + '">' + tvn(d.rate.toFixed(1) + '%') + '</div><div class="s">' + (status(d) === 'ok' ? '✓ ' : '▲ ') + E(status(d) === 'ok' ? T('tv.within','Within target') : T('tv.above','Above target')) + '</div></div>')
      + tile(['tv.contracts','Lease contracts'], '<div class="gn"><div class="v">' + tvn(N(d.ren + d.nw)) + ' ' + dchip(d.ren + d.nw, (p.renewalLeaseContracts != null && p.newLeaseContracts != null) ? p.renewalLeaseContracts + p.newLeaseContracts : null) + '</div><div class="s">' + tvn(N(d.ren)) + ' ' + E(T('tv.renewal','Renewal')) + ' · ' + tvn(N(d.nw)) + ' ' + E(T('tv.new','New')) + '</div></div><div class="gw">' + area(d.dRen, 'var(--accent2)') + '</div>')
      + tile(['tv.requests','Requests processed'], '<div class="gn"><div class="v">' + tvn(N(d.reqs)) + ' ' + dchip(d.reqs, p.totalRequests) + '</div><div class="s">' + money(d.reqVal) + '</div></div><div class="gw">' + cols(d.dReq, 'var(--accent)') + '</div>')
      + '</div></div>' + highlights(d);
  }
  function sBounce(d){
    var p = d.prev || {}, tot = d.bCount || 1, seg = [[d.legal,'var(--bad)','tv.legal','Under legal action'],[d.proc,'var(--amber)','tv.process','Under process'],[d.paid,'var(--ok)','tv.paid','Paid']];
    var peak = series(d.dBounce).reduce(function(m, x){ return x[1] > m ? x[1] : m; }, 0);
    return '<div class="tv-row">'
      + '<div class="tv-card" style="flex:1.1">' + lbl('tv.bounceRate','Bounce rate') + '<div class="tv-big ' + status(d) + '" style="font-size:7.5rem">' + tvn(d.rate.toFixed(1) + '%') + '</div>'
      + bullet(d.rate, d.target, true)
      + '<div class="tv-sub" style="margin-top:1.4rem">' + (status(d) === 'ok' ? '✓ ' : '▲ ') + E(status(d) === 'ok' ? T('tv.within','Within target') : T('tv.above','Above target')) + '</div></div>'
      + '<div class="tv-card" style="flex:1.5">' + lbl('tv.bounced','Bounced value') + '<div class="tv-big" style="font-size:5.4rem;margin-top:.6rem"><small style="display:inline;font-size:2rem;margin-inline-end:.8rem">' + CUR() + '</small>' + cv(d.bounced) + '</div>'
      + '<div class="tv-sub">' + dchip(d.bounced, p.bouncedAmount, true) + ' ' + (AR() ? E(T('tv.cheques','cheques')) + ' ' + tvn(N(d.bCount)) : tvn(N(d.bCount)) + ' ' + E(T('tv.cheques','cheques'))) + '</div>'
      + '<div class="tv-stack">' + seg.map(function(x){ return '<i style="flex:' + (x[0] || 0.0001) + ';background:' + x[1] + '"></i>'; }).join('') + '</div>'
      + '<div class="tv-segs">' + seg.map(function(x){ return '<div><div class="n" style="color:' + x[1] + '">' + tvn(N(x[0])) + '</div><div class="s">' + E(T(x[2], x[3])) + '</div></div>'; }).join('') + '</div></div>'
      + '<div class="tv-card" style="flex:1">' + lbl('tv.unitType','Unit type') + '<div class="tv-legend" style="margin-top:.6rem;gap:.4rem"><div class="tv-bigrow"><i style="background:var(--accent)"></i><span class="n">' + tvn(N(d.resid)) + '</span><span class="s">' + E(T('tv.residential','Residential')) + '</span></div><div class="tv-bigrow"><i style="background:var(--accent2)"></i><span class="n">' + tvn(N(d.comm)) + '</span><span class="s">' + E(T('tv.commercial','Commercial')) + '</span></div></div><div class="tv-stack" style="margin-top:auto">' + [[d.resid,'var(--accent)'],[d.comm,'var(--accent2)']].map(function(x){ return '<i style="flex:' + (x[0] || 0.0001) + ';background:' + x[1] + '"></i>'; }).join('') + '</div>'
      + '</div></div>'
      + '<div class="tv-card" style="flex:.8">' + lbl('tv.dailyBounced','Bounced cheques per day') + '<div class="tv-chart">' + bars(d.dBounce, 'var(--bad)', d.dMin, d.dMax) + '</div>' + '</div>';
  }
  function sLease(d){
    var p = d.prev || {}, tot = d.ren + d.nw, pct = tot ? Math.round(d.ren/tot*100) : 0;
    var m = Math.max.apply(null, series(d.dRen).concat(series(d.dNew)).map(function(x){ return x[1]; }).concat([1]));
    return '<div class="tv-row">'
      + '<div class="tv-card" style="flex:1">' + lbl('tv.contracts','Lease contracts') + '<div class="tv-big" style="font-size:7.5rem">' + tvn(N(tot)) + '</div>'
      + '<div class="tv-sub">' + dchip(tot, (p.renewalLeaseContracts != null && p.newLeaseContracts != null) ? p.renewalLeaseContracts + p.newLeaseContracts : null) + '</div>'
      + '<div class="tv-stack">' + [[d.ren,'var(--accent)'],[d.nw,'var(--accent2)']].map(function(x){ return '<i style="flex:' + (x[0] || 0.0001) + ';background:' + x[1] + '"></i>'; }).join('') + '</div></div>'
      + '<div class="tv-card" style="flex:1.1"><div class="tv-legend" style="margin:auto 0"><div class="tv-bigrow"><i style="background:var(--accent)"></i><span class="n">' + tvn(N(d.ren)) + '</span><span class="s">' + E(T('tv.renewal','Renewal')) + ' · ' + tvn(pct + '%') + '</span></div>'
      + '<div class="tv-bigrow"><i style="background:var(--accent2)"></i><span class="n">' + tvn(N(d.nw)) + '</span><span class="s">' + E(T('tv.new','New')) + ' ' + dchip(d.nw, p.newLeaseContracts) + '</span></div></div></div>'
      + '<div class="tv-card tv-hero2" style="flex:1.3">' + lbl('tv.newLeaseValue','New lease value') + '<div class="tv-val2"><small>' + CUR() + '</small>' + cv(d.rent) + '</div>'
      + '<div class="tv-sub">' + dchip(d.rent, p.leaseRentValue) + ' <span style="margin-inline-start:.8rem">' + E(T('tv.fees','Fees collected')) + ' <b>' + money(d.fees) + '</b></span></div><div class="tv-herochart sp"><span class="tv-cap">' + E(T('tv.newPerDay','New leases per day')) + '</span>' + cols(fullMonth(d.dNew, d), 'var(--accent2)') + '</div></div></div>'
      + '<div class="tv-card" style="flex:.8">' + lbl('tv.dailyLease','Lease contracts per day') + '<div class="tv-legend row"><span><i style="background:var(--accent)"></i>' + E(T('tv.renewal','Renewal')) + '</span><span><i style="background:var(--accent2)"></i>' + E(T('tv.new','New')) + '</span></div>' + '<div class="tv-chart">' + bars(d.dRen, 'var(--accent)', d.dMin, d.dMax, d.dNew, 'var(--accent2)') + '</div>' + '</div>';
  }
  function sRequests(d){
    var p = d.prev || {}, top = d.reqTypes.slice(0, 3), max = top.length ? top[0][1] : 1;
    return '<div class="tv-row short"><div class="tv-card" style="flex:1">' + lbl('tv.requests','Requests processed') + '<div class="tv-big" style="margin-top:1rem;font-size:8rem">' + tvn(N(d.reqs)) + '</div>'
      + '<div class="tv-sub">' + dchip(d.reqs, p.totalRequests) + ' <span style="margin-inline-start:.8rem">' + E(T('tv.reqValue','Request value')) + ' <b>' + money(d.reqVal) + '</b></span></div>' + '</div>'
      + '<div class="tv-card" style="flex:1.5">' + lbl('tv.reqTypes','Request types') + '<div class="tv-bars">' + top.map(function(r, i){ return bar(r[0], r[1], max, i ? 'var(--accent2)' : 'var(--accent)'); }).join('') + '</div></div></div>'
      + '<div class="tv-card" style="flex:1.2">' + lbl('tv.dailyReq','Requests per day') + '<div class="tv-chart">' + bars(d.dReq, 'var(--accent)', d.dMin, d.dMax) + '</div>' + '</div>';
  }
  var RENDER = {headline:sHeadline, bounce:sBounce, lease:sLease, requests:sRequests};

  /* ---------- shell ---------- */

  function portfolioName(){
    var s = document.getElementById('portfolioSelect');
    return s && s.selectedOptions && s.selectedOptions[0] ? s.selectedOptions[0].textContent.trim() : '';
  }
  function clockText(){
    var d = new Date(), ar = document.documentElement.lang === 'ar';
    return {t: d.toLocaleTimeString('en-GB', {hour:'2-digit', minute:'2-digit'}),
            d: d.toLocaleDateString(ar ? 'ar-AE-u-nu-latn' : 'en-GB', {weekday:'long', day:'numeric', month:'long', year:'numeric'})};
  }
  function pct1(a,b){ return b ? (a-b)/Math.abs(b)*100 : null; }
  function verdict(d){
    if(!d || d.unsupported || d.waiting) return '';
    var ok = status(d) === 'ok', out = '<span class="' + (ok ? 'ok' : 'bad') + '">' + E(ok ? T('tv.vOk','Bounce rate within target') : T('tv.vBad','Bounce rate above target')) + '</span>';
    var dp = d.prev ? pct1(d.net, d.prev.netCollected) : null;
    if(dp !== null && Math.abs(dp) >= 0.05) out += ' · ' + E(dp >= 0 ? T('tv.vUp','Net value up') : T('tv.vDown','Net value down')) + ' ' + tvn(Math.abs(dp).toFixed(Math.abs(dp) < 10 ? 1 : 0) + '%') + ' ' + E(T('tv.vsPrev','vs')) + ' ' + E(monthLabel(prevKey(currentMonth)));
    return '<div class="tv-verdict">' + out + '</div>';
  }
  function snapText(d){
    if(!d || !d.snap) return '';
    var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(d.snap); if(!m) return '';
    var age = Math.floor((Date.now() - Date.UTC(+m[1], +m[2]-1, +m[3]))/864e5);
    return {text: E(T('tv.asOf','Data as of')) + ' ' + tvn(m[3] + '/' + m[2] + '/' + m[1]) + (age > 3 ? ' · ' + tvn(String(age)) + ' ' + E(T('tv.daysOld','days old')) : ''), stale: age > 3};
  }
  function render(){
    if(!root) return;
    var d, c = clockText(), body;
    try{ d = collect(); }catch(e){ d = {waiting:true}; }
    if(d.unsupported) body = '<div class="tv-empty">' + E(T('tv.unsupported','TV mode is ready for the Awqaf portfolio. Switch to Awqaf to use it.')) + '</div>';
    else if(d.waiting) body = '<div class="tv-empty">' + E(T('tv.waiting','Waiting for the reports to finish loading')) + '</div>';
    else{ try{ body = RENDER[SLIDES[slide]](d); }catch(e){ body = '<div class="tv-empty">' + E(T('tv.waiting','Waiting for the reports to finish loading')) + '</div>'; } }
    var sn = snapText(d);
    root.innerHTML = '<div class="tv-hair"><span class="tv-prog" id="tvProg"></span></div><button class="tv-exit" type="button" id="tvExit">' + E(T('tv.exit','Exit')) + ' (Esc)</button><div class="tv-inner" id="tvInner">'
      + '<div class="tv-head"><div class="tv-id"><h1>' + E(portfolioName()) + '</h1><p>' + E(monthLabel(currentMonth)) + '</p></div>'
      + '<div class="tv-dots" role="tablist">' + SLIDES.map(function(k, i){ return '<div class="tv-dot' + (i === slide ? ' on' : '') + '">' + E(T('tv.s.' + k, k)) + '' + '</div>'; }).join('') + '</div>'
      + '<div class="tv-clock"><div class="t tvn">' + c.t + '</div><div class="d">' + E(c.d) + '</div></div></div>'
      + (slide === 0 ? verdict(d) : '') + '<div class="tv-stage" id="tvStage">' + body + '</div>'
      + ribbon(d) + '<div class="tv-foot"><span><span class="tv-dotstat" style="background:' + ((sn && sn.stale) || (d && d.health && d.health.status !== 'good') ? 'var(--amber)' : 'var(--ok)') + '"></span>' + E(T('tv.period','Period')) + ' ' + tvn(d && d.period ? d.period : '-') + (sn ? ' · <span' + (sn.stale ? ' class="stale"' : '') + '>' + sn.text + '</span>' : '') + '</span><span>' + E(T('tv.hint','Esc to exit · arrow keys to change slide · space to pause')) + '</span></div></div>';
    var ex = root.querySelector('#tvExit'); if(ex) ex.addEventListener('click', closeTv);
    applyDrift();
    if(enter){ enter = false; var stg = root.querySelector('#tvStage'); if(stg) stg.classList.add('tv-enter'); root.querySelectorAll('.tv-hero .tv-val .tvn, .tv-big .tvn, .tv-val2 .tvn').forEach(countUp); }
  }
  function go(delta){ slide = (slide + delta + SLIDES.length) % SLIDES.length; slideStart = Date.now(); enter = true; render(); }
  function updateClock(){ if(!root) return; var c = clockText(), a = root.querySelector('.tv-clock .t'), b = root.querySelector('.tv-clock .d'); if(a) a.textContent = c.t; if(b) b.textContent = c.d; }
  function applyDrift(){ var el = root && root.querySelector('#tvInner'); if(el) el.style.transform = 'translate(' + driftPx[0] + 'px,' + driftPx[1] + 'px)'; }
  function tick(){
    var p = root && root.querySelector('#tvProg'); if(!p || paused) return;
    p.style.width = Math.min(100, (Date.now() - slideStart)/SLIDE_MS*100) + '%';
    if(Date.now() - slideStart >= SLIDE_MS) go(1);
  }
  function onKey(ev){
    if(!root || !root.open) return;
    onMove();
    if(ev.key === 'ArrowRight'){ ev.preventDefault(); go(document.documentElement.dir === 'rtl' ? -1 : 1); }
    else if(ev.key === 'ArrowLeft'){ ev.preventDefault(); go(document.documentElement.dir === 'rtl' ? 1 : -1); }
    else if(ev.key === ' '){ ev.preventDefault(); paused = !paused; if(!paused) slideStart = Date.now(); }
  }
  function onMove(){
    if(!root) return; root.classList.add('tv-active'); clearTimeout(activeTimer);
    activeTimer = setTimeout(function(){ root && root.classList.remove('tv-active'); }, 3000);
  }
  function drift(){
    var o = [[0,0],[4,2],[-3,4],[2,-3],[-4,-2]]; driftPx = o[Math.floor(Date.now()/60000) % o.length]; applyDrift();
  }
  function lock(){ try{ if(!navigator.wakeLock || (wakeLock && !wakeLock.released)) return; navigator.wakeLock.request('screen').then(function(l){ if(!running){ l.release(); return; } wakeLock = l; }).catch(function(){}); }catch(e){} }
  function onVis(){ if(root && root.open && document.visibilityState === 'visible') lock(); }
  function onMsg(ev){ if(!(root && root.open && ev && ev.data && ev.data.__mdReportUpdated)) return; clearTimeout(msgT); msgT = setTimeout(function(){ if(root && root.open) render(); }, 500); }
  function onFs(){ if(!document.fullscreenElement && hadFullscreen && root && root.open){ hadFullscreen = false; closeTv(); } }

  function openTv(){
    if(running) return; running = true;
    triggerEl = document.activeElement;
    if(!root){
      root = document.createElement('dialog'); root.id = 'tvRoot'; root.setAttribute('aria-label', T('nav.tvAria','TV mode'));
      root.addEventListener('cancel', function(ev){ ev.preventDefault(); closeTv(); });
      root.addEventListener('mousemove', onMove); root.addEventListener('pointerdown', onMove); root.addEventListener('close', closeTv);
      document.body.appendChild(root);
    }
    slide = 0; paused = false; slideStart = Date.now(); enter = true;
    if(!root.open) root.showModal();
    render();
    try{ var r = document.documentElement.requestFullscreen && document.documentElement.requestFullscreen(); if(r && r.then) r.then(function(){ if(!running){ try{ document.exitFullscreen(); }catch(e){} return; } hadFullscreen = true; }).catch(function(){}); }catch(e){}
    lock();
    document.addEventListener('keydown', onKey, true); document.addEventListener('visibilitychange', onVis);
    window.addEventListener('message', onMsg); document.addEventListener('fullscreenchange', onFs);
    timer = setInterval(tick, 250); clockTimer = setInterval(updateClock, 15000); driftTimer = setInterval(drift, 60000);
    observer = new MutationObserver(function(){ render(); }); observer.observe(document.documentElement, {attributes:true, attributeFilter:['lang','dir','data-theme']});
  }
  function closeTv(){
    if(!running) return; running = false;
    clearTimeout(msgT);
    clearInterval(timer); clearInterval(clockTimer); clearInterval(driftTimer); clearTimeout(activeTimer);
    document.removeEventListener('keydown', onKey, true); document.removeEventListener('visibilitychange', onVis);
    window.removeEventListener('message', onMsg); document.removeEventListener('fullscreenchange', onFs);
    if(observer){ observer.disconnect(); observer = null; }
    try{ if(wakeLock){ wakeLock.release(); wakeLock = null; } }catch(e){}
    hadFullscreen = false;
    try{ if(document.fullscreenElement && document.exitFullscreen) document.exitFullscreen(); }catch(e){}
    if(root && root.open) root.close();
    if(triggerEl && triggerEl.focus) try{ triggerEl.focus(); }catch(e){}
  }
  var btn = document.getElementById('tvBtn'); if(btn) btn.addEventListener('click', openTv);
  window.__mdOpenTv = openTv; window.__mdCloseTv = closeTv;
  try{ if(typeof applyI18n === 'function') applyI18n(); }catch(e){}
})();
