-- 先にSupabase Authenticationで管理者ユーザーを作成してください。
-- Dashboard → Authentication → Users で対象ユーザーのUUIDをコピーし、
-- 下記のUUIDを書き換えて実行します。

insert into public.admin_users (user_id)
values ('00000000-0000-0000-0000-000000000000')
on conflict (user_id) do nothing;
