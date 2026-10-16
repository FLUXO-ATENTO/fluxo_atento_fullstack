<script setup lang="ts">
useSeoMeta({ title: 'Especialista IA · Fluxo Atento', description: 'Conheça como o especialista Fluxo Atento transformará sinais autorizados em contexto e próximos passos, com limites claros.' })
const { agentUrl, marketingUrl, dashboardEntryUrl } = useDeployment()
useHead(() => ({ link: [{ rel: 'canonical', href: agentUrl.value.startsWith('http') ? `${agentUrl.value}/` : `${marketingUrl.value}${agentUrl.value}/` }] }))
</script>
<template>
  <div class="agent-page">
    <section class="container agent-hero">
      <div class="agent-hero-copy">
        <p class="eyebrow">ESPECIALISTA IA · EM PREPARAÇÃO</p>
        <h1>O próximo passo,<br><span>com contexto de verdade.</span></h1>
        <p>O especialista Fluxo Atento foi pensado para interpretar apenas os sinais que sua empresa autorizou, explicar os limites da evidência e sugerir o que vale conferir — sem inventar métricas nem agir sozinho.</p>
        <div class="agent-primary-action"><a :href="dashboardEntryUrl('/assistente', 'agente')" class="button button-primary">Entrar no meu espaço <UIcon name="i-lucide-arrow-right" /></a><NuxtLink to="/docs?artigo=ia-e-atendimento" class="text-link">Ver o que está planejado <UIcon name="i-lucide-arrow-up-right" /></NuxtLink></div>
        <p class="agent-disclosure"><UIcon name="i-lucide-shield-check" /> O chat ainda não está conectado. Nenhuma mensagem desta página é enviada a um modelo de inteligência artificial.</p>
      </div>

      <div class="agent-flow-preview" aria-label="Como o especialista transforma um sinal em próxima ação">
        <div class="agent-preview-toolbar"><span class="mono"><span class="status-dot" /> PRÉVIA DO FLUXO</span><span class="demo-badge">Sem conexão</span></div>
        <ol class="agent-preview-steps">
          <li><span class="agent-step-icon"><UIcon name="i-lucide-radar" /></span><div><span class="mono">01 · SINAL</span><strong>Algo merece atenção.</strong><p>Uma resposta mudou, um registro não apareceu ou uma página ficou diferente.</p></div></li>
          <li><span class="agent-step-icon"><UIcon name="i-lucide-scan-search" /></span><div><span class="mono">02 · CONTEXTO</span><strong>O que isso mostra — e o que não mostra.</strong><p>Fatos, limites e histórico ficam separados de hipóteses da IA.</p></div></li>
          <li><span class="agent-step-icon"><UIcon name="i-lucide-list-checks" /></span><div><span class="mono">03 · PRÓXIMA AÇÃO</span><strong>Uma sugestão que você revisa.</strong><p>Ações sensíveis continuam dependendo da sua confirmação.</p></div></li>
        </ol>
        <div class="agent-preview-footer"><UIcon name="i-lucide-lock-keyhole" /><span>Contexto limitado à empresa, às permissões e às fontes autorizadas.</span></div>
      </div>
    </section>

    <section class="section container agent-principles" aria-labelledby="agent-principles-title">
      <div class="section-heading"><p class="eyebrow">UM FLUXO, NÃO UMA CAIXA-PRETA</p><h2 id="agent-principles-title">Primeiro a evidência.<br><span>Depois a interpretação.</span></h2><p>O copiloto só poderá ser útil quando a origem, o momento e o limite de cada informação estiverem claros.</p></div>
      <div class="agent-principle-grid">
        <article><span class="feature-icon"><UIcon name="i-lucide-database-zap" /></span><span class="mono">FONTE</span><h3>Dados autorizados.</h3><p>Site, campanhas e funil entram separadamente. Conectar uma conta não concede acesso às outras.</p></article>
        <article><span class="feature-icon"><UIcon name="i-lucide-brain-circuit" /></span><span class="mono">RACIOCÍNIO</span><h3>Fato não vira palpite.</h3><p>O histórico deve distinguir evidências, preferências da empresa e inferências geradas pela IA.</p></article>
        <article><span class="feature-icon"><UIcon name="i-lucide-user-check" /></span><span class="mono">CONTROLE</span><h3>Você decide a ação.</h3><p>Campanhas, pagamentos e mudanças relevantes não podem ser executados sem permissão e confirmação.</p></article>
      </div>
    </section>

    <section class="container agent-readiness" aria-labelledby="agent-readiness-title">
      <div><p class="eyebrow">ESTADO REAL DO PRODUTO</p><h2 id="agent-readiness-title">A entrada está pronta.<br><span>A inteligência ainda será conectada.</span></h2><p>O monitoramento básico e o acesso ao painel já existem. O chat, a memória entre conversas e a análise de campanhas ainda precisam de backend autorizado, limites de uso e histórico isolado por empresa.</p></div>
      <div class="agent-readiness-list">
        <div><UIcon name="i-lucide-check" /><span><strong>Disponível agora</strong>Acesso único ao painel, páginas monitoradas e orientações públicas.</span></div>
        <div><UIcon name="i-lucide-clock-3" /><span><strong>Antes da conexão</strong>Permissões por empresa, ferramentas permitidas, quotas, custos e consentimento.</span></div>
        <div><UIcon name="i-lucide-shield-alert" /><span><strong>Regra permanente</strong>Nenhum token entre subdomínios e nenhuma credencial de provedor no navegador.</span></div>
      </div>
    </section>

    <section class="section container agent-closing" aria-labelledby="agent-closing-title"><p class="eyebrow">CONTINUE SEM CRIAR OUTRA CONTA</p><h2 id="agent-closing-title">Seu espaço continua no painel.</h2><p>Quando o especialista estiver liberado, a mesma identidade será usada para conferir sua empresa, suas permissões e o contexto autorizado.</p><a :href="dashboardEntryUrl('/assistente', 'agente')" class="button button-primary">Entrar no meu espaço <UIcon name="i-lucide-arrow-right" /></a></section>
  </div>
</template>
