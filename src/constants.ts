// =============================================================================
// Application-wide constants.
// All magic scalars live here — edit this file to tune behaviour.
// =============================================================================

// ── Carousel physics ─────────────────────────────────────────────────────────

/** Fraction of remaining distance covered per animation frame (exponential lerp).
 *  Higher = more responsive; lower = floatier. 0.20 tracks input closely while
 *  still giving a smooth deceleration on snap. */
export const CAROUSEL_LERP_FACTOR = 0.20;

/** Below this pixel delta the lerp snaps to the target to prevent jitter. */
export const CAROUSEL_SNAP_THRESHOLD_PX = 0.5;

// ── Input thresholds ─────────────────────────────────────────────────────────

/** Milliseconds of wheel silence before the track snaps to the nearest card.
 *  Accounts for macOS trackpad inertia tail-off (~150–300 ms after lift). */
export const WHEEL_SNAP_IDLE_MS = 180;

/** Minimum vertical pixel delta before a touch swipe registers as navigation. */
export const TOUCH_SWIPE_THRESHOLD_PX = 44;

// ── Dither effect ────────────────────────────────────────────────────────────

/**
 * feTurbulence seed values cycled per rAF tick to animate the noise texture.
 * Use distinct primes for visually uncorrelated frames.
 */
export const DITHER_SEEDS = [7, 19, 42, 5, 31, 13] as const;

/** Default feFlood colour before the first entry is activated. */
export const DITHER_FEFLOOD_DEFAULT = "#c8c4bc";

// ── Colours ──────────────────────────────────────────────────────────────────

/** Accent colour used when a company has no entry in COMPANY_COLORS. */
export const FALLBACK_COMPANY_COLOR = "#888882";

// ── Data sentinels ───────────────────────────────────────────────────────────

/**
 * The string used in resume.yaml endDate to mark a role as ongoing.
 * Compared case-insensitively.
 */
export const PRESENT_DATE_SENTINEL = "present";
