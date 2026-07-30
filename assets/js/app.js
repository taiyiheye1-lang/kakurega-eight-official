document.addEventListener("DOMContentLoaded", async () => {
  const siteData = await window.EIGHT_DATA.loadSiteData();
  const drinks = siteData.drinks || [];
  const settings = siteData.settings || {};

  document.documentElement.dataset.dataSource = siteData.source;
  updateConnectionBadge(siteData.source);
  applySiteSettings(settings);

  const yen = n => `¥${Number(n).toLocaleString("ja-JP")}`;
  const stars = n => `<b>${"★".repeat(Math.max(0,n))}</b>${"☆".repeat(Math.max(0,5-n))}`;

  function recommendedCard(d) {
    return `
      <article class="drink-card" data-drink-id="${escapeHtml(d.id)}">
        <span class="drink-card__badge">${escapeHtml(d.tag)}</span>
        <img src="${escapeAttr(d.image)}" alt="${escapeAttr(d.name)}" loading="lazy">
        <div class="drink-card__body">
          <h3>${escapeHtml(d.name)}</h3>
          <p>${escapeHtml(d.en)}</p>
          <strong>${yen(d.price)}</strong>
          <div class="mini-meter"><span>おすすめ度</span><i style="--value:${Math.max(d.fresh,d.sweet,d.strength)*20}%"></i></div>
        </div>
      </article>`;
  }

  function menuCard(d) {
    return `
      <article class="menu-item ${d.available ? "" : "sold-out"}" data-drink-id="${escapeHtml(d.id)}" tabindex="0">
        <span class="menu-item__badge">${d.available ? escapeHtml(d.tag) : "SOLD OUT"}</span>
        <img src="${escapeAttr(d.image)}" alt="${escapeAttr(d.name)}" loading="lazy">
        <div class="menu-item__body">
          <h3>${escapeHtml(d.name)}</h3><p>${escapeHtml(d.en)}</p><strong>${yen(d.price)}</strong>
        </div>
      </article>`;
  }

  function detailMarkup(d) {
    return `
      <img class="detail-image" src="${escapeAttr(d.image)}" alt="${escapeAttr(d.name)}">
      <div class="detail-content">
        <h2>${escapeHtml(d.name)}</h2>
        <p class="english">${escapeHtml(d.en)}</p>
        <p class="description">${escapeHtml(d.desc)}</p>
        <p class="detail-price">${yen(d.price)}</p>
        <div class="taste-grid">
          <div class="taste-row"><span>甘さ</span><span class="stars">${stars(d.sweet)}</span></div>
          <div class="taste-row"><span>酸味</span><span class="stars">${stars(d.sour)}</span></div>
          <div class="taste-row"><span>苦味</span><span class="stars">${stars(d.bitter)}</span></div>
          <div class="taste-row"><span>アルコール感</span><span class="stars">${stars(d.strength)}</span></div>
          <div class="taste-row"><span>スッキリ度</span><span class="stars">${stars(d.fresh)}</span></div>
        </div>
      </div>`;
  }

  function openDrink(id) {
    const d = drinks.find(x => x.id === id);
    if (!d) return;
    const dialog = document.querySelector("#drink-dialog");
    const content = document.querySelector("#drink-dialog-content");
    if (dialog && content) {
      content.innerHTML = detailMarkup(d);
      dialog.showModal();
    }
  }

  if (document.body.dataset.page === "home") {
    const list = document.querySelector("#recommended-list");
    if (list) {
      list.innerHTML = drinks
        .filter(d => d.recommended && d.available)
        .slice(0, 4)
        .map(recommendedCard)
        .join("");
    }
  }

  if (document.body.dataset.page === "menu") {
    const grid = document.querySelector("#menu-grid");
    const search = document.querySelector("#menu-search");
    const filters = document.querySelector("#category-filters");
    const empty = document.querySelector("#menu-empty");
    let active = "all";

    function renderMenu() {
      const query = (search?.value || "").trim().toLowerCase();
      const filtered = drinks.filter(d => {
        const categoryOk = active === "all" || d.category === active;
        const text = `${d.name} ${d.en} ${d.desc}`.toLowerCase();
        return categoryOk && (!query || text.includes(query));
      });
      grid.innerHTML = filtered.map(menuCard).join("");
      empty.hidden = filtered.length !== 0;
    }

    search?.addEventListener("input", renderMenu);
    filters?.addEventListener("click", event => {
      const button = event.target.closest("[data-filter]");
      if (!button) return;
      active = button.dataset.filter;
      filters.querySelectorAll("button").forEach(b =>
        b.classList.toggle("active", b === button)
      );
      renderMenu();
    });

    grid?.addEventListener("click", event => {
      const card = event.target.closest("[data-drink-id]");
      if (card) openDrink(card.dataset.drinkId);
    });

    grid?.addEventListener("keydown", event => {
      if (event.key !== "Enter" && event.key !== " ") return;
      const card = event.target.closest("[data-drink-id]");
      if (!card) return;
      event.preventDefault();
      openDrink(card.dataset.drinkId);
    });

    document.querySelector(".drink-dialog__close")?.addEventListener("click", () => {
      document.querySelector("#drink-dialog")?.close();
    });

    renderMenu();
  }

  initReveal();
  initParallax();
  initLightbox();
});

function applySiteSettings(settings) {
  document.querySelectorAll("[data-setting='storeName']").forEach(el => {
    el.textContent = settings.storeName || el.textContent;
  });
  document.querySelectorAll("[data-setting='hours']").forEach(el => {
    el.textContent = settings.hours || el.textContent;
  });
}

function updateConnectionBadge(source) {
  const badge = document.querySelector("#data-source-badge");
  if (!badge) return;
  const remote = source === "supabase";
  badge.classList.toggle("is-online", remote);
  badge.querySelector("span").textContent = remote
    ? "データベース接続中"
    : "ローカルデータ";
}

function initReveal() {
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });

  document.querySelectorAll(".reveal").forEach(el => observer.observe(el));
}

function initParallax() {
  const hero = document.querySelector(".hero__media img");
  let ticking = false;
  addEventListener("scroll", () => {
    if (!hero || ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      hero.style.transform = `scale(1.025) translateY(${Math.min(scrollY * 0.06, 34)}px)`;
      ticking = false;
    });
  }, { passive: true });
}

function initLightbox() {
  const lightbox = document.querySelector(".lightbox");
  document.querySelectorAll("[data-lightbox]").forEach(button => {
    button.addEventListener("click", () => {
      if (!lightbox) return;
      lightbox.querySelector("img").src = button.dataset.lightbox;
      lightbox.classList.add("open");
      lightbox.setAttribute("aria-hidden", "false");
    });
  });
  lightbox?.querySelector("button")?.addEventListener("click", () => {
    lightbox.classList.remove("open");
    lightbox.setAttribute("aria-hidden", "true");
  });
}

function escapeHtml(value = "") {
  return String(value).replace(/[&<>"']/g, char => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
  })[char]);
}
function escapeAttr(value = "") {
  return escapeHtml(value);
}
