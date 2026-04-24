# 🐈‍⬛ 춘직이 AI 아바타

검은고양이 캐릭터 **춘직이**와 대화하는 모바일 최적화 웹앱입니다.  
기본 챗(텍스트/음성), 타로 리딩, 사회성 연습 기능을 단일 페이지(`index.html`)에서 제공합니다.

---

## 개요

- **대화 인터페이스**: 텍스트/음성 입력, 스트리밍 응답, 음성 재생
- **도구 인터페이스**: `+` 버튼 메뉴로 타로/사회성 연습/그림 말하기/행동 조절/루틴 관리/미니게임 진입
- **자연어 도구 라우팅**: `"타로 봐줘"`, `"사회성 연습하자"`, `"뽁뽁이 게임"` 같은 입력으로 해당 화면으로 자동 전환
- **캐릭터 렌더링**: Lottie 우선, 실패 시 SVG 폴백
- **모바일 레이아웃**: 하단 입력바 고정, 본문 스크롤 분리

---

## 아키텍처

### 1) 프런트엔드
- 단일 파일: `index.html` (HTML/CSS/JS 통합)
- 상태 중심 UI:
  - 기본 대화 상태
  - 타로 오버레이 상태
  - 사회성 연습(연령/상황/롤플레이/피드백) 상태
  - 그림 말하기 오버레이 상태
  - 행동 조절 오버레이 상태
  - 루틴 관리 오버레이 상태
  - 미니게임 오버레이 상태

### 2) AI 호출 경로
- 기본 모델 엔드포인트: `API_URL` (`/v1/chat/completions` 또는 원격 URL)
- 호출 모드:
  - 일반 대화: 텍스트+오디오 가능
  - 타로 해석: 텍스트 스트리밍
  - 사회성 연습: 페르소나 롤플레이 + 피드백 스트리밍
  - 음성 전사: `transcribeWavToText()`

### 3) 데이터 흐름
- 음성 입력: `MediaRecorder(WebM)` -> `WAV(24kHz)` 변환 -> 전사/모델 호출
- 스트리밍 파싱: SSE 델타 누적(`appendStreamDelta`) + 중복 제거(`removeConsecutiveRepeat`)
- 사회성 상태:
  - `socialState.turns`: 전체 대화 턴
  - `socialState.userMemory`: 최근 사용자 발화 메모리
  - `socialState.sessionLog`: 피드백 생성용 로그

### 4) 선택적 로컬 프록시
- `server.py` 실행 시 CORS/프록시 경유 사용 가능 (`/tarot/random` 포함)

---

## 기능

## 기본 대화
- 텍스트 입력 + 엔터 전송
- 음성 입력(녹음 시작/종료)
- 스트리밍 응답 말풍선 표시
- 대화 초기화 버튼

## 도구 진입 UX
- 하단 왼쪽 `+` 버튼 메뉴:
  - `타로 보기`
  - `사회성 연습`
  - `그림 말하기`
  - `행동 조절`
  - `루틴 관리`
  - `미니게임`
- 문장 의도 기반 자동 라우팅:
  - 예: `타로 봐줘`, `운세`, `사회성 연습하자`, `멜트다운`, `루틴 관리`, `뽁뽁이`, `원 그리기`
  - 텍스트 입력과 음성 전사 결과 모두 라우팅

## 타로 리딩
- 스프레드 선택 후 랜덤 카드 뽑기
- 카드 뒤집기/확대 보기(lightbox)
- AI 리딩 스트리밍 출력
- 카드 이미지 로딩 규칙:
  - 폴더: `JPG`
  - 메이저: `00-TheFool.jpg` ~ `21-TheWorld.jpg`
  - 마이너: `Cups01.jpg`, `Wands01.jpg`, `Swords01.jpg`, `Pentacles01.jpg` ... `14`

## 사회성 연습
- 연령대별 시나리오(미취학/청소년/성인)
- 상황별 고정 페르소나 롤플레이
- 인물별 난이도/성격/말투 반영(`personaGuide`)
- 힌트 보기 / 연습 종료 후 피드백 생성
- 맥락 유지 강화:
  - 페르소나 고정 규칙(시나리오 잠금)
  - 최근 사용자 발화 메모리 반영
  - 최근 대화 흐름(window) 반영

## 그림 말하기 (독립 화면)
- 그림 말하기 버튼(TTS): 비언어 아동용 핵심 요청 문장을 버튼으로 즉시 음성 출력

## 행동 조절 (독립 화면)
- 행동 조절: 감각 과민/불안/분노/다운 상태 선택 후 안정문구, 호흡(4-4-6), 그라운딩(5-4-3-2-1), 감각 팁 제공
- 상태 맞춤 코칭: 선택 상태에 따라 LLM 또는 로컬 fallback으로 2문장 코칭
- 오늘 리포트: 상태 조절 사용 로그를 일자 단위로 집계해 요약 제공(로컬 저장)

## 루틴 관리 (독립 화면)
- 일정/루틴 관리: 루틴 추가·완료 체크·삭제 + 진행률 기반 코칭

## 미니게임 (독립 화면)
- 미니게임: 뽁뽁이 터트리기, 원 그리기(정확도 점수)로 단순 스트레스 완화 활동 제공
- UI 규칙: 이모티콘은 텍스트 본문이 아닌 아이콘 영역에만 사용

## 캐릭터 렌더링
- `character.json` 존재 시 Lottie 사용
- 실패/부재 시 SVG 캐릭터 폴백
- 상태(듣기/생각/말하기)에 따라 애니메이션 속도/표현 변화

---

## 에러 핸들링

## 공통
- API Key 미입력 시 즉시 안내 메시지 표시
- 네트워크/HTTP 오류를 사용자 메시지로 표시
- 스트리밍 중 파싱 실패 시 해당 델타만 스킵

## 대화
- CORS 가능성 메시지 안내(`server.py` 실행 유도)
- 음성 전사 실패 시 텍스트 입력 유도 또는 오디오 경로 fallback
- STT 디버그 메시지(`[STT 디버그]`)로 녹음/변환/전사 상태를 채팅창에 출력

## 타로
- 카드 API 1차 실패 시 `/tarot/random` 프록시 재시도
- 카드 이미지 로드 실패 시:
  - `onerror` 1회 처리 후 폴백 UI 표시
  - lightbox 이미지 숨김 처리

## 사회성 연습
- API Key/응답 오류를 시스템 말풍선으로 표시
- 사용자 발화 없이 종료 시 피드백 호출 차단(환각성 칭찬 방지)
- 페르소나 응답 중복 제거

---

## 빠른 시작

## 권장 실행 (로컬 서버)
```bash
pip install flask flask-cors requests
python server.py
```

브라우저에서 `http://localhost:8080` 접속

## 직접 열기
- `index.html` 직접 열기도 가능
- 단, 환경에 따라 CORS 이슈가 있을 수 있어 로컬 서버 방식 권장

---

## 설정

## API Key
- 상단 우측 `API 키` 버튼으로 입력창 토글
- 키 형식: `KC_IS_...`
- 입력한 키는 브라우저 `localStorage`에 저장되어 다음 접속 시 자동 복원
- `저장` 버튼 또는 엔터로 저장, `삭제` 버튼으로 브라우저 저장값 제거

## 프록시 URL 설정 (Cloudflare Worker 등)
- 기본값은 현재 호스트의 `/v1/chat/completions`, `/tarot/random` 경로를 사용
- 별도 프록시를 쓸 때는 URL에 `?proxyBase=https://<your-worker-domain>` 추가
- 한 번 지정하면 브라우저 `localStorage`에 저장되어 다음 접속에도 유지

## Lottie 커스터마이징
1. 원하는 Lottie JSON 파일명을 `character.json`으로 변경
2. `index.html`과 같은 폴더에 배치
3. 새로고침

---

## 파일 구조 (핵심)

- `index.html`: UI/스타일/로직 전체
- `README.md`: 프로젝트 문서
- `server.py`: 로컬 프록시/정적 서빙(사용 시)
- `api/index.py`: Vercel 서버리스용 Flask 엔트리
- `requirements.txt`: Python 의존성(배포/로컬 공용)
- `Procfile`: PaaS 실행 명령(`gunicorn server:app`)
- `cloudflare-worker/`: Cloudflare Worker 프록시(`wrangler.toml`, `src/worker.js`)
- `vercel.json`: Vercel 라우팅(`/v1/chat/completions`, `/tarot/random`, `/health`)
- `JPG/`: 타로 카드 이미지 폴더(파일명 규칙 준수)

---

## 트러블슈팅

- **타로 카드 이미지가 안 뜸**
  - `JPG` 폴더 위치 확인
  - 파일명 규칙(대소문자/공백/하이픈) 확인
- **API 호출 실패**
  - API Key 확인
  - 로컬 서버(`server.py`)로 접속했는지 확인
- **음성 인식 안 됨**
  - 브라우저 마이크 권한 확인
  - HTTPS/localhost 환경 확인

---

## 기술 스택

- Vanilla JavaScript
- HTML/CSS (단일 페이지)
- `lottie-web` (CDN)
- MediaRecorder API / Web Audio API
- SSE 스트리밍 파싱
- Flask (옵션)

---

## 배포 가이드

### 추천 플랫폼
- **Render / Railway 권장**: 현재 구조가 Flask 프록시(`server.py`)를 포함하므로 서버 런타임이 필요한 배포에 적합
- **Vercel (현재 지원)**: 정적 프론트 + `api/index.py` Flask 서버리스 경로로 바로 배포 가능
- **Cloudflare Pages + Workers**: 정적 페이지 + 프록시 분리 배포에 적합
- **Netlify**: 정적 호스팅에는 강점이 있지만, 현재 Flask 라우트를 그대로 쓰려면 추가 서버리스 마이그레이션 필요

### Render/Railway 공통 설정
1. 저장소 연결
2. 빌드 명령: `pip install -r requirements.txt`
3. 시작 명령: `gunicorn server:app --bind 0.0.0.0:$PORT`
4. 헬스체크: `/health`

### Cloudflare Workers 배포
1. `cloudflare-worker` 폴더로 이동
2. Wrangler 로그인 후 배포:
   ```bash
   npx wrangler login
   npx wrangler deploy
   ```
3. 출력된 Worker 도메인을 복사 (예: `https://chunjik-proxy.<subdomain>.workers.dev`)
4. 프론트 접속 URL에 `?proxyBase=<WorkerURL>` 추가
   - 예: `https://<pages-domain>/?proxyBase=https://chunjik-proxy.<subdomain>.workers.dev`

### Vercel 배포
1. Vercel에서 `a4file/chunjik` 저장소 Import
2. Framework Preset은 `Other`(자동)
3. Build Command 비워둠 (정적 + Python serverless 자동 감지)
4. Deploy 실행
5. 배포 후 확인
   - `https://<vercel-domain>/health`
   - 앱에서 채팅/타로 요청이 `/v1/chat/completions`, `/tarot/random`으로 정상 동작하는지 확인

선택: Vercel 환경변수 `KANANA_SERVER_API_KEY`를 설정하면, 클라이언트 Authorization 헤더 없이도 서버측 키로 동작할 수 있습니다.

### 배포 전 체크리스트
- 하드코딩된 API 키가 없는지 확인 (`index.html`의 `value="KC_IS_..."` 금지)
- `__pycache__/` 및 로그 파일이 커밋 대상에서 제외되는지 확인 (`.gitignore`)
- 브라우저에서 API 키 저장/삭제 동작 확인
- `JPG/` 카드 이미지 파일명 규칙 재확인

---

## 향후 개선 추천

- 카드 이미지 파일명 자동 인덱싱(매핑 테이블 외부화)
- 사회성 연습 로그 저장/복원(세션 지속)
- 테스트 스크립트(의도 라우팅/이미지 로드/전사 fallback)
- 설정 분리(`config.js`)로 모델/엔드포인트 관리 단순화
