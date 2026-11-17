/* Research-informed refractory ontology overlay.
 * Adds richer factor -> process state -> damage mechanism -> damage -> zone paths.
 * Existing equipment models, drawings, calculations and maintenance planner are untouched.
 * Qualitative knowledge graph only; site-specific causal strength requires operating/inspection data.
 */
(() => {
  const $ = id => document.getElementById(id);
  const esc = v => String(v ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const C = {prod:"#2878c8", maint:"#8064b2", state:"#64748b", mech:"#dc7b35", damage:"#bd4e45", zone:"#16866a"};
  const SOURCES = [
    {id:"hd",title:"HD현대·팔란티어 스마트 조선소 협력 공식 발표",year:"2022",url:"https://esg.hd.com/ko/news/591",note:"Foundry 도입과 전 공정 디지털트윈 구현을 발표한 HD현대 공식 자료. 구체적인 내화물 손상 메커니즘 근거가 아니라 운영 온톨로지 벤치마크."},
    {id:"pal",title:"Palantir Foundry Ontology 공식 구조",year:"공식 문서",url:"https://www.palantir.com/docs/foundry/ontology/overview",note:"현실의 설비·제품·주문을 객체/속성/링크로 표현하고 액션·함수로 업무 실행까지 연결하는 설계 원칙."},
    {id:"hdreport",title:"미래에셋증권: 팔란티어 온톨로지를 접목한 제조업 사례",year:"산업 리서치",url:"https://securities.miraeasset.com/bbs/download/2138489.pdf?attachmentId=2138489",note:"HD현대 조선소 생산 프로세스 시각화와 공정 병목·일정 준수 관리 사례를 설명하는 2차 자료."},
    {id:"sic",title:"SiC 내화물의 수증기 산화·용융 알칼리 부식 저항 연구",year:"2026",url:"https://www.sciencedirect.com/science/article/pii/S0955221925006855",note:"SiC 내화물의 수증기 산화 및 용융 Na₂SO₄ 부식 저항을 실험한 연구. 소각로 적용성은 실제 가스·염 조성 및 온도 조건을 추가 검증해야 함."},
    {id:"kiln",title:"유성 슬러지 소각 로타리 킬른 내화물 침식",year:"2023",url:"https://www.sciencedirect.com/science/article/pii/S0956053X23002817",note:"유성 슬러지 유래 용융물이 벽돌 침식을 유발하고, 1350°C·36시간 소성 조건에서 침식 깊이 3.1 mm가 보고됨. 특정 실험 조건의 결과."},
    {id:"feo",title:"FeOx 고함량 슬래그의 동적 내화물 마모",year:"2020",url:"https://journals.sagepub.com/doi/10.1080/03019233.2020.1827672",note:"FeOx는 슬래그 점도·젖음성·저융점 반응상 및 침투/용손에 영향을 줌. 재질별 반응 차이가 큼."},
    {id:"ladle",title:"래들 Al₂O₃-MgO 스피넬 형성 내화물 마모",year:"2013",url:"https://doi.org/10.1051/METAL/2013081",note:"슬래그 침투와 CA₂/CA₆ 반응상 체적 변화가 매크로 균열 및 추가 침투를 촉진할 수 있음."},
    {id:"grate",title:"폐기물 소각시설 화격자 고온 부식 파손 분석",year:"2024",url:"https://www.sciencedirect.com/science/article/pii/S1350630724008690",note:"화격자 금속의 용융염 부식·스케일·입계부식 사례. 내화물 자체의 직접 손상 연구가 아니라 인접 고온부식 환경의 증거로만 사용."},
    {id:"incslag",title:"고염 유기폐액 소각로 내화물 침식 연구",year:"2022",url:"https://cje.ustb.edu.cn/en/article/doi/10.13374/j.issn2095-9389.2022.06.09.001",note:"염 함유 슬래그가 기공을 통해 침투해 1000–1300°C에서 저융점 액상을 형성하고 열응력 차이와 박락을 유발하는 메커니즘 제시."},
    {id:"steel",title:"래들 슬래그 라인 MgO-C 내화물의 통계·사후 분석",year:"2017",url:"https://www.sciencedirect.com/science/article/abs/pii/S1350630716305623",note:"저황강 생산 과정의 네펠린 플럭스 및 Na가 풍부한 Ca-Al-Si 슬래그가 MgO 입자 부식을 촉진한 산업 사례."}
  ];
  const Z = {
    ladle:["슬래그 라인","용강 접촉 측벽","바닥·노즐 주변"],
    kiln:["입구/예열대","상부 전이·안전대","소성대","하부 전이대","출구/노즈링"],
    rfcc:["에어그리드·하부 헤드","덴스 베드","전이 콘","희박상(프리보드)","사이클론 (내부)","사이클론 출구/플레넘"],
    inc:["연소실·킬른","2차 연소실","입구·출구","슬래그·회분 접촉부"],
    inc_melt:["용융실·용융조","슬래그 라인","출탕구·배출구","버너·화염 충돌부"],
    inc_grate:["화격자 상부 연소실","후연소실","측벽·천장","재 배출부·호퍼"],
    rh:["가열대·균열대","버너 블록·포트","노상·스키드 주변","도어·전이부"],
    bf:["노상·용선 접촉부","출선구","풍구·보시","벨리·샤프트"],
    sr:["버너·연소실","촉매 지지부","출구 전이부","상부 돔·콘"],
    ab:["버너 타일·전면 헤드","주 연소실","Checker brick 격자","출구 전이부·W.H.B. 연결부"],
    cfb:["하부 노·베드","내화물-수냉벽 전이부","사이클론 접선부","루프실·딥레그","입구 덕트"]
  };
  const P = (kind,factor,change,state,mechanism,damage,zone,condition,evidence,confidence="문헌 메커니즘",severity="증가") =>
    ({kind,factor,change,state,mechanism,damage,zone,condition,evidence,confidence,severity});
  const DATA = {
    ladle:[
      P("prod","슬래그 FeOx·SiO₂ 증가","↑","슬래그 점도·젖음성 변화 및 저융점 반응상 형성","MgO 용해·입계 침투·반응층 박리","슬래그 라인 용손·침투층 확대","슬래그 라인","슬래그 염기도, MgO 포화도, 온도 및 유동 조건과 함께 판단","feo;steel"),
      P("prod","교반 가스 유량·교반 시간","↑","벽면 전단응력 및 슬래그/용강 물질전달 증가","침식·용해 경계층 제거","슬래그 라인 국부 침식 가속","슬래그 라인·용강 접촉 측벽","가스 유량만이 아니라 플러그 위치·기포 패턴·교반 시간 포함","steel"),
      P("prod","출강 온도·고온 유지시간","↑","내화물-용강/슬래그 계면 반응속도 증가","화학적 용해·산화 및 침투 촉진","용손·잔존 두께 감소","용강 접촉 측벽·슬래그 라인","재질별 상평형·슬래그 조성과 함께 해석","feo"),
      P("prod","래들 대기·냉각 시간 및 재가열 속도","급격한 변화·반복 ↑","내화물 내외부 온도 구배와 열팽창 차이 증가","열피로·열충격","균열·스폴링·벽돌 탈락","용강 접촉 측벽·바닥","현재 래들 열모델은 열충격 박락을 직접 계산하지 않음","ladle"),
      P("maint","벽돌 기공률·조인트 개방·탄소 산화","↑","슬래그 침투 경로 및 반응 면적 증가","침투 후 용해·구조 약화","침투층 확대·박리","슬래그 라인","재질의 겉보기 기공률·조직·시공 조인트를 함께 검사","feo")
    ],
    kiln:[
      P("prod","슬러지·원료의 Fe/알칼리/염류 및 회분 조성","용융상 형성 가능 성분 ↑","저융점 액상·점착성 용융물 생성","액상 침투·용해·클링커 부착","벽돌 침식·코팅/링 형성 악화","소성대·전이대","원료 XRF/회분 융점·점도 및 킬른 온도 동시 확인","kiln"),
      P("prod","원료 처리량·가스 유속·분진 부하","↑","고체 입자 충돌 빈도와 벽면 전단 증가","마모·침식","입구/예열대 라이닝 두께 감소","입구/예열대","입도·분진량·유속·벽면 각도에 따라 영향이 달라짐","kiln"),
      P("prod","소성 온도·고온 체류시간","↑","클링커 액상량 및 벽돌 계면 반응 증가","열화학적 용손·침투","소성대 용손·코팅 불안정","소성대","코팅은 보호 기능도 있으므로 액상량 증가=항상 손상 증가로 단정 금지","kiln"),
      P("prod","기동·정지 횟수 및 승강온 속도","급격한 변화·반복 ↑","벽돌·쉘·코팅 사이 열팽창 차이 증가","열피로·코팅 박리","전이대 균열·스폴링","상부/하부 전이대","쉘 온도·정지 이력·벽돌 종류를 결합","kiln"),
      P("maint","벽돌 조인트·타원도·쉘 정렬·코팅 유지","불량·편차 ↑","국부 응력·가스 우회·열점 형성","기계적 균열 및 국부 과열","국부 박락·링 편중·쉘 핫스팟","전이대·출구/노즈링","정비 후 타원도/정렬·조인트·코팅 상태 기록","kiln")
    ],
    rfcc:[
      P("prod","촉매 순환량·입자 속도·분진 농도","↑","고체 입자 충돌 운동량·벽면 전단 증가","고속 입자 침식","캐스터블 라이닝 국부 두께 감소","사이클론·전이 콘·덴스 베드","입자 속도는 침식에 비선형 영향을 주므로 유량만으로 추정하지 않음","steel"),
      P("prod","재생기 후연소·국부 O₂·온도","↑","희박상/사이클론의 국부 과열 및 산화 분위기 강화","소결·산화·열화학적 균열","핫스팟·균열·박락","희박상·사이클론 상부","O₂, CO, 온도 분포, 촉매 후연소 위치 확인","sic"),
      P("prod","촉매 입도·응집·유동 편류","편류·응집 ↑","특정 벽면 충돌과 마찰 집중","국부 침식·마모","타깃벽·접선부의 편중 마모","사이클론 접선부·타깃벽","차압·촉매 손실·분배기 상태를 보조 지표로 사용","steel"),
      P("prod","기동·정지·재생 온도 변화","반복·급격 ↑","라이닝 층간 온도 구배 및 앵커 변형","열충격·층간 박리","캐스터블 박락·앵커 주변 균열","전이 콘·덴스 베드","승온/냉각 속도와 다층 라이닝 두께 고려","sic"),
      P("maint","앵커·헥스메시 부식/간격·캐스터블 두께","열화·불균일 ↑","라이닝 지지력 저하 및 열팽창 구속 변화","앵커 파손·박리","대면적 라이닝 탈락","전이 콘·희박상","앵커 재질·용접·간격과 시공 로트 확인","sic")
    ],
    inc:[
      P("prod","폐기물 내 Na/K/Cl/S 및 회분 조성","↑","알칼리염·황산염·염화물 함유 침착물/저융점 액상 형성","용융염 부식·기공 침투·반응층 형성","화학적 용손·표면 박리","연소실·2차 연소실","폐기물 성상과 비산회/바닥재 분석을 분리해 판단","sic"),
      P("prod","폐기물 발열량·수분·투입량 변동","변동폭·빈도 ↑","연소온도와 열유속의 반복 변동","열피로·열충격","균열·스폴링·캐스터블 탈락","연소실·2차 연소실","수분·발열량·투입률과 온도 시계열을 시간 정렬","incslag"),
      P("prod","회분·클링커의 유속·충돌·배출량","↑","벽면 충돌·마찰·전단 및 부착물 탈락","기계적 침식·마모","측벽·하부·배출부 마모","슬래그·회분 접촉부","회분 입도·경도·유속·충돌 각도 필요","kiln"),
      P("prod","연소 온도·산화환원 분위기·체류시간","↑ 또는 급변","슬래그 점도·젖음성·내화물 계면 반응 변화","용해·산화·침투 복합 부식","용손·침투층·박락","2차 연소실·고온 접촉부","재질별로 산화/환원 반응이 달라 단일 방향성 금지","sic;incslag"),
      P("maint","캐스터블 수분·두께·양생·드라이아웃 곡선","수분/두께 ↑ 또는 승온 과속","내부 증기압·온도 구배 증가","폭렬성 스폴링·건조 균열","초기 운전 중 대면적 박락","연소실·2차 연소실","제품·두께·시공법별 제조사 승인 건조 곡선 적용","incslag")
    ],
    inc_melt:[
      P("prod","슬래그 SiO₂·FeOx·알칼리·염기성 성분","조성 변화","슬래그 액상선·점도·젖음성 및 내화물과의 화학적 적합성 변화","용해·확산·침투·저융점 반응층 형성","용융조 벽·바닥의 용손 및 침투층 확대","용융실·용융조","슬래그 조성 분석과 실제 온도에서의 상평형/용융성 확인","feo;incslag"),
      P("prod","용융 온도·용융물 접촉시간","↑","계면 반응 및 용해 속도 증가","화학적 부식·용융 침식","슬래그 라인 후퇴·잔존 두께 감소","슬래그 라인","온도뿐 아니라 포화도·유속·산화환원 조건을 함께 반영","feo"),
      P("prod","출탕 유량·배출 속도·노즐 단면","↑ 또는 편류","출탕구 국부 전단·마찰·온도 구배 증가","유동 침식·열기계적 마모","출탕구 확대·노즐 손상","출탕구·배출구","출탕 패턴·막힘 제거 작업 이력 포함","feo"),
      P("prod","배치 운전·용융물 응고/재용융·급랭","반복 ↑","라이닝 표면 온도 급변 및 응고층의 열팽창 차이","열충격·응고층 박리","균열·스폴링·용융물 부착층 탈락","용융조·슬래그 라인","운전 중단·비상정지·재가열 이벤트 구분","incslag"),
      P("maint","내화물 재질·기공률·침투층/보호층 유지","기공률 ↑ 또는 보호층 손실","용융 슬래그와 반응 가능한 면적·침투 깊이 증가","침투 후 용해 및 구조 약화","용손 가속·국부 관통 위험","용융실·용융조","후시료 분석과 재질 적합성 시험으로 검증","feo")
    ],
    inc_grate:[
      P("prod","폐기물 내 Cl·Na/K·S 및 비산회 조성","↑","알칼리 염화물·황산염 침착과 고온 부식성 환경 강화","용융염 부식·침투·산화","내화물 표면 부식·박리 및 인접 금속부 스케일/입계 부식","화격자 상부 연소실·후연소실","2024 화격자 사례는 금속 그레이팅 손상 근거이며 내화물 손상과 구분","grate;sic"),
      P("prod","폐기물 투입량·낙하 높이·화격자 이동 속도","↑","폐기물/회분의 충돌 에너지와 마찰 빈도 증가","충격·마모·침식","화격자 상부 및 하부 측벽 마모","화격자 상부 연소실·재 배출부","화격자 냉각형식·폐기물 층 두께·낙하 경로 반영","grate"),
      P("prod","연소 공기 분배·국부 화염·온도 편차","편차 ↑","국부 과열과 내화물 내외부 온도 구배 증가","열피로·열충격·산화","균열·박락·핫스팟","측벽·천장·후연소실","1차/2차 공기 분배와 화격자 냉각 데이터 결합","sic"),
      P("prod","바닥재 융점·점착성·클링커 발생량","↑","용융 회분 부착 및 냉각 후 응고·수축","슬래깅·화학 침투·박리","하부 라이닝 용손·재 배출부 막힘","재 배출부·호퍼","회분 융점·염기성/산성 성분 및 배출 온도 확인","incslag"),
      P("maint","SiC계 벽돌/캐스터블 결합계·산화·조인트","산화/열화·개방 ↑","SiC 산화 및 염/알칼리 침투 경로 증가","산화·화학 부식·조인트 침식","표면 열화·균열·국부 탈락","화격자 상부·측벽","SiC 적용은 부위별 산화 분위기·수증기·염류 조건에 적합성 검토","sic")
    ],
    rh:[
      P("prod","버너 화염 길이·방향·공기비·연소 부하","화염 충돌·편류 ↑","버너 포트/천장 국부 열유속 증가","국부 과열·열화학적 열화","버너 블록 균열·천장 핫스팟","버너 블록·가열대","화염 시야·노온 분포·버너 밸런스 함께 점검","steel"),
      P("prod","강재 스케일 발생량·낙하·이송 빈도","↑","FeO계 스케일의 노상 접촉·마찰 증가","용융 스케일 침투·노상 마모","노상·스키드 주변 침식","노상·스키드 주변","강종·가열 온도·스케일 제거 주기 포함","feo"),
      P("prod","장입/추출 주기·저부하 운전·재가열 횟수","반복·변동 ↑","노벽·천장·노상 열사이클 누적","열피로·스폴링","천장·도어·버너 주변 박락","가열대·도어·전이부","온도 램프·정지시간·노내 위치별 온도 편차","steel"),
      P("maint","앵커·버너 타일 조인트·팽창 여유","열화/막힘 ↑","구속 응력 및 국부 열유속 집중","균열·박리·기계적 탈락","버너 블록·천장 국부 탈락","버너 블록·도어","버너 정비 시 타일 정렬·팽창 조인트·앵커 검사","steel")
    ],
    bf:[
      P("prod","슬래그 FeO·SiO₂·알칼리 조성 및 용선 온도","부식성 성분/온도 ↑","용선·슬래그와 카본/탄화규소계 내화물 계면 반응 증가","용해·침투·열화학적 부식","노상·출선구 잔존 두께 감소","노상·용선 접촉부·출선구","슬래그 포화도·냉각 열유속·용선 유동 포함","feo"),
      P("prod","송풍량·가스 유속·장입물 낙하/하강","↑","가스·분진·장입물의 벽면 충돌과 전단 증가","마모·침식","샤프트·보시 국부 마모","벨리·샤프트","입도 분포·가스 분배·장입 편류를 확인","steel"),
      P("prod","출선 빈도·용선 유속·출선구 개공 조건","↑ 또는 편류","출선구 주변 유동·마찰·열부하 집중","기계적 침식·용손","출선구 확대·주변 내화물 손상","출선구","개공 길이·머드건 재료·출선 패턴과 함께 해석","feo"),
      P("prod","휴풍·감풍·재가동 및 냉각 이력","급격한 변화·반복 ↑","노상/샤프트 온도 구배 및 구조 응력 변화","열충격·열피로","균열·박락·벽체 변형","노상·하부 샤프트","휴풍 기간과 냉각/재가열 속도 기록","steel"),
      P("maint","카본 블록 접합부·냉각반/스테이브 열전달","열화·불균일 ↑","열유속 분포·침투 경로·응력 재분배","용선 침투·구조 열화","노상 국부 침식·핫스팟","노상·냉각반 인접부","열전대·냉각수 열수지·쉘 온도와 연계","feo")
    ],
    sr:[
      P("prod","공정가스/스팀 유량·조성·수증기 분압","↑ 또는 변동","라이닝 표면의 화학적 분위기·열전달 변화","가스-고체 반응·휘발/재응축 가능성","표면 열화·균열·국부 핫스팟","연소실·출구 전이부","실제 개질가스 조성·온도·재질 상평형으로 검증","sic"),
      P("prod","버너 부하·화염 편향·출구 온도","↑ 또는 편류","버너 주변 국부 과열·열유속 편차","열화학적 열화·열응력","버너 타일·돔 균열/박락","버너·연소실","버너별 부하·화염 방향·열전대 편차 확인","steel"),
      P("prod","촉매 충전량·차압·가스 분배 편류","↑ 또는 편류","촉매 지지부 하중·국부 유속·가스 우회 증가","기계적 응력·침식·핫스팟","촉매 지지 돔·전이부 손상","촉매 지지부·출구 전이부","차압 상승과 라이닝 온도/가스 우회 흔적 결합","steel"),
      P("prod","트립·정지·재가동·승온 속도","반복·급격 ↑","벽돌·캐스터블·앵커 사이 열팽창 차이","열충격·열피로","균열·분절·박락","상부 돔·콘·전이부","정지 유형과 온도 이력 구분","steel"),
      P("maint","앵커·벽돌 조인트·촉매 지지 구조 건전성","열화 ↑","구속/지지 조건 약화 및 틈새 가스 우회","박리·국부 과열","라이닝 탈락·핫스팟","돔·촉매 지지부","정비 전후 앵커·지지 구조 NDT 및 사진 이력","steel")
    ],
    ab:[
      P("prod","H₂S/SO₂ 비율·공기비·황 증기·불순물","조성/비율 변동","연소실 산화환원 분위기와 황계 가스 분압 변화","황계 가스 반응·화학적 침식 가능성","버너 타일·주 연소실 표면 열화","버너 타일·주 연소실","황 회수 라이선서 운전창·내화물 재질과 함께 검증","sic"),
      P("prod","버너 부하·화염 길이·화염 충돌","충돌/국부 부하 ↑","전면 헤드·측벽의 국부 열유속 증가","국부 과열·열응력","버너 타일 균열·주 연소실 박락","버너 타일·주 연소실","버너 정렬·화염 시야·온도 편차 확인","steel"),
      P("prod","Checker brick 통로 분진·황 침착·차압","침착·차압 ↑","유효 개구율 감소와 가스 유동 편류","국부 유속 증가·열점·막힘","격자 모서리 파손·균열·국부 과열","Checker brick 격자","차압 추세와 실제 통로 개구율·침착물 분석 결합","sic"),
      P("prod","기동·정지·급격한 냉각/재가열","반복·급격 ↑","Checker brick·벽돌·캐스터블의 열구배 증가","열피로·열충격","격자 블록 균열·모서리 박락","Checker brick·출구 전이부","승온/냉각 이력과 버너 트립 로그 정합","steel"),
      P("maint","벽돌 배열·조인트·팽창 여유·건조 품질","불량·편차 ↑","가스 통로 편류·구속응력·수분 증기압 증가","국부 과열·폭렬성 박락","격자 변형·라이닝 탈락","Checker brick·전이부","라이선서 배열도·제조사 건조곡선·검사 hold point 준수","steel")
    ],
    cfb:[
      P("prod","순환재 유량·입자 속도·고형물 농도","↑","고속 입자 충돌 운동량·벽면 전단 증가","입자 침식·마모","사이클론 접선부·덕트 라이닝 두께 감소","사이클론 접선부·입구 덕트","입자 크기·속도·방향 및 라이닝 경도 확인","steel"),
      P("prod","연료 회분의 Na/K/Cl/S 및 융점","부식성 성분·저융점 분율 ↑","알칼리염·황산염 침착 및 액상 형성","화학적 부식·침투","베드·전이부 라이닝 용손","하부 노·내화물-수냉벽 전이부","회분 XRF·융점·운전 온도와 비교","sic"),
      P("prod","베드 온도·국부 후연소·공기 분배","편차·과열 ↑","국부 고온·산화 분위기 및 열유속 집중","열화학적 열화·열응력","핫스팟·균열·박락","하부 노·사이클론","온도·O₂·CO·차압의 공간 편차 분석","sic"),
      P("prod","기동·정지·냉각·재가동 빈도","반복·급격 ↑","다층 라이닝·앵커·수냉벽 사이 열팽창 차이","열피로·층간 박리","전이부·앵커 주변 박락","내화물-수냉벽 전이부","열사이클 수와 냉각속도·쉘/튜브 온도 이력","steel"),
      P("maint","앵커·스터드·용접·캐스터블 수분/건조","열화·불균일 ↑","지지력 저하·증기압·국부 응력 집중","박리·폭렬성 스폴링","대면적 라이닝 탈락","전이부·루프실·딥레그","앵커 검사와 제조사 승인 dry-out 곡선을 필수 연결","sic")
    ]
  };
  const EQNAME = {ladle:"래들",kiln:"로타리 킬른",rfcc:"RFCC 재생기",inc:"소각로",inc_melt:"용융로형 소각로",inc_grate:"화격자형 소각로",rh:"가열로",bf:"고로",sr:"2차 개질로",ab:"Claus Thermal Reactor",cfb:"화력 보일러"};
  const SOURCE_MAP = Object.fromEntries(SOURCES.map(s=>[s.id,s]));
  function addControls(){
    const rel=$("onto_relation");
    if(rel && ![...rel.options].some(o=>o.value==="maint")) rel.insertAdjacentHTML("beforeend",'<option value="maint">정비·시공 영향</option>');
    const host=$("p_ontology");
    if(host && !$("onto_operating_model")){
      const model=document.createElement("div"); model.className="card"; model.id="onto_operating_model"; model.style.marginTop="10px";
      model.innerHTML='<h2>운영 객체 모델 · Palantir식 업무 연결</h2><div class="note">인과 지식 그래프를 실제 업무 객체와 연결해야 운영 온톨로지가 됩니다. 아래는 이 대시보드에 적용할 데이터 모델 설계안이며, 아직 MES·ERP·CMMS 실데이터에 연결된 것은 아닙니다.</div>'+
      '<div style="overflow-x:auto"><table><thead><tr><th>객체 유형</th><th>핵심 속성</th><th>연결 관계</th><th>활용 업무</th></tr></thead><tbody>'+
      '<tr><td><b>Equipment</b><br>설비·구역</td><td>설비ID, 구역ID, 운전한계, 도면좌표</td><td>hasZone → RefractoryLining</td><td>설비별 상태 조회</td></tr>'+
      '<tr><td><b>ProductionRun</b><br>생산 시퀀스</td><td>제품/원료 Lot, 처리량, 시간, 부하</td><td>operates → Equipment</td><td>생산조건 변화 추적</td></tr>'+
      '<tr><td><b>OperatingCondition</b><br>운전 인자</td><td>온도, 유량, 조성, 수분, 입도, 차압</td><td>changes → ProcessState</td><td>손상 경로 탐색</td></tr>'+
      '<tr><td><b>RefractoryLining</b><br>내화물 라이닝</td><td>재질, 로트, 두께, 기공률, 시공일</td><td>installedAt → EquipmentZone</td><td>재질·수명 비교</td></tr>'+
      '<tr><td><b>DamageEvent</b><br>손상 사건</td><td>손상유형, 위치, 깊이, 사진, 발생일</td><td>observedOn → RefractoryLining</td><td>손상 원인·심각도 판정</td></tr>'+
      '<tr><td><b>Inspection</b><br>검사</td><td>실측 두께, 열화상, UT, 판정자</td><td>inspects → EquipmentZone</td><td>모델 보정·이상 감지</td></tr>'+
      '<tr><td><b>WorkOrder</b><br>정비 작업지시</td><td>우선순위, 작업창, 예산, 담당자, 상태</td><td>addresses → DamageEvent</td><td>정비 범위·자원 배치</td></tr>'+
      '<tr><td><b>RepairAction</b><br>보수·시공</td><td>공법, 자재, 작업시간, 양생·건조 이력</td><td>restores → RefractoryLining</td><td>시공 품질·수명 환류</td></tr>'+
      '</tbody></table></div>'+
      '<h3 style="font-size:14px;margin:12px 0 5px">운영 액션(Action) 예시</h3><div class="an">'+
      '<div><b>① 손상 위험 재평가</b>생산 시퀀스·운전 인자 갱신 시 해당 구역 위험도를 다시 계산</div>'+
      '<div><b>② 검사 작업 생성</b>위험도 상승 + 검사 기준 초과 시 점검 WorkOrder 초안 생성</div>'+
      '<div><b>③ 정비안 비교</b>전면 교체·부분 보수·운전조건 조정의 시간/비용/위험 비교</div>'+
      '<div><b>④ 승인·실행·환류</b>담당자 승인 후 CMMS 작업 반영, 검사 결과로 모델 갱신</div></div>'+
      '<div class="note" style="margin-top:8px"><b>필수 링크:</b> ProductionRun → OperatingCondition → DamageMechanism → DamageEvent → Inspection → WorkOrder → RepairAction → RefractoryLining. 각 링크에는 적용 기간, 출처, 신뢰도, 설비 구역, 데이터 버전을 보관해야 합니다.</div>';
      host.appendChild(model);
    }
    if(host && !$("onto_evidence")){
      const card=document.createElement("div"); card.className="card"; card.style.marginTop="10px";
      card.innerHTML='<h2>근거 문헌 및 적용 한계</h2><div id="onto_evidence" class="note"></div>';
      host.appendChild(card);
    }
    const legend=$("p_ontology")?.querySelector(".onto-legend");
    if(legend && !legend.dataset.enhanced){
      legend.innerHTML='<span><i class="onto-dot" style="background:'+C.prod+'"></i>생산 영향 인자</span><span><i class="onto-dot" style="background:'+C.maint+'"></i>정비·시공 인자</span><span><i class="onto-dot" style="background:'+C.state+'"></i>공정 상태 변화</span><span><i class="onto-dot" style="background:'+C.mech+'"></i>손상 메커니즘</span><span><i class="onto-dot" style="background:'+C.damage+'"></i>손상 결과</span><span><i class="onto-dot" style="background:'+C.zone+'"></i>설비 부위</span>';
      legend.dataset.enhanced="1";
    }
    const sub=host?.querySelector(".sub");
    if(sub) sub.textContent="생산·정비 인자의 변화가 공정 상태와 물리·화학적 메커니즘을 거쳐 손상 유형으로 이어지는 관계를 탐색합니다. 경로별 조건·방향·문헌 근거를 확인하세요.";
  }
  function sourceIds(row){return (row.evidence||"").split(";").filter(Boolean);}
  function render(){
    addControls();
    const sel=$("onto_equipment"); if(!sel)return;
    if(!sel.options.length || ![...sel.options].some(o=>o.value==="inc_melt")){
      sel.innerHTML=Object.keys(EQNAME).map(k=>'<option value="'+k+'">'+EQNAME[k]+'</option>').join("");
    } else {
      Object.keys(EQNAME).forEach(k=>{if(![...sel.options].some(o=>o.value===k)){const o=document.createElement("option");o.value=k;o.textContent=EQNAME[k];sel.appendChild(o)}});
    }
    const key=sel.value||"ladle", rows=DATA[key]||[], mode=$("onto_relation")?.value||"all";
    const filtered=rows.filter(r=>mode==="all"||(mode==="wear"&&["입자 침식","기계적","유동 침식"].some(x=>r.mechanism.includes(x)))||(mode==="thermal"&&/열충격|열피로|열팽창/.test(r.mechanism+" "+r.state))||(mode==="chemical"&&/화학|용해|부식|침투|산화|슬래그/.test(r.mechanism+" "+r.state))||(mode==="maint"&&r.kind==="maint"));
    const zoneNames=Z[key]||[];
    const W=1510, rowH=142, H=Math.max(520,filtered.length*rowH+85);
    const xs=[18,275,550,835,1115], ws=[225,240,250,255,360], nh=76;
    let edges="",nodes="",meta={},nid=0;
    const add=(x,y,w,h,color,title,body,info)=>{
      const id="enh"+(nid++);meta[id]=info;
      nodes+='<g class="onto-node" data-enh="'+id+'"><title>'+esc(title+" — "+body)+'</title><rect x="'+x+'" y="'+y+'" width="'+w+'" height="'+h+'" rx="9" fill="'+color+'" stroke="'+color+'"/><text x="'+(x+10)+'" y="'+(y+23)+'"><tspan font-weight="700">'+esc(title.slice(0,31))+'</tspan><tspan x="'+(x+10)+'" dy="20">'+esc(body.slice(0,34))+'</tspan><tspan x="'+(x+10)+'" dy="17" font-size="10">'+esc(info.badge||"")+'</tspan></text></g>';
      return id;
    };
    const labels=["생산/정비 인자","공정 상태 변화","물리·화학 메커니즘","손상 결과","취약 설비 부위"];
    labels.forEach((v,i)=>{nodes+='<text x="'+xs[i]+'" y="25" font-size="13" font-weight="700" fill="var(--ink)">'+v+'</text>'});
    filtered.forEach((r,i)=>{
      const y=45+i*rowH, color=r.kind==="maint"?C.maint:C.prod;
      const badge=(r.kind==="maint"?"정비 인자":"생산 인자")+" · "+r.severity;
      const ids=[
        add(xs[0],y,ws[0],nh,color,r.factor,r.change,{title:r.factor,body:r.change,kind:r.kind,condition:r.condition,detail:"인자 변화 방향: "+r.change,badge}),
        add(xs[1],y,ws[1],nh,C.state,"공정 상태",r.state,{title:"공정 상태 변화",body:r.state,detail:r.condition,badge:"조건부 관계"}),
        add(xs[2],y,ws[2],nh,C.mech,"손상 메커니즘",r.mechanism,{title:"물리·화학 메커니즘",body:r.mechanism,detail:"근거 수준: "+r.confidence,badge:r.confidence}),
        add(xs[3],y,ws[3],nh,C.damage,"예상 손상",r.damage,{title:"내화물 손상 결과",body:r.damage,detail:"정성적 예상 방향: "+r.severity,badge:"실측 검증 필요"}),
        add(xs[4],y,ws[4],nh,C.zone,"취약 부위",r.zone,{title:"설비 취약 부위",body:r.zone,detail:"설비: "+EQNAME[key]+" · 대표 구역 연결은 설비 구성 예시 기준",badge:"부위 매핑"})
      ];
      for(let j=0;j<4;j++){
        const sx=xs[j]+ws[j],tx=xs[j+1],cy=y+nh/2;
        edges+='<path class="onto-edge" marker-end="url(#ontoEnhancedArrow)" d="M '+sx+' '+cy+' C '+(sx+20)+' '+cy+', '+(tx-20)+' '+cy+', '+tx+' '+cy+'"/>';
        edges+='<text class="onto-edge-label" x="'+((sx+tx)/2)+'" y="'+(cy-9)+'" text-anchor="middle">'+["변화시키면","촉진/억제","진행","주요 취약부"][j]+'</text>';
      }
    });
    const zoneY=filtered.map((r,i)=>45+i*rowH+nh/2);
    $("onto_title").textContent=EQNAME[key]+" · 생산-정비-손상 메커니즘 온톨로지";
    $("onto_summary").textContent="표시 경로 "+filtered.length+"개 · 생산 인자 "+filtered.filter(r=>r.kind==="prod").length+"개 · 정비 인자 "+filtered.filter(r=>r.kind==="maint").length+"개. 각 행은 조건부 영향 경로이며 정량적 손상 예측값이 아닙니다.";
    $("onto_graph").innerHTML='<svg viewBox="0 0 '+W+' '+H+'" role="img" aria-label="'+esc(EQNAME[key])+' 생산 정비 손상 온톨로지"><defs><marker id="ontoEnhancedArrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0,0 L0,6 L7,3 z" fill="#9a9a94"/></marker></defs>'+edges+nodes+'</svg>';
    $("onto_graph").querySelectorAll("[data-enh]").forEach(el=>el.addEventListener("click",()=>{
      $("onto_graph").querySelectorAll(".onto-node").forEach(n=>n.classList.remove("selected"));el.classList.add("selected");
      const m=meta[el.dataset.enh];
      const row=filtered[Math.floor(Number(el.dataset.enh.slice(3))/5)];
      let html='<h3>'+esc(m.title)+'</h3><p><b>설명:</b> '+esc(m.body)+'</p>';
      if(m.condition)html+='<p><b>성립 조건·해석:</b> '+esc(m.condition)+'</p>';
      if(m.detail)html+='<p><b>추가 정보:</b> '+esc(m.detail)+'</p>';
      if(row){
        html+='<p><b>경로 전체:</b> '+esc([row.factor+" ("+row.change+")",row.state,row.mechanism,row.damage,row.zone].join(" → "))+'</p>';
        html+='<p><b>근거 수준:</b> '+esc(row.confidence)+' · <b>손상 방향:</b> '+esc(row.severity)+'</p>';
        const refs=sourceIds(row).map(id=>SOURCE_MAP[id]).filter(Boolean);
        if(refs.length)html+='<p><b>연결 문헌:</b> '+refs.map(s=>'<a href="'+esc(s.url)+'" target="_blank" rel="noopener">'+esc(s.title)+'</a>').join(" · ")+'</p>';
      }
      $("onto_info").innerHTML=html;
    }));
    $("onto_info").innerHTML='<h3>그래프 읽는 방법</h3><p>왼쪽에서 오른쪽으로 인자 변화 → 공정 상태 → 손상 메커니즘 → 손상 결과 → 취약 부위 순서입니다. 행을 클릭하면 조건과 문헌 근거를 확인할 수 있습니다.</p><p><b>주의:</b> 화살표는 문헌과 공학 메커니즘에 근거한 조건부 관계입니다. 인자 변화가 손상량을 얼마나 증가시키는지는 해당 설비의 운전·검사 데이터로 검증해야 합니다.</p>';
    const used=new Set(filtered.flatMap(sourceIds));
    $("onto_evidence").innerHTML=SOURCES.filter(s=>used.has(s.id)||["hd","pal","hdreport"].includes(s.id)).map(s=>'<div style="padding:7px 0;border-bottom:1px solid var(--line)"><b><a href="'+esc(s.url)+'" target="_blank" rel="noopener">'+esc(s.title)+'</a></b> <span>('+esc(s.year)+')</span><div>'+esc(s.note)+'</div></div>').join("")+
      '<div style="margin-top:8px"><b>해석 원칙:</b> 문헌의 실험 조건·재질·분위기를 현재 설비에 그대로 일반화하지 않습니다. 화격자 금속 부식 사례는 내화물 손상의 직접 증거로 취급하지 않습니다. “증가”는 정성적 방향이며, 수치 기여도·인과 확정은 현장 데이터 검증 전까지 미제공합니다.</div>';
  }
  $("onto_equipment")?.addEventListener("change",render);
  $("onto_relation")?.addEventListener("change",render);
  const oldShow=window.showTab;
  document.querySelectorAll("#tabs button").forEach(b=>b.addEventListener("click",()=>{if(b.dataset.t==="ontology")render()}));
  if($("onto_equipment"))render();
  window.renderEnhancedOntology=render;
})();