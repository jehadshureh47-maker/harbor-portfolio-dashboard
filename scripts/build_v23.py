"""Build v23 from v22: python3 build_v23.py <in.html> <out.html>
Exact-string replacements with count asserts. Report blocks are base64 UTF-8 HTML; they are decoded,
patched and re-encoded only for the three Cheque Count blocks. Every other data block stays byte-identical."""
import sys, re, base64

src, dst = sys.argv[1], sys.argv[2]
h = open(src, encoding='utf-8').read()

def rep(s, old, new, n=1, label=''):
    c = s.count(old)
    assert c == n, f'{label or old[:50]!r}: expected {n}, found {c}'
    return s.replace(old, new)

# 1. P1: summary layout rule must only apply when the briefing is present
h = rep(h,
    '.exec-fit[data-exec-active="summary"] > #execHeroWrap{grid-column:1 / -1; grid-row:3 / 5; min-height:0; display:block;}',
    '.exec-fit.exec-has-briefing[data-exec-active="summary"] > #execHeroWrap{grid-column:1 / -1; grid-row:3 / 5; min-height:0; display:block;}',
    label='P1 css')

# 1b. Installments tab "Sheet vs Details": count every Details contract (not only those whose plan is in the sheet)
h = rep(h,
    'var dc = dContracts, di = dInst, same = dc === contracts && di === inst;',
    'var dc = 0, di = 0; list.forEach(function(c){ if(keep(c.kind)){ dc++; di += (+c.n || 0); } }); var same = dc === contracts && di === inst;',
    label='sheet vs details')

# 1c. RTA: 51.4% is completed + not renewing (closed out), not "renewed"
h = rep(h, "fmtPctVal(rn.renewal_progress) + ' renewed',",
           "fmtPctVal(rn.renewal_progress) + ' closed (completed or not renewing)',", label='rta card')
h = rep(h, '${fmtPctVal(rn.renewal_progress)} have completed,',
           '${fmtPctVal(rn.renewal_progress)} are closed out (completed or not renewing),', label='rta en')
h = rep(h, 'اكتمل ${fmtPctVal(rn.renewal_progress)}،',
           'أُغلق ${fmtPctVal(rn.renewal_progress)} منها (مكتمل أو لن يتجدد)،', label='rta ar')

# 2. Cheque Count report: Bank N/A note counts every line (blank or N/A) against all lines
def patch_cc(s):
    s = rep(s, '  // Pass 1: collect every valid, filter-passing line',
               '  let bankNaAll = 0;\n  // Pass 1: collect every valid, filter-passing line', label='decl')
    s = rep(s, '    totalLines++;\n    totalAmount += amount;',
               '    totalLines++;\n    if(!bank || /^n\\/?a$/i.test(bank)) bankNaAll++;\n    totalAmount += amount;', label='count')
    s = rep(s, "bank_na_count: (bankCounts['N/A'] || 0),", 'bank_na_count: bankNaAll,', label='export')
    return s

pat = re.compile(r'[A-Za-z0-9+/]{100000,}={0,2}')
done = 0
out, pos = [], 0
for m in pat.finditer(h):
    b = m.group(0)
    try:
        s = base64.b64decode(b).decode('utf-8')
    except Exception:
        continue
    if '<title>Cheque Count Dashboard' not in s:
        continue
    s2 = patch_cc(s)
    out.append(h[pos:m.start()]); out.append(base64.b64encode(s2.encode('utf-8')).decode('ascii'))
    pos = m.end(); done += 1
out.append(h[pos:])
assert done == 3, done
h = ''.join(out)

open(dst, 'w', encoding='utf-8').write(h)
print('built', dst, len(h))
