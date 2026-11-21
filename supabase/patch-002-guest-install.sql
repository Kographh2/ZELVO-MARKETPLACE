-- Patch 002: install tanpa login (tamu cukup mengisi nama)
-- Jalankan di Supabase → SQL Editor, SETELAH schema.sql dan patch-001.

-- 1) installs & reviews boleh dimiliki tamu (user_id kosong, diganti nama + token browser)
alter table public.installs alter column user_id drop not null;
alter table public.installs add column if not exists guest_name text;
alter table public.installs add column if not exists guest_token text;
alter table public.installs drop constraint if exists installs_who_chk;
alter table public.installs add constraint installs_who_chk
  check (user_id is not null or (guest_name is not null and guest_token is not null));
create unique index if not exists installs_guest_uni on public.installs (product_id, guest_token) where guest_token is not null;

alter table public.reviews alter column user_id drop not null;
alter table public.reviews add column if not exists guest_name text;
alter table public.reviews add column if not exists guest_token text;
alter table public.reviews drop constraint if exists reviews_who_chk;
alter table public.reviews add constraint reviews_who_chk check (user_id is not null or guest_token is not null);
create unique index if not exists reviews_guest_uni on public.reviews (product_id, guest_token) where guest_token is not null;

-- 2) PENTING: sembunyikan guest_token dari akses publik (token ini = "kunci" milik tamu)
revoke select on public.reviews from anon, authenticated;
grant select (id, product_id, user_id, rating, comment, image_path, created_at, guest_name) on public.reviews to anon, authenticated;

-- 3) Catat install tamu: unik per browser (token) per produk
create or replace function public.register_guest_install(p_product uuid, p_name text, p_token text) returns void
language plpgsql security definer set search_path = public as $$
begin
  insert into installs (product_id, guest_name, guest_token) values (p_product, p_name, p_token)
  on conflict (product_id, guest_token) where guest_token is not null do nothing;
  if found then
    update products set install_count = install_count + 1 where id = p_product;
  else
    update installs set downloads = downloads + 1, last_at = now(), guest_name = p_name
    where product_id = p_product and guest_token = p_token;
  end if;
end $$;
revoke all on function public.register_guest_install(uuid, text, text) from public, anon, authenticated;
