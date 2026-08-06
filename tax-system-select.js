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
    const c = state.clients.find(x => String(x.id) === String(id));
    if (!c) return;

    modal.classList.add('open');
    document.getElementById('modal-title').textContent = 'Редактирование клиента';
    form.innerHTML = `
      <div class="field"><label>Наименование</label><input name="name" value="${esc(c.name)}"></div>
      <div class="field"><label>Система налогообложения</label><select name="tax">${optionHtml(c.tax || 'Не заполнено')}</select></div>
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
        tax: d.get('tax'),
        accountant: d.get('accountant'),
        servicePrice: d.get('servicePrice'),
        status: d.get('status')
      });
      c.history.push({at: new Date().toISOString(), text: 'Карточка клиента отредактирована'});
      save();
      closeModal();
      renderClientCard();
      renderClients();
    };
  };
})();
