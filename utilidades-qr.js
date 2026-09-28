/* ==========================================================================
   UTILIDADES-QR.JS  (100% ASCII, IIFE propio)
   Generador de QR (enlaces/texto) con libreria 'qrcode' cargada bajo demanda.
   Descarga PNG y copia al portapapeles. Todo local, sin servidor.
   ========================================================================== */
(function(){
  'use strict';
  function byId(id){ return document.getElementById(id); }
  var ta=byId('qr-text'), dark=byId('qr-dark'), light=byId('qr-light'),
      run=byId('qr-run'), dl=byId('qr-dl'), copy=byId('qr-copy'),
      canvas=byId('qr-canvas'), st=byId('qr-status');
  if(!ta||!run||!canvas||!st) return;                 // guardas: si falta el HTML, no rompe
  var QR=null;

  function estado(msg,ok){ st.textContent=msg; st.className='u-status'+(ok?' is-ok':''); }

  /* Carga la libreria la primera vez (cacheada por el navegador). */
  function lib(){
    if(QR) return Promise.resolve(QR);
    estado('Cargando libreria QR...', false);
    return import('https://esm.sh/qrcode@1.5.3')
      .then(function(m){ QR=m.default||m; return QR; });
  }

  function generar(){
    var txt=ta.value.trim();
    if(!txt){ estado('Escribe un enlace o texto.', false); return; }
    lib().then(function(Q){
      return Q.toCanvas(canvas, txt, {
        width:512, margin:2, errorCorrectionLevel:'M',
        color:{ dark:hexA(dark.value), light:hexA(light.value) }
      });
    }).then(function(){
      dl.disabled=false; copy.disabled=false;
      estado('QR generado. Descargalo o copialo.', true);
    }).catch(function(e){ console.error(e); estado('No se pudo generar.', false); });
  }
  function hexA(h){ return (h||'#000').trim()+'ff'; }  /* color picker -> hex con alfa */

  function descargar(){
    try{
      var url=canvas.toDataURL('image/png');
      var a=document.createElement('a');
      a.href=url; a.download='qr.png';
      document.body.appendChild(a); a.click(); a.remove();
      estado('Descargado qr.png', true);
    }catch(e){ estado('No se pudo descargar.', false); }
  }
  function copiar(){
    if(!(navigator.clipboard && window.ClipboardItem)){ descargar(); return; }
    canvas.toBlob(function(blob){
      if(!blob){ estado('No se pudo copiar.', false); return; }
      navigator.clipboard.write([ new ClipboardItem({ 'image/png':blob }) ])
        .then(function(){ estado('Imagen copiada al portapapeles.', true); })
        .catch(function(){ estado('Copia no permitida; descarga en su lugar.', false); descargar(); });
    }, 'image/png');
  }

  run.addEventListener('click', generar);
  dark.addEventListener('input', function(){ if(!dl.disabled) generar(); });
  light.addEventListener('input', function(){ if(!dl.disabled) generar(); });
  dl.addEventListener('click', descargar);
  copy.addEventListener('click', copiar);
})();