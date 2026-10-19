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

  /* sound: synthesized with Web Audio, no audio files needed */
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
  // soft filtered noise = paper rustle
  function rustle(start, dur, freq, q, vol) {
    var a = audio();
    if (!a) return;
    var len = Math.floor(a.sampleRate * dur);
    var buf = a.createBuffer(1, len, a.sampleRate);
    var d = buf.getChannelData(0);
    for (var i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    var src = a.createBufferSource();
    var f = a.createBiquadFilter();
    var g = a.createGain();
    var t = a.currentTime + start;
    src.buffer = buf;
    f.type = "bandpass";
    f.frequency.value = freq;
    f.Q.value = q;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + dur * 0.25);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f);
    f.connect(g);
    g.connect(a.destination);
    src.start(t);
  }
  // music-box style note
  function tone(start, freq, dur, vol) {
    var a = audio();
    if (!a) return;
    var t = a.currentTime + start;
    [1, 2].forEach(function (mul, k) {
      var o = a.createOscillator();
      var g = a.createGain();
      o.type = "sine";
      o.frequency.value = freq * mul;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(vol / (k + 1), t + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g);
      g.connect(a.destination);
      o.start(t);
      o.stop(t + dur + 0.05);
    });
  }
  function sfxOpen() {
    tone(0, 523, 0.18, 0.07); // seal click
    rustle(0.05, 0.4, 1800, 0.8, 0.22); // flap lifts
    rustle(0.6, 0.9, 900, 0.6, 0.16); // card slides out
  }
  function sfxChime() {
    [784, 988, 1175, 1568].forEach(function (f, i) {
      tone(i * 0.14, f, 1.6, 0.11);
    });
  }
  function sfxTwinkle() {
    var scale = [784, 880, 988, 1175, 1318, 1568];
    for (var i = 0; i < 2; i++)
      tone(
        i * 0.12,
        scale[Math.floor(Math.random() * scale.length)],
        1.0,
        0.07,
      );
  }

  function measure() {
    pocket.style.setProperty("--card-h", card.offsetHeight + "px");
  }
  measure();
  window.addEventListener("resize", measure);
  if (document.fonts && document.fonts.ready)
    document.fonts.ready.then(measure);
  if (window.ResizeObserver) new ResizeObserver(measure).observe(card);

  function burst() {
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
        sfxChime();
        burst();
        note.hidden = false;
        hint.textContent = "Chạm vào thiệp để thả thêm hoa";
      },
      calm ? 60 : 2450,
    );
  }

  seal.addEventListener("click", openLetter);
  card.addEventListener("click", function () {
    if (opened) {
      sfxTwinkle();
      burst();
    }
  });
})();
