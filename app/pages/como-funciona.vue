<script setup lang="ts">
import { ArrowRight, Eye, ListChecks, ScanLine } from '@lucide/vue'

useSeoMeta({
  title: 'Como funciona · Fluxo Atento',
  description: 'Veja o sinal, entenda o contexto e confira o próximo passo em três situações ilustrativas de um site.',
  robots: 'index, follow'
})

const steps = [
  { title: 'Sinal: o que apareceu?', icon: Eye, text: 'Um envio recebe uma resposta de erro, um registro de compra não aparece ou o título de uma oferta muda. O sinal é o ponto de partida para conferir o que aconteceu.' },
  { title: 'Contexto: o que isso mostra?', icon: ScanLine, text: 'Compare a informação anterior com a seguinte e leia o que ainda não sabemos. Um sinal sozinho não confirma a causa, uma venda perdida ou um problema em outro canal.' },
  { title: 'Ação: o que vale conferir?', icon: ListChecks, text: 'Veja uma sugestão de próximo passo. Você pode continuar com o exemplo no painel; a demonstração não faz ajustes nem corrige um site.' }
]

const examples = [
  { id: 'errors', title: 'Envio do formulário', text: 'A página abre, mas o envio retorna uma falha. Confira a resposta e o que precisa ser investigado antes de concluir o motivo.' },
  { id: 'tracking', title: 'Registro de compras', text: 'O registro esperado não aparece na observação. Isso não prova que não houve compra; permissões e configuração ainda precisam ser conferidas.' },
  { id: 'changes', title: 'Mudanças na página', text: 'O título da oferta está diferente. Compare os dois textos e confirme se a atualização estava prevista.' }
]
</script>

<template>
  <div class="container">
    <header class="page-hero">
      <p class="eyebrow">DO SINAL AO PRÓXIMO PASSO</p>
      <h1>Veja o que apareceu.<br>Entenda o que conferir.</h1>
      <p>Para quem vende e recebe clientes pelo site e pelo WhatsApp, uma dúvida pode começar em um detalhe da página. Explore exemplos para entender o sinal, o contexto e uma possível próxima ação.</p>
      <p>Demonstração com dados ilustrativos. Nenhum site é acessado, nenhuma mensagem é enviada e nenhum problema é corrigido.</p>
    </header>

    <section id="exemplo" class="page-section" aria-labelledby="example-title">
      <h2 id="example-title" class="mb-4 text-2xl">Escolha uma situação de exemplo.</h2>
      <p class="mb-6">Use os controles para explorar as etapas. Você também encontra a explicação completa em texto logo abaixo.</p>
      <ExperienceStory />
    </section>

    <section class="page-section" aria-label="As três etapas da explicação">
      <article v-for="(step, index) in steps" :key="step.title" class="flow-detail">
        <span class="feature-icon mb-5"><component :is="step.icon" :size="21" aria-hidden="true" /></span>
        <p class="eyebrow">ETAPA {{ index + 1 }}</p>
        <h2>{{ step.title }}</h2>
        <p>{{ step.text }}</p>
      </article>
    </section>

    <section class="page-section" aria-labelledby="continue-title">
      <h2 id="continue-title" class="mb-6 text-2xl">Continue com o mesmo caso no painel.</h2>
      <div class="support-grid">
        <article v-for="example in examples" :key="example.id" class="support-card min-w-0">
          <span class="demo-badge">Dados de exemplo</span>
          <h2>{{ example.title }}</h2>
          <p>{{ example.text }}</p>
          <NuxtLink class="text-link" :to="{ path: '/exemplo', query: { scenario: example.id } }" :aria-label="`Ver ${example.title.toLocaleLowerCase('pt-BR')} no painel`">Ver este caso no painel <ArrowRight :size="16" aria-hidden="true" /></NuxtLink>
        </article>
      </div>
    </section>

    <section class="page-section" aria-labelledby="product-title">
      <div class="flow-detail">
        <h2 id="product-title">E os módulos e o WhatsApp?</h2>
        <p>A proposta do Fluxo Atento reúne acompanhamento de sites e seis módulos, com WhatsApp previsto nos três planos. As funções dos módulos ainda precisam de definição; os canais não estão conectados nesta demonstração. Você pode entender os exemplos antes de consultar essas partes do produto.</p>
      </div>
      <div class="flex flex-wrap gap-3">
        <NuxtLink class="button button-secondary" to="/ajuda">Consultar a ajuda <ArrowRight :size="16" aria-hidden="true" /></NuxtLink>
        <NuxtLink class="button button-secondary" to="/integracoes">Ver integrações previstas</NuxtLink>
      </div>
    </section>
  </div>
</template>
