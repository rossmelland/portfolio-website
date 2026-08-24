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

function shuffleWorkCards() {
  const grid = document.querySelector('.work__grid');
  if (!grid) return;
  const cards = Array.from(grid.querySelectorAll('.work__card'));
  for (let i = cards.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [cards[i], cards[j]] = [cards[j], cards[i]];
  }
  cards.forEach((card, i) => {
    grid.appendChild(card);
    card.dataset.index = String(i + 1).padStart(2, '0');
  });
}

/* ============================================================
   SCROLL PARALLAX — background texture + footer reveal
   .bg-parallax is nudged so it moves at BG_FACTOR (~72%) of true
   scroll speed, giving the paper texture a sense of sitting just
   behind the content. .footer__reveal-inner gets a small settle-in
   offset that eases out as the sticky footer is uncovered. Sizing
   is derived from the page's real max scroll distance so the
   texture layer always has enough overscan to avoid gaps, on
   pages of any length. Skipped entirely under reduced motion —
   the CSS fallback already renders both correctly at rest.
   ============================================================ */

function initScrollParallax() {
  const wrapper = document.querySelector('.page-wrapper');
  if (!wrapper) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const bg = wrapper.querySelector('.bg-parallax');
  const footer = document.querySelector('.footer');
  const footerInner = footer ? footer.querySelector('.footer__reveal-inner') : null;

  const BG_FACTOR = 0.72;
  const FOOTER_SETTLE_PX = 20;

  let maxBgOffset = 0;
  let footerRevealStart = 0;
  let footerHeight = 0;

  function measure() {
    const viewportHeight = window.innerHeight;
    const wrapperHeight = wrapper.offsetHeight;
    const docMaxScroll = Math.max(0, document.documentElement.scrollHeight - viewportHeight);
    maxBgOffset = docMaxScroll * (1 - BG_FACTOR);

    if (bg) {
      bg.style.top = `${-maxBgOffset}px`;
      bg.style.height = `${wrapperHeight + maxBgOffset}px`;
    }

    footerRevealStart = wrapperHeight - viewportHeight;
    footerHeight = footer ? footer.offsetHeight : 0;
  }

  function update() {
    const y = Math.max(window.scrollY, 0);

    if (bg) {
      const t = Math.min(y * (1 - BG_FACTOR), maxBgOffset);
      bg.style.transform = `translate3d(0, ${t}px, 0)`;
    }

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
  animateNav();
  animateHero();
  initHeroEmail();
  applyFadeClasses();
  applyStaggerDelays();
  initScrollParallax();
  initContactScroll();

  if ('IntersectionObserver' in window) {
    observeFadeElements();
  } else {
    document.querySelectorAll('.fade-up').forEach(el => el.classList.add('in-view'));
  }

  initContactForm();
});
