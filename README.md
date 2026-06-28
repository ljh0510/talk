# KokoaTalk Enterprise - Development Guidelines (지침서)

본 문서는 카카오톡을 벤치마킹한 엔터프라이즈급 실시간 메신저 애플리케이션인 **KokoaTalk Enterprise**의 개발 표준, 프로젝트 디렉터리 구조 및 실행 가이드를 정의합니다.

> [!WARNING]
> **프로젝트 구조를 변경하거나 모듈을 추가할 때 본 지침서([README.md](file:///Users/ijeonghyeon/Documents/talk/README.md))와 에이전트 지침서([AGENTS.md](file:///Users/ijeonghyeon/Documents/talk/.agents/AGENTS.md))의 구조도를 항상 최신으로 동기화하여 갱신해 주십시오.**

---

## 1. 프로젝트 디렉터리 구조 (Directory Structure)

전체 프로젝트는 FastAPI 백엔드와 Vite + React 프론트엔드로 구성되며 구조는 아래와 같습니다.

```
talk/
├── .agents/               # AI 에이전트 지침서 및 규칙 설정 폴더
│   └── AGENTS.md          # 본 프로젝트 개발 지침서
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
    │   │   └── friend/    # 친구 및 프로필 관련 기능
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

## 2. 개발 및 검수 표준 (Development & Verification Standards)

새로운 기능을 추가하거나 패치를 진행할 경우, 다음 단계를 거쳐 점진적으로 병합을 시도하십시오.

### 1) 데이터 모델링 및 스키마 변경
- DB 관계나 테이블 컬럼을 추가할 경우 [backend/models/](file:///Users/ijeonghyeon/Documents/talk/backend/models/) 패키지 내부 도메인 파일에 모델을 수정/정의합니다.
- 이에 대칭되는 직렬화용 Pydantic 규격을 [backend/schemas/](file:///Users/ijeonghyeon/Documents/talk/backend/schemas/) 패키지 내부에 맞춰 추가합니다.
- 데이터 관계 필드명 불일치로 인한 API 바인딩 에러(`ResponseValidationError`)를 막기 위해, 데이터 반환 시 수동 스키마 매핑을 진행하도록 권장합니다.

### 2) 비동기성 최적화
- 데이터베이스 세션은 반드시 비동기 컨텍스트(`AsyncSession`)를 활용해 조회합니다.
- 실시간 알림이나 메시지 전송은 WebSocket 서비스([backend/services/websocket.py](file:///Users/ijeonghyeon/Documents/talk/backend/services/websocket.py))와 `ConnectionManager`를 통해 브로드캐스트합니다.

### 3) 프론트엔드 상태 연동 및 UI
- UI 리스트 컴포넌트는 포커스 및 키보드 접근성 확보를 위해 Radix UI 스크롤 컴포넌트([ScrollArea.tsx](file:///Users/ijeonghyeon/Documents/talk/frontend/src/components/ui/ScrollArea.tsx))를 이용해 구현합니다.
- 상태 변경 시 리스트를 최신 메시지 순으로 실시간 재정렬하도록 Zustand 스토어([useChatStore.ts](file:///Users/ijeonghyeon/Documents/talk/frontend/src/store/useChatStore.ts))에 변경 사항을 정교화합니다.

---

## 3. 검수 및 실행 방법 (How to Verify & Run)

검수 및 동시 구동을 자동화한 스크립트인 [run.sh](file:///Users/ijeonghyeon/Documents/talk/run.sh)가 루트 폴더에 준비되어 있습니다.

```bash
# 실행 권한 부여 (필요 시)
chmod +x run.sh

# 검수 및 실행 스크립트 실행
./run.sh
```

### 이 스크립트의 작동 단계:
1. **백엔드 정적 검수**: Python 3.12 venv 내 의존성 패키지 확인 후, `compileall`로 전체 `.py` 파일의 문법적 오류를 사전 탐지합니다.
2. **프론트엔드 타입 검수**: `tsc --noEmit`을 통해 전체 TypeScript 형식에 불일치가 없는지 컴파일 레벨 검사를 수행합니다.
3. **DB 테이블 빌드 & 시딩**: 기존 SQLite 테이블을 초기화하고 테스트용 인물 정보(홍길동, 이순신, 세종대왕, 김유신)와 데모 채팅방을 빌드합니다.
4. **동시 실행**: FastAPI(포트 8080) 및 Vite(포트 5173)을 동시에 구동하고 단일 단말기 세션 내에서 Ctrl+C 입력 시 모든 하위 프로세스를 안전하게 함께 종료합니다.