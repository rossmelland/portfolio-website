/* ============================================================
   NAV — scroll state & mobile toggle
   ============================================================ */

const nav = document.getElementById('nav');
const navToggle = document.getElementById('navToggle');
const navLinks = document.getElementById('navLinks');

function updateNavTheme() {
  const navBottom = nav.offsetHeight;
  const lightSections = document.querySelectorAll('.services, .contact, .project-main, .project-back');
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
   SCROLL ANIMATIONS — fade-up on enter
   ============================================================ */

const fadeTargets = [
  '.section__header',
  '.work__card',
  '.service',
  '.about__image-wrap',
  '.about__title',
  '.about__bio',
  '.about__credentials',
  '.contact__header',
  '.contact__body',
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
    entries => {
      entries.forEach(entry => {
        entry.target.classList.toggle('in-view', entry.isIntersecting);
      });
    },
    { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
  );

  document.querySelectorAll('.fade-up').forEach(el => observer.observe(el));
}

/* ============================================================
   HERO — stagger children in on load
   ============================================================ */

function animateHero() {
  const items = [
    '.hero__name',
    '.hero__tagline',
    '.hero__actions',
  ];

  items.forEach((selector, i) => {
    const el = document.querySelector(selector);
    if (!el) return;
    el.style.opacity = '0';
    el.style.transform = 'translateY(20px)';
    el.style.transition = `opacity 0.8s ease ${i * 0.12}s, transform 0.8s ease ${i * 0.12}s`;
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        el.style.opacity = '1';
        el.style.transform = 'translateY(0)';
      });
    });
  });
}

/* ============================================================
   WORK CARDS — hover tilt (subtle)
   Deferred until card is in-view to avoid conflicting with
   the fade-up animation (inline transform would override it).
   ============================================================ */

function initCardTilt() {
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReduced) return;

  document.querySelectorAll('.work__card, .service').forEach(card => {
    card.addEventListener('mousemove', e => {
      if (!card.classList.contains('in-view')) return;

      card.style.transition = 'none';
      const rect = card.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width - 0.5) * 11;
      const y = ((e.clientY - rect.top) / rect.height - 0.5) * -9;
      card.style.transform = `perspective(700px) rotateY(${x}deg) rotateX(${y}deg) translateZ(10px)`;
    });

    card.addEventListener('mouseleave', () => {
      card.style.transition = 'transform 0.5s ease';
      card.style.transform = '';
    });
  });
}

/* ============================================================
   WATER IMAGE POOL — shared by hero and about section
   ============================================================ */

const WATER_IMAGES = [
  'images/anatoly-maltsev-oegxrSz1iAw-unsplash.jpg',
  'images/clement-m-0vOoWtDiKXY-unsplash.jpg',
  'images/fabian-jones-HWe3f8xIJq0-unsplash.jpg',
  'images/isi-parente-MBFdtqJr3kE-unsplash.jpg',
  'images/jani-petteri-tammi-9ifVUS_ooqY-unsplash.jpg',
  'images/phil-desforges-FHTYd6wvPmM-unsplash.jpg',
];

/* ============================================================
   HERO BACKGROUND — random water image on load
   ============================================================ */

function initHeroBg() {
  const hero = document.querySelector('.hero');
  if (!hero) return;

  const idx = Math.floor(Math.random() * WATER_IMAGES.length);
  hero.style.setProperty('--hero-bg-image', `url('${WATER_IMAGES[idx]}')`);
}


/* ============================================================
   HERO PARALLAX — text floats slower than background
   ============================================================ */

function initHeroParallax() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const hero  = document.querySelector('.hero');
  const inner = document.querySelector('.hero__inner');
  if (!hero || !inner) return;

  let ticking = false;

  function update() {
    const y = window.scrollY;
    if (y <= hero.offsetHeight) {
      inner.style.transform = `translateY(${y * 0.18}px)`;
    }
    ticking = false;
  }

  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(update);
      ticking = true;
    }
  }, { passive: true });
}

/* ============================================================
   HERO TEXTURE — fade out on scroll
   ============================================================ */

function initHeroTextureFade() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const hero = document.querySelector('.hero');
  if (!hero) return;

  function update() {
    const progress = Math.min(window.scrollY / (hero.offsetHeight * 0.6), 1);
    hero.style.setProperty('--hero-texture-opacity', 1 - progress);
  }

  window.addEventListener('scroll', update, { passive: true });
  update();
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
   CUSTOM CURSOR — instant tracking dot with hover expand
   ============================================================ */

function initCursor() {
  if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

  const dot = document.createElement('div');
  dot.className = 'cursor';
  document.body.appendChild(dot);

  document.addEventListener('mousemove', e => {
    dot.style.transform = `translate(calc(${e.clientX}px - 50%), calc(${e.clientY}px - 50%))`;
  });

  document.addEventListener('mouseleave', () => {
    dot.style.transform = 'translate(-200px, -200px)';
  });

  const HOVER_TARGETS = 'a, button, [role="button"], input, textarea, select, label[for], .work__card';

  document.addEventListener('mouseover', e => {
    if (e.target.closest(HOVER_TARGETS)) dot.classList.add('cursor--expanded');
  });

  document.addEventListener('mouseout', e => {
    if (e.target.closest(HOVER_TARGETS)) dot.classList.remove('cursor--expanded');
  });
}

/* ============================================================
   WORK GRID — shuffle card order on every page load
   Numbers stay sequential by position (CSS reads data-index).
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
   INIT
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
  initCursor();
  initHeroBg();
  shuffleWorkCards();
  animateHero();
  applyFadeClasses();

  if ('IntersectionObserver' in window) {
    observeFadeElements();
  } else {
    document.querySelectorAll('.fade-up').forEach(el => el.classList.add('in-view'));
  }

  initCardTilt();
  initContactForm();
  initHeroParallax();
  initHeroTextureFade();
});
