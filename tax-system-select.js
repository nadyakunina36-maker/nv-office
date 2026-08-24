(() => {
  const taxSystems = [
    'Не заполнено',
    'ОСН',
    'УСН «Доходы»',
    'УСН «Доходы минус расходы»',
    'ПСН',
    'УСН «Доходы» + ПСН',
    'УСН «Доходы минус расходы» + ПСН',
    'ОСН + ПСН',
    'УСН «Доходы» + НДС',
    'УСН «Доходы минус расходы» + НДС',
    'ЕСХН',
    'НПД'
  ];

  const optionHtml = selected => taxSystems.map(value =>
    `<option value="${esc(value)}" ${value === selected ? 'selected' : ''}>${esc(value)}</option>`
  ).join('');

  window.editClient = function editClientWithTaxSelect(id) {
    const existing = state.clients.find(x => String(x.id) === String(id));
    const c = existing || {id:`manual-${Date.now()}`,name:'',inn:'',kpp:'',tax:'Не заполнено',legalForm:'ИП',hasEmployees:false,vatPayer:false,accountant:'Не назначен',servicePrice:'',status:'В работе',source:'Ручной ввод',signatures:[],checklist:defaultChecklist.map((name,i)=>({id:i+1,name,status:'missing'})),knowledge:[],history:[],documents:[],team:[],accesses:[]};

    modal.classList.add('open');
    document.getElementById('modal-title').textContent = existing ? 'Редактирование клиента' : 'Новый клиент';
    form.innerHTML = `
      <div class="field"><label>Наименование</label><input name="name" required value="${esc(c.name)}"></div>
      <div class="field"><label>ИНН</label><input name="inn" inputmode="numeric" value="${esc(c.inn || '')}"></div>
      <div class="field"><label>Форма бизнеса</label><select name="legalForm"><option ${c.legalForm==='ИП'?'selected':''}>ИП</option><option ${c.legalForm==='ООО'?'selected':''}>ООО</option><option ${c.legalForm==='АО'?'selected':''}>АО</option><option ${c.legalForm==='Прочее'?'selected':''}>Прочее</option></select></div>
      <div class="field"><label>Система налогообложения</label><select name="tax">${optionHtml(c.tax || 'Не заполнено')}</select></div>
      <div class="field"><label><input type="checkbox" name="hasEmployees" ${c.hasEmployees?'checked':''}> Есть сотрудники и зарплатная отчётность</label></div>
      <div class="field"><label><input type="checkbox" name="vatPayer" ${c.vatPayer?'checked':''}> Плательщик НДС</label></div>
      <div class="field"><label>Ответственный</label><input name="accountant" value="${esc(c.accountant)}"></div>
      <div class="field"><label>Стоимость обслуживания</label><input type="number" name="servicePrice" value="${esc(c.servicePrice || '')}"></div>
      <div class="field"><label>Статус</label><select name="status">
        <option ${c.status === 'В работе' ? 'selected' : ''}>В работе</option>
        <option ${c.status === 'Новый' ? 'selected' : ''}>Новый</option>
        <option ${c.status === 'Приостановлен' ? 'selected' : ''}>Приостановлен</option>
        <option ${c.status === 'Расторгнут' ? 'selected' : ''}>Расторгнут</option>
      </select></div>
      <div class="form-actions"><button type="button" class="secondary" onclick="closeModal()">Отмена</button><button class="primary">Сохранить</button></div>`;

    form.onsubmit = e => {
      e.preventDefault();
      const d = new FormData(form);
      Object.assign(c, {
        name: d.get('name'),
        inn: d.get('inn'),
        legalForm: d.get('legalForm'),
        tax: d.get('tax'),
        hasEmployees: d.get('hasEmployees') === 'on',
        vatPayer: d.get('vatPayer') === 'on',
        accountant: d.get('accountant'),
        servicePrice: d.get('servicePrice'),
        status: d.get('status')
      });
      if (!existing) state.clients.push(c);
      c.history.push({at: new Date().toISOString(), text: existing ? 'Карточка клиента отредактирована' : 'Карточка клиента создана'});
      save();
      closeModal();
      renderClientCard();
      renderClients();
    };
  };
})();
