/* muneco.js - recorre la trayectoria deslizando (Opcion A) + carrera 3 frames */
(function () {
  var FORZAR = true; // true = anima piernas aunque el usuario tenga reduce-motion
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var animarPiernas = !reduce || FORZAR;

  var timeline = document.querySelector('.timeline');
  if (!timeline) { console.log('[mi-web] muneco OFF: no existe .timeline'); return; }

  var dots = [].slice.call(timeline.querySelectorAll('.tl-item__dot'));
  if (dots.length < 2) { console.log('[mi-web] muneco OFF: faltan dots'); return; }

  /* ---------- Sprite pixel (mirando a la derecha, pelo negro + capucha) ---------- */
  var C = { pelo:'#0B0E17', hood:'#38BDF8', hoodDark:'#0EA5E9', piel:'#EAD9C7',
            ojo:'#0B0E17', torso:'#38BDF8', torsoSh:'#0EA5E9', pant:'#1E2B4A', shoe:'#FBBF24' };
  function r(x,y,w,h,c){ return '<rect x="'+x+'" y="'+y+'" width="'+w+'" height="'+h+'" fill="'+c+'"/>'; }

  // cabeza + torso FIJOS (iguales en los 3 frames)
  var HEAD =
    r(2,0,4,1,C.hood) + r(1,1,5,1,C.hood) + r(6,1,1,1,C.pelo) +   // capucha + flequillo negro
    r(2,2,4,1,C.hood) + r(2,2,1,1,C.pelo) +                       // borde pelo
    r(3,2,3,1,C.piel) + r(5,2,1,1,C.ojo) +                        // cara + ojo
    r(3,3,3,1,C.piel) + r(6,3,1,1,C.pelo) +                       // menton + pelo lateral
    r(2,4,4,1,C.torso) + r(1,4,1,1,C.torsoSh) + r(6,4,1,1,C.torsoSh) + // torso hoodie
    r(2,5,4,1,C.torso) + r(2,6,4,1,C.torsoSh);                    // torso bajo

  // piernas + brazo por frame (carrera lateral: atras-adelante / juntas / adelante-atras)
  var LEGS = [
    // frame 0: contacto (pierna der adelante, izq atras) + brazo atras
    r(5,7,2,1,C.pant)+r(6,8,1,1,C.shoe) + r(2,7,2,1,C.pant)+r(2,8,1,1,C.shoe) + r(6,5,1,1,C.torsoSh),
    // frame 1: pasada (juntas al centro) + brazo medio
    r(3,7,2,1,C.pant)+r(3,8,1,1,C.shoe)+r(4,8,1,1,C.shoe) + r(6,5,1,1,C.torsoSh),
    // frame 2: recobro (pierna der atras, izq doblada arriba) + brazo adelante
    r(5,7,1,2,C.pant)+r(5,8,1,1,C.shoe) + r(2,6,2,1,C.pant)+r(2,7,1,1,C.shoe) + r(7,4,1,1,C.torsoSh)
  ];
  function buildSVG(i){
    return '<svg viewBox="0 0 8 9" shape-rendering="crispEdges" xmlns="http://www.w3.org/2000/svg">'
           + HEAD + LEGS[i] + '</svg>';
  }

  /* ---------- Montar runner con los 3 frames apilados ---------- */
  var runner = timeline.querySelector('.tl-runner');
  if (!runner) {
    runner = document.createElement('li');
    runner.className = 'tl-runner';
    runner.setAttribute('aria-hidden','true');
    timeline.appendChild(runner);
  }
  var inner = document.createElement('span');
  inner.className = 'tl-runner__in';
  inner.innerHTML = '<span class="f0 on">'+buildSVG(0)+'</span>'
                  + '<span class="f1">'+buildSVG(1)+'</span>'
                  + '<span class="f2">'+buildSVG(2)+'</span>';
  runner.innerHTML = '';
  runner.appendChild(inner);
  var frames = [].slice.call(inner.children);

  /* ---------- Camino: polilinea de los 4 dots (coords de documento) ---------- */
  var path = [];      // [{x,y}, ...] en coords de documento
  var segs = [];      // longitudes acumuladas
  var total = 0;
  function docY(el){ var b=el.getBoundingClientRect(); return b.top + window.pageYOffset + b.height/2; }
  function docX(el){ var b=el.getBoundingClientRect(); return b.left + window.pageXOffset + b.width/2; }
  function recalc(){
    path = dots.map(function(d){ return { x: docX(d), y: docY(d) }; });
    segs = [0]; total = 0;
    for (var i=1;i<path.length;i++){
      total += Math.hypot(path[i].x-path[i-1].x, path[i].y-path[i-1].y);
      segs.push(total);
    }
  }
  function posAt(s){ // posicion a lo largo del camino (s en [0,total])
    if (s<=0) return {x:path[0].x, y:path[0].y};
    if (s>=total) return {x:path[path.length-1].x, y:path[path.length-1].y};
    for (var i=1;i<path.length;i++){
      if (s<=segs[i]){
        var t=(s-segs[i-1])/(segs[i]-segs[i-1]);
        return { x: path[i-1].x+(path[i].x-path[i-1].x)*t,
                 y: path[i-1].y+(path[i].y-path[i-1].y)*t };
      }
    }
    return path[path.length-1];
  }
  var target = null;
  var cur = null;
  function computeTarget(){
    if (!total) return;
    var ref  = window.pageYOffset + window.innerHeight*0.45;
    var span = (path[path.length-1].y - path[0].y);
    if (span <= 0) return;
    var p = (ref - path[0].y) / span;
    p = Math.max(0, Math.min(1, p));
    target = posAt(p*total);
  }
  function visible(){ var t=timeline.getBoundingClientRect(); return t.bottom>0 && t.top<window.innerHeight; }

  // recalc solo cuando el layout puede cambiar (no cada frame, para ir fino)
  window.addEventListener('resize', function(){ recalc(); computeTarget(); });
  window.addEventListener('load', function(){ recalc(); computeTarget(); });

  // init
  recalc(); computeTarget();
  cur = target ? { x:target.x, y:target.y } : { x:path[0].x, y:path[0].y };

  var frameIdx=1, acc=0, lastT=performance.now();
  var FRAME_MS = 110;   // carrera tranquila
  var K = 0.14;         // suavizado (mas bajo = mas perezoso/zen)

  function loop(now){
    requestAnimationFrame(loop);
    var dt = now - lastT; lastT = now;
    if (!cur || !target) return;

    // leer el scroll CADA FRAME (ya no dependemos del evento scroll)
    if (visible()) computeTarget();

    // easing exponencial hacia el objetivo => deslizamiento suave
    var px = cur.x, py = cur.y;
    cur.x += (target.x - cur.x) * K;
    cur.y += (target.y - cur.y) * K;

    // aplicar posicion (runner absolute dentro de .timeline, left/top 0)
    var tlRect = timeline.getBoundingClientRect();
    var ox = window.pageXOffset + tlRect.left;
    var oy = window.pageYOffset + tlRect.top;
    runner.style.transform = 'translate('+(cur.x-ox-15)+'px,'+(cur.y-oy-30)+'px)';

    // frames: anima piernas solo si se esta moviendo de verdad (idle freeze)
    var speed = Math.hypot(cur.x-px, cur.y-py);
    if (animarPiernas && speed > 0.4){
      acc += dt;
      if (acc >= FRAME_MS){
        acc = 0;
        frameIdx = (frameIdx+1) % 3;
        for (var i=0;i<frames.length;i++) frames[i].classList.toggle('on', i===frameIdx);
      }
    } else {
      for (var j=0;j<frames.length;j++) frames[j].classList.toggle('on', j===1);
      acc = 0;
    }
  }
  requestAnimationFrame(loop);
})();