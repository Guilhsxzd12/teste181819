import { notFound } from "next/navigation";
import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { KindleShareButton } from "@/components/KindleShareButton";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import type { Book,Category } from "@/lib/types";

export default async function BookPage({params}:{params:Promise<{id:string}>}){
  const {id}=await params;
  const db=createAdminSupabaseClient();
  const {data:book}=await db.from("books").select("*,categories(name),book_categories(category_id,is_primary,categories(id,name,slug,parent_id,sort_order))").eq("id",id).eq("published",true).maybeSingle();
  if(!book)notFound();
  const b=book as Book;
  const linked=((b.book_categories||[]).map(x=>x.categories).filter(Boolean) as Category[]);
  const uniqueCategories=[...new Map(linked.map(c=>[c.id,c])).values()].sort((a,b)=>(a.parent_id?1:0)-(b.parent_id?1:0)||(a.sort_order??100)-(b.sort_order??100)||a.name.localeCompare(b.name,"pt-BR"));
  if(!uniqueCategories.length&&b.categories?.name)uniqueCategories.push({id:b.category_id||"primary",name:b.categories.name,slug:""});
  return <AppShell><main className="shell-width detail-page"><Link className="back-link" href="/biblioteca">← Voltar ao acervo</Link><section className="detail">
    <div className="detail-cover-col">{b.cover_url?<img className="cover" src={b.cover_url} alt={`Capa de ${b.title}`}/>:<div className="cover-fallback">{b.title}</div>}<div className="detail-small-meta">{uniqueCategories.map(c=>c.slug?<Link key={c.id} href={`/biblioteca?category=${encodeURIComponent(c.slug)}`}>{c.name}</Link>:<span key={c.id}>{c.name}</span>)}{b.language&&<span>{b.language.toUpperCase()}</span>}</div></div>
    <div className="detail-copy"><span className="eyebrow">ACERVO KINDLE BOOK</span><h1>{b.title}</h1><h2>{b.author}</h2><div className="detail-stats">{b.year&&<div><small>ANO</small><strong>{b.year}</strong></div>}{b.pages&&<div><small>PÁGINAS</small><strong>{b.pages}</strong></div>}{uniqueCategories.length>0&&<div><small>{uniqueCategories.length===1?"CATEGORIA":"CATEGORIAS"}</small><strong>{uniqueCategories.map(c=>c.name).join(" • ")}</strong></div>}</div><div className="detail-actions"><Link className="btn" href={`/leitor/${b.id}`}>Ler agora</Link>{b.allow_download&&<a className="btn ghost" href={`/api/books/${b.id}/file?download=1`}>Baixar PDF</a>}<KindleShareButton id={b.id} title={b.title} source="catalog"/></div><div className="synopsis-block"><span className="eyebrow">SINOPSE</span><div className="prose">{b.description||"Sinopse não informada."}</div></div></div>
  </section></main></AppShell>;
}
