"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";

function safeNext(value?:string){return value&&value.startsWith("/")&&!value.startsWith("//")?value:"/biblioteca";}
const TELEGRAM_CONTACT="https://t.me/kindlebookadm";

export function LoginForm({next}:{next?:string}){
  const [signup,setSignup]=useState(false);const [loading,setLoading]=useState(false);const [message,setMessage]=useState("");const router=useRouter();
  async function submit(formData:FormData){setLoading(true);setMessage("");const supabase=createBrowserSupabaseClient();const email=String(formData.get("email")||"").trim();const password=String(formData.get("password")||"");const fullName=String(formData.get("full_name")||"").trim();try{if(signup){const {error}=await supabase.auth.signUp({email,password,options:{data:{full_name:fullName}}});if(error)throw error;router.replace(next?safeNext(next):"/aguardando-aprovacao");}else{const {error}=await supabase.auth.signInWithPassword({email,password});if(error)throw error;router.replace(safeNext(next));router.refresh();}}catch(e){setMessage(e instanceof Error?e.message:"Erro ao entrar.");}finally{setLoading(false);}}
  return <div className="auth-card"><div className="brand"><span className="brand-mark">K</span><span className="brand-copy">KINDLE <b>BOOK</b></span></div><h1>{signup?"Criar conta":"Bem-vindo de volta"}</h1><p className="muted">{signup?"Crie sua conta para acessar o acervo de ebooks.":"Sua próxima leitura está esperando por você."}</p><form className="stack" action={submit}>{signup&&<label>Nome<input name="full_name" required/></label>}<label>E-mail<input type="email" name="email" required/></label><label>Senha<input type="password" name="password" minLength={6} required/></label><button className="btn" disabled={loading}>{loading?"Processando...":signup?"Criar conta":"Entrar na biblioteca"}</button></form>{message&&<p className="notice">{message}</p>}<button className="btn ghost" style={{marginTop:12,width:"100%"}} onClick={()=>setSignup(!signup)}>{signup?"Já tenho conta":"Primeiro acesso? Criar conta"}</button><div style={{marginTop:18,paddingTop:16,borderTop:"1px solid var(--line)",textAlign:"center"}}><small className="muted">Dúvidas sobre acesso, assinatura ou Telegram?</small><br/><a className="text-link" style={{marginTop:8}} href={TELEGRAM_CONTACT} target="_blank" rel="noreferrer">Falar com @kindlebookadm</a></div></div>;
}
