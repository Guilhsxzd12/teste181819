create or replace function public.trigger_cover_cache_worker(p_limit integer default 50)
returns bigint
language plpgsql
security definer
set search_path to 'public','extensions','vault','net'
as $$
declare
  request_id bigint;
  secret_value text;
begin
  select decrypted_secret into secret_value
  from vault.decrypted_secrets
  where name='kindle_knowledge_cron_secret'
  limit 1;

  if secret_value is null then
    raise exception 'knowledge cron secret missing';
  end if;

  select net.http_post(
    url := 'https://fsnpdtuzkayxngeltqdl.supabase.co/functions/v1/cover-cache-worker',
    headers := jsonb_build_object(
      'Content-Type','application/json',
      'X-Knowledge-Secret',secret_value
    ),
    body := jsonb_build_object('limit',least(greatest(coalesce(p_limit,50),1),100)),
    timeout_milliseconds := 120000
  ) into request_id;

  return request_id;
end;
$$;

do $$
declare j bigint;
begin
  select jobid into j from cron.job where jobname='kindle-cover-cache-worker' limit 1;
  if j is not null then perform cron.unschedule(j); end if;
  perform cron.schedule(
    'kindle-cover-cache-worker',
    '5,15,25,35,45,55 * * * *',
    $cron$select public.trigger_cover_cache_worker(50);$cron$
  );
end $$;
