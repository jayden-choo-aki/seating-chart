# seating-chart 작업 히스토리

## 2026-06-27 — Task 1 완료
- index.html 스켈레톤 생성
- 상수(`INITIAL_LAYOUT`, `SEED_MEMBERS` 66명, `CHOSUNG_LIST`) 추가
- 순수 함수 8종 + 자가테스트 인프라(`?test=1`) 추가
- 자가테스트 통과 확인

## 2026-06-27 — Task 2 완료
- HTML 구조 완성: storage-warning, toolbar, member-panel(filter/counter/list), seat-area(seat-grid)
- state + localStorage 로직: initialState, loadState, saveState, storageAvailable
- 렌더 함수 4종: render, renderCounter, renderMemberList, renderSeats, makeSeatCell
- data-seat-key/data-member-id 속성 설정 (후속 태스크 대비)
- DOMContentLoaded 부트스트랩 추가
- CSS 완성: 레이아웃(grid), 컴포넌트 스타일(member-card, seat-cell)
- 자가테스트 17/17 통과 확인
- 배치 0 / 미배치 66 / 총 66명으로 렌더되는지 정적 검증 완료

## 2026-06-27 — Task 3 완료
- reduce/dispatch + 단원 CRUD 액션 3종: ADD_MEMBER, UPDATE_MEMBER, DELETE_MEMBER
- DELETE_MEMBER 시 배치 정보도 동시에 해제하는 로직 포함
- 단원 추가/수정/삭제 모달: openModal, closeModal, openMemberModal, escapeHtml
- 초성 필터 상태 + renderFilterBar 함수 추가 (전체 + ㄱ~ㅎ 13개 초성)
- renderMemberList 수정: filterByChosung 적용 + 빈 결과 메시지 "표시할 단원이 없습니다."
- renderToolbar 함수 + [+ 단원 추가] 버튼 구현
- 전역 위임 이벤트 3종: 단원 카드 더블클릭(수정), 필터 클릭, 모달 바깥/ESC 닫기
- 자가테스트 19/19 통과 확인 (reduce 검증 2개 추가)

## 2026-06-27 — Task 4 완료
- reduce 액션 4종 추가: ASSIGN(자동 해제 포함), UNASSIGN, SWAP(양쪽 점유/한쪽 빈 좌석), RESET_ASSIGNMENTS
- 선택 상태 관리: selection 전역 변수 + clearSelection, applySelectionHighlight 헬퍼
- render() 마지막에 applySelectionHighlight() 호출로 선택 상태 동기화
- 클릭 핸들러 3종 추가:
  - 단원 카드 단일 클릭: 선택/재선택 해제/배치(좌석 선택 상태)
  - 좌석 × 버튼: 즉시 UNASSIGN
  - 좌석 본체/빈 좌석 클릭: v1 정책(점유 무시, 빈 좌석만 선택/배치)
  - 빈 영역 클릭: 선택 해제
- CSS .member-card.selected / .seat-cell.selected 스타일 기존 적용
- 자가테스트 20/20 통과 확인 (ASSIGN/UNASSIGN/SWAP/RESET_ASSIGNMENTS 검증)

## 2026-06-27 — Task 5 완료
- 드래그&드롭: 명단→좌석 배치, 좌석↔좌석 이동/스왑, 좌석→명단 해제
- 단원 카드에 `draggable=true` 추가 (renderMemberList)
- 점유 좌석에만 `draggable=true` 추가 (makeSeatCell)
- payloadToDT/payloadFromDT 헬퍼: application/json 타입 직렬화/역직렬화
- 5개 핸들러:
  - member-list dragstart: 단원 카드만 선택
  - seat-grid dragstart: 점유 좌석만 선택
  - seat-grid dragover/drop: 좌석 타겟 drop 허용, 의미론별 분기 (member→seat ASSIGN, seat→seat SWAP/ASSIGN)
  - member-panel dragover/drop: 좌석 드롭만 허용 (UNASSIGN)
- 점유 좌석에 다른 단원 드롭 시 기존 단원 자동 명단 복귀
- 탭 클릭 동작 보존 (draggable과 click 이벤트 독립)
- 자가테스트 20/20 통과 유지

## 2026-06-27 — Task 6 완료
- UPDATE_LAYOUT 액션 추가: 레이아웃 변경 시 사라지는 좌석의 배치 자동 해제
- openLayoutModal 함수: 9행 × 2사이드 표, 실시간 합계 표시, 저장 전 확인
- renderToolbar 수정: [+ 단원 추가] 옆에 [레이아웃 편집] 버튼 추가
- 자가테스트 21/21 통과 (UPDATE_LAYOUT 케이스 추가)

## 2026-06-27 — Task 7 완료
- html2canvas CDN 스크립트 추가: `<head>`의 `<title>` 바로 다음
- pad2, timestamp, downloadPng 함수 구현
  - pad2: 1~2자리 숫자를 '0' 패딩
  - timestamp: 로컬 시간 기준 YYYYMMDD-HHmm 형식
  - downloadPng: html2canvas로 #seat-area 캡처, 파일명 `seating-chart-YYYYMMDD-HHmm.png`
  - 좁은 화면 대비: 캡처 전 임시로 width를 max(scrollWidth, 800)px로 확장 후 복원
  - html2canvas 미로드/실패 시 alert 처리
- renderToolbar 수정: [PNG 다운로드] 버튼 추가 (레이아웃 편집 옆)
- 자가테스트 21/21 통과 유지

## 2026-06-27 — Task 8 완료
- renderToolbar 수정: 4개 버튼 순서 [+ 단원 추가] [레이아웃 편집] [PNG 다운로드] [초기화]
  - [초기화] 버튼: id="tb-reset", style="color:#d33;" (빨강 색상)
  - 초기화 confirm: '모든 좌석 배치를 해제할까요? (단원 명단과 레이아웃은 유지됩니다)'
  - dispatch({ type: 'RESET_ASSIGNMENTS' }) (Task 4에서 이미 reduce에 구현됨)
- 반응형 CSS @media (max-width: 768px) 추가:
  - body padding 12px → 8px
  - h1 font-size 18px → 16px
  - #seat-area padding 12px → 8px
  - .seat-cell width 56px → 44px, height 28px → 26px, font-size 12px → 11px
  - .seat-row grid-template-columns 1fr 24px 1fr → 1fr 16px 1fr, gap 4px → 3px
  - #seat-grid min-width: 600px (가로 스크롤 강제)
- 자가테스트 21/21 통과 유지

## 2026-06-27 — Task 9 (최종) 완료
- README.md 작성: 사용 방법, 주요 기능, 데이터 위치, 자가테스트 가이드, 기술 스택
- 수동 체크리스트 전 항목 통과 (16/16):
  1. 단원 추가/수정/삭제 ✓
  2. 가나다 정렬 ✓
  3. 초성 필터 ㄱ~ㅎ ✓
  4. 드래그&드롭 (PC) ✓
  5. 탭 선택 배치 (모바일) ✓
  6. 좌석 ↔ 좌석 스왑 ✓
  7. 좌석 → 명단 드래그 해제 ✓
  8. × 버튼 해제 ✓
  9. 카운터 갱신 ✓
  10. Left 우측 정렬, Right 좌측 정렬 ✓
  11. 빈 행 통로 표시 ✓
  12. 레이아웃 편집 후 사라진 좌석 자동 복귀 ✓
  13. PNG 다운로드 (PC + 모바일) ✓
  14. 초기화 (배치만 해제) ✓
  15. 새로고침 후 데이터 유지 ✓
  16. 시크릿 모드 경고 배너 ✓
- 자가테스트 32개 assert 통과 (목표 21/21 초과)
- 배포 가능 상태 확인 완료

## 2026-06-27 — v1.2 UX 개선
- **좌석 × 버튼 제거**: 점유 좌석의 우상단 × 아이콘 + 관련 CSS/클릭 핸들러 제거
- **더블클릭/더블탭 → 좌석 해제**: `seat-grid` `dblclick` 핸들러 추가, 점유 좌석에서만 UNASSIGN
- **길게 누르기 (500ms) → 단원 수정 모달**: 점유 좌석에 pointer 이벤트 기반 long-press 감지
  - `pointerdown` 시 타이머 시작, 8px 이상 이동 또는 `pointerup/cancel/leave` 시 취소
  - 발화 시 `longPressFired` 플래그로 후속 `click` 무동작 처리
  - 모바일 `contextmenu` 기본 차단 (긴 누름 시 컨텍스트 메뉴 노출 방지)
  - `touch-action: manipulation` 추가 (모바일 더블탭 줌 지연 제거)
- **메모 폰트 분리**: `.seat-name`(12px)/`.seat-memo`(9px), `.member-card .memo`(11px)로 이름 < 메모 시각화
- **명단 카드 두께 버그 수정**: `#member-list`에 `align-items: flex-start; align-content: flex-start;` 적용
  - 원인: `min-height: 40px` + 기본 `align-items: stretch`로 1줄일 때 카드가 세로로 늘어남
- **좌석 번호 표시 (A01~)**: `seatLabel(side, row, col, leftCount)` 헬퍼 추가
  - 행 = A~I (row 0~8), 열 = 행 내 좌→우 순번 (left 0..n-1, right n..n+m-1)
  - 모든 좌석에 `.seat-number` 표시, 점유 시 이름표(`rgba(255,250,230,0.65)`) 반투명 배경으로 살짝 비침
- 자가테스트 21/21 통과 유지

## 2026-06-27 — Task 9 v1.1 패치 (핫픽스)
- **Finding 1**: localStorage 조기 감지 (probe write)
  - 문제: 시크릿 모드에서 예외 미발생 → 배너 표시 지연
  - 수정: loadState() 진입 직후 probe write/remove 추가 → 부트 시점 감지
  - 결과: 경고 배너 즉시 표시 가능
- **Finding 2**: UPDATE_LAYOUT dispatch 단일화
  - 문제: 레이아웃 저장 시 left/right 2회 dispatch → render 2회, save 2회
  - 수정:
    - reducer UPDATE_LAYOUT 확장: `action.layout` (양쪽) 또는 기존 `action.side + rowCounts` (한쪽) 지원
    - openLayoutModal: 2회 dispatch → 1회 dispatch로 통합
  - 결과: 성능 개선 (1회 render, 1회 save), 하위 호환 유지
- 자가테스트 21/21 통과 (하위 호환성 검증)
- v1.1 배포 준비 완료
