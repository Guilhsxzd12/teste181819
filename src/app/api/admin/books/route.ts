import { NextRequest,NextResponse } from "next/server";
import { getApiViewer } from "@/lib/auth";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { guessCategoryIds } from "@/lib/category-match";
import { driveLetter,slugifyTitle } from "@/lib/slugify";
import type { Category } from "@/lib/types";

async function admin(){const v=await getApiViewer();return v.user&&v.profile?.role==="admin"?v:null;}
async function uniqueSlug(base:string,year:number|null,driveFileId:string){const db=createAdminSupabaseClient();const candidates=[base,year?`${base}-${year}`:"",`${base}-${driveFileId.slice(0,8).toLowerCase()}`].filter(Boolean);for(const slug of candidates){const {data}=await db.from("books").select("id").eq("slug",slug).maybeSingle();if(!data)return slug;}return `${base}-${Date.now()}`;}
function categoryIdsFrom(body:any){const raw=Array.isArray(body.categoryIds)?body.categoryIds:[body.categoryId].filter(Boolean);const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;return [...new Set(raw.map((v:unknown)=>String(v||"").trim()).filter((v:string)=>uuid.test(v)))];}

export async function POST(request:NextRequest){
  const v=await admin();if(!v)return NextResponse.json({error:"Acesso negado."},{status:403});
  try{
    const b=await request.json();const title=String(b.title||"").trim();const author=String(b.author||"").trim();const description=String(b.description||"").trim();const language=String(b.language||"").trim().toLowerCase()||null;
    const driveFileId=String(b.driveFileId||"").trim();const fileName=String(b.fileName||"").trim();const requestedMime=String(b.mimeType||"").toLowerCase();const readingPdfDriveFileId=String(b.readingPdfDriveFileId||"").trim();const readingPdfFileName=String(b.readingPdfFileName||"").trim();const isEpub=requestedMime==="application/epub+zip"||fileName.toLowerCase().endsWith(".epub");const isPdfCopy=readingPdfFileName.toLowerCase().endsWith(".pdf");
    if(!title||!driveFileId||!fileName)return NextResponse.json({error:"Título e EPUB são obrigatórios."},{status:400});if(!author)return NextResponse.json({error:"Autor é obrigatório."},{status:400});if(!description)return NextResponse.json({error:"Sinopse é obrigatória."},{status:400});if(!isEpub)return NextResponse.json({error:"O arquivo original precisa ser EPUB."},{status:400});if(!readingPdfDriveFileId||!readingPdfFileName||!isPdfCopy)return NextResponse.json({error:"Envie também o PDF de leitura manualmente."},{status:400});
    const coverUrl=String(b.coverUrl||"").trim()||null;if(!coverUrl)return NextResponse.json({error:"Adicione uma capa para a versão Kindle."},{status:400});

    const db=createAdminSupabaseClient();const {data:categoryRows,error:categoryError}=await db.from("categories").select("id,name,slug").order("name");if(categoryError)return NextResponse.json({error:categoryError.message},{status:400});const categories=(categoryRows||[]) as Category[];
    const requested=categoryIdsFrom(b);const validSet=new Set(categories.map(x=>x.id));const manualIds=requested.filter(id=>validSet.has(id));const guessed=guessCategoryIds(categories,Array.isArray(b.subjects)?b.subjects.map(String):[],title,description);const categoryIds=[...new Set([...manualIds,...guessed])];const primaryCategoryId=manualIds[0]||guessed[0]||null;
    const year=b.year?Number(b.year):null;const pages=b.pages?Number(b.pages):null;const baseSlug=slugifyTitle(title).toLowerCase()||"livro";const slug=await uniqueSlug(baseSlug,Number.isFinite(year)?year:null,driveFileId);const now=new Date().toISOString();
    const payload={title,slug,author,description,language,category_id:primaryCategoryId,year:Number.isFinite(year)?year:null,pages:Number.isFinite(pages)?pages:null,cover_url:coverUrl,drive_file_id:driveFileId,drive_folder_letter:driveLetter(title),file_name:fileName,mime_type:"application/epub+zip",reading_pdf_drive_file_id:readingPdfDriveFileId,reading_pdf_file_name:readingPdfFileName,reading_pdf_generated_at:now,kindle_drive_file_id:null,kindle_file_name:null,kindle_generated_at:null,allow_download:Boolean(b.allowDownload),published:b.published!==false,updated_at:now};
    const {data,error}=await db.from("books").insert(payload).select("*").single();if(error){console.error("[admin-books] insert failed",{message:error.message,code:error.code});return NextResponse.json({error:error.message},{status:400});}
    if(categoryIds.length){const links=categoryIds.map(categoryId=>({book_id:data.id,category_id:categoryId,is_primary:categoryId===primaryCategoryId,source:manualIds.includes(categoryId)?"manual":"auto",confidence:manualIds.includes(categoryId)?100:92}));const {error:linkError}=await db.from("book_categories").insert(links);if(linkError){await db.from("books").delete().eq("id",data.id);return NextResponse.json({error:linkError.message},{status:400});}}
    const {data:complete}=await db.from("books").select("*,categories(name),book_categories(category_id,is_primary,source,confidence,categories(id,name,slug))").eq("id",data.id).single();return NextResponse.json({book:complete||data});
  }catch(e){console.error("[admin-books] unexpected failure",e instanceof Error?e.message:"unknown");return NextResponse.json({error:e instanceof Error?e.message:"Erro ao salvar livro."},{status:500});}
}

export async function PATCH(request:NextRequest){
  const v=await admin();if(!v)return NextResponse.json({error:"Acesso negado."},{status:403});const body=await request.json();const id=String(body.id||"").trim();if(!id)return NextResponse.json({error:"ID obrigatório."},{status:400});
  const db=createAdminSupabaseClient();const requested=categoryIdsFrom(body);let categoryIds:string[]=[];if(requested.length){const {data}=await db.from("categories").select("id").in("id",requested);const valid=new Set((data||[]).map(x=>x.id));categoryIds=requested.filter(x=>valid.has(x));}
  const {error:updateError}=await db.from("books").update({category_id:categoryIds[0]||null,updated_at:new Date().toISOString()}).eq("id",id);if(updateError)return NextResponse.json({error:updateError.message},{status:400});await db.from("book_categories").delete().eq("book_id",id).in("source",["manual","auto"]);
  if(categoryIds.length){const {error}=await db.from("book_categories").upsert(categoryIds.map((categoryId,index)=>({book_id:id,category_id:categoryId,is_primary:index===0,source:"manual",confidence:100})),{onConflict:"book_id,category_id"});if(error)return NextResponse.json({error:error.message},{status:400});}
  await db.from("book_categories").update({is_primary:false}).eq("book_id",id).neq("category_id",categoryIds[0]||"00000000-0000-0000-0000-000000000000");if(categoryIds[0])await db.from("book_categories").update({is_primary:true}).eq("book_id",id).eq("category_id",categoryIds[0]);
  const {data}=await db.from("books").select("*,categories(name),book_categories(category_id,is_primary,source,confidence,categories(id,name,slug))").eq("id",id).single();return NextResponse.json({book:data});
}

export async function DELETE(request:NextRequest){const v=await admin();if(!v)return NextResponse.json({error:"Acesso negado."},{status:403});const id=request.nextUrl.searchParams.get("id");if(!id)return NextResponse.json({error:"ID obrigatório."},{status:400});const db=createAdminSupabaseClient();const {error}=await db.from("books").delete().eq("id",id);return error?NextResponse.json({error:error.message},{status:400}):NextResponse.json({ok:true});}
