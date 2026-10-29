"""python3 verify_court_data.py "<For Data.xlsx>"  - recounts Dubai Court figures straight from the workbook and compares
them with scripts/court_data.json (the data baked into the dashboard) and scripts/court_control.json (cross-check control)."""
import sys, os, json, datetime
here = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, here)
import court_independent as ci
X = sys.argv[1]
D = json.load(open(os.path.join(here, 'court_data.json'), encoding='utf-8'))
C = json.load(open(os.path.join(here, 'court_control.json'), encoding='utf-8'))
asof = datetime.date.fromisoformat(D['asof'])
pf = ci.payments_figures(X, asof); ef = ci.expense_figures(X)
CI = {f: i for i, f in enumerate(D['collFields'])}; EI = {f: i for i, f in enumerate(D['expFields'])}
bad = 0; info = 0
STRICT = set(C['months'])   # the months the dashboard offers; other months are informational only
def chk(label, a, b, tol=0.01):
    global bad, info
    if abs((a or 0) - (b or 0)) > tol:
        if label.split()[0] in STRICT or label.split()[0] in ('units', 'rented', 'vacant', 'control'): bad += 1; print('MISMATCH', label, a, b)
        else: info += 1; print('info (month not offered / classification edge)', label, a, b)
for m in D['months']:
    p = pf.get(m, {}); e = ef.get(m, {})
    for fld, key in (('rent', 'rent'), ('nrent', 'nrent'), ('other', 'other'), ('hold', 'hold'), ('bounced', 'bounced'), ('pending', 'pending')):
        chk(f'{m} {fld}', sum(r[CI[fld]] for k, r in D['coll'].items() if k.endswith('|' + m)), p.get(key, 0))
    for fld in ('dist', 'exp', 'courtrent'):
        chk(f'{m} {fld}', sum(r[EI[fld]] for k, r in D['exp'].items() if k.endswith('|' + m)), e.get(fld, 0))
u = ci.unit_figures(X, D['months'][0])
chk('units total', len(D['units']), u['total']); chk('rented', sum(1 for x in D['units'] if x[2] == 'R'), u['rented']); chk('vacant', sum(1 for x in D['units'] if x[2] == 'V'), u['vacant'])
fresh = ci.control_months(X, list(C['months']), asof)
for m, v in fresh.items():
    for k, val in v.items(): chk(f'control {m} {k}', C['months'][m][k], val)
# 2026 year-to-date rent and cheque counts (shown in the dashboard) must match too
for m in C['months']:
    chk(f'{m} rent_ytd', sum(r[CI['rent']] for k, r in D['coll'].items() if k[-7:-3] == m[:4] and k[-7:] <= m), ci.ytd(pf, m, 'rent'))
print('Dubai Court data check:', 'ALL MATCH' if not bad else f'{bad} mismatches', f'({info} informational differences in months the dashboard does not offer, or mixed-description rows)')
sys.exit(1 if bad else 0)
