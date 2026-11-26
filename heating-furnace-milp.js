/* 14-day, two-shift reheating-furnace maintenance MILP.
 * Illustrative parallel-furnace model. Replace all demo inputs with plant data.
 */
(() => {
 const $=id=>document.getElementById(id);
 let glpkPromise=null;
 const DAYS=28, SHIFTS=56, DURATION=28;
 const furnaces=[
  {name:"가열로 1호",thickness:68,shell:315,condition:"긴급",rul:4,cost:2200,risk:18000,delay:220,capacity:1000},
  {name:"가열로 2호",thickness:78,shell:285,condition:"주의",rul:10,cost:2100,risk:12000,delay:180,capacity:950},
  {name:"가열로 3호",thickness:92,shell:250,condition:"관찰",rul:24,cost:1950,risk:5000,delay:100,capacity:1000},
  {name:"가열로 4호",thickness:105,shell:225,condition:"양호",rul:35,cost:1850,risk:1500,delay:60,capacity:1050}
 ];
 function sequence(t){
  const day=Math.floor(t/2)+1, shift=t%2===0?"주간":"야간";
  let segment,condition,load, demand;
  if(day<=7){segment="기준 생산";condition="기준 강종·안정 조업";load=100;demand=t%2===0?2600:2400;}
  else if(day<=14){segment="고부하 생산";condition="생산량 상향·가열부하 증가";load=110;demand=t%2===0?2900:2700;}
  else if(day<=21){segment="강종 전환";condition="강종·슬래브 규격 전환";load=95;demand=t%2===0?2500:2300;}
  else {segment="생산 회복";condition="정상 생산량 복귀";load=102;demand=t%2===0?2700:2500;}
  return {day,shift,segment,condition,load,demand};
 }
 const seq=Array.from({length:SHIFTS},(_,t)=>sequence(t));
 const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
 async function glpk(){
  if(!glpkPromise)glpkPromise=import("https://cdn.jsdelivr.net/npm/glpk.js@4.0.2/+esm").then(m=>(m.default||m.GLPK)()).catch(e=>{glpkPromise=null;throw e;});
  return glpkPromise;
 }
 function renderInputs(){
  const el=$("hf_condition_table");
  el.innerHTML='<table><thead><tr><th>가열로</th><th>내화물 잔여두께</th><th>쉘 온도</th><th>컨디션</th><th>정비 권고까지 RUL</th><th>14일 정비비</th><th>정상 생산능력/교대</th></tr></thead><tbody>'+
   furnaces.map((f,i)=>'<tr><td><b>'+f.name+'</b></td><td>'+f.thickness+' mm</td><td>'+f.shell+' °C</td><td><span class="sw-condition-pill '+(i===0?"critical":i===1?"":"ok")+'">'+f.condition+'</span></td><td>'+f.rul+'일</td><td>'+f.cost.toLocaleString('ko-KR')+'만원</td><td>'+f.capacity.toLocaleString('ko-KR')+' t</td></tr>').join("")+
   '</tbody></table>';
  const groups=[];
  for(let d=1;d<=28;d++){
   const a=seq[(d-1)*2],b=seq[(d-1)*2+1];
   groups.push('<div class="hf-day"><b>Day '+d+'</b><span>D '+a.demand.toLocaleString('ko-KR')+'t</span><span>N '+b.demand.toLocaleString('ko-KR')+'t</span><span>'+a.segment+'</span></div>');
  }
  $("hf_shift_sequence").innerHTML=groups.join("");
 }
 function drawGantt(chosen){
  const el=$("hf_gantt"); if(!el)return;
  let html='<div class="hf-gantt-grid"><div class="hf-gantt-label">설비 / 날짜</div>';
  for(let d=1;d<=DAYS;d++)html+='<div class="hf-gantt-day">D'+d+'</div>';
  html+='<div class="hf-gantt-label"></div>';
  for(let t=0;t<SHIFTS;t++)html+='<div class="hf-gantt-shift">'+(t%2===0?"주":"야")+'</div>';
  const totalCapacity=furnaces.reduce((a,f)=>a+f.capacity,0);
  html+='<div class="hf-gantt-label">생산 수요</div>';
  for(let t=0;t<SHIFTS;t++)html+='<div class="hf-gantt-cell demand" title="'+seq[t].day+'일차 '+seq[t].shift+' · '+seq[t].demand+'t">'+(seq[t].demand/1000).toFixed(1)+'</div>';
  html+='<div class="hf-gantt-label">가용능력</div>';
  for(let t=0;t<SHIFTS;t++){const down=chosen&&t>=chosen.start&&t<chosen.start+DURATION;const cap=totalCapacity-(down?furnaces[chosen.i].capacity:0);html+='<div class="hf-gantt-cell capacity" title="가용 생산능력 '+cap+'t">'+(cap/1000).toFixed(1)+'</div>';}
  for(let i=0;i<furnaces.length;i++){
   html+='<div class="hf-gantt-label">'+furnaces[i].name+'</div>';
   for(let t=0;t<SHIFTS;t++){
    const active=chosen&&chosen.i===i&&t>=chosen.start&&t<chosen.start+DURATION;
    const demand=seq[t].demand;
    const remaining=totalCapacity-(active?furnaces[i].capacity:0);
    const cls=active?"maint":(remaining<demand?"risk":"prod");
    const title=active?"14일 연속 정비 중":("생산 가능 · 수요 "+demand+"t · 가용능력 "+remaining+"t");
    html+='<div class="hf-gantt-cell '+cls+'" title="'+title+'"></div>';
   }
  }
  html+='</div>';
  el.innerHTML=html;
 }
 function renderBefore(){
  drawGantt(null);
 }
 async function solve(){
  const status=$("hf_status"),resultEl=$("hf_result");
  status.textContent="GLPK.js 최적화 엔진 불러오는 중...";
  resultEl.textContent="";
  const g=await glpk();
  const vars=[],objective=[],constraints=[],bounds=[];
  const x=(i,s)=>"x_"+i+"_"+s;
  const y=i=>"y_"+i;
  // Binary decision: select exactly one furnace and choose its maintenance start shift.
  for(let i=0;i<furnaces.length;i++){
   const startTerms=[];
   for(let s=0;s<=SHIFTS-DURATION;s++){
    const name=x(i,s);vars.push(name);startTerms.push({name,coef:1});
    const f=furnaces[i];
    // Objective: maintenance cost + delay cost - avoided deferral-risk penalty.
    objective.push({name,coef:f.cost + f.delay*(s/2) - f.risk});
    if(s/2>f.rul+1e-9)bounds.push({name,type:g.GLP_FX,lb:0,ub:0});
   }
   constraints.push({name:"one_start_"+i,vars:startTerms,bnds:{type:g.GLP_FX,lb:0,ub:1}});
  }
  const all=[];for(let i=0;i<furnaces.length;i++)for(let s=0;s<=SHIFTS-DURATION;s++)all.push({name:x(i,s),coef:1});
  constraints.push({name:"select_one_furnace",vars:all,bnds:{type:g.GLP_FX,lb:1,ub:1}});
  // Shift-by-shift capacity: if the furnace is in its 28-shift outage, its capacity is unavailable.
  for(let t=0;t<SHIFTS;t++){
   const outage=[];
   for(let i=0;i<furnaces.length;i++)for(let s=Math.max(0,t-DURATION+1);s<=Math.min(t,SHIFTS-DURATION);s++){
    outage.push({name:x(i,s),coef:furnaces[i].capacity});
   }
   const total=furnaces.reduce((a,f)=>a+f.capacity,0);
   constraints.push({name:"production_capacity_"+t,vars:outage,bnds:{type:g.GLP_UP,lb:0,ub:total-seq[t].demand}});
  }
  // At most one unit under maintenance in any shift (explicitly retained for future multi-job expansion).
  for(let t=0;t<SHIFTS;t++){
   const active=[];
   for(let i=0;i<furnaces.length;i++)for(let s=Math.max(0,t-DURATION+1);s<=Math.min(t,SHIFTS-DURATION);s++)active.push({name:x(i,s),coef:1});
   constraints.push({name:"one_outage_at_a_time_"+t,vars:active,bnds:{type:g.GLP_UP,lb:0,ub:1}});
  }
  const lp={name:"ReheatingFurnace14DayMaintenance",objective:{direction:g.GLP_MIN,name:"maintenance_and_deferral_risk",vars:objective},subjectTo:constraints,binaries:vars,bounds};
  const solved=await g.solve(lp,{msglev:g.GLP_MSG_OFF,presol:true});
  if(solved.status!==g.GLP_OPT&&solved.status!==g.GLP_FEAS){
   status.textContent="실행 가능한 정비계획이 없습니다.";
   resultEl.textContent="생산 수요, 설비별 생산능력, RUL, 14일 정비기간을 다시 확인하세요.";
   drawGantt(null);return;
  }
  let picked=null;
  for(let i=0;i<furnaces.length;i++)for(let s=0;s<=SHIFTS-DURATION;s++)if((solved.vars[x(i,s)]||0)>.5)picked={i,s,start:s};
  if(!picked)throw new Error("MILP 결과에서 정비 대상/시작 교대를 찾지 못했습니다.");
  const f=furnaces[picked.i],start=picked.start,startDay=Math.floor(start/2)+1,startShift=start%2===0?"주간":"야간";
  const endShift=start+DURATION-1,endDay=Math.floor(endShift/2)+1,endName=endShift%2===0?"주간":"야간";
  const capacityOk=seq.every((p,t)=>{
   const down=t>=start&&t<start+DURATION;
   const cap=furnaces.reduce((a,z)=>a+z.capacity,0)-(down?f.capacity:0);
   return cap>=p.demand;
  });
  const statusLabel=solved.status===g.GLP_OPT?"최적해":"실행 가능한 해";
  status.textContent=statusLabel+" · 선택 설비 "+f.name+" · 정비기간 14일(28교대)";
  resultEl.innerHTML='<div class="hf-result-card"><b>MILP 선정: '+f.name+'</b><span>시작: '+startDay+'일차 '+startShift+' 교대</span><span>종료: '+endDay+'일차 '+endName+' 교대</span><span>정비비: '+f.cost.toLocaleString('ko-KR')+'만원</span><span>정비기간 중 최소 잔여 생산능력: '+Math.min(...seq.map((p,t)=>furnaces.reduce((a,z)=>a+z.capacity,0)-((t>=start&&t<start+DURATION)?f.capacity:0))).toLocaleString('ko-KR')+' t/교대</span><span>생산수요 충족: '+(capacityOk?"전 교대 충족":"미충족")+'</span></div>'+
   '<p>판정 해석: '+f.condition+' 상태와 '+f.rul+'일 RUL을 반영해 정비 대상을 선정했습니다. 정비가 시작되면 '+f.name+'의 생산능력을 28개 연속 교대 동안 0으로 처리하고, 나머지 3대의 합산 능력이 각 교대의 생산수요 이상인지 확인합니다.</p>'+
   '<p class="sw-small">솔버 목적함수 값은 정비비용·정비 지연 위험을 합친 최적화 점수이며, 위험 페널티는 예시 가정값입니다. 현장 고장확률·고장손실 데이터로 보정해야 경제적 의미가 생깁니다.</p>';
  drawGantt(picked);
  window.heatingFurnaceMILPResult={furnace:f.name,startShift:start,startDay,startName:startShift,durationShifts:DURATION,solverStatus:statusLabel};
  window.dispatchEvent(new CustomEvent("heating-furnace-milp-result",{detail:window.heatingFurnaceMILPResult}));
 }
 function init(){
  if(!$("hf_run"))return;
  renderInputs();renderBefore();
  $("hf_run").addEventListener("click",()=>solve().catch(e=>{$("hf_status").textContent="MILP 계산 오류";$("hf_result").textContent=e.message||String(e);}));
 }
 if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init);else init();
})();
