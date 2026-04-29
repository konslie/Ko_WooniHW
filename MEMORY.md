# Memory

## Session: 2026-04-29
- **Current Progress**: 다중 날짜 일괄 입력 기능(Bulk Input Mode) 개발 완료.
- **Goal**: 여러 날짜를 선택하여 한 번의 조작으로 동일한 돌봄 시간이나 특이사항(체험학습 등)을 일괄 적용(upsert)하여 사용자의 반복 입력 피로도를 낮춤.
- **Technical Decisions**:
  - `App.jsx`에서 `isBulkMode` 및 `selectedDates` 배열 상태를 관리하고, 일괄 선택된 날짜 배열을 하위 컴포넌트로 전달.
  - `Calendar.jsx`에 체크리스트 아이콘 토글 버튼을 추가하고, 여러 셀 다중 선택을 시각화(CSS `selected-for-bulk`)하며 화면 하단에 플로팅 확정 버튼 렌더링.
  - `TimePickerModal.jsx`이 단일 날짜 객체뿐만 아니라 날짜 객체 배열도 수용하도록 prop을 `dates`로 범용화.
  - `handleSaveTime` 및 `handleDeleteTime`에서 배열 맵핑을 통해 복수의 딕셔너리 페이로드를 생성하고, Supabase의 `upsert`와 `in` 필터를 활용하여 원격 쿼리를 1회로 최적화.
- **Next Step**: 사용자가 직접 조작하며 예외 케이스(UX) 테스트 및 피드백 반영.

## Session: 2026-04-28
- **Current Progress**: Supabase 무료 티어 '7일 미접속 자동 일시정지' 방지를 위한 서버리스 핑(Ping) 자동화 구축 완료.
- **Goal**: 하원관리 웹의 안정적인 24/365 백엔드 DB 구동 보장.
- **Technical Decisions**:
  - 앱 사용 빈도와 관계없이 Vercel 서버에서 매일 자정 자동으로 Supabase DB에 빈 쿼리 요청을 보내 접속 기록을 생성하는 `api/keep-alive.js` 함수 개발.
  - Vercel의 무료 Cron Jobs 기능을 활용하여 외부의 의존성 없이 `vercel.json` 설정 파일만으로 예약 작업을 스케줄링.
- **Next Step**: 사용자가 Supabase 대시보드에서 Project를 Unpause 하고, GitHub에 푸시하여 Vercel 배포 트리거 모니터링.

## Session: 2026-03-21
- **Current Progress**: 전체 프론트엔드 개발, Supabase 데이터 연동, 그리고 최종 모바일 UI 폴리싱 및 Vercel 자동 배포 환경(CI/CD) 구축 완료.
- **Goal**: 사용자가 모바일 사파리 환경에서 접속 시, 글씨가 작거나 화면이 잘리지 않고 완벽하게 한 화면(1 Screen)에 동작하도록 반응형 레이아웃 극한 최적화 달성.
- **Technical Decisions**: 
  - `html2canvas` 캡쳐가 모바일에서 저조해지는 현상 방지를 위해 scale을 4x로 오버라이드. 이로써 매우 선명한 공유용 이미지가 생성됨.
  - 좁은 뷰포트에서의 컨테이너 쿼리(cqw) 효율 문제를 짚어, 모바일 `@media (max-width: 600px)` 내에 선언되었던 `font-size: clamp`의 하드캡 한계선을 완전히 제거함. 배지 모양도 위/아래 패딩 제거 및 둥근 테두리 곡면(border-radius) 수치를 낮춰 네모반듯하게 깎음. 이로써 텍스트가 꽉 차게 커짐.
  - 모바일 세로 화면에서 불필요한 스크롤 발생을 억제하기 위해, 대시보드 상/하단 여백 및 달력 외부 패딩(padding)을 극적으로 줄여 한 눈에 들어오게 압축.
  - Vercel-Supabase 배포 파이프라인 무중단 서비스를 위해 레포지토리의 `master` 브랜치를 지우고 `main` 브랜치로 마이그레이션.
- **Next Step**: 사용자 1차 피드백 청취 및 앱 실사용 모니터링.

## Session: 2026-04-03
- **Current Progress**: 
  - 로컬 프로젝트를 최신 GitHub 리포지토리(`konslie/Ko_WooniHW`)와 동기화 완료 (`master`에서 `main` 브랜치로 마이그레이션).
  - 돌봄 달력 내 하단 정렬된 '특이사항' 뱃지 표시(예: 체험학습, 특이사항) 기능 추가 완료 및 색상(`BG: #008924`, `Text: #ffffff`) 적용.
  - 팝업에서 '특이사항' 메뉴 진입 시 체험학습/특이사항 중 하나를 선택해 하위 분기할 수 있도록 버튼 추가 및 입력값 DB 데이터(예: `[SPECIAL]체험학습|내용`) 구조 정의 반영.
- **Goal**: 최신 소스코드 동기화 및 캘린더 내 달력 특이사항 렌더링 최적화.
- **Technical Decisions**: 
  - 원격 저장소에 맞춰 로컬 브랜치를 `main`으로 전환 후 최신 코드(`git pull`) 반영.
  - 기존 Supabase DB 스키마 수정 없이 유연하게 사용할 수 있도록 `isNoCare=false` 상태에서 `memo` 필드를 확장하여 `[SPECIAL]` 접두사를 가진 전용 포맷 문자열로 저장하는 방식을 택함.
  - 추가적으로 돌봄 정보와 등원 관련 특이사항 정보를 독립적으로 다중 유지하기 위해, `memo` 텍스트 필드에 JSON 형태의 직렬화 데이터를 저장하고 이를 프론트엔드에서 파싱해내는 하이브리드 로직을 도입.
  - 미래 날짜 및 과거/오늘 날짜의 팝업 초기 오픈 시 발생했던 사용자의 UX 허들을 없애기 위해 시간 연산 기반 반응형 탭 전환 및 탭 토글/해제 메커니즘을 자체 구현함.
- **Next Step**: 대기 중인 개발 사항이나 추가 피드백에 맞춰 개발 진행.
