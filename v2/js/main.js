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
const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

/* ---------- Контакты ---------- */
const contactLinks = {
  telegram: { href: `https://t.me/${CONFIG.telegram}`, text: `@${CONFIG.telegram}` },
  whatsapp: { href: `https://wa.me/${CONFIG.whatsapp}` },
  vk: { href: `https://vk.com/${CONFIG.vk}` },
  phone: { href: `tel:${CONFIG.phone.replace(/[^\d+]/g, '')}`, text: CONFIG.phone },
};
$$('[data-contact]').forEach((el) => {
  const data = contactLinks[el.dataset.contact];
  if (data) el.href = data.href;
});
$$('[data-contact-text]').forEach((el) => {
  const data = contactLinks[el.dataset.contactText];
  if (data && data.text) el.textContent = data.text;
});

/* ---------- Шапка ---------- */
const header = $('#header');
const hero = $('.hero');
const fab = $('.fab');
let lastY = window.scrollY;
let bookingInView = false;

function onScroll() {
  const y = window.scrollY;
  header.classList.toggle('is-scrolled', y > 40);
  const goingDown = y > lastY;
  if (Math.abs(y - lastY) > 4) {
    header.classList.toggle('is-hidden', goingDown && y > hero.offsetHeight && !document.body.classList.contains('menu-open'));
  }
  fab.classList.toggle('is-visible', y > hero.offsetHeight * 0.7 && !bookingInView);
  lastY = y;
}
let scrollTick = false;
window.addEventListener('scroll', () => {
  if (scrollTick) return;
  scrollTick = true;
  requestAnimationFrame(() => { onScroll(); scrollTick = false; });
}, { passive: true });
onScroll();

new IntersectionObserver(([entry]) => { bookingInView = entry.isIntersecting; onScroll(); }, { threshold: 0.15 }).observe($('#booking'));

const navLinks = $$('.nav a[href^="#"]');
const navObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    navLinks.forEach((a) => a.classList.toggle('is-current', a.getAttribute('href') === `#${entry.target.id}`));
  });
}, { rootMargin: '-45% 0px -50% 0px' });
navLinks.map((a) => $(a.getAttribute('href'))).filter(Boolean).forEach((s) => navObserver.observe(s));

/* ---------- Меню ---------- */
const burger = $('.burger');
const menu = $('#menu');
function setMenu(open) {
  document.body.classList.toggle('menu-open', open);
  document.body.classList.toggle('is-locked', open);
  burger.setAttribute('aria-expanded', String(open));
  burger.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
  menu.setAttribute('aria-hidden', String(!open));
}
burger.addEventListener('click', () => setMenu(!document.body.classList.contains('menu-open')));
$$('a', menu).forEach((a) => a.addEventListener('click', () => setMenu(false)));
window.addEventListener('keydown', (e) => { if (e.key === 'Escape' && document.body.classList.contains('menu-open')) setMenu(false); });
window.matchMedia('(min-width: 1101px)').addEventListener('change', (e) => { if (e.matches) setMenu(false); });

/* ---------- Первый экран: пары кадров ---------- */
const pairs = $$('.hero__pair');
const heroCaption = $('.hero__caption b');
const heroCount = $('.hero__count b');
const PAIR_TIME = 7000;
let pairIndex = 0;
let pairTimer;
let pairBusy = false;

function showPair(next) {
  next = (next + pairs.length) % pairs.length;
  if (next === pairIndex || pairBusy) return;
  const current = pairs[pairIndex];
  const incoming = pairs[next];
  pairBusy = true;

  pairs.forEach((p) => p.classList.remove('is-prev'));
  current.classList.remove('is-active');
  current.classList.add('is-prev');
  incoming.classList.add('is-active', 'is-entering');

  heroCaption.classList.add('is-switching');
  setTimeout(() => {
    heroCaption.textContent = incoming.dataset.caption;
    heroCaption.classList.remove('is-switching');
  }, 450);
  heroCount.textContent = String(next + 1).padStart(2, '0');

  setTimeout(() => {
    current.classList.remove('is-prev');
    incoming.classList.remove('is-entering');
    pairBusy = false;
  }, reducedMotion ? 0 : 1500);
  pairIndex = next;
}
function schedulePairs() {
  clearTimeout(pairTimer);
  if (reducedMotion) return;
  pairTimer = setTimeout(() => { showPair(pairIndex + 1); schedulePairs(); }, PAIR_TIME);
}
$('[data-hero-prev]').addEventListener('click', () => { showPair(pairIndex - 1); schedulePairs(); });
$('[data-hero-next]').addEventListener('click', () => { showPair(pairIndex + 1); schedulePairs(); });
document.addEventListener('visibilitychange', () => { if (document.hidden) clearTimeout(pairTimer); else schedulePairs(); });

function markLoaded() {
  if (document.body.classList.contains('is-loaded')) return;
  document.body.classList.add('is-loaded');
  schedulePairs();
}
const firstHeroImg = $('.hero__pair img');
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

let revealPending = $$('.reveal, .reveal-img');
revealPending.forEach((el) => {
  const siblings = $$(':scope > .reveal', el.parentElement);
  const idx = siblings.indexOf(el);
  if (idx > 0) el.style.transitionDelay = `${Math.min(idx, 5) * 90}ms`;
  revealObserver.observe(el);
});
// страховка: при резком переходе по якорю элементы выше экрана тоже проявляются
let revealTick = false;
window.addEventListener('scroll', () => {
  if (revealTick || !revealPending.length) return;
  revealTick = true;
  requestAnimationFrame(() => {
    revealPending = revealPending.filter((el) => {
      if (el.classList.contains('is-visible')) return false;
      if (el.getBoundingClientRect().top < window.innerHeight * 0.9) { el.classList.add('is-visible'); return false; }
      return true;
    });
    revealTick = false;
  });
}, { passive: true });

/* ---------- Лайтбокс (общий для историй и плёнки) ---------- */
const lightbox = $('#lightbox');
const lbImg = $('.lightbox__img', lightbox);
const lbTitle = $('.lightbox__title', lightbox);
const lbCounter = $('.lightbox__counter', lightbox);
let lb = { items: [], index: 0, title: '', opener: null };

function lbRender(animate) {
  const item = lb.items[lb.index];
  const apply = () => {
    lbImg.src = item.src;
    lbImg.alt = item.alt || lb.title;
    lbCounter.textContent = `${String(lb.index + 1).padStart(2, '0')} / ${String(lb.items.length).padStart(2, '0')}`;
    lbImg.classList.remove('is-switching');
  };
  if (animate && !reducedMotion) { lbImg.classList.add('is-switching'); setTimeout(apply, 220); } else apply();
  [lb.index - 1, lb.index + 1].forEach((n) => {
    const neighbour = lb.items[(n + lb.items.length) % lb.items.length];
    if (neighbour) new Image().src = neighbour.src;
  });
}
function lbOpen(items, index, title, opener) {
  lb = { items, index, title, opener };
  lbTitle.textContent = title;
  lightbox.hidden = false;
  document.body.classList.add('is-locked');
  lbRender(false);
  requestAnimationFrame(() => lightbox.classList.add('is-open'));
  $('.lightbox__close', lightbox).focus();
}
function lbClose() {
  lightbox.classList.remove('is-open');
  document.body.classList.remove('is-locked');
  setTimeout(() => { lightbox.hidden = true; lbImg.src = ''; }, 300);
  if (lb.opener) lb.opener.focus({ preventScroll: true });
}
function lbStep(delta) {
  if (lb.items.length < 2) return;
  lb.index = (lb.index + delta + lb.items.length) % lb.items.length;
  lbRender(true);
}
$('.lightbox__close', lightbox).addEventListener('click', lbClose);
$('.lightbox__arrow--prev', lightbox).addEventListener('click', () => lbStep(-1));
$('.lightbox__arrow--next', lightbox).addEventListener('click', () => lbStep(1));
lightbox.addEventListener('click', (e) => { if (e.target === lightbox || e.target.classList.contains('lightbox__figure')) lbClose(); });
window.addEventListener('keydown', (e) => {
  if (lightbox.hidden) return;
  if (e.key === 'Escape') lbClose();
  if (e.key === 'ArrowLeft') lbStep(-1);
  if (e.key === 'ArrowRight') lbStep(1);
  if (e.key === 'Tab') {
    const focusables = $$('button', lightbox);
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }
});
function onSwipe(el, onLeft, onRight) {
  let x0 = null; let y0 = null;
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

/* истории: каждая открывает свои кадры */
$$('.story__media').forEach((btn) => {
  const items = btn.dataset.images.split('|').map((src) => ({ src: src.trim(), alt: btn.dataset.title }));
  btn.addEventListener('click', () => lbOpen(items, 0, btn.dataset.title, btn));
});

/* ---------- Плёнка: лента с перетаскиванием ---------- */
const strip = $('.film__strip');
const frames = $$('.frame', strip);
const filmBar = $('.film__progress i');
const filmItems = frames.map((f) => ({ src: $('img', f).getAttribute('src'), alt: $('img', f).alt }));

function updateFilmBar() {
  const max = strip.scrollWidth - strip.clientWidth;
  const visible = strip.clientWidth / strip.scrollWidth;
  const progress = max > 0 ? strip.scrollLeft / max : 1;
  filmBar.style.transform = `scaleX(${Math.min(1, visible + (1 - visible) * progress)})`;
}
strip.addEventListener('scroll', () => requestAnimationFrame(updateFilmBar), { passive: true });
window.addEventListener('resize', updateFilmBar);
window.addEventListener('load', updateFilmBar);
updateFilmBar();

const scrollFilm = (dir) => strip.scrollBy({ left: dir * strip.clientWidth * 0.7, behavior: reducedMotion ? 'auto' : 'smooth' });
$('[data-film-prev]').addEventListener('click', () => scrollFilm(-1));
$('[data-film-next]').addEventListener('click', () => scrollFilm(1));
strip.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowRight') { e.preventDefault(); scrollFilm(1); }
  if (e.key === 'ArrowLeft') { e.preventDefault(); scrollFilm(-1); }
});

// перетаскивание мышью (на телефоне лента листается пальцем сама)
let drag = null;
strip.addEventListener('pointerdown', (e) => {
  if (e.pointerType !== 'mouse' || e.button !== 0) return;
  drag = { x: e.clientX, left: strip.scrollLeft, moved: false };
});
window.addEventListener('pointermove', (e) => {
  if (!drag) return;
  const dx = e.clientX - drag.x;
  if (!drag.moved && Math.abs(dx) > 6) { drag.moved = true; strip.classList.add('is-dragging'); }
  if (drag.moved) strip.scrollLeft = drag.left - dx;
});
window.addEventListener('pointerup', () => {
  if (!drag) return;
  const wasDrag = drag.moved;
  drag = null;
  // снимаем класс чуть позже, чтобы клик после перетаскивания не открыл фото
  setTimeout(() => strip.classList.remove('is-dragging'), wasDrag ? 50 : 0);
});
frames.forEach((frame, i) => {
  frame.addEventListener('click', () => {
    if (strip.classList.contains('is-dragging')) return;
    lbOpen(filmItems, i, 'Плёнка', frame);
  });
});

/* ---------- Что я снимаю: превью при наведении ---------- */
const genreLinks = $$('.genre');
const previews = $$('.genres__preview img');
function activateGenre(link) {
  genreLinks.forEach((g) => g.classList.toggle('is-active', g === link));
  previews.forEach((img, i) => img.classList.toggle('is-active', i === Number(link.dataset.preview)));
}
genreLinks.forEach((link) => {
  link.addEventListener('mouseenter', () => activateGenre(link));
  link.addEventListener('focus', () => activateGenre(link));
});

/* ---------- Отзывы ---------- */
const reviews = $$('.review');
const dotsBox = $('.dots');
const reviewSlider = $('.reviews__slider');
let reviewIndex = 0;
let reviewTimer;
const dots = reviews.map((_, i) => {
  const dot = document.createElement('button');
  dot.type = 'button';
  dot.setAttribute('role', 'tab');
  dot.setAttribute('aria-label', `Отзыв ${i + 1}`);
  dot.addEventListener('click', () => { showReview(i); autoplayReviews(); });
  dotsBox.appendChild(dot);
  return dot;
});
function showReview(i) {
  reviewIndex = (i + reviews.length) % reviews.length;
  reviews.forEach((r, n) => r.classList.toggle('is-active', n === reviewIndex));
  dots.forEach((d, n) => d.setAttribute('aria-selected', String(n === reviewIndex)));
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
showReview(0);
autoplayReviews();

/* ---------- Курсор «Смотреть» над фото ---------- */
if (finePointer && !reducedMotion) {
  const cursor = $('.cursor');
  const label = $('span', cursor);
  let x = 0; let y = 0; let cx = 0; let cy = 0; let raf = null;
  const loop = () => {
    cx += (x - cx) * 0.22;
    cy += (y - cy) * 0.22;
    cursor.style.transform = `translate(${cx}px, ${cy}px)`;
    raf = Math.abs(x - cx) + Math.abs(y - cy) > 0.3 ? requestAnimationFrame(loop) : null;
  };
  window.addEventListener('mousemove', (e) => {
    x = e.clientX; y = e.clientY;
    if (!raf) raf = requestAnimationFrame(loop);
  }, { passive: true });
  $$('[data-cursor]').forEach((el) => {
    el.addEventListener('mouseenter', () => { label.textContent = el.dataset.cursor; cursor.classList.add('is-on'); });
    el.addEventListener('mouseleave', () => cursor.classList.remove('is-on'));
  });
  strip.addEventListener('mouseleave', () => cursor.classList.remove('is-on'));
}

/* ---------- Запись: форма → Telegram ---------- */
const form = $('#booking-form');
const toast = $('.toast');
let toastTimer;
function showToast(text) {
  toast.textContent = text;
  toast.classList.add('is-visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('is-visible'), 5000);
}

// «Записаться» у цены или жанра сразу выбирает формат
function selectFormat(value) {
  const radio = $$('input[name="type"]', form).find((r) => r.value === value);
  if (radio) radio.checked = true;
}
$$('[data-format]').forEach((el) => el.addEventListener('click', () => selectFormat(el.dataset.format)));

const dateInput = form.elements.date;
const noDate = form.elements.nodate;
noDate.addEventListener('change', () => { dateInput.disabled = noDate.checked; if (noDate.checked) dateInput.value = ''; });

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
    const empty = !(data[name] || '').trim();
    field.classList.toggle('is-invalid', empty);
    if (empty) valid = false;
  });
  if (!valid) {
    showToast('Пожалуйста, укажите имя и как с вами связаться');
    $('.field.is-invalid input', form).focus();
    return;
  }

  let when = 'дата пока не решена';
  if (!data.nodate && data.date) when = formatDate(data.date);
  const lines = [
    'Здравствуйте! Хочу записаться на съёмку.',
    '',
    `Формат: ${data.type || 'пока не выбрал(а)'}`,
    `Дата: ${when}`,
    `Имя: ${data.name.trim()}`,
    `Связь: ${data.contact.trim()}`,
  ];
  if ((data.message || '').trim()) lines.push(`Пожелания: ${data.message.trim()}`);
  const text = lines.join('\n');

  window.open(`https://t.me/${CONFIG.telegram}?text=${encodeURIComponent(text)}`, '_blank', 'noopener');
  if (navigator.clipboard) {
    navigator.clipboard.writeText(text)
      .then(() => showToast('Текст заявки скопирован — если он не подставился в чат, просто вставьте его'))
      .catch(() => showToast('Открываю Telegram…'));
  } else showToast('Открываю Telegram…');
});
$$('input', form).forEach((input) => input.addEventListener('input', () => input.closest('.field')?.classList.remove('is-invalid')));

/* ---------- Год в подвале ---------- */
$$('[data-year]').forEach((el) => { el.textContent = new Date().getFullYear(); });
