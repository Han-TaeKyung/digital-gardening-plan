# 🌱 디지털 가드닝 웹앱 — React 기술 문서

> **대상** : 웹퍼블리셔 서브프로젝트 (Vue 경험자의 첫 React 프로젝트)
> **버전** : v0.1
> **관련 문서** : [기획문서](./digital-gardening-plan.md) / Notion 개발 태스크 DB

---

## 1. 기술 스택

| 구분 | 선정 | 버전(권장) |
|---|---|---|
| 프레임워크 | React | ^18.3 |
| 빌드 도구 | Vite | ^5.4 |
| 언어 | JavaScript (JSX) | — |
| 스타일 | SCSS (CSS Modules) | sass ^1.77 |
| 로컬 DB | Dexie.js (IndexedDB 래퍼) | ^4.0 |
| 라우팅 | React Router | ^6.26 |
| 상태관리 | React Context + useReducer → 필요시 Zustand | zustand ^4.5 |
| 애니메이션 | Framer Motion (M5) | ^11 |
| 차트 | Recharts (M5) | ^2.12 |
| PWA | vite-plugin-pwa (M4) | ^0.20 |
| 컴포넌트 문서화 | Storybook | ^8.2 |
| 린트/포맷 | ESLint + Prettier + stylelint | — |
| 접근성 검증 | @storybook/addon-a11y, axe-core | — |

---

## 2. 프로젝트 폴더 구조

```
plant-diary-app/
├── .storybook/                  # Storybook 설정
│   ├── main.js
│   └── preview.js
├── public/
│   ├── manifest.json            # PWA 매니페스트 (M4)
│   └── icons/
├── src/
│   ├── main.jsx                 # 앱 엔트리포인트
│   ├── App.jsx                  # 라우터 루트
│   ├── routes/                  # 페이지 단위 (Vue의 views/ 대응)
│   │   ├── Home/
│   │   │   ├── Home.jsx
│   │   │   ├── Home.module.scss
│   │   │   └── Home.stories.jsx
│   │   ├── PlantDetail/
│   │   ├── Calendar/
│   │   └── Settings/
│   ├── components/               # 재사용 컴포넌트 (도메인 무관)
│   │   ├── Button/
│   │   │   ├── Button.jsx
│   │   │   ├── Button.module.scss
│   │   │   └── Button.stories.jsx
│   │   ├── Card/
│   │   ├── Modal/
│   │   ├── Input/
│   │   └── index.js             # named export 모음
│   ├── features/                 # 도메인 단위 컴포넌트+로직 묶음
│   │   ├── plant/
│   │   │   ├── PlantCard.jsx
│   │   │   ├── PlantForm.jsx
│   │   │   ├── usePlants.js      # 커스텀 훅 (데이터 접근)
│   │   │   └── plant.api.js      # Dexie 쿼리 함수
│   │   ├── watering/
│   │   │   ├── WaterButton.jsx
│   │   │   └── useWatering.js
│   │   └── journal/
│   │       ├── JournalEntryForm.jsx
│   │       └── useJournal.js
│   ├── hooks/                     # 전역 공용 훅
│   │   ├── useReducedMotion.js
│   │   └── useMediaQuery.js
│   ├── lib/
│   │   ├── db.js                 # Dexie 인스턴스 및 스키마 정의
│   │   └── backup.js             # JSON 백업/복원 유틸
│   ├── styles/
│   │   ├── _tokens.scss          # Figma MCP로 추출한 디자인 토큰
│   │   ├── _mixins.scss
│   │   └── global.scss
│   ├── context/
│   │   └── ThemeContext.jsx      # 다크모드 (M5)
│   └── assets/
│       └── icons/
├── .eslintrc.cjs
├── .stylelintrc.json
├── .prettierrc
├── vite.config.js
└── package.json
```

> **Vue 경험자를 위한 참고** : `features/`는 Vue의 `store` 모듈 + `views` 하위 컴포넌트를 합친 개념. `usePlants.js` 같은 커스텀 훅이 Pinia 스토어의 역할(데이터 접근/상태)을 대신함.

---

## 3. 컴포넌트 설계 원칙

### 3.1 파일 단위 구성
컴포넌트 1개 = 폴더 1개, 다음 3파일 세트 기본:
```
Button/
├── Button.jsx           # 로직 + JSX
├── Button.module.scss   # 스코프 스타일 (Vue의 scoped style 대응)
└── Button.stories.jsx   # Storybook 문서
```

### 3.2 Props 설계 규칙
- 모든 컴포넌트는 **필수 props 없이도 렌더링 가능**해야 함 (Storybook 기본 스토리 작성 용이성)
- 이벤트 콜백은 `on` 접두사 (`onWater`, `onSave`) — Vue의 `emit` 대응
- 자식 렌더링은 `children` 우선, 복잡한 슬롯 대체가 필요할 때만 render props

```jsx
// Button.jsx
export default function Button({
  children,
  variant = 'primary',   // 'primary' | 'secondary' | 'ghost'
  onClick,
  disabled = false,
  ariaLabel,
  ...rest
}) {
  return (
    <button
      className={`${styles.btn} ${styles[variant]}`}
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      {...rest}
    >
      {children}
    </button>
  );
}
```

### 3.3 상태 관리 원칙
- **컴포넌트 로컬 상태** : `useState` (Vue `ref`/`data()` 대응)
- **파생 값** : useEffect로 동기화하지 말고 렌더 중 직접 계산 (Vue `computed` 습관 주의)
- **전역 상태** (테마, 설정) : Context + useReducer, 필요 시 Zustand로 확장
- **서버/DB 상태** : 커스텀 훅으로 캡슐화 (`usePlants()` 가 내부에서 Dexie 쿼리 + `useState` 관리)

```jsx
// ❌ Vue의 watch 습관을 그대로 옮긴 안티패턴
useEffect(() => {
  setDaysAgo(calcDays(lastWatered));
}, [lastWatered]);

// ✅ 렌더 중 직접 계산 (파생 값은 useEffect 불필요)
const daysAgo = calcDays(lastWatered);
```

---

## 4. 데이터 레이어 (IndexedDB / Dexie)

### 4.1 스키마 정의
```js
// src/lib/db.js
import Dexie from 'dexie';

export const db = new Dexie('PlantDiaryDB');

db.version(1).stores({
  plants: '++id, name, species, createdAt, wateringCycleDays',
  photos: '++id, plantId, takenAt, blob, altText',
  journalEntries: '++id, plantId, date, note, tags',
});
```

### 4.2 접근 패턴
- DB 쿼리는 `features/*/*.api.js`에만 작성 (컴포넌트에서 직접 Dexie 호출 금지)
- 컴포넌트는 커스텀 훅을 통해서만 데이터 접근

```js
// features/plant/plant.api.js
import { db } from '@/lib/db';

export const getPlants = () => db.plants.orderBy('createdAt').toArray();
export const addPlant = (plant) => db.plants.add(plant);
export const waterPlant = (plantId) =>
  db.plants.update(plantId, { lastWateredAt: new Date().toISOString() });
```

```js
// features/plant/usePlants.js
import { useState, useEffect, useCallback } from 'react';
import { getPlants, addPlant, waterPlant } from './plant.api';

export function usePlants() {
  const [plants, setPlants] = useState([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setPlants(await getPlants());
    setLoading(false);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  return { plants, loading, refresh, addPlant, waterPlant };
}
```

---

## 5. 스타일 가이드 (SCSS)

### 5.1 디자인 토큰 (Figma MCP 연동 산출물)
```scss
// styles/_tokens.scss — Figma MCP로 추출, 수동 수정 금지 (자동 갱신 대상)
:root {
  --color-primary: #3f7655;
  --color-primary-light: #e8f0ea;
  --color-warning: #d97706;
  --color-danger: #dc2626;

  --font-size-body: 1rem;
  --font-size-heading: 1.5rem;

  --space-xs: 4px;
  --space-sm: 8px;
  --space-md: 16px;
  --space-lg: 24px;
}
```

### 5.2 CSS Modules 사용 규칙
- 클래스명은 camelCase (`className={styles.plantCard}`)
- 전역 스타일은 `styles/global.scss`에만 — 컴포넌트 SCSS에서 전역 셀렉터 금지
- 색상 대비는 토큰 값 직접 사용 (하드코딩 hex 금지) → 다크모드 전환 시 토큰 스위칭만으로 대응

---

## 6. 접근성(A11y) 구현 체크리스트

| 항목 | 구현 방법 |
|---|---|
| 키보드 포커스 | 모든 인터랙티브 요소에 `:focus-visible` 스타일, 커스텀 컴포넌트는 `tabIndex` 명시 |
| 동적 라벨 | `aria-label`을 상태값 기반 템플릿 문자열로 생성 (`` `${name}에 물주기, 마지막 물주기 ${days}일 전` ``) |
| 실시간 알림 | 물주기 완료 토스트에 `aria-live="polite"` 영역 사용 |
| 모션 감소 | `useReducedMotion` 훅으로 `prefers-reduced-motion` 감지 → Framer Motion `transition={{ duration: reduced ? 0 : 0.3 }}` |
| 캘린더 내비게이션 | `role="grid"` + 화살표 키 이벤트 핸들러 (`ArrowLeft/Right/Up/Down`) |
| 이미지 대체텍스트 | 업로드 폼에 필수 입력 필드, 미입력 시 템플릿 자동값 채움 |
| 검증 도구 | Storybook a11y addon 상시 실행, NVDA/VoiceOver 수동 테스트 (M3) |

```js
// hooks/useReducedMotion.js
import { useState, useEffect } from 'react';

export function useReducedMotion() {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(mq.matches);
    const handler = (e) => setReduced(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  return reduced;
}
```

---

## 7. Storybook 운영 규칙

- 모든 `components/`, `features/` 내 UI 컴포넌트는 `.stories.jsx` 필수
- 스토리 네이밍 : `{ComponentName}.stories.jsx` → 타이틀은 폴더 경로 반영 (`Components/Button`, `Features/Plant/PlantCard`)
- a11y addon 위반 항목은 Merge 전 반드시 0건
- 접근성 상태(포커스, aria 속성) 확인용 스토리는 `Play function`(interaction test)으로 자동화 권장

```jsx
// Button.stories.jsx
import Button from './Button';

export default {
  title: 'Components/Button',
  component: Button,
};

export const Primary = { args: { children: '물주기 기록', variant: 'primary' } };
export const Disabled = { args: { children: '물주기 기록', disabled: true } };
```

---

## 8. PWA 설정 개요 (M4)

```js
// vite.config.js
import { VitePWA } from 'vite-plugin-pwa';

export default {
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: '디지털 가드닝',
        short_name: '가드닝',
        theme_color: '#3f7655',
        display: 'standalone',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
      },
    }),
  ],
};
```

---

## 9. 코드 컨벤션 요약

| 항목 | 규칙 |
|---|---|
| 컴포넌트명 | PascalCase (`PlantCard.jsx`) |
| 훅 이름 | `use` 접두사 필수 (`usePlants`, `useWatering`) |
| 이벤트 핸들러 props | `on` 접두사 (`onWater`, `onDelete`) |
| 내부 핸들러 함수 | `handle` 접두사 (`handleClick`) |
| import 순서 | 1) 외부 라이브러리 2) 절대경로(`@/`) 내부 모듈 3) 상대경로 4) 스타일 |
| 절대경로 alias | `@/` → `src/` (vite.config.js `resolve.alias` 설정) |
| 커밋 메시지 | Conventional Commits (`feat:`, `fix:`, `style:`, `docs:`) |

---

## 10. 초기 셋업 명령어 (참고)

```bash
npm create vite@latest plant-diary-app -- --template react
cd plant-diary-app
npm install
npm install sass dexie react-router-dom
npm install -D eslint prettier stylelint
npx storybook@latest init
```

---

## 11. 참고 문서
- 기획문서 : `digital-gardening-plan.md`
- Notion 개발 태스크 DB : 🌱 디지털 가드닝 웹앱 - 개발 태스크
- Vue → React 개념 매핑표는 기획문서 §7.1 참조
