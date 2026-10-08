"""Smoke test for a built dashboard: every tab in English and Arabic, no page errors, no banned words, headline figures present.
Usage: LD_LIBRARY_PATH=/tmp/libs python3 scripts/smoke_v9.py Dashboard_TRIAL_v9.html   (use the TRIAL file: the release asks for the PIN)"""
import re, sys, pathlib
from playwright.sync_api import sync_playwright
f = pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else 'Dashboard_TRIAL_v9.html').resolve()
EN = re.compile(r"\b(rows?|records?|line[- ]items?|lines|cheque lines)\b", re.I)
AR = re.compile(r'بند|بنود|سطر|سطور|(?<!و)صف\b|صفوف|الأم')
IDS = ['overview', 'execsummary', 'compare', 'dataquality', 'request-count', 'new-lease', 'bounced-cheques', 'count-report']
ALLOW = re.compile(r'RECORDS \(SHARE\)|AVG / RECORD|Records \(Share\)|Avg / Record', re.I)  # Staff Attribution, kept on purpose
fails = []
with sync_playwright() as p:
    pg = p.chromium.launch().new_page(viewport={'width': 1440, 'height': 1000}); errs = []
    pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.goto(f.as_uri()); pg.wait_for_timeout(3500)
    try: pg.get_by_text('Skip tour').click(timeout=2500)
    except Exception: pass
    for lang in ('en', 'ar'):
        if lang == 'ar': pg.locator('#langToggleMain').click(); pg.wait_for_timeout(2500)
        rx = EN if lang == 'en' else AR
        for i in IDS:
            if not pg.evaluate("id=>{var e=document.querySelector('[data-id=\"'+id+'\"]');if(e){e.click();return 1}return 0}", i):
                fails.append((lang, i, 'no tab')); continue
            pg.wait_for_timeout(2800)
            t = pg.inner_text('body')
            for h in pg.query_selector_all('iframe'):
                if h.is_visible():
                    try: t += '\n' + h.content_frame().inner_text('body')
                    except Exception: pass
            t = ALLOW.sub('', t)
            hits = sorted({m.group(0) for m in rx.finditer(t)})
            if hits: fails.append((lang, i, 'banned words', hits))
            if i == 'overview' and not ('1,609' in t and '405' in t): fails.append((lang, i, 'missing 1,609 / 405'))
    if errs: fails.append(('page errors', errs))
print('PASS' if not fails else 'FAIL'); [print(' ', x) for x in fails]
sys.exit(1 if fails else 0)
