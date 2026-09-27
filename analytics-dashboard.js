/* Live figures for the internal /analytics102 page.

   Reads GoatCounter's public visitor-counter endpoints. These need
   "allow using the visitor counter" enabled in the GoatCounter site
   settings; until then every request is refused and we show setup
   instructions instead of numbers.

   Freshness: the figures are re-fetched on load, every five minutes
   while the tab is visible, and on demand. GoatCounter's server keeps
   its own copy for up to four hours, which is the floor on how
   current these numbers can be.

   No API token is involved — a token would be a secret, and this
   repository is public. */
(function () {
  'use strict';

  var SITE = 'https://cocooncorner.goatcounter.com/counter';

  var DOWNLOADS = [
    ['download-Cocoon_Corner_Curricula_FinalGradeK',    'Kindergarten curriculum'],
    ['download-Cocoon_Corner_Curricula_FinalGrade1',    'Grade 1 curriculum'],
    ['download-Cocoon_Corner_Curricula_FinalGrade2',    'Grade 2 curriculum'],
    ['download-Cocoon_Corner_Curricula_FinalGrade3-5',  'Grades 3–5 curriculum'],
    ['download-Cocoon_Corner_Teacher_Education_Packet', 'Teacher Education Packet'],
    ['download-nnea_presentation',                      'Main presentation deck'],
    ['download-makingsensoryspace_CC',                  'Sensory space guide'],
    ['download-NeurodiversityInfoWS_CC',                'Neurodiversity worksheet deck']
  ];

  var PAGES = [
    ['/',                'Home'],
    ['/curricula/',      'Curricula'],
    ['/resources/',      'Resources & Downloads'],
    ['/book/',           'Our Book'],
    ['/team/',           'Team'],
    ['/sensory-spaces/', 'Sensory Spaces']
  ];

  function fetchCount(path) {
    // TOTAL is a special path and takes no leading slash
    var url = SITE + '/' + encodeURIComponent(path) + '.json';
    // GoatCounter sends every counter response with an Expires header four
    // hours out, so a plain fetch() was answered from the browser's cache
    // on every reload and the page never changed. no-store always goes to
    // the network. (GoatCounter's own server cache, which it documents as
    // "up to four hours", still applies and can't be bypassed from here —
    // it ignores query strings.)
    return fetch(url, { mode: 'cors', cache: 'no-store' })
      .then(function (r) {
        // GoatCounter answers 404 with a valid {"count":"0"} body for a path
        // that has had no hits yet, so a 404 is a real zero, not a failure.
        // Anything else (403 when the counter is off) is treated as no data.
        if (r.status !== 200 && r.status !== 404) return null;
        return r.json().catch(function () { return null; });
      })
      .then(function (d) { return d && d.count != null ? d.count : null; })
      .catch(function () { return null; });
  }

  function row(label, value) {
    var tr = document.createElement('tr');
    var th = document.createElement('th');
    th.setAttribute('scope', 'row');
    th.textContent = label;
    var td = document.createElement('td');
    td.textContent = value === null ? '—' : value;
    if (value === null) td.className = 'is-empty';
    tr.appendChild(th);
    tr.appendChild(td);
    return tr;
  }

  function fill(tbodyId, items) {
    var tbody = document.getElementById(tbodyId);
    return Promise.all(items.map(function (it) {
      return fetchCount(it[0]).then(function (c) { return [it[1], c]; });
    })).then(function (results) {
      tbody.innerHTML = '';
      results.forEach(function (r) { tbody.appendChild(row(r[0], r[1])); });
      return results;
    });
  }

  function showSetupNeeded() {
    var el = document.getElementById('gc-status');
    if (!el) return;
    el.className = 'status status--warn';
    el.innerHTML =
      '<strong>One setting left.</strong> GoatCounter is recording visits and downloads, but it ' +
      'refuses to serve these figures until the visitor counter is switched on. In GoatCounter ' +
      'open <em>Settings &rarr; Site settings</em> and enable ' +
      '<strong>&ldquo;allow using the visitor counter&rdquo;</strong> &mdash; the docs call the same ' +
      'option &ldquo;allow adding visitor counts on your website&rdquo;. It is a different setting ' +
      'from making the dashboard public or allowing it to be embedded. Save, then reload this page.';
  }

  function timeNow() {
    return new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  }

  function showLive(total) {
    var el = document.getElementById('gc-status');
    if (!el) return;
    el.className = 'status status--ok';
    el.innerHTML =
      '<strong>Live.</strong> Total pageviews across the site: <strong>' + total +
      '</strong>. Checked at ' + timeNow() + '; this page re-checks every five minutes. ' +
      'GoatCounter itself only recalculates these totals every few hours, so a download you ' +
      'just made can take up to four hours to appear here &mdash; the embedded dashboard ' +
      'below is closer to real time.';
  }

  var REFRESH_MS = 5 * 60 * 1000;
  var busy = false;
  var lastRun = 0;

  function load() {
    if (busy) return;
    busy = true;
    lastRun = Date.now();
    var btn = document.getElementById('gc-refresh');
    if (btn) { btn.disabled = true; btn.textContent = 'Checking\u2026'; }

    Promise.all([
      fill('dl-body', DOWNLOADS),
      fill('pv-body', PAGES),
      fetchCount('TOTAL')
    ]).then(function (res) {
      // A blocked endpoint fails CORS before we can read the 403, so treat
      // "nothing came back at all" as the signal that it is still switched off.
      var gotSomething = res[0].concat(res[1]).some(function (r) {
        return r[1] !== null;
      }) || res[2] !== null;
      if (gotSomething) showLive(res[2] === null ? '—' : res[2]);
      else showSetupNeeded();
    }).catch(function () {}).then(function () {
      // always release, or one bad run would block every later refresh
      busy = false;
      if (btn) { btn.disabled = false; btn.textContent = 'Refresh now'; }
    });
  }

  function init() {
    load();

    var btn = document.getElementById('gc-refresh');
    if (btn) btn.addEventListener('click', load);

    // re-check on a timer, but only while someone is looking at the page
    setInterval(function () {
      if (!document.hidden) load();
    }, REFRESH_MS);

    // and straight away when they come back to a tab left open a while
    document.addEventListener('visibilitychange', function () {
      if (!document.hidden && Date.now() - lastRun > REFRESH_MS) load();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
