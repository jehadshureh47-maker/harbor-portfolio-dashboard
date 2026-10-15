"""Build Dashboard_TRIAL_v11.html from Dashboard_TRIAL_v10.html: adds an in-dashboard TV mode (button + CSS + JS).
Usage: python3 build_trial_v11.py <v10.html> <v11.html>"""
import sys, os
src, dst = sys.argv[1], sys.argv[2]
here = os.path.dirname(os.path.abspath(__file__))
h = open(src, encoding='utf-8').read()
css = open(os.path.join(here, 'tv_mode.css'), encoding='utf-8').read()
js = open(os.path.join(here, 'tv_mode.js'), encoding='utf-8').read()

anchor = '<button class="theme-switch" id="themeToggleMain" type="button" aria-label="Toggle light/dark mode" title="Toggle light/dark mode">'
assert h.count(anchor) == 1, 'theme toggle anchor'
btn = ('<button class="theme-switch" id="tvBtn" type="button" data-i18n-aria-label="nav.tvAria" aria-label="Open TV mode" '
       'data-i18n-title="nav.tvTitle" title="Full-screen wallboard for an office TV">'
       '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'
       '<rect x="2" y="4" width="20" height="13" rx="2"/><path d="M8 21h8M12 17v4"/></svg><span data-i18n="nav.tv">TV</span></button>')
h = h.replace(anchor, btn + anchor)

i = h.index('</head>')
assert i < h.index('<body'), 'head order'
h = h[:i] + '<style id="tvModeCss">\n' + css + '\n</style>\n' + h[i:]

tail = '</script>\n</body>'
j = h.rindex(tail)
h = h[:j] + '</script>\n<script id="tvModeJs">\n' + js + '\n' + tail[0:9] + h[j+9:]
open(dst, 'w', encoding='utf-8').write(h)
print('built', dst, len(h))
