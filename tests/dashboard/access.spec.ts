import { test, expect, type Page } from '@playwright/test'
const userId = '11111111-1111-4111-8111-111111111111'
const tenantId = '33333333-3333-4333-8333-333333333333'
async function fixture(page: Page, platformAdmin: boolean) {
  const session = { access_token: 'test.access.token', refresh_token: 'fixture-refresh', token_type: 'bearer', expires_in: 3600, expires_at: Math.floor(Date.now() / 1000) + 3600, user: { id: userId, email: 'fixture@example.invalid', aud: 'authenticated', role: 'authenticated', app_metadata: {}, user_metadata: {} } }
  await page.addInitScript(({ session }) => {
    if (window.location.origin !== 'http://127.0.0.1:4174') return
    if (!localStorage.getItem('fixture-initialized')) {
      localStorage.setItem('sb-qbfmebpzxnzdpalmgtxr-auth-token', JSON.stringify(session))
      localStorage.setItem('fixture-initialized', 'true')
    }
  }, { session })
  await page.route('https://qbfmebpzxnzdpalmgtxr.supabase.co/**', route => route.fulfill({ status: 200, json: {} }))
  await page.route('https://api.fluxoatento.com.br/**', route => {
    const url = new URL(route.request().url()), path = url.pathname
    if (path === '/v1/workspace') return route.fulfill({ json: { active_tenant: { id: tenantId, name: 'Empresa fixture', role: 'owner' }, tenants: [{ id: tenantId, name: 'Empresa fixture', role: 'owner' }], platform_admin: platformAdmin } })
    if (path.startsWith('/v1/admin/') && !platformAdmin) return route.fulfill({ status: 403, json: { error: { message: 'Administração necessária.' } } })
    const responses: Record<string, object> = {
      '/v1/admin/tenants': { tenants: [{ id: tenantId, name: 'Empresa fixture' }], total: 1 },
      '/v1/admin/providers': { providers: [] }, '/v1/admin/audit': { events: [] }, '/v1/monitors': { monitors: [] },
      '/v1/contacts': { contacts: [], total: 0 }
    }
    return route.fulfill({ status: responses[path] ? 200 : 404, json: responses[path] || {} })
  })
}

test('existing admin session opens a different console and survives site/app roundtrip', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  await fixture(page, true)
  await page.goto('/login')
  await expect(page).toHaveURL(/\/admin\/?$/)
  await expect(page.getByRole('heading', { name: 'Seu centro de controle.' })).toBeVisible()
  await expect(page.getByText('Nenhum provedor cadastrado; nenhum canal global está ativado.')).toBeVisible()
  await page.route('https://fluxoatento.com.br/', route => route.fulfill({ contentType: 'text/html', body: '<a href="http://127.0.0.1:4174/login">Voltar ao app</a>' }))
  await page.getByRole('link', { name: 'Voltar ao site', exact: true }).click()
  await page.getByRole('link', { name: 'Voltar ao app' }).click()
  await expect(page).toHaveURL(/\/admin\/?$/)
  await expect(page.getByRole('heading', { name: 'Seu centro de controle.' })).toBeVisible()
  await page.getByRole('button', { name: 'Abrir tenant', exact: true }).click()
  await expect(page).toHaveURL(/\/monitores\/?$/)
  await page.getByRole('button', { name: 'Sair da conta', exact: true }).click()
  await expect(page).toHaveURL(/\/login\/?$/)
  await expect(page.getByRole('heading', { name: 'Acesse sua conta.' })).toBeVisible()
  expect(errors).toEqual([])
})

test('tenant owner cannot enter global console and no global data is requested', async ({ page }) => {
  const adminRequests: string[] = []
  page.on('request', request => { if (request.url().includes('/v1/admin/')) adminRequests.push(request.url()) })
  await fixture(page, false)
  await page.goto('/admin')
  await expect(page).toHaveURL('http://127.0.0.1:4174/')
  await expect(page.getByRole('heading', { name: 'Seu centro de controle.' })).toHaveCount(0)
  await expect(page.getByRole('link', { name: 'Voltar ao Super Admin' })).toHaveCount(0)
  expect(adminRequests).toEqual([])
})

test('unsigned visitors are sent to the common login', async ({ page }) => {
  await page.goto('/admin')
  await expect(page).toHaveURL(/\/login\?next=/)
  await expect(page.getByRole('heading', { name: 'Acesse sua conta.' })).toBeVisible()
})
