// =====================================================
//  PALETTE MENU — navigation
// =====================================================
const palette = document.getElementById("palette");
const splotches = palette.querySelectorAll(".splotch");
const sections = [...document.querySelectorAll("main > section")];
let currentSection = "home";
let lastPointerType = "mouse";

function goTo(id) {
  document.getElementById(id).scrollIntoView({ behavior: "smooth" });
}

splotches.forEach((splotch) => {
  splotch.addEventListener("pointerdown", (e) => (lastPointerType = e.pointerType));

  splotch.addEventListener("click", () => {
    const target = splotch.dataset.target;

    // black splotch does nothing if you're already home
    if (target === "home" && currentSection === "home") return;

    // on touch screens there's no hover, so show the icon briefly first
    if (lastPointerType === "touch") {
      splotch.classList.add("peek");
      setTimeout(() => {
        splotch.classList.remove("peek");
        goTo(target);
      }, 450);
    } else {
      goTo(target);
    }
  });
});

// Work out which section you're looking at
function updateCurrentSection() {
  let current = "home";
  sections.forEach((s) => {
    if (s.getBoundingClientRect().top <= innerHeight * 0.4) current = s.id;
  });
  currentSection = current;
  splotches.forEach((s) => s.classList.toggle("active", s.dataset.target === current));
}
addEventListener("scroll", updateCurrentSection, { passive: true });
updateCurrentSection();

// =====================================================
//  PALETTE MENU — drag by the thumb hole
// =====================================================
const hole = document.getElementById("thumbHole");
const MARGIN = 8; // gap kept between palette and screen edge
let pos = { x: 16, y: 100 };
let drag = null;

// keep the whole palette (and every splotch) on screen
function place(x, y) {
  const w = palette.offsetWidth;
  const h = palette.offsetHeight;
  x = Math.max(MARGIN, Math.min(x, innerWidth - w - MARGIN));
  y = Math.max(MARGIN, Math.min(y, innerHeight - h - MARGIN));
  pos = { x, y };
  palette.style.left = x + "px";
  palette.style.top = y + "px";
}

function savePosition() {
  try { localStorage.setItem("palettePos", JSON.stringify(pos)); } catch (e) {}
}

// start position: wherever you left it last time, or left-middle
(function initPosition() {
  let saved = null;
  try { saved = JSON.parse(localStorage.getItem("palettePos")); } catch (e) {}
  if (saved && typeof saved.x === "number") place(saved.x, saved.y);
  else place(16, (innerHeight - palette.offsetHeight) / 2);
})();

hole.addEventListener("pointerdown", (e) => {
  e.preventDefault();
  hole.setPointerCapture(e.pointerId);
  const rect = palette.getBoundingClientRect();
  drag = { dx: e.clientX - rect.left, dy: e.clientY - rect.top };
  palette.classList.add("dragging");
  document.body.classList.add("no-select");
});

hole.addEventListener("pointermove", (e) => {
  if (!drag) return;
  place(e.clientX - drag.dx, e.clientY - drag.dy);
});

function endDrag() {
  if (!drag) return;
  drag = null;
  palette.classList.remove("dragging");
  document.body.classList.remove("no-select");
  savePosition();
}
hole.addEventListener("pointerup", endDrag);
hole.addEventListener("pointercancel", endDrag);

// keyboard: focus the hole, then use arrow keys (hold Shift to move faster)
hole.addEventListener("keydown", (e) => {
  const step = e.shiftKey ? 40 : 12;
  const moves = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] };
  const m = moves[e.key];
  if (!m) return;
  e.preventDefault();
  place(pos.x + m[0], pos.y + m[1]);
  savePosition();
});

// if the window shrinks, nudge the palette back on screen
addEventListener("resize", () => place(pos.x, pos.y));

// =====================================================
//  ABOUT — click a CD to play it
// =====================================================
const cds = document.querySelectorAll(".cd");
const slot = document.getElementById("slot");
const slotDisc = document.getElementById("slotDisc");
const stageInner = document.getElementById("stageInner");
const nowPlaying = document.getElementById("nowPlaying");
const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
let playingCd = null;
let busy = false;

cds.forEach((cd) => cd.addEventListener("click", () => playCd(cd)));

function playCd(cd) {
  if (busy || cd === playingCd) return;
  busy = true;

  const label = cd.style.getPropertyValue("--label");
  const from = cd.querySelector(".disc").getBoundingClientRect();
  const to = slot.getBoundingClientRect();

  // take the old CD out
  slotDisc.classList.remove("on");
  if (playingCd) playingCd.classList.remove("playing");
  cd.classList.add("playing");

  // a copy of the disc flies from the shelf into the player
  const flying = document.createElement("span");
  flying.className = "disc";
  flying.style.cssText = `position:fixed; left:${from.left}px; top:${from.top}px; width:${from.width}px; height:${from.height}px; z-index:999; pointer-events:none;`;
  flying.style.setProperty("--label", label);
  document.body.appendChild(flying);

  const dx = to.left + to.width / 2 - (from.left + from.width / 2);
  const dy = to.top + to.height / 2 - (from.top + from.height / 2);
  const scale = (to.width * 0.92) / from.width;

  const anim = flying.animate(
    [
      { transform: "translate(0, 0) rotate(0deg) scale(1)" },
      { transform: `translate(${dx}px, ${dy}px) rotate(540deg) scale(${scale})` },
    ],
    { duration: reduceMotion ? 0 : 700, easing: "cubic-bezier(.5, 0, .2, 1)", fill: "forwards" }
  );

  anim.onfinish = () => {
    flying.remove();
    slotDisc.querySelector(".slot-spin").style.setProperty("--label", label);
    slotDisc.classList.add("on");
    showTrack(cd.dataset.cd);
    playingCd = cd;
    busy = false;
  };
}

function showTrack(name) {
  nowPlaying.textContent = `♪ now playing: ${name}`;
  stageInner.classList.add("swap");
  setTimeout(() => {
    stageInner.innerHTML = "";
    stageInner.appendChild(document.getElementById("cd-" + name).content.cloneNode(true));
    stageInner.classList.remove("swap");
  }, 250);
}

// footer year
document.getElementById("year").textContent = new Date().getFullYear();
