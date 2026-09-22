/* ==========================================================================
   UTILIDADES.JS — todas las utilidades en un solo archivo
   ========================================================================== */
(function () {
  'use strict';
  var root = document.documentElement;
  var REDUCE = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (id) { return document.getElementById(id); };

  /* --- tema / menú / reloj / año / progreso / reveals --- */
  function aplicarTema(t) { root.setAttribute('data-theme', t); var o = t === 'dark'; document.querySelectorAll('#theme-toggle').forEach(function (b) { b.setAttribute('aria-pressed', String(o)); b.setAttribute('aria-label', o ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'); }); }
  document.addEventListener('click', function (e) { if (e.target.closest && e.target.closest('#theme-toggle')) { var s = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark'; try { localStorage.setItem('tema', s); } catch (_) { } aplicarTema(s); } });
  aplicarTema(root.getAttribute('data-theme') || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'));
  (function () { var tg = $('nav-toggle'), m = $('menu'); if (!tg || !m) return; function o() { m.classList.add('is-open'); tg.setAttribute('aria-expanded', 'true'); } function c() { m.classList.remove('is-open'); tg.setAttribute('aria-expanded', 'false'); } tg.addEventListener('click', function () { m.classList.contains('is-open') ? c() : o(); }); m.querySelectorAll('a').forEach(function (a) { a.addEventListener('click', c); }); document.addEventListener('click', function (e) { if (!m.contains(e.target) && !tg.contains(e.target)) c(); }); addEventListener('resize', function () { if (innerWidth > 820) c(); }); })();
  var reloj = $('hora-local'); function tick() { if (!reloj) return; try { reloj.textContent = new Intl.DateTimeFormat('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false, timeZone: 'Europe/Madrid' }).format(new Date()); } catch (_) { reloj.textContent = new Date().toLocaleTimeString('es-ES'); } } if (reloj) { tick(); setInterval(tick, 1000); }
  var anio = $('anio'); if (anio) anio.textContent = new Date().getFullYear();
  var barra = $('progress-bar'); if (barra) { var pg = function () { var h = root.scrollHeight - innerHeight; barra.style.width = (h > 0 ? (scrollY / h) * 100 : 0) + '%'; }; addEventListener('scroll', pg, { passive: true }); addEventListener('resize', pg); pg(); }
  if ('IntersectionObserver' in window) { var io = new IntersectionObserver(function (es) { es.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('is-visible'); io.unobserve(en.target); } }); }, { threshold: .1 }); document.querySelectorAll('[data-reveal]').forEach(function (el) { io.observe(el); }); } else document.querySelectorAll('[data-reveal]').forEach(function (el) { el.classList.add('is-visible'); });
  function copiar(txt, btn) { navigator.clipboard.writeText(txt).then(function () { var o = btn.textContent; btn.textContent = '✓'; setTimeout(function () { btn.textContent = o; }, 1200); }); }

  /* ============ 1 · QUITAR FONDO ============ */
  (function () {
    var fileInput = $('file'), drop = $('drop'), runBtn = $('run'), clearBtn = $('clear'), status = $('status'), grid = $('grid'), imgIn = $('imgIn'), imgOut = $('imgOut'), dl = $('dl'), dlPng = $('dlPng'), dlJpg = $('dlJpg');
    var archivo = null, urlIn = null, fn = null;
    function set(t, c) { status.textContent = t; status.className = 'u-status' + (c ? ' is-' + c : ''); }
    async function cargar() { if (fn) return fn; set('Descargando el modelo (solo la primera vez)…', 'busy'); var m = await import('https://esm.sh/@imgly/background-removal@1'); fn = m.default || m.removeBackground; return fn; }
    function usar(f) { if (!f) return; if (!f.type.startsWith('image/')) return set('No es una imagen.', 'err'); if (f.size > 20 * 1024 * 1024) return set('Máx. 20 MB.', 'err'); limpiar(false); archivo = f; urlIn = URL.createObjectURL(f); imgIn.src = urlIn; grid.hidden = false; runBtn.disabled = clearBtn.disabled = false; set('Listo. Pulsa “Quitar fondo”.', 'ok'); }
    async function quitar() { if (!archivo) return; runBtn.disabled = clearBtn.disabled = true; try { var f = await cargar(); set('Procesando…', 'busy'); var out = await f(archivo, { output: { format: 'image/png', quality: 1 }, progress: function (_k, c, t) { if (t > 0) set('Procesando… ' + Math.round(c / t * 100) + '%', 'busy'); } }); imgOut.src = URL.createObjectURL(out); dl.hidden = false; dlPng.href = URL.createObjectURL(out); dlJpg.href = await pngBlanco(out); set('Fondo eliminado.', 'ok'); } catch (e) { console.error(e); set('No se pudo procesar.', 'err'); } finally { runBtn.disabled = !archivo; clearBtn.disabled = !archivo; } }
    function pngBlanco(b) { return new Promise(function (res) { var u = URL.createObjectURL(b), img = new Image(); img.onload = function () { var c = document.createElement('canvas'); c.width = img.naturalWidth; c.height = img.naturalHeight; var x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, c.width, c.height); x.drawImage(img, 0, 0); c.toBlob(function (bl) { res(URL.createObjectURL(bl)); }, 'image/jpeg', 0.92); URL.revokeObjectURL(u); }; img.src = u; }); }
    function limpiar(keep) { if (urlIn) { URL.revokeObjectURL(urlIn); urlIn = null; } imgIn.removeAttribute('src'); imgOut.removeAttribute('src'); grid.hidden = true; dl.hidden = true; runBtn.disabled = clearBtn.disabled = true; if (!keep) { archivo = null; fileInput.value = ''; } set(archivo ? 'Listo.' : 'Sin imagen.', 'ok'); }
    drop.addEventListener('click', function () { fileInput.click(); }); drop.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fileInput.click(); } });
    fileInput.addEventListener('change', function () { if (fileInput.files[0]) usar(fileInput.files[0]); });
    ['dragenter', 'dragover'].forEach(function (ev) { drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.add('is-over'); }); });
    ['dragleave', 'drop'].forEach(function (ev) { drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.remove('is-over'); }); });
    drop.addEventListener('drop', function (e) { var f = e.dataTransfer && e.dataTransfer.files[0]; if (f) usar(f); });
    runBtn.addEventListener('click', quitar); clearBtn.addEventListener('click', function () { limpiar(false); });
  })();

  /* ============ 2 · JSON ============ */
  (function () {
    var inp = $('jsonIn'), out = $('jsonOut'), st = $('jsonStatus');
    function fmt() { try { var o = JSON.parse(inp.value); out.textContent = JSON.stringify(o, null, 2); st.textContent = 'JSON válido ✓'; st.className = 'u-status is-ok'; } catch (e) { out.textContent = ''; st.textContent = 'Error: ' + e.message; st.className = 'u-status is-err'; } }
    function mini() { try { var o = JSON.parse(inp.value); out.textContent = JSON.stringify(o); st.textContent = 'Minificado ✓'; st.className = 'u-status is-ok'; } catch (e) { st.textContent = 'Error: ' + e.message; st.className = 'u-status is-err'; } }
    $('jsonFmt').addEventListener('click', fmt); $('jsonMini').addEventListener('click', mini); $('jsonCopy').addEventListener('click', function () { copiar(out.textContent, this); });
  })();

  /* ============ 3 · BASE64 ============ */
  (function () {
    var inp = $('b64In'), out = $('b64Out');
    function enc() { try { out.textContent = btoa(unescape(encodeURIComponent(inp.value))); } catch (e) { out.textContent = 'Error'; } }
    function dec() { try { out.textContent = decodeURIComponent(escape(atob(inp.value.trim()))); } catch (e) { out.textContent = 'Base64 inválido'; } }
    $('b64Enc').addEventListener('click', enc); $('b64Dec').addEventListener('click', dec); $('b64Copy').addEventListener('click', function () { copiar(out.textContent, this); });
  })();

  /* ============ 4 · HASH ============ */
  (function () {
    var inp = $('hashIn'), out = $('hashOut'), algo = $('hashAlgo');
    async function run() { try { var buf = await crypto.subtle.digest(algo.value, new TextEncoder().encode(inp.value)); var arr = Array.from(new Uint8Array(buf)); out.textContent = arr.map(function (b) { return b.toString(16).padStart(2, '0'); }).join(''); } catch (e) { out.textContent = 'Error: ' + e.message; } }
    $('hashRun').addEventListener('click', run); $('hashCopy').addEventListener('click', function () { copiar(out.textContent, this); });
  })();

  /* ============ 5 · COLOR ============ */
  (function () {
    var pick = $('colPick'), hex = $('colHex'), sw = $('colSw'), oH = $('colOHex'), oR = $('colORgb'), oL = $('colOHsl'), oC = $('colOCmyk'), pal = $('colPal');
    function hex2rgb(h) { h = h.replace('#', ''); if (h.length === 3) h = h.split('').map(function (c) { return c + c; }).join(''); var n = parseInt(h, 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
    function rgb2hsl(r, g, b) { r /= 255; g /= 255; b /= 255; var mx = Math.max(r, g, b), mn = Math.min(r, g, b), h, s, l = (mx + mn) / 2; if (mx === mn) { h = s = 0; } else { var d = mx - mn; s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn); switch (mx) { case r: h = (g - b) / d + (g < b ? 6 : 0); break; case g: h = (b - r) / d + 2; break; default: h = (r - g) / d + 4; } h /= 6; } return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)]; }
    function rgb2cmyk(r, g, b) { var c = 1 - r / 255, m = 1 - g / 255, y = 1 - b / 255, k = Math.min(c, m, y); if (k === 1) return [0, 0, 0, 100]; return [Math.round((c - k) / (1 - k) * 100), Math.round((m - k) / (1 - k) * 100), Math.round((y - k) / (1 - k) * 100), Math.round(k * 100)]; }
    function rgb2hex(r, g, b) { return '#' + [r, g, b].map(function (x) { return x.toString(16).padStart(2, '0'); }).join('').toUpperCase(); }
    function hsl2rgb(h, s, l) { s /= 100; l /= 100; var c = (1 - Math.abs(2 * l - 1)) * s, x = c * (1 - Math.abs((h / 60) % 2 - 1)), m = l - c / 2, r, g, b; if (h < 60) { r = c; g = x; b = 0; } else if (h < 120) { r = x; g = c; b = 0; } else if (h < 180) { r = 0; g = c; b = x; } else if (h < 240) { r = 0; g = x; b = c; } else if (h < 300) { r = x; g = 0; b = c; } else { r = c; g = 0; b = x; } return [Math.round((r + m) * 255), Math.round((g + m) * 255), Math.round((b + m) * 255)]; }
    function set(h) { if (!/^#?[0-9a-f]{3,6}$/i.test(h)) return; var rgb = hex2rgb(h), hsl = rgb2hsl.apply(null, rgb), cmyk = rgb2cmyk.apply(null, rgb); var H = rgb2hex.apply(null, rgb); pick.value = H; hex.value = H; sw.style.background = H; oH.textContent = H; oR.textContent = 'rgb(' + rgb.join(', ') + ')'; oL.textContent = 'hsl(' + hsl[0] + ', ' + hsl[1] + '%, ' + hsl[2] + '%)'; oC.textContent = 'cmyk(' + cmyk.join(', ') + ')%'; pal.innerHTML = '';[30, 60, 180, 210].forEach(function (off) { var c = hsl2rgb((hsl[0] + off) % 360, hsl[1], hsl[2]); var b = document.createElement('button'); b.style.background = rgb2hex.apply(null, c); b.title = rgb2hex.apply(null, c); b.addEventListener('click', function () { set(rgb2hex.apply(null, c)); }); pal.appendChild(b); }); }
    pick.addEventListener('input', function () { set(pick.value); }); hex.addEventListener('input', function () { set(hex.value); }); set('#B9502F');
  })();

  /* ============ 6 · UUID / PASSWORD ============ */
  (function () {
    var uo = $('uuidOut'), po = $('passOut');
    $('uuidRun').addEventListener('click', function () { uo.textContent = crypto.randomUUID(); });
    $('uuidCopy').addEventListener('click', function () { copiar(uo.textContent, this); });
    var len = $('pLen'), lenV = $('pLenV'); len.addEventListener('input', function () { lenV.textContent = len.value; });
    $('passRun').addEventListener('click', function () { var chars = ''; if ($('pUp').checked) chars += 'ABCDEFGHJKLMNPQRSTUVWXYZ'; if ($('pLo').checked) chars += 'abcdefghijkmnpqrstuvwxyz'; if ($('pNu').checked) chars += '23456789'; if ($('pSy').checked) chars += '!@#$%^&*()-_=+[]{}'; if (!chars) { po.textContent = 'Marca al menos un tipo'; return; } var n = +len.value, a = new Uint32Array(n); crypto.getRandomValues(a); var p = ''; for (var i = 0; i < n; i++)p += chars[a[i] % chars.length]; po.textContent = p; });
    $('passCopy').addEventListener('click', function () { copiar(po.textContent, this); });
  })();

  /* ============ 7 · REGEX ============ */
  (function () {
    var pat = $('rePat'), flags = $('reFlags'), text = $('reText'), out = $('reOut'), st = $('reStatus'), grp = $('reGroups');
    function esc(s) { return s.replace(/[&<>]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]; }); }
    function run() { var p = pat.value; if (!p) { out.textContent = ''; st.textContent = 'Sin patrón.'; st.className = 'u-status'; grp.innerHTML = ''; return; } var f = flags.value || 'g'; if (f.indexOf('g') < 0) f += 'g'; var re; try { re = new RegExp(p, f); } catch (e) { out.textContent = ''; st.textContent = 'Regex inválida: ' + e.message; st.className = 'u-status is-err'; grp.innerHTML = ''; return; } var t = text.value, html = '', m, count = 0, groups = []; var last = 0; while ((m = re.exec(t)) !== null) { if (m[0] === '') { re.lastIndex++; continue; } html += esc(t.slice(last, m.index)) + '<mark>' + esc(m[0]) + '</mark>'; last = m.index + m[0].length; count++; for (var i = 1; i < m.length; i++)if (m[i] !== undefined) groups.push(m[i]); if (groups.length > 50) break; } html += esc(t.slice(last)); out.innerHTML = html || '<span style="color:#8A8378">Sin coincidencias.</span>'; st.textContent = count + ' coincidencia' + (count === 1 ? '' : 's'); st.className = 'u-status is-ok'; grp.innerHTML = groups.slice(0, 50).map(function (g) { return '<span>grupo: ' + esc(g) + '</span>'; }).join(''); }
    pat.addEventListener('input', run); flags.addEventListener('input', run); text.addEventListener('input', run); run();
  })();

  /* ============ 8 · MINIFICADOR ============ */
  (function () {
    var inp = $('minIn'), out = $('minOut'), st = $('minStatus');
    function minify(s) { var i = 0, n = s.length, o = '', q = null; while (i < n) { var c = s[i]; if (q) { o += c; if (c === '\\' && q !== '`') { o += s[i + 1]; i += 2; continue; } if (c === q) { q = null; } i++; continue; } if (c === '"' || c === "'" || c === '`') { q = c; o += c; i++; continue; } if (c === '/' && s[i + 1] === '/') { while (i < n && s[i] !== '\n') i++; continue; } if (c === '/' && s[i + 1] === '*') { i += 2; while (i < n && !(s[i] === '*' && s[i + 1] === '/')) i++; i += 2; continue; } o += c; i++; } o = o.replace(/[ \t]+/g, ' ').replace(/\s*([{}:;,>])\s*/g, '$1').replace(/;\s*}/g, '}').replace(/\n+/g, '\n').trim(); return o; }
    $('minRun').addEventListener('click', function () { var r = minify(inp.value); out.textContent = r; var a = inp.value.length, b = r.length; st.textContent = a > 0 ? ('Ahorro ' + Math.round((a - b) / a * 100) + '% (' + a + ' → ' + b + ' caracteres)') : 'Sin código'; st.className = 'u-status is-ok'; });
    $('minCopy').addEventListener('click', function () { copiar(out.textContent, this); });
  })();

  /* ============ 9 · BASES ============ */
  (function () {
    var inp = $('baseIn'), from = $('baseFrom'), out = $('baseOut'), steps = $('baseSteps');
    function run() { var v = inp.value.trim(); if (!v) { out.innerHTML = ''; steps.textContent = ''; return; } var b = +from.value; if (!/^[0-9a-fA-F]+$/.test(v.replace(/ /g, ''))) { out.innerHTML = '<div><dt>Error</dt><dd>Caracteres no válidos</dd></div>'; steps.textContent = ''; return; } var dec = parseInt(v, b); if (isNaN(dec)) { out.innerHTML = ''; return; } var rows = [[dec, 10, 'Decimal'], [dec, 2, 'Binario'], [dec, 8, 'Octal'], [dec, 16, 'Hexadecimal']]; out.innerHTML = rows.map(function (r) { var s = r[0].toString(r[1]).toUpperCase(); return '<div><dt>' + r[2] + '</dt><dd>' + s + '</dd></div>'; }).join(''); var x = dec, pasos = []; if (x === 0) pasos.push('0'); else { while (x > 0) { pasos.push(x + ' ÷ 2 = ' + Math.floor(x / 2) + ' resto ' + (x % 2)); x = Math.floor(x / 2); } } steps.textContent = 'Dec → Bin (divisiones):\n' + pasos.join('\n'); }
    inp.addEventListener('input', run); from.addEventListener('change', run); run();
  })();

  /* ============ 10 · UNIDADES ============ */
  (function () {
    var cat = $('unCat'), val = $('unVal'), from = $('unFrom'), to = $('unTo'), out = $('unOut'), form = $('unFormula');
    var cats = {
      bytes: { u: ['B', 'KB', 'MB', 'GB', 'TB', 'PB'], f: [1, 1024, 1048576, 1073741824, 1099511627776, 1125899906842624], l: '1 KB = 1024 B' },
      long: { u: ['m', 'km', 'cm', 'mm', 'mi', 'ft', 'in'], f: [1, 1000, 0.01, 0.001, 1609.344, 0.3048, 0.0254], l: '1 km = 1000 m' },
      masa: { u: ['kg', 'g', 't', 'lb', 'oz'], f: [1000, 1, 1000000, 453.59237, 28.3495], l: '1 kg = 1000 g' },
      tiempo: { u: ['s', 'min', 'h', 'd', 'ms'], f: [1, 60, 3600, 86400, 0.001], l: '1 h = 3600 s' },
      temp: { u: ['C', 'F', 'K'], f: null, l: 'F = C·1.8 + 32' }
    };
    function fill() { var c = cats[cat.value]; from.innerHTML = ''; to.innerHTML = ''; c.u.forEach(function (u) { from.innerHTML += '<option>' + u + '</option>'; to.innerHTML += '<option>' + u + '</option>'; }); to.selectedIndex = 1; run(); }
    function conv(v, uf, ut) { var c = cats[cat.value]; if (c.f) { var base = v * c.f[c.u.indexOf(uf)]; return base / c.f[c.u.indexOf(ut)]; } if (uf === 'C') return ut === 'F' ? v * 1.8 + 32 : ut === 'K' ? v + 273.15 : v; if (uf === 'F') return ut === 'C' ? (v - 32) / 1.8 : ut === 'K' ? (v - 32) / 1.8 + 273.15 : v; return ut === 'C' ? v - 273.15 : ut === 'F' ? (v - 273.15) * 1.8 + 32 : v; }
    function run() { var v = parseFloat(val.value); if (isNaN(v)) { out.textContent = '—'; form.textContent = ''; return; } var r = conv(v, from.value, to.value); out.textContent = (Math.round(r * 10000) / 10000) + ' ' + to.value; form.textContent = cats[cat.value].l; }
    cat.addEventListener('change', fill);[val, from, to].forEach(function (e) { e.addEventListener('input', run); e.addEventListener('change', run); }); fill();
  })();

  /* ============ 11 · ORDENACIÓN ============ */
  (function () {
    var bars = $('ordBars'), algo = $('ordAlgo'), st = $('ordStatus'), speed = $('ordSpeed');
    var arr = [], pasos = [], i = 0, timer = null, N = 24;
    function rand() { arr = []; for (var k = 0; k < N; k++)arr.push(Math.floor(Math.random() * 95) + 5); render(arr, {}, {}); }
    function render(a, cmp, swap, done) { bars.innerHTML = ''; a.forEach(function (v, idx) { var s = document.createElement('span'); s.style.height = v + '%'; if (cmp[idx] !== undefined) s.className = 'cmp'; if (swap[idx] !== undefined) s.className = 'swap'; if (done && done.indexOf(idx) > -1) s.className = 'done'; bars.appendChild(s); }); }
    function bubble(a) { var p = [], n = a.length; for (var i = 0; i < n; i++) { var sw = false; for (var j = 0; j < n - i - 1; j++) { p.push({ a: a.slice(), cmp: { j: 1, j1: 1 } }); if (a[j] > a[j + 1]) { var t = a[j]; a[j] = a[j + 1]; a[j + 1] = t; sw = true; p.push({ a: a.slice(), swap: { j: 1, j1: 1 } }); } } if (!sw) break; } p.push({ a: a.slice(), done: Array.from({ length: n }, function (_, k) { return k; }) }); return p; }
    function insertion(a) { var p = []; for (var i = 1; i < a.length; i++) { var key = a[i], j = i - 1; while (j >= 0 && a[j] > key) { a[j + 1] = a[j]; p.push({ a: a.slice(), cmp: { j: 1 }, swap: { j1: 1 } }); j--; } a[j + 1] = key; p.push({ a: a.slice(), done: [i] }); } return p; }
    function selection(a) { var p = []; for (var i = 0; i < a.length; i++) { var m = i; for (var j = i + 1; j < a.length; j++) { p.push({ a: a.slice(), cmp: { m: 1, j: 1 } }); if (a[j] < a[m]) m = j; } if (m !== i) { var t = a[i]; a[i] = a[m]; a[m] = t; p.push({ a: a.slice(), swap: { i: 1, m: 1 } }); } p.push({ a: a.slice(), done: [i] }); } return p; }
    function quick(a) { var p = []; function qs(lo, hi) { if (lo >= hi) { p.push({ a: a.slice(), done: [lo] }); return; } var pi = part(lo, hi); qs(lo, pi - 1); qs(pi + 1, hi); } function part(lo, hi) { var piv = a[hi], i = lo; for (var j = lo; j < hi; j++) { p.push({ a: a.slice(), cmp: { j: 1, hi: 1 } }); if (a[j] < piv) { var t = a[i]; a[i] = a[j]; a[j] = t; p.push({ a: a.slice(), swap: { i: 1, j: 1 } }); i++; } } var t2 = a[i]; a[i] = a[hi]; a[hi] = t2; p.push({ a: a.slice(), swap: { i: 1, hi: 1 } }); return i; } qs(0, a.length - 1); return p; }
    function gen() { var a = arr.slice(); var f = { bubble: bubble, insertion: insertion, selection: selection, quick: quick }[algo.value]; pasos = f(a); }
    function play() { if (timer) clearInterval(timer); i = 0; st.textContent = 'Reproduciendo…'; var ms = 1000 / (+speed.value); timer = setInterval(function () { if (i >= pasos.length) { clearInterval(timer); timer = null; st.textContent = 'Ordenado ✓'; render(arr, {}, {}, Array.from({ length: N }, function (_, k) { return k; })); return; } var p = pasos[i++]; render(p.a, p.cmp || {}, p.swap || {}, p.done); }, ms); }
    $('ordRun').addEventListener('click', function () { gen(); play(); }); $('ordShuffle').addEventListener('click', function () { if (timer) clearInterval(timer); rand(); st.textContent = ''; }); speed.addEventListener('input', function () { if (timer) { clearInterval(timer); play(); } }); rand();
  })();

  /* ============ 12 · MONTE CARLO π ============ */
  (function () {
    var cv = $('mcCanvas'), ctx = cv.getContext('2d'), n = $('mcN'), d = $('mcD'), pi = $('mcPi'), err = $('mcErr'), st = $('mcStatus');
    var total = 0, dentro = 0, raf = null;
    function reset() { total = 0; dentro = 0; ctx.clearRect(0, 0, cv.width, cv.height); ctx.strokeStyle = '#8A8378'; ctx.beginPath(); ctx.arc(0, cv.height, cv.width, 0, -Math.PI / 2); ctx.stroke(); }
    function paso() { var x = Math.random(), y = Math.random(); if (x * x + y * y <= 1) dentro++; total++; ctx.fillStyle = dentro === total ? 'rgba(185,80,47,.55)' : 'rgba(43,76,126,.45)'; ctx.fillRect(x * cv.width, (1 - y) * cv.height, 2, 2); n.textContent = total; d.textContent = dentro; var p = 4 * dentro / total; pi.textContent = p.toFixed(5); err.textContent = (Math.abs(p - Math.PI) / Math.PI * 100).toFixed(2) + '%'; st.textContent = total + ' puntos · π ≈ ' + p.toFixed(5); }
    function loop() { for (var k = 0; k < 40; k++)paso(); raf = requestAnimationFrame(loop); }
    $('mcRun').addEventListener('click', function () { if (!raf) loop(); }); $('mcPause').addEventListener('click', function () { if (raf) { cancelAnimationFrame(raf); raf = null; } }); $('mcReset').addEventListener('click', function () { if (raf) { cancelAnimationFrame(raf); raf = null; } reset(); }); reset();
  })();

  /* ============ 13 · RLE ============ */
  (function () {
    var inp = $('rleIn'), out = $('rleOut'), st = $('rleStatus');
    function enc(s) { var o = '', c = s[0], n = 0; for (var i = 0; i <= s.length; i++) { if (s[i] === c) { n++; } else { if (n > 1) o += c + n; else o += c; c = s[i]; n = 1; } } return o; }
    function dec(s) { var o = '', d = ''; for (var i = 0; i < s.length; i++) { var c = s[i]; if (/\d/.test(c)) d += c; else { o += c + (d ? parseInt(d) - 1 : 0); d = ''; } } return o; }
    $('rleEnc').addEventListener('click', function () { var r = enc(inp.value); out.textContent = r; var a = inp.value.length, b = r.length; st.textContent = a > 0 ? ('Ratio ' + Math.round((a - b) / a * 100) + '% (' + a + ' → ' + b + ')') : 'Sin texto'; st.className = 'u-status is-ok'; });
    $('rleDec').addEventListener('click', function () { out.textContent = dec(inp.value); st.textContent = 'Descomprimido'; st.className = 'u-status is-ok'; });
  })();

})();
