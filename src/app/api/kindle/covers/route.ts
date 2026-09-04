import { NextRequest,NextResponse } from "next/server";
import { getApiViewer } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getCoverChoices,type KindleSource } from "@/lib/kindle-service";

export async function GET(request:NextRequest){
  try{
    const source=String(request.nextUrl.searchParams.get("source")||"") as KindleSource;
    const id=String(request.nextUrl.searchParams.get("id")||"");
    if(!id||!["user","catalog"].includes(source))return NextResponse.json({error:"Livro inválido."},{status:400});

    if(source==="catalog"){
      const supabase=await createServerSupabaseClient();
      const {data,error}=await supabase.from("books").select("title,cover_url").eq("id",id).eq("published",true).maybeSingle();
      if(error)throw new Error(error.message);
      if(!data)return NextResponse.json({error:"Livro não encontrado."},{status:404});
      const covers=data.cover_url?[{url:String(data.cover_url),label:"Capa atual",isDefault:true}]:[];
      return NextResponse.json({title:data.title,covers});
    }

    const viewer=await getApiViewer();
    if(!viewer.user||!viewer.profile||(viewer.profile.role!=="admin"&&!viewer.profile.approved))return NextResponse.json({error:"Acesso negado."},{status:403});
    const result=await getCoverChoices(viewer.supabase,source,id);
    return NextResponse.json({title:result.item.title,covers:result.covers});
  }catch(error){
    return NextResponse.json({error:error instanceof Error?error.message:"Não foi possível carregar as capas."},{status:500});
  }
}
