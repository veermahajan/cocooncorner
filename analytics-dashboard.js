/* Live figures for the internal /analytics102 page.

   Reads GoatCounter's public visitor-counter endpoints. These need
   "Allow adding visitor counts on your website" enabled in the
   GoatCounter site settings; until then every request returns 403 and
   we show setup instructions instead of numbers.

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
    return fetch(url, { mode: 'cors' })
      .then(function (r) {
        if (!r.ok) return null;
        return r.json();
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
      '<strong>One setting left.</strong> GoatCounter is recording, but its public counter ' +
      'endpoints are switched off, so the numbers below cannot load yet. In GoatCounter go to ' +
      '<em>Settings &rarr; Site settings</em> and tick <em>&ldquo;Allow adding visitor counts on ' +
      'your website&rdquo;</em>, then reload this page.';
  }

  function showLive(total) {
    var el = document.getElementById('gc-status');
    if (!el) return;
    el.className = 'status status--ok';
    el.innerHTML =
      '<strong>Live.</strong> Total pageviews across the site: <strong>' + total +
      '</strong>. GoatCounter caches these figures for up to four hours, so a download you ' +
      'just made may not appear immediately.';
  }

  function init() {
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
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
