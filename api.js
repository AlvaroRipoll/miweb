/* api.js - panel "En vivo" + tiempo y reloj del footer.
   4 fuentes externas sin clave, cada una con su try/catch y error amable.
   NO usa claves. NO toca otros ficheros. Todo en un solo fichero.
   VERSION 2: cripto con reintento y hueco nunca vacio; futbol sin tildes y con
   respaldo de temporada. */
(function () {
    /* ---- config: segundos de recarga (0 = no recarga) ---- */
    var RELOAD_GITHUB = 0;    // GitHub: limite 60/h por IP, no recargamos para no saturar
    var RELOAD_CRIPTO = 120;  // CoinGecko gratis ratia, le damos margen
    var RELOAD_FUTBOL = 600;  // los partidos no cambian cada minuto
    var RELOAD_TIEMPO = 600;  // el tiempo tampoco

    /* ---- estilos inyectados (usan tus variables; el footer va fijo claro) ---- */
    var css =
        ".envivo{width:var(--w);margin:clamp(3rem,6vw,5rem) auto 0}" +
        ".envivo__title{font-family:var(--font-display);font-size:clamp(1.6rem,1.2rem+2vw,2.2rem);color:var(--color-texto);margin:0 0 .6rem}" +
        ".envivo__frase{color:var(--color-texto-suave);max-width:62ch;margin:0 0 1.6rem;line-height:1.6}" +
        ".envivo__grid{display:grid;grid-template-columns:repeat(3,1fr);gap:1rem}" +
".envivo__card{background:var(--color-panel);border:1px solid var(--color-borde);border-radius:14px;padding:1.2rem;min-height:120px;color:var(--color-texto);box-shadow:var(--shadow-sm);display:flex;flex-direction:column;gap:.5rem;justify-content:center}" +        ".envivo__card h4{font-family:var(--font-mono);font-size:.7rem;letter-spacing:.08em;text-transform:uppercase;color:var(--color-texto-tenue);margin:0}" +
        ".envivo__big{font-family:var(--font-display);font-weight:800;font-size:1.8rem;line-height:1;color:var(--color-texto)}" +
        ".envivo__row{display:flex;justify-content:space-between;gap:.6rem;font-size:.85rem;color:var(--color-texto-suave)}" +
        ".envivo__up{color:var(--color-terciario)} .envivo__down{color:var(--color-peligro)}" +
        ".envivo__err{color:var(--color-texto-suave);font-size:.85rem}" +
        ".envivo__link{color:var(--color-acento);font-size:.8rem;text-decoration:none}" +
        ".envivo__link:hover{text-decoration:underline}" +
        ".envivo__footer{display:flex;flex-wrap:wrap;align-items:center;gap:.6rem;font-family:var(--font-mono);font-size:.8rem;color:#CBD5E1;margin-top:1rem}" +
        ".envivo__footer select{background:#16203A;color:#EAF1FB;border:1px solid rgba(148,163,184,.3);border-radius:8px;padding:.25rem .4rem;font:inherit}" +
        ".envivo__sep{opacity:.5}" +
        "#f-tiempo b{color:#EAF1FB}" +
        "@media (max-width:760px){.envivo__grid{grid-template-columns:1fr}}";
    var st = document.createElement("style"); st.textContent = css; document.head.appendChild(st);

    function el(id) { return document.getElementById(id); }
    function esc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }
    function hueco(id, html) { var e = el(id); if (e) e.innerHTML = html; }
    function err(id, msg) { var e = el(id); if (e) e.innerHTML = '<h4>' + (e.getAttribute("data-tit") || "") + '</h4><p class="envivo__err">' + msg + '</p>'; }
    // quita tildes para que "Atletico" matchee a "Atletico" con o sin tilde
    function sinTildes(s) { return String(s).normalize("NFD").replace(/[\u0300-\u036f]/g, ""); }

    /* ---- 1. GitHub (perfil publico, sin clave) ---- */
    function github() {
        var box = el("w-github"); if (!box) return;
        box.setAttribute("data-tit", "GitHub");
        fetch("https://api.github.com/users/AlvaroRipoll", { headers: { "Accept": "application/vnd.github+json" } })
            .then(function (r) {
                if (r.status === 403) throw { kind: "rate" };
                if (r.status === 404) throw { kind: "404" };
                if (!r.ok) throw { kind: "net" };
                return r.json();
            })
            .then(function (d) {
                box.innerHTML =
                    '<h4>GitHub</h4>' +
                    '<div class="envivo__big">' + (d.public_repos || 0) + ' <span style="font-size:.9rem;font-weight:400">repos</span></div>' +
                    '<div class="envivo__row"><span>Seguidores</span><b>' + (d.followers || 0) + '</b></div>' +
                    '<a class="envivo__link" href="' + esc(d.html_url || "#") + '" target="_blank" rel="noopener">ver perfil &rarr;</a>';
            })
            .catch(function (e) {
                var m = (e && e.kind === "rate") ? "GitHub da guerra ahora (limite de la red compartida). En casa funciona." :
                    (e && e.kind === "404") ? "No encuentro ese perfil." : "GitHub no responde.";
                err("w-github", m);
            });
    }

    /* ---- 2. Cripto (CoinGecko, sin clave, EUR). Reintento si viene vacio. ---- */
    function cripto(n) {
        n = n || 0;
        var box = el("w-cripto"); if (!box) return;
        box.setAttribute("data-tit", "Cripto");
        fetch("https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,ripple,binancecoin&vs_currencies=eur&include_24hr_change=true")
            .then(function (r) { if (!r.ok) throw new Error("net"); return r.json(); })
            .then(function (d) {
                var orden = [["bitcoin", "BTC"], ["ethereum", "ETH"], ["ripple", "XRP"], ["binancecoin", "BNB"]];
                var filas = orden.map(function (p) {
                    var m = d && d[p[0]]; if (!m || m.eur == null) return "";
                    var ch = (m.eur_24h_change != null ? m.eur_24h_change : 0); var cls = ch >= 0 ? "envivo__up" : "envivo__down"; var fle = ch >= 0 ? "&#9650;" : "&#9660;";
                    return '<div class="envivo__row"><span>' + p[1] + '</span><span><b>' + Math.round(m.eur).toLocaleString("es-ES") + ' &euro;</b> <span class="' + cls + '">' + fle + ' ' + Math.abs(ch).toFixed(1) + '%</span></span></div>';
                }).join("");
                if (!filas) { // CoinGecko devolvio 200 pero vacio (ratia): reintento unico y luego amable
                    if (n === 0) { setTimeout(function () { cripto(1); }, 6000); return; }
                    throw new Error("vacio");
                }
                box.innerHTML = '<h4>Cripto</h4><div style="display:grid;gap:.3rem">' + filas + '</div>';
            })
            .catch(function () { err("w-cripto", "CoinGecko no responde ahora."); });
    }

    /* ---- 3. Futbol (TheSportsDB, La Liga id 4335, clave publica 3). ----
       Sin tildes en el filtro + respaldo de temporada si la actual viene vacia. ---- */
    function temporadas() {
        var y = new Date().getFullYear(); var m = new Date().getMonth() + 1;
        var cur = (m >= 8) ? (y + "-" + (y + 1)) : ((y - 1) + "-" + y);
        var prev = (m >= 8) ? ((y - 1) + "-" + y) : ((y - 2) + "-" + (y - 1));
        return [cur, prev];
    }
    function futbol() {
        var box = el("w-futbol"); if (!box) return;
        box.setAttribute("data-tit", "Atleti");
        pedir("", 0);
        function pedir(temp, i) {
            var ts = temporadas();
            var url = "https://api.thesportsdb.com/api/v1/json/3/lookuptable.php?l=4335" + (temp ? ("&s=" + temp) : "");
            fetch(url)
                .then(function (r) { if (!r.ok) throw new Error("net"); return r.json(); })
                .then(function (d) {
                    var t = d && d.table;
                    if (!t || !t.length) {
                        if (i < ts.length) { pedir(ts[i], i + 1); return; }
                        throw new Error("vacia");
                    }
                    pintaTabla(t);
                })
                .catch(function () {
                    if (i < ts.length) { pedir(ts[i], i + 1); }
                    else { err("w-futbol", "No encuentro la clasificaci&oacute;n ahora mismo."); }
                });
        }
        function pintaTabla(t) {
            var idx = -1;
            for (var k = 0; k < t.length; k++) { if (/atletico/i.test(sinTildes(t[k].strTeam || ""))) { idx = k; break; } }
            var at = idx >= 0 ? t[idx] : null;
            var html = '<h4>Atleti</h4>';
            if (!at) { box.innerHTML = html + '<div class="envivo__err">No veo al Atleti en la tabla.</div>'; return; }
            // linea grande: puesto + puntos
            html += '<div class="envivo__big">' + (at.intRank || "?") + '&ordm; <span style="font-size:1rem;font-weight:400;color:var(--color-texto-suave)">' + (at.intPoints || 0) + ' pts</span></div>';
            // contexto: el de arriba, el Atleti y el de abajo (rellena a 3 si falta)
            var filaIdx = [];
            if (idx - 1 >= 0) filaIdx.push(idx - 1);
            filaIdx.push(idx);
            if (idx + 1 < t.length) filaIdx.push(idx + 1);
            if (filaIdx.length < 3) {
                if (idx - 2 >= 0) filaIdx.unshift(idx - 2);
                else if (idx + 2 < t.length) filaIdx.push(idx + 2);
            }
            var top = filaIdx.map(function (i) {
                var r = t[i];
                var es = (i === idx);
                var cls = es ? ' style="color:var(--color-acento);font-weight:700"' : '';
                var badge = r.strBadge ? '<img src="' + esc(r.strBadge) + '" alt="" style="width:16px;height:16px;vertical-align:middle;margin-right:.3rem">' : '';
                var der = es ? formHtml(r.strForm) : r.intPoints;
                return '<div class="envivo__row"' + cls + '><span>' + r.intRank + ' ' + badge + esc(r.strTeam) + '</span><b>' + der + '</b></div>';
            }).join("");
            html += '<div style="margin-top:.5rem;border-top:1px solid var(--color-borde);padding-top:.4rem">' + top + '</div>';
            box.innerHTML = html;
        }
        function formHtml(s) {
            if (!s) return "";
            var map = { W: "var(--color-terciario)", D: "var(--color-texto-tenue)", L: "var(--color-peligro)" };
            var out = "";
            for (var i = 0; i < s.length; i++) {
                var c = s.charAt(i); var col = map[c] || "var(--color-texto-tenue)";
                out += '<span style="color:' + col + ';font-weight:700;margin-left:2px">' + c + '</span>';
            }
            return out;
        }
    }

    /* ---- 4. Tiempo Xativa (Open-Meteo, sin clave) ---- */
    function tiempo() {
        var box = el("f-tiempo"); if (!box) return;
        fetch("https://api.open-meteo.com/v1/forecast?latitude=38.9921&longitude=-0.5215&current=temperature_2m,weather_code&timezone=Europe/Madrid")
            .then(function (r) { if (!r.ok) throw new Error("net"); return r.json(); })
            .then(function (d) {
                var t = Math.round(d.current.temperature_2m); var c = d.current.weather_code;
                box.innerHTML = 'X&agrave;tiva <b>' + t + '&deg;C</b> &middot; ' + desc(c);
            })
            .catch(function () { box.textContent = 'Tiempo no disponible.'; });
        function desc(c) {
            if (c === 0) return "despejado"; if (c <= 2) return "poco nuboso"; if (c === 3) return "nuboso";
            if (c === 45 || c === 48) return "niebla"; if (c < 60) return "llovizna"; if (c < 70) return "lluvia";
            if (c < 80) return "lluvia fuerte"; if (c < 90) return "chubascos"; return "tormenta";
        }
    }

    /* ---- Reloj local con selector (NO es API: Intl del navegador) ---- */
    function reloj() {
        var r = el("f-reloj"), sel = el("f-zona"); if (!r) return;
        var zona = sel ? sel.value : "Europe/Madrid";
        function tick() {
            try {
                r.textContent = new Intl.DateTimeFormat("es-ES", { timeZone: zona, hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false }).format(new Date());
            } catch (e) { r.textContent = "--:--:--"; }
        }
        tick(); setInterval(tick, 1000);
        if (sel) sel.addEventListener("change", function () { zona = sel.value; tick(); });
    }

    /* ---- arranque + recargas ---- */
    function init() {
        github(); cripto(0); futbol(); tiempo(); reloj();
        if (RELOAD_CRIPTO > 0) setInterval(function () { cripto(0); }, RELOAD_CRIPTO * 1000);
        if (RELOAD_FUTBOL > 0) setInterval(futbol, RELOAD_FUTBOL * 1000);
        if (RELOAD_TIEMPO > 0) setInterval(tiempo, RELOAD_TIEMPO * 1000);
    }
    if (document.readyState !== "loading") init(); else document.addEventListener("DOMContentLoaded", init);
})();