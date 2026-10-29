/* Dubai Court report page runtime (runs INSIDE each court report iframe).
   Built by scripts/build_v33.py. Placeholders replaced at build time: __PAGE__ (occ|coll|dist).
   __COURT_MONTH__ is replaced by the shell (mountEmbeddedDashboard) with the month picked in the header.
   Data = the verified figures from For Data.xlsx (Master Sheet / Payments / Expenses); nothing here
   reads or stores tenant phone numbers, e-mails or names. */
(function(){
'use strict';
var D = JSON.parse(document.getElementById('dcData').textContent);
var I = JSON.parse(document.getElementById('dcI18n').textContent);
var L = I.L, DEFS = I.DEFS, DQAR = I.DQAR, REVMAP = {};
Object.keys(L.en).forEach(function(k){ if(typeof L.en[k] === 'string' && typeof L.ar[k] === 'string') REVMAP[L.en[k]] = L.ar[k]; });
var PAGE = '__PAGE__';
var MONTH = '__COURT_MONTH__';
if(!/^\d{4}-\d{2}$/.test(MONTH)) MONTH = D.defaultMonth;
var S = {lang:'en', scope:'all', q:'', up:90, ub:'m', open:{}, defs:false};
var DAY = 86400000;
function t(k){ var v = L[S.lang][k]; return v !== undefined ? v : L.en[k]; }
function $(id){ return document.getElementById(id); }
function esc(s){ return String(s).replace(/[&<>"]/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]; }); }
function fmt(n){ return Math.round(n).toLocaleString('en-US'); }
function pct(a, b){ return b ? (100*a/b).toFixed(1) + '%' : '-'; }
function mShort(m){ var n = t('mo')[+m.slice(5)-1]; return S.lang === 'ar' ? n : n.slice(0,3) + ' ' + m.slice(2,4); }
function mLabel(m){ return t('mo')[+m.slice(5)-1] + ' ' + m.slice(0,4); }
var CI = {}, EI = {};
(D.collFields || []).forEach(function(f,i){ CI[f] = i; });
(D.expFields || []).forEach(function(f,i){ EI[f] = i; });
var LLN = {}; D.lls.forEach(function(l){ LLN[l.k] = l.name; });
var PROP = {}; D.props.forEach(function(p){ PROP[p.k] = p; });
function ytd(m){ return D.months.filter(function(x){ return x.slice(0,4) === m.slice(0,4) && x <= m; }); }
function asofDate(){ var y = +MONTH.slice(0,4), mo = +MONTH.slice(5); return new Date(Date.UTC(y, mo, 0)); }
var M1 = [MONTH], Y1 = ytd(MONTH);
function cv(pk, ms, f){ return ms.reduce(function(a,m){ var r = (D.coll || {})[pk + '|' + m]; return a + (r ? r[CI[f]] : 0); }, 0); }
function ev(pk, ms, f){ return ms.reduce(function(a,m){ var r = (D.exp || {})[pk + '|' + m]; return a + (r ? r[EI[f]] : 0); }, 0); }
function evPend(pk, f){ var r = (D.exp || {})[pk + '|pending']; return r ? r[EI[f]] : 0; }
function evCat(pk, ms, c){ return ms.reduce(function(a,m){ return a + (((D.expc || {})[pk + '|' + m + '|' + c]) || 0); }, 0); }
function plKey(l){ return 'LL:' + l; }
function propsOf(l){ return D.props.filter(function(p){ return p.ll === l; }); }
function scopeLLs(){ return D.lls.filter(function(l){ return S.scope === 'all' || S.scope === l.k; }); }
function scopeKeys(){ var ks = []; scopeLLs().forEach(function(l){ propsOf(l.k).forEach(function(p){ ks.push(p.k); }); ks.push(plKey(l.k)); }); return ks; }
function sumKeys(f, ks, ms, fld){ return ks.reduce(function(a,k){ return a + f(k, ms, fld); }, 0); }
function match(l, name){ var q = S.q.trim().toLowerCase(); if(!q) return true; return name.toLowerCase().indexOf(q) >= 0 || LLN[l].toLowerCase().indexOf(q) >= 0; }
function occ(pk, win){
  var us = (D.units || []).filter(function(u){ return u[0] === pk; }), a = asofDate().getTime();
  if(win === undefined) win = S.up;
  var tot = us.length, r = 0, v = 0, u0 = 0, ip = 0, ex = 0, up = 0;
  us.forEach(function(u){
    if(u[2] === 'R') r++; else if(u[2] === 'V') v++; else u0++;
    if(u[2] === 'R' && u[3]){ var d = (new Date(u[3] + 'T00:00:00Z').getTime() - a) / DAY; if(d <= 30){ ip++; if(d < 0) ex++; } else if(d <= win) up++; }
  });
  return [tot, r, v, u0, ip, up, ex];
}
function v1(pk){ return occ(pk); }
function v2(pk){ var b = S.ub === 'm' ? M1 : Y1;
  return [cv(pk,M1,'rent'), cv(pk,Y1,'rent'), cv(pk,M1,'nrent'), cv(pk,Y1,'nrent'), cv(pk,M1,'other'), cv(pk,Y1,'other'), cv(pk,b,'hold'), cv(pk,b,'bounced'), cv(pk,b,'pending')]; }
function v3(pk){ return [ev(pk,M1,'dist'), ev(pk,Y1,'dist'), ev(pk,M1,'exp'), ev(pk,Y1,'exp'), ev(pk,Y1,'pmfee'), ev(pk,Y1,'courtrent'), evPend(pk,'pend_dist') + evPend(pk,'pend_exp')]; }
var SEC = {
  occ:{v:v1, cols:[['totalUnits',0,'i'],['rented',1,'i'],['vacant',2,'i'],['unknown',3,'i'],['occPct',[1,0],'p'],['inProg',4,'i'],['upcoming',5,'i']],
       has:function(pk){ return (D.units || []).some(function(u){ return u[0] === pk; }); }, pl:false, title:'s1'},
  coll:{v:v2, cols:[['rentM',0,'a'],['rentY',1,'a'],['chqM',2,'i'],['chqY',3,'i'],['othM',4,'a'],['othY',5,'a'],['hold',6,'a'],['bounced',7,'a'],['pend',8,'a'],['uncol',[6,7,8],'s']],
       has:function(pk){ return D.months.some(function(m){ return (D.coll || {})[pk + '|' + m]; }); }, pl:false, title:'s2'},
  dist:{v:v3, cols:[['distM',0,'a'],['distY',1,'a'],['expM',2,'a'],['expY',3,'a'],['pmY',4,'a'],['crY',5,'a'],['unpaid',6,'a']],
       has:function(pk){ return D.months.concat(['pending']).some(function(m){ return (D.exp || {})[pk + '|' + m]; }); }, pl:true, title:'s3'}
}[PAGE];
function cell(c, vals){
  var ix = c[1], k = c[2];
  if(k === 'p') return '<span class="num">' + pct(vals[ix[0]], vals[ix[1]]) + '</span>';
  if(k === 's') return '<span class="num">' + fmt(ix.reduce(function(a,i){ return a + vals[i]; }, 0)) + '</span>';
  var v = vals[ix], cls = '';
  if(c[0] === 'bounced' && v) cls = 'bad';
  if(c[0] === 'hold' && v) cls = 'amber';
  return '<span class="num ' + cls + '">' + fmt(v) + '</span>';
}
function addv(a, b){ return a ? a.map(function(x,i){ return x + b[i]; }) : b.slice(); }
function buildRows(){
  var rows = [];
  scopeLLs().forEach(function(l){
    var kids = [];
    propsOf(l.k).forEach(function(p){ if(SEC.has(p.k) && match(l.k, p.name)) kids.push({name:p.name, vals:SEC.v(p.k), pl:false}); });
    if(SEC.pl && SEC.has(plKey(l.k)) && match(l.k, t('plLevel'))) kids.push({name:t('plLevel'), vals:SEC.v(plKey(l.k)), pl:true});
    if(!kids.length) return;
    var tot = null; kids.forEach(function(k){ tot = addv(tot, k.vals); });
    rows.push({ll:l.k, name:l.name, vals:tot, kids:kids});
  });
  return rows;
}
function tableHTML(){
  var rows = buildRows(), grand = null; rows.forEach(function(r){ grand = addv(grand, r.vals); });
  var hdr = SEC.cols.map(function(c){ return '<th>' + esc(c[0] === 'uncol' ? t('uncolHdr') : t(c[0])) + '</th>'; }).join('');
  var h = '<div class="explore-table-scroll court-scroll"><table class="court"><thead><tr><th>' + esc(t('portfolio')) + ' / ' + esc(t('properties')) + '</th>' + hdr + '</tr></thead><tbody>';
  rows.forEach(function(r){
    var key = PAGE + r.ll, open = S.open[key] || S.q.trim();
    h += '<tr class="ll"><td><button class="tg" data-k="' + key + '" aria-expanded="' + (!!open) + '" aria-label="' + esc(t('toggle')) + '">' + (open ? '▾' : '▸') + '</button><bdi>' + esc(r.name) + '</bdi> <span class="pill">' + r.kids.length + '</span></td>' + SEC.cols.map(function(c){ return '<td>' + cell(c, r.vals) + '</td>'; }).join('') + '</tr>';
    if(open) r.kids.forEach(function(k){ h += '<tr class="pr' + (k.pl ? ' pl' : '') + '"><td><bdi>' + esc(k.name) + '</bdi></td>' + SEC.cols.map(function(c){ return '<td>' + cell(c, k.vals) + '</td>'; }).join('') + '</tr>'; });
  });
  if(rows.length && grand) h += '<tr class="tot"><td>' + esc(t('total')) + '</td>' + SEC.cols.map(function(c){ return '<td>' + cell(c, grand) + '</td>'; }).join('') + '</tr>';
  else h += '<tr><td colspan="' + (SEC.cols.length + 1) + '" class="empty-note">' + esc(t('noData')) + '</td></tr>';
  return h + '</tbody></table></div>';
}
function nice(v){ return v >= 1e6 ? (v/1e6).toFixed(1) + 'M' : v >= 1e3 ? Math.round(v/1e3) + 'K' : String(Math.round(v)); }
function barSVG(labels, series, o){
  o = o || {};
  var W = 640, H = 230, pl = 44, pr = 10, pt = 10, pb = 30, iw = W - pl - pr, ih = H - pt - pb;
  var stack = o.stack !== false;
  var tot = labels.map(function(_, i){ return stack ? series.reduce(function(a,s){ return a + s.v[i]; }, 0) : Math.max.apply(null, series.map(function(s){ return s.v[i]; })); });
  var mx = Math.max(1, Math.max.apply(null, tot)), bw = iw / labels.length, g = '';
  for(var i = 0; i <= 4; i++){ var y = pt + ih - ih*i/4; g += '<line x1="' + pl + '" x2="' + (W-pr) + '" y1="' + y + '" y2="' + y + '" stroke="var(--border)"/><text x="' + (pl-6) + '" y="' + (y+4) + '" text-anchor="end">' + nice(mx*i/4) + '</text>'; }
  labels.forEach(function(lb, i){
    var x0 = pl + i*bw;
    if(stack){ var acc = 0; series.forEach(function(s){ var h = ih*s.v[i]/mx; g += '<rect x="' + (x0+bw*.15) + '" y="' + (pt+ih-acc-h) + '" width="' + (bw*.7) + '" height="' + Math.max(0,h) + '" fill="' + s.c + '"><title>' + esc(lb + ' - ' + s.n + ': ' + fmt(s.v[i])) + '</title></rect>'; acc += h; }); }
    else { var n = series.length, w = bw*.8/n; series.forEach(function(s, j){ var h = ih*s.v[i]/mx; g += '<rect x="' + (x0+bw*.1+j*w) + '" y="' + (pt+ih-h) + '" width="' + (w-1) + '" height="' + Math.max(0,h) + '" fill="' + s.c + '"><title>' + esc(lb + ' - ' + s.n + ': ' + fmt(s.v[i])) + '</title></rect>'; }); }
    if(labels.length <= 14 || i % 2 === 0) g += '<text x="' + (x0+bw/2) + '" y="' + (H-10) + '" text-anchor="middle">' + esc(lb) + '</text>';
  });
  return '<svg viewBox="0 0 ' + W + ' ' + H + '" width="100%" role="img" aria-label="' + esc(o.label || '') + '">' + g + '</svg>';
}
function donutSVG(parts, label, centerFn){
  var tot = parts.reduce(function(a,p){ return a + p.v; }, 0) || 1, a0 = -Math.PI/2, g = '', R = 70, r = 44, cx = 90, cy = 90;
  parts.forEach(function(p){
    if(!p.v) return;
    var a1 = a0 + 2*Math.PI*p.v/tot - 1e-4, big = a1 - a0 > Math.PI ? 1 : 0;
    var x0 = cx+R*Math.cos(a0), y0 = cy+R*Math.sin(a0), x1 = cx+R*Math.cos(a1), y1 = cy+R*Math.sin(a1), x2 = cx+r*Math.cos(a1), y2 = cy+r*Math.sin(a1), x3 = cx+r*Math.cos(a0), y3 = cy+r*Math.sin(a0);
    g += '<path d="M' + x0 + ' ' + y0 + ' A' + R + ' ' + R + ' 0 ' + big + ' 1 ' + x1 + ' ' + y1 + ' L' + x2 + ' ' + y2 + ' A' + r + ' ' + r + ' 0 ' + big + ' 0 ' + x3 + ' ' + y3 + 'Z" fill="' + p.c + '" stroke="var(--card)" stroke-width="2"><title>' + esc(p.n + ': ' + fmt(p.v)) + '</title></path>';
    a0 = a1 + 1e-4;
  });
  return '<svg class="court-donut" viewBox="0 0 180 180" width="180" role="img" aria-label="' + esc(label) + '">' + g + '<text x="90" y="95" text-anchor="middle" style="font-size:18px;font-weight:700;fill:var(--text)">' + esc(centerFn ? centerFn(tot) : '') + '</text></svg>';
}
function legend(items){ return '<div class="legend">' + items.map(function(i){ return '<span><i style="background:' + i.c + '"></i>' + esc(i.n) + '</span>'; }).join('') + '</div>'; }
var C = {rent:'var(--accent)', hold:'var(--amber)', bounce:'var(--bad)', pend:'var(--pend)', dist:'var(--accent2)', exp:'var(--amber)', ok:'var(--ok)'};
function last12(){ var i = D.months.indexOf(MONTH); return D.months.slice(Math.max(0, i-11), i+1); }
var COLL_NOTE_FIELDS = ['rent','hold','bounced','pending'];

/* ---------- figures (also exposed to the shell via __crossCheckData) ---------- */
function figures(){
  var ks = scopeKeys(), allKs = []; D.lls.forEach(function(l){ propsOf(l.k).forEach(function(p){ allKs.push(p.k); }); allKs.push(plKey(l.k)); });
  var f = {month:MONTH, asof:D.asof};
  if(PAGE === 'occ'){
    var tot = 0, r = 0, v = 0, u = 0, ip = 0, up = 0, ex = 0, props = 0, withUnits = {};
    allKs.forEach(function(k){ var o = occ(k, 90); tot += o[0]; r += o[1]; v += o[2]; u += o[3]; ip += o[4]; up += o[5]; ex += o[6]; if(o[0]) props++; });
    f.total_units = tot; f.rented = r; f.vacant = v; f.not_recorded = u; f.occupancy = tot ? r/tot : null;
    f.in_progress = ip; f.upcoming = up; f.expired = ex; f.property_count = props; f.portfolio_count = D.lls.length;
  } else if(PAGE === 'coll'){
    ['rent','nrent','other','hold','bounced','pending'].forEach(function(fld){ f[fld + '_m'] = sumKeys(cv, allKs, M1, fld); f[fld + '_y'] = sumKeys(cv, allKs, Y1, fld); });
    f.uncollected_m = f.hold_m + f.bounced_m + f.pending_m;
  } else {
    ['dist','exp','courtrent','pmfee'].forEach(function(fld){ f[fld + '_m'] = sumKeys(ev, allKs, M1, fld); f[fld + '_y'] = sumKeys(ev, allKs, Y1, fld); });
    f.pending = sumKeys(function(k){ return evPend(k,'pend_dist') + evPend(k,'pend_exp'); }, allKs, M1, '');
  }
  return f;
}

/* ---------- KPI tiles, charts, notes ---------- */
function kpiHTML(label, value, note){ return '<div class="kpi"><div class="label">' + esc(label) + '</div><div class="value"><span class="num">' + esc(value) + '</span></div><div class="note">' + esc(note || '') + '</div></div>'; }
function renderKpis(){
  var ks = scopeKeys(), h = '';
  if(PAGE === 'occ'){
    var tot = 0, r = 0, v = 0, u = 0, ip = 0, up = 0, ex = 0;
    ks.forEach(function(k){ var o = occ(k); tot += o[0]; r += o[1]; v += o[2]; u += o[3]; ip += o[4]; up += o[5]; ex += o[6]; });
    h += kpiHTML(t('totalUnits'), fmt(tot), u ? fmt(u) + ' ' + t('unknown').toLowerCase() : '');
    h += kpiHTML(t('occPct'), pct(r, tot), t('rented') + ' ' + fmt(r) + ' · ' + t('vacant') + ' ' + fmt(v));
    h += kpiHTML(t('rented'), fmt(r), '');
    h += kpiHTML(t('vacant'), fmt(v), '');
    h += kpiHTML(t('inProg'), fmt(ip), t('expiredLbl') + ': ' + fmt(ex));
    h += kpiHTML(t('upcoming'), fmt(up), t('upWin') + ': ' + S.up + ' ' + t('days'));
  } else if(PAGE === 'coll'){
    var rM = sumKeys(cv,ks,M1,'rent'), rY = sumKeys(cv,ks,Y1,'rent'), nM = sumKeys(cv,ks,M1,'nrent'), nY = sumKeys(cv,ks,Y1,'nrent'), oM = sumKeys(cv,ks,M1,'other'), oY = sumKeys(cv,ks,Y1,'other');
    var b = S.ub === 'm' ? M1 : Y1, hd = sumKeys(cv,ks,b,'hold'), bn = sumKeys(cv,ks,b,'bounced'), pd = sumKeys(cv,ks,b,'pending');
    h += kpiHTML(t('rentM'), fmt(rM), t('rentY') + ': ' + fmt(rY));
    h += kpiHTML(t('chqM'), fmt(nM), t('chqY') + ': ' + fmt(nY));
    h += kpiHTML(t('othM'), fmt(oM), t('othY') + ': ' + fmt(oY));
    h += kpiHTML(t('uncol'), fmt(hd + bn + pd), t('uncolBasis') + ': ' + (S.ub === 'm' ? t('basisM') : t('basisY')));
    h += kpiHTML(t('hold'), fmt(hd), '');
    h += kpiHTML(t('bounced'), fmt(bn), t('pend') + ': ' + fmt(pd));
  } else {
    var dM = sumKeys(ev,ks,M1,'dist'), dY = sumKeys(ev,ks,Y1,'dist'), eM = sumKeys(ev,ks,M1,'exp'), eY = sumKeys(ev,ks,Y1,'exp'), pm = sumKeys(ev,ks,Y1,'pmfee'), cr = sumKeys(ev,ks,Y1,'courtrent');
    var pe = ks.reduce(function(a,k){ return a + evPend(k,'pend_dist') + evPend(k,'pend_exp'); }, 0);
    h += kpiHTML(t('distM'), fmt(dM), t('distY') + ': ' + fmt(dY));
    h += kpiHTML(t('expM'), fmt(eM), t('expY') + ': ' + fmt(eY));
    h += kpiHTML(t('distY'), fmt(dY), '');
    h += kpiHTML(t('expY'), fmt(eY), t('pmY') + ': ' + fmt(pm));
    h += kpiHTML(t('crY'), fmt(cr), '');
    h += kpiHTML(t('unpaid'), fmt(pe), '');
  }
  $('kpis').innerHTML = h;
}
function chartOcc(){
  var ks = scopeKeys(), r = 0, v = 0, u = 0;
  ks.forEach(function(k){ var o = occ(k); r += o[1]; v += o[2]; u += o[3]; });
  var parts = [{n:t('rented'), v:r, c:C.ok}, {n:t('vacant'), v:v, c:C.hold}, {n:t('unknown'), v:u, c:C.pend}];
  return '<div class="card c-half"><h3>' + esc(t('cOcc')) + '</h3><div class="court-donut-row">' + donutSVG(parts, t('cOcc'), function(tot){ return pct(parts[0].v, tot); }) + legend(parts.map(function(p){ return {n:p.n + ' (' + p.v + ')', c:p.c}; })) + '</div></div>';
}
function chartExp(){
  var ks = scopeKeys(), a = asofDate(), ms = [], y = a.getUTCFullYear(), m = a.getUTCMonth() + 1;
  for(var i = 0; i < 12; i++){ ms.push(y + '-' + String(m).padStart(2,'0')); m++; if(m > 12){ m = 1; y++; } }
  var cnt = ms.map(function(){ return 0; });
  D.units.filter(function(u){ return ks.indexOf(u[0]) >= 0 && u[2] === 'R' && u[3]; }).forEach(function(u){ var i = ms.indexOf(u[3].slice(0,7)); if(i >= 0) cnt[i]++; });
  return '<div class="card c-half"><h3>' + esc(t('cEx')) + '</h3>' + barSVG(ms.map(mShort), [{n:t('rented'), c:C.rent, v:cnt}], {label:t('cEx')}) + '</div>';
}
function renewalList(){
  var a = asofDate().getTime(), ks = scopeKeys();
  var us = D.units.filter(function(u){ return ks.indexOf(u[0]) >= 0 && u[2] === 'R' && u[3]; }).map(function(u){ return {u:u, d:Math.round((new Date(u[3] + 'T00:00:00Z').getTime() - a)/DAY)}; })
    .filter(function(x){ return x.d <= S.up; }).filter(function(x){ return match(PROP[x.u[0]].ll, x.u[0]); }).sort(function(p,q){ return p.d - q.d; });
  var h = '<div class="card c-wide"><h3>' + esc(t('inProg')) + ' / ' + esc(t('upcoming')) + ' (' + us.length + ')</h3><div class="explore-table-scroll court-scroll" style="max-height:420px;overflow:auto"><table class="court"><thead><tr><th>' + esc(t('properties')) + '</th><th>' + esc(t('unit')) + '</th><th>' + esc(t('contract')) + '</th><th>' + esc(t('endDate')) + '</th><th>' + esc(t('daysLeft')) + '</th><th>' + esc(t('rent')) + ' (' + esc(t('aed')) + ')</th><th>' + esc(t('legal')) + '</th></tr></thead><tbody>';
  if(!us.length) h += '<tr><td colspan="7" class="empty-note">' + esc(t('noData')) + '</td></tr>';
  us.forEach(function(x){ var u = x.u; h += '<tr><td><bdi>' + esc(u[0]) + '</bdi></td><td><bdi>' + esc(u[1]) + '</bdi></td><td>' + esc(u[6] || '-') + '</td><td><span class="num">' + u[3] + '</span></td><td><span class="num ' + (x.d < 0 ? 'bad' : x.d <= 30 ? 'amber' : '') + '">' + x.d + '</span></td><td><span class="num">' + (u[4] ? fmt(u[4]) : '-') + '</span></td><td>' + (u[5] ? esc(t('yes')) : '') + '</td></tr>'; });
  return h + '</tbody></table></div></div>';
}
function chartColl(){
  var ms = last12(), ks = scopeKeys();
  var ser = [['legRent','rent',C.rent],['legHold','hold',C.hold],['legBounce','bounced',C.bounce],['legPend','pending',C.pend]].map(function(a){ return {n:t(a[0]), c:a[2], v:ms.map(function(m){ return sumKeys(cv, ks, [m], a[1]); })}; });
  return '<div class="card c-half"><h3>' + esc(t('cColl')) + '</h3>' + legend(ser) + barSVG(ms.map(mShort), ser, {label:t('cColl')}) + '</div>';
}
function chartUncol(){
  var ks = scopeKeys(), b = S.ub === 'm' ? M1 : Y1;
  var parts = [{n:t('hold'), v:sumKeys(cv,ks,b,'hold'), c:C.hold}, {n:t('bounced'), v:sumKeys(cv,ks,b,'bounced'), c:C.bounce}, {n:t('pend'), v:sumKeys(cv,ks,b,'pending'), c:C.pend}];
  var tot = parts.reduce(function(a,p){ return a + p.v; }, 0);
  var body = tot ? '<div class="court-donut-row">' + donutSVG(parts, t('cUncol'), function(x){ return nice(x); }) + legend(parts.map(function(p){ return {n:p.n + ' (' + fmt(p.v) + ')', c:p.c}; })) + '</div>' : '<div class="empty-note">' + esc(t('noUncol')) + '</div>';
  return '<div class="card c-half"><h3>' + esc(t('cUncol')) + '</h3><div class="desc">' + esc(t('uncolBasis')) + ': ' + esc(S.ub === 'm' ? t('basisM') : t('basisY')) + '</div>' + body + '</div>';
}
function chartDist(){
  var ms = last12(), ks = scopeKeys();
  var ser = [{n:t('legDist'), c:C.dist, v:ms.map(function(m){ return sumKeys(ev, ks, [m], 'dist'); })}, {n:t('legExp'), c:C.exp, v:ms.map(function(m){ return sumKeys(ev, ks, [m], 'exp'); })}];
  return '<div class="card c-half"><h3>' + esc(t('cDist')) + '</h3>' + legend(ser) + barSVG(ms.map(mShort), ser, {stack:false, label:t('cDist')}) + '</div>';
}
function catTable(){
  var ks = scopeKeys();
  var nm = {staff:'staff', utilities:'utilities', maint:'maint', legal:'legalc', refund:'refund', tax:'tax', other:'other', pmfee:'pmfee'};
  var h = '<div class="card c-half"><h3>' + esc(t('catT')) + '</h3><div class="explore-table-scroll court-scroll"><table class="court"><thead><tr><th>' + esc(t('cat')) + '</th><th>' + esc(t('basisM')) + '</th><th>' + esc(t('basisY')) + '</th></tr></thead><tbody>';
  D.cats.forEach(function(c){ h += '<tr><td>' + esc(t(nm[c])) + '</td><td><span class="num">' + fmt(sumKeys(evCat, ks, M1, c)) + '</span></td><td><span class="num">' + fmt(sumKeys(evCat, ks, Y1, c)) + '</span></td></tr>'; });
  return h + '</tbody></table></div></div>';
}
function mainCard(){
  var desc = PAGE === 'dist' ? '<div class="desc">' + esc(t('distNote')) + '</div>' : (PAGE === 'occ' ? '<div class="desc">' + esc(t('occNote')) + '</div>' : '');
  return '<div class="card c-wide"><h3>' + esc(t(SEC.title)) + '</h3>' + desc + tableHTML() + '</div>';
}
var DEFIDX = {occ:[0,1,2,11], coll:[3,4,5,6,7,8,11], dist:[9,10,11]}[PAGE];
function defsCard(){
  var L2 = DEFS[S.lang] || DEFS.en;
  var h = '<div class="card c-wide"><details id="defsBox"' + (S.defs ? ' open' : '') + '><summary><b>' + esc(t('defsT')) + '</b></summary><div class="defs">';
  DEFIDX.forEach(function(i){ if(L2[i]) h += '<div class="def"><div class="dt">' + esc(L2[i][0]) + '</div><div class="dd">' + esc(L2[i][1]) + '</div></div>'; });
  return h + '</div></details></div>';
}
function dqIssues(){
  var keep = {
    occ: function(k){ return k.indexOf('master_') === 0 || k.indexOf('pay_noprop') === 0; },
    coll: function(k){ return k.indexOf('pay_') === 0 && k.indexOf('pay_noprop') !== 0; },
    dist: function(k){ return k.indexOf('exp_') === 0; }
  }[PAGE];
  return D.dq.filter(function(d){ return keep(d.k) && d.n > 0; });
}

/* ---------- static chrome ---------- */
var TITLES = {occ:['t_occ','s_occ'], coll:['t_coll','s_coll'], dist:['t_dist','s_dist']}[PAGE];
function renderChrome(){
  var d = document.documentElement; d.lang = S.lang; d.dir = S.lang === 'ar' ? 'rtl' : 'ltr';
  document.title = t(TITLES[0]);
  $('ttl').textContent = t(TITLES[0]); $('subttl').textContent = t(TITLES[1]);
  $('periodLabel').textContent = t('period') + ': ' + mLabel(MONTH);
  $('printTxt').textContent = ' ' + t('print');
  $('lblScope').textContent = t('scope'); $('q').setAttribute('placeholder', t('search')); $('q').setAttribute('aria-label', t('search'));
  var sc = $('selScope'), cur = sc.value || 'all';
  sc.innerHTML = '<option value="all">' + esc(t('allP')) + '</option>' + D.lls.map(function(l){ return '<option value="' + l.k + '">' + esc(l.name) + '</option>'; }).join('');
  sc.value = cur; S.scope = sc.value;
  if($('selUp')){ $('lblUp').textContent = t('upWin'); var su = $('selUp'); su.innerHTML = [60,90,120].map(function(x){ return '<option value="' + x + '">' + x + ' ' + t('days') + '</option>'; }).join(''); su.value = String(S.up); }
  if($('selUb')){ $('lblUb').textContent = t('uncolBasis'); var sb = $('selUb'); sb.innerHTML = '<option value="m">' + esc(t('basisM')) + '</option><option value="y">' + esc(t('basisY')) + '</option>'; sb.value = S.ub; }
  $('bExp').textContent = t('expand'); $('bCol').textContent = t('collapse'); $('bCsv').textContent = t('csv');
  $('kpiHead').textContent = t('keyMetrics');
  $('kpiDesc').textContent = t('dataAsOf') + ' ' + D.asof + ' · ' + t('src');
  $('statusMsg').textContent = t('statusNote');
  var q = dqIssues(), noUnits = D.dq.filter(function(d){ return d.k === 'pay_noprop_rows'; })[0];
  var nb = '';
  if(PAGE === 'occ' && noUnits) nb = '<span>⚠</span><span><b>' + esc(t('dqFlag')) + '</b>' + esc(t('noUnitsWarn').replace('{n}', fmt(noUnits.n))) + '</span>';
  else if(MONTH > D.asof.slice(0,7)) nb = '<span>⚠</span><span><b>' + esc(t('dqFlag')) + '</b>' + esc(t('afterAsof')) + '</span>';
  else if(MONTH === D.asof.slice(0,7)) nb = '<span>⚠</span><span><b>' + esc(t('dqFlag')) + '</b>' + esc(t('mtdWarn').replace('{d}', D.asof)) + '</span>';
  var dn = $('dqNote'); dn.innerHTML = nb; dn.style.display = nb ? 'flex' : 'none';
  $('footerNote').textContent = t('foot');
}
function renderBody(){
  renderKpis();
  var cards = '';
  if(PAGE === 'occ') cards = chartOcc() + chartExp() + mainCard() + renewalList();
  else if(PAGE === 'coll') cards = chartColl() + chartUncol() + mainCard();
  else cards = chartDist() + catTable() + mainCard();
  cards += defsCard();
  $('cards').innerHTML = cards;
}
function publish(){
  window.__crossCheckData = figures();
  window.__crossCheckData.period = mLabel(MONTH);
  window.__dataIssues = dqIssues().map(function(d){ return {severity: /_rows$/.test(d.k) ? 'info' : 'warning', message: (S.lang === 'ar' && DQAR[d.k] ? DQAR[d.k] : d.t) + ': ' + d.n.toLocaleString('en-US')}; });
  if(window.parent && window.parent !== window){ try{ window.parent.postMessage({__mdReportUpdated:true}, '*'); }catch(e){} }
}
function render(){ renderChrome(); renderBody(); publish(); }

/* ---------- CSV ---------- */
function csv(){
  var q = function(s){ return '"' + String(s).replace(/"/g, '""') + '"'; };
  var rows = buildRows(), hdr = [t('portfolio') + ' / ' + t('properties')].concat(SEC.cols.map(function(c){ return c[0] === 'uncol' ? t('uncolHdr') : t(c[0]); }));
  var lines = [hdr.map(q).join(',')];
  var val = function(c, vals){ var ix = c[1]; if(c[2] === 'p') return vals[ix[1]] ? (100*vals[ix[0]]/vals[ix[1]]).toFixed(1) + '%' : ''; if(c[2] === 's') return Math.round(ix.reduce(function(a,i){ return a + vals[i]; }, 0)); return Math.round(vals[ix]); };
  rows.forEach(function(r){ lines.push([q(r.name)].concat(SEC.cols.map(function(c){ return val(c, r.vals); })).join(',')); r.kids.forEach(function(k){ lines.push([q('  ' + k.name)].concat(SEC.cols.map(function(c){ return val(c, k.vals); })).join(',')); }); });
  var blob = new Blob(['﻿' + lines.join('\n')], {type:'text/csv;charset=utf-8'}), a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = 'dubai-court-' + PAGE + '-' + MONTH + '.csv'; document.body.appendChild(a); a.click(); setTimeout(function(){ URL.revokeObjectURL(a.href); a.remove(); }, 500);
}

/* ---------- events ---------- */
document.addEventListener('click', function(e){
  var tg = e.target.closest && e.target.closest('.tg');
  if(tg){ var k = tg.getAttribute('data-k'); S.open[k] = !S.open[k]; renderBody(); }
});
document.addEventListener('toggle', function(e){ if(e.target && e.target.id === 'defsBox') S.defs = e.target.open; }, true);
$('selScope').addEventListener('change', function(){ S.scope = this.value; renderBody(); });
$('q').addEventListener('input', function(){ S.q = this.value; renderBody(); });
if($('selUp')) $('selUp').addEventListener('change', function(){ S.up = +this.value; renderBody(); publish(); });
if($('selUb')) $('selUb').addEventListener('change', function(){ S.ub = this.value; renderBody(); });
$('bExp').addEventListener('click', function(){ D.lls.forEach(function(l){ S.open[PAGE + l.k] = true; }); renderBody(); });
$('bCol').addEventListener('click', function(){ S.open = {}; renderBody(); });
$('bCsv').addEventListener('click', csv);
$('printBtn').addEventListener('click', function(){ window.print(); });

/* ---------- hooks used by the main dashboard ---------- */
window.__mdFreshness = {snapshotDate:D.asof, loadedFresh:false, loadedAt:null};
window.reportText = function(v){ return S.lang === 'ar' && Object.prototype.hasOwnProperty.call(REVMAP, v) ? REVMAP[v] : v; };
window.__mdSetReportLanguage = function(lang){ var n = lang === 'ar' ? 'ar' : 'en'; if(n === S.lang && window.__crossCheckData) return; S.lang = n; render(); };
render();
})();
