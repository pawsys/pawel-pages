(function () {
  "use strict";

  var calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- the kite ---------- */
  var sky = document.getElementById("sky");
  var kite = document.getElementById("kite");
  var string = document.getElementById("string");
  var tail = document.getElementById("tail");
  var bows = document.querySelectorAll("#bows circle");

  var W = window.innerWidth, H = window.innerHeight;
  var k = { x: W < 760 ? W - 44 : W * 0.82, y: 120, vx: 0, vy: 0 };
  var target = { x: k.x, y: k.y };
  var lastMove = -1e9;
  var links = [];
  for (var i = 0; i < 9; i++) links.push({ x: k.x, y: k.y + 36 + i * 12 });

  function perch() {
    // small screens: sit above the big letters, not on them
    return W < 1180 ? 92 : Math.min(H * 0.24, 190);
  }

  function roost() {
    // phones: hug the right edge so the string stays in the margin
    return W < 760 ? W - 44 : W * 0.82;
  }

  function home(t) {
    var top = perch();
    return {
      x: roost() + Math.sin(t * 0.0006) * Math.min(W * 0.08, 90) * (W < 760 ? 0.3 : 1),
      y: top + Math.cos(t * 0.0009) * 34
    };
  }

  function aim(e) {
    var lift = e.pointerType === "mouse" ? 84 : 120;
    target.x = Math.max(30, Math.min(W - 30, e.clientX + 58));
    target.y = Math.max(44, Math.min(H - 50, e.clientY - lift));
    lastMove = performance.now();
  }

  function draw(t) {
    W = window.innerWidth || W;
    H = window.innerHeight || H;
    var idle = t - lastMove > 3200;
    if (idle) target = home(t);

    k.vx = (k.vx + (target.x - k.x) * 0.014) * 0.88;
    k.vy = (k.vy + (target.y - k.y) * 0.014) * 0.88;
    k.x += k.vx;
    k.y += k.vy;

    var lean = Math.max(-38, Math.min(38, k.vx * 2.6)) - 14 + Math.sin(t * 0.003) * 4;
    kite.setAttribute("transform", "translate(" + k.x.toFixed(1) + " " + k.y.toFixed(1) + ") rotate(" + lean.toFixed(1) + ")");

    // bottom tip of the kite, where string and tail meet
    var rad = lean * Math.PI / 180;
    var tipX = k.x - Math.sin(rad) * 36;
    var tipY = k.y + Math.cos(rad) * 36;

    // string runs to the bottom right corner, out of the way of the text, with a little sag
    var ax = W + 6, ay = H + 6;
    var mx = (ax + tipX) / 2 + (tipX - ax) * 0.12;
    var my = (ay + tipY) / 2 + Math.abs(ay - tipY) * 0.22;
    string.setAttribute("d", "M" + ax + " " + ay + "Q" + mx.toFixed(1) + " " + my.toFixed(1) + " " + tipX.toFixed(1) + " " + tipY.toFixed(1));

    // tail: a chain of points, each chasing the one before it
    var px = tipX, py = tipY, d = "M" + tipX.toFixed(1) + " " + tipY.toFixed(1);
    for (var j = 0; j < links.length; j++) {
      var L = links[j];
      var sway = Math.sin(t * 0.004 + j * 0.9) * 5;
      L.x += (px + sway - L.x) * 0.3;
      L.y += (py + 11 - L.y) * 0.3;
      d += "L" + L.x.toFixed(1) + " " + L.y.toFixed(1);
      px = L.x; py = L.y;
    }
    tail.setAttribute("d", d);
    for (var b = 0; b < bows.length; b++) {
      var at = links[2 + b * 3];
      bows[b].setAttribute("cx", at.x.toFixed(1));
      bows[b].setAttribute("cy", at.y.toFixed(1));
    }
  }

  function loop(t) {
    draw(t);
    requestAnimationFrame(loop);
  }

  window.addEventListener("resize", function () {
    if (calm) settle();
  });

  function settle() {
    // no motion wanted: park the kite and let everything come to rest
    lastMove = -1e9;
    k.x = roost(); k.y = perch(); k.vx = 0; k.vy = 0;
    for (var n = 0; n < 40; n++) draw(0);
  }

  if (sky && kite) {
    if (calm) {
      settle();
    } else {
      window.addEventListener("pointermove", aim, { passive: true });
      window.addEventListener("pointerdown", aim, { passive: true });
      requestAnimationFrame(loop);
    }
  }

  /* ---------- draggable stickers ---------- */
  var stickers = document.querySelectorAll(".sticker");
  Array.prototype.forEach.call(stickers, function (el) {
    var sx = 0, sy = 0, ox = 0, oy = 0, on = false;

    el.addEventListener("pointerdown", function (e) {
      on = true;
      sx = e.clientX; sy = e.clientY;
      ox = parseFloat(el.style.getPropertyValue("--dx")) || 0;
      oy = parseFloat(el.style.getPropertyValue("--dy")) || 0;
      el.classList.add("held");
      try { el.setPointerCapture(e.pointerId); } catch (err) { /* synthetic pointers have nothing to capture */ }
      e.preventDefault();
    });

    el.addEventListener("pointermove", function (e) {
      if (!on) return;
      var dx = e.clientX - sx, dy = e.clientY - sy;
      el.style.setProperty("--dx", (ox + dx) + "px");
      el.style.setProperty("--dy", (oy + dy) + "px");
    });

    function drop() {
      if (!on) return;
      on = false;
      el.classList.remove("held");
      // a little random tilt each time you let go
      el.style.setProperty("--r", (Math.random() * 30 - 15).toFixed(1) + "deg");
    }
    el.addEventListener("pointerup", drop);
    el.addEventListener("pointercancel", drop);
  });

  /* ---------- tap the wall, leave a coffee ring ---------- */
  var rings = [];
  document.addEventListener("click", function (e) {
    if (e.target.closest("a, button, .sticker, figure, .marquee")) return;
    if (String(window.getSelection())) return;

    var size = 78 + Math.random() * 66;
    var ring = document.createElement("i");
    ring.className = "ring";
    ring.setAttribute("aria-hidden", "true");
    ring.style.width = ring.style.height = size + "px";
    ring.style.left = Math.max(0, Math.min(document.documentElement.clientWidth - size, e.pageX - size / 2)) + "px";
    ring.style.top = (e.pageY - size / 2) + "px";
    ring.style.rotate = Math.floor(Math.random() * 360) + "deg";
    ring.style.opacity = (0.55 + Math.random() * 0.45).toFixed(2);
    document.body.appendChild(ring);

    rings.push(ring);
    if (rings.length > 36) rings.shift().remove();
  });
})();
