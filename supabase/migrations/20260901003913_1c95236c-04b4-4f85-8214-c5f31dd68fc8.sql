create or replace function public.ac_generate_client_code()
returns text language sql stable set search_path = public as $$
  select 'LG-' || upper(substring(md5(random()::text || clock_timestamp()::text) for 6));
$$;