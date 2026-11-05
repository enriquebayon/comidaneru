const CONFIG = window.NERU_CONFIG || {};
const EVENT_ID = CONFIG.eventId || 'neru-2026-11-07';
const HAS_SUPABASE = Boolean(CONFIG.supabaseUrl && CONFIG.supabaseAnonKey && window.supabase);
const sb = HAS_SUPABASE ? window.supabase.createClient(CONFIG.supabaseUrl, CONFIG.supabaseAnonKey) : null;

const menu = {
  share: [
    ['Fritos de pixín',22],['Chorizo a la sidra',9.5],['Empanada asturiana',8.5],['Lacón',12],['Adobu / picadillo',10.95],['Pastel de cabracho',12.95],['Calamares a la romana',17.5],['Fritos de bacalao',19],['Queso Cabrales',11],['Queso manchego',15],['Croquetas de chipirones',12],['Croquetas de Cabrales',12],['Croquetas de jamón',12],['Morcilla',9.5],['Tortilla de la casa',10],['Tortillas variadas',8]
  ],
  first: [
    ['Sin primero',0],['Fabada Asturiana',17.5],['Fabes con almejas',17.5],['Garbanzos con callos',16],['Callos a la Madrileña',16],['Callos a la Asturiana',16],['Pote Asturiano',16],['Tartar de tomate con ventresca',17],['Alcachofas',15],['Espárragos con mahonesa',12],['Ensalada del tiempo',6],['Ensalada de la casa',10.5],['Ensalada de pimiento con ventresca',17],['Espárragos trigueros',12],['Verdura de temporada',20],['Sopa de pescado',15],['Consomé',4.5]
  ],
  main: [
    ['Sin principal',0],['Salmón a la plancha',18],['Salmón a la sidra',21.5],['Salmón a la ribereña',21.5],['Bacalao a la riojana',22.5],['Merluza a la sidra',24.5],['Merluza a la vasca',24.5],['Merluza a la romana',23.5],['Merluza a la plancha',23.5],['Merluza cocida',23.5],['Lenguado a la plancha',27.5],['Lenguado a la romana',27.5],['Calamares en su tinta',19.5],['Calamares a la romana',17.5],['Bonito con tomate',17.95],['Jamón asado',15.95],['Cabrito',25],['Cochinillo',30],['Paletilla de cordero lechal',26.5],['Ternera en tacos de la casa',15],['Solomillo',24],['Entrecot',20],['Cachopo',25],['Cachopo de Cecina',28],['Codillo',16],['Rabo de toro',19.95],['Filete empanado',15],['Filete de ternera',11]
  ],
  dessert: [
    ['Sin postre',0],['Flan de la casa',6],['Flan con nata',6],['Queso Cabrales',9],['Queso Manchego',9],['Arroz con leche',7],['Tarta de queso',7],['Tarta de orujo',7],['Tarta de whisky',6],['Manzana asada',6],['Natillas',6],['Postre de la casa Special',20],['Helados',6],['Manzana',6],['Melón',6],['Naranja con licor',6],['Melocotón en almíbar',6],['Melocotón natural',6],['Piña al kirsch',6],['Fresón con nata',6],['Fresón con naranja',6],['Cuajada',6],['Cacharrín piloña',8.5]
  ]
};

const attendeePairs = [
  { label: 'Antonio y Eva', people: ['Antonio', 'Eva'] },
  { label: 'Rafa y Paloma', people: ['Rafa', 'Paloma'] },
  { label: 'Enrique y Rosa', people: ['Enrique', 'Rosa'] },
  { label: 'Fernando y Chelo', people: ['Fernando', 'Chelo'] },
  { label: 'Oscar P. y Ana', people: ['Oscar P.', 'Ana'] },
  { label: 'Oscar A. y Elena', people: ['Oscar A.', 'Elena'] },
  { label: 'Javi', people: ['Javi'] }
];
const ATTENDEES = attendeePairs.flatMap(group => group.people);
const TOTAL_ATTENDEES = ATTENDEES.length;
const SERVICE_PER_PERSON = 3.5;

const state = { name:'', choices:{share:[],first:null,main:null,dessert:null}, people:[] };

function isRealFirst(value){ return Boolean(value && value !== 'Sin primero'); }
function isRealMain(value){ return Boolean(value && value !== 'Sin principal'); }
function isFabada(value){ return value === 'Fabada Asturiana'; }
function normalizePerson(p){
  if(!p) return p;
  const share = Array.isArray(p.share) ? p.share.filter(Boolean).slice(0,1) : [];
  let first = p.first ?? null;
  let main = p.main ?? null;
  // Excepcion: Fabada Asturiana puede combinarse con 1 principal.
  if(isRealFirst(first) && !isFabada(first) && isRealMain(main)) main = null;
  return {...p, share, first, main, dessert:p.dessert ?? null};
}
const $ = s => document.querySelector(s);
const fmt = n => new Intl.NumberFormat('es-ES',{style:'currency',currency:'EUR'}).format(n||0);
const priceOf = (cat,name) => (menu[cat].find(x=>x[0]===name)||[null,0])[1];

function toast(msg){const el=$('#toast');el.textContent=msg;el.classList.add('show');clearTimeout(toast.t);toast.t=setTimeout(()=>el.classList.remove('show'),1400)}
function localKey(){return `neru:${EVENT_ID}:people`}
function loadLocal(){try{return JSON.parse(localStorage.getItem(localKey())||'[]').map(normalizePerson)}catch{return []}}
function saveLocal(people){localStorage.setItem(localKey(),JSON.stringify(people))}
function personByName(name){return state.people.find(p=>p.name.toLowerCase()===name.toLowerCase()) || null}
function hasResponded(p){return Boolean(p && ((p.share||[]).length || p.first !== null || p.main !== null || p.dessert !== null))}

async function loadPeople(){
  if(!HAS_SUPABASE){state.people=loadLocal();return state.people}
  const {data,error}=await sb.from('neru_choices').select('*').eq('event_id',EVENT_ID).order('name');
  if(error){console.error(error);toast('No se pudo actualizar');return state.people}
  state.people=(data||[]).map(r=>normalizePerson({name:r.name,share:r.share||[],first:r.first_choice||null,main:r.main_choice||null,dessert:r.dessert_choice||null,updated_at:r.updated_at}));
  return state.people;
}

async function saveCurrent(){
  const person=normalizePerson({name:state.name,share:state.choices.share,first:state.choices.first,main:state.choices.main,dessert:state.choices.dessert,updated_at:new Date().toISOString()});
  state.choices={share:[...(person.share||[])],first:person.first,main:person.main,dessert:person.dessert};
  if(!HAS_SUPABASE){
    const people=loadLocal(); const ix=people.findIndex(p=>p.name.toLowerCase()===state.name.toLowerCase());
    if(ix>=0) people[ix]=person; else people.push(person); saveLocal(people); state.people=people;
  } else {
    const payload={event_id:EVENT_ID,name:state.name,share:state.choices.share,first_choice:state.choices.first,main_choice:state.choices.main,dessert_choice:state.choices.dessert,updated_at:new Date().toISOString()};
    const {error}=await sb.from('neru_choices').upsert(payload,{onConflict:'event_id,name'});
    if(error){console.error(error);toast('Error al guardar');return}
    await loadPeople();
  }
  renderAll();
}

function enterAs(name){
  if(!ATTENDEES.includes(name)) return;
  state.name=name; localStorage.setItem(`neru:${EVENT_ID}:name`,state.name);
  const existing=normalizePerson(personByName(state.name));
  state.choices=existing?{share:[...(existing.share||[])],first:existing.first||null,main:existing.main||null,dessert:existing.dessert||null}:{share:[],first:null,main:null,dessert:null};
  $('#currentUserName').textContent=state.name; $('#loginView').classList.add('hidden'); $('#menuView').classList.remove('hidden'); renderAll();
}

function renderAttendeeSelector(){
  const saved=localStorage.getItem(`neru:${EVENT_ID}:name`) || '';
  const responded=ATTENDEES.filter(name=>hasResponded(personByName(name))).length;
  $('#loginProgressText').textContent=`${responded} de ${TOTAL_ATTENDEES}`;
  $('#loginProgressBar').style.width=`${(responded/TOTAL_ATTENDEES)*100}%`;
  $('#attendeeGroups').innerHTML=attendeePairs.map(group=>{
    const buttons=group.people.map(name=>{
      const done=hasResponded(personByName(name));
      const last=saved===name;
      return `<button class="attendee-btn ${done?'done':''} ${last?'last-user':''}" data-person="${encodeURIComponent(name)}">
        <span class="attendee-name">${name}</span>
        <span class="attendee-status">${done?'✓ Hecho':'Pendiente'}${last?' · último':''}</span>
      </button>`;
    }).join('');
    return `<div class="attendee-pair ${group.people.length===1?'single':''}"><div class="pair-label">${group.label}</div><div class="pair-buttons">${buttons}</div></div>`;
  }).join('');
  document.querySelectorAll('.attendee-btn').forEach(btn=>btn.onclick=async()=>{await loadPeople();enterAs(decodeURIComponent(btn.dataset.person))});
}

function dishCard(cat,name,price){
  const selected=cat==='share'?state.choices.share.includes(name):state.choices[cat]===name;
  const votes=cat==='share'?state.people.filter(p=>(p.share||[]).includes(name)).length:null;
  const blocked=(cat==='first' && isRealMain(state.choices.main) && isRealFirst(name) && !isFabada(name)) ||
    (cat==='main' && isRealFirst(state.choices.first) && !isFabada(state.choices.first));
  return `<button class="dish ${selected?'selected':''} ${blocked?'blocked':''}" data-cat="${cat}" data-name="${encodeURIComponent(name)}" aria-disabled="${blocked?'true':'false'}">
    <div class="dish-main"><div class="dish-name">${name}</div><div class="dish-meta"><span class="price">${fmt(price)}</span>${cat==='share'?`<span class="votes">${votes} ${votes===1?'voto':'votos'}</span>`:''}${blocked?'<span class="lock-badge">🔒 Bloqueado</span>':''}</div></div>
    <div class="select-dot">${selected?'✓':''}</div></button>`;
}
function renderLists(){
  for(const cat of ['share','first','main','dessert']) $('#'+cat+'List').innerHTML=menu[cat].map(d=>dishCard(cat,d[0],d[1])).join('');
  $('#shareCount').textContent=`${state.choices.share.length}/1`;

  const firstBlocked=isRealMain(state.choices.main);
  const mainBlocked=isRealFirst(state.choices.first) && !isFabada(state.choices.first);
  const firstHelp=$('#firstHelp');
  const mainHelp=$('#mainHelp');
  if(firstHelp){
    if(firstBlocked){
      firstHelp.textContent=`🥣 Ya has elegido “${state.choices.main}”. Si quieres, todavía puedes añadir Fabada Asturiana; el resto de primeros están bloqueados.`;
      firstHelp.classList.add('locked-copy');
    } else {
      firstHelp.textContent='Elige un primero O un principal. Excepción: la Fabada Asturiana sí puede combinarse con 1 principal.';
      firstHelp.classList.remove('locked-copy');
    }
  }
  if(mainHelp){
    if(isFabada(state.choices.first)){
      mainHelp.textContent='✅ Has elegido Fabada Asturiana. Puedes elegir también 1 principal.';
      mainHelp.classList.remove('locked-copy');
    } else if(mainBlocked){
      mainHelp.textContent=`🔒 Ya has elegido “${state.choices.first}” como primero. Desmárcalo para poder elegir un principal.`;
      mainHelp.classList.add('locked-copy');
    } else {
      mainHelp.textContent='Elige un principal solo si NO has elegido otro primero. Excepción: con Fabada Asturiana sí puedes elegir principal.';
      mainHelp.classList.remove('locked-copy');
    }
  }

  document.querySelectorAll('.dish').forEach(btn=>btn.onclick=async()=>{
    const cat=btn.dataset.cat, name=decodeURIComponent(btn.dataset.name);
    if(cat==='first' && isRealMain(state.choices.main) && isRealFirst(name) && !isFabada(name)){
      toast('Con principal solo puedes añadir Fabada Asturiana'); return;
    }
    if(cat==='main' && isRealFirst(state.choices.first) && !isFabada(state.choices.first)){
      toast(`Ya has elegido primero: ${state.choices.first}`); return;
    }
    if(cat==='share') state.choices.share=state.choices.share.includes(name)?[]:[name];
    else state.choices[cat]=state.choices[cat]===name?null:name;
    await saveCurrent(); toast('Guardado');
  });
}

function tally(cat){
  const m=new Map();
  for(const p of state.people){
    if(!ATTENDEES.includes(p.name)) continue;
    if(cat==='share'){for(const x of p.share||[])m.set(x,(m.get(x)||0)+1)}
    else if(p[cat]) m.set(p[cat],(m.get(p[cat])||0)+1);
  }
  return [...m.entries()].sort((a,b)=>b[1]-a[1] || a[0].localeCompare(b[0]));
}
function summaryRows(cat,showVoteTotal=false){
  const rows=tally(cat).filter(([n])=>!n.startsWith('Sin ')); if(!rows.length)return '<div class="empty">Todavía no hay elecciones.</div>';
  return rows.map(([name,count])=>{
    const price=priceOf(cat,name);
    const voteTotal=count*price;
    return `<div class="summary-row"><div><strong>${name}</strong>${showVoteTotal?`<small>${count} ${count===1?'voto':'votos'} × ${fmt(price)} = ${fmt(voteTotal)}</small>`:''}</div><div class="right">${count} ${count===1?'persona':'personas'}<small>${showVoteTotal?fmt(voteTotal):fmt(price)}</small></div></div>`
  }).join('');
}
function foodTotal(p){
  if(!p) return 0;
  const shareName=(p.share||[])[0] || null;
  return priceOf('share',shareName)+priceOf('first',p.first)+priceOf('main',p.main)+priceOf('dessert',p.dessert);
}
function personTotal(p){
  if(!p) return 0;
  return foodTotal(p) + (hasResponded(p) ? SERVICE_PER_PERSON : 0);
}
function groupTotal(){
  const people=ATTENDEES.map(personByName).filter(Boolean);
  return people.reduce((sum,p)=>sum+personTotal(p),0);
}
function personCard(name){
  const p=personByName(name);
  if(!hasResponded(p)) return `<div class="person-card pending"><div class="person-top"><span class="person-name">${name}</span><span class="pending-pill">Pendiente</span></div><div class="person-lines">Aún no ha hecho su selección.</div></div>`;
  return `<div class="person-card"><div class="person-top"><span class="person-name">${name}</span><span class="person-total">${fmt(personTotal(p))}</span></div><div class="person-lines">🥘 ${(p.share||[]).length?(p.share||[]).join(' · '):'—'}<br>🍲 ${p.first||'—'}<br>🥩 ${p.main||'—'}<br>🍰 ${p.dessert||'—'}<br>🥖 Pan / servicio · ${fmt(SERVICE_PER_PERSON)}</div></div>`;
}
function renderSummary(){
  const responded=ATTENDEES.filter(name=>hasResponded(personByName(name))).length;
  const knownPeople=ATTENDEES.map(personByName).filter(Boolean);
  const total=groupTotal();
  const average=responded>0?total/responded:0;
  $('#participantsStat').textContent=`${responded}/${TOTAL_ATTENDEES}`;
  $('#mainStat').textContent=knownPeople.filter(p=>isRealFirst(p.first) || isRealMain(p.main)).length;
  $('#groupTotalStat').textContent=fmt(total);
  $('#averageStat').textContent=fmt(average);
  const serviceTotal=responded*SERVICE_PER_PERSON;
  $('#serviceSummary').innerHTML=responded ? `<div class="summary-row"><div><strong>Pan / servicio</strong><small>${responded} ${responded===1?'persona':'personas'} × ${fmt(SERVICE_PER_PERSON)}</small></div><div class="right"><strong>${fmt(serviceTotal)}</strong><small>incluido en TOTAL</small></div></div>` : '<div class="empty">Se añadirá cuando alguien haya respondido.</div>';
  $('#shareSummary').innerHTML=summaryRows('share',true); $('#firstSummary').innerHTML=summaryRows('first'); $('#mainSummary').innerHTML=summaryRows('main'); $('#dessertSummary').innerHTML=summaryRows('dessert');
  $('#peopleSummary').innerHTML=attendeePairs.map(group=>`<div class="pair-summary"><div class="pair-summary-title">${group.label}</div><div class="pair-summary-people">${group.people.map(personCard).join('')}</div></div>`).join('');
}
function renderAll(){renderAttendeeSelector();renderLists();renderSummary()}

function setTab(tab){
  document.querySelectorAll('.tab').forEach(b=>b.classList.toggle('active',b.dataset.tab===tab));
  document.querySelectorAll('.panel').forEach(p=>p.classList.remove('active')); $('#'+tab+'Panel').classList.add('active'); if(tab==='summary')loadPeople().then(renderAll); window.scrollTo({top:250,behavior:'smooth'});
}

document.querySelectorAll('.tab').forEach(b=>b.addEventListener('click',()=>setTab(b.dataset.tab)));
$('#changeUserBtn').addEventListener('click',async()=>{await loadPeople();$('#menuView').classList.add('hidden');$('#loginView').classList.remove('hidden');state.name='';state.choices={share:[],first:null,main:null,dessert:null};renderAll();window.scrollTo({top:0,behavior:'smooth'})});
$('#refreshBtn').addEventListener('click',async()=>{await loadPeople();renderAll();toast('Resumen actualizado')});
$('#modePill').textContent=HAS_SUPABASE?'🟢 Compartido en tiempo real':'🟡 Modo demo local';

(async function init(){
  await loadPeople(); renderAll();
  if(HAS_SUPABASE){
    sb.channel('neru-live').on('postgres_changes',{event:'*',schema:'public',table:'neru_choices',filter:`event_id=eq.${EVENT_ID}`},async()=>{await loadPeople();renderAll()}).subscribe();
  }
})();
