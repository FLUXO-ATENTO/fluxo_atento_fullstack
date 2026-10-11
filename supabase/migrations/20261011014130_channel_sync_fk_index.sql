-- Applied with remote version 20261011014130. Cover the full composite FK.
create index channel_sync_connection_tenant_idx on public.channel_sync_state(connection_id,tenant_id);
