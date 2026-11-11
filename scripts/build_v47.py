"""v47 (not live): New Lease "By Bank" shows real bank names for Aug, Sep and Oct 2026.
In v46 those three months carried the payment method (Cheque / Credit card / Bank Transfer) in the bank field,
while July carried the bank. This rebuilds the bank field for Aug-Oct from the Bank column of each month's raw
New Lease workbook (blank -> 'N/A', as in July), relabels the field "Bank" in all four months, and points the
in-browser upload mapper at the Bank column. Nothing else changes.
Reads index.html (live v46), writes Dashboard_RELEASE_v47.html. index.html is not touched.
Usage: python3 scripts/build_v47.py "/path/to/July 2026 Reports" """
import base64, json, re, sys, os
import openpyxl

REPORTS = sys.argv[1]
RAW = {'EMBEDDED_DASHBOARDS_AUG': 'August Awqaf/New Lease-Aug- 2026 (1).xlsx',
       'EMBEDDED_DASHBOARDS_SEPT': 'September Awqaf/New Lease-Sept- 2026.xlsx',
       'EMBEDDED_DASHBOARDS_OCT': 'October Awqaf /New Lease-Oct- 2026.xlsx'}
src = open('index.html', encoding='utf-8').read()

def raw_banks(path):
    ws = openpyxl.load_workbook(os.path.join(REPORTS, path), data_only=True, read_only=True)['Details']
    rows = list(ws.iter_rows(values_only=True))
    hdr = [str(c).strip() if c is not None else '' for c in rows[0]]
    ci, bi, ai = hdr.index('Contract Number'), hdr.index('Bank'), hdr.index('Amount')
    out = []
    for r in rows[1:]:
        if all(c in (None, '') for c in r):
            continue
        b = r[bi]
        b = 'N/A' if b is None or str(b).strip() == '' else str(b).strip()
        out.append((str(r[ci]).strip() if r[ci] is not None else None, r[ai], b))
    return out

def rows_span(h):
    i = h.index('const INITIAL_ROWS = ') + len('const INITIAL_ROWS = ')
    depth = 0
    for k in range(i, len(h)):
        if h[k] == '[': depth += 1
        elif h[k] == ']':
            depth -= 1
            if depth == 0:
                return i, k + 1

LABEL = [('"nl.field.bank": "Payment Method"', '"nl.field.bank": "Bank"'),
         ('"nl.field.bank": "طريقة الدفع"', '"nl.field.bank": "البنك"'),
         ("bank: ['pay. method', 'pay method', 'payment method']", "bank: ['bank', 'bank name']")]

def relabel(h, obj):
    for a, b in LABEL:
        assert h.count(a) == 1, (obj, a)
        h = h.replace(a, b)
    return h

def patch(h, obj):
    if obj in RAW:
        i, j = rows_span(h)
        rows = json.loads(h[i:j])
        assert rows[0][6] == 'Bank' and rows[0][8] == 'Contract Number', rows[0]
        raw = raw_banks(RAW[obj])
        assert len(raw) == len(rows) - 1, (obj, len(raw), len(rows) - 1)
        for r, (c, amt, bank) in zip(rows[1:], raw):
            assert (r[8] or None) == (c if c not in ('None', '') else None) and abs(float(r[1] or 0) - float(amt or 0)) < 1e-6, (obj, r, c, amt)
            r[6] = bank
        h = h[:i] + json.dumps(rows, ensure_ascii=False) + h[j:]
    return relabel(h, obj)

out = src
for obj in ('EMBEDDED_DASHBOARDS', 'EMBEDDED_DASHBOARDS_AUG', 'EMBEDDED_DASHBOARDS_SEPT', 'EMBEDDED_DASHBOARDS_OCT'):
    st = out.index('const ' + obj + ' = {')
    tag = '"new-lease": "'; j = out.index(tag, st) + len(tag); k = out.index('"', j)
    h = base64.b64decode(out[j:k]).decode('utf-8')
    b = base64.b64encode(patch(h, obj).encode('utf-8')).decode('ascii')
    out = out[:j] + b + out[k:]
    print('patched', obj)

# What's new: portfolio log (English) and the New Lease tab updates (English + Arabic)
a = "    { date: '2026-11-08', items: [\n    \"October 2026 is loaded for all four Awqaf reports"
assert out.count(a) == 1
out = out.replace(a, "    { date: '2026-11-10', items: [\n    \"New Lease: By Bank now shows bank names for August, September and October (it was showing the payment method).\",\n    ]},\n" + a)
a = "    'new-lease': [\n"
assert out.count(a) == 1
out = out.replace(a, a + "      {date: '2026-11-10', items: [{en: 'By Bank now shows bank names for August, September and October, as in July.', ar: 'يعرض مخطط حسب البنك الآن أسماء البنوك لأغسطس وسبتمبر وأكتوبر، كما في يوليو.'}]},\n")

open('Dashboard_RELEASE_v47.html', 'w', encoding='utf-8').write(out)
print('wrote Dashboard_RELEASE_v47.html', len(src), '->', len(out))
