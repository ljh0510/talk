# AI Agent Development Instructions (에이전트 항시 참조 지침서)

본 파일은 **KokoaTalk Enterprise** 프로젝트를 수행하는 모든 AI 에이전트가 매 실행 시 항시 읽고 준수해야 하는 시스템 아키텍처 원칙, 코딩 가이드 및 상태 유지 표준을 기술합니다.

---

## 1. 에이전트 역할 및 기본 철학 (Role & Philosophy)
- **역할 및 페르소나**: **20년 경력의 노련한 수석 풀스택 개발자**로서, 카카오톡을 벤치마킹하는 엔터프라이즈급 실시간 메신저의 아키텍처를 설계하고 개발합니다. 단순한 기능 추가를 넘어 장기적인 **유지보수성(Maintainability)**과 **가독성 높은 구조(Clean Code)**, 그리고 **재사용 가능한 구조(Reusability)**를 최우선으로 확보합니다.
- **점진적 개발 방법론**: 한 번에 너무 많은 코드를 무리하게 수정하지 마십시오. 반드시 `[데이터 모델링 -> API 엔드포인트 -> UI 컴포넌트 -> 상태 연동 -> 테스트/검증]` 단계를 거치며 점진적으로 완성해 나갑니다.
- **코드 무결성**: 구현되지 않은 모의(Mock) 데이터나 스텁(Stub) 코드는 최소화하고 구동 가능한 완전한 로직을 작성하십시오. 기존의 주석이나 도큐멘테이션도 임의로 훼손하지 않고 유지해야 합니다.

---

## 2. 프로젝트 디렉터리 구조 (Directory Structure)

전체 프로젝트는 FastAPI 백엔드와 Vite + React 프론트엔드로 구성되며 구조는 아래와 같습니다.

```
talk/
├── .agents/               # AI 에이전트 지침서 및 규칙 설정 폴더
│   └── AGENTS.md          # 본 프로젝트 개발 지침서 (본 파일)
├── .gitignore             # Git 관리 제외 설정 파일
├── README.md              # 프로젝트 리드미 (통합 지침서)
├── run.sh                 # 통합 타입 검수, DB 마이그레이션 및 동시 실행 스크립트
├── backend/               # FastAPI 비동기 백엔드 모듈 (app 폴더 제거 및 레이어링)
│   ├── .env               # 환경 변수 설정 파일 (PostgreSQL 접속 URI 포함)
│   ├── core/              # 핵심 설정 및 공통 모듈 (설정, DB 세션, 보안, 의존성)
│   ├── models/            # SQLAlchemy 데이터 모델 (도메인별 분할)
│   ├── schemas/           # Pydantic 데이터 검증 스키마
│   ├── crud/              # 데이터베이스 CRUD 리포지토리
│   ├── services/          # 비즈니스 로직 및 실시간 관리 서비스 (Websocket 등)
│   ├── routers/           # API 라우팅 엔드포인트
│   ├── main.py            # API 진입점
│   ├── requirements.txt   # 백엔드 의존성 라이브러리 목록
│   └── seed.py            # 데이터베이스 스키마 생성 및 데모 데이터 시딩 스크립트
└── frontend/              # Vite React 프론트엔드 모듈
    ├── src/
    │   ├── components/    # 재사용 및 레이아웃 컴포넌트
    │   │   ├── ui/        # 원자적 공통 UI (ScrollArea, Dialog 등)
    │   │   └── layout/    # 화면 구성 레이아웃 (MainLayout, Sidebar)
    │   ├── features/      # 기능/도메인 중심 컴포넌트 분류 (Features)
    │   │   ├── auth/      # 인증 관련 기능
    │   │   ├── chat/      # 채팅 관련 기능
    │   │   └── member/    # 멤버 및 프로필 관련 기능
    │   ├── store/
    │   │   └── useChatStore.ts      # Zustand 상태 관리 및 비동기 API/WebSocket 처리기
    │   ├── types/
    │   │   └── index.ts   # 공통 TypeScript 타입 선언
    │   ├── utils/
    │   │   └── time.ts    # 시간 포맷팅 헬퍼
    │   ├── App.tsx        # 메인 라우터/엔트리 가드
    │   ├── index.css      # Tailwind CSS v4 스타일시트 (카카오 테마 추가)
    │   └── main.tsx       # React 진입 마운트 파일
    ├── postcss.config.js  # PostCSS 플러그인 설정
    └── tailwind.config.js # 테마 및 확장 플러그인 설정
```

---

## 3. 핵심 기술 스택 및 아키텍처 규칙 (Architecture Rules)

### 1) Backend (FastAPI, SQLAlchemy)
- **비동기성(Asynchrony) 보장**: 모든 DB 쿼리 및 라우터는 비동기(`async/await`) 처리와 `AsyncSession` 의존성 주입을 필수로 활용해야 합니다.
- **데이터베이스 이중화 전략**: 로컬 개발 시에는 SQLite(`aiosqlite`), 실운영 환경에서는 PostgreSQL을 교체 가능하도록 구조화해야 합니다. DB 종속적인 방언(Dialect)을 지양하고 표준 ANSI SQL과 SQLAlchemy ORM 빌더만을 사용하십시오.
- **비즈니스 격리**: DB 테이블 모델 조작 로직은 `crud/` 패키지에 격리하여 라우터(`routers/`)가 데이터베이스의 세부 명세에 결합되지 않도록 합니다. (예: `auth.py`, `chats.py` 등 모든 라우터는 직접적인 ORM 쿼리 대신 `crud/` 모듈 헬퍼 호출을 의무화함)
- **CORS 설정 주의**: 브라우저 보안에 따라 `allow_credentials=True`인 경우 `allow_origins=["*"]`를 사용할 수 없습니다. 오리진 명세 시 `allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"]`와 같이 구체적인 호스트명을 사용하십시오. (와일드카드성 정규식 `allow_origin_regex` 사용 역시 금지됩니다.)

### 2) Frontend (Vite, React, Radix UI, Tailwind CSS v4, Zustand)
- **스크롤 접근성**: 대화 목록, 멤버 목록 등 긴 리스트 스크롤은 Radix UI ScrollArea Primitive를 래핑한 [ScrollArea.tsx](file:///Users/ijeonghyeon/Documents/talk/frontend/src/components/ui/ScrollArea.tsx)를 필수 적용하여 접근성 표준을 준수합니다.
- **Tailwind CSS v4 스타일링 규칙**: Tailwind CSS v4를 사용하므로 커스텀 컬러 및 테마 속성은 `tailwind.config.js`가 아닌 [index.css](file:///Users/ijeonghyeon/Documents/talk/frontend/src/index.css) 내의 `@theme { ... }` 지시어 아래 정의합니다.
- **실시간 UI 정렬**: 새로운 메시지가 웹소켓을 통해 도착하면 Zustand 스토어([useChatStore.ts](file:///Users/ijeonghyeon/Documents/talk/frontend/src/store/useChatStore.ts))에서 해당 대화방의 최근 대화 데이터를 업데이트한 뒤 **즉시 대화방 목록을 최상단으로 재정렬**하는 로직을 일관되게 보존해야 합니다.

---

## 4. 검수 및 실행 루틴 (Verification & Run Routine)

코드 변경을 완료한 경우, 에이전트는 반드시 프로젝트 루트에 위치한 [run.sh](file:///Users/ijeonghyeon/Documents/talk/run.sh) 스크립트를 활용해 검증해야 합니다.

```bash
# 타입/문법 검수, 데이터베이스 시딩 및 동시 로컬 서버 구동
./run.sh
```

- **백엔드 빌드 검사**: Python 코드가 문법적으로 에러가 없는지 `compileall`을 사용하여 사전에 로컬 컴파일을 시도합니다. (실행 시 `.venv` 및 `venv` 폴더는 스킵하도록 예외 필터 처리됨)
- **프론트엔드 타입 검사**: `npm run build`를 구동하여 TypeScript 컴파일 에러(`tsc --noEmit`)가 없는지 빌드를 확인합니다.
- **서버 정리**: 로컬 포트 충돌을 막기 위해 서버를 구동하기 전 기존 프로세스를 정상적으로 해제한 상태로 검수를 진행하십시오.

---

## 5. 지침서 유지 보수 규칙 (Guidelines Maintenance)
- 프로젝트 구조 변경(새 폴더/파일 추가 및 이동), DB 테이블 명세 추가, 라우터 엔드포인트 변경 시 **본 파일([AGENTS.md](file:///Users/ijeonghyeon/Documents/talk/.agents/AGENTS.md)) 내의 디렉터리 구조도와 프로젝트 [README.md](file:///Users/ijeonghyeon/Documents/talk/README.md)의 문서 정보를 반드시 동기화하여 수정하십시오.**
- 새로운 AI 에이전트가 본 프로젝트 컨텍스트를 이어받아 실행할 때, 가장 먼저 본 파일을 정독하고 설계 방향성을 유지하도록 유도해야 합니다.

---

## 6. 모달 스타일 가이드라인 (Modal Style Guidelines)
- **일관된 톤앤매너**: 모달 헤더에 임의의 원색 그라데이션 배경을 적용하지 마십시오. 전체 애플리케이션의 테마(Vite/카카오 다크·라이트 스킴)와 조화되도록 세련된 단색 배경(White / Zinc-900)을 유지합니다.
- **표준 구조**:
  - `DialogHeader` 에는 하단 실선 테두리(`border-b border-slate-100 dark:border-zinc-800 pb-3`)를 부착합니다.
  - `DialogTitle` 은 `text-sm font-extrabold` 크기를, `DialogDescription` 은 `text-[11px] text-slate-400` 스타일을 유지합니다.
  - *시스템 강제화*: 개별 모달 소스코드에 위 스타일을 중복하여 하드코딩하지 않도록 [Dialog.tsx](file:///Users/ijeonghyeon/Documents/talk/frontend/src/components/ui/Dialog.tsx) 내의 래퍼 컴포넌트 기본값에 본 스타일 사양이 기본 적용되어 있습니다.
- **접근성 수칙**: Radix UI Dialog Primitive의 스크린 리더 요건을 충족하도록 모든 모달 다이얼로그 본문에 타이틀과 설명문을 적합하게 배치하거나 `sr-only` 래핑 처리합니다.
- **스크롤 컴포넌트**: 긴 목록 렌더링 시 브라우저 기본 스크롤바 대신, 웹 표준 접근성 표준이 가미된 `ScrollArea.tsx` 컴포넌트를 필수 적용하여 균일한 비주얼을 확보하십시오.

