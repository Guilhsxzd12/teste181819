import { NextRequest,NextResponse } from "next/server";
import { getApiViewer } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { getCoverChoices,type KindleSource } from "@/lib/kindle-service";

export async function GET(request:NextRequest){
  try{
    const source=String(request.nextUrl.searchParams.get("source")||"") as KindleSource;
    const id=String(request.nextUrl.searchParams.get("id")||"");
    if(!id||!["user","catalog"].includes(source))return NextResponse.json({error:"Livro inválido."},{status:400});

    if(source==="catalog"){
      const admin=createAdminSupabaseClient();
      const [{data:book,error},{data:alternatives}]=await Promise.all([
        admin.from("books").select("title,cover_url").eq("id",id).eq("published",true).maybeSingle(),
        admin.from("book_covers").select("cover_url,label,source,created_at").eq("book_id",id).order("created_at",{ascending:true})
      ]);
      if(error)throw new Error(error.message);
      if(!book)return NextResponse.json({error:"Livro não encontrado."},{status:404});

      const seen=new Set<string>();
      const covers:{url:string;label:string;isDefault:boolean}[]=[];
      const current=String(book.cover_url||"").trim();
      if(current){seen.add(current);covers.push({url:current,label:"Capa atual",isDefault:true});}
      for(const item of alternatives||[]){
        const url=String(item.cover_url||"").trim();
        if(!url||seen.has(url))continue;
        seen.add(url);
        covers.push({url,label:String(item.label||`Capa ${covers.length+1}`),isDefault:url===current});
      }
      return NextResponse.json({title:book.title,covers});
    }

    const viewer=await getApiViewer();
    if(!viewer.user||!viewer.profile||(viewer.profile.role!=="admin"&&!viewer.profile.approved))return NextResponse.json({error:"Acesso negado."},{status:403});
    const result=await getCoverChoices(viewer.supabase,source,id);
    return NextResponse.json({title:result.item.title,covers:result.covers});
  }catch(error){
    return NextResponse.json({error:error instanceof Error?error.message:"Não foi possível carregar as capas."},{status:500});
  }
}
