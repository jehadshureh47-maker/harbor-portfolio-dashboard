"""Build the baked-in report data (INITIAL_ROWS etc.) for one Awqaf month from its four raw workbooks.
Used by build_v46.py (October 2026). Self-check: `python3 scripts/awqaf_month_rows.py check-sept` rebuilds September
from the September workbooks and compares every value with what is already baked into index.html."""
import os, sys, json, glob, datetime
import openpyxl

def _find(folder, *kw):
    c = [p for p in glob.glob(os.path.join(folder, '*.xlsx')) if all(k in os.path.basename(p).lower() for k in kw) and not os.path.basename(p).startswith('~$')]
    assert len(c) == 1, (kw, c); return c[0]

def _cell(v):
    if isinstance(v, datetime.datetime): return v.strftime('%Y-%m-%d')
    if isinstance(v, float) and v.is_integer(): return int(v)
    return v

def _sheet(path, name):
    ws = openpyxl.load_workbook(path, data_only=True)[name]
    rows = [list(r) for r in ws.iter_rows(values_only=True)]
    return rows[0], [r for r in rows[1:] if any(c is not None for c in r)]

def bounced(folder):
    h, d = _sheet(_find(folder, 'bounce'), 'Details')
    ix = {k: h.index(k) for k in h if k}
    cols = ['Cheque Date', 'Contract Number', 'Cheque Amount', 'Bank Name', 'Status', 'Tenant Name', 'Cheque Number', 'Mob No.', 'Contract Type']
    out = [['Date', 'Contract Number', 'Amount', 'Bank', 'Status', 'Tenant Name', 'Cheque Number', 'Mob No', 'Unit Type']]
    for r in d: out.append([_cell(r[ix[c]]) for c in cols])
    return out

def new_lease(folder):
    p = _find(folder, 'new', 'lease')
    h, d = _sheet(p, 'Details')
    ix = {k: h.index(k) for k in h if k}
    cols = ['Date', 'Amount', 'Description', 'User ', 'Ownership Type', 'Unit Type', 'Pay. Method', 'Property', 'Contract Number', 'Agent']
    out = [['Date', 'Amount', 'Type', 'PM User', 'Ownership Type', 'Unit Type', 'Bank', 'Property', 'Contract Number', 'Agent']]
    for r in d:
        out.append([(_cell(r[ix[c]]).strip() if isinstance(r[ix[c]], str) else _cell(r[ix[c]])) for c in cols])
    sh, sd = _sheet(p, 'Summary')
    by = {}
    for r in sd:
        if r[0] is None: continue
        by[str(r[0]).strip()] = {'property': r[1], 'unit': _cell(r[2]), 'costCenter': _cell(r[3]), 'rentAmount': _cell(r[4]), 'contractDate': _cell(r[5])}
    return out, {'sheetName': 'Summary', 'byContract': by}

def cheque_count(folder):
    p = _find(folder, 'cheque', 'count')
    h, d = _sheet(p, 'Details')
    out = [h] + [[_cell(v) for v in r] for r in d]
    ws = openpyxl.load_workbook(p, data_only=True)['Installment count']
    rows = [list(r) for r in ws.iter_rows(values_only=True) if any(c is not None for c in r)]
    top = next(r for r in rows if r[0] == 'Portfolio'); lab = next(r for r in rows if r[0] == 'Cheque count')
    n0 = top.index('New Lease'); r0 = top.index('Renewal'); end = top.index('Total') if 'Total' in top else len(top)
    def seg(row, a, b): return [row[i] for i in range(a, b) if lab[i] is not None]
    inst = {'newLabels': seg(lab, n0, r0), 'renLabels': seg(lab, r0, end), 'rows': []}
    for r in rows:
        if r[0] in (None, 'Portfolio', 'Cheque count') or isinstance(r[0], datetime.datetime): continue
        inst['rows'].append({'portfolio': r[0], 'newVals': [v or 0 for v in seg(r, n0, r0)], 'renVals': [v or 0 for v in seg(r, r0, end)]})
    sheet_date = rows[0][0] if isinstance(rows[0][0], datetime.datetime) else None
    return out, inst, sheet_date

CC_FIELDS = {'date': 'Date', 'contract': 'Contract Number', 'amount': 'Amount', 'type': 'Description', 'unitType': 'Unit Type', 'bank': 'Bank',
             'payMethod': 'Pay. Method', 'pdcCdc': 'PDC/CDC', 'pmUser': 'PM user', 'agent': 'Agent', 'leaseType': 'Type of lease',
             'ownership': 'Ownership Type', 'property': 'Property', 'tenant': 'Tenant Name', 'chequeDate': 'Cheque Date'}
RC_FIELDS = {'date': 'Date', 'amount': 'Amount', 'type': 'Type', 'pmUser': 'PM user', 'ownership': 'Ownership Type', 'unitType': 'Unit Type', 'bank': 'Bank', 'property': 'Property'}
def colmap(header, fields):
    return {k: header.index(v) for k, v in fields.items()}

def request_count(folder):
    p = _find(folder, 'request', 'count')
    ws = openpyxl.load_workbook(p, data_only=True)['Details']
    rows = [list(r) for r in ws.iter_rows(values_only=True)]
    w = max(len(r) for r in rows)
    h = rows[0] + [None] * (w - len(rows[0]))
    d = [r + [None] * (w - len(r)) for r in rows[1:] if any(c is not None for c in r)]
    out = [[_cell(v) for v in h]] + [[_cell(v) for v in r] for r in d]
    ch, cd = _sheet(p, 'Counts')
    users = [r[0].strip() for r in cd if r[0] and r[0].strip() != 'Total Count' and (r[ch.index('Total Count')] or 0) > 0]
    types = [t.strip() if t != 'Non- Renewal' else t for t in ch[1:ch.index('Total Count')]]
    total_counts = {ch[i]: next(r[i] for r in cd if r[0] and r[0].strip() == 'Total Count') for i in range(1, ch.index('Total Count') + 1)}
    return out, {'sheetName': 'Counts', 'users': users, 'types': types}, total_counts

def all_month(folder):
    bc = bounced(folder); nl, summ = new_lease(folder); cc, inst, cc_date = cheque_count(folder); rc, roster, rc_tot = request_count(folder)
    return dict(bc=bc, nl=nl, summ=summ, cc=cc, inst=inst, cc_date=cc_date, rc=rc, roster=roster, rc_tot=rc_tot)

if __name__ == '__main__' and sys.argv[1:] == ['check-sept']:
    sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
    import verify_awqaf_month as V, re
    s = open('index.html', encoding='utf-8').read()
    M = all_month(os.path.expanduser('~/Desktop/July 2026 Reports/September Awqaf'))
    def lit(h, name, o, c): return json.loads(V.js_object_to_json(V.extract_js_literal(h, name, o, c)))
    for key, rows in (('bounced-cheques', M['bc']), ('new-lease', M['nl']), ('count-report', M['cc']), ('request-count', M['rc'])):
        h = V.extract_embedded_html(s, 'EMBEDDED_DASHBOARDS_SEPT', key); er = lit(h, 'INITIAL_ROWS', '[', ']')
        diffs = [(i, j, a, b) for i, (ra, rb) in enumerate(zip(rows, er)) for j, (a, b) in enumerate(zip(ra, rb)) if a != b]
        print(key, 'rows', len(rows), len(er), 'width', len(rows[0]), len(er[0]), 'diffs', len(diffs), diffs[:6])
        if key == 'new-lease': print('  summary equal:', lit(h, 'INITIAL_SUMMARY', '{', '}') == M['summ'])
        if key == 'count-report':
            print('  installment equal:', lit(h, 'INITIAL_INSTALLMENT', '{', '}') == M['inst'], M['inst'])
            print('  colmap equal:', lit(h, 'INITIAL_COLMAP', '{', '}') == colmap(M['cc'][0], CC_FIELDS))
        if key == 'request-count':
            print('  roster equal:', lit(h, 'INITIAL_ROSTER', '{', '}') == M['roster'], M['roster'])
            print('  colmap equal:', lit(h, 'INITIAL_COLMAP', '{', '}') == colmap(M['rc'][0], RC_FIELDS))
