"""Independent recomputation of Dubai Court headline figures straight from For Data.xlsx.
Rules follow the metric definitions in Dubai_Courts_Build_Notes.md. Used by build_v33.py (control
figures baked into the dashboard cross-check) and verify_court_data.py (compares to embedded data)."""
import re, datetime, openpyxl

def _st(r): return re.sub(r'\s+', ' ', str(r[12] or '')).strip()
def _ds(r): return re.sub(r'\s+', ' ', str(r[10])).strip() if r[10] is not None else ''
def _ben(r): return str(r[8] or '').strip()
def _mon(d): return d.strftime('%Y-%m') if isinstance(d, datetime.datetime) else None

OTHER_RE = re.compile(r'parking|wasl|access card|ejari|renewal|final settlement|^fs$|no info available', re.I)

def payments_figures(path, asof):
    wb = openpyxl.load_workbook(path, data_only=True)
    rows = list(wb['Payments'].iter_rows(min_row=4, values_only=True))
    out = {}
    def slot(m): return out.setdefault(m, dict(rent=0.0, nrent=0, other=0.0, hold=0.0, bounced=0.0, pending=0.0))
    for r in rows:
        d = r[3]; m = _mon(d)
        if not m or not isinstance(r[5], (int, float)): continue
        amt = float(r[5]); st = _st(r); stl = st.lower(); ds = _ds(r); dsl = ds.lower(); ben = _ben(r).lower()
        if stl == 'harbor fee' or 'harbor real estate' in ben or 'dubai courts' in ben: continue
        s = slot(m)
        paid_like = 'paid' in stl
        if paid_like:
            if stl.startswith('fs') or re.search(r'final settlement|^fs$', dsl) or re.search(r'parking|wasl|access card|ejari|renewal|no info available', dsl):
                s['other'] += amt; continue
            if re.search(r'\bsd\b', dsl) or dsl in ('vat',): continue
            s['rent'] += amt; s['nrent'] += 1
        elif stl == 'hold': s['hold'] += amt
        elif stl == 'bounced': s['bounced'] += amt
        elif stl in ('pdc', '', 'partial', 'bounced partial') and d.date() <= asof:
            s['pending'] += amt
    return out

DIST_RE = re.compile(r'share distribution', re.I)
COURT_RE = re.compile(r'rent revenue|rent to dubai courts', re.I)
def parse_paid(v):
    if isinstance(v, datetime.datetime): return v
    ds = re.findall(r'(\d{1,2})\.(\d{1,2})\.(\d{4})', str(v or ''))
    if not ds: return None
    best = max(datetime.datetime(int(y), int(m), int(d)) for d, m, y in ds)
    return best

def expense_figures(path):
    wb = openpyxl.load_workbook(path, data_only=True)
    ws = wb['Expenses']
    out = {}
    for r in ws.iter_rows(min_row=3, max_col=11, values_only=True):
        if not r[0] and not r[3]: continue
        amt = r[4]
        if not isinstance(amt, (int, float)): continue
        pd = parse_paid(r[8])
        if not pd: continue
        m = pd.strftime('%Y-%m'); it = str(r[3] or '')
        s = out.setdefault(m, dict(dist=0.0, exp=0.0, courtrent=0.0))
        if DIST_RE.search(it): s['dist'] += float(amt)
        elif COURT_RE.search(it): s['courtrent'] += float(amt)
        else: s['exp'] += float(amt)
    return out

def ytd(fig, month, key):
    y = month[:4]
    return sum(v[key] for m, v in fig.items() if m[:4] == y and m <= month)

def month_end(month):
    y, m = int(month[:4]), int(month[5:])
    nxt = datetime.date(y + (m == 12), (m % 12) + 1, 1)
    return nxt - datetime.timedelta(days=1)

def unit_figures(path, month, window=90):
    """Master Sheet recount: units excluding 'No Office' rows, rented/vacant/not recorded, renewals."""
    wb = openpyxl.load_workbook(path, data_only=True)
    ws = wb['Master Sheet']
    asof = month_end(month)
    tot = r = v = u = ip = ex = up = 0
    for row in ws.iter_rows(min_row=2, values_only=True):
        if not row[2] and not row[6]: continue
        unit = str(row[6] or ''); status = str(row[8] or '').strip()
        if 'no office' in unit.lower() or 'no office' in status.lower(): continue
        tot += 1
        s = status.lower()
        if s == 'rented': r += 1
        elif s == 'vacant': v += 1
        else: u += 1
        if s == 'rented' and isinstance(row[18], datetime.datetime):
            d = (row[18].date() - asof).days
            if d <= 30:
                ip += 1
                if d < 0: ex += 1
            elif d <= window: up += 1
    return dict(total=tot, rented=r, vacant=v, not_recorded=u, in_progress=ip, upcoming=up, expired=ex)

def control_months(path, months, asof):
    pf = payments_figures(path, asof); ef = expense_figures(path)
    out = {}
    for m in months:
        p = pf.get(m, dict(rent=0, nrent=0, other=0, hold=0, bounced=0, pending=0)); e = ef.get(m, dict(dist=0, exp=0, courtrent=0))
        uf = unit_figures(path, m)
        out[m] = dict(rent_m=round(p['rent'], 2), rent_y=round(ytd(pf, m, 'rent'), 2), nrent_m=p['nrent'], other_m=round(p['other'], 2),
                      hold_m=round(p['hold'], 2), bounced_m=round(p['bounced'], 2), pending_m=round(p['pending'], 2),
                      dist_m=round(e['dist'], 2), dist_y=round(ytd(ef, m, 'dist'), 2), exp_m=round(e['exp'], 2), exp_y=round(ytd(ef, m, 'exp'), 2),
                      courtrent_m=round(e['courtrent'], 2), in_progress=uf['in_progress'], upcoming=uf['upcoming'], expired=uf['expired'])
    return out
