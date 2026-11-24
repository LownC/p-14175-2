# p-14175-2

Spring Boot 백엔드에 **Next.js + TypeScript** 프론트엔드를 붙여서 만든 게시판(글 + 댓글) 학습 프로젝트입니다.
기능을 하나씩 추가하고 리팩토링하는 과정을 `000`부터 `025`까지 **번호 붙은 커밋**으로 남겼습니다. 커밋을 순서대로 따라가면 같은 흐름으로 다시 만들어 볼 수 있습니다.

- 백엔드: [jhs512/p-14172-2](https://github.com/jhs512/p-14172-2)를 가져와서 사용
- 참고 강의: [slog.gg/p/14175](https://www.slog.gg/p/14175) (35~51강은 리팩토링과 댓글 수정)

## 기술 스택

| 구분 | 사용 기술 |
|---|---|
| Frontend | Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4, pnpm |
| Backend | Spring Boot 4, Java 25, Spring Data JPA, H2, springdoc-openapi (Swagger UI) |

## 폴더 구조

```
p-14175-2/
├─ back/                          # Spring Boot 백엔드 (포트 8080)
└─ front/                         # Next.js 프론트엔드 (포트 3000)
   ├─ .env.development            # NEXT_PUBLIC_API_BASE_URL=http://localhost:8080
   ├─ lib/backend/client.ts       # apiFetch: API 호출 공통 함수 (에러 시 RsData를 throw)
   ├─ types/post.ts               # PostDto, PostCommentDto, RsData 타입
   └─ app/
      ├─ layout.tsx               # 공통 헤더 (홈, 글 목록)
      ├─ page.tsx                 # /
      └─ posts/
         ├─ page.tsx              # /posts             글 목록
         ├─ write/page.tsx        # /posts/write       글 작성
         └─ [id]/
            ├─ page.tsx           # /posts/{id}        글 상세 + 댓글 (조회·작성·수정·삭제)
            ├─ loading.tsx        # [id] 경로의 Suspense fallback
            └─ edit/page.tsx      # /posts/{id}/edit   글 수정
```

## 실행 방법

터미널 두 개를 사용합니다.

**1. 백엔드**
```bash
cd back
./gradlew bootRun
```
- API: http://localhost:8080
- Swagger UI: http://localhost:8080/swagger-ui/index.html
- 개발용 DB는 `back/db_dev.mv.db`(H2 파일)입니다. 지우고 다시 실행하면 초기 데이터로 돌아갑니다.

**2. 프론트엔드**
```bash
cd front
pnpm install
pnpm dev
```
- http://localhost:3000

**기타 명령**
```bash
pnpm lint     # ESLint
pnpm build    # 프로덕션 빌드
```

## 주요 기능

- **글**: 목록, 상세, 작성, 수정, 삭제
- **댓글**: 목록, 작성, 수정(수정 모드 토글), 삭제
- 작성·수정 폼 검증: 빈 값과 2자 미만을 따로 안내하고, 백엔드 제약과 같은 최대 길이를 적용
- 에러 응답은 `resultCode : msg` 형식으로 알림 (예: `404-1 : 해당 데이터가 존재하지 않습니다.`)
- 댓글 작성·수정·삭제 후 목록을 다시 불러오지 않고 state만 갱신해서 바로 반영

## 백엔드 API

| 기능 | 메서드 / URL | 응답 |
|---|---|---|
| 글 목록 | `GET /api/v1/posts` | `PostDto[]` |
| 글 하나 | `GET /api/v1/posts/{id}` | `PostDto` |
| 글 작성 | `POST /api/v1/posts` `{ title, content }` | `RsData<PostDto>` |
| 글 수정 | `PUT /api/v1/posts/{id}` `{ title, content }` | `RsData<void>` |
| 글 삭제 | `DELETE /api/v1/posts/{id}` | `RsData<void>` |
| 댓글 목록 | `GET /api/v1/posts/{postId}/comments` | `PostCommentDto[]` |
| 댓글 작성 | `POST /api/v1/posts/{postId}/comments` `{ content }` | `RsData<PostCommentDto>` |
| 댓글 수정 | `PUT /api/v1/posts/{postId}/comments/{id}` `{ content }` | `RsData<void>` |
| 댓글 삭제 | `DELETE /api/v1/posts/{postId}/comments/{id}` | `RsData<void>` |

- 검증 규칙: 제목 2~100자, 글 내용 2~5000자, 댓글 2~100자
- 실패하면 4xx 상태코드와 함께 `{ resultCode, msg }` 형태의 `RsData`를 돌려줍니다.

## 글 상세 페이지 구조

`app/posts/[id]/page.tsx`는 **데이터 로직은 커스텀 훅**, **화면 로직은 컴포넌트**로 나눠져 있습니다.

```
usePost(id)              → post, deletePost
usePostComments(postId)  → postId, postComments, writeComment, deleteComment, modifyComment

Page
├ PostInfo                  (postState)          글 표시, 삭제
└ PostCommentWriteAndList   (postCommentsState)  댓글 구역 배치
   ├ PostCommentWrite                            댓글 작성 폼
   └ PostCommentList                             로딩, 빈 목록 처리
      └ PostCommentListItem × N                  댓글 하나 + 수정 모드 state
```

- 훅 함수는 API 호출과 state 갱신만 하고, 성공 후 할 일(알림, 이동, 폼 초기화)은 `onSuccess` 콜백으로 받습니다.
- 하위 컴포넌트는 훅 결과를 통째로 받고, props 타입은 `ReturnType<typeof useXxx>`로 자동으로 얻습니다.
- 훅 안의 함수들은 클로저로 글 번호를 기억하므로, 컴포넌트가 `id`를 주고받을 필요가 없습니다.

## 커밋 히스토리

### 1단계: 기본 CRUD (000~010)

| 커밋 | 내용 |
|---|---|
| 000 | 초기 세팅 (백엔드 가져오기, Next.js + TS 프론트 생성) |
| 001 | 홈 |
| 002 | 글 다건조회 (`apiFetch`, 타입 정의) |
| 003 | 글 단건조회 (동적 라우트 `[id]`, `useParams`) |
| 004 | 글 삭제 (`useRouter`, `router.replace`) |
| 005 | 글 작성 (form 제출, POST) |
| 006 | 글 수정 (`defaultValue`, PUT) |
| 007 | 댓글 다건조회 |
| 008 | 댓글 삭제 (불변성, `filter`) |
| 009 | 댓글 작성 (스프레드로 추가) |
| 010 | 빌드 오류 수정 (`cacheComponents` 환경에서 `loading.tsx`로 Suspense 경계 추가) |

### 2단계: 리팩토링과 댓글 수정 (011~025, 강의 35~51강)

| 커밋 | 강의 | 내용 |
|---|---|---|
| 011 | 35·36 | 유효성 검사 세분화, 에러 메시지에 resultCode 표시 |
| 012 | 37 | `PostInfo`, `PostCommentWriteAndList` 컴포넌트 분리, pnpm으로 통일 |
| 013 | 38 | 글 데이터 로직을 `usePost` 훅으로 분리 |
| 014 | 39 | 댓글 데이터 로직을 `usePostComments` 훅으로 분리 |
| 015 | 40 | URL의 id(문자열)를 숫자로 변환 |
| 016 | 41 | 훅 결과를 통째로 하위 컴포넌트에 전달 |
| 017 | 42 | `ReturnType`으로 props 타입 하드코딩 제거 |
| 018 | 43 | 화면 로직을 JSX 밖으로, 하위 컴포넌트에서 함수 재정의 |
| 019 | 44 | `PostCommentWrite`, `PostCommentList` 분리 |
| 020 | 46 | 클로저를 활용해 id를 매개변수와 props로 넘기지 않도록 |
| 021 | 47 | `usePostComments`에서 `id`를 `postId`로 이름 변경 |
| 022 | 48 | `PostCommentListItem` 분리 |
| 023 | 49 | 댓글 수정 모드 토글, 수정 폼 표시 |
| 024 | 50 | 댓글 수정 API 연결, 성공 시 화면의 댓글 내용 갱신 |
| 025 | 51 | 댓글 폼 버튼 상단 정렬 |

45강은 "리팩토링은 필수가 아니다"라는 내용이라 따로 커밋하지 않았습니다.

### 강의 코드와 다르게 구현한 부분

- **함수형 업데이트**: `setPostComments((prev) => ...)`로 항상 최신 state를 기준으로 갱신합니다.
- **에러 처리 유지**: 훅의 작성·수정·삭제 함수에 `.catch`를 달아 실패를 알립니다.
- **중복 알림 방지**: 댓글 목록 조회에는 `.catch`를 달지 않아, 없는 글에서 404 알림이 두 번 뜨지 않습니다.
- **`usePost`의 `deletePost`도 클로저 적용**: 댓글 함수와 같은 방식으로 정리했습니다.
- **Tailwind 클래스로 통일**: 인라인 스타일 대신 `whitespace-pre-line`, `items-start` 등을 사용합니다.
