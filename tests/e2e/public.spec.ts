import { expect, test } from '@playwright/test'
import { scenarios } from '../../app/data/experience'

test('a jornada pública mantém a demonstração separada da API', async ({ page }) => {
  const monitorRequests: string[] = []
  page.on('request', request => {
    if (request.url().includes('/v1/monitors')) monitorRequests.push(request.url())
  })
  await page.goto('/')
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  await page.getByRole('link', { name: 'Explorar dashboard', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'O que merece sua atenção?' })).toBeVisible()
  await expect(page.getByText('Sem acessar endereços reais', { exact: true })).toBeVisible()
  expect(monitorRequests).toEqual([])
})

for (const scenario of scenarios) {
  test(`o cenário ${scenario.id} preserva a evidência da landing ao painel`, async ({ page }) => {
    await page.goto('/')
    await page.waitForFunction(() => Boolean((document.querySelector('#__nuxt') as HTMLElement & { __vue_app__?: unknown })?.__vue_app__))
    await page.getByRole('button', { name: scenario.label, exact: true }).click()
    await expect(page.getByRole('button', { name: scenario.label, exact: true })).toHaveAttribute('aria-pressed', 'true')
    await page.getByRole('button', { name: '03 Decida' }).click()
    await expect(page.getByRole('link', { name: 'Ver a próxima ação', exact: true })).toHaveAttribute('href', `/exemplo?scenario=${scenario.id}`)
    await page.getByRole('link', { name: 'Ver a próxima ação', exact: true }).click()
    await expect(page).toHaveURL(new RegExp(`/exemplo/?\\?scenario=${scenario.id}$`))
    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()
    await expect(dialog.getByRole('heading', { name: scenario.signal, exact: true })).toBeVisible()
    await expect(dialog.getByText(scenario.evidence, { exact: true })).toBeVisible()
    await expect(dialog.getByText(scenario.before, { exact: true })).toBeVisible()
    await expect(dialog.getByText(scenario.after, { exact: true })).toBeVisible()
    await expect(dialog.getByText('O QUE FOI OBSERVADO NO EXEMPLO')).toBeVisible()
    await dialog.getByRole('button', { name: 'Marcar como revisado', exact: true }).click()
    await expect(dialog).not.toBeVisible()
    await page.getByRole('button', { name: 'Revisados', exact: true }).click()
    await page.getByRole('button').filter({ hasText: scenario.signal }).click()
    await expect(dialog.getByRole('button', { name: 'Já revisado', exact: true })).toBeDisabled()
  })
}
