// ---- Executive Summary: segmented, no-page-scroll views (desktop) ----
// Each top-level block of the pane carries data-exec-view (summary | trend |
// changes). On a big enough screen the pane is fixed to the viewport and only
// the active view's blocks are shown; on small screens and in print everything
// stacks and scrolls as before.
function applyExecView(pane, view){
  pane.dataset.execActive = view;
  pane.querySelectorAll(':scope > [data-exec-view]').forEach(el => el.classList.toggle('exec-on', el.dataset.execView === view));
  pane.querySelectorAll('.exec-seg-btn').forEach(b => {
    const on = b.dataset.execPick === view;
    b.classList.toggle('active', on);
    b.setAttribute('aria-selected', on ? 'true' : 'false');
  });
}
function execFitUpdate(){
  const pane = document.getElementById('pane-execsummary');
  if(!pane) return;
  const visible = pane.style.display !== 'none';
  const big = window.matchMedia('(min-width:1100px) and (min-height:700px)').matches;
  const on = visible && big;
  document.body.classList.toggle('exec-focus', on);
  pane.classList.toggle('exec-fit', on);
  if(!on){ pane.style.removeProperty('--exec-h'); return; }
  window.scrollTo(0, 0);
  pane.style.removeProperty('--exec-h');
  const top = pane.getBoundingClientRect().top;
  let h = window.innerHeight - top - 12;
  pane.style.setProperty('--exec-h', h + 'px');
  const over = document.documentElement.scrollHeight - window.innerHeight;
  if(over > 0) pane.style.setProperty('--exec-h', (h - over) + 'px');
}
function initExecViews(pane){
  pane.querySelectorAll('.exec-seg-btn').forEach(b => b.addEventListener('click', () => { applyExecView(pane, b.dataset.execPick); }));
  applyExecView(pane, 'summary');
  if(!window.__execFitWired){
    window.__execFitWired = true;
    window.addEventListener('resize', execFitUpdate);
  }
}
