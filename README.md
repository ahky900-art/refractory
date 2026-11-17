<div align="center">

# Refractory Wear & Maintenance Intelligence

**설비 운전조건과 내화물 열화 메커니즘을 연결하는 인터랙티브 분석 프로젝트**

[대시보드 소스](./index.html) · [마모 계산 Streamlit 프로토타입](./app.py) · [아키텍처 시각화](./docs/repo-architecture.svg)

![Refractory project architecture](./docs/repo-architecture.svg)

</div>

## 1. 프로젝트 개요

설비별 운전조건이 내화물 라이닝의 열화에 어떤 영향을 주는지 살펴보고, 마모가 집중되는 부위와 점검·정비 관점을 함께 탐색하는 프로젝트입니다.

단순히 설비별 수명을 숫자로 제시하기보다 **운전조건 → 열·화학·기계적 작용 → 부위별 마모 → 잔여 두께 및 정비 판단**의 연결을 화면에서 추적하는 데 초점을 둡니다.

## 2. 주요 기능

| 분석 영역 | 구현 내용 |
|---|---|
| 설비별 분석 | 래들, 로타리 킬른, RFCC 재생기, 소각로, 가열로, 고로, 2차 개질로, Claus Thermal Reactor, CFB 보일러 |
| 운전조건 시나리오 | 히트 수, 강철량, 출강 온도, 교반 가스, 전력, 운전 스케줄 등 입력 조건 변경 |
| 마모 메커니즘 | 침식, 고온 용해·화학 반응, 코팅, 열충격 등 설비별 작용을 구역별로 표현 |
| 공간·부위 탐색 | 3D 설비 표현, 벽돌 행별 상태, 부위별 잔여 두께와 점검값 확인 |
| 정비 관점 | 철골·맨홀(M/H)·출입구 표시, 정비 진입 위치와 보수 접근 설명 |
| 온톨로지 그래프 | 설비 부위와 열화 메커니즘 간 관계를 노드·엣지로 탐색 |

## 3. 분석 흐름

```mermaid
flowchart LR
    A[운전조건·생산 스케줄] --> B[설비별 열·유동·화학 환경]
    B --> C[내화물 열화 메커니즘]
    C --> D[부위별 마모·잔여 두께]
    D --> E[취약 위치·점검 우선순위]
    E --> F[정비 접근·보수 계획]
```

## 4. 계산 모델과 근거 수준

이 프로젝트는 설비마다 계산 근거의 수준이 다릅니다. 포트폴리오에서는 이 차이를 숨기지 않고 구분합니다.

- **래들 탭:** README 및 대시보드 설명 기준으로 SINTEF 공개 `refractorywear` 모델의 계산 결과를 조건별로 재실행·보간한 결과를 활용합니다. 대시보드에는 보간 오차 안내가 포함되어 있습니다.
- **로타리 킬른·CFB·RFCC·가열로 등:** 열·침식·코팅 등의 메커니즘을 반영한 계산식과 시나리오 모델입니다. 현재 README에 명시된 바와 같이 여러 계수는 가정값이며, 현장 측정값으로 보정·검증해야 합니다.
- **별도 Streamlit 프로토타입(`app.py`):** 코드 주석과 구현상 합성(synthetic) 데이터를 생성하는 데모입니다. 실제 SINTEF 모델을 직접 실행하는 구현이 아니며, 주석에도 실제 모델 호출로 교체해야 한다고 명시되어 있습니다.

따라서 **브라우저 대시보드의 래들 계산 설명과 `app.py`의 합성 데이터 프로토타입을 동일한 검증 수준으로 해석하면 안 됩니다.**

## 5. 기술 구성

- Frontend: HTML, CSS, JavaScript
- Visualization: Three.js, Chart.js
- Formula rendering: MathJax
- Separate prototype: Python, Streamlit, NumPy, Pandas, Plotly

## 6. 실행

### 브라우저 대시보드
저장소의 `index.html`을 브라우저에서 엽니다. 일부 시각화 라이브러리는 CDN을 통해 로드됩니다.

### Streamlit 프로토타입
```bash
pip install -r requirements.txt
streamlit run app.py
```

## 7. 해석 및 적용 시 유의사항

1. 수식 기반 설비 모델의 계수와 경계조건은 실제 설비의 재질·조업·측정 데이터로 보정해야 합니다.
2. 계산된 잔여 두께·수명은 현장 실측과 검증 없이 안전 운전 기준이나 정비 승인값으로 사용해서는 안 됩니다.
3. 정비 진입 위치와 작업 절차는 설비별 도면, 제조사 지침, 현장 안전 절차를 우선해야 합니다.
4. 본 프로젝트는 메커니즘과 데이터 관계를 탐색하는 분석 프로토타입이며, 설비 건전성 평가를 대체하지 않습니다.

## 8. 참고

- [SINTEF / refractorywear](https://github.com/SINTEF/refractorywear) — 래들 모델 관련 공개 코드 및 원 출처. 해당 프로젝트의 라이선스·고지 조건을 준수해야 합니다.
- [Three.js](https://threejs.org/)
- [Chart.js](https://www.chartjs.org/)
- [MathJax](https://www.mathjax.org/)

---

<sub>Portfolio note · 모델 계산 결과, 가정 계수, 합성 데이터, 현장 검증 상태를 구분해 설명합니다.</sub>

## 9. 생산 시퀀스·정비 준비 탭

대시보드에 기존 설비 분석 및 온톨로지 탭을 유지하면서 별도 **생산 시퀀스·정비 준비** 탭을 추가했습니다.

- 설비 선택: 기존 9개 설비(래들, 로타리 킬른, RFCC, 소각로, 가열로, 고로, 2차 개질로, Claus 반응기, CFB)
- 생산 시퀀스: 제품/원료 단계, 분위기 변화, 부하, 운전시간을 입력하고 순서를 편집
- 시퀀스 유형: 정상 연속생산, 제품·원료 전환, 잦은 기동·정지, 단기 증산·고부하
- 정비 준비: 범위 확정 → 기술·자재 준비 → 정지 전 기록·안전계획 → 격리 → 진입·검사 → 철거 → 설치·ITP → 양생·건조 준비 → Dry-out → 재가동 → 사후 검토
- 설비별 집중 점검 항목, 담당 부서, 완료 확인점(hold point), 체크리스트 및 인쇄 기능
- 계획 정지일을 입력하면 단계별 상대 일정을 달력 날짜로 표시

구현은 `maintenance-planning.js`에 독립 모듈로 분리했습니다. 기존 마모 계산·도면·온톨로지 로직은 변경하지 않았습니다. 생산 시퀀스 입력은 계획용으로, 현재 마모 계산 엔진과 자동 연결되지는 않습니다. 입력한 생산 시퀀스와 체크 상태는 현재 브라우저 세션 기반이며 ERP/MES, 서버 DB와 연동되거나 영구 저장되지 않습니다.

### 참고 자료와 적용 한계

- [Refractory Materials Repairer – SKILL.md](https://github.com/wonsukchoi/domain-experts/blob/main/roles/refractory-materials-repairer/SKILL.md): 재질·열화 진단·Dry-out 의사결정 프레임워크 (저장소 표기상 draft)
- [Playbook](https://github.com/wonsukchoi/domain-experts/blob/main/roles/refractory-materials-repairer/references/playbook.md): 구역별 재질 선정·건조 곡선·팽창 줄눈 계산
- [Red flags](https://github.com/wonsukchoi/domain-experts/blob/main/roles/refractory-materials-repairer/references/red-flags.md): 건조 일정 압축·조기 파손 등 위험 신호
- [Vocabulary](https://github.com/wonsukchoi/domain-experts/blob/main/roles/refractory-materials-repairer/references/vocabulary.md): 내화물 용어 구분
- [API 982 Body of Knowledge](https://www.api.org/-/media/files/certification/icp/icp-certification-programs/982/bok_982_202504_final.pdf): 검사·평가·품질관리 역량 범위 참고 자료
- [HWI – Curing & Dryout](https://thinkhwi.com/curing-dryout-refractories/): 제조사 양생·건조 안내
- [PCO – Castable Gunning Application Instructions (2026)](https://pco-refractories.com/wp-content/uploads/2026/03/Product_Application_Instructions_Castable_Gunning_EN-2.pdf): 캐스터블 거닝 시공·양생·건조 절차 예시
- [RESCO – Conventional Castable Heating Procedure](https://www.rescoproducts.com/docs/default-source/data-sheets-us/dry-out/100-heating-procedures--conventional-castables.pdf): 특정 제품군의 건조 절차 예시
- [Maintain Kiln Refractory – Training Guide](https://training.gov.au/TrainingComponentFiles/PMC10/PMC562075B_R1.pdf): 킬른 정비 작업 및 준비 교육자료
- [Ladle Refractory Predictor – GitHub](https://github.com/altugrakay-commits/Ladle-Refractory-Predictor): 래들 운전 이력 기반 열화 위험 평가 예시
- [API RP 982 ballot draft – searchable copy](https://studylib.net/doc/27633586/api-982-e1-inspection-and-assessment-of-refractory-lining): ITP·검사 기록 항목을 이해하기 위한 초안 검색본. 정식 표준 원문이나 최신 개정본을 대체하지 않습니다.

**중요:** 본 탭의 단계·일정은 정비계획 템플릿입니다. Dry-out은 모든 재질에 공통인 고정 온도·승온률을 사용하지 않습니다. 캐스터블의 제품명·두께·수분·시공법에 따른 제조사 승인 곡선, 설비 라이선서 절차 및 현장 승인 ITP를 반드시 적용해야 합니다. 안전 격리·가스프리·밀폐공간 진입·철거·재가동은 자격 보유자와 현장 책임자의 승인 대상입니다.


## 10. 현장 제약 기반 정비 대안 비교

정비탭에 생산 긴급도·허용 정지시간·가용 예산·손상 상태를 입력하고 전면 라이닝과 부분 패칭의 시간·비용을 비교하는 의사결정 보조 기능을 추가했습니다.

- 전면 라이닝과 부분 패칭의 작업시간 및 비용은 현장 산정값을 입력합니다. 임의의 표준 공사시간·단가를 기본값으로 가정하지 않습니다.
- 패칭은 손상이 국부적이고 주변 라이닝 및 앵커·쉘이 건전하다는 검사 근거가 있을 때만 후보로 표시합니다.
- 손상 미확인, 광범위 침식, 앵커·쉘 구조 손상 상태에서는 패칭을 자동 추천하지 않습니다.
- 총 정지시간은 작업시간과 제품별 승인 양생·Dry-out 시간을 합산합니다. 긴급 생산이나 예산 부족을 이유로 승인된 Dry-out 곡선을 자동 단축하지 않습니다.
- 본 비교는 의사결정 지원용이며, 실제 작업 승인·재가동 승인·안전성 판정을 대신하지 않습니다.

### 참고 표준의 적용 범위

| 문서 | 정비 단계에서의 참고 범위 | 주의점 |
|---|---|---|
| API STD 936 | 모놀리식 내화물 설치 QC, 검사·시험, 시공자/자재 적격성, 양생·건조 관리 | 프로젝트 계약판·최신 정오표 확인 |
| API STD 975 | 내화 벽돌 시스템의 설치 QC·검사·시험 | 모놀리식 캐스터블 표준과 구분 |
| API STD 976 | AES/RCF 섬유 라이닝 설치 QC·검사·시험 | 섬유 라이닝에 한정 |
| API RP 982 | 운전 중 라이닝 검사·평가 | 설치 시공 절차와 구분 |
| ISO 1927 시리즈 | 모놀리식 내화물 분류, 시료 채취, 시험편 처리 및 물성 평가 | 현장 시공 전체를 규정하는 단일 설치 표준이 아님 |
| KS L 3502 / 3503 / 3521 | 캐스터블 시료 채취·강도 시험·경량 캐스터블 제품 규격 등 | 적용 제품 및 현행 판을 국가표준 포털에서 확인 |
| UOP 프로젝트 사양 | 특정 라이선서 설비·공법의 재료, 앵커, 시공 조건 | 공개 유통본은 사례 참고용이며 계약 프로젝트의 최신 승인 사양이 우선 |

API·ISO·KS 표준은 적용 대상과 목적이 서로 다르므로 동등한 문서처럼 취급하지 않습니다. UOP 사양은 라이선서/프로젝트별 문서로 보고, 공개된 과거 사양을 현장 공통 기준으로 일반화하지 않습니다.
