const state = {
  clients: JSON.parse(localStorage.getItem('nv_clients') || 'null') || [
    {id:1,name:'ООО «СК Байкал-Констрактинг»',tax:'ОСН',accountant:'Надежда',status:'Риск'},
    {id:2,name:'ИП Орлова О.А.',tax:'УСН + ПСН',accountant:'Анна',status:'В работе'}
  ],
  tasks: JSON.parse(localStorage.getItem('nv_tasks') || 'null') || [
    {id:1,title:'Проверить декларацию по налогу на прибыль',client:'ООО «СК Байкал-Констрактинг»',priority:'critical',dueDate:todayIso(),dueTime:'',status:'new',done:false,history:[]},
    {id:2,title:'Подобрать кассу и эквайринг',client:'Новый клиент',priority:'deferred',dueDate:'',dueTime:'',status:'waiting',done:false,history:[]},
    {id:3,title:'Проверить квитанции по двум ИП',client:'Два ИП',priority:'high',dueDate:todayIso(),dueTime:'',status:'new',done:false,history:[]}
  ],
  rules: JSON.parse(localStorage.getItem('nv_rules') || 'null') || [
    {id:1,title:'Электронная подпись',description:'Срок 13 месяцев. Напомнить за 60, 30, 14 и 7 дней.'},
    {id:2,title:'Оплата налогов',description:'Срок 28 числа. Если выходной — следующий рабочий день.'},
    {id:3,title:'Лизинговый платеж',description:'Оплатить заранее до предыдущего рабочего дня.'}
  ]
};

function todayIso(){return new Date().toISOString().slice(0,10)}
function normalizeTasks(){
  state.tasks=state.tasks.map(t=>({
    ...t,
    dueDate:t.dueDate||'',
    dueTime:t.dueTime||'',
    status:t.status||(t.done?'done':'new'),
    history:Array.isArray(t.history)?t.history:[]
  }));
}
normalizeTasks();

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

function badge(p){
  const names={critical:'Критично',high:'Высокий',deferred:'Отложено',done:'Выполнено',overdue:'Просрочено'};
  return `<span class="badge ${p}">${names[p]||p}</span>`;
}
function formatDate(date){
  if(!date)return 'Без срока';
  return new Intl.DateTimeFormat('ru-RU',{day:'2-digit',month:'2-digit',year:'numeric'}).format(new Date(date+'T00:00:00'));
}
function isOverdue(t){return !t.done&&t.dueDate&&t.dueDate<todayIso()}
function dueText(t){return `${formatDate(t.dueDate)}${t.dueTime?' · '+t.dueTime:''}`}

function renderToday(){
  const active=state.tasks.filter(t=>!t.done);
  document.getElementById('critical-count').textContent=active.filter(t=>t.priority==='critical'||isOverdue(t)).length;
  document.getElementById('high-count').textContent=active.filter(t=>t.priority==='high').length;
  document.getElementById('deferred-count').textContent=active.filter(t=>t.priority==='deferred'||t.status==='waiting').length;
  document.getElementById('done-count').textContent=state.tasks.filter(t=>t.done).length;
  const todayTasks=active.filter(t=>!t.dueDate||t.dueDate<=todayIso()).sort(taskSort);
  document.getElementById('today-list').innerHTML=todayTasks.slice(0,7).map(taskHtml).join('')||'<p class="meta">Срочных задач нет</p>';
  document.getElementById('reminder-list').innerHTML=state.rules.slice(0,4).map(r=>`<div class="rule-card"><b>${r.title}</b><div class="meta">${r.description}</div></div>`).join('');
}

function taskSort(a,b){
  if(a.done!==b.done)return a.done?1:-1;
  if(isOverdue(a)!==isOverdue(b))return isOverdue(a)?-1:1;
  const pa={critical:0,high:1,deferred:2};
  if((pa[a.priority]??9)!==(pa[b.priority]??9))return (pa[a.priority]??9)-(pa[b.priority]??9);
  return (a.dueDate||'9999-12-31').localeCompare(b.dueDate||'9999-12-31');
}

function taskHtml(t){
  const visual=t.done?'done':(isOverdue(t)?'overdue':t.priority);
  return `<div class="task-item ${t.done?'done':''}">
    <div>
      <b>${escapeHtml(t.title)}</b>
      <div class="meta">${escapeHtml(t.client||'Без клиента')} · ${dueText(t)}</div>
      ${t.status==='waiting'?'<div class="meta">Ожидание</div>':''}
    </div>
    <div>
      ${badge(visual)}
      <div style="margin-top:8px;display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end">
        <button class="link-btn" onclick="editTask(${t.id})">Изменить</button>
        ${!t.done?`<button class="link-btn" onclick="postponeTask(${t.id})">Перенести</button>`:''}
        <button class="link-btn" onclick="toggleTask(${t.id})">${t.done?'Вернуть':'Готово'}</button>
      </div>
    </div>
  </div>`;
}

function renderTasks(){
  const f=document.getElementById('task-filter')?.value||'all';
  const rows=state.tasks.filter(t=>{
    if(f==='all')return true;
    if(f==='done')return t.done;
    if(f==='deferred')return !t.done&&(t.priority==='deferred'||t.status==='waiting');
    return !t.done&&t.priority===f;
  }).sort(taskSort);
  document.getElementById('tasks-list').innerHTML=rows.map(taskHtml).join('')||'<p class="meta">Задач нет</p>';
}

function renderClients(){
  const q=(document.getElementById('client-search')?.value||'').toLowerCase();
  const rows=state.clients.filter(c=>(c.name+c.tax+c.accountant).toLowerCase().includes(q));
  document.getElementById('clients-list').innerHTML=rows.map(c=>`<div class="client-row"><div><b>${escapeHtml(c.name)}</b><div class="meta">Клиент NV Office</div></div><div>${escapeHtml(c.tax)}</div><div>${escapeHtml(c.accountant)}</div><div>${escapeHtml(c.status)}</div></div>`).join('')||'<p class="meta">Клиенты не найдены</p>';
}
function renderRules(){document.getElementById('rules-list').innerHTML=state.rules.map(r=>`<article class="rule-card"><b>${escapeHtml(r.title)}</b><div class="meta">${escapeHtml(r.description)}</div></article>`).join('')}
function renderAll(){renderToday();renderTasks();renderClients();renderRules()}
function escapeHtml(v=''){return String(v).replace(/[&<>'"]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch]))}

window.toggleTask=id=>{
  const t=state.tasks.find(x=>x.id===id);
  if(t){t.done=!t.done;t.status=t.done?'done':'new';t.history.push({at:new Date().toISOString(),action:t.done?'Выполнена':'Возвращена в работу'});save();renderAll()}
};

window.postponeTask=id=>{
  const t=state.tasks.find(x=>x.id===id);if(!t)return;
  const choice=prompt('Введите новую дату в формате ГГГГ-ММ-ДД\nНапример: 2026-08-12',t.dueDate||todayIso());
  if(!choice)return;
  if(!/^\d{4}-\d{2}-\d{2}$/.test(choice)){alert('Неверный формат даты');return}
  const old=t.dueDate;
  t.dueDate=choice;
  t.history.push({at:new Date().toISOString(),action:`Срок перенесён с ${old?formatDate(old):'без срока'} на ${formatDate(choice)}`});
  save();renderAll();
};

document.getElementById('task-filter').addEventListener('change',renderTasks);
document.getElementById('client-search').addEventListener('input',renderClients);

const modal=document.getElementById('modal'),form=document.getElementById('modal-form');
function taskFormHtml(t={}){
  return `<div class="field"><label>Задача</label><input name="title" required value="${escapeHtml(t.title||'')}"></div>
  <div class="field"><label>Клиент</label><input name="client" value="${escapeHtml(t.client||'')}"></div>
  <div class="field"><label>Приоритет</label><select name="priority">
    <option value="critical" ${t.priority==='critical'?'selected':''}>Критично</option>
    <option value="high" ${t.priority==='high'?'selected':''}>Высокий</option>
    <option value="deferred" ${t.priority==='deferred'?'selected':''}>Отложено</option>
  </select></div>
  <div class="field"><label>Дата исполнения</label><input type="date" name="dueDate" value="${t.dueDate||todayIso()}"></div>
  <div class="field"><label>Время исполнения</label><input type="time" name="dueTime" value="${t.dueTime||''}"></div>
  <div class="field"><label>Статус</label><select name="status">
    <option value="new" ${t.status==='new'?'selected':''}>Новая</option>
    <option value="work" ${t.status==='work'?'selected':''}>В работе</option>
    <option value="waiting" ${t.status==='waiting'?'selected':''}>Ожидает</option>
  </select></div>`;
}
function openModal(type,entity=null){
  modal.classList.add('open');modal.setAttribute('aria-hidden','false');
  if(type==='task'){
    document.getElementById('modal-title').textContent=entity?'Редактирование задачи':'Новая задача';
    form.innerHTML=taskFormHtml(entity||{})+`<div class="form-actions"><button type="button" class="secondary" onclick="closeModal()">Отмена</button><button class="primary">Сохранить</button></div>`;
    form.onsubmit=e=>{
      e.preventDefault();const d=new FormData(form);
      if(entity){
        const oldDate=entity.dueDate;
        entity.title=d.get('title');entity.client=d.get('client');entity.priority=d.get('priority');entity.dueDate=d.get('dueDate');entity.dueTime=d.get('dueTime');entity.status=d.get('status');entity.done=false;
        entity.history.push({at:new Date().toISOString(),action:oldDate!==entity.dueDate?`Срок изменён с ${oldDate?formatDate(oldDate):'без срока'} на ${entity.dueDate?formatDate(entity.dueDate):'без срока'}`:'Задача отредактирована'});
      }else{
        state.tasks.push({id:Date.now(),title:d.get('title'),client:d.get('client'),priority:d.get('priority'),dueDate:d.get('dueDate'),dueTime:d.get('dueTime'),status:d.get('status'),done:false,history:[{at:new Date().toISOString(),action:'Создана'}]});
      }
      save();closeModal();renderAll();
    };
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
window.editTask=id=>{const t=state.tasks.find(x=>x.id===id);if(t)openModal('task',t)};
function closeModal(){modal.classList.remove('open');modal.setAttribute('aria-hidden','true')}
window.closeModal=closeModal;
document.getElementById('close-modal').onclick=closeModal;
document.getElementById('quick-add').onclick=()=>openModal('task');
document.getElementById('add-task').onclick=()=>openModal('task');
document.getElementById('add-client').onclick=()=>openModal('client');
document.getElementById('add-rule').onclick=()=>openModal('rule');
modal.addEventListener('click',e=>{if(e.target===modal)closeModal()});
save();renderAll();
