/* ==========================================================================
   UTILIDADES.JS — lógica de la página de utilidades
   - tema claro/oscuro + menú móvil (mismos que el index, duplicados a propósito
     para no tocar tu index.js; luego los podemos unificar en common.js)
   - reloj + año + reveals + barra de progreso
   - QUITAR FONDO con @imgly/background-removal (IA en el navegador)
   ========================================================================== */
(function () {
  'use strict';
  var root = document.documentElement;
  root.classList.add('js');
  var REDUCE = false;

  /* --- Tema --- */
  function aplicarTema(t){
    root.setAttribute('data-theme', t);
    var oscuro = t === 'dark';
    document.querySelectorAll('#theme-toggle').forEach(function(b){
      b.setAttribute('aria-pressed', String(oscuro));
      b.setAttribute('aria-label', oscuro ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro');
    });
    window.dispatchEvent(new CustomEvent('themechange'));
  }
  document.addEventListener('click', function(e){
    if (e.target.closest && e.target.closest('#theme-toggle')){
      var s = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      try { localStorage.setItem('tema', s); } catch(_){}
      aplicarTema(s);
    }
  });
  var t0 = root.getAttribute('data-theme') || ((matchMedia && matchMedia('(prefers-color-scheme: dark)').matches) ? 'dark' : 'light');
  aplicarTema(t0);

  /* --- Menú móvil --- */
  (function(){
    var tg = document.getElementById('nav-toggle'), menu = document.getElementById('menu');
    if(!tg||!menu) return;
    function open(){ menu.classList.add('is-open'); tg.setAttribute('aria-expanded','true'); tg.setAttribute('aria-label','Cerrar menú'); }
    function close(){ menu.classList.remove('is-open'); tg.setAttribute('aria-expanded','false'); tg.setAttribute('aria-label','Abrir menú'); }
    tg.addEventListener('click', function(){ menu.classList.contains('is-open') ? close() : open(); });
    menu.querySelectorAll('a').forEach(function(a){ a.addEventListener('click', close); });
    document.addEventListener('click', function(e){ if(!menu.contains(e.target)&&!tg.contains(e.target)) close(); });
    window.addEventListener('resize', function(){ if(innerWidth>820) close(); });
  })();

  /* --- Reloj + año + progreso + reveals (básicos) --- */
  var reloj = document.getElementById('hora-local');
  function tick(){ if(!reloj) return; try{ reloj.textContent=new Intl.DateTimeFormat('es-ES',{hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:false,timeZone:'Europe/Madrid'}).format(new Date()); }catch(_){ reloj.textContent=new Date().toLocaleTimeString('es-ES'); } }
  if(reloj){ tick(); setInterval(tick,1000); }
  var anio = document.getElementById('anio'); if(anio) anio.textContent = new Date().getFullYear();

  var barra = document.getElementById('progress-bar');
  if(barra){ var prog=function(){var h=root.scrollHeight-innerHeight; barra.style.width=(h>0?(scrollY/h)*100:0)+'%';}; addEventListener('scroll',prog,{passive:true}); addEventListener('resize',prog); prog(); }

  if('IntersectionObserver' in window){
    var io=new IntersectionObserver(function(es){ es.forEach(function(en){ if(en.isIntersecting){ var d=en.target.getAttribute('data-reveal-delay'); if(d) en.target.style.transitionDelay=d+'ms'; en.target.classList.add('is-visible'); io.unobserve(en.target);} }); },{threshold:.12});
    document.querySelectorAll('[data-reveal]').forEach(function(el){ io.observe(el); });
  } else { document.querySelectorAll('[data-reveal]').forEach(function(el){ el.classList.add('is-visible'); }); }

  /* ======================================================================
     QUITAR FONDO
     ====================================================================== */
  var $ = function(id){ return document.getElementById(id); };
  var fileInput = $('file'), drop = $('drop'), runBtn = $('run'), clearBtn = $('clear');
  var status = $('status'), grid = $('grid'), imgIn = $('imgIn'), imgOut = $('imgOut'), dl = $('dl');
  var dlPng = $('dlPng'), dlJpg = $('dlJpg');

  var archivo = null;   // File actual
  var urlIn = null;     // object URL del original
  var blobOut = null;   // resultado (PNG con transparencia)
  var removeBackground = null; // función de la librería (se carga bajo demanda)

  function setEstado(txt, cls){ status.textContent = txt; status.className = 'u-status' + (cls ? ' is-' + cls : ''); }

  /* Carga la librería de IA la primera vez que haga falta (dinámico, desde CDN). */
  async function cargarModelo(){
    if (removeBackground) return removeBackground;
    setEstado('Descargando el modelo de IA (solo la primera vez)…', 'busy');
    var mod = await import('https://esm.sh/@imgly/background-removal@1');
    removeBackground = mod.default || mod.removeBackground;
    return removeBackground;
  }

  /* Acepta un archivo: valida y muestra el original. */
  function usarArchivo(f){
    if (!f) return;
    if (!f.type || !f.type.startsWith('image/')) { setEstado('Eso no es una imagen.', 'err'); return; }
    if (f.size > 20 * 1024 * 1024) { setEstado('Imagen demasiado grande (máx. 20 MB).', 'err'); return; }

    limpiar(false);
    archivo = f;
    urlIn = URL.createObjectURL(f);
    imgIn.src = urlIn;
    grid.hidden = false;
    runBtn.disabled = false; clearBtn.disabled = false;
    setEstado('Listo. Pulsa “Quitar fondo”.', 'ok');
  }

  /* Proceso principal. */
  async function quitarFondo(){
    if (!archivo) return;
    runBtn.disabled = true; clearBtn.disabled = true;
    try {
      var fn = await cargarModelo();
      setEstado('Procesando la imagen…', 'busy');
      var out = await fn(archivo, {
        output: { format: 'image/png', quality: 1 },
        progress: function(_k, cur, tot){
          if (tot > 0) setEstado('Procesando… ' + Math.round((cur/tot)*100) + '%', 'busy');
        }
      });
      blobOut = out;
      imgOut.src = URL.createObjectURL(out);
      dl.hidden = false;
      // enlace PNG transparente directo
      dlPng.href = URL.createObjectURL(out);
      // enlace JPG con fondo blanco (pintamos el PNG sobre un canvas blanco)
      dlJpg.href = await pngConFondoBlanco(out);
      setEstado('Fondo eliminado. Puedes descargarla.', 'ok');
    } catch (err) {
      console.error(err);
      setEstado('No se pudo procesar. Revisa que sea una imagen válida o inténtalo otra vez.', 'err');
    } finally {
      runBtn.disabled = !archivo; clearBtn.disabled = !archivo;
    }
  }

  /* Convierte el PNG transparente a JPG sobre fondo blanco usando <canvas>. */
  function pngConFondoBlanco(pngBlob){
    return new Promise(function(res){
      var url = URL.createObjectURL(pngBlob);
      var img = new Image();
      img.onload = function(){
        var c = document.createElement('canvas');
        c.width = img.naturalWidth; c.height = img.naturalHeight;
        var ctx = c.getContext('2d');
        ctx.fillStyle = '#fff'; ctx.fillRect(0,0,c.width,c.height); // fondo blanco
        ctx.drawImage(img, 0, 0);
        c.toBlob(function(b){ res(URL.createObjectURL(b)); }, 'image/jpeg', 0.92);
        URL.revokeObjectURL(url);
      };
      img.src = url;
    });
  }

  /* Resetea la utilidad (keepInput=false limpia también el input file). */
  function limpiar(keepInput){
    if (urlIn) { URL.revokeObjectURL(urlIn); urlIn = null; }
    if (blobOut) { blobOut = null; }
    imgIn.removeAttribute('src'); imgOut.removeAttribute('src');
    grid.hidden = true; dl.hidden = true;
    runBtn.disabled = true; clearBtn.disabled = true;
    if (!keepInput) { archivo = null; fileInput.value = ''; }
    setEstado(archivo ? 'Listo. Pulsa “Quitar fondo”.' : 'Sin imagen. Elige una para empezar.', 'ok');
  }

  /* --- Eventos de la zona de carga --- */
  drop.addEventListener('click', function(){ fileInput.click(); });
  drop.addEventListener('keydown', function(e){ if (e.key==='Enter'||e.key===' '){ e.preventDefault(); fileInput.click(); } });
  fileInput.addEventListener('change', function(){ if (fileInput.files[0]) usarArchivo(fileInput.files[0]); });

  ['dragenter','dragover'].forEach(function(ev){ drop.addEventListener(ev, function(e){ e.preventDefault(); drop.classList.add('is-over'); }); });
  ['dragleave','drop'].forEach(function(ev){ drop.addEventListener(ev, function(e){ e.preventDefault(); drop.classList.remove('is-over'); }); });
  drop.addEventListener('drop', function(e){ var f = e.dataTransfer && e.dataTransfer.files[0]; if (f) usarArchivo(f); });

  runBtn.addEventListener('click', quitarFondo);
  clearBtn.addEventListener('click', function(){ limpiar(false); });
    /* --- 10. Partículas del cursor (sutiles, solo color de marca) ---------- */
  (function () {
    if (REDUCE) { console.log('[utilidades] partículas OFF: prefers-reduced-motion'); return; }
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
      console.log('[utilidades] partículas OFF: dispositivo táctil'); return;
    }

    // Si no existe el canvas, lo creamos
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

    function leerColor() {
      colorMarca = (getComputedStyle(root).getPropertyValue('--terra') || '#B9502F').trim();
    }
    function redimensionar() {
      W = canvas.width  = Math.floor(window.innerWidth  * dpr);
      H = canvas.height = Math.floor(window.innerHeight * dpr);
    }
    function crear(x, y) {
      if (partes.length > 90) return;              // techo (igual que el index)
      if (Math.random() < 0.35) return;            // nacen más que antes
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
    function bucle() {
      ctx.clearRect(0, 0, W, H);
      for (var i = partes.length - 1; i >= 0; i--) {
        var p = partes[i];
        p.x += p.vx; p.y += p.vy;
        p.vy += 0.0015; p.vx *= 0.98; p.vy *= 0.98;
        p.vida -= p.decaer;
        if (p.vida <= 0) { partes.splice(i, 1); continue; }
        ctx.globalAlpha = Math.max(p.vida, 0) * 0.32;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r * p.vida + 0.2, 0, Math.PI * 2);
        ctx.fillStyle = p.c;
        ctx.shadowColor = p.c;
        ctx.shadowBlur = 4 * dpr;
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
})();