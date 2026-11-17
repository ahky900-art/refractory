/* Production-sequence-driven refractory maintenance planning
 * Additive module for the existing refractory dashboard.
 * Planning templates are advisory; plant procedures and OEM-approved documents govern.
 */
(() => {
  const $m = id => document.getElementById(id);
  const equipment = {
    ladle: {name:"래들", focus:"슬래그 라인·벽돌 행별 침식, 바닥 충돌부, 쉘 온도", risks:["고온 용강·슬래그 접촉","교반 가스·VTD에 따른 국부 침식","대기시간 변화에 따른 열사이클"], inspect:["슬래그 라인 잔여 두께·조인트","벽돌 이탈·균열·바닥 충돌부","쉘 온도와 열화상 이상점","노즐·바닥 플러그·안전 라이닝"]},
    kiln: {name:"로타리 킬른", focus:"소성대·전이대·입출구·노즈링 및 쉘 핫스팟", risks:["회전·편심·타원도에 따른 기계적 응력","알칼리·황산염·클링커 화학 침식","쉘 온도 상승 및 링·코팅 변화"], inspect:["소성대 벽돌 잔여 두께·조인트","타이어·롤러·쉘 타원도와 정렬","쉘 스캐너 핫스팟·온도 추세","입구·출구·노즈링·전이부"]},
    rfcc: {name:"RFCC 재생기", focus:"사이클론·딥레그·전이 콘·내화물-금속 경계", risks:["촉매 입자 침식과 고속 유동","촉매·분진 축적 및 막힘","고온·재생 분위기와 열충격"], inspect:["사이클론 접선부·타깃벽 마모","딥레그·루프실·전이 콘 막힘","앵커·헥스메시·쉘 접합부","압력차·촉매 손실·국부 핫스팟"]},
    inc: {name:"소각로", focus:"연소실·2차 연소실·킬른 입출구·슬래그 부착부", risks:["폐기물 조성·염소·알칼리·슬래그 화학 침식","회분 부착·클링커와 기계적 마모","잦은 기동·정지에 따른 열충격"], inspect:["화염·폐기물 충돌부 박락","슬래그 부착·침투·클링커","2차 연소실 천장·측벽 캐스터블","재 배출 슈트·덕트 연결부"]},
    rh: {name:"가열로", focus:"가열대·균열대·버너 블록·노상·스키드", risks:["버너 화염 충돌과 국부 과열","스케일 낙하·마찰·노상 침식","가열 패턴·정지 재가동에 따른 열응력"], inspect:["버너 타일·포트·화염 방향","천장·측벽 균열과 박락","노상·스키드 버튼·빔 주변","도어·실링·하부 피트"]},
    bf: {name:"고로", focus:"노상·출선구·풍구·벨리·스택 및 냉각계", risks:["용선·슬래그 용해 및 침투","가스·분진 마모와 열부하","냉각반·스테이브·쉘 건전성"], inspect:["노상·출선구 잔여 두께","풍구·벨리·스택 침식 및 균열","냉각반·스테이브 누수·온도","쉘 UT·열전대·열유속 추세"]},
    sr: {name:"2차 개질로", focus:"버너·연소실·촉매 지지부·출구 전이부", risks:["고온·수증기·공정가스 분위기","촉매층 차압·유동 편류","벽돌 조인트·앵커 열화"], inspect:["버너 타일·화염 충돌부","촉매 지지 돔·그리드","벽돌 균열·분절·조인트","출구 전이부·쉘 핫스팟"]},
    ab: {name:"Claus Thermal Reactor", focus:"버너 타일·주 연소실·Checker brick·출구 전이부", risks:["H₂S·SO₂·황 성분의 고온 화학 환경","Checker brick 막힘·차압 상승","화염 충돌·열충격·전이부 박락"], inspect:["버너 타일·전면 헤드","주 연소실 벽돌·조인트·핫스팟","Checker brick 균열·막힘·개구율","출구 전이부·폐열보일러 연결부"]},
    cfb: {name:"화력 보일러", focus:"노 하부·내화물 전이부·사이클론·루프실·딥레그", risks:["고속 순환재 입자 침식","내화물-수냉벽 경계 열응력","기동·정지와 재 축적"], inspect:["하부 노·분산판 주변","내화물-수냉벽 전이부","사이클론 접선부·타깃벽","루프실·딥레그·리턴 레그"]}
  };

  const stages = [
    {id:"scope",when:"정지 8~12주 전",name:"① 생산계획·정비 범위 확정",owner:"생산·정비·공정기술",tasks:["생산 시퀀스와 제품/원료 전환 계획을 확정하고 설비별 누적 열부하를 정리한다.","마모 대시보드의 취약 구역·예상 잔여 두께와 최근 실측·열화상·운전 이력을 대조한다.","정비 범위를 국부 보수·부분 교체·전면 재축조로 구분하고 작업 물량을 산출한다.","생산 손실·정지시간·예비 설비·대체 생산 경로를 검토한다."],gate:"정비 범위 및 생산 정지 창 승인"},
    {id:"engineering",when:"정지 6~8주 전",name:"② 기술·자재·외주 준비",owner:"정비·구매·내화물 기술",tasks:["설비 구역별 재질·형상·두께·벽돌 배열·앵커 도면과 승인 사양을 확정한다.","벽돌·캐스터블·모르타르·앵커·섬유·단열재의 수량, 로트, 유효기간 및 납기를 확인한다.","철거·시공 장비, 믹서·펌프·거닝 장비, 비계·양중·폐기물 처리 장비를 확보한다.","내화물 시공사·검사자·건조 승온 전문업체의 인력과 교대조를 확정한다.","버너·계장·쉘·냉각계 등 동시 정비 작업의 간섭과 작업 구역을 조정한다."],gate:"자재·도면·인력·장비 준비 완료"},
    {id:"prestop",when:"정지 1~2주 전",name:"③ 정지 전 상태 기록·안전계획",owner:"생산·안전·정비",tasks:["구역별 쉘 온도·차압·열화상·운전조건의 정지 전 기준값을 저장한다.","정비 위치별 사진·마모 지도·측정 좌표와 과거 보수 이력을 준비한다.","작업허가, LOTO, 가스 차단·퍼지, 밀폐공간, 화기·고소·양중 계획을 검토한다.","비상 구조·감시자·환기·조명·가스측정기·통신 수단을 확보한다."],gate:"작업허가 패키지 및 안전 검토 승인"},
    {id:"shutdown",when:"정지 당일 (T0)",name:"④ 생산 종료·설비 격리",owner:"운전·생산·안전",tasks:["제품·원료 투입과 연료·공정가스 공급을 승인된 정지 절차에 따라 종료한다.","잔류 용융물·슬래그·촉매·회분·베드재 등 설비별 잔류물을 안전하게 배출한다.","전기·기계·유체·가스·압력 에너지를 차단하고 LOTO 및 블라인드 상태를 확인한다.","퍼지·냉각·환기 절차를 실행하고 온도·압력·가스 상태를 기록한다."],gate:"격리 확인 및 운전부서 인계"},
    {id:"access",when:"냉각·가스프리 후",name:"⑤ 진입·철거 전 검사",owner:"안전·정비·검사",tasks:["온도·산소·가연성·독성가스 측정과 밀폐공간 진입 허가를 확인한다.","비계·작업발판·조명·환기·구조장비를 설치하고 접근 경로를 확인한다.","철거 전에 손상 부위·쉘·앵커·조인트·침투 흔적을 사진과 위치도로 기록한다.","철거 범위를 실측 결과와 대조하고 추가 철거 승인 여부를 결정한다."],gate:"가스프리·진입 허가 및 as-found 검사 승인"},
    {id:"demolition",when:"정비 작업 1단계",name:"⑥ 손상부 철거·바탕 정리",owner:"내화물 시공사·검사자",tasks:["승인된 경계선에 따라 손상 내화물을 철거하고 건전부 손상을 최소화한다.","쉘·앵커·스터드·헥스메시·냉각 요소의 변형·부식·용접 상태를 검사한다.","쉘 부식·균열·두께 저하 등 금속 결함은 별도 승인 후 보수한다.","철거 폐기물과 분진을 분리·반출하고 바탕면 청결·건조 상태를 확인한다."],gate:"철거 범위·금속 바탕·앵커 검사 승인"},
    {id:"install",when:"정비 작업 2단계",name:"⑦ 내화물 설치·품질검사",owner:"시공사·내화물 검사자·정비",tasks:["재질·제조 로트·보관 상태·유효기간·혼합수와 작업 환경을 확인한다.","앵커 재질·간격·용접·배치와 팽창 조인트를 승인 도면과 대조한다.","벽돌 배열·조인트 두께·방향 또는 캐스터블 혼합·타설·진동·거닝 품질을 확인한다.","배치별 혼합시간·물 첨가량·재료/주변 온도·작업시간·시공 위치를 기록한다.","설치 완료 후 치수·표면·공극·조인트·앵커 및 보수 경계를 검사한다."],gate:"설치 검사 및 ITP hold point 서명"},
    {id:"cure",when:"설치 직후",name:"⑧ 양생·건조 승온 준비",owner:"내화물 기술·운전·검사",tasks:["제품별 기술자료의 양생 시간·온도·습도·보호 조건을 확인하고 기록한다.","캐스터블 종류·두께·시공 방법·수분·구조에 맞는 제조사 승인 Dry-out curve를 확보한다.","열전대 위치, 가스 온도/라이닝 온도 기준, 버너 용량·배치, 배기·환기 경로를 확인한다.","weep hole·wicking·배수·증기 배출 경로와 온도 기록계·비상 대응을 확인한다.","승온 전 검사와 건조 담당자·운전 담당자 간 hold point 승인을 완료한다."],gate:"승인된 양생·건조 곡선 및 계측 준비"},
    {id:"dryout",when:"재가동 전",name:"⑨ 건조·승온·냉각 관리",owner:"건조 전문업체·운전·검사",tasks:["승인된 제조사 곡선에 따라 단계별 승온 속도·유지시간·냉각속도를 제어한다.","열전대 다점 온도와 배기가스·증기 발생·온도 편차를 연속 기록한다.","증기 과다·온도 편차·버너 정지·전원 상실 등 이상 시 승인 절차에 따라 hold/감온하고 기술 검토를 받는다.","급격한 승온·직화 충돌·환기 부족·임의 시간 단축을 금지한다.","완료 후 균열·박락·변형·열점 및 기록 누락 여부를 확인한다."],gate:"Dry-out 기록 검토 및 재가동 승인"},
    {id:"restart",when:"생산 재개 시점",name:"⑩ 생산 재개·초기 감시",owner:"생산·정비·공정기술",tasks:["운전 조건을 승인된 초기 부하로 단계적으로 복귀시키고 급격한 부하 변화를 피한다.","초기 운전 중 쉘 온도·열화상·차압·유량·진동 등 관련 지표를 강화 감시한다.","정비 전후 생산 시퀀스와 실제 운전조건을 기록해 열화 모델의 입력 이력을 갱신한다.","누설·핫스팟·이상 차압·박락 징후 발생 시 운전·정비 비상 기준에 따라 대응한다."],gate:"초기 안정화 확인 및 운전부서 인수"},
    {id:"review",when:"재가동 2~4주 후",name:"⑪ 정비 실적·수명 데이터 환류",owner:"생산·정비·기술·구매",tasks:["계획 대비 실제 정지시간·작업시간·자재 사용량·추가 공사·비용을 비교한다.","as-found/as-built 사진·실측 두께·설치 로트·건조 곡선·검사 기록을 보존한다.","조기 손상 원인을 운전조건·재질·시공·설계·정지 재가동 요인으로 나누어 검토한다.","다음 생산 시퀀스의 부하·정비 시점·예비 자재·검사 주기를 갱신한다."],gate:"사후 검토 및 다음 정비계획 반영"}
  ];

  const sequenceProfiles = {
    steady:{label:"정상 연속생산",desc:"기준 생산계획을 유지하며 계획 정지 시점에 맞춰 정비 범위를 확정합니다.",extra:["누적 가동시간·열부하 기준으로 정비 시점을 산정","예정 정지창에 맞춰 자재·인력·검사자를 사전 확보"]},
    change:{label:"제품·원료 전환",desc:"제품·원료·연료 전환으로 분위기·슬래그·분진·열부하가 달라지는 시퀀스입니다.",extra:["전환 전후 조성·입도·수분·알칼리/황/염소 등 변화량을 기록","전환 구역의 화학 침식·부착·열충격 취약부를 추가 점검"]},
    cycling:{label:"잦은 기동·정지",desc:"열사이클 누적과 급격한 냉각·재가열 이력을 정비 준비에 반영합니다.",extra:["기동·정지 횟수와 승온·냉각 속도 이력을 별도 집계","균열·박락·조인트·앵커 및 열충격 취약부를 우선 검사"]},
    surge:{label:"단기 증산·고부하",desc:"높은 생산부하가 지속되는 경우 정비 전까지의 잔여 운전 여유를 보수적으로 검토합니다.",extra:["부하율·온도·유량·차압·운전시간의 상위 구간을 확인","핫스팟·마모 집중부의 실측 주기를 단축하고 예비품 확보"]}
  };

  const state = {key:"kiln",profile:"steady",checks:{}, rendered:false};
  const esc = s => String(s ?? "").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));

  function render(){
    const panel=$m("p_maintenance");
    if(!panel) return;
    if(!state.rendered){
      $m("maint_equipment").innerHTML=Object.entries(equipment).map(([k,v])=>'<option value="'+k+'">'+esc(v.name)+'</option>').join("");
      $m("maint_equipment").value=state.key;
      $m("maint_equipment").onchange=e=>{state.key=e.target.value;paint()};
      $m("maint_profile").onchange=e=>{state.profile=e.target.value;paint()};
      $m("maint_search").oninput=paint;
      $m("maint_reset").onclick=()=>{state.checks={};paint()};
      $m("maint_print").onclick=()=>window.print();
      $m("maint_add_seq").onclick=()=>{state.sequence.push({name:"신규 생산 단계",condition:"조건 입력",load:100,hours:1});paintSequence()};
      $m("maint_reset_seq").onclick=()=>{state.sequence=[{name:"원료/제품 A",condition:"기준 조업",load:100,hours:8}];paintSequence()};
      state.rendered=true;
    }
    paintSequence();
    paint();
  }
  function paintSequence(){
    const body=$m("maint_seq_rows"); if(!body)return;
    body.innerHTML=state.sequence.map((r,i)=>`<tr><td>${i+1}</td><td><input data-seq="name" data-i="${i}" value="${esc(r.name)}"></td><td><input data-seq="condition" data-i="${i}" value="${esc(r.condition)}"></td><td><input type="number" min="0" max="150" data-seq="load" data-i="${i}" value="${esc(r.load)}"></td><td><input type="number" min="0" data-seq="hours" data-i="${i}" value="${esc(r.hours)}"></td><td><button type="button" data-del-seq="${i}">삭제</button></td></tr>`).join("");
    body.querySelectorAll("[data-seq]").forEach(el=>el.onchange=e=>{const r=state.sequence[+e.target.dataset.i],k=e.target.dataset.seq;r[k]=(k==="load"||k==="hours")?Number(e.target.value):e.target.value;paintSequence();paint()});
    body.querySelectorAll("[data-del-seq]").forEach(el=>el.onclick=e=>{state.sequence.splice(+e.target.dataset.delSeq,1);paintSequence();paint()});
    const total=state.sequence.reduce((a,r)=>a+(Number(r.hours)||0),0);
    $m("maint_seq_total").textContent="입력 단계 "+state.sequence.length+"개 · 계획 운전시간 "+total.toFixed(1)+" h";
  }
  function paint(){
    const eq=equipment[state.key], prof=sequenceProfiles[state.profile];
    const q=($m("maint_search").value||"").trim().toLowerCase();
    $m("maint_focus").innerHTML='<b>설비 취약부:</b> '+esc(eq.focus)+'<br><b>선택한 생산 시퀀스:</b> '+esc(prof.desc);
    const seqSummary=state.sequence.map((r,i)=>(i+1)+". "+r.name+" ("+r.load+"%, "+r.hours+"h): "+r.condition).join(" → ");
    const extras=prof.extra.map(x=>'<li>'+esc(x)+'</li>').join("");
    $m("maint_sequence_note").innerHTML='<b>입력한 생산 순서</b><p>'+esc(seqSummary||"생산 단계 미입력")+'</p><b>시퀀스별 추가 확인</b><ul>'+extras+'</ul><b>주요 위험 신호</b><ul>'+eq.risks.map(x=>'<li>'+esc(x)+'</li>').join("")+'</ul>';
    $m("maint_inspection").innerHTML=eq.inspect.map((x,i)=>'<label class="maint-check"><input type="checkbox" data-check="insp-'+state.key+'-'+i+'" '+(state.checks['insp-'+state.key+'-'+i]?'checked':'')+'><span>'+esc(x)+'</span></label>').join("");
    const filtered=stages.map((s,i)=>({...s,index:i})).filter(s=>{
      const hay=(s.name+" "+s.when+" "+s.owner+" "+s.tasks.join(" ")).toLowerCase();
      return !q||hay.includes(q);
    });
    const done=stages.reduce((n,s)=>n+s.tasks.filter((_,i)=>state.checks[s.id+"-"+i]).length,0);
    const total=stages.reduce((n,s)=>n+s.tasks.length,0);
    $m("maint_progress").textContent=done+" / "+total+" 준비 항목 완료";
    $m("maint_bar").style.width=(total?100*done/total:0)+"%";
    $m("maint_stages").innerHTML=filtered.map(s=>{
      const tasks=s.tasks.map((t,i)=>{
        const id=s.id+"-"+i,checked=!!state.checks[id];
        return '<label class="maint-check"><input type="checkbox" data-check="'+id+'" '+(checked?'checked':'')+'><span>'+esc(t)+'</span></label>';
      }).join("");
      return '<details class="maint-stage" '+(s.index<3?'open':'')+'><summary><span class="maint-when">'+esc(s.when)+'</span><b>'+esc(s.name)+'</b><small>'+esc(s.owner)+'</small></summary><div class="maint-stage-body">'+tasks+'<div class="maint-gate"><b>완료 확인점</b> · '+esc(s.gate)+'</div></div></details>';
    }).join("")||'<p class="note">검색 조건에 맞는 단계가 없습니다.</p>';
    $m("maint_stages").querySelectorAll("[data-check]").forEach(el=>el.onchange=e=>{state.checks[e.target.dataset.check]=e.target.checked;paint()});
    $m("maint_inspection").querySelectorAll("[data-check]").forEach(el=>el.onchange=e=>{state.checks[e.target.dataset.check]=e.target.checked;paint()});
  }
  window.maintenanceRender=render;
})();
