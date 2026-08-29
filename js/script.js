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
// COCKPIT DEPTH SYSTEM — star field + central parallax engine
// ------------------------------------------------------------
// A single camera/head-movement simulation:
//   .bg-stars  -> many tiny distant stars          (depth 0.3)
//   .bg-mid    -> fewer, larger midground specks   (depth 0.65)
//   .bg-hud    -> near-field cockpit HUD           (depth 1)
//   hero foreground (portrait + chips)             (shallow, ~9-13px)
//
// ONE requestAnimationFrame loop drives every parallax layer.
// Depth is applied ONCE in JS (--px/--py are already depth-scaled
// per layer); CSS merely consumes the custom properties, so there is
// no JS+CSS double multiplication. Disabled for coarse pointers and
// prefers-reduced-motion (static depth remains).
// ============================================================
(function () {
  const isFinePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const starLayer = document.querySelector('.bg-stars');
  const midLayer = document.querySelector('.bg-mid');
  if (!starLayer || !midLayer) return;

  const R = 0.9; // keep stars inside a soft safe region

  const stars = [];
  const particles = [];

  // Theme-aware palettes so light mode keeps a cool, atmospheric sky
  // instead of dark chips on an off-white background. (See also the
  // cyber-streams re-theme below.)
  const STAR_PAL = {
    dark:  ['rgba(214,226,245,', 'rgba(176,205,240,', 'rgba(150,190,225,', 'rgba(120,175,255,'],
    light: ['rgba(70,96,128,',   'rgba(92,122,158,',  'rgba(120,150,190,', 'rgba(150,178,210,']
  };
  const PARTICLE_PAL = {
    dark:  ['rgba(172,214,255,', 'rgba(140,190,240,'],
    light: ['rgba(110,150,195,', 'rgba(140,172,214,']
  };
  function isLight() {
    return document.documentElement.getAttribute('data-theme') === 'light';
  }

  // ----- Build distant stars (mobile uses fewer) -----
  const starCount = window.innerWidth < 700 ? 70 : (window.innerWidth < 1200 ? 130 : 190);
  const frag = document.createDocumentFragment();
  for (let i = 0; i < starCount; i++) {
    const s = document.createElement('i');
    s.className = 'bg-star';
    const size = Math.random() < 0.85 ? 1 + Math.random() : 2 + Math.random() * 1.5;
    const bright = Math.random();
    s.style.setProperty('--x', (Math.random() * 100 * R + (100 - 100 * R) / 2) + '%');
    s.style.setProperty('--y', (Math.random() * 100 * R + (100 - 100 * R) / 2) + '%');
    s.style.setProperty('--s', `${size}px`);
    s.style.setProperty('--o', (0.35 + bright * 0.6).toFixed(2));
    s.style.setProperty('--tw', `${3 + Math.random() * 7}s`);
    s.style.setProperty('--td', `${Math.random() * 6}s`);
    frag.appendChild(s);
    stars.push(s);
  }
  starLayer.appendChild(frag);

  // ----- Build midground particles (mobile uses fewer) -----
  const midCount = window.innerWidth < 700 ? 14 : (window.innerWidth < 1200 ? 22 : 30);
  const mfrag = document.createDocumentFragment();
  for (let i = 0; i < midCount; i++) {
    const p = document.createElement('i');
    p.className = 'bg-particle';
    p.style.setProperty('--x', (Math.random() * 80 + 10) + '%');
    p.style.setProperty('--y', (Math.random() * 80 + 10) + '%');
    p.style.setProperty('--s', `${2 + Math.random() * 2.5}px`);
    p.style.setProperty('--o', (0.5 + Math.random() * 0.4).toFixed(2));
    p.style.setProperty('--drift', `${20 + Math.random() * 22}s`);
    p.style.setProperty('--drift-y', `${-(6 + Math.random() * 16)}px`);
    p.style.setProperty('--td', `${Math.random() * 8}s`);
    mfrag.appendChild(p);
    particles.push(p);
  }
  midLayer.appendChild(mfrag);

  // Recolour the generated specks when the theme changes.
  function applyFieldTheme() {
    const light = isLight();
    const sp = light ? STAR_PAL.light : STAR_PAL.dark;
    const pp = light ? PARTICLE_PAL.light : PARTICLE_PAL.dark;
    stars.forEach((s, i) => {
      s.style.setProperty('--c', sp[(Math.random() * sp.length) | 0] + (light ? (0.35) : (0.35 + Math.random() * 0.6)).toFixed(2) + ')');
    });
    particles.forEach((p, i) => {
      p.style.setProperty('--c', pp[(Math.random() * pp.length) | 0] + (0.4 + Math.random() * 0.35).toFixed(2) + ')');
    });
  }
  applyFieldTheme();
  window.__applyFieldTheme = applyFieldTheme;

  // ----- Central parallax engine (single rAF loop) -----
  if (!isFinePointer || reduced) return;

  // Background depth layers: base(14px) * depth(0.3/0.65/1)
  const bgLayers = Array.from(document.querySelectorAll('.bg-layer[data-depth]'));
  // Foreground decorative elements (hero portrait + chips), ~9-13px
  const fgElements = Array.from(document.querySelectorAll('.portrait-frame, .floating-chip'));

  const BASE = 14;          // background base mouse offset in px
  const FG_STRENGTH = 9;    // foreground base, shallower than the HUD
  let tx = 0, ty = 0, cx = 0, cy = 0;
  let raf = null;

  window.addEventListener('mousemove', (e) => {
    tx = (e.clientX / window.innerWidth - 0.5) * 2;   // -1..1
    ty = (e.clientY / window.innerHeight - 0.5) * 2;  // -1..1
    if (!raf) raf = requestAnimationFrame(tick);
  }, { passive: true });

  function tick() {
    cx += (tx - cx) * 0.06;
    cy += (ty - cy) * 0.06;

    // Background: apply depth ONCE per layer in JS
    bgLayers.forEach(l => {
      const d = parseFloat(l.dataset.depth) || 0;
      l.style.setProperty('--px', (cx * BASE * d).toFixed(1) + 'px');
      l.style.setProperty('--py', (cy * BASE * d).toFixed(1) + 'px');
    });

    // Foreground: shallow, slightly deeper than HUD, subtle spread
    fgElements.forEach((el, i) => {
      const d = 1 + i * 0.12;
      el.style.setProperty('--par-x', ((cx * FG_STRENGTH * d)).toFixed(1) + 'px');
      el.style.setProperty('--par-y', ((cy * FG_STRENGTH * d)).toFixed(1) + 'px');
    });

    if (Math.abs(tx - cx) > 0.002 || Math.abs(ty - cy) > 0.002) {
      raf = requestAnimationFrame(tick);
    } else {
      raf = null;
    }
  }
})();

// ============================================================
// AI/ML NOTATION FIELD — faint mathematical / ML notation that
// drifts slowly behind the content (no second parallax engine:
// the container rides the existing parallax via data-depth, and
// each token moves independently through pure CSS animation).
// Sparse + extremely faint by design. Purely decorative — the
// symbols are ambient texture, not claims about expertise.
// ============================================================
(function () {
  const field = document.querySelector('.bg-notation');
  if (!field) return;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const NOTATION = [
    'Σ', '∫', '∇', 'θ', 'λ', 'α', '∂L/∂θ',
    'P(x)', 'P(y|x)', 'argmax', 'f(x)',
    'RAG', 'LLM', 'CV', 'NLP', 'MLOps',
    'embed', 'latent', 'vector', 'attention',
    'loss', 'gradient', '[A]', 'x ∈ ℝⁿ', 'h(x)'
  ];

  // Three gentle depth bands: far (blurred, faint) → near (sharper).
  const bands = [
    { count: 6, minO: 0.05, maxO: 0.09, minSize: 13, maxSize: 22, blur: 1.5 },
    { count: 5, minO: 0.07, maxO: 0.13, minSize: 17, maxSize: 26, blur: 0.6 },
    { count: 3, minO: 0.09, maxO: 0.15, minSize: 22, maxSize: 32, blur: 0 }
  ];
  function bandCounts() {
    if (window.innerWidth < 700) {
      // mobile: 3–6 total, mostly mid/near (fewer, still clear)
      return [{ ...bands[2], count: 2 }, { ...bands[1], count: 2 }, { count: 0 }];
    }
    return bands;
  }

  const frag = document.createDocumentFragment();
  const tokens = [];
  function build() {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const palette = reduced || document.documentElement.getAttribute('data-theme') === 'light'
      ? { base: 'rgba(30,72,110,', accent: 'rgba(13,122,168,' }
      : { base: 'rgba(120,160,210,', accent: 'rgba(110,190,235,' };
    // stagger the alpha so a few tokens get a faint cyan accent
    frag.replaceChildren();
    tokens.length = 0;
    bandCounts().forEach((band, bi) => {
      for (let i = 0; i < band.count; i++) {
        const t = document.createElement('span');
        t.className = 'nt-token' + ' nt-token--' + (bi === 0 ? 'far' : bi === 1 ? 'mid' : 'near');
        t.textContent = NOTATION[(Math.random() * NOTATION.length) | 0];
        const alpha = band.minO + Math.random() * (band.maxO - band.minO);
        const accent = Math.random() < 0.25;
        const col = accent ? palette.accent : palette.base;
        t.style.setProperty('--nt-o', (alpha + (reduced ? 0.06 : 0)).toFixed(3));
        t.style.setProperty('--c', col + alpha.toFixed(3) + ')');
        t.style.setProperty('--s', (band.minSize + Math.random() * (band.maxSize - band.minSize)).toFixed(0) + 'px');
        t.style.setProperty('--nt-x', (Math.random() < 0.5 ? -1 : 1) * (30 + Math.random() * 60) + 'px');
        t.style.setProperty('--nt-y', (Math.random() < 0.5 ? -1 : 1) * (18 + Math.random() * 40) + 'px');
        t.style.setProperty('--nt-d', (40 + Math.random() * 50).toFixed(0) + 's');
        t.style.setProperty('--nt-delay', (-(Math.random() * 60)).toFixed(0) + 's');
        t.style.left = (Math.random() * 88 + 6) + '%';
        t.style.top = (Math.random() * 90 + 5) + '%';
        if (band.blur) t.style.filter = 'blur(' + band.blur + 'px)';
        frag.appendChild(t);
        tokens.push(t);
      }
    });
    field.appendChild(frag);
    if (reduced) field.classList.add('nt-static');
  }

  function applyNotationTheme() {
    if (reduced) return;
    const light = document.documentElement.getAttribute('data-theme') === 'light';
    const base = light ? 'rgba(40,84,122,' : 'rgba(126,164,214,';
    const accent = light ? 'rgba(13,122,168,' : 'rgba(120,195,238,';
    tokens.forEach(t => {
      const o = parseFloat(t.style.getPropertyValue('--nt-o')) || 0.1;
      t.style.setProperty('--c', (Math.random() < 0.25 ? accent : base) + o.toFixed(3) + ')');
    });
  }
  build();
  window.__applyNotationTheme = applyNotationTheme;
})();


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
// COCKPIT BOOT-UP (hero) + SYSTEM STATUS
// Reveals the hero's .boot-step elements in sequence so the page
// "initializes" like a console coming online. Respects
// prefers-reduced-motion by revealing everything at once.
// ============================================================
(function () {
  const bootSteps = document.querySelectorAll('.boot-step');
  const sysState = document.getElementById('sysState');
  if (!bootSteps.length) return;

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const bootMessages = [
    'BOOT_SEQUENCE',
    'LOADING ENV...',
    'CALIBRATING HUD...',
    'CONNECTING AI CORE...',
    'SYSTEM READY',
    'SYSTEM ONLINE',
    'SYSTEM ONLINE'
  ];

  function setState(i) {
    if (sysState && bootMessages[i]) sysState.textContent = bootMessages[i];
  }

  if (reduced) {
    bootSteps.forEach(el => el.classList.add('is-up'));
    if (sysState) sysState.textContent = 'SYSTEM ONLINE';
    return;
  }

  // First boot step appears immediately (after the preloader starts its
  // fade, ~950ms), then each subsequent step follows at a steady cadence.
  bootSteps.forEach((step, i) => {
    setTimeout(() => {
      step.classList.add('is-up');
      setState(i);
    }, 950 + i * 240);
  });

  // Final lock-in message once the last step is in.
  setTimeout(() => {
    if (sysState) sysState.textContent = 'SYSTEM ONLINE';
  }, 950 + bootSteps.length * 240);
})();

// ============================================================
// CYBER DATA STREAMS (decorative background telemetry)
// Sparse, very-low-opacity hexadecimal / node markers that drift
// slowly through the peripheral areas of the viewport. Pure
// atmosphere — not real data. Disabled/reduced under
// prefers-reduced-motion (kept static instead).
// ============================================================
(function () {
  const streams = document.querySelector('.cyber-streams');
  if (!streams) return;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  // Fewer streams on small screens.
  const count = window.innerWidth < 700 ? 10 : 18;
  const tokens = [
    '0x7A21', '01011', 'SYS_04', 'NODE_07', 'AI_CORE', 'DATA_SYNC',
    '0x3F9C', '10110', 'NODE_02', 'CH_09', 'TELEMETRY', '0xBE27',
    'AGENT_01', 'PIPE_03', 'SYNC', 'SEC_02', '0xF0A8', 'LINK_05'
  ];
  const lines = [];
  const frag = document.createDocumentFragment();
  for (let i = 0; i < count; i++) {
    const s = document.createElement('i');
    s.className = 'cs-line';
    s.textContent = tokens[(Math.random() * tokens.length) | 0];
    // peripheral edges / corners mostly
    const left = Math.random() < 0.7
      ? (Math.random() < 0.5 ? Math.random() * 14 : 86 + Math.random() * 10)
      : Math.random() * 100;
    s.style.setProperty('--cs-r', (8 + Math.random() * 18).toFixed(0) + 'vh');
    s.style.setProperty('--cs-o', (0.2 + Math.random() * 0.3).toFixed(2));
    s.style.setProperty('--cs-t', (34 + Math.random() * 40).toFixed(0) + 's');
    s.style.setProperty('--cs-d', (-(Math.random() * 60)).toFixed(0) + 's');
    s.style.left = left + '%';
    s.style.top = (Math.random() * 100) + '%';
    frag.appendChild(s);
    lines.push(s);
  }
  streams.appendChild(frag);
  if (reduced) streams.classList.add('cs-static');

  // Theme-aware tint: soft green drop in dark cockpit, a deeper readable
  // green-slate on the bright daylight background.
  function reTheme() {
    const light = document.documentElement.getAttribute('data-theme') === 'light';
    streams.classList.toggle('is-light', light);
  }
  reTheme();
  window.__applyStreamTheme = reTheme;
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
    if (typeof window.__applyFieldTheme === 'function') window.__applyFieldTheme();
    if (typeof window.__applyStreamTheme === 'function') window.__applyStreamTheme();
    if (typeof window.__applyNotationTheme === 'function') window.__applyNotationTheme();
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
  // Cycle the trail through the HUD palette (cyan/blue/off-white) instead of
  // a generic hue sweep.
  const TRAIL_COLORS = ['#1A5F8F', '#43C6F6', '#6BE4FF', '#F5B84B', '#2aa6c9', '#8fd6ff', '#D6E2EE'];

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

// ============================================================
// SCRIPT READY — progressive enhancement gate
// Marking the document as .js only once the script has finished
// running lets the CSS keep content visible by default (no-JS / JS
// failure safe) while still enabling the reveal + boot animations.
// ============================================================
document.documentElement.classList.add('js');
