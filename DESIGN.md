---
version: "1.0"
name: to-hong-design-system
description: >
  Tơ Hồng is an AI wedding planner for Vietnamese couples. The design language is
  modern-romantic and heritage-touched — warm ivory paper, blush peony tones, a deep
  ceremonial lacquer-rose (son), and antique gold (kim). The feel is a beautifully
  art-directed wedding invitation suite: airy, refined, never loud. The brand's
  recurring motif is the tơ hồng — the red thread of fate — rendered as a single
  hairline rose curve that traces through dividers, timelines, and progress indicators.
  Three serif families share the stage: Playfair Display for romantic display headlines,
  Lora for warm body copy, Be Vietnam Pro (designed for Vietnamese diacritics) for all
  UI labels and data. Vietnamese is the primary voice; English appears as a quiet
  secondary layer.

colors:
  # Primary — Son (lacquer rose)
  primary: "#A83246"
  primary-hover: "#8E2639"
  primary-press: "#721C2C"
  primary-soft: "#FBEDEF"

  # Accent — Kim (antique gold)
  accent: "#C2A15B"
  accent-deep: "#A8853F"
  accent-light: "#F3E7C7"

  # Soft romantic — Đào (peony blush)
  blush-100: "#F8E1DF"
  blush-200: "#F0C7C7"
  blush-300: "#E5A9AC"

  # Warm neutrals
  paper: "#FCF8F3"
  sand: "#F6EEE4"
  linen: "#F0E6D8"
  card: "#FFFDFB"
  white: "#FFFFFF"

  # Borders / hairlines
  line-100: "#EFE6D8"
  line-200: "#E4D6C3"
  line-300: "#D6C4AC"

  # Ink (text)
  ink-900: "#2B2420"
  ink-700: "#4A4039"
  ink-500: "#6B5D52"
  ink-400: "#8C7E70"
  ink-300: "#A99C8D"
  on-primary: "#FFF7F0"

  # Semantic
  success: "#5E8C6A"
  success-soft: "#E9F1EA"
  warning: "#C98A3C"
  warning-soft: "#FAF0DF"
  error: "#B23B3B"
  error-soft: "#F8E6E4"
  info: "#4A6B8A"
  info-soft: "#E7EEF3"

typography:
  display:
    fontFamily: "Playfair Display, Times New Roman, serif"
    fontSize: 78px
    fontWeight: 600
    lineHeight: 1.1
    letterSpacing: -0.02em
  h1:
    fontFamily: "Playfair Display, Times New Roman, serif"
    fontSize: 46px
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: -0.02em
  h2:
    fontFamily: "Playfair Display, Times New Roman, serif"
    fontSize: 36px
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: 0
  h3:
    fontFamily: "Playfair Display, Times New Roman, serif"
    fontSize: 28px
    fontWeight: 500
    lineHeight: 1.25
    letterSpacing: 0
  h4:
    fontFamily: "Playfair Display, Times New Roman, serif"
    fontSize: 22px
    fontWeight: 500
    lineHeight: 1.25
    letterSpacing: 0
  lead:
    fontFamily: "Lora, Georgia, serif"
    fontSize: 18px
    fontWeight: 400
    lineHeight: 1.7
    letterSpacing: 0
  body:
    fontFamily: "Lora, Georgia, serif"
    fontSize: 16px
    fontWeight: 400
    lineHeight: 1.7
    letterSpacing: 0
  body-sm:
    fontFamily: "Lora, Georgia, serif"
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: 0
  ui:
    fontFamily: "Be Vietnam Pro, system-ui, sans-serif"
    fontSize: 14px
    fontWeight: 500
    lineHeight: 1.5
    letterSpacing: 0
  label:
    fontFamily: "Be Vietnam Pro, system-ui, sans-serif"
    fontSize: 12px
    fontWeight: 600
    lineHeight: 1.5
    letterSpacing: 0.14em
    textTransform: uppercase
  caption:
    fontFamily: "Be Vietnam Pro, system-ui, sans-serif"
    fontSize: 12px
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: 0
  button:
    fontFamily: "Be Vietnam Pro, system-ui, sans-serif"
    fontSize: 14px
    fontWeight: 600
    lineHeight: 1
    letterSpacing: 0
  num:
    fontFamily: "Be Vietnam Pro, system-ui, sans-serif"
    fontWeight: 600
    fontVariantNumeric: tabular-nums
    letterSpacing: -0.02em

rounded:
  xs: 4px
  sm: 8px
  md: 12px
  lg: 18px
  xl: 26px
  pill: 999px

spacing:
  1: 4px
  2: 8px
  3: 12px
  4: 16px
  5: 20px
  6: 24px
  8: 32px
  10: 40px
  12: 48px
  16: 64px
  20: 80px

shadows:
  xs: "0 1px 2px rgba(80,50,40,0.06)"
  sm: "0 2px 8px rgba(80,50,40,0.07)"
  md: "0 8px 24px rgba(80,50,40,0.10)"
  lg: "0 18px 48px rgba(80,50,40,0.14)"
  gold: "0 6px 20px rgba(168,133,63,0.22)"
  rose: "0 8px 24px rgba(168,50,70,0.18)"

components:
  button-primary:
    backgroundColor: "{colors.primary}"
    color: "{colors.on-primary}"
    typography: "{typography.button}"
    borderRadius: "{rounded.pill}"
    padding: "11px 22px"
    boxShadow: "{shadows.rose}"
  button-primary-hover:
    backgroundColor: "{colors.primary-hover}"
  button-primary-disabled:
    backgroundColor: "{colors.line-100}"
    color: "{colors.ink-300}"
    boxShadow: none
  button-secondary:
    backgroundColor: transparent
    color: "{colors.primary-hover}"
    border: "1px solid {colors.blush-300}"
    borderRadius: "{rounded.pill}"
    padding: "11px 22px"
  button-secondary-hover:
    backgroundColor: "{colors.primary-soft}"
  button-ghost:
    backgroundColor: transparent
    color: "{colors.ink-700}"
    borderRadius: "{rounded.pill}"
    padding: "11px 22px"
  button-ghost-hover:
    backgroundColor: "{colors.sand}"
  button-gold:
    backgroundColor: "{colors.accent}"
    color: "#3a2c0c"
    borderRadius: "{rounded.pill}"
    padding: "11px 22px"
    boxShadow: "{shadows.gold}"
  button-sm:
    padding: "7px 14px"
    fontSize: 12.5px
  text-input:
    backgroundColor: "{colors.card}"
    color: "{colors.ink-900}"
    typography: "{typography.body}"
    borderRadius: "{rounded.md}"
    border: "1px solid {colors.line-200}"
    padding: "11px 14px"
  text-input-focus:
    borderColor: "{colors.primary}"
    boxShadow: "0 0 0 3px color-mix(in oklab, {colors.primary} 45%, transparent)"
  text-input-error:
    borderColor: "{colors.error}"
  card-base:
    backgroundColor: "{colors.card}"
    border: "1px solid {colors.line-100}"
    borderRadius: "{rounded.lg}"
    boxShadow: "{shadows.md}"
    padding: "18px 20px"
  card-budget:
    backgroundColor: "{colors.card}"
    border: "1px solid {colors.line-100}"
    borderRadius: "{rounded.lg}"
    boxShadow: "{shadows.md}"
    padding: "18px 20px"
  card-vendor:
    backgroundColor: "{colors.card}"
    border: "1px solid {colors.line-100}"
    borderRadius: "{rounded.lg}"
    boxShadow: "{shadows.md}"
    padding: "18px 20px"
  card-gold:
    backgroundColor: "{colors.card}"
    border: "1px solid {colors.accent-light}"
    borderRadius: "{rounded.lg}"
    boxShadow: "{shadows.gold}"
    padding: "18px 20px"
  chip-filter:
    backgroundColor: "{colors.card}"
    border: "1px solid {colors.line-200}"
    color: "{colors.ink-700}"
    borderRadius: "{rounded.pill}"
    padding: "6px 13px"
    typography: "{typography.ui}"
  chip-filter-active:
    backgroundColor: "{colors.primary}"
    borderColor: "{colors.primary}"
    color: white
  chip-blush:
    backgroundColor: "{colors.blush-100}"
    color: "{colors.primary-hover}"
    borderRadius: "{rounded.pill}"
    padding: "6px 13px"
  chip-gold:
    backgroundColor: "{colors.accent-light}"
    color: "{colors.accent-deep}"
    border: "1px solid {colors.accent-light}"
    borderRadius: "{rounded.pill}"
    padding: "6px 13px"
  badge-success:
    backgroundColor: "{colors.success-soft}"
    color: "{colors.success}"
    borderRadius: "{rounded.pill}"
    padding: "4px 10px"
    typography: "{typography.label}"
  badge-warning:
    backgroundColor: "{colors.warning-soft}"
    color: "{colors.warning}"
    borderRadius: "{rounded.pill}"
    padding: "4px 10px"
  badge-error:
    backgroundColor: "{colors.error-soft}"
    color: "{colors.error}"
    borderRadius: "{rounded.pill}"
    padding: "4px 10px"
  kicker:
    color: "{colors.accent-deep}"
    typography: "{typography.label}"
  progress-bar:
    height: 7px
    borderRadius: "{rounded.pill}"
    background: "{colors.line-100}"
    fill: "linear-gradient(90deg, {colors.primary}, {colors.primary-hover})"
---

## Overview

Tơ Hồng is the warmest, most culturally-rooted interface in the AI-planner category.
The atmosphere is an **ivory paper canvas** (`{colors.paper}` — #FCF8F3): a warm,
slightly amber-tinted background that evokes a high-quality wedding invitation, not a
generic app shell. There is **no cool grey anywhere** in the system.

Brand identity centres on three named colours borrowed from Vietnamese wedding
symbolism: **Son** (lacquer rose — the primary action colour), **Kim** (antique gold —
ceremony, confirmation, premium states), and **Đào** (peony blush — the soft romantic
fill for placeholders and gentle surfaces). Together they read as the palette of a
golden-hour Vietnamese wedding photograph: reds, pinks, golds, and ivory in warm
natural light.

The signature visual element is the **tơ hồng motif**: a single hairline arc in Son
(sometimes doubled with a blush echo and punctuated by a gold dot) that recurs as
section dividers, header underlines, timeline traces, and progress indicators. It
literally draws the "red thread of fate" through the product.

**Three font families** split responsibility cleanly:

- **Playfair Display** (high-contrast romantic serif) → all display headlines and h1–h4
- **Lora** (warm, even workhorse serif) → all body and lead paragraphs
- **Be Vietnam Pro** (humanist sans designed for Vietnamese diacritics) → UI labels,
  buttons, captions, monetary figures, and tabular data

Every button is **fully pill-shaped** (`{rounded.pill}`). Cards are soft but not
bubbly at `{rounded.lg}` (18px). Shadows are warm-tinted brown-rose (never harsh
black). The overall register is: premium romantic stationery shop, not a loud festival
poster.

**Key Characteristics:**

- Ivory paper canvas (`{colors.paper}` — #FCF8F3). Never pure white.
- Son / lacquer rose (`{colors.primary}` — #A83246). Every primary CTA, the logo, the thread motif.
- Kim / antique gold (`{colors.accent}` — #C2A15B). Used as ink-thin kicker lines and premium states — never a big fill.
- Đào / peony blush (`{colors.blush-100}` – `{colors.blush-300}`). Soft fills, placeholder surfaces, romantic accents.
- All buttons are pill-shaped with a rose glow on primary.
- Serif-led typography: Playfair Display headings, Lora body, Be Vietnam Pro for all UI and numbers.
- The tơ hồng thread motif — a single hairline rose curve — is the repeating brand glyph.
- Warm-tinted shadows; zero cool grey anywhere in the system.
- Vietnamese-first bilingual copy; full diacritics mandatory.

---

## Colors

### Primary — Son (lacquer rose)

- **Primary** (`{colors.primary}` — #A83246): Romanticized ceremonial red. All primary buttons,
  the logo mark, the thread motif line, active chip fill, progress-bar gradient endpoint.
  This is the brand's defining action colour.
- **Primary Hover** (`{colors.primary-hover}` — #8E2639): Pressed/hover state of any primary surface.
- **Primary Press** (`{colors.primary-press}` — #721C2C): Deep press, active-state darkening.
- **Primary Soft** (`{colors.primary-soft}` — #FBEDEF): Background tint for secondary-button hover,
  selected-row highlight, ghost elements that need the lightest rose wash.

### Accent — Kim (antique gold)

- **Accent** (`{colors.accent}` — #C2A15B): The ceremonial gold. Used as ink colour on kicker
  labels, as a hairline border on premium cards, and as the fill of the gold button variant
  (`button-gold`). Applied sparingly — never as a background on large surfaces.
- **Accent Deep** (`{colors.accent-deep}` — #A8853F): Darker gold for interactive states and
  `chip-gold` text.
- **Accent Light** (`{colors.accent-light}` — #F3E7C7): Very pale gold tint, used as `chip-gold`
  background and premium card border.

### Soft romantic — Đào (peony blush)

- **Blush 100** (`{colors.blush-100}` — #F8E1DF): The lightest blush. `chip-blush` background,
  vendor-card placeholder gradient base, soft surfaces needing a romantic pink note.
- **Blush 200** (`{colors.blush-200}` — #F0C7C7): Mid-blush gradient stop in vendor card image areas.
- **Blush 300** (`{colors.blush-300}` — #E5A9AC): Secondary-button border. The line between "soft
  pink" and "rose" — used for subtle outline elements.

### Warm Neutrals (paper, sand, linen)

- **Paper** (`{colors.paper}` — #FCF8F3): The app's default background. Warm ivory, the brand's canvas.
- **Sand** (`{colors.sand}` — #F6EEE4): Secondary surface, section dividers, card-grid backgrounds.
- **Linen** (`{colors.linen}` — #F0E6D8): Tertiary / inset surfaces (nested panels, sub-sections).
- **Card** (`{colors.card}` — #FFFDFB): Pure raised card surface, slightly brighter than paper so
  cards float without heavy shadow.
- **White** (`{colors.white}` — #FFFFFF): Reserved for modal overlays and print contexts.

### Borders / Hairlines

- **Line 100** (`{colors.line-100}` — #EFE6D8): The softest hairline. Default card border, progress
  bar track.
- **Line 200** (`{colors.line-200}` — #E4D6C3): Default input border, section rules.
- **Line 300** (`{colors.line-300}` — #D6C4AC): Strong border for emphasized dividers.

### Ink (text)

- **Ink 900** (`{colors.ink-900}` — #2B2420): Primary text. Warm near-black.
- **Ink 700** (`{colors.ink-700}` — #4A4039): Strong secondary, ghost button text.
- **Ink 500** (`{colors.ink-500}` — #6B5D52): Default secondary text, body descriptions.
- **Ink 400** (`{colors.ink-400}` — #8C7E70): Muted labels, meta text.
- **Ink 300** (`{colors.ink-300}` — #A99C8D): Disabled state, placeholder text.
- **On Primary** (`{colors.on-primary}` — #FFF7F0): Text on rose/primary surfaces — a warm cream
  white, never pure white.

### Semantic

- **Success** (`{colors.success}` — #5E8C6A): "Đã chốt" (confirmed). Sage green, warm-leaning.
- **Warning** (`{colors.warning}` — #C98A3C): "Cần chú ý" (needs attention). Warm amber.
- **Error** (`{colors.error}` — #B23B3B): "Vượt ngân sách" (over budget). Brick rose, not traffic-cone red.
- **Info** (`{colors.info}` — #4A6B8A): Informational. Slate-blue, the one cooler-leaning tone in
  the system — but muted enough not to clash.

All semantic colours have paired `*-soft` background tints for badge use.

---

## Typography

### Font Families

Three families; each has a distinct role and must not be substituted without care:

| Family               | Role                                                 | Fallback                             |
| -------------------- | ---------------------------------------------------- | ------------------------------------ |
| **Playfair Display** | Display headlines, h1–h4                             | Times New Roman, serif               |
| **Lora**             | Body, lead, long-form Vietnamese paragraphs          | Georgia, serif                       |
| **Be Vietnam Pro**   | UI labels, buttons, captions, monetary figures, data | system-ui, -apple-system, sans-serif |

Loaded from Google Fonts with Vietnamese + Latin subsets:

```
https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;0,800;1,400;1,500;1,600&family=Lora:ital,wght@0,400;0,500;0,600;1,400;1,500&family=Be+Vietnam+Pro:wght@300;400;500;600;700&display=swap
```

### Hierarchy

| Token                  | Size   | Weight | Line Height | Letter Spacing | Family           | Use                                                       |
| ---------------------- | ------ | ------ | ----------- | -------------- | ---------------- | --------------------------------------------------------- |
| `{typography.display}` | 78px   | 600    | 1.1         | -0.02em        | Playfair Display | Landing hero — _"Tơ Hồng"_, _"Kế hoạch đám cưới"_         |
| `{typography.h1}`      | 46px   | 600    | 1.25        | -0.02em        | Playfair Display | Page titles                                               |
| `{typography.h2}`      | 36px   | 600    | 1.25        | 0              | Playfair Display | Section headings                                          |
| `{typography.h3}`      | 28px   | 500    | 1.25        | 0              | Playfair Display | Card headings, dialog titles                              |
| `{typography.h4}`      | 22px   | 500    | 1.25        | 0              | Playfair Display | Sub-section titles                                        |
| `{typography.lead}`    | 18px   | 400    | 1.7         | 0              | Lora             | Intro paragraphs, AI greeting messages                    |
| `{typography.body}`    | 16px   | 400    | 1.7         | 0              | Lora             | Default running text, chat bubbles                        |
| `{typography.body-sm}` | 14px   | 400    | 1.5         | 0              | Lora             | Card descriptions, fine-print                             |
| `{typography.ui}`      | 14px   | 500    | 1.5         | 0              | Be Vietnam Pro   | Button labels, chip text, nav items                       |
| `{typography.label}`   | 12px   | 600    | 1.5         | 0.14em         | Be Vietnam Pro   | ALL-CAPS kickers, field labels (`NGÂN SÁCH`, `TIMELINE`)  |
| `{typography.caption}` | 12px   | 400    | 1.5         | 0              | Be Vietnam Pro   | Sub-labels, footnotes                                     |
| `{typography.button}`  | 14px   | 600    | 1.0         | 0              | Be Vietnam Pro   | Button labels                                             |
| `{typography.num}`     | varies | 600    | —           | -0.02em        | Be Vietnam Pro   | Monetary amounts — tabular-nums; `500tr`, `340.000.000 ₫` |

### Italic usage

Playfair Display italic is used expressively for emotional accents in display and hero
copy — _"trăm năm hạnh phúc"_, _"ngày trọng đại"_ — and for vendor/venue names in
descriptive cards. Italic Lora is used for AI assistant messages that carry a reflective
or culturally advisory tone.

### Vietnamese writing rules

- Sentence case for all readable copy (never Title Case Everywhere).
- Full diacritics mandatory: **à á ả ã ạ, ê ế ề, ơ ớ ờ, ư ứ ừ, đ** — must render correctly.
- ALL-CAPS with `{typography.label}` tracking (0.14em) only for short UI labels: `NGÂN SÁCH`,
  `TIMELINE`, `ĐỊA ĐIỂM`.
- Monetary: `500tr` (informal), `500.000.000 ₫` (formal). Tabular figures always.
- Dates: `12 · 12 · 2026` or `ngày 12 tháng 12 năm 2026`.

---

## Layout

### Spacing System

Base unit: **4px**. Spacing tokens multiply in steps:

| Token          | Value | Common Use                              |
| -------------- | ----- | --------------------------------------- |
| `{spacing.1}`  | 4px   | Icon gaps, inner badge padding          |
| `{spacing.2}`  | 8px   | Chip internal spacing                   |
| `{spacing.3}`  | 12px  | Card sub-row gaps                       |
| `{spacing.4}`  | 16px  | Default field gap, list row padding     |
| `{spacing.5}`  | 20px  | Card padding (compact)                  |
| `{spacing.6}`  | 24px  | Card padding (default), section sub-gap |
| `{spacing.8}`  | 32px  | Section inner vertical spacing          |
| `{spacing.10}` | 40px  | Large card padding, dialog padding      |
| `{spacing.12}` | 48px  | Section top/bottom padding              |
| `{spacing.16}` | 64px  | Page section rhythm (desktop)           |
| `{spacing.20}` | 80px  | Hero top/bottom padding                 |

### Grid & Container

- **Max content width:** 1200px centered.
- **Chat surface:** single-column, max ~760px, centered. Generous left/right breathing room.
- **Dashboard grid:** 12-column; summary cards 3-up or 4-up at desktop, 2-up at tablet, 1-up at mobile.
- **Vendor/venue lists:** 2-up card grid at desktop, 1-up at mobile.
- **Hero:** full-width ivory band, centered typographic stack, no 50/50 split.

### Whitespace Philosophy

Generous, airy whitespace is a design element, not an absence. Content columns
are deliberately narrow. Cards breathe inside with `{spacing.6}` (24px) minimum
padding. Section bands at desktop use `{spacing.16}` (64px) between them. The
"premium romantic" register requires space — density reads as budget, not luxury.

---

## Elevation & Depth

| Level         | Treatment                   | Tokens                                    | Use                                            |
| ------------- | --------------------------- | ----------------------------------------- | ---------------------------------------------- |
| Flat          | No shadow, no border        | —                                         | Page background bands                          |
| Hairline      | 1px warm border only        | `{colors.line-100}` / `{colors.line-200}` | Inputs, chip outline, flat card variant        |
| Soft raised   | Shadow xs + hairline border | `{shadows.xs}`, `{colors.line-100}`       | Inner inset panels, secondary cards            |
| Card          | Shadow md + hairline        | `{shadows.md}`, `{colors.line-100}`       | Standard budget cards, vendor cards            |
| Elevated card | Shadow lg                   | `{shadows.lg}`                            | Modals, dialogs, floating menus                |
| Gold glow     | Shadow gold                 | `{shadows.gold}`                          | Gold-accent cards, `button-gold`               |
| Rose glow     | Shadow rose                 | `{shadows.rose}`                          | `button-primary`, primary highlighted sections |

### Philosophy

Depth comes from warm-tinted shadows (brown-rose alpha: `rgba(80,50,40,…)`) — never
harsh pure-black. The card surface (`{colors.card}` — #FFFDFB) is lighter than the
paper canvas (`{colors.paper}` — #FCF8F3), so cards float naturally even before shadow.
Shadow and surface contrast work together; neither carries the full load alone.

### The Thread Motif (Decorative Depth)

The single most distinctive system element: a hairline arc in `{colors.primary}` (#A83246),
sometimes doubled with a blush-200 echo below it, sometimes punctuated by a single
`{colors.accent}` (gold) dot. Applied:

- Below h2/h3 display headlines as a section underscore.
- As a horizontal section divider between major content bands.
- Tracing the left spine of a vertical timeline.
- As the progress-indicator fill line inside budget trackers.
  The thread must be **thin** (1–1.5px stroke) and **curved or gently diagonal** — never
  straight across like a rule. Its curvature references the physical act of tying a thread.

---

## Shapes

### Border Radius Scale

| Token            | Value | Use                                                  |
| ---------------- | ----- | ---------------------------------------------------- |
| `{rounded.xs}`   | 4px   | Micro elements: progress bar inner, tag accents      |
| `{rounded.sm}`   | 8px   | Small inline elements                                |
| `{rounded.md}`   | 12px  | Text inputs, textarea, small cards, modals on mobile |
| `{rounded.lg}`   | 18px  | Standard cards (budget, vendor, feature)             |
| `{rounded.xl}`   | 26px  | Large featured cards, hero media frames              |
| `{rounded.pill}` | 999px | All buttons, all chips and badges, avatar frames     |

### Imagery

- Warm, golden-hour Vietnamese wedding photography: áo dài reds, peony pinks, gold,
  greenery. Warm white balance, gentle contrast. Never cold or clinical.
- Photos sit in `{rounded.lg}` or `{rounded.xl}` frames with a 1px `{colors.line-200}` hairline.
- Placeholder image areas use a soft `linear-gradient(135deg, {colors.blush-200}, {colors.blush-100})`
  fill with an italic Playfair Display label describing the expected content.
- **No SVG illustration** is hand-drawn as UI decoration — the thread motif is the only
  bespoke mark. Do not add abstract swirls, flowers, or ornamental patterns in code.

---

## Components

### Buttons

**`button-primary`** — The signature Son CTA. Background `{colors.primary}` (#A83246),
text `{colors.on-primary}` (warm cream white), type `{typography.button}` (Be Vietnam Pro
14px / 600), `{rounded.pill}`, padding 11px × 22px, `{shadows.rose}` glow. Primary actions:
_"Bắt đầu lập kế hoạch"_, _"Gửi"_, _"Xác nhận"_.  
Hover: `{colors.primary-hover}` (#8E2639). Scale down ~0.98 on press.

**`button-secondary`** — Ghost outline in rose. Background transparent, text
`{colors.primary-hover}`, 1px `{colors.blush-300}` border, same pill shape and padding.
Hover: `{colors.primary-soft}` fill. Use for secondary actions: _"Xem ví dụ"_, _"Lưu nháp"_.

**`button-ghost`** — Neutral ghost. Background transparent, text `{colors.ink-700}`. Hover:
`{colors.sand}` fill. Use for tertiary / cancel: _"Bỏ qua"_, _"Đóng"_.

**`button-gold`** — Premium confirmation. Background `{colors.accent}` (#C2A15B), text
`#3a2c0c` (deep gold ink), `{shadows.gold}`. Reserved for high-ceremony moments: _"Chốt
phương án"_, _"Xác nhận ngày cưới"_. Use sparingly — once per major flow step at most.

**`button-primary-disabled`** — Background `{colors.line-100}`, text `{colors.ink-300}`,
no shadow, cursor not-allowed.

**`button-sm`** — Smaller variant (padding 7px × 14px, font-size 12.5px) for compact
surfaces: chat-bar Send button, inline list actions.

### Cards

**`card-budget`** — The budget overview card. `{colors.card}` background, `{rounded.lg}`,
`{shadows.md}`, 1px `{colors.line-100}` border. Internal structure: gold kicker label
(`NGÂN SÁCH`) + status badge on the top row; Playfair h3 title; Lora body description;
rose progress bar; foot row with spent amount in `{typography.num}`. Max width ~280px in a
3-up grid.

**`card-vendor`** — Vendor / venue card. Same base as `card-budget`. Top area is a
placeholder image frame (96px tall, `{rounded.md}`, blush gradient fill with italic
Playfair name). Below: Playfair h3 vendor name; Lora body description (service type · city
· style tags); foot row with gold star rating (`★★★★★` in `{colors.accent}`) and price
range in `{typography.num}`.

**`card-gold`** — Premium or featured card. Same base but border replaced with 1px
`{colors.accent-light}` and `{shadows.gold}` instead of `{shadows.md}`. Used for
auspicious-date picks, premium venue highlights, or the "recommended" planner package.

### Chat Interface

The core conversational product. `{colors.paper}` background for the full surface.
Messages in `{typography.body}` (Lora 16px). AI messages in a `{colors.card}` bubble
with `{rounded.lg}` corners and soft `{shadows.xs}`; user messages in a
`{colors.primary-soft}` (#FBEDEF) bubble with `{rounded.lg}`. The chat input bar sits
fixed at the bottom with `{colors.card}` background, `{shadows.sm}` upward, a
full-width textarea in `{rounded.md}`, and a `{component.button-primary}` (sm) Send
button inside.

AI greeting / onboarding messages use Lora italic lead size for the first sentence —
_"Xin chào! Mình là Tơ Hồng…"_ — before switching to body weight.

### Inputs & Forms

**`text-input`** — `{colors.card}` background, 1px `{colors.line-200}` border,
`{rounded.md}`, 11px × 14px padding, Lora 15px body. Labels in `{typography.label}` (Be
Vietnam Pro 12px / 600 / 0.14em tracking / uppercase) above the field. Placeholder text
in `{colors.ink-300}`.

**`text-input-focus`** — `{colors.primary}` border + 3px rose ring (`{colors.focus-ring}`).

**`text-input-error`** — `{colors.error}` border. Hint line below in `{colors.error}` at
11.5px Be Vietnam Pro. Example: _"Vượt sức chứa hầu hết nhà hàng"_.

### Chips, Filters & Badges

**`chip-filter`** — `{colors.card}` background, 1px `{colors.line-200}` border, pill,
padding 6px × 13px, Be Vietnam Pro 12.5px / 500. Regional filter examples: _"Miền Bắc"_,
_"Miền Trung"_, _"Miền Nam"_.

**`chip-filter-active`** — Fill flips to `{colors.primary}`, border matches, text white.

**`chip-blush`** — `{colors.blush-100}` background, `{colors.primary-hover}` text. Style /
wedding-theme tags: _"Rustic"_, _"Vintage"_, _"Truyền thống"_.

**`chip-gold`** — `{colors.accent-light}` background, `{colors.accent-deep}` text,
1px `{colors.accent-light}` border. Premium tier tags: _"Sang trọng"_, _"5 sao"_.

**`badge-success`** — `{colors.success-soft}` bg, `{colors.success}` text, pill.
Status: _"● Đã chốt"_, _"● Đúng kế hoạch"_.

**`badge-warning`** — `{colors.warning-soft}` bg, `{colors.warning}` text. Status:
_"● Đang chờ"_, _"● Cần xác nhận"_.

**`badge-error`** — `{colors.error-soft}` bg, `{colors.error}` text. Status:
_"● Vượt ngân sách"_, _"● Quá hạn"_.

### Kicker Label

**`kicker`** — `{typography.label}` (Be Vietnam Pro 12px / 600 / 0.14em / uppercase) in
`{colors.accent-deep}` (gold). Placed above card titles to name the category:
`NGÂN SÁCH`, `TIMELINE`, `VENDOR`, `ĐỊA ĐIỂM`. The gold kicker + Playfair serif title
stacking is one of the most recognizable patterns in the system.

### Progress Bar

**`progress-bar`** — 7px tall, `{rounded.pill}` track. Track: `{colors.line-100}`.
Fill: `linear-gradient(90deg, {colors.primary}, {colors.primary-hover})` — a rose-to-dark-rose
ramp. Used in budget cards (% allocated) and timeline milestones (% complete).

### Navigation

Top nav on the desktop chat/dashboard surface: `{colors.paper}` background, 1px
`{colors.line-100}` bottom border. Brand wordmark (thread-heart logo + "Tơ Hồng" in
Playfair Display 500) at left. Navigation links in Be Vietnam Pro 14px / 500. Primary CTA
(`button-primary` sm) at right. Height 56–64px.

Mobile nav: bottom tab bar on `{colors.card}` background, `{shadows.sm}` upward. 4–5 tabs
with Lucide icons (20px, 1.75px stroke) + Be Vietnam Pro 11px labels. Active tab icon and
label in `{colors.primary}`.

---

## Do's and Don'ts

### Do

- Keep the canvas **warm ivory** (`{colors.paper}` — #FCF8F3). Never pure white as the page floor.
- Use **Playfair Display** for all h1–h4 and display text. Its high-contrast romantic
  character is the brand's voice; replacing it with a sans-serif makes Tơ Hồng generic.
- Reserve **Son** (`{colors.primary}`) for primary buttons, the logo, and the thread motif.
  Don't apply it as a decorative tint on every surface.
- Use **Kim** (`{colors.accent}` gold) only as ink / hairline / small fill. Never paint
  large areas gold.
- Apply the **thread motif** as a hairline curve (1–1.5px, Son colour). Keep it thin,
  curved, single-stroke. Do not thicken it into a decorative stripe.
- Make all buttons **pill-shaped** (`{rounded.pill}`). The pill is the system's signature.
- Write all UI copy **Vietnamese-first**. English as a quiet secondary layer only.
- Render **full Vietnamese diacritics** correctly everywhere (à á ả ã ạ etc.).
- Display monetary amounts in **tabular figures** with `{typography.num}`. Use the `tr`
  shorthand informally, full ₫ formally.
- Keep shadows **warm** (brown-rose alpha). Never `rgba(0,0,0,…)`.

### Don't

- Don't use **cool greys** or **blue-white** anywhere in the system. The entire palette is warm.
- Don't **bold Playfair Display** at display sizes (weight 700 reads as heavy and
  bridal-magazine clichéd). Weight 600 is the maximum for headings.
- Don't use **Kim (gold) as a large fill**. Gold background bands, gold hero sections,
  or gold cards are off-brand. Gold is a detail colour.
- Don't **over-apply Son**. Tinting every surface pink makes the palette cloying. The
  ivory paper absorbs the rose accents; if everything is tinted, nothing stands out.
- Don't draw **decorative SVG flowers, swirls, or ornamental patterns** in code. The
  thread motif is the only bespoke mark; additional illustration belongs in actual image
  assets.
- Don't use **aggressive gradients**. The only gradient in the system is the whisper-soft
  rose progress-bar fill and the blush placeholder frame. Full-screen gradient backgrounds
  are forbidden.
- Don't use **emoji in data-dense UI**, dashboards, or formal status labels. Emoji are
  welcome in conversational / marketing surfaces only (💒 💕), and only sparingly.
- Don't add **bounce or spring animations**. All motion is calm: 150–240ms ease/ease-out,
  subtle upward drift on enter, never elastic overshoot.
- Don't use **Title Case** for Vietnamese copy. Sentence case throughout.
- Don't substitute **Be Vietnam Pro** for display text or Playfair for data labels. The
  family roles are strict.

---

## Responsive Behavior

### Breakpoints

| Name    | Width       | Key Changes                                                                                                                                       |
| ------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| Mobile  | < 640px     | Bottom tab nav replaces top nav; single-column card grid; hero type scales to h1 46→28px; chat input pinned to bottom; side panels become drawers |
| Tablet  | 640–1024px  | Top nav retains wordmark + CTA only; card grid 2-up; dashboard sidebar collapses to icon rail                                                     |
| Desktop | 1024–1440px | Full top nav; 3-up or 4-up dashboard cards; chat + sidebar side-by-side                                                                           |
| Wide    | > 1440px    | Content capped at 1200px max-width; outer breathing room increases                                                                                |

### Touch Targets

- `{component.button-primary}` minimum 44 × 44px on mobile.
- `{component.chip-filter}` minimum 36px height; 44px touch target via padding.
- Bottom tab bar icons: 44px touch target minimum.
- Text inputs: minimum 48px tall on mobile.
- Entire vendor card is a tappable target on mobile — effective tap area well above 44px.

### Collapsing Strategy

- Dashboard collapses 4-up → 2-up → 1-up; card widths grow to fill; do not shrink cards below
  their natural padding.
- Chat input bar stays full-width and fixed at the bottom on all breakpoints.
- The thread motif divider renders at all breakpoints; it simply shortens proportionally.
- Monetary figures never wrap (use `white-space: nowrap` on `{typography.num}` elements).
- Long Vietnamese text in cards clips with an ellipsis rather than overflowing or shrinking font.

### Vietnamese Text Considerations

- Always test with full-diacritic Vietnamese strings — they render taller than Latin at the same
  font-size (ascender + diacritic stacking). Line-height `{leading-relaxed}` (1.7) is non-negotiable
  for body text.
- Be Vietnam Pro was chosen precisely because its diacritic spacing is balanced; do not
  replace it with a font that clips stacked marks.
- Tabular figures in `{typography.num}` prevent monetary amounts from reflowing when digits change.

---

## Agent Prompt Guide

### Quick colour reference

```
Primary (Son / lacquer rose):  #A83246
Accent (Kim / antique gold):   #C2A15B
Canvas (paper ivory):          #FCF8F3
Card surface:                  #FFFDFB
Ink (primary text):            #2B2420
Blush soft fill:               #F8E1DF
```

### Font imports (paste into `<head>`)

```html
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link
  href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500;1,600&family=Lora:ital,wght@0,400;0,500;0,600;1,400;1,500&family=Be+Vietnam+Pro:wght@300;400;500;600;700&display=swap"
  rel="stylesheet"
/>
```

### Lucide icons

```html
<script src="https://unpkg.com/lucide@latest"></script>
<!-- usage: <i data-lucide="heart"></i> then lucide.createIcons() -->
```

### Ready-to-use prompts

**Budget card:**

> "Build a budget overview card. Ivory card surface (#FFFDFB), 18px border radius, warm
> box-shadow. Gold ALL-CAPS kicker `NGÂN SÁCH` above a Playfair Display h3. Rose progress
> bar (7px, pill, #A83246 gradient). Footer row: muted label left, tabular amount right
> (`340.000.000 ₫`). Status badge pill: sage green (`#5E8C6A`) background, `Đã chốt`."

**Primary button:**

> "Pill button (border-radius 999px). Background #A83246. Text #FFF7F0. Be Vietnam Pro
> 14px/600. Padding 11px 22px. Box-shadow: `0 8px 24px rgba(168,50,70,0.18)`.
> Hover state: #8E2639."

**Chat bubble (AI):**

> "Rounded card bubble (border-radius 18px) on ivory paper (#FCF8F3). Bubble background
> #FFFDFB. Lora 16px / line-height 1.7. Thread-motif hairline arc (#A83246, 1px, curved)
> above the bubble as the brand divider."

**Section header with thread motif:**

> "Playfair Display h2 (36px/600) in #2B2420. Beneath the heading, a single hairline
> curved arc in #A83246 (1px stroke, gently arcing left-to-right), followed by a 1px
> solid warm-divider line in #E4D6C3. Generous 64px top padding above, 32px below."

**Vendor card:**

> "Card on sand (#F6EEE4) background. White card surface (#FFFDFB), 18px radius,
> warm shadow. Image placeholder: 96px tall, border-radius 12px, gradient
> `linear-gradient(135deg, #F0C7C7, #F8E1DF)` with italic Playfair label naming
> the vendor type. Below: Playfair h3 vendor name. Lora 13.5px description. Footer:
> gold stars `★★★★★` (#C2A15B), price range in tabular figures."

### Design vocabulary to use in prompts

- _"Ivory paper canvas"_ → `#FCF8F3` background
- _"Tơ hồng thread motif"_ → hairline rose arc below headlines
- _"Son red / lacquer rose"_ → the primary `#A83246`
- _"Kim gold"_ → the accent `#C2A15B` (kickers, stars, premium states)
- _"Đào blush"_ → soft pink fills `#F8E1DF`–`#E5A9AC`
- _"Warm ink"_ → primary text `#2B2420`
- _"Pill button"_ → border-radius 999px, always
- _"Rose glow"_ → `box-shadow: 0 8px 24px rgba(168,50,70,0.18)`
- _"Gold glow"_ → `box-shadow: 0 6px 20px rgba(168,133,63,0.22)`

---

## Known Gaps

- **Proprietary fonts:** The three chosen fonts (Playfair Display, Lora, Be Vietnam Pro)
  are Google Fonts proposals, not extracted from an existing brand. If the product ships
  its own typefaces, replace them.
- **Logo asset:** The thread-heart mark (`assets/logo-mark.svg`) is a newly designed
  placeholder — not traced from an existing brand identity.
- **Animation timings:** Calm 150–240ms `ease`/`ease-out` transitions are specified
  directionally but exact keyframe animation specs (thread-draw SVG animation, chat
  message fade-in, etc.) are not formalized here.
- **Dark mode:** Not specified. The system is light-only (warm ivory canvas). A dark
  mode variant — likely deep warm-brown surfaces with rose and gold accents — would need
  a separate design pass.
- **Map / calendar components:** The product includes an auspicious-date picker and
  possible venue-map surfaces. Component tokens for those are not extracted here.
- **The tơ hồng motif SVG:** The exact SVG path for the hairline arc is in
  `preview/thread-motif.html`. The token `--thread: var(--son-500)` names the colour;
  the geometry should be taken from that reference file.
