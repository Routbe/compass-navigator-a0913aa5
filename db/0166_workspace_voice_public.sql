-- 0166 — Public voice intro for workspace Profile Hubs.
-- One definer function hands the public speech endpoint exactly what it needs
-- for a published hub with a spoken introduction: the sealed ElevenLabs key
-- (AES-256-GCM, AAD = workspace id — useless outside the server), the voice id
-- and the intro text. Unpublished hubs and workspaces without a configured key
-- return nothing. Idempotent; meant for manual execution in the Neon SQL
-- editor as owner.

create or replace function public.rout_public_workspace_voice(p_slug text)
  returns table(workspace_id uuid, intro_text text, api_key_ciphertext text, api_key_iv text, default_voice_id text)
  language sql stable security definer set search_path = public
  as $$
  select w.id,
         trim(w.public_profile->>'voiceIntro'),
         v.api_key_ciphertext,
         v.api_key_iv,
         v.default_voice_id
  from public.workspaces w
  join public.workspace_voice_settings v on v.workspace_id = w.id
  where w.slug = lower(p_slug)
    and coalesce((w.public_profile->>'published')::boolean, false)
    and length(trim(coalesce(w.public_profile->>'voiceIntro', ''))) > 0
    and v.api_key_ciphertext is not null
    and v.api_key_iv is not null
    and v.default_voice_id is not null
  limit 1 $$;
revoke all on function public.rout_public_workspace_voice(text) from public;
do $$ begin
  if exists (select 1 from pg_roles where rolname = 'rout_app') then
    grant execute on function public.rout_public_workspace_voice(text) to rout_app;
  end if;
end $$;
