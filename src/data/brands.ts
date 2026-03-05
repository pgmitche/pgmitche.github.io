// =============================================================================
// Company brand configuration.
// Add a company here to give it a custom accent colour and logo on the timeline.
// =============================================================================

/**
 * Accent colour shown on the active card border and dither feFlood.
 * Values are CSS colour strings (hex, rgb, etc.).
 */
export const COMPANY_COLORS: Record<string, string> = {
  "Fleet Space Technologies":              "#e0e0e0",  // neutral white
  "Buf Technologies":                      "#0E5DF5",  // Buf brand blue
  "Commonwealth Bank of Australia":        "#FFCC00",  // CBA diamond yellow
  "ANZ Bank, ANZ Plus":                    "#0572E6",  // ANZ brand blue
  "DisplaySweet":                          "#e0e0e0",  // neutral white
};

/**
 * Logo image path served from public/logos/.
 * Use SVG where possible for crisp rendering at any DPI.
 */
export const COMPANY_LOGOS: Record<string, string> = {
  "Fleet Space Technologies":              "/logos/fleetspace.svg",
  "Buf Technologies":                      "/logos/buf-icon.svg",
  "Commonwealth Bank of Australia":        "/logos/commbank.svg",
  "ANZ Bank, ANZ Plus":                    "/logos/anz-plus.svg",
  "DisplaySweet":                          "/logos/displaysweet.svg",
};

/**
 * Companies whose logos are dark-coloured and need a light container background.
 * Adds the `.tl-logo--light-bg` modifier class to the logo wrapper.
 */
export const LOGO_NEEDS_LIGHT_BG = new Set<string>([
  // no entries — kept for future use
]);

/**
 * Companies whose SVG logos have black fills on a transparent background.
 * Adds `filter: invert(1)` so the marks appear white against the dark card.
 */
export const LOGO_NEEDS_INVERT = new Set([
  "DisplaySweet",
]);

/**
 * Companies whose logo PNGs have a solid black background.
 * Adds `mix-blend-mode: screen` so only the light logo mark shows through
 * against the dark card surface, effectively removing the black fill.
 */
export const LOGO_USES_SCREEN_BLEND = new Set([
  "Fleet Space Technologies",
]);

/**
 * Display type for each company logo.
 * - "icon"     → square container (default)
 * - "wordmark" → wide, short container with extra card padding
 *
 * Unlisted companies default to "icon".
 */
export const LOGO_TYPE: Record<string, "icon" | "wordmark"> = {
  "DisplaySweet": "wordmark",
};
