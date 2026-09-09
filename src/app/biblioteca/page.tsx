import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { BookCard } from "@/components/BookCard";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { isPortugueseLanguage,languageLabel,languageSlug,normalizeLanguage } from "@/lib/languages";
import type { Book,Category } from "@/lib/types";

function norm(v:string){return v.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase();}
function matches(q:string,title:string,author:string){if(!q)return true;const n=norm(q);return norm(title).includes(n)||norm(author||"").includes(n);}
function categoryIds(book:Book){const ids=(book.book_categories||[]).map(x=>x.category_id).filter(Boolean);if(book.category_id&&!ids.includes(book.category_id))ids.push(book.category_id);return ids;}
function inCategory(book:Book,id:string){return categoryIds(book).includes(id);}

export default async function LibraryPage({searchParams}:{searchParams:Promise<{q?:string;category?:string}>}){
  const supabase=await createServerSupabaseClient();
  const {q="",category=""}=await searchParams;
  const query=q.trim();
  const [{data:baseData},{data:categoryData},{count:publishedCount}]=await Promise.all([
    supabase.from("books").select("*,categories(name),book_categories(category_id,is_primary,source,confidence,categories(id,name,slug))").eq("published",true).order("title"),
    supabase.from("categories").select("*").order("name"),
    supabase.from("books").select("id",{count:"exact",head:true}).eq("published",true)
  ]);
  const all=((baseData||[]) as Book[]).filter(b=>matches(query,b.title,b.author));
  const categories=(categoryData||[]) as Category[];
  const selectedCategory=category?categories.find(c=>c.slug===category)||null:null;
  const regularAll=all.filter(b=>!b.language||isPortugueseLanguage(b.language));
  const otherLanguageBooks=all.filter(b=>Boolean(b.language)&&!isPortugueseLanguage(b.language));
  const base=selectedCategory?regularAll.filter(b=>inCategory(b,selectedCategory.id)):all;
  const regularBooks=base.filter(b=>!b.language||isPortugueseLanguage(b.language));
  const uncategorized=regularBooks.filter(b=>categoryIds(b).length===0);
  const featured=all.filter(b=>b.cover_url).slice(0,4);
  const totalBooks=publishedCount??all.length;
  const visibleCategories=categories.filter(c=>regularAll.some(b=>inCategory(b,c.id)));

  const groupedLanguages=new Map<string,Book[]>();
  for(const book of otherLanguageBooks){
    const code=normalizeLanguage(book.language)||"outro";
    const current=groupedLanguages.get(code)||[];current.push(book);groupedLanguages.set(code,current);
  }
  const languageGroups=[...groupedLanguages.entries()].map(([code,items])=>({code,label:languageLabel(code),slug:languageSlug(code),items})).sort((a,b)=>a.label.localeCompare(b.label,"pt-BR"));
  const pageTitle=selectedCategory?selectedCategory.name:query?`Resultados para “${query}”`:"Biblioteca";

  return <AppShell><main className="library-home">
    {!query&&!selectedCategory&&<section className="library-hero shell-width">
      <div className="hero-copy"><span className="eyebrow">LEIA ONDE ESTIVER</span><h1>Descubra sua próxima leitura.</h1><p>Explore o acervo do KINDLE BOOK por gênero, tema e idioma. Um mesmo livro pode aparecer em mais de uma categoria quando fizer sentido.</p><div className="hero-actions"><a className="btn hero-primary" href="#acervo">Explorar acervo</a><Link className="btn hero-secondary" href="/ajuda">Como funciona?</Link></div><div className="hero-stats"><div><strong>{totalBooks}</strong><span>livros no acervo</span></div><div><strong>{categories.length}</strong><span>categorias</span></div></div></div>
      <div className="hero-visual" aria-hidden="true"><div className="hero-orbit"/>{featured.slice(0,3).map((book,index)=><div className={`hero-book hero-book-${index+1}`} key={book.id}>{book.cover_url&&<img src={book.cover_url} alt=""/>}</div>)}<div className="hero-device"><span>PDF</span><b>→</b><span>LEITURA</span></div></div>
    </section>}

    <div className="shell-width library-content" id="acervo">
      {(query||selectedCategory)&&<section className="search-result-head"><span className="eyebrow">{selectedCategory?"CATEGORIA":"PESQUISA"}</span><h1>{pageTitle}</h1><p>{base.length} título{base.length===1?"":"s"} encontrado{base.length===1?"":"s"}.</p>{selectedCategory&&<Link className="back-link" href={query?`/biblioteca?q=${encodeURIComponent(query)}`:"/biblioteca"}>← Ver todas as categorias</Link>}</section>}
      {!selectedCategory&&(visibleCategories.length>0||languageGroups.length>0)&&<nav className="category-strip" aria-label="Categorias"><span>Explorar:</span>{visibleCategories.map(c=><Link href={`/biblioteca?category=${encodeURIComponent(c.slug)}`} key={c.id}>{c.name}</Link>)}{languageGroups.length>0&&<a href="#outros-idiomas">Outros idiomas</a>}</nav>}
      <section className="library-section catalog-section">
        {!query&&!selectedCategory&&<div className="section-heading"><div><span className="eyebrow">ACERVO</span><h2>Biblioteca</h2><p>Livros publicados e organizados por categorias compatíveis com cada obra.</p></div><span className="collection-count">{totalBooks} livro{totalBooks===1?"":"s"}</span></div>}
        {base.length?<div className="category-sections">
          {selectedCategory&&<section className="category-block" id={`categoria-${selectedCategory.slug}`}><div className="category-title"><div><h3>{selectedCategory.name}</h3><span>{regularBooks.length} {regularBooks.length===1?"título":"títulos"}</span></div><span className="category-line"/></div><div className="book-grid shelf-grid">{regularBooks.map(b=><BookCard key={b.id} book={b}/>)}</div></section>}
          {!selectedCategory&&visibleCategories.map(c=>{const items=regularBooks.filter(b=>inCategory(b,c.id));if(!items.length)return null;const shown=query?items:items.slice(0,10);return <section className="category-block" id={`categoria-${c.slug}`} key={c.id}><div className="category-title"><div><span className="eyebrow">COLEÇÃO</span><h3>{c.name}</h3><span>{items.length} {items.length===1?"título":"títulos"}</span></div>{!query&&items.length>10?<Link className="category-see-all" href={`/biblioteca?category=${encodeURIComponent(c.slug)}`}>Ver todos →</Link>:<span className="category-line"/>}</div><div className="book-grid shelf-grid">{shown.map(b=><BookCard key={`${c.id}-${b.id}`} book={b}/>)}</div></section>;})}
          {!selectedCategory&&!!uncategorized.length&&<section className="category-block"><div className="category-title"><div><h3>Outros</h3><span>{uncategorized.length} {uncategorized.length===1?"título":"títulos"}</span></div><span className="category-line"/></div><div className="book-grid shelf-grid">{(query?uncategorized:uncategorized.slice(0,10)).map(b=><BookCard key={b.id} book={b}/>)}</div></section>}
          {!selectedCategory&&!!languageGroups.length&&<section className="category-block" id="outros-idiomas"><div className="category-title"><div><h3>Outros idiomas</h3><span>{otherLanguageBooks.length} {otherLanguageBooks.length===1?"título":"títulos"}</span></div><span className="category-line"/></div><div style={{display:"grid",gap:40}}>{languageGroups.map(group=><section className="category-block" id={`idioma-${group.slug}`} key={group.code}><div className="category-title"><div><h3>{group.label}</h3><span>{group.items.length} {group.items.length===1?"título":"títulos"}</span></div><span className="category-line"/></div><div className="book-grid shelf-grid">{(query?group.items:group.items.slice(0,10)).map(b=><BookCard key={b.id} book={b}/>)}</div></section>)}</div></section>}
        </div>:<div className="empty-state"><h3>{query?"Nenhum livro corresponde à busca":"Nenhum livro nesta categoria"}</h3><p>{query?"Tente pesquisar com menos palavras.":"Ainda não há títulos publicados aqui."}</p></div>}
      </section>
    </div>
  </main></AppShell>;
}
