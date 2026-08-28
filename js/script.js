// ============================================================
// SITE CONFIG — the knobs you'll actually want to change live here
// ============================================================
const CONFIG = {
  // Path to your background music file. Drop the file into
  // assets/audio/ and point this at it. Any browser-playable
  // audio format works (mp3, ogg, m4a...).
  musicSrc: 'assets/bg1-music.mp3',

  // Playback volume, 0.0 (silent) to 1.0 (full volume).
  musicVolume: 0.2,
};

// ============================================================
// PRELOADER
// ============================================================
(function () {
  const preloader = document.getElementById('preloader');
  const bar = document.getElementById('preloaderBar');
  const pct = document.getElementById('preloaderPct');
  if (!preloader) return;

  document.body.style.overflow = 'hidden';
  let progress = 0;

  const timer = setInterval(() => {
    progress += Math.random() * 18;
    if (progress >= 100) progress = 100;
    bar.style.width = progress + '%';
    pct.textContent = Math.floor(progress) + '%';
    if (progress >= 100) {
      clearInterval(timer);
      setTimeout(() => {
        preloader.classList.add('hide');
        document.body.style.overflow = '';
        setTimeout(() => preloader.remove(), 650);
      }, 200);
    }
  }, 90);
})();

// ============================================================
// HEADER SCROLL STATE + SCROLL PROGRESS BAR
// ============================================================
const header = document.getElementById('siteHeader');
const scrollProgress = document.getElementById('scrollProgress');
const backToTop = document.getElementById('backToTop');
const navLinks = document.querySelectorAll('[data-nav]');
const sections = document.querySelectorAll('main section[id]');

window.addEventListener('scroll', () => {
  const scrollTop = window.scrollY;
  header.classList.toggle('is-scrolled', scrollTop > 20);
  backToTop.classList.toggle('show', scrollTop > 500);

  const docHeight = document.documentElement.scrollHeight - window.innerHeight;
  const ratio = docHeight > 0 ? scrollTop / docHeight : 0;
  scrollProgress.style.transform = `scaleX(${ratio})`;

  let current = '';
  sections.forEach(section => {
    if (scrollTop >= section.offsetTop - 160) current = section.getAttribute('id');
  });
  navLinks.forEach(link => {
    const isMatch = link.getAttribute('href') === `#${current}`;
    link.classList.toggle('is-active', isMatch && link.classList.contains('nav-link'));
  });
}, { passive: true });

backToTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

// ============================================================
// MOBILE MENU
// ============================================================
const hamburger = document.getElementById('hamburger');
const mobileMenu = document.getElementById('mobileMenu');

hamburger.addEventListener('click', () => {
  const isOpen = mobileMenu.classList.toggle('show');
  hamburger.classList.toggle('is-open', isOpen);
  hamburger.setAttribute('aria-expanded', isOpen);
});
mobileMenu.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => {
    mobileMenu.classList.remove('show');
    hamburger.classList.remove('is-open');
    hamburger.setAttribute('aria-expanded', 'false');
  });
});

// ============================================================
// SCROLL REVEAL
// ============================================================
const revealEls = document.querySelectorAll('.reveal');
if ('IntersectionObserver' in window) {
  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -60px 0px' });
  revealEls.forEach(el => io.observe(el));
} else {
  revealEls.forEach(el => el.classList.add('is-visible'));
}

// ============================================================
// PROJECT FILTER
// ============================================================
const filterBtns = document.querySelectorAll('.filter-btn');
const projectCards = document.querySelectorAll('.project-card');
const filterEmpty = document.querySelector('.filter-empty');

filterBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    const filter = btn.dataset.filter;

    filterBtns.forEach(b => {
      b.classList.toggle('is-active', b === btn);
      b.setAttribute('aria-selected', b === btn);
    });

    let visibleCount = 0;
    projectCards.forEach(card => {
      const matches = filter === 'all' || card.dataset.category === filter;
      card.classList.toggle('is-hidden', !matches);
      if (matches) visibleCount++;
    });
    filterEmpty.hidden = visibleCount > 0;
  });
});

// ============================================================
// THEME TOGGLE (light/dark)
// ============================================================
const themeToggle = document.getElementById('themeToggle');
const themeToggleIcon = document.getElementById('themeToggleIcon');
const rootEl = document.documentElement;

function syncThemeIcon() {
  if (!themeToggleIcon) return;
  const isLight = rootEl.getAttribute('data-theme') === 'light';
  themeToggleIcon.setAttribute('icon', isLight ? 'lucide:sun' : 'lucide:moon');
}
syncThemeIcon(); // reflect whatever theme was applied by the head init script

if (themeToggle) {
  themeToggle.addEventListener('click', () => {
    const isLight = rootEl.getAttribute('data-theme') === 'light';
    const next = isLight ? 'dark' : 'light';
    rootEl.setAttribute('data-theme', next);
    localStorage.setItem('vvr-theme', next);
    syncThemeIcon();
  });
}

// ============================================================
// BACKGROUND MUSIC TOGGLE
// ============================================================
const musicToggle = document.getElementById('musicToggle');
const musicToggleIcon = document.getElementById('musicToggleIcon');
const bgMusic = document.getElementById('bgMusic');

if (musicToggle && bgMusic) {
  bgMusic.src = CONFIG.musicSrc;
  bgMusic.volume = CONFIG.musicVolume;

  musicToggle.addEventListener('click', () => {
    if (bgMusic.paused) {
      bgMusic.play().then(() => {
        if (musicToggleIcon) musicToggleIcon.setAttribute('icon', 'lucide:volume-2');
      }).catch(() => {
        // No audio file at CONFIG.musicSrc yet, or the browser blocked it —
        // keep the icon showing "muted" either way.
        if (musicToggleIcon) musicToggleIcon.setAttribute('icon', 'lucide:volume-x');
      });
    } else {
      bgMusic.pause();
      if (musicToggleIcon) musicToggleIcon.setAttribute('icon', 'lucide:volume-x');
    }
  });
}

// ============================================================
// COLORFUL TRAILING CURSOR
// ============================================================
const cursorTrail = document.getElementById('cursorTrail');

if (cursorTrail && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
  const DOT_COUNT = 16;
  const dots = [];
  const positions = [];
  // Cycle the trail through the actual site palette instead of a generic hue sweep
  const TRAIL_COLORS = ['#4A20B9', '#7B44BD', '#AE7FD7', '#FF3B57', '#A41E29', '#BF5231', '#F3E9D3'];

  for (let i = 0; i < DOT_COUNT; i++) {
    const dot = document.createElement('div');
    dot.className = 'trail-dot';
    dot.style.setProperty('--dot-color', TRAIL_COLORS[i % TRAIL_COLORS.length]);
    const size = 12 - (i / DOT_COUNT) * 8;
    dot.style.setProperty('--dot-size', `${size}px`);
    dot.style.opacity = String(1 - i / DOT_COUNT * 0.85);
    cursorTrail.appendChild(dot);
    dots.push(dot);
    positions.push({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
  }

  let mouseX = window.innerWidth / 2;
  let mouseY = window.innerHeight / 2;

  window.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
  });

  function animateTrail() {
    positions[0].x += (mouseX - positions[0].x) * 0.55;
    positions[0].y += (mouseY - positions[0].y) * 0.55;

    for (let i = 1; i < DOT_COUNT; i++) {
      positions[i].x += (positions[i - 1].x - positions[i].x) * 0.45;
      positions[i].y += (positions[i - 1].y - positions[i].y) * 0.45;
    }

    dots.forEach((dot, i) => {
      dot.style.transform = `translate(${positions[i].x}px, ${positions[i].y}px) translate(-50%, -50%)`;
    });

    requestAnimationFrame(animateTrail);
  }
  animateTrail();
}

// ============================================================
// MAGNETIC BUTTONS (desktop only)
// Nudges any .btn-magnetic toward the cursor while it's within a radius
// around the button, using CSS custom properties so the button's own
// hover/active styles (translateY etc.) keep working unmodified.
// ============================================================
if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
  const MAGNET_RADIUS = 70;   // px around the button that starts pulling
  const MAGNET_STRENGTH = 0.35; // 0-1, how far it travels toward the cursor

  document.querySelectorAll('.btn-magnetic').forEach(btn => {
    let raf = null;

    btn.addEventListener('mousemove', (e) => {
      const rect = btn.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = e.clientX - cx;
      const dy = e.clientY - cy;

      if (raf) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        btn.style.setProperty('--magnet-x', `${dx * MAGNET_STRENGTH}px`);
        btn.style.setProperty('--magnet-y', `${dy * MAGNET_STRENGTH}px`);
      });
    });

    btn.addEventListener('mouseleave', () => {
      if (raf) cancelAnimationFrame(raf);
      btn.style.setProperty('--magnet-x', '0px');
      btn.style.setProperty('--magnet-y', '0px');
    });
  });
}

// ============================================================
// TILT-ON-HOVER PROJECT CARDS (desktop only)
// Rotates each .tilt-card slightly toward the cursor position within it.
// ============================================================
if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
  const TILT_MAX_DEG = 6;

  document.querySelectorAll('.tilt-card').forEach(card => {
    let raf = null;

    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const px = (e.clientX - rect.left) / rect.width;  // 0-1 across the card
      const py = (e.clientY - rect.top) / rect.height;   // 0-1 down the card

      const rotateY = (px - 0.5) * TILT_MAX_DEG * 2;
      const rotateX = (0.5 - py) * TILT_MAX_DEG * 2;

      if (raf) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        card.classList.add('is-tilting');
        card.style.setProperty('--tilt-x', `${rotateX}deg`);
        card.style.setProperty('--tilt-y', `${rotateY}deg`);
      });
    });

    card.addEventListener('mouseleave', () => {
      if (raf) cancelAnimationFrame(raf);
      card.classList.remove('is-tilting');
      card.style.setProperty('--tilt-x', '0deg');
      card.style.setProperty('--tilt-y', '0deg');
    });
  });
}

// ============================================================
// THERMAL SCAN HOVER (hero portrait, desktop only)
// The CSS handles the false-color/scanline/grain/HUD reveal on
// :hover by itself -- this just drives the live REC timer and a
// gently jittering temperature readout while the cursor is over
// the portrait, so the HUD doesn't sit frozen on one frame.
// ============================================================
const thermalFrame = document.querySelector('.portrait-frame');
const thermalTempEl = document.getElementById('thermalTemp');
const thermalRecEl = document.getElementById('thermalRec');

if (thermalFrame && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
  let recSeconds = 0;
  let recTimer = null;

  function formatRec(totalSeconds) {
    const m = String(Math.floor(totalSeconds / 60)).padStart(2, '0');
    const s = String(totalSeconds % 60).padStart(2, '0');
    return `REC 00:${m}:${s}`;
  }

  thermalFrame.addEventListener('mouseenter', () => {
    recSeconds = 0;
    if (thermalRecEl) thermalRecEl.textContent = formatRec(0);
    if (recTimer) clearInterval(recTimer);
    recTimer = setInterval(() => {
      recSeconds += 1;
      if (thermalRecEl) thermalRecEl.textContent = formatRec(recSeconds);
      if (thermalTempEl) {
        const baseTemp = 36.6;
        const jitter = (Math.random() - 0.5) * 0.4;
        thermalTempEl.textContent = `${(baseTemp + jitter).toFixed(1)}\u00B0C`;
      }
    }, 1000);
  });

  thermalFrame.addEventListener('mouseleave', () => {
    if (recTimer) clearInterval(recTimer);
    recTimer = null;
  });
}
