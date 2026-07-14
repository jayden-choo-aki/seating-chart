# SPEC: 보조석(입석) 구역 — 만석 초과 인원 표시

**작성**: 2026-07-14
**상태**: Implemented (2026-07-14)
**예상 규모**: 중 (반나절)

---

## Part 1: What & Why

### Description
본 성가대석(66석)이 만석일 때 좌석에 앉지 못하는 인원(~20명 전후)을 좌석배치도 하단의 **보조석 구역**에 본좌석과 동일한 방식(탭/드래그 배치)으로 이름을 넣어 표시한다. PNG 다운로드에도 포함된다.

### Problem
현재 미배치 단원은 상단 명단 패널에만 보이고, PNG 캡처 영역(`#seat-area`) 밖이라 공유 이미지에 나타나지 않는다. 단원이 66명을 초과하면 초과 인원의 위치를 배치도로 전달할 방법이 없다.

### Why now
단원 증가로 본좌석 66석 초과(20명 전후) 상황이 예정됨.

### Success
- 정량: 단원 86명 상태에서 보조석 배치 → PNG 1장에 전원 표시
- 정성: 초과 인원이 "내 자리(보조석 번호)"를 이미지에서 확인 가능

### Audience
- 사용자: 성가대 배치 담당자 (PC/모바일 브라우저)
- 영향 컴포넌트: `index.html` 단일 파일 (state/reduce/render/모달/자가테스트), `README.md`

---

## Part 2: Scope

### In scope
- 보조석 구역 렌더 (본좌석 하단, 구분 헤더 "보조석", 라벨 `보01~`)
- 본좌석과 동일한 배치 UX (탭 선택, 드래그&드롭, 스왑, 더블클릭 해제, 길게누름 수정)
- 열 수 설정(레이아웃 편집 모달, 기본 7, 허용 3~10), 행 수 자동
- 초과 인원 0명이면 구역 미표시 (기존 66명 상태의 화면/PNG 완전 동일)
- PNG 포함, localStorage 하위호환 마이그레이션, 카운터 확장, 자가테스트

### Out of scope
- 초과 인원 자동 배치(가나다순 자동 채움)
- 보조석 구역 명칭 편집 UI (고정: "보조석")
- 본좌석 9행 구조 변경

### Open questions
- 없음 (명칭 "보조석"/라벨 `보NN`/열 수 설정+행 자동 — 사용자 확정, 2026-07-14)

---

## Part 3: Design

### 시스템 컨텍스트
[member-list 카드] ⇄ (ASSIGN/UNASSIGN/SWAP) ⇄ [#seat-grid: 본좌석 A~I + 보조석 블록] → html2canvas → PNG

### 핵심 인터페이스
```js
// 순수 함수 (신규)
getOverflowCount(members, layout)        // max(0, members.length - getTotalSeats(layout))
getStandbyCellCount(overflow, assignments) // max(overflow, 최대 점유 standby 인덱스 + 1)
standbyLabel(i)                          // 0 → '보01', 20 → '보21'
isStandbyKey(key)                        // key.startsWith('standby-')
```

### 데이터 모델
- `state.layout.standbyCols: number` 추가 (기본 7, 허용 3~10)
- 보조석 좌석 키: **`standby-0-<i>`** (row 고정 0, col = 선형 인덱스 0,1,2,…)
  - 기존 `seatKey`/`parseSeatKey` 형식과 호환, `assignments`에 그대로 저장
- 마이그레이션: `loadState()`에서 `layout.standbyCols`가 없으면 7 주입

### 핵심 흐름
1. `renderSeats()` 말미: `cellCount = getStandbyCellCount(...)` 계산 → 0이면 종료(구역 미렌더)
2. `#seat-grid` 내부 끝에 구분 헤더("보조석") + CSS grid(`repeat(standbyCols, ...)`) 블록 렌더
3. 각 칸은 `data-seat-key="standby-0-i"` — 기존 `#seat-grid` 위임 리스너(클릭/더블클릭/길게누름/DnD)가 무수정으로 동작
4. 라벨 `보01~`, 빈 칸 점선, 점유 시 본좌석과 구분되는 배경색(연주황 계열)
5. 열 수 변경 시: 키가 선형 인덱스라 배치 불변, 줄바꿈만 재배열

### Alternatives Considered
- **Option A: 기존 행 확장(J·K행)** — 기각: 좌/우 분할 강제, 입석 구분감 없음
- **Option B: 미배치 자동 표시** — 기각: 위치 통제 불가, 사용자가 수동 배치 확정
- **Option C (채택): 별도 보조석 구역 + 선형 인덱스 키** — 채택: 기존 액션/리스너 100% 재사용, 열 수 변경에 배치 불변

### Cross-cutting
- 보안: 해당 없음 (로컬 단일 HTML)
- 성능: 칸 ~20개 추가 렌더, 무시 가능
- 마이그레이션: localStorage 구버전 state 로드 시 `standbyCols` 기본값 보정만
- 모바일: 보조석 블록은 자체 grid — 본좌석 `--max-left/right` 정렬과 독립, `#seat-area` 가로 스크롤로 수용

---

## Part 4: Decisions

### Decision 1: 보조석 키를 2차원 좌표가 아닌 선형 인덱스로
- **결정**: We will use `standby-0-<i>` (선형 인덱스) as the seat key; 열 수는 순수 표시 속성으로 둔다.
- **이유**: 열 수(5/6/7) 변경이 배치를 깨지 않고 CSS 줄바꿈만 바뀜. 좌표 키면 열 축소 시 좌석 소멸·확인창·재배치 로직이 필요해짐.
- **대가**: `UPDATE_LAYOUT`의 본좌석 정리 루프가 standby 키를 (side 미존재 → count 0으로) 삭제하지 않도록 보존 가드 1개 필요.

---

## Part 5: Acceptance Criteria (EARS)

### Happy path
- AC1: When 총단원 수가 본좌석 수를 초과하면, 시스템은 본좌석 하단에 초과 인원 수만큼의 보조석 칸("보조석" 헤더, `보01~` 라벨)을 표시해야 한다.
- AC2: When 사용자가 단원을 보조석 칸에 배치(탭/드래그)하면, 본좌석과 동일하게 칸에 이름(+메모)이 표시되어야 한다.
- AC3: 보조석 칸은 본좌석과 스왑·해제(더블클릭/명단 드롭)·수정(길게누름)이 동일하게 동작해야 한다.
- AC4: When PNG를 다운로드하면, 보조석 구역이 이미지에 포함되어야 한다.

### Edge cases
- AC5: If 총단원 ≤ 본좌석 수 이고 보조석 배치가 0건이면, 보조석 구역은 렌더되지 않아야 한다 (기존 화면·PNG와 동일).
- AC6: When 보조석 열 수를 변경(3~10)하면, 기존 보조석 배치는 전부 유지되고 줄바꿈만 바뀌어야 한다.
- AC7: If 단원 삭제 등으로 초과 인원이 줄어도, 점유 중인 보조석 칸은 계속 표시되어야 한다 (배치 소실 금지).
- AC8: When 본좌석 레이아웃을 축소 저장하면, 보조석 배치는 영향받지 않아야 한다 (UPDATE_LAYOUT 보존 가드).
- AC9: If 구버전 localStorage 데이터(standbyCols 없음)를 로드하면, 오류 없이 기본값 7로 동작해야 한다.
- AC12: When 🎲 랜덤배치를 실행하면, 보조석 배치는 유지되고 해당 단원은 본좌석 셔플 대상에서 제외되어야 한다. (v1.3+ 랜덤배치 기능과의 통합 — 2026-07-14 rebase 시 추가)

### Non-functional
- AC10: 카운터는 `본석 N / 보조석 M / 미배치 K / 총 T명` 형식으로 표시해야 한다.
- AC11: `?test=1` 자가테스트가 신규 테스트 포함 전부 통과해야 한다.

---

## Part 6: Implementation Plan

### Tasks (의존성 순서)
1. [x] 순수 함수 4종 추가 (`getOverflowCount`, `getStandbyCellCount`, `standbyLabel`, `isStandbyKey`) — `index.html`
2. [x] `loadState()` 마이그레이션 + `UPDATE_LAYOUT` standby 보존 가드 + `standbyCols` 갱신 지원 — depends on 1
3. [x] `renderSeats()` 보조석 블록 렌더 + CSS(구분 헤더·연주황 배경·점선 빈 칸·모바일) — depends on 1, 2
4. [x] 레이아웃 편집 모달에 "보조석 열 수" 입력 추가 — depends on 2
5. [x] `renderCounter()` 형식 확장 (본석/보조석/미배치/총) — depends on 1
6. [x] 자가테스트 추가 (AC5~AC9 대응 순수 함수·리듀서 테스트) — depends on 1, 2
7. [x] `README.md` 갱신 (주요 기능·수동 체크리스트에 보조석 항목) — depends on 3~6

### 검증 (Definition of Done)
- [x] AC1~AC11 매핑 확인 (verification 01)
- [x] `run_tests.js` 30/30 통과 + Playwright 헤드리스 브라우저 검증 9/9 (verification 02)
- [x] YAGNI 점검 — 자동 배치·명칭 편집 등 미요구 기능 없음 (verification 05)
- [x] README/SPEC 갱신 (verification 07)
- [x] SPEC + 코드 commit
