(() => {
  const state=window.nvState;
  if(!state)return;
  const iso=d=>d.toISOString().slice(0,10);
  const date=(y,m,d)=>new Date(Date.UTC(y,m-1,d));
  const moveWeekend=d=>{const x=new Date(d);if(x.getUTCDay()===6)x.setUTCDate(x.getUTCDate()+2);if(x.getUTCDay()===0)x.setUTCDate(x.getUTCDate()+1);return x};
  const add=(client,key,title,due)=>{const dueDate=iso(moveWeekend(due));if(dueDate<iso(new Date()))return;const systemKey=`НАЛОГ:${client.id}:${key}:${dueDate}`;const values={systemKey,title:`${title} · проверить по календарю`,client:client.name,assignee:client.accountant==='Не назначен'?'':client.accountant,priority:'high',dueDate,dueTime:'',plannedHours:0,actualHours:0,status:'new',done:false,calendarDraft:true};const old=state.tasks.find(t=>t.systemKey===systemKey);if(old)Object.assign(old,{...values,done:old.done,status:old.done?'done':old.status});else state.tasks.push({id:Date.now()+Math.floor(Math.random()*100000),...values,history:[{at:new Date().toISOString(),action:'Создана автоматически по налоговому профилю'}]})};
  function ensureTaxCalendar(){const now=new Date(),year=now.getUTCFullYear(),years=[year,year+1];state.clients.forEach(c=>{if(!c.tax||c.tax==='Не заполнено')return;years.forEach(y=>{if(c.tax.includes('УСН')){[[4,28,'1 квартал'],[7,28,'полугодие'],[10,28,'9 месяцев']].forEach(([m,d,p])=>add(c,`usn-advance-${p}`,`Авансовый платёж УСН за ${p}`,date(y,m,d)));add(c,'usn-annual',`Годовой налог УСН за ${y-1}`,date(y,c.legalForm==='ИП'?4:3,28))}if(c.vatPayer||c.tax==='ОСН'||c.tax.includes('+ НДС')){[[1,'IV квартал'],[4,'I квартал'],[7,'II квартал'],[10,'III квартал']].forEach(([m,p])=>{add(c,`vat-return-${p}`,`Декларация по НДС за ${p}`,date(y,m,25));[0,1,2].forEach(i=>add(c,`vat-payment-${p}-${i+1}`,`НДС: платёж ${i+1}/3 за ${p}`,date(y,m+i,28)))})}if(c.hasEmployees){for(let m=1;m<=12;m++){add(c,`contributions-${m}`,`Уплатить страховые взносы за предыдущий месяц`,date(y,m,28));add(c,`payroll-check-${m}`,`Проверить зарплатную отчётность и уведомления`,date(y,m,25))}}})});save()}
  window.ensureTaxCalendar=ensureTaxCalendar;
  ensureTaxCalendar();
})();
