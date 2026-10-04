#!/usr/bin/env python3
"""Builds Dashboard_TRIAL_v3.html from Dashboard_v2.html:
 1. Executive Summary -> segmented, no-page-scroll views (desktop); stacked fallback elsewhere/print.
 2. Lease Activity -> redesigned layout.
Run from repo root: python3 scripts/build_trial_v3.py"""
import pathlib, sys
ROOT = pathlib.Path(__file__).resolve().parent.parent
src = (ROOT / 'Dashboard_v2.html').read_text(encoding='utf-8')
s = src

def rep(old, new, count=1):
    global s
    assert s.count(old) >= 1, 'anchor not found: ' + old[:70]
    if count == 1:
        assert s.count(old) == 1, 'anchor not unique (%d): %s' % (s.count(old), old[:70])
    s = s.replace(old, new)

CSS = (ROOT / 'scripts' / 'trial_v3.css').read_text(encoding='utf-8')
JS_EXEC = (ROOT / 'scripts' / 'trial_v3_exec.js').read_text(encoding='utf-8')
JS_LA = (ROOT / 'scripts' / 'trial_v3_lease.js').read_text(encoding='utf-8')
LA_RENDER = (ROOT / 'scripts' / 'trial_v3_lease_render.js').read_text(encoding='utf-8')

# ---- CSS: append just before the first </style> of the main document
i = s.index('</style>')
s = s[:i] + CSS + s[i:]

# ---- Exec Summary markup
rep('''    <div id="periodNote" class="period-note" style="display:none;"></div>
    <div id="monthlyTrendWrap" style="display:none;"></div>
    <div id="changedRecordsWrap" style="display:none;"></div>
    <div id="execDataAsOf" class="period-note" style="display:none;"></div>
    <div id="execHeroWrap">''',
'''    <div class="exec-seg" role="tablist" aria-label="Executive Summary views">
      <button type="button" class="exec-seg-btn active" role="tab" aria-selected="true" data-exec-pick="summary">Summary</button>
      <button type="button" class="exec-seg-btn" role="tab" aria-selected="false" data-exec-pick="trend">Trend &amp; Outlook</button>
      <button type="button" class="exec-seg-btn" role="tab" aria-selected="false" data-exec-pick="changes">Changes</button>
    </div>
    <div id="periodNote" class="period-note" data-exec-view="summary" style="display:none;"></div>
    <div id="monthlyTrendWrap" data-exec-view="trend" style="display:none;"></div>
    <div id="changedRecordsWrap" data-exec-view="changes" style="display:none;"></div>
    <div id="execDataAsOf" class="period-note" data-exec-view="summary" style="display:none;"></div>
    <div id="execHeroWrap" data-exec-view="summary">''')

# awqaf sections: wrap each title+note+wrap trio
rep('''    <div class="section-title"><span class="h2-dot"></span><span data-i18n="execsum.sectionPerformance">''',
    '''    <div class="exec-sec exec-sec-perf" data-exec-view="summary">
    <div class="section-title"><span class="h2-dot"></span><span data-i18n="execsum.sectionPerformance">''')
rep('''    <div id="execPerformanceWrap" class="exec-narrative"><div class="overview-loading">${esc(t('dq.waitingReports','Waiting for reports to finish loading…'))}</div></div>
    <div class="section-title"><span class="h2-dot"></span><span data-i18n="execsum.sectionRisk">''',
    '''    <div id="execPerformanceWrap" class="exec-narrative"><div class="overview-loading">${esc(t('dq.waitingReports','Waiting for reports to finish loading…'))}</div></div>
    </div>
    <div class="exec-sec exec-sec-risk" data-exec-view="summary">
    <div class="section-title"><span class="h2-dot"></span><span data-i18n="execsum.sectionRisk">''')
rep('''    <div id="execRiskWrap"></div>
    <div class="section-title"><span class="h2-dot"></span><span data-i18n="execsum.sectionForward">''',
    '''    <div id="execRiskWrap"></div>
    </div>
    <div class="exec-sec exec-sec-fwd" data-exec-view="trend">
    <div class="section-title"><span class="h2-dot"></span><span data-i18n="execsum.sectionForward">''')
rep('''    <div id="execForwardWrap"></div>
    ` : `''', '''    <div id="execForwardWrap"></div>
    </div>
    ` : `''')
# non-awqaf branch
rep('''    <div class="section-title"><span class="h2-dot"></span><span data-i18n="execsum.sectionSummary">''',
    '''    <div class="exec-sec exec-sec-perf" data-exec-view="summary">
    <div class="section-title"><span class="h2-dot"></span><span data-i18n="execsum.sectionSummary">''')
rep('''    <div id="execNarrative" class="exec-narrative"><div class="overview-loading">${esc(t('dq.waitingReports','Waiting for reports to finish loading…'))}</div></div>
    <div class="section-title"><span class="h2-dot"></span><span data-i18n="execsum.sectionHealthSnapshot">''',
    '''    <div id="execNarrative" class="exec-narrative"><div class="overview-loading">${esc(t('dq.waitingReports','Waiting for reports to finish loading…'))}</div></div>
    </div>
    <div class="exec-sec exec-sec-risk" data-exec-view="summary">
    <div class="section-title"><span class="h2-dot"></span><span data-i18n="execsum.sectionHealthSnapshot">''')
rep('''    <div id="execHealthWrap"></div>
    `}
  `;
  panesWrap.appendChild(pane);
''', '''    <div id="execHealthWrap"></div>
    </div>
    `}
  `;
  panesWrap.appendChild(pane);
  initExecViews(pane);
''')

# selectTab hook
rep('''  document.querySelectorAll('.report-pane').forEach(p => p.style.display = (p.dataset.report === id) ? 'block' : 'none');
  replayEntranceAnimations(id);
}''', '''  document.querySelectorAll('.report-pane').forEach(p => p.style.display = (p.dataset.report === id) ? 'block' : 'none');
  replayEntranceAnimations(id);
  if(typeof execFitUpdate === 'function') execFitUpdate();
}''')

# JS helpers before buildExecSummaryTab
rep('function buildExecSummaryTab(){', JS_EXEC + '\nfunction buildExecSummaryTab(){')

# ---- Lease Activity
rep('function renderLeaseActivity(){', JS_LA + '\nfunction renderLeaseActivity(){')
a = s.index('  wrap.innerHTML = `<div class="la-layout">')
b = s.index("\n}\n\n// Awqaf's own Executive Summary:", a)
s = s[:a] + LA_RENDER + s[b:]

out = ROOT / 'Dashboard_TRIAL_v3.html'
out.write_text(s, encoding='utf-8')
print('wrote', out.name, len(src), '->', len(s))
