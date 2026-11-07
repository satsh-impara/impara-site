/* Impara · comportamiento del sitio.  Sin dependencias.
   (El idioma inicial lo fija un pequeño script en <head>, antes de pintar; aquí está el selector.) */
(function () {
  "use strict";

  var doc = document, root = doc.documentElement;
  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var finePointer = window.matchMedia && window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  var $ = function (s, c) { return (c || doc).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || doc).querySelectorAll(s)); };

  /* ------------------------------------------------------------------ idioma */
  function applyLang(lang) {
    root.lang = lang;
    var t = $("title");
    if (t && t.getAttribute("data-" + lang)) { doc.title = t.getAttribute("data-" + lang); }
    var m = $('meta[name="description"]');
    if (m && m.getAttribute("data-" + lang)) { m.setAttribute("content", m.getAttribute("data-" + lang)); }
    $$("[data-aria-es]").forEach(function (el) { el.setAttribute("aria-label", el.getAttribute("data-aria-" + lang)); });
  }
  applyLang(root.lang === "es" ? "es" : "en");
  $$(".lang button").forEach(function (b) {
    b.addEventListener("click", function () {
      var l = b.getAttribute("data-set");
      try { localStorage.setItem("impara-lang", l); } catch (e) { /* modo privado */ }
      applyLang(l);
    });
  });

  /* ------------------------------------------------------------------ cabecera */
  var header = $(".site-header");
  function onScrollHeader() { if (header) { header.classList.toggle("is-scrolled", window.scrollY > 24); } }
  onScrollHeader();
  var toggle = $(".nav-toggle");
  if (toggle) {
    toggle.addEventListener("click", function () {
      var open = header.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
    $$(".nav a").forEach(function (a) { a.addEventListener("click", function () { header.classList.remove("is-open"); }); });
  }

  /* enlace activo según la sección visible */
  var spy = $$(".nav a[href^='#']").map(function (a) { return { a: a, el: $(a.getAttribute("href")) }; }).filter(function (o) { return o.el; });
  function updateSpy() {
    var cur = null, mid = window.innerHeight * 0.4;
    spy.forEach(function (o) { var r = o.el.getBoundingClientRect(); if (r.top < mid && r.bottom > mid) { cur = o; } });
    spy.forEach(function (o) { o.a.classList.toggle("is-active", o === cur); });
  }

  /* ------------------------------------------------------------------ aparición al hacer scroll */
  var reveals = $$(".reveal");
  if ("IntersectionObserver" in window && !reduceMotion) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); } });
    }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add("is-in"); });
  }

  /* ------------------------------------------------------------------ paralaje de scroll
     data-parallax="v"  → desplazamiento vertical  (negativo = sube más rápido que la página)
     data-px="v"        → desplazamiento horizontal con el scroll                            */
  var plx = $$("[data-parallax], [data-px]").map(function (el) {
    return { el: el, sy: parseFloat(el.getAttribute("data-parallax")) || 0, sx: parseFloat(el.getAttribute("data-px")) || 0,
             host: el.closest(".panel, .section") || el.parentElement };
  });
  var ticking = false;
  function parallax() {
    ticking = false;
    var vh = window.innerHeight;
    for (var i = 0; i < plx.length; i++) {
      var p = plx[i], r = p.host.getBoundingClientRect();
      if (r.bottom < -300 || r.top > vh + 300) { continue; }
      var delta = (r.top + r.height / 2) - vh / 2;
      p.el.style.transform = "translate3d(" + (-delta * p.sx).toFixed(1) + "px," + (-delta * p.sy).toFixed(1) + "px,0)";
    }
  }
  function onScroll() {
    onScrollHeader(); updateSpy();
    if (!ticking) { ticking = true; requestAnimationFrame(parallax); }
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);
  updateSpy();
  if (!reduceMotion) { parallax(); }

  /* ------------------------------------------------------------------ profundidad con el cursor
     .depth[data-depth="px"]  → se desplaza con el cursor   ·   .tilt[data-tilt="deg"] → se inclina */
  if (!reduceMotion && finePointer) {
    var deps = $$("[data-depth]").map(function (el) { return { el: el, d: parseFloat(el.getAttribute("data-depth")) || 0 }; });
    var tilts = $$("[data-tilt]").map(function (el) { return { el: el, d: parseFloat(el.getAttribute("data-tilt")) || 0 }; });
    var tx = 0, ty = 0, cx = 0, cy = 0, running = false;
    var step = function () {
      cx += (tx - cx) * 0.07; cy += (ty - cy) * 0.07;
      for (var i = 0; i < deps.length; i++) {
        deps[i].el.style.transform = "translate3d(" + (cx * deps[i].d).toFixed(1) + "px," + (cy * deps[i].d).toFixed(1) + "px,0)";
      }
      for (var j = 0; j < tilts.length; j++) {
        tilts[j].el.style.transform = "perspective(1400px) rotateY(" + (cx * tilts[j].d).toFixed(2) + "deg) rotateX(" + (-cy * tilts[j].d).toFixed(2) + "deg)";
      }
      if (Math.abs(tx - cx) > 0.002 || Math.abs(ty - cy) > 0.002) { requestAnimationFrame(step); } else { running = false; }
    };
    window.addEventListener("pointermove", function (e) {
      tx = (e.clientX / window.innerWidth - 0.5) * 2; ty = (e.clientY / window.innerHeight - 0.5) * 2;
      if (!running) { running = true; requestAnimationFrame(step); }
    }, { passive: true });
  }

  /* ------------------------------------------------------------------ campo de estrellas */
  var sc = $("#stars");
  if (sc && sc.getContext) {
    var sx = sc.getContext("2d"), SW = 0, SH = 0, DPR = 1, stars = [], shoot = null, nextShoot = 4000;
    var LAYERS = [{ f: 0.04, n: 1.0, r: 0.6 }, { f: 0.10, n: 0.55, r: 0.9 }, { f: 0.22, n: 0.28, r: 1.3 }];
    var seed = 7; var rnd = function () { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
    var initStars = function () {
      DPR = Math.min(window.devicePixelRatio || 1, 2);
      SW = window.innerWidth; SH = window.innerHeight;
      sc.width = SW * DPR; sc.height = SH * DPR; sx.setTransform(DPR, 0, 0, DPR, 0, 0);
      stars = []; seed = 7;
      var base = Math.round(SW * SH / 5200);
      LAYERS.forEach(function (L, li) {
        for (var i = 0, n = Math.round(base * L.n); i < n; i++) {
          stars.push({ l: li, x: rnd() * SW, y: rnd() * SH, r: L.r * (0.5 + rnd() * 0.8), a: 0.35 + rnd() * 0.65, t: 0.6 + rnd() * 2.2, p: rnd() * 6.28 });
        }
      });
    };
    var drawStars = function (ts) {
      sx.clearRect(0, 0, SW, SH);
      var sy = window.scrollY;
      for (var i = 0; i < stars.length; i++) {
        var s = stars[i], f = LAYERS[s.l].f;
        var y = ((s.y - sy * f) % SH + SH) % SH;
        var a = s.a * (reduceMotion ? 1 : 0.72 + 0.28 * Math.sin(ts / 1000 * s.t + s.p));
        sx.globalAlpha = a; sx.fillStyle = "#fff";
        sx.beginPath(); sx.arc(s.x, y, s.r, 0, 6.2832); sx.fill();
      }
      sx.globalAlpha = 1;
      if (!reduceMotion) {
        if (!shoot && ts > nextShoot) {
          shoot = { x: SW * (0.35 + Math.random() * 0.6), y: SH * Math.random() * 0.4, vx: -9, vy: 4.2, life: 0 };
          nextShoot = ts + 9000 + Math.random() * 9000;
        }
        if (shoot) {
          shoot.x += shoot.vx; shoot.y += shoot.vy; shoot.life++;
          var g = sx.createLinearGradient(shoot.x, shoot.y, shoot.x - shoot.vx * 9, shoot.y - shoot.vy * 9);
          g.addColorStop(0, "rgba(255,255,255,.9)"); g.addColorStop(1, "rgba(255,255,255,0)");
          sx.strokeStyle = g; sx.lineWidth = 1.2; sx.beginPath(); sx.moveTo(shoot.x, shoot.y);
          sx.lineTo(shoot.x - shoot.vx * 9, shoot.y - shoot.vy * 9); sx.stroke();
          if (shoot.life > 70) { shoot = null; }
        }
      }
    };
    initStars();
    window.addEventListener("resize", function () { initStars(); if (reduceMotion) { drawStars(0); } });
    if (reduceMotion) { drawStars(0); window.addEventListener("scroll", function () { drawStars(0); }, { passive: true }); }
    else { (function loop(ts) { drawStars(ts); requestAnimationFrame(loop); })(0); }
  }

  /* ------------------------------------------------------------------ demo: "Construye la frase"
     Ejercicio ilustrativo (no es una captura real de la app): toca las fichas para armar la frase. */
  var demo = $(".demo");
  if (demo) {
    var answer = $(".ph-answer", demo), bank = $(".ph-bank", demo), go = $(".ph-go", demo);
    var tiles = $$(".tile", demo);
    var solution = ["Come", "stai,", "Anna?"];
    var okTimer = null;
    var placed = function () { return $$(".tile", answer); };
    var refresh = function () { go.disabled = demo.classList.contains("is-ok") ? false : placed().length !== solution.length; };
    var shuffleBack = function () {
      var order = tiles.slice().sort(function (a, b) { return a.getAttribute("data-w") < b.getAttribute("data-w") ? -1 : 1; });
      order.forEach(function (t) { bank.appendChild(t); });
    };
    tiles.forEach(function (t) {
      t.addEventListener("click", function () {
        if (demo.classList.contains("is-ok")) { return; }
        demo.classList.remove("is-bad");
        if (t.parentNode === bank) { answer.appendChild(t); } else { bank.appendChild(t); }
        refresh();
      });
    });
    go.addEventListener("click", function () {
      if (demo.classList.contains("is-ok")) {            // "Continuar": reinicia el ejemplo
        demo.classList.remove("is-ok"); shuffleBack(); refresh(); return;
      }
      var attempt = placed().map(function (t) { return t.getAttribute("data-w"); });
      if (attempt.join("|") === solution.join("|")) {
        demo.classList.add("is-ok"); refresh();
      } else {
        demo.classList.remove("is-bad"); void demo.offsetWidth; demo.classList.add("is-bad");
        clearTimeout(okTimer); okTimer = setTimeout(function () { demo.classList.remove("is-bad"); shuffleBack(); refresh(); }, 520);
      }
    });
    shuffleBack(); refresh();
  }

  /* ------------------------------------------------------------------ año del pie */
  $$("[data-year]").forEach(function (el) { el.textContent = new Date().getFullYear(); });
})();
