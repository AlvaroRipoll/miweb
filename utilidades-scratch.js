/* ==========================================================================
   UTILIDADES-SCRATCH.JS  (100% ASCII, IIFE propio)
   Scratch didactico: bloques -> tortuga + codigo Python/Java/C++
   ========================================================================== */
(function(){
  'use strict';
  function byId(id){ return document.getElementById(id); }
  var rootUl=byId('sg-script-ul'), canvas=byId('sg-canvas'),
      code=byId('sg-code'), st=byId('sg-status'), langSel=byId('sg-lang'), speed=byId('sg-speed');
  if(!rootUl||!canvas||!langSel||!speed||!code||!st){ return; }
  var ctx=canvas.getContext('2d'); if(!ctx){ return; }

  var CAT={mover:'mov',girar:'mov',penDown:'pen',penUp:'pen',color:'pen',limpiar:'pen',
           repeat:'ctl',forever:'ctl',if:'ctl',setVar:'var',changeVar:'var'};
  var tort={x:canvas.width/2, y:canvas.height/2, ang:-90, pen:true, color:'#B9502F'};
  var timer=null, stopped=false;

  function val(li){ var el=li.querySelector('input[type=number]'); return el?parseFloat(el.value)||0:0; }
  function varName(li){ var el=li.querySelector('.sg-var'); return el?el.value.trim():'x'; }

  function makeBlock(type){
    var li=document.createElement('li');
    li.className='sg-block sg-c-'+CAT[type]+(type==='repeat'||type==='forever'||type==='if'?' sg-ctl':'');
    li.dataset.type=type;
    var lab=document.createElement('span'); lab.className='sg-label';
    if(type==='mover') lab.innerHTML='Mover <input type="number" value="10" min="-300" max="300"> pasos';
    else if(type==='girar') lab.innerHTML='Girar <input type="number" value="90"> grados';
    else if(type==='penDown') lab.innerHTML='Bajar lapiz';
    else if(type==='penUp') lab.innerHTML='Subir lapiz';
    else if(type==='color') lab.innerHTML='Color <select class="sg-color"><option>#B9502F</option><option>#2B4C7E</option><option>#2f7d5b</option><option>#8a5cf0</option><option>#1E1B16</option></select>';
    else if(type==='limpiar') lab.innerHTML='Limpiar';
    else if(type==='setVar') lab.innerHTML='Asignar <input class="sg-var" value="x"> = <input type="number" value="0">';
    else if(type==='changeVar') lab.innerHTML='Cambiar <input class="sg-var" value="x"> por <input type="number" value="1">';
    else if(type==='repeat') lab.innerHTML='Repetir <input type="number" value="4" min="1" max="120"> veces';
    else if(type==='forever') lab.innerHTML='Por siempre';
    else if(type==='if') lab.innerHTML='Si <input class="sg-var" value="x"> <select><option>&gt;</option><option>&lt;</option><option>==</option><option>&gt;=</option><option>&lt;=</option><option>!=</option></select> <input type="number" value="0">';
    li.appendChild(lab);
    if(type==='repeat'||type==='forever'||type==='if'){ var u=document.createElement('ul'); u.className='sg-drop'; li.appendChild(u); }
    var acts=document.createElement('span'); acts.className='sg-acts';
    acts.innerHTML='<button title="Subir">^</button><button title="Bajar">v</button><button title="Quitar">x</button>';
    var b=acts.querySelectorAll('button');
    b[0].onclick=function(){ var p=li.previousElementSibling; if(p){ li.parentNode.insertBefore(li,p); } };
    b[1].onclick=function(){ var n=li.nextElementSibling; if(n){ li.parentNode.insertBefore(n,li); } };
    b[2].onclick=function(){ li.parentNode.removeChild(li); refresh(); };
    li.appendChild(acts);
    li.querySelectorAll('input,select').forEach(function(el){ el.addEventListener('input',refresh); });
    return li;
  }

  function addBlock(type, parent){
    var li=makeBlock(type);
    (parent||rootUl).appendChild(li);
    refresh();
  }

  /* paleta: click + drag */
  document.querySelectorAll('.sg-pblock').forEach(function(pb){
    pb.addEventListener('click', function(){ addBlock(pb.dataset.type); });
    pb.addEventListener('dragstart', function(e){ e.dataTransfer.setData('text/plain', pb.dataset.type); e.dataTransfer.effectAllowed='copy'; });
  });
  function bindDrop(ul){
    ul.addEventListener('dragover', function(e){ e.preventDefault(); ul.classList.add('drag-over'); });
    ul.addEventListener('dragleave', function(){ ul.classList.remove('drag-over'); });
    ul.addEventListener('drop', function(e){
      e.preventDefault(); e.stopPropagation(); ul.classList.remove('drag-over');
      var t=e.dataTransfer.getData('text/plain'); if(t){ addBlock(t, ul); }
    });
  }
  bindDrop(rootUl);
  rootUl.addEventListener('click', function(e){
    var d=e.target.closest('.sg-ctl .sg-drop');
    if(d && !d._bound){ d._bound=true; bindDrop(d); }
  });

  function condOk(li, vars){
    var name=varName(li);
    var op=li.querySelector('select').textContent;
    var r=val(li);
    var l=(vars[name]||0);
    if(op==='>') return l>r;
    if(op==='<') return l<r;
    if(op==='==') return l===r;
    if(op==='>=') return l>=r;
    if(op==='<=') return l<=r;
    if(op==='!=') return l!==r;
    return false;
  }

  function build(ul, q, vars){
    if(q.length>6000){ return true; }
    for(var i=0;i<ul.children.length;i++){
      var li=ul.children[i], t=li.dataset.type;
      if(t==='mover') q.push({o:'m', n:val(li)});
      else if(t==='girar') q.push({o:'t', g:val(li)});
      else if(t==='penDown') q.push({o:'pd'});
      else if(t==='penUp') q.push({o:'pu'});
      else if(t==='color') q.push({o:'c', c:li.querySelector('.sg-color').value});
      else if(t==='limpiar') q.push({o:'cl'});
      else if(t==='setVar') vars[varName(li)]=val(li);
      else if(t==='changeVar') vars[varName(li)]=(vars[varName(li)]||0)+val(li);
      else if(t==='repeat'){ var n=Math.max(1,Math.min(120,val(li))); for(var k=0;k<n;k++){ if(build(li.querySelector('.sg-drop'),q,vars)) return true; } }
      else if(t==='forever'){ for(var k=0;k<120;k++){ if(build(li.querySelector('.sg-drop'),q,vars)) return true; } }
      else if(t==='if'){ if(condOk(li,vars)){ if(build(li.querySelector('.sg-drop'),q,vars)) return true; } }
    }
    return false;
  }

  function reset(){ tort.x=canvas.width/2; tort.y=canvas.height/2; tort.ang=-90; tort.pen=true; tort.color='#B9502F'; ctx.clearRect(0,0,canvas.width,canvas.height); }
  function apply(a){
    if(a.o==='m'){
      var nx=tort.x+Math.cos(tort.ang*Math.PI/180)*a.n;
      var ny=tort.y+Math.sin(tort.ang*Math.PI/180)*a.n;
      if(tort.pen){ ctx.strokeStyle=tort.color; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(tort.x,tort.y); ctx.lineTo(nx,ny); ctx.stroke(); }
      tort.x=nx; tort.y=ny;
    }
    else if(a.o==='t'){ tort.ang+=a.g; }
    else if(a.o==='pd'){ tort.pen=true; }
    else if(a.o==='pu'){ tort.pen=false; }
    else if(a.o==='c'){ tort.color=a.c; }
    else if(a.o==='cl'){ ctx.clearRect(0,0,canvas.width,canvas.height); }
    drawTortuga();
  }
  function drawTortuga(){
    ctx.save(); ctx.translate(tort.x,tort.y); ctx.rotate((tort.ang+90)*Math.PI/180);
    ctx.fillStyle=tort.color; ctx.beginPath(); ctx.moveTo(0,-10); ctx.lineTo(7,8); ctx.lineTo(-7,8); ctx.closePath(); ctx.fill(); ctx.restore();
  }
  function play(q){
    stopped=false; var i=0;
    (function step(){
      if(stopped || i>=q.length){ st.textContent = i>=q.length ? 'Hecho OK' : 'Parado'; return; }
      apply(q[i++]);
      timer=setTimeout(step, 1000/(+speed.value||25));
    })();
  }
  function run(){
    if(timer){ clearTimeout(timer); }
    reset();
    var q=[], vars={};
    var over=build(rootUl,q,vars);
    if(over){ st.textContent='Guion demasiado grande (bucles).'; return; }
    if(!q.length){ st.textContent='Sin bloques de dibujo.'; return; }
    st.textContent='Ejecutando...'; play(q);
  }

  function gen(ul, lang, depth, decl){
    var pad='', out=[], i;
    for(i=0;i<depth;i++){ pad+='    '; }
    function push(s){ out.push(pad+s); }
    for(i=0;i<ul.children.length;i++){
      var li=ul.children[i], t=li.dataset.type, n, kid=li.querySelector('.sg-drop'), c;
      var semi=(lang==='py')?'':';';
      if(t==='mover') push('mover('+val(li)+')'+semi);
      else if(t==='girar') push('girar('+val(li)+')'+semi);
      else if(t==='penDown') push('bajar()'+semi);
      else if(t==='penUp') push('subir()'+semi);
      else if(t==='color') push('color("'+li.querySelector('.sg-color').value+'")'+semi);
      else if(t==='limpiar') push('limpiar()'+semi);
      else if(t==='setVar'){
        n=varName(li);
        if(lang==='py'){ push(n+' = '+val(li)); }
        else { var d=decl.has(n)?'':'int '; decl.add(n); push(d+n+' = '+val(li)+';'); }
      }
      else if(t==='changeVar') push(varName(li)+' += '+val(li)+semi);
      else if(t==='repeat'){
        n=Math.max(1,val(li));
        if(lang==='py'){ push('for i in range('+n+'):'); out=out.concat(gen(kid,lang,depth+1,decl)); }
        else { push('for (int i = 0; i < '+n+'; i++) {'); out=out.concat(gen(kid,lang,depth+1,decl)); push('}'); }
      }
      else if(t==='forever'){
        if(lang==='py'){ push('while True:'); out=out.concat(gen(kid,lang,depth+1,decl)); }
        else { push('while (true) {'); out=out.concat(gen(kid,lang,depth+1,decl)); push('}'); }
      }
      else if(t==='if'){
        c=varName(li)+' '+li.querySelector('select').textContent+' '+val(li);
        if(lang==='py'){ push('if '+c+':'); out=out.concat(gen(kid,lang,depth+1,decl)); }
        else { push('if ('+c+') {'); out=out.concat(gen(kid,lang,depth+1,decl)); push('}'); }
      }
    }
    return out;
  }
  function header(lang){
    if(lang==='py') return ['import turtle','t = turtle.Turtle()','def mover(n): t.forward(n)','def girar(g): t.left(g)','def subir(): t.penup()','def bajar(): t.pendown()','def color(c): t.color(c)','def limpiar(): t.clear()','','# --- programa ---'];
    if(lang==='java') return ['// Esqueleto en Java (tortuga ficticia para ver la sintaxis)','class Tortuga {','    static void mover(int n){} static void girar(int g){}','    static void subir(){} static void bajar(){} static void limpiar(){}','    static void color(String c){}','    public static void main(String[] a){'];
    return ['// Esqueleto en C++ (tortuga ficticia para ver la sintaxis)','#include <iostream>','void mover(int n){} void girar(int g){}','void subir(){} void bajar(){} void limpiar(){} void color(const char*c){}','int main(){'];
  }
  function footer(lang){ return lang==='py'?['','turtle.done()']:['    }','}']; }
  function refresh(){
    var lang=langSel.value;
    var body=gen(rootUl, lang, (lang==='py'?0:1), new Set());
    code.textContent = header(lang).concat(body, footer(lang)).join('\n');
  }

  function ejemplo(){
    rootUl.innerHTML='';
    var r=makeBlock('repeat'); r.querySelector('input').value=4; var d=r.querySelector('.sg-drop');
    var m=makeBlock('mover'); m.querySelector('input').value=70; d.appendChild(m);
    var g=makeBlock('girar'); g.querySelector('input').value=90; d.appendChild(g);
    rootUl.appendChild(r); refresh();
  }

  byId('sg-run').onclick=run;
  byId('sg-stop').onclick=function(){ stopped=true; if(timer){ clearTimeout(timer); } st.textContent='Parado'; };
  byId('sg-clear').onclick=function(){ rootUl.innerHTML=''; reset(); refresh(); };
  byId('sg-ex').onclick=ejemplo;
  langSel.onchange=refresh;

  reset(); refresh(); drawTortuga();
})();