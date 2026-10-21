/* EF Chat: single-page conversation shell. AI requires a configured secure server. */
(()=> {
 if(document.getElementById('ef-chat-launcher'))return;
 const ENDPOINT='https://enfederma-ef-science.lovable.app/api/chat'; // Managed Lovable AI backend
 const style=document.createElement('style');
 style.textContent=`
 #ef-chat-launcher{position:fixed;bottom:20px;right:20px;z-index:9101;background:#60453c;color:white;width:60px;height:60px;border:1px solid #c8a46a;border-radius:50%;box-shadow:0 12px 35px #392d2a40;font:600 21px Georgia,serif;cursor:pointer}
 #ef-chat-panel{position:fixed;bottom:92px;right:20px;z-index:9100;width:min(425px,calc(100vw - 24px));height:min(620px,calc(100dvh - 112px));display:none;flex-direction:column;background:#fffaf7;color:#392d2a;border:1px solid #dcc8c2;border-radius:20px;box-shadow:0 22px 65px #392d2a38;overflow:hidden;font:14px/1.5 Arial,sans-serif}
 #ef-chat-panel.open{display:flex}
 .ef-head{display:flex;align-items:center;justify-content:space-between;background:#f3e7e8;padding:15px 18px;flex-shrink:0}.ef-head strong{font:500 25px Georgia,serif}.ef-head small{display:block;color:#806b61;font-size:11px}.ef-close{background:transparent;border:0;font-size:24px;cursor:pointer;color:#60453c}
 .ef-messages{padding:18px;overflow:auto;flex:1;display:flex;flex-direction:column;gap:12px;min-height:0}
 .ef-message{padding:12px 14px;border-radius:15px;max-width:91%;white-space:pre-wrap;overflow-wrap:anywhere}.ef-agent{align-self:flex-start;background:#f3e7e8}.ef-user{align-self:flex-end;background:#60453c;color:white}
 .ef-composer{display:flex;gap:8px;align-items:flex-end;padding:12px;border-top:1px solid #e7dad2;background:#fffaf7;flex-shrink:0}
 .ef-composer textarea{font:inherit;flex:1;resize:none;min-height:44px;max-height:120px;padding:12px;border-radius:12px;border:1px solid #d6c6bd;background:white;color:#392d2a}
 .ef-send{border:0;border-radius:12px;background:#60453c;color:white;padding:12px 15px;cursor:pointer;font:inherit}.ef-send:disabled{opacity:.6;cursor:not-allowed}
 .ef-note{font-size:11px;padding:6px 14px 10px;color:#7e6961;background:#fffaf7}
 #ef-chat-launcher:focus-visible,.ef-close:focus-visible,.ef-send:focus-visible{outline:3px solid #c8a46a;outline-offset:3px}
 @media(max-width:600px){#ef-chat-launcher{right:12px;bottom:12px;width:56px;height:56px}#ef-chat-panel{right:8px;bottom:77px;width:calc(100vw - 16px);height:calc(100dvh - 96px);border-radius:17px}}
 `;document.head.append(style);
 const panel=document.createElement('section');panel.id='ef-chat-panel';panel.setAttribute('role','dialog');panel.setAttribute('aria-label','Chat de Enfederma');
 panel.innerHTML=`<div class="ef-head"><div><strong>EF Chat</strong><small>Asistente virtual de salud dermatológica y dermoestética</small></div><button class="ef-close" type="button" aria-label="Cerrar chat">×</button></div><div class="ef-messages" role="log" aria-live="polite" aria-relevant="additions text"></div><form class="ef-composer"><textarea rows="1" aria-label="Escribe tu mensaje" maxlength="1500" placeholder="Escribe tu pregunta..." required></textarea><button class="ef-send" type="submit">Enviar</button></form><div class="ef-note">Información sanitaria educativa basada en evidencia. EF es una IA, no un profesional colegiado. No compartas datos médicos privados.</div>`;
 const trigger=document.createElement('button');trigger.type='button';trigger.id='ef-chat-launcher';trigger.textContent='EF';trigger.setAttribute('aria-label','Abrir EF Chat');trigger.setAttribute('aria-controls','ef-chat-panel');trigger.setAttribute('aria-expanded','false');
 document.body.append(panel,trigger);
 const log=panel.querySelector('.ef-messages'),form=panel.querySelector('form'),field=panel.querySelector('textarea'),send=panel.querySelector('.ef-send');
 function add(msg,who){const bubble=document.createElement('div');bubble.className='ef-message '+(who==='user'?'ef-user':'ef-agent');bubble.textContent=msg;log.append(bubble);log.scrollTop=log.scrollHeight;return bubble}
 add('Hola, soy EF. Puedes escribir directamente tu pregunta. Escribe tu pregunta y consultaré fuentes para darte una respuesta informativa.','agent');
 function close(){panel.classList.remove('open');trigger.setAttribute('aria-expanded','false');trigger.focus()}
 trigger.addEventListener('click',()=>{const open=!panel.classList.contains('open');panel.classList.toggle('open',open);trigger.setAttribute('aria-expanded',String(open));if(open)field.focus()});
 panel.querySelector('.ef-close').addEventListener('click',close);
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&panel.classList.contains('open'))close()});
 field.addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();form.requestSubmit()}});

 const history=[];
 form.addEventListener('submit',async e=>{
  e.preventDefault();const question=field.value.trim();if(!question)return;
  add(question,'user');field.value='';
  if(!ENDPOINT){add('Todavía no puedo responder con IA: falta conectar un servidor seguro con el modelo. El chat ya está preparado, pero prefiero indicártelo a inventar una respuesta.','agent');return}
  send.disabled=true;const pending=add('Consultando fuentes y preparando respuesta…','agent');
  try{const res=await fetch(ENDPOINT,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({message:question})});if(!res.ok)throw Error('Service error');const data=await res.json();if(!data||typeof data.answer!=='string')throw Error('Invalid answer');pending.textContent=data.answer;history.push({role:'user',content:question},{role:'assistant',content:data.answer});/* Referencias conservadas en la respuesta API; no se muestran automáticamente. */}
  catch{pending.textContent='No se ha podido conectar con la IA. Inténtalo más tarde.'}finally{send.disabled=false;log.scrollTop=log.scrollHeight}
 });
})();
