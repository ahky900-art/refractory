/* 14-day / two-shift reheating-furnace MILP.
   Two product-grade families; furnaces 1-2 serve A, 3-4 serve B.
   All numbers are illustrative placeholders, not plant operating data. */
(() => {
 const $=id=>document.getElementById(id);
 let glpkPromise=null;
 const DAYS=28, SHIFTS=56, DURATION=28;
 const furnaces=[
  {name:"가열로 1호",grade:"A강종군",thickness:68,shell:315,condition:"긴급",rul:4,cost:2200,risk:18000,delay:220,capacity:1600},
  {name:"가열로 2호",grade:"A강종군",thickness:78,shell:285,condition:"주의",rul:10,cost:2100,risk:12000,delay:180,capacity:1550},
  {name:"가열로 3호",grade:"B강종군",thickness:92,shell:250,condition:"관찰",rul:24,cost:1950,risk:5000,delay:100,capacity:1600},
  {name:"가열로 4호",grade:"B강종군",thickness:105,shell:225,condition:"양호",rul:35,cost:1850,risk:1500,delay:60,capacity:1550}
 ];
 const gradeGroups=[{id:"A",label:"A강종군",indices:[0,1]},{id:"B",label:"B강종군",indices:[2,3]}];
 function sequence(t){
  const day=Math.floor(t/2)+1,shift=t%2===0?"주간":"야간";
  let segment,condition,loadA,loadB;
  if(day<=7){segment="기준 생산";condition="기준 강종·안정 조업";loadA=1250;loadB=1150;}
  else if(day<=14){segment="고부하 생산";condition="생산량 상향·가열부하 증가";loadA=1450;loadB=1350;}
  else if(day<=21){segment="강종 전환";condition="A/B 강종군 내 제품 규격 전환";loadA=1200;loadB=1100;}
  else {segment="생산 회복";condition="정상 생산량 복귀";loadA=1320;loadB=1220;}
  if(shift==="야간"){loadA-=80;loadB-=80;}
  return {day,shift,segment,condition,demandA:loadA,demandB:loadB};
 }
 const seq=Array.from({length:SHIFTS},(_,t)=>sequence(t));
 const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
 async function glpk(){
  if(!glpkPromise)glpkPromise=import("https://cdn.jsdelivr.net/npm/glpk.js@4.0.2/+esm").then(m=>(m.default||m.GLPK)()).catch(e=>{glpkPromise=null;throw e;});
  return glpkPromise;
 }
 function groupCapacity(group){return group.indices.reduce((a,i)=>a+furnaces[i].capacity,0);}
 function renderInputs(){
  $("hf_condition_table").innerHTML='<table><thead><tr><th>가열로</th><th>담당 강종군</th><th>내화물 잔여두께</th><th>쉘 온도</th><th>컨디션</th><th>정비 권고까지 RUL</th><th>14일 정비비</th><th>능력/교대</th></tr></thead><tbody>'+
   furnaces.map((f,i)=>'<tr><td><b>'+f.name+'</b></td><td>'+f.grade+'</td><td>'+f.thickness+' mm</td><td>'+f.shell+' °C</td><td><span class="sw-condition-pill '+(i===0?"critical":i===1?"":"ok")+'">'+f.condition+'</span></td><td>'+f.rul+'일</td><td>'+f.cost.toLocaleString("ko-KR")+'만원</td><td>'+f.capacity.toLocaleString("ko-KR")+' t</td></tr>').join("")+
   '</tbody></table><p class="sw-small">A강종군은 1·2호기, B강종군은 3·4호기가 담당합니다. 강종군 사이에는 생산능력 대체를 허용하지 않습니다.</p>';
  $("hf_shift_sequence").innerHTML=Array.from({length:DAYS},(_,d)=>{
   const a=seq[d*2],b=seq[d*2+1];
   return '<div class="hf-day"><b>Day '+(d+1)+'</b><span>A D/N '+a.demandA+'/'+b.demandA+'t</span><span>B D/N '+a.demandB+'/'+b.demandB+'t</span><span>'+a.segment+'</span></div>';
  }).join("");
 }
 function drawGantt(chosen){
  const el=$("hf_gantt");if(!el)return;
  const totalA=groupCapacity(gradeGroups[0]),totalB=groupCapacity(gradeGroups[1]);
  let html='<div class="hf-gantt-grid"><div class="hf-gantt-label">구분 / 날짜</div>';
  for(let d=1;d<=DAYS;d++)html+='<div class="hf-gantt-day">D'+d+'</div>';
  html+='<div class="hf-gantt-label"></div>';
  for(let t=0;t<SHIFTS;t++)html+='<div class="hf-gantt-shift">'+(t%2===0?"주":"야")+'</div>';
  const addRow=(label,values,kind)=>{html+='<div class="hf-gantt-label">'+label+'</div>';for(let t=0;t<SHIFTS;t++)html+='<div class="hf-gantt-cell '+kind+'" title="'+label+' · '+values[t]+'t">'+(values[t]/1000).toFixed(2)+'</div>';};
  addRow("A강종 수요",seq.map(p=>p.demandA),"demand");
  addRow("A강종 가용능력",seq.map((p,t)=>totalA-(chosen&&chosen.i<2&&t>=chosen.start&&t<chosen.start+DURATION?furnaces[chosen.i].capacity:0)),"capacity");
  addRow("B강종 수요",seq.map(p=>p.demandB),"demand");
  addRow("B강종 가용능력",seq.map((p,t)=>totalB-(chosen&&chosen.i>=2&&t>=chosen.start&&t<chosen.start+DURATION?furnaces[chosen.i].capacity:0)),"capacity");
  for(let i=0;i<furnaces.length;i++){
   html+='<div class="hf-gantt-label">'+furnaces[i].name+'<small>'+furnaces[i].grade+'</small></div>';
   for(let t=0;t<SHIFTS;t++){
    const active=chosen&&chosen.i===i&&t>=chosen.start&&t<chosen.start+DURATION;
    html+='<div class="hf-gantt-cell '+(active?"maint":"prod")+'" title="'+furnaces[i].name+' · '+(active?"14일 정비":"생산 가능")+'"></div>';
   }
  }
  el.innerHTML=html+'</div>';
 }
 async function solve(){
  const status=$("hf_status"),resultEl=$("hf_result");
  status.textContent="GLPK.js 최적화 엔진 불러오는 중...";
  resultEl.textContent="";
  const g=await glpk(),vars=[],objective=[],constraints=[],bounds=[];
  const x=(i,s)=>"x_"+i+"_"+s;
  for(let i=0;i<furnaces.length;i++){
   const starts=[];
   for(let s=0;s<=SHIFTS-DURATION;s++){
    const name=x(i,s),f=furnaces[i];vars.push(name);starts.push({name,coef:1});
    // Avoidable failure-loss benefit is subtracted because exactly one asset is selected.
    objective.push({name,coef:f.cost+f.delay*(s/2)-f.risk});
    if(s/2>f.rul)bounds.push({name,type:g.GLP_FX,lb:0,ub:0});
   }
   constraints.push({name:"one_start_"+i,vars:starts,bnds:{type:g.GLP_UP,lb:0,ub:1}});
  }
  const all=[];for(let i=0;i<furnaces.length;i++)for(let s=0;s<=SHIFTS-DURATION;s++)all.push({name:x(i,s),coef:1});
  constraints.push({name:"select_exactly_one",vars:all,bnds:{type:g.GLP_FX,lb:1,ub:1}});
  // Separate product-grade capacity constraints. A and B cannot substitute for one another.
  for(let t=0;t<SHIFTS;t++)for(const group of gradeGroups){
   const outage=[];
   for(const i of group.indices)for(let s=Math.max(0,t-DURATION+1);s<=Math.min(t,SHIFTS-DURATION);s++)outage.push({name:x(i,s),coef:furnaces[i].capacity});
   const demand=group.id==="A"?seq[t].demandA:seq[t].demandB;
   constraints.push({name:"grade_"+group.id+"_capacity_"+t,vars:outage,bnds:{type:g.GLP_UP,lb:0,ub:groupCapacity(group)-demand}});
  }
  // No more than one furnace may be down in any shift.
  for(let t=0;t<SHIFTS;t++){
   const active=[];
   for(let i=0;i<furnaces.length;i++)for(let s=Math.max(0,t-DURATION+1);s<=Math.min(t,SHIFTS-DURATION);s++)active.push({name:x(i,s),coef:1});
   constraints.push({name:"max_one_furnace_down_"+t,vars:active,bnds:{type:g.GLP_UP,lb:0,ub:1}});
  }
  const lp={name:"TwoGradeReheatingFurnace14DayMILP",objective:{direction:g.GLP_MIN,name:"maintenance_cost_and_risk",vars:objective},subjectTo:constraints,binaries:vars,bounds};
  const solved=await g.solve(lp,{msglev:g.GLP_MSG_OFF,presol:true});
  if(solved.status!==g.GLP_OPT&&solved.status!==g.GLP_FEAS){
   status.textContent="실행 가능한 정비계획이 없습니다.";
   resultEl.textContent="강종군별 수요, 각 군의 가용능력, RUL 및 14일 정비기간을 확인하세요.";
   drawGantt(null);return;
  }
  let picked=null;
  for(let i=0;i<furnaces.length;i++)for(let s=0;s<=SHIFTS-DURATION;s++)if((solved.vars[x(i,s)]||0)>.5)picked={i,start:s};
  if(!picked)throw new Error("MILP 결과에서 정비 대상과 시작 교대를 찾지 못했습니다.");
  const f=furnaces[picked.i],startDay=Math.floor(picked.start/2)+1,startShift=picked.start%2===0?"주간":"야간";
  const endShift=picked.start+DURATION-1,endDay=Math.floor(endShift/2)+1,endName=endShift%2===0?"주간":"야간";
  const minA=Math.min(...seq.map((p,t)=>groupCapacity(gradeGroups[0])-(picked.i<2&&t>=picked.start&&t<picked.start+DURATION?f.capacity:0)));
  const minB=Math.min(...seq.map((p,t)=>groupCapacity(gradeGroups[1])-(picked.i>=2&&t>=picked.start&&t<picked.start+DURATION?f.capacity:0)));
  const ok=seq.every((p,t)=>(groupCapacity(gradeGroups[0])-(picked.i<2&&t>=picked.start&&t<picked.start+DURATION?f.capacity:0))>=p.demandA&&(groupCapacity(gradeGroups[1])-(picked.i>=2&&t>=picked.start&&t<picked.start+DURATION?f.capacity:0))>=p.demandB);
  const label=solved.status===g.GLP_OPT?"최적해":"실행 가능한 해";
  status.textContent=label+" · "+f.name+"("+f.grade+") 선정 · 14일 연속 정비";
  resultEl.innerHTML='<div class="hf-result-card"><b>MILP 선정: '+f.name+' · '+f.grade+'</b><span>정비 시작: '+startDay+'일차 '+startShift+' 교대</span><span>정비 종료: '+endDay+'일차 '+endName+' 교대</span><span>정비기간: 14일 / 28교대</span><span>예시 정비비: '+f.cost.toLocaleString("ko-KR")+'만원</span><span>A강종군 최소 가용능력: '+minA+' t/교대</span><span>B강종군 최소 가용능력: '+minB+' t/교대</span><span>강종군별 교대 수요 충족: '+(ok?"모든 교대 충족":"수요 미충족")+'</span></div><p>선정된 '+f.name+'은 '+f.grade+' 전용 설비로 처리했습니다. 정비 중에는 같은 강종군의 다른 가열로만 해당 강종 생산을 담당합니다. 다른 강종군 가열로의 여유능력으로 대체하는 것은 허용하지 않았습니다.</p><p class="sw-small">위험회피 편익(Pᵢ)은 교육용 가상 손실비용입니다. 실제 고장확률·생산손실·정비비로 교정해야 합니다.</p>';
  drawGantt(picked);
  window.heatingFurnaceMILPResult={furnace:f.name,grade:f.grade,startShift:picked.start,startDay,durationShifts:DURATION,solverStatus:label,gradeDemandSatisfied:ok};
  window.dispatchEvent(new CustomEvent("heating-furnace-milp-result",{detail:window.heatingFurnaceMILPResult}));
 }
 function init(){
  if(!$("hf_run"))return;
  renderInputs();drawGantt(null);
  $("hf_run").addEventListener("click",()=>solve().catch(e=>{$("hf_status").textContent="MILP 계산 오류";$("hf_result").textContent=e.message||String(e);}));
 }
 if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init);else init();
})();
