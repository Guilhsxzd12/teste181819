"use client";
import { createBrowserClient } from "@supabase/ssr";

let client: ReturnType<typeof createBrowserClient> | undefined;

export function createBrowserSupabaseClient() {
  if (client) return client;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://fsnpdtuzkayxngeltqdl.supabase.co";
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "sb_publishable_E6sOoTf1LnAElnn8RPe3hg_HUOrUB_h";
  client = createBrowserClient(supabaseUrl, publishableKey);
  return client;
}
