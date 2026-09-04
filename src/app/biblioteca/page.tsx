import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { BookCard } from "@/components/BookCard";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { Book,Category } from "@/lib/types";

function norm(v:string){return v.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase();}
function matches(q:string,title:string,author:string){if(!q)return true;const n=norm(q);return norm(title).includes(n)||norm(author||"").includes(n);}

export default async function LibraryPage({searchParams}:{searchParams:Promise<{q?:string}>}){
  const supabase=await createServerSupabaseClient();
  const {q=""}=await searchParams;
  const query=q.trim();
  const [{data:baseData},{data:categoryData}]=await Promise.all([
    supabase.from("books").select("*,categories(name)").eq("published",true).order("title"),
    supabase.from("categories").select("*").order("name")
  ]);
  const base=((baseData||[]) as Book[]).filter(b=>matches(query,b.title,b.author));
  const categories=(categoryData||[]) as Category[];
  const uncategorized=base.filter(b=>!b.category_id);
  const featured=base.filter(b=>b.cover_url).slice(0,4);

  return <AppShell><main className="library-home">
    {!query&&<section className="library-hero shell-width">
      <div className="hero-copy"><span className="eyebrow">LEIA ONDE ESTIVER</span><h1>Descubra sua próxima leitura.</h1><p>Explore o acervo do KINDLE BOOK e leia seus livros diretamente pelo site.</p><div className="hero-actions"><a className="btn hero-primary" href="#acervo">Explorar acervo</a><Link className="btn hero-secondary" href="/ajuda">Como funciona?</Link></div><div className="hero-stats"><div><strong>{base.length}</strong><span>livros no acervo</span></div><div><strong>{categories.length}</strong><span>categorias</span></div></div></div>
      <div className="hero-visual" aria-hidden="true"><div className="hero-orbit"/>{featured.slice(0,3).map((book,index)=><div className={`hero-book hero-book-${index+1}`} key={book.id}>{book.cover_url&&<img src={book.cover_url} alt=""/>}</div>)}<div className="hero-device"><span>PDF</span><b>→</b><span>LEITURA</span></div></div>
    </section>}

    <div className="shell-width library-content" id="acervo">
      {query&&<section className="search-result-head"><span className="eyebrow">PESQUISA</span><h1>Resultados para “{query}”</h1><p>{base.length} resultado{base.length===1?"":"s"} encontrado{base.length===1?"":"s"}.</p></section>}
      {!query&&!!categories.length&&<nav className="category-strip" aria-label="Categorias"><span>Explorar:</span>{categories.map(c=><a href={`#categoria-${c.slug}`} key={c.id}>{c.name}</a>)}</nav>}
      <section className="library-section catalog-section">
        <div className="section-heading"><div><span className="eyebrow">ACERVO</span><h2>Biblioteca</h2><p>Livros publicados e organizados por categoria.</p></div><span className="collection-count">{base.length} livro{base.length===1?"":"s"}</span></div>
        {base.length?<div className="category-sections">
          {categories.map(c=>{const items=base.filter(b=>b.category_id===c.id);if(!items.length)return null;return <section className="category-block" id={`categoria-${c.slug}`} key={c.id}><div className="category-title"><div><h3>{c.name}</h3><span>{items.length} {items.length===1?"título":"títulos"}</span></div><span className="category-line"/></div><div className="book-grid shelf-grid">{items.map(b=><BookCard key={b.id} book={b}/>)}</div></section>;})}
          {!!uncategorized.length&&<section className="category-block"><div className="category-title"><div><h3>Outros</h3><span>{uncategorized.length} títulos</span></div><span className="category-line"/></div><div className="book-grid shelf-grid">{uncategorized.map(b=><BookCard key={b.id} book={b}/>)}</div></section>}
        </div>:<div className="empty-state"><h3>{query?"Nenhum livro corresponde à busca":"O acervo ainda está vazio"}</h3><p>{query?"Tente pesquisar com menos palavras.":"Os livros publicados aparecerão aqui."}</p></div>}
      </section>
    </div>
  </main></AppShell>;
}
