/*!
 * PAPIGRAPH — Page de maintenance
 * 1. Constellation de particules (canvas)
 * 2. Parallaxe, halo lumineux et inclinaison 3D au survol de la souris
 * 3. Copie du numéro de téléphone
 * 4. Salutation selon l'heure · 5. Barre d'appel mobile
 * Tous les effets sont désactivés si l'utilisateur préfère réduire les animations.
 */
(function () {
  'use strict';

  var root = document.documentElement;
  var mq = function (q) { return window.matchMedia && window.matchMedia(q).matches; };
  var reduceMotion = mq('(prefers-reduced-motion: reduce)');
  var finePointer = mq('(hover: hover) and (pointer: fine)');

  /* ---------------------------------------------------------------------
     1. Constellation de particules
     --------------------------------------------------------------------- */
  function particles() {
    var canvas = document.querySelector('.particles');
    if (!canvas || !canvas.getContext) return;
    var ctx = canvas.getContext('2d');
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var w = 0, h = 0, points = [], running = true, raf = null;
    var mouse = { x: -9999, y: -9999 };
    var LINK = 140;
    // Téléphones / tablettes : moins de particules et 30 images/s pour préserver la batterie
    var touch = !finePointer;
    var MAX = touch ? 28 : 80;
    var skip = false;

    function resize() {
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      var count = Math.max(18, Math.min(MAX, Math.round((w * h) / 17000)));
      points = [];
      for (var i = 0; i < count; i++) {
        points.push({
          x: Math.random() * w,
          y: Math.random() * h,
          vx: (Math.random() - 0.5) * 0.25,
          vy: (Math.random() - 0.5) * 0.25,
          r: Math.random() * 1.6 + 0.6,
          red: Math.random() < 0.18
        });
      }
    }

    function step() {
      if (touch && (skip = !skip)) { if (running) raf = window.requestAnimationFrame(step); return; }
      ctx.clearRect(0, 0, w, h);
      var i, j, p, q, dx, dy, d;

      for (i = 0; i < points.length; i++) {
        p = points[i];
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < -10) p.x = w + 10; else if (p.x > w + 10) p.x = -10;
        if (p.y < -10) p.y = h + 10; else if (p.y > h + 10) p.y = -10;
      }

      ctx.lineWidth = 1;
      for (i = 0; i < points.length; i++) {
        p = points[i];
        for (j = i + 1; j < points.length; j++) {
          q = points[j];
          dx = p.x - q.x; dy = p.y - q.y;
          d = dx * dx + dy * dy;
          if (d < LINK * LINK) {
            ctx.strokeStyle = 'rgba(30,32,79,' + (0.12 * (1 - Math.sqrt(d) / LINK)).toFixed(3) + ')';
            ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y); ctx.stroke();
          }
        }
        dx = p.x - mouse.x; dy = p.y - mouse.y;
        d = Math.sqrt(dx * dx + dy * dy);
        if (d < 180) {
          ctx.strokeStyle = 'rgba(229,18,20,' + (0.3 * (1 - d / 180)).toFixed(3) + ')';
          ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(mouse.x, mouse.y); ctx.stroke();
        }
      }

      for (i = 0; i < points.length; i++) {
        p = points[i];
        ctx.fillStyle = p.red ? 'rgba(229,18,20,.65)' : 'rgba(30,32,79,.35)';
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
      }

      if (running) raf = window.requestAnimationFrame(step);
    }

    var resizeTimer;
    window.addEventListener('resize', function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(resize, 200);
    });

    document.addEventListener('visibilitychange', function () {
      running = !document.hidden;
      if (running && !raf) raf = window.requestAnimationFrame(step);
      if (!running && raf) { window.cancelAnimationFrame(raf); raf = null; }
    });

    window.addEventListener('pointermove', function (e) {
      // le canvas est décalé de 24 px (marge de parallaxe)
      mouse.x = e.clientX + 24;
      mouse.y = e.clientY + 24;
    }, { passive: true });
    document.addEventListener('pointerleave', function () { mouse.x = mouse.y = -9999; });

    resize();
    raf = window.requestAnimationFrame(step);
    canvas.classList.add('is-on');
  }

  /* Démarre les effets décoratifs après l'affichage du contenu, pendant un temps mort du navigateur */
  function whenIdle(fn) {
    var introDelay = root.classList.contains('intro-seen') ? 0 : 900;
    setTimeout(function () {
      if ('requestIdleCallback' in window) window.requestIdleCallback(fn, { timeout: 1500 });
      else setTimeout(fn, 200);
    }, introDelay + 600);
  }

  /* ---------------------------------------------------------------------
     2. Parallaxe, halo et inclinaison 3D
     --------------------------------------------------------------------- */
  function pointerEffects() {
    var tilt = document.querySelector('.art-tilt');
    var frame = null;
    var state = { x: 0, y: 0, cx: 0, cy: 0 };

    function apply() {
      frame = null;
      root.style.setProperty('--px', (state.x * 12).toFixed(2) + 'px');
      root.style.setProperty('--py', (state.y * 12).toFixed(2) + 'px');
      root.style.setProperty('--mx', state.cx + 'px');
      root.style.setProperty('--my', state.cy + 'px');
      if (tilt) {
        tilt.style.setProperty('--rx', (-state.y * 10).toFixed(2) + 'deg');
        tilt.style.setProperty('--ry', (state.x * 14).toFixed(2) + 'deg');
      }
    }

    window.addEventListener('pointermove', function (e) {
      state.x = e.clientX / window.innerWidth - 0.5;
      state.y = e.clientY / window.innerHeight - 0.5;
      state.cx = e.clientX + 24;
      state.cy = e.clientY + 24;
      root.classList.add('has-pointer');
      if (!frame) frame = window.requestAnimationFrame(apply);
    }, { passive: true });

    document.addEventListener('pointerleave', function () {
      state.x = state.y = 0;
      root.classList.remove('has-pointer');
      if (!frame) frame = window.requestAnimationFrame(apply);
    });
  }

  /* ---------------------------------------------------------------------
     3. Copier le numéro de téléphone
     --------------------------------------------------------------------- */
  function copyButtons() {
    var toast = document.querySelector('.toast');
    var timer;

    function notify(message) {
      if (!toast) return;
      toast.textContent = message;
      // force le reflow pour relancer la transition
      void toast.offsetWidth;
      toast.classList.add('is-visible');
      clearTimeout(timer);
      timer = setTimeout(function () {
        toast.classList.remove('is-visible');
        setTimeout(function () { toast.textContent = ''; }, 400);
      }, 2200);
    }

    function fallbackCopy(text) {
      var area = document.createElement('textarea');
      area.value = text;
      area.setAttribute('readonly', '');
      area.style.position = 'fixed';
      area.style.opacity = '0';
      document.body.appendChild(area);
      area.select();
      var ok = false;
      try { ok = document.execCommand('copy'); } catch (err) { ok = false; }
      document.body.removeChild(area);
      return ok;
    }

    Array.prototype.forEach.call(document.querySelectorAll('[data-copy]'), function (btn) {
      btn.addEventListener('click', function () {
        var text = btn.getAttribute('data-copy');
        var done = function () { notify('Numéro copié : ' + text); };
        var fail = function () { notify(fallbackCopy(text) ? 'Numéro copié : ' + text : text); };
        if (navigator.clipboard && window.isSecureContext) {
          navigator.clipboard.writeText(text).then(done, fail);
        } else {
          fail();
        }
      });
    });
  }

  /* ---------------------------------------------------------------------
     4. Salutation selon l'heure du visiteur
     --------------------------------------------------------------------- */
  function greeting() {
    var el = document.querySelector('[data-greeting]');
    if (!el) return;
    var h = new Date().getHours();
    el.textContent = (h >= 5 && h < 18 ? 'Bonjour' : 'Bonsoir') + ' · ';
  }

  /* ---------------------------------------------------------------------
     5. Barre d'appel mobile : masquée quand les coordonnées sont visibles
     --------------------------------------------------------------------- */
  function callbar() {
    var bar = document.querySelector('.callbar');
    var contact = document.querySelector('.contact');
    if (!bar || !contact || !('IntersectionObserver' in window)) return;
    new IntersectionObserver(function (entries) {
      bar.classList.toggle('is-hidden', entries[0].isIntersecting);
    }, { threshold: 0.35 }).observe(contact);
  }

  greeting();
  callbar();
  copyButtons();
  if (!reduceMotion) {
    whenIdle(particles);
    if (finePointer) pointerEffects();
  }
})();
