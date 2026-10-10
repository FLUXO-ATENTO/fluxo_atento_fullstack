<script setup lang="ts">
import { ArrowRight, Circle, Mail, MessageCircle, Radar, Sparkles } from '@lucide/vue'
import { useId } from 'vue'
import { offerNotice, plans } from '~/data/plans'

withDefaults(defineProps<{ compact?: boolean }>(), { compact: false })

type Plan = (typeof plans)[number]

const sectionId = useId()
const introductions: Record<Plan['id'], string> = {
  free: 'Para explorar e começar.',
  essential: 'Para o seu pequeno negócio.',
  complete: 'Para a rotina da equipe.'
}
const destinations: Record<Plan['id'], string> = {
  free: '/login',
  essential: '/contato?assunto=plano-essencial',
  complete: '/contato?assunto=plano-completo'
}

const limitValue = (plan: Plan, label: string) =>
  plan.limits.find(limit => limit.label === label)?.value ?? 'A definir'

const cards = plans.map(plan => ({
  ...plan,
  highlights: [
    {
      icon: Radar,
      text: `${limitValue(plan, 'Sites')} ${limitValue(plan, 'Sites') === '1' ? 'site' : 'sites'} · ${limitValue(plan, 'URLs no total')} páginas`
    },
    { icon: MessageCircle, text: 'WhatsApp para atendimento e campanhas' },
    {
      icon: Sparkles,
      text: `${limitValue(plan, 'Respostas da IA no atendimento').replace('/mês', '')} respostas de IA por mês`
    },
    {
      icon: Mail,
      text: `${limitValue(plan, 'Envios de email marketing').replace('/mês', '')} envios de email marketing por mês`
    },
    {
      icon: Circle,
      text: `${limitValue(plan, 'Módulos previstos').split(':')[0]} módulos ${plan.id === 'complete' ? 'para a rotina da equipe' : 'para organizar clientes'}`
    }
  ]
}))
</script>

<template>
  <section :aria-labelledby="`${sectionId}-heading`">
    <header class="section-heading">
      <p class="eyebrow">DO PRIMEIRO PASSO À EQUIPE</p>
      <h2 :id="`${sectionId}-heading`">{{ compact ? 'Um plano para sua rotina.' : 'Compare os planos.' }}</h2>
      <p v-if="!compact">Comece pela necessidade do seu negócio. Não é preciso escolher módulos para conhecer a proposta.</p>
    </header>

    <p :id="`${sectionId}-notice`" class="pricing-notice">
      Hoje, só demonstração. Recursos e limites são propostas; os preços pagos são sugestões
      pendentes de validação econômica, não preços vigentes. Não há contratação ou cobrança aqui.
    </p>

    <div class="pricing-grid" :aria-describedby="`${sectionId}-notice`">
      <article
        v-for="plan in cards"
        :key="plan.id"
        class="pricing-card min-w-0"
        :class="{ featured: plan.featured }"
        :aria-labelledby="`${sectionId}-${plan.id}`"
      >
        <span class="eyebrow">{{ introductions[plan.id] }}</span>
        <h3 :id="`${sectionId}-${plan.id}`">{{ plan.name }}</h3>
        <p v-if="!compact" class="plan-audience">{{ plan.audience }}</p>

        <div class="plan-price">
          <span>R$</span>
          <strong>{{ plan.price }}</strong>
          <span>{{ plan.period }}</span>
        </div>
        <p class="text-xs">
          {{ plan.id === 'free' ? 'Assinatura gratuita proposta' : 'Preço sugerido · não vigente' }}
        </p>

        <ul :aria-label="`Resumo dos recursos propostos do ${plan.name}`">
          <li v-for="highlight in plan.highlights" :key="highlight.text">
            <component :is="highlight.icon" :size="15" aria-hidden="true" />
            <span>{{ highlight.text }}</span>
          </li>
        </ul>

        <details>
          <summary>Ver detalhes e limites do {{ plan.name }}</summary>
          <p class="plan-description mt-4">{{ plan.description }}</p>
          <dl class="plan-limits">
            <div v-for="limit in plan.limits" :key="limit.label">
              <dt class="min-w-0 basis-1/2">{{ limit.label }}</dt>
              <dd class="min-w-0 basis-1/2 break-words">{{ limit.value }}</dd>
            </div>
          </dl>
          <ul :aria-label="`Recursos planejados do ${plan.name}`">
            <li v-for="feature in plan.features" :key="feature">{{ feature }}</li>
          </ul>
          <p class="text-xs">{{ plan.availability }}</p>
        </details>

        <NuxtLink
          :to="destinations[plan.id]"
          class="button button-full"
          :class="plan.featured ? 'button-primary' : 'button-secondary'"
          :aria-label="`${plan.cta} — ${plan.name}`"
        >
          {{ plan.cta }}
          <ArrowRight :size="16" aria-hidden="true" />
        </NuxtLink>
      </article>
    </div>

    <details class="pricing-notice">
      <summary class="cursor-pointer">Sobre a proposta e os custos</summary>
      <div class="mt-4 space-y-3">
        <p>{{ offerNotice }}</p>
        <p>
          As cotas são compartilhadas pela conta do negócio. Campanhas dependerão de contatos
          que autorizaram o recebimento, opção de sair da lista e aprovação de uma pessoa responsável.
          O envio de mensagens e o atendimento com IA ainda não estão conectados.
        </p>
        <p>
          Conhecer uma proposta não ativa serviços nem muda seu plano. Os links dos planos pagos
          abrem a página de contato com o assunto escolhido.
        </p>
      </div>
    </details>

    <NuxtLink to="/integracoes" class="text-link">
      WhatsApp, IA e email: veja o que está previsto
      <ArrowRight :size="16" aria-hidden="true" />
    </NuxtLink>
  </section>
</template>
