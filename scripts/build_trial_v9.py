#!/usr/bin/env python3
"""Builds Dashboard_TRIAL_v9.html from Dashboard_v2.html (which is now the approved v7 redesign).
v8 = shared skin for the four embedded report tabs. The skin is injected into each report iframe at load time
(mountEmbeddedDashboard), so every month's embedded data stays byte-identical.
Run from repo root: python3 scripts/build_trial_v9.py"""
import json, pathlib, sys
RELEASE = '--release' in sys.argv  # release build: no PIN bypass, writes Dashboard_RELEASE_v9.html
ROOT = pathlib.Path(__file__).resolve().parent.parent
s = (ROOT / 'Dashboard_v2.html').read_text(encoding='utf-8')
CSS = (ROOT / 'scripts' / 'trial_v9_reports.css').read_text(encoding='utf-8')

anchor = "    try{ window.__mdApplyThemeToFrame && window.__mdApplyThemeToFrame(iframe.contentDocument); }catch(e){}\n"
assert s.count(anchor) == 1, s.count(anchor)
inject = anchor + (
    "    try{ // TRIAL v8: shared report skin\n"
    "      const d8 = iframe.contentDocument;\n"
    "      if(d8 && d8.head && !d8.getElementById('v8-skin')){ const st = d8.createElement('style'); st.id = 'v8-skin'; st.textContent = " + json.dumps(CSS) + "; d8.head.appendChild(st); }\n"
    "    }catch(e){}\n"
    "    try{ // TRIAL v8: at-a-glance strip, refreshed when the KPI tiles re-render\n"
    "      const d9 = iframe.contentDocument;\n"
    "      if(window.__v8Headline && d9 && d9.body){ window.__v8Headline(d9); new MutationObserver(function(ms){ var own = ms.every(function(m){ var n = m.target && (m.target.nodeType === 1 ? m.target : m.target.parentNode); return n && n.closest && n.closest('#v8-headline'); }); if(own) return; clearTimeout(d9.__v8HT); d9.__v8HT = setTimeout(function(){ window.__v8Headline(d9); }, 150); }).observe(d9.body, {childList:true, subtree:true, characterData:true}); }\n"
    "    }catch(e){}\n")
s = s.replace(anchor, inject)

# shell-side HTML patch (donut enhancement + <1% tile) applied to each report before it is set as srcdoc
DONUT_JS = (ROOT / 'scripts' / 'trial_v9_donut_inframe.js').read_text(encoding='utf-8')
TREND_JS = (ROOT / 'scripts' / 'trial_v8_trend_inframe.js').read_text(encoding='utf-8')
BAR_JS = (ROOT / 'scripts' / 'trial_v9_bar_inframe.js').read_text(encoding='utf-8')
COPY_JSON = (ROOT / 'scripts' / 'trial_v9_copy.json').read_text(encoding='utf-8')
RANK_JS = (ROOT / 'scripts' / 'trial_v9_rankify_inframe.js').read_text(encoding='utf-8')
RTL_JS = (ROOT / 'scripts' / 'trial_v9_rtl_inframe.js').read_text(encoding='utf-8') + '\n' + (ROOT / 'scripts' / 'trial_v9_a11y_inframe.js').read_text(encoding='utf-8')
CC_JS = (ROOT / 'scripts' / 'trial_v8_cc_inframe.js').read_text(encoding='utf-8') + '\n' + (ROOT / 'scripts' / 'trial_v9_cc_groups_inframe.js').read_text(encoding='utf-8')
PATCH_JS = (ROOT / 'scripts' / 'trial_v8_patch.js').read_text(encoding='utf-8')
mount = "function mountEmbeddedDashboard(pane, r){"
assert s.count(mount) == 1, s.count(mount)
STEPS_JS = (ROOT / 'scripts' / 'trial_v8_steps.js').read_text(encoding='utf-8')
s = s.replace(mount, "window.__V8_DONUT_JS = " + json.dumps(DONUT_JS) + ";\nwindow.__V9_BAR_JS = " + json.dumps(BAR_JS) + ";\nwindow.__V9_RANK_JS = " + json.dumps(RANK_JS) + ";\nwindow.__V9_RTL_JS = " + json.dumps(RTL_JS) + ";\nwindow.__V9_COPY = " + COPY_JSON + ";\nwindow.__V8_TREND_JS = " + json.dumps(TREND_JS) + ";\nwindow.__V8_CC_JS = " + json.dumps(CC_JS) + ";\nwindow.__V8_STEPS_JS = " + json.dumps(STEPS_JS) + ";\n" + PATCH_JS + "\n" + mount)
src = "iframe.srcdoc = base64ToUtf8(monthMap[r.id]);"
assert s.count(src) == 1, s.count(src)
s = s.replace(src, "iframe.srcdoc = window.__v8PatchReport ? window.__v8PatchReport(base64ToUtf8(monthMap[r.id]), r.id) : base64ToUtf8(monthMap[r.id]);")

# ---- shell-side content changes (trial only; Dashboard_v2.html / index.html stay untouched until approved) ----
def sub1(old, new, n=1):
    global s
    assert s.count(old) == n, (s.count(old), old[:90])
    s = s.replace(old, new)

# (0) review fix: the report-height timer was never cleared, so every month/portfolio switch leaked four of them
sub1("      setInterval(resize, 500);\n", "      if(pane.__v9RT) clearInterval(pane.__v9RT); pane.__v9RT = setInterval(function(){ if(!iframe.isConnected){ clearInterval(pane.__v9RT); return; } resize(); }, 500);\n")

# (a) Executive Summary: Net Value is not a guaranteed number (mostly PDC) -> cheque value due this month
old_net_vis = s[s.index("    const netVis = stack("):s.index("    const feeOther = Math.max(")]
new_due_vis = (
    "    const dueAmt = (cc.cheque_month_amount !== undefined ? cc.cheque_month_amount : (cc.cheque_dated_this_month_amount || 0));\n"
    "    const dueN = (cc.cheque_month_count !== undefined ? cc.cheque_month_count : (cc.cheque_dated_this_month_count || 0));\n"
    "    const laterAmt = (cc.cheque_later_amount !== undefined ? cc.cheque_later_amount : (cc.cheque_future_dated_amount || 0));\n"
    "    const laterN = (cc.cheque_later_count !== undefined ? cc.cheque_later_count : (cc.cheque_future_dated_count || 0));\n"
    "    const dueVis = stack([{label: 'Due this month', value: dueAmt, color: 'var(--accent)'}, {label: 'Dated later', value: laterAmt, color: 'var(--accent2)'}]) + legend([{label: currentLang === 'ar' ? 'هذا الشهر' : 'This month', value: 1, color: 'var(--accent)', text: dueN.toLocaleString() + ' · ' + aedC(dueAmt)}, {label: currentLang === 'ar' ? 'لاحقاً' : 'Dated later', value: 1, color: 'var(--accent2)', text: laterN.toLocaleString() + ' · ' + aedC(laterAmt)}]);\n")
s = s.replace(old_net_vis, new_due_vis)
sub1("tile(netCollectedLabel('awqaf'), esc(fmtAed(netCollected)), esc(t('execsum.heroNetSub', 'Recorded value minus bounced')), heroDelta(netCollected, 'netCollected', true), netVis, 'eb-ok'),",
     "tile(currentLang === 'ar' ? 'قيمة الشيكات المستحقة هذا الشهر' : 'Cheque value due this month', esc(fmtAed(dueAmt)), `${dueN.toLocaleString()} ${currentLang === 'ar' ? 'شيك' : 'cheques'} ${currentLang === 'ar' ? 'بتاريخ هذا الشهر' : 'dated this month'} · ${currentLang === 'ar' ? 'غير مؤكدة كمحصّلة' : 'not confirmed as cleared'}`, '', dueVis, 'eb-ok'),")

# (b) Executive Summary daily chart: "Cheque lines" -> Installments / Contracts (the chips are the switch)
sub1("      {label: t('execsum.v5.serLines', 'Cheque lines'), unit: t('execsum.v5.linesUnit', 'cheque lines'), source: 'Cheque Count · fee/cheque lines per day', daily: cc.daily, color: 'var(--accent)'},\n",
     "      {label: 'Installments', unit: 'installments', source: 'Cheque Count · rent installments per day', daily: cc.installments_daily || cc.daily, color: 'var(--accent)'},\n"
     "      {label: 'Contracts', unit: 'contracts', source: 'Cheque Count · contracts per day (on their first installment)', daily: cc.contracts_daily || cc.daily, color: 'var(--accent2)'},\n")

# (c) Overview: Cheque Count tile + headline -> installments / contracts with a switch
sub1("${num(cc.total_lines)} cheque lines worth <b>${aedC(cc.total_amount)}</b>; ",
     "<b>${num(cc.installments_total)}</b> installments on <b>${num(cc.contracts_with_installments)}</b> contracts, <b>${aedC(cc.total_amount)}</b> recorded; ")
i0 = s.index("      tile({id: 'count-report', label: 'Cheque Count', big: num(cc.total_lines)")
i1 = s.index("      tile({id: 'bounced-cheques', label: 'Bounced Cheques'")
new_tile = (
    "      tile({id: 'count-report', label: 'Cheque Count', big: (window.__v8OvMode === 'con' ? num(cc.contracts_with_installments) + ' <small>contracts</small>' : num(cc.installments_total) + ' <small>installments</small>'),\n"
    "        sub: '<span class=\"v8-sw\" role=\"group\" aria-label=\"Show\">' + ['inst', 'con'].map(k => '<button type=\"button\" class=\"v8-sw-b' + ((window.__v8OvMode === 'con' ? 'con' : 'inst') === k ? ' on' : '') + '\" data-v8ov=\"' + k + '\">' + (k === 'inst' ? 'Installments' : 'Contracts') + '</button>').join('') + '</span> ' + aedC(cc.install_amount) + ' rent',\n"
    "        spark: spark(window.__v8OvMode === 'con' ? (cc.contracts_daily || cc.daily) : (cc.installments_daily || cc.daily), 'var(--accent)', window.__v8OvMode === 'con' ? 'contracts' : 'installments'),\n"
    "        foot: `<span><b>${num(cc.contracts_with_installments)}</b> contracts</span><span><b>${num(cc.installments_total)}</b> installments</span>`}),\n")
s = s[:i0] + new_tile + s[i1:]
sub1("    wrap.querySelectorAll('.ov6-tile').forEach(el => {\n      const go = ",
     "    wrap.querySelectorAll('[data-v8ov]').forEach(b => { b.addEventListener('click', ev => { ev.stopPropagation(); ev.preventDefault(); window.__v8OvMode = b.getAttribute('data-v8ov'); renderOverviewAwqaf(); }); b.addEventListener('keydown', ev => ev.stopPropagation()); });\n"
     "    wrap.querySelectorAll('.ov6-tile').forEach(el => {\n      const go = ")
sub1("  .ov6-tile:hover{border-color:var(--accent); transform:translateY(-1px);}\n",
     "  .ov6-tile:hover{border-color:var(--accent); transform:translateY(-1px);}\n"
     "  .v8-sw{display:inline-flex; gap:2px; padding:2px; border:1px solid var(--border); border-radius:999px; margin-right:8px; vertical-align:middle;}\n"
     "  .v8-sw-b{cursor:pointer; border:0; background:transparent; color:var(--sub); font:inherit; font-size:11px; font-weight:700; padding:3px 10px; border-radius:999px;}\n"
     "  .v8-sw-b.on{background:var(--accent); color:#fff;}\n")

# (d) "rows" in the shell: upload checks and generic analyser say what the thing is
sub1("${pluralize(excluded.length, 'row', 'rows')} excluded (PM User or Type not on the roster)", "${pluralize(excluded.length, 'request', 'requests')} excluded (PM User or Type not on the roster)")
sub1("All ${allRecords.length} ${pluralize(allRecords.length, 'row', 'rows')} verified against the roster.", "All ${allRecords.length} ${pluralize(allRecords.length, 'request', 'requests')} verified against the roster.")
sub1("Excluded rows (${excluded.length})", "Excluded requests (${excluded.length})")
sub1("{label:'Total rows', value: rows.length.toLocaleString()}", "{label:'Total records', value: rows.length.toLocaleString()}")
sub1("data ${pluralize(dataRows.length, 'row', 'rows')} in", "data ${pluralize(dataRows.length, 'record', 'records')} in")
sub1("${dataRows.length} ${pluralize(dataRows.length, 'row', 'rows')}. Check passed.", "${dataRows.length} ${pluralize(dataRows.length, 'record', 'records')}. Check passed.")
sub1("${result.rowCount} ${pluralize(result.rowCount, 'row', 'rows')}. Check passed.", "${result.rowCount} ${pluralize(result.rowCount, 'record', 'records')}. Check passed.")
sub1("'dq.legend.warning': 'Warning — some rows were skipped or normalized; remaining totals are still usable'", "'dq.legend.warning': 'Warning — some records were skipped or normalized; remaining totals are still usable'")
sub1("No dated rows</div>", "No dated records</div>")

# (e) shell features: executive brief, history seeded from the embedded months, header data-health badge
SHELL_JS = (ROOT / 'scripts' / 'trial_v8_shell.js').read_text(encoding='utf-8') + '\n' + (ROOT / 'scripts' / 'trial_v9_ar_shell.js').read_text(encoding='utf-8')
# the wrappers reassign shell functions, so the block has to sit in the same <script> as their declarations
i_fn = s.index('function renderOverviewAwqaf(){')
i_mount = s.index(mount)
i_scr_a = s.rfind('<script', 0, i_mount); i_scr_b = s.find('</script>', i_mount)
assert i_scr_a < i_fn < i_scr_b, 'renderOverviewAwqaf is not in the same script as mountEmbeddedDashboard'
assert '</script>' not in SHELL_JS
s = s.replace(mount, SHELL_JS + "\n" + mount, 1)
sub1('      <div class="eb-headline">${headline}</div>\n      <div class="la4-tiles eb-tiles">${tiles}</div>',
     '      <div class="eb-headline">${headline}</div>\n      ${window.__v8Brief ? window.__v8Brief({cc, bc, nl, rc, priorSnap, rate, BOUNCE_TARGET, reviewN}) : \'\'}\n      <div class="la4-tiles eb-tiles">${tiles}</div>')
sub1("  .v8-sw-b.on{background:var(--accent); color:#fff;}\n",
     "  .v8-sw-b.on{background:var(--accent); color:#fff;}\n"
     "  .v8-brief{display:grid; gap:0; background:var(--card); border:1px solid var(--border); border-radius:14px; padding:4px 18px;}\n"
     "  .v8-brief-row{display:grid; grid-template-columns:150px 1fr; gap:14px; padding:9px 0; border-bottom:1px solid var(--border); font-size:13.5px; line-height:1.5; color:var(--sub);}\n"
     "  .v8-brief-row:last-child{border-bottom:0;}\n"
     "  .v8-brief-k{font-size:11px; font-weight:700; letter-spacing:.7px; text-transform:uppercase; color:var(--sub); padding-top:2px;}\n"
     "  .v8-brief-v b{color:var(--text); font-weight:700;}\n"
     "  .v8-brief-note{color:var(--sub); font-style:italic;}\n"
     "  .v8-health{display:inline-flex; align-items:center; gap:7px; font-size:12.5px; font-weight:600; width:auto; padding:0 12px;}\n"
     "  .v8-h-dot{width:8px; height:8px; border-radius:50%; background:currentColor;}\n"
     "  .v8-h-ok{color:var(--ok);} .v8-h-warn{color:var(--amber);} .v8-h-bad{color:var(--bad);}\n"
     "  @media (max-width:600px){ .v8-brief-row{grid-template-columns:1fr; gap:2px;} .la4-tiles{grid-template-columns:1fr !important;} .ov6-tiles{grid-template-columns:1fr !important;} .header-actions{flex-wrap:wrap;} }\n"
     "  @media print{ .header-actions, #tabBar, .tab-bar, .v8-sw, #v8HealthBadge, button{display:none !important;} .eb-tile, .la4-card, .v8-brief, .ov6-tile{break-inside:avoid;} body{background:#fff !important;} }\n")

# (f) Overview / Data Quality / Compare: main idea first, then numbered steps, wall-of-text descriptions removed
step_head = lambda n, title, sub: ('<div class="v8-ohead"><span class="v8-step-n">' + n + '</span><div><h3 data-i18n="ov.step' + n + '.t">' + title + '</h3><p data-i18n="ov.step' + n + '.s">' + sub + '</p></div></div>')
sub1('    <div id="dataHealthWrap"></div>\n    <div id="needsAttentionWrap"></div>\n    <div class="section-title"><span class="h2-dot"></span><span data-i18n="section.crossChecks">Cross-checks</span></div>\n    <div class="section-note" data-i18n="cc.sectionNote">Automatic consistency checks between reports that overlap (e.g. New Lease counts, bounced-cheque contracts). Updates as each report finishes loading.</div>',
     '    ' + step_head('1', 'Is the data safe to report from?', 'Status of the four reports and anything that needs a second look.') + '\n    <div id="dataHealthWrap"></div>\n    <div id="needsAttentionWrap"></div>\n    ' + step_head('2', 'Do the reports agree with each other?', 'Automatic checks between reports that overlap, such as new-lease counts and bounced-cheque contracts.'))
sub1('<div class="section-title" style="margin:0;"><span class="h2-dot"></span><span data-i18n="heatmap.sectionTitle">Activity by Day</span></div>',
     step_head('3', 'When did the work happen?', 'Activity by day, from the four reports.').replace('<div class="v8-ohead">', '<div class="v8-ohead" style="margin:0;">'))
# Data Quality: status sentence first, the key (legend) after the list, wall-of-text description gone
dq_old = s[s.index('    <div class="pane-desc" data-i18n="dq.paneDesc">'):s.index('    <div id="dataQualityWrap">')]
dq_legend = dq_old[dq_old.index('    <div class="dq-legend">'):]
sub1(dq_old + '    <div id="dataQualityWrap"><div class="overview-loading" data-i18n="dq.waitingReports">Waiting for reports to finish loading…</div></div>\n',
     '    <div id="v8DqHead"></div>\n    <div id="dataQualityWrap"><div class="overview-loading" data-i18n="dq.waitingReports">Waiting for reports to finish loading…</div></div>\n' + dq_legend)
# Overview Cheque Count tile: the foot shows the other number, not a repeat of the big one
sub1("        foot: `<span><b>${num(cc.contracts_with_installments)}</b> contracts</span><span><b>${num(cc.installments_total)}</b> installments</span>`}),\n",
     "        foot: (window.__v8OvMode === 'con' ? `<span><b>${num(cc.installments_total)}</b> installments given</span>` : `<span><b>${num(cc.contracts_with_installments)}</b> contracts</span>`)}),\n")
sub1("  .v8-sw-b.on{background:var(--accent); color:#fff;}\n",
     "  .v8-sw-b.on{background:var(--accent); color:#fff;}\n"
     "  #pane-overview .pane-desc, #pane-dataquality .pane-desc, #pane-compare .pane-desc{display:none;}\n"
     "  .v8-ohead{display:grid; grid-template-columns:auto 1fr; column-gap:12px; align-items:start; margin:30px 0 12px;}\n"
     "  .v8-ohead h3{margin:0; font-size:16px; font-weight:700; color:var(--text);}\n"
     "  .v8-ohead p{margin:2px 0 0; font-size:13px; color:var(--sub);}\n"
     "  .v8-step-n{grid-row:1 / span 2; min-width:30px; height:30px; display:inline-flex; align-items:center; justify-content:center; border-radius:9px; background:rgba(91,140,255,.16); color:var(--accent); font-size:13px; font-weight:800;}\n"
     "  #v8DqHead:not(:empty){background:var(--card); border:1px solid var(--border); border-radius:14px; padding:14px 18px; margin:0 0 18px; font-size:14.5px; line-height:1.6; color:var(--sub);}\n"
     "  #v8DqHead b{color:var(--text);}\n"
     "  #pane-dataquality .dq-legend{margin-top:22px; opacity:.85;}\n")

# Data health counts: count individual issues (same unit as the Data Quality tiles), not reports that have some
sub1("function computeDataHealthStatus(){\n  const criticalItems = [];",
     "function computeDataHealthStatus(){\n  const v9Issues = {critical:0, warning:0, info:0};\n  REPORTS.forEach(r => { const w = embeddedWindows[r.id], is = w && w.__dataIssues; if(is) is.forEach(i => { if(v9Issues[i.severity] !== undefined) v9Issues[i.severity]++; }); });\n  const criticalItems = [];")
sub1("criticalCount: criticalItems.length, reviewCount: reviewItems.length, warningCount: warningItems.length, infoCount: infoItems.length,",
     "criticalCount: Math.max(v9Issues.critical, criticalItems.length), reviewCount: reviewItems.length, warningCount: Math.max(v9Issues.warning, warningItems.length), infoCount: Math.max(v9Issues.info, infoItems.length),")
# TRIAL ONLY (never ported to Dashboard_v2.html / index.html): skip the PIN prompt so the trial opens straight in.
_pin = "function isPortfolioPinVerified(key){\n  try{ return localStorage.getItem(PIN_VERIFIED_PREFIX + key) === 'true'; }"
assert s.count(_pin) == 1, s.count(_pin)
if not RELEASE:  # the release build keeps the PIN prompt exactly as the live file has it
    s = s.replace(_pin, "function isPortfolioPinVerified(key){\n  /* TRIAL ONLY: PIN prompt disabled in this local trial file */ return true;\n  try{ return localStorage.getItem(PIN_VERIFIED_PREFIX + key) === 'true'; }")
V9CSS = (ROOT / 'scripts' / 'trial_v9_shell.css').read_text(encoding='utf-8')
_i = s.index('</head>')
s = s[:_i] + '<style id="v9-shell">\n' + V9CSS + '</style>\n' + s[_i:]


# ---- plain wording for long hard-coded notes ----
sub1("bounced-cheque contracts appear in Cheque Count. This checks contract presence only, not cheque/payment identity. Unmatched records were not matched within the supplied evidence; their originating period has not been established.` + (!samePeriod ? ' Matching reporting periods have not been established.' : '')",
     "bounced-cheque contracts appear in Cheque Count. This checks the contract only, not the individual cheque. The rest may belong to earlier months.` + (!samePeriod ? ' The two reports cover different periods.' : '')")
sub1("عقداً تظهر في تقرير عدد الشيكات. الفحص لوجود العقد فقط وليس لتطابق الشيك أو السداد. لم يتم إثبات الفترة الأصلية للسجلات غير المتطابقة.` + (!samePeriod ? ' لم يتم إثبات تطابق فترات التقارير.' : '')",
     "عقداً تظهر في تقرير عدد الشيكات. الفحص للعقد فقط وليس للشيك نفسه. قد يعود الباقي إلى أشهر سابقة.` + (!samePeriod ? ' التقريران يغطيان فترتين مختلفتين.' : '')")
# ---- plain-language shell copy (EN + AR) ----
import re as _re, json as _json
SHELL_COPY = _json.loads((ROOT / 'scripts' / 'trial_v9_shell_copy.json').read_text(encoding='utf-8'))
def _q(v): return v.replace('\\', '\\\\').replace("'", "\\'")
_AR = _re.compile(r'[\u0600-\u06FF]')
for _k, (_en, _ar) in SHELL_COPY.items():
    _ke = _re.escape(_k)
    _pat = _re.compile(r"^(\s*)'" + _ke + r"':\s*'(?:[^'\\]|\\.)*'(,?)\s*$", _re.M)
    _found = {'en': 0, 'ar': 0}
    def _rep(m, _en=_en, _ar=_ar, _found=_found):
        isar = bool(_AR.search(m.group(0)))
        _found['ar' if isar else 'en'] += 1
        return m.group(1) + "'" + _k_cur[0] + "': '" + _q(_ar if isar else _en) + "'" + (m.group(2) or ',')
    _k_cur = [_k]
    s = _pat.sub(_rep, s)
    if not _found['en']:
        # key lives only as an inline fallback: add it to both dictionaries (after app.subtitle)
        def _add(m, _en=_en, _ar=_ar):
            isar = bool(_AR.search(m.group(0)))
            return m.group(0) + "\n" + m.group(1) + "'" + _k + "': '" + _q(_ar if isar else _en) + "',"
        s = _re.sub(r"^(\s*)'app\.subtitle':\s*'(?:[^'\\]|\\.)*',?\s*$", _add, s, flags=_re.M)
    # inline fallbacks and default HTML text
    s = _re.sub(r"(\bt\('" + _ke + r"',\s*)'(?:[^'\\]|\\.)*'", lambda m, _en=_en: m.group(1) + "'" + _q(_en) + "'", s)
    s = _re.sub(r'(data-i18n="' + _ke + r'"[^>]*>)[^<]*(<)', lambda m, _en=_en: m.group(1) + _en.replace('&', '&amp;').replace('&amp;middot;', '&middot;').replace('<', '&lt;') + m.group(2), s)
out = ROOT / ('Dashboard_RELEASE_v9.html' if RELEASE else 'Dashboard_TRIAL_v9.html')
# internal tool: ask search engines not to index it (the real fix is _headers + robots.txt at the site root)
if 'name="robots"' not in s:
    s = s.replace('<head>', '<head>\n<meta name="robots" content="noindex,nofollow,noarchive">', 1)
s = s.replace('لوحة معلومات الأم — الملخص التنفيذي', 'لوحة المعلومات — الملخص التنفيذي')
if RELEASE:
    assert 'TRIAL ONLY' not in s, 'release build must not contain the PIN bypass'
out.write_text(s, encoding='utf-8')
print('wrote', out.name, len(s))
