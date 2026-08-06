const onboardingChecklistTemplate = [
  'Подписанный договор на бухгалтерское обслуживание',
  'Приложение к договору / перечень услуг',
  'Согласие на обработку персональных данных',
  'Поручение на обработку персональных данных (если применимо)',
  'Согласие на электронный документооборот',
  'Доверенность на представление интересов',
  'Карточка клиента с реквизитами',
  'Акт приёма-передачи базы и документов',
  'Регламент обмена документами и сроков',
  'Согласие на получение уведомлений и сообщений',
  'Копии учредительных документов / паспорта ИП',
  'Доступы к СБИС, банкам, ЭДО и личным кабинетам'
];

const oldMonthlyChecklistNames = new Set([
  'Выписка банка',
  'Кассовые документы',
  'Реализация',
  'Покупки',
  'Табель',
  'Путевые листы',
  'Авансовые отчеты',
  'Акты сверки'
]);

function isOldMonthlyChecklist(checklist) {
  if (!Array.isArray(checklist) || checklist.length === 0) return false;
  return checklist.every(item => oldMonthlyChecklistNames.has(item.name));
}

function ensureOnboardingChecklist() {
  let changed = false;

  state.clients.forEach(client => {
    if (isOldMonthlyChecklist(client.checklist)) {
      client.monthlyChecklist = client.checklist;
      client.checklist = onboardingChecklistTemplate.map((name, index) => ({
        id: index + 1,
        name,
        status: 'missing'
      }));
      changed = true;
      return;
    }

    if (!Array.isArray(client.checklist) || client.checklist.length === 0) {
      client.checklist = onboardingChecklistTemplate.map((name, index) => ({
        id: index + 1,
        name,
        status: 'missing'
      }));
      changed = true;
    }
  });

  if (changed) save();
}

ensureOnboardingChecklist();

const originalRenderClientCard = renderClientCard;
renderClientCard = function renderClientCardWithCorrectChecklist() {
  originalRenderClientCard();

  const checklistPanel = document.getElementById('cp-checklist');
  if (!checklistPanel) return;

  const heading = checklistPanel.querySelector('h3');
  if (heading) heading.textContent = 'Оформление отношений с клиентом';

  const cardHead = checklistPanel.querySelector('.card-head');
  if (cardHead && !checklistPanel.querySelector('.onboarding-hint')) {
    const hint = document.createElement('p');
    hint.className = 'meta onboarding-hint';
    hint.textContent = 'Контроль документов между вашей компанией и клиентом. Ежемесячные документы будут вынесены в отдельный рабочий чек-лист.';
    cardHead.insertAdjacentElement('afterend', hint);
  }
};

renderAll();
