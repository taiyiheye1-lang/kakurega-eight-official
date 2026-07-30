document.addEventListener("DOMContentLoaded", async () => {
  const config = window.EIGHT_SUPABASE_CONFIG || {};
  const loading = document.querySelector("#admin-loading");
  const app = document.querySelector("#admin-app");

  if (!isConfigured(config)) {
    location.replace("admin-login.html");
    return;
  }

  const client = window.supabase.createClient(config.url, config.anonKey, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
  });

  let drinks = [];
  let settings = {};
  let activeDrink = null;
  let toastTimer = null;

  try {
    const { data: userData, error: userError } = await client.auth.getUser();
    if (userError || !userData.user) {
      location.replace("admin-login.html");
      return;
    }

    const { data: adminRow, error: adminError } = await client
      .from("admin_users")
      .select("user_id")
      .eq("user_id", userData.user.id)
      .maybeSingle();

    if (adminError || !adminRow) {
      await client.auth.signOut();
      location.replace("admin-login.html?reason=not-admin");
      return;
    }

    document.querySelector("#admin-email").textContent = userData.user.email || "管理者";
    document.querySelector("#status-user").textContent = userData.user.email || "管理者";

    await loadAllData();

    loading.hidden = true;
    app.hidden = false;
    bindEvents();
  } catch (error) {
    console.error(error);
    alert("管理画面の読み込みに失敗しました。Supabaseの設定と通信状態を確認してください。");
    location.replace("admin-login.html");
  }

  async function loadAllData() {
    const [{ data: drinkRows, error: drinkError }, { data: settingRows, error: settingError }] =
      await Promise.all([
        client.from("drinks").select("*").order("sort_order", { ascending: true }),
        client.from("site_settings").select("key,value")
      ]);

    if (drinkError) throw drinkError;
    if (settingError) throw settingError;

    drinks = drinkRows || [];
    settings = Object.fromEntries((settingRows || []).map(row => [row.key, row.value]));

    renderMenu();
    fillSettings();
    updateSummaries();

    const now = new Date();
    document.querySelector("#status-database").textContent = "接続中";
    document.querySelector("#status-loaded").textContent = now.toLocaleString("ja-JP");
    document.querySelector("#status-count").textContent = `${drinks.length}件`;
    document.querySelector("#connection-status span").textContent = "Supabase接続中";
  }

  function bindEvents() {
    document.querySelector("#logout-button").addEventListener("click", async () => {
      if (!confirm("管理画面からログアウトしますか？")) return;
      await client.auth.signOut();
      location.replace("admin-login.html");
    });

    document.querySelector(".admin-nav").addEventListener("click", event => {
      const button = event.target.closest("[data-admin-tab]");
      if (!button) return;
      switchTab(button.dataset.adminTab, button);
    });

    document.querySelector("#admin-search").addEventListener("input", renderMenu);
    document.querySelector("#admin-category").addEventListener("change", renderMenu);

    document.querySelector("#admin-menu-list").addEventListener("click", event => {
      const button = event.target.closest("[data-edit-slug]");
      if (!button) return;
      openEditor(button.dataset.editSlug);
    });

    document.querySelector("#edit-close").addEventListener("click", closeEditor);
    document.querySelector("#edit-cancel").addEventListener("click", closeEditor);

    document.querySelector("#edit-form").addEventListener("submit", saveDrink);
    document.querySelector("#store-settings-form").addEventListener("submit", saveSettings);

    ["sweet","sour","bitter","strength","fresh"].forEach(key => {
      const input = document.querySelector(`#edit-${key}`);
      const output = document.querySelector(`#${key}-value`);
      input.addEventListener("input", () => output.textContent = input.value);
    });

    const dialog = document.querySelector("#edit-dialog");
    dialog.addEventListener("cancel", event => {
      event.preventDefault();
      closeEditor();
    });

    window.addEventListener("beforeunload", event => {
      if (dialog.open && dialog.dataset.dirty === "true") {
        event.preventDefault();
        event.returnValue = "";
      }
    });

    document.querySelectorAll("#edit-form input, #edit-form textarea, #edit-form select").forEach(input => {
      input.addEventListener("input", () => dialog.dataset.dirty = "true");
      input.addEventListener("change", () => dialog.dataset.dirty = "true");
    });
  }

  function switchTab(tab, button) {
    const titles = { menu: "メニュー管理", store: "店舗設定", status: "運用状況" };
    document.querySelectorAll(".admin-nav button").forEach(el => el.classList.toggle("active", el === button));
    document.querySelectorAll(".admin-tab").forEach(el => el.classList.remove("active"));
    document.querySelector(`#tab-${tab}`).classList.add("active");
    document.querySelector("#admin-page-title").textContent = titles[tab];
  }

  function renderMenu() {
    const query = document.querySelector("#admin-search")?.value.trim().toLowerCase() || "";
    const category = document.querySelector("#admin-category")?.value || "all";

    const filtered = drinks.filter(drink => {
      const text = `${drink.name_ja} ${drink.name_en} ${drink.description}`.toLowerCase();
      return (category === "all" || drink.category === category) && (!query || text.includes(query));
    });

    const list = document.querySelector("#admin-menu-list");
    const empty = document.querySelector("#admin-menu-empty");
    list.innerHTML = filtered.map(drinkRow).join("");
    empty.hidden = filtered.length > 0;
  }

  function drinkRow(d) {
    const status = [
      d.recommended ? '<span class="small-badge recommended">おすすめ</span>' : "",
      !d.available ? '<span class="small-badge soldout">売り切れ</span>' : '<span class="small-badge">販売中</span>'
    ].join("");

    return `
      <article class="admin-drink-row">
        <img src="${escapeAttr(d.image_url)}" alt="${escapeAttr(d.name_ja)}">
        <div class="admin-drink-row__name">
          <strong>${escapeHtml(d.name_ja)}</strong>
          <small>${escapeHtml(d.name_en || "")}</small>
        </div>
        <div class="admin-drink-row__price">¥${Number(d.price).toLocaleString("ja-JP")}</div>
        <div class="status-badges">${status}</div>
        <button class="row-edit-button" data-edit-slug="${escapeAttr(d.slug)}" type="button">編集する</button>
      </article>`;
  }

  function updateSummaries() {
    document.querySelector("#summary-total").textContent = drinks.length;
    document.querySelector("#summary-recommended").textContent = drinks.filter(d => d.recommended).length;
    document.querySelector("#summary-soldout").textContent = drinks.filter(d => !d.available).length;
  }

  function openEditor(slug) {
    activeDrink = drinks.find(d => d.slug === slug);
    if (!activeDrink) return;

    setValue("#edit-slug", activeDrink.slug);
    setValue("#edit-name-ja", activeDrink.name_ja);
    setValue("#edit-name-en", activeDrink.name_en);
    setValue("#edit-price", activeDrink.price);
    setValue("#edit-category", activeDrink.category);
    setValue("#edit-tag", activeDrink.tag);
    setValue("#edit-description", activeDrink.description);
    setChecked("#edit-recommended", activeDrink.recommended);
    setChecked("#edit-available", activeDrink.available);

    ["sweet","sour","bitter","strength","fresh"].forEach(key => {
      setValue(`#edit-${key}`, activeDrink[key]);
      document.querySelector(`#${key}-value`).textContent = activeDrink[key];
    });

    document.querySelector("#edit-title").textContent = `${activeDrink.name_ja}を編集`;
    document.querySelector("#edit-preview-name").textContent = activeDrink.name_ja;
    document.querySelector("#edit-image").src = activeDrink.image_url;
    document.querySelector("#edit-image").alt = activeDrink.name_ja;

    const dialog = document.querySelector("#edit-dialog");
    dialog.dataset.dirty = "false";
    dialog.showModal();
  }

  function closeEditor() {
    const dialog = document.querySelector("#edit-dialog");
    if (dialog.dataset.dirty === "true" && !confirm("保存していない変更があります。閉じてもよいですか？")) return;
    dialog.dataset.dirty = "false";
    dialog.close();
    activeDrink = null;
  }

  async function saveDrink(event) {
    event.preventDefault();
    if (!activeDrink) return;

    const saveButton = document.querySelector("#edit-save");
    const payload = {
      name_ja: value("#edit-name-ja").trim(),
      name_en: value("#edit-name-en").trim(),
      price: Number(value("#edit-price")),
      category: value("#edit-category"),
      tag: value("#edit-tag").trim(),
      description: value("#edit-description").trim(),
      recommended: checked("#edit-recommended"),
      available: checked("#edit-available"),
      sweet: Number(value("#edit-sweet")),
      sour: Number(value("#edit-sour")),
      bitter: Number(value("#edit-bitter")),
      strength: Number(value("#edit-strength")),
      fresh: Number(value("#edit-fresh"))
    };

    if (!payload.name_ja) return showToast("日本語名を入力してください。", "error");
    if (!Number.isFinite(payload.price) || payload.price < 0) return showToast("価格を正しく入力してください。", "error");

    if (!confirm(`${activeDrink.name_ja}の変更を保存しますか？`)) return;

    setButtonBusy(saveButton, true, "保存中…");
    try {
      const { data, error } = await client
        .from("drinks")
        .update(payload)
        .eq("slug", activeDrink.slug)
        .select()
        .single();

      if (error) throw error;

      const index = drinks.findIndex(d => d.slug === activeDrink.slug);
      drinks[index] = data;
      renderMenu();
      updateSummaries();

      document.querySelector("#edit-dialog").dataset.dirty = "false";
      document.querySelector("#edit-dialog").close();
      activeDrink = null;
      showToast("変更を保存しました。公開サイトへ反映されます。", "success");
    } catch (error) {
      console.error(error);
      showToast(friendlyError(error), "error");
    } finally {
      setButtonBusy(saveButton, false, "変更を保存");
    }
  }

  function fillSettings() {
    const form = document.querySelector("#store-settings-form");
    [...form.elements].forEach(element => {
      if (element.name && Object.hasOwn(settings, element.name)) element.value = settings[element.name] || "";
    });
  }

  async function saveSettings(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const button = form.querySelector("[type='submit']");
    const formData = new FormData(form);
    const entries = [...formData.entries()].map(([key, value]) => ({ key, value: String(value).trim() }));

    if (!confirm("店舗情報の変更を保存しますか？")) return;

    setButtonBusy(button, true, "保存中…");
    try {
      const { error } = await client.from("site_settings").upsert(entries, { onConflict: "key" });
      if (error) throw error;

      settings = Object.fromEntries(entries.map(row => [row.key, row.value]));
      showToast("店舗情報を保存しました。", "success");
    } catch (error) {
      console.error(error);
      showToast(friendlyError(error), "error");
    } finally {
      setButtonBusy(button, false, "保存する");
    }
  }

  function showToast(message, type = "success") {
    const toast = document.querySelector("#admin-toast");
    clearTimeout(toastTimer);
    toast.textContent = message;
    toast.className = `admin-toast ${type} show`;
    toastTimer = setTimeout(() => toast.classList.remove("show"), 3300);
  }

  function setButtonBusy(button, busy, text) {
    button.disabled = busy;
    button.textContent = text;
  }

  function friendlyError(error) {
    const text = String(error?.message || "");
    if (/row-level security|permission denied/i.test(text)) return "管理者権限が確認できません。admin_usersの登録を確認してください。";
    if (/failed to fetch|network/i.test(text)) return "通信できませんでした。接続を確認して再度お試しください。";
    return text || "保存に失敗しました。";
  }

  function isConfigured(config) {
    return config.enabled === true &&
      typeof config.url === "string" &&
      typeof config.anonKey === "string" &&
      !config.url.includes("YOUR_") &&
      !config.anonKey.includes("YOUR_") &&
      window.supabase?.createClient;
  }

  function value(selector) { return document.querySelector(selector).value; }
  function checked(selector) { return document.querySelector(selector).checked; }
  function setValue(selector, val) { document.querySelector(selector).value = val ?? ""; }
  function setChecked(selector, val) { document.querySelector(selector).checked = Boolean(val); }

  function escapeHtml(value = "") {
    return String(value).replace(/[&<>"']/g, char => ({
      "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
    })[char]);
  }
  function escapeAttr(value = "") { return escapeHtml(value); }
});
