/* ============================================================
   THE LAST LIGHT — script.js
   ============================================================ */

'use strict';

/* ── CUSTOM CURSOR ── */
const dot  = document.querySelector('.cursor-dot');
const ring = document.querySelector('.cursor-ring');
let mouseX = 0, mouseY = 0, ringX = 0, ringY = 0;

document.addEventListener('mousemove', e => {
  mouseX = e.clientX; mouseY = e.clientY;
  dot.style.left  = mouseX + 'px';
  dot.style.top   = mouseY + 'px';
});
(function animateRing() {
  ringX += (mouseX - ringX) * .14;
  ringY += (mouseY - ringY) * .14;
  ring.style.left = ringX + 'px';
  ring.style.top  = ringY + 'px';
  requestAnimationFrame(animateRing);
})();
document.querySelectorAll('a, button, .audio-orb, .comic-frame, .audio-progress-wrap, .volume-slider')
  .forEach(el => {
    el.addEventListener('mouseenter', () => {
      ring.style.width  = '50px';
      ring.style.height = '50px';
      ring.style.borderColor = 'rgba(240,198,116,.7)';
    });
    el.addEventListener('mouseleave', () => {
      ring.style.width  = '32px';
      ring.style.height = '32px';
      ring.style.borderColor = 'rgba(77,238,255,.55)';
    });
  });

/* ── SCROLL PROGRESS BAR ── */
const progressBar = document.getElementById('progress-bar');
function updateProgress() {
  const scroll = window.scrollY;
  const height = document.documentElement.scrollHeight - window.innerHeight;
  progressBar.style.width = (scroll / height * 100) + '%';
}
window.addEventListener('scroll', updateProgress, { passive: true });

/* ── NAV SCROLL CLASS ── */
const nav = document.querySelector('nav');
window.addEventListener('scroll', () => {
  nav.classList.toggle('scrolled', window.scrollY > 60);
}, { passive: true });

/* ── PARTICLES / FIREFLIES ── */
const canvas = document.getElementById('particles-canvas');
const ctx    = canvas.getContext('2d');
let W = canvas.width  = window.innerWidth;
let H = canvas.height = window.innerHeight;
window.addEventListener('resize', () => {
  W = canvas.width  = window.innerWidth;
  H = canvas.height = window.innerHeight;
  initParticles();
});

const PARTICLE_COUNT = 90;
const particles = [];

function randomParticle(index) {
  const type = Math.random() < .3 ? 'firefly' : 'dust';
  return {
    x: Math.random() * W,
    y: Math.random() * H,
    vx: (Math.random() - .5) * (type === 'firefly' ? .45 : .2),
    vy: (Math.random() - .5) * (type === 'firefly' ? .45 : .12) - .08,
    size: type === 'firefly' ? Math.random() * 2.4 + 1 : Math.random() * 1.2 + .3,
    alpha: Math.random(),
    alphaDir: Math.random() < .5 ? 1 : -1,
    alphaSpeed: Math.random() * .008 + .003,
    color: type === 'firefly'
      ? `rgba(77,238,255,{A})`
      : `rgba(${Math.random() < .5 ? '77,238,255' : '240,198,116'},{A})`,
    type,
  };
}
function initParticles() {
  particles.length = 0;
  for (let i = 0; i < PARTICLE_COUNT; i++) particles.push(randomParticle(i));
}
initParticles();

function drawParticles() {
  ctx.clearRect(0, 0, W, H);
  particles.forEach(p => {
    p.alpha += p.alphaDir * p.alphaSpeed;
    if (p.alpha <= 0 || p.alpha >= 1) p.alphaDir *= -1;
    p.x += p.vx; p.y += p.vy;
    if (p.x < -5) p.x = W + 5;
    if (p.x > W + 5) p.x = -5;
    if (p.y < -5) p.y = H + 5;
    if (p.y > H + 5) p.y = -5;

    const a = Math.max(0, Math.min(1, p.alpha));
    const color = p.color.replace('{A}', a);

    if (p.type === 'firefly') {
      ctx.beginPath();
      const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 4);
      g.addColorStop(0, color);
      g.addColorStop(1, 'transparent');
      ctx.fillStyle = g;
      ctx.arc(p.x, p.y, p.size * 4, 0, Math.PI * 2);
      ctx.fill();

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
    } else {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
    }
  });
  requestAnimationFrame(drawParticles);
}
drawParticles();

/* ── WAVEFORM BARS ── */
const waveform = document.querySelector('.waveform');
const BAR_COUNT = 38;
for (let i = 0; i < BAR_COUNT; i++) {
  const bar = document.createElement('div');
  bar.className = 'wave-bar';
  const h = 8 + Math.abs(Math.sin(i * .42)) * 32;
  bar.style.height = h + 'px';
  bar.style.setProperty('--i', i);
  bar.style.animationDuration = (.8 + Math.random() * .8) + 's';
  waveform.appendChild(bar);
}

/* ── AUDIO PLAYER ── */
const audio           = document.getElementById('main-audio');
const orbBtn          = document.getElementById('orb-btn');
const orbWrap         = document.getElementById('orb-wrap');
const orbIcon         = document.getElementById('orb-icon');
const progressFill    = document.querySelector('.audio-progress-fill');
const progressWrapper = document.querySelector('.audio-progress-wrap');
const timeCurrentEl   = document.getElementById('time-current');
const timeTotalEl     = document.getElementById('time-total');
const volumeSlider    = document.querySelector('.volume-slider');

let isPlaying = false;

function formatTime(s) {
  if (!s || isNaN(s)) return '0:00';
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

const PLAY_ICON = `<path d="M8 5v14l11-7z"/>`;
const PAUSE_ICON = `<path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>`;

function setPlayIcon(playing) {
  orbIcon.innerHTML = `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">${playing ? PAUSE_ICON : PLAY_ICON}</svg>`;
}
setPlayIcon(false);

orbBtn.addEventListener('click', () => {
  if (isPlaying) {
    audio.pause();
    isPlaying = false;
    orbWrap.classList.remove('audio-playing');
    document.querySelector('.waveform').parentElement.classList.remove('audio-playing');
  } else {
    audio.play().catch(() => {});
    isPlaying = true;
    orbWrap.classList.add('audio-playing');
    document.querySelector('.waveform').parentElement.classList.add('audio-playing');
  }
  setPlayIcon(isPlaying);
});

// Inherit playing state on waveform container
const audioSection = document.getElementById('audio-section');
function refreshAudioClass() {
  if (isPlaying) audioSection.classList.add('audio-playing');
  else           audioSection.classList.remove('audio-playing');
}

audio.addEventListener('timeupdate', () => {
  if (!audio.duration) return;
  const pct = (audio.currentTime / audio.duration) * 100;
  progressFill.style.width = pct + '%';
  timeCurrentEl.textContent = formatTime(audio.currentTime);
  refreshAudioClass();
});
audio.addEventListener('loadedmetadata', () => {
  timeTotalEl.textContent = formatTime(audio.duration);
});
audio.addEventListener('ended', () => {
  isPlaying = false;
  setPlayIcon(false);
  orbWrap.classList.remove('audio-playing');
  audioSection.classList.remove('audio-playing');
  progressFill.style.width = '0%';
  timeCurrentEl.textContent = '0:00';
});

progressWrapper.addEventListener('click', e => {
  const rect = progressWrapper.getBoundingClientRect();
  const pct  = (e.clientX - rect.left) / rect.width;
  if (audio.duration) audio.currentTime = pct * audio.duration;
});

volumeSlider.addEventListener('input', () => {
  audio.volume = volumeSlider.value;
});
audio.volume = volumeSlider.value;

/* ── LIGHTBOX ── */
const lightbox      = document.getElementById('lightbox');
const lightboxClose = document.getElementById('lightbox-close');
const comicImg      = document.querySelector('.comic-frame img');
const lightboxImg   = document.querySelector('#lightbox img');

comicImg.addEventListener('click', () => {
  lightboxImg.src = comicImg.src;
  lightbox.classList.add('open');
  document.body.style.overflow = 'hidden';
});
function closeLightbox() {
  lightbox.classList.remove('open');
  document.body.style.overflow = '';
}
lightboxClose.addEventListener('click', closeLightbox);
lightbox.addEventListener('click', e => { if (e.target === lightbox) closeLightbox(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeLightbox(); });

/* ── SCROLL REVEAL ── */
const revealEls = document.querySelectorAll('.reveal');
const io = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add('visible');
      io.unobserve(e.target);
    }
  });
}, { threshold: .12 });
revealEls.forEach(el => io.observe(el));

/* ── SMOOTH SCROLL FOR NAV LINKS ── */
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const target = document.querySelector(a.getAttribute('href'));
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
});

/* ── PARALLAX ON HERO BG ── */
const heroBg = document.querySelector('.hero-bg');
window.addEventListener('scroll', () => {
  const y = window.scrollY;
  if (y < window.innerHeight && heroBg) {
    heroBg.style.transform = `scale(1.08) translateY(${y * .25}px)`;
  }
}, { passive: true });