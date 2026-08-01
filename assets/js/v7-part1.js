document.addEventListener("DOMContentLoaded", () => {
  const rail = document.querySelector("#recommended-list");
  const dots = document.querySelector("#recommend-dots");
  if (rail && dots) {
    const buildDots = () => {
      const cards = [...rail.querySelectorAll(".drink-card")];
      if (!cards.length) return;
      dots.innerHTML = cards.map((_, i) => `<i class="${i === 0 ? "active" : ""}"></i>`).join("");
      const items = [...dots.querySelectorAll("i")];
      const update = () => {
        const center = rail.scrollLeft + rail.clientWidth / 2;
        let active = 0, closest = Infinity;
        cards.forEach((card, i) => { const d = Math.abs(center - (card.offsetLeft + card.offsetWidth / 2)); if (d < closest) { closest = d; active = i; } });
        items.forEach((dot, i) => dot.classList.toggle("active", i === active));
      };
      rail.addEventListener("scroll", () => requestAnimationFrame(update), { passive:true });
      update();
    };
    if (rail.querySelector(".drink-card")) buildDots();
    else { const mo = new MutationObserver(() => { if (rail.querySelector(".drink-card")) { buildDots(); mo.disconnect(); } }); mo.observe(rail,{childList:true}); }
  }
  const lightbox = document.querySelector(".lightbox");
  document.querySelectorAll("[data-lightbox]").forEach(button => button.addEventListener("click", () => {
    if (!lightbox) return;
    const caption = lightbox.querySelector("p");
    if (caption) caption.textContent = button.dataset.caption || "";
  }));
});
