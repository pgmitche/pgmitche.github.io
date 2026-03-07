import type { ResumeData, Role } from "./data/resume.ts";
import { el } from "./dom.ts";
import {
  CAROUSEL_LERP_FACTOR,
  CAROUSEL_SNAP_THRESHOLD_PX,
  WHEEL_SNAP_IDLE_MS,
  DITHER_SEEDS,
  DITHER_FEFLOOD_DEFAULT,
  FALLBACK_COMPANY_COLOR,
  PRESENT_DATE_SENTINEL,
} from "./constants.ts";
import { COMPANY_COLORS, COMPANY_LOGOS, LOGO_NEEDS_LIGHT_BG, LOGO_USES_SCREEN_BLEND, LOGO_NEEDS_INVERT, LOGO_TYPE } from "./data/brands.ts";

// =============================================================================
// Dither overlay
// =============================================================================

/**
 * Builds the SVG dither element and returns it alongside the filter nodes that
 * need updating per-frame. The SVG must live in the live DOM because Chrome
 * does not render feTurbulence in data-URI backgrounds.
 */
function buildDitherOverlay(): {
  container: HTMLDivElement;
  feFlood: Element;
  feTurbulence: Element;
} {
  const container = document.createElement("div");
  container.className = "tl-dither";
  container.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" aria-hidden="true" focusable="false"><defs><filter id="tl-noise-filter" x="0" y="0" width="100%" height="100%" color-interpolation-filters="linearRGB"><feTurbulence type="turbulence" baseFrequency="0.28 0.32" numOctaves="1" seed="7" result="t"/><feColorMatrix type="luminanceToAlpha" in="t" result="l"/><feComponentTransfer in="l" result="th"><feFuncA type="discrete" tableValues="0 0 1"/></feComponentTransfer><feFlood flood-color="${DITHER_FEFLOOD_DEFAULT}" flood-opacity="0.45" result="c"/><feComposite in="c" in2="th" operator="in"/></filter></defs><rect width="100%" height="100%" filter="url(#tl-noise-filter)"/></svg>`;

  const feFlood = container.querySelector("feFlood");
  const feTurbulence = container.querySelector("feTurbulence");
  if (!feFlood || !feTurbulence) {
    throw new Error("Dither SVG is missing required filter elements (feFlood / feTurbulence)");
  }
  return { container, feFlood, feTurbulence };
}

// =============================================================================
// Entry card
// =============================================================================

function renderEntry(role: Role, index: number): HTMLElement {
  const isLeft = index % 2 === 0;
  const isPresent = role.endDate.toLowerCase() === PRESENT_DATE_SENTINEL;

  const skillTags = (role.skills && role.skills.length > 0)
    ? [el("div", { class: "tl-skills" }, ...role.skills.map((s) => el("span", { class: "tl-skill" }, s)))]
    : [];

  const logoType = LOGO_TYPE[role.company] ?? "icon";

  const cardClasses = ["tl-card", logoType === "wordmark" ? "tl-card--wordmark-logo" : ""].filter(Boolean).join(" ");
  const card = el("div", { class: cardClasses },
    el("h3", { class: "tl-title" }, role.title),
    el("p", { class: "tl-company" }, role.company),
    el("p", { class: "tl-location" }, role.location),
    ...skillTags,
  );

  const logoSrc = COMPANY_LOGOS[role.company];
  if (logoSrc) {
    const logoWrapperClasses = [
      "tl-logo",
      `tl-logo--${logoType}`,
      LOGO_NEEDS_LIGHT_BG.has(role.company) ? "tl-logo--light-bg" : "",
    ].filter(Boolean).join(" ");

    const imgClasses = [
      "tl-logo-img",
      LOGO_USES_SCREEN_BLEND.has(role.company) ? "tl-logo-img--screen" : "",
      LOGO_NEEDS_INVERT.has(role.company)      ? "tl-logo-img--invert" : "",
    ].filter(Boolean).join(" ");

    const logoEl = el("div", { class: logoWrapperClasses });
    logoEl.appendChild(el("img", { src: logoSrc, alt: role.company, class: imgClasses, loading: "lazy" }));
    card.appendChild(logoEl);
  }

  const node = el("div", { class: "tl-node" },
    el("span", { class: isPresent ? "tl-dot tl-dot--present" : "tl-dot" }),
  );

  const dateCol = el("div", { class: "tl-date-col" },
    el("span", { class: "tl-date-text" }, `${role.startDate} – ${role.endDate}`),
  );

  const entry = el("article", { class: `tl-entry ${isLeft ? "tl-left" : "tl-right"}` });
  entry.style.setProperty("--i", String(index));
  entry.style.setProperty("--company-color", COMPANY_COLORS[role.company] ?? FALLBACK_COMPANY_COLOR);

  if (isLeft) {
    entry.appendChild(card);
    entry.appendChild(node);
    entry.appendChild(dateCol);
  } else {
    entry.appendChild(dateCol);
    entry.appendChild(node);
    entry.appendChild(card);
  }

  return entry;
}

// =============================================================================
// Page
// =============================================================================

// Module-level reference so re-renders (hashchange) cancel the previous session.
let timelineCleanup: (() => void) | null = null;

/** Cancel any active timeline session (event listeners + rAF). Safe to call when idle. */
export function cleanupTimeline(): void {
  timelineCleanup?.();
  timelineCleanup = null;
}

export function renderTimeline(data: ResumeData, root: HTMLElement): void {
  cleanupTimeline();

  const { name, tagline, experience } = data;
  const entries = experience.map(renderEntry);

  const vignette = el("div", { class: "tl-vignette" });
  const { container: dither, feFlood, feTurbulence } = buildDitherOverlay();

  // Header and CTA are static — only the track (entries) translates.
  const track = el("div", { class: "tl-track" }, ...entries);
  const trackViewport = el("div", { class: "tl-track-viewport" }, track);
  const page = el("div", { class: "tl-page" }, trackViewport);

  // Header overlay appended last so it paints above the vignette and dither.
  const headerOverlay = el("div", { class: "tl-header-overlay" },
    el("div", { class: "tl-header-text" },
      el("h1", { class: "tl-name" }, name),
      el("p", { class: "tl-tagline" }, tagline),
    ),
    el("a", { href: "#resume", class: "tl-resume-btn" }, "Résumé"),
  );

  root.appendChild(page);
  root.appendChild(vignette);
  root.appendChild(dither);
  root.appendChild(headerOverlay);

  // ── Scroll state ──────────────────────────────────────────────────────────────
  // targetScrollY is driven directly by input (continuous) and snaps to the
  // nearest entry center after a brief idle period. currentScrollY follows via
  // a frame-rate-independent exponential lerp so the feel is consistent at any fps.

  let activeIndex = 0;
  let currentScrollY = 0;
  let targetScrollY = 0;

  /** Returns the translateY needed to vertically centre entries[index] in the viewport. */
  function getTargetScrollY(index: number): number {
    const entry = entries[index];
    if (!entry) return 0;
    return entry.offsetTop + entry.offsetHeight / 2 - trackViewport.clientHeight / 2;
  }

  function getMinScrollY(): number { return getTargetScrollY(0); }
  function getMaxScrollY(): number { return getTargetScrollY(entries.length - 1); }

  /** Returns the index of the entry whose center is closest to scrollY. */
  function getNearestIndex(scrollY: number): number {
    let nearest = 0;
    let minDist = Infinity;
    for (let i = 0; i < entries.length; i++) {
      const dist = Math.abs(getTargetScrollY(i) - scrollY);
      if (dist < minDist) { minDist = dist; nearest = i; }
    }
    return nearest;
  }

  /** Updates opacity classes and dither colour without changing targetScrollY. */
  function updateActiveClasses(index: number): void {
    activeIndex = Math.max(0, Math.min(entries.length - 1, index));
    for (let i = 0; i < entries.length; i++) {
      const dist = Math.abs(i - activeIndex);
      entries[i].classList.toggle("is-active",   dist === 0);
      entries[i].classList.toggle("is-adjacent", dist === 1);
      entries[i].classList.toggle("is-far",      dist >= 2);
    }
    const color = entries[activeIndex]?.style.getPropertyValue("--company-color") || DITHER_FEFLOOD_DEFAULT;
    feFlood.setAttribute("flood-color", color);
  }

  /** Snaps targetScrollY to the given entry and updates classes. Used by keyboard/touch discrete. */
  function setActive(index: number): void {
    updateActiveClasses(index);
    targetScrollY = getTargetScrollY(activeIndex);
  }

  // Shared idle-snap timer — reused by both wheel and touch handlers.
  let snapTimer: ReturnType<typeof setTimeout> | null = null;

  function scheduleSnap(delayMs: number): void {
    if (snapTimer !== null) clearTimeout(snapTimer);
    snapTimer = setTimeout(() => {
      setActive(getNearestIndex(currentScrollY));
      snapTimer = null;
    }, delayMs);
  }

  // ── Input: wheel (continuous scroll + snap-on-idle) ──────────────────────────
  const onWheel = (e: WheelEvent) => {
    e.preventDefault();
    if (!initialized) return;

    // Normalise deltaMode: line (~16 px/line) and page are uncommon but possible.
    const delta = e.deltaMode === 1 ? e.deltaY * 16 : e.deltaMode === 2 ? e.deltaY * 600 : e.deltaY;

    const min = getMinScrollY();
    const max = getMaxScrollY();
    targetScrollY  = Math.max(min, Math.min(max, targetScrollY  + delta));
    // Move currentScrollY in lock-step so the track follows input with zero lag.
    // The lerp only runs during the snap-to-card animation after the gesture ends.
    currentScrollY = Math.max(min, Math.min(max, currentScrollY + delta));

    // After the gesture (and OS inertia) settles, snap to the nearest card.
    scheduleSnap(WHEEL_SNAP_IDLE_MS);
  };

  // ── Input: touch (live tracking + inertia + momentum snap) ──────────────────
  // Finger down  → track follows 1:1, no lag.
  // Finger up     → inertia continues in the rAF loop (exponential decay),
  //                 mimicking native iOS momentum scroll.
  // Inertia stops → snap to nearest card.
  // Velocity is computed over the last 100 ms of touch history so a fast flick
  // near lift-off isn't washed out by the finger decelerating at the end.

  let touchLastY  = 0;
  let touchInertiaVelocity = 0; // px/frame, active after touchend
  let touchActive = false;
  // Ring buffer of recent samples for robust velocity measurement.
  const TOUCH_HISTORY_MS = 100;
  const touchHistory: { y: number; t: number }[] = [];

  const onTouchStart = (e: TouchEvent) => {
    touchActive = true;
    touchLastY = e.touches[0].clientY;
    touchInertiaVelocity = 0;
    touchHistory.length = 0;
    touchHistory.push({ y: touchLastY, t: performance.now() });
    if (snapTimer !== null) { clearTimeout(snapTimer); snapTimer = null; }
  };

  const onTouchMove = (e: TouchEvent) => {
    e.preventDefault();
    if (!initialized || !touchActive) return;
    const y   = e.touches[0].clientY;
    const now = performance.now();
    const delta = touchLastY - y; // positive = scrolling down
    touchLastY = y;

    // Maintain a sliding 100 ms window of samples.
    touchHistory.push({ y, t: now });
    while (touchHistory.length > 1 && now - touchHistory[0].t > TOUCH_HISTORY_MS) {
      touchHistory.shift();
    }

    const min = getMinScrollY();
    const max = getMaxScrollY();
    targetScrollY  = Math.max(min, Math.min(max, targetScrollY  + delta));
    currentScrollY = Math.max(min, Math.min(max, currentScrollY + delta));
  };

  const onTouchEnd = () => {
    touchActive = false;

    // Derive velocity from the 100 ms history window — captures the true
    // intent speed rather than the near-zero delta of the final micro-event.
    const now = performance.now();
    const old = touchHistory.find(h => now - h.t <= TOUCH_HISTORY_MS);
    const newest = touchHistory[touchHistory.length - 1];
    if (old && newest && newest.t > old.t) {
      const windowVelocityPxMs = (old.y - newest.y) / (newest.t - old.t); // px/ms
      // Convert to px/frame at 60 fps, then hand off to the inertia loop.
      touchInertiaVelocity = windowVelocityPxMs * 16.667;
    }
    // Inertia + snap is driven by the rAF tick while touchActive === false.
  };

  // ── Input: keyboard ──────────────────────────────────────────────────────────
  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === "ArrowDown" || e.key === "ArrowRight") {
      e.preventDefault();
      setActive(activeIndex + 1);
    } else if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
      e.preventDefault();
      setActive(activeIndex - 1);
    }
  };

  window.addEventListener("wheel",      onWheel,      { passive: false });
  window.addEventListener("touchstart", onTouchStart, { passive: true  });
  window.addEventListener("touchmove",  onTouchMove,  { passive: false }); // must be non-passive for preventDefault
  window.addEventListener("touchend",   onTouchEnd,   { passive: true  });
  window.addEventListener("keydown",    onKeyDown);

  // ── rAF loop ─────────────────────────────────────────────────────────────────
  let lastScrollY = -1;
  let lastTime = 0;
  let rafId = 0;
  let initialized = false;
  let ditherSeedIndex = 0;
  let ditherFrame = 0;

  function tick(time: number) {
    rafId = requestAnimationFrame(tick);

    if (!initialized) {
      // Guard: wait until the viewport has been laid out.
      if (!trackViewport.clientHeight) return;

      // Pad top and bottom by half the viewport height so the first and last
      // entries can be centred without negative translateY values.
      const halfVP = trackViewport.clientHeight / 2;
      track.style.paddingTop    = `${halfVP}px`;
      track.style.paddingBottom = `${halfVP}px`;

      targetScrollY  = getTargetScrollY(0);
      currentScrollY = targetScrollY;
      lastTime       = time;
      setActive(0);
      initialized = true;
      return;
    }

    // Frame-rate-independent lerp: same deceleration feel at 30 fps as at 60 fps.
    const dt = Math.min(time - lastTime, 50); // cap at 50 ms to absorb tab-switch gaps
    lastTime = time;
    const lerpFactor = 1 - Math.pow(1 - CAROUSEL_LERP_FACTOR, dt / 16.667);

    // Touch inertia: after finger lifts, continue scrolling with exponential decay
    // (same physics as native iOS momentum scroll) until velocity winds down,
    // then snap to the nearest card.
    if (!touchActive && Math.abs(touchInertiaVelocity) > 0.5) {
      const min = getMinScrollY();
      const max = getMaxScrollY();
      currentScrollY = Math.max(min, Math.min(max, currentScrollY + touchInertiaVelocity));
      targetScrollY  = currentScrollY;
      touchInertiaVelocity *= 0.92; // decay rate — lower = quicker stop, higher = longer glide
      // Once inertia winds down, snap to nearest card.
      if (Math.abs(touchInertiaVelocity) <= 0.5) {
        touchInertiaVelocity = 0;
        setActive(getNearestIndex(currentScrollY));
      }
    } else {
      currentScrollY += (targetScrollY - currentScrollY) * lerpFactor;
      if (Math.abs(targetScrollY - currentScrollY) < CAROUSEL_SNAP_THRESHOLD_PX) {
        currentScrollY = targetScrollY;
      }
    }

    if (currentScrollY !== lastScrollY) {
      track.style.transform = `translateY(-${currentScrollY}px)`;

      // Keep the highlighted card in sync with position during free scroll.
      const nearest = getNearestIndex(currentScrollY);
      if (nearest !== activeIndex) updateActiveClasses(nearest);

      // Throttle feTurbulence updates to every 4th frame — SVG filter
      // recalculation is expensive on mobile GPUs and imperceptible at full rate.
      ditherFrame++;
      if (ditherFrame % 4 === 0) {
        ditherSeedIndex = (ditherSeedIndex + 1) % DITHER_SEEDS.length;
        feTurbulence.setAttribute("seed", String(DITHER_SEEDS[ditherSeedIndex]));
      }

      lastScrollY = currentScrollY;
    }
  }

  rafId = requestAnimationFrame(tick);

  timelineCleanup = () => {
    cancelAnimationFrame(rafId);
    if (snapTimer !== null) clearTimeout(snapTimer);
    window.removeEventListener("wheel",      onWheel);
    window.removeEventListener("touchstart", onTouchStart);
    window.removeEventListener("touchmove",  onTouchMove);
    window.removeEventListener("touchend",   onTouchEnd);
    window.removeEventListener("keydown",    onKeyDown);
  };
}
