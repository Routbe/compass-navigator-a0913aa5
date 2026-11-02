-- 0165 — Per-workspace ElevenLabs voice settings (Audio & Voice).
-- The API key is stored AES-256-GCM sealed (crypto/secretbox.server.ts,
-- PSP_ENCRYPTION_KEY, AAD = workspace id); the database never holds plaintext
-- and the client only ever receives a `configured` boolean. Idempotent; meant
-- for manual execution in the Neon SQL editor as owner.

create table if not exists public.workspace_voice_settings (
  workspace_id       uuid primary key references public.workspaces (id) on delete cascade,
  api_key_ciphertext text,
  api_key_iv         text,
  default_voice_id   text,
  updated_at         timestamptz not null default now(),
  constraint workspace_voice_key_pair check ((api_key_ciphertext is null) = (api_key_iv is null)),
  constraint workspace_voice_voice_id check (default_voice_id is null or default_voice_id ~ '^[A-Za-z0-9]{10,64}$')
);

revoke all on public.workspace_voice_settings from public;
do $$ begin
  if exists (select 1 from pg_roles where rolname = 'rout_app') then
    grant select, insert, update, delete on public.workspace_voice_settings to rout_app;
  end if;
end $$;

alter table public.workspace_voice_settings enable row level security;
drop policy if exists rout_voice_admin on public.workspace_voice_settings;
-- Only owners/admins of the workspace can read or change its voice settings.
create policy rout_voice_admin on public.workspace_voice_settings
  for all using (public.rout_workspace_role(workspace_id) in ('owner', 'admin'))
  with check (public.rout_workspace_role(workspace_id) in ('owner', 'admin'));
