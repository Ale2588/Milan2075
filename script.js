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

  /* ---------- 5. Supabase init ---------- */
  var SUPABASE_URL = 'https://oqdszxrltgcptinkefjn.supabase.co';
  var SUPABASE_KEY = 'sb_publishable_0Hjh4fs3JY5SkNDC2qBUCg_Ubl44hls';

  var sbClient = null;
  try { sbClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY); }
  catch(e) { console.warn('Supabase non inizializzato:', e); }

  /* ---------- 6. Carica archivio da Supabase ---------- */
  var visionsContainer = document.getElementById('visions-container');
  var archCount = document.getElementById('arch-count');

  var MAX_HOME_CARDS = 6;
  var isArchivioPage = window.location.pathname.indexOf('archivio') !== -1;

  function renderArchivio(visioni) {
    if (!visionsContainer) return;
    if (!visioni || !visioni.length) {
      visionsContainer.innerHTML = '<p class="visions__empty">Nessuna visione pubblicata ancora. Sii il primo.</p>';
      return;
    }
    var toShow = isArchivioPage ? visioni : visioni.slice(0, MAX_HOME_CARDS);
    var html = toShow.map(function(v, i) {
      var autore = (v.nome || 'Anonimo') + (v.quartiere ? ' · ' + v.quartiere : '');
      var num = String(i + 1).padStart(2, '0');
      var thumb = v.immagine_url
        ? '<div class="vision__thumb"><img src="' + v.immagine_url + '" alt="immagine visione"></div>'
        : '';
      return '<a class="vision vision--link" href="visione.html?id=' + v.id + '">' +
        '<div class="vision__head"><span class="vision__tag">' + (v.tema || 'Visione') + '</span><span class="vision__num">&#8470;&nbsp;' + num + '</span></div>' +
        thumb +
        '<p class="vision__text">' + v.testo.substring(0, 140) + (v.testo.length > 140 ? '&hellip;' : '') + '</p>' +
        '<div class="vision__meta"><span class="vision__author">' + autore + '</span><span class="vision__year">&#8594; 2075</span></div>' +
        '</a>';
    }).join('');

    if (!isArchivioPage && visioni.length > MAX_HOME_CARDS) {
      html += '<a class="visions__more" href="archivio.html">Vedi tutte le ' + visioni.length + ' visioni &#8594;</a>';
    }

    visionsContainer.innerHTML = html;
    if (archCount) archCount.textContent = visioni.length;
  }

  /* mappa zona → quartieri */
  var ZONE_MAP = {
    'centro': ['Duomo / Centro Storico','Brera','Castello / Cairoli','Repubblica / Porta Nuova'],
    'nord-est': ['Isola / Garibaldi','Centrale / Stazione','Porta Venezia / Buenos Aires','NoLo / Loreto','Greco / Turro','Crescenzago / Adriano','Maggiolina'],
    'est': ['Città Studi / Lambrate','Ortica / Casoretto','Cimiano / Feltre','Naviglio Martesana'],
    'sud-est': ['Porta Romana','Lodi / Corvetto','Rogoredo / Santa Giulia','Vigentino / Chiaravalle'],
    'sud': ['Navigli / Darsena / Ticinese','Porta Genova / Tortona','Barona','Gratosoglio / Stadera'],
    'sud-ovest': ['Giambellino / Lorenteggio','Famagosta / Bisceglie','San Siro / Ippodromo'],
    'ovest': ['De Angeli / Wagner','Sempione / Fiera','CityLife / Portello','QT8 / Monte Stella','Gallaratese / Bonola'],
    'nord-ovest': ['Chinatown / Sarpi','Bovisa / Dergano','Certosa / Quarto Oggiaro','Vialba / Affori / Comasina'],
    'nord': ['Niguarda / Ca Granda','Bicocca','Zara / Maciachini','Bruzzano / Parco Nord']
  };

  var tutteLeVisioni = [];
  var filtroTema = '';
  var filtroZona = '';

  function applicaFiltri() {
    var filtrate = tutteLeVisioni.filter(function(v) {
      var okTema = !filtroTema || v.tema === filtroTema;
      var okZona = !filtroZona || (ZONE_MAP[filtroZona] && ZONE_MAP[filtroZona].indexOf(v.quartiere) !== -1);
      return okTema && okZona;
    });
    renderArchivio(filtrate);
  }

  /* bottoni filtro tema */
  var filterTema = document.getElementById('filter-tema');
  if (filterTema) {
    filterTema.addEventListener('click', function(e) {
      var btn = e.target.closest('.filter-btn');
      if (!btn) return;
      filterTema.querySelectorAll('.filter-btn').forEach(function(b) { b.classList.remove('active'); });
      btn.classList.add('active');
      filtroTema = btn.dataset.value;
      applicaFiltri();
    });
  }

  /* bottoni filtro zona */
  var filterZona = document.getElementById('filter-zona');
  if (filterZona) {
    filterZona.addEventListener('click', function(e) {
      var btn = e.target.closest('.filter-btn');
      if (!btn) return;
      filterZona.querySelectorAll('.filter-btn').forEach(function(b) { b.classList.remove('active'); });
      btn.classList.add('active');
      filtroZona = btn.dataset.value;
      applicaFiltri();
    });
  }

  function caricaArchivio() {
    if (!sbClient) { if (visionsContainer) visionsContainer.innerHTML = '<p class="visions__empty">Errore connessione.</p>'; return; }
    sbClient.from('visioni').select('id,nome,quartiere,tema,testo,immagine_url,created_at')
      .eq('approvata', true)
      .order('created_at', { ascending: false })
      .then(function(res) {
        if (res.error) { console.error(res.error); return; }
        tutteLeVisioni = res.data || [];
        applicaFiltri();

        /* aggiorna contatori hero */
        var n = tutteLeVisioni.length;
        var quartieri = new Set(tutteLeVisioni.map(function(v) { return v.quartiere; }).filter(Boolean));
        visionCount = n;
        animateCount(n, 1700);
        var qEl = document.getElementById('qrt-count');
        if (qEl) {
          var dur = 1700, start = performance.now();
          var target = quartieri.size;
          if (!reduceMotion) {
            (function tick(now) {
              var t = Math.min(1, (now - start) / dur);
              var e = 1 - Math.pow(1 - t, 3);
              qEl.textContent = Math.round(target * e);
              if (t < 1) requestAnimationFrame(tick);
            })(performance.now());
          } else {
            qEl.textContent = target;
          }
        }
      });
  }

  caricaArchivio();

  /* ---------- 7. Form ---------- */
  var form = document.getElementById('vision-form');
  var textarea = document.getElementById('visione');
  var wordcount = document.getElementById('wordcount');
  var errorBox = document.getElementById('form-error');
  var submitBtn = document.getElementById('submit-btn');
  var successBox = document.getElementById('form-success');
  var MAX_WORDS = 150, MIN_WORDS = 10, MAX_IMG_MB = 5;

  function countWords(s) { s = s.trim(); return s === '' ? 0 : s.split(/\s+/).length; }

  if (textarea && wordcount) {
    textarea.addEventListener('input', function() {
      var w = countWords(textarea.value);
      wordcount.textContent = w + ' / 150 parole';
      wordcount.classList.toggle('is-over', w > MAX_WORDS);
      if (errorBox) errorBox.hidden = true;
    });
  }

  var imgInput = document.getElementById('immagine');
  var uploadArea = document.getElementById('upload-area');
  var placeholder = document.getElementById('upload-placeholder');
  var preview = document.getElementById('upload-preview');
  var previewImg = document.getElementById('preview-img');
  var removeBtn = document.getElementById('upload-remove');

  function showPreview(file) {
    var reader = new FileReader();
    reader.onload = function(e) {
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
    imgInput.addEventListener('change', function() {
      var file = imgInput.files && imgInput.files[0];
      if (!file) return;
      if (file.size > MAX_IMG_MB * 1024 * 1024) { showError("Immagine troppo grande (max 5MB)."); clearPreview(); return; }
      showPreview(file);
    });
  }

  if (removeBtn) removeBtn.addEventListener('click', function(e) { e.stopPropagation(); clearPreview(); });

  if (uploadArea) {
    uploadArea.addEventListener('dragover', function(e) { e.preventDefault(); uploadArea.style.borderColor = 'rgba(183,242,76,0.6)'; });
    uploadArea.addEventListener('dragleave', function() { uploadArea.style.borderColor = ''; });
    uploadArea.addEventListener('drop', function(e) {
      e.preventDefault(); uploadArea.style.borderColor = '';
      var file = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
      if (!file || !file.type.startsWith('image/')) return;
      if (imgInput) { var dt = new DataTransfer(); dt.items.add(file); imgInput.files = dt.files; }
      showPreview(file);
    });
  }

  function showError(msg) { if (!errorBox) return; errorBox.textContent = '⚠ ' + msg; errorBox.hidden = false; }

  if (form) {
    form.addEventListener('submit', function(e) {
      e.preventDefault();
      var w = countWords(textarea ? textarea.value : '');
      if (w < MIN_WORDS) { showError('Scrivi almeno qualche riga.'); return; }
      if (w > MAX_WORDS) { showError('Supera le 150 parole.'); return; }
      if (!sbClient) { showError('Errore di connessione.'); return; }
      if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Invio in corso...'; }
      if (errorBox) errorBox.hidden = true;

      var file = imgInput && imgInput.files && imgInput.files[0];

      function salva(imgUrl) {
        var payload = {
          nome: (document.getElementById('nome')||{}).value || null,
          eta: parseInt((document.getElementById('eta')||{}).value) || null,
          email: (document.getElementById('email')||{}).value || null,
          telefono: (document.getElementById('telefono')||{}).value || null,
          quartiere: (document.getElementById('quartiere')||{}).value || null,
          tema: (document.getElementById('tema')||{}).value || null,
          testo: textarea.value.trim(),
          immagine_url: imgUrl || null,
          consent_community: !!((document.getElementById('consent-community')||{}).checked),
          consent_followup: !!((document.getElementById('consent-followup')||{}).checked),
          approvata: false
        };
        sbClient.from('visioni').insert(payload).then(function(res) {
          if (res.error) {
            showError('Errore nel salvataggio. Riprova.');
            if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Invia la tua visione \u2192'; }
          } else {
            if (submitBtn) submitBtn.hidden = true;
            if (successBox) successBox.hidden = false;
            visionCount += 1; setVisionDisplay(visionCount);
          }
        });
      }

      if (file) {
        var ext = file.name.split('.').pop();
        var path = 'visione-' + Date.now() + '.' + ext;
        sbClient.storage.from('visioni-immagini').upload(path, file, { upsert: false }).then(function(res) {
          var imgUrl = res.error ? null : sbClient.storage.from('visioni-immagini').getPublicUrl(path).data.publicUrl;
          salva(imgUrl);
        });
      } else {
        salva(null);
      }
    });
  }
})();
