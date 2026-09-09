import { AppShell } from "@/components/AppShell";
import { BookCard } from "@/components/BookCard";
import { requireApproved } from "@/lib/auth";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import type { Book } from "@/lib/types";

export const dynamic="force-dynamic";

export default async function FavoritesPage(){
  const {supabase,user}=await requireApproved();

  // A lista de IDs vem sempre da sessão do usuário. Assim cada conta enxerga
  // somente os próprios favoritos, mesmo que a leitura dos livros use o client admin.
  const {data:favorites,error:favoritesError}=await supabase
    .from("favorites")
    .select("book_id,created_at")
    .eq("user_id",user.id)
    .order("created_at",{ascending:false});

  if(favoritesError)throw new Error(`Não foi possível carregar seus favoritos: ${favoritesError.message}`);

  const ids=(favorites||[]).map(item=>String(item.book_id));
  let books:Book[]=[];

  if(ids.length){
    const admin=createAdminSupabaseClient();
    const {data:bookData,error:booksError}=await admin
      .from("books")
      .select("*,categories(name),book_categories(category_id,is_primary,categories(id,name,slug,parent_id,sort_order))")
      .in("id",ids)
      .eq("published",true);

    if(booksError)throw new Error(`Não foi possível carregar os livros favoritados: ${booksError.message}`);

    const byId=new Map(((bookData||[]) as Book[]).map(book=>[book.id,book]));
    books=ids.map(id=>byId.get(id)).filter((book):book is Book=>Boolean(book));
  }

  return <AppShell><main className="container">
    <div className="page-head"><div><h1>Favoritos</h1><p>Seus livros salvos.</p></div></div>
    {books.length?<div className="book-grid">{books.map(book=><BookCard key={book.id} book={book}/>)}</div>:<div className="card empty">Você ainda não adicionou favoritos.</div>}
  </main></AppShell>;
}
