(function(){
  function findClient(cid){return state.clients.find(x=>String(x.id)===String(cid));}
  function addMonths(date,months){
    const d=new Date(date+'T00:00:00');
    const originalDay=d.getDate();
    d.setMonth(d.getMonth()+Number(months||13));
    if(d.getDate()<originalDay)d.setDate(0);
    return d.toISOString().slice(0,10);
  }
  function daysBefore(date,days){const d=new Date(date+'T00:00:00');d.setDate(d.getDate()-days);return d.toISOString().slice(0,10);}
  function taskForSignature(c,s){
    const key=`ЭЦП:${c.id}:${s.id}`;
    const dueDate=daysBefore(s.expiryDate,Number(s.remindDays||60));
    const title=`Продлить ЭЦП: ${c.name}${s.owner?' — '+s.owner:''}`;
    let task=state.tasks.find(t=>t.systemKey===key);
    if(task){Object.assign(task,{title,client:c.name,dueDate,priority:'high',status:task.done?'done':'new'});return;}
    state.tasks.push({id:Date.now()+Math.floor(Math.random()*1000),systemKey:key,title,client:c.name,priority:'high',dueDate,dueTime:'',status:'new',done:false,history:[{at:new Date().toISOString(),action:'Создана автоматически по сроку ЭЦП'}]});
  }
  function closeEcpModal(){document.getElementById('modal').classList.remove('open');}
  window.addSignature=function(cid){
    const c=findClient(cid);if(!c)return;
    if(!Array.isArray(c.signatures))c.signatures=[];
    const modal=document.getElementById('modal');
    const form=document.getElementById('modal-form');
    document.getElementById('modal-title').textContent='Добавить электронную подпись';
    modal.classList.add('open');
    form.innerHTML=`
      <div class="field"><label>Владелец ЭЦП</label><input name="owner" required placeholder="ФИО владельца"></div>
      <div class="field"><label>Назначение ключа</label><select name="purpose"><option>Сдача отчетности</option><option>СБИС</option><option>Личный кабинет ФНС</option><option>Банки</option><option>Торговые площадки</option><option>Честный знак</option><option>ЕГАИС</option><option>Универсальная</option><option>Другое</option></select></div>
      <div class="field"><label>Удостоверяющий центр</label><input name="authority" placeholder="Например, Тензор, Контур, ФНС"></div>
      <div class="field"><label>Дата получения</label><input type="date" name="issueDate" required value="${todayIso()}"></div>
      <div class="field"><label>Срок действия</label><select name="months"><option value="12">12 месяцев</option><option value="13" selected>13 месяцев</option><option value="15">15 месяцев</option><option value="24">24 месяца</option><option value="36">36 месяцев</option></select></div>
      <div class="field"><label>Напомнить о продлении</label><select name="remindDays"><option value="90">за 90 дней</option><option value="60" selected>за 60 дней</option><option value="30">за 30 дней</option><option value="14">за 14 дней</option></select></div>
      <div class="field"><label>Место хранения носителя</label><input name="storage" placeholder="Например, сейф, у руководителя"></div>
      <div class="field"><label>Ответственный сотрудник</label><input name="responsible" placeholder="Кто отвечает за продление"></div>
      <div class="field"><label>Комментарий</label><textarea name="comment" rows="3" placeholder="Дополнительная информация"></textarea></div>
      <div class="form-actions"><button type="button" class="secondary" id="cancel-ecp">Отмена</button><button class="primary">Сохранить</button></div>`;
    document.getElementById('cancel-ecp').onclick=closeEcpModal;
    form.onsubmit=e=>{
      e.preventDefault();
      const d=new FormData(form);
      const issueDate=d.get('issueDate');
      const months=Number(d.get('months')||13);
      const expiryDate=addMonths(issueDate,months);
      const s={id:Date.now(),owner:d.get('owner').trim(),purpose:d.get('purpose'),authority:d.get('authority').trim(),issueDate,months,expiryDate,remindDays:Number(d.get('remindDays')||60),storage:d.get('storage').trim(),responsible:d.get('responsible').trim(),comment:d.get('comment').trim()};
      c.signatures.push(s);
      taskForSignature(c,s);
      c.history.push({at:new Date().toISOString(),text:`Добавлена ЭЦП «${s.owner}» (${s.purpose}), срок до ${fmt(expiryDate)}`});
      save();closeEcpModal();renderAll();
    };
  };
})();