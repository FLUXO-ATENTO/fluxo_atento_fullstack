import assert from 'node:assert/strict'
import { chromium, expect } from '@playwright/test'

const base = process.env.PREVIEW_BASE_URL || 'http://127.0.0.1:4174'
const tenantId = '22222222-2222-4222-8222-222222222222'
const browser = await chromium.launch()

async function signIn(page, email) {
  await page.goto(`${base}/login`)
  await page.getByText('AMBIENTE DE TESTE · conta e dados fictícios · sem envio externo').waitFor()
  await page.getByRole('textbox', { name: 'E-mail' }).fill(email)
  await page.getByLabel('Senha', { exact: true }).fill('senha-ficticia')
  await page.getByRole('button', { name: 'Entrar no painel' }).click()
  await page.waitForURL(url => !url.pathname.includes('/login')).catch(async error => {
    console.error((await page.locator('main').innerText()).slice(0, 1000))
    throw error
  })
}

try {
  const admin = await browser.newPage()
  await signIn(admin, 'qa@example.test')
  assert.equal(new URL(admin.url()).pathname, '/admin')
  await admin.goto(base)
  await admin.waitForURL(`${base}/admin`)
  await expect(admin.locator('.workspace-context small')).toHaveText('Superadmin')
  assert.equal(await admin.locator('.context-switch').count(), 0)
  await admin.goto(`${base}/admin?secao=clientes`)
  await expect(admin.getByRole('heading', { name: 'Configuração de cada tenant' })).toBeVisible()
  await admin.goto(`${base}/admin?secao=planos`)
  await expect(admin.getByRole('heading', { name: 'Planos cadastrados' })).toBeVisible()
  await admin.goto(`${base}/admin?secao=financeiro`)
  await expect(admin.getByRole('heading', { name: 'Pagamentos de todos os tenants' })).toBeVisible()
  await admin.getByRole('button', { name: 'Abrir suporte da plataforma' }).click()
  await expect(admin.getByRole('heading', { name: 'Chat suporte' })).toBeVisible()
  await admin.getByLabel('Empresa', { exact: true }).selectOption(tenantId)
  await expect(admin.getByText('Ainda não há mensagens.')).toBeVisible()

  const dual = await browser.newPage()
  await signIn(dual, 'dual@example.test')
  assert.equal(new URL(dual.url()).pathname, '/admin')
  await expect(dual.locator('.workspace-context small')).toHaveText('Superadmin')
  await dual.goto(base)
  await expect(dual.locator('.workspace-context small')).toHaveText('Responsável pela empresa')
  assert.equal(await dual.locator('.app-sidebar .context-switch').count(), 0)

  const tenant = await browser.newPage()
  await signIn(tenant, 'tenant@example.test')
  assert.equal(new URL(tenant.url()).pathname, '/')
  assert.equal(await tenant.locator('.app-sidebar .context-switch').count(), 0)
  await tenant.goto(`${base}/admin`)
  await expect(tenant.locator('main')).toContainText('Acesso reservado à administração da plataforma.')
  const status = await tenant.evaluate(async () => {
    const response = await fetch('/v1/admin/tenants', { headers: { Authorization: 'Bearer fixture-member' } })
    return response.status
  })
  assert.equal(status, 403)

  console.log('Preview: Superadmin permanece na área global; tenant fica no próprio espaço e recebe 403 no admin.')
} finally {
  await browser.close()
}
