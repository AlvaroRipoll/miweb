/* ==========================================================================
   FOOTER.JS  (100% ASCII, IIFE propio)
   - Formulario de contacto: valida y envia por ntfy.sh a tu movil
   - Modal del curriculum: abrir/cerrar accesible (boton, overlay, Escape)
   ========================================================================== */
(function(){
  'use strict';

  /* --- Config ntfy (mismo topic que el chatbot, o el que quieras) --- */
  var NTFY_ON    = true;
  var NTFY_TOPIC = 'alvarowebprogramacion2848462';   // <-- tu topic
  var NTFY_URL   = 'https://ntfy.sh/' + NTFY_TOPIC;

  function byId(id){ return document.getElementById(id); }
  var form=byId('contact-form'), nameI=byId('cf-name'), mailI=byId('cf-email'),
      msgI=byId('cf-msg'), hpI=byId('cf-site'), status=byId('cf-status');

  function set(msg,ok){ if(status){ status.textContent=msg; status.className='contact-status'+(ok?'':' is-err'); } }
  function emailOk(v){ return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v); }

  var bloqueado=false;
  if(form){
    form.addEventListener('submit', function(e){
      e.preventDefault();
      if(bloqueado) return;
      if(hpI && hpI.value){ return; }                       // honeypot: bot, fuera
      var nombre=(nameI.value||'').trim(), correo=(mailI.value||'').trim(), mensaje=(msgI.value||'').trim();
      if(!nombre){ set('Pon tu nombre.', false); nameI.focus(); return; }
      if(!emailOk(correo)){ set('Correo no valido.', false); mailI.focus(); return; }
      bloqueado=true; set('Enviando...', true);
      var cuerpo = nombre + ' <' + correo + '>' + (mensaje ? '\n' + mensaje : '');
      fetch(NTFY_URL, { method:'POST', headers:{ 'Title':'Nuevo mensaje de contacto', 'Tags':'email' }, body: cuerpo })
        .then(function(r){
          if(!r.ok) throw new Error('HTTP '+r.status);
          form.reset(); set('Enviado. Te respondo pronto.', true);
          setTimeout(function(){ bloqueado=false; }, 4000);
        })
        .catch(function(err){ console.error(err); set('No se pudo enviar. Prueba con el correo directo.', false); bloqueado=false; });
    });
  }

  /* --- Modal del CV --- */
  var openBtn=byId('cv-open'), modal=byId('cv-modal'), closeBtn=byId('cv-close'), ultimoFoco=null;
  function abrirModal(){
    if(!modal) return;
    ultimoFoco=document.activeElement;
    modal.classList.add('is-open'); modal.setAttribute('aria-hidden','false');
    document.body.style.overflow='hidden';
    if(closeBtn) closeBtn.focus();
  }
  function cerrarModal(){
    if(!modal) return;
    modal.classList.remove('is-open'); modal.setAttribute('aria-hidden','true');
    document.body.style.overflow='';
    if(ultimoFoco && ultimoFoco.focus) ultimoFoco.focus();
  }
  if(openBtn) openBtn.addEventListener('click', abrirModal);
  if(closeBtn) closeBtn.addEventListener('click', cerrarModal);
  if(modal) modal.addEventListener('click', function(e){ if(e.target===modal) cerrarModal(); });
  document.addEventListener('keydown', function(e){ if(e.key==='Escape' && modal && modal.classList.contains('is-open')) cerrarModal(); });

  /* --- Anio del footer --- */
  var anio=byId('anio'); if(anio) anio.textContent=new Date().getFullYear();
})();