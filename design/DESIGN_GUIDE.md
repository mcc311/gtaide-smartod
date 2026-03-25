# SmartOD Design Guide

Based on TAIDE brand. Simple, warm, functional.

---

## 1. Color System

Only 3 colors + neutrals.不要花。

### Brand

| Token | Hex | Usage |
|---|---|---|
| `--brand-navy` | `#1B2D6B` | Headers, text, stepper, structure |
| `--brand-orange` | `#F5922A` | CTA buttons, active states, highlights |
| `--brand-orange-hover` | `#D47B22` | Button hover |

### Background

| Token | Hex | Usage |
|---|---|---|
| `--bg-page` | `#F5F1EC` | Page background (warm cream) |
| `--bg-card` | `#FFFFFF` | Cards, panels |
| `--bg-input` | `#FFFFFF` | Form inputs |

### Text

| Token | Hex | Usage |
|---|---|---|
| `--text-primary` | `#222222` | Body text |
| `--text-secondary` | `#666666` | Descriptions, hints |
| `--text-muted` | `#999999` | Placeholders |

### Border

| Token | Hex | Usage |
|---|---|---|
| `--border` | `#E1E1E1` | Default borders |
| `--border-focus` | `#1B2D6B` | Input focus state |

### Functional (sparingly)

| Token | Hex | Usage |
|---|---|---|
| `--success` | `#419F83` | Checkmarks, validation passed |
| `--error` | `#D5705D` | Error messages only |

### Direction Badges (only exception to two-color rule, because it's functional)

| | Background | Text |
|---|---|---|
| 上行文 | `#FEE2E2` | `#991B1B` |
| 平行文 | `#DBEAFE` | `#1E40AF` |
| 下行文 | `#D1FAE5` | `#065F46` |

---

## 2. Typography

### Fonts

```css
/* UI 介面 */
--font-ui: "Noto Sans TC", "PingFang TC", "Microsoft JhengHei", sans-serif;

/* 公文預覽 */
--font-doc: "Noto Serif TC", "PMingLiU", serif;
```

Google Fonts import:
```
Noto Sans TC: 400, 500, 700
Noto Serif TC: 400, 700
```

### Scale

| Level | Size | Weight | Font |
|---|---|---|---|
| Page title | 22px | 700 | UI |
| Step title | 18px | 700 | UI |
| Card title | 16px | 700 | UI |
| Body / Label | 14px | 500 | UI |
| Body text | 14px | 400 | UI |
| Help text | 12px | 400 | UI |
| Doc title (preview) | 18px | 700 | Serif |
| Doc body (preview) | 15px | 400 | Serif |

### Line Height

- UI text: 1.5
- Headings: 1.3
- Document preview: 1.8

---

## 3. Border Radius

| Token | Value | Usage |
|---|---|---|
| `--radius-sm` | `6px` | Inputs, badges, small elements |
| `--radius-md` | `12px` | Cards, dropdowns |
| `--radius-lg` | `16px` | Main panels, step containers |
| `--radius-full` | `100px` | Pill buttons, round badges |

---

## 4. Elevation

**Almost no shadows.** Follow TAIDE's approach.

- Cards: no shadow, use `border: 1px solid var(--border)` on `--bg-card`
- Sticky header: `box-shadow: 0 1px 0 var(--border)` (just a line)
- Dropdowns only: `box-shadow: 0 4px 12px rgba(0,0,0,0.08)`

---

## 5. Spacing

| Token | Value |
|---|---|
| `--space-1` | `4px` |
| `--space-2` | `8px` |
| `--space-3` | `12px` |
| `--space-4` | `16px` |
| `--space-5` | `24px` |
| `--space-6` | `32px` |
| `--space-8` | `48px` |

- Max content width: `720px`
- Card padding: `20px`
- Page padding: `16px` mobile, `24px` desktop

---

## 6. Components

### Buttons

| Type | Style |
|---|---|
| Primary | `bg: --brand-orange`, `text: white`, `radius: --radius-full`, `font-weight: 500` |
| Secondary | `bg: transparent`, `border: 1px solid --brand-navy`, `text: --brand-navy` |
| Ghost | `bg: transparent`, `text: --text-secondary`, hover: `bg: --bg-page` |

### Cards

```
bg: --bg-card
border: 1px solid --border
radius: --radius-md
padding: 20px
```

### Inputs

```
bg: --bg-input
border: 1px solid --border
radius: --radius-sm
padding: 10px 14px
focus: border --border-focus, ring 2px rgba(27,45,107,0.1)
```

### Stepper

```
Active:    circle bg --brand-orange, text white
Done:      circle bg --brand-navy, text white, checkmark
Upcoming:  circle bg --border, text --text-muted
Line:      2px, done: --brand-navy, upcoming: --border
```

### Tags/Badges

```
Default:   bg --bg-page, text --text-secondary, radius --radius-sm
Active:    bg --brand-orange/10%, text --brand-orange, border --brand-orange/30%
```

### Document Preview

```
bg: white
border: 1px solid #d1d1d1
radius: --radius-sm
padding: 32px 40px
font: --font-doc (Noto Serif TC)
font-size: 15px
line-height: 1.8
letter-spacing: 0.03em
```

---

## 7. Layout

```
Page:    bg --bg-page, min-height 100vh
Header:  bg --bg-card, border-bottom, sticky
Content: max-width 720px, centered
```

---

## 8. Principles

1. **Two colors only** — Navy for structure, orange for action. No per-step color themes.
2. **Warm background** — Cream `#F5F1EC`, not cold gray.
3. **No shadows** — Border + color blocking for hierarchy.
4. **Round but not bubbly** — 6-16px radius. Consistent.
5. **Noto Sans TC for UI, Noto Serif TC for document preview.**
6. **Minimal** — No decorations, no gradients, no fancy effects.
