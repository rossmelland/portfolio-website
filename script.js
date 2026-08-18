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
   CUSTOM CURSOR — smooth-follow circle with blend mode
   ============================================================ */

function initCursor() {
  if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

  /* Inject SVG filter — displacement map + blur creates the grainy,
     feathered edge. Small area (26px) keeps it near-zero cost. */
  const filterSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  filterSvg.setAttribute('style', 'position:absolute;width:0;height:0;pointer-events:none;overflow:hidden');
  filterSvg.setAttribute('aria-hidden', 'true');
  filterSvg.innerHTML = `<defs>
    <filter id="cursor-grain" x="-35%" y="-35%" width="170%" height="170%" color-interpolation-filters="sRGB">
      <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="4" seed="12" result="noise"/>
      <feComposite in="SourceGraphic" in2="noise" operator="arithmetic" k1="0" k2="0.73" k3="0.27" k4="0" result="textured"/>
      <feComposite in="textured" in2="SourceGraphic" operator="in" result="clipped"/>
      <feGaussianBlur in="clipped" stdDeviation="2"/>
    </filter>
    <filter id="ticker-grain" x="0%" y="0%" width="100%" height="100%" color-interpolation-filters="sRGB">
      <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="4" seed="12" result="noise"/>
      <feComposite in="SourceGraphic" in2="noise" operator="arithmetic" k1="0" k2="0.94" k3="0.06" k4="0" result="textured"/>
      <feComposite in="textured" in2="SourceGraphic" operator="in"/>
    </filter>
  </defs>`;
  document.body.appendChild(filterSvg);

  const dot = document.createElement('div');
  dot.className = 'cursor';
  document.body.appendChild(dot);

  document.addEventListener('mousemove', e => {
    dot.style.transform = `translate(calc(${e.clientX}px - 50%), calc(${e.clientY}px - 50%))`;
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
}

/* ============================================================
   HERO LOGO — mouse-proximity liquid distortion
   ============================================================ */

function initHeroLogoLiquid() {
  if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

  const hero = document.getElementById('hero');
  const fx = document.getElementById('heroLogoFx');
  if (!hero || !fx) return;

  const filterSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  filterSvg.setAttribute('style', 'position:absolute;width:0;height:0;pointer-events:none;overflow:hidden');
  filterSvg.setAttribute('aria-hidden', 'true');
  filterSvg.innerHTML = `<defs>
    <filter id="heroLiquidFilter" color-interpolation-filters="sRGB" x="-30%" y="-30%" width="160%" height="160%">
      <feTurbulence type="fractalNoise" baseFrequency="0.015 0.035" numOctaves="2" seed="4" result="noise" />
      <feDisplacementMap in="SourceGraphic" in2="noise" scale="16" xChannelSelector="R" yChannelSelector="G" result="displaced" />
      <feGaussianBlur in="displaced" stdDeviation="2.2" />
    </filter>
  </defs>`;
  document.body.appendChild(filterSvg);

  let x = -9999;
  let y = -9999;
  let ticking = false;

  function apply() {
    ticking = false;
    fx.style.setProperty('--fx-x', `${x}px`);
    fx.style.setProperty('--fx-y', `${y}px`);
  }

  function schedule() {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(apply);
    }
  }

  hero.addEventListener('mousemove', e => {
    const rect = fx.getBoundingClientRect();
    x = e.clientX - rect.left;
    y = e.clientY - rect.top;
    schedule();
  });

  hero.addEventListener('mouseleave', () => {
    x = -9999;
    y = -9999;
    schedule();
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
   INIT
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
  initCursor();
  shuffleWorkCards();
  animateNav();
  animateHero();
  initHeroEmail();
  initHeroLogoLiquid();
  applyFadeClasses();
  applyStaggerDelays();

  if ('IntersectionObserver' in window) {
    observeFadeElements();
  } else {
    document.querySelectorAll('.fade-up').forEach(el => el.classList.add('in-view'));
  }

  initContactForm();
});
