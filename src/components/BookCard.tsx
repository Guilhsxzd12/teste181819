import Link from "next/link";
import type { Book } from "@/lib/types";
import { isPortugueseLanguage,languageLabel } from "@/lib/languages";

export function BookCard({book}:{book:Book}){
  const showLanguageBadge=Boolean(book.language&&!isPortugueseLanguage(book.language));
  return <Link className="book-card catalog-book-card" href={`/livro/${book.id}`}>
    <div className="book-cover-wrap">
      {book.cover_url?<img className="cover" src={book.cover_url} alt={`Capa de ${book.title}`}/>:<div className="cover-fallback">{book.title}</div>}
      {(book.categories?.name||showLanguageBadge)&&<div style={{position:"absolute",left:9,right:9,bottom:9,display:"flex",alignItems:"flex-end",gap:6,flexWrap:"wrap"}}>
        {book.categories?.name&&<span className="floating-category" style={{position:"static"}}>{book.categories.name}</span>}
        {showLanguageBadge&&<span className="floating-category" style={{position:"static",marginLeft:"auto"}}>{languageLabel(book.language)}</span>}
      </div>}
    </div>
    <div className="book-body"><h2 className="book-title">{book.title}</h2><div className="meta">{book.author}</div><div className="book-footer-meta">{book.year&&<span>{book.year}</span>}{book.language&&<span>{book.language.toUpperCase()}</span>}</div></div>
  </Link>;
}
