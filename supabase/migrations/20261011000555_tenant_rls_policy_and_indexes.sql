-- Explicit least-privilege policies complement the revoked browser grants.
-- They keep the security posture clear if a future feature needs read access.
create policy tenants_read_member on public.tenants for select to authenticated
  using ((select private.is_tenant_member(id)) or (select private.is_platform_administrator()));
create policy tenant_members_read_member on public.tenant_members for select to authenticated
  using (user_id = (select auth.uid()) or (select private.is_tenant_member(tenant_id)) or (select private.is_platform_administrator()));
create policy platform_administrators_read_self on public.platform_administrators for select to authenticated
  using (user_id = (select auth.uid()));
create policy platform_providers_read_admin on public.platform_providers for select to authenticated
  using ((select private.is_platform_administrator()));

-- Foreign-key indexes make tenant provisioning, provider selection and user
-- cleanup predictable as the FLUXO workload grows.
create index monitors_user_idx on public.monitors(user_id);
create index tenants_created_by_idx on public.tenants(created_by);
create index platform_providers_created_by_idx on public.platform_providers(created_by);
create index tenant_channel_connections_provider_idx on public.tenant_channel_connections(provider_id);
create index tenant_channel_connections_created_by_idx on public.tenant_channel_connections(created_by);
