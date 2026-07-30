-- 隠れ家えいと Ver.6 Part1
-- Supabase SQL Editorで実行してください。

create extension if not exists pgcrypto;

create table if not exists public.drinks (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name_ja text not null,
  name_en text not null default '',
  category text not null check (category in ('cocktail','whisky','nonalcohol','beer','wine','other')),
  price integer not null default 0 check (price >= 0),
  tag text not null default '',
  description text not null default '',
  sweet smallint not null default 0 check (sweet between 0 and 5),
  sour smallint not null default 0 check (sour between 0 and 5),
  bitter smallint not null default 0 check (bitter between 0 and 5),
  strength smallint not null default 0 check (strength between 0 and 5),
  fresh smallint not null default 0 check (fresh between 0 and 5),
  image_url text not null default '',
  available boolean not null default true,
  recommended boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.site_settings (
  key text primary key,
  value text not null default '',
  updated_at timestamptz not null default now()
);

create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists drinks_set_updated_at on public.drinks;
create trigger drinks_set_updated_at
before update on public.drinks
for each row execute function public.set_updated_at();

drop trigger if exists settings_set_updated_at on public.site_settings;
create trigger settings_set_updated_at
before update on public.site_settings
for each row execute function public.set_updated_at();

alter table public.drinks enable row level security;
alter table public.site_settings enable row level security;
alter table public.admin_users enable row level security;

-- 公開サイトはメニューと店舗設定を閲覧できます。
drop policy if exists "Public can read drinks" on public.drinks;
create policy "Public can read drinks"
on public.drinks for select
to anon, authenticated
using (true);

drop policy if exists "Public can read settings" on public.site_settings;
create policy "Public can read settings"
on public.site_settings for select
to anon, authenticated
using (true);

-- 管理者判定。admin_usersに登録されたログインユーザーだけ編集できます。
drop policy if exists "Admins can insert drinks" on public.drinks;
create policy "Admins can insert drinks"
on public.drinks for insert
to authenticated
with check (exists (
  select 1 from public.admin_users a where a.user_id = (select auth.uid())
));

drop policy if exists "Admins can update drinks" on public.drinks;
create policy "Admins can update drinks"
on public.drinks for update
to authenticated
using (exists (
  select 1 from public.admin_users a where a.user_id = (select auth.uid())
))
with check (exists (
  select 1 from public.admin_users a where a.user_id = (select auth.uid())
));

drop policy if exists "Admins can delete drinks" on public.drinks;
create policy "Admins can delete drinks"
on public.drinks for delete
to authenticated
using (exists (
  select 1 from public.admin_users a where a.user_id = (select auth.uid())
));

drop policy if exists "Admins can update settings" on public.site_settings;
create policy "Admins can update settings"
on public.site_settings for all
to authenticated
using (exists (
  select 1 from public.admin_users a where a.user_id = (select auth.uid())
))
with check (exists (
  select 1 from public.admin_users a where a.user_id = (select auth.uid())
));

-- admin_users自体は一般ユーザーに公開しません。
drop policy if exists "Admin can read own admin record" on public.admin_users;
create policy "Admin can read own admin record"
on public.admin_users for select
to authenticated
using (user_id = (select auth.uid()));

grant select on public.drinks, public.site_settings to anon;
grant select, insert, update, delete on public.drinks to authenticated;
grant select, insert, update, delete on public.site_settings to authenticated;
grant select on public.admin_users to authenticated;

insert into public.site_settings (key, value) values
  ('storeName', '隠れ家えいと'),
  ('storeEnglish', 'HIDDEN BAR EIGHT'),
  ('openText', '本日営業中'),
  ('hours', '19:00〜LAST'),
  ('instagram', 'https://www.instagram.com/bar_kakurega_eito'),
  ('mapUrl', '#')
on conflict (key) do update set value = excluded.value;

insert into public.drinks
(slug,name_ja,name_en,category,price,tag,description,sweet,sour,bitter,strength,fresh,image_url,available,recommended,sort_order)
values
('gin-tonic', 'ジントニック', 'Gin & Tonic', 'cocktail', 800, '初心者向け', 'キレのあるジンと爽やかなトニック。ライムが香る定番の一杯。', 2, 2, 2, 3, 5, 'assets/images/cocktails/01_gin-tonic.webp', true, true, 1),
('moscow-mule', 'モスコミュール', 'Moscow Mule', 'cocktail', 800, '爽快', 'ウォッカとジンジャーの刺激。キレのある爽快な味わい。', 2, 3, 1, 3, 5, 'assets/images/cocktails/02_moscow-mule.webp', true, false, 2),
('cosmopolitan', 'コスモポリタン', 'Cosmopolitan', 'cocktail', 900, '華やか', 'クランベリーの甘酸っぱさが華やかな、大人のカクテル。', 3, 4, 1, 3, 3, 'assets/images/cocktails/03_cosmopolitan.webp', true, true, 3),
('blue-lagoon', 'ブルーラグーン', 'Blue Lagoon', 'cocktail', 900, '写真映え', '鮮やかなブルーと柑橘の爽快感を楽しめる一杯。', 3, 3, 1, 3, 5, 'assets/images/cocktails/04_blue-lagoon.webp', true, true, 4),
('cassis-orange', 'カシスオレンジ', 'Cassis Orange', 'cocktail', 800, '飲みやすい', 'カシスの甘さとオレンジの果実感。初めてのBARにも。', 5, 2, 1, 1, 3, 'assets/images/cocktails/05_cassis-orange.webp', true, false, 5),
('fuzzy-navel', 'ファジーネーブル', 'Fuzzy Navel', 'cocktail', 800, 'フルーティー', 'ピーチとオレンジのやさしい甘さ。親しみやすい味わい。', 5, 2, 1, 1, 3, 'assets/images/cocktails/06_fuzzy-navel.webp', true, false, 6),
('mojito', 'モヒート', 'Mojito', 'cocktail', 900, '爽快', 'ミントとライムの清涼感。気分を切り替えたい夜に。', 2, 4, 1, 3, 5, 'assets/images/cocktails/07_mojito.webp', true, false, 7),
('martini', 'マティーニ', 'Martini', 'cocktail', 1000, '王道', 'ジンの香りを楽しむ辛口のスタンダードカクテル。', 1, 1, 3, 5, 3, 'assets/images/cocktails/08_martini.webp', true, false, 8),
('margarita', 'マルガリータ', 'Margarita', 'cocktail', 900, '人気', 'テキーラ、ライム、塩が織りなすキレのある一杯。', 2, 5, 1, 4, 5, 'assets/images/cocktails/09_margarita.webp', true, false, 9),
('daiquiri', 'ダイキリ', 'Daiquiri', 'cocktail', 900, 'クラシック', 'ラムとライムのすっきりとした甘酸っぱさ。', 2, 4, 1, 4, 4, 'assets/images/cocktails/10_daiquiri.webp', true, false, 10),
('gimlet', 'ギムレット', 'Gimlet', 'cocktail', 900, '辛口', 'ジンとライムが生む、短く鋭い余韻。', 2, 5, 2, 4, 4, 'assets/images/cocktails/11_gimlet.webp', true, false, 11),
('sidecar', 'サイドカー', 'Sidecar', 'cocktail', 1000, '上品', 'コニャックのコクと柑橘の香りが上品な一杯。', 2, 4, 1, 4, 3, 'assets/images/cocktails/12_sidecar.webp', true, false, 12),
('negroni', 'ネグローニ', 'Negroni', 'cocktail', 1000, 'ほろ苦い', 'ビターで大人な味わいを楽しむイタリアンカクテル。', 2, 1, 5, 4, 2, 'assets/images/cocktails/13_negroni.webp', true, false, 13),
('old-fashioned', 'オールドファッションド', 'Old Fashioned', 'cocktail', 1000, 'ウイスキー', 'ウイスキーの深みとほのかな甘さをゆっくり楽しむ。', 2, 1, 3, 5, 1, 'assets/images/cocktails/14_old-fashioned.webp', true, false, 14),
('manhattan', 'マンハッタン', 'Manhattan', 'cocktail', 1000, 'エレガント', 'ウイスキーとベルモットの芳醇で優雅な香り。', 3, 1, 2, 4, 1, 'assets/images/cocktails/15_manhattan.webp', true, false, 15),
('rusty-nail', 'ラスティネイル', 'Rusty Nail', 'cocktail', 1000, '濃厚', 'スコッチの深いコクと蜂蜜のような甘さ。', 4, 1, 2, 5, 1, 'assets/images/cocktails/16_rusty-nail.webp', true, false, 16),
('white-lady', 'ホワイトレディ', 'White Lady', 'cocktail', 900, '上品', 'ジンと柑橘の香りが美しい、端正なショートカクテル。', 2, 4, 1, 4, 4, 'assets/images/cocktails/17_white-lady.webp', true, false, 17),
('espresso-martini', 'エスプレッソマティーニ', 'Espresso Martini', 'cocktail', 1000, '夜向け', 'コーヒーのコクとウォッカのキレが調和する一杯。', 3, 1, 4, 4, 1, 'assets/images/cocktails/18_espresso-martini.webp', true, false, 18),
('paralika', 'パラライカ', 'Balalaika', 'cocktail', 900, 'シャープ', 'ウォッカと柑橘のシャープなショートカクテル。', 2, 4, 1, 4, 4, 'assets/images/cocktails/19_paralika.webp', true, false, 19),
('xyz', 'XYZ', 'XYZ', 'cocktail', 900, '定番', 'ラムとオレンジ、レモンのバランスが美しい一杯。', 3, 4, 1, 4, 4, 'assets/images/cocktails/20_xyz.webp', true, false, 20),
('shirley-temple', 'シャーリーテンプル', 'Shirley Temple', 'nonalcohol', 700, 'ノンアル', '赤く華やかな、甘くて飲みやすいノンアルカクテル。', 5, 2, 1, 0, 3, 'assets/images/cocktails/21_shirley-temple.webp', true, false, 21),
('saratoga-cooler', 'サラトガクーラー', 'Saratoga Cooler', 'nonalcohol', 700, 'ノンアル', 'ライムとジンジャーの爽やかなノンアルカクテル。', 2, 4, 1, 0, 5, 'assets/images/cocktails/22_saratoga-cooler.webp', true, false, 22),
('sunrise-orange', 'サンライズオレンジ', 'Sunrise Orange', 'nonalcohol', 700, 'ノンアル', '朝焼けのような色合いのフルーティーな一杯。', 4, 2, 1, 0, 3, 'assets/images/cocktails/23_sunrise-orange.webp', true, false, 23),
('blue-hawaii', 'ブルーハワイ', 'Blue Hawaii', 'cocktail', 900, 'トロピカル', '南国を思わせるブルーとフルーツの香り。', 4, 3, 1, 3, 4, 'assets/images/cocktails/24_blue-hawaii.webp', true, false, 24),
('peach-oolong', 'ピーチウーロン', 'Peach Oolong', 'cocktail', 800, '飲みやすい', 'ピーチの甘さとウーロン茶のすっきり感。', 4, 1, 2, 2, 3, 'assets/images/cocktails/25_peach-oolong.webp', true, false, 25),
('lime-soda', 'ライムソーダ', 'Lime Soda', 'nonalcohol', 700, 'ノンアル', 'ライムの爽やかさを楽しむすっきりソーダ。', 1, 4, 1, 0, 5, 'assets/images/cocktails/26_lime-soda.webp', true, false, 26),
('mango-passion', 'マンゴーパッション', 'Mango Passion', 'nonalcohol', 700, 'トロピカル', 'マンゴーの濃厚な甘さと南国の香り。', 5, 2, 1, 0, 3, 'assets/images/cocktails/27_mango-passion.webp', true, false, 27),
('grape-squash', 'グレープスカッシュ', 'Grape Squash', 'nonalcohol', 700, 'ノンアル', 'ぶどうの果実感を楽しむ華やかなスカッシュ。', 4, 2, 1, 0, 4, 'assets/images/cocktails/28_grape-squash.webp', true, false, 28),
('matcha-milk', '抹茶ミルク', 'Matcha Milk', 'nonalcohol', 700, 'デザート', '抹茶の香りとミルクのまろやかな甘さ。', 4, 1, 2, 0, 1, 'assets/images/cocktails/29_matcha-milk.webp', true, false, 29),
('kaku-highball', '角ハイボール', 'Kaku Highball', 'whisky', 700, '人気 No.1', 'すっきり爽快。最初の一杯にもおすすめの王道ハイボール。', 1, 1, 2, 3, 5, 'assets/images/cocktails/30_kaku-highball.webp', true, true, 30),
('chivas-regal-12', 'シーバスリーガル12年', 'Chivas Regal 12Y', 'whisky', 1100, 'まろやか', '芳醇でまろやかな味わいと、華やかな香り。', 3, 1, 2, 4, 1, 'assets/images/cocktails/31_chivas-regal-12.webp', true, false, 31),
('ballantines-finest', 'バランタイン ファイネスト', 'Ballantine''s Finest', 'whisky', 900, 'バランス', 'スムースで飲みやすく、ほのかな甘みと香り。', 3, 1, 2, 4, 1, 'assets/images/cocktails/32_ballantines-finest.webp', true, false, 32),
('ichiros-malt', 'イチローズモルト', 'Ichiro''s Malt', 'whisky', 1500, 'こだわり', '奥深い香りと個性をゆっくり味わうジャパニーズウイスキー。', 2, 1, 3, 5, 1, 'assets/images/cocktails/33_ichiros-malt.webp', true, false, 33)
on conflict (slug) do update set
  name_ja = excluded.name_ja,
  name_en = excluded.name_en,
  category = excluded.category,
  price = excluded.price,
  tag = excluded.tag,
  description = excluded.description,
  sweet = excluded.sweet,
  sour = excluded.sour,
  bitter = excluded.bitter,
  strength = excluded.strength,
  fresh = excluded.fresh,
  image_url = excluded.image_url,
  available = excluded.available,
  recommended = excluded.recommended,
  sort_order = excluded.sort_order;
