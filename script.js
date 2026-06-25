/* =========================================================
   Milano 2075 — The Long Shot
   Comportamenti: navigazione, contatore, lucciole,
   timeline animata, validazione e invio del form.
   JavaScript puro, nessuna libreria.
   ========================================================= */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- 1. Nav: diventa opaca allo scroll ---------- */
  var nav = document.getElementById('nav');
  function onScroll() {
    if (!nav) return;
    nav.classList.toggle('is-solid', window.scrollY > 56);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- 2. Contatore visioni (conta da 0 al target) ---------- */
  var visEl = document.getElementById('vis-count');
  var archEl = document.getElementById('arch-count');
  var visionCount = visEl ? parseInt(visEl.getAttribute('data-counter'), 10) || 0 : 47;

  function setVisionDisplay(n) {
    if (visEl) visEl.textContent = n;
    if (archEl) archEl.textContent = n;
  }

  function animateCount(to, dur) {
    if (reduceMotion) { setVisionDisplay(to); return; }
    var start = performance.now();
    function tick(now) {
      var t = Math.min(1, (now - start) / dur);
      var e = 1 - Math.pow(1 - t, 3);          // ease-out cubica
      setVisionDisplay(Math.round(to * e));
      if (t < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }
  animateCount(visionCount, 1700);

  /* ---------- 3. Lucciole bioluminescenti sull'hero ---------- */
  var canvas = document.getElementById('fireflies');
  if (canvas && !reduceMotion) {
    var ctx = canvas.getContext('2d');
    var W = 0, H = 0, dpr = 1;
    var N = 48, parts = [];

    function size() {
      var host = canvas.parentElement;
      if (!host) return;
      var r = host.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = r.width; H = r.height;
      canvas.width = Math.max(1, W * dpr);
      canvas.height = Math.max(1, H * dpr);
    }

    for (var i = 0; i < N; i++) {
      parts.push({
        x: Math.random(),
        y: Math.random(),
        r: Math.random() * 1.7 + 0.6,
        vy: -(Math.random() * 0.00045 + 0.00018),
        vx: (Math.random() - 0.5) * 0.0003,
        ph: Math.random() * Math.PI * 2,
        tw: Math.random() * 0.8 + 0.6,
        amber: Math.random() < 0.16
      });
    }

    function draw(now) {
      if (!W) { requestAnimationFrame(draw); return; }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      for (var k = 0; k < parts.length; k++) {
        var p = parts[k];
        p.y += p.vy; p.x += p.vx;
        if (p.y < -0.04) { p.y = 1.04; p.x = Math.random(); }
        if (p.x < -0.04) p.x = 1.04;
        if (p.x > 1.04) p.x = -0.04;
        var tw = 0.4 + 0.6 * (0.5 + 0.5 * Math.sin(now * 0.0014 * p.tw + p.ph));
        var px = p.x * W, py = p.y * H, rad = p.r;
        var col = p.amber ? '232,170,70' : '183,242,76';
        var g = ctx.createRadialGradient(px, py, 0, px, py, rad * 7);
        g.addColorStop(0, 'rgba(' + col + ',' + (0.85 * tw) + ')');
        g.addColorStop(0.35, 'rgba(' + col + ',' + (0.22 * tw) + ')');
        g.addColorStop(1, 'rgba(' + col + ',0)');
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(px, py, rad * 7, 0, 6.2832); ctx.fill();
        ctx.fillStyle = 'rgba(' + col + ',' + (0.95 * tw) + ')';
        ctx.beginPath(); ctx.arc(px, py, rad, 0, 6.2832); ctx.fill();
      }
      requestAnimationFrame(draw);
    }

    size();
    window.addEventListener('resize', size);
    requestAnimationFrame(draw);
  }

  /* ---------- 4. Timeline che cresce quando entra in vista ---------- */
  var timeline = document.getElementById('timeline');
  var fill = document.getElementById('tl-fill');
  var years = document.querySelectorAll('.tl-year');
  var dots = document.querySelectorAll('.tl-dot');
  var TL_N = 5;

  function setTimeline(p) {
    if (fill) fill.style.width = (p * 100) + '%';
    for (var i = 0; i < TL_N; i++) {
      var on = p >= (i / (TL_N - 1)) - 0.0001;
      if (years[i]) years[i].classList.toggle('is-on', on);
      if (dots[i]) dots[i].classList.toggle('is-on', on);
    }
  }

  function growTimeline() {
    if (reduceMotion) { setTimeline(1); return; }
    var start = performance.now(), dur = 1600;
    function tick(now) {
      var t = Math.min(1, (now - start) / dur);
      setTimeline(1 - Math.pow(1 - t, 3));
      if (t < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  if (timeline) {
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) { growTimeline(); io.disconnect(); }
        });
      }, { threshold: 0.3 });
      io.observe(timeline);
    } else {
      growTimeline();
    }
  }

  /* ---------- 5. Form: conteggio parole, upload immagine, validazione, invio ---------- */
  var form = document.getElementById('vision-form');
  var textarea = document.getElementById('visione');
  var wordcount = document.getElementById('wordcount');
  var errorBox = document.getElementById('form-error');
  var submitBtn = document.getElementById('submit-btn');
  var successBox = document.getElementById('form-success');
  var MAX_WORDS = 150;
  var MIN_WORDS = 10;
  var MAX_IMG_MB = 5;

  function countWords(s) {
    s = s.trim();
    return s === '' ? 0 : s.split(/\s+/).length;
  }

  if (textarea && wordcount) {
    textarea.addEventListener('input', function () {
      var w = countWords(textarea.value);
      wordcount.textContent = w + ' / ' + MAX_WORDS + ' parole';
      wordcount.classList.toggle('is-over', w > MAX_WORDS);
      if (errorBox) errorBox.hidden = true;
    });
  }

  /* Upload immagine — anteprima */
  var imgInput = document.getElementById('immagine');
  var uploadArea = document.getElementById('upload-area');
  var placeholder = document.getElementById('upload-placeholder');
  var preview = document.getElementById('upload-preview');
  var previewImg = document.getElementById('preview-img');
  var removeBtn = document.getElementById('upload-remove');

  function showPreview(file) {
    var reader = new FileReader();
    reader.onload = function (e) {
      if (previewImg) previewImg.src = e.target.result;
      if (placeholder) placeholder.hidden = true;
      if (preview) preview.hidden = false;
    };
    reader.readAsDataURL(file);
  }

  function clearPreview() {
    if (imgInput) imgInput.value = '';
    if (previewImg) previewImg.src = '';
    if (preview) preview.hidden = true;
    if (placeholder) placeholder.hidden = false;
  }

  if (imgInput) {
    imgInput.addEventListener('change', function () {
      var file = imgInput.files && imgInput.files[0];
      if (!file) return;
      if (file.size > MAX_IMG_MB * 1024 * 1024) {
        showError("L'immagine supera i " + MAX_IMG_MB + "MB. Scegline una piu' leggera.");
        clearPreview();
        return;
      }
      showPreview(file);
    });
  }

  if (removeBtn) {
    removeBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      clearPreview();
    });
  }

  if (uploadArea) {
    uploadArea.addEventListener('dragover', function (e) {
      e.preventDefault();
      uploadArea.style.borderColor = 'rgba(183,242,76,0.6)';
    });
    uploadArea.addEventListener('dragleave', function () {
      uploadArea.style.borderColor = '';
    });
    uploadArea.addEventListener('drop', function (e) {
      e.preventDefault();
      uploadArea.style.borderColor = '';
      var file = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
      if (!file || !file.type.startsWith('image/')) return;
      if (imgInput) {
        var dt = new DataTransfer();
        dt.items.add(file);
        imgInput.files = dt.files;
      }
      showPreview(file);
    });
  }

  function showError(msg) {
    if (!errorBox) return;
    errorBox.textContent = 'E ' + msg;
    errorBox.hidden = false;
  }

  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var w = countWords(textarea ? textarea.value : '');
      if (w < MIN_WORDS) { showError('Scrivi almeno qualche riga — la tua visione conta.'); return; }
      if (w > MAX_WORDS) { showError('La visione supera le 150 parole. Accorciala un po.'); return; }

      if (errorBox) errorBox.hidden = true;
      if (submitBtn) submitBtn.hidden = true;
      if (successBox) successBox.hidden = false;
      visionCount += 1;
      setVisionDisplay(visionCount);
    });
  }
})();
