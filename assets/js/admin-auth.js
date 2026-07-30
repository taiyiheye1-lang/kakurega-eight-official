document.addEventListener("DOMContentLoaded", async () => {
  const config = window.EIGHT_SUPABASE_CONFIG || {};
  const warning = document.querySelector("#config-warning");
  const form = document.querySelector("#login-form");
  const emailInput = document.querySelector("#login-email");
  const passwordInput = document.querySelector("#login-password");
  const submitButton = document.querySelector("#login-button");
  const message = document.querySelector("#login-message");
  const toggle = document.querySelector("#toggle-password");

  const configured =
    config.enabled === true &&
    typeof config.url === "string" &&
    typeof config.anonKey === "string" &&
    !config.url.includes("YOUR_") &&
    !config.anonKey.includes("YOUR_") &&
    window.supabase?.createClient;

  if (!configured) {
    warning.hidden = false;
    submitButton.disabled = true;
    return;
  }

  const client = window.supabase.createClient(config.url, config.anonKey, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
  });

  const { data: sessionData } = await client.auth.getSession();
  if (sessionData?.session) {
    const allowed = await isAdmin(client, sessionData.session.user.id);
    if (allowed) {
      location.replace("admin.html");
      return;
    }
    await client.auth.signOut();
  }

  toggle.addEventListener("click", () => {
    const showing = passwordInput.type === "text";
    passwordInput.type = showing ? "password" : "text";
    toggle.textContent = showing ? "表示" : "隠す";
  });

  form.addEventListener("submit", async event => {
    event.preventDefault();
    setMessage("");
    submitButton.disabled = true;
    submitButton.querySelector("span").textContent = "確認中…";

    try {
      const email = emailInput.value.trim();
      const password = passwordInput.value;

      if (!email || !password) throw new Error("メールアドレスとパスワードを入力してください。");

      const { data, error } = await client.auth.signInWithPassword({ email, password });
      if (error) throw error;
      if (!data.user) throw new Error("ログイン情報を確認できませんでした。");

      const allowed = await isAdmin(client, data.user.id);
      if (!allowed) {
        await client.auth.signOut();
        throw new Error("このアカウントには管理者権限がありません。");
      }

      setMessage("ログインしました。管理画面へ移動します。", true);
      setTimeout(() => location.replace("admin.html"), 450);
    } catch (error) {
      console.error(error);
      setMessage(toFriendlyMessage(error));
    } finally {
      submitButton.disabled = false;
      submitButton.querySelector("span").textContent = "ログイン";
    }
  });

  async function isAdmin(client, userId) {
    const { data, error } = await client
      .from("admin_users")
      .select("user_id")
      .eq("user_id", userId)
      .maybeSingle();
    if (error) {
      console.error(error);
      return false;
    }
    return Boolean(data);
  }

  function setMessage(text, success = false) {
    message.textContent = text;
    message.classList.toggle("success", success);
  }

  function toFriendlyMessage(error) {
    const text = String(error?.message || "");
    if (/invalid login credentials/i.test(text)) return "メールアドレスまたはパスワードが違います。";
    if (/email not confirmed/i.test(text)) return "メール認証が完了していません。";
    if (/failed to fetch|network/i.test(text)) return "通信できませんでした。インターネット接続を確認してください。";
    return text || "ログインに失敗しました。";
  }
});
