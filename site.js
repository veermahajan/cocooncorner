/* Site behaviour: dyslexia-friendly mode + the Resources nav disclosure.

   Loaded synchronously from <head> so the stored reading preference is
   applied before first paint — otherwise the default theme flashes on
   every page. Kept as an external file (allowed by script-src 'self')
   so it needs no CSP hash and can be edited without touching
   vercel.json. */
(function () {
  'use strict';

  var root = document.documentElement;

  // controls that only work with JS stay hidden until we know JS ran
  root.classList.add('js');

  /* ── dyslexia-friendly mode ─────────────────────────────────── */

  var KEY = 'cc-dyslexia';

  function stored() {
    try {
      return localStorage.getItem(KEY);
    } catch (e) {
      return null; // private mode / storage disabled
    }
  }

  function remember(on) {
    try {
      localStorage.setItem(KEY, on ? 'on' : 'off');
    } catch (e) {}
  }

  // must run before <body> paints, so it sits outside DOMContentLoaded
  if (stored() === 'on') root.classList.add('dyslexia');

  function syncToggle(btn, on) {
    btn.setAttribute('aria-pressed', on ? 'true' : 'false');
    btn.setAttribute(
      'title',
      on ? 'Turn off dyslexia-friendly mode' : 'Turn on dyslexia-friendly mode'
    );
  }

  function initDyslexiaToggle() {
    var btns = document.querySelectorAll('.dyslexia-toggle');
    Array.prototype.forEach.call(btns, function (btn) {
      syncToggle(btn, root.classList.contains('dyslexia'));
      btn.addEventListener('click', function () {
        var on = root.classList.toggle('dyslexia');
        remember(on);
        Array.prototype.forEach.call(btns, function (b) { syncToggle(b, on); });
      });
    });
  }

  /* ── Resources nav disclosure ───────────────────────────────── */

  function initNavDisclosure() {
    var btn = document.querySelector('.nav-group-label');
    if (!btn) return;
    var group = btn.parentNode;

    function expanded() {
      return btn.getAttribute('aria-expanded') === 'true';
    }
    function setExpanded(on) {
      btn.setAttribute('aria-expanded', on ? 'true' : 'false');
    }

    btn.addEventListener('click', function () {
      setExpanded(!expanded());
    });

    // Escape closes and returns focus to the trigger
    group.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && expanded()) {
        setExpanded(false);
        btn.focus();
      }
    });

    // tabbing or clicking away closes it
    group.addEventListener('focusout', function (e) {
      if (!group.contains(e.relatedTarget)) setExpanded(false);
    });
    document.addEventListener('click', function (e) {
      if (!group.contains(e.target)) setExpanded(false);
    });
  }

  /* ── mark the current page for assistive tech ───────────────── */

  function markCurrentPage() {
    var page = document.body.getAttribute('data-page');
    if (!page) return;
    var link = document.querySelector('nav a.nl[data-page="' + page + '"]');
    if (link) link.setAttribute('aria-current', 'page');
  }

  function init() {
    initDyslexiaToggle();
    initNavDisclosure();
    markCurrentPage();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
