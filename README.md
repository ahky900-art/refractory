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
