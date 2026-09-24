/* ==========================================================================
   CHATBOT.JS — Teo, asistente por reglas (sin IA externa)
   - Se auto-inyecta el widget (burbuja + panel) en <body>
   - Base de conocimiento por palabras clave + respuesta fija
   - Redimensionable, responsive, modo oscuro, persistencia en localStorage
   ========================================================================== */
(function () {
    'use strict';
    var root = document.documentElement;
    var REDUCE = matchMedia('(prefers-reduced-motion: reduce)').matches;
    /* --- Notificacion al movil (ntfy.sh) --- */
    var NTFY_ON = true;                                   // false para desactivar
    var NTFY_TOPIC = 'alvarowebprogramacion2838462';               // CAMBIA esto por tu topic
    var NTFY_URL = 'https://ntfy.sh/' + NTFY_TOPIC;
    var yaAvisado = false;
    function avisar(msg) {
        if (!NTFY_ON || yaAvisado) return;
        yaAvisado = true;                                   // 1 aviso por carga de pagina
        try {
            fetch(NTFY_URL, {
                method: 'POST',
                headers: { 'Title': 'Chat abierto en mi web', 'Tags': 'speech_balloon' },
                body: msg
            });
        } catch (_) { }
    }

    /* ---------------------------------------------------------------------
       BASE DE CONOCIMIENTO
       id · kw (palabras/frases clave) · r (respuesta)
       El bot gana el tema con MÁS coincidencias.
    --------------------------------------------------------------------- */
    var TEMAS = [
        {
            id: 'saludo', kw: ['hola', 'buenas', 'buenos dias', 'buenas tardes', 'hey', 'que tal', 'holi', 'saludos'],
            r: '¡Hola! 👋 Soy Teo, el asistente de la web de Álvaro. ¿Sobre qué quieres saber?'
        },
        {
            id: 'despedida', kw: ['adios', 'chao', 'hasta luego', 'nos vemos', 'bye', 'me voy'],
            r: '¡Hasta luego! 😊 Si te queda cualquier duda, escríbele a Álvaro a archaquet@gmail.com.'
        },
        {
            id: 'gracias', kw: ['gracias', 'muchas gracias', 'genial', 'perfecto', 'vale gracias'],
            r: '¡De nada! 😄 Para cualquier otra cosa, aquí estoy o escríbele a archaquet@gmail.com.'
        },
        {
            id: 'nombre', kw: ['nombre', 'llamas', 'llamado', 'como te llamas', 'cual es tu nombre', 'tu nombre', 'dime tu nombre', 'con que nombre te', 'eres teo', 'te llamas', 'como te llamas teo', 'quien eres tu', 'quien eres'],
            r: 'Me llamo Teo 👋 Soy el asistente de la web de Álvaro. Pregúntame por estudios, aficiones, idiomas, FACTS, EDEM, el futuro (Big Data), contacto o la utilidad de recortar fondo.'
        },
        {
            id: 'teo', kw: ['que eres', 'eres un bot', 'eres un robot', 'eres ia', 'eres real', 'eres humano', 'eres un chatbot', 'eres un programa', 'eres inteligente', 'que eres tu'],
            r: 'Soy Teo, un asistente por reglas (sin IA externa). Busco palabras clave en tu pregunta y respondo con lo que Álvaro dejó preparado. No pienso, pero ayudo 😊.'
        },
        {
            id: 'alvaro', kw: ['quien es alvaro', 'quien eres tu creador', 'el dueño', 'de quien es la web', 'tu creador', 'quien te hizo', 'alvaro ripoll', 'sobre alvaro'],
            r: 'Álvaro Ripoll Chaquet: 19 años, de Xàtiva, estudiante de 1º de DAM en el Simarro, con base en SMX. Le gustan el deporte, las matemáticas, la informática y los negocios.'
        },
        {
            id: 'estudios', kw: ['que estudia', 'estudios', 'dam', 'simarro', 'grado superior', 'fp', 'que cursa', 'clase', 'asignatura', 'que hace estudiando'],
            r: 'Está en 1º de DAM (Desarrollo de Aplicaciones Multiplataforma) en el Simarro (Xàtiva). Es un ciclo superior de formación profesional.'
        },
        {
            id: 'smx', kw: ['smx', 'grado medio', 'antes de', 'formacion previa', 'base', 'de donde viene', 'sistemas'],
            r: 'Viene del grado medio de SMX (sistemas microinformáticos y redes), donde aprendió la parte de máquinas, sistemas y redes que casi nadie ve.'
        },
        {
            id: 'aficiones', kw: ['aficion', 'gusto', 'hobby', 'hobbies', 'que le gusta', 'le gusta', 'deporte', 'matematicas', 'informatica', 'negocios', 'ocio'],
            r: 'Cuatro cosas a las que siempre vuelve: deporte, matemáticas, informática y negocios. La disciplina del entreno se parece mucho a la del estudio 💪.'
        },
        {
            id: 'idiomas', kw: ['idioma', 'inglés', 'ingles', 'valenciano', 'castellano', 'b2', 'que idiomas', 'habla'],
            r: 'Castellano y valenciano nativos, e inglés nivel B2. Acudió al congreso europeo FACTS 2024, donde el inglés fue útil.'
        },
        {
            id: 'facts', kw: ['facts', 'congreso', 'europeo'],
            r: 'Acudió al congreso europeo FACTS en 2024: ponencias, talleres y conversación con gente de otros países.'
        },
        {
            id: 'edem', kw: ['edem', 'curso', 'marketing', 'startup', 'startups', 'valencia', 'valència', 'gestion empresarial', 'ia'],
            r: 'Hizo un curso de gestión empresarial sobre marketing, IA y startups en EDEM (València). Le sirvió para entender para qué se programa.'
        },
        {
            id: 'futuro', kw: ['big data', 'futuro', 'plan', 'objetivo', 'que quiere', 'despues', 'siguiente', 'meta', 'a medio plazo'],
            r: 'Su siguiente paso es formarse en Big Data y análisis de datos: unir matemáticas e informática en un perfil de datos. Ese es el plan a medio plazo 📊.'
        },
        {
            id: 'stack', kw: ['lenguaje', 'java', 'python', 'sql', 'git', 'tecnologias', 'que sabe', 'habilidades', 'stack', 'programacion'],
            r: 'En DAM está trabajando con programación, bases de datos y desarrollo de apps (Java, SQL, Python, Git). Su base de sistemas viene de SMX.'
        },
        {
            id: 'ubicacion', kw: ['donde vive', 'donde esta', 'ciudad', 'xativa', 'jativa', 'ubicacion', 'localizacion'],
            r: 'Nació y vive en Xàtiva (València), España. Su web la hace a mano con HTML, CSS y JavaScript.'
        },
        {
            id: 'edad', kw: ['cuantos años', 'edad', 'mayor', 'joven', 'nacio', 'cumple'],
            r: 'Tiene 19 años. La fecha exacta no la publico por privacidad, pero si necesitas algo concreto, escríbele al correo.'
        },
        {
            id: 'contacto', kw: ['contacto', 'correo', 'email', 'escribir', 'hablar', 'como contacto', 'ponerme en contacto', 'numero', 'telefono'],
            r: 'Puedes escribirle a archaquet@gmail.com. Es la mejor vía para prácticas, proyectos o cualquier propuesta. Responde rápido 📩.'
        },
        {
            id: 'practicas', kw: ['practicas', 'fct', 'trabajo', 'empleo', 'freelance', 'empresa', 'busca trabajo', 'disponible'],
            r: 'Está abierto a prácticas y proyectos. La vía es su correo: archaquet@gmail.com. Cuéntale qué necesitas y te responde.'
        },
        {
            id: 'redes', kw: ['linkedin', 'github', 'twitter', 'instagram', 'redes', 'perfil', 'x.com'],
            r: 'Álvaro aún no tiene redes enlazadas en la web. Lo más directo es su correo: archaquet@gmail.com.'
        },
        {
            id: 'utilidad', kw: ['recortar', 'quitar fondo', 'fondo', 'la utilidad', 'herramienta', 'imagen', 'foto', 'para que sirve la utilidad'],
            r: 'En "Utilidades" hay un recortador de fondo con IA que corre en TU navegador: la foto no se sube a ningún servidor. La primera vez tarda (descarga el modelo); después va rápido.'
        },
        {
            id: 'privacidad', kw: ['privacidad', 'se sube', 'mis datos', 'seguro', 'seguridad', 'donde va mi foto'],
            r: 'El recorte de fondo se procesa localmente en tu equipo: la imagen no se envía a ningún servidor. Y este chat (Teo) tampoco guarda nada fuera de tu navegador.'
        },
        {
            id: 'que_es', kw: ['que es esta web', 'para que sirve', 'que haces aqui', 'que ofreces', 'para que esta', 'que es esto'],
            r: 'Es la web personal de Álvaro: quién es, su formación, sus aficiones y contacto. Además hay una utilidad para recortar el fondo de fotos con IA.'
        },
        {
            id: 'ayuda', kw: ['que puedes hacer', 'ayudame', 'ayuda', 'que sabes', 'opciones', 'comandos', 'como funciona'],
            r: 'Pregúntame por: estudios, aficiones, idiomas, FACTS, EDEM, futuro/Big Data, contacto, la utilidad de recortar fondo o privacidad. Si no te entero, usa otras palabras 😉.'
        }
    ];

    var SALUDO = 'Hola, mi nombre es Teo y soy un chatbot de IA. Pregúntame por Álvaro: estudios, aficiones, contacto, la utilidad… 👋';
    var DEFECTO = 'No tengo una respuesta preparada para eso 🤔. Prueba con: estudios, aficiones, idiomas, FACTS, EDEM, Big Data, contacto o la utilidad. O escríbele a Álvaro a archaquet@gmail.com.';

    /* --- Normalización: minúsculas, sin tildes ni signos ------------------ */
    function norm(s) {
        return (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
    }

    /* --- Busca el tema con más coincidencias ----------------------------- */
    function buscar(texto) {
        var t = norm(texto), padded = ' ' + t + ' ', best = 0, id = null;
        TEMAS.forEach(function (tema) {
            var score = 0;
            tema.kw.forEach(function (k) {
                var kn = norm(k);
                if (k.indexOf(' ') > -1) {                       // frase (con espacios)
                    if (t.indexOf(kn) > -1) score += 2;           // frase literal contenida
                    else {                                        // tolerancia: todas las palabras presentes
                        var ws = kn.split(' ');
                        if (ws.every(function (w) { return padded.indexOf(' ' + w + ' ') > -1; })) score += 1;
                    }
                } else {                                         // palabra suelta exacta
                    if (padded.indexOf(' ' + kn + ' ') > -1) score += 2;
                }
            });
            if (score > best) { best = score; id = tema.id; }
        });
        return (id && best > 0) ? TEMAS.filter(function (x) { return x.id === id; })[0] : null;
    }

    /* =====================================================================
       WIDGET
       ===================================================================== */
    var KEY_CONV = 'cb-conv', KEY_SIZE = 'cb-size';
    var conv = [];

    // Crear DOM
    var bubble = document.createElement('button');
    bubble.className = 'cb-bubble pulse'; bubble.id = 'cb-bubble';
    bubble.setAttribute('aria-label', 'Abrir el asistente Teo'); bubble.setAttribute('aria-expanded', 'false');
    bubble.innerHTML = '<span class="cb-bubble__icon">💬</span>';

    var panel = document.createElement('div');
    panel.className = 'cb-panel'; panel.id = 'cb-panel'; panel.hidden = true;
    panel.setAttribute('role', 'dialog'); panel.setAttribute('aria-label', 'Asistente Teo');
    panel.innerHTML =
        '<header class="cb-head">' +
        '<span class="cb-head__avatar">Teo</span>' +
        '<div class="cb-head__info"><strong>Teo</strong><small>Asistente de Álvaro</small></div>' +
        '<div class="cb-head__actions">' +
        '<button class="cb-ico" id="cb-max" aria-label="Ampliar o reducir">⤢</button>' +
        '<button class="cb-ico" id="cb-clear" aria-label="Limpiar conversación">↻</button>' +
        '<button class="cb-ico" id="cb-close" aria-label="Cerrar chat">✕</button>' +
        '</div>' +
        '</header>' +
        '<div class="cb-body" id="cb-log" role="log" aria-live="polite"></div>' +
        '<form class="cb-form" id="cb-form">' +
        '<input id="cb-input" autocomplete="off" placeholder="Escribe tu pregunta…" aria-label="Mensaje">' +
        '<button type="submit" class="cb-send" aria-label="Enviar">➤</button>' +
        '</form>' +
        '<span class="cb-resize" id="cb-resize" aria-hidden="true"></span>';

    document.body.appendChild(bubble);
    document.body.appendChild(panel);

    var log = panel.querySelector('#cb-log');
    var input = panel.querySelector('#cb-input');
    var form = panel.querySelector('#cb-form');

    /* --- Render de mensajes ---------------------------------------------- */
    function burbuja(role, texto) {
        var d = document.createElement('div');
        d.className = 'cb-msg cb-msg--' + role;
        d.textContent = texto;            // seguro: sin HTML inyectado
        log.appendChild(d); log.scrollTop = log.scrollHeight;
        return d;
    }
    function escribirProgresivo(node, texto) {
        if (REDUCE) { node.textContent = texto; log.scrollTop = log.scrollHeight; return; }
        var i = 0;
        var id = setInterval(function () {
            node.textContent = texto.slice(0, ++i);
            log.scrollTop = log.scrollHeight;
            if (i >= texto.length) clearInterval(id);
        }, 14);
    }

    /* --- Abrir / cerrar --------------------------------------------------- */
    function abrir() {
        panel.hidden = false;
        bubble.setAttribute('aria-expanded', 'true');
        bubble.classList.remove('pulse');
        aplicarTamanio();
        if (!conv.length) { conv.push({ r: 'bot', t: SALUDO }); burbuja('bot', SALUDO); guardarConv(); }
        else { log.innerHTML = ''; conv.forEach(function (m) { burbuja(m.r, m.t); }); }
        avisar('Alguien abrio el chat (' + new Date().toLocaleString('es-ES') + ')');
        setTimeout(function () { input.focus(); }, 60);
    }
    function cerrar() { panel.hidden = true; bubble.setAttribute('aria-expanded', 'false'); }
    bubble.addEventListener('click', function () { panel.hidden ? abrir() : cerrar(); });
    panel.querySelector('#cb-close').addEventListener('click', cerrar);

    /* --- Enviar ----------------------------------------------------------- */
    form.addEventListener('submit', function (e) {
        e.preventDefault();
        var q = input.value.trim(); if (!q) return;
        input.value = '';
        conv.push({ r: 'user', t: q }); burbuja('user', q);

        var typing = document.createElement('div');
        typing.className = 'cb-typing'; typing.innerHTML = '<i></i><i></i><i></i>';
        log.appendChild(typing); log.scrollTop = log.scrollHeight;

        setTimeout(function () {
            typing.remove();
            var tema = buscar(q);
            var ans = tema ? tema.r : DEFECTO;
            conv.push({ r: 'bot', t: ans });
            var node = document.createElement('div');
            node.className = 'cb-msg cb-msg--bot'; log.appendChild(node);
            escribirProgresivo(node, ans);
            guardarConv();
        }, REDUCE ? 0 : 550 + Math.random() * 400);
    });

    /* --- Limpiar ---------------------------------------------------------- */
    panel.querySelector('#cb-clear').addEventListener('click', function () {
        conv = [{ r: 'bot', t: SALUDO }]; log.innerHTML = ''; burbuja('bot', SALUDO); guardarConv();
    });

    /* --- Persistencia conversación --------------------------------------- */
    function guardarConv() { try { localStorage.setItem(KEY_CONV, JSON.stringify(conv)); } catch (_) { } }

    /* =====================================================================
       REDIMENSIONADO (arrastrar esquina sup-izq) + MAX/MIN
       ===================================================================== */
    var handle = panel.querySelector('#cb-resize');
    var baseW = 340, baseH = 460, max = false;
    function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
    function aplicarTamanio() {
        var s = leerSize(); baseW = s.w; baseH = s.h;
        panel.style.width = baseW + 'px'; panel.style.height = baseH + 'px';
    }
    function leerSize() {
        try { var s = JSON.parse(localStorage.getItem(KEY_SIZE)); if (s && s.w && s.h) return s; } catch (_) { }
        return { w: 340, h: 460 };
    }
    function guardarSize() { try { localStorage.setItem(KEY_SIZE, JSON.stringify({ w: baseW, h: baseH })); } catch (_) { } }

    handle.addEventListener('pointerdown', function (e) {
        if (matchMedia('(max-width:600px)').matches) return; // en móvil no aplica
        e.preventDefault(); handle.setPointerCapture(e.pointerId);
        var sx = e.clientX, sy = e.clientY, sw = baseW, sh = baseH;
        function mv(ev) {
            baseW = clamp(sw + (sx - ev.clientX), 300, Math.min(640, innerWidth - 40));
            baseH = clamp(sh + (sy - ev.clientY), 360, innerHeight - 140);
            panel.style.width = baseW + 'px'; panel.style.height = baseH + 'px';
        }
        function up() { handle.removeEventListener('pointermove', mv); guardarSize(); }
        handle.addEventListener('pointermove', mv);
        handle.addEventListener('pointerup', up, { once: true });
    });

    panel.querySelector('#cb-max').addEventListener('click', function () {
        max = !max;
        if (max) { baseW = Math.min(900, innerWidth - 24); baseH = innerHeight - 140; }
        else { var s = leerSize(); baseW = s.w; baseH = s.h; }
        panel.style.width = baseW + 'px'; panel.style.height = baseH + 'px';
        if (!max) guardarSize();
    });

    // Si cambia el tema, nada que refrescar: el CSS usa variables.
})();