<script setup lang="ts">
import { ArrowRight, Cloud, Database, Globe2, Mail, MessageCircle, Sparkles } from '@lucide/vue'

useSeoMeta({
  title: 'Integrações previstas · Fluxo Atento',
  description: 'Entenda o papel previsto do site, do WhatsApp, da IA e do e-mail no Fluxo Atento. Nenhuma integração está conectada nesta demonstração.',
  robots: 'index, follow'
})

const channels = [
  { name: 'Seu site', icon: Globe2, state: 'Dados de exemplo', description: 'Você pode explorar falhas no envio, registros de compras e mudanças de conteúdo em um site fictício. Não há consulta ou acompanhamento real de endereços.', note: 'Nenhum site conectado.', help: '/ajuda#monitores' },
  { name: 'WhatsApp', icon: MessageCircle, state: 'Planejado', description: 'Previsto nos planos Gratuito, Essencial e Completo, com limites de uso. A proposta considera contatos que autorizaram mensagens e uma forma de sair das campanhas.', note: 'Nenhum número conectado. Sem envio ou recebimento de mensagens.', help: '/ajuda#whatsapp-ia' },
  { name: 'Apoio de IA', icon: Sparkles, state: 'Planejado', description: 'Inteligência artificial prevista para apoiar o atendimento, com limites e revisão da equipe. As funções e condições precisam ser validadas; respostas podem exigir correção.', note: 'Nenhum agente conectado ou respondendo nesta demonstração.', help: '/ajuda#whatsapp-ia' },
  { name: 'E-mail no Completo', icon: Mail, state: 'Planejado', description: 'O e-mail está previsto na proposta do plano Completo, para contatos que autorizaram o recebimento. Provedor, domínio de envio e condições de uso ainda dependem de configuração e validação.', note: 'Nenhum serviço de e-mail conectado. Sem campanhas ou envios ativos.', help: '/ajuda#email' }
]

const foundations = [
  { name: 'Supabase', icon: Database, description: 'Previsto para a base de dados e o acesso a contas do produto. A demonstração não oferece uma conta real nem comprova armazenamento em um serviço conectado.' },
  { name: 'Netlify', icon: Cloud, description: 'Previsto como parte da base de publicação do produto. A apresentação desta tecnologia não significa que o acompanhamento de sites ou os canais de atendimento estejam funcionando.' }
]
</script>

<template>
  <div class="container">
    <header class="page-hero">
      <p class="eyebrow">INTEGRAÇÕES · ESTADO ATUAL</p>
      <h1>Saiba onde cada canal entra.</h1>
      <p>O site, o WhatsApp e o e-mail fazem parte da proposta do Fluxo Atento. Nesta demonstração, todas as integrações estão sem conexão e nenhuma mensagem é enviada.</p>
    </header>

    <section class="page-section" aria-labelledby="channels-title">
      <h2 id="channels-title" class="mb-6 text-2xl">Canais e recursos previstos</h2>
      <div class="integration-grid">
        <article v-for="channel in channels" :key="channel.name" class="integration-card min-w-0">
          <div class="flex flex-wrap items-center justify-between gap-3">
            <span class="feature-icon"><component :is="channel.icon" :size="21" aria-hidden="true" /></span>
            <span class="badge-initial">{{ channel.state }}</span>
          </div>
          <h2>{{ channel.name }}</h2>
          <p>{{ channel.description }}</p>
          <p><strong>{{ channel.note }}</strong></p>
          <NuxtLink class="text-link" :to="channel.help" :aria-label="`Entender ${channel.name.toLocaleLowerCase('pt-BR')} na ajuda`">Entender na ajuda <ArrowRight :size="15" aria-hidden="true" /></NuxtLink>
        </article>
      </div>
    </section>

    <section class="page-section" aria-labelledby="foundations-title">
      <h2 id="foundations-title" class="mb-4 text-2xl">A base prevista para o produto</h2>
      <p class="mb-6">Estas tecnologias fazem parte do planejamento da estrutura. Você não precisa criar uma conta externa para explorar os exemplos, e esta página não conecta serviços.</p>
      <div class="integration-grid">
        <article v-for="foundation in foundations" :key="foundation.name" class="integration-card min-w-0">
          <span class="feature-icon"><component :is="foundation.icon" :size="21" aria-hidden="true" /></span>
          <h2>{{ foundation.name }}</h2>
          <p>{{ foundation.description }}</p>
          <span class="badge-initial">Base prevista · não conectado</span>
        </article>
      </div>
      <InitialState title="As conexões ainda não estão disponíveis." description="Esta versão explica a proposta e permite explorar exemplos locais. Não há ativação de conta, autorização de canal ou contratação de serviço por esta página." />
      <NuxtLink class="button button-secondary" to="/como-funciona">Explorar um exemplo <ArrowRight :size="16" aria-hidden="true" /></NuxtLink>
    </section>
  </div>
</template>
