// ============================================================
// SITE CONFIG — the knobs you'll actually want to change live here
// ============================================================
const CONFIG = {
  // Path to your background music file. Drop the file into
  // assets/audio/ and point this at it. Any browser-playable
  // audio format works (mp3, ogg, m4a...).
  musicSrc: 'assets/audio/bg-music.mp3',

  // Playback volume, 0.0 (silent) to 1.0 (full volume).
  musicVolume: 0.4,
};

// Mobile menu toggle
const hamburger = document.getElementById('hamburger');
const mobileMenu = document.getElementById('mobileMenu');

hamburger.addEventListener('click', () => {
  mobileMenu.classList.toggle('show');
});

mobileMenu.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => mobileMenu.classList.remove('show'));
});

// Active nav link on scroll
const sections = document.querySelectorAll('section, footer');
const navLinks = document.querySelectorAll('.nav-link');

window.addEventListener('scroll', () => {
  let current = '';
  sections.forEach(section => {
    const sectionTop = section.offsetTop - 150;
    if (window.scrollY >= sectionTop) {
      current = section.getAttribute('id');
    }
  });

  navLinks.forEach(link => {
    link.classList.remove('active');
    if (link.getAttribute('href') === `#${current}`) {
      link.classList.add('active');
    }
  });

  // Back to top button
  const backToTop = document.getElementById('backToTop');
  if (window.scrollY > 400) {
    backToTop.classList.add('show');
  } else {
    backToTop.classList.remove('show');
  }
});

document.getElementById('backToTop').addEventListener('click', () => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

// ===== Theme toggle (light/dark) =====
const themeToggle = document.getElementById('themeToggle');
const root = document.documentElement;

themeToggle.addEventListener('click', () => {
  const isLight = root.getAttribute('data-theme') === 'light';
  const next = isLight ? 'dark' : 'light';
  root.setAttribute('data-theme', next);
  localStorage.setItem('vvr-theme', next);
});

// ===== Accent color settings panel =====
const settingsToggle = document.getElementById('settingsToggle');
const settingsPanel = document.getElementById('settingsPanel');
const accentDots = document.querySelectorAll('.accent-dot');

settingsToggle.addEventListener('click', (e) => {
  e.stopPropagation();
  const isOpen = settingsPanel.classList.toggle('show');
  settingsToggle.setAttribute('aria-expanded', isOpen);
});

document.addEventListener('click', (e) => {
  if (!settingsPanel.contains(e.target) && e.target !== settingsToggle) {
    settingsPanel.classList.remove('show');
    settingsToggle.setAttribute('aria-expanded', 'false');
  }
});

// Reflect saved accent as the active dot on load
const savedAccent = localStorage.getItem('vvr-accent') || 'default';
accentDots.forEach(dot => {
  dot.classList.toggle('active', dot.dataset.accentChoice === savedAccent);
  dot.addEventListener('click', () => {
    const choice = dot.dataset.accentChoice;
    if (choice === 'default') {
      root.removeAttribute('data-accent');
    } else {
      root.setAttribute('data-accent', choice);
    }
    localStorage.setItem('vvr-accent', choice);
    accentDots.forEach(d => d.classList.remove('active'));
    dot.classList.add('active');
  });
});

// ===== Background music toggle =====
const musicToggle = document.getElementById('musicToggle');
const bgMusic = document.getElementById('bgMusic');
bgMusic.src = CONFIG.musicSrc;
bgMusic.volume = CONFIG.musicVolume;

musicToggle.addEventListener('click', () => {
  if (bgMusic.paused) {
    bgMusic.play().catch(() => {
      // No audio file at CONFIG.musicSrc yet, or the browser blocked it —
      // keep the icon showing "muted" either way.
      musicToggle.classList.add('is-muted');
    });
    musicToggle.classList.remove('is-muted');
  } else {
    bgMusic.pause();
    musicToggle.classList.add('is-muted');
  }
});

// ===== Custom ring cursor =====
const cursorDot = document.querySelector('.cursor-dot');
const cursorRing = document.querySelector('.cursor-ring');

if (cursorDot && cursorRing && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
  let mouseX = 0, mouseY = 0;
  let ringX = 0, ringY = 0;

  window.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    cursorDot.style.left = `${mouseX}px`;
    cursorDot.style.top = `${mouseY}px`;
  });

  // The ring eases toward the pointer each frame for a slight trailing feel
  function animateRing() {
    ringX += (mouseX - ringX) * 0.18;
    ringY += (mouseY - ringY) * 0.18;
    cursorRing.style.left = `${ringX}px`;
    cursorRing.style.top = `${ringY}px`;
    requestAnimationFrame(animateRing);
  }
  animateRing();

  const hoverTargets = 'a, button, .badge, .stack-tile, input, textarea';
  document.querySelectorAll(hoverTargets).forEach(el => {
    el.addEventListener('mouseenter', () => cursorRing.classList.add('is-hovering'));
    el.addEventListener('mouseleave', () => cursorRing.classList.remove('is-hovering'));
  });
}