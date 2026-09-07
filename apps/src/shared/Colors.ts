/**
 * Legacy palette — re-pointed to the "Living Standard" design system
 * (DESIGN.md v2026.1, audited from the production site akaiunsan.prismate.vn).
 * Keys are unchanged so all existing consumers keep working; only values moved.
 *
 * Computed contrast (WCAG 2.1):
 * - white on main_color #4F601A   6.95:1 (AA)   — buttons keep white text
 * - main_color on white           6.95:1 (AA)   — safe as text too
 * - black_text #20251B on paper   14.72:1 (AAA)
 * - gray_normal_text on paper      5.18:1 (AA)
 *
 * New work should use the semantic tokens in ./theme.ts (accent = Hi-Vis
 * Lime #C7DC50 with ink text, leaf-radius geometry, olive-tinted shadows).
 */
export default {
  /** Primary brand action color — Olive Dark (was Akaiunsan orange) */
  main_color: "#4F601A",
  /** Secondary text — Sage Muted */
  gray: "#666B5A",
  /** Screen canvas — Warm Paper */
  background: "#F9F8F3",
  /** Raised surfaces — Surface White */
  white: "#FFFFFF",
  /** Deep anchor for headings/inverse panels — Moss Deep */
  main_blue: "#1B2512",
  /** Links — Olive Dark */
  blue_link: "#4F601A",
  /** Secondary accent for icons and marks — Working Olive */
  main_orange: "#6C7D22",
  /** 15% wash of main_orange */
  main_orange_light: "rgba(108, 125, 34, 0.15)",
  /** Attention accent (spinners, chevrons, month titles) — Working Olive */
  grab_orange: "#6C7D22",
  /** Placeholder / disabled text — Sage Muted at 55% */
  gray_hidden_text: "rgba(102, 107, 90, 0.55)",
  /** Secondary body text — Sage Muted */
  gray_normal_text: "#666B5A",
  /** Primary text — Olive Ink (design law: never pure black) */
  black_text: "#20251B",
  /** Neutral fills, dividers, skeleton base — Stone */
  gray_light: "#F0EEE5",
  /** Text and shadowColor — Olive Ink; makes all shadows olive-tinted by law */
  black: "#20251B",
  /** Errors and destructive actions only — Signal Red */
  red: "#D0202B",
  /** Star ratings / warning utility (retained, out-of-system) */
  yellow: "#FCB813",
  /** Success — Olive Dark */
  green: "#4F601A",
  /** Soft highlight wash — Mint Strong tint */
  pinky: "rgba(224, 232, 197, 0.5)",
};
