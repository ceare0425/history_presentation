# 복습 게임 (탑 오르기) - Firebase 버전

`review-game/`, `review-game-korea/`는 **같은 와이파이**에 있어야만 동작하는 로컬 서버 버전입니다.
이 폴더(`review-game-firebase/`)는 그 문제를 해결한 버전으로, Firebase Realtime Database를 통해
**교사와 학생이 서로 다른 네트워크에 있어도** 동작합니다. 서버를 켤 필요도 없이,
아래 주소를 열기만 하면 됩니다.

## 접속 주소

깃허브에 올리면(push) GitHub Pages가 몇 분 안에 자동 반영합니다.

메인 페이지(`https://ceare0425.github.io/history_presentation/review-game-firebase/`)에는
관리자 화면 링크도 있어 교사용입니다. 학생에게는 대신 학생용 페이지
(`https://ceare0425.github.io/history_presentation/review-game-firebase/student.html`,
짧은 주소: **`ceare0425.github.io/h`**)를 공유하세요 —
수업 참여하기 / 혼자 연습하기 두 버튼만 있고 관리자·대형 화면 링크는 없습니다. 즐겨찾기 해두면 편합니다.

> ⚠️ **학교 학생 노트북에서는 `tinyurl.com` 단축주소가 유해차단 필터에 막힙니다.**
> 그래서 짧은 주소는 별도 저장소 `ceare0425.github.io`(사이트 최상위)에 리다이렉트로 둡니다:
> - `ceare0425.github.io/h` → 수업참여/혼자연습 메뉴 화면(`student.html`)
> - `ceare0425.github.io/w` → 세계사 수업용(`world/play.html`)
> - `ceare0425.github.io/k` → 한국사 수업용(`korea/play.html`)
>
> 학생에게는 tinyurl 대신 이 주소들을 주세요. (이 폴더가 아니라 `ceare0425/ceare0425.github.io` 저장소에서 수정)

**세계사**
- 학생 접속 (수업용, 선생님이 시작): `https://ceare0425.github.io/history_presentation/review-game-firebase/world/play.html`
  (짧은 주소: `ceare0425.github.io/w` — tinyurl은 학교에서 막힘)
- 혼자 연습 (학생이 직접 범위/시간 정해서 언제든 시작): `https://ceare0425.github.io/history_presentation/review-game-firebase/world/solo.html`
- 관리자 화면: `https://ceare0425.github.io/history_presentation/review-game-firebase/world/admin.html`
- 대형 화면: `https://ceare0425.github.io/history_presentation/review-game-firebase/world/board.html`

**한국사**
- 학생 접속 (수업용, 선생님이 시작): `https://ceare0425.github.io/history_presentation/review-game-firebase/korea/play.html`
  (짧은 주소: `ceare0425.github.io/k` — tinyurl은 학교에서 막힘)
- 혼자 연습 (학생이 직접 범위/시간 정해서 언제든 시작): `https://ceare0425.github.io/history_presentation/review-game-firebase/korea/solo.html`
- 관리자 화면: `https://ceare0425.github.io/history_presentation/review-game-firebase/korea/admin.html`
- 대형 화면: `https://ceare0425.github.io/history_presentation/review-game-firebase/korea/board.html`

짧은 주소(`ceare0425.github.io/h`,`/w`,`/k`)는 별도 저장소 `ceare0425/ceare0425.github.io`의
리다이렉트 페이지입니다. 학생 접속 주소로만 연결됩니다(관리자 화면은 교사만 쓰니 그대로 긴 주소나
메인 페이지에서 클릭해서 들어가면 됩니다). tinyurl 단축주소는 학교 유해차단 필터에 막히므로 쓰지 마세요.

인터넷이 되는 기기라면 교실 컴퓨터든 학생 노트북이든 어떤 와이파이에 있어도 접속됩니다.

## 사용법 (기존과 동일)

1. 관리자 화면에서 출제 범위(주제)를 고르고 제한 시간을 정한 뒤 **게임 시작**.
2. 학생들은 미리 각자 노트북에서 `.../world/play.html` (또는 `korea/play.html`)을 열고 이름 입력 → 참여.
   선생님이 시작하면 자동으로 문제가 나옵니다.
3. 대형 화면(`board.html`)을 교실 화면에 띄워두면 실시간으로 탑 오르는 모습이 보입니다.
4. 채점 규칙은 그대로입니다: 5초 이내 +3층, 10초 이내 +2층, 그 이후 +1층. 오답은 그 자리에 머무름.

## 혼자 연습하기 (`solo.html`)

수업 시간이 아니어도 학생이 스스로 연습할 수 있는 버전입니다. `play.html`과 달리 선생님이 게임을 시작해줄
필요가 없고, 학생이 직접:

- 연습할 범위(주제)를 하나 이상 고르고
- 제한 시간과 출제 순서(랜덤/순서대로)를 정한 뒤
- **연습 시작** 버튼을 눌러 바로 시작합니다.

문제 은행은 관리자 화면(`admin.html`)에서 선생님만 추가/수정/삭제할 수 있고, `solo.html`은 그 문제를
**읽기만** 합니다 — 학생은 범위 선택과 시작만 할 수 있을 뿐, 문제를 추가하거나 고칠 권한은 없습니다.

연습 진행 자체는 개인 화면 안에서만 돌아가고(다른 학생·`board.html`과 실시간 동기화되지 않음, 수업 점수판에도
안 올라감), 브라우저에 개인 최고 기록(최고 층수)이 저장되어 다시 연습할 때 갱신 여부를 보여줍니다.

### 혼자 연습 현황 (관리자 화면 "⑤")

학생이 연습 시작 화면에서 **이름**을 넣고 연습을 끝내면(제한 시간 종료 시), 그 세션 요약이
`rooms/<room>/solo_log`에 기록됩니다: 이름 · 시각 · 범위 · 최종 층수 · 정답/오답 수.
관리자 화면 맨 아래 **"⑤ 혼자 연습 현황"** 카드에서:

- 총 연습 횟수 / 오늘 / 최근 7일 / 연습한 학생 수
- **학생별 표**: 횟수, 평균 층수, 최고 층수, 최근 연습 시각 (연습 많이 한 순)
- **최근 세션 목록** (최대 40개): 개별 연습 기록
- **"기록 비우기"** 버튼으로 solo_log 전체 삭제 (학생 점수·참여 목록과 무관)

이름은 **필수**입니다 — 비워두면 "연습 시작"이 눌리지 않습니다. 같은 기기로 `play.html`에 참여한 적이
있으면 자동으로 채워집니다. 문제를 하나도 안 푼 세션은 기록되지 않습니다.

> ⚠️ 이 기능을 쓰려면 **보안 규칙을 다시 게시**해야 합니다(아래 "보안 규칙 설정" 참고).
> `firebase-database-rules.json`에 `solo_log` 경로가 추가되어 있으니, 콘솔 규칙 탭에 다시 붙여넣고 게시하세요.
> 안 하면 기록이 저장되지 않습니다(연습 자체는 정상 동작).

## 문제 추가하기

관리자 화면(`admin.html`)의 "② 문제 추가"에서:
- 한 문제씩 입력하거나
- "여러 문제 한번에 붙여넣기"를 펼쳐서, 기존 `questions.txt`와 같은 형식(`주제 | 문제 | 정답`)으로
  여러 줄을 붙여넣고 **일괄 추가**를 누르면 바로 반영됩니다. 새로고침/재시작이 필요 없습니다.

기존 `review-game/data/questions.txt` 같은 파일로 대량 등록하고 싶다면(예: 문제를 통째로 다시 넣고 싶을 때):

```
cd review-game-firebase
python tools/import_questions.py ../review-game/data/questions.txt world
python tools/import_questions.py ../review-game-korea/data/questions.txt korea
```

**주의**: 이 스크립트는 해당 방의 문제 전체를 파일 내용으로 덮어씁니다. 관리자 화면에서 추가한 문제가
있다면 먼저 백업하거나, 파일에 그 문제들도 함께 넣어두고 실행하세요.

## 파일 구성

```
review-game-firebase/
  index.html              메인 페이지 (교사용 - 관리자/대형 화면 링크 포함)
  student.html            학생용 페이지 (수업 참여하기 / 혼자 연습하기 링크만)
  shared/lib.js          채점 로직, Firebase 연결, 시간 동기화 (world/korea 공용)
  world/play.html         세계사 - 학생 화면 (수업용, 선생님이 시작)
  world/solo.html         세계사 - 혼자 연습 화면 (학생이 직접 범위/시간 정해서 시작)
  world/admin.html        세계사 - 관리자 화면
  world/board.html        세계사 - 대형 화면
  korea/play.html         한국사 - 학생 화면 (world와 동일 구조)
  korea/solo.html
  korea/admin.html
  korea/board.html
  tools/import_questions.py   questions.txt 형식 파일을 일괄 등록하는 도구
  firebase-database-rules.json   Firebase 콘솔의 "규칙" 탭에 붙여넣을 보안 규칙
```

## 수정 후 반영하는 법

이 폴더의 파일을 고치고 나면:

```
git add review-game-firebase
git commit -m "복습 게임 수정"
git push
```

푸시하면 1~3분 안에 GitHub Pages 주소에 자동 반영됩니다.

## 보안 규칙 설정 (한 번만 하면 됨)

Firebase 콘솔은 프로젝트를 처음 만들면 "테스트 모드"로 시작하는데, 이 모드는 30일 후 자동으로
모든 접근을 막아버립니다. 계속 쓰려면 아래 규칙으로 바꿔줘야 합니다.

1. Firebase 콘솔 → Realtime Database → 상단의 **"규칙"** 탭 클릭.
2. 이 폴더의 `firebase-database-rules.json` 내용을 복사해서 붙여넣기.
3. **게시(Publish)** 클릭.

이 규칙은 로그인 없이도 누구나 문제 은행/진행 상황을 읽고 쓸 수 있게 해줍니다(기존 로컬 서버 버전도
같은 와이파이에 있으면 누구나 관리자 화면에 들어갈 수 있었던 것과 동일한 신뢰 수준입니다). 다만
`players` 밑에 쓰는 데이터는 최소한 이름 형식은 지키도록 검증합니다.

## 알아두면 좋은 점 (채점 방식 변경)

기존 로컬 서버 버전은 파이썬 서버가 "몇 초 만에 답했는지"를 직접 재서 채점했습니다. 이 Firebase
버전은 서버가 없기 때문에, 각 학생의 브라우저가 스스로 채점해서 결과만 저장합니다. 복습 게임이라
크게 문제되지는 않지만, 개발자 도구를 다룰 줄 아는 학생이 마음만 먹으면 점수를 조작할 여지는
이론적으로 있습니다.
