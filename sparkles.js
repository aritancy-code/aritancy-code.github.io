// =====================================================
//  MAGIC SPARKLES: little twinkling stars that drift down
//  behind everything on the page. Just for fun!
//  To turn them off, remove the <script src="sparkles.js"> line in index.html.
// =====================================================
(function () {
  // ---- settings: change these to taste ----
  const COUNT = 60;          // how many sparkles at once (more = busier)
  const MIN_SIZE = 0.8;      // smallest sparkle (px)
  const MAX_SIZE = 6;        // biggest sparkle (px): most are small, only a few get this big
  const OPACITY = 0.4;       // how see-through they are (0 = invisible, 1 = solid)
  const GLOW = 6;            // how soft and glowy they are (bigger = blurrier, less star-shaped)
  const SPEED = 0.35;        // how fast they fall
  const COLOURS = ["#ffffff", "#ffe9a8", "#cfe3ff", "#f6c8ff"]; // white, gold, pale blue, pale pink

  // people who ask their computer for less motion don't get sparkles
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  // a full-screen drawing surface that sits behind the page and ignores the mouse
  const canvas = document.createElement("canvas");
  canvas.setAttribute("aria-hidden", "true");
  canvas.style.cssText = "position:fixed; inset:0; width:100%; height:100%; z-index:-1; pointer-events:none;";
  document.body.prepend(canvas);
  const ctx = canvas.getContext("2d");

  let w, h, dpr;
  function resize() {
    dpr = window.devicePixelRatio || 1;
    w = innerWidth;
    h = innerHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); // keeps sparkles crisp on sharp screens
  }
  resize();
  addEventListener("resize", resize);

  const rand = (a, b) => a + Math.random() * (b - a);

  function makeSparkle(startAnywhere) {
    return {
      x: rand(0, w),
      y: startAnywhere ? rand(0, h) : rand(-20, -5), // new ones start just above the screen
      size: MIN_SIZE + Math.pow(Math.random(), 2.5) * (MAX_SIZE - MIN_SIZE), // lots of tiny ones, a few big ones
      fall: rand(0.4, 1) * SPEED,
      sway: rand(0.2, 0.8),          // how far it drifts side to side
      swaySpeed: rand(0.005, 0.02),
      phase: rand(0, Math.PI * 2),
      twinkle: rand(0.02, 0.06),     // how fast it twinkles
      colour: COLOURS[Math.floor(Math.random() * COLOURS.length)],
    };
  }

  const sparkles = Array.from({ length: COUNT }, () => makeSparkle(true));

  // draws a soft glowing haze with a faint 4-pointed star in the middle
  function drawStar(x, y, r, alpha, colour) {
    // soft round glow
    const halo = ctx.createRadialGradient(x, y, 0, x, y, r * GLOW);
    halo.addColorStop(0, colour);
    halo.addColorStop(1, "transparent");
    ctx.globalAlpha = alpha * OPACITY * 0.35;
    ctx.fillStyle = halo;
    ctx.shadowBlur = 0;
    ctx.beginPath();
    ctx.arc(x, y, r * GLOW, 0, Math.PI * 2);
    ctx.fill();

    // faint star shape on top
    ctx.globalAlpha = alpha * OPACITY;
    ctx.fillStyle = colour;
    ctx.shadowColor = colour;
    ctx.shadowBlur = r * GLOW;
    ctx.beginPath();
    ctx.moveTo(x, y - r * 2);
    ctx.quadraticCurveTo(x, y, x + r * 2, y);
    ctx.quadraticCurveTo(x, y, x, y + r * 2);
    ctx.quadraticCurveTo(x, y, x - r * 2, y);
    ctx.quadraticCurveTo(x, y, x, y - r * 2);
    ctx.fill();
  }

  function frame() {
    ctx.clearRect(0, 0, w, h);
    for (let i = 0; i < sparkles.length; i++) {
      const s = sparkles[i];
      s.phase += s.swaySpeed;
      s.y += s.fall;
      s.x += Math.sin(s.phase) * s.sway * 0.3;

      // twinkle: brightness and size pulse gently
      const glow = 0.45 + 0.55 * Math.abs(Math.sin(s.phase * (s.twinkle / s.swaySpeed)));
      drawStar(s.x, s.y, s.size * (0.7 + 0.3 * glow), glow, s.colour);

      // fell off the bottom? start again at the top
      if (s.y > h + 20) sparkles[i] = makeSparkle(false);
    }
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
