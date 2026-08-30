/* Omarchy Shell — workspace routing, video facades, live star count */
(function () {
  'use strict';

  var buttons = Array.prototype.slice.call(document.querySelectorAll('[data-go]'));
  var spaces  = Array.prototype.slice.call(document.querySelectorAll('.workspace'));

  /* the markup decides how many workspaces there are, not this list */
  var PAGES = spaces.map(function (s) { return s.getAttribute('data-ws'); });

  var current = 'home';
  var here    = document.querySelector('[data-here]');

  /* ---------------- workspaces ---------------- */

  function show(page, push) {
    if (PAGES.indexOf(page) === -1) page = 'home';
    current = page;

    spaces.forEach(function (s) {
      s.classList.toggle('on', s.getAttribute('data-ws') === page);
    });
    buttons.forEach(function (b) {
      b.setAttribute('aria-current', String(b.getAttribute('data-go') === page));
    });

    var active = document.querySelector('.workspace.on');
    if (active) active.scrollTop = 0;

    if (here) {
      var btn = document.querySelector('[data-go="' + page + '"] .nm');
      here.textContent = btn ? btn.textContent : '';
    }

    if (push && location.hash !== '#/' + page) {
      history.pushState(null, '', '#/' + page);
    }
    document.title = (page === 'home' ? '' : page.charAt(0).toUpperCase() + page.slice(1) + ' — ')
      + 'Omarchy — Beautiful, Fun & Opinionated Linux by DHH';
  }

  buttons.forEach(function (b) {
    b.addEventListener('click', function () { show(b.getAttribute('data-go'), true); });
  });

  window.addEventListener('popstate', function () {
    show((location.hash || '').replace('#/', ''), false);
  });

  /* ---------------- mobile drawer ---------------- */

  var bar    = document.querySelector('[data-bar]');
  var burger = document.querySelector('[data-burger]');

  function setMenu(open) {
    if (!bar || !burger) return;
    bar.classList.toggle('open', open);
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  }

  if (burger) {
    burger.addEventListener('click', function () {
      setMenu(!bar.classList.contains('open'));
    });
    /* any destination closes it — page switches and outbound links alike */
    bar.addEventListener('click', function (e) {
      if (e.target.closest('.ws button, .links a')) setMenu(false);
    });
    window.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') setMenu(false);
    });
    window.addEventListener('resize', function () {
      if (window.innerWidth > 900) setMenu(false);
    });
  }

  /* ---------------- keyboard ---------------- */

  document.addEventListener('keydown', function (e) {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    var tag = (e.target.tagName || '').toLowerCase();
    if (tag === 'input' || tag === 'textarea') return;

    var n = parseInt(e.key, 10);
    if (n >= 1 && n <= PAGES.length) { show(PAGES[n - 1], true); return; }

    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      var i = PAGES.indexOf(current);
      show(PAGES[e.key === 'ArrowRight'
        ? (i + 1) % PAGES.length
        : (i - 1 + PAGES.length) % PAGES.length], true);
      e.preventDefault();
    }
  });

  /* ---------------- video facades ---------------- */

  document.addEventListener('click', function (e) {
    var btn = e.target.closest ? e.target.closest('.video') : null;
    if (!btn || !btn.getAttribute('data-video')) return;

    var id = btn.getAttribute('data-video');
    var frame = document.createElement('iframe');
    frame.src = 'https://www.youtube-nocookie.com/embed/' + id + '?autoplay=1&rel=0';
    frame.title = btn.textContent.trim();
    frame.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; picture-in-picture';
    frame.allowFullscreen = true;

    btn.innerHTML = '';
    btn.appendChild(frame);
    btn.removeAttribute('data-video');
    btn.style.cursor = 'default';

    /* A strict-CSP preview blocks the embed; offer the real link instead of an empty box. */
    setTimeout(function () {
      var ok = false;
      try { ok = !!frame.contentWindow; } catch (err) { ok = true; }
      if (!ok) {
        btn.innerHTML =
          '<span class="cap" style="position:static;display:block;padding:24px;background:none">' +
          'This preview can&rsquo;t embed YouTube. ' +
          '<a href="https://youtu.be/' + id + '" style="color:var(--coral)">Watch on YouTube &rarr;</a></span>';
      }
    }, 1200);
  });

  /* ---------------- boot ---------------- */

  show((location.hash || '').replace('#/', ''), false);
})();
