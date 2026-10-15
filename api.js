/* api.js - panel "En vivo" + tiempo y reloj del footer.
   4 fuentes externas sin clave, cada una con su try/catch y error amable.
   NO usa claves. NO toca otros ficheros. Todo en un solo fichero. */
(function () {
  /* ---- config: segundos de recarga (0 = no recarga) ---- */
  var RELOAD_GITHUB = 0;    // GitHub: limite 60/h por IP, no recargamos para no saturar
  var RELOAD_CRIPTO = 60;   // CoinGecko aguanta bien
  var RELOAD_FUTBOL = 600;  // los partidos no cambian cada minuto
  var RELOAD_TIEMPO = 600;  // el tiempo tampoco

  /* ---- estilos inyectados (usan tus variables; el footer va fijo claro) ---- */
  var css =
    ".envivo{width:var(--w);margin:clamp(3rem,6vw,5rem) auto 0}" +
    ".envivo__title{font-family:var(--font-display);font-size:clamp(1.6rem,1.2rem+2vw,2.2rem);color:var(--color-texto);margin:0 0 .6rem}" +
    ".envivo__frase{color:var(--color-texto-suave);max-width:62ch;margin:0 0 1.6rem;line-height:1.6}" +
    ".envivo__grid{display:grid;grid-template-columns:repeat(3,1fr);gap:1rem}" +
    ".envivo__card{background:var(--color-panel);border:1px solid var(--color-borde);border-radius:14px;padding:1.2rem;min-height:120px;color:var(--color-texto);box-shadow:var(--shadow-sm);display:flex;flex-direction:column;gap:.5rem}" +
    ".envivo__card h4{font-family:var(--font-mono);font-size:.7rem;letter-spacing:.08em;text-transform:uppercase;color:var(--color-texto-tenue);margin:0}" +
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

  function el(id){ return document.getElementById(id); }
  function esc(s){ return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;"); }
  function hueco(id, html){ var e=el(id); if(e) e.innerHTML=html; }
  function err(id,msg){ hueco(id,'<h4>'+el(id).getAttribute("data-tit")+'</h4><p class="envivo__err">'+msg+'</p>'); }

  /* ---- 1. GitHub (perfil publico, sin clave) ---- */
  function github(){
    var box = el("w-github"); if(!box) return;
    box.setAttribute("data-tit","GitHub");
    fetch("https://api.github.com/users/AlvaroRipoll", {headers:{"Accept":"application/vnd.github+json"}})
      .then(function(r){
        if(r.status===403) throw {kind:"rate"};
        if(r.status===404) throw {kind:"404"};
        if(!r.ok) throw {kind:"net"};
        return r.json();
      })
      .then(function(d){
        box.innerHTML =
          '<h4>GitHub</h4>' +
          '<div class="envivo__big">'+(d.public_repos||0)+' <span style="font-size:.9rem;font-weight:400">repos</span></div>' +
          '<div class="envivo__row"><span>Seguidores</span><b>'+(d.followers||0)+'</b></div>' +
          '<a class="envivo__link" href="'+esc(d.html_url||"#")+'" target="_blank" rel="noopener">ver perfil &rarr;</a>';
      })
      .catch(function(e){
        var m = (e&&e.kind==="rate") ? "GitHub da guerra ahora (limite de la red compartida). En casa funciona." :
                (e&&e.kind==="404") ? "No encuentro ese perfil." : "GitHub no responde.";
        err("w-github", m);
      });
  }

  /* ---- 2. Cripto (CoinGecko, sin clave, EUR) ---- */
  function cripto(){
    var box = el("w-cripto"); if(!box) return;
    box.setAttribute("data-tit","Cripto");
    fetch("https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,ripple,binancecoin&vs_currencies=eur&include_24hr_change=true")
      .then(function(r){ if(!r.ok) throw new Error("net"); return r.json(); })
      .then(function(d){
        var orden=[["bitcoin","BTC"],["ethereum","ETH"],["ripple","XRP"],["binancecoin","BNB"]];
        var filas = orden.map(function(p){
          var m=d[p[1].toLowerCase()]; if(!m) return "";
          var ch=m.eur_24h_change||0; var cls=ch>=0?"envivo__up":"envivo__down"; var fle=ch>=0?"&#9650;":"&#9660;";
          return '<div class="envivo__row"><span>'+p[1]+'</span><span><b>'+Math.round(m.eur).toLocaleString("es-ES")+' &euro;</b> <span class="'+cls+'">'+fle+' '+Math.abs(ch).toFixed(1)+'%</span></span></div>';
        }).join("");
        box.innerHTML='<h4>Cripto</h4><div style="display:grid;gap:.3rem">'+filas+'</div>';
      })
      .catch(function(){ err("w-cripto","CoinGecko no responde ahora."); });
  }

  /* ---- 3. Futbol (TheSportsDB, La Liga id 4335, clave publica 3) ---- */
  function futbol(){
    var box = el("w-futbol"); if(!box) return;
    box.setAttribute("data-tit","Atleti");
    var y=new Date().getFullYear(); var mes=new Date().getMonth()+1;
    var temporada = (mes>=8) ? (y+"-"+(y+1)) : ((y-1)+"-"+y);
    fetch("https://www.thesportsdb.com/api/v1/json/3/eventsseason.php?id=4335&s="+temporada)
      .then(function(r){ if(!r.ok) throw new Error("net"); return r.json(); })
      .then(function(d){
        var ev=(d.events||[]).filter(function(e){return /atletico/i.test(e.strEvent||"");});
        if(!ev.length){ throw new Error("none"); }
        ev.sort(function(a,b){return (a.strTimestamp||"")<(b.strTimestamp||"")?-1:1;});
        var jugados=ev.filter(function(e){return e.intHomeScore!==null&&e.intHomeScore!==undefined&&e.intHomeScore!=="";});
        var ult=jugados[jugados.length-1];
        var prox=ev.filter(function(e){return e.intHomeScore===null||e.intHomeScore===undefined||e.intHomeScore==="";})[0];
        var html='<h4>Atleti</h4>';
        if(ult){
          html+='<div class="envivo__big">'+esc(ult.intHomeScore)+' &ndash; '+esc(ult.intAwayScore)+'</div>';
          html+='<div class="envivo__row"><span>'+esc(ult.strEvent)+'</span></div>';
        } else { html+='<div class="envivo__err">Sin resultados a&uacute;n esta temporada.</div>'; }
        if(prox){ html+='<div class="envivo__row" style="margin-top:.4rem"><span>Pr&oacute;ximo</span><b style="color:var(--color-acento)">'+esc(prox.strEvent)+'</b></div>'; }
        box.innerHTML=html;
      })
      .catch(function(){ err("w-futbol","No encuentro partidos del Atleti ahora mismo."); });
  }

  /* ---- 4. Tiempo Xativa (Open-Meteo, sin clave) ---- */
  function tiempo(){
    var box = el("f-tiempo"); if(!box) return;
    fetch("https://api.open-meteo.com/v1/forecast?latitude=38.9921&longitude=-0.5215&current=temperature_2m,weather_code&timezone=Europe/Madrid")
      .then(function(r){ if(!r.ok) throw new Error("net"); return r.json(); })
      .then(function(d){
        var t=Math.round(d.current.temperature_2m); var c=d.current.weather_code;
        box.innerHTML='X&agrave;tiva <b>'+t+'&deg;C</b> &middot; '+desc(c);
      })
      .catch(function(){ box.textContent='Tiempo no disponible.'; });
    function desc(c){
      if(c===0)return"despejado"; if(c<=2)return"poco nuboso"; if(c===3)return"nuboso";
      if(c===45||c===48)return"niebla"; if(c<60)return"llovizna"; if(c<70)return"lluvia";
      if(c<80)return"lluvia fuerte"; if(c<90)return"chubascos"; return"tormenta";
    }
  }

  /* ---- Reloj local con selector (NO es API: Intl del navegador) ---- */
  function reloj(){
    var r=el("f-reloj"), sel=el("f-zona"); if(!r) return;
    var zona=sel?sel.value:"Europe/Madrid";
    function tick(){
      try{
        r.textContent=new Intl.DateTimeFormat("es-ES",{timeZone:zona,hour:"2-digit",minute:"2-digit",second:"2-digit",hour12:false}).format(new Date());
      }catch(e){ r.textContent="--:--:--"; }
    }
    tick(); setInterval(tick,1000);
    if(sel) sel.addEventListener("change",function(){ zona=sel.value; tick(); });
  }

  /* ---- arranque + recargas ---- */
  function init(){
    github(); cripto(); futbol(); tiempo(); reloj();
    if(RELOAD_CRIPTO>0) setInterval(cripto,RELOAD_CRIPTO*1000);
    if(RELOAD_FUTBOL>0) setInterval(futbol,RELOAD_FUTBOL*1000);
    if(RELOAD_TIEMPO>0) setInterval(tiempo,RELOAD_TIEMPO*1000);
    // GitHub sin recarga por el limite; se puede descomentar y subir el numero si quieres
    // if(RELOAD_GITHUB>0) setInterval(github,RELOAD_GITHUB*1000);
  }
  if(document.readyState!=="loading") init(); else document.addEventListener("DOMContentLoaded",init);
})();