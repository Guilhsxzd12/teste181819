import { AppShell } from "@/components/AppShell";
import { BookCard } from "@/components/BookCard";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { Book } from "@/lib/types";

export default async function KindlePage(){
  const supabase=await createServerSupabaseClient();
  const {data}=await supabase.from("books").select("*,categories(name)").eq("published",true).order("title");
  const books=(data||[]) as Book[];
  return <AppShell><main className="container">
    <div className="page-head"><div><span className="eyebrow">KINDLE BOOK</span><h1>Enviar ao Kindle</h1><p>Escolha um livro e, na página dele, toque em “Enviar ao Kindle”. Você poderá compartilhar o arquivo com o aplicativo Kindle.</p></div></div>
    {books.length?<div className="book-grid">{books.map(book=><BookCard key={book.id} book={book}/>)}</div>:<div className="empty-state"><h3>Nenhum livro disponível</h3><p>Os livros publicados aparecerão aqui.</p></div>}
  </main></AppShell>;
}
