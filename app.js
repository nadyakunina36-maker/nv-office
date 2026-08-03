const state = {
  clients: JSON.parse(localStorage.getItem('nv_clients') || 'null') || [
    {id:1,name:'ООО «СК Байкал-Констрактинг»',tax:'ОСН',accountant:'Надежда',status:'Риск'},
    {id:2,name:'ИП Орлова О.А.',tax:'УСН + ПСН',accountant:'Анна',status:'В работе'}
  ],
  tasks: JSON.parse(localStorage.getItem('nv_tasks') || 'null') || [
    {id:1,title:'Проверить декларацию по налогу на прибыль',client:'ООО «СК Байкал-Констрактинг»',priority:'critical',due:'Сегодня',done:false},
    {id:2,title:'Подобрать кассу и эквайринг',client:'Новый клиент',priority:'deferred',due:'После отчетности',done:false},
    {id:3,title:'Проверить квитанции по двум ИП',client:'Два ИП',priority:'high',due:'Сегодня',done:false}
  ],
  rules: JSON.parse(localStorage.getItem('nv_rules') || 'null') || [
    {id:1,title:'Электронная подпись',description:'Срок 13 месяцев. Напомнить за 60, 30, 14 и 7 дней.'},
    {id:2,title:'Оплата налогов',description:'Срок 28 числа. Если выходной — следующий рабочий день.'},
    {id:3,title:'Лизинговый платеж',description:'Оплатить заранее до предыдущего рабочего дня.'}
  ]
};

function save(){
  localStorage.setItem('nv_clients',JSON.stringify(state.clients));
  localStorage.setItem('nv_tasks',JSON.stringify(state.tasks));
  localStorage.setItem('nv_rules',JSON.stringify(state.rules));
}

const titles={today:['Сегодня','Что требует внимания прямо сейчас'],clients:['Клиенты','Единый список клиентов и ответственных'],tasks:['Задачи','Сроки, приоритеты и выполнение'],rules:['Правила','Повторяющиеся события и напоминания']};

function showPage(id){
  document.querySelectorAll('.page').forEach(x=>x.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(x=>x.classList.toggle('active',x.dataset.page===id));
  document.getElementById(id).classList.add('active');
  document.getElementById('page-title').textContent=titles[id][0];
  document.getElementById('page-subtitle').textContent=titles[id][1];
  renderAll();
}
window.showPage=showPage;

document.querySelectorAll('.nav-btn').forEach(btn=>btn.addEventListener('click',()=>showPage(btn.dataset.page)));

function badge(p){const names={critical:'Критично',high:'Высокий',deferred:'Отложено',done:'Выполнено'};return `<span class="badge ${p}">${names[p]}</span>`}

function renderToday(){
  const active=state.tasks.filter(t=>!t.done);
  document.getElementById('critical-count').textContent=active.filter(t=>t.priority==='critical').length;
  document.getElementById('high-count').textContent=active.filter(t=>t.priority==='high').length;
  document.getElementById('deferred-count').textContent=active.filter(t=>t.priority==='deferred').length;
  document.getElementById('done-count').textContent=state.tasks.filter(t=>t.done).length;
  document.getElementById('today-list').innerHTML=active.slice(0,5).map(t=>taskHtml(t)).join('')||'<p class="meta">Срочных задач нет</p>';
  document.getElementById('reminder-list').innerHTML=state.rules.slice(0,4).map(r=>`<div class="rule-card"><b>${r.title}</b><div class="meta">${r.description}</div></div>`).join('');
}

function taskHtml(t){return `<div class="task-item ${t.done?'done':''}"><div><b>${t.title}</b><div class="meta">${t.client} · ${t.due}</div></div><div>${badge(t.done?'done':t.priority)}<div style="margin-top:8px"><button class="link-btn" onclick="toggleTask(${t.id})">${t.done?'Вернуть':'Готово'}</button></div></div></div>`}

function renderTasks(){
  const f=document.getElementById('task-filter')?.value||'all';
  const rows=state.tasks.filter(t=>f==='all'||(f==='done'?t.done:!t.done&&t.priority===f));
  document.getElementById('tasks-list').innerHTML=rows.map(taskHtml).join('')||'<p class="meta">Задач нет</p>';
}

function renderClients(){
  const q=(document.getElementById('client-search')?.value||'').toLowerCase();
  const rows=state.clients.filter(c=>(c.name+c.tax+c.accountant).toLowerCase().includes(q));
  document.getElementById('clients-list').innerHTML=rows.map(c=>`<div class="client-row"><div><b>${c.name}</b><div class="meta">Клиент NV Office</div></div><div>${c.tax}</div><div>${c.accountant}</div><div>${c.status}</div></div>`).join('')||'<p class="meta">Клиенты не найдены</p>';
}

function renderRules(){document.getElementById('rules-list').innerHTML=state.rules.map(r=>`<article class="rule-card"><b>${r.title}</b><div class="meta">${r.description}</div></article>`).join('')}
function renderAll(){renderToday();renderTasks();renderClients();renderRules()}

window.toggleTask=id=>{const t=state.tasks.find(x=>x.id===id);if(t){t.done=!t.done;save();renderAll()}};

document.getElementById('task-filter').addEventListener('change',renderTasks);
document.getElementById('client-search').addEventListener('input',renderClients);

const modal=document.getElementById('modal'),form=document.getElementById('modal-form');
function openModal(type){
  modal.classList.add('open');modal.setAttribute('aria-hidden','false');
  if(type==='task'){
    document.getElementById('modal-title').textContent='Новая задача';
    form.innerHTML=`<div class="field"><label>Задача</label><input name="title" required></div><div class="field"><label>Клиент</label><input name="client" required></div><div class="field"><label>Приоритет</label><select name="priority"><option value="critical">Критично</option><option value="high">Высокий</option><option value="deferred">Отложено</option></select></div><div class="field"><label>Срок</label><input name="due" value="Сегодня"></div><div class="form-actions"><button type="button" class="secondary" onclick="closeModal()">Отмена</button><button class="primary">Сохранить</button></div>`;
    form.onsubmit=e=>{e.preventDefault();const d=new FormData(form);state.tasks.push({id:Date.now(),title:d.get('title'),client:d.get('client'),priority:d.get('priority'),due:d.get('due'),done:false});save();closeModal();renderAll()};
  }
  if(type==='client'){
    document.getElementById('modal-title').textContent='Новый клиент';
    form.innerHTML=`<div class="field"><label>Название</label><input name="name" required></div><div class="field"><label>СНО</label><input name="tax" required></div><div class="field"><label>Ответственный</label><input name="accountant" required></div><div class="field"><label>Статус</label><select name="status"><option>В работе</option><option>Новый</option><option>Риск</option></select></div><div class="form-actions"><button type="button" class="secondary" onclick="closeModal()">Отмена</button><button class="primary">Сохранить</button></div>`;
    form.onsubmit=e=>{e.preventDefault();const d=new FormData(form);state.clients.push({id:Date.now(),name:d.get('name'),tax:d.get('tax'),accountant:d.get('accountant'),status:d.get('status')});save();closeModal();renderAll()};
  }
  if(type==='rule'){
    document.getElementById('modal-title').textContent='Новое правило';
    form.innerHTML=`<div class="field"><label>Название</label><input name="title" required></div><div class="field"><label>Описание правила</label><textarea name="description" rows="5" required></textarea></div><div class="form-actions"><button type="button" class="secondary" onclick="closeModal()">Отмена</button><button class="primary">Сохранить</button></div>`;
    form.onsubmit=e=>{e.preventDefault();const d=new FormData(form);state.rules.push({id:Date.now(),title:d.get('title'),description:d.get('description')});save();closeModal();renderAll()};
  }
}
function closeModal(){modal.classList.remove('open');modal.setAttribute('aria-hidden','true')}
window.closeModal=closeModal;
document.getElementById('close-modal').onclick=closeModal;
document.getElementById('quick-add').onclick=()=>openModal('task');
document.getElementById('add-task').onclick=()=>openModal('task');
document.getElementById('add-client').onclick=()=>openModal('client');
document.getElementById('add-rule').onclick=()=>openModal('rule');
modal.addEventListener('click',e=>{if(e.target===modal)closeModal()});
renderAll();
