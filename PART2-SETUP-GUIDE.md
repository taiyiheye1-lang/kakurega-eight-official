# Ver.6 Part2 セットアップ手順

## Part2で追加されたもの

- `admin-login.html`：管理者ログイン
- `admin.html`：管理画面
- 価格・名前・英語名・説明の変更
- 味チャートの変更
- 今日のおすすめ ON/OFF
- 販売中・売り切れ ON/OFF
- 店舗名・営業時間・Instagram・Google Map URLの変更
- 保存確認、保存結果表示、未保存変更の警告
- 管理者以外を管理画面から排除

画像アップロードはPart3で追加します。

---

## 1. Supabase接続設定を確認

`assets/js/supabase-config.js`を開きます。

```js
window.EIGHT_SUPABASE_CONFIG = {
  url: "https://あなたのプロジェクト.supabase.co",
  anonKey: "あなたのPublishable key",
  enabled: true
};
```

`enabled: true`になっている必要があります。

---

## 2. Part2用SQLを実行

SupabaseのSQL Editorで次のファイルを実行します。

```text
supabase/part2-policy-update.sql
```

実行後に「Success. No rows returned」と表示されれば成功です。

---

## 3. 管理者アカウントを作る

Supabase左メニューから次を開きます。

```text
Authentication
→ Users
```

「Add user」または「Create user」を押します。

管理者が使用するメールアドレスとパスワードを登録してください。

重要：

- 「Auto Confirm User」がある場合はONにするとすぐログインできます
- パスワードは他人に共有しないでください
- このアカウントは公開サイトのお客さん用ではありません

---

## 4. 管理者UUIDを登録

Authentication → Usersで、作ったユーザーのUUIDをコピーします。

VS Codeで次を開きます。

```text
supabase/register-admin.sql
```

この部分を、

```sql
values ('00000000-0000-0000-0000-000000000000')
```

実際のUUIDに変更します。

例：

```sql
values ('12345678-abcd-1234-abcd-1234567890ab')
```

変更したSQLをSupabaseのSQL Editorへ貼り付けて実行します。

---

## 5. 管理者として登録されたか確認

SupabaseのDatabase → Tables → `admin_users`を開きます。

1行表示されていれば登録成功です。

---

## 6. 管理者ログイン画面を開く

Live Serverで次を開きます。

```text
admin-login.html
```

作成した管理者メールアドレスとパスワードでログインします。

成功すると`admin.html`へ移動します。

---

## 7. 動作確認

管理画面でジントニックなどを開きます。

次のいずれかを一度変更してください。

- 価格
- 説明
- おすすめ
- 売り切れ

保存後に公開サイトの`menu.html`を再読み込みします。

変更が表示されればPart2は完成です。

---

## 注意

- SupabaseのSecret key・service_role keyはサイトへ貼らないでください
- 使用するのはPublishable keyまたは旧anon keyです
- 管理者権限はRLSと`admin_users`で判定します
- `admin.html`のURLを知られても、ログインと管理者登録がなければ編集できません

---

## 次のPart3

- Supabase Storage
- スマホから画像選択
- WebP変換・圧縮
- 画像プレビュー
- 既存画像差し替え
- 公開サイトへ即時反映
