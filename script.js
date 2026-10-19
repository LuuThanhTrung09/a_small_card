(function () {
  var stage = document.getElementById("stage");
  var pocket = document.getElementById("pocket");
  var card = document.getElementById("card");
  var seal = document.getElementById("seal");
  var note = document.getElementById("note");
  var hint = document.getElementById("hint");
  var layer = document.getElementById("petals");
  var calm =
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var opened = false;

  /* ---------- sound: realistic wax-sealed letter, synthesized with Web Audio ---------- */
  var ac = null;
  function audio() {
    try {
      if (!ac) {
        var C = window.AudioContext || window.webkitAudioContext;
        if (C) ac = new C();
      }
      if (ac && ac.state === "suspended") ac.resume();
    } catch (e) {}
    return ac;
  }
  function rnd(a, b) {
    return a + Math.random() * (b - a);
  }
  var swell = function (x) {
    return Math.sin(Math.PI * x);
  };
  var snap = function (x) {
    return Math.pow(1 - x, 3);
  };

  // Noise burst. With `density`, random sharp ticks that decay fast give the
  // dry crinkle of paper; without it, plain noise (friction / snap).
  function burst(o) {
    var a = audio();
    if (!a) return;
    var len = Math.floor(a.sampleRate * o.dur);
    var buf = a.createBuffer(1, len, a.sampleRate);
    var d = buf.getChannelData(0);
    var lvl = 0;
    for (var i = 0; i < len; i++) {
      var env = o.shape ? o.shape(i / len) : 1;
      if (o.density) {
        if (Math.random() < o.density) lvl = Math.max(lvl, rnd(0.3, 1));
        lvl *= o.decay || 0.993;
        d[i] = (Math.random() * 2 - 1) * (lvl + (o.floor || 0)) * env;
      } else {
        d[i] = (Math.random() * 2 - 1) * env;
      }
    }
    var src = a.createBufferSource();
    var g = a.createGain();
    var node = src;
    src.buffer = buf;
    if (o.hp) {
      var hp = a.createBiquadFilter();
      hp.type = "highpass";
      hp.frequency.value = o.hp;
      node.connect(hp);
      node = hp;
    }
    if (o.lp) {
      var lp = a.createBiquadFilter();
      lp.type = "lowpass";
      lp.frequency.value = o.lp;
      node.connect(lp);
      node = lp;
    }
    g.gain.value = o.vol;
    node.connect(g);
    g.connect(a.destination);
    src.start(a.currentTime + (o.start || 0));
  }

  // low, short "thump" under the crack (the body of the wax breaking)
  function thump(start, vol) {
    var a = audio();
    if (!a) return;
    var t = a.currentTime + start;
    var o = a.createOscillator();
    var g = a.createGain();
    o.type = "sine";
    o.frequency.setValueAtTime(230, t);
    o.frequency.exponentialRampToValueAtTime(80, t + 0.07);
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.09);
    o.connect(g);
    g.connect(a.destination);
    o.start(t);
    o.stop(t + 0.1);
  }

  // brittle wax seal cracking: sharp snap + a few little fragments
  function sealCrack(t) {
    burst({ start: t, dur: 0.035, vol: 0.55, hp: 2200, shape: snap });
    thump(t, 0.3);
    burst({
      start: t,
      dur: 0.14,
      vol: 0.3,
      density: 0.012,
      decay: 0.985,
      hp: 1800,
      shape: snap,
    });
    [0.028, 0.062, 0.1].forEach(function (k) {
      burst({
        start: t + k,
        dur: 0.016,
        vol: rnd(0.15, 0.32),
        hp: 3200,
        shape: snap,
      });
    });
  }

  function sfxOpen() {
    sealCrack(0);
    // envelope flap peeling up: dry paper crinkle
    burst({
      start: 0.14,
      dur: 0.55,
      vol: 0.26,
      density: 0.003,
      decay: 0.994,
      floor: 0.05,
      hp: 1200,
      lp: 7500,
      shape: swell,
    });
    // card sliding out: soft paper-on-paper friction with light crinkle
    burst({
      start: 0.6,
      dur: 1.0,
      vol: 0.2,
      density: 0.0015,
      decay: 0.996,
      floor: 0.12,
      hp: 600,
      lp: 4500,
      shape: swell,
    });
    // card settling
    burst({ start: 1.62, dur: 0.09, vol: 0.22, lp: 900, shape: snap });
  }
  function sfxTouch() {
    burst({
      dur: 0.35,
      vol: 0.14,
      density: 0.002,
      decay: 0.994,
      floor: 0.06,
      hp: 1400,
      lp: 6500,
      shape: swell,
    });
  }

  /* ---------- layout + petals + open animation ---------- */
  function measure() {
    pocket.style.setProperty("--card-h", card.offsetHeight + "px");
  }
  measure();
  window.addEventListener("resize", measure);
  if (document.fonts && document.fonts.ready)
    document.fonts.ready.then(measure);
  if (window.ResizeObserver) new ResizeObserver(measure).observe(card);

  function burstPetals() {
    if (calm) return;
    for (var i = 0; i < 26; i++) {
      var p = document.createElement("span");
      p.className = "petal";
      p.style.left = Math.random() * 100 + "%";
      p.style.setProperty("--dur", 4 + Math.random() * 3 + "s");
      p.style.setProperty("--delay", Math.random() * 1.2 + "s");
      p.style.setProperty("--drift", Math.random() * 120 - 60 + "px");
      p.style.setProperty("--spin", Math.random() * 540 - 270 + "deg");
      p.style.transform = "scale(" + (0.7 + Math.random() * 0.7) + ")";
      p.addEventListener("animationend", function (e) {
        e.target.remove();
      });
      layer.appendChild(p);
    }
  }

  function openLetter() {
    if (opened) return;
    opened = true;
    sfxOpen();
    measure();
    stage.classList.add("open");
    pocket.classList.add("open");
    card.removeAttribute("aria-hidden");
    seal.setAttribute("tabindex", "-1");
    seal.setAttribute("aria-hidden", "true");
    hint.textContent = "";
    setTimeout(
      function () {
        pocket.classList.add("leaving");
      },
      calm ? 20 : 1700,
    );
    setTimeout(
      function () {
        pocket.classList.add("done");
        burstPetals();
        note.hidden = false;
        hint.textContent = "Chạm vào thiệp để thả thêm hoa";
      },
      calm ? 60 : 2450,
    );
  }

  seal.addEventListener("click", openLetter);
  card.addEventListener("click", function () {
    if (opened) {
      sfxTouch();
      burstPetals();
    }
  });
})();
