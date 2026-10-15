<script setup lang="ts">
import { ArrowRight, BookOpen, FileText, MousePointer2 } from '@lucide/vue'

useSeoMeta({
  title: 'Ajuda e suporte · Fluxo Atento',
  description: 'Encontre orientações para explorar a demonstração, consultar a ajuda e preparar um relato sem enviar uma mensagem.',
  robots: 'index, follow'
})

const paths = [
  { title: 'Entender um exemplo', icon: MousePointer2, description: 'Veja o que significa o sinal e o que ainda precisa ser conferido. A explicação também está disponível em texto.', to: '/como-funciona', label: 'Ver como funciona' },
  { title: 'Encontrar uma resposta', icon: BookOpen, description: 'Pesquise por palavra ou categoria na ajuda. Há orientações sobre páginas, planos, dados e canais previstos.', to: '/ajuda', label: 'Pesquisar na ajuda' },
  { title: 'Organizar um relato', icon: FileText, description: 'Prepare e copie um texto com sua dúvida. Nenhuma mensagem é enviada e nenhum chamado é aberto.', to: '/contato', label: 'Preparar um pedido' }
]

const questions = [
  { question: 'O formulário do exemplo deu erro. Meu site está com problema?', answer: 'Não é possível concluir isso pela demonstração. A falha faz parte de uma situação ilustrativa; o seu site não foi acessado. Veja o contexto do exemplo para entender o que seria necessário conferir.' },
  { question: 'Uma página da demonstração não abriu. O que faço?', answer: 'Tente abrir novamente ou volte a Como funciona. Antes de atualizar o navegador, lembre que alterações locais do painel podem se perder. Se quiser organizar um relato, anote a página, o que tentou fazer e o que apareceu, sem incluir senhas ou dados de clientes.' },
  { question: 'Posso usar a explicação sem acompanhar a animação?', answer: 'Sim. A página Como funciona explica sinal, contexto e ação também em texto. Os controles permitem escolher etapas. Você pode usar Tab para percorrer a página e Enter ou Espaço para acionar botões.' },
  { question: 'Copiei um pedido. Ele foi enviado para alguém?', answer: 'Não. Copiar coloca o texto na área de transferência do seu dispositivo. Você decide onde colar. O formulário não escolhe um destinatário, não envia mensagem e não abre atendimento.' },
  { question: 'O navegador não deixou copiar. Vou perder o texto?', answer: 'O pedido preparado continua visível em um campo de texto na página de Contato. Use Selecionar texto e o comando Copiar do seu dispositivo. Salve o que precisar antes de sair ou atualizar a página.' },
  { question: 'Há atendimento por WhatsApp ou prazo de resposta?', answer: 'O chat e o WhatsApp de suporte ainda não estão conectados. O contato público por e-mail é contato@fluxoatento.com.br. Não há prazo de resposta garantido; preparar ou copiar um relato nesta página não envia o e-mail automaticamente.' }
]
</script>

<template>
  <div class="container">
    <header class="page-hero">
      <p class="eyebrow">AJUDA E SUPORTE</p>
      <h1>Encontre um caminho para continuar.</h1>
      <p>Consulte uma orientação, entenda um exemplo ou organize sua dúvida. Chat e WhatsApp de suporte ainda estão em preparação.</p>
    </header>

    <section class="page-section" aria-label="Caminhos de ajuda">
      <div class="support-grid">
        <article v-for="path in paths" :key="path.to" class="support-card min-w-0">
          <span class="feature-icon"><component :is="path.icon" :size="21" aria-hidden="true" /></span>
          <h2>{{ path.title }}</h2>
          <p>{{ path.description }}</p>
          <NuxtLink class="text-link" :to="path.to">{{ path.label }} <ArrowRight :size="16" aria-hidden="true" /></NuxtLink>
        </article>
      </div>

      <section class="faq-list" aria-labelledby="faq-title">
        <h2 id="faq-title" class="mb-5 text-2xl">Dúvidas ao explorar</h2>
        <details v-for="item in questions" :key="item.question">
          <summary>{{ item.question }}</summary>
          <p>{{ item.answer }}</p>
        </details>
      </section>

      <div class="flow-detail">
        <h2>Um relato útil começa pelo que aconteceu.</h2>
        <p>Indique a página, a ação que tentou fazer e o resultado que apareceu. Se a questão for sobre um plano ou canal, diga o que você quer entender. O pedido pode ser preparado e copiado localmente, sem envio automático.</p>
      </div>
      <div class="flex flex-wrap gap-3">
        <NuxtLink class="button button-primary" to="/contato">Preparar um pedido <ArrowRight :size="16" aria-hidden="true" /></NuxtLink>
        <NuxtLink class="button button-secondary" to="/exemplo">Voltar à demonstração</NuxtLink>
      </div>
    </section>
  </div>
</template>
