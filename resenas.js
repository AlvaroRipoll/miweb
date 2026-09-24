/* ==========================================================================
   RESENAS.JS  (100% ASCII, IIFE propio) - resenas COMPARTIDAS via Supabase
   - Carga todas las resenas (GET), calcula media + barras reales
   - Formulario: hover rellena todas las anteriores, click -> particulas
   - Inserta en Supabase (POST) con un cliente_id anonimo (uuid) para poder borrar las propias
   ========================================================================== */
(function(){
  'use strict';

  /* ---- CONFIG SUPABASE (pega tus valores) ---- */
  var SUPABASE_URL = 'https://tbzfvzvpmxerluoyuwto.supabase.co';   // <-- Project URL
  var SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRiemZ2enZwbXhlcmx1b3l1d3RvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAyNTU5OTcsImV4cCI6MjEwNTgzMTk5N30.iVrPMcsDOIk7VGQs6i_tMdS_UKupWiESdby8WhqUDb8';                  // <-- anon public key
  var TABLE = 'resenas';
  /* -------------------------------------------- */

  function byId(id){ return document.getElementById(id); }
  var REST = SUPABASE_URL + '/rest/v1/' + TABLE;
  var HEADERS = { 'apikey':SUPABASE_KEY, 'Authorization':'Bearer '+SUPABASE_KEY, 'Content-Type':'application/json' };
  var CKEY = 'rev-cliente';

  var mediaEl=byId('rev-media'), totalEl=byId('rev-total'), barsEl=byId('rev-bars');
  var grid=byId('rev-grid'), rateEl=byId('rev-rate-stars');
  var form=byId('rev-form'), nameIn=byId('rev-name'), textIn=byId('rev-text');
  var statusEl=byId('rev-status'), clearBtn=byId('rev-mine-clear');
  var summary=document.querySelector('.rev-summary');
  var PAL=['#B9502F','#2B4C7E','#2f7d5b','#8a5cf0','#c2410c'];

  /* --- id anonimo estable para este visitante --- */
  function clienteId(){
    var v=null; try{ v=localStorage.getItem(CKEY); }catch(_){}
    if(!v){ v=(self.crypto&&crypto.randomUUID)?crypto.randomUUID():('c'+Date.now()+Math.random().toString(16).slice(2)); try{localStorage.setItem(CKEY,v);}catch(_){} }
    return v;
  }

  /* --- estrellas de display (relleno parcial por ancho) --- */
  function starEl(rating){
    var span=document.createElement('span'); span.className='rev-stars rev-stars--sm';
    var fill=document.createElement('span'); fill.className='rev-stars__fill';
    fill.style.width=(rating/5*100)+'%'; span.appendChild(fill); return span;
  }

  /* --- resumen (media + barras) sobre TODAS las resenas --- */
  function resumen(lista){
    var c={1:0,2:0,3:0,4:0,5:0}, t=0, sum=0, i;
    for(i=0;i<lista.length;i++){ c[lista[i].valoracion]++; }
    for(i=1;i<=5;i++){ t+=c[i]; sum+=c[i]*i; }
    if(mediaEl) mediaEl.textContent = t? (sum/t).toFixed(1) : '-';
    if(totalEl) totalEl.textContent = t + (t===1?' resena':' resenas');
    if(barsEl){
      barsEl.innerHTML='';
      for(var k=5;k>=1;k--){
        var pct=t?(c[k]/t*100):0;
        var row=document.createElement('div'); row.className='rev-bar';
        row.innerHTML='<span>'+k+'&#9733;</span><span class="rev-bar__track"><span class="rev-bar__fill" style="--pct:'+pct.toFixed(1)+'%"></span></span><span>'+c[k]+'</span>';
        barsEl.appendChild(row);
      }
    }
    if(summary && !summary.classList.contains('is-visible')) summary.classList.add('is-visible');
  }

  /* --- tarjeta de resena (texto seguro via textContent) --- */
  function colorDe(s){ var h=0,i; for(i=0;i<s.length;i++)h=(h*31+s.charCodeAt(i))>>>0; return PAL[h%PAL.length]; }
  function fecha(txt){ try{ var d=new Date(txt); return d.getDate()+'/'+(d.getMonth()+1)+'/'+d.getFullYear(); }catch(_){ return ''; } }
  function tarjeta(r){
    var art=document.createElement('article');
    art.className='rev-card'+(r.destacada?' rev-card--feature':'');
    var fig=document.createElement('figure'); fig.className='rev-card__avatar';
    if(r.foto){ var img=document.createElement('img'); img.src=r.foto; img.alt=r.nombre; img.loading='lazy'; img.width=160; img.height=160; fig.appendChild(img); }
    else { fig.classList.add('rev-card__avatar--ini'); fig.style.background=colorDe(r.nombre||'?'); fig.textContent=(r.nombre||'?').trim().charAt(0).toUpperCase(); fig.setAttribute('aria-hidden','true'); }
    var body=document.createElement('div'); body.className='rev-card__body';
    body.appendChild(starEl(r.valoracion));
    var bq=document.createElement('blockquote'); bq.textContent=r.texto; body.appendChild(bq);
    var ft=document.createElement('footer');
    var st=document.createElement('strong'); st.textContent=r.nombre; ft.appendChild(st);
    var sp=document.createElement('span'); sp.textContent=fecha(r.creado_en); ft.appendChild(sp);
    body.appendChild(ft);
    art.appendChild(fig); art.appendChild(body);
    return art;
  }

  /* --- pintar todo el grid --- */
  function pintar(lista){
    if(!grid) return;
    grid.innerHTML='';
    if(!lista.length){ var p=document.createElement('p'); p.className='rev-empty'; p.textContent='Sin resenas todavia. Se el primero.'; grid.appendChild(p); return; }
    lista.forEach(function(r){ grid.appendChild(tarjeta(r)); });
  }

  /* --- cargar desde Supabase --- */
  function cargar(){
    fetch(REST+'?select=*&order=destacada.desc,creado_en.desc',{headers:HEADERS})
      .then(function(r){ if(!r.ok) throw new Error('HTTP '+r.status); return r.json(); })
      .then(function(data){ pintar(data); resumen(data); })
      .catch(function(e){ console.error(e); if(grid){ grid.innerHTML='<p class="rev-empty">No se pudieron cargar las resenas. Revisa la URL/clave de Supabase.</p>'; } });
  }

  /* --- formulario: estrellas interactivas (hover rellena todas las anteriores) --- */
  var saved=0, hover=0;
  function paint(){
    var s=rateEl?rateEl.querySelectorAll('.rev-star'):[];
    for(var i=0;i<s.length;i++){ var n=i+1;
      s[i].classList.toggle('is-on', n<=saved);
      s[i].classList.toggle('is-hover', hover? n<=hover : false);
      s[i].setAttribute('aria-checked', String(n===saved));
    }
  }
  function burst(btn){
    for(var i=0;i<12;i++){ var p=document.createElement('span'); p.className='rev-burst';
      var ang=Math.random()*Math.PI*2, dist=24+Math.random()*26;
      p.style.setProperty('--bx',(Math.cos(ang)*dist).toFixed(1)+'px');
      p.style.setProperty('--by',(Math.sin(ang)*dist).toFixed(1)+'px');
      btn.appendChild(p);
      (function(node){ setTimeout(function(){ if(node.parentNode) node.parentNode.removeChild(node); },700); })(p);
    }
  }
  if(rateEl){
    for(var i=1;i<=5;i++){
      var b=document.createElement('button'); b.type='button'; b.className='rev-star'; b.dataset.v=i;
      b.setAttribute('role','radio'); b.setAttribute('aria-label',i+' de 5'); b.textContent='\u2605';
      b.addEventListener('mouseenter',function(e){ hover=+e.currentTarget.dataset.v; paint(); });
      b.addEventListener('focus',function(e){ hover=+e.currentTarget.dataset.v; paint(); });
      b.addEventListener('click',function(e){ saved=+e.currentTarget.dataset.v; hover=0; paint(); burst(e.currentTarget); });
      rateEl.appendChild(b);
    }
    rateEl.addEventListener('mouseleave',function(){ hover=0; paint(); });
    rateEl.addEventListener('blur',function(){ hover=0; paint(); },true);
    paint();
  }

  function avisar(msg,err){ if(statusEl){ statusEl.textContent=msg; statusEl.className='rev-form__status'+(err?' is-err':''); } }
  var bloqueado=false;

  /* --- enviar resena (POST a Supabase) --- */
  if(form){
    form.addEventListener('submit',function(e){
      e.preventDefault();
      if(bloqueado) return;
      if(!saved){ avisar('Elige estrellas primero.',true); return; }
      var nombre=(nameIn.value||'').trim(), texto=(textIn.value||'').trim();
      if(!texto){ avisar('Escribe un comentario.',true); return; }
      bloqueado=true; avisar('Enviando...',false);
      fetch(REST,{ method:'POST', headers:Object.assign({'Prefer':'return=minimal'},HEADERS),
        body:JSON.stringify({ nombre:nombre||'Anonimo', texto:texto, valoracion:saved, foto:null, destacada:false, cliente_id:clienteId() }) })
      .then(function(r){ if(!r.ok) throw new Error('HTTP '+r.status); return r; })
      .then(function(){
        nameIn.value=''; textIn.value=''; saved=0; paint();
        avisar('Resena enviada. Gracias.',false);
        cargar();                       // recargo para verla junto a las demas
        setTimeout(function(){ bloqueado=false; },3000);   // cooldown anti-spam
      })
      .catch(function(err){ console.error(err); avisar('No se pudo enviar.',true); bloqueado=false; });
    });
  }

  /* --- borrar las mias (DELETE por cliente_id) --- */
  if(clearBtn){
    clearBtn.addEventListener('click',function(){
      if(bloqueado) return; bloqueado=true; avisar('Borrando las tuyas...',false);
      fetch(REST+'?cliente_id=eq.'+encodeURIComponent(clienteId()),{ method:'DELETE', headers:HEADERS })
        .then(function(r){ if(!r.ok) throw new Error('HTTP '+r.status); })
        .then(function(){ avisar('Resenas propias borradas.',false); cargar(); setTimeout(function(){ bloqueado=false; },1500); })
        .catch(function(err){ console.error(err); avisar('No se pudo borrar.',true); bloqueado=false; });
    });
  }

  /* --- arranque con skeleton --- */
  if(grid && !grid.querySelector('.rev-empty')){ grid.innerHTML='<div class="rev-skeleton"></div><div class="rev-skeleton"></div>'; }
  cargar();
})();