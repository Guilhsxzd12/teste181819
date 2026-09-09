create extension if not exists unaccent;

update public.categories
set name='Fatos Reais', slug='fatos-reais'
where slug='nao-ficcao' or name='Não Ficção';

insert into public.categories(name,slug) values
 ('Biografias e Memórias','biografias-e-memorias'),
 ('História e Sociedade','historia-e-sociedade'),
 ('Negócios e Finanças','negocios-e-financas'),
 ('Psicologia e Comportamento','psicologia-e-comportamento'),
 ('Saúde e Bem-estar','saude-e-bem-estar'),
 ('Ciência e Tecnologia','ciencia-e-tecnologia'),
 ('Educação e Referência','educacao-e-referencia'),
 ('Crime Real','crime-real'),
 ('Infantojuvenil','infantojuvenil'),
 ('Contos e Crônicas','contos-e-cronicas'),
 ('Drama','drama'),
 ('Humor','humor'),
 ('Arte e Cultura','arte-e-cultura'),
 ('Culinária e Gastronomia','culinaria-e-gastronomia'),
 ('Filosofia','filosofia'),
 ('Política e Direito','politica-e-direito'),
 ('Esportes','esportes'),
 ('Viagem e Turismo','viagem-e-turismo')
on conflict (slug) do nothing;

create table if not exists public.book_categories (
  book_id uuid not null references public.books(id) on delete cascade,
  category_id uuid not null references public.categories(id) on delete cascade,
  is_primary boolean not null default false,
  source text not null default 'manual',
  confidence smallint not null default 100 check (confidence between 0 and 100),
  created_at timestamptz not null default now(),
  primary key (book_id,category_id)
);

create index if not exists book_categories_category_id_idx on public.book_categories(category_id,book_id);
create index if not exists book_categories_book_id_idx on public.book_categories(book_id,category_id);

alter table public.book_categories enable row level security;
drop policy if exists book_categories_read on public.book_categories;
create policy book_categories_read on public.book_categories for select to authenticated using (private.is_approved() or private.is_admin());
drop policy if exists book_categories_admin_insert on public.book_categories;
create policy book_categories_admin_insert on public.book_categories for insert to authenticated with check (private.is_admin());
drop policy if exists book_categories_admin_update on public.book_categories;
create policy book_categories_admin_update on public.book_categories for update to authenticated using (private.is_admin()) with check (private.is_admin());
drop policy if exists book_categories_admin_delete on public.book_categories;
create policy book_categories_admin_delete on public.book_categories for delete to authenticated using (private.is_admin());

insert into public.book_categories(book_id,category_id,is_primary,source,confidence)
select id,category_id,true,'legacy',100
from public.books
where category_id is not null
on conflict (book_id,category_id) do update set is_primary=true;
