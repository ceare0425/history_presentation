# 프레젠테이션 디자인 스타일 스펙 카탈로그

각 스타일의 상세 사양입니다. `presentation-builder` 스킬이 스타일 적용 시 이 파일을 참조합니다.

---

## 31 | 역사 수업 (History Class)

**분위기**: 고풍스러운 학술 · 고서(古書) · 역사 교실
**적합 용도**: 세계사, 한국사, 역사 수업, 역사 발표, 역사 탐구 자료

---

### Background

양피지(parchment) 느낌의 크림 배경. CSS만으로 aged paper 질감을 구현합니다.

```css
body {
  background-color: #F5E6C4;
  background-image:
    /* 미세 노이즈 질감 */
    repeating-linear-gradient(
      45deg,
      transparent,
      transparent 2px,
      rgba(160, 120, 60, 0.04) 2px,
      rgba(160, 120, 60, 0.04) 4px
    ),
    /* 수평 미세 선 */
    repeating-linear-gradient(
      0deg,
      transparent,
      transparent 28px,
      rgba(140, 100, 40, 0.06) 28px,
      rgba(140, 100, 40, 0.06) 29px
    );
}

.slide {
  background: transparent; /* body 배경이 비치도록 */
}
```

**어두운 변형 (Dark 버전 - 밤 도서관 분위기):**
```css
body {
  background-color: #1E0F06;
  background-image: repeating-linear-gradient(
    45deg,
    transparent, transparent 3px,
    rgba(180, 140, 60, 0.05) 3px, rgba(180, 140, 60, 0.05) 6px
  );
}
```

---

### Colors

```css
:root {
  /* 메인 팔레트 (양피지 라이트 테마) */
  --style-bg:             #F5E6C4;   /* 크림 양피지 배경 */
  --style-card-bg:        #FDF5E0;   /* 카드 배경 (더 밝은 양피지) */
  --style-card-bg-alt:    #F0E0B0;   /* 약간 어두운 양피지 (짝수행 등) */
  --style-primary:        #8B4513;   /* 새들브라운 — 주요 강조 */
  --style-accent:         #C5A028;   /* 고대 금색 — 포인트 */
  --style-accent-light:   #E8D080;   /* 연한 금색 */
  --style-text:           #2C1A0E;   /* 짙은 마호가니 텍스트 */
  --style-text-secondary: #6B4226;   /* 중간 갈색 보조 텍스트 */
  --style-border:         #A07850;   /* 갈색 테두리 */
  --style-border-gold:    #C5A028;   /* 금색 테두리 */
  --style-divider:        #8B6540;   /* 구분선 */
  --style-highlight-bg:   #FFF8E1;   /* 강조 박스 배경 */
  --style-highlight-border: #C5A028; /* 강조 박스 테두리 */

  /* 다크 테마 변형 */
  --style-dark-bg:        #1E0F06;
  --style-dark-card:      #2C1810;
  --style-dark-text:      #E8D4A0;
  --style-dark-secondary: #B89060;
}
```

---

### Font

```html
<!-- Google Fonts: 역사 수업 -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Nanum+Myeongjo:wght@400;700;800&family=Noto+Serif+KR:wght@300;400;500;600;700&display=swap" rel="stylesheet">
```

```css
body {
  font-family: 'Noto Serif KR', 'Nanum Myeongjo', Georgia, serif;
}
h1, h2, h3 {
  font-family: 'Nanum Myeongjo', 'Noto Serif KR', Georgia, serif;
  font-weight: 800;
  letter-spacing: 0.03em;
}
```

---

### Layout & Card Style

**권장 카드 스타일**: `minimal`

카드에 이중 테두리(double border) 고풍 프레임을 적용합니다:

```css
.browser-card {
  background: var(--style-card-bg);
  border: 2px solid var(--style-border);
  outline: 4px solid var(--style-border-gold);
  outline-offset: -8px;
  border-radius: 4px;
  box-shadow:
    0 4px 24px rgba(44, 26, 14, 0.18),
    inset 0 0 40px rgba(160, 120, 40, 0.06);
}

.browser-topbar {
  background: linear-gradient(90deg, #8B4513 0%, #6B3210 40%, #8B4513 100%);
  border-bottom: 2px solid var(--style-accent);
  padding: 0.5rem 1.2rem;
  display: flex;
  align-items: center;
  gap: 0.6rem;
}

.browser-title {
  color: #E8D080;
  font-family: 'Nanum Myeongjo', serif;
  font-size: 0.9rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-shadow: 0 1px 2px rgba(0,0,0,0.4);
}
```

---

### Signature Elements

각 슬라이드에 아래 요소 중 최소 1개를 반드시 포함합니다.

#### 1. 황금 장식 구분선 (Ornamental Divider)
```html
<div class="hist-divider">
  <span class="hist-divider-line"></span>
  <span class="hist-divider-gem">◆</span>
  <span class="hist-divider-line"></span>
</div>
```
```css
.hist-divider {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0.6rem 0;
}
.hist-divider-line {
  flex: 1;
  height: 2px;
  background: linear-gradient(90deg, transparent, #C5A028 30%, #C5A028 70%, transparent);
}
.hist-divider-gem {
  color: #C5A028;
  font-size: 0.8rem;
  line-height: 1;
}
```

#### 2. 연도/시대 뱃지 (Era Badge)
```html
<span class="hist-era-badge">BCE 3000</span>
<span class="hist-era-badge">중세 시대</span>
```
```css
.hist-era-badge {
  display: inline-block;
  background: linear-gradient(135deg, #8B4513, #6B3010);
  color: #E8D080;
  border: 1px solid #C5A028;
  padding: 0.15rem 0.6rem;
  font-family: 'Nanum Myeongjo', serif;
  font-size: 0.82rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  border-radius: 2px;
}
```

#### 3. 고풍 인용문 박스 (Historical Quote)
```html
<div class="hist-quote-box">
  <div class="hist-quote-mark">"</div>
  <p class="hist-quote-text">역사는 반복된다</p>
  <div class="hist-quote-source">— 마르크스</div>
</div>
```
```css
.hist-quote-box {
  background: #FFF8E1;
  border-left: 4px solid #C5A028;
  border-right: 1px solid #C5A028;
  padding: 1rem 1.2rem 1rem 1.4rem;
  margin: 0.6rem 0;
  position: relative;
}
.hist-quote-mark {
  position: absolute;
  top: -0.2rem;
  left: 0.3rem;
  font-size: 3rem;
  color: #C5A028;
  line-height: 1;
  font-family: Georgia, serif;
  opacity: 0.6;
}
.hist-quote-text {
  font-style: italic;
  color: #2C1A0E;
  font-size: 1rem;
  padding-left: 1rem;
  margin: 0 0 0.3rem 0;
}
.hist-quote-source {
  text-align: right;
  color: #6B4226;
  font-size: 0.85rem;
  font-weight: 600;
}
```

#### 4. 역사 연표 스타일 카드 (History Card)
```html
<div class="hist-card">
  <div class="hist-card-year">1453</div>
  <div class="hist-card-content">
    <strong>동로마 제국 멸망</strong>
    <p>오스만 제국의 콘스탄티노플 정복으로 중세가 막을 내리다.</p>
  </div>
</div>
```
```css
.hist-card {
  display: flex;
  gap: 0;
  border: 1px solid var(--style-border);
  border-radius: 3px;
  overflow: hidden;
  margin: 0.4rem 0;
  background: var(--style-card-bg);
}
.hist-card-year {
  background: linear-gradient(180deg, #8B4513, #6B3010);
  color: #E8D080;
  font-family: 'Nanum Myeongjo', serif;
  font-weight: 800;
  font-size: 0.9rem;
  writing-mode: vertical-rl;
  text-orientation: mixed;
  padding: 0.6rem 0.4rem;
  letter-spacing: 0.04em;
  min-width: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
}
.hist-card-content {
  padding: 0.5rem 0.8rem;
  flex: 1;
}
.hist-card-content strong {
  color: #8B4513;
  font-size: 0.95rem;
  display: block;
  margin-bottom: 0.2rem;
}
.hist-card-content p {
  font-size: 0.85rem;
  color: #6B4226;
  margin: 0;
  line-height: 1.5;
}
```

#### 5. 섹션 제목 장식 (Section Title Ornament)
```html
<div class="hist-section-title">
  <div class="hist-section-ornament">✦ ✦ ✦</div>
  <h2>제1장: 문명의 탄생</h2>
  <div class="hist-divider"><span class="hist-divider-line"></span><span class="hist-divider-gem">◆</span><span class="hist-divider-line"></span></div>
</div>
```
```css
.hist-section-ornament {
  color: #C5A028;
  font-size: 0.75rem;
  letter-spacing: 0.4em;
  text-align: center;
  margin-bottom: 0.3rem;
  opacity: 0.8;
}
.hist-section-title h2 {
  text-align: center;
  color: #2C1A0E;
  margin: 0.2rem 0;
}
```

#### 6. 고지도 격자 배경 (Map Grid Overlay) — 선택적
```css
.slide-with-map-bg .browser-content::before {
  content: '';
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(139, 69, 19, 0.07) 1px, transparent 1px),
    linear-gradient(90deg, rgba(139, 69, 19, 0.07) 1px, transparent 1px);
  background-size: 40px 40px;
  pointer-events: none;
  z-index: 0;
}
.slide-with-map-bg .browser-content > * {
  position: relative;
  z-index: 1;
}
```

---

### 네비게이션 바 변형

```css
.nav-bar {
  background: rgba(44, 24, 8, 0.96);
  border-top: 2px solid #C5A028;
  color: #E8D080;
}
.nav-btn {
  border-color: #8B6540;
  background: transparent;
  color: #E8D080;
}
.nav-btn:hover:not(:disabled) {
  background: #8B4513;
  border-color: #C5A028;
}
.nav-counter {
  color: #E8D080;
}
.slide-input {
  color: #E8D080;
  background: transparent;
}
.slide-input:focus {
  background: rgba(139, 69, 19, 0.3);
}
```

---

### Avoid (금지 사항)

- 네온 컬러, 형광색, 강한 채도의 현대적 색상
- 둥근 현대 UI (border-radius 10px 이상의 카드)
- 그라데이션 메시, 글래스모피즘, 블러 효과
- 산세리프 계열 폰트 (Noto Sans, Pretendard 등) — 반드시 명조/세리프체 사용
- 현대적 아이콘 세트 (Material Icons 등) 단독 사용 → 이모지나 유니코드 특수문자 활용
- 흰색(#FFFFFF) 배경 — 반드시 크림/양피지 톤 유지

---

### 전체 적용 예시 (CSS 변수 요약)

```css
:root {
  --main:    #8B4513;
  --dark:    #6B3010;
  --light:   #FFF8E1;
  --accent:  #C5A028;
  --white:   #FDF5E0;
  --gray-200: #D4B896;
  --gray-600: #8B6540;
  --gray-700: #6B4226;
}

body {
  background-color: #F5E6C4;
  font-family: 'Noto Serif KR', 'Nanum Myeongjo', Georgia, serif;
  color: #2C1A0E;
}
```

---

> **참고**: 이 스타일은 세계사 PDF 교재의 학술적·고전적 분위기를 반영하여 설계되었습니다.
> Dark Academia(#04) 스타일과 유사하지만, 한국어 명조체와 양피지 팔레트, 역사 수업 전용 컴포넌트(연표 카드, 시대 뱃지, 고풍 인용문)를 추가로 제공합니다.
