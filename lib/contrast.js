/**
 * WCAG relative luminance and contrast. onColor picks black or white,
 * whichever contrasts more with the background. Palette pairs are the
 * hierarchy tokens in app/globals.css.
 */

export const PALETTE = {
  purpleDark: { hex: "#7c3aed", on: "#ffffff", role: "level-1 headers and badges" },
  purpleMuted: { hex: "#b691f5", on: "#000000", role: "nested headers" },
  purpleTint: { hex: "#ebe1fc", on: "#000000", role: "list stripes" },
  greenDark: { hex: "#16717a", on: "#ffffff", role: "level-1 headers and badges" },
  greenMuted: { hex: "#7dafb5", on: "#000000", role: "nested headers" },
  greenTint: { hex: "#e4f1f2", on: "#000000", role: "list stripes and Edit buttons" },
  red: { hex: "#dc2626", on: "#ffffff", role: "Delete buttons" },
};

function channel(hex, start) {
  const value = parseInt(hex.slice(start, start + 2), 16) / 255;
  return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
}

export function relativeLuminance(hex) {
  const normalized = hex.trim().toLowerCase();
  return (
    0.2126 * channel(normalized, 1) +
    0.7152 * channel(normalized, 3) +
    0.0722 * channel(normalized, 5)
  );
}

export function contrastRatio(foreground, background) {
  const lighter = Math.max(
    relativeLuminance(foreground),
    relativeLuminance(background)
  );
  const darker = Math.min(
    relativeLuminance(foreground),
    relativeLuminance(background)
  );
  return (lighter + 0.05) / (darker + 0.05);
}

/** Black or white, whichever has the higher contrast on `background`. */
export function onColor(background) {
  const white = contrastRatio("#ffffff", background);
  const black = contrastRatio("#000000", background);
  return white >= black ? "#ffffff" : "#000000";
}
