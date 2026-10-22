"""Build the audit trail trial: python3 build_trial_v20.py <in.html> <out.html>
Injects scripts/vf_audit.js after the week 4 script. Nothing else changes."""
import sys, os
src, dst = sys.argv[1], sys.argv[2]
here = os.path.dirname(os.path.abspath(__file__))
h = open(src, encoding='utf-8').read()
js = open(os.path.join(here, 'vf_audit.js'), encoding='utf-8').read()
assert 'id="vfWeek4"' in h and 'id="vfAudit"' not in h
tail = '</script>\n</body>'
j = h.rindex(tail)
h = h[:j] + '</script>\n<script id="vfAuditJs">\n' + js + '\n</script>\n</body>' + h[j + len(tail):]
open(dst, 'w', encoding='utf-8').write(h)
print('built', dst, len(h))
