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

## 2026-06-27 — v1.2 GitHub Pages 공개 배포 (`ea60d3c`)
- 별도 git repo 초기화 → `github.com/jayden-choo-aki/seating-chart` public 생성
- GitHub Pages 활성화 (main / root), 빌드 시간 ~32초
- Live URL: https://jayden-choo-aki.github.io/seating-chart/
- 참고: SEED_MEMBERS 실명 66건 공개 노출 — 사용자 동의 후 진행

## 2026-06-27 — v1.2 모바일 행 정렬 일치 (`27f981e`)
- 문제: `grid-template-columns: 1fr 16px 1fr` + `min-width: 600px`로 좌석 수 다른 행(6/7개)의 우측 끝이 어긋남
- 해결:
  - `renderSeats`에서 `max(left)`, `max(right)` 계산해 CSS 변수 주입(`--max-left`, `--max-right`)
  - 모바일 미디어쿼리에서 컬럼 너비를 `calc(max-left * 44px + (max-left-1) * 3px)` 등 고정 폭 식으로 재정의
  - `#seat-grid` `min-width: 600px` → `min-width: max-content`
- 결과: A~G 6번 좌석과 H,I 7번 좌석이 동일 x축에 정렬, 아일 위치도 일치
- PC 레이아웃은 변경 없음 (사용자 피드백 반영)

## 2026-06-27 — v1.2 행 letter 재할당 + 색상 교체 + 자리번호 corner 라벨 (`ec0cfcb`)
- **행 letter 재할당** (`getRowLetterMap`):
  - 빈 행 건너뛰지 않고 좌석 있는 행에만 A부터 순서대로 부여
  - 매 렌더 새로 계산 → 레이아웃 편집으로 빈 행에 좌석 생기면 자동 재정렬
  - 구 `A,B,C,_,E,F,_,H,I` → 신 `A,B,C,_,D,E,_,F,G`
  - `seatLabel(letter, side, col, leftCount)`로 시그니처 변경
- **색상 교체** (사용자 피드백: 배치=안정감, 명단=조치 대기):
  - `.member-card`: 파랑 `#e9f1ff` → 노랑 `#fffae6`
  - `.seat-cell.occupied`: 노랑 `#fffae6` → 파랑 `#e9f1ff`
  - 점유 셀 이름·메모 반투명 배경 색도 파랑 톤으로 동기화
- **자리번호 표시 (Option C: corner badge)**:
  - 빈 좌석: 가운데 큰 워터마크 자리번호 유지
  - 점유 좌석: 좌상단 미니 라벨 (8px PC / 7px 모바일, 파랑톤 `#6b8fb8`)
  - 이름·메모 반투명 배경 제거 → 셀 자체가 "이름표" 역할
- 자가테스트 21/21 통과 유지

## 2026-06-27 — v1.2 문서·파일명 정리
- `history_seating-chart.md` → `history-seating-chart.md` (언더스코어 → 하이픈으로 통일)
- `docs/plan-seating-chart.md` 갱신:
  - 상태/Live URL/Repo 헤더 정보 추가
  - § 4-3 좌석 배치도: × 버튼 → 더블클릭/더블탭/길게누름 동작 반영, 자리번호 표시 규칙, 모바일 행 폭 통일, 색상 교체 명시
  - § 4-5 인터랙션 모드: × 동작 제거, 더블클릭/길게누름 추가
  - § 8 산출물 위치: history 파일명, Repo/Live URL 추가
  - § 9 v1.2 변경사항 새 섹션 (기존 9→10 재번호)
- v1.1 배포 준비 완료

## 2026-07-12 — v1.2.1 코드 리뷰 반영
- **loadState 스키마 검증**: `isValidState` 헬퍼 추가
  - 문제: 저장 데이터가 유효한 JSON이지만 필드가 깨진 경우(스키마 변경·부분 손상) 첫 렌더에서 크래시
  - 수정: 파싱 후 `members`/`layout.left`/`layout.right`/`assignments` 형태 검증, 실패 시 `.broken` 백업 후 초기 state 폴백
- **드롭 이중 dispatch 제거**: 점유 좌석에 단원 드롭 시 `UNASSIGN`+`ASSIGN` 2회 → `ASSIGN` 1회 (ASSIGN이 좌석을 덮어쓰므로 동작 동일, render/save 1회로 감소)
- **README v1.2 UX 반영**: × 버튼 안내 제거 → 더블클릭/더블탭 해제, 길게 누르기 수정 모달로 갱신, 수동 체크리스트 동기화
- 자가테스트 22/22 통과 (isValidState 케이스 추가)

## 2026-07-12 — v1.3 좌석 이동/교체 + PNG 여백 제거 + 오프라인 단일 파일
- **점유 좌석 클릭 선택 → 이동/교체**:
  - 배치된 좌석 클릭 시 선택 가능하도록 seat-grid 클릭 핸들러 확장
  - 좌석 선택 상태에서 다른 좌석 클릭: 한쪽이라도 점유면 `SWAP` dispatch (빈 좌석 → 이동, 둘 다 점유 → 서로 교체)
  - 둘 다 빈 좌석이면 선택만 이동, 같은 좌석 재클릭 = 선택 해제 (기존 유지)
  - 더블클릭 해제·길게누름 수정과 공존 (`longPressFired` 플래그 기존 로직 유지)
- **PNG 다운로드 여백 제거**:
  - 기존 `width = max(scrollWidth, 800)` 확장 방식 → `.capture-mode` 클래스 토글로 교체
  - `#seat-area.capture-mode`: `width: max-content` + 행 컬럼을 `--max-left`/`--max-right` 기반 고정 폭으로 재정의 (PC 56px/모바일 44px)
  - 결과: 콘텐츠 폭에 딱 맞는 캡처, 좌우 큰 공백 제거
- **오프라인 단일 파일화**:
  - html2canvas 1.4.1 CDN `<script src>` → 파일 내 인라인 `<script id="html2canvas-lib">` (~194KB, 총 ~233KB)
  - 인터넷 없는 환경에서도 PNG 다운로드 포함 전 기능 동작, index.html 파일 하나만 전달하면 됨
  - run_tests.js의 앱 스크립트 추출 regex(`/<script>/`)와 충돌하지 않도록 lib 태그에 id 속성 부여
  - 라이브러리에 `</script>` 리터럴 없음 확인, `node --check` 문법 검증 통과
- **선택 해제 시 render() 제거 (검증 중 발견한 회귀 수정)**:
  - 같은 좌석/카드 재클릭 해제 시 `render()`로 DOM을 재생성하면, 더블클릭의 두 번째 클릭이
    해제를 유발해 이어지는 `dblclick` 이벤트가 분리된 옛 요소에서 발생 → 해제/수정 모달 핸들러 미동작
  - 해제는 `applySelectionHighlight()`로 하이라이트만 제거하도록 변경 (좌석·명단 카드 양쪽)
  - 명단 카드 쪽은 기존부터 잠재하던 동일 문제(재선택 직후 더블클릭 수정 모달 안 열림)도 함께 해소
- README 갱신: 사용 방법(이동/교체, 오프라인), 주요 기능, 수동 체크리스트, 기술 스택
- 자가테스트 22/22 통과 + 헤드리스 Chrome(puppeteer) 실브라우저 검증 14항목 통과

## 2026-07-25 — v1.4 배치 보관함 (프리셋 3슬롯)
- **자주 쓰는 좌석 배치를 3개 슬롯에 저장/불러오기/삭제** (`💾 배치 보관함` 툴바 버튼 → 모달)
  - `SAVE_PRESET`: 현재 layout+assignments 스냅샷을 슬롯에 저장 (이름·savedAt 포함, 깊은 복사로 이후 변경과 독립)
  - `LOAD_PRESET`: 슬롯의 layout+assignments 복원. 저장 후 삭제된 단원 배정·레이아웃 범위 밖 좌석은 제외
  - E석(standby) 배정은 UPDATE_LAYOUT·RANDOM_ASSIGN과 동일하게 저장/복원 모두 보존, layout.standbyCols 호환 필드 유지
  - `DELETE_PRESET`: 슬롯만 비움 (현재 배치는 유지)
- state에 `presets: [null, null, null]` 추가. 구버전(v4 이하) 저장 데이터는 `normalizePresets`로 로드 시 자동 보정 (기존 `isValidState`는 그대로 통과 → 데이터 유실 없음)
- 모달 UX: 슬롯별 이름·배치 인원수·저장 시각 표시, 덮어쓰기/불러오기/삭제 시 confirm, 저장 시 prompt로 이름 입력(기본값 `배치 N`)
- 사용법 모달에 "💾 배치 보관함" 섹션 추가
- 콘솔 버전 v9, sw.js 캐시 `seating-chart-v9`로 상향 (원격 v8 — E석·iOS 토스트 작업 위에 rebase)
- 자가테스트 37/37 통과 (normalizePresets·SAVE/LOAD/DELETE_PRESET·삭제 단원 필터·E석 보존 6건 추가)

## 2026-07-25 — v1.4.1 배치 보관함 confirm 중복 버그 수정
- **증상**: 보관함을 열 때마다(저장 후 갱신 포함) 불러오기/삭제 confirm이 누적 횟수만큼 반복 표시
- **원인**: 모달마다 재사용되는 `#modal-box`에 `addEventListener`로 클릭 리스너를 걸어 openPresetModal 호출마다 리스너 누적
- **수정**: 슬롯 목록을 `#preset-slots` 래퍼로 감싸고 리스너를 래퍼에 부착 — innerHTML 교체 시 리스너도 함께 폐기 (다른 모달들의 `.onclick` 직접 할당 패턴과 동일한 수명)
- 실브라우저 회귀 테스트 추가: 모달 5회 열닫 + 저장 후 불러오기 클릭 시 confirm 정확히 1회 확인 (17/17 통과)
- 콘솔 버전 v10, sw.js 캐시 `seating-chart-v10`

## 2026-07-25 — v1.4.2 구역 제목 옆 배치 현황 표시 → 같은 날 롤백
- v11에서 A석·B석·E석 제목 옆 `배치 N · 빈 N · 총 N` 현황을 추가했으나 사용자 요청으로 되돌림 (git revert d6cbbcf)
- v11 관련 코드(getZoneStats, .zone-stats 스타일, 라벨 innerHTML)와 히스토리 항목 제거
- 콘솔 버전 v12, sw.js 캐시 `seating-chart-v12` — 설치 기기에 롤백판 배포용으로 버전은 전진

## 2026-07-25 — v1.4.3 상단 인원 카운터 표기 단순화
- 상단 `#member-counter` 표기를 `A·B석 N / E석 N / 미배치 N / 총 N명` → `배치 N / 미배치 N / 총원 N명`으로 변경 (배치 = A·B석 + E석 합산)
- 구역별 현황 표시(v11, 롤백됨) 대신 상단 한 줄로 배치/미배치/총원만 보여주는 방식
- 콘솔 버전 v13, sw.js 캐시 `seating-chart-v13`
- 자가테스트 37/37 통과

## 2026-08-02 — v1.7 명단 확충 (출석부 대조 27명 추가)
- 2026-08 출석부 스크린샷(베이스 파트 10~109행, 100명)과 앱 명단(74명) 대조
- `EXTRA_MEMBERS_V4` 27명 추가: 곽병준, 곽석산, 금용석, 김정천, 김주열, 김주하, 김태호, 김현민, 김환수, 명체환, 박종길, 박주영, 배일선, 서호석, 송상욱, 양승욱, 윤현준, 이래권, 이세준, 이순배, 임천규, 조갑래, 조대술, 조승희, 한승훈, 현우석, 황규헌 → 총 101명
- `migrateState` v4 단계 추가 (`seedVersion 4`) — 기존 저장 데이터에도 이름 기준 멱등 병합
- 출석부에 없는 '박병건'은 사용자 결정에 따라 유지 (제거는 추후 별도 확인)
- 콘솔 버전 v17, sw.js 캐시 `seating-chart-v17`
- 자가테스트 52/52 통과 (마이그레이션 인원수·멱등·중복 제외·공유 링크 5,000자 제한 테스트 갱신 포함)
