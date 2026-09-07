# AKAIUNSAN Design System — “Living Standard”

> **Version 2026.1** · Single source of truth for web, mobile (`apps/`), and admin surfaces.
> Core palette audited verbatim from the production CSS of [akaiunsan.prismate.vn](https://akaiunsan.prismate.vn/en); ramps, dark theme, and motion specs are the 2026 upgrade layer.
> All contrast ratios in this document are computed (WCAG 2.1 relative luminance), not estimated.

---

## 1. Visual Theme & Atmosphere

**“Living Standard”** — the intersection of two worlds that shouldn't touch but do: **hi-vis industrial precision** (safety-vest lime, survey numbers, operational rigor) and **botanical calm** (warm paper, olive ink, leaf-corner geometry). It reads like a beautifully printed field manual for a crew that actually shows up.

The atmosphere is **warm-professional, not corporate-cold**. White space does the talking; one electric-lime accent works like a highlighter pen in a well-kept notebook — used to mark what matters, never to decorate everything.

| Dial | Setting | Meaning |
|---|---|---|
| Density | **4 / 10** | Daily-app balanced. Generous air, editorial pacing. |
| Variance | **7 / 10** | Offset-asymmetric layouts, broken-grid moments, oversized ghost numerals. |
| Motion | **7 / 10** | Scroll-choreographed and pointer-reactive, but physical — weighty, never bouncy-toy. |

**One-sentence test for any screen:** *Could this page be printed as a premium standard-operating-procedure document and still feel intentional?* If yes, ship it.

---

## 2. Color Palette & Roles

### 2.1 Core brand colors (audited from production)

| Token | Name | Hex | OKLCH | Role |
|---|---|---|---|---|
| `paper` | **Warm Paper** | `#f9f8f3` | `oklch(0.979 0.007 97.4)` | Primary canvas. Every light page starts here — never raw `#fff` backgrounds for full pages. |
| `white` | **Surface White** | `#ffffff` | `oklch(1.000 0.000 89.9)` | Raised cards, sheets, inputs sitting on Paper. |
| `ink` | **Olive Ink** | `#20251b` | `oklch(0.256 0.020 129.4)` | All primary text and iconography on light surfaces. This is our black. |
| `muted` | **Sage Muted** | `#666b5a` | `oklch(0.518 0.027 120.7)` | Secondary text, captions, metadata, inactive icons. |
| `border` | **Sage Line** | `#dcdecd` | `oklch(0.894 0.023 112.3)` | 1px hairlines, dividers, input outlines. |
| `lime` | **Hi-Vis Lime** | `#c7dc50` | `oklch(0.853 0.164 117.3)` | **The singular accent.** Primary CTAs, active states, focus rings, highlights. |
| `lime-soft` | **Lime Soft** | `#dce7a2` | `oklch(0.903 0.090 115.6)` | Hover/pressed states on lime, soft badges, lime tints on dark. |
| `lime-pale` | **Lime Pale** | `#d8e69a` | `oklch(0.897 0.099 116.9)` | Alternate lime tint, chart fills. |
| `mint` | **Mint Tint** | `#f0f2e4` | `oklch(0.956 0.019 113.3)` | Section alternation on light pages — the “second page color.” |
| `mint-strong` | **Mint Strong** | `#e0e8c5` | `oklch(0.916 0.047 117.8)` | Tinted callouts, tag backgrounds, selected rows. |
| `olive` | **Working Olive** | `#6c7d22` | `oklch(0.558 0.116 119.6)` | Mid-tone brand green: links-on-light, icon accents, small labels. |
| `leaf` | **Leaf** | `#a9bf3c` | `oklch(0.764 0.155 118.5)` | Bridge between lime and olive; chart series, decorative marks. |
| `olive-dark` | **Olive Dark** | `#4f601a` | `oklch(0.460 0.096 122.1)` | Accessible green text on light (6.54:1 on Paper), strong links. |
| `moss-deep` | **Moss Deep** | `#1b2512` | `oklch(0.249 0.037 131.2)` | Dark surfaces: footer, dark sections, inverse panels. |
| `moss-black` | **Moss Black** | `#12190d` | `oklch(0.202 0.025 132.9)` | Deepest surface; dark-theme canvas. Also our scrims — **never pure black.** |
| `stone` | **Stone** | `#f0eee5` | `oklch(0.948 0.012 96.4)` | Neutral-warm surface for imagery, dividers on dark, skeleton base. |
| `stone-dark` | **Stone Dark** | `#d7d2c2` | `oklch(0.863 0.022 92.5)` | Warm neutral borders on stone, disabled fills. |
| `signal` | **Signal Red** | `#d0202b` / `#b71923` | `oklch(0.552 0.207 25.1)` | Errors and destructive actions **only**. Never decorative. |

Utility-only (never part of the brand voice): `link-blue #2a86ff` (external links), `facebook #1877f2`, Zalo blue. Third-party brand colors live inside their icons and nowhere else.

**Accent discipline:** There is exactly **one** accent — Hi-Vis Lime. Greens (`olive`, `leaf`, `olive-dark`) are *structure*, not accent; they carry hierarchy, not attention. If a screen needs a second accent color, the screen is wrong.

### 2.2 The 2026 upgrade — perceptual ramps

Define color in **OKLCH** (perceptually uniform: equal steps *look* equal, alpha/lightness manipulation is predictable, dark-mode derivation is math not guesswork). Two ramps cover every state, chart, and tint the product will ever need:

**Lime ramp** — hue 117°, the accent family:

| Step | Hex | OKLCH | Typical use |
|---|---|---|---|
| `lime-50` | `#f2fad8` | `oklch(0.97 0.045 117)` | Subtle highlight wash |
| `lime-100` | `#e5eccb` | `oklch(0.93 0.045 117)` | Tinted card on Mint |
| `lime-200` | `#d6e39f` | `oklch(0.89 0.09 117)` | Hover on lime-soft |
| `lime-300` | `#cadd62` | `oklch(0.86 0.15 117)` | **≈ brand Lime — primary CTA** |
| `lime-400` | `#b4c734` | `oklch(0.79 0.165 117)` | Pressed primary CTA, hover shift |
| `lime-500` | `#9bad12` | `oklch(0.71 0.16 117)` | Deep lime fills, chart emphasis — never text on light (2.36:1 on Paper) |
| `lime-700` | `#5f6b01` | `oklch(0.50 0.115 117)` | Deep lime for charts, tags, pressed states on dark |
| `lime-900` | `#292f06` | `oklch(0.29 0.06 117)` | Lime-shadowed dark surface |

**Moss ramp** — hue 130°, the structure family:

| Step | Hex | OKLCH | Typical use |
|---|---|---|---|
| `moss-50` | `#eff6e8` | `oklch(0.965 0.02 130)` | Faintest green wash |
| `moss-100` | `#e0edd5` | `oklch(0.93 0.035 130)` | Tinted surfaces |
| `moss-300` | `#a9c192` | `oklch(0.78 0.07 130)` | Borders on mint |
| `moss-500` | `#607c42` | `oklch(0.55 0.09 130)` | Icons, secondary brand marks |
| `moss-700` | `#2d4214` | `oklch(0.35 0.075 130)` | Dark panel alt |
| `moss-800` | `#1a2906` | `oklch(0.26 0.06 130)` | ≈ Moss Deep — dark surfaces |
| `moss-950` | `#030a00` | `oklch(0.13 0.04 130)` | ≈ Moss Black — scrims, dark canvas |

### 2.3 Adaptive theming — “Deep Moss” dark mode

2026 practice: **theme switching re-points semantic tokens only — zero component changes.** Our dark mode is not inverted gray; it is the brand's own night face, built from ramps that already exist.

| Semantic token | Light (Paper) | Dark (Deep Moss) |
|---|---|---|
| `surface` | `paper #f9f8f3` | `moss-black #12190d` |
| `surface-raised` | `white #ffffff` | `moss-deep #1b2512` |
| `surface-tint` | `mint #f0f2e4` | `moss-800 #1a2906` |
| `text-primary` | `ink #20251b` | `paper #f9f8f3` |
| `text-secondary` | `muted #666b5a` | `stone-dark #d7d2c2` |
| `line` | `border #dcdecd` | `moss-700 #2d4214` |
| `accent` | `lime #c7dc50` | `lime #c7dc50` *(unchanged — it glows naturally on moss)* |
| `accent-contrast` | `ink #20251b` | `ink #20251b` *(ink-on-lime is 10.3:1 in both themes)* |

Rules: shadows get *stronger and greener* in dark mode (`#0d1209` at higher alpha), never gray. Lime usage may increase slightly in dark mode (it reads as signal on moss) but the one-accent law holds. `prefers-color-scheme` + manual toggle both re-point the same semantic layer.

### 2.4 Contrast law (computed, WCAG 2.1)

| Pairing | Ratio | Verdict |
|---|---|---|
| Ink on Paper | **14.72:1** | AAA — default body text |
| Ink on Lime | **10.27:1** | AAA — **the** button pairing |
| White on Moss Deep | **15.91:1** | AAA — dark sections |
| Lime on Moss Deep | **10.44:1** | AAA — accent text/borders on dark |
| Lime Soft on Moss Black | **13.66:1** | AAA — dark-mode secondary accent |
| Muted on Paper | **5.18:1** | AA — secondary text |
| Olive Dark on Paper | **6.54:1** | AA/AAA(large) — green links |
| Olive Dark on Lime | **4.56:1** | AA large-text only — avoid for body |
| White on Olive `#6c7d22` | **4.57:1** | AA large-text only — avoid for body |

**Laws that follow:**
1. **Lime is a surface, never a text color on light.** Text that sits on lime is Ink. Always.
2. Lime text is legal **only on Moss Deep / Moss Black** (10.4:1). On light surfaces, no lime step works as text — even `lime-500 #9bad12` peaks at 2.36:1 on Paper. Green text on light means Olive Dark (6.54:1).
3. Muted never carries text smaller than 14px or anything a user must read to complete a task.
4. Never pure black (`#000`), never pure gray shadows. Scrims are `moss-black`; shadows are olive-tinted.

---

## 3. Typography

### 3.1 Families

| Role | Family | Weights | Why |
|---|---|---|---|
| **Display** | **Be Vietnam Pro** | 700, 800 (+600) | Geometric-humanist with *native, correct Vietnamese diacritics* — headlines in Vietnamese look right, not flattened. Confident, slightly engineered voice. |
| **Body** | **Manrope** | 400, 500, 600, 700 | Wide, calm, modern. Numerals are tabular-friendly; pairs cleanly with the display face. |
| **Mono** *(new)* | **Spline Sans Mono** | 400, 500 | Section indices (`01–08`), prices, timestamps, survey metrics, form digits. Mono for data is the 2026 dashboard standard. **ASCII/digits only** — diacritics fall back to Manrope. |

Banned: Inter, Roboto, system-ui as an identity font, generic serifs (Georgia, Times). `ui-monospace` stack is acceptable only as Spline Sans Mono's fallback.

### 3.2 Fluid scale (web)

Headlines scale with `clamp()` — audited production values, formalized:

| Token | Size | Line height | Tracking | Weight | Use |
|---|---|---|---|---|---|
| `display-hero` | `clamp(44px, 5vw, 72px)` | 1.05 | −0.02em | 800 | One per page |
| `display-1` | `clamp(40px, 4vw, 56px)` | 1.1 | −0.015em | 700 | Section titles |
| `display-2` | `clamp(31px, 3vw, 43px)` | 1.15 | −0.01em | 700 | Sub-sections, card titles (lg) |
| `title` | `clamp(22px, 2vw, 28px)` | 1.25 | 0 | 600 | Card titles, modal heads |
| `body-lg` | 18px | 1.6 | 0 | 400 | Lead paragraphs, max 65ch |
| `body` | 16px | 1.6 | 0 | 400 | Default. Never below 16 on marketing web |
| `label` | 14px | 1.4 | +0.04em | 600 | Eyebrows, form labels — often uppercase Olive Dark |
| `mono-data` | 14–16px | 1.4 | 0 | 500 | Numbers, indices, timestamps |
| `ghost-numeral` | `clamp(220px, 30vw, 520px)` | 0.8 | −0.03em | 800 | Decorative section indices at 8–12% Ink opacity, cropped by overflow — a structural element, never readable-content |

### 3.3 Type laws

1. Hierarchy is built with **weight and color first, size second** — Ink 700 beats Muted 400; don't scream with size.
2. Display lines stay ≤ 3 lines; body measure ≤ 65ch.
3. Eyebrow labels follow the production pattern: `02 — Solutions by space` — mono index, em-dash, uppercase label, Olive or Muted.
4. Vietnamese diacritics are **never** stripped or approximated — if a line looks tight with diacritics, add line-height, don't change font.
5. Kinetic type is allowed (see Motion), but the hero headline assembles once and stays legible — animation is an entrance, not a permanent condition.

---

## 4. Signature Geometry

These four moves are what make a page unmistakably AKAIUNSAN. Use at least two per major surface; use them sparingly enough that they stay special.

### 4.1 Leaf corners (asymmetric radii)
Audited from production — organic, asymmetric corner geometry evoking a leaf: one corner sweeps large while three stay modest.

| Token | Value | Use |
|---|---|---|
| `radius-leaf-lg` | `24px 120px 24px 24px` | Hero cards, feature imagery |
| `radius-leaf-md` | `20px 70px 20px 20px` | Solution cards, media frames |
| `radius-leaf-sm` | `70px 18px 18px 18px` | Small image chips, avatars-adjacent |
| `radius-card` | `18–24px` | Standard cards |
| `radius-pill` | `999px` | Buttons, tags, badges |

The sweeping corner points **away from the content flow** (top-right for left-aligned content). Never apply leaf radii to inputs or buttons — buttons stay pill, inputs stay 12px.

### 4.2 Ghost numerals
Oversized `01…08` indices in Be Vietnam Pro 800, cropped by section edges, at `ink/10%` (light) or `paper/8%` (dark). They anchor the editorial rhythm and are the monotony-breaker that replaces "three equal cards."

### 4.3 Lime highlighter
Key phrases in headings get a lime mark behind the words — a skewed rounded rectangle (`lime` at 100%, `border-radius: 6px`, inset 0.1em), like a physical highlighter stroke. **Once per page.** If everything is highlighted, nothing is.

### 4.4 Olive shadows, never gray
Production shadow, formalized:

| Token | Value | Use |
|---|---|---|
| `shadow-float` | `0 18px 60px rgba(37,47,22,0.11)` | Raised cards, sticky header on scroll |
| `shadow-lift` | `0 8px 24px rgba(37,47,22,0.10)` | Hover lift, dropdowns |
| `shadow-inner-well` | `inset 0 1px 2px rgba(18,25,13,0.08)` | Input wells |
| `shadow-dark` | `0 24px 80px rgba(13,18,9,0.5)` | Dark-theme equivalent |

Every shadow is tinted `#252f16` (light) / `#0d1209` (dark). Gray or black shadows are a defect.

---

## 5. Component Stylings

**Buttons** — Pill radius (`999px`). Primary: `lime` fill, `ink` text, weight 600, `padding 14px 28px`, **no gradient, no outer glow**. Hover: fill shifts to `lime-200`-ward (lightness +4%), shadow-lift appears. Active: tactile press — `translateY(1px)` + shadow removed. Secondary: 1px `ink` outline on transparent, ink text; hover fills `mint`. Ghost: ink text + arrow →, arrow slides 4px right on hover. Disabled: `stone-dark` fill, `muted` text, no shadow. Focus: 2px `olive-dark` offset ring (3px offset) — focus rings are always visible, never `outline: none` without replacement.

**Cards** — `radius-card`, `white` on `paper` (or `moss-deep` on dark), 1px `border`, `shadow-float` **only when elevation communicates hierarchy**. Internal padding ≥ 24px. Hover (interactive cards only): `translateY(-2px)` + shadow-lift, 200ms. Prefer **border-top dividers + ghost numerals** over card grids for content lists — cards are for genuinely parallel choices.

**Inputs** — Label **above** (label token, 600), optional helper text below in `muted` 14px, error text below in `signal` 14px with 16px icon. Field: `white`, 1px `border`, `radius: 12px`, `height: 48px`, inner-well shadow. Focus: border → `olive-dark`, 3px `lime-soft` halo. Error: border → `signal`, no shake animations. Dark sections invert: `moss-deep` field, `moss-700` border, `paper` text.

**Badges / tags** — Pill, 13px, weight 600. Status: `mint-strong` bg + `olive-dark` text (info), `lime` bg + `ink` text (active/primary), `signal/10%` bg + `signal` text (error). Priority tags (from production's service-recovery pattern): mono uppercase.

**Navigation** — Header on `paper/85%` with `backdrop-blur(12px)`, hairline `border` appears only after scroll. Active link: ink 600 + 2px lime underline-dot. Dropdowns: `white`, radius-card, shadow-lift, numbered mono indices per item (production pattern). Mobile: full-sheet menu on `paper`, 32px row rhythm, staggered entrance.

**Footer** — Always Moss Deep. `paper` text at 90%, lime reserved for the single primary CTA and hover states. Mono indices in link columns.

**Loading** — Skeletal shimmer matching exact layout dimensions: `stone` base with a `white/60%` shimmer sweep, 1.4s loop, `border-radius` inherited from the real element. **No circular spinners anywhere.** Buttons submit-state: label swaps to subtle three-dot pulse, button keeps its size.

**Empty states** — Composed mini-scenes: leaf-radius frame, ghost numeral, one line of Ink explanation + one ghost button. Never just "No data."

**FAQ / accordions** — 1px `border` rows on `paper`, plus-to-minus icon morphs 200ms, content fades + slides 8px. Question in `title` weight 600; answer in `body` `muted`.

**Images** — Always inside `radius-leaf-*` frames with 1px `border`. Photos are real operations (crews, sites, equipment) — never stock handshakes. `loading="lazy"` below fold, explicit dimensions to prevent CLS.

---

## 6. Layout Principles

1. **Grid:** 12-column, `max-width: 1400px`, gutters 24px (16px mobile). CSS Grid first — no `calc()` percentage hacks, no Flexbox math for structural layout.
2. **Hero is never centered.** Left-aligned or 7/5 asymmetric split: headline + lead + one primary CTA on the left; tabbed editorial module (production's `01–03` standard slider) on the right. One primary CTA per hero — no "Learn more" next to it.
3. **No three-equal-card rows.** Feature/solution content uses: 2-column zig-zag with alternating leaf-radius imagery, asymmetric grids (7/5, 8/4), or horizontal scroll rails with snap. The 2026 anti-template stance.
4. **Section rhythm:** vertical padding `clamp(64px, 10vw, 128px)`; alternate `paper` → `mint` → `paper`; every section gets an eyebrow (`01 — Name`) + ghost numeral. Full-height sections use `min-height: 100dvh`, never `100vh`.
5. **Broken-grid moments:** ghost numerals and lime highlighter blocks may bleed off-grid via `overflow: hidden` on the section — never cause horizontal scroll.
6. **Mobile collapse (<768px):** everything single-column; leaf radii soften (`radius-leaf-sm` becomes `24px 48px 24px 24px`); ghost numerals scale to 30vw and sit behind headlines; tap targets ≥ 44px; horizontal overflow is a shipping blocker.
7. **Spacing scale:** 4px base (`--spacing: 0.25rem`) — 4, 8, 12, 16, 24, 32, 48, 64, 96, 128. Nothing outside the scale.

---

## 7. Motion & Interaction

The production motion tokens, formalized — this easing curve is the brand's physical signature:

```css
--motion-fast:      0.28s;   /* hovers, taps, small reveals        */
--motion-standard:  0.56s;   /* section reveals, card transitions  */
--motion-slow:      0.82s;   /* hero assembly, page-level choreo   */
--motion-ease:      cubic-bezier(0.2, 0.72, 0.2, 1);  /* decelerate — weighty, lands softly */
```

1. **One ease to rule them all.** The production curve above for everything; `linear` is banned outside shimmer loops. Interactive JS springs (mobile): `stiffness 170, damping 22, mass 1` — the same personality in spring form.
2. **Scroll-driven, not scroll-hijacked.** Native CSS `animation-timeline: view()` for section reveals (fade + rise 24px + leaf-radius morph from `radius-card` to `radius-leaf-*`); `animation-timeline: scroll()` for the header hairline and progress cues. No scroll-jacking, no snap-back.
3. **Pointer-reactive hero.** Production already tracks `--hero-pointer-x/y`: the hero media module tilts ≤ 3° and its sheen follows the pointer, lerped at 0.08/frame. Subtle — felt, not seen.
4. **Staggered orchestration.** Lists, cards, and menu rows never mount instantly: 60ms cascade, `motion-standard`, max 8 items before the rest ride the scroll reveal.
5. **Perpetual micro-life (one per viewport):** the lime status-dot on "operations normal" pulses; skeleton shimmers; the marquee strip drifts. Everything else is still. A calm product is a credible product.
6. **Performance law:** animate `transform` and `opacity` exclusively — never `top/left/width/height/margin`. Blur and grain live on isolated, promoted layers only. Long JS animations run off the main thread (mobile: Reanimated worklets).
7. **`prefers-reduced-motion: reduce`:** entrances become opacity-only 120ms fades; pointer parallax, marquee, and kinetic type switch off. The page must be fully usable with zero motion.
8. **Kinetic type rule:** headline words may rise in with the stagger on entrance; after that, type is stable. perpetual per-letter motion is banned.

---

## 8. Token Architecture

Two layers only — **core** (raw values) and **semantic** (intent-named). No component-layer tokens yet; add them only when a component is reused across three surfaces. Semantic tokens describe *intent* (`surface-raised`), never appearance (`gray-100`). Theme switching re-points the semantic layer in one block — components never know which theme is active.

```css
/* Tailwind v4 @theme — single source of truth */
@theme {
  /* — core: color (audited production values + computed ramps) — */
  --color-paper:        #f9f8f3;
  --color-ink:          #20251b;
  --color-muted:        #666b5a;
  --color-line:         #dcdecd;
  --color-lime:         #c7dc50;
  --color-lime-soft:    #dce7a2;
  --color-lime-500:     #9bad12;
  --color-mint:         #f0f2e4;
  --color-mint-strong:  #e0e8c5;
  --color-olive:        #6c7d22;
  --color-olive-dark:   #4f601a;
  --color-leaf:         #a9bf3c;
  --color-moss-deep:    #1b2512;
  --color-moss-black:   #12190d;
  --color-stone:        #f0eee5;
  --color-stone-dark:   #d7d2c2;
  --color-signal:       #d0202b;
  --color-signal-dark:  #b71923;

  /* — core: type — */
  --font-display: "Be Vietnam Pro", "Manrope", sans-serif;
  --font-sans:    "Manrope", "Be Vietnam Pro", sans-serif;
  --font-mono:    "Spline Sans Mono", ui-monospace, monospace;

  /* — core: geometry — */
  --radius-card: 24px;
  --radius-leaf-lg: 24px 120px 24px 24px;
  --radius-leaf-md: 20px 70px 20px 20px;
  --radius-leaf-sm: 70px 18px 18px 18px;

  /* — core: motion — */
  --motion-fast: 0.28s;
  --motion-standard: 0.56s;
  --motion-slow: 0.82s;
  --motion-ease: cubic-bezier(0.2, 0.72, 0.2, 1);
}

/* — semantic layer: components reference ONLY these — */
:root {
  --surface: var(--color-paper);
  --surface-raised: #ffffff;
  --surface-tint: var(--color-mint);
  --text-primary: var(--color-ink);
  --text-secondary: var(--color-muted);
  --line: var(--color-line);
  --accent: var(--color-lime);
  --accent-contrast: var(--color-ink);
  --accent-soft: var(--color-lime-soft);
  --focus-ring: var(--color-olive-dark);
  --shadow-tint: rgba(37, 47, 22, 0.11);
}
@media (prefers-color-scheme: dark) {        /* and [data-theme="dark"] */
  :root {
    --surface: var(--color-moss-black);
    --surface-raised: var(--color-moss-deep);
    --surface-tint: #1a2906;
    --text-primary: var(--color-paper);
    --text-secondary: var(--color-stone-dark);
    --line: #2d4214;
    --accent: var(--color-lime);
    --accent-contrast: var(--color-ink);
    --accent-soft: rgba(199, 220, 80, 0.16);
    --focus-ring: var(--color-lime);
    --shadow-tint: rgba(13, 18, 9, 0.5);
  }
}
```

Mobile (`apps/`): the same semantic names as a typed `theme.ts` module mirroring `apps/src/shared/Colors.ts`, so web and app drift is detectable in CI. Admin: consume the same ramps via Tailwind v4 — admin inherits the system, it doesn't invent one.

---

## 9. Anti-Patterns — Banned

**AI tells (instant credibility-killers):**
- Purple/violet-blue gradients, neon glows, glassmorphism-permeation — none of it exists here
- The `Inter`-on-white with a blue `#3B82F6` button look — the single most recognizable AI-slop signature
- Three equal cards in a row; centered heroes; icon-left-title-body "feature grids"
- Emojis in UI, "Scroll to explore" fillers, bouncing chevrons, custom mouse cursors
- AI copywriting voice: "Elevate", "Seamless", "Unleash", "Next-Gen", "Empower"
- Fake numbers (`99.9% uptime`), placeholder names (`John Doe`, `Acme`), broken stock links
- Circular spinners, floating labels, shake animations, `alert()` styling

**Brand-specific violations:**
- Pure black (`#000`) or pure gray shadows — Ink and olive-tinted shadows only
- Lime as text on light backgrounds (fails the law in §2.4)
- A second accent color anywhere
- Gray/black shadows; untinted `box-shadow` defaults
- Symmetric radii where a leaf radius is specified; leaf radii on inputs/buttons
- Headlines that ignore Vietnamese diacritic space (crushed line-height)
- Centered hero sections
- Green/blue "fresh clean service" stock photography — real operations imagery only
- Dark mode as "inverted gray" — dark mode is Deep Moss, built from brand ramps

---

## Appendix — Audit provenance

- Palette, radii, motion tokens, shadow values, fluid type, pointer/scroll CSS variables: extracted from production bundle `assets/index-BjzjENuZ.css` + inline font config at `akaiunsan.prismate.vn/en` (Be Vietnam Pro, Manrope self-hosted woff2).
- OKLCH conversions, lime/moss ramps, and all WCAG ratios: computed (OKLab per Björn Ottosson; WCAG 2.1 relative luminance) — reproduce with the math, not the eye.
- 2026 grounding: Figma *Web Design Trends 2026* (typography-as-storytelling, saturated accents returning), UPDIVISION *UI Color Trends 2026* (adaptive color systems), TypeType *Typography Trends* (high-contrast sans + signature faces), Mavik Labs *Design Tokens 2026* (OKLCH + Tailwind v4 `@theme`), Zeroheight (two-layer tokens, intent naming), MD3 token model.
