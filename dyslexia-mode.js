/* Dyslexia-friendly mode toggle.
   Loaded synchronously from <head> so the stored preference is applied
   before first paint — otherwise the default theme flashes on every page.
   Kept as an external file (allowed by script-src 'self') so it needs no
   CSP hash and can be edited without touching vercel.json. */
(function () {
  'use strict';

  var KEY = 'cc-dyslexia';
  var root = document.documentElement;

  // the toggle is only useful with JS, so reveal it only when JS ran
  root.classList.add('js');

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

  if (stored() === 'on') root.classList.add('dyslexia');

  function sync(btn, on) {
    btn.setAttribute('aria-pressed', on ? 'true' : 'false');
    btn.setAttribute(
      'title',
      on ? 'Turn off dyslexia-friendly mode' : 'Turn on dyslexia-friendly mode'
    );
  }

  function wire() {
    var btns = document.querySelectorAll('.dyslexia-toggle');
    Array.prototype.forEach.call(btns, function (btn) {
      sync(btn, root.classList.contains('dyslexia'));
      btn.addEventListener('click', function () {
        var on = root.classList.toggle('dyslexia');
        remember(on);
        Array.prototype.forEach.call(btns, function (b) { sync(b, on); });
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', wire);
  } else {
    wire();
  }
})();
