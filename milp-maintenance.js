/* MILP maintenance scheduler for production-sequence windows.
 * Uses GLPK.js in the browser. All values are user-entered planning assumptions.
 * This is a binary/continuous linear optimization prototype, not a safety approval.
 */
(() => {
  const $ = id => document.getElementById(id);
  let glpkInstancePromise = null;
  async function loadGlpk() {
    if (!glpkInstancePromise) {
      glpkInstancePromise = import("https://cdn.jsdelivr.net/npm/glpk.js@4.0.2/+esm")
        .then(mod => {
          const factory = mod.default || mod.GLPK;
          if (typeof factory !== "function") throw new Error("GLPK.js 모듈에서 초기화 함수를 찾지 못했습니다.");
          return factory();
        })
        .catch(err => { glpkInstancePromise = null; throw err; });
    }
    return glpkInstancePromise;
  }
  const jobs = [
    {name:"래들", life:"", duration:"", cost:""},
    {name:"로타리 킬른", life:"", duration:"", cost:""},
    {name:"가열로", life:"", duration:"", cost:""}
  ];
  const esc = value => String(value ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));

  function renderJobs() {
    const body = $("milp_job_rows");
    if (!body) return;
    body.innerHTML = jobs.map((j, i) => `
      <tr>
        <td><input data-job="${i}" data-field="name" value="${esc(j.name)}" aria-label="설비 ${i+1}"></td>
        <td><input type="number" min="0" step="0.1" data-job="${i}" data-field="life" value="${esc(j.life)}" placeholder="예: 120" aria-label="잔여 허용 부하시간"></td>
        <td><input type="number" min="0" step="0.5" data-job="${i}" data-field="duration" value="${esc(j.duration)}" placeholder="예: 10" aria-label="정비 소요시간"></td>
        <td><input type="number" min="0" step="1" data-job="${i}" data-field="cost" value="${esc(j.cost)}" placeholder="예: 800" aria-label="정비비용"></td>
        <td><button type="button" data-remove-job="${i}" aria-label="행 삭제">삭제</button></td>
      </tr>`).join("");
    body.querySelectorAll("[data-job]").forEach(el => {
      el.addEventListener("input", e => { jobs[Number(e.target.dataset.job)][e.target.dataset.field] = e.target.value; });
    });
    body.querySelectorAll("[data-remove-job]").forEach(el => {
      el.addEventListener("click", e => {
        if (jobs.length <= 1) return;
        jobs.splice(Number(e.currentTarget.dataset.removeJob), 1);
        renderJobs();
      });
    });
  }

  window.maintenanceGetJobsForMILP = () => jobs.map(j=>({...j}));

  function readSequence() {
    if (typeof window.maintenanceGetSequenceForMILP !== "function") return [];
    return window.maintenanceGetSequenceForMILP();
  }

  function addTerm(list, name, coef) {
    if (Math.abs(coef) > 1e-10) list.push({name, coef});
  }

  async function solve() {
    const out = $("milp_result");
    const seq = readSequence();
    const penalty = Number($("milp_downtime_penalty").value);
    const budgetRaw = $("milp_budget").value.trim();
    const budget = budgetRaw === "" ? null : Number(budgetRaw);
    const errors = [];
    if (!seq.length) errors.push("생산 시퀀스를 먼저 입력하세요.");
    if (!Number.isFinite(penalty) || penalty < 0) errors.push("생산손실 비용을 0 이상의 숫자로 입력하세요.");
    if (budget !== null && (!Number.isFinite(budget) || budget < 0)) errors.push("예산은 0 이상의 숫자 또는 공란이어야 합니다.");
    if (jobs.length === 0) errors.push("정비 대상 설비를 1개 이상 입력하세요.");
    jobs.forEach((j, i) => {
      if (!j.name.trim()) errors.push((i+1)+"번 설비명을 입력하세요.");
      if (j.life === "" || !Number.isFinite(Number(j.life)) || Number(j.life) < 0) errors.push(j.name+"의 잔여 허용 부하시간을 입력하세요.");
      if (j.duration === "" || !Number.isFinite(Number(j.duration)) || Number(j.duration) <= 0) errors.push(j.name+"의 정비 소요시간을 0보다 크게 입력하세요.");
      if (j.cost === "" || !Number.isFinite(Number(j.cost)) || Number(j.cost) < 0) errors.push(j.name+"의 정비비용을 입력하세요.");
    });
    seq.forEach((p, i) => {
      if (!Number.isFinite(p.load) || p.load < 0 || !Number.isFinite(p.hours) || p.hours < 0 || !Number.isFinite(p.window) || p.window < 0) errors.push((i+1)+"번 생산 단계의 부하·기간·정비 가능시간을 확인하세요.");
    });
    if (errors.length) {
      out.innerHTML = "<b>입력 확인</b><ul>"+errors.map(x=>"<li>"+esc(x)+"</li>").join("")+"</ul>";
      return;
    }
    if (seq.every(p => p.window <= 0)) {
      out.innerHTML = "생산 시퀀스의 <b>정비 가능시간</b>이 모두 0시간입니다. 각 단계 시작 전에 확보 가능한 정지창을 입력하세요. 예: 1단계 12시간, 2단계 8시간.";
      return;
    }

    out.textContent = "최적화 엔진(GLPK.js) 불러오는 중...";
    const glpk = await loadGlpk();
    const n = jobs.length, m = seq.length;
    const life = jobs.map(j => Number(j.life));
    const duration = jobs.map(j => Number(j.duration));
    const cost = jobs.map(j => Number(j.cost));
    const cumulativeBefore = [];
    let exposure = 0;
    seq.forEach(p => {
      cumulativeBefore.push(exposure);
      exposure += (p.load / 100) * p.hours;
    });

    const objective = [];
    const subjectTo = [];
    const binaries = [];
    const bounds = [];
    const xName = (i,t) => "x_"+i+"_"+t;
    const zName = t => "loss_"+t;

    for (let i=0;i<n;i++) {
      const terms = [];
      for (let t=0;t<m;t++) {
        const name = xName(i,t);
        binaries.push(name);
        addTerm(objective,name,cost[i]);
        const eligible = cumulativeBefore[t] <= life[i] + 1e-9 && seq[t].window + 1e-9 >= duration[i];
        if (!eligible) bounds.push({name,type:glpk.GLP_FX,lb:0,ub:0});
        addTerm(terms,name,1);
      }
      subjectTo.push({name:"one_maintenance_"+i,vars:terms,bnds:{type:glpk.GLP_FX,lb:1,ub:1}});
    }

    for (let t=0;t<m;t++) {
      const capacityTerms = [];
      const lossTerms = [];
      for (let i=0;i<n;i++) {
        addTerm(capacityTerms,xName(i,t),duration[i]);
        addTerm(lossTerms,xName(i,t),-(seq[t].load/100)*duration[i]);
      }
      subjectTo.push({name:"window_capacity_"+t,vars:capacityTerms,bnds:{type:glpk.GLP_UP,lb:0,ub:seq[t].window}});
      const z = zName(t);
      addTerm(objective,z,penalty);
      addTerm(lossTerms,z,1);
      subjectTo.push({name:"production_loss_"+t,vars:lossTerms,bnds:{type:glpk.GLP_LO,lb:0,ub:0}});
      bounds.push({name:z,type:glpk.GLP_LO,lb:0,ub:0});
    }

    if (budget !== null) {
      const budgetTerms = [];
      for (let i=0;i<n;i++) for (let t=0;t<m;t++) addTerm(budgetTerms,xName(i,t),cost[i]);
      subjectTo.push({name:"maintenance_budget",vars:budgetTerms,bnds:{type:glpk.GLP_UP,lb:0,ub:budget}});
    }

    out.textContent = "MILP 계산 중...";
    const lp = {
      name:"RefractoryMaintenanceScheduling",
      objective:{direction:glpk.GLP_MIN,name:"total_cost",vars:objective},
      subjectTo,
      binaries,
      bounds
    };
    const result = await glpk.solve(lp,{msglev:glpk.GLP_MSG_OFF,presol:true});
    if (result.status !== glpk.GLP_OPT && result.status !== glpk.GLP_FEAS) {
      out.innerHTML = "<b>실행 가능한 일정이 없습니다.</b><br>각 설비의 잔여 허용 부하시간, 정비 가능시간, 정비 소요시간, 기간 수를 확인하세요. 정비 가능시간을 늘리거나 생산 시퀀스·정비 대상 범위를 조정해야 할 수 있습니다.";
      return;
    }

    const chosen = [];
    let totalMaintenance = 0, totalLoss = 0, totalCost = 0;
    for (let i=0;i<n;i++) {
      let found = -1;
      for (let t=0;t<m;t++) if ((result.vars[xName(i,t)] || 0) > 0.5) found=t;
      if (found < 0) continue;
      const p=seq[found], d=duration[i], lost=(p.load/100)*d, c=cost[i], impact=penalty*lost;
      totalMaintenance += d; totalLoss += lost; totalCost += c+impact;
      chosen.push({name:jobs[i].name,period:found+1,stage:p.name,load:p.load,window:p.window,duration:d,cost:c,lost,impact,total:c+impact});
    }
    chosen.sort((a,b)=>a.period-b.period);
    const rows = chosen.map(r=>`<tr><td>${r.period}</td><td>${esc(r.stage)}</td><td>${esc(r.name)}</td><td>${r.load.toFixed(1)}%</td><td>${r.duration.toFixed(1)}</td><td>${r.cost.toFixed(1)}</td><td>${r.impact.toFixed(1)}</td><td>${r.total.toFixed(1)}</td></tr>`).join("");
    const statusText = result.status === glpk.GLP_OPT ? "최적해" : "실행 가능한 해(최적성 미확인)";
    window.maintenanceLastMILPAssignments = {chosen, sequence:seq, status:statusText, objective:Number(result.z)};
    window.dispatchEvent(new CustomEvent("maintenance-milp-result",{detail:window.maintenanceLastMILPAssignments}));
    out.innerHTML = `
      <div class="milp-kpis">
        <div><span>솔버 상태</span><b>${statusText}</b></div>
        <div><span>목적함수 값</span><b>${Number(result.z).toFixed(2)} 만원</b></div>
        <div><span>총 정비시간</span><b>${totalMaintenance.toFixed(1)} h</b></div>
        <div><span>부하가중 생산손실</span><b>${totalLoss.toFixed(2)} h</b></div>
      </div>
      <div class="maint-seq-table"><table><thead><tr><th>시퀀스 순서</th><th>정비 가능 단계</th><th>정비 대상</th><th>부하</th><th>정비시간(h)</th><th>정비비(만원)</th><th>생산손실 환산비(만원)</th><th>합계(만원)</th></tr></thead><tbody>${rows}</tbody></table></div>
      <p class="maint-note">목적함수 계산 합계: ${totalCost.toFixed(2)}만원. 생산손실은 부하율 × 정비시간으로 환산한 값이며 실제 생산량·매출 손실이 아닙니다. 입력한 RUL은 시퀀스 시작 전 기준의 잔여 부하가중 운전시간으로 해석했습니다.</p>
    `;
  }

  function init() {
    if (!$("milp_job_rows")) return;
    renderJobs();
    $("milp_add_job").addEventListener("click",()=>{jobs.push({name:"신규 설비",life:"",duration:"",cost:""});renderJobs();});
    $("milp_load_example").addEventListener("click",()=>{
      const demoSequence=[
        {name:"① 기준 조업",condition:"기준 원료·안정 운전",load:100,hours:8,window:12},
        {name:"② 고부하 생산",condition:"생산량 증가·열부하 상승",load:120,hours:8,window:12},
        {name:"③ 원료 전환",condition:"원료 조성 변경·부하 완화",load:90,hours:6,window:12}
      ];
      if(typeof window.maintenanceSetSequenceForMILP!=="function"){
        $("milp_example_status").textContent="생산 시퀀스 입력 모듈이 아직 준비되지 않았습니다. 페이지를 새로고침한 뒤 다시 시도하세요.";
        return;
      }
      window.maintenanceSetSequenceForMILP(demoSequence);
      jobs.splice(0,jobs.length,
        {name:"가열로 1호",life:"7",duration:"8",cost:"800"},
        {name:"가열로 2호",life:"12",duration:"8",cost:"850"},
        {name:"가열로 3호",life:"18",duration:"6",cost:"900"},
        {name:"가열로 4호",life:"22",duration:"5",cost:"700"}
      );
      renderJobs();
      $("milp_downtime_penalty").value="100";
      $("milp_budget").value="3000";
      $("milp_example_status").innerHTML="<b>예시 입력 완료.</b> 생산 시퀀스 3단계와 가열로 4대의 조건·RUL·정비시간이 입력됐습니다. 이제 아래 ‘MILP 최적 정비 일정 계산’을 누르세요.";
      $("milp_result").textContent="가열로 4대의 시간단위 예시 값이 입력됐습니다. 이 예시는 14일 정비 전용 MILP와 구분됩니다. MILP 계산을 실행하세요.";
    });
    $("milp_run").addEventListener("click",()=>solve().catch(err=>{
      $("milp_result").textContent="MILP 계산 중 오류: "+(err && err.message ? err.message : String(err));
    }));
    window.addEventListener("maintenance-sequence-updated",()=>{
      const seq=readSequence();
      if ($("milp_sequence_status")) $("milp_sequence_status").textContent="현재 생산 단계 "+seq.length+"개 · 부하가중 누적 운전노출 "+seq.reduce((a,p)=>a+(p.load/100)*p.hours,0).toFixed(2)+" h";
    });
    const seq=readSequence();
    if ($("milp_sequence_status")) $("milp_sequence_status").textContent="현재 생산 단계 "+seq.length+"개 · 부하가중 누적 운전노출 "+seq.reduce((a,p)=>a+(p.load/100)*p.hours,0).toFixed(2)+" h";
  }
  if (document.readyState==="loading") document.addEventListener("DOMContentLoaded",init); else init();
})();
