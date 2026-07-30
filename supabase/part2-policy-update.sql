-- Ver.6 Part2 追加確認SQL
-- database.sqlを既に実行済みの場合、このSQLだけを追加で実行してください。

-- site_settingsのupsertに必要な権限を明示します。
grant select, insert, update, delete on public.site_settings to authenticated;
grant select, insert, update, delete on public.drinks to authenticated;
grant select on public.admin_users to authenticated;

-- 既存ポリシーを安全に作り直します。
drop policy if exists "Admins can update settings" on public.site_settings;
create policy "Admins can update settings"
on public.site_settings
for all
to authenticated
using (
  exists (
    select 1 from public.admin_users a
    where a.user_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1 from public.admin_users a
    where a.user_id = (select auth.uid())
  )
);

drop policy if exists "Admin can read own admin record" on public.admin_users;
create policy "Admin can read own admin record"
on public.admin_users
for select
to authenticated
using (user_id = (select auth.uid()));
