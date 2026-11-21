-- ════════════════════════════════════════════════════════════════
--  ZELVO — skema database Supabase
--  Jalankan seluruh file ini di Supabase → SQL Editor.
-- ════════════════════════════════════════════════════════════════
create extension if not exists pgcrypto;

-- ── Profil (1 baris per akun) ───────────────────────────────────
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  display_name text not null default 'User',
  username text unique not null,
  role text not null default 'user' check (role in ('user','seller','admin')),
  store_name text,
  store_bio text,
  balance bigint not null default 0 check (balance >= 0),
  seen_reference boolean not null default false,
  verified_status text not null default 'none' check (verified_status in ('none','verified','trial','unverified')),
  trial_ends_at timestamptz,
  store_rating_avg numeric(3,2) not null default 0,
  store_rating_count int not null default 0,
  created_at timestamptz not null default now()
);

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as
$$ select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin') $$;

-- Buat profil otomatis saat user register
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
declare base text; uname text;
begin
  base := lower(regexp_replace(coalesce(new.raw_user_meta_data->>'username', split_part(new.email,'@',1)), '[^a-zA-Z0-9_]', '', 'g'));
  if length(base) < 3 then base := 'user' || substr(md5(random()::text),1,5); end if;
  base := left(base, 20); uname := base;
  while exists (select 1 from public.profiles where username = uname) loop
    uname := base || floor(random()*9000+1000)::int;
  end loop;
  insert into public.profiles (id, email, display_name, username)
  values (new.id, new.email, coalesce(nullif(new.raw_user_meta_data->>'display_name',''), split_part(new.email,'@',1)), uname);
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- ── Kategori ────────────────────────────────────────────────────
create table public.style_categories (id serial primary key, name text unique not null, slug text unique not null, sort int not null default 0);
create table public.motor_categories (id serial primary key, name text unique not null, slug text unique not null, sort int not null default 0);

insert into public.style_categories (name, slug, sort) values
 ('Striping kata-kata','kata-kata',1),('Vietnam style','vietnam-style',2),('Racing','racing',3),
 ('Sunmori','sunmori',4),('Minimalis','minimalis',5),('Retro','retro',6),('Anime','anime',7),
 ('Full body','full-body',8),('Lainnya','lainnya',99);
insert into public.motor_categories (name, slug, sort) values
 ('Vario','vario',1),('Aerox','aerox',2),('NMAX','nmax',3),('PCX','pcx',4),('Beat','beat',5),
 ('Scoopy','scoopy',6),('Vespa','vespa',7),('Ninja','ninja',8),('CBR','cbr',9),('R15','r15',10),
 ('Satria','satria',11),('Vixion','vixion',12),('Trail / KLX','trail',13),('Lainnya','lainnya',99);

-- ── Produk (template striping) ──────────────────────────────────
create table public.products (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  seller_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  description text,
  style_id int references public.style_categories(id),
  motor_id int references public.motor_categories(id),
  price int not null default 0 check (price = 0 or price between 1000 and 500000),
  file_path text not null,     -- bucket PRIVATE "templates" (PNG asli transparan)
  thumb_path text not null,    -- bucket PUBLIC "thumbnails" (sudah ber-watermark)
  status text not null default 'published' check (status in ('published','hidden')),
  install_count int not null default 0,
  rating_avg numeric(3,2) not null default 0,
  rating_count int not null default 0,
  created_at timestamptz not null default now()
);
create index on public.products (seller_id);
create index on public.products (status, created_at desc);
create index on public.products (style_id);
create index on public.products (motor_id);

-- ── Install (unik per user per produk) ──────────────────────────
create table public.installs (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  order_id text,
  downloads int not null default 1,
  created_at timestamptz not null default now(),
  last_at timestamptz not null default now(),
  unique (product_id, user_id)
);

-- ── Order (Midtrans Snap) ───────────────────────────────────────
create table public.orders (
  id text primary key,
  product_id uuid not null references public.products(id) on delete restrict,
  buyer_id uuid not null references public.profiles(id) on delete restrict,
  seller_id uuid not null references public.profiles(id) on delete restrict,
  gross_amount int not null,
  fee_amount int not null,
  seller_amount int not null,
  status text not null default 'pending' check (status in ('pending','paid','failed','expired')),
  snap_token text,
  midtrans_transaction_id text,
  payment_type text,
  paid_at timestamptz,
  created_at timestamptz not null default now()
);
create index on public.orders (seller_id, created_at desc);
create index on public.orders (buyer_id, created_at desc);

-- ── Review ──────────────────────────────────────────────────────
create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  rating smallint not null check (rating between 1 and 5),
  comment text,
  image_path text,   -- bucket publik "review-images" (opsional)
  created_at timestamptz not null default now(),
  unique (product_id, user_id)
);

-- ── Pengajuan jadi penyumbang/penjual ───────────────────────────
create table public.seller_applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles(id) on delete cascade,
  store_name text not null,
  bio text,
  portfolio_url text,
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  auto_approve_at timestamptz not null default (now() + interval '5 minutes'),
  hold_auto boolean not null default false,          -- admin menahan auto-accept
  decision_source text check (decision_source in ('auto','admin')),
  decided_at timestamptz,
  created_at timestamptz not null default now()
);

-- ── Penarikan saldo + dokumen legal ─────────────────────────────
create table public.withdrawals (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  seller_id uuid not null references public.profiles(id) on delete restrict,
  amount bigint not null,
  bank_name text not null,
  account_number text not null,
  account_name text not null,
  balance_before bigint not null,
  balance_after bigint not null,
  status text not null default 'requested' check (status in ('requested','processing','paid','rejected')),
  note text,
  created_at timestamptz not null default now(),
  processed_at timestamptz
);
create table public.legal_records (
  id uuid primary key default gen_random_uuid(),
  withdrawal_id uuid unique not null references public.withdrawals(id) on delete cascade,
  token text unique not null,
  is_public boolean not null default false,   -- baru bisa dibuka publik setelah admin publish
  published_at timestamptz,
  created_at timestamptz not null default now()
);

-- ════════════════ RLS ════════════════
-- Semua penulisan data dilakukan server (service role). Klien hanya boleh membaca yang relevan.
alter table public.profiles enable row level security;
alter table public.style_categories enable row level security;
alter table public.motor_categories enable row level security;
alter table public.products enable row level security;
alter table public.installs enable row level security;
alter table public.orders enable row level security;
alter table public.reviews enable row level security;
alter table public.seller_applications enable row level security;
alter table public.withdrawals enable row level security;
alter table public.legal_records enable row level security;

create policy "profil sendiri / admin" on public.profiles for select using (id = auth.uid() or public.is_admin());
create policy "kategori publik" on public.style_categories for select using (true);
create policy "kategori motor publik" on public.motor_categories for select using (true);
create policy "produk terbit" on public.products for select using (status = 'published' or seller_id = auth.uid() or public.is_admin());
create policy "install sendiri" on public.installs for select using (user_id = auth.uid());
create policy "order terkait" on public.orders for select using (buyer_id = auth.uid() or seller_id = auth.uid() or public.is_admin());
create policy "review publik" on public.reviews for select using (true);
create policy "pengajuan sendiri" on public.seller_applications for select using (user_id = auth.uid() or public.is_admin());
create policy "withdraw sendiri" on public.withdrawals for select using (seller_id = auth.uid() or public.is_admin());
create policy "legal hanya admin" on public.legal_records for select using (public.is_admin());

-- ════════════════ Storage ════════════════
insert into storage.buckets (id, name, public) values
  ('templates','templates', false),       -- file asli: hanya via signed URL setelah install/bayar
  ('thumbnails','thumbnails', true),      -- thumbnail ber-watermark
  ('review-images','review-images', true)
on conflict (id) do nothing;

-- ════════════════ Fungsi bisnis ════════════════
-- Rating toko → status verifikasi (20 rating & rata-rata >= 4.0 = terverifikasi; turun = trial 10 hari)
create or replace function public.recompute_store(p_seller uuid) returns void
language plpgsql security definer set search_path = public as $$
declare n int; a numeric; cur text; tend timestamptz; ns text; nt timestamptz;
begin
  select count(r.*), coalesce(round(avg(r.rating)::numeric, 2), 0) into n, a
    from reviews r join products p on p.id = r.product_id where p.seller_id = p_seller;
  select verified_status, trial_ends_at into cur, tend from profiles where id = p_seller;
  if n < 20 then ns := 'none'; nt := null;
  elsif a >= 4.0 then ns := 'verified'; nt := null;
  elsif cur = 'verified' then ns := 'trial'; nt := now() + interval '10 days';
  elsif cur = 'trial' then
    if tend is not null and tend <= now() then ns := 'unverified'; nt := null; else ns := 'trial'; nt := tend; end if;
  else ns := 'unverified'; nt := null;
  end if;
  update profiles set store_rating_avg = a, store_rating_count = n, verified_status = ns, trial_ends_at = nt where id = p_seller;
end $$;

create or replace function public.on_review_change() returns trigger
language plpgsql security definer set search_path = public as $$
declare pid uuid; sid uuid;
begin
  pid := coalesce(new.product_id, old.product_id);
  update products set
    rating_avg = coalesce((select round(avg(rating)::numeric, 2) from reviews where product_id = pid), 0),
    rating_count = (select count(*) from reviews where product_id = pid)
  where id = pid returning seller_id into sid;
  if sid is not null then perform recompute_store(sid); end if;
  return null;
end $$;
create trigger reviews_after_change after insert or update or delete on public.reviews
  for each row execute function public.on_review_change();

-- Auto-accept pengajuan penjual setelah 5 menit (kecuali ditahan admin)
create or replace function public.process_due_applications() returns int
language plpgsql security definer set search_path = public as $$
declare r record; c int := 0;
begin
  for r in select * from seller_applications
           where status = 'pending' and hold_auto = false and auto_approve_at <= now() for update skip locked loop
    update seller_applications set status = 'approved', decision_source = 'auto', decided_at = now() where id = r.id;
    update profiles set role = 'seller', store_name = r.store_name, store_bio = r.bio where id = r.user_id and role = 'user';
    c := c + 1;
  end loop;
  return c;
end $$;

-- Selesaikan order (idempotent) + kreditkan saldo penjual
create or replace function public.settle_order(p_order text, p_status text, p_tx text, p_type text) returns boolean
language plpgsql security definer set search_path = public as $$
declare o orders%rowtype;
begin
  select * into o from orders where id = p_order for update;
  if not found or o.status = 'paid' then return false; end if;
  if p_status = 'paid' then
    update orders set status = 'paid', paid_at = now(), midtrans_transaction_id = p_tx, payment_type = p_type where id = p_order;
    update profiles set balance = balance + o.seller_amount where id = o.seller_id;
    return true;
  end if;
  update orders set status = p_status, midtrans_transaction_id = p_tx, payment_type = p_type where id = p_order;
  return false;
end $$;

-- Catat install: unik per user per produk
create or replace function public.register_install(p_product uuid, p_user uuid, p_order text) returns void
language plpgsql security definer set search_path = public as $$
begin
  insert into installs (product_id, user_id, order_id) values (p_product, p_user, p_order) on conflict (product_id, user_id) do nothing;
  if found then
    update products set install_count = install_count + 1 where id = p_product;
  else
    update installs set downloads = downloads + 1, last_at = now() where product_id = p_product and user_id = p_user;
  end if;
end $$;

-- Ajukan penarikan: atomik (saldo dikunci, dikosongkan, dibuatkan dokumen legal)
create or replace function public.create_withdrawal(p_seller uuid, p_bank text, p_acc text, p_name text, p_min bigint) returns public.withdrawals
language plpgsql security definer set search_path = public, extensions as $$
declare bal bigint; w public.withdrawals; c text;
begin
  select balance into bal from profiles where id = p_seller for update;
  if bal is null or bal < p_min then raise exception 'SALDO_KURANG'; end if;
  c := 'ZV-WD-' || upper(substr(encode(gen_random_bytes(5), 'hex'), 1, 8));
  update profiles set balance = 0 where id = p_seller;
  insert into withdrawals (code, seller_id, amount, bank_name, account_number, account_name, balance_before, balance_after)
  values (c, p_seller, bal, p_bank, p_acc, p_name, bal, 0) returning * into w;
  insert into legal_records (withdrawal_id, token) values (w.id, encode(gen_random_bytes(24), 'hex'));
  return w;
end $$;

-- Tolak penarikan: saldo dikembalikan
create or replace function public.refund_withdrawal(p_id uuid) returns void
language plpgsql security definer set search_path = public as $$
declare w public.withdrawals;
begin
  select * into w from withdrawals where id = p_id for update;
  if not found or w.status in ('paid','rejected') then raise exception 'INVALID'; end if;
  update profiles set balance = balance + w.amount where id = w.seller_id;
  update withdrawals set status = 'rejected', processed_at = now() where id = p_id;
end $$;

-- Fungsi-fungsi di atas HANYA boleh dipanggil dari server (service role)
revoke all on function public.recompute_store(uuid) from public, anon, authenticated;
revoke all on function public.process_due_applications() from public, anon, authenticated;
revoke all on function public.settle_order(text, text, text, text) from public, anon, authenticated;
revoke all on function public.register_install(uuid, uuid, text) from public, anon, authenticated;
revoke all on function public.create_withdrawal(uuid, text, text, text, bigint) from public, anon, authenticated;
revoke all on function public.refund_withdrawal(uuid) from public, anon, authenticated;

-- ════════════════ Jadikan akun kamu admin ════════════════
-- Register dulu lewat web, lalu jalankan (ganti emailnya):
--   update public.profiles set role = 'admin' where email = 'emailkamu@gmail.com';

-- ════════════════ (Opsional) pg_cron: auto-accept tiap menit ════════════════
-- Aktifkan extension pg_cron di Dashboard → Database → Extensions, lalu:
--   select cron.schedule('zelvo-auto-approve', '* * * * *', $$ select public.process_due_applications(); $$);
