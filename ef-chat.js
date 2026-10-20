/* EF · Un único chat conversacional. Servicio externo claramente identificado. */
(() => {
  if(document.getElementById('ef-chat-launcher')) return;
  const css=`
  #ef-chat-launcher{position:fixed;bottom:20px;right:20px;z-index:9001;width:62px;height:62px;border-radius:50%;border:1px solid #c8a46a;background:#60453c;color:white;box-shadow:0 15px 36px #392d2a35;font:600 21px Georgia,serif;cursor:pointer}
  #ef-chat-panel{position:fixed;bottom:96px;right:20px;z-index:9000;display:none;flex-direction:column;width:min(440px,calc(100vw - 24px));height:min(670px,calc(100dvh - 118px));background:#fffaf7;border:1px solid #decfc5;border-radius:22px;overflow:hidden;box-shadow:0 25px 70px #392d2a32;color:#392d2a;font:14px/1.5 'DM Sans',Arial,sans-serif}
  #ef-chat-panel.open{display:flex}
  .ef-header{flex-shrink:0;display:flex;align-items:center;justify-content:space-between;gap:10px;padding:16px 19px;background:#f3e7e8}
  .ef-header strong{font:500 26px Georgia,serif;color:#60453c}.ef-header small{display:block;color:#7e6961;font-size:11px}
  .ef-close{color:#60453c;background:transparent;border:0;font-size:25px;cursor:pointer}
  .ef-intro{padding:13px 17px;font-size:12px;color:#665650;background:#fffaf7;border-bottom:1px solid #eaded5}
  .ef-intro p{margin:0 0 7px}.ef-intro a{color:#60453c;text-decoration:underline}
  .ef-chat-main{flex:1;min-height:0;display:flex;flex-direction:column}
  .ef-consent{padding:22px;display:flex;flex-direction:column;justify-content:center;align-items:flex-start;gap:12px;flex:1}
  .ef-consent p{margin:0}.ef-consent button{border:0;border-radius:10px;padding:12px 18px;background:#60453c;color:#fff;font:inherit;cursor:pointer}
  .ef-chat-main iframe{border:0;width:100%;height:100%;min-height:0;background:#fff;flex:1}
  .ef-fallback{font-size:12px;padding:9px 15px;background:#f8f4ef}.ef-fallback a{color:#60453c;text-decoration:underline}
  #ef-chat-launcher:focus-visible,.ef-close:focus-visible,.ef-consent button:focus-visible{outline:3px solid #c8a46a;outline-offset:3px}
  @media(max-width:600px){#ef-chat-launcher{right:13px;bottom:13px;width:56px;height:56px}#ef-chat-panel{right:8px;bottom:79px;width:calc(100vw - 16px);height:calc(100dvh - 99px);border-radius:18px}}
  `;
  const style=document.createElement('style');style.textContent=css;document.head.append(style);
  const panel=document.createElement('section');
  panel.id='ef-chat-panel';panel.setAttribute('role','dialog');panel.setAttribute('aria-label','EF Chat');
  panel.innerHTML=`<div class="ef-header"><div><strong>EF Chat</strong><small>Tu espacio para conversar · Acceso gratuito</small></div><button type="button" class="ef-close" aria-label="Cerrar chat">×</button></div><div class="ef-intro"><p><strong>Pregunta con tus propias palabras.</strong> Sobre Enfederma, cosmética o cuidado de la piel, sin cuestionarios.</p><p>La IA es un servicio externo general, no una enfermera ni una herramienta clínica validada. Puede equivocarse y no garantiza bibliografía médica. <a href="dermoblog.html">Artículos de Enfederma</a>.</p></div><div class="ef-chat-main"><div class="ef-consent"><p><strong>Chat de IA externo</strong></p><p>Al continuar se abrirá Free.ai dentro de esta ventana. No compartas datos personales, fotos ni información de salud privada.</p><button type="button" id="ef-start">Iniciar conversación</button></div></div><div class="ef-fallback">Si el chat no se muestra: <a href="https://free.ai/" target="_blank" rel="noopener noreferrer">abrir IA en otra pestaña ↗</a></div>`;
  const launcher=document.createElement('button');launcher.type='button';launcher.id='ef-chat-launcher';launcher.textContent='EF';launcher.setAttribute('aria-label','Abrir EF Chat');launcher.setAttribute('aria-controls','ef-chat-panel');launcher.setAttribute('aria-expanded','false');
  document.body.append(panel,launcher);
  function close(){panel.classList.remove('open');launcher.setAttribute('aria-expanded','false');launcher.focus()}
  launcher.addEventListener('click',()=>{const show=!panel.classList.contains('open');panel.classList.toggle('open',show);launcher.setAttribute('aria-expanded',String(show));if(show)panel.querySelector('.ef-close').focus()});
  panel.querySelector('.ef-close').addEventListener('click',close);
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&panel.classList.contains('open'))close()});
  panel.querySelector('#ef-start').addEventListener('click',()=>{
    const main=panel.querySelector('.ef-chat-main');main.replaceChildren();
    const iframe=document.createElement('iframe');iframe.title='Asistente de inteligencia artificial externo';iframe.src='https://free.ai/embed/chat/';iframe.referrerPolicy='no-referrer';iframe.setAttribute('allow','clipboard-write');
    main.append(iframe);
  });
})();
