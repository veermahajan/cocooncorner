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

  /* ── curriculum PDF previews ────────────────────────────────── */

  function initPdfPreviews() {
    // The PDFs are ~2-3 MB each, so the src is only attached once its
    // panel is actually open. loading="lazy" then defers any that are
    // open but still below the fold.
    function attach(frame) {
      if (!frame.getAttribute('src')) {
        frame.setAttribute('src', frame.getAttribute('data-src'));
      }
    }

    var frames = document.querySelectorAll('iframe[data-src]');
    Array.prototype.forEach.call(frames, function (frame) {
      var panel = frame.parentNode;
      while (panel && panel.tagName !== 'DETAILS') panel = panel.parentNode;
      if (!panel) { attach(frame); return; }
      if (panel.open) attach(frame);
      panel.addEventListener('toggle', function () {
        if (panel.open) attach(frame);
      });
    });

    // a download link inside <summary> would otherwise toggle the panel
    var links = document.querySelectorAll('summary .summary-dl');
    Array.prototype.forEach.call(links, function (a) {
      a.addEventListener('click', function (e) { e.stopPropagation(); });
    });
  }

  /* ── GoatCounter: pageviews + download events ───────────────
     Put your GoatCounter site code here (the "MYCODE" part of
     https://MYCODE.goatcounter.com). Until it is set, nothing loads
     and no requests are made. */
  var GOATCOUNTER_CODE = 'cocooncorner';

  function loadGoatCounter() {
    if (!GOATCOUNTER_CODE) return;
    // pages marked data-no-analytics (e.g. the internal dashboard) opt out
    if (document.body.hasAttribute('data-no-analytics')) return;
    var el = document.createElement('script');
    el.async = true;
    el.src = 'https://gc.zgo.at/count.js';
    el.setAttribute(
      'data-goatcounter',
      'https://' + GOATCOUNTER_CODE + '.goatcounter.com/count'
    );
    document.head.appendChild(el);
  }

  // name an event after the file being downloaded
  function eventNameFor(link) {
    var href = link.getAttribute('href') || '';
    var file = href.split('/').pop().split('?')[0];
    return 'download-' + file.replace(/\.[^.]+$/, '');
  }

  function initDownloadTracking() {
    var links = document.querySelectorAll('a[download]');
    Array.prototype.forEach.call(links, function (link) {
      link.addEventListener('click', function () {
        if (!window.goatcounter || !window.goatcounter.count) return;
        window.goatcounter.count({
          path: eventNameFor(link),
          title: (link.textContent || 'Download').trim().slice(0, 80),
          event: true
        });
      });
    });
  }

  function init() {
    initDyslexiaToggle();
    initNavDisclosure();
    markCurrentPage();
    initPdfPreviews();
    loadGoatCounter();
    initDownloadTracking();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
