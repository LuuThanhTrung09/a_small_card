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
        burst();
        note.hidden = false;
        hint.textContent = "Chạm vào thiệp để thả thêm hoa";
      },
      calm ? 60 : 2450,
    );
  }

  seal.addEventListener("click", openLetter);
  card.addEventListener("click", function () {
    if (opened) burst();
  });
})();
