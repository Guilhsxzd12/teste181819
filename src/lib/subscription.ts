import "server-only";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export type SubscriptionState={status:"inactive"|"active"|"canceled";activatedAt:string|null;activeUntil:string|null;isActive:boolean};

type CachedSubscription={value:SubscriptionState;expiresAt:number};
const subscriptionCache=new Map<string,CachedSubscription>();
const SUBSCRIPTION_CACHE_MS=15_000;

function cacheSubscription(userId:string,value:SubscriptionState){subscriptionCache.set(userId,{value,expiresAt:Date.now()+SUBSCRIPTION_CACHE_MS});return value;}
function clearSubscriptionCache(userId:string){subscriptionCache.delete(userId);}

export async function getSubscriptionState(userId:string):Promise<SubscriptionState>{
  const cached=subscriptionCache.get(userId);
  if(cached&&cached.expiresAt>Date.now())return cached.value;
  if(cached)subscriptionCache.delete(userId);

  const admin=createAdminSupabaseClient();
  const {data,error}=await admin.from("subscriptions").select("status,activated_at,active_until").eq("user_id",userId).maybeSingle();
  if(error)throw new Error(`Falha ao consultar assinatura: ${error.message}`);
  const activatedAt=data?.activated_at?String(data.activated_at):null;
  const activeUntil=data?.active_until?String(data.active_until):null;
  const isActive=data?.status==="active"&&!!activeUntil&&new Date(activeUntil).getTime()>Date.now();
  return cacheSubscription(userId,{status:(data?.status||"inactive") as SubscriptionState["status"],activatedAt,activeUntil,isActive});
}

export async function activateSubscription(userId:string,adminUserId:string,note?:string|null){
  const admin=createAdminSupabaseClient();
  const activatedAt=new Date();
  const activeUntil=new Date(activatedAt.getTime()+30*86400000).toISOString();
  const payload={user_id:userId,status:"active",active_until:activeUntil,activated_at:activatedAt.toISOString(),activated_by:adminUserId,note:note||"Pagamento confirmado manualmente — 30 dias",updated_at:activatedAt.toISOString()};
  const {data,error}=await admin.from("subscriptions").upsert(payload,{onConflict:"user_id"}).select("*").single();
  if(error)throw new Error(error.message);
  await admin.from("profiles").update({approved:true,updated_at:new Date().toISOString()}).eq("id",userId);
  clearSubscriptionCache(userId);
  cacheSubscription(userId,{status:"active",activatedAt:payload.activated_at,activeUntil,isActive:true});
  return data;
}

export async function cancelSubscription(userId:string,adminUserId:string){
  const admin=createAdminSupabaseClient();
  const {data,error}=await admin.from("subscriptions").upsert({user_id:userId,status:"canceled",active_until:null,activated_by:adminUserId,updated_at:new Date().toISOString()},{onConflict:"user_id"}).select("*").single();
  if(error)throw new Error(error.message);
  clearSubscriptionCache(userId);
  cacheSubscription(userId,{status:"canceled",activatedAt:data?.activated_at?String(data.activated_at):null,activeUntil:null,isActive:false});
  return data;
}
