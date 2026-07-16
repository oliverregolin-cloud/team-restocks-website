document.getElementById('year').textContent = new Date().getFullYear();

const navToggle = document.getElementById('navToggle');
const mainNav = document.getElementById('mainNav');

navToggle.setAttribute('aria-expanded', 'false');
navToggle.setAttribute('aria-controls', 'mainNav');

navToggle.addEventListener('click', () => {
  const open = mainNav.classList.toggle('is-open');
  navToggle.setAttribute('aria-expanded', String(open));
});

mainNav.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => mainNav.classList.remove('is-open'));
});

const header = document.getElementById('header');
const scrollProgress = document.getElementById('scrollProgress');

window.addEventListener('scroll', () => {
  header.style.boxShadow = window.scrollY > 10 ? '0 4px 20px rgba(0,0,0,0.4)' : 'none';

  const scrollable = document.documentElement.scrollHeight - window.innerHeight;
  const progress = scrollable > 0 ? (window.scrollY / scrollable) * 100 : 0;
  scrollProgress.style.width = progress + '%';
});

document.querySelectorAll(
  '.section, .hero-inner, .feature-card, .process-card, .discord-window, .accordion'
).forEach(el => el.classList.add('reveal'));

const revealObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('is-visible');
      revealObserver.unobserve(entry.target);
    }
  });
  // Trigger as soon as an element edges into view (threshold 0). A fixed
  // ratio like 0.15 never fires for elements taller than the viewport
  // (e.g. long legal pages), which would leave them stuck at opacity 0.
}, { threshold: 0, rootMargin: '0px 0px -60px 0px' });

document.querySelectorAll('.reveal').forEach(el => {
  // Elements taller than the viewport (e.g. long legal pages) can't enter the
  // observer's view enough to trigger, and the opacity transition doesn't
  // render cleanly on them — both leave the element stuck at opacity 0. Drop
  // the reveal treatment entirely so they render normally (opacity 1).
  if (el.offsetHeight > window.innerHeight) {
    el.classList.remove('reveal');
  } else {
    revealObserver.observe(el);
  }
});

// Safety net: if the observer hasn't revealed an in-view element within 1.5s
// (e.g. it never fires in a given environment), drop its reveal treatment so
// it renders normally (opacity 1) — this doesn't depend on the CSS transition
// running. Below-fold elements are left untouched so they still animate on
// scroll.
setTimeout(() => {
  document.querySelectorAll('.reveal:not(.is-visible)').forEach(el => {
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight && rect.bottom > 0) {
      el.classList.remove('reveal');
    }
  });
}, 1500);

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function animateCount(el) {
  const target = parseInt(el.dataset.count, 10);
  const suffix = el.dataset.suffix || '';

  if (reducedMotion) {
    el.textContent = target + suffix;
    return;
  }

  const duration = 1400;
  const start = performance.now();

  function tick(now) {
    const progress = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    el.textContent = Math.round(eased * target) + suffix;
    if (progress < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

document.querySelectorAll('[data-static]').forEach(el => {
  el.textContent = el.dataset.static;
});

const countObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      animateCount(entry.target);
      countObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.4 });

document.querySelectorAll('[data-count]').forEach(el => countObserver.observe(el));

document.querySelectorAll('.accordion-trigger').forEach(trigger => {
  trigger.setAttribute('aria-expanded', 'false');

  trigger.addEventListener('click', () => {
    const item = trigger.parentElement;
    const panel = trigger.nextElementSibling;
    const isOpen = item.classList.contains('is-open');

    document.querySelectorAll('.accordion-item.is-open').forEach(openItem => {
      if (openItem !== item) {
        openItem.classList.remove('is-open');
        openItem.querySelector('.accordion-panel').style.maxHeight = null;
        openItem.querySelector('.accordion-trigger').setAttribute('aria-expanded', 'false');
      }
    });

    if (isOpen) {
      item.classList.remove('is-open');
      panel.style.maxHeight = null;
      trigger.setAttribute('aria-expanded', 'false');
    } else {
      item.classList.add('is-open');
      panel.style.maxHeight = panel.scrollHeight + 'px';
      trigger.setAttribute('aria-expanded', 'true');
    }
  });
});
