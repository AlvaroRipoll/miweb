/* reveal.js — microinteracciones con intención.
   Aparición al scroll (una sola vez) + contador que sube hasta su valor.
   Se apaga si el sistema pide menos movimiento. No toca tu style.css. */
(function () {
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var st = document.createElement('style');
  st.textContent =
    '.rv{opacity:0;transform:translateY(20px);transition:opacity .6s ease,transform .6s ease}' +
    '.rv.rv-in{opacity:1;transform:none}' +
    '@media (prefers-reduced-motion: reduce){.rv{opacity:1!important;transform:none!important;transition:none}}';
  document.head.appendChild(st);
  function run() {
    var targets = document.querySelectorAll('[data-reveal]');
    if (!targets.length) targets = document.querySelectorAll('section');
    if (reduce) { targets.forEach(function (e) { e.classList.add('rv','rv-in'); }); }
    else {
      targets.forEach(function (e) { e.classList.add('rv'); });
      var io = new IntersectionObserver(function (ents) {
        ents.forEach(function (en) {
          if (en.isIntersecting) { en.target.classList.add('rv-in'); io.unobserve(en.target); }
        });
      }, { threshold: 0.15 });
      targets.forEach(function (e) { io.observe(e); });
    }
    document.querySelectorAll('[data-count]').forEach(function (el) {
      var fin = parseInt(el.getAttribute('data-count'), 10) || 0;
      if (reduce) { el.textContent = fin; return; }
      var io2 = new IntersectionObserver(function (ents) {
        ents.forEach(function (en) {
          if (!en.isIntersecting) return;
          io2.unobserve(en.target);
          var t0 = performance.now();
          (function paso(t) {
            var p = Math.min((t - t0) / 1000, 1);
            el.textContent = Math.round(fin * p);
            if (p < 1) requestAnimationFrame(paso);
          })(t0);
        });
      }, { threshold: 0.5 });
      io2.observe(el);
    });
  }
  if (document.readyState !== 'loading') run();
  else document.addEventListener('DOMContentLoaded', run);
})();
