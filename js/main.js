'use strict';

/* =============================================
   DARK MODE
   ============================================= */

const html = document.documentElement;
const themeToggle = document.getElementById('theme-toggle');

function getSystemTheme() {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function applyTheme(theme) {
  html.setAttribute('data-theme', theme);
  localStorage.setItem('theme', theme);
  themeToggle.setAttribute('aria-label',
    theme === 'dark' ? 'Mudar para modo claro' : 'Mudar para modo escuro'
  );
}

(function initTheme() {
  applyTheme(localStorage.getItem('theme') || 'light');
})();

themeToggle.addEventListener('click', () => {
  applyTheme(html.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
});

/* =============================================
   NAVBAR SCROLL + ACTIVE LINK
   ============================================= */

const navbar = document.getElementById('navbar');

let sectionCache = [];

function buildSectionCache() {
  sectionCache = Array.from(document.querySelectorAll('section[id]')).map(s => ({
    id: s.id,
    top: s.offsetTop,
    bottom: s.offsetTop + s.offsetHeight,
  }));
}

function updateActiveLink() {
  const scrollY = window.scrollY + 120;
  sectionCache.forEach(({ id, top, bottom }) => {
    const link = document.querySelector(`.navbar__nav a[href="#${id}"]`);
    if (!link) return;
    link.classList.toggle('active', scrollY >= top && scrollY < bottom);
  });
}

buildSectionCache();
window.addEventListener('resize', buildSectionCache, { passive: true });

window.addEventListener('scroll', () => {
  navbar.classList.toggle('scrolled', window.scrollY > 20);
  updateActiveLink();
}, { passive: true });

/* =============================================
   MOBILE MENU
   ============================================= */

const hamburger = document.getElementById('hamburger');
const navMenu   = document.getElementById('nav-menu');

function closeMenu() {
  navMenu.classList.remove('open');
  hamburger.classList.remove('open');
  hamburger.setAttribute('aria-expanded', 'false');
  hamburger.setAttribute('aria-label', 'Abrir menu');
}

hamburger.addEventListener('click', () => {
  const isOpen = navMenu.classList.toggle('open');
  hamburger.classList.toggle('open', isOpen);
  hamburger.setAttribute('aria-expanded', String(isOpen));
  hamburger.setAttribute('aria-label', isOpen ? 'Fechar menu' : 'Abrir menu');
});

navMenu.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));

document.addEventListener('click', (e) => {
  if (!navbar.contains(e.target) && navMenu.classList.contains('open')) closeMenu();
});

/* =============================================
   SMOOTH SCROLL (âncoras)
   ============================================= */

document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', (e) => {
    const target = document.querySelector(anchor.getAttribute('href'));
    if (!target) return;
    e.preventDefault();
    const offset = parseInt(getComputedStyle(html).getPropertyValue('--nav-h'), 10) || 72;
    window.scrollTo({ top: target.getBoundingClientRect().top + window.scrollY - offset, behavior: 'smooth' });
  });
});

/* =============================================
   ANIMAÇÕES DE ENTRADA
   ============================================= */

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

/* =============================================
   FAQ ACCORDION
   ============================================= */

document.querySelectorAll('.faq-item__btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const item = btn.closest('.faq-item');
    const body = item.querySelector('.faq-item__body');
    const isOpen = item.classList.contains('open');
    const list = item.closest('.faq__list, .accordion-list');

    (list || document).querySelectorAll('.faq-item.open').forEach(open => {
      if (open !== item) {
        open.classList.remove('open');
        open.querySelector('.faq-item__btn').setAttribute('aria-expanded', 'false');
        open.querySelector('.faq-item__body').style.maxHeight = '0';
      }
    });

    item.classList.toggle('open', !isOpen);
    btn.setAttribute('aria-expanded', String(!isOpen));
    body.style.maxHeight = isOpen ? '0' : body.scrollHeight + 'px';
  });
});

/* =============================================
   DRAWER DE SERVIÇOS
   ============================================= */

const drawerOverlay = document.getElementById('drawer-overlay');
let activeDrawer = null;

function openDrawer(id) {
  const drawer = document.getElementById(`drawer-${id}`);
  if (!drawer) return;

  if (activeDrawer) closeDrawer();

  activeDrawer = drawer;
  drawer.classList.add('open');
  drawer.setAttribute('aria-hidden', 'false');
  drawerOverlay.classList.add('active');
  drawerOverlay.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';

  const firstFocusable = drawer.querySelector('button, a[href]');
  if (firstFocusable) firstFocusable.focus();
}

function closeDrawer() {
  if (!activeDrawer) return;
  activeDrawer.classList.remove('open');
  activeDrawer.setAttribute('aria-hidden', 'true');
  drawerOverlay.classList.remove('active');
  drawerOverlay.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
  activeDrawer = null;
}

document.querySelectorAll('[data-drawer]').forEach(btn => {
  btn.addEventListener('click', () => openDrawer(btn.dataset.drawer));
});

document.querySelectorAll('.drawer__close').forEach(btn => {
  btn.addEventListener('click', closeDrawer);
});

if (drawerOverlay) drawerOverlay.addEventListener('click', closeDrawer);

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && activeDrawer) closeDrawer();
});

/* =============================================
   FORMULÁRIO DE CONTATO (Web3Forms)
   ============================================= */

const form = document.getElementById('contact-form');
const formBtn = document.getElementById('form-btn');
const formFeedback = document.getElementById('form-feedback');

function showFeedback(type, message) {
  formFeedback.className = `form-feedback ${type}`;
  formFeedback.textContent = message;
  formFeedback.style.display = 'block';
  formFeedback.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function validateForm() {
  let valid = true;
  form.querySelectorAll('[required]').forEach(field => {
    field.classList.remove('error');
    if (!field.value.trim()) { field.classList.add('error'); valid = false; }
  });
  const emailField = form.querySelector('#email');
  if (emailField?.value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailField.value)) {
    emailField.classList.add('error'); valid = false;
  }
  return valid;
}

if (form) form.addEventListener('submit', async (e) => {
  e.preventDefault();
  formFeedback.style.display = 'none';

  if (!validateForm()) {
    showFeedback('error', 'Por favor, preencha todos os campos obrigatórios corretamente.');
    return;
  }

  // Copia o email do visitante para o campo replyto
  const emailField = form.querySelector('#email');
  const replytoField = form.querySelector('#replyto-field');
  if (emailField && replytoField) replytoField.value = emailField.value;

  formBtn.disabled = true;
  formBtn.textContent = 'Enviando...';

  try {
    const response = await fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      body: new FormData(form),
      headers: { Accept: 'application/json' },
    });
    const json = await response.json().catch(() => ({}));
    if (response.ok && json.success) {
      showFeedback('success', '✓ Mensagem enviada com sucesso! Em breve entrarei em contato.');
      form.reset();
    } else {
      showFeedback('error', json.message || 'Ocorreu um erro. Tente novamente.');
    }
  } catch {
    showFeedback('error', 'Falha na conexão. Por favor, entre em contato pelo WhatsApp.');
  } finally {
    formBtn.disabled = false;
    formBtn.textContent = 'Enviar mensagem';
  }
});

if (form) form.querySelectorAll('input, textarea').forEach(f => f.addEventListener('input', () => f.classList.remove('error')));

/* =============================================
   CONTAGEM ANIMADA NAS STATS DO HERO
   ============================================= */


/* =============================================
   FOOTER ANO
   ============================================= */

const yearEl = document.getElementById('footer-year');
if (yearEl) yearEl.textContent = new Date().getFullYear();

/* =============================================
   MODAL BIO
   ============================================= */

(function () {
  const overlay = document.getElementById('bio-modal');
  if (!overlay) return;

  const openTriggers = document.querySelectorAll('[data-modal="bio-modal"]');
  const closeTriggers = overlay.querySelectorAll('[data-modal-close]');

  function openModal() {
    overlay.hidden = false;
    overlay.removeAttribute('hidden');
    document.body.style.overflow = 'hidden';
    overlay.querySelector('.bio-modal__close').focus();
  }

  function closeModal() {
    overlay.hidden = true;
    document.body.style.overflow = '';
  }

  openTriggers.forEach(btn => btn.addEventListener('click', openModal));
  closeTriggers.forEach(btn => btn.addEventListener('click', closeModal));

  overlay.addEventListener('click', e => { if (e.target === overlay) closeModal(); });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && !overlay.hidden) closeModal();
  });
}());
