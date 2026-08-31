/* ============================================================
   NAV — scroll state & mobile toggle
   ============================================================ */

const nav = document.getElementById('nav');
const navToggle = document.getElementById('navToggle');
const navLinks = document.getElementById('navLinks');

/* .nav.scrolled carries backdrop-filter for the frosted-glass effect.
   Per spec, backdrop-filter (like transform, filter, perspective,
   will-change naming any of those, or contain: paint/layout) makes an
   element the containing block for any position:fixed descendant —
   so .nav__links (position:fixed; inset:0 at mobile widths, to become
   the fullscreen menu panel) was resolving inset:0 against .nav's own
   ~90px bar instead of the viewport, which is what let items render
   above/below the panel instead of centered within a full-screen one.
   Fix: relocate .nav__links out from under .nav — but ONLY at mobile
   widths, where it's actually rendered as the fixed overlay. At
   desktop it's a plain flex item alongside the logo (no position
   override), so leaving it inside .nav__inner there means desktop
   needs zero CSS changes and keeps working exactly as it always has;
   duplicating .nav's own height/padding math into a second, desktop-
   only rule set to re-dock it elsewhere would just be a second place
   that could drift out of sync with .nav's actual sizing. */
function initMobileMenuPortal() {
  if (!navLinks) return;

  const desktopParent = navLinks.parentElement;
  const desktopNextSibling = navLinks.nextElementSibling;
  const mobileParent = document.querySelector('.page-wrapper') || document.body;
  const mql = window.matchMedia('(max-width: 768px)');

  function applyPlacement(isMobile) {
    if (isMobile) {
      if (navLinks.parentElement !== mobileParent) {
        mobileParent.insertBefore(navLinks, nav.nextSibling);
      }
    } else if (navLinks.parentElement !== desktopParent) {
      if (desktopNextSibling) desktopParent.insertBefore(navLinks, desktopNextSibling);
      else desktopParent.appendChild(navLinks);
    }
  }

  applyPlacement(mql.matches);
  mql.addEventListener('change', e => applyPlacement(e.matches));
}

function updateNavTheme() {
  const navBottom = nav.offsetHeight;
  const lightSections = document.querySelectorAll('.project-main, .project-back');
  let overLight = false;
  lightSections.forEach(section => {
    const rect = section.getBoundingClientRect();
    if (rect.top < navBottom && rect.bottom > 0) overLight = true;
  });
  nav.classList.toggle('nav--light-section', overLight);
}

/* Auto-hide on scroll direction — no idle timer, direction only.
   lastDirectionY is only updated once a scroll delta clears
   NAV_HIDE_THRESHOLD, so a run of sub-threshold jitter keeps
   comparing against the last *confirmed* position instead of
   drifting frame-to-frame — that's what makes small jitters cancel
   out instead of accumulating into an accidental hide/show. */
const NAV_HIDE_THRESHOLD = 8;
let lastDirectionY = window.scrollY;

window.addEventListener('scroll', () => {
  const y = window.scrollY;

  if (y <= 0) {
    nav.classList.remove('nav--hidden');
    lastDirectionY = y;
  } else {
    const delta = y - lastDirectionY;
    if (delta > NAV_HIDE_THRESHOLD) {
      nav.classList.add('nav--hidden');
      lastDirectionY = y;
    } else if (delta < -NAV_HIDE_THRESHOLD) {
      nav.classList.remove('nav--hidden');
      lastDirectionY = y;
    }
  }

  nav.classList.toggle('scrolled', y > 40);
  updateNavTheme();
}, { passive: true });

updateNavTheme();

/* ============================================================
   NAV — logo swap on scroll past the hero
   Homepage only: case-study pages have no #hero, so this is a no-op
   there and their nav keeps the single square mark it already has.
   IntersectionObserver's rootMargin shrinks the observed viewport by
   the nav's own height, so "not intersecting" fires exactly when the
   hero's bottom edge has scrolled up past the nav bar — not just
   whenever any part of the hero starts leaving the viewport. */
function initLogoSwap() {
  const hero = document.getElementById('hero');
  if (!hero) return;

  if (!('IntersectionObserver' in window)) {
    nav.classList.add('nav--past-hero');
    return;
  }

  const navHeight = nav.offsetHeight;
  const observer = new IntersectionObserver(([entry]) => {
    nav.classList.toggle('nav--past-hero', !entry.isIntersecting);
  }, { rootMargin: `-${navHeight}px 0px 0px 0px`, threshold: 0 });

  observer.observe(hero);
}

initMobileMenuPortal();

if (navToggle) {
  navToggle.addEventListener('click', () => {
    const isOpen = navLinks.classList.toggle('open');
    navToggle.classList.toggle('open', isOpen);
    navToggle.setAttribute('aria-expanded', String(isOpen));
    document.body.style.overflow = isOpen ? 'hidden' : '';
  });
}

if (navLinks) {
  navLinks.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      navLinks.classList.remove('open');
      navToggle.classList.remove('open');
      navToggle.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    });
  });
}

/* ============================================================
   SCROLL ANIMATIONS — fade-up, play once
   ============================================================ */

const fadeTargets = [
  '.section__header',
  '.work__card',
  '.award',
  '.about__image-wrap',
  '.about__title',
  '.about__bio',
  '.about__credentials',
  '.footer__upper',
  '.footer__lower',
];

function applyFadeClasses() {
  fadeTargets.forEach(selector => {
    document.querySelectorAll(selector).forEach(el => {
      el.classList.add('fade-up');
    });
  });
}

function observeFadeElements() {
  const observer = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('in-view');
        obs.unobserve(entry.target);
      });
    },
    { threshold: 0.1, rootMargin: '0px 0px -60px 0px' }
  );
  document.querySelectorAll('.fade-up').forEach(el => observer.observe(el));
}

/* Apply JS-driven stagger delays after shuffle so order is correct */
function applyStaggerDelays() {
  // Work cards sit in a 2-up grid — stagger the right-column card in each row
  document.querySelectorAll('.work__card').forEach((el, i) => {
    el.style.transitionDelay = `${(i % 2) * 0.12}s`;
  });

  // Award rows reveal sequentially
  document.querySelectorAll('.award').forEach((el, i) => {
    el.style.transitionDelay = `${i * 0.08}s`;
  });
}

/* ============================================================
   NAV — fade in on load
   ============================================================ */

function animateNav() {
  const ease = 'cubic-bezier(0.22, 1, 0.36, 1)';
  const el = document.querySelector('.nav__inner');
  if (!el) return;
  el.style.opacity = '0';
  el.style.transition = `opacity 0.7s ${ease}`;
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      el.style.opacity = '1';
    });
  });
}

/* ============================================================
   HERO — stagger fade-up on load
   ============================================================ */

function animateHero() {
  const ease = 'cubic-bezier(0.22, 1, 0.36, 1)';
  const dur  = '0.85s';
  const items = [
    { selector: '.hero__logo-wrap', delay: 0.05 },
    { selector: '.hero__contact',   delay: 0.22 },
    { selector: '.hero__bio',       delay: 0.32 },
  ];

  items.forEach(({ selector, delay }) => {
    const el = document.querySelector(selector);
    if (!el) return;
    el.style.opacity = '0';
    el.style.transform = 'translateY(20px)';
    el.style.transition = `opacity ${dur} ${ease} ${delay}s, transform ${dur} ${ease} ${delay}s`;
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        el.style.opacity = '1';
        el.style.transform = 'translateY(0)';
      });
    });
  });
}

/* ============================================================
   HERO EMAIL — copy to clipboard
   ============================================================ */

function initHeroEmail() {
  const btn    = document.getElementById('heroEmail');
  const copied = document.getElementById('heroEmailCopied');
  if (!btn || !copied) return;

  btn.addEventListener('click', async () => {
    const address = 'rossmelland@gmail.com';
    try {
      await navigator.clipboard.writeText(address);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = address;
      ta.style.cssText = 'position:fixed;opacity:0;pointer-events:none;';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    copied.classList.add('visible');
    setTimeout(() => copied.classList.remove('visible'), 2000);
  });
}

/* ============================================================
   CUSTOM CURSOR — hand-drawn arrow with blend mode
   ============================================================ */

function initCursor() {
  if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

  /* Hand-drawn arrow cursor. The source image's tip sits at its own
     top-left corner, so positioning the wrapper's untransformed
     top-left (no centering offset) at the pointer coordinates lines
     the tip up with the actual mouse position. filter:invert(1)
     turns the black artwork white first so mix-blend-mode: difference
     still inverts whatever background it passes over.

     Position (on .cursor) and the click pop/regrow animation (on the
     inner .cursor__mark) are kept on separate elements/properties on
     purpose: .cursor's transform is set directly every mousemove with
     no transition, so tracking stays 1:1 with zero lag; .cursor__mark
     is free to animate transform/opacity for the click effect without
     ever touching that position transform. */
  const dot = document.createElement('div');
  dot.className = 'cursor';

  const mark = document.createElement('img');
  mark.className = 'cursor__mark';
  mark.src = 'images/cursor-arrow.png';
  mark.alt = '';
  dot.appendChild(mark);
  dot.setAttribute('aria-hidden', 'true');
  document.body.appendChild(dot);

  /* hover/pointer media features describe the DEVICE's capability, not
     which input produced any given event — a touchscreen Windows
     laptop, Surface, or iPad+trackpad still reports hover:hover and
     pointer:fine (a real mouse/trackpad is present), so the guard
     above passes and all of this wires up exactly as it would on a
     plain desktop. Every tap on that touchscreen is then replayed by
     the browser as a compatibility mouse-event sequence — mousemove,
     mouseover, mousedown, mouseup, click, at the tap coordinates —
     purely so old sites that only understand mouse events still work.
     Listening for 'mousemove'/'mouseover'/'click' can't tell that
     sequence apart from a real mouse move, which is what let taps
     summon the cursor to wherever they landed, including onto the
     lightbox's images and controls. Pointer Events fix this: every
     pointer event carries the actual pointerType ('mouse', 'touch' or
     'pen') of whatever produced it, so each listener below checks
     that per-event instead of trusting the one-time capability check
     to also describe the current interaction. lastPointerWasMouse is
     tracked from 'pointerdown' (capture phase, so it's set before the
     'click' listener below ever runs) because the plain 'click' event
     itself carries no pointerType to check directly. */
  let lastPointerWasMouse = true;

  function hide() {
    dot.style.transform = 'translate(-200px, -200px)';
    dot.classList.remove('cursor--expanded');
  }

  document.addEventListener('pointerdown', e => {
    lastPointerWasMouse = e.pointerType === 'mouse';
    if (!lastPointerWasMouse) hide();
  }, { capture: true });

  document.addEventListener('pointermove', e => {
    if (e.pointerType !== 'mouse') return;
    dot.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`;
  });

  document.addEventListener('mouseleave', hide);

  const HOVER_TARGETS = 'a, button, [role="button"], input, textarea, select, label[for], .work__card, .award, .lightbox-trigger';

  /* A zoomed lightbox image shows the browser's own grab/grabbing
     cursor (styles.css) as its "you can drag this" affordance instead
     of the custom arrow — two cursor renderers stacked on the same
     point would just look broken. So the custom cursor hides itself
     specifically while hovering .lightbox__image.is-zoomed, and
     reappears the moment the pointer leaves it. */
  document.addEventListener('pointerover', e => {
    if (e.pointerType !== 'mouse') return;
    if (e.target.closest('.lightbox__image.is-zoomed')) {
      dot.classList.add('cursor--hidden-for-native');
      return;
    }
    if (e.target.closest(HOVER_TARGETS)) dot.classList.add('cursor--expanded');
  });

  document.addEventListener('pointerout', e => {
    if (e.pointerType !== 'mouse') return;
    if (e.target.closest('.lightbox__image.is-zoomed')) {
      dot.classList.remove('cursor--hidden-for-native');
    }
    if (e.target.closest(HOVER_TARGETS)) dot.classList.remove('cursor--expanded');
  });

  /* Click pop/regrow: "bubble pop" out, then a fresh instance grows
     back in from 0. Chained via animationend rather than timers so it
     can never drift out of sync with the CSS durations. A new click
     always strips both classes and forces a reflow before restarting,
     so rapid clicking cleanly restarts the sequence instead of
     stacking or glitching. */
  mark.addEventListener('animationend', e => {
    if (e.animationName === 'cursorPop') {
      mark.classList.remove('pop');
      void mark.offsetWidth;
      mark.classList.add('grow');
    } else if (e.animationName === 'cursorGrow') {
      mark.classList.remove('grow');
    }
  });

  document.addEventListener('click', () => {
    if (!lastPointerWasMouse) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    mark.classList.remove('pop', 'grow');
    void mark.offsetWidth;
    mark.classList.add('pop');
  });
}

/* ============================================================
   CONTACT FORM — async Formspree submission
   ============================================================ */

function initContactForm() {
  const form = document.querySelector('.contact__form');
  if (!form) return;

  form.addEventListener('submit', async e => {
    e.preventDefault();
    const btn = form.querySelector('.form__submit');
    const originalText = btn.textContent;
    btn.textContent = 'Sending…';
    btn.disabled = true;

    try {
      const res = await fetch(form.action, {
        method: 'POST',
        body: new FormData(form),
        headers: { Accept: 'application/json' },
      });

      if (res.ok) {
        form.innerHTML = '<p class="form__success">Message sent. I\'ll be in touch soon.</p>';
      } else {
        btn.textContent = originalText;
        btn.disabled = false;
      }
    } catch {
      btn.textContent = originalText;
      btn.disabled = false;
    }
  });
}

/* ============================================================
   WORK GRID — shuffle card order on every page load
   ============================================================ */

const CARD_BORDER_COUNT = 3;

function shuffleWorkCards() {
  const grid = document.querySelector('.work__grid');
  if (!grid) return;
  const cards = Array.from(grid.querySelectorAll('.work__card'));
  for (let i = cards.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [cards[i], cards[j]] = [cards[j], cards[i]];
  }
  let prevBorderNum = null;
  cards.forEach((card, i) => {
    grid.appendChild(card);
    card.dataset.index = String(i + 1).padStart(2, '0');

    const border = card.querySelector('.work__card-border');
    if (border) {
      const choices = [];
      for (let n = 1; n <= CARD_BORDER_COUNT; n++) {
        if (n !== prevBorderNum) choices.push(n);
      }
      const num = choices[Math.floor(Math.random() * choices.length)];
      border.src = `images/textures/card-border-${String(num).padStart(2, '0')}.png`;
      prevBorderNum = num;
    }
  });
}

/* ============================================================
   ABOUT — random worn border on page load
   ============================================================ */

function randomizeAboutBorder() {
  const border = document.querySelector('.about__image-border');
  if (!border) return;
  const n = String(Math.floor(Math.random() * CARD_BORDER_COUNT) + 1).padStart(2, '0');
  border.src = `images/textures/card-border-${n}.png`;
}

/* ============================================================
   SCROLL PARALLAX — footer reveal
   .footer__reveal-inner gets a small settle-in offset that eases
   out as the sticky footer is uncovered, sized off the page's
   real max scroll distance. Skipped entirely under reduced
   motion — the CSS fallback already renders it correctly at
   rest. (See BACKGROUND TILES below for the per-section paper
   texture zones that replaced the old single .bg-parallax layer.)
   ============================================================ */

function initScrollParallax() {
  const wrapper = document.querySelector('.page-wrapper');
  if (!wrapper) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const footer = document.querySelector('.footer');
  const footerInner = footer ? footer.querySelector('.footer__reveal-inner') : null;

  const FOOTER_SETTLE_PX = 20;

  let footerRevealStart = 0;
  let footerHeight = 0;

  function measure() {
    const viewportHeight = window.innerHeight;
    const wrapperHeight = wrapper.offsetHeight;
    footerRevealStart = wrapperHeight - viewportHeight;
    footerHeight = footer ? footer.offsetHeight : 0;
  }

  function update() {
    const y = Math.max(window.scrollY, 0);

    if (footerInner && footerHeight > 0) {
      const revealed = Math.min(Math.max(y - footerRevealStart, 0), footerHeight);
      const progress = revealed / footerHeight;
      footerInner.style.transform = `translate3d(0, ${(1 - progress) * FOOTER_SETTLE_PX}px, 0)`;
    }
  }

  let ticking = false;
  function onScroll() {
    if (!ticking) {
      requestAnimationFrame(() => { update(); ticking = false; });
      ticking = true;
    }
  }

  measure();
  update();

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', () => { measure(); update(); });
  window.addEventListener('load', () => { measure(); update(); });

  if ('ResizeObserver' in window) {
    new ResizeObserver(() => { measure(); update(); }).observe(wrapper);
  }
}

/* ============================================================
   BACKGROUND TILES — shared zone system
   Loaded on every page (script.js is one shared file). Each zone is
   an absolutely-positioned canvas (.bg-tiles, inside a host element)
   of native-size paper tiles scattered with jitter:
     - .hero / .work — the homepage's two standalone zones.
     - .bg-zone-combined — the homepage's Awards+Ticker+About zone,
       OR (on a case study page, where it's the only one present)
       that page's single zone spanning project-main + project-back.
     - .footer — present on every page; its tiles are placed once
       and never drift (see the "static" zone handling below), since
       the footer is revealed by the sticky curtain-lift, not by
       scrolling past it in the normal sense.
   Columns are spaced unevenly on purpose: tighter/denser (more
   overlap) in the left/right margins where no content sits, wider/
   sparser (less overlap) through the central content column behind
   the hero text, project cards, awards rows and about/project copy —
   full coverage either way, just less visual noise behind the
   content. Rows use a single moderate overlap top to bottom. Tile
   images are picked at random per cell, but never repeated against
   the already-placed left or top neighbor — the same exclude-then-
   random-pick rule used for the project card borders, extended to
   two dimensions. Every non-static zone's tiles drift at their own
   parallax speed (randomized around ~72.5% scroll speed, spread
   widened for a layered depth effect) off ONE shared scroll listener
   / rAF loop, never a listener per tile. Reduced motion still builds
   and places tiles everywhere, it just never starts the drift loop.
   ============================================================ */

const BG_TILE_SETS = {
  white: { count: 6, avgW: 1042, avgH: 820, minW: 850, minH: 559 },
  black: { count: 6, avgW: 1210, avgH: 880, minW: 900, minH: 624 },
};

// Native pixel dimensions per tile image, used only to scale-compensate
// 90/270 rotations (see bgOrientationTransform) — never fed into the
// grid/step math above, so density/overlap stay exactly as tuned.
const BG_TILE_DIMS = {
  white: [
    { w: 1000, h: 1210 },
    { w: 1100, h: 774 },
    { w: 900, h: 661 },
    { w: 1000, h: 668 },
    { w: 1400, h: 1047 },
    { w: 850, h: 559 },
  ],
  black: [
    { w: 1500, h: 1072 },
    { w: 1600, h: 1089 },
    { w: 900, h: 749 },
    { w: 960, h: 752 },
    { w: 1400, h: 996 },
    { w: 900, h: 624 },
  ],
};

// The 8 distinct orientations (dihedral group of a rectangle: 4 rotations
// x optional horizontal flip) a tile can be placed in.
const BG_TILE_ORIENTATIONS = [
  { rotate: 0, flip: false },
  { rotate: 90, flip: false },
  { rotate: 180, flip: false },
  { rotate: 270, flip: false },
  { rotate: 0, flip: true },
  { rotate: 90, flip: true },
  { rotate: 180, flip: true },
  { rotate: 270, flip: true },
];

const BG_TILE_EXTRA_TILT = 6; // deg, layered on a reused orientation once all 8 are used

// .bg-zone-combined / .bg-tiles--combined double as the single continuous
// zone on every case study page (Awards+Ticker+About only exists on the
// homepage; a case study page has at most one .bg-zone-combined, so the
// same selector pair resolves correctly on either page with no extra
// per-page config). The footer entry is marked static: true — its tiles
// are placed like any other zone's but initBgTiles never applies scroll
// drift to them (see update()).
const BG_TILE_ZONES = [
  { host: '.hero',             canvas: '.bg-tiles--hero',     set: 'white' },
  { host: '.work',             canvas: '.bg-tiles--work',     set: 'black' },
  { host: '.bg-zone-combined', canvas: '.bg-tiles--combined', set: 'white' },
  { host: '.footer',           canvas: '.bg-tiles--footer',   set: 'black', static: true },
];

const BG_TILE_OVERLAP_EDGE = 0.38;   // left/right margins + all rows — fuller
const BG_TILE_OVERLAP_CENTER = 0.30; // central content column — sparser
const BG_TILE_CENTER_BAND = 0.6;     // middle 60% of zone width counts as "central"
const BG_TILE_JITTER = 0.12;
const BG_TILE_MAX_PER_ZONE = 90;
const BG_TILE_MIN_FACTOR = 0.675;
const BG_TILE_MAX_FACTOR = 0.775;
const BG_TILE_MAX_DRIFT = 46;

function bgTilePath(setName, oneBasedIndex) {
  return `images/textures/paper-${setName}-${String(oneBasedIndex).padStart(2, '0')}.png`;
}

function pickBgTileIndex(count, excludeA, excludeB) {
  const choices = [];
  for (let i = 0; i < count; i++) {
    if (i !== excludeA && i !== excludeB) choices.push(i);
  }
  if (choices.length === 0) {
    for (let i = 0; i < count; i++) if (i !== excludeA) choices.push(i);
  }
  return choices[Math.floor(Math.random() * choices.length)];
}

// Per-zone, per-image record of which of the 8 orientations have already
// been used, so a repeated image never reads as an obvious duplicate. The
// first placement of an image stays upright (orientation 0); each repeat
// picks a not-yet-used orientation; once all 8 are used, a random one is
// reused with a small extra tilt layered on so it's still not identical.
function pickBgOrientation(usedByIndex, idx) {
  const used = usedByIndex.get(idx);
  if (!used) {
    usedByIndex.set(idx, [0]);
    return { orientation: BG_TILE_ORIENTATIONS[0], extraTilt: 0 };
  }

  const available = [];
  for (let i = 0; i < BG_TILE_ORIENTATIONS.length; i++) {
    if (!used.includes(i)) available.push(i);
  }

  let orientIdx;
  let extraTilt = 0;
  if (available.length > 0) {
    orientIdx = available[Math.floor(Math.random() * available.length)];
  } else {
    orientIdx = used[Math.floor(Math.random() * used.length)];
    extraTilt = (Math.random() * 2 - 1) * BG_TILE_EXTRA_TILT;
  }

  used.push(orientIdx);
  return { orientation: BG_TILE_ORIENTATIONS[orientIdx], extraTilt };
}

// Builds the static CSS transform for one tile image. A 90/270 rotation
// swaps the image's visual footprint (width<->height) relative to its own
// native-size layout box, so it's scaled up just enough to still fully
// cover that box on both axes — the box (and therefore the grid's
// coverage guarantees) never changes, only what bleeds past its edges.
function bgOrientationTransform(orientation, extraTilt, w, h) {
  const parts = [];
  if (orientation.flip) parts.push('scaleX(-1)');
  if (orientation.rotate) parts.push(`rotate(${orientation.rotate}deg)`);
  if (extraTilt) parts.push(`rotate(${extraTilt.toFixed(2)}deg)`);
  if (orientation.rotate === 90 || orientation.rotate === 270) {
    const ratio = Math.max(w, h) / Math.min(w, h);
    parts.push(`scale(${ratio.toFixed(4)})`);
  }
  return parts.join(' ');
}

// Caps a raw step so that, even accounting for jitter pulling this
// column and its neighbor apart from each other, two of the smallest
// tiles in the set can never separate enough to expose a gap.
function bgSafeStep(rawStep, minDim) {
  const cap = minDim / (1 + 2 * BG_TILE_JITTER);
  return Math.min(rawStep, cap);
}

function buildBgColumns(width, avgW, minW) {
  const stepEdge = bgSafeStep(avgW * (1 - BG_TILE_OVERLAP_EDGE), minW);
  const stepCenter = bgSafeStep(avgW * (1 - BG_TILE_OVERLAP_CENTER), minW);
  const centerStart = width * (1 - BG_TILE_CENTER_BAND) / 2;
  const centerEnd = width - centerStart;

  const columns = [];
  let x = -stepEdge;
  let guard = 0;
  while (x < width + stepEdge && guard < 30) {
    const inCenter = x >= centerStart && x <= centerEnd;
    const step = inCenter ? stepCenter : stepEdge;
    columns.push({ x, step });
    x += step;
    guard++;
  }
  return columns;
}

function buildBgZoneTiles(canvasEl, setName, width, height) {
  canvasEl.innerHTML = '';
  if (width <= 0 || height <= 0) return [];

  const { count, avgW, avgH, minW, minH } = BG_TILE_SETS[setName];
  const columns = buildBgColumns(width, avgW, minW).slice(0, 12);
  const stepH = bgSafeStep(avgH * (1 - BG_TILE_OVERLAP_EDGE), minH);

  const cols = Math.max(1, columns.length);
  const maxRows = Math.max(1, Math.floor(BG_TILE_MAX_PER_ZONE / cols));
  const rows = Math.max(1, Math.min(Math.ceil(height / stepH) + 3, maxRows));

  const grid = [];
  const tiles = [];
  const usedOrientations = new Map();

  for (let r = 0; r < rows; r++) {
    grid[r] = [];
    for (let c = 0; c < cols; c++) {
      const leftIdx = c > 0 ? grid[r][c - 1] : -1;
      const topIdx = r > 0 ? grid[r - 1][c] : -1;
      const idx = pickBgTileIndex(count, leftIdx, topIdx);
      grid[r][c] = idx;

      const { x: colBaseX, step: colStep } = columns[c];
      const jitterX = (Math.random() * 2 - 1) * colStep * BG_TILE_JITTER;
      const jitterY = (Math.random() * 2 - 1) * stepH * BG_TILE_JITTER;

      const { orientation, extraTilt } = pickBgOrientation(usedOrientations, idx);
      const dims = BG_TILE_DIMS[setName][idx];

      const wrap = document.createElement('div');
      wrap.className = 'bg-tile';
      wrap.style.left = `${colBaseX + jitterX}px`;
      wrap.style.top = `${(r - 1) * stepH + jitterY}px`;

      const img = document.createElement('img');
      img.src = bgTilePath(setName, idx + 1);
      img.alt = '';
      img.setAttribute('aria-hidden', 'true');
      img.className = 'bg-tile-img';
      const orientTransform = bgOrientationTransform(orientation, extraTilt, dims.w, dims.h);
      if (orientTransform) img.style.transform = orientTransform;

      wrap.appendChild(img);
      canvasEl.appendChild(wrap);

      tiles.push({
        el: wrap,
        factor: BG_TILE_MIN_FACTOR + Math.random() * (BG_TILE_MAX_FACTOR - BG_TILE_MIN_FACTOR),
      });
    }
  }

  return tiles;
}

function initBgTiles() {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let zones = [];

  function build() {
    zones = BG_TILE_ZONES.map(cfg => {
      const hostEl = document.querySelector(cfg.host);
      const canvasEl = document.querySelector(cfg.canvas);
      if (!hostEl || !canvasEl) return null;
      const tiles = buildBgZoneTiles(canvasEl, cfg.set, hostEl.offsetWidth, hostEl.offsetHeight);
      return { hostEl, tiles, topY: 0, static: !!cfg.static };
    }).filter(Boolean);
    measure();
  }

  function measure() {
    zones.forEach(zone => {
      const rect = zone.hostEl.getBoundingClientRect();
      zone.topY = rect.top + window.scrollY;
    });
  }

  // Static zones (the footer) are placed once by build() above and never
  // touched again here — no transform is ever applied, so they can't drift
  // independently of the sticky/curtain-lift reveal they sit behind.
  function update() {
    const y = Math.max(window.scrollY, 0);
    zones.forEach(zone => {
      if (zone.static) return;
      const delta = Math.max(0, y - zone.topY);
      zone.tiles.forEach(tile => {
        const drift = Math.min(delta * (1 - tile.factor), BG_TILE_MAX_DRIFT);
        tile.el.style.transform = `translate3d(0, ${drift}px, 0)`;
      });
    });
  }

  build();

  let resizeTimer = null;
  function onResize() {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      build();
      if (!reduceMotion) update();
    }, 150);
  }

  window.addEventListener('resize', onResize);
  window.addEventListener('load', onResize);

  if ('ResizeObserver' in window) {
    const ro = new ResizeObserver(onResize);
    BG_TILE_ZONES.forEach(cfg => {
      const el = document.querySelector(cfg.host);
      if (el) ro.observe(el);
    });
  }

  if (reduceMotion) return;

  let ticking = false;
  function onScroll() {
    if (!ticking) {
      requestAnimationFrame(() => { update(); ticking = false; });
      ticking = true;
    }
  }

  update();
  window.addEventListener('scroll', onScroll, { passive: true });
}

/* ============================================================
   LIGHTBOX — fullscreen image viewer
   Opens on any .lightbox-trigger element found on the page (the case
   study image grid today; the future full-width single image just
   needs the same class, no JS changes). All triggers on the page
   share one sequence in DOM order, so prev/next cycles through them
   together. The overlay markup is built once and appended straight
   to <body> — same placement as the custom cursor in initCursor()
   above — specifically so it sits as a plain sibling in the cursor's
   stacking context rather than nested inside anything that isolates
   it. .lightbox itself only sets position/z-index/opacity/background,
   never mix-blend-mode/isolation/filter on itself, so it doesn't
   create an isolated blending group — the cursor's
   mix-blend-mode: difference still composites correctly over it.

   WRAPPING: prev/next (and the arrow keys) wrap around — next() on
   the last image returns to the first, prev() on the first goes to
   the last. That's a recommendation, not a final call: the
   alternative is to stop and disable/hide the arrow at each end.
   ============================================================ */

function initLightbox() {
  const triggers = Array.from(document.querySelectorAll('.lightbox-trigger'));
  if (triggers.length === 0) return;

  const reduceMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const overlay = document.createElement('div');
  overlay.className = 'lightbox';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-label', 'Image viewer');
  overlay.setAttribute('aria-hidden', 'true');
  if (triggers.length === 1) overlay.classList.add('lightbox--single');
  overlay.innerHTML = `
    <button type="button" class="lightbox__close" aria-label="Close">
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>
    </button>
    <button type="button" class="lightbox__nav lightbox__nav--prev" aria-label="Previous image">
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg>
    </button>
    <button type="button" class="lightbox__nav lightbox__nav--next" aria-label="Next image">
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M9 5l7 7-7 7"/></svg>
    </button>
    <img class="lightbox__image" src="" alt="" />
  `;
  document.body.appendChild(overlay);

  const imgEl = overlay.querySelector('.lightbox__image');
  const closeBtn = overlay.querySelector('.lightbox__close');
  const prevBtn = overlay.querySelector('.lightbox__nav--prev');
  const nextBtn = overlay.querySelector('.lightbox__nav--next');

  let currentIndex = -1;
  let lastFocused = null;
  let closeTimer = null;
  imgEl.draggable = false;

  /* ----------------------------------------------------------
     ZOOM & PAN
     scale/panX/panY describe imgEl's transform: `translate(panX,
     panY) scale(scale)`, transform-origin fixed at center (imgEl's
     center coincides with the viewport's center, since .lightbox is a
     full-viewport flex-centered box and transforms don't move the
     underlying layout box). That geometry makes the math for
     "zoom anchored at an arbitrary screen point" reduce to a simple
     closed-form update — see setZoom()'s comment.

     baseW/baseH are imgEl's rendered width/height AT scale 1 (i.e.
     its normal max-width/max-height-constrained fit-to-viewport
     size) — captured once per image via measureBase(), right after
     load, before any zoom is ever applied. maxScale is derived from
     that: capped at 4x, but never past the point where the image
     would render above its own native resolution (which would just
     be upscaled blur, not more detail).
     ---------------------------------------------------------- */
  const MIN_SCALE = 1;
  const MAX_SCALE_CAP = 4;
  const DOUBLE_TAP_MS = 300;
  const DOUBLE_TAP_DIST = 30;
  const TAP_MOVE_TOLERANCE = 6;
  const SWIPE_THRESHOLD = 40;

  let scale = MIN_SCALE;
  let panX = 0;
  let panY = 0;
  let baseW = 0;
  let baseH = 0;
  let maxScale = MIN_SCALE;

  function clamp(v, min, max) {
    return Math.min(max, Math.max(min, v));
  }

  function isZoomed() {
    return scale > MIN_SCALE + 0.001;
  }

  function canZoom() {
    return maxScale > MIN_SCALE + 0.001;
  }

  function applyTransform() {
    imgEl.style.transform = (scale === MIN_SCALE && panX === 0 && panY === 0)
      ? ''
      : `translate(${panX}px, ${panY}px) scale(${scale})`;
    imgEl.classList.toggle('is-zoomed', isZoomed());
  }

  function clampPan() {
    const scaledW = baseW * scale;
    const scaledH = baseH * scale;
    const maxX = Math.max(0, (scaledW - window.innerWidth) / 2);
    const maxY = Math.max(0, (scaledH - window.innerHeight) / 2);
    panX = clamp(panX, -maxX, maxX);
    panY = clamp(panY, -maxY, maxY);
  }

  // Anchors a zoom change at an arbitrary screen point (cursor,
  // pinch midpoint, double-click/tap point) so that the image content
  // under that point stays visually fixed as scale changes. Derived
  // from: screenPos(p) = viewportCenter + pan + scale * (p - imgCenter).
  // Solving "same screenPos before/after" for the new pan, in terms of
  // the ratio k = newScale / oldScale, gives a closed form that needs
  // no DOM measurement beyond the anchor point itself:
  //   pan' = (anchor - viewportCenter) * (1 - k) + k * pan
  function setZoom(newScaleRaw, anchorX, anchorY) {
    const newScale = clamp(newScaleRaw, MIN_SCALE, maxScale);
    if (Math.abs(newScale - scale) < 0.0001) return;
    const k = newScale / scale;
    const cx = window.innerWidth / 2;
    const cy = window.innerHeight / 2;
    panX = (anchorX - cx) * (1 - k) + k * panX;
    panY = (anchorY - cy) * (1 - k) + k * panY;
    scale = newScale;
    clampPan();
    applyTransform();
  }

  function resetZoomInstant() {
    scale = MIN_SCALE;
    panX = 0;
    panY = 0;
    applyTransform();
  }

  function toggleZoom(clientX, clientY) {
    if (!canZoom()) return;
    const animate = !reduceMotion();
    if (animate) imgEl.classList.add('lightbox__image--animated');
    if (isZoomed()) {
      resetZoomInstant();
    } else {
      setZoom(Math.min(2, maxScale), clientX, clientY);
    }
    if (animate) {
      setTimeout(() => imgEl.classList.remove('lightbox__image--animated'), 350);
    }
  }

  // Captured at scale 1 before any transform is applied, so it reads
  // imgEl's real fit-to-viewport box — never a post-transform rect.
  function measureBase() {
    scale = MIN_SCALE;
    panX = 0;
    panY = 0;
    imgEl.style.transform = '';
    baseW = imgEl.offsetWidth;
    baseH = imgEl.offsetHeight;
    const nativeRatio = baseW > 0 ? imgEl.naturalWidth / baseW : MAX_SCALE_CAP;
    maxScale = clamp(nativeRatio, MIN_SCALE, MAX_SCALE_CAP);
    applyTransform();
  }

  window.addEventListener('resize', () => {
    if (!overlay.classList.contains('lightbox--active')) return;
    measureBase();
  });

  /* ---------------------------------------------------------- */

  function show(index) {
    currentIndex = index;
    const trigger = triggers[index];
    imgEl.src = trigger.currentSrc || trigger.src;
    imgEl.alt = trigger.alt || '';
    touchMode = 'idle';
    if (imgEl.complete) {
      measureBase();
    } else {
      imgEl.addEventListener('load', measureBase, { once: true });
    }
  }

  function open(index, originEl) {
    lastFocused = originEl;
    clearTimeout(closeTimer);
    // display:flex has to land BEFORE show() can measure anything: if
    // the image is already cached, measureBase() can run synchronously
    // off imgEl.complete, and offsetWidth/offsetHeight both read 0 on
    // a display:none subtree — that raced baseW/baseH to 0 and made
    // every pan clamp to nothing. Reading offsetWidth forces a
    // synchronous layout, so setting the class first is enough; no
    // rAF wait needed for this part.
    overlay.classList.add('lightbox--active');
    show(index);
    overlay.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', onKeydown);

    // Double rAF so the display:none -> flex swap lands in the DOM
    // before the opacity transition to 1 starts (same idiom as
    // animateNav()/animateHero() above).
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        overlay.classList.add('lightbox--visible');
      });
    });
  }

  function close() {
    overlay.classList.remove('lightbox--visible');
    overlay.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    document.removeEventListener('keydown', onKeydown);
    resetZoomInstant();

    const toRefocus = lastFocused;
    clearTimeout(closeTimer);
    closeTimer = setTimeout(() => {
      overlay.classList.remove('lightbox--active');
      imgEl.src = '';
    }, reduceMotion() ? 0 : 350);

    if (toRefocus) toRefocus.focus();
  }

  function step(delta) {
    show((currentIndex + delta + triggers.length) % triggers.length);
  }

  function onKeydown(e) {
    if (e.key === 'Escape') close();
    else if (e.key === 'ArrowLeft') step(-1);
    else if (e.key === 'ArrowRight') step(1);
  }

  triggers.forEach((trigger, i) => {
    trigger.tabIndex = -1; // not a tab stop; just a valid .focus() target on close
    trigger.addEventListener('click', () => open(i, trigger));
  });

  overlay.addEventListener('click', e => {
    if (e.target === overlay) close();
  });

  imgEl.addEventListener('click', e => e.stopPropagation());
  closeBtn.addEventListener('click', close);
  prevBtn.addEventListener('click', () => step(-1));
  nextBtn.addEventListener('click', () => step(1));

  // Wheel always drives zoom, never the page — the overlay covers the
  // whole viewport and preventDefault fires unconditionally so a
  // scroll gesture can never leak through or land as a no-op scroll.
  overlay.addEventListener('wheel', e => {
    e.preventDefault();
    const factor = Math.exp(-e.deltaY * 0.0025);
    setZoom(scale * factor, e.clientX, e.clientY);
  }, { passive: false });

  // dblclick is reliable for real mouse double-clicks, but on a
  // hybrid touch+mouse device a double TAP also replays as two
  // synthetic mouse clicks close together, which browsers can also
  // report as a native 'dblclick' — exactly the touch/mouse ambiguity
  // already solved for the custom cursor in initCursor(). Track it
  // the same way here and defer to the manual touch double-tap path
  // (handlePossibleDoubleTap) for anything that isn't a real mouse.
  let lastImgPointerWasMouse = true;
  imgEl.addEventListener('pointerdown', e => {
    lastImgPointerWasMouse = e.pointerType === 'mouse';
  });

  imgEl.addEventListener('dblclick', e => {
    if (!lastImgPointerWasMouse) return;
    e.stopPropagation();
    toggleZoom(e.clientX, e.clientY);
  });

  // Desktop click-drag panning — only engages once zoomed in, so it
  // never interferes with a plain click at fit-to-viewport.
  let dragging = false;
  let dragStart = null;

  imgEl.addEventListener('mousedown', e => {
    if (!isZoomed()) return;
    e.preventDefault();
    dragging = true;
    dragStart = { x: e.clientX, y: e.clientY, panX, panY };
    imgEl.classList.add('is-panning');
  });

  window.addEventListener('mousemove', e => {
    if (!dragging) return;
    panX = dragStart.panX + (e.clientX - dragStart.x);
    panY = dragStart.panY + (e.clientY - dragStart.y);
    clampPan();
    applyTransform();
  });

  window.addEventListener('mouseup', () => {
    if (!dragging) return;
    dragging = false;
    imgEl.classList.remove('is-panning');
  });

  /* ----------------------------------------------------------
     TOUCH — one gesture at a time: 'swipe' (navigate, only when at
     fit-to-viewport), 'pan' (drag, only once zoomed in — this is the
     key conflict the brief calls out: the same one-finger drag must
     do one or the other, never both), or 'pinch' (always available).
     A tap that doesn't cross TAP_MOVE_TOLERANCE is checked against
     the previous tap for double-tap-to-toggle-zoom.
     ---------------------------------------------------------- */
  let touchMode = 'idle';
  let touchStartX = 0;
  let touchStartY = 0;
  let touchMoved = false;
  let panTouchStart = null;
  let pinchStartDistance = 0;
  let lastTapTime = 0;
  let lastTapX = 0;
  let lastTapY = 0;

  function touchDistance(t0, t1) {
    return Math.hypot(t1.clientX - t0.clientX, t1.clientY - t0.clientY);
  }

  function touchMidpoint(t0, t1) {
    return { x: (t0.clientX + t1.clientX) / 2, y: (t0.clientY + t1.clientY) / 2 };
  }

  function handlePossibleDoubleTap(x, y) {
    const now = Date.now();
    const dist = Math.hypot(x - lastTapX, y - lastTapY);
    if (now - lastTapTime < DOUBLE_TAP_MS && dist < DOUBLE_TAP_DIST) {
      toggleZoom(x, y);
      lastTapTime = 0; // consumed — a third quick tap starts fresh, not a re-trigger
    } else {
      lastTapTime = now;
      lastTapX = x;
      lastTapY = y;
    }
  }

  overlay.addEventListener('touchstart', e => {
    touchMoved = false;
    if (e.touches.length === 1) {
      const t = e.touches[0];
      touchStartX = t.clientX;
      touchStartY = t.clientY;
      if (isZoomed()) {
        touchMode = 'pan';
        panTouchStart = { x: t.clientX, y: t.clientY, panX, panY };
      } else {
        touchMode = 'swipe';
      }
    } else if (e.touches.length === 2) {
      e.preventDefault();
      touchMode = 'pinch';
      pinchStartDistance = touchDistance(e.touches[0], e.touches[1]);
    }
  }, { passive: false });

  overlay.addEventListener('touchmove', e => {
    if (touchMode === 'pan' && e.touches.length === 1) {
      e.preventDefault();
      const t = e.touches[0];
      if (Math.hypot(t.clientX - touchStartX, t.clientY - touchStartY) > TAP_MOVE_TOLERANCE) touchMoved = true;
      panX = panTouchStart.panX + (t.clientX - panTouchStart.x);
      panY = panTouchStart.panY + (t.clientY - panTouchStart.y);
      clampPan();
      applyTransform();
    } else if (touchMode === 'pinch' && e.touches.length === 2) {
      e.preventDefault();
      const dist = touchDistance(e.touches[0], e.touches[1]);
      const mid = touchMidpoint(e.touches[0], e.touches[1]);
      setZoom(scale * (dist / pinchStartDistance), mid.x, mid.y);
      pinchStartDistance = dist;
    } else if (touchMode === 'swipe') {
      const t = e.touches[0];
      if (Math.hypot(t.clientX - touchStartX, t.clientY - touchStartY) > TAP_MOVE_TOLERANCE) touchMoved = true;
    }
  }, { passive: false });

  overlay.addEventListener('touchend', e => {
    const t = e.changedTouches[0];

    if (touchMode === 'swipe') {
      const dx = t.clientX - touchStartX;
      if (Math.abs(dx) > SWIPE_THRESHOLD) {
        step(dx > 0 ? -1 : 1);
      } else if (!touchMoved) {
        handlePossibleDoubleTap(t.clientX, t.clientY);
      }
    } else if (touchMode === 'pan' && !touchMoved) {
      handlePossibleDoubleTap(t.clientX, t.clientY);
    }

    if (e.touches.length === 0) {
      touchMode = 'idle';
    } else if (e.touches.length === 1) {
      // Dropped from a pinch (or repositioned during a pan) to one
      // finger still down — resume tracking cleanly from here rather
      // than carrying over stale start coordinates.
      const remaining = e.touches[0];
      if (isZoomed()) {
        touchMode = 'pan';
        panTouchStart = { x: remaining.clientX, y: remaining.clientY, panX, panY };
      } else {
        touchMode = 'swipe';
        touchStartX = remaining.clientX;
        touchStartY = remaining.clientY;
      }
      touchMoved = false;
    }
  }, { passive: true });
}

/* ============================================================
   CONTACT LINK — manual scroll-to-bottom
   The footer is position:sticky, so its on-screen rect stays near
   the viewport bottom at almost any scroll position. That confuses
   the browser's native #contact anchor jump (and hash-on-load) into
   thinking a tiny scroll already satisfies it. Handle it manually:
   always scroll to the true bottom of the page instead.
   ============================================================ */

function scrollToPageBottom(smooth) {
  const target = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
  window.scrollTo({ top: target, behavior: smooth ? 'smooth' : 'auto' });
}

function initContactScroll() {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  document.querySelectorAll('a[href="#contact"]').forEach(link => {
    link.addEventListener('click', e => {
      e.preventDefault();
      scrollToPageBottom(!reduceMotion);
      history.pushState(null, '', '#contact');
    });
  });

  if (window.location.hash === '#contact') {
    scrollToPageBottom(false);
    window.addEventListener('load', () => scrollToPageBottom(false));
  }
}

/* ============================================================
   INIT
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
  initCursor();
  shuffleWorkCards();
  randomizeAboutBorder();
  animateNav();
  animateHero();
  initHeroEmail();
  applyFadeClasses();
  applyStaggerDelays();
  initScrollParallax();
  initBgTiles();
  initContactScroll();
  initLightbox();
  initLogoSwap();

  if ('IntersectionObserver' in window) {
    observeFadeElements();
  } else {
    document.querySelectorAll('.fade-up').forEach(el => el.classList.add('in-view'));
  }

  initContactForm();
});
