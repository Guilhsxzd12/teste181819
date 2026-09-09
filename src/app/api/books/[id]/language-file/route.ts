import { NextRequest,NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { fetchDriveFile } from "@/lib/google-drive";

export async function GET(request:NextRequest,context:{params:Promise<{id:string}>}){
  const {id}=await context.params;
  const fileId=request.nextUrl.searchParams.get("fileId")||"";
  if(!fileId)return NextResponse.json({error:"Arquivo de idioma não informado."},{status:400});

  const db=createAdminSupabaseClient();
  const [{data:book},{data:file}]=await Promise.all([
    db.from("books").select("id,published,allow_download").eq("id",id).eq("published",true).maybeSingle(),
    db.from("book_language_files").select("id,book_id,language,format,drive_file_id,file_name,mime_type").eq("id",fileId).eq("book_id",id).maybeSingle()
  ]);
  if(!book)return NextResponse.json({error:"Livro não encontrado."},{status:404});
  if(!file)return NextResponse.json({error:"Versão de idioma não encontrada."},{status:404});

  const wantsDownload=request.nextUrl.searchParams.get("download")==="1";
  if(wantsDownload&&!book.allow_download)return NextResponse.json({error:"Download não permitido para este livro."},{status:403});

  try{
    const response=await fetchDriveFile(String(file.drive_file_id),request.headers.get("range"));
    const headers=new Headers();
    ["content-length","content-range","accept-ranges","etag"].forEach(name=>{const value=response.headers.get(name);if(value)headers.set(name,value);});
    headers.set("content-type",String(file.mime_type||response.headers.get("content-type")||"application/octet-stream"));
    headers.set("content-disposition",`${wantsDownload?"attachment":"inline"}; filename="${encodeURIComponent(String(file.file_name))}"`);
    headers.set("cache-control","public, max-age=300");
    return new NextResponse(response.body,{status:response.status,headers});
  }catch(error){
    return NextResponse.json({error:error instanceof Error?error.message:"Erro ao abrir esta versão."},{status:502});
  }
}
