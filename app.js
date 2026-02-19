const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

function clampSpotlightPosition(x, y) {
  const margin = 8;
  const cx = clamp(x, margin, window.innerWidth - margin);
  const cy = clamp(y, margin, window.innerHeight - margin);
  return { x: cx, y: cy };
}

function setSpotlightPosition(darknessEl, x, y) {
  const pos = clampSpotlightPosition(x, y);
  darknessEl.style.setProperty("--spot-x", `${pos.x}px`);
  darknessEl.style.setProperty("--spot-y", `${pos.y}px`);
}

function setupImageFallbackLabels() {
  const photos = document.querySelectorAll(".photo");
  for (const fig of photos) {
    const img = fig.querySelector("img");
    if (!img) continue;

    const label = img.getAttribute("src")?.split("/").pop() ?? "image";
    fig.dataset.label = label;

    img.addEventListener("error", () => {
      fig.classList.add("missing");
    });
  }
}

function init() {
  const stage = document.getElementById("stage");
  const darkness = document.getElementById("darkness");
  const toggleLights = document.getElementById("toggleLights");
  if (!stage || !darkness) return;

  setupImageFallbackLabels();

  let dragging = false;
  let maybeDrag = false;
  let downId = null;
  let downX = 0;
  let downY = 0;
  let topZ = 600; // above #darkness (z-index: 500), below UI (>= 900)

  const center = clampSpotlightPosition(window.innerWidth / 2, window.innerHeight / 2);
  let targetX = center.x;
  let targetY = center.y;
  let currentX = center.x;
  let currentY = center.y;

  const setTarget = (x, y) => {
    const pos = clampSpotlightPosition(x, y);
    targetX = pos.x;
    targetY = pos.y;
  };

  const tick = () => {
    const ease = dragging ? 0.24 : 0.16;
    currentX += (targetX - currentX) * ease;
    currentY += (targetY - currentY) * ease;
    setSpotlightPosition(darkness, currentX, currentY);
    window.requestAnimationFrame(tick);
  };
  window.requestAnimationFrame(tick);

  const moveFromEvent = (e) => {
    setTarget(e.clientX, e.clientY);
  };

  stage.addEventListener("pointerdown", (e) => {
    // Don't let our drag handler interfere with the UI button.
    if (e.target?.closest?.("#toggleLights")) return;

    maybeDrag = true;
    dragging = false;
    downId = e.pointerId;
    downX = e.clientX;
    downY = e.clientY;
    moveFromEvent(e);
  });

  stage.addEventListener("pointermove", (e) => {
    if (!maybeDrag) return;
    if (downId !== e.pointerId) return;

    const dx = e.clientX - downX;
    const dy = e.clientY - downY;
    const dist2 = dx * dx + dy * dy;

    // Small threshold so clicks still register without becoming drags.
    if (!dragging && dist2 > 20) {
      dragging = true;
      document.body.classList.add("dragging");
      stage.setPointerCapture(e.pointerId);
    }

    if (dragging) moveFromEvent(e);
  });

  const endDrag = () => {
    dragging = false;
    maybeDrag = false;
    downId = null;
    document.body.classList.remove("dragging");
  };

  stage.addEventListener("pointerup", endDrag);
  stage.addEventListener("pointercancel", endDrag);
  stage.addEventListener("lostpointercapture", endDrag);

  stage.addEventListener("click", (e) => {
    // Clicking the toggle shouldn't change z-order of anything behind it.
    if (e.target?.closest?.("#toggleLights")) return;

    const el = e.target.closest?.(".discoverable");
    if (!el) return;
    topZ += 1;
    el.style.zIndex = String(topZ);
  });

  if (toggleLights) {
    const sync = () => {
      const on = document.body.classList.contains("lights-on");
      toggleLights.setAttribute("aria-pressed", String(on));
      toggleLights.textContent = on ? "Spotlight" : "Show all";
    };

    sync();
    toggleLights.addEventListener("click", () => {
      document.body.classList.toggle("lights-on");
      sync();
    });
  }

  window.addEventListener("resize", () => {
    setTarget(targetX, targetY);
  });
}

document.addEventListener("DOMContentLoaded", init);
