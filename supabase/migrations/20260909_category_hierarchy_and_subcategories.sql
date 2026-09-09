alter table public.categories add column if not exists parent_id uuid null references public.categories(id) on delete set null;
alter table public.categories add column if not exists sort_order integer not null default 100;
create index if not exists categories_parent_id_idx on public.categories(parent_id,sort_order,name);

do $$ begin
  if not exists (select 1 from pg_constraint where conname='categories_parent_not_self') then
    alter table public.categories add constraint categories_parent_not_self check (parent_id is null or parent_id<>id);
  end if;
end $$;

with parent as (select id from public.categories where slug='fatos-reais' limit 1)
update public.categories c set parent_id=parent.id
from parent
where c.slug in (
 'autoajuda-e-desenvolvimento-pessoal','biografias-e-memorias','historia-e-sociedade',
 'negocios-e-financas','psicologia-e-comportamento','saude-e-bem-estar','ciencia-e-tecnologia',
 'educacao-e-referencia','crime-real','arte-e-cultura','culinaria-e-gastronomia','filosofia',
 'politica-e-direito','esportes','viagem-e-turismo'
) and c.id<>parent.id;

with parent as (select id from public.categories where slug='fatos-reais' limit 1), vals(slug,ord) as (values
 ('autoajuda-e-desenvolvimento-pessoal',10),('biografias-e-memorias',20),('historia-e-sociedade',30),
 ('negocios-e-financas',40),('psicologia-e-comportamento',50),('saude-e-bem-estar',60),('ciencia-e-tecnologia',70),
 ('educacao-e-referencia',80),('crime-real',90),('arte-e-cultura',100),('culinaria-e-gastronomia',110),
 ('filosofia',120),('politica-e-direito',130),('esportes',140),('viagem-e-turismo',150))
update public.categories c set sort_order=vals.ord from vals,parent where c.slug=vals.slug and c.parent_id=parent.id;

insert into public.categories(name,slug,parent_id,sort_order)
select v.name,v.slug,p.id,v.ord from (values
 ('Dark Romance','dark-romance',10),('Comédia Romântica','comedia-romantica',20),('Romance Esportivo','romance-esportivo',30)
) v(name,slug,ord) join public.categories p on p.slug='romance'
on conflict (slug) do update set name=excluded.name,parent_id=excluded.parent_id,sort_order=excluded.sort_order;

insert into public.categories(name,slug,parent_id,sort_order)
select v.name,v.slug,p.id,v.ord from (values ('Romantasia','romantasia',10),('Fantasia Sombria','fantasia-sombria',20)) v(name,slug,ord)
join public.categories p on p.slug='fantasia'
on conflict (slug) do update set name=excluded.name,parent_id=excluded.parent_id,sort_order=excluded.sort_order;

insert into public.categories(name,slug,parent_id,sort_order)
select v.name,v.slug,p.id,v.ord from (values ('Thriller Psicológico','thriller-psicologico',10),('Policial e Detetive','policial-e-detetive',20)) v(name,slug,ord)
join public.categories p on p.slug='misterio-e-suspense'
on conflict (slug) do update set name=excluded.name,parent_id=excluded.parent_id,sort_order=excluded.sort_order;

insert into public.categories(name,slug,parent_id,sort_order)
select 'Vampiros','vampiros',p.id,10 from public.categories p where p.slug='terror'
on conflict (slug) do update set name=excluded.name,parent_id=excluded.parent_id,sort_order=excluded.sort_order;

insert into public.book_categories(book_id,category_id,is_primary,source,confidence)
select distinct b.id,sub.id,false,'auto-subcategory',99 from public.books b
join public.book_categories parent_link on parent_link.book_id=b.id
join public.categories parent on parent.id=parent_link.category_id and parent.slug='romance'
join public.categories sub on sub.slug='dark-romance'
where lower(b.title) like '%dark romance%' or lower(coalesce(b.description,'')) like '%dark romance%'
on conflict (book_id,category_id) do nothing;

insert into public.book_categories(book_id,category_id,is_primary,source,confidence)
select distinct b.id,sub.id,false,'auto-subcategory',99 from public.books b
join public.book_categories parent_link on parent_link.book_id=b.id
join public.categories parent on parent.id=parent_link.category_id and parent.slug='romance'
join public.categories sub on sub.slug='comedia-romantica'
where lower(b.title) like '%romantic comedy%' or lower(b.title) like '%comédia romântica%' or lower(b.title) like '%rom-com%' or lower(coalesce(b.description,'')) like '%romantic comedy%' or lower(coalesce(b.description,'')) like '%comédia romântica%'
on conflict (book_id,category_id) do nothing;

insert into public.book_categories(book_id,category_id,is_primary,source,confidence)
select distinct b.id,sub.id,false,'auto-subcategory',99 from public.books b
join public.book_categories parent_link on parent_link.book_id=b.id
join public.categories parent on parent.id=parent_link.category_id and parent.slug='romance'
join public.categories sub on sub.slug='romance-esportivo'
where lower(b.title) like '%sports romance%' or lower(b.title) like '%sport romance%' or lower(coalesce(b.description,'')) like '%sports romance%' or lower(coalesce(b.description,'')) like '%hockey romance%'
on conflict (book_id,category_id) do nothing;

insert into public.book_categories(book_id,category_id,is_primary,source,confidence)
select distinct b.id,sub.id,false,'auto-subcategory',98 from public.books b
join public.book_categories parent_link on parent_link.book_id=b.id
join public.categories parent on parent.id=parent_link.category_id and parent.slug='fantasia'
join public.categories sub on sub.slug='romantasia'
where lower(b.title) like '%romantasy%' or lower(coalesce(b.description,'')) like '%romantasy%'
on conflict (book_id,category_id) do nothing;

insert into public.book_categories(book_id,category_id,is_primary,source,confidence)
select distinct b.id,sub.id,false,'auto-subcategory',98 from public.books b
join public.book_categories parent_link on parent_link.book_id=b.id
join public.categories parent on parent.id=parent_link.category_id and parent.slug='fantasia'
join public.categories sub on sub.slug='fantasia-sombria'
where lower(b.title) like '%dark fantasy%' or lower(coalesce(b.description,'')) like '%dark fantasy%' or lower(coalesce(b.description,'')) like '%fantasia sombria%'
on conflict (book_id,category_id) do nothing;

insert into public.book_categories(book_id,category_id,is_primary,source,confidence)
select distinct b.id,sub.id,false,'auto-subcategory',99 from public.books b
join public.book_categories parent_link on parent_link.book_id=b.id
join public.categories parent on parent.id=parent_link.category_id and parent.slug='misterio-e-suspense'
join public.categories sub on sub.slug='thriller-psicologico'
where lower(b.title) like '%psychological thriller%' or lower(b.title) like '%thriller psicológico%' or lower(coalesce(b.description,'')) like '%psychological thriller%' or lower(coalesce(b.description,'')) like '%thriller psicológico%'
on conflict (book_id,category_id) do nothing;

insert into public.book_categories(book_id,category_id,is_primary,source,confidence)
select distinct b.id,sub.id,false,'auto-subcategory',99 from public.books b
join public.book_categories parent_link on parent_link.book_id=b.id
join public.categories parent on parent.id=parent_link.category_id and parent.slug='misterio-e-suspense'
join public.categories sub on sub.slug='policial-e-detetive'
where lower(b.title) like '%detective%' or lower(b.title) like '%detetive%' or lower(b.title) like '%serial killer%' or lower(coalesce(b.description,'')) like '%detective%' or lower(coalesce(b.description,'')) like '%detetive%'
on conflict (book_id,category_id) do nothing;

insert into public.book_categories(book_id,category_id,is_primary,source,confidence)
select distinct b.id,sub.id,false,'auto-subcategory',97 from public.books b
join public.book_categories parent_link on parent_link.book_id=b.id
join public.categories parent on parent.id=parent_link.category_id and parent.slug='terror'
join public.categories sub on sub.slug='vampiros'
where lower(b.title) like '%vampire%' or lower(b.title) like '%vampiro%' or lower(coalesce(b.description,'')) like '%vampire%' or lower(coalesce(b.description,'')) like '%vampiro%'
on conflict (book_id,category_id) do nothing;

insert into public.book_categories(book_id,category_id,is_primary,source,confidence)
select distinct bc.book_id,c.parent_id,false,'auto-parent',95
from public.book_categories bc join public.categories c on c.id=bc.category_id
where c.parent_id is not null
on conflict (book_id,category_id) do nothing;
