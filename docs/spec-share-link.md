# SPEC: 배치 공유 링크 (데이터 전달)

**작성**: 2026-08-02
**상태**: Implemented
**예상 규모**: 중 (반나절 이내)

---

## Part 1: What & Why (PRD 압축)

### Description
현재 기기에 저장된 배치 데이터(단원 명단 + 좌석 배치 + 미도착 표시 + 레이아웃)를 URL 하나로 만들어 카카오톡 등으로 전달하고, 받는 사람이 링크를 열면 자기 기기의 앱에 그대로 불러와 이어서 편집할 수 있게 한다. 서버 없이 데이터를 링크 해시(`#s=...`)에 압축해 담는다.

### Problem
공유 수단이 PNG 이미지뿐이라 받는 사람이 데이터를 이어받아 편집할 수 없다. 담당자가 2명 이상일 때 "A가 하다가 B에게 넘기는" 순차 협업이 불가능하다.

### Why now
자리배치 담당자가 2명 이상으로 늘어나 배치 작업을 나눠 하려는 실사용 요구 발생 (2026-08-02 사용자 요청). 실시간 공동편집(Firebase)은 홀드, 스냅샷 전달을 먼저 해결.

### Success
- 정량: A 기기에서 만든 링크를 B 기기에서 열었을 때 명단·배치·미도착 표시가 100% 동일하게 복원
- 정성: 비개발자 담당자가 안내 없이 "공유 → 카톡 → 링크 클릭 → 불러오기"를 완주

### Audience
- 사용자: 성가대 자리배치 담당자 (비개발자, 주로 아이폰 Safari PWA)
- 영향 시스템: `index.html` (툴바 + 모달 + 시작 시 해시 처리), `sw.js` (캐시 버전), `run_tests.js` (async 테스트 지원), `README.md`

---

## Part 2: Scope

### In scope
- 데이터 직렬화: members(이름·메모·전화 포함), layout, assignments, late — 전부 포함
- 압축 인코딩: JSON → deflate(CompressionStream) → base64url, 미지원 브라우저는 무압축 폴백 (접두사로 구분)
- 툴바 [🔗 공유] 버튼 → 공유 모달 (시스템 공유 시트 / 링크 복사 / 수동 복사 폴백)
- 수신 플로우: `#s=...`로 열리면 검증 → 확인 모달 → 적용(내 보관함 프리셋은 유지) → 해시 제거
- file:// 로 열어 만든 링크도 배포 주소(`https://jayden-choo-aki.github.io/seating-chart/`) 기준으로 생성
- 자가테스트 추가 (인코딩 왕복, 검증, 적용 시 프리셋 보존)

### Out of scope
- 실시간 공동편집 (Firebase — 별도 SPEC, 현재 홀드)
- 부분 병합(내 명단 + 상대 배치 합치기) — 전체 스냅샷 교체만
- 보관함 프리셋 3슬롯의 공유 — 개인 저장소로 취급
- 단축 URL 서비스 연동

### Open questions
- 없음 (아래 Decisions로 정리)

---

## Part 3: Design (Mini Design Doc 압축)

### 시스템 컨텍스트
[A 브라우저 state] → encode → `https://.../#s=c:xxxx` → 카톡 → [B 브라우저] → decode → 확인 모달 → state 교체 → localStorage

### 핵심 인터페이스
```js
// 순수(동기) — Node 자가테스트 대상
function buildSharePayload(state)            // → {v:1, members, layout, assignments, late}
function isValidSharePayload(p)              // 구조 검증 (isValidState 수준)
function applySharePayload(state, payload)   // → 새 state (수신자 presets 유지, seedVersion 유지→migrate 재적용 안전)

// 비동기 — 브라우저/Node 18+ 공통
async function encodeShareData(payload)      // → "c:<base64url(deflate-raw(JSON))>" 또는 폴백 "r:<base64url(JSON)>"
async function decodeShareData(str)          // → payload | null (형식 불명·파손 시 null)

function buildShareUrl(encoded)              // file:// 이면 배포 주소, 아니면 현재 origin+path 기준 + '#s=' + encoded
```

### 데이터 모델
페이로드 `{v:1, members:[{id,name,memo,phone}], layout:{left,right,standbyCols}, assignments:{seatKey:memberId}, late:[memberId]}`.
`presets`·`seedVersion`은 제외 — 수신 측 값 유지. 적용 시 `pruneLate(migrateState(...))` 경유로 기존 보정 로직 재사용.

### 핵심 흐름
1. [🔗 공유] 클릭 → `buildSharePayload(state)` → `encodeShareData` → `buildShareUrl` → 모달 표시
2. 모달: `navigator.share({url})` 버튼(지원 시) + [링크 복사](clipboard API, 실패 시 textarea 수동 복사)
3. 수신: DOMContentLoaded에서 `location.hash`가 `#s=`로 시작하면 decode → `isValidSharePayload` 통과 시 확인 모달("보낸 사람의 명단·배치로 교체합니다. 내 보관함 저장분은 유지됩니다.")
4. [불러오기] → `applySharePayload` → `pruneLate(migrateState(...))` → `saveState` → `render` → 토스트
5. 확인/취소와 무관하게 `history.replaceState`로 해시 제거 (새로고침 시 재프롬프트 방지)
6. 파손·형식 오류 시 토스트로 안내하고 기존 데이터 유지

### Alternatives Considered
- **Option A: 무압축 base64만** — 기각: JSON ~7KB → URL ~9KB, 카톡·일부 인앱 브라우저에서 초장문 URL 리스크
- **Option B (채택): deflate 압축 + 무압축 폴백** — 채택: URL 2~4KB로 축소, CompressionStream 미지원(Safari<16.4)은 `r:` 폴백으로 커버
- **Option C: 파일 내보내기/가져오기** — 기각: 모바일 UX 단계 과다 (대화에서 사용자와 합의)

### Cross-cutting
- 보안/프라이버시: 전화번호가 URL에 포함됨 — 해시는 서버로 전송되지 않고 링크 소지자만 열람 가능. 담당자 간 전달 용도로 수용. README에 "링크를 받은 사람은 명단 전체를 보게 됨" 명시
- 관측: 콘솔 버전 v16으로 상향
- 성능: 인코딩/디코딩 1회성, 수 ms 수준 — 영향 없음
- 마이그레이션: 스키마 변경 없음. `sw.js` CACHE `seating-chart-v16`으로 상향 (배포 반영용)

---

## Part 4: Decisions (인라인 ADR)

### Decision 1: 전체 교체(스냅샷), 병합 없음
- **결정**: 수신 시 members·layout·assignments·late를 통째로 교체하고, presets만 수신자 것을 유지한다.
- **이유**: use case가 "이어서 작업"(handoff)이라 보낸 시점 상태가 곧 정답. 병합 규칙은 충돌 정의가 복잡하고 비개발자에게 설명 불가.
- **대가**: 수신자가 로컬에서 작업 중이던 내용은 사라짐 → 확인 모달 문구로 명시 경고.

### Decision 2: 해시(`#s=`) 사용, 쿼리스트링 아님
- **결정**: 데이터를 URL fragment에 담는다.
- **이유**: fragment는 서버·서비스워커 fetch에 전달되지 않아 캐싱(`ignoreSearch`)·GitHub Pages와 충돌 없음. `?test=1`과도 분리.
- **대가**: 일부 메신저가 fragment를 자르는 경우 복원 불가 → 파손 감지 시 토스트 안내로 완화.

### Decision 3: run_tests.js의 async 테스트 지원
- **결정**: `runSelfTests`를 async 함수로 바꿔 각 테스트를 `await`한다 (Node 18+의 CompressionStream으로 압축 왕복도 테스트).
- **이유**: encode/decode가 비동기라 기존 동기 루프로는 검증 불가.
- **대가**: 기존 동기 테스트도 await 경유 — 동작 동일, 위험 낮음.

---

## Part 5: Acceptance Criteria (EARS)

### Happy path
- AC1: When 사용자가 [🔗 공유]를 클릭하면, 시스템은 현재 state가 담긴 `#s=` URL과 [복사]/[공유] 수단을 모달로 제시해야 한다.
- AC2: When 수신자가 해당 URL을 열면, 시스템은 확인 모달을 표시하고, [불러오기] 시 명단·배치·미도착·레이아웃을 보낸 쪽과 동일하게 복원해야 한다.
- AC3: 적용 후 수신자의 보관함 프리셋 3슬롯은 변경 전과 동일해야 한다.
- AC4: encode→decode 왕복 시 페이로드가 deep-equal이어야 한다 (압축 `c:`·무압축 `r:` 각각).

### Edge cases
- AC5: If 해시가 파손·형식 불일치이면, 시스템은 기존 데이터를 유지하고 오류 토스트를 표시해야 한다.
- AC6: If 수신자가 [취소]하면, 기존 데이터를 유지해야 한다. 확인/취소 어느 쪽이든 URL 해시는 제거되어 새로고침 시 재프롬프트가 없어야 한다.
- AC7: If CompressionStream 미지원 환경이면, `r:` 무압축 링크를 생성하고 수신 측은 두 형식 모두 해독해야 한다.
- AC8: If file:// 로 연 상태에서 공유하면, 링크는 배포 주소 기준으로 생성되어야 한다.
- AC9: 공유 링크로 불러온 뒤에도 기존 기능(배치·랜덤·보관함·PNG·출석체크)이 정상 동작해야 한다.

### Non-functional
- AC10: 링크 길이는 일반 명단(75명) 기준 5,000자 이하(압축 시)여야 한다.
- AC11: 기존 자가테스트 전체가 계속 통과해야 한다 (회귀 없음).

---

## Part 6: Implementation Plan

### Tasks (의존성 순서)
1. [x] 순수 함수 추가: `buildSharePayload` / `isValidSharePayload` / `applySharePayload` — `index.html`
2. [x] 인코딩 계층: base64url 헬퍼 + `encodeShareData` / `decodeShareData`(c:/r: 형식) + `buildShareUrl` — `index.html` (압축 포맷은 Node 구버전 호환을 위해 deflate-raw 대신 `deflate` 채택)
3. [x] 송신 UI: 툴바 `tb-share` 버튼 + 공유 모달(공유 시트/복사/수동 폴백) — `index.html`
4. [x] 수신 플로우: DOMContentLoaded 해시 감지 → 확인 모달 → 적용/취소 + 해시 제거 + 토스트 — `index.html` (depends on 1, 2)
5. [x] 자가테스트: AC3~AC7 매핑 테스트 + `runSelfTests` async 전환 — `index.html`, `run_tests.js`
6. [x] 버전 상향(콘솔 v16, `sw.js` CACHE v16) + `README.md` 사용법·프라이버시 문구 + 수동 체크리스트 항목 추가

### 검증 (Definition of Done)
- [x] 모든 AC 테스트/수동 확인 통과 (`node run_tests.js` 52/52 + 브라우저 E2E: 송신 모달·수신 확인 모달·적용·보관함 유지·파손 링크·해시 제거)
- [x] `.claude/refs/verification/` 매트릭스 기준 중 규모 검증 셀프 패스
- [x] SPEC.md 자체 commit
