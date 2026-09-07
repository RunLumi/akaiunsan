/**
 * "Living Standard" semantic design tokens — the go-forward theme.
 * Source of truth: /DESIGN.md (v2026.1). Core palette audited from the
 * production marketing site; ramps derived in OKLCH, contrast computed.
 *
 * Layers: core (raw values) → semantic (intent names). Components should
 * consume the semantic layer only, so a future dark mode is a re-point.
 * Note: accent (#C7DC50 Hi-Vis Lime) is a SURFACE — text on it is always
 * accentContrast (ink). Lime is never a text color on light backgrounds.
 */

export const core = {
  // canvas & surfaces
  paper: "#F9F8F3",
  white: "#FFFFFF",
  mint: "#F0F2E4",
  mintStrong: "#E0E8C5",
  stone: "#F0EEE5",
  stoneDark: "#D7D2C2",
  mossDeep: "#1B2512",
  mossBlack: "#12190D",

  // ink
  ink: "#20251B",
  muted: "#666B5A",
  line: "#DCDECD",

  // the single accent family (hue 117, OKLCH-calibrated)
  lime: "#C7DC50",
  limeSoft: "#DCE7A2",
  limePale: "#D8E69A",
  limeRamp: {
    50: "#F2FAD8",
    100: "#E5ECCB",
    200: "#D6E39F",
    300: "#CADD62",
    400: "#B4C734",
    500: "#9BAD12",
    700: "#5F6B01",
    900: "#292F06",
  },

  // structure greens (hue ~130)
  olive: "#6C7D22",
  leaf: "#A9BF3C",
  oliveDark: "#4F601A",
  mossRamp: {
    50: "#EFF6E8",
    100: "#E0EDD5",
    300: "#A9C192",
    500: "#607C42",
    700: "#2D4214",
    900: "#0A1600",
  },

  // semantic status
  signal: "#D0202B",
  signalDark: "#B71923",
} as const;

export const colors = {
  surface: core.paper,
  surfaceRaised: core.white,
  surfaceTint: core.mint,
  textPrimary: core.ink,
  textSecondary: core.muted,
  line: core.line,

  accent: core.lime, // Hi-Vis Lime — one accent only
  accentContrast: core.ink, // ink on lime: 10.27:1 (AAA)
  accentSoft: core.limeSoft,
  focusRing: core.oliveDark,

  success: core.oliveDark,
  warning: "#FCB813", // out-of-system utility (star ratings, warnings)
  danger: core.signal,
} as const;

/** Leaf-corner geometry (DESIGN.md §4.1) — per-corner radii in px. */
export const radius = {
  card: 24,
  input: 12,
  pill: 999,
  leaf: {
    lg: { top: 24, right: 120, bottom: 24, left: 24 },
    md: { top: 20, right: 70, bottom: 20, left: 20 },
    sm: { top: 70, right: 18, bottom: 18, left: 18 },
  },
} as const;

/** Production motion tokens, in ms, plus the shared decelerate curve. */
export const motion = {
  fast: 280,
  standard: 560,
  slow: 820,
  easing: "cubic-bezier(0.2, 0.72, 0.2, 1)",
  spring: { stiffness: 170, damping: 22, mass: 1 },
} as const;

/** Olive-tinted elevation (DESIGN.md §4.4) — never gray, never pure black. */
export const shadow = {
  float: {
    shadowColor: "#252F16",
    shadowOpacity: 0.11,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: 18 },
    elevation: 6,
  },
  lift: {
    shadowColor: "#252F16",
    shadowOpacity: 0.1,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

const LivingStandard = { core, colors, radius, motion, shadow, spacing };
export default LivingStandard;
