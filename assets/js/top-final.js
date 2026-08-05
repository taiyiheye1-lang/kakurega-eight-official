document.addEventListener("DOMContentLoaded", () => {
  initRecommendationDots();
  initGalleryLightbox();
  initRefinedReveal();
});

function initRecommendationDots() {
  const rail = document.querySelector("#recommended-list");
  const dots = document.querySelector("#recommend-dots");
  if (!rail || !dots) return;

  const build = () => {
    const cards = [...rail.querySelectorAll(".drink-card")];
    if (!cards.length) return false;
    dots.innerHTML = cards.map((_, i) => `<i class="${i === 0 ? "active" : ""}"></i>`).join("");
    const items = [...dots.querySelectorAll("i")];
    const update = () => {
      const center = rail.scrollLeft + rail.clientWidth / 2;
      let active = 0;
      let distance = Infinity;
      cards.forEach((card, index) => {
        const current = Math.abs(center - (card.offsetLeft + card.offsetWidth / 2));
        if (current < distance) { distance = current; active = index; }
      });
      items.forEach((dot, index) => dot.classList.toggle("active", index === active));
    };
    rail.addEventListener("scroll", () => requestAnimationFrame(update), { passive: true });
    update();
    return true;
  };

  if (build()) return;
  const observer = new MutationObserver(() => { if (build()) observer.disconnect(); });
  observer.observe(rail, { childList: true });
}

function initGalleryLightbox() {
  const lightbox = document.querySelector(".lightbox");
  const buttons = [...document.querySelectorAll("[data-lightbox]")];
  if (!lightbox || !buttons.length) return;
  const image = lightbox.querySelector("img");
  const caption = lightbox.querySelector("figcaption");
  let index = 0;
  let touchStart = 0;

  const show = nextIndex => {
    index = (nextIndex + buttons.length) % buttons.length;
    const button = buttons[index];
    image.src = button.dataset.lightbox;
    image.alt = button.querySelector("img")?.alt || "店内写真";
    caption.textContent = button.dataset.caption || "";
  };

  const open = nextIndex => {
    show(nextIndex);
    lightbox.classList.add("open");
    lightbox.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  };

  const close = () => {
    lightbox.classList.remove("open");
    lightbox.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  };

  buttons.forEach((button, buttonIndex) => button.addEventListener("click", () => open(buttonIndex)));
  lightbox.querySelector(".lightbox__close")?.addEventListener("click", close);
  lightbox.querySelector(".lightbox__prev")?.addEventListener("click", () => show(index - 1));
  lightbox.querySelector(".lightbox__next")?.addEventListener("click", () => show(index + 1));
  lightbox.addEventListener("click", event => { if (event.target === lightbox) close(); });
  lightbox.addEventListener("touchstart", event => { touchStart = event.changedTouches[0].clientX; }, { passive: true });
  lightbox.addEventListener("touchend", event => {
    const delta = event.changedTouches[0].clientX - touchStart;
    if (Math.abs(delta) > 45) show(index + (delta < 0 ? 1 : -1));
  }, { passive: true });
  document.addEventListener("keydown", event => {
    if (!lightbox.classList.contains("open")) return;
    if (event.key === "Escape") close();
    if (event.key === "ArrowLeft") show(index - 1);
    if (event.key === "ArrowRight") show(index + 1);
  });
}


function initRefinedReveal() {
  const elements = [...document.querySelectorAll(".reveal")];
  if (!elements.length) return;

  if (!("IntersectionObserver" in window)) {
    elements.forEach(element => element.classList.add("is-visible"));
    return;
  }

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("is-visible");
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.12, rootMargin: "0px 0px -30px 0px" });

  elements.forEach(element => observer.observe(element));
}
