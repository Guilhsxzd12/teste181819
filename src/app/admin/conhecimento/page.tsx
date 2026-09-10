import Link from "next/link";
import { revalidatePath } from "next/cache";
import { AppShell } from "@/components/AppShell";
import { requireAdmin } from "@/lib/auth";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export const dynamic="force-dynamic";

async function runKnowledgeNow(){
  "use server";
  await requireAdmin();
  const admin=createAdminSupabaseClient();
  await admin.rpc("trigger_knowledge_worker",{p_limit:50});
  revalidatePath("/admin/conhecimento");
}

export default async function KnowledgePage(){
  await requireAdmin();
  const admin=createAdminSupabaseClient();
  const [knowledgeCount,linkedCount,pendingCount,manualCount,{data:recent},{data:runs}]=await Promise.all([
    admin.from("book_knowledge").select("id",{count:"exact",head:true}),
    admin.from("books").select("id",{count:"exact",head:true}).not("knowledge_id","is",null),
    admin.from("books").select("id",{count:"exact",head:true).eq("published",true).or("metadata_reviewed.is.null,metadata_reviewed.eq.false").lt("knowledge_attempts",5),
    admin.from("books").select("id",{count:"exact",head:true).eq("knowledge_status","manual"),
    admin.from("book_knowledge").select("id,title,author,description,cover_url,language,year,pages,source,confidence,times_used,updated_at").order("updated_at",{ascending:false}).limit(24),
    admin.from("knowledge_runs").select("id,started_at,finished_at,selected_count,matched_count,completed_count,error_count,status,note").order("id",{ascending:false}).limit(8)
  ]);

  return <AppShell><main className="container">
    <div className="page-head">
      <div><h1>Conhecimento</h1><p>Base automática usada para reconhecer livros, reaproveitar metadados confiáveis e completar o catálogo.</p></div>
      <div className="row wrap"><Link className="btn secondary" href="/admin">Voltar ao painel</Link><form action={runKnowledgeNow}><button className="btn" type="submit">Executar agora</button></form></div>
    </div>

    <div className="notice" style={{marginBottom:16}}><b>Automático:</b> o robô roda a cada 10 minutos. Ele consulta primeiro esta base e, quando necessário, usa Google Books e Open Library. Só aplica uma identificação quando a pontuação é alta; casos duvidosos ficam para revisão manual.</div>

    <div className="admin-grid" style={{marginBottom:18}}>
      <section className="card panel"><h2>{knowledgeCount.count||0}</h2><p className="muted">obras/edições aprendidas</p></section>
      <section className="card panel"><h2>{linkedCount.count||0}</h2><p className="muted">livros ligados à base</p></section>
      <section className="card panel"><h2>{pendingCount.count||0}</h2><p className="muted">na fila automática</p></section>
      <section className="card panel"><h2>{manualCount.count||0}</h2><p className="muted">precisam de confirmação humana</p></section>
    </div>

    <section className="card panel" style={{marginBottom:18}}><h2>Últimas execuções</h2><div className="table-list">{(runs||[]).length?(runs||[]).map((r:any)=><div className="table-row" key={r.id}><div><strong>{r.status==="done"?"Concluída":r.status}</strong><div className="meta">Selecionados: {r.selected_count} • identificados: {r.matched_count} • completos: {r.completed_count} • erros: {r.error_count}</div><small className="muted">{r.note||new Date(r.started_at).toLocaleString("pt-BR")}</small></div></div>):<div className="muted">Ainda não há execuções registradas.</div>}</div></section>

    <section className="card panel"><h2>Biblioteca de conhecimento</h2><p className="muted">Capas, títulos, autores, sinopses, idioma, ano e páginas armazenados para reutilização nas próximas identificações.</p><div className="book-grid" style={{marginTop:14}}>{(recent||[]).map((item:any)=><article className="card" key={item.id} style={{padding:12}}>{item.cover_url?<img src={item.cover_url} alt="" style={{width:"100%",aspectRatio:"2 / 3",objectFit:"cover",borderRadius:10,marginBottom:10}}/>:<div style={{width:"100%",aspectRatio:"2 / 3",border:"1px solid var(--line)",borderRadius:10,display:"grid",placeItems:"center",marginBottom:10}}><span className="muted">Sem capa</span></div>}<strong>{item.title}</strong><div className="meta">{item.author}</div><small className="muted">{item.language?.toUpperCase()||"—"}{item.year?` • ${item.year}`:""}{item.pages?` • ${item.pages} págs.`:""}<br/>{item.source} • confiança {item.confidence}% • usado {item.times_used}x</small></article>)}</div></section>
  </main></AppShell>;
}
