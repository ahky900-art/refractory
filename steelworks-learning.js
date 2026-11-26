/* Educational steelworks process and refractory damage explorer.
 * Schematic only: plant-specific drawings and approved limits take precedence.
 */
(() => {
 const $=id=>document.getElementById(id);
 const stages=[
 {id:"raw",name:"원료처리",sub:"소결·코크스·펠릿",caption:"철광석·소결광·펠릿과 코크스를 준비해 고로에 장입합니다.",equipment:"소결기·코크스 오븐·원료 이송계통",damage:["고온 설비가 있는 소결 공정에서는 열충격·마모·알칼리 부착이 문제가 될 수 있습니다.","이송 슈트·호퍼는 원료 입도와 낙하 충격에 따른 마모를 확인합니다."],inspect:"내화물 대상 설비를 선택할 때는 소결기 후드·덕트 등 실제 적용 설비를 특정해야 합니다.",windows:[["정기 보수","소결기·코크스 설비별 계획 정지와 냉각·가스 차단 후 작업"],["운전 중 점검","외부 쉘·덕트 온도, 누풍·균열 징후를 비접촉 방식으로 확인"],["제약","가스·분진·고온 표면과 회전체 격리, 밀폐공간 허가"]],kind:"raw"},
 {id:"bf",name:"고로",sub:"용선 생산",caption:"철광석·코크스·송풍으로 용선을 만들고 슬래그를 분리합니다.",equipment:"고로 노체·노상·풍구·출선구",damage:["노상·노벽: 용선/슬래그 침투, 용해·침식, 열응력에 따른 마모","풍구 주변: 고온 열부하와 국부 열충격, 냉각계 이상 시 국부 과열","출선구: 반복 개공·폐쇄와 용선 흐름에 따른 침식"],inspect:"노상 온도·열전대, 냉각수 회수 조건, 쉘 온도, 출선구 상태, 잔여 캠페인 수명을 함께 확인합니다.",windows:[["운전 중 점검","쉘 열화상·냉각수·열전대 추세를 통한 외부 감시"],["계획 보수","송풍·출선 계획, 용선 처리, 노체 냉각·가스 프리 계획과 연계"],["대규모 개수","휴풍·잔선 처리·냉각·가스 치환 및 구조·냉각설비 점검이 필요한 장기 정지"]],kind:"bf"},
 {id:"torpedo",name:"용선 운송",sub:"토페도카·용선차",caption:"고로 용선을 제강 공장까지 운송하며 내화물은 용선과 슬래그에 반복 노출됩니다.",equipment:"토페도카 내장 라이닝·주입구",damage:["용선 접촉부: 용해·침투·화학 침식","주입구·슬래그 라인: 흐름 집중과 열충격에 따른 국부 마모","운송·회전 충격: 균열·박락 가능성"],inspect:"잔여 두께, 주입구 형상, 슬래그 라인 침식, 쉘 온도와 외관 변형을 확인합니다.",windows:[["턴어라운드","용선 배출 후 예열·건조·운송 배차와 맞춘 점검"],["정기 라이닝 보수","차량 회전율과 예비 토페도카 확보를 전제로 교체·재라이닝"],["제약","용선 잔류물·고온·운송 안전, 예열·건조 절차"]],kind:"torpedo"},
 {id:"bof",name:"전로",sub:"산소 취련·정련",caption:"용선과 고철에 산소를 불어 탄소·불순물을 제거하고 용강을 만듭니다.",equipment:"전로 용기·장입구·출강구·슬래그 라인",damage:["슬래그 라인: 염기도·FeO·온도·슬래그 체류에 따른 화학 용해","장입구·출강구: 충돌·유동에 따른 기계적 침식","취련 중 열충격·스플래시: 박락·균열"],inspect:"슬래그 라인과 출강구 잔여 두께, 핫스팟, 슬래그 스플래시 패턴, 용기 기울임 장치와 쉘 상태를 확인합니다.",windows:[["히트 사이","출강 후 용기 회전·슬래그 제거 및 짧은 검사 창(현장 운전 방식에 따름)"],["캠페인 보수","취련 일정과 예비 전로·생산 여력을 고려해 부분 보수 또는 재라이닝"],["제약","전로 내부 잔류 용강·슬래그, 냉각, 가스 측정 및 용기 회전 안전"]],kind:"bof"},
 {id:"ladle",name:"래들",sub:"출강·운반·정련",caption:"전로에서 받은 용강을 운반하고 필요 시 LF/RH 등에서 성분·온도를 조정합니다.",equipment:"래들 작업층·영구층·단열층·철피",damage:["슬래그 라인: 슬래그 조성·온도·체류시간에 따른 MgO계 내화물 용해","용강 접촉부: 유동·교반 가스에 의한 침식 및 탄소 산화","바닥·노즐 주변: 충돌·유동 집중, 열충격과 국부 마모"],inspect:"슬래그 라인 잔여 두께, 벽돌 조인트, 바닥·노즐, 쉘 온도, 열화상 이상점을 확인합니다.",windows:[["래들 회전 구간","용강 배출 후 검사·청소·예열 및 다음 출강 전 정비 가능 범위 확인"],["예비 래들 투입","생산 여유와 래들 풀(pool)을 고려해 정기 재라이닝·건조"],["제약","다음 히트 투입 시각, 예열기 용량, 건조·승온 곡선과 예비 래들 수"]],kind:"ladle"},
 {id:"ccm",name:"연주",sub:"턴디시·몰드·주조",caption:"용강을 연속 주조해 슬래브·블룸·빌릿으로 응고시킵니다.",equipment:"턴디시·노즐·몰드·침지노즐",damage:["턴디시: 용강·슬래그 침식, 국부 유동과 온도 변화에 따른 마모","노즐: 막힘·침식·열충격, 유량 불안정","몰드: 내화물보다 구리판·냉각·코팅 등 별도 손상 체계도 중요"],inspect:"턴디시 잔여 라이닝·노즐 상태, 주조 시퀀스 길이, 온도·유량·막힘 이력을 확인합니다.",windows:[["캐스트 종료","주조 시퀀스 종료 후 턴디시 배출·냉각·청소·검사"],["시퀀스 사이","턴디시 교체·예열·건조와 다음 주조 개시 시각을 맞춤"],["제약","연속주조 중단 비용, 예비 턴디시·노즐 재고, 예열·건조 시간"]],kind:"ccm"},
 {id:"rh",name:"가열로",sub:"슬래브 재가열",caption:"압연 전 슬래브를 목표 온도까지 가열해 온도 균일성을 확보합니다.",equipment:"가열로 노상·측벽·천장·버너 포트",damage:["노상: 스케일·슬래그 침식, 슬래브 접촉과 열사이클","천장·측벽: 열충격·크리프·버너 화염 충돌과 박락","버너 포트·도어: 국부 고온·누풍·기계적 손상"],inspect:"천장·측벽 균열, 버너 블록, 노상 두께·스케일, 쉘 핫스팟과 온도 편차를 확인합니다.",windows:[["제품 전환·계획 감산","장입 중단 후 퍼지·냉각이 확보되는 구간에서 점검 범위 제한"],["정기 정지","압연 계획·슬래브 재고와 연계해 노상·천장 부분 보수"],["제약","냉각·연료 차단·퍼지, 노 내부 온도, 비계·건조 승온 일정"]],kind:"rh"},
 {id:"rolling",name:"압연",sub:"조압연·사상압연",caption:"재가열된 슬래브를 압연해 판재·코일 등 제품 형상과 두께를 만듭니다.",equipment:"가열로 출구·롤·냉각·이송계통",damage:["롤·가이드 등은 내화물보다 기계적 마모·열피로가 주요 관리 대상","열처리로·가열 설비가 포함된 경우 해당 노체 내화물 손상 관리"],inspect:"압연기 롤·베어링·가이드·냉각계와 연계 설비의 내화물 적용 범위를 구분합니다.",windows:[["롤 교체·라인 정지","제품 규격 전환·롤 교체·정기 정지와 연계"],["운전 중 감시","진동·온도·표면 결함·냉각수 추세"],["제약","생산량·제품 납기·라인 밸런스와 정지 손실"]],kind:"rolling"}
 ];
 const details={
 bf:{title:"고로 노체 수직 단면(개념)",note:"실제 고로는 노구·샤프트·벨리·보시·노상 형상과 냉각 구조가 복잡합니다. 아래는 노체 라이닝과 냉각/쉘의 층 관계를 단순화한 교육용 단면입니다.",labels:["노구","샤프트","벨리","보시","노상"],damage:"노상·보시의 침투/용해와 쉘·냉각계 상태가 장기 캠페인 관리의 핵심입니다."},
 torpedo:{title:"토페도카 횡단면(개념)",note:"용선 운송용 토페도카의 내화물 층과 용선 공간을 단순화했습니다.",labels:["쉘","영구층","작업층","용선"],damage:"주입구와 슬래그 라인에 유동·열충격이 집중될 수 있습니다."},
 bof:{title:"전로 용기 단면(개념)",note:"전로 쉘 안쪽의 영구층·작업층과 용강/슬래그 영역을 표현한 개념도입니다.",labels:["전로 쉘","영구층","작업층","슬래그 라인","용강"],damage:"슬래그 라인·장입구·출강구가 서로 다른 손상 조건을 가집니다."},
 ladle:{title:"래들 수직 단면(개념)",note:"작업층·영구층·단열층·철피의 층 구조와 슬래그 라인 손상 예시입니다.",labels:["철피","단열층","영구층","작업층","슬래그/용강"],damage:"실제 두께·재질은 래들 설계 및 공급사 승인 사양을 확인해야 합니다."},
 ccm:{title:"턴디시 단면(개념)",note:"턴디시 용강 공간과 작업층·영구층·철피를 단순화했습니다. 몰드 자체는 구리판·냉각 구조이므로 별도 설비로 구분합니다.",labels:["철피","영구층","작업층","용강"],damage:"노즐 막힘과 턴디시 라이닝 손상은 주조 시퀀스와 함께 봐야 합니다."},
 rh:{title:"가열로 노상·측벽 단면(개념)",note:"노상·측벽·천장과 버너 열원을 단순화한 개념도입니다.",labels:["철피/구조","단열층","작업층","화염/슬래브"],damage:"천장·버너 포트의 열충격과 노상 스케일 침식은 다른 방식으로 관리합니다."},
 raw:{title:"원료 설비 개념 단면",note:"원료처리 설비는 공정별 설계가 달라 특정 설비 도면 없이 공통 단면을 확정할 수 없습니다.",labels:["철골/덕트","내화물 적용부(설비별)","원료/가스"],damage:"실제 내화물 적용 설비를 먼저 특정해야 손상·정비 모델을 구성할 수 있습니다."},
 rolling:{title:"압연 라인 설비 개념",note:"압연 본체는 내화물 설비가 아닐 수 있습니다. 연계 가열·열처리로를 구분해서 관리합니다.",labels:["압연기","롤/가이드","연계 가열로"],damage:"내화물 정비 대상과 기계 설비 정비 대상을 분리해야 모델의 범위가 정확해집니다."}
 };
 function sectionSvg(kind){
  const shell="#8e9aa3",backup="#d4c4a1",hot="#c58a4c",metal="#ec7b3c",red="#f14c4c",dark="#18212a";
  const rect=(x,y,w,h,c,stroke="#e8e8e8",rx=2)=>'<rect x="'+x+'" y="'+y+'" width="'+w+'" height="'+h+'" rx="'+rx+'" fill="'+c+'" stroke="'+stroke+'" stroke-width="1.5"/>';
  const text=(x,y,t,size=11,c="#fff",anchor="middle")=>'<text x="'+x+'" y="'+y+'" fill="'+c+'" font-size="'+size+'" text-anchor="'+anchor+'" font-family="Arial,sans-serif">'+t+'</text>';
  let s='<svg viewBox="0 0 520 320" role="img" aria-label="설비 단면 개념도"><defs><pattern id="swHatch" width="7" height="7" patternUnits="userSpaceOnUse"><path d="M0 7L7 0" stroke="#f14c4c" stroke-width="1.2"/></pattern></defs>';
  if(kind==="ladle"||kind==="torpedo"){
   s+='<path d="M110 45 L145 270 Q260 300 375 270 L410 45" fill="none" stroke="'+shell+'" stroke-width="20"/>';
   s+='<path d="M128 48 L160 255 Q260 280 360 255 L392 48" fill="none" stroke="'+backup+'" stroke-width="17"/>';
   s+='<path d="M145 50 L175 240 Q260 265 345 240 L375 50" fill="none" stroke="'+hot+'" stroke-width="20"/>';
   s+='<path d="M177 185 Q260 170 343 185 L350 238 Q260 260 170 238Z" fill="'+metal+'" opacity=".9"/>';
   s+='<path d="M148 112 Q260 95 372 112 L377 132 Q260 116 143 132Z" fill="'+red+'" opacity=".85"/>';
   s+=text(260,24,kind==="ladle"?"래들 단면":"토페도카 단면",15);
   s+=text(260,210,kind==="ladle"?"용강":"용선",13);
   s+='<path d="M365 122 L435 96" stroke="'+red+'" stroke-width="2"/>'+text(442,90,"손상 예시",11,red,"start");
   s+='<path d="M160 85 L80 70" stroke="'+hot+'" stroke-width="2"/>'+text(75,62,"작업층",11,hot,"end");
   s+='<path d="M135 60 L55 42" stroke="'+shell+'" stroke-width="2"/>'+text(50,34,"철피",11,shell,"end");
  } else if(kind==="bof"){
   s+='<path d="M130 45 Q90 230 165 270 Q260 305 355 270 Q430 230 390 45" fill="none" stroke="'+shell+'" stroke-width="22"/>';
   s+='<path d="M150 50 Q120 220 178 250 Q260 278 342 250 Q400 220 370 50" fill="none" stroke="'+backup+'" stroke-width="18"/>';
   s+='<path d="M170 55 Q145 210 190 235 Q260 260 330 235 Q375 210 350 55" fill="none" stroke="'+hot+'" stroke-width="22"/>';
   s+='<path d="M190 190 Q260 175 330 190 L330 232 Q260 255 190 232Z" fill="'+metal+'"/>';
   s+='<path d="M164 115 Q260 95 356 115 L360 135 Q260 118 160 135Z" fill="'+red+'"/>';
   s+='<path d="M260 35 L260 112" stroke="#a9d5dc" stroke-width="5"/>'+text(260,22,"산소 랜스",11);
   s+=text(260,211,"용강",13);
   s+='<path d="M350 122 L430 100" stroke="'+red+'" stroke-width="2"/>'+text(435,94,"슬래그 라인",11,red,"start");
  } else if(kind==="bf"){
   s+='<path d="M180 25 L340 25 L360 105 L410 180 L370 255 L350 290 L170 290 L150 255 L110 180 L160 105Z" fill="none" stroke="'+shell+'" stroke-width="18"/>';
   s+='<path d="M194 40 L326 40 L345 110 L390 180 L350 245 L332 275 L188 275 L170 245 L130 180 L175 110Z" fill="none" stroke="'+backup+'" stroke-width="16"/>';
   s+='<path d="M210 50 L310 50 L328 115 L365 180 L330 238 L315 260 L205 260 L190 238 L155 180 L192 115Z" fill="none" stroke="'+hot+'" stroke-width="20"/>';
   s+='<path d="M205 225 Q260 210 315 225 L315 260 L205 260Z" fill="'+metal+'"/>';
   s+='<path d="M195 198 Q260 188 325 198" stroke="'+red+'" stroke-width="7" fill="none"/>';
   s+=text(260,16,"고로 노체 수직 단면",14);
   s+=text(260,245,"용선·슬래그",11);
   s+='<path d="M328 200 L420 180" stroke="'+red+'" stroke-width="2"/>'+text(424,174,"마모/침투",11,red,"start");
  } else if(kind==="ccm"){
   s+=rect(95,70,330,190,shell)+rect(110,85,300,160,backup)+rect(128,103,264,130,hot);
   s+='<path d="M130 150 Q260 135 390 150 L390 230 L130 230Z" fill="'+metal+'"/>';
   s+=text(260,55,"턴디시 단면",15)+text(260,190,"용강",14);
   s+='<path d="M350 105 L435 70" stroke="'+red+'" stroke-width="2"/>'+text(440,64,"작업층 손상",10,red,"start");
   s+=rect(245,232,30,52,shell)+text(260,304,"노즐",10);
  } else if(kind==="rh"){
   s+=rect(80,55,360,220,shell)+rect(98,73,324,184,backup)+rect(118,93,284,145,hot);
   s+='<path d="M150 170 Q260 120 370 170 L370 220 L150 220Z" fill="'+metal+'" opacity=".85"/>';
   s+='<path d="M150 115 Q260 70 370 115" stroke="'+red+'" stroke-width="7" fill="none"/>';
   s+='<path d="M35 145 L115 145" stroke="#ffb05c" stroke-width="9"/><path d="M35 145 L115 145" stroke="#fff0bd" stroke-width="2"/>';
   s+=text(260,38,"가열로 노상·측벽 단면",14)+text(260,200,"슬래브",12);
   s+='<path d="M300 112 L440 85" stroke="'+red+'" stroke-width="2"/>'+text(445,78,"천장 균열/박락",10,red,"start");
  } else {
   s+=rect(90,75,340,180,shell)+rect(108,92,304,146,backup)+rect(128,112,264,105,hot);
   s+=text(260,55,kind==="raw"?"원료 설비 개념":"압연 라인 개념",15);
   s+=text(260,175,kind==="raw"?"원료·가스 흐름":"롤·가이드",13);
   s+=text(260,290,"적용 설비별 도면 확인 필요",11,"#d6dce0");
  }
  s+='</svg>';return s;
 }
 let selected="ladle";
 function renderFlow(){
  $("sw_flow").innerHTML=stages.map((s,i)=>'<button class="sw-stage '+(s.id===selected?'active':'')+'" data-sw-stage="'+s.id+'"><span class="sw-num">STEP '+String(i+1).padStart(2,"0")+'</span><b>'+s.name+'</b><small>'+s.sub+'</small></button>').join("");
  $("sw_flow").querySelectorAll("[data-sw-stage]").forEach(b=>b.onclick=()=>{selected=b.dataset.swStage;render()});
 }
 function render(){
  const s=stages.find(x=>x.id===selected)||stages[4],d=details[s.kind];
  renderFlow();
  $("sw_flow_caption").textContent=s.caption+" 주요 설비: "+s.equipment;
  $("sw_eq_tag").textContent=s.name+" · "+s.sub;
  $("sw_section").innerHTML=sectionSvg(s.kind);
  $("sw_section_note").textContent=d.note;
  $("sw_damage").innerHTML=s.damage.map((x,i)=>'<div class="sw-damage-item"><b>'+["주요 손상 경로","부위별 영향","현장 해석"][i]+'</b><p>'+x+'</p></div>').join("");
  $("sw_inspection").innerHTML="<b>점검 데이터 포인트</b>"+s.inspect;
  $("sw_windows").innerHTML=s.windows.map(x=>'<div class="sw-window"><b>'+x[0]+'</b><p>'+x[1]+'</p></div>').join("");
 }
 function escHtml(v){return String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
 function renderSchedule(){
  const box=$("sw_schedule_table"),status=$("sw_schedule_status"),fleet=$("sw_fleet_table"),fleetStatus=$("sw_fleet_status");
  if(!box||!status)return;
  const seq=typeof window.maintenanceGetSequenceForMILP==="function"?window.maintenanceGetSequenceForMILP():[];
  const jobs=typeof window.maintenanceGetJobsForMILP==="function"?window.maintenanceGetJobsForMILP():[];
  const solution=window.maintenanceLastMILPAssignments;
  const assigned=solution&&Array.isArray(solution.chosen)?solution.chosen:[];
  const cond=[
   {thick:"82",temp:"185",grade:"주의",cls:"critical",note:"슬래그 라인 마모·쉘 온도 추세 확인"},
   {thick:"95",temp:"160",grade:"관찰",cls:"",note:"두께 추세 관찰·다음 정비창 검토"},
   {thick:"110",temp:"145",grade:"양호",cls:"ok",note:"정상 운전·정기 점검"},
   {thick:"125",temp:"130",grade:"양호",cls:"ok",note:"정상 운전·정기 점검"}
  ];
  if(fleet&&fleetStatus){
   fleetStatus.textContent=solution?"MILP 입력 설비 "+jobs.length+"대 · 정비 배정 "+assigned.length+"대 · 솔버 "+solution.status:"4대 래들 예시 컨디션. MILP 계산 전이며, 아래 RUL·정비시간이 계산 입력값입니다.";
   fleet.innerHTML='<table class="sw-fleet-table"><thead><tr><th>설비</th><th>내화물 잔여두께</th><th>쉘 온도</th><th>컨디션</th><th>RUL</th><th>정비시간</th><th>정비 배정</th><th>판정 근거/점검</th></tr></thead><tbody>'+
    jobs.map((job,i)=>{const c=cond[i]||{thick:"-",temp:"-",grade:"입력 필요",cls:"",note:"현장 실측값 입력"};const chosen=assigned.find(a=>a.name===job.name);return '<tr><td><b>'+escHtml(job.name)+'</b></td><td>'+(c.thick==="-"?"-":c.thick+" mm")+'</td><td>'+(c.temp==="-"?"-":c.temp+" °C")+'</td><td><span class="sw-condition-pill '+c.cls+'">'+c.grade+'</span></td><td><b>'+escHtml(job.life)+' h</b></td><td>'+escHtml(job.duration)+' h</td><td>'+(chosen?'<span class="sw-assigned">제'+chosen.period+' 정비창</span>':'<span class="sw-not-assigned">미배정</span>')+'</td><td>'+c.note+'</td></tr>'}).join("")+
   '</tbody></table>';
  }
  if(!seq.length){status.textContent="생산 시퀀스가 없습니다. 생산 시퀀스를 먼저 입력하세요.";box.innerHTML="";return;}
  status.textContent=solution?"MILP 결과: "+solution.status+" · 목적함수 "+Number(solution.objective).toFixed(1)+"만원 · 래들 정비 "+assigned.length+"대 배정":"생산 시퀀스 "+seq.length+"단계 · MILP 계산 전입니다. 계산 후 래들별 정비창이 채워집니다.";
  const headers=seq.map((p,i)=>'<th>제'+(i+1)+' 정비창<br><small>'+escHtml(p.name)+'</small><br><small>가용 '+Number(p.window).toFixed(1)+'h</small></th>').join("");
  const rows=jobs.map((job,i)=>{
   const c=cond[i]||{thick:"-",temp:"-",grade:"-",cls:""};
   const a=assigned.find(x=>x.name===job.name);
   const cells=seq.map((p,t)=>{const hit=a&&a.period===t+1;return '<td class="'+(hit?'sw-has-job':'')+'">'+(hit?'<b class="sw-assigned">정비 '+Number(a.duration).toFixed(1)+'h</b><div class="sw-small">비용 '+Number(a.cost).toFixed(0)+'만원</div>': '<span class="sw-not-assigned">—</span>')+'</td>'}).join("");
   return '<tr><td><b>'+escHtml(job.name)+'</b><div class="sw-small">'+c.grade+' · 잔여 '+escHtml(job.life)+'h</div></td><td>'+escHtml(job.duration)+'h</td>'+cells+'<td>'+(a?'제'+a.period+' 창 배정':'미배정')+'</td></tr>';
  }).join("");
  box.innerHTML='<table><thead><tr><th>래들 / 컨디션</th><th>필요 정비시간</th>'+headers+'<th>최종 MILP 판정</th></tr></thead><tbody>'+rows+'</tbody></table>'+
   '<div class="sw-small" style="margin-top:8px">생산 단계 조건: '+seq.map((p,i)=>'제'+(i+1)+' '+escHtml(p.condition)+' ('+p.load+'%, '+p.hours+'h)').join('　/　')+'</div>';
 }
 window.addEventListener("maintenance-sequence-updated",()=>{window.maintenanceLastMILPAssignments=null;renderSchedule();});
 window.addEventListener("maintenance-milp-result",renderSchedule);
 function init(){
  if(!$("sw_flow"))return;
  render();renderSchedule();
  $("sw_go_milp").onclick=()=>{if(typeof window.showTab==="function")window.showTab("maintenance");const p=$("milp_panel");if(p)p.scrollIntoView({behavior:"smooth",block:"start"});};
 }
 window.steelworksLearningRender=render;
 if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init);else init();
})();
