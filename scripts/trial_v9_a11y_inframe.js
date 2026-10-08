(function(){
  if(window.__v9a11y) return; window.__v9a11y = 1;
  document.addEventListener('keydown', function(e){
    if(e.key !== 'Enter' && e.key !== ' ') return;
    var t = e.target; if(!t || !t.closest) return;
    var el = t.closest('[role="button"][tabindex]');
    if(!el || el !== t || /^(BUTTON|A|INPUT|TEXTAREA|SELECT)$/.test(el.tagName)) return;
    e.preventDefault(); (typeof el.click === 'function' ? el.click() : el.dispatchEvent(new MouseEvent('click', {bubbles: true, cancelable: true})));
  });
})();
