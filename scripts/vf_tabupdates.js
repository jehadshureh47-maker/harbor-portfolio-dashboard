/* Per-tab Updates (trial v17): an Updates button on every tab, listing what has been added or changed for that tab.
   TO ADD AN ENTRY: add a { date: 'YYYY-MM-DD', items: [ { en: '...', ar: '...' } ] } object at the TOP of that tab's list below. Nothing else needs editing. */
(function(){
  if(window.TAB_UPDATES) return;
  var EXPORT = {en: "Export Excel returns the month's original workbook, with all its sheets and columns.", ar: 'يعيد تصدير Excel ملف Excel الأصلي للشهر بجميع أوراقه وأعمدته.'};
  var DRILL = {en: 'Click any figure to see the contracts behind it. Each list checks itself against the figure and shows a green tick when they match. Click a contract number for everything about that contract across the four reports, or type one into the Contract number box.', ar: 'انقر على أي رقم لعرض العقود التي يتكوّن منها. تتحقق كل قائمة من نفسها مقابل الرقم وتُظهر علامة خضراء عند التطابق. انقر على رقم العقد لرؤية كل ما يخصه في التقارير الأربعة، أو اكتب رقماً في خانة رقم العقد.'};
  window.TAB_UPDATES = {
    'overview': [
      {date: '2026-10-22', items: [{en: 'The dashboard reopens on the portfolio, month and tab you were last viewing.', ar: 'تُعيد اللوحة فتح المحفظة والشهر والتبويب الذي كنت تعرضه آخر مرة.'}]},
      {date: '2026-10-16', items: [
        {en: 'Charts animate in when the tab opens, and the page no longer jumps around while the reports load.', ar: 'تظهر الرسوم البيانية بحركة عند فتح التبويب، ولم تعد الصفحة تقفز أثناء تحميل التقارير.'},
        {en: 'September 2026 is included for Awqaf: 1,609 installments on 405 contracts, AED 22.81M recorded, 31 bounced cheques (1.8%).', ar: 'تم إدراج سبتمبر 2026 للأوقاف: 1,609 دفعات على 405 عقداً، و22.81 مليون درهم مسجلة، و31 شيكاً مرتجعاً (1.8%).'}]}
    ],
    'execsummary': [
      {date: '2026-10-16', items: [{en: 'September 2026 is included, with the changes against the previous period.', ar: 'تم إدراج سبتمبر 2026 مع التغيرات مقارنة بالفترة السابقة.'}]}
    ],
    'compare': [
      {date: '2026-10-16', items: [{en: 'September 2026 is available in the comparisons.', ar: 'أصبح سبتمبر 2026 متاحاً في المقارنات.'}]}
    ],
    'dataquality': [
      {date: '2026-10-16', items: [{en: 'September 2026 is checked across the four reports, and the cross-checks to review are listed here.', ar: 'تم فحص سبتمبر 2026 عبر التقارير الأربعة، وتُعرض هنا عمليات التحقق المتقاطع التي تحتاج مراجعة.'}]}
    ],
    'lease-activity': [
      {date: '2026-10-16', items: [{en: 'September 2026: 515 lease contracts (501 renewals, 14 new), with AED 785K rent on the new leases.', ar: 'سبتمبر 2026: 515 عقد إيجار (501 تجديد و14 جديداً)، بإيجار 785 ألف درهم للعقود الجديدة.'}]}
    ],
    'request-count': [
      {date: '2026-10-22', items: [EXPORT, DRILL]},
      {date: '2026-10-16', items: [{en: 'September 2026: 412 requests worth AED 585K.', ar: 'سبتمبر 2026: 412 طلباً بقيمة 585 ألف درهم.'}]}
    ],
    'new-lease': [
      {date: '2026-10-22', items: [EXPORT, DRILL, {en: 'Tenant names appear in the lists, taken from Cheque Count by contract number.', ar: 'تظهر أسماء المستأجرين في القوائم، مأخوذة من تقرير عدد الشيكات بحسب رقم العقد.'}]},
      {date: '2026-10-16', items: [{en: 'September 2026: 14 new leases, AED 785K rent value and AED 885K fees recorded.', ar: 'سبتمبر 2026: 14 عقداً جديداً، بقيمة إيجار 785 ألف درهم ورسوم مسجلة 885 ألف درهم.'}]}
    ],
    'bounced-cheques': [
      {date: '2026-10-22', items: [EXPORT, DRILL]},
      {date: '2026-10-16', items: [{en: 'September 2026: 31 bounced cheques worth AED 415K, 1.8% of recorded value, under the 2% target.', ar: 'سبتمبر 2026: 31 شيكاً مرتجعاً بقيمة 415 ألف درهم، أي 1.8% من القيمة المسجلة، دون الهدف 2%.'}]}
    ],
    'count-report': [
      {date: '2026-10-22', items: [EXPORT, DRILL]},
      {date: '2026-10-16', items: [{en: 'September 2026: 1,609 installments on 405 contracts, AED 22.81M recorded.', ar: 'سبتمبر 2026: 1,609 دفعات على 405 عقداً، و22.81 مليون درهم مسجلة.'}]}
    ]
  };
  var TITLES = {
    'overview': ['Overview', 'نظرة عامة'], 'execsummary': ['Executive Summary', 'الملخص التنفيذي'], 'compare': ['Compare', 'المقارنة'], 'dataquality': ['Data Quality', 'جودة البيانات'],
    'lease-activity': ['Lease Activity', 'نشاط التأجير'], 'request-count': ['Request Count', 'عدد الطلبات'], 'new-lease': ['New Lease', 'عقود الإيجار الجديدة'],
    'bounced-cheques': ['Bounced Cheques', 'الشيكات المرتجعة'], 'count-report': ['Cheque Count', 'عدد الشيكات']
  };
  var AR = {'Updates': 'التحديثات', 'Recent changes to this tab': 'آخر التغييرات في هذا التبويب', 'No updates logged for this tab yet.': 'لا توجد تحديثات مسجلة لهذا التبويب بعد.'};
  try{ if(typeof REMAINING_UI === 'object') Object.keys(AR).forEach(function(k){ if(!(k in REMAINING_UI)) REMAINING_UI[k] = AR[k]; }); }catch(e){}
  function tr(s){ try{ return typeof remainingText === 'function' ? remainingText(s) : s; }catch(e){ return s; } }
  function isAr(){ try{ return document.documentElement.lang === 'ar' || document.documentElement.dir === 'rtl'; }catch(e){ return false; } }
  function lang(o){ return isAr() ? (o.ar || o.en) : o.en; }
  var KEY = 'vfTabSeen_';
  function latest(id){ var l = window.TAB_UPDATES[id]; return l && l[0] && l[0].date; }
  function unseen(id){ var d = latest(id); if(!d) return false; try{ return localStorage.getItem(KEY + id) !== d; }catch(e){ return false; } }
  function seen(id){ var d = latest(id); if(!d) return; try{ localStorage.setItem(KEY + id, d); }catch(e){} }
  function esc(s){ return String(s).replace(/[&<>"]/g, function(c){ return {'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'}[c]; }); }
  var dlg = null, openId = null, trigger = null;
  function ensure(){
    if(dlg) return dlg;
    dlg = document.createElement('dialog'); dlg.id = 'vfTabUpdatesModal'; dlg.className = 'hm-modal';
    dlg.setAttribute('aria-labelledby', 'vfTabUpdatesTitle');
    dlg.innerHTML = '<div class="hm-modal-head"><div><div class="hm-modal-title" id="vfTabUpdatesTitle"></div><div class="hm-modal-sub" id="vfTabUpdatesSub"></div></div><button class="hm-modal-close" type="button" aria-label="Close">&#10005;</button></div><div id="vfTabUpdatesBody"></div>';
    dlg.querySelector('.hm-modal-close').addEventListener('click', function(){ dlg.close(); });
    dlg.addEventListener('click', function(ev){
      if(ev.target !== dlg) return;
      var r = dlg.getBoundingClientRect();
      if(!(r.top <= ev.clientY && ev.clientY <= r.bottom && r.left <= ev.clientX && ev.clientX <= r.right)) dlg.close();
    });
    dlg.addEventListener('close', function(){ if(openId) seen(openId); openId = null; refresh(); if(trigger && trigger.focus) trigger.focus(); trigger = null; });
    document.body.appendChild(dlg); return dlg;
  }
  function open(id){
    var d = ensure(); openId = id; trigger = document.activeElement;
    var t = TITLES[id] || [id, id];
    d.querySelector('#vfTabUpdatesTitle').textContent = tr('Updates') + ' · ' + (isAr() ? t[1] : t[0]);
    d.querySelector('#vfTabUpdatesSub').textContent = tr('Recent changes to this tab');
    var groups = window.TAB_UPDATES[id] || [];
    d.querySelector('#vfTabUpdatesBody').innerHTML = groups.length ? groups.map(function(g){
      var when = new Date(g.date + 'T00:00:00Z').toLocaleDateString(isAr() ? 'ar-AE' : 'en-GB', {day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC'});
      return '<div class="wn-group"><div class="wn-date">' + esc(when) + '</div><ul class="wn-list">' + g.items.map(function(i){ return '<li>' + esc(lang(i)) + '</li>'; }).join('') + '</ul></div>';
    }).join('') : '<div class="wn-group"><div class="wn-list" style="color:var(--sub);">' + esc(tr('No updates logged for this tab yet.')) + '</div></div>';
    if(!d.open) d.showModal();
  }
  function decorate(){
    document.querySelectorAll('.report-pane[data-report]').forEach(function(p){
      var id = p.dataset.report;
      if(id === 'overview' || !window.TAB_UPDATES[id] || p.querySelector(':scope > .vf-bar [data-vf-tabupd]')) return;
      var bar = p.querySelector(':scope > .vf-bar');
      if(!bar){ bar = document.createElement('div'); bar.className = 'vf-bar'; p.insertBefore(bar, p.firstChild); }
      var b = document.createElement('button'); b.type = 'button'; b.className = 'theme-switch vf-tabupd'; b.setAttribute('data-vf-tabupd', id);
      b.addEventListener('click', function(){ open(id); });
      bar.insertBefore(b, bar.firstChild);
    });
    refresh();
  }
  function refresh(){
    document.querySelectorAll('[data-vf-tabupd]').forEach(function(b){
      var id = b.getAttribute('data-vf-tabupd'), t = tr('Updates');
      if(b.firstChild && b.firstChild.nodeType === 3 && b.firstChild.nodeValue === t) { /* label ok */ } else b.textContent = t;
      var dot = b.querySelector('.vf-tabdot'), u = unseen(id);
      if(u && !dot){ dot = document.createElement('span'); dot.className = 'vf-tabdot'; dot.setAttribute('aria-hidden', 'true'); b.appendChild(dot); }
      if(!u && dot) dot.remove();
    });
  }
  var panes = document.getElementById('panes');
  if(panes){ new MutationObserver(decorate).observe(panes, {childList: true}); }
  decorate(); setInterval(decorate, 1000);
  window.TabUpdates = {open: open, decorate: decorate, unseen: unseen};
})();
