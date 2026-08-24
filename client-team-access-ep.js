(function(){
  const AREAS=['Банк','Первичные документы','Зарплата','Кадры','НДС','Налог на прибыль','УСН','Патент','Основные средства','Материалы','Лизинг','Подотчет','Сверка с ИФНС','Отчетность','Воинский учет','Миграционный учет','ККТ','ЭДО','Архив','Управленческий учет'];

  function client(){return state.clients.find(x=>String(x.id)===String(state.activeClientId));}
  function ensureData(c){
    if(!Array.isArray(c.team))c.team=[];
    if(!Array.isArray(c.accesses))c.accesses=[];
    if(!Array.isArray(c.signatures))c.signatures=[];
  }
  function daysBefore(date,days){const d=new Date(date+'T00:00:00');d.setDate(d.getDate()-days);return d.toISOString().slice(0,10);}
  function addMonths(date,months){const d=new Date(date+'T00:00:00');d.setMonth(d.getMonth()+Number(months||13));return d.toISOString().slice(0,10);}
  function ensureSignatureTask(c,s){
    if(!s.expiryDate)return;
    const key=`ЭЦП:${c.id}:${s.id}`;
    let task=state.tasks.find(t=>t.systemKey===key);
    const dueDate=daysBefore(s.expiryDate,60);
    const title=`Продлить ЭЦП: ${c.name}${s.owner?' — '+s.owner:''}`;
    if(task){Object.assign(task,{title,client:c.name,dueDate,priority:'high',status:task.done?'done':'new'});}
    else state.tasks.push({id:Date.now()+Math.floor(Math.random()*1000),systemKey:key,title,client:c.name,priority:'high',dueDate,dueTime:'',status:'new',done:false,history:[{at:new Date().toISOString(),action:'Создана автоматически по сроку ЭЦП'}]});
  }
  function ensureAllSignatureTasks(){state.clients.forEach(c=>{ensureData(c);c.signatures.forEach(s=>ensureSignatureTask(c,s));});save();}
  window.ensureAllSignatureTasks=ensureAllSignatureTasks;

  const baseRender=renderClientCard;
  renderClientCard=function(){
    baseRender();
    const c=client();if(!c)return;ensureData(c);
    const tabs=document.querySelector('.client-tabs');if(!tabs||tabs.querySelector('[data-tab="team"]'))return;
    const labels={team:'Команда',accesses:'Доступы',signatures:'ЭЦП'};
    ['team','accesses','signatures'].forEach(tab=>{
      const b=document.createElement('button');b.className='client-tab';b.dataset.tab=tab;b.textContent=labels[tab];b.onclick=function(){switchClientTab(tab,this)};tabs.appendChild(b);
    });
    const root=document.getElementById('client-card-content');
    root.insertAdjacentHTML('beforeend',teamPanel(c)+accessPanel(c)+signaturePanel(c));
  };

  function teamPanel(c){return `<div class="client-panel" id="cp-team"><section class="card"><div class="card-head"><div><h3>Команда клиента</h3><div class="meta">Ответственные по участкам работы</div></div><button class="primary" onclick="addTeamMember('${c.id}')">+ Добавить участок</button></div>${c.team.length?`<div class="team-table"><div class="team-row team-head"><b>Участок</b><b>Исполнитель</b><b>Проверяющий</b><b>Замещает</b><span></span></div>${c.team.map(x=>`<div class="team-row"><b>${esc(x.area)}</b><span>${esc(x.executor||'—')}</span><span>${esc(x.reviewer||'—')}</span><span>${esc(x.substitute||'—')}</span><button class="link-btn" onclick="deleteTeamMember('${c.id}','${x.id}')">Удалить</button></div>`).join('')}</div>`:'<div class="empty-state">Участки и ответственные пока не назначены</div>'}</section></div>`;}
  function accessPanel(c){return `<div class="client-panel" id="cp-accesses"><section class="card"><div class="card-head"><div><h3>Доступы и ссылки</h3><div class="meta">Логины и адреса кабинетов. Пароли здесь не хранятся.</div></div><button class="primary" onclick="addClientAccess('${c.id}')">+ Добавить доступ</button></div>${c.accesses.length?c.accesses.map(a=>`<div class="access-row"><div><b>${esc(a.service)}</b><div class="meta">${esc(a.login||'Логин не указан')}${a.passwordLocation?' · пароль: '+esc(a.passwordLocation):''}</div></div><div>${a.url?`<a href="${esc(a.url)}" target="_blank" rel="noopener">Открыть кабинет</a>`:'<span class="meta">Ссылка не указана</span>'}</div><button class="link-btn" onclick="deleteClientAccess('${c.id}','${a.id}')">Удалить</button></div>`).join(''):'<div class="empty-state">Доступы пока не добавлены</div>'}</section></div>`;}
  function signaturePanel(c){return `<div class="client-panel" id="cp-signatures"><section class="card"><div class="card-head"><div><h3>Электронные подписи</h3><div class="meta">Задача на продление создается автоматически за 60 дней до окончания</div></div><button class="primary" onclick="addSignature('${c.id}')">+ Добавить ЭЦП</button></div>${c.signatures.length?c.signatures.map(s=>{const left=s.expiryDate?Math.ceil((new Date(s.expiryDate+'T00:00:00')-new Date())/86400000):null;return `<div class="signature-row"><div><b>${esc(s.owner||'ЭЦП')}</b><div class="meta">Получена: ${fmt(s.issueDate)} · действует до: ${fmt(s.expiryDate)}</div></div><span class="badge ${left!==null&&left<60?'critical':'done'}">${left===null?'Срок не указан':left<0?'Истекла':left+' дн.'}</span><button class="link-btn" onclick="deleteSignature('${c.id}','${s.id}')">Удалить</button></div>`}).join(''):'<div class="empty-state">ЭЦП пока не добавлены</div>'}</section></div>`;}

  window.addTeamMember=function(cid){const c=state.clients.find(x=>String(x.id)===String(cid));if(!c)return;ensureData(c);const area=prompt('Участок работы:\n'+AREAS.join(', '));if(!area)return;const executor=prompt('Исполнитель')||'';const reviewer=prompt('Проверяющий')||'';const substitute=prompt('Замещающий сотрудник')||'';c.team.push({id:Date.now(),area,executor,reviewer,substitute});c.history.push({at:new Date().toISOString(),text:`Назначена команда по участку «${area}»`});save();renderClientCard();};
  window.deleteTeamMember=function(cid,id){const c=state.clients.find(x=>String(x.id)===String(cid));if(!c)return;c.team=c.team.filter(x=>String(x.id)!==String(id));save();renderClientCard();};
  window.addClientAccess=function(cid){const c=state.clients.find(x=>String(x.id)===String(cid));if(!c)return;ensureData(c);const service=prompt('Сервис или личный кабинет (например, СБИС, Сбербанк, ФНС)');if(!service)return;const url=prompt('Ссылка на личный кабинет')||'';const login=prompt('Логин')||'';const passwordLocation=prompt('Где хранится пароль (например, менеджер паролей / у руководителя)')||'';c.accesses.push({id:Date.now(),service,url,login,passwordLocation});c.history.push({at:new Date().toISOString(),text:`Добавлен доступ «${service}»`});save();renderClientCard();};
  window.deleteClientAccess=function(cid,id){const c=state.clients.find(x=>String(x.id)===String(cid));if(!c)return;c.accesses=c.accesses.filter(x=>String(x.id)!==String(id));save();renderClientCard();};
  window.addSignature=function(cid){const c=state.clients.find(x=>String(x.id)===String(cid));if(!c)return;ensureData(c);const owner=prompt('Владелец ЭЦП / назначение ключа')||'ЭЦП';const issueDate=prompt('Дата получения в формате ГГГГ-ММ-ДД',todayIso());if(!issueDate||!/^\d{4}-\d{2}-\d{2}$/.test(issueDate)){alert('Неверная дата');return;}const months=prompt('Срок действия в месяцах','13')||'13';const expiryDate=addMonths(issueDate,months);const s={id:Date.now(),owner,issueDate,months:Number(months),expiryDate};c.signatures.push(s);ensureSignatureTask(c,s);c.history.push({at:new Date().toISOString(),text:`Добавлена ЭЦП «${owner}», срок до ${fmt(expiryDate)}`});save();renderAll();};
  window.deleteSignature=function(cid,id){const c=state.clients.find(x=>String(x.id)===String(cid));if(!c)return;c.signatures=c.signatures.filter(x=>String(x.id)!==String(id));state.tasks=state.tasks.filter(t=>t.systemKey!==`ЭЦП:${c.id}:${id}`);save();renderAll();};

  const style=document.createElement('style');style.textContent=`
    .team-table{overflow:auto;margin-top:12px}.team-row{display:grid;grid-template-columns:1.2fr 1fr 1fr 1fr auto;gap:10px;align-items:center;padding:11px 8px;border-bottom:1px solid var(--line)}.team-head{color:var(--muted);font-size:12px}.access-row,.signature-row{display:grid;grid-template-columns:1fr auto auto;gap:14px;align-items:center;border:1px solid var(--line);border-radius:12px;padding:12px;margin-top:10px}.access-row a{color:var(--blue);text-decoration:none}.signature-row .badge{white-space:nowrap}@media(max-width:760px){.team-row{grid-template-columns:1fr}.team-head{display:none}.access-row,.signature-row{grid-template-columns:1fr}}
  `;document.head.appendChild(style);
  ensureAllSignatureTasks();
  renderAll();
})();
