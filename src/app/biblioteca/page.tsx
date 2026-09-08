import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { BookCard } from "@/components/BookCard";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { isPortugueseLanguage,languageLabel,languageSlug,normalizeLanguage } from "@/lib/languages";
import type { Book,Category } from "@/lib/types";

function norm(v:string){return v.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase();}
function matches(q:string,title:string,author:string){if(!q)return true;const n=norm(q);return norm(title).includes(n)||norm(author||"").includes(n);}

export default async function LibraryPage({searchParams}:{searchParams:Promise<{q?:string}>}){
  const supabase=await createServerSupabaseClient();
  const {q=""}=await searchParams;
  const query=q.trim();
  const [{data:baseData},{data:categoryData},{count:publishedCount}]=await Promise.all([
    supabase.from("books").select("*,categories(name)").eq("published",true).order("title"),
    supabase.from("categories").select("*").order("name"),
    supabase.from("books").select("id",{count:"exact",head:true}).eq("published",true)
  ]);
  const base=((baseData||[]) as Book[]).filter(b=>matches(query,b.title,b.author));
  const categories=(categoryData||[]) as Category[];
  const regularBooks=base.filter(b=>!b.language||isPortugueseLanguage(b.language));
  const otherLanguageBooks=base.filter(b=>Boolean(b.language)&&!isPortugueseLanguage(b.language));
  const uncategorized=regularBooks.filter(b=>!b.category_id);
  const featured=base.filter(b=>b.cover_url).slice(0,4);
  const totalBooks=publishedCount??base.length;
  const visibleCategories=categories.filter(c=>regularBooks.some(b=>b.category_id===c.id));

  const groupedLanguages=new Map<string,Book[]>();
  for(const book of otherLanguageBooks){
    const code=normalizeLanguage(book.language)||"outro";
    const current=groupedLanguages.get(code)||[];
    current.push(book);
    groupedLanguages.set(code,current);
  }
  const languageGroups=[...groupedLanguages.entries()].map(([code,items])=>({
    code,
    label:languageLabel(code),
    slug:languageSlug(code),
    items
  })).sort((a,b)=>a.label.localeCompare(b.label,"pt-BR"));

  return <AppShell><main className="library-home">
    {!query&&<section className="library-hero shell-width">
      <div className="hero-copy"><span className="eyebrow">LEIA ONDE ESTIVER</span><h1>Descubra sua próxima leitura.</h1><p>Explore o acervo do KINDLE BOOK e leia seus livros diretamente pelo site.</p><div className="hero-actions"><a className="btn hero-primary" href="#acervo">Explorar acervo</a><Link className="btn hero-secondary" href="/ajuda">Como funciona?</Link></div><div className="hero-stats"><div><strong>{totalBooks}</strong><span>livros no acervo</span></div><div><strong>{categories.length}</strong><span>categorias</span></div></div></div>
      <div className="hero-visual" aria-hidden="true"><div className="hero-orbit"/>{featured.slice(0,3).map((book,index)=><div className={`hero-book hero-book-${index+1}`} key={book.id}>{book.cover_url&&<img src={book.cover_url} alt=""/>}</div>)}<div className="hero-device"><span>PDF</span><b>→</b><span>LEITURA</span></div></div>
    </section>}

    <div className="shell-width library-content" id="acervo">
      {query&&<section className="search-result-head"><span className="eyebrow">PESQUISA</span><h1>Resultados para “{query}”</h1><p>{base.length} resultado{base.length===1?"":"s"} encontrado{base.length===1?"":"s"}.</p></section>}
      {!query&&(visibleCategories.length>0||languageGroups.length>0)&&<nav className="category-strip" aria-label="Categorias"><span>Explorar:</span>{visibleCategories.map(c=><a href={`#categoria-${c.slug}`} key={c.id}>{c.name}</a>)}{languageGroups.length>0&&<a href="#outros-idiomas">Outros idiomas</a>}</nav>}
      <section className="library-section catalog-section">
        <div className="section-heading"><div><span className="eyebrow">ACERVO</span><h2>Biblioteca</h2><p>Livros publicados e organizados por categoria e idioma.</p></div><span className="collection-count">{query?base.length:totalBooks} livro{(query?base.length:totalBooks)===1?"":"s"}</span></div>
        {base.length?<div className="category-sections">
          {visibleCategories.map(c=>{const items=regularBooks.filter(b=>b.category_id===c.id);if(!items.length)return null;return <section className="category-block" id={`categoria-${c.slug}`} key={c.id}><div className="category-title"><div><h3>{c.name}</h3><span>{items.length} {items.length===1?"título":"títulos"}</span></div><span className="category-line"/></div><div className="book-grid shelf-grid">{items.map(b=><BookCard key={b.id} book={b}/>)}</div></section>;})}
          {!!uncategorized.length&&<section className="category-block"><div className="category-title"><div><h3>Outros</h3><span>{uncategorized.length} {uncategorized.length===1?"título":"títulos"}</span></div><span className="category-line"/></div><div className="book-grid shelf-grid">{uncategorized.map(b=><BookCard key={b.id} book={b}/>)}</div></section>}
          {!!languageGroups.length&&<section className="category-block" id="outros-idiomas">
            <div className="category-title"><div><h3>Outros idiomas</h3><span>{otherLanguageBooks.length} {otherLanguageBooks.length===1?"título":"títulos"}</span></div><span className="category-line"/></div>
            <div style={{display:"grid",gap:40}}>{languageGroups.map(group=><section className="category-block" id={`idioma-${group.slug}`} key={group.code}><div className="category-title"><div><h3>{group.label}</h3><span>{group.items.length} {group.items.length===1?"título":"títulos"}</span></div><span className="category-line"/></div><div className="book-grid shelf-grid">{group.items.map(b=><BookCard key={b.id} book={b}/>)}</div></section>)}</div>
          </section>}
        </div>:<div className="empty-state"><h3>{query?"Nenhum livro corresponde à busca":"O acervo ainda está vazio"}</h3><p>{query?"Tente pesquisar com menos palavras.":"Os livros publicados aparecerão aqui."}</p></div>}
      </section>
    </div>
  </main></AppShell>;
}
