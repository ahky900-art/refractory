/* Integrated reheating-furnace production-sequence and maintenance MILP.
 * Illustrative data only. One furnace is selected for a continuous maintenance outage.
 */
(() => {
 const $=id=>document.getElementById(id);
 const SHIFTS=56;
 let glpkPromise=null;
 const defaults=()=>[
  {name:"기준 생산",days:7,aDay:1250,aNight:1170,bDay:1150,bNight:1070},
  {name:"고부하 생산",days:7,aDay:1450,aNight:1370,bDay:1350,bNight:1270},
  {name:"강종 전환",days:7,aDay:1200,aNight:1120,bDay:1100,bNight:1020},
  {name:"생산 회복",days:7,aDay:1320,aNight:1240,bDay:1220,bNight:1140}
 ];
 const furnaces=[
  {name:"가열로 1호",grade:"A",capacity:1600,rul:4,cost:2200,risk:18000,delay:220},
  {name:"가열로 2호",grade:"A",capacity:1550,rul:10,cost:2100,risk:12000,delay:180},
  {name:"가열로 3호",grade:"B",capacity:1600,rul:24,cost:1950,risk:5000,delay:100},
  {name:"가열로 4호",grade:"B",capacity:1550,rul:28,cost:1850,risk:1500,delay:60}
 ];
 let phases=defaults(),lastResult=null;
 const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
 const num=v=>Number(v);
 async function loadGlpk(){
  if(!glpkPromise)glpkPromise=import("https://cdn.jsdelivr.net/npm/glpk.js@4.0.2/+esm").then(m=>(m.default||m.GLPK)()).catch(e=>{glpkPromise=null;throw e;});
  return glpkPromise;
 }
 function renderPhases(){
  $("sequence_rows").innerHTML=phases.map((p,i)=>'<tr><td>'+(i+1)+'</td>'+
   '<td><input data-phase="'+i+'" data-key="name" value="'+esc(p.name)+'"></td>'+
   '<td><input type="number" min="1" max="28" data-phase="'+i+'" data-key="days" value="'+p.days+'"></td>'+
   '<td><input type="number" min="0" data-phase="'+i+'" data-key="aDay" value="'+p.aDay+'"></td>'+
   '<td><input type="number" min="0" data-phase="'+i+'" data-key="aNight" value="'+p.aNight+'"></td>'+
   '<td><input type="number" min="0" data-phase="'+i+'" data-key="bDay" value="'+p.bDay+'"></td>'+
   '<td><input type="number" min="0" data-phase="'+i+'" data-key="bNight" value="'+p.bNight+'"></td>'+
   '<td><button data-remove-phase="'+i+'">삭제</button></td></tr>').join("");
  $("sequence_rows").querySelectorAll("[data-phase]").forEach(el=>el.addEventListener("change",e=>{
   const p=phases[Number(e.target.dataset.phase)],k=e.target.dataset.key;
   p[k]=k==="name"?e.target.value:num(e.target.value);lastResult=null;renderTotals();
  }));
  $("sequence_rows").querySelectorAll("[data-remove-phase]").forEach(el=>el.addEventListener("click",e=>{
   if(phases.length<=1)return;phases.splice(Number(e.currentTarget.dataset.removePhase),1);lastResult=null;renderPhases();
  }));
  renderTotals();
 }
 function renderTotals(){
  const days=phases.reduce((a,p)=>a+(num(p.days)||0),0);
  $("sequence_total").textContent="입력 기간 합계: "+days+" / 28일"+(days===28?" · 계획기간 충족":" · 28일과 일치시켜야 계산 가능");
  $("sequence_total").style.color=days===28?"#28764a":"#a45b18";
 }
 function renderFurnaces(){
  $("furnace_rows").innerHTML=furnaces.map((f,i)=>'<tr><td><b>'+f.name+'</b></td><td><select data-furnace="'+i+'" data-key="grade"><option value="A" '+(f.grade==="A"?"selected":"")+'>A강종군</option><option value="B" '+(f.grade==="B"?"selected":"")+'>B강종군</option></select></td>'+
   ['capacity','rul','cost','risk','delay'].map((k)=>'<td><input type="number" min="0" step="1" data-furnace="'+i+'" data-key="'+k+'" value="'+f[k]+'"></td>').join("")+'</tr>').join("");
  $("furnace_rows").querySelectorAll("[data-furnace]").forEach(el=>el.addEventListener("change",e=>{
   const f=furnaces[Number(e.target.dataset.furnace)],k=e.target.dataset.key;f[k]=k==="grade"?e.target.value:num(e.target.value);lastResult=null;
  }));
 }
 function expandSequence(){
  const days=phases.reduce((a,p)=>a+num(p.days),0);
  if(days!==28)throw new Error("생산 단계 일수 합계가 "+days+"일입니다. 정확히 28일로 입력하세요.");
  const seq=[];
  phases.forEach(p=>{
   for(let d=0;d<num(p.days);d++){
    seq.push({phase:p.name,shift:"주간",a:num(p.aDay),b:num(p.bDay)});
    seq.push({phase:p.name,shift:"야간",a:num(p.aNight),b:num(p.bNight)});
   }
  });
  if(seq.length!==SHIFTS)throw new Error("생산 시퀀스가 56개 교대로 전개되지 않았습니다.");
  seq.forEach((p,i)=>{
   if(!Number.isFinite(p.a)||!Number.isFinite(p.b)||p.a<0||p.b<0)throw new Error((Math.floor(i/2)+1)+"일차 수요를 확인하세요.");
  });
  return seq;
 }
 function addTerm(list,name,coef){if(Math.abs(coef)>1e-10)list.push({name,coef});}
 async function solve(){
  const status=$("solver_status"),detail=$("result_detail");
  $("result_kpis").innerHTML="";detail.innerHTML="";$("capacity_audit").innerHTML="";
  status.className="status";status.textContent="입력값 검증 및 GLPK.js 엔진 준비 중...";
  const seq=expandSequence(),durationDays=num($("maintenance_days").value),duration=durationDays*2,maxDown=num($("max_down").value);
  if(!Number.isInteger(durationDays)||durationDays<1||durationDays>28)throw new Error("정비기간은 1~28일 정수로 입력하세요.");
  if(!Number.isInteger(maxDown)||maxDown<1||maxDown>4)throw new Error("동시 정비 허용 대수는 1~4대로 입력하세요.");
  furnaces.forEach(f=>{
   ["capacity","rul","cost","risk","delay"].forEach(k=>{if(!Number.isFinite(num(f[k]))||num(f[k])<0)throw new Error(f.name+"의 "+k+" 입력값을 확인하세요.");});
  });
  const g=await loadGlpk(),vars=[],objective=[],subjectTo=[],bounds=[];
  const x=(i,s)=>"x_"+i+"_"+s;
  const maxStart=SHIFTS-duration;
  for(let i=0;i<furnaces.length;i++){
   const f=furnaces[i],starts=[];
   for(let s=0;s<=maxStart;s++){
    const name=x(i,s),startDay=Math.floor(s/2)+1;
    vars.push(name);starts.push({name,coef:1});
    const delayedCost=f.cost+f.delay*(startDay-1)-f.risk;
    objective.push({name,coef:delayedCost});
    if(startDay>f.rul)bounds.push({name,type:g.GLP_FX,lb:0,ub:0});
   }
   subjectTo.push({name:"at_most_one_start_"+i,vars:starts,bnds:{type:g.GLP_UP,lb:0,ub:1}});
  }
  const choose=[];for(let i=0;i<furnaces.length;i++)for(let s=0;s<=maxStart;s++)choose.push({name:x(i,s),coef:1});
  subjectTo.push({name:"select_exactly_one_furnace",vars:choose,bnds:{type:g.GLP_FX,lb:1,ub:1}});
  for(let t=0;t<SHIFTS;t++){
   for(const grade of ["A","B"]){
    const active=[];
    for(let i=0;i<furnaces.length;i++)if(furnaces[i].grade===grade){
     for(let s=Math.max(0,t-duration+1);s<=Math.min(t,maxStart);s++)addTerm(active,x(i,s),furnaces[i].capacity);
    }
    const total=furnaces.filter(f=>f.grade===grade).reduce((a,f)=>a+f.capacity,0);
    const demand=grade==="A"?seq[t].a:seq[t].b;
    subjectTo.push({name:"capacity_"+grade+"_"+t,vars:active,bnds:{type:g.GLP_UP,lb:0,ub:total-demand}});
   }
   const down=[];
   for(let i=0;i<furnaces.length;i++)for(let s=Math.max(0,t-duration+1);s<=Math.min(t,maxStart);s++)addTerm(down,x(i,s),1);
   subjectTo.push({name:"max_down_"+t,vars:down,bnds:{type:g.GLP_UP,lb:0,ub:maxDown}});
  }
  const lp={name:"IntegratedReheatingFurnaceMILP",objective:{direction:g.GLP_MIN,name:"maintenance_cost_delay_risk",vars:objective},subjectTo,binaries:vars,bounds};
  status.textContent="MILP 최적화 계산 중...";
  const result=await g.solve(lp,{msglev:g.GLP_MSG_OFF,presol:true});
  if(result.status!==g.GLP_OPT&&result.status!==g.GLP_FEAS){
   status.className="status error";status.textContent="실행 가능한 일정이 없습니다. RUL, 강종군별 수요, 설비 능력 및 정비기간을 확인하세요.";drawGantt(seq,null,duration);return;
  }
  let picked=null;
  for(let i=0;i<furnaces.length;i++)for(let s=0;s<=maxStart;s++)if((result.vars[x(i,s)]||0)>.5)picked={i,start:s};
  if(!picked)throw new Error("솔버 결과에서 정비 대상을 찾지 못했습니다.");
  const f=furnaces[picked.i],startDay=Math.floor(picked.start/2)+1,startShift=picked.start%2===0?"주간":"야간";
  const endShift=picked.start+duration-1,endDay=Math.floor(endShift/2)+1,endName=endShift%2===0?"주간":"야간";
  const checks=["A","B"].map(grade=>{
   const vals=seq.map((p,t)=>{
    const cap=furnaces.filter(z=>z.grade===grade).reduce((a,z)=>a+z.capacity,0)-(f.grade===grade&&t>=picked.start&&t<picked.start+duration?f.capacity:0);
    return {t,cap,demand:grade==="A"?p.a:p.b,slack:cap-(grade==="A"?p.a:p.b)};
   });
   return {grade,minSlack:Math.min(...vals.map(v=>v.slack)),ok:vals.every(v=>v.slack>=-1e-8),vals};
  });
  const objectiveValue=Number(result.z),label=result.status===g.GLP_OPT?"최적해":"실행 가능한 해(최적성 미확인)";
  const chosenCost=f.cost+f.delay*(startDay-1)-f.risk;
  const candidateRows=furnaces.map((candidate,i)=>{
   let best=null;
   for(let st=0;st<=maxStart;st++){
    const day=Math.floor(st/2)+1;
    if(day>candidate.rul)continue;
    let feasible=true,minSlack=Infinity;
    for(let t=0;t<SHIFTS;t++){
     const active=t>=st&&t<st+duration;
     const total=furnaces.filter(z=>z.grade===candidate.grade).reduce((a,z)=>a+z.capacity,0);
     const available=total-(active?candidate.capacity:0);
     const demand=candidate.grade==="A"?seq[t].a:seq[t].b;
     const slack=available-demand;
     minSlack=Math.min(minSlack,slack);
     if(slack < -1e-8){feasible=false;break;}
    }
    if(!feasible)continue;
    const value=candidate.cost+candidate.delay*(day-1)-candidate.risk;
    if(!best||value<best.value)best={start:st,day,value,minSlack};
   }
   return {candidate,i,best};
  });
  const candidateTable='<h3>가열로별 후보 비교 — 목적함수와 제약조건 검토</h3><div class="table-wrap result-table"><table><thead><tr><th>가열로</th><th>RUL</th><th>가장 유리한 착수</th><th>목적함수 계수 (만원)</th><th>생산능력 제약</th><th>선택</th></tr></thead><tbody>'+
   candidateRows.map(r=>'<tr class="'+(r.i===picked.i?'selected':'')+'"><td>'+r.candidate.name+'</td><td>'+r.candidate.rul+'일</td><td>'+(r.best?r.best.day+'일차 '+(r.best.start%2===0?'주간':'야간'):'가능한 일정 없음')+'</td><td>'+(r.best?r.best.value.toLocaleString("ko-KR"):'—')+'</td><td>'+(r.best?'충족 · 최소 여유 '+r.best.minSlack.toLocaleString("ko-KR")+'t':'미충족')+'</td><td>'+(r.i===picked.i?'<b>선정</b>':'—')+'</td></tr>').join('')+
   '</tbody></table></div>';
  status.className="status ok";status.textContent=label+" · "+f.name+" · "+startDay+"일차 "+startShift+" 착수 · "+durationDays+"일 연속 정비";
  $("result_kpis").innerHTML='<div class="kpi"><span>선정 가열로</span><b>'+f.name+'</b><span>'+f.grade+'강종군</span></div><div class="kpi"><span>정비 착수</span><b>'+startDay+'일차 '+startShift+'</b><span>종료 '+endDay+'일차 '+endName+'</span></div><div class="kpi"><span>목적함수 최솟값</span><b>'+objectiveValue.toLocaleString("ko-KR",{maximumFractionDigits:1})+'</b><span>만원 환산</span></div><div class="kpi"><span>정비기간</span><b>'+durationDays+'일</b><span>'+duration+'개 교대</span></div>';
  detail.innerHTML=candidateTable+'<h3>선정 근거</h3><div class="formula">'+f.name+' : C('+f.cost+') + α('+f.delay+') × 지연일('+(startDay-1)+') − R('+f.risk+') = '+chosenCost.toLocaleString("ko-KR")+' 만원 환산</div><p class="note">각 가열로의 가능한 착수 교대 중 목적함수와 모든 생산능력·RUL 제약을 만족하는 조합을 비교해 최소값을 선택했습니다. RUL은 정비 착수일 기준 하드 제약입니다.</p>'+
   '<div class="table-wrap result-table"><table><thead><tr><th>강종군</th><th>계획기간 최소 여유능력</th><th>수요 충족</th></tr></thead><tbody>'+checks.map(c=>'<tr><td>'+c.grade+'강종군</td><td>'+c.minSlack.toLocaleString("ko-KR")+' t/교대</td><td>'+(c.ok?"충족":"미충족")+'</td></tr>').join("")+'</tbody></table></div>'+
   '<p class="note">선정 설비: '+f.name+' · RUL '+f.rul+'일 · 정비비 '+f.cost+'만원 · 위험회피 편익 '+f.risk+'만원 환산 · 지연비용 '+f.delay+'만원/일.</p>';
  $("capacity_audit").innerHTML=checks.map(c=>{
   const min=c.vals.reduce((a,v)=>v.slack<a.slack?v:a,c.vals[0]);
   return '<p class="note"><b>'+c.grade+'강종군 최저 여유 교대:</b> '+(Math.floor(min.t/2)+1)+'일차 '+(min.t%2===0?"주간":"야간")+' · 가용능력 '+min.cap.toLocaleString("ko-KR")+'t − 수요 '+min.demand.toLocaleString("ko-KR")+'t = 여유 '+min.slack.toLocaleString("ko-KR")+'t</p>';
  }).join("");
  lastResult={picked,seq,duration,label,objectiveValue};drawGantt(seq,picked,duration);
  window.heatingFurnaceMILPResult={furnace:f.name,grade:f.grade,startShift:picked.start,startDay,durationShifts:duration,solverStatus:label,objectiveValue,capacitySatisfied:checks.every(c=>c.ok)};
 }
 function drawGantt(seq,picked,duration){
  if(!seq)seq=expandSequence();
  let h='<div class="gantt-grid"><div class="glabel">날짜 / 교대</div>';
  for(let d=1;d<=28;d++)h+='<div class="gday">D'+d+'</div>';
  h+='<div class="glabel"></div>';for(let t=0;t<SHIFTS;t++)h+='<div class="gshift">'+(t%2===0?"주":"야")+'</div>';
  ["A","B"].forEach(grade=>{
   h+='<div class="glabel">'+grade+' 수요</div>';
   for(let t=0;t<SHIFTS;t++){const d=grade==="A"?seq[t].a:seq[t].b;h+='<div class="cell demand" title="'+grade+' '+d+'t">'+(d/1000).toFixed(2)+'</div>';}
   const cap=furnaces.filter(f=>f.grade===grade).reduce((a,f)=>a+f.capacity,0);
   h+='<div class="glabel">'+grade+' 가용능력</div>';
   for(let t=0;t<SHIFTS;t++){
    let down=0;if(picked&&furnaces[picked.i].grade===grade&&t>=picked.start&&t<picked.start+duration)down=furnaces[picked.i].capacity;
    h+='<div class="cell capacity" title="'+grade+' 가용능력 '+(cap-down)+'t">'+((cap-down)/1000).toFixed(2)+'</div>';
   }
  });
  furnaces.forEach((f,i)=>{
   h+='<div class="glabel">'+f.name+'</div>';
   for(let t=0;t<SHIFTS;t++){
    const active=picked&&picked.i===i&&t>=picked.start&&t<picked.start+duration;
    h+='<div class="cell '+(active?"maint":"")+'" title="'+f.name+' '+(active?"정비":"생산 가능")+'"></div>';
   }
  });
  $("gantt").innerHTML=h+'</div>';
 }
 $("add_phase").addEventListener("click",()=>{phases.push({name:"신규 생산 단계",days:1,aDay:1200,aNight:1100,bDay:1100,bNight:1000});lastResult=null;renderPhases();});
 $("reset_sequence").addEventListener("click",()=>{phases=defaults();lastResult=null;renderPhases();});
 $("run_milp").addEventListener("click",()=>solve().catch(e=>{$("solver_status").className="status error";$("solver_status").textContent="계산 오류: "+(e.message||String(e));}));
 renderPhases();renderFurnaces();
})();