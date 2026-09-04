import { notFound } from "next/navigation";
import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { ReaderClient } from "@/components/ReaderClient";

export default async function ReaderPage({params}:{params:Promise<{id:string}>}){
  const {id}=await params;
  const supabase=await createServerSupabaseClient();
  const {data:book}=await supabase.from("books").select("id,title,pages,mime_type,file_name").eq("id",id).eq("published",true).maybeSingle();
  if(!book)notFound();
  const isPdf=book.mime_type==="application/pdf"||String(book.file_name||"").toLowerCase().endsWith(".pdf");
  if(!isPdf)return <main className="container"><div className="card panel"><h1>Formato não disponível no leitor</h1><p className="muted">Este arquivo ainda não possui uma versão PDF para leitura online.</p><Link className="btn" href={`/livro/${book.id}`}>Voltar ao livro</Link></div></main>;
  return <ReaderClient bookId={book.id} title={book.title} totalPages={book.pages||1} initialPage={1}/>;
}
