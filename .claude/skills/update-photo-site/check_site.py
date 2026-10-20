"""Проверка сайта на разных ширинах экрана.

Использование:
    python check_site.py <url> <папка_для_скриншотов>

Нужен playwright (pip install playwright) и установленный Google Chrome.
Для каждой ширины: пролистывает страницу (чтобы проявились анимации), ищет горизонтальный
вылет элементов, битые картинки и ошибки консоли, сохраняет скриншоты первого экрана и секций.
"""
import os
import sys

from playwright.sync_api import sync_playwright

WIDTHS = [(320, 640, True), (390, 844, True), (768, 1024, True), (1440, 900, False), (1920, 1080, False)]

FIND_OVERFLOW = """
() => [...document.querySelectorAll('body *')]
  .filter(e => {
    const r = e.getBoundingClientRect();
    if (!r.width || r.right <= innerWidth + 1) return false;
    // фоны, бегущая строка и оверлеи шире экрана намеренно
    if (e.closest('[aria-hidden="true"], .lightbox, .mobile-menu, [hidden]')) return false;
    // увеличенные через transform: scale (эффект наезда камеры) — тоже намеренно
    for (let a = e; a && a !== document.body; a = a.parentElement) {
      const cs = getComputedStyle(a);
      const m = cs.transform.match(/^matrix\\(([^,]+)/);
      if (m && Math.abs(parseFloat(m[1])) > 1.001) return false;
      // содержимое горизонтальных лент (overflow-x: auto/scroll) листается вбок намеренно
      if (a !== e && /(auto|scroll)/.test(cs.overflowX)) return false;
    }
    return true;
  })
  .slice(0, 8)
  .map(e => (e.className && e.className.toString()) || e.tagName)
"""


def main(url, out):
    os.makedirs(out, exist_ok=True)
    problems = []
    with sync_playwright() as p:
        browser = p.chromium.launch(channel="chrome")
        for w, h, mobile in WIDTHS:
            ctx = browser.new_context(viewport={"width": w, "height": h}, is_mobile=mobile, has_touch=mobile)
            page = ctx.new_page()
            errors = []
            page.on("console", lambda m: m.type == "error" and errors.append(m.text))
            page.on("pageerror", lambda e: errors.append(str(e)))
            page.goto(url, wait_until="networkidle")
            page.wait_for_timeout(1500)
            page.screenshot(path=f"{out}/{w}-0-top.png")

            total = page.evaluate("document.documentElement.scrollHeight")
            for y in range(0, total, 300):
                page.evaluate(f"window.scrollTo({{top:{y}, behavior:'instant'}})")
                page.wait_for_timeout(50)
            page.wait_for_timeout(1000)

            sections = page.evaluate("[...document.querySelectorAll('main > section, main > div, footer')].map(s => s.getBoundingClientRect().top + scrollY)")
            for i, top in enumerate(sections, 1):
                page.evaluate(f"window.scrollTo({{top:{top}, behavior:'instant'}})")
                page.wait_for_timeout(1100)
                page.screenshot(path=f"{out}/{w}-{i:02d}.png")

            overflow = page.evaluate("document.documentElement.scrollWidth - document.documentElement.clientWidth")
            wide = page.evaluate(FIND_OVERFLOW)
            broken = page.evaluate("Promise.all([...document.images].map(i => (i.loading='eager', i.complete ? 0 : new Promise(r => i.onload = i.onerror = r)))).then(() => [...document.images].filter(i => i.currentSrc && !i.naturalWidth).map(i => i.currentSrc))")

            print(f"{w}x{h}: page overflow={overflow}px, wide elements={wide or 'none'}, broken images={broken or 'none'}, console errors={errors or 'none'}")
            if overflow > 0 or wide or broken or errors:
                problems.append(w)
            ctx.close()
        browser.close()
    print("ПРОБЛЕМЫ на ширинах:", problems if problems else "нет")
    return 1 if problems else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1], sys.argv[2]))
