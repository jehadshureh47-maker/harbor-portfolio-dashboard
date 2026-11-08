"""Check Dashboard_RELEASE_v46.html against the live index.html: every existing report blob is unchanged, the four
October blobs are the only new ones, list the shell lines that changed, and node --check every inline script
(shell + October report pages)."""
import re, base64, subprocess, os, difflib
a = open('index.html', encoding='utf-8').read(); b = open('Dashboard_RELEASE_v46.html', encoding='utf-8').read()
RX = r'"([\w-]+)":\s*"([A-Za-z0-9+/=]{200,})"'
pa, pb = re.findall(RX, a), re.findall(RX, b)
print('blobs', len(pa), len(pb))
vb = set(v for k, v in pb)
print('all existing blobs present unchanged:', all(v in vb for k, v in pa))
sa, sb = re.sub(RX, '"B"', a), re.sub(RX, '"B"', b)
sa = re.sub(r'window.__VF_ORIGINALS=.*?;</script>', 'VF', sa, flags=re.S); sb = re.sub(r'window.__VF_ORIGINALS=.*?;</script>', 'VF', sb, flags=re.S)
d = [x for x in difflib.ndiff(sa.split('\n'), sb.split('\n')) if x[:2] in ('- ', '+ ')]
print('shell lines changed', len(d))
for x in d: print('   ', x[:170])
os.makedirs('/tmp/v46chk', exist_ok=True); n = fails = 0
def chk(name, sc):
    global n, fails
    p = '/tmp/v46chk/%s.js' % name; open(p, 'w').write(sc); n += 1
    r = subprocess.run(['node', '--check', p], capture_output=True, text=True)
    if r.returncode: fails += 1; print('SYNTAX FAIL', p, r.stderr[:300])
for i, sc in enumerate(re.findall(r'<script(?![^>]*src)[^>]*>(.*?)</script>', b, re.S)): chk('shell_%d' % i, sc)
oct_i = b.index('const EMBEDDED_DASHBOARDS_OCT = {'); oct_blobs = re.findall(RX, b[oct_i:b.index('\n};', oct_i)])
for k, v in oct_blobs:
    h = base64.b64decode(v).decode('utf-8')
    for i, sc in enumerate(re.findall(r'<script(?![^>]*src)[^>]*>(.*?)</script>', h, re.S)): chk('oct_%s_%d' % (k, i), sc)
print('October blobs', [k for k, v in oct_blobs], '| scripts checked', n, 'syntax failures', fails)
