# Ver.6 Part1 セットアップガイド

## 今回できるようになったこと

- 公開サイトがSupabaseのデータベースからメニューを読み込む
- Supabase未設定・通信エラー時は、従来のローカルデータへ自動で切り替わる
- TOPのおすすめとMENUの商品一覧が同じデータを使用する
- 管理者だけが後から編集できるRLSポリシーの土台を作成
- 店舗名・営業時間もデータベースから読み込める
- 画面右上の小さなバッジでデータ取得元を確認できる

## 1. Supabaseプロジェクトを作成

Supabaseへログインし、新しいプロジェクトを作成します。

## 2. データベースを作成

Supabase Dashboardの「SQL Editor」を開きます。

`supabase/database.sql` の中身をすべて貼り付けて実行してください。

以下が作成されます。

- drinks
- site_settings
- admin_users
- RLSポリシー
- 初期メニューデータ33種類

## 3. URLとanon keyを設定

Supabase Dashboardの Project Settings → API を開きます。

`assets/js/supabase-config.js` を開き、次を置き換えます。

```js
window.EIGHT_SUPABASE_CONFIG = {
  url: "https://あなたのプロジェクト.supabase.co",
  anonKey: "あなたのanonキー",
  enabled: true
};
```

重要：

- ブラウザへ設定するのはanon keyです
- service_roleキーは絶対にサイトへ入れないでください
- 認可はRLSで守ります

## 4. Live Serverで確認

`index.html`をLive Serverで開きます。

右上のバッジが次の表示になれば接続成功です。

```text
● データベース接続中
```

未設定やエラーの場合は、次の表示になります。

```text
● ローカルデータ
```

ローカル表示でもサイト自体は動きます。

## 5. 管理者ユーザーの準備

現時点では管理画面はまだありませんが、次のPart2に備えて管理者を登録できます。

1. Supabase Dashboard → Authentication → Users
2. Add userで管理者メールアドレスを登録
3. 作成されたユーザーのUUIDをコピー
4. `supabase/register-admin.sql`のUUIDを書き換える
5. SQL Editorで実行

## 画像について

Part1では、現在のWebP画像をGitHub Pages側から表示します。

Part3で以下を追加します。

- Supabase Storage
- スマホから画像アップロード
- ブラウザ内WebP変換
- 画像URLをdrinks.image_urlへ保存
- TOP・MENU・詳細へ即反映

## 次のPart2

- admin-login.html
- admin.html
- Supabase Authログイン
- 価格・説明・味チャート変更
- おすすめ・売り切れ切り替え
- 保存後に公開ページへ反映
