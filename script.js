/* ============================================================
   NAV — scroll state & mobile toggle
   ============================================================ */

const nav = document.getElementById('nav');
const navToggle = document.getElementById('navToggle');
const navLinks = document.getElementById('navLinks');

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

window.addEventListener('scroll', () => {
  nav.classList.toggle('scrolled', window.scrollY > 40);
  updateNavTheme();
}, { passive: true });

updateNavTheme();

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

  document.addEventListener('mousemove', e => {
    dot.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`;
  });

  document.addEventListener('mouseleave', () => {
    dot.style.transform = 'translate(-200px, -200px)';
  });

  const HOVER_TARGETS = 'a, button, [role="button"], input, textarea, select, label[for], .work__card, .award';

  document.addEventListener('mouseover', e => {
    if (e.target.closest(HOVER_TARGETS)) dot.classList.add('cursor--expanded');
  });

  document.addEventListener('mouseout', e => {
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

  if ('IntersectionObserver' in window) {
    observeFadeElements();
  } else {
    document.querySelectorAll('.fade-up').forEach(el => el.classList.add('in-view'));
  }

  initContactForm();
});
