import { notFound } from "next/navigation";
import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { CatalogBookActions,type CatalogLanguageOption } from "@/components/CatalogBookActions";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { getViewer } from "@/lib/auth";
import { languageLabel,normalizeLanguage } from "@/lib/languages";
import type { Book,Category } from "@/lib/types";
import styles from "./book-detail.module.css";

type LanguageFile={id:string;language:string;format:string;file_name:string;mime_type:string};
const UUID_RE=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isEpub(name?:string|null,mime?:string|null){return mime==="application/epub+zip"||Boolean(name?.toLowerCase().endsWith(".epub"));}
function isPdf(name?:string|null,mime?:string|null){return mime==="application/pdf"||Boolean(name?.toLowerCase().endsWith(".pdf"));}

export default async function BookPage({params}:{params:Promise<{id:string}>}){
  const {id}=await params;
  const db=createAdminSupabaseClient();
  let query=db.from("books").select("*,categories(name),book_categories(category_id,is_primary,categories(id,name,slug,parent_id,sort_order))").eq("published",true);
  query=UUID_RE.test(id)?query.eq("id",id):query.eq("slug",id);
  const {data:book}=await query.maybeSingle();
  if(!book)notFound();

  const b=book as Book;
  const [{data:languageFileData},viewer]=await Promise.all([
    db.from("book_language_files").select("id,language,format,file_name,mime_type").eq("book_id",b.id).order("language").order("format"),
    getViewer()
  ]);

  let initialFavorite=false;
  if(viewer.user){
    const {data:favorite}=await viewer.supabase.from("favorites").select("book_id").eq("user_id",viewer.user.id).eq("book_id",b.id).maybeSingle();
    initialFavorite=Boolean(favorite);
  }

  const linked=((b.book_categories||[]).map(x=>x.categories).filter(Boolean) as Category[]);
  const uniqueCategories=[...new Map(linked.map(c=>[c.id,c])).values()].sort((a,b)=>(a.parent_id?1:0)-(b.parent_id?1:0)||(a.sort_order??100)-(b.sort_order??100)||a.name.localeCompare(b.name,"pt-BR"));
  if(!uniqueCategories.length&&b.categories?.name)uniqueCategories.push({id:b.category_id||"primary",name:b.categories.name,slug:""});

  const defaultCode=normalizeLanguage(b.language)||"pt";
  const languageMap=new Map<string,CatalogLanguageOption>();
  languageMap.set(defaultCode,{
    code:defaultCode,
    label:languageLabel(defaultCode),
    hasEpub:isEpub(b.file_name,b.mime_type)||Boolean(b.kindle_drive_file_id),
    hasPdf:isPdf(b.file_name,b.mime_type)||Boolean(b.reading_pdf_drive_file_id),
    epubFileId:null,
    pdfFileId:null
  });

  for(const file of (languageFileData||[]) as LanguageFile[]){
    const code=normalizeLanguage(file.language)||defaultCode;
    const current=languageMap.get(code)||{code,label:languageLabel(code),hasEpub:false,hasPdf:false,epubFileId:null,pdfFileId:null};
    const format=file.format.toLowerCase();
    if(format==="epub"||isEpub(file.file_name,file.mime_type)){
      if(!current.hasEpub)current.epubFileId=file.id;
      current.hasEpub=true;
    }
    if(format==="pdf"||isPdf(file.file_name,file.mime_type)){
      if(!current.hasPdf)current.pdfFileId=file.id;
      current.hasPdf=true;
    }
    languageMap.set(code,current);
  }

  const languages=[...languageMap.values()].sort((a,b)=>a.code===defaultCode?-1:b.code===defaultCode?1:a.label.localeCompare(b.label,"pt-BR"));
  const displayLanguage=languageMap.get(defaultCode)?.label||languageLabel(b.language);

  return <AppShell><main className={styles.page}>
    <Link className={styles.back} href="/biblioteca">← Voltar ao acervo</Link>
    <section className={styles.detail}>
      <aside className={styles.coverColumn}>
        {b.cover_url?<img className={styles.cover} src={b.cover_url} alt={`Capa de ${b.title}`}/>:<div className={styles.fallback}>{b.title}</div>}
        <div className={styles.tags}>{uniqueCategories.map(c=>c.slug?<Link key={c.id} href={`/biblioteca?category=${encodeURIComponent(c.slug)}`}>{c.name}</Link>:<span key={c.id}>{c.name}</span>)}</div>
      </aside>

      <div className={styles.content}>
        <span className={styles.kicker}>KINDLE BOOKS</span>
        <h1 className={styles.title}>{b.title}</h1>
        <p className={styles.author}>{b.author}</p>

        <div className={styles.stats}>
          {b.year&&<div className={styles.stat}><small>ANO</small><strong>{b.year}</strong></div>}
          {b.pages&&<div className={styles.stat}><small>PÁGINAS</small><strong>{b.pages}</strong></div>}
          <div className={styles.stat}><small>IDIOMA</small><strong>{displayLanguage}</strong></div>
          {languages.length>1&&<div className={styles.stat}><small>VERSÕES</small><strong>{languages.length} idiomas</strong></div>}
        </div>

        <CatalogBookActions id={b.id} title={b.title} allowDownload={b.allow_download} initialFavorite={initialFavorite} languages={languages}/>

        <section className={styles.synopsis}>
          <h3>Sinopse</h3>
          <p>{b.description||"Sinopse ainda não informada."}</p>
        </section>
      </div>
    </section>
  </main></AppShell>;
}
