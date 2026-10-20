document.getElementById('year').textContent = new Date().getFullYear();

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

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
// animations never advance (previews that render no frames), the headline
// would stay invisible - so a headline still hidden two seconds after the
// page became visible switches the whole page to its motionless state. Tabs
// opened in the background wait until they are brought to the front, so
// they still get the entrance.
function checkHeroShown() {
  if (document.hidden) {
    document.addEventListener('visibilitychange', () => setTimeout(checkHeroShown, 2000), { once: true });
    return;
  }
  const headline = document.querySelector('.hero h1');
  if (headline && getComputedStyle(headline).opacity === '0') {
    document.documentElement.classList.add('no-motion');
  }
}
setTimeout(checkHeroShown, 2000);

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
    else el.classList.add('is-counted');
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
if (finePointer) {
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

// ---- Hero: coin, parallax and sparkles -------------------------------------
const hero = document.querySelector('.hero');
if (hero && !reducedMotion) {
  const coin = hero.querySelector('.coin');
  let heroHeight = hero.offsetHeight;

  // Scrolling away lifts the cards faster than the content and fades the text.
  let scrollFrame = 0;
  window.addEventListener('scroll', () => {
    if (scrollFrame) return;
    scrollFrame = requestAnimationFrame(() => {
      scrollFrame = 0;
      hero.style.setProperty('--hs', Math.min(1, window.scrollY / heroHeight).toFixed(3));
    });
  }, { passive: true });

  // The coin flips once when touched, tapped or clicked.
  if (coin) {
    const flip = () => coin.classList.add('is-flipping');
    coin.addEventListener('click', flip);
    if (finePointer) coin.addEventListener('pointerenter', flip);
    coin.addEventListener('animationend', event => {
      if (event.animationName === 'coin-flip') coin.classList.remove('is-flipping');
    });
  }

  // With a mouse, the pointer drives the card parallax, the coin tilt and the
  // glare on the coin. Touch devices skip this: a finger on the hero is
  // usually scrolling, not pointing.
  if (finePointer) {
    let pointer = null;
    let pointerFrame = 0;
    hero.addEventListener('pointermove', event => {
      pointer = event;
      if (pointerFrame) return;
      pointerFrame = requestAnimationFrame(() => {
        pointerFrame = 0;
        const box = hero.getBoundingClientRect();
        hero.style.setProperty('--px', (((pointer.clientX - box.left) / box.width) * 2 - 1).toFixed(3));
        hero.style.setProperty('--py', (((pointer.clientY - box.top) / box.height) * 2 - 1).toFixed(3));
        if (!coin) return;

        const c = coin.getBoundingClientRect();
        const x = Math.max(-1, Math.min(1, (pointer.clientX - (c.left + c.width / 2)) / (box.width / 2)));
        const y = Math.max(-1, Math.min(1, (pointer.clientY - (c.top + c.height / 2)) / (box.height / 2)));
        const angle = Math.min(1, Math.hypot(x, y)) * 24;
        coin.style.setProperty('--tilt', `${(-y).toFixed(3)} ${x.toFixed(3)} 0 ${angle.toFixed(1)}deg`);
        coin.style.setProperty('--gx', (((pointer.clientX - c.left) / c.width) * 100).toFixed(1) + '%');
        coin.style.setProperty('--gy', (((pointer.clientY - c.top) / c.height) * 100).toFixed(1) + '%');
      });
    });
    hero.addEventListener('pointerenter', () => coin && coin.classList.add('is-lit'));
    hero.addEventListener('pointerleave', () => {
      hero.style.removeProperty('--px');
      hero.style.removeProperty('--py');
      if (coin) {
        coin.classList.remove('is-lit');
        coin.style.removeProperty('--tilt');
      }
    });
  }

  // Golden sparkles rise behind the hero, linked by faint lines where they
  // come close, and dodge the mouse.
  const canvas = hero.querySelector('.hero-particles');
  const ctx = canvas && canvas.getContext ? canvas.getContext('2d') : null;
  if (ctx) {
    const LINK = 110;
    const mouse = { x: -9999, y: -9999 };
    let width = 0;
    let height = 0;
    let sparks = [];
    let running = false;
    let frameId = 0;

    const spawn = anywhere => ({
      x: Math.random() * width,
      y: anywhere ? Math.random() * height : height + 8,
      r: 0.6 + Math.random() * 1.8,
      vx: (Math.random() - 0.5) * 0.18,
      vy: -(0.15 + Math.random() * 0.4),
      phase: Math.random() * Math.PI * 2,
      red: Math.random() < 0.2,
    });

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = hero.clientWidth;
      height = hero.clientHeight;
      heroHeight = hero.offsetHeight;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // Only reseed when the size changed noticeably - mobile browsers fire
      // resize whenever the address bar slides in or out.
      const count = Math.round(Math.min(90, Math.max(26, (width * height) / 15000)));
      if (Math.abs(count - sparks.length) > count * 0.2) {
        sparks = Array.from({ length: count }, () => spawn(true));
      }
    };

    const draw = () => {
      ctx.clearRect(0, 0, width, height);

      ctx.lineWidth = 1;
      for (let i = 0; i < sparks.length; i++) {
        for (let j = i + 1; j < sparks.length; j++) {
          const dist = Math.hypot(sparks[i].x - sparks[j].x, sparks[i].y - sparks[j].y);
          if (dist < LINK) {
            ctx.strokeStyle = `rgba(217, 165, 32, ${((1 - dist / LINK) * 0.12).toFixed(3)})`;
            ctx.beginPath();
            ctx.moveTo(sparks[i].x, sparks[i].y);
            ctx.lineTo(sparks[j].x, sparks[j].y);
            ctx.stroke();
          }
        }
      }

      for (const spark of sparks) {
        const mx = spark.x - mouse.x;
        const my = spark.y - mouse.y;
        const md = Math.hypot(mx, my);
        if (md < 120 && md > 0.1) {
          const push = (1 - md / 120) * 1.4;
          spark.x += (mx / md) * push;
          spark.y += (my / md) * push;
        }
        spark.x += spark.vx;
        spark.y += spark.vy;
        spark.phase += 0.04;
        if (spark.y < -10 || spark.x < -10 || spark.x > width + 10) Object.assign(spark, spawn(false));

        const glow = 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(spark.phase));
        const colour = spark.red ? '227, 67, 80' : '242, 193, 78';
        ctx.fillStyle = `rgba(${colour}, ${(glow * 0.18).toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(spark.x, spark.y, spark.r * 3.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = `rgba(${colour}, ${glow.toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(spark.x, spark.y, spark.r, 0, Math.PI * 2);
        ctx.fill();
      }
      frameId = requestAnimationFrame(draw);
    };

    const start = () => {
      if (running) return;
      running = true;
      frameId = requestAnimationFrame(draw);
    };
    const stop = () => {
      running = false;
      cancelAnimationFrame(frameId);
    };

    resize();
    let resizeTimer = 0;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(resize, 150);
    });

    if (finePointer) {
      hero.addEventListener('pointermove', event => {
        const box = hero.getBoundingClientRect();
        mouse.x = event.clientX - box.left;
        mouse.y = event.clientY - box.top;
      });
      hero.addEventListener('pointerleave', () => {
        mouse.x = -9999;
        mouse.y = -9999;
      });
    }

    // Only draw while the hero is on screen and the tab is in front.
    let heroOnScreen = true;
    const update = () => (heroOnScreen && !document.hidden ? start() : stop());
    new IntersectionObserver(entries => {
      heroOnScreen = entries[0].isIntersecting;
      update();
    }).observe(hero);
    document.addEventListener('visibilitychange', update);
  }
}

// Cards and Discord windows lean towards the mouse.
if (finePointer && !reducedMotion) {
  [['.feature-card, .process-card, .tool-card', 9], ['.discord-window', 5]].forEach(([selector, maxDeg]) => {
    document.querySelectorAll(selector).forEach(el => {
      el.classList.add('has-tilt');
      el.addEventListener('pointermove', event => {
        const box = el.getBoundingClientRect();
        const x = (event.clientX - box.left) / box.width - 0.5;
        const y = (event.clientY - box.top) / box.height - 0.5;
        const angle = Math.min(1, Math.hypot(x, y) * 2) * maxDeg;
        el.style.setProperty('--tilt', `${(-y).toFixed(3)} ${x.toFixed(3)} 0 ${angle.toFixed(2)}deg`);
      });
      el.addEventListener('pointerleave', () => el.style.removeProperty('--tilt'));
    });
  });

  // The red buttons follow the mouse a little while it is on them.
  document.querySelectorAll('.btn-primary').forEach(btn => {
    btn.addEventListener('pointermove', event => {
      const box = btn.getBoundingClientRect();
      btn.style.setProperty('--mgx', ((event.clientX - box.left - box.width / 2) * 0.22).toFixed(1) + 'px');
      btn.style.setProperty('--mgy', ((event.clientY - box.top - box.height / 2) * 0.32).toFixed(1) + 'px');
    });
    btn.addEventListener('pointerleave', () => {
      btn.style.removeProperty('--mgx');
      btn.style.removeProperty('--mgy');
    });
  });
}

// A burst of sparks where someone clicks "Discord beitreten". The link opens
// in a new tab, so the burst plays out on this page.
if (!reducedMotion) {
  const SPARK_COLOURS = ['#f2c14e', '#d9a520', '#e34350', '#fff3c4'];
  document.querySelectorAll('a[href*="joinourserver.com"]').forEach(link => {
    link.addEventListener('click', event => {
      let x = event.clientX;
      let y = event.clientY;
      if (!x && !y) {
        // Activated by keyboard: start from the middle of the link.
        const box = link.getBoundingClientRect();
        x = box.left + box.width / 2;
        y = box.top + box.height / 2;
      }
      const burst = document.createElement('div');
      burst.className = 'spark-burst';
      burst.style.left = x + 'px';
      burst.style.top = y + 'px';
      for (let i = 0; i < 18; i++) {
        const spark = document.createElement('span');
        const angle = (i / 18) * Math.PI * 2 + Math.random() * 0.4;
        const distance = 40 + Math.random() * 55;
        spark.style.setProperty('--dx', (Math.cos(angle) * distance).toFixed(1) + 'px');
        spark.style.setProperty('--dy', (Math.sin(angle) * distance).toFixed(1) + 'px');
        spark.style.setProperty('--spark', SPARK_COLOURS[i % SPARK_COLOURS.length]);
        burst.appendChild(spark);
      }
      document.body.appendChild(burst);
      setTimeout(() => burst.remove(), 900);
    });
  });
}
