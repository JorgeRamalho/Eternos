(() => {
  const root = document.querySelector("[data-carousel]");
  if (!root) return;

  const slides = [...root.querySelectorAll(".slide")];
  const dotsWrap = root.querySelector(".carousel__dots");
  const prev = root.querySelector("[data-prev]");
  const next = root.querySelector("[data-next]");
  const progress = root.querySelector(".carousel__progress span");
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const duration = reduced ? 12000 : 7000;
  let index = 0;
  let timer = 0;
  let started = 0;
  let paused = false;

  slides.forEach((_, i) => {
    const dot = document.createElement("button");
    dot.className = "dot";
    dot.type = "button";
    dot.setAttribute("aria-label", `Ir para o slide ${i + 1}`);
    dot.addEventListener("click", () => go(i, true));
    dotsWrap.appendChild(dot);
  });

  const dots = [...dotsWrap.querySelectorAll(".dot")];

  const render = () => {
    slides.forEach((slide, i) => {
      const on = i === index;
      slide.classList.toggle("is-active", on);
      slide.setAttribute("aria-hidden", String(!on));
    });
    dots.forEach((dot, i) => {
      dot.classList.toggle("is-active", i === index);
      dot.setAttribute("aria-current", i === index ? "true" : "false");
    });
  };

  const tick = () => {
    if (paused) return;
    const elapsed = Date.now() - started;
    const ratio = Math.min(elapsed / duration, 1);
    if (progress) progress.style.width = `${ratio * 100}%`;
    if (ratio >= 1) go(index + 1);
  };

  const play = () => {
    window.clearInterval(timer);
    started = Date.now();
    if (progress) progress.style.width = "0%";
    timer = window.setInterval(tick, 40);
  };

  const go = (to, user = false) => {
    index = (to + slides.length) % slides.length;
    render();
    play();
    if (user) root.focus({ preventScroll: true });
  };

  prev?.addEventListener("click", () => go(index - 1, true));
  next?.addEventListener("click", () => go(index + 1, true));

  root.addEventListener("mouseenter", () => {
    paused = true;
  });
  root.addEventListener("mouseleave", () => {
    paused = false;
    started = Date.now() - (duration * (parseFloat(progress?.style.width || "0") / 100 || 0));
  });

  root.addEventListener("keydown", (event) => {
    if (event.key === "ArrowRight") go(index + 1, true);
    if (event.key === "ArrowLeft") go(index - 1, true);
  });

  let touchX = 0;
  root.addEventListener("touchstart", (event) => {
    touchX = event.changedTouches[0].clientX;
  }, { passive: true });
  root.addEventListener("touchend", (event) => {
    const dx = event.changedTouches[0].clientX - touchX;
    if (Math.abs(dx) > 40) go(index + (dx < 0 ? 1 : -1), true);
  });

  render();
  play();
})();
