/* EF Chat — acceso gratuito, IA disponible únicamente con backend configurado */
(() => {
 if (document.querySelector('#ef-chat-launcher')) return;
 const API_URL = ""; // URL HTTPS del Worker tras despliegue y revisión de seguridad
 const css = `
 #ef-chat-launcher{position:fixed;right:22px;bottom:22px;width:62px;height:62px;border-radius:50%;background:#60453c;color:#fff;border:1px solid #c8a46a;box-shadow:0 12px 35px #392d2a38;z-index:9000;cursor:pointer;font:600 20px Georgia,serif;letter-spacing:.02em}
 #ef-chat-launcher:focus-visible,.ef-close:focus-visible,.ef-choice:focus-visible{outline:3px solid #c8a46a;outline-offset:3px}
 #ef-chat-panel{position:fixed;right:22px;bottom:96px;width:min(390px,calc(100vw - 30px));max-height:min(590px,calc(100dvh - 120px));display:none;flex-direction:column;background:#fffaf7;border:1px solid #e6d6cc;border-radius:22px;z-index:8999;box-shadow:0 26px 80px #392d2a30;color:#392d2a;font:14px/1.6 'DM Sans',Arial,sans-serif;overflow:hidden}
 #ef-chat-panel.ef-open{display:flex}
 .ef-head{padding:19px 21px;background:#f3e7e8;display:flex;align-items:center;justify-content:space-between;gap:12px}
 .ef-head strong{display:block;font:500 25px Georgia,serif}.ef-head small{display:block;color:#7e6961;font-size:11px}
 .ef-close{background:transparent;border:0;font-size:24px;cursor:pointer;color:#60453c}
 .ef-chat-body{padding:20px;overflow-y:auto}.ef-chat-body p{margin:0 0 17px}
 .ef-choice{display:block;width:100%;padding:13px 15px;margin:9px 0;background:#fff;border:1px solid #dcc8c2;border-radius:12px;text-align:left;color:#60453c;cursor:pointer;font:inherit}
 .ef-choice:hover{background:#f7ece9;border-color:#c8a46a}
 .ef-answer{margin-top:14px;padding:14px;background:#f8f4ef;border-radius:13px}
 .ef-answer a{color:#60453c;text-decoration:underline}
 .ef-form{padding:13px 20px;border-top:1px solid #e6d6cc;background:#fffaf7}.ef-form label{display:block;margin-bottom:8px;font-weight:600}.ef-form textarea{width:100%;box-sizing:border-box;resize:vertical;min-height:65px;border:1px solid #dcc8c2;border-radius:10px;padding:10px;font:inherit;background:#fff}.ef-form button{margin-top:8px;background:#60453c;color:white;border:0;padding:10px 16px;border-radius:9px;font:inherit;cursor:pointer}.ef-form button:disabled{opacity:.5;cursor:not-allowed}.ef-response{white-space:pre-wrap;margin-top:12px;max-height:160px;overflow:auto}.ef-sources a{display:block;text-decoration:underline;color:#60453c;overflow-wrap:anywhere}
 .ef-premium{padding:15px 20px;background:#f7eeed;border-top:1px solid #e6d6cc}
 .ef-premium strong{display:block;color:#60453c}.ef-premium p{margin:5px 0;font-size:12px;color:#7e6961}
 .ef-premium span{display:inline-block;margin-top:5px;font-size:11px;letter-spacing:.05em;color:#967d69}
 @media(max-width:600px){#ef-chat-launcher{right:14px;bottom:14px;width:56px;height:56px}#ef-chat-panel{right:10px;bottom:80px;width:calc(100vw - 20px);max-height:calc(100dvh - 105px)}}
 `;
 const style=document.createElement('style');style.textContent=css;document.head.appendChild(style);
 const panel=document.createElement('section');panel.id='ef-chat-panel';panel.setAttribute('role','dialog');panel.setAttribute('aria-label','EF Chat');
 panel.innerHTML=`<div class="ef-head"><div><strong>EF Chat</strong><small>Orientación dermoestética · Acceso libre</small></div><button type="button" class="ef-close" aria-label="Cerrar chat">×</button></div><div class="ef-chat-body"><p>Hola, soy EF. Puedo ayudarte a encontrar información sobre Enfederma.</p><div id="ef-choices"></div><div id="ef-answer" class="ef-answer" aria-live="polite" hidden></div></div><form class="ef-form" id="ef-science-form"><label for="ef-science-question">EF Skin Science · Consulta científica gratuita</label><textarea id="ef-science-question" maxlength="1500" placeholder="Pregunta por ingredientes, protección solar o cuidados de la piel…" required></textarea><button type="submit" id="ef-science-submit">Consultar bibliografía y responder</button><div class="ef-response" id="ef-science-response" role="status" aria-live="polite"></div><div class="ef-sources" id="ef-science-sources"></div></form>`;
 const launcher=document.createElement('button');launcher.id='ef-chat-launcher';launcher.type='button';launcher.textContent='EF';launcher.setAttribute('aria-label','Abrir EF Chat');launcher.setAttribute('aria-expanded','false');launcher.setAttribute('aria-controls','ef-chat-panel');
 document.body.append(panel,launcher);
 const close=()=>{panel.classList.remove('ef-open');launcher.setAttribute('aria-expanded','false');launcher.focus()};
 launcher.addEventListener('click',()=>{let opening=!panel.classList.contains('ef-open');panel.classList.toggle('ef-open',opening);launcher.setAttribute('aria-expanded',String(opening));if(opening)panel.querySelector('.ef-close').focus()});
 panel.querySelector('.ef-close').addEventListener('click',close);
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&panel.classList.contains('ef-open'))close()});
 const qa=[
 ['¿Qué es Enfederma?', 'Enfederma es una web de divulgación y orientación dermoestética desde la perspectiva de enfermería. El contenido informativo requiere revisión por su profesional responsable. <a href="index.html#filosofia">Conoce nuestra filosofía</a>.'],
 ['¿Qué servicios hay?', 'Puedes conocer la <a href="valoracion-piel.html">valoración de la piel</a>, el <a href="cuidado-dermoestetico.html">cuidado dermoestético</a> y el <a href="acompanamiento.html">acompañamiento</a>. Los servicios finales dependerán de las competencias profesionales.'],
 ['¿Qué es SKIN ID?', 'Es un cuestionario educativo de orientación sobre hábitos y necesidades cutáneas. No ofrece diagnósticos. <a href="skin-id.html">Abrir SKIN ID</a>.'],
 ['¿Dónde puedo leer artículos?', 'En <a href="dermoblog.html">Dermoblog</a> encontrarás contenidos divulgativos y referencias médicas; algunas publicaciones están pendientes de revisión clínica final.'],
 ['¿Cómo contacto?', 'Visita el <a href="index.html#contacto">apartado de contacto</a>. Los datos de contacto definitivos aún deben configurarse.']
 ];
 const choices=panel.querySelector('#ef-choices'),answer=panel.querySelector('#ef-answer');
 const form=panel.querySelector('#ef-science-form');
 const submit=panel.querySelector('#ef-science-submit');
 const result=panel.querySelector('#ef-science-response');
 const sources=panel.querySelector('#ef-science-sources');
 if(!API_URL){submit.disabled=true;result.textContent='La consulta científica aún requiere conectar el servidor seguro. Mientras tanto puedes usar las respuestas sobre Enfederma.';}
 form.addEventListener('submit',async e=>{
   e.preventDefault(); if(!API_URL)return;
   submit.disabled=true; result.textContent='Consultando bibliografía científica…'; sources.replaceChildren();
   try{
     const res=await fetch(API_URL,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({question:form.querySelector('textarea').value.trim()})});
     const data=await res.json(); if(!res.ok||typeof data.answer!=='string')throw Error('No se pudo completar la consulta');
     result.textContent=data.answer;
     for(const citation of (Array.isArray(data.citations)?data.citations:[]).slice(0,8)){
       if(typeof citation.url!=='string')continue;
       try{const url=new URL(citation.url);if(url.protocol!=='https:')continue;
       const link=document.createElement('a');link.href=url.href;link.rel='noopener noreferrer';link.target='_blank';link.textContent=citation.title||url.hostname;sources.append(link)}catch{}
     }
   }catch{result.textContent='El servicio científico no está disponible en este momento. Inténtalo más tarde.'}
   finally{submit.disabled=false}
 });
 qa.forEach(([q,a])=>{const btn=document.createElement('button');btn.className='ef-choice';btn.type='button';btn.textContent=q;btn.addEventListener('click',()=>{answer.innerHTML=a;answer.hidden=false});choices.appendChild(btn)});
})();
