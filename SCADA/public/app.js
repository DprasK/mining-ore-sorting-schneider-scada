const $ = id => document.getElementById(id);
const history = [];
let latest = null;
let controlToken = '';
let tagsLoaded = false;
const setText = (id,value) => { $(id).textContent = value; };
const cls = (node,name,on) => node.classList.toggle(name,Boolean(on));
function toast(message,error=false){const node=$('toast');node.textContent=message;cls(node,'error',error);cls(node,'show',true);clearTimeout(toast.timer);toast.timer=setTimeout(()=>cls(node,'show',false),2600)}

function render(state){
  latest=state;
  cls($('connectionBadge'),'online',state.connected);
  $('connectionBadge').innerHTML=`<i></i>${state.connected?'SCHNEIDER ONLINE':'PLC OFFLINE'}`;
  setText('latency',state.latencyMs??'—');
  setText('lastUpdate',state.timestamp?new Date(state.timestamp).toLocaleTimeString('id-ID'):'NO UPDATE');
  const data=state.data;
  if(!data){setText('plantState','NO DATA');setText('stateDetail',state.error||'Start Schneider simulator and RUN the project');setText('safetyValue','—');setText('sequenceValue','—');setText('diverterValue','—');renderControls(state,null);return}
  setText('modeBadge',data.system.autoMode?'AUTO':'MANUAL');
  const plant=data.system.alarmActive?['ALARMED','Reset after field condition clears','bad']:data.system.systemRun?['RUNNING','Ore sorting sequence active','good']:['STOPPED','Ready for command',''];
  setText('plantState',plant[0]);setText('stateDetail',plant[1]);$('plantState').className=plant[2];
  setText('safetyValue',data.system.safetyOk?'HEALTHY':'NOT OK');$('safetyValue').className=data.system.safetyOk?'good':'bad';
  const active=data.equipment.filter(item=>item.output).length;
  const sequence=data.sorting.diverterActive?'DIVERTING':data.sorting.busy?'TRANSPORT':'IDLE';
  setText('sequenceValue',sequence);
  setText('diverterValue',data.sorting.route);
  setText('diverterDetail',data.sorting.diverterActive?'DIVERTER ACTIVE':'XRF CLASSIFICATION');
  for(const equipment of data.equipment){const card=document.querySelector(`[data-unit="${equipment.id}"]`);cls(card,'running',equipment.output);for(const [signal,on] of [['cmd',equipment.command],['fb',equipment.output],['ready',equipment.ready]])cls(card.querySelector(`[data-signal="${signal}"]`),'on',on)}
  renderAux('lube',data.sorting.busy,data.sorting.busy?'SORT SEQUENCE ACTIVE':'IDLE');
  renderAux('spray',data.sorting.diverterActive,data.sorting.diverterActive?'DIVERTER ACTIVE':'DIVERTER HOME');
  renderAux('safety',data.system.safetyOk,data.system.safetyOk?'ALL INTERLOCKS HEALTHY':'SAFETY/OVERLOAD OPEN');
  renderAux('permit',!data.system.alarmActive,data.system.alarmActive?'TRIP ACTIVE':'NO ACTIVE TRIP');
  renderAlarms(data.alarms);renderDiagnostics(data);renderControls(state,data);updateTrend(active,data.alarms.length);
}
function renderAux(id,ok,label){cls($(`${id}Dot`),'ok',ok);setText(`${id}Text`,label)}
function renderAlarms(alarms){setText('alarmStamp',`${alarms.length} ACTIVE`);$('alarms').innerHTML=alarms.length?alarms.map(a=>`<article class="alarm ${a.severity}"><b>${escapeHtml(a.code)} · ${escapeHtml(a.address)}</b><small>${escapeHtml(a.message)}</small></article>`).join(''):'<div class="no-alarm">NO ACTIVE EVENTS</div>'}
function renderDiagnostics(data){const values=[['SYSTEM RUN',data.system.systemRun],['SAFETY OK',data.system.safetyOk],['COMMON ALARM',!data.system.alarmActive],['AUTO ENABLE',data.system.autoEnable],['REJECT BIN',!data.diagnostics.rejectBinFull],['SORTER IDLE',!data.diagnostics.sorterBusy],['DIVERTER HOME',!data.diagnostics.diverterActive]];$('permissives').innerHTML=values.map(([label,ok])=>`<div class="permit ${ok?'ok':''}"><span>${label}</span><span>${ok?'HEALTHY':'NOT OK'}</span></div>`).join('')}
function renderControls(state,data){const enabled=state.writeEnabled&&controlToken.length>=20&&state.connected;setText('controlLock',enabled?'CONTROL ENABLED':state.writeEnabled?'SESSION LOCKED':'MONITOR ONLY');cls($('controlLock'),'enabled',enabled);document.querySelectorAll('[data-pulse],[data-hold],[data-toggle]').forEach(button=>button.disabled=!enabled);if(!data)return;for(const [name,control] of Object.entries(data.controls)){const toggle=document.querySelector(`[data-toggle="${name}"]`);if(toggle)cls(toggle,'active',control.value)}}
async function refresh(){try{const response=await fetch('/api/state',{cache:'no-store'});if(!response.ok)throw new Error(`HTTP ${response.status}`);render(await response.json())}catch(error){render({connected:false,writeEnabled:false,latencyMs:null,timestamp:null,error:error.message,data:null})}}
async function sendControl(name,value){try{const response=await fetch('/api/control',{method:'POST',headers:{'Content-Type':'application/json','X-Control-Token':controlToken},body:JSON.stringify({name,value})});const result=await response.json();if(!response.ok||!result.ok)throw new Error(result.error||`HTTP ${response.status}`);await refresh()}catch(error){toast(error.message,true)}}
document.querySelectorAll('[data-pulse]').forEach(button=>button.addEventListener('click',async()=>{const name=button.dataset.pulse;await sendControl(name,true);setTimeout(()=>sendControl(name,false),250)}));
document.querySelectorAll('[data-toggle]').forEach(button=>button.addEventListener('click',()=>{const name=button.dataset.toggle;sendControl(name,!Boolean(latest?.data?.controls?.[name]?.value))}));
document.querySelectorAll('[data-hold]').forEach(button=>{const start=e=>{e.preventDefault();cls(button,'pressed',true);sendControl(button.dataset.hold,true)};const stop=e=>{e.preventDefault();cls(button,'pressed',false);sendControl(button.dataset.hold,false)};button.addEventListener('pointerdown',start);button.addEventListener('pointerup',stop);button.addEventListener('pointercancel',stop);button.addEventListener('pointerleave',e=>{if(button.classList.contains('pressed'))stop(e)})});
$('sessionButton').addEventListener('click',()=>{if(controlToken){controlToken='';toast('Control session closed');renderControls(latest,latest?.data)}else $('authDialog').showModal()});
$('saveToken').addEventListener('click',event=>{const value=$('tokenInput').value.trim();if(value.length<20){event.preventDefault();return toast('Token minimal 20 karakter',true)}controlToken=value;$('tokenInput').value='';toast('Control session opened');if(latest)renderControls(latest,latest.data)});
$('toggleTags').addEventListener('click',async()=>{if(!tagsLoaded){const response=await fetch('/api/tags');const{tags}=await response.json();$('tagTable').innerHTML=tags.map(tag=>`<div class="tag-row"><span>${escapeHtml(tag.name)}</span><span>${escapeHtml(tag.plc)}</span><span>${escapeHtml(String(tag.modbus))}</span><span>${escapeHtml(tag.access)}</span></div>`).join('');tagsLoaded=true}$('tagTable').hidden=!$('tagTable').hidden;setText('toggleTags',$('tagTable').hidden?'SHOW TAGS':'HIDE TAGS')});
function updateTrend(active,alarms){history.push({active,alarms});if(history.length>120)history.shift();drawTrend()}
function drawTrend(){const canvas=$('trend'),ratio=window.devicePixelRatio||1,width=canvas.clientWidth||900,height=canvas.clientHeight||250;if(canvas.width!==Math.round(width*ratio)||canvas.height!==Math.round(height*ratio)){canvas.width=Math.round(width*ratio);canvas.height=Math.round(height*ratio)}const ctx=canvas.getContext('2d');ctx.setTransform(ratio,0,0,ratio,0,0);ctx.clearRect(0,0,width,height);ctx.strokeStyle='#263034';ctx.lineWidth=1;for(let y=35;y<height;y+=45){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(width,y);ctx.stroke()}plot(ctx,width,height,history.map(p=>p.active),4,'#f5ad42');plot(ctx,width,height,history.map(p=>p.alarms),4,'#55a7d9')}
function plot(ctx,width,height,values,max,color){if(values.length<2)return;ctx.strokeStyle=color;ctx.lineWidth=2;ctx.beginPath();values.forEach((value,index)=>{const x=index/119*width,y=height-18-Math.max(0,Math.min(1,value/max))*(height-36);if(index===0)ctx.moveTo(x,y);else ctx.lineTo(x,y)});ctx.stroke()}
function escapeHtml(value){return String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
setInterval(()=>setText('clock',new Date().toLocaleTimeString('id-ID')),1000);setInterval(refresh,500);window.addEventListener('resize',drawTrend);refresh();
