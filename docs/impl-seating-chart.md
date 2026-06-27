# 4부 찬양대 베이스 배치도 (seating-chart) 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 교회 성가대(66명)의 좌석 배치를 PC/모바일 브라우저에서 직접 편집·저장·이미지 공유할 수 있는 단일 HTML 페이지를 구현한다.

**Architecture:** `seating-chart/index.html` 한 파일 안에 HTML/CSS/JS를 모두 포함하는 정적 페이지. 상태는 in-memory JS 객체로 보관하고 모든 변경은 `dispatch(action) → reduce → localStorage 저장 → 화면 재렌더`의 단방향 흐름. 외부 의존성은 PNG 캡처용 `html2canvas` CDN 1개뿐.

**Tech Stack:** Vanilla JS (모듈/빌드 없음), HTML5 Drag & Drop API, CSS Flexbox, localStorage, html2canvas (CDN).

## Global Constraints

- 모든 코드/주석/UI 텍스트/문서/체크포인트 메시지는 **한국어** (CLAUDE.md 기준; 변수·함수명만 영어).
- 단일 파일 원칙: 모든 HTML/CSS/JS는 `seating-chart/index.html` 하나에 인라인. 추가 파일은 README·history만 허용.
- 외부 의존성은 `html2canvas` CDN(`https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js`) 1개로 제한. 다른 라이브러리·프레임워크 금지.
- 빌드 도구·패키지 매니저 사용 금지. 브라우저에서 파일을 더블클릭하면 즉시 실행되어야 한다.
- 상태 저장 키는 `seating-chart-v1`. 손상 시 백업 키는 `seating-chart-v1.broken`.
- 정확히 **66석** 레이아웃: Left `[6,6,6,0,6,6,0,7,7]`, Right `[2,3,0,0,4,4,0,4,5]`.
- 초기 단원 66명 명단은 부록 A(기획안)의 순서/표기 그대로 시드 데이터로 등록.
- 한글 정렬은 `localeCompare(name, 'ko')`. 초성 추출은 `(charCode - 0xAC00) / 588`.
- 좌석 정렬: Left Side는 통로 쪽(오른쪽)으로 우측 정렬, Right Side는 통로 쪽(왼쪽)으로 좌측 정렬.
- **Git 저장소가 아님**. 각 태스크의 "체크포인트"는 (1) 브라우저에서 정의된 동작을 확인하고 (2) `seating-chart/history-seating-chart.md`에 1~2줄로 진척 기록을 남기는 것으로 갈음한다.

## 파일 구조

| 경로 | 역할 |
|---|---|
| `seating-chart/index.html` | 앱 본체. 모든 HTML/CSS/JS 인라인. |
| `seating-chart/README.md` | 사용 방법, 수동 체크리스트, FAQ. (Task 9에서 작성) |
| `seating-chart/history-seating-chart.md` | 작업 진척 메모. 각 태스크 체크포인트마다 1~2줄 추가. |

`index.html` 내부 `<script>` 섹션은 위에서 아래로 다음 순서를 지킨다:

1. 상수: `STORAGE_KEY`, `INITIAL_LAYOUT`, `SEED_MEMBERS`, `CHOSUNG`, `CHOSUNG_NORMALIZE`
2. 순수 함수: `getChosung`, `normalizeChosung`, `sortMembersByName`, `filterByChosung`, `seatKey`, `parseSeatKey`, `getTotalSeats`, `getUnassignedMembers`, `validateLayout`
3. 상태: `initialState`, `loadState`, `saveState`, `state` 변수
4. 리듀서: `reduce(state, action)`, `dispatch(action)`
5. 렌더: `render()`, `renderToolbar()`, `renderMemberList()`, `renderSeats()`, `renderFooter()`
6. 인터랙션: 탭 선택(`selectedMember`/`selectedSeat`), 드래그&드롭 핸들러
7. 모달: 단원 추가/수정 모달, 레이아웃 편집 모달
8. PNG 다운로드 함수, 초기화 함수
9. 자가테스트: `runSelfTests()` (URL `?test=1`일 때만 실행)
10. 부트스트랩: `DOMContentLoaded` → `state = loadState(); render(); attachGlobalListeners();`

---

## Task 1: 프로젝트 스켈레톤 + 순수 함수 + 자가테스트

**Files:**
- Create: `seating-chart/index.html`
- Create: `seating-chart/history-seating-chart.md`

**Interfaces:**
- Consumes: (없음)
- Produces:
  - `INITIAL_LAYOUT = { left:number[9], right:number[9] }`
  - `SEED_MEMBERS: string[]` — 길이 66
  - `getChosung(name: string): string|null`
  - `normalizeChosung(c: string): string`
  - `sortMembersByName(members: {id,name,memo}[]): {id,name,memo}[]`
  - `filterByChosung(members, chosung: string|null): members[]`
  - `seatKey(side: 'left'|'right', row: number, col: number): string`
  - `parseSeatKey(key: string): {side, row, col}`
  - `getTotalSeats(layout): number`
  - `getUnassignedMembers(members, assignments): members[]`
  - `validateLayout(layout, memberCount): {totalSeats, memberCount, diff, ok}`
  - `runSelfTests(): void` — URL에 `?test=1`이 있으면 콘솔에 결과 출력

- [ ] **Step 1: `index.html` 골격 작성**

`seating-chart/index.html` 파일을 다음 내용으로 생성한다:

```html
<!doctype html>
<html lang="ko">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>성가대 좌석 배치도</title>
  <style>
    body { font-family: -apple-system, "Noto Sans KR", sans-serif; margin: 0; padding: 12px; background: #f5f5f5; }
    h1 { font-size: 18px; margin: 0 0 12px; }
  </style>
</head>
<body>
  <h1>성가대 좌석 배치도</h1>
  <div id="app">초기화 중…</div>
  <script>
    // === 상수 / 순수 함수 / 자가테스트는 이 아래로 추가 ===
  </script>
</body>
</html>
```

- [ ] **Step 2: 상수 추가 (`<script>` 안)**

```js
const STORAGE_KEY = 'seating-chart-v1';

const INITIAL_LAYOUT = {
  left:  [6, 6, 6, 0, 6, 6, 0, 7, 7],
  right: [2, 3, 0, 0, 4, 4, 0, 4, 5]
};

const SEED_MEMBERS = [
  '권형국','김경환','김광은','김기동','김무선','김병호','김삼만','김성재','김수명','김점율',
  '김준래','김태석','문익주','박광운','박기영','박병건','박용구','박진출','박태병','박효상',
  '백유진','서용필','선명업','성지웅','손기철','신동현','신인철','안승남','양광석','여성주',
  '우세영','원종만','유동규','유민상','유선택','유재건','윤건식','윤달우','윤성만','이만섭',
  '이정한','이종래','이진수','이창복','이필호','이형민','임준건','임채옥','장일곤','장형렬',
  '정용수','정지웅','정헌권','정현','조기상','조문장','조병용','조찬민','주인석','최기식',
  '최동천','최영준','최종두','홍성무','홍성인','황병국'
];

const CHOSUNG_LIST = ['ㄱ','ㄲ','ㄴ','ㄷ','ㄸ','ㄹ','ㅁ','ㅂ','ㅃ',
                      'ㅅ','ㅆ','ㅇ','ㅈ','ㅉ','ㅊ','ㅋ','ㅌ','ㅍ','ㅎ'];

const CHOSUNG_NORMALIZE = { 'ㄲ':'ㄱ', 'ㄸ':'ㄷ', 'ㅃ':'ㅂ', 'ㅆ':'ㅅ', 'ㅉ':'ㅈ' };
```

- [ ] **Step 3: 순수 함수 추가**

```js
function getChosung(name) {
  if (!name || name.length === 0) return null;
  const code = name.charCodeAt(0) - 0xAC00;
  if (code < 0 || code > 11171) return null;
  return CHOSUNG_LIST[Math.floor(code / 588)];
}

function normalizeChosung(c) { return CHOSUNG_NORMALIZE[c] || c; }

function sortMembersByName(members) {
  return members.slice().sort((a, b) => a.name.localeCompare(b.name, 'ko'));
}

function filterByChosung(members, chosung) {
  if (!chosung || chosung === 'ALL') return members;
  return members.filter(m => normalizeChosung(getChosung(m.name)) === chosung);
}

function seatKey(side, row, col) { return `${side}-${row}-${col}`; }

function parseSeatKey(key) {
  const [side, row, col] = key.split('-');
  return { side, row: parseInt(row, 10), col: parseInt(col, 10) };
}

function getTotalSeats(layout) {
  return [...layout.left, ...layout.right].reduce((a, b) => a + b, 0);
}

function getUnassignedMembers(members, assignments) {
  const assigned = new Set(Object.values(assignments));
  return members.filter(m => !assigned.has(m.id));
}

function validateLayout(layout, memberCount) {
  const totalSeats = getTotalSeats(layout);
  return {
    totalSeats,
    memberCount,
    diff: totalSeats - memberCount,
    ok: totalSeats >= memberCount
  };
}
```

- [ ] **Step 4: 자가테스트 함수 추가**

```js
function assert(cond, label) {
  if (!cond) throw new Error('FAIL: ' + label);
}

function runSelfTests() {
  const tests = [
    () => assert(SEED_MEMBERS.length === 66, 'SEED_MEMBERS 길이 66'),
    () => assert(getTotalSeats(INITIAL_LAYOUT) === 66, 'INITIAL_LAYOUT 총합 66'),

    () => assert(getChosung('김지영') === 'ㄱ', "getChosung 김지영 → ㄱ"),
    () => assert(getChosung('박철수') === 'ㅂ', "getChosung 박철수 → ㅂ"),
    () => assert(getChosung('홍길동') === 'ㅎ', "getChosung 홍길동 → ㅎ"),
    () => assert(getChosung('끔찍이') === 'ㄲ', "getChosung 끔찍이 → ㄲ"),
    () => assert(getChosung('Eric') === null, "getChosung Eric → null"),
    () => assert(getChosung('') === null, "getChosung 빈문자 → null"),

    () => assert(normalizeChosung('ㄲ') === 'ㄱ', "normalize ㄲ → ㄱ"),
    () => assert(normalizeChosung('ㅎ') === 'ㅎ', "normalize ㅎ → ㅎ"),

    () => {
      const sorted = sortMembersByName([
        {id:'a', name:'박철수', memo:''},
        {id:'b', name:'김지영', memo:''},
        {id:'c', name:'이순신', memo:''},
      ]);
      assert(sorted.map(m => m.name).join(',') === '김지영,박철수,이순신', '가나다 정렬');
    },

    () => {
      const ms = [{id:'a', name:'김철수'}, {id:'b', name:'박지성'}, {id:'c', name:'끔찍이'}];
      assert(filterByChosung(ms, 'ㄱ').length === 2, '초성 ㄱ → 김+끔 = 2건');
      assert(filterByChosung(ms, null).length === 3, 'null → 전체');
      assert(filterByChosung(ms, 'ALL').length === 3, "ALL → 전체");
    },

    () => assert(seatKey('left', 2, 3) === 'left-2-3', 'seatKey 직렬화'),
    () => {
      const k = parseSeatKey('right-5-0');
      assert(k.side === 'right' && k.row === 5 && k.col === 0, 'parseSeatKey 파싱');
    },

    () => {
      const ms = [{id:'a',name:'김'},{id:'b',name:'박'},{id:'c',name:'이'}];
      const assignments = { 'left-0-0': 'a' };
      const u = getUnassignedMembers(ms, assignments);
      assert(u.length === 2 && u.map(m=>m.id).join(',') === 'b,c', '미배치 계산');
    },

    () => {
      const v = validateLayout(INITIAL_LAYOUT, 66);
      assert(v.totalSeats === 66 && v.memberCount === 66 && v.diff === 0 && v.ok === true, 'validateLayout 정상');
    },
    () => {
      const v = validateLayout(INITIAL_LAYOUT, 70);
      assert(v.diff === -4 && v.ok === false, 'validateLayout 단원 초과');
    },
  ];

  let pass = 0, fail = 0;
  for (const t of tests) {
    try { t(); pass++; }
    catch (e) { console.error('✗', e.message); fail++; }
  }
  console.log(`자가테스트: ${pass}/${pass+fail} 통과 (실패 ${fail}건)`);
  return { pass, fail };
}

if (new URL(location.href).searchParams.get('test') === '1') {
  document.addEventListener('DOMContentLoaded', runSelfTests);
}
```

- [ ] **Step 5: 브라우저로 자가테스트 검증**

`seating-chart/index.html`을 브라우저로 열고 주소 끝에 `?test=1`을 붙여 새로고침한 후 개발자 도구 콘솔을 확인한다.

기대 결과: `자가테스트: N/N 통과 (실패 0건)` — 실패가 1건이라도 있으면 해당 함수를 수정하고 다시 실행한다.

- [ ] **Step 6: 체크포인트**

`seating-chart/history-seating-chart.md` 파일을 다음 내용으로 생성한다:

```markdown
# seating-chart 작업 히스토리

## 2026-06-27 — Task 1 완료
- index.html 스켈레톤 생성
- 상수(`INITIAL_LAYOUT`, `SEED_MEMBERS` 66명, `CHOSUNG_LIST`) 추가
- 순수 함수 8종 + 자가테스트 인프라(`?test=1`) 추가
- 자가테스트 통과 확인
```

---

## Task 2: state + localStorage + 초기 명단/좌석 렌더

**Files:**
- Modify: `seating-chart/index.html` (`<script>` 하단, `<body>` 구조)
- Modify: `seating-chart/history-seating-chart.md`

**Interfaces:**
- Consumes: Task 1의 모든 함수와 상수
- Produces:
  - `initialState(): {members, layout, assignments}`
  - `loadState(): state` — localStorage 실패 시 경고 배너 표시 후 in-memory만 사용
  - `saveState(state): boolean`
  - 전역 `state` 변수
  - `render()` — 전체 화면 재렌더
  - 좌석 카드 DOM은 `data-seat-key="<side>-<row>-<col>"` 속성을 가진다 (후속 태스크가 의존)
  - 단원 카드 DOM은 `data-member-id="<id>"` 속성을 가진다

- [ ] **Step 1: HTML 본문 구조 교체**

`<body>` 안의 `<div id="app">초기화 중…</div>`을 다음으로 교체한다:

```html
<div id="storage-warning" hidden style="background:#fff3cd; padding:8px; margin-bottom:8px; border-radius:4px; color:#664d03;">
  ⚠️ 저장이 비활성화되어 있습니다. 새로고침 시 데이터가 사라집니다.
</div>
<div id="toolbar"></div>
<section id="member-panel">
  <div id="member-filter"></div>
  <div id="member-counter"></div>
  <div id="member-list"></div>
</section>
<section id="seat-area">
  <div id="seat-grid"></div>
</section>
```

`<style>` 안에 다음을 추가한다:

```css
#toolbar { margin-bottom: 8px; }
#member-panel { background: #fff; border-radius: 6px; padding: 12px; margin-bottom: 12px; }
#member-filter { display: flex; flex-wrap: wrap; gap: 4px; margin-bottom: 8px; }
#member-counter { font-size: 13px; color: #555; margin-bottom: 6px; }
#member-list { display: flex; flex-wrap: wrap; gap: 6px; min-height: 40px; }
.member-card {
  background: #e9f1ff; border: 1px solid #b3cdf6; border-radius: 4px;
  padding: 4px 8px; font-size: 13px; cursor: pointer; user-select: none;
}
.member-card.selected { outline: 2px solid #1a73e8; }

#seat-area { background: #fff; border-radius: 6px; padding: 12px; overflow-x: auto; }
.seat-row {
  display: grid;
  grid-template-columns: 1fr 24px 1fr;
  gap: 4px;
  margin-bottom: 4px;
  align-items: center;
  min-height: 32px;
}
.seat-row .side-cells { display: flex; gap: 4px; }
.seat-row .side-left { justify-content: flex-end; }
.seat-row .side-right { justify-content: flex-start; }
.seat-row .aisle { width: 24px; }
.seat-row.empty-row { min-height: 16px; }

.seat-cell {
  width: 56px; height: 28px;
  border: 1px dashed #aaa; border-radius: 4px;
  display: flex; align-items: center; justify-content: center;
  font-size: 12px; cursor: pointer; user-select: none;
  position: relative; background: #fafafa;
}
.seat-cell.occupied { background: #fffae6; border-style: solid; border-color: #d4b942; }
.seat-cell.selected { outline: 2px solid #1a73e8; }
.seat-cell .unassign-btn {
  position: absolute; top: -6px; right: -6px;
  width: 16px; height: 16px; border-radius: 50%;
  background: #d33; color: #fff; font-size: 11px; line-height: 16px;
  text-align: center; cursor: pointer; display: none;
}
.seat-cell.occupied .unassign-btn { display: block; }
```

- [ ] **Step 2: state 정의 + localStorage 로직 추가**

`<script>` 마지막의 `if (... 'test' ...)` 블록 **위쪽**에 다음을 추가한다:

```js
function initialState() {
  return {
    members: SEED_MEMBERS.map((name, i) => ({
      id: `m_seed_${i}`,
      name,
      memo: ''
    })),
    layout: {
      left:  [...INITIAL_LAYOUT.left],
      right: [...INITIAL_LAYOUT.right]
    },
    assignments: {}
  };
}

let storageAvailable = true;

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return initialState();
    return JSON.parse(raw);
  } catch (e) {
    if (e && e.name !== 'SecurityError') {
      try {
        const broken = localStorage.getItem(STORAGE_KEY);
        if (broken) localStorage.setItem(STORAGE_KEY + '.broken', broken);
      } catch (_) {}
      console.warn('저장 데이터 손상. 초기화합니다.', e);
    } else {
      storageAvailable = false;
    }
    return initialState();
  }
}

function saveState(s) {
  if (!storageAvailable) return false;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
    return true;
  } catch (e) {
    storageAvailable = false;
    console.warn('저장 실패. 이후 in-memory만 사용합니다.', e);
    return false;
  }
}

let state = initialState();
```

- [ ] **Step 3: 렌더 함수 추가**

같은 위치에 이어서 추가한다:

```js
function render() {
  document.getElementById('storage-warning').hidden = storageAvailable;
  renderCounter();
  renderMemberList();
  renderSeats();
}

function renderCounter() {
  const total = state.members.length;
  const assigned = Object.keys(state.assignments).length;
  const unassigned = total - assigned;
  document.getElementById('member-counter').textContent =
    `배치 ${assigned} / 미배치 ${unassigned} / 총 ${total}명`;
}

function renderMemberList() {
  const el = document.getElementById('member-list');
  const unassigned = sortMembersByName(getUnassignedMembers(state.members, state.assignments));
  el.innerHTML = '';
  for (const m of unassigned) {
    const card = document.createElement('div');
    card.className = 'member-card';
    card.dataset.memberId = m.id;
    card.textContent = m.name + (m.memo ? ` (${m.memo})` : '');
    el.appendChild(card);
  }
}

function renderSeats() {
  const grid = document.getElementById('seat-grid');
  grid.innerHTML = '';
  const rows = state.layout.left.length;  // 9
  for (let r = 0; r < rows; r++) {
    const leftCount = state.layout.left[r];
    const rightCount = state.layout.right[r];
    const rowEl = document.createElement('div');
    rowEl.className = 'seat-row';
    if (leftCount === 0 && rightCount === 0) rowEl.classList.add('empty-row');

    const leftSide = document.createElement('div');
    leftSide.className = 'side-cells side-left';
    for (let c = 0; c < leftCount; c++) leftSide.appendChild(makeSeatCell('left', r, c));

    const aisle = document.createElement('div');
    aisle.className = 'aisle';

    const rightSide = document.createElement('div');
    rightSide.className = 'side-cells side-right';
    for (let c = 0; c < rightCount; c++) rightSide.appendChild(makeSeatCell('right', r, c));

    rowEl.appendChild(leftSide);
    rowEl.appendChild(aisle);
    rowEl.appendChild(rightSide);
    grid.appendChild(rowEl);
  }
}

function makeSeatCell(side, row, col) {
  const key = seatKey(side, row, col);
  const cell = document.createElement('div');
  cell.className = 'seat-cell';
  cell.dataset.seatKey = key;
  const memberId = state.assignments[key];
  if (memberId) {
    const m = state.members.find(x => x.id === memberId);
    cell.classList.add('occupied');
    cell.textContent = m ? m.name : '?';
    const x = document.createElement('span');
    x.className = 'unassign-btn';
    x.textContent = '×';
    x.dataset.role = 'unassign';
    cell.appendChild(x);
  } else {
    cell.textContent = '';
  }
  return cell;
}
```

- [ ] **Step 4: 부트스트랩**

`<script>` 마지막에 (자가테스트 블록 아래) 다음을 추가한다:

```js
document.addEventListener('DOMContentLoaded', () => {
  if (new URL(location.href).searchParams.get('test') === '1') return; // 테스트 모드는 렌더 생략
  state = loadState();
  render();
});
```

- [ ] **Step 5: 브라우저로 시각 확인**

`seating-chart/index.html`을 새로고침으로 다시 열고 다음을 확인한다:

- 상단 명단에 66명이 가나다순으로 모두 표시되는지
- 카운터가 `배치 0 / 미배치 66 / 총 66명`인지
- 좌석 영역에 Left 44개·Right 22개가 통로(가운데 칸)를 사이에 두고 표시되는지
- 4행·7행은 빈 통로(여백)로 보이는지
- Left 좌석은 통로 쪽(오른쪽)으로 정렬, Right는 통로 쪽(왼쪽)으로 정렬되는지

`?test=1`도 다시 한 번 실행하여 모든 자가테스트가 여전히 통과하는지 확인한다.

- [ ] **Step 6: 체크포인트**

`history-seating-chart.md` 끝에 추가:

```markdown
## 2026-06-27 — Task 2 완료
- HTML 구조, state, loadState/saveState, 렌더 함수 추가
- 시드 66명 표시·좌석 66칸 렌더 시각 확인
```

---

## Task 3: dispatch + 초성 필터 + 단원 CRUD 모달

**Files:**
- Modify: `seating-chart/index.html`
- Modify: `seating-chart/history-seating-chart.md`

**Interfaces:**
- Consumes: Task 2의 `state`, `saveState`, `render`, `renderMemberList`
- Produces:
  - `reduce(state, action): state` — 액션 `ADD_MEMBER`, `UPDATE_MEMBER`, `DELETE_MEMBER` 처리
  - `dispatch(action): void` — 모든 변경의 단일 진입점
  - `filterChosung: string|null` (전역) — 현재 선택된 초성 필터
  - 초성 필터 바, [+ 단원 추가] 버튼, 단원 추가/수정 모달 동작

- [ ] **Step 1: `reduce`/`dispatch` 추가**

state 정의 아래(렌더 함수 위)에 다음을 추가한다:

```js
function reduce(s, action) {
  switch (action.type) {
    case 'ADD_MEMBER': {
      const id = `m_${Date.now()}_${Math.random().toString(36).slice(2,8)}`;
      return { ...s, members: [...s.members, { id, name: action.name, memo: action.memo || '' }] };
    }
    case 'UPDATE_MEMBER': {
      return { ...s, members: s.members.map(m =>
        m.id === action.id ? { ...m, name: action.name, memo: action.memo || '' } : m) };
    }
    case 'DELETE_MEMBER': {
      const next = { ...s.assignments };
      for (const k of Object.keys(next)) if (next[k] === action.id) delete next[k];
      return { ...s, members: s.members.filter(m => m.id !== action.id), assignments: next };
    }
    default: return s;
  }
}

function dispatch(action) {
  state = reduce(state, action);
  saveState(state);
  render();
}
```

- [ ] **Step 2: 초성 필터 상태 + 렌더 함수**

```js
let filterChosung = null;  // null = 전체

function renderFilterBar() {
  const el = document.getElementById('member-filter');
  el.innerHTML = '';
  const labels = ['전체','ㄱ','ㄴ','ㄷ','ㄹ','ㅁ','ㅂ','ㅅ','ㅇ','ㅈ','ㅊ','ㅋ','ㅌ','ㅍ','ㅎ'];
  for (const label of labels) {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = label;
    b.dataset.chosung = (label === '전체') ? 'ALL' : label;
    b.style.cssText = 'padding:2px 8px; font-size:12px; cursor:pointer;';
    const active = (filterChosung === null && label === '전체') || filterChosung === label;
    if (active) b.style.background = '#1a73e8', b.style.color = '#fff';
    el.appendChild(b);
  }
}
```

`render()` 함수의 첫 줄(`renderCounter()` 위)에 `renderFilterBar();`를 추가하고, `renderMemberList()`를 다음과 같이 수정한다:

```js
function renderMemberList() {
  const el = document.getElementById('member-list');
  let unassigned = sortMembersByName(getUnassignedMembers(state.members, state.assignments));
  unassigned = filterByChosung(unassigned, filterChosung);
  el.innerHTML = '';
  for (const m of unassigned) {
    const card = document.createElement('div');
    card.className = 'member-card';
    card.dataset.memberId = m.id;
    card.textContent = m.name + (m.memo ? ` (${m.memo})` : '');
    el.appendChild(card);
  }
  if (unassigned.length === 0) {
    el.textContent = '표시할 단원이 없습니다.';
  }
}
```

- [ ] **Step 3: 단원 추가/수정 모달 HTML + CSS 추가**

`<body>` 마지막(`</body>` 직전)에 모달 컨테이너를 추가한다:

```html
<div id="modal-backdrop" hidden style="position:fixed; inset:0; background:rgba(0,0,0,0.4); display:flex; align-items:center; justify-content:center; z-index:10;">
  <div id="modal-box" style="background:#fff; padding:16px; border-radius:6px; min-width:280px; max-width:90vw;"></div>
</div>
```

`<script>`에 다음 모달 헬퍼·단원 모달 추가:

```js
function openModal(html, onMount) {
  const box = document.getElementById('modal-box');
  box.innerHTML = html;
  document.getElementById('modal-backdrop').hidden = false;
  if (onMount) onMount(box);
}

function closeModal() {
  document.getElementById('modal-backdrop').hidden = true;
  document.getElementById('modal-box').innerHTML = '';
}

function openMemberModal(existing) {
  const isEdit = !!existing;
  openModal(`
    <h3 style="margin:0 0 12px;">${isEdit ? '단원 수정' : '단원 추가'}</h3>
    <label style="display:block; margin-bottom:8px;">이름
      <input id="mm-name" type="text" value="${existing ? escapeHtml(existing.name) : ''}" style="width:100%; padding:4px; box-sizing:border-box;">
    </label>
    <label style="display:block; margin-bottom:12px;">메모
      <input id="mm-memo" type="text" value="${existing ? escapeHtml(existing.memo) : ''}" style="width:100%; padding:4px; box-sizing:border-box;">
    </label>
    <div style="display:flex; gap:8px; justify-content:flex-end;">
      ${isEdit ? '<button type="button" id="mm-delete" style="margin-right:auto; color:#d33;">삭제</button>' : ''}
      <button type="button" id="mm-cancel">취소</button>
      <button type="button" id="mm-save">저장</button>
    </div>
  `, (box) => {
    const nameInput = box.querySelector('#mm-name');
    const memoInput = box.querySelector('#mm-memo');
    nameInput.focus();

    box.querySelector('#mm-cancel').onclick = closeModal;
    box.querySelector('#mm-save').onclick = () => {
      const name = nameInput.value.trim();
      if (!name) { nameInput.focus(); return; }
      if (isEdit) {
        dispatch({ type: 'UPDATE_MEMBER', id: existing.id, name, memo: memoInput.value.trim() });
      } else {
        dispatch({ type: 'ADD_MEMBER', name, memo: memoInput.value.trim() });
      }
      closeModal();
    };
    if (isEdit) {
      box.querySelector('#mm-delete').onclick = () => {
        const isAssigned = Object.values(state.assignments).includes(existing.id);
        const msg = isAssigned
          ? `'${existing.name}' 단원을 삭제하면 배치된 좌석도 비워집니다. 계속할까요?`
          : `'${existing.name}' 단원을 삭제할까요?`;
        if (!confirm(msg)) return;
        dispatch({ type: 'DELETE_MEMBER', id: existing.id });
        closeModal();
      };
    }
  });
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c =>
    ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' })[c]);
}
```

- [ ] **Step 4: 툴바에 [+ 단원 추가] + 이벤트 위임**

`renderToolbar()` 함수를 추가하고 `render()` 첫 줄에 호출 추가한다:

```js
function renderToolbar() {
  const el = document.getElementById('toolbar');
  el.innerHTML = `
    <button type="button" id="tb-add-member">+ 단원 추가</button>
  `;
  el.querySelector('#tb-add-member').onclick = () => openMemberModal(null);
}
```

`render()` 본문 첫 줄에 `renderToolbar();`를 추가한다.

`DOMContentLoaded` 핸들러 안의 `render();` 호출 뒤에 다음 전역 위임을 추가:

```js
// 단원 카드 더블클릭 → 수정 모달 (단순 한 번 클릭은 후속 태스크의 "선택"에 쓰임)
document.getElementById('member-list').addEventListener('dblclick', (e) => {
  const card = e.target.closest('[data-member-id]');
  if (!card) return;
  const m = state.members.find(x => x.id === card.dataset.memberId);
  if (m) openMemberModal(m);
});

// 필터 바 클릭
document.getElementById('member-filter').addEventListener('click', (e) => {
  const b = e.target.closest('button[data-chosung]');
  if (!b) return;
  filterChosung = (b.dataset.chosung === 'ALL') ? null : b.dataset.chosung;
  render();
});

// 모달 바깥 클릭/ESC로 닫기
document.getElementById('modal-backdrop').addEventListener('click', (e) => {
  if (e.target.id === 'modal-backdrop') closeModal();
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeModal();
});
```

- [ ] **Step 5: 자가테스트에 reduce 검증 추가**

`runSelfTests()` 안의 `tests` 배열 끝에 다음을 추가한다:

```js
() => {
  const s0 = { members: [], layout: INITIAL_LAYOUT, assignments: {} };
  const s1 = reduce(s0, { type: 'ADD_MEMBER', name: '테스트', memo: '' });
  assert(s1.members.length === 1 && s1.members[0].name === '테스트', 'ADD_MEMBER');
  const id = s1.members[0].id;
  const s2 = reduce(s1, { type: 'UPDATE_MEMBER', id, name: '수정', memo: '메모' });
  assert(s2.members[0].name === '수정' && s2.members[0].memo === '메모', 'UPDATE_MEMBER');
  const s3 = reduce(s2, { type: 'DELETE_MEMBER', id });
  assert(s3.members.length === 0, 'DELETE_MEMBER');
},
() => {
  const s0 = {
    members: [{id:'a',name:'김'}],
    layout: INITIAL_LAYOUT,
    assignments: { 'left-0-0': 'a' }
  };
  const s1 = reduce(s0, { type: 'DELETE_MEMBER', id: 'a' });
  assert(Object.keys(s1.assignments).length === 0, 'DELETE_MEMBER가 배치도 해제');
},
```

- [ ] **Step 6: 브라우저 검증**

- [+ 단원 추가] 클릭 → 모달이 뜨고, "테스트단원" 입력 후 저장 → 명단에 정렬 위치(`ㅌ`)에 추가
- 카운터가 `미배치 67 / 총 67명`으로 갱신
- 단원 카드 더블클릭 → 수정 모달, 이름 변경 후 저장 시 명단 갱신
- 같은 모달에서 [삭제] 클릭 → 확인창 → 명단/카운터 갱신
- 초성 필터 `ㄱ` 클릭 → 김씨들만 표시. `전체` 클릭으로 복귀
- 새로고침 후 데이터가 그대로 유지되는지 (localStorage)
- `?test=1`로 자가테스트 전부 통과

- [ ] **Step 7: 체크포인트**

`history-seating-chart.md`에 추가:

```markdown
## 2026-06-27 — Task 3 완료
- reduce/dispatch + 단원 CRUD 액션 3종
- 단원 추가/수정/삭제 모달
- 초성 필터 바, 명단 필터링
```

---

## Task 4: 탭 선택 배치 + × 해제

**Files:**
- Modify: `seating-chart/index.html`
- Modify: `seating-chart/history-seating-chart.md`

**Interfaces:**
- Consumes: Task 3의 `reduce`, `dispatch`, `state`, `render`
- Produces:
  - `reduce` 액션 `ASSIGN`, `UNASSIGN`, `SWAP`, `RESET_ASSIGNMENTS` 처리
  - 전역 선택 상태 `selection: { type:'member'|'seat', id|key } | null`
  - 탭 선택→배치 동작, 좌석 × 버튼으로 해제

- [ ] **Step 1: `reduce`에 좌석 액션 추가**

기존 `reduce` 함수의 `switch`에 다음 케이스를 추가한다:

```js
    case 'ASSIGN': {
      const next = { ...s.assignments };
      for (const k of Object.keys(next)) if (next[k] === action.memberId) delete next[k];
      next[action.seatKey] = action.memberId;
      return { ...s, assignments: next };
    }
    case 'UNASSIGN': {
      const next = { ...s.assignments };
      delete next[action.seatKey];
      return { ...s, assignments: next };
    }
    case 'SWAP': {
      const a = s.assignments[action.seatKeyA];
      const b = s.assignments[action.seatKeyB];
      const next = { ...s.assignments };
      if (b !== undefined) next[action.seatKeyA] = b; else delete next[action.seatKeyA];
      if (a !== undefined) next[action.seatKeyB] = a; else delete next[action.seatKeyB];
      return { ...s, assignments: next };
    }
    case 'RESET_ASSIGNMENTS': {
      return { ...s, assignments: {} };
    }
```

- [ ] **Step 2: 선택 상태 + 시각 표시**

```js
let selection = null;  // { type:'member', id } | { type:'seat', key } | null

function clearSelection() { selection = null; render(); }

function applySelectionHighlight() {
  document.querySelectorAll('.member-card.selected, .seat-cell.selected')
    .forEach(el => el.classList.remove('selected'));
  if (!selection) return;
  if (selection.type === 'member') {
    const el = document.querySelector(`.member-card[data-member-id="${selection.id}"]`);
    if (el) el.classList.add('selected');
  } else {
    const el = document.querySelector(`.seat-cell[data-seat-key="${selection.key}"]`);
    if (el) el.classList.add('selected');
  }
}
```

`render()` 마지막 줄에 `applySelectionHighlight();`를 추가한다.

- [ ] **Step 3: 클릭 핸들러 (이벤트 위임)**

`DOMContentLoaded` 안에 다음을 추가한다:

```js
// 단원 카드 단일 클릭 → 선택 / 배치
document.getElementById('member-list').addEventListener('click', (e) => {
  const card = e.target.closest('[data-member-id]');
  if (!card) return;
  const memberId = card.dataset.memberId;
  if (selection && selection.type === 'seat') {
    // 좌석 선택 상태에서 단원 클릭 → 배치
    dispatch({ type: 'ASSIGN', seatKey: selection.key, memberId });
    selection = null;
    render();
    return;
  }
  if (selection && selection.type === 'member' && selection.id === memberId) {
    selection = null; render(); return; // 재선택 = 해제
  }
  selection = { type: 'member', id: memberId };
  applySelectionHighlight();
});

// 좌석 클릭 → × 해제 / 선택 / 배치
document.getElementById('seat-grid').addEventListener('click', (e) => {
  // × 버튼: 즉시 UNASSIGN
  if (e.target.dataset.role === 'unassign') {
    const cell = e.target.closest('[data-seat-key]');
    if (cell) dispatch({ type: 'UNASSIGN', seatKey: cell.dataset.seatKey });
    return;
  }
  const cell = e.target.closest('[data-seat-key]');
  if (!cell) return;
  const key = cell.dataset.seatKey;
  const isOccupied = cell.classList.contains('occupied');
  if (selection && selection.type === 'member') {
    if (isOccupied) {
      // 단원 선택 상태에서 점유된 좌석 클릭 → 무시 (혼선 방지). 빈 좌석에만 배치
      return;
    }
    dispatch({ type: 'ASSIGN', seatKey: key, memberId: selection.id });
    selection = null; render();
    return;
  }
  if (isOccupied) return; // 점유 좌석 본체 클릭은 v1에서 동작 없음 (× 만 사용)
  if (selection && selection.type === 'seat' && selection.key === key) {
    selection = null; render(); return;
  }
  selection = { type: 'seat', key };
  applySelectionHighlight();
});

// 빈 영역 클릭 시 선택 해제
document.body.addEventListener('click', (e) => {
  if (e.target.closest('.member-card, .seat-cell, #toolbar, #modal-backdrop, button')) return;
  if (selection) clearSelection();
});
```

- [ ] **Step 4: 자가테스트 추가**

`runSelfTests()`의 `tests` 배열 끝에:

```js
() => {
  const s0 = { members: [{id:'a',name:'김'},{id:'b',name:'박'}], layout: INITIAL_LAYOUT, assignments: {} };
  const s1 = reduce(s0, { type:'ASSIGN', seatKey:'left-0-0', memberId:'a' });
  assert(s1.assignments['left-0-0'] === 'a', 'ASSIGN 배치');
  const s2 = reduce(s1, { type:'ASSIGN', seatKey:'left-0-1', memberId:'a' });
  assert(s2.assignments['left-0-0'] === undefined && s2.assignments['left-0-1'] === 'a', 'ASSIGN 시 다른 좌석 자동 해제');
  const s3 = reduce(s2, { type:'UNASSIGN', seatKey:'left-0-1' });
  assert(s3.assignments['left-0-1'] === undefined, 'UNASSIGN');
  const s4 = reduce(s0, { type:'ASSIGN', seatKey:'left-0-0', memberId:'a' });
  const s5 = reduce(s4, { type:'ASSIGN', seatKey:'left-0-1', memberId:'b' });
  const s6 = reduce(s5, { type:'SWAP', seatKeyA:'left-0-0', seatKeyB:'left-0-1' });
  assert(s6.assignments['left-0-0'] === 'b' && s6.assignments['left-0-1'] === 'a', 'SWAP 양쪽 점유');
  const s7 = reduce(s4, { type:'SWAP', seatKeyA:'left-0-0', seatKeyB:'left-0-2' });
  assert(s7.assignments['left-0-2'] === 'a' && s7.assignments['left-0-0'] === undefined, 'SWAP 한쪽 빈 좌석');
  const s8 = reduce(s5, { type:'RESET_ASSIGNMENTS' });
  assert(Object.keys(s8.assignments).length === 0 && s8.members.length === 2, 'RESET_ASSIGNMENTS는 멤버 유지');
},
```

- [ ] **Step 5: 브라우저 검증 (탭 배치)**

- 단원 카드 클릭 → 파란 테두리 표시
- 빈 좌석 클릭 → 단원이 좌석으로 이동, 명단에서 사라짐, 선택 해제, 카운터 갱신
- 반대 순서: 빈 좌석 먼저 클릭(파란 테두리) → 단원 카드 클릭 시 배치
- 좌석 우측 상단 × → 즉시 해제, 명단에 복귀
- 같은 단원/좌석 재클릭 시 선택 해제
- 빈 영역(배경) 클릭 → 선택 해제
- `?test=1` 통과

- [ ] **Step 6: 체크포인트**

`history-seating-chart.md`에 추가:

```markdown
## 2026-06-27 — Task 4 완료
- ASSIGN/UNASSIGN/SWAP/RESET_ASSIGNMENTS 리듀서
- 탭 선택 → 배치, × 버튼 해제
```

---

## Task 5: 드래그&드롭 (PC)

**Files:**
- Modify: `seating-chart/index.html`
- Modify: `seating-chart/history-seating-chart.md`

**Interfaces:**
- Consumes: Task 4의 `dispatch`, `state`, `ASSIGN`/`UNASSIGN`/`SWAP` 액션
- Produces:
  - 단원 카드 `draggable="true"`, 좌석 셀 `draggable`(점유된 것만)
  - dataTransfer 페이로드 규약:
    - 단원: `{ kind:'member', memberId }`
    - 좌석: `{ kind:'seat', seatKey }`
  - 드롭 대상: 빈 좌석, 점유 좌석, 명단 영역(좌석에서만 드롭 시 UNASSIGN)

- [ ] **Step 1: 단원 카드·좌석 셀에 draggable 부여**

`renderMemberList()`에서 `card`를 만든 직후 `card.draggable = true;`를 추가한다.
`makeSeatCell()`에서 점유 좌석에만 `cell.draggable = true;`를 추가한다 (`if (memberId) { ... cell.draggable = true; }`).

- [ ] **Step 2: 드래그/드롭 핸들러 추가**

`DOMContentLoaded` 안 마지막에 다음을 추가한다:

```js
function payloadToDT(dt, obj) {
  dt.setData('application/json', JSON.stringify(obj));
  dt.effectAllowed = 'move';
}

function payloadFromDT(dt) {
  try { return JSON.parse(dt.getData('application/json')); }
  catch { return null; }
}

document.getElementById('member-list').addEventListener('dragstart', (e) => {
  const card = e.target.closest('[data-member-id]');
  if (!card) return;
  payloadToDT(e.dataTransfer, { kind: 'member', memberId: card.dataset.memberId });
});

document.getElementById('seat-grid').addEventListener('dragstart', (e) => {
  const cell = e.target.closest('[data-seat-key]');
  if (!cell || !cell.classList.contains('occupied')) return;
  payloadToDT(e.dataTransfer, { kind: 'seat', seatKey: cell.dataset.seatKey });
});

// 좌석 드롭
document.getElementById('seat-grid').addEventListener('dragover', (e) => {
  if (e.target.closest('[data-seat-key]')) { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; }
});
document.getElementById('seat-grid').addEventListener('drop', (e) => {
  const cell = e.target.closest('[data-seat-key]');
  if (!cell) return;
  e.preventDefault();
  const payload = payloadFromDT(e.dataTransfer);
  if (!payload) return;
  const targetKey = cell.dataset.seatKey;
  const targetOccupied = !!state.assignments[targetKey];

  if (payload.kind === 'member') {
    // 단원 → 좌석. 점유면 자연스럽게 자동 해제 후 배치(ASSIGN이 같은 단원 다른 좌석 자동 해제 처리).
    // 단, 단원 명단에서 끌었으니 단원은 미배치. 목적지가 점유면 그 점유 단원은 명단으로 복귀시킨다.
    if (targetOccupied) dispatch({ type: 'UNASSIGN', seatKey: targetKey });
    dispatch({ type: 'ASSIGN', seatKey: targetKey, memberId: payload.memberId });
  } else if (payload.kind === 'seat') {
    if (payload.seatKey === targetKey) return;
    if (targetOccupied) {
      dispatch({ type: 'SWAP', seatKeyA: payload.seatKey, seatKeyB: targetKey });
    } else {
      // 단원 이동: 원래 자리의 단원 ID를 들고 ASSIGN하면 자동으로 원래 자리는 해제됨
      const memberId = state.assignments[payload.seatKey];
      if (memberId) dispatch({ type: 'ASSIGN', seatKey: targetKey, memberId });
    }
  }
});

// 명단 영역에 좌석 드롭 → UNASSIGN
document.getElementById('member-panel').addEventListener('dragover', (e) => {
  e.preventDefault(); e.dataTransfer.dropEffect = 'move';
});
document.getElementById('member-panel').addEventListener('drop', (e) => {
  const payload = payloadFromDT(e.dataTransfer);
  if (!payload || payload.kind !== 'seat') return;
  e.preventDefault();
  dispatch({ type: 'UNASSIGN', seatKey: payload.seatKey });
});
```

- [ ] **Step 3: 브라우저 검증 (PC 크롬)**

- 명단의 단원 카드를 빈 좌석으로 드래그 → 배치
- 좌석에서 다른 빈 좌석으로 드래그 → 이동 (원래 자리 빈 좌석으로)
- 두 점유 좌석 간 드래그 → 스왑
- 점유 좌석에서 명단 영역으로 드래그 → 명단으로 복귀
- 명단의 단원을 점유 좌석에 드롭 → 기존 단원이 명단으로 빠지고 새 단원이 좌석에 배치
- 모바일에서는 HTML5 드래그가 동작하지 않는 것이 정상 (탭 선택을 쓰면 됨) — 다음 태스크의 PNG 단계에서 모바일 확인을 진행
- `?test=1` 통과 유지

- [ ] **Step 4: 체크포인트**

```markdown
## 2026-06-27 — Task 5 완료
- 드래그&드롭: 명단→좌석 배치, 좌석↔좌석 이동/스왑, 좌석→명단 해제
- 점유 좌석에 다른 단원 드롭 시 기존 단원 자동 복귀
```

---

## Task 6: 레이아웃 편집 모달

**Files:**
- Modify: `seating-chart/index.html`
- Modify: `seating-chart/history-seating-chart.md`

**Interfaces:**
- Consumes: Task 4의 `reduce`, Task 2의 `state`
- Produces:
  - `reduce` 액션 `UPDATE_LAYOUT` 처리 (사라지는 좌석의 배치는 자동 해제)
  - 툴바 [레이아웃 편집] 버튼
  - 좌·우 각 9행 인원수(0~10) 입력, 실시간 합계 표시, 저장 전 사라질 단원 경고

- [ ] **Step 1: `reduce`에 `UPDATE_LAYOUT` 추가**

기존 `reduce`의 `switch`에 추가:

```js
    case 'UPDATE_LAYOUT': {
      const newLayout = { ...s.layout, [action.side]: [...action.rowCounts] };
      const next = {};
      for (const [k, v] of Object.entries(s.assignments)) {
        const { side, row, col } = parseSeatKey(k);
        const count = (newLayout[side] || [])[row] || 0;
        if (col < count) next[k] = v;
      }
      return { ...s, layout: newLayout, assignments: next };
    }
```

- [ ] **Step 2: 레이아웃 편집 모달 함수**

```js
function openLayoutModal() {
  const rows = state.layout.left.length;
  const inputsHtml = [];
  for (let r = 0; r < rows; r++) {
    inputsHtml.push(`
      <tr>
        <td>${r + 1}행</td>
        <td><input type="number" min="0" max="10" data-side="left" data-row="${r}" value="${state.layout.left[r]}" style="width:50px"></td>
        <td><input type="number" min="0" max="10" data-side="right" data-row="${r}" value="${state.layout.right[r]}" style="width:50px"></td>
      </tr>
    `);
  }
  openModal(`
    <h3 style="margin:0 0 12px;">레이아웃 편집</h3>
    <table style="border-collapse:collapse; width:100%;">
      <thead><tr><th></th><th>Left Side</th><th>Right Side</th></tr></thead>
      <tbody>${inputsHtml.join('')}</tbody>
    </table>
    <p id="lm-sum" style="margin:8px 0; font-size:13px;"></p>
    <div style="display:flex; gap:8px; justify-content:flex-end;">
      <button type="button" id="lm-cancel">취소</button>
      <button type="button" id="lm-save">저장</button>
    </div>
  `, (box) => {
    function snapshot() {
      const left = [], right = [];
      box.querySelectorAll('input[data-side]').forEach(inp => {
        const v = Math.max(0, Math.min(10, parseInt(inp.value || '0', 10) || 0));
        (inp.dataset.side === 'left' ? left : right)[parseInt(inp.dataset.row,10)] = v;
      });
      return { left, right };
    }
    function refreshSum() {
      const cur = snapshot();
      const total = getTotalSeats(cur);
      const mc = state.members.length;
      const diff = total - mc;
      const note = diff === 0 ? '✓ 좌석 수 = 단원 수' : (diff > 0 ? `좌석이 ${diff} 많음 (미배치 가능)` : `좌석이 ${-diff} 부족 (배치 불가)`);
      box.querySelector('#lm-sum').textContent = `좌석 ${total} / 단원 ${mc}명 — ${note}`;
    }
    box.addEventListener('input', refreshSum);
    refreshSum();

    box.querySelector('#lm-cancel').onclick = closeModal;
    box.querySelector('#lm-save').onclick = () => {
      const cur = snapshot();
      const total = getTotalSeats(cur);
      if (total === 0) { alert('모든 행이 0입니다. 저장할 수 없습니다.'); return; }
      // 사라질 좌석의 단원 확인
      const lost = [];
      for (const [k, v] of Object.entries(state.assignments)) {
        const { side, row, col } = parseSeatKey(k);
        const newCount = cur[side][row];
        if (col >= newCount) {
          const m = state.members.find(x => x.id === v);
          if (m) lost.push(m.name);
        }
      }
      if (lost.length > 0) {
        if (!confirm(`변경 시 다음 ${lost.length}명이 명단으로 돌아갑니다:\n${lost.join(', ')}\n계속할까요?`)) return;
      }
      dispatch({ type: 'UPDATE_LAYOUT', side: 'left',  rowCounts: cur.left });
      dispatch({ type: 'UPDATE_LAYOUT', side: 'right', rowCounts: cur.right });
      closeModal();
    };
  });
}
```

- [ ] **Step 3: 툴바 버튼 추가**

`renderToolbar()`의 innerHTML을 다음으로 교체한다:

```js
  el.innerHTML = `
    <button type="button" id="tb-add-member">+ 단원 추가</button>
    <button type="button" id="tb-edit-layout">레이아웃 편집</button>
  `;
  el.querySelector('#tb-add-member').onclick = () => openMemberModal(null);
  el.querySelector('#tb-edit-layout').onclick = openLayoutModal;
```

- [ ] **Step 4: 자가테스트 추가**

`runSelfTests()`의 `tests` 배열 끝에:

```js
() => {
  const s0 = {
    members: [{id:'a',name:'김'}],
    layout: { left:[2,2], right:[1,1] },
    assignments: { 'left-1-1': 'a' }   // col=1
  };
  const s1 = reduce(s0, { type:'UPDATE_LAYOUT', side:'left', rowCounts:[2,1] });
  assert(s1.assignments['left-1-1'] === undefined, 'UPDATE_LAYOUT 축소 시 좌석 자동 해제');
  assert(s1.layout.left[1] === 1 && s1.layout.right[1] === 1, 'UPDATE_LAYOUT 다른 사이드 보존');
},
```

- [ ] **Step 5: 브라우저 검증**

- [레이아웃 편집] 클릭 → 모달, 합계 `좌석 66 / 단원 66명 — ✓ 좌석 수 = 단원 수`
- Left 1행을 6→4로 줄이고 저장 → 사라질 단원이 있다면 확인창. 진행 시 그 단원이 명단으로 복귀
- 우측 1행을 2→3으로 늘리고 저장 → 좌석 1칸 증가, 합계 갱신
- 새로고침 시 변경된 레이아웃 유지
- `?test=1` 통과

- [ ] **Step 6: 체크포인트**

```markdown
## 2026-06-27 — Task 6 완료
- UPDATE_LAYOUT 액션, 사라지는 좌석 자동 해제
- 레이아웃 편집 모달 (실시간 합계, 사라질 단원 사전 경고)
```

---

## Task 7: PNG 다운로드

**Files:**
- Modify: `seating-chart/index.html`

**Interfaces:**
- Consumes: Task 6까지의 모든 렌더
- Produces:
  - `<head>`에 `html2canvas` CDN 스크립트 추가
  - `downloadPng()` 함수, 툴바 [PNG 다운로드] 버튼
  - 파일명 형식: `seating-chart-YYYYMMDD-HHmm.png`

- [ ] **Step 1: CDN 스크립트 추가**

`<head>` 안 `<title>` 아래에 추가:

```html
<script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js" crossorigin="anonymous"></script>
```

- [ ] **Step 2: 다운로드 함수**

```js
function pad2(n) { return n < 10 ? '0' + n : '' + n; }
function timestamp() {
  const d = new Date();
  return `${d.getFullYear()}${pad2(d.getMonth()+1)}${pad2(d.getDate())}-${pad2(d.getHours())}${pad2(d.getMinutes())}`;
}

async function downloadPng() {
  if (typeof html2canvas !== 'function') {
    alert('이미지 라이브러리를 불러올 수 없습니다. 인터넷 연결을 확인하세요.');
    return;
  }
  const area = document.getElementById('seat-area');
  // 좁은 화면에서 잘리지 않도록 임시로 폭을 넓힌다
  const origStyle = area.getAttribute('style') || '';
  area.style.width = Math.max(area.scrollWidth, 800) + 'px';
  try {
    const canvas = await html2canvas(area, { backgroundColor: '#ffffff', scale: 2 });
    const a = document.createElement('a');
    a.href = canvas.toDataURL('image/png');
    a.download = `seating-chart-${timestamp()}.png`;
    document.body.appendChild(a); a.click(); a.remove();
  } catch (e) {
    alert('이미지 생성에 실패했습니다: ' + e.message);
  } finally {
    area.setAttribute('style', origStyle);
  }
}
```

- [ ] **Step 3: 툴바 버튼 추가**

`renderToolbar()`의 innerHTML을 다음으로 교체:

```js
  el.innerHTML = `
    <button type="button" id="tb-add-member">+ 단원 추가</button>
    <button type="button" id="tb-edit-layout">레이아웃 편집</button>
    <button type="button" id="tb-png">PNG 다운로드</button>
  `;
  el.querySelector('#tb-add-member').onclick = () => openMemberModal(null);
  el.querySelector('#tb-edit-layout').onclick = openLayoutModal;
  el.querySelector('#tb-png').onclick = downloadPng;
```

- [ ] **Step 4: 브라우저 검증**

- 일부 좌석 배치된 상태에서 [PNG 다운로드] 클릭 → `seating-chart-YYYYMMDD-HHmm.png` 다운로드
- 다운로드된 PNG를 열어 좌석 배치도 영역이 그대로 캡처되었는지 확인
- 모바일 크롬에서도 시도: 좁은 폭이어도 잘리지 않고 800px 이상 폭으로 저장되는지

- [ ] **Step 5: 체크포인트**

```markdown
## 2026-06-27 — Task 7 완료
- html2canvas로 좌석 영역 PNG 캡처
- 파일명: seating-chart-YYYYMMDD-HHmm.png
- 좁은 화면 임시 확장 후 캡처
```

---

## Task 8: 초기화 버튼 + 반응형

**Files:**
- Modify: `seating-chart/index.html`

**Interfaces:**
- Consumes: 이전까지의 모든 렌더·dispatch
- Produces:
  - 툴바 [초기화] 버튼 → `RESET_ASSIGNMENTS` (단원/레이아웃은 보존)
  - 모바일(768px 미만) 가로 스크롤 + 명단 카드 줄바꿈 점검

- [ ] **Step 1: 초기화 버튼**

`renderToolbar()`의 innerHTML을 교체:

```js
  el.innerHTML = `
    <button type="button" id="tb-add-member">+ 단원 추가</button>
    <button type="button" id="tb-edit-layout">레이아웃 편집</button>
    <button type="button" id="tb-png">PNG 다운로드</button>
    <button type="button" id="tb-reset" style="color:#d33;">초기화</button>
  `;
  el.querySelector('#tb-add-member').onclick = () => openMemberModal(null);
  el.querySelector('#tb-edit-layout').onclick = openLayoutModal;
  el.querySelector('#tb-png').onclick = downloadPng;
  el.querySelector('#tb-reset').onclick = () => {
    if (confirm('모든 좌석 배치를 해제할까요? (단원 명단과 레이아웃은 유지됩니다)')) {
      dispatch({ type: 'RESET_ASSIGNMENTS' });
    }
  };
```

- [ ] **Step 2: 반응형 CSS 보강**

`<style>` 끝에 추가:

```css
@media (max-width: 768px) {
  body { padding: 8px; }
  h1 { font-size: 16px; }
  #seat-area { padding: 8px; }
  .seat-cell { width: 44px; height: 26px; font-size: 11px; }
  .seat-row { grid-template-columns: 1fr 16px 1fr; gap: 3px; }
  #seat-grid { min-width: 600px; } /* 가로 스크롤 강제 */
}
```

- [ ] **Step 3: 브라우저 검증**

- [초기화] → 확인창 → 모든 좌석 비워지고 명단에 66명 복귀, 레이아웃은 유지
- 모바일 폭(개발자 도구의 iPhone 시뮬레이션 등)에서 좌석 영역만 가로 스크롤이 되고 페이지 전체 스크롤은 정상 동작하는지
- 명단의 단원 카드가 줄바꿈으로 잘 보이는지

- [ ] **Step 4: 체크포인트**

```markdown
## 2026-06-27 — Task 8 완료
- 초기화 버튼 (배치만 해제, 단원/레이아웃 보존)
- 모바일 반응형: 좌석 영역 가로 스크롤
```

---

## Task 9: README 작성 + 최종 수동 체크리스트 통과

**Files:**
- Create: `seating-chart/README.md`
- Modify: `seating-chart/history-seating-chart.md`

**Interfaces:**
- Consumes: 완성된 `index.html`
- Produces: 사용 가이드 + 검증 결과 기록

- [ ] **Step 1: README 작성**

다음 내용으로 `seating-chart/README.md`를 생성한다:

```markdown
# 성가대 좌석 배치도

교회 성가대(66명) 좌석 배치를 PC/모바일 브라우저에서 직접 편집·저장·이미지로 공유하는 단일 HTML 도구.

## 사용 방법

1. `index.html`을 브라우저로 열기 (더블클릭).
2. 단원 카드를 클릭(또는 드래그) → 빈 좌석을 클릭(또는 드롭).
3. 좌석의 × 버튼으로 배치 해제. 모바일에서는 × → 카드 → 새 좌석 순으로 이동.
4. [PNG 다운로드]로 이미지 저장, 카카오톡/밴드 등에 공유.

## 주요 기능

- 드래그&드롭(PC) + 탭 선택(모바일) 배치
- 한글 가나다 자동 정렬, 초성(ㄱ~ㅎ) 필터
- 좌·우 9행 레이아웃 직접 편집
- 브라우저 localStorage 자동 저장
- PNG 이미지 다운로드

## 데이터 위치

브라우저 localStorage 키: `seating-chart-v1`
시크릿 모드에서는 저장이 비활성화되며 상단에 경고가 표시됩니다.

## 자가테스트

`index.html?test=1`로 열면 콘솔에 자가테스트 결과가 출력됩니다.

## 수동 체크리스트

- [ ] 단원 추가/수정/삭제
- [ ] 가나다 정렬
- [ ] 초성 필터 ㄱ~ㅎ
- [ ] 드래그&드롭 (PC)
- [ ] 탭 선택 배치 (모바일)
- [ ] 좌석 ↔ 좌석 스왑
- [ ] 좌석 → 명단 드래그 해제
- [ ] × 버튼 해제
- [ ] 카운터 갱신
- [ ] Left 우측 정렬, Right 좌측 정렬
- [ ] 빈 행 통로 표시
- [ ] 레이아웃 편집 후 사라진 좌석 자동 복귀
- [ ] PNG 다운로드 (PC + 모바일)
- [ ] 초기화 (배치만 해제)
- [ ] 새로고침 후 데이터 유지
- [ ] 시크릿 모드 경고 배너

## 기술 스택

Vanilla JS + HTML5 DnD + localStorage + html2canvas (CDN). 빌드 도구 없음.
```

- [ ] **Step 2: 전체 체크리스트 수동 통과**

위 체크리스트를 한 항목씩 직접 확인한다. 실패 항목이 있으면 해당 태스크로 돌아가 수정한 후 재확인.

- [ ] **Step 3: 최종 체크포인트**

`history-seating-chart.md`에 추가:

```markdown
## 2026-06-27 — Task 9 (최종) 완료
- README.md 작성
- 수동 체크리스트 전 항목 통과
- 자가테스트 N/N 통과
- 배포 가능 상태
```

---

## 자체 검토 (계획 작성 후 점검)

1. **스펙 커버리지**:
   - 요구사항 표의 모든 항목이 태스크에 매핑됨
     - 드래그+탭 배치 → Task 4, 5
     - 반응형 → Task 8
     - localStorage → Task 2
     - Left/Right 정렬·빈 행 → Task 2 CSS
     - 이름+메모 → Task 3 모달
     - 가나다 정렬 → Task 2 `sortMembersByName`
     - 초성 필터 → Task 3
     - 미배치만 표시·배치 시 제거 → Task 2 `getUnassignedMembers`
     - 카운터 → Task 2 `renderCounter`
     - 배치본 1개(덮어쓰기) → 기본(`saveState` 단일 키)
     - PNG + 화면 공유 → Task 7 (화면 공유는 항상 가능)
     - 단원 1명씩 추가/수정/삭제 → Task 3
     - 66명 시드 → Task 1·2
   - 에러/엣지 케이스 6.1~6.6 모두 매핑됨
   - 자가테스트 7.2 항목 모두 매핑됨

2. **플레이스홀더**: TBD/TODO/"적절히 처리" 등의 표현 없음. 모든 단계에 실제 코드/명령/기대값 포함.

3. **타입/이름 일관성**:
   - 액션 타입 `ASSIGN`/`UNASSIGN`/`SWAP`/`ADD_MEMBER`/`UPDATE_MEMBER`/`DELETE_MEMBER`/`UPDATE_LAYOUT`/`RESET_ASSIGNMENTS` — 정의된 곳과 호출된 곳 일치 확인 완료
   - `seatKey(side,row,col)`/`parseSeatKey(key)` — Task 1에서 정의, Task 4·6·드래그에서 동일 시그니처 사용
   - `dispatch(action)`/`reduce(state, action)` — Task 3에서 정의, 이후 일관 사용
   - DOM data 속성 `data-member-id`/`data-seat-key` — 모든 렌더와 핸들러에서 동일
