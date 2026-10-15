<script setup lang="ts">
import { ArrowRight, Cloud, Database, Globe2, Mail, MessageCircle, Sparkles } from '@lucide/vue'

useSeoMeta({
  title: 'Integrações previstas · Fluxo Atento',
  description: 'Conheça o monitoramento HTTP disponível e diferencie as integrações Google, Meta, WhatsApp, IA e e-mail ainda previstas.',
  robots: 'index, follow'
})

const channels = [
  { name: 'Seu site', icon: Globe2, state: 'HTTP disponível no painel', description: 'No painel autenticado, você pode cadastrar páginas públicas e consultar respostas HTTP reais. Isso não testa checkout, formulários ou conversões. A consulta pública PageSpeed ainda será conectada.', note: 'A demonstração continua usando exemplos, separados dos seus monitores.', help: '/docs#monitoramento' },
  { name: 'Google e Meta', icon: Globe2, state: 'Planejado', description: 'Leitura de campanhas e funil mediante autorização das contas, propriedades e ativos do seu negócio. Entrar com Google não concede automaticamente acesso a anúncios ou Analytics.', note: 'Conexões de dados ainda não liberadas. Não forneça chaves pelo chat.', help: '/docs#integracoes' },
  { name: 'WhatsApp', icon: MessageCircle, state: 'Planejado', description: 'Previsto nos planos Gratuito, Essencial e Completo, com limites de uso. A proposta considera contatos que autorizaram mensagens e uma forma de sair das campanhas.', note: 'Nenhum número conectado. Sem envio ou recebimento de mensagens.', help: '/ajuda#whatsapp-ia' },
  { name: 'Apoio de IA', icon: Sparkles, state: 'Planejado', description: 'Inteligência artificial prevista para apoiar o atendimento, com limites e revisão da equipe. As funções e condições precisam ser validadas; respostas podem exigir correção.', note: 'Nenhum agente conectado ou respondendo nesta demonstração.', help: '/ajuda#whatsapp-ia' },
  { name: 'E-mail marketing', icon: Mail, state: 'Planejado', description: 'Previsto nos planos com cotas diferentes, para contatos que autorizaram o recebimento. Provedor, remetente e condições dependem de configuração e validação.', note: 'Sem campanhas de e-mail ativas. E-mails de acesso são um serviço separado.', help: '/ajuda#email' }
]

const foundations = [
  { name: 'Supabase', icon: Database, description: 'Usado para autenticação e persistência dos monitores. Acesso e permissões da sua empresa são diferentes de uma autorização Google ou Meta.' },
  { name: 'Netlify e VPS', icon: Cloud, description: 'O site público é publicado no Netlify. O dashboard e a API de monitoramento estão na VPS. Você não precisa administrar esses serviços para usar seu painel.' }
]
</script>

<template>
  <div class="container">
    <header class="page-hero">
      <p class="eyebrow">INTEGRAÇÕES · ESTADO ATUAL</p>
      <h1>Saiba onde cada canal entra.</h1>
      <p>O monitoramento HTTP básico está disponível no painel autenticado. Os canais de anúncios, atendimento e automações abaixo ainda precisam de conexão e validação. Um recurso planejado não é um serviço já ativado.</p>
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
      <h2 id="foundations-title" class="mb-4 text-2xl">A base do produto</h2>
      <p class="mb-6">Estas tecnologias sustentam o acesso e o monitoramento existentes. Esta página explica a estrutura; não conecta contas nem ativa canais.</p>
      <div class="integration-grid">
        <article v-for="foundation in foundations" :key="foundation.name" class="integration-card min-w-0">
          <span class="feature-icon"><component :is="foundation.icon" :size="21" aria-hidden="true" /></span>
          <h2>{{ foundation.name }}</h2>
          <p>{{ foundation.description }}</p>
          <span class="badge-initial">Base em uso</span>
        </article>
      </div>
      <InitialState title="Cada conexão precisa de uma autorização própria." description="Google, Meta e WhatsApp ainda não estão liberados. Sua conta do Fluxo Atento não autoriza esses provedores automaticamente; os recursos serão apresentados com seus limites quando estiverem prontos." />
      <NuxtLink class="button button-secondary" to="/como-funciona">Explorar um exemplo <ArrowRight :size="16" aria-hidden="true" /></NuxtLink>
    </section>
  </div>
</template>
