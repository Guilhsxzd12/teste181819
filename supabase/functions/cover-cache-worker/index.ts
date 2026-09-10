import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL=Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const db=createClient(SUPABASE_URL,SERVICE_KEY,{auth:{persistSession:false}});

function localCover(url:string|null){
  return Boolean(url&&url.startsWith(`${SUPABASE_URL}/storage/v1/object/public/covers/`));
}

function extension(contentType:string){
  if(contentType.includes("png"))return "png";
  if(contentType.includes("webp"))return "webp";
  return "jpg";
}

Deno.serve(async(req:Request)=>{
  try{
    const secret=req.headers.get("x-knowledge-secret")||"";
    const {data:ok,error:authError}=await db.rpc("verify_knowledge_cron",{p_secret:secret});
    if(authError||!ok)return new Response("unauthorized",{status:401});

    const body=await req.json().catch(()=>({}));
    const limit=Math.max(1,Math.min(100,Number(body?.limit)||50));
    const {data:rows,error}=await db
      .from("book_knowledge")
      .select("id,cover_url,cover_urls")
      .not("cover_url","is",null)
      .order("updated_at",{ascending:true})
      .limit(limit*4);
    if(error)throw error;

    let selected=0,cached=0,failed=0;
    for(const row of rows||[]){
      const oldUrl=String(row.cover_url||"");
      if(!oldUrl||localCover(oldUrl))continue;
      if(selected>=limit)break;
      selected++;
      try{
        const r=await fetch(oldUrl,{headers:{"User-Agent":"KindleBooksCoverCache/1.0","Accept":"image/avif,image/webp,image/png,image/jpeg,image/*"}});
        if(!r.ok)throw new Error(`cover fetch ${r.status}`);
        const contentType=(r.headers.get("content-type")||"image/jpeg").split(";")[0].trim().toLowerCase();
        if(!contentType.startsWith("image/"))throw new Error("not image");
        const bytes=new Uint8Array(await r.arrayBuffer());
        if(!bytes.byteLength||bytes.byteLength>5*1024*1024)throw new Error("invalid image size");

        const ext=extension(contentType);
        const path=`knowledge/${row.id}.${ext}`;
        const {error:uploadError}=await db.storage.from("covers").upload(path,bytes,{contentType,upsert:true,cacheControl:"31536000"});
        if(uploadError)throw uploadError;
        const {data:publicData}=db.storage.from("covers").getPublicUrl(path);
        const localUrl=publicData.publicUrl;
        const urls=[localUrl,oldUrl,...(Array.isArray(row.cover_urls)?row.cover_urls:[])].filter(Boolean);
        const unique=[...new Set(urls)];

        const {error:updateKnowledgeError}=await db.from("book_knowledge").update({cover_url:localUrl,cover_urls:unique,updated_at:new Date().toISOString()}).eq("id",row.id);
        if(updateKnowledgeError)throw updateKnowledgeError;
        await db.from("books").update({cover_url:localUrl,updated_at:new Date().toISOString()}).eq("knowledge_id",row.id).is("cover_url",null);
        await db.from("books").update({cover_url:localUrl,updated_at:new Date().toISOString()}).eq("knowledge_id",row.id).eq("cover_url",oldUrl);
        cached++;
      }catch(e){
        failed++;
        console.error("cover-cache",row.id,e);
      }
    }

    return Response.json({ok:true,selected,cached,failed});
  }catch(e){
    console.error(e);
    return Response.json({ok:false,error:e instanceof Error?e.message:String(e)},{status:500});
  }
});
