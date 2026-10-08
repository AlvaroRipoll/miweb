/* teo.js - chatbot con flujo guiado (arbol de nodos) + aviso ntfy al abrir.
   Autonomo: se crea su propia burbuja, panel y estilos. Sin dependencias.
   Botones cabecera: maximizar/minimizar, minimizar, cerrar+reiniciar. */
(function () {
    var TOPIC = "alvarowebprogramacion2848462";
    var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var yaAvisado = false;
    var nombre = "";
    var max = false;

    /* ---------------- ARBOL DE NODOS (edita aqui) ---------------- */
    var NODOS = {
        start: {
            ask: true,
            msg: "&iexcl;Hola! Soy Teo, el asistente de esta web. &iquest;C&oacute;mo te llamas?",
            on: function (txt) { nombre = txt; ir("bienvenida"); }
        },
        bienvenida: {
            msg: function () { return "Encantado, " + esc(nombre) + ". &iquest;En qu&eacute; puedo ayudarte?"; },
            opts: [
                { t: "Estudios", go: "estudios" },
                { t: "Mi futuro", go: "futuro" },
                { t: "Utilidades", go: "utilidades" },
                { t: "Contacto", go: "contacto" },
                { t: "Ver mi CV", go: "cv" }
            ]
        },
        estudios: {
            msg: "Mi camino hasta ahora: SMX (sistemas y redes), el congreso FACTS, un curso de gesti&oacute;n en EDEM, y ahora 1&ordm; de DAM en el Simarro.",
            opts: [{ t: "Sobre DAM", go: "dam" }, { t: "Volver", go: "bienvenida" }]
        },
        dam: {
            msg: "DAM = Desarrollo de Aplicaciones Multiplataforma. Estoy en el Simarro (X&agrave;tiva). Programaci&oacute;n, bases de datos y apps.",
            opts: [{ t: "Volver", go: "estudios" }]
        },
        futuro: {
            msg: "Quiero unir matem&aacute;ticas e inform&aacute;tica en un perfil de an&aacute;lisis de datos. Mi pr&oacute;ximo paso: un curso de Big Data.",
            opts: [{ t: "Volver", go: "bienvenida" }]
        },
        utilidades: {
            msg: "Sobre qu&eacute; utilidad quieres informaci&oacute;n?",
            opts: [
                { t: "Calculadora", go: "u_calc" },
                { t: "Conversor", go: "u_conv" },
                { t: "Generador de contrase&ntilde;as", go: "u_pass" },
                { t: "QR", go: "u_qr" },
                { t: "Scratch", go: "u_scr" },
                { t: "Volver", go: "bienvenida" }
            ]
        },
        u_calc: { msg: "La calculadora hace operaciones b&aacute;sicas y porcentajes. La tienes en la secci&oacute;n Utilidades.", opts: [{ t: "Otra utilidad", go: "utilidades" }, { t: "Volver", go: "bienvenida" }] },
        u_conv: { msg: "El conversor pasa unidades (longitud, peso, temperatura...). Est&aacute; en Utilidades.", opts: [{ t: "Otra utilidad", go: "utilidades" }, { t: "Volver", go: "bienvenida" }] },
        u_pass: { msg: "El generador crea contrase&ntilde;as seguras con longitud y tipos de car&aacute;cter a elegir.", opts: [{ t: "Otra utilidad", go: "utilidades" }, { t: "Volver", go: "bienvenida" }] },
        u_qr: { msg: "La utilidad QR convierte enlaces o texto en un c&oacute;digo QR descargable.", opts: [{ t: "Otra utilidad", go: "utilidades" }, { t: "Volver", go: "bienvenida" }] },
        u_scr: { msg: "El Scratch did&aacute;ctico te deja montar bloques y entender programaci&oacute;n visual.", opts: [{ t: "Otra utilidad", go: "utilidades" }, { t: "Volver", go: "bienvenida" }] },
        contacto: {
            msg: "Puedes escribirme a <strong>archaquet@gmail.com</strong> o usar el formulario del pie de p&aacute;gina (te avisa al m&oacute;vil).",
            opts: [{ t: "Ir al formulario", go: "scroll_contacto" }, { t: "Volver", go: "bienvenida" }]
        },
        cv: {
            msg: "Te abro el CV. Si no aparece, lo tienes en el pie de p&aacute;gina, bot&oacute;n &laquo;Mi CV&raquo;.",
            opts: [{ t: "Volver", go: "bienvenida" }],
            onEnter: function () {
                var b = document.querySelector("[data-open-cv]") ||
                    [].slice.call(document.querySelectorAll(".foot-links button")).filter(function (x) { return /cv/i.test(x.textContent); })[0];
                if (b) b.click();
            }
        },
        scroll_contacto: { msg: "Bajando al formulario de contacto...", opts: [{ t: "Volver", go: "bienvenida" }], onEnter: function () { var f = document.getElementById("contacto") || document.querySelector("footer"); if (f) f.scrollIntoView({ behavior: reduce ? "auto" : "smooth" }); } }
    };

    /* ---------------- utilidades ---------------- */
    function esc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }
    function textoDe(id) {
        var n = NODOS[id];
        return typeof n.msg === "function" ? n.msg() : n.msg;
    }

    /* ---------------- iconos SVG (ASCII puro, no se corrompen) ---------------- */
    var ICON_CHAT = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M4 4h16a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-9l-5 4v-4H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z"/></svg>';
    var ICON_MAX = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 3H3v6M15 21h6v-6M21 9V3h-6M3 15v6h6"/></svg>';
    var ICON_MIN = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 9h6V3M21 15h-6v6M15 3v6h6M9 21v-6H3"/></svg>';
    var ICON_LINE = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M5 12h14"/></svg>';
    var ICON_X = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>';

    /* ---------------- estilos ---------------- */
    var css =
        "#teo-bub{position:fixed;right:18px;bottom:18px;z-index:40;width:58px;height:58px;border-radius:50%;" +
        "background:linear-gradient(135deg,#38BDF8,#6366F1);color:#06101F;border:none;cursor:pointer;" +
        "box-shadow:0 10px 30px -8px rgba(2,8,23,.6);display:grid;place-items:center;transition:transform .2s ease}" +
        "#teo-bub:hover{transform:translateY(-3px) scale(1.04)}" +
        "#teo-bub svg{width:26px;height:26px}" +
        "#teo-panel{position:fixed;right:18px;bottom:86px;z-index:41;width:min(360px,calc(100vw - 36px));height:min(520px,70vh);" +
        "background:#0F172A;border:1px solid rgba(148,163,184,.18);border-radius:18px;box-shadow:0 30px 80px -20px rgba(0,0,0,.7);" +
        "display:none;flex-direction:column;overflow:hidden;font-family:inherit;transition:width .25s ease,height .25s ease,top .25s ease,bottom .25s ease}" +
        "#teo-panel.is-open{display:flex}" +
        ".teo-head{padding:.8rem 1rem;background:#16203A;border-bottom:1px solid rgba(148,163,184,.18);display:flex;align-items:center;gap:.6rem;flex:0 0 auto}" +
        ".teo-head b{color:#EAF1FB;font-size:1rem}" +
        ".teo-head .teo-state{color:#9FB2CC;font-size:.72rem}" +
        ".teo-dot{width:8px;height:8px;border-radius:50%;background:#34D399;box-shadow:0 0 0 3px rgba(52,211,153,.18)}" +
        ".teo-tools{margin-left:auto;display:flex;gap:.25rem}" +
        ".teo-tool{background:transparent;border:none;color:#9FB2CC;width:28px;height:28px;border-radius:8px;cursor:pointer;display:grid;place-items:center;transition:background .2s,color .2s}" +
        ".teo-tool:hover{background:#1E2B4A;color:#EAF1FB}" +
        ".teo-resize{position:absolute;top:0;left:0;width:22px;height:22px;cursor:nwse-resize;z-index:3;touch-action:none}" +
        ".teo-resize::before{content:\"\";position:absolute;inset:4px 0 0 4px;background:" +
        "linear-gradient(45deg,transparent 0 42%,rgba(148,163,184,.55) 42% 52%,transparent 52% 100%)," +
        "linear-gradient(45deg,transparent 0 70%,rgba(148,163,184,.55) 70% 80%,transparent 80% 100%)}" +
        ".teo-resize:hover::before{filter:brightness(1.7)}" +
        ".teo-log{flex:1;overflow-y:auto;padding:1rem;display:flex;flex-direction:column;gap:.7rem}" +
        ".teo-bub-row{display:flex}.teo-bub-row.bot{justify-content:flex-start}.teo-bub-row.user{justify-content:flex-end}" +
        ".teo-msg{max-width:80%;padding:.6rem .85rem;border-radius:14px;font-size:.92rem;line-height:1.5}" +
        ".teo-bub-row.bot .teo-msg{background:#1E2B4A;color:#EAF1FB;border-bottom-left-radius:4px}" +
        ".teo-bub-row.user .teo-msg{background:#38BDF8;color:#06101F;border-bottom-right-radius:4px}" +
        ".teo-typing{display:inline-flex;gap:4px;padding:.7rem .85rem;background:#1E2B4A;border-radius:14px;border-bottom-left-radius:4px}" +
        ".teo-typing i{width:6px;height:6px;border-radius:50%;background:#9FB2CC;animation:teo-blink 1s infinite}" +
        ".teo-typing i:nth-child(2){animation-delay:.15s}.teo-typing i:nth-child(3){animation-delay:.3s}" +
        "@keyframes teo-blink{0%,60%,100%{opacity:.3}30%{opacity:1}}" +
        ".teo-opts{display:flex;flex-wrap:wrap;gap:.45rem;padding:0 1rem .8rem;flex:0 0 auto}" +
        ".teo-opts button{background:transparent;border:1px solid #38BDF8;color:#38BDF8;border-radius:999px;" +
        "padding:.4rem .85rem;font:inherit;font-size:.82rem;cursor:pointer;transition:background .2s,color .2s}" +
        ".teo-opts button:hover{background:#38BDF8;color:#06101F}" +
        ".teo-in{display:flex;gap:.5rem;padding:.7rem;border-top:1px solid rgba(148,163,184,.18);background:#0F172A;flex:0 0 auto}" +
        ".teo-in input{flex:1;background:#1E2B4A;border:1px solid rgba(148,163,184,.18);color:#EAF1FB;border-radius:10px;padding:.6rem .8rem;font:inherit}" +
        ".teo-in input:focus{outline:none;border-color:#38BDF8}" +
        ".teo-in button{background:#38BDF8;border:none;color:#06101F;border-radius:10px;padding:0 .9rem;font:inherit;font-weight:700;cursor:pointer}" +
        "@media (prefers-reduced-motion:reduce){#teo-bub{transition:none}#teo-panel{transition:none}.teo-typing i{animation:none;opacity:.7}}";

    var st = document.createElement("style"); st.textContent = css; document.head.appendChild(st);

    /* ---------------- construir UI ---------------- */
    var bub = document.createElement("button");
    bub.id = "teo-bub"; bub.setAttribute("aria-label", "Abrir chat Teo"); bub.innerHTML = ICON_CHAT;

    var panel = document.createElement("div");
    panel.id = "teo-panel"; panel.setAttribute("role", "dialog"); panel.setAttribute("aria-label", "Chat Teo");
    panel.innerHTML =
        panel.innerHTML =
        '<div class="teo-resize" id="teo-resize" aria-hidden="true"></div>' +
        '<div class="teo-head">' +
        '<span class="teo-dot"></span><b>Teo</b><span class="teo-state">en l&iacute;nea</span>' +
        '<div class="teo-tools">' +
        '<button type="button" class="teo-tool" id="teo-min" aria-label="Minimizar">' + ICON_LINE + '</button>' +
        '<button type="button" class="teo-tool" id="teo-close" aria-label="Cerrar">' + ICON_X + '</button>' +
        '</div>' +
        '</div>' +
        '<div class="teo-log" id="teo-log"></div>' +
        '<div class="teo-opts" id="teo-opts"></div>' +
        '<div class="teo-in"><input id="teo-inp" type="text" placeholder="Escribe tu respuesta..." autocomplete="off"><button id="teo-send">Enviar</button></div>';

    document.body.appendChild(bub); document.body.appendChild(panel);

    var log = document.getElementById("teo-log");
    var optsBox = document.getElementById("teo-opts");
    var inp = document.getElementById("teo-inp");
    var sendBtn = document.getElementById("teo-send");
    var btnMin = document.getElementById("teo-min");
    var btnClose = document.getElementById("teo-close");

    var actual = "start";

    /* ---------------- mensajes ---------------- */
    function burbuja(rol, html) {
        var row = document.createElement("div");
        row.className = "teo-bub-row " + rol;
        var m = document.createElement("div");
        m.className = "teo-msg";
        if (rol === "bot") m.innerHTML = html; else m.textContent = html;
        row.appendChild(m); log.appendChild(row); log.scrollTop = log.scrollHeight;
    }
    function typing() {
        var row = document.createElement("div");
        row.className = "teo-bub-row bot";
        row.innerHTML = '<div class="teo-typing"><i></i><i></i><i></i></div>';
        log.appendChild(row); log.scrollTop = log.scrollHeight;
        return row;
    }
    function renderOpts(id) {
        optsBox.innerHTML = "";
        var n = NODOS[id];
        if (!n || !n.opts) return;
        n.opts.forEach(function (o) {
            var b = document.createElement("button");
            b.innerHTML = o.t;
            b.addEventListener("click", function () { ir(o.go); });
            optsBox.appendChild(b);
        });
    }
    function ir(id) {
        if (!NODOS[id]) return;
        actual = id;
        var n = NODOS[id];
        if (n.onEnter) n.onEnter();
        if (n.opts) optsBox.innerHTML = "";
        var t = typing();
        var delay = reduce ? 0 : 420;
        setTimeout(function () {
            if (t.parentNode) t.parentNode.removeChild(t);
            burbuja("bot", textoDe(id));
            if (n.ask) { inp.focus(); } else { renderOpts(id); }
        }, delay);
    }
    function enviar() {
        var txt = inp.value.trim();
        if (!txt) return;
        burbuja("user", txt);
        inp.value = "";
        var n = NODOS[actual];
        if (n.ask && n.on) { n.on(txt); return; }
        var hit = (n.opts || []).filter(function (o) { return o.t.toLowerCase().indexOf(txt.toLowerCase()) >= 0; })[0];
        if (hit) { ir(hit.go); }
        else { burbuja("bot", "Puedes elegir una opci&oacute;n de los botones de abajo."); }
    }

    /* ---------------- control del panel ---------------- */
    function abrir() {
        panel.classList.add("is-open");
        if (!yaAvisado) {
            yaAvisado = true;
            try { fetch("https://ntfy.sh/" + TOPIC, { method: "POST", mode: "no-cors", body: "Alguien abri&oacute; el chat de tu web" }); } catch (e) { }
        }
        if (log.children.length === 0) ir("start");
        inp.focus();
    }
    function ocultar() { panel.classList.remove("is-open"); }
    function minimizar() { ocultar(); }
    function cerrarYReiniciar() {
        ocultar();
        log.innerHTML = "";
        optsBox.innerHTML = "";
        nombre = "";
        actual = "start";
    }
    /* ---- redimensionar arrastrando la esquina superior izquierda ---- */
    var handle = document.getElementById("teo-resize");
    var MIN_W = 280, MIN_H = 260;
    var dragging = false, sx = 0, sy = 0, sw = 0, sh = 0;
    function maxW() { return Math.max(MIN_W, window.innerWidth - 36); }
    function maxH() { return Math.max(MIN_H, window.innerHeight - 110); }
    function startDrag(e) {
        dragging = true;
        sx = e.clientX; sy = e.clientY;
        var r = panel.getBoundingClientRect();
        sw = r.width; sh = r.height;
        try { handle.setPointerCapture(e.pointerId); } catch (_) { }
        document.body.style.userSelect = "none";
        e.preventDefault();
    }
    function moveDrag(e) {
        if (!dragging) return;
        var w = sw + (sx - e.clientX);   // arrastrar a la IZQUIERDA = mas ancho
        var h = sh + (sy - e.clientY);   // arrastrar hacia ARRIBA = mas alto
        w = Math.max(MIN_W, Math.min(maxW(), w));
        h = Math.max(MIN_H, Math.min(maxH(), h));
        panel.style.width = w + "px";
        panel.style.height = h + "px";
    }
    function endDrag(e) {
        if (!dragging) return;
        dragging = false;
        try { handle.releasePointerCapture(e.pointerId); } catch (_) { }
        document.body.style.userSelect = "";
    }
    handle.addEventListener("pointerdown", startDrag);
    handle.addEventListener("pointermove", moveDrag);
    handle.addEventListener("pointerup", endDrag);
    handle.addEventListener("pointercancel", endDrag);

    bub.addEventListener("click", function () {
        if (panel.classList.contains("is-open")) ocultar(); else abrir();
    });
    btnMin.addEventListener("click", minimizar);
    btnClose.addEventListener("click", cerrarYReiniciar);
    sendBtn.addEventListener("click", enviar);
    inp.addEventListener("keydown", function (e) { if (e.key === "Enter") enviar(); });
})();