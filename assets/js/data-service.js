(() => {
  const config = window.EIGHT_SUPABASE_CONFIG || {};
  const localDrinks = Array.isArray(window.EIGHT_DRINKS) ? window.EIGHT_DRINKS : [];
  const localSettings = window.EIGHT_SETTINGS || {};
  let client = null;
  let source = "local";

  const isConfigured = () =>
    config.enabled === true &&
    typeof config.url === "string" &&
    typeof config.anonKey === "string" &&
    !config.url.includes("YOUR_") &&
    !config.anonKey.includes("YOUR_") &&
    window.supabase?.createClient;

  function normalizeDrink(row) {
    return {
      id: row.slug ?? row.id,
      slug: row.slug ?? row.id,
      file: row.file_name ?? "",
      name: row.name_ja ?? row.name,
      en: row.name_en ?? row.en,
      category: row.category,
      price: Number(row.price ?? 0),
      tag: row.tag ?? "",
      desc: row.description ?? row.desc ?? "",
      sweet: Number(row.sweet ?? 0),
      sour: Number(row.sour ?? 0),
      bitter: Number(row.bitter ?? 0),
      strength: Number(row.strength ?? 0),
      fresh: Number(row.fresh ?? 0),
      image: row.image_url ?? row.image,
      available: row.available !== false,
      recommended: row.recommended === true,
      sortOrder: Number(row.sort_order ?? 0)
    };
  }

  async function loadFromSupabase() {
    if (!isConfigured()) throw new Error("Supabase is not configured.");

    client ??= window.supabase.createClient(config.url, config.anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    });

    const [{ data: drinkRows, error: drinkError }, { data: settingRows, error: settingError }] =
      await Promise.all([
        client
          .from("drinks")
          .select("*")
          .order("sort_order", { ascending: true }),
        client
          .from("site_settings")
          .select("key,value")
      ]);

    if (drinkError) throw drinkError;
    if (settingError) throw settingError;

    const remoteSettings = Object.fromEntries(
      (settingRows || []).map(row => [row.key, row.value])
    );

    source = "supabase";
    return {
      drinks: (drinkRows || []).map(normalizeDrink),
      settings: { ...localSettings, ...remoteSettings },
      source
    };
  }

  async function loadSiteData() {
    try {
      return await loadFromSupabase();
    } catch (error) {
      console.warn("[EIGHT] Supabaseの読み込みに失敗したため、ローカルデータを使用します。", error);
      source = "local";
      return {
        drinks: localDrinks.map(normalizeDrink),
        settings: localSettings,
        source,
        error
      };
    }
  }

  window.EIGHT_DATA = {
    loadSiteData,
    getClient: () => client,
    getSource: () => source,
    isConfigured
  };
})();
