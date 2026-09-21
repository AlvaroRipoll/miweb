/* ==========================================================================
   SCRIPT.JS — Web personal de Álvaro Ripoll Chaquet
   --------------------------------------------------------------------------
   Contiene, todo con guardas (no rompe si falta un elemento):
     0) Clase .js + detección de "menos movimiento"
     1) Apariciones al hacer scroll (data-reveal / data-reveal-delay)
     2) Contadores animados (data-count)
     3) Título "descifrado" (data-scramble)
     4) Rotación de palabra (data-rotate)
     5) Inclinación 3D de la tarjeta (data-tilt)
     6) Sección activa en la barra (data-nav)
     7) Barra de progreso de lectura (#progress-bar)
     8) Reloj local de Xàtiva (#hora-local) y año (#anio)
     9) Modo claro/oscuro con localStorage (#theme-toggle)
    10) Partículas que siguen al cursor (#cursor-particles)
   ========================================================================== */
(function () {
  'use strict';

  /* --- 0. Preparativos --------------------------------------------------- */
  var root = document.documentElement;
  root.classList.add('js'); // habilita los estados de animación del CSS

  var REDUCE = false;

  /* --- 1. Apariciones al hacer scroll ------------------------------------ */
  var reveals = document.querySelectorAll('[data-reveal]');
  if ('IntersectionObserver' in window && reveals.length) {
    var ioReveal = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var el = en.target;
        var d = el.getAttribute('data-reveal-delay');
        if (d) {
          el.style.transitionDelay = d + 'ms';
          // limpiamos el delay tras la animación para no frenar el :hover
          setTimeout(function () { el.style.transitionDelay = ''; }, parseInt(d, 10) + 900);
        }
        el.classList.add('is-visible');
        ioReveal.unobserve(el);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    reveals.forEach(function (el) { ioReveal.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add('is-visible'); });
  }

  /* --- 2. Contadores animados (data-count) ------------------------------- */
  function animarContador(el) {
    var target = parseFloat(el.dataset.count) || 0;
    if (REDUCE) { el.textContent = target; return; }
    var dur = 1200, start = null;
    function paso(now) {
      if (start === null) start = now;
      var p = Math.min((now - start) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3); // ease-out cúbico
      el.textContent = Math.round(target * eased);
      if (p < 1) requestAnimationFrame(paso);
    }
    requestAnimationFrame(paso);
  }
  var contadores = document.querySelectorAll('[data-count]');
  if ('IntersectionObserver' in window && contadores.length && !REDUCE) {
    var ioCount = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { animarContador(en.target); ioCount.unobserve(en.target); }
      });
    }, { threshold: 0.6 });
    contadores.forEach(function (el) { ioCount.observe(el); });
  } else {
    contadores.forEach(function (el) { el.textContent = parseFloat(el.dataset.count) || el.textContent; });
  }

  /* --- 3. Título "descifrado" (data-scramble) ---------------------------- */
  function descifrar(el) {
    var final = el.dataset.scramble || el.textContent;
    var chars = '!<>-_\\/[]{}=+*^?#·';
    var cola = [];
    for (var i = 0; i < final.length; i++) {
      var ini = Math.floor(Math.random() * 18);
      var fin = ini + Math.floor(Math.random() * 18) + 8;
      cola.push({ to: final[i], ini: ini, fin: fin, ch: null });
    }
    var frame = 0;
    (function upd() {
      var out = '', done = 0;
      for (var j = 0; j < cola.length; j++) {
        var q = cola[j];
        if (frame >= q.fin) { done++; out += q.to; }
        else if (frame >= q.ini) {
          if (!q.ch || Math.random() < 0.28) q.ch = chars[Math.floor(Math.random() * chars.length)];
          out += '<span style="color:var(--terra)">' + q.ch + '</span>';
        } else { out += '&nbsp;'; }
      }
      el.innerHTML = out;
      if (done === cola.length) return;
      frame++;
      requestAnimationFrame(upd);
    })();
  }
  var scrambles = document.querySelectorAll('[data-scramble]');
  if (!REDUCE && 'IntersectionObserver' in window && scrambles.length) {
    var ioScr = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { descifrar(en.target); ioScr.unobserve(en.target); }
      });
    }, { threshold: 0.6 });
    scrambles.forEach(function (el) { ioScr.observe(el); });
  }

  /* --- 4. Rotación de palabra (data-rotate) ------------------------------ */
  if (!REDUCE) {
    document.querySelectorAll('[data-rotate]').forEach(function (el) {
      var arr;
      try { arr = JSON.parse(el.dataset.rotate); } catch (e) { return; }
      if (!arr || !arr.length) return;
      el.style.transition = 'opacity .3s ease';
      var i = 0;
      setInterval(function () {
        i = (i + 1) % arr.length;
        el.style.opacity = 0;
        setTimeout(function () { el.textContent = arr[i]; el.style.opacity = 1; }, 300);
      }, 2600);
    });
  }

  /* --- 5. Inclinación 3D de la tarjeta (data-tilt) ----------------------- */
  if (!REDUCE) {
    document.querySelectorAll('[data-tilt]').forEach(function (el) {
      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width - 0.5;
        var py = (e.clientY - r.top) / r.height - 0.5;
        el.style.transform = 'perspective(700px) rotateX(' + (-py * 6) + 'deg) rotateY(' + (px * 8) + 'deg)';
      });
      el.addEventListener('pointerleave', function () { el.style.transform = ''; });
    });
  }

  /* --- 6. Sección activa en la barra (data-nav) -------------------------- */
  var navLinks = document.querySelectorAll('[data-nav]');
  if ('IntersectionObserver' in window && navLinks.length) {
    var mapa = new Map();
    navLinks.forEach(function (l) {
      var sec = document.getElementById(l.getAttribute('href').slice(1));
      if (sec) mapa.set(sec, l);
    });
    var ioNav = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var link = mapa.get(en.target);
        if (!link) return;
        navLinks.forEach(function (x) { x.classList.remove('is-active'); });
        link.classList.add('is-active');
      });
    }, { rootMargin: '-45% 0px -50% 0px', threshold: 0 });
    mapa.forEach(function (link, sec) { ioNav.observe(sec); });
  }

  /* --- 7. Barra de progreso de lectura (#progress-bar) ------------------- */
  var barra = document.getElementById('progress-bar');
  if (barra) {
    var prog = function () {
      var h = root.scrollHeight - window.innerHeight;
      barra.style.width = (h > 0 ? (window.scrollY / h) * 100 : 0) + '%';
    };
    window.addEventListener('scroll', prog, { passive: true });
    window.addEventListener('resize', prog);
    prog();
  }

  /* --- 8. Reloj local de Xàtiva (#hora-local) y año (#anio) -------------- */
  var reloj = document.getElementById('hora-local');
  function tick() {
    if (!reloj) return;
    try {
      reloj.textContent = new Intl.DateTimeFormat('es-ES', {
        hour: '2-digit', minute: '2-digit', second: '2-digit',
        hour12: false, timeZone: 'Europe/Madrid'
      }).format(new Date());
    } catch (e) {
      reloj.textContent = new Date().toLocaleTimeString('es-ES');
    }
  }
  if (reloj) { tick(); setInterval(tick, 1000); }

  var anio = document.getElementById('anio');
  if (anio) anio.textContent = new Date().getFullYear();

  /* --- 9. Modo claro/oscuro con localStorage (#theme-toggle) ------------- */
  var btnTema = document.getElementById('theme-toggle');
  function aplicarTema(t) {
    root.setAttribute('data-theme', t);
    if (btnTema) {
      var oscuro = (t === 'dark');
      btnTema.setAttribute('aria-pressed', String(oscuro));
      btnTema.setAttribute('aria-label', oscuro ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro');
    }
    // avisamos a las partículas para que refresquen sus colores
    window.dispatchEvent(new CustomEvent('themechange'));
  }
  if (btnTema) {
    btnTema.addEventListener('click', function () {
      var siguiente = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      try { localStorage.setItem('tema', siguiente); } catch (e) {}
      aplicarTema(siguiente);
    });
  }
  // Sincroniza el botón con el tema ya aplicado (por el mini-script del head)
  aplicarTema(root.getAttribute('data-theme') || 'light');

  /* --- 10. Partículas del cursor (sutiles, solo color de marca) ---------- */
  (function () {
    if (REDUCE) { console.log('[mi-web] partículas OFF: prefers-reduced-motion'); return; }
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
      console.log('[mi-web] partículas OFF: dispositivo táctil'); return;
    }

    // Si no existe el canvas en el HTML, lo creamos
    var canvas = document.getElementById('cursor-particles');
    if (!canvas) {
      canvas = document.createElement('canvas');
      canvas.id = 'cursor-particles';
      canvas.setAttribute('aria-hidden', 'true');
      document.body.appendChild(canvas);
    }
    var st = canvas.style;
    st.position = 'fixed'; st.top = '0'; st.left = '0';
    st.width = '100%'; st.height = '100%';
    st.pointerEvents = 'none'; st.zIndex = '30'; st.display = 'block';

    var ctx = canvas.getContext('2d');
    if (!ctx) return;
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var W = 0, H = 0, partes = [], colorMarca;

    // Solo el color de marca (terracota), leído de la variable CSS
    function leerColor() {
      colorMarca = (getComputedStyle(root).getPropertyValue('--terra') || '#B9502F').trim();
    }
    function redimensionar() {
      W = canvas.width  = Math.floor(window.innerWidth  * dpr);
      H = canvas.height = Math.floor(window.innerHeight * dpr);
    }
    function crear(x, y) {
          function crear(x, y) {
      if (partes.length > 90) return;              // techo más alto: caben más a la vez
      if (Math.random() < 0.35) return;            // se salta menos → nacen más
      var ang = Math.random() * Math.PI * 2;
      var vel = Math.random() * 0.5 + 0.08;
      partes.push({
        x: x * dpr, y: y * dpr,
        vx: Math.cos(ang) * vel, vy: Math.sin(ang) * vel - 0.04,
        vida: 1, decaer: Math.random() * 0.018 + 0.014,
        r: (Math.random() * 1.1 + 0.6) * dpr,
        c: colorMarca
      });
    }
      var ang = Math.random() * Math.PI * 2;
      var vel = Math.random() * 0.5 + 0.08;
      partes.push({
        x: x * dpr, y: y * dpr,
        vx: Math.cos(ang) * vel, vy: Math.sin(ang) * vel - 0.04,
        vida: 1, decaer: Math.random() * 0.018 + 0.014,
        r: (Math.random() * 1.1 + 0.6) * dpr,      // radio más pequeño
        c: colorMarca                              // siempre el mismo color
      });
    }
    function bucle() {
      ctx.clearRect(0, 0, W, H);
      for (var i = partes.length - 1; i >= 0; i--) {
        var p = partes[i];
        p.x += p.vx; p.y += p.vy;
        p.vy += 0.0015; p.vx *= 0.98; p.vy *= 0.98;
        p.vida -= p.decaer;
        if (p.vida <= 0) { partes.splice(i, 1); continue; }
        ctx.globalAlpha = Math.max(p.vida, 0) * 0.32; // más transparente
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r * p.vida + 0.2, 0, Math.PI * 2);
        ctx.fillStyle = p.c;
        ctx.shadowColor = p.c;
        ctx.shadowBlur = 4 * dpr;                    // brillo suave, casi imperceptible
        ctx.fill();
      }
      ctx.globalAlpha = 1; ctx.shadowBlur = 0;
      requestAnimationFrame(bucle);
    }
    leerColor(); redimensionar();
    window.addEventListener('resize', redimensionar);
    window.addEventListener('pointermove', function (e) { crear(e.clientX, e.clientY); });
    window.addEventListener('themechange', leerColor);
    bucle();
  })();
    /* --- 11. Menú móvil (hamburguesa) -------------------------------------- */
  (function () {
    var toggle = document.getElementById('nav-toggle');
    var menu = document.getElementById('menu');
    if (!toggle || !menu) return;

    function abrir() { menu.classList.add('is-open'); toggle.setAttribute('aria-expanded', 'true'); toggle.setAttribute('aria-label', 'Cerrar menú'); }
    function cerrar() { menu.classList.remove('is-open'); toggle.setAttribute('aria-expanded', 'false'); toggle.setAttribute('aria-label', 'Abrir menú'); }

    toggle.addEventListener('click', function () {
      if (menu.classList.contains('is-open')) cerrar(); else abrir();
    });
    // cerrar al elegir una sección (importante en móvil, para que no tape el scroll)
    menu.querySelectorAll('a').forEach(function (a) { a.addEventListener('click', cerrar); });
    // cerrar al pulsar fuera del menú
    document.addEventListener('click', function (e) {
      if (!menu.contains(e.target) && !toggle.contains(e.target)) cerrar();
    });
    // al volver a escritorio, asegurar el menú cerrado
    window.addEventListener('resize', function () { if (window.innerWidth > 820) cerrar(); });
  })();
})();