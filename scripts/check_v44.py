"""Check Dashboard_RELEASE_v44.html against the live index.html: only the six patched report blobs differ,
the shell outside the blobs is identical, and every inline script in the patched blobs parses (node --check)."""
import re, base64, subprocess, os
a = open('index.html', encoding='utf-8').read()
b = open('Dashboard_RELEASE_v44.html', encoding='utf-8').read()
RX = r'"([\w-]+)":\s*"([A-Za-z0-9+/=]{200,})"'
pa, pb = re.findall(RX, a), re.findall(RX, b)
print('blobs', len(pa), len(pb))
print('changed blobs', [x[0] for x, y in zip(pa, pb) if x[1] != y[1]])
strip = lambda s: re.sub(RX, '"B"', s)
sa, sb = strip(a), strip(b)
import difflib
d = [x for x in difflib.ndiff(sa.split('\n'), sb.split('\n')) if x[:2] in ('- ', '+ ')]
print('shell lines changed:', len(d))
for x in d: print('   ', x[:200])
out = '/tmp/bcfix/chk'; os.makedirs(out, exist_ok=True)
n = fails = 0
for (k, v), (_, v0) in zip(pb, pa):
    if v == v0:
        continue
    h = base64.b64decode(v).decode('utf-8')
    for i, sc in enumerate(re.findall(r'<script(?![^>]*src)[^>]*>(.*?)</script>', h, re.S)):
        p = f'{out}/{k}_{n}_{i}.js'; open(p, 'w').write(sc)
        r = subprocess.run(['node', '--check', p], capture_output=True, text=True)
        if r.returncode:
            fails += 1; print('SYNTAX FAIL', p, r.stderr[:300])
    n += 1
print('checked', n, 'patched blobs, syntax failures:', fails)
