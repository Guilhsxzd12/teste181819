import { NextRequest,NextResponse } from "next/server";
import { getApiViewer } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { prepareKindleBytes,type KindleSource } from "@/lib/kindle-service";
import { fetchDriveFile } from "@/lib/google-drive";
import { replaceEpubCover } from "@/lib/kindle-epub";

export const maxDuration=300;
function safeName(value:string){return value.replace(/[\r\n"\\/]/g,"-");}
function isEpub(name:string,mime:string){return mime==="application/epub+zip"||name.toLowerCase().endsWith(".epub");}

export async function POST(request:NextRequest){
  try{
    const body=await request.json();
    const source=String(body.source||"") as KindleSource;
    const id=String(body.id||"");
    const coverUrl=body.coverUrl?String(body.coverUrl):null;
    const languageFileId=body.languageFileId?String(body.languageFileId):null;
    if(!id||!["user","catalog"].includes(source))return NextResponse.json({error:"Livro inválido."},{status:400});

    if(source==="catalog"&&languageFileId){
      const admin=createAdminSupabaseClient();
      const [{data:book},{data:file}]=await Promise.all([
        admin.from("books").select("id,title,published").eq("id",id).eq("published",true).maybeSingle(),
        admin.from("book_language_files").select("id,book_id,language,format,drive_file_id,file_name,mime_type").eq("id",languageFileId).eq("book_id",id).maybeSingle()
      ]);
      if(!book)return NextResponse.json({error:"Livro não encontrado."},{status:404});
      if(!file)return NextResponse.json({error:"Versão de idioma não encontrada."},{status:404});
      if(!isEpub(String(file.file_name),String(file.mime_type)))return NextResponse.json({error:"Esta versão não possui EPUB."},{status:409});

      const driveResponse=await fetchDriveFile(String(file.drive_file_id));
      let bytes=new Uint8Array(await driveResponse.arrayBuffer());
      if(coverUrl)bytes=await replaceEpubCover(bytes,coverUrl);
      const arrayBuffer=bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength) as ArrayBuffer;
      const blob=new Blob([arrayBuffer],{type:"application/epub+zip"});
      const fileName=String(file.file_name||`${book.title}.epub`).replace(/\.[^.]+$/,".epub");
      return new NextResponse(blob,{status:200,headers:{"content-type":"application/epub+zip","content-disposition":`attachment; filename="${safeName(fileName)}"`,"cache-control":"private, no-store","x-book-title":encodeURIComponent(String(book.title))}});
    }

    let supabase;
    let userId="public-catalog";
    if(source==="catalog"){
      supabase=await createServerSupabaseClient();
    }else{
      const viewer=await getApiViewer();
      if(!viewer.user||!viewer.profile||(viewer.profile.role!=="admin"&&!viewer.profile.approved))return NextResponse.json({error:"Acesso negado."},{status:403});
      supabase=viewer.supabase;
      userId=viewer.user.id;
    }

    const result=await prepareKindleBytes(supabase,userId,source,id,coverUrl);
    const arrayBuffer=result.bytes.buffer.slice(result.bytes.byteOffset,result.bytes.byteOffset+result.bytes.byteLength) as ArrayBuffer;
    const blob=new Blob([arrayBuffer],{type:"application/epub+zip"});
    return new NextResponse(blob,{status:200,headers:{"content-type":"application/epub+zip","content-disposition":`attachment; filename="${safeName(result.fileName)}"`,"cache-control":"private, no-store","x-book-title":encodeURIComponent(result.title)}});
  }catch(error){
    console.error("[kindle-prepare] failed",{message:error instanceof Error?error.message:String(error)});
    return NextResponse.json({error:error instanceof Error?error.message:"Não foi possível preparar o EPUB."},{status:500});
  }
}
