
// ================= TRIAL v7: Compare + Data Quality =================
// Both tabs keep their original renderers (renamed *Legacy by build_trial_v7.py) so every
// interaction, print rule and CSV export keeps working; v7 layers a headline, proportional
// bars (Compare) and summary tiles (Data Quality) on top of the freshly rendered DOM.

function v7PctChange(from, to){
  if(typeof from !== 'number' || typeof to !== 'number' || !isFinite(from) || !isFinite(to) || from === 0) return null;
  return (to - from) / Math.abs(from) * 100;
}
function v7Sign(p){ return (p > 0 ? '+' : p < 0 ? '−' : '') + Math.abs(p).toFixed(0) + '%'; }

// metric key -> [valueA, valueB], in the exact order the legacy renderers emit rows
const V7_CMP_KEYS = ['collected', 'bounced', 'rate', 'net', 'count'];
function v7CmpValues(key, A, B){
  const g = (o, k) => (o && typeof o[k] === 'number' && isFinite(o[k])) ? o[k] : null;
  switch(key){
    case 'collected': return [g(A,'totalCollected'), g(B,'totalCollected')];
    case 'bounced':   return [g(A,'bouncedAmount'),  g(B,'bouncedAmount')];
    case 'rate':      return [g(A,'bounceRatePct'),  g(B,'bounceRatePct')];
    case 'net':       return [g(A,'netCollected'),   g(B,'netCollected')];
    case 'count':     return [g(A,'bouncedCount'),   g(B,'bouncedCount')];
  }
  return [null, null];
}

function v7CompareEnhance(mode){
  const wrap = document.getElementById('compareWrap');
  if(!wrap) return;
  const card = wrap.querySelector('.compare-card');
  if(!card) return;
  let A, B, nameA, nameB, headline = '';
  if(mode === 'month'){
    const hist = getMonthlyHistory(compareMonthSel.portfolio);
    A = hist.find(h => h.periodKey === compareMonthSel.monthA) || null;
    B = hist.find(h => h.periodKey === compareMonthSel.monthB) || null;
    if(!A || !B) return;
    const nm = (PORTFOLIOS[compareMonthSel.portfolio] && PORTFOLIOS[compareMonthSel.portfolio].label) || compareMonthSel.portfolio;
    nameA = A.period || A.periodKey; nameB = B.period || B.periodKey;
    const pc = v7PctChange(A.totalCollected, B.totalCollected);
    const pb = v7PctChange(A.bouncedAmount, B.bouncedAmount);
    if(A.periodKey !== B.periodKey){
      headline = `<b>${esc(nm)}</b> · <b>${esc(nameB)}</b> vs <b>${esc(nameA)}</b>`
        + (pc !== null ? `: recorded value <b class="${pc >= 0 ? 'ok' : 'bad'}">${v7Sign(pc)}</b>` : '')
        + (pb !== null ? `, bounced value <b class="${pb <= 0 ? 'ok' : 'bad'}">${v7Sign(pb)}</b>` : '')
        + (typeof B.bounceRatePct === 'number' ? `, bounce rate now <b>${B.bounceRatePct.toFixed(1)}%</b>` : '') + '.';
    }
  } else {
    A = portfolioSnapshot[compareSel.a]; B = portfolioSnapshot[compareSel.b];
    nameA = (PORTFOLIOS[compareSel.a] && PORTFOLIOS[compareSel.a].label) || compareSel.a;
    nameB = (PORTFOLIOS[compareSel.b] && PORTFOLIOS[compareSel.b].label) || compareSel.b;
    if(A && B){
      const rate = o => (typeof o.bounceRatePct === 'number' ? o.bounceRatePct.toFixed(1) + '%' : '—');
      headline = `<b>${esc(nameA)}</b> recorded <b>${esc(fmtAedCompact(A.totalCollected))}</b> (bounce rate ${rate(A)}) · <b>${esc(nameB)}</b> recorded <b>${esc(fmtAedCompact(B.totalCollected))}</b> (bounce rate ${rate(B)}).`;
    }
  }
  // one-sided comparison: generic prompt + a button that loads the missing portfolio
  if(mode !== 'month' && (!A || !B)){
    const note = wrap.querySelector('.compare-mismatch');
    const missing = !A ? compareSel.a : compareSel.b;
    if(note && !note.querySelector('.cmp7-load')){
      note.classList.add('cmp7-note');
      note.innerHTML = '<span>Only one portfolio has been loaded this session. Choose a second portfolio to complete the comparison.</span>'
        + `<button type="button" class="cmp7-load" data-key="${esc(missing)}">Load comparison</button>`;
      note.querySelector('.cmp7-load').addEventListener('click', () => v7LoadComparison(missing));
    }
  }
  if(headline && !wrap.querySelector('.cmp7-headline')){
    card.insertAdjacentHTML('beforebegin', `<div class="cmp7-headline">${headline}</div>`);
  }

  // proportional bars - only when two value columns exist
  const rows = Array.from(card.querySelectorAll(':scope > .compare-row:not(.compare-head)'));
  const keys = V7_CMP_KEYS.filter(k => compareActiveMetrics.has(k));
  rows.forEach((row, i) => {
    const key = keys[i];
    if(!key) return;
    const vals = row.querySelectorAll(':scope > .compare-val');
    if(vals.length !== 2) return;
    const [va, vb] = v7CmpValues(key, A, B);
    if(va === null || vb === null) return;
    const max = Math.max(Math.abs(va), Math.abs(vb)) || 1;
    [[vals[0], va, 'var(--accent)'], [vals[1], vb, 'var(--accent2)']].forEach(([cell, v, col]) => {
      if(cell.querySelector('.cmp7-bar')) return;
      const w = Math.max(2, Math.round(Math.abs(v) / max * 100));
      cell.insertAdjacentHTML('beforeend', `<div class="cmp7-bar" aria-hidden="true"><i style="width:${w}%;background:${col}"></i></div>`);
      if(Math.abs(v) === max && va !== vb) cell.classList.add('cmp7-lead');
    });
  });
}

// Opens the missing portfolio so its Executive Summary snapshot is captured, then returns to the
// original portfolio's Compare tab. Uses the normal switchPortfolio(), so a PIN prompt still appears
// where one is required; polling simply waits (up to ~25s) for the PIN to be entered.
function v7LoadComparison(missing){
  const orig = currentPortfolio;
  const btn = document.querySelector('.cmp7-load');
  const setBtn = (txt, dis) => { if(btn){ btn.textContent = txt; btn.disabled = !!dis; } };
  if(!PORTFOLIOS[missing]){ setBtn('No reports for this portfolio yet', true); return; }
  setBtn('Loading…', true);
  if(missing !== orig) switchPortfolio(missing);
  let ticks = 0;
  const timer = setInterval(() => {
    ticks++;
    if(portfolioSnapshot[missing]){
      clearInterval(timer);
      if(currentPortfolio !== orig) switchPortfolio(orig);
      selectTab('compare');
      return;
    }
    if(ticks % 3 === 0){ try{ renderExecSummary(); }catch(e){} }
    if(ticks > 50){ clearInterval(timer); setBtn('Could not load — open its Executive Summary tab', false); }
  }, 500);
}

function renderCompare(){ renderCompareLegacy(); try{ v7CompareEnhance('portfolio'); }catch(e){ console.warn('v7 compare enhance', e); } }
function renderCompareMonth(){ renderCompareMonthLegacy(); try{ v7CompareEnhance('month'); }catch(e){ console.warn('v7 compare-month enhance', e); } }

// ---------------- Data Quality ----------------
function renderDataQuality(){
  renderDataQualityLegacy();
  try{
    const wrap = document.getElementById('dataQualityWrap');
    if(!wrap || wrap.querySelector('.dq7-tiles')) return;
    const groups = wrap.querySelectorAll('.dq-group');
    if(!groups.length) return;
    let loaded = 0;
    groups.forEach(g => {
      const crit = g.querySelectorAll('.dq-issue.critical').length;
      const warn = g.querySelectorAll('.dq-issue.warning').length;
      const info = g.querySelectorAll('.dq-issue.info').length;
      const notLoaded = !!g.querySelector('.dq-empty');
      if(!notLoaded) loaded++;
      const nameEl = g.querySelector('.dq-report-name');
      if(nameEl && !nameEl.querySelector('.dq7-chips')){
        let chips = '';
        if(notLoaded) chips = '<span class="dq7-chip mute">not loaded</span>';
        else if(!crit && !warn && !info) chips = '<span class="dq7-chip ok">clean</span>';
        else {
          if(crit) chips += `<span class="dq7-chip bad">${crit} critical</span>`;
          if(warn) chips += `<span class="dq7-chip warn">${warn} warning</span>`;
          if(info) chips += `<span class="dq7-chip info">${info} info</span>`;
        }
        nameEl.insertAdjacentHTML('beforeend', `<span class="dq7-chips">${chips}</span>`);
      }
    });
    const c = wrap.querySelectorAll('.dq-issue.critical').length;
    const w = wrap.querySelectorAll('.dq-issue.warning').length;
    const n = wrap.querySelectorAll('.dq-issue.info').length;
    const state = c ? 'bad' : (w ? 'warn' : 'ok');
    const verdict = c ? 'Critical issues found' : (w ? 'Needs a look' : (n ? 'Clean, with notes' : 'All clear'));
    const tile = (cls, label, val, sub) => `<div class="dq7-tile ${cls}"><div class="dq7-l">${label}</div><div class="dq7-b">${val}</div><div class="dq7-s">${sub}</div></div>`;
    const tiles = `<div class="dq7-tiles">
      <div class="dq7-tile verdict ${state}"><div class="dq7-l">Data status</div><div class="dq7-b">${verdict}</div><div class="dq7-s">${loaded} of ${groups.length} checks loaded</div></div>
      ${tile(c ? 'bad' : 'mute', 'Critical', c, 'required data missing')}
      ${tile(w ? 'warn' : 'mute', 'Warnings', w, 'skipped or normalised')}
      ${tile(n ? 'info' : 'mute', 'Information', n, 'worth knowing')}
    </div>`;
    const sb = wrap.querySelector('.dq-summary-bar');
    if(sb) sb.style.display = 'none';
    wrap.insertAdjacentHTML('afterbegin', tiles);
  }catch(e){ console.warn('v7 dq enhance', e); }
}
