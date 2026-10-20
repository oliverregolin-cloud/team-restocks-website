document.getElementById('year').textContent = new Date().getFullYear();

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

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

function onScroll() {
  header.classList.toggle('is-scrolled', window.scrollY > 10);

  const scrollable = document.documentElement.scrollHeight - window.innerHeight;
  const progress = scrollable > 0 ? (window.scrollY / scrollable) * 100 : 0;
  scrollProgress.style.width = progress + '%';
}
window.addEventListener('scroll', onScroll, { passive: true });
onScroll();

// Cards, list items and FAQ entries appear one after another: every child of
// these groups gets its own reveal plus an index (--i) that staggers the delay.
// The shop pills are left out, they become a ticker further down.
document.querySelectorAll(
  '.process-grid, .feature-grid, .tool-grid, .checklist, ' +
  '.regions-flags:not(.shop-pills), .accordion, #success .discord-embed'
).forEach(group => {
  [...group.children].forEach((child, i) => {
    child.classList.add('reveal');
    child.style.setProperty('--i', Math.min(i, 8));
  });
});

document.querySelectorAll('.discord-window').forEach(el => el.classList.add('reveal'));

// Within a section the kicker, heading and lead follow each other as well.
document.querySelectorAll('.container').forEach(container => {
  [...container.children]
    .filter(el => el.classList.contains('reveal') && !el.style.getPropertyValue('--i'))
    .forEach((el, i) => el.style.setProperty('--i', Math.min(i, 5)));
});

const revealObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    const el = entry.target;
    el.classList.add('is-visible');
    revealObserver.unobserve(el);

    // Once the entrance has played, drop the reveal classes so the element's
    // own transitions (card hover lift, border colour) apply without delay.
    const delay = parseFloat(getComputedStyle(el).transitionDelay) || 0;
    setTimeout(() => el.classList.remove('reveal', 'is-visible'), (delay + 0.8) * 1000);
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

// The hero entrance is a CSS animation that starts at opacity 0. Where
// animations never advance (previews that render no frames, tabs opened in
// the background), the headline would stay invisible - so after two seconds
// a still-hidden headline switches the whole page to its motionless state.
setTimeout(() => {
  const headline = document.querySelector('.hero h1');
  if (headline && getComputedStyle(headline).opacity === '0') {
    document.documentElement.classList.add('no-motion');
  }
}, 2000);

function animateCount(el) {
  const target = parseInt(el.dataset.count, 10);
  const suffix = el.dataset.suffix || '';

  if (reducedMotion) {
    el.textContent = target.toLocaleString('de-DE') + suffix;
    return;
  }

  const duration = 1400;
  const start = performance.now();

  function tick(now) {
    const progress = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    el.textContent = Math.round(eased * target).toLocaleString('de-DE') + suffix;
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

// The shop selection becomes two endless rows running in opposite directions.
// Each row holds its pills twice so the loop jumps back without a seam; the
// copies are hidden from screen readers. With reduced motion the pills stay a
// plain wrapped list.
const shopPills = document.querySelector('.shop-pills');
if (shopPills && !reducedMotion) {
  const pills = [...shopPills.children];
  const half = Math.ceil(pills.length / 2);
  const rows = [pills, pills.slice(half).concat(pills.slice(0, half))];
  const marquee = document.createElement('div');
  marquee.className = 'marquee';

  rows.forEach((row, r) => {
    const track = document.createElement('div');
    track.className = r ? 'marquee-track marquee-reverse' : 'marquee-track';
    if (r) track.setAttribute('aria-hidden', 'true');

    for (let copy = 0; copy < 2; copy++) {
      const group = document.createElement('div');
      group.className = 'marquee-group';
      if (copy) group.setAttribute('aria-hidden', 'true');
      row.forEach(pill => group.appendChild(pill.cloneNode(true)));
      track.appendChild(group);
    }
    marquee.appendChild(track);
  });
  shopPills.replaceWith(marquee);
}

// In the #pings demo the bot "types" and the messages arrive one by one once
// the window scrolls into view. Hidden messages keep their space, so the
// layout never jumps.
const pingList = document.querySelector('#pings .discord-messages');
if (pingList && !reducedMotion) {
  const messages = [...pingList.querySelectorAll('.discord-msg')];
  messages.forEach(msg => msg.classList.add('msg-pending'));

  const typing = document.createElement('div');
  typing.className = 'discord-typing';
  const dots = document.createElement('span');
  dots.className = 'typing-dots';
  for (let i = 0; i < 3; i++) dots.appendChild(document.createElement('span'));
  typing.append(dots, 'Team Restocks schreibt …');
  pingList.parentElement.appendChild(typing);

  const pingObserver = new IntersectionObserver(entries => {
    if (!entries[0].isIntersecting) return;
    pingObserver.disconnect();

    let next = 0;
    const deliver = () => {
      if (next >= messages.length) return;
      typing.classList.add('is-active');
      setTimeout(() => {
        typing.classList.remove('is-active');
        const msg = messages[next++];
        msg.classList.remove('msg-pending');
        msg.classList.add('msg-arrive');
        setTimeout(deliver, 700);
      }, 1100);
    };
    setTimeout(deliver, 400);
  }, { threshold: 0.4 });
  pingObserver.observe(pingList);
}

// A soft glow follows the pointer across the cards (mouse and trackpad only).
if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
  document.querySelectorAll('.feature-card, .tool-card, .process-card').forEach(card => {
    card.classList.add('has-spotlight');
    card.addEventListener('pointermove', event => {
      const rect = card.getBoundingClientRect();
      card.style.setProperty('--mx', event.clientX - rect.left + 'px');
      card.style.setProperty('--my', event.clientY - rect.top + 'px');
    });
  });
}

// Highlight the navigation entry of the section in the middle of the screen.
const navLinks = [...mainNav.querySelectorAll('a[href^="#"]:not(.nav-cta)')];
if (navLinks.length) {
  const linkFor = new Map(navLinks.map(link => [link.getAttribute('href').slice(1), link]));

  const spy = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const active = linkFor.get(entry.target.id);
      navLinks.forEach(link => link.classList.toggle('is-active', link === active));
    });
  }, { rootMargin: '-45% 0px -50% 0px' });

  linkFor.forEach((link, id) => {
    const section = document.getElementById(id);
    if (section) spy.observe(section);
  });

  // Back at the hero no section is current.
  window.addEventListener('scroll', () => {
    if (window.scrollY < 120) navLinks.forEach(link => link.classList.remove('is-active'));
  }, { passive: true });
}
