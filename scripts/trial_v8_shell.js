
// TRIAL v8 (shell side): executive brief, history seeding from the embedded months, data-health badge.
// Everything here reads numbers the shell already has; nothing new is computed except display text.

// ---- 1. Executive brief (Executive Summary, Awqaf): three plain lines under the headline sentence ----
window.__v8Brief = function(o){
  try{
    var cc = o.cc, bc = o.bc, nl = o.nl, rc = o.rc, prior = o.priorSnap;
    var n = function(v){ return (Number(v) || 0).toLocaleString(); };
    var row = function(k, v){ return '<div class="v8-brief-row"><span class="v8-brief-k">' + k + '</span><span class="v8-brief-v">' + v + '</span></div>'; };
    var rows = [];
    if(cc.installments_total !== undefined){
      var d = (cc.sheet_installments_total !== undefined && cc.details_installments_total !== cc.sheet_installments_total)
        ? ' <span class="v8-brief-note">(sheet and Details differ by ' + Math.abs(cc.details_installments_total - cc.sheet_installments_total) + ')</span>' : '';
      rows.push(row('Installments', '<b>' + n(cc.installments_total) + '</b> installments given on <b>' + n(cc.contracts_with_installments) + '</b> contracts' + d + '.'));
    }
    if(prior && typeof momDeltaText === 'function'){
      var parts = [];
      var a = momDeltaText(cc.total_amount || 0, prior.totalCollected, true);
      var b = momDeltaText(cc.new_lease_contracts || 0, prior.newLeaseContracts, false);
      var c = momDeltaText(rc.total_requests || 0, prior.totalRequests, false);
      if(a) parts.push('recorded value ' + a);
      if(b) parts.push('new leases ' + b);
      if(c) parts.push('requests ' + c);
      if(parts.length) rows.push(row('Since ' + (prior.period || prior.periodKey), parts.join(' · ')));
    } else {
      rows.push(row('Since last month', '<span class="v8-brief-note">No earlier month on record yet.</span>'));
    }
    var rate = o.rate, tgt = o.BOUNCE_TARGET, rv = o.reviewN || 0;
    var watch = [];
    if(rate !== null && rate !== undefined) watch.push('bounce rate <b>' + rate.toFixed(1) + '%</b> against a ' + tgt + '% target');
    watch.push(rv ? '<b>' + rv + '</b> cross-check' + (rv === 1 ? '' : 's') + ' to review' : 'all cross-checks clear');
    rows.push(row('Watch', watch.join(' · ') + '.'));
    try{
      var st = bc && bc.status && typeof bc.status === 'object' ? Object.keys(bc.status).map(function(k){ return [k, Number(bc.status[k]) || 0]; }).filter(function(e){ return e[1] > 0; }) : [];
      if(st.length){
        var paid = 0, open = [], tot = 0;
        st.forEach(function(e){ tot += e[1]; if(/paid/i.test(e[0])) paid += e[1]; else open.push(e); });
        var AR = function(k){ k = String(k).toLowerCase(); return /legal/.test(k) ? 'إجراء قانوني' : /process/.test(k) ? 'قيد المعالجة' : null; };
        var en = '<b>' + (tot - paid) + '</b> of ' + tot + ' still unresolved' + (open.length ? ' (' + open.map(function(e){ return e[1] + ' ' + e[0]; }).join(', ') + ')' : '') + '; ' + paid + ' already paid.';
        var ar = '<b>' + (tot - paid) + '</b> من ' + tot + ' لا تزال غير محسومة' + (open.length ? ' (' + open.map(function(e){ return e[1] + ' ' + (AR(e[0]) || e[0]); }).join('، ') + ')' : '') + '؛ ' + paid + ' مدفوعة بالفعل.';
        rows.push('<div class="v8-brief-row"><span class="v8-brief-k"><span class="v9-en">Bounced cheques</span><span class="v9-ar">الشيكات المرتجعة</span></span><span class="v8-brief-v"><span class="v9-en">' + en + '</span><span class="v9-ar">' + ar + '</span></span></div>');
      }
    }catch(e){ console.warn('v9 brief bounced', e); }
    return '<div class="v8-brief" aria-label="Executive brief">' + rows.join('') + '</div>';
  }catch(e){ return ''; }
};

// ---- 2. Seed the month-over-month history from the months embedded in this page ----
// "What changed" compares against saved months, which used to exist only in the viewer's own browser storage.
// The earlier months are already embedded, so they are read once (after the portfolio is unlocked) and saved.
window.__v8SeededOnce = false;
window.__v8SeedSoon = function(){
  if(window.__v8SeededOnce) return;
  try{
    if(typeof isPortfolioPinVerified === 'function' && typeof PORTFOLIO_PINS !== 'undefined' && PORTFOLIO_PINS.awqaf !== undefined && !isPortfolioPinVerified('awqaf')) return;
  }catch(e){ return; }
  window.__v8SeededOnce = true;
  setTimeout(function(){ window.__v8SeedHistory(); }, 1200);
};
window.__v8SeedHistory = function(){
  try{
    if(typeof getMonthlyHistory !== 'function' || typeof saveMonthlyHistory !== 'function') return Promise.resolve();
    var sets = [['2026-07', typeof EMBEDDED_DASHBOARDS !== 'undefined' ? EMBEDDED_DASHBOARDS : null],
                ['2026-08', typeof EMBEDDED_DASHBOARDS_AUG !== 'undefined' ? EMBEDDED_DASHBOARDS_AUG : null],
                ['2026-09', typeof EMBEDDED_DASHBOARDS_SEPT !== 'undefined' ? EMBEDDED_DASHBOARDS_SEPT : null]];
    var ids = ['count-report', 'bounced-cheques', 'new-lease', 'request-count'];
    var have = {};
    getMonthlyHistory('awqaf').forEach(function(h){ have[h.periodKey] = 1; });
    var load = function(b64){
      return new Promise(function(res){
        var f = document.createElement('iframe');
        f.setAttribute('aria-hidden', 'true'); f.tabIndex = -1;
        f.style.cssText = 'position:absolute;left:-99999px;top:0;width:1200px;height:800px;visibility:hidden;border:0';
        var done = false;
        var finish = function(v){ if(done) return; done = true; try{ f.remove(); }catch(e){} res(v); };
        f.onload = function(){
          var tries = 0;
          (function poll(){
            var d = null;
            try{ d = f.contentWindow.__crossCheckData; }catch(e){}
            if(d || tries++ > 50){ var copy = null; try{ copy = d ? JSON.parse(JSON.stringify(d)) : null; }catch(e){} finish(copy); }
            else setTimeout(poll, 100);
          })();
        };
        setTimeout(function(){ finish(null); }, 8000);
        try{ f.srcdoc = base64ToUtf8(b64); document.body.appendChild(f); }catch(e){ finish(null); }
      });
    };
    var chain = Promise.resolve(), added = 0;
    sets.forEach(function(s){
      var key = s[0], set = s[1];
      if(!set || have[key]) return;
      chain = chain.then(function(){
        if(!ids.every(function(id){ return set[id]; })) return;
        return Promise.all(ids.map(function(id){ return load(set[id]); })).then(function(r){
          var cc = r[0], bc = r[1], nl = r[2], rc = r[3];
          if(!cc || !bc || !nl || !rc) return;
          var dates = [cc.date_min, cc.date_max, bc.date_min, bc.date_max, nl.date_min, nl.date_max, rc.date_min, rc.date_max];
          var pk = latestMonthKeyFromDates(dates);
          var eligible = [cc, bc, nl, rc].every(function(d){ return d.date_min && d.date_max && d.date_min.slice(0, 7) === pk && d.date_max.slice(0, 7) === pk; });
          if(!pk || !eligible || pk !== key) return;
          var net = (cc.total_amount || 0) - (bc.total_amount || 0);
          saveMonthlyHistory('awqaf', {
            period: fmtPeriod(cc.date_min, cc.date_max), periodKey: pk, periodMismatch: null, historyEligible: true,
            totalCollected: cc.total_amount, bouncedAmount: bc.total_amount, bouncedCount: bc.total_count, netCollected: net,
            bounceRatePct: cc.total_amount ? (bc.total_amount / cc.total_amount) * 100 : null,
            bouncedKeys: Array.isArray(bc.contracts) ? bc.contracts : [], bouncedRecords: Array.isArray(bc.records) ? bc.records : [],
            newLeaseContracts: cc.new_lease_contracts || 0, renewalLeaseContracts: cc.renewal_lease_contracts || 0,
            leaseRentValue: nl.rent_value_total || 0, totalRequests: rc.total_requests || 0,
            rcRenewalRequests: (rc.type_counts && rc.type_counts['Renewal Lease']) || 0, rcNewRequests: (rc.type_counts && rc.type_counts['New Lease']) || 0
          });
          added++;
        });
      });
    });
    return chain.then(function(){
      if(!added) return;
      try{ if(typeof currentPortfolio !== 'undefined' && currentPortfolio === 'awqaf'){
        if(typeof renderExecSummary === 'function') renderExecSummary();
        if(typeof renderOverviewAwqaf === 'function') renderOverviewAwqaf();
        if(typeof renderChangedRecords === 'function') renderChangedRecords();
      } }catch(e){}
    });
  }catch(e){ return Promise.resolve(); }
};
(function(){
  var o = window.renderOverviewAwqaf;
  if(typeof o === 'function'){
    window.renderOverviewAwqaf = function(){ var r = o.apply(this, arguments); try{ window.__v8SeedSoon(); }catch(e){} return r; };
  }
})();

// ---- 3. Data-health badge in the header, kept in step with the existing data-status banner ----
window.__v8HealthBadge = function(){
  try{
    if(typeof computeDataHealthStatus !== 'function') return;
    var bar = document.querySelector('.header-actions');
    if(!bar) return;
    var h = computeDataHealthStatus();
    var dq = document.getElementById('v8DqHead');
    if(dq){
      // count the individual issues exactly like the tiles below do (h.* counts reports, not issues)
      var ic = {critical: 0, warning: 0, info: 0};
      try{ REPORTS.forEach(function(r){ var w = embeddedWindows[r.id], is = w && w.__dataIssues; if(is) is.forEach(function(i){ if(ic[i.severity] !== undefined) ic[i.severity]++; }); }); }catch(e){}
      var rev = h.reviewCount || 0, pl = function(n, a, b){ return n + ' ' + (n === 1 ? a : b); };
      dq.innerHTML = h.loadedCount
        ? '<b>' + String(h.statusLabel).replace(/</g, '&lt;') + '</b> · ' + h.loadedCount + ' of ' + h.total + ' reports loaded. '
          + '<b>' + ic.critical + '</b> critical · <b>' + pl(ic.warning, 'warning', 'warnings') + '</b> · <b>' + pl(ic.info, 'note', 'notes') + '</b> across the reports'
          + (rev ? ', plus <b>' + pl(rev, 'cross-check', 'cross-checks') + '</b> to review (see Overview).' : '.')
        : '';
    }
    var b = document.getElementById('v8HealthBadge');
    if(!b){
      b = document.createElement('button'); b.type = 'button'; b.id = 'v8HealthBadge'; b.className = 'theme-switch v8-health';
      b.addEventListener('click', function(){ try{ selectTab('dataquality'); }catch(e){} });
      bar.insertBefore(b, bar.firstChild);
    }
    if(!h.loadedCount){ b.style.display = 'none'; return; }
    var issues = (h.criticalCount || 0) + (h.reviewCount || 0);
    b.style.display = '';
    b.className = 'theme-switch v8-health ' + (h.criticalCount ? 'v8-h-bad' : h.reviewCount ? 'v8-h-warn' : 'v8-h-ok');
    b.innerHTML = '<span class="v8-h-dot"></span>' + (issues ? issues + ' to review' : 'Data OK');
    b.title = h.statusLabel + (issues ? ' - open Data Quality' : '');
    b.setAttribute('aria-label', 'Data health: ' + h.statusLabel + '. Open Data Quality tab.');
  }catch(e){}
};
(function(){
  var q = window.renderDataQuality;
  if(typeof q === 'function'){
    window.renderDataQuality = function(){ var r = q.apply(this, arguments); window.__v8HealthBadge(); return r; };
  }
})();
(function(){
  var o = window.renderDataHealthStatus;
  if(typeof o === 'function'){
    window.renderDataHealthStatus = function(){ var r = o.apply(this, arguments); window.__v8HealthBadge(); return r; };
  }
})();
