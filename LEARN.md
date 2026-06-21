# LEARN.md — 지하철 랜덤뽑기 앱을 만들며 배운 것

이 프로젝트를 만들면서 나온 개념들을 주제별로 정리한 학습 노트.

---

## 1. 기술 스택 & 아키텍처

### 왜 Next.js + TypeScript + Tailwind + "DB 없음"인가
- 데이터(역 799개, ~113KB)가 **작고 거의 안 바뀜** → 데이터베이스가 필요 없다.
- CSV를 JSON으로 변환해 **앱 번들에 내장**(`import`)하면 조회용 서버가 불필요.
- 빌드 결과가 **완전 정적(Static)** → Vercel 무료 배포로 충분.

```
CSV (원본)  →  stations.json  →  빌드 시 JS 번들에 포함  →  브라우저로 전송
```

### "결과 공유"에 백엔드가 필요할까? — UUID의 함정
- **UUID는 저장소가 있을 때만 의미가 있다.** 받는 사람이 그 UUID로 어딘가에서
  데이터를 *조회*할 수 있어야 하므로, UUID 공유 = DB 필요.
- 공유할 데이터가 작으면(역 + 시각) → **URL에 통째로 인코딩**하는 게 더 간단.
  - `?s=K325&t=1718900000` 처럼 **링크 자체가 데이터**. 서버 조회 불필요.
- DB가 정말 필요해지는 순간: "내 뽑기 기록 누적", "통계/랭킹", "로그인".
  - "내 기기에만 기록" 정도는 DB 없이 **localStorage**로 가능.

| 데이터 | 어디에 | 영구 저장? |
|---|---|---|
| 역 정보 | 앱 번들(JSON) | O (코드에 박힘) |
| 뽑은 결과 | 메모리 + URL | X (URL 공유 시에만 유지) |

---

## 2. 데이터 다루기

### 내부코드 vs 외부코드
- `전철역코드`(내부코드, 예: `2818`) vs `외부코드`(예: `K325`).
- 외부코드는 799개 전부 **고유**하고 빈값 없음 → URL 식별자로 안전.
- 데이터만 교체하면 앱 코드는 안 건드려도 됨(필드명 유지가 중요).
- 환승역은 **노선별로 외부코드가 다름** (풍산: 경의중앙 `K325` / 서해선 `S08`).

### 필터 칩 순서 = 데이터 배열 순서
- 화면 순서는 `stations.json`의 `lines` 배열 순서 그대로(`LINES.map`).
- **주의:** JSON이 변환 스크립트로 자동 생성되면, 손으로 고친 순서는
  재생성 시 덮어쓰여 사라진다. 영구적으로 하려면 코드에서 정렬 순서를 고정.

---

## 3. 폰트 적용 (next/font)

### 두 갈래
- **Google Fonts에 있는 폰트** → `next/font/google` (Noto Sans KR 등)
- **없는 폰트(Pretendard, Wanted Sans)** → `next/font/local` + woff2 직접 추가
  - 가변폰트(Variable)는 woff2 하나로 전체 굵기 커버 → `weight: "100 900"`

```ts
import localFont from "next/font/local";
const wantedSans = localFont({
  src: "./fonts/WantedSansVariable.woff2", // layout.tsx 기준 상대경로
  variable: "--font-sans",
  weight: "100 900",
  display: "swap",
});
```

### ⚠️ 가장 흔한 함정: "정의만 하고 안 붙임"
- `next/font`의 `variable: "--font-sans"`는 **그 className을 붙인 요소에**
  CSS 변수를 세팅하는 방식. 폰트를 만들기만 하고 `<html className=...>`에
  `wantedSans.variable`을 **안 넣으면 `--font-sans`가 아예 정의 안 됨** → 폴백 폰트로 보임.
- 그리고 `globals.css`의 `body`가 `font-family`를 다른 값(Arial)으로 하드코딩해두면
  변수를 넣어도 안 먹는다. **두 군데를 연결**해야 함:
  1. `@theme inline`의 `--font-sans`
  2. `body { font-family: var(--font-sans); }` (Arial 하드코딩 제거)
- 확인법: 개발자도구 → body의 Computed `font-family`에 `__wantedSans_…`가 뜨면 성공.

---

## 4. HTML/JSX 기본기

### `<a>` vs `<button>` — 언제 뭘 쓰나
- **어딘가로 이동** → `<a href>`  /  **상태를 바꾸는 동작**(뽑기, 토글) → `<button onClick>`
- URL을 열 거면 `onClick + window.open`보다 `<a href>`가 정석:

| | onClick + window.open | `<a href>` |
|---|---|---|
| 가운데클릭/우클릭 새 탭 | ❌ | ✅ |
| 접근성(스크린리더) | ❌ | ✅ |
| 팝업 차단 | 가끔 막힘 | 안 막힘 |

- 외부 링크는 `target="_blank" rel="noopener noreferrer"` 꼭.
- 한글이 들어가는 URL은 **`encodeURIComponent`** 필수.

### 버그: `<button>` 안에 `<a>`를 넣으면 텍스트만 클릭됨
- 스타일(전체 박스)은 `<button>`이, 링크는 `<a>`가 감싼 글자만 갖게 됨
  → 버튼 전체가 아니라 글자만 클릭됨. (게다가 `<a>` in `<button>`은 잘못된 중첩)
- **해결:** 래퍼를 없애고 `<a>` 자체에 버튼 스타일 className을 줘서
  *그 요소 자체가 링크*가 되게 한다.

### `<a>`는 글자 가운데 정렬이 기본이 아니다
- `<button>`은 텍스트가 기본 가운데지만 `<a>`는 기본 왼쪽 → **`text-center`** 명시.
- 더 확실히(가로·세로 + 아이콘): `<a>`를 `flex items-center justify-center`로.

### 커서: `<a>`는 손가락, `<button>`은 화살표
- 브라우저 기본값: `<a href>` → `cursor: pointer`(손가락), `<button>` → 화살표.
- 버튼도 손가락으로 통일하려면 **`cursor-pointer`** 추가
  (또는 globals.css에 `button { cursor: pointer; }` 전역).
- `<a>`라도 `href`가 없으면 pointer 안 나옴.

---

## 5. React/JSX 패턴

### 조건부 블록 합치기 (중복 줄이기)
- 같은 조건을 공유하고 한 가지 상태만 다르면, 바깥 조건으로 묶고 안에서 삼항으로 분기.

```tsx
{result && (
  <div className="flex gap-2">
    {rolling
      ? <button className={actionClass}>뽑는 중...</button>
      : <a className={actionClass} href={...}>네이버 지도</a>}
  </div>
)}
```
- 반복되는 긴 className은 **상수로 추출**해 한 곳에서 관리.

---

## 6. Tailwind 레이아웃 & 스타일

### 크기 조절
- 두께(높이): `py-*`(상하 패딩), 글자: `text-sm/base/lg`, 모서리: `rounded-*`.
- "살짝 줄이기"는 보통 `py`와 `text-*`를 한 단계씩 낮추는 것.

### 요소 "사이" 간격 줄이기
- 세로 스택의 간격은 부모 컨테이너의 **`gap-*`** 이 일괄 적용한다.
- **특정 두 개만** 좁히려면 → 그 둘을 한 `<div className="flex flex-col gap-2">`로
  **묶고** 안쪽 gap만 작게. (빠른 대안: 아래 요소에 음수 마진 `-mt-*`)

### 버튼 위계 (primary vs secondary)
- 주 액션(랜덤 뽑기)과 부가 액션(네이버 지도)을 같은 row에 **동급 크기**로 두면
  위계가 죽고, 부가 액션이 조건부로 나타날 때 **레이아웃이 덜컹**인다.
- 보통은 **세로 스택 + 주 액션을 크게**가 더 깔끔.
- 굳이 row면 폭으로 위계: `flex-[2]`(주) vs `flex-1`(부가).

### 색으로 상태 표현
- "뽑는 중..." 같은 비활성/로딩 상태 → 회색으로 죽이기:
  `bg-neutral-200 text-neutral-500` (+ 다크: `dark:bg-neutral-800 dark:text-neutral-400`).
- 못 누르는 느낌까지: `cursor-not-allowed` + 실제 차단은 `disabled` 속성.

---

## 7. 개발 환경 / 트러블슈팅

### dev 서버 켜둔 채 `npm run build` 하지 말기
- dev와 build가 **같은 `.next` 폴더**를 쓰다가 매니페스트가 꼬임.
- 증상: `Could not find the module ... in the React Client Manifest` 류 500 에러.
- **해결:** 서버 끄고 → `rm -rf .next` → 재시작. (코드 버그 아님, 캐시 문제)
- `next.config.ts` 같은 설정을 바꾸면 dev 서버 **재시작** 필요.

### 워크스페이스 루트 경고
- 상위 폴더에 다른 lockfile이 있으면 Next가 루트를 잘못 추론.
- `next.config.ts`에 `turbopack: { root: __dirname }`로 고정.

### 검증 루틴
- 타입 체크: `npx tsc --noEmit`
- 빌드 확인: `npm run build` → 라우트가 `○ (Static)`이면 정적 배포 가능.

---

## 8. 외부 지도 연동 (네이버 지도)

- **가장 가벼운 방법:** 검색 링크 — 키도 좌표도 불필요.
  ```
  https://map.naver.com/p/search/{encodeURIComponent(역명 + "역")}
  ```
- **앱 안에 임베드**하려면: 네이버 지도 JS API(Client ID 발급 + 도메인 등록) +
  좌표(위도/경도) 필요. 이 좌표는 `전체_도시철도역사정보` xlsx에 들어 있음.
- 지금 단계엔 **링크 방식**이 비용 대비 효과가 압도적.

---

## 한 줄 요약 모음
- 데이터가 작고 안 바뀌면 DB 대신 **번들 내장 + URL 공유**.
- next/font는 **변수를 요소에 붙여야** 적용되고, **body의 font-family와 연결**해야 보인다.
- **이동은 `<a>`, 동작은 `<button>`.** 버튼 스타일은 그 요소 *자체*에.
- 특정 두 요소 간격은 **묶어서 gap**으로.
- dev 켜둔 채 build 금지. 꼬이면 `rm -rf .next`.
