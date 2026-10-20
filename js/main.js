/* ==========================================================================
   НАСТРОЙКИ — поменяйте контакты здесь, они подставятся по всему сайту
   ========================================================================== */
const CONFIG = {
  telegram: 'username',          // ник в Telegram без @
  whatsapp: '79000000000',       // номер для WhatsApp, только цифры
  vk: 'username',                // адрес страницы ВКонтакте: vk.com/<это>
  phone: '+7 900 000-00-00',     // телефон, как он будет показан на сайте
};

/* ========================================================================== */

document.documentElement.classList.remove('no-js');

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- Контакты ---------- */
const contactLinks = {
  telegram: { href: `https://t.me/${CONFIG.telegram}`, text: `@${CONFIG.telegram}` },
  whatsapp: { href: `https://wa.me/${CONFIG.whatsapp}`, text: 'написать' },
  vk: { href: `https://vk.com/${CONFIG.vk}`, text: `vk.com/${CONFIG.vk}` },
  phone: { href: `tel:${CONFIG.phone.replace(/[^\d+]/g, '')}`, text: CONFIG.phone },
};

$$('[data-contact]').forEach((el) => {
  const data = contactLinks[el.dataset.contact];
  if (!data) return;
  el.href = data.href;
  // текст меняем только в списке контактов, в остальных местах — подписи
  if (el.closest('.contact__list')) el.textContent = data.text;
});

/* ---------- Шапка ---------- */
const header = $('#header');
const hero = $('.hero');
const fab = $('.fab');
const contactSection = $('#contact');
let lastY = window.scrollY;
let contactInView = false;

function onScroll() {
  const y = window.scrollY;
  const heroEnd = hero.offsetHeight - header.offsetHeight;
  const overHero = y < heroEnd;

  header.classList.toggle('is-over-hero', overHero);
  header.classList.toggle('is-scrolled', !overHero);

  const goingDown = y > lastY;
  const hide = goingDown && y > hero.offsetHeight && !document.body.classList.contains('menu-open');
  if (Math.abs(y - lastY) > 4) header.classList.toggle('is-hidden', hide);

  fab.classList.toggle('is-visible', y > hero.offsetHeight * 0.7 && !contactInView);
  lastY = y;
}

let ticking = false;
window.addEventListener('scroll', () => {
  if (ticking) return;
  ticking = true;
  requestAnimationFrame(() => { onScroll(); ticking = false; });
}, { passive: true });
onScroll();

new IntersectionObserver(([entry]) => {
  contactInView = entry.isIntersecting;
  onScroll();
}, { threshold: 0.2 }).observe(contactSection);

/* активный пункт меню */
const navLinks = $$('.nav a');
const sectionsForNav = navLinks.map((a) => $(a.getAttribute('href'))).filter(Boolean);
const navObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    navLinks.forEach((a) => a.classList.toggle('is-current', a.getAttribute('href') === `#${entry.target.id}`));
  });
}, { rootMargin: '-45% 0px -50% 0px' });
sectionsForNav.forEach((s) => navObserver.observe(s));

/* ---------- Мобильное меню ---------- */
const burger = $('.burger');
const mobileMenu = $('#mobile-menu');

function setMenu(open) {
  document.body.classList.toggle('menu-open', open);
  document.body.classList.toggle('is-locked', open);
  burger.setAttribute('aria-expanded', String(open));
  burger.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
  mobileMenu.setAttribute('aria-hidden', String(!open));
}

burger.addEventListener('click', () => setMenu(!document.body.classList.contains('menu-open')));
$$('a', mobileMenu).forEach((a) => a.addEventListener('click', () => setMenu(false)));
window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && document.body.classList.contains('menu-open')) setMenu(false);
});
window.matchMedia('(min-width: 1025px)').addEventListener('change', (e) => { if (e.matches) setMenu(false); });

/* ---------- Первый экран: слайдер ---------- */
const slides = $$('.hero__slide');
const bars = $$('.hero__bar');
const counter = $('.hero__current');
const SLIDE_TIME = 6500;
let slideIndex = 0;
let slideTimer;

document.documentElement.style.setProperty('--slide-time', `${SLIDE_TIME}ms`);

function showSlide(i) {
  slideIndex = (i + slides.length) % slides.length;
  slides.forEach((s, n) => s.classList.toggle('is-active', n === slideIndex));
  bars.forEach((b, n) => {
    b.classList.remove('is-active');
    b.classList.toggle('is-done', n < slideIndex);
  });
  void bars[slideIndex].offsetWidth; // перезапуск анимации полоски
  bars[slideIndex].classList.add('is-active');
  counter.textContent = String(slideIndex + 1).padStart(2, '0');
}

function scheduleSlide() {
  clearTimeout(slideTimer);
  if (reducedMotion) return;
  slideTimer = setTimeout(() => { showSlide(slideIndex + 1); scheduleSlide(); }, SLIDE_TIME);
}

document.addEventListener('visibilitychange', () => {
  if (document.hidden) clearTimeout(slideTimer);
  else { showSlide(slideIndex); scheduleSlide(); }
});

function markLoaded() {
  if (document.body.classList.contains('is-loaded')) return;
  document.body.classList.add('is-loaded');
  showSlide(0);
  scheduleSlide();
}
const firstHeroImg = $('.hero__slide img');
if (firstHeroImg.complete) requestAnimationFrame(markLoaded);
else firstHeroImg.addEventListener('load', markLoaded, { once: true });
setTimeout(markLoaded, 1500);

/* ---------- Появление при прокрутке ---------- */
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    entry.target.classList.add('is-visible');
    revealObserver.unobserve(entry.target);
  });
}, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });

$$('.reveal').forEach((el) => {
  // соседние элементы появляются с небольшой задержкой друг за другом
  const siblings = $$(':scope > .reveal', el.parentElement);
  const idx = siblings.indexOf(el);
  if (idx > 0) el.style.transitionDelay = `${Math.min(idx, 5) * 90}ms`;
  revealObserver.observe(el);
});

// страховка: при резком переходе по якорю элементы выше экрана тоже должны проявиться
let revealPending = $$('.reveal, .gallery__item');
function revealPassed() {
  revealPending = revealPending.filter((el) => {
    if (el.classList.contains('is-visible')) return false;
    if (el.classList.contains('is-hidden')) return true;
    if (el.getBoundingClientRect().top < window.innerHeight * 0.9) {
      el.classList.add('is-visible');
      return false;
    }
    return true;
  });
}
let revealTicking = false;
window.addEventListener('scroll', () => {
  if (revealTicking || !revealPending.length) return;
  revealTicking = true;
  requestAnimationFrame(() => { revealPassed(); revealTicking = false; });
}, { passive: true });

/* ---------- Портфолио: фильтр ---------- */
const galleryItems = $$('.gallery__item');
const filters = $$('.filter');

galleryItems.forEach((item, i) => {
  item.tabIndex = 0;
  item.setAttribute('role', 'button');
  item.setAttribute('aria-label', `Открыть фото: ${$('img', item).alt}`);
  item.style.transitionDelay = `${(i % 3) * 80}ms`;
  revealObserver.observe(item);
});

filters.forEach((btn) => {
  const cat = btn.dataset.filter;
  const count = cat === 'all' ? galleryItems.length : galleryItems.filter((it) => it.dataset.cat === cat).length;
  $('sup', btn).textContent = count;

  btn.addEventListener('click', () => {
    filters.forEach((b) => {
      b.classList.toggle('is-active', b === btn);
      b.setAttribute('aria-selected', String(b === btn));
    });
    let shown = 0;
    galleryItems.forEach((item) => {
      const match = cat === 'all' || item.dataset.cat === cat;
      item.classList.toggle('is-hidden', !match);
      item.classList.remove('is-visible');
      if (match) {
        item.style.transitionDelay = `${Math.min(shown, 8) * 60}ms`;
        shown += 1;
      }
    });
    requestAnimationFrame(() => requestAnimationFrame(() => {
      galleryItems.forEach((item) => { if (!item.classList.contains('is-hidden')) item.classList.add('is-visible'); });
    }));
  });
});

/* ---------- Лайтбокс ---------- */
const lightbox = $('#lightbox');
const lbImg = $('.lightbox__img', lightbox);
const lbCaption = $('.lightbox__caption', lightbox);
const lbCounter = $('.lightbox__counter', lightbox);
let lbList = [];
let lbIndex = 0;
let lbOpener = null;

function lbRender(direction = 0) {
  const item = lbList[lbIndex];
  const img = $('img', item);
  const cap = $('figcaption', item);
  const apply = () => {
    lbImg.src = img.currentSrc || img.src;
    lbImg.alt = img.alt;
    lbCaption.textContent = cap
      ? [$('span', cap)?.textContent, cap.lastChild.textContent].map((s) => s && s.trim()).filter(Boolean).join(' · ')
      : '';
    lbCounter.textContent = `${String(lbIndex + 1).padStart(2, '0')} / ${String(lbList.length).padStart(2, '0')}`;
    lbImg.classList.remove('is-switching');
  };
  if (direction && !reducedMotion) {
    lbImg.classList.add('is-switching');
    setTimeout(apply, 220);
  } else apply();

  // заранее подгружаем соседние фото
  [lbIndex - 1, lbIndex + 1].forEach((n) => {
    const neighbour = lbList[(n + lbList.length) % lbList.length];
    if (neighbour) new Image().src = $('img', neighbour).src;
  });
}

function lbOpen(item) {
  lbList = galleryItems.filter((it) => !it.classList.contains('is-hidden'));
  lbIndex = lbList.indexOf(item);
  lbOpener = item;
  lightbox.hidden = false;
  document.body.classList.add('is-locked');
  lbRender();
  requestAnimationFrame(() => lightbox.classList.add('is-open'));
  $('.lightbox__close', lightbox).focus();
}

function lbClose() {
  lightbox.classList.remove('is-open');
  document.body.classList.remove('is-locked');
  setTimeout(() => { lightbox.hidden = true; lbImg.src = ''; }, 300);
  if (lbOpener) lbOpener.focus({ preventScroll: true });
}

function lbStep(delta) {
  lbIndex = (lbIndex + delta + lbList.length) % lbList.length;
  lbRender(delta);
}

galleryItems.forEach((item) => {
  item.addEventListener('click', () => lbOpen(item));
  item.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); lbOpen(item); }
  });
});

$('.lightbox__close', lightbox).addEventListener('click', lbClose);
$('.lightbox__arrow--prev', lightbox).addEventListener('click', () => lbStep(-1));
$('.lightbox__arrow--next', lightbox).addEventListener('click', () => lbStep(1));
lightbox.addEventListener('click', (e) => {
  if (e.target === lightbox || e.target.classList.contains('lightbox__figure')) lbClose();
});

window.addEventListener('keydown', (e) => {
  if (lightbox.hidden) return;
  if (e.key === 'Escape') lbClose();
  if (e.key === 'ArrowLeft') lbStep(-1);
  if (e.key === 'ArrowRight') lbStep(1);
  if (e.key === 'Tab') {
    // держим фокус внутри лайтбокса
    const focusables = $$('button', lightbox);
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }
});

function onSwipe(el, onLeft, onRight) {
  let x0 = null;
  let y0 = null;
  el.addEventListener('touchstart', (e) => { x0 = e.touches[0].clientX; y0 = e.touches[0].clientY; }, { passive: true });
  el.addEventListener('touchend', (e) => {
    if (x0 === null) return;
    const dx = e.changedTouches[0].clientX - x0;
    const dy = e.changedTouches[0].clientY - y0;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) (dx < 0 ? onLeft : onRight)();
    x0 = null;
  }, { passive: true });
}
onSwipe(lightbox, () => lbStep(1), () => lbStep(-1));

/* ---------- Отзывы ---------- */
const reviews = $$('.review');
const reviewCount = $('.reviews__count b');
const reviewSlider = $('.reviews__slider');
let reviewIndex = 0;
let reviewTimer;

$('.reviews__count span').textContent = reviews.length;

function showReview(i) {
  reviewIndex = (i + reviews.length) % reviews.length;
  reviews.forEach((r, n) => r.classList.toggle('is-active', n === reviewIndex));
  reviewCount.textContent = reviewIndex + 1;
}
function autoplayReviews() {
  clearInterval(reviewTimer);
  if (!reducedMotion) reviewTimer = setInterval(() => showReview(reviewIndex + 1), 8000);
}

$('[data-review-prev]').addEventListener('click', () => { showReview(reviewIndex - 1); autoplayReviews(); });
$('[data-review-next]').addEventListener('click', () => { showReview(reviewIndex + 1); autoplayReviews(); });
reviewSlider.addEventListener('mouseenter', () => clearInterval(reviewTimer));
reviewSlider.addEventListener('mouseleave', autoplayReviews);
onSwipe(reviewSlider, () => { showReview(reviewIndex + 1); autoplayReviews(); }, () => { showReview(reviewIndex - 1); autoplayReviews(); });
autoplayReviews();

/* ---------- Запись: форма → Telegram ---------- */
const form = $('#booking-form');
const typeSelect = $('select[name="type"]', form);
const toast = $('.toast');
let toastTimer;

function showToast(text) {
  toast.textContent = text;
  toast.classList.add('is-visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('is-visible'), 5000);
}

// кнопка «Записаться» в карточке услуги сразу выбирает нужный формат в форме
$$('[data-service]').forEach((btn) => {
  btn.addEventListener('click', () => { typeSelect.value = btn.dataset.service; });
});

function formatDate(value) {
  if (!value) return '';
  const [y, m, d] = value.split('-');
  return `${d}.${m}.${y}`;
}

form.addEventListener('submit', (e) => {
  e.preventDefault();
  const data = Object.fromEntries(new FormData(form));
  let valid = true;

  ['name', 'contact'].forEach((name) => {
    const field = form.elements[name].closest('.field');
    const empty = !data[name].trim();
    field.classList.toggle('is-invalid', empty);
    if (empty) valid = false;
  });
  if (!valid) {
    showToast('Пожалуйста, укажите имя и как с вами связаться');
    $('.field.is-invalid input', form).focus();
    return;
  }

  const lines = [
    'Здравствуйте! Хочу записаться на съёмку.',
    '',
    `Имя: ${data.name.trim()}`,
    `Формат: ${data.type}`,
    data.date ? `Дата: ${formatDate(data.date)}` : '',
    `Связь: ${data.contact.trim()}`,
    data.message.trim() ? `Пожелания: ${data.message.trim()}` : '',
  ].filter((line, i) => line || i === 1);
  const text = lines.join('\n');

  window.open(`https://t.me/${CONFIG.telegram}?text=${encodeURIComponent(text)}`, '_blank', 'noopener');

  if (navigator.clipboard) {
    navigator.clipboard.writeText(text)
      .then(() => showToast('Текст заявки скопирован — если он не подставился в чат, просто вставьте его'))
      .catch(() => showToast('Открываю Telegram…'));
  } else {
    showToast('Открываю Telegram…');
  }
});

$$('input', form).forEach((input) => {
  input.addEventListener('input', () => input.closest('.field').classList.remove('is-invalid'));
});

/* ---------- Год в подвале ---------- */
$$('[data-year]').forEach((el) => { el.textContent = new Date().getFullYear(); });
