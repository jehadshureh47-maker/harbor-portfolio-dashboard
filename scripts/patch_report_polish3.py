#!/usr/bin/env python3
"""Pass 3: outer + inner border rings on the report donut charts. Idempotent."""
import re, base64, pathlib
ROOT = pathlib.Path(__file__).resolve().parent.parent
f = ROOT / 'Dashboard_v2.html'
s = f.read_text(encoding='utf-8')
MARK = 'donut-ring-border'
RING = ("const ringBorder = `<circle class=\"donut-ring-border\" cx=\"${cx}\" cy=\"${cy}\" r=\"${r}\" fill=\"none\" stroke=\"var(--border)\" stroke-width=\"1.5\" vector-effect=\"non-scaling-stroke\" pointer-events=\"none\"/>"
        "<circle class=\"donut-ring-border\" cx=\"${cx}\" cy=\"${cy}\" r=\"${(r*inner).toFixed(1)}\" fill=\"none\" stroke=\"var(--border)\" stroke-width=\"1.5\" vector-effect=\"non-scaling-stroke\" pointer-events=\"none\"/>`;\n  ")
n = {'done': 0, 'skip': 0}
def patch(h, key):
    if MARK in h: n['skip'] += 1; return h
    i = h.index('function donutChart')
    old = 'return `<svg class="donut-svg" viewBox="0 0 ${w} ${actualH}" xmlns="http://www.w3.org/2000/svg">${paths}${legendSvg}</svg>`'
    j = h.index(old, i)
    new = RING + old.replace('${paths}${legendSvg}', '${paths}${ringBorder}${legendSvg}')
    n['done'] += 1
    return h[:j] + new + h[j+len(old):]
def sub(m):
    h = patch(base64.b64decode(m.group(2)).decode('utf-8'), m.group(1))
    return '"%s": "%s"' % (m.group(1), base64.b64encode(h.encode('utf-8')).decode('ascii'))
s2 = re.sub(r'"(request-count|new-lease|count-report|bounced-cheques)"\s*:\s*"([A-Za-z0-9+/=]{100000,})"', sub, s)
f.write_text(s2, encoding='utf-8'); print(n)
