(function(){
  const AREAS=['Банк','Первичные документы','Зарплата','Кадры','НДС','Налог на прибыль','УСН','Патент','Основные средства','Материалы','Лизинг','Подотчет','Сверка с ИФНС','Отчетность','Воинский учет','Миграционный учет','ККТ','ЭДО','Архив','Управленческий учет'];
  const modal=document.getElementById('modal');
  const form=document.getElementById('modal-form');
  const title=document.getElementById('modal-title');

  function escAttr(v=''){return String(v).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}
  function openModal(){modal.classList.add('open');modal.setAttribute('aria-hidden','false')}

  window.addTeamMember=function(cid){
    const c=state.clients.find(x=>String(x.id)===String(cid));
    if(!c)return;
    if(!Array.isArray(c.team))c.team=[];
    title.textContent='Добавить участок и ответственных';
    form.innerHTML=`
      <div class="field"><label>Участок работы</label><select name="area" required><option value="">Выберите участок</option>${AREAS.map(x=>`<option value="${escAttr(x)}">${x}</option>`).join('')}</select></div>
      <div class="field"><label>Исполнитель</label><input name="executor" placeholder="ФИО сотрудника"></div>
      <div class="field"><label>Проверяющий</label><input name="reviewer" placeholder="ФИО проверяющего"></div>
      <div class="field"><label>Замещающий сотрудник</label><input name="substitute" placeholder="ФИО замещающего"></div>
      <div class="field"><label>Комментарий</label><textarea name="comment" rows="3" placeholder="Особенности участка или распределения работы"></textarea></div>
      <div class="form-actions"><button type="button" class="secondary" onclick="closeModal()">Отмена</button><button class="primary">Сохранить</button></div>`;
    form.onsubmit=e=>{
      e.preventDefault();
      const d=new FormData(form);
      const area=String(d.get('area')||'').trim();
      if(!area)return;
      c.team.push({id:Date.now(),area,executor:String(d.get('executor')||'').trim(),reviewer:String(d.get('reviewer')||'').trim(),substitute:String(d.get('substitute')||'').trim(),comment:String(d.get('comment')||'').trim()});
      if(!Array.isArray(c.history))c.history=[];
      c.history.push({at:new Date().toISOString(),text:`Назначена команда по участку «${area}»`});
      save();closeModal();renderClientCard();
      const teamTab=document.querySelector('[data-tab="team"]');if(teamTab)teamTab.click();
    };
    openModal();
  };
})();
