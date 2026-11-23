/* Page chrome: theme, menu, and the two scroll states.
 *
 * is-scrolled  — the reader has left the very top of the hero (hides the hint)
 * is-content   — the paper column has reached the header (paper plate, small mark)
 */

(function () {
  'use strict';

  var root = document.documentElement;
  var body = document.body;
  var nav = document.getElementById('top-nav');
  var menuToggle = document.getElementById('menu-toggle');
  var menuPanel = document.getElementById('menu-panel');
  var themeToggle = document.getElementById('theme-toggle');
  var themeLabel = document.getElementById('theme-label');
  var page = document.querySelector('.page');
  var header = document.querySelector('.site-header');

  /* ---- Theme ------------------------------------------------------------- */

  var THEME_META = { light: '#faf9f6', night: '#1b1a18' };

  function syncThemeMeta(isNight) {
    var metas = document.querySelectorAll('meta[name="theme-color"]');
    for (var i = 0; i < metas.length; i++) metas[i].remove();
    var meta = document.createElement('meta');
    meta.name = 'theme-color';
    meta.content = isNight ? THEME_META.night : THEME_META.light;
    document.head.appendChild(meta);
  }

  function paintThemeControls(isNight) {
    // The control names the light the reader is about to enter.
    themeLabel.textContent = isNight ? 'Day' : 'Night';
    themeToggle.setAttribute(
      'aria-label',
      isNight ? 'Switch to the day scene' : 'Switch to the night scene'
    );
  }

  function applyTheme(isNight, animate) {
    root.classList.toggle('theme-night', isNight);
    paintThemeControls(isNight);
    syncThemeMeta(isNight);
    if (window.__scene && animate !== false) window.__scene.setNight(isNight);
    try { localStorage.setItem('theme', isNight ? 'night' : 'day'); } catch (e) {}
  }

  var isNight = root.classList.contains('theme-night');
  paintThemeControls(isNight);
  if (window.__scene) window.__scene.setNight(isNight);

  themeToggle.addEventListener('click', function () {
    isNight = !isNight;
    applyTheme(isNight, true);
  });

  // Follow the system only while the reader has not chosen for themselves.
  var mq = window.matchMedia('(prefers-color-scheme: dark)');
  var stored = null;
  try { stored = localStorage.getItem('theme'); } catch (e) {}
  if (!stored && mq.addEventListener) {
    mq.addEventListener('change', function (event) {
      isNight = event.matches;
      applyTheme(isNight, true);
    });
  }

  /* ---- Menu -------------------------------------------------------------- */

  function openMenu() {
    nav.classList.add('is-open');
    body.classList.add('menu-open');
    menuToggle.setAttribute('aria-expanded', 'true');
  }

  function closeMenu(returnFocus) {
    if (!nav.classList.contains('is-open')) return;
    nav.classList.remove('is-open');
    body.classList.remove('menu-open');
    menuToggle.setAttribute('aria-expanded', 'false');
    if (returnFocus) menuToggle.focus();
  }

  menuToggle.addEventListener('click', function () {
    if (nav.classList.contains('is-open')) closeMenu(false);
    else openMenu();
  });

  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape') closeMenu(true);
  });

  document.addEventListener('click', function (event) {
    if (!nav.classList.contains('is-open')) return;
    if (!nav.contains(event.target)) closeMenu(false);
  });

  menuPanel.addEventListener('click', function (event) {
    if (event.target.closest('a')) closeMenu(false);
  });

  /* ---- Scroll states ----------------------------------------------------- */

  var scrolled = false;
  var content = false;
  var ticking = false;

  function measure() {
    ticking = false;

    var nextScrolled = window.scrollY > 24;
    if (nextScrolled !== scrolled) {
      scrolled = nextScrolled;
      body.classList.toggle('is-scrolled', scrolled);
    }

    var headerBottom = header ? header.offsetHeight : 96;
    var columnTop = page ? page.getBoundingClientRect().top : window.innerHeight;
    var nextContent = columnTop <= headerBottom - 8;
    if (nextContent !== content) {
      content = nextContent;
      body.classList.toggle('is-content', content);
      if (content) closeMenu(false);
    }
  }

  function onScroll() {
    if (!ticking) {
      ticking = true;
      window.requestAnimationFrame(measure);
    }
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  window.addEventListener('load', measure);
  measure();

  /* ---- Anchor links ------------------------------------------------------ */

  // scroll-padding-top in CSS handles the offset; this only keeps the hash out
  // of the way and closes the menu for keyboard users mid-navigation.
  document.addEventListener('click', function (event) {
    var link = event.target.closest('a[href^="#"]');
    if (!link) return;
    var id = link.getAttribute('href');
    if (!id || id === '#' || id.length < 2) return;
    var target = document.getElementById(id.slice(1));
    if (!target) return;
    closeMenu(false);
  });

  /* ---- Certifications: open the first group only ------------------------- */

  var groups = document.querySelectorAll('.cert-group');
  for (var i = 0; i < groups.length; i++) {
    groups[i].addEventListener('toggle', function () {
      if (!this.open) return;
      for (var j = 0; j < groups.length; j++) {
        if (groups[j] !== this) groups[j].open = false;
      }
    });
  }
})();
