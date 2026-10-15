<script setup lang="ts">
import { motion } from 'motion-v'
import { ArrowRight, ArrowUpRight, ShieldCheck, Layers3, MousePointer2, Bell, Check, ScanLine, Code2 } from '@lucide/vue'
import { modules } from '~/data/modules'
const { dashboardAccessUrl } = useDeployment()
useSeoMeta({ title: 'Fluxo Atento — Seu cliente chegou. O próximo passo funcionou?', description: 'Entenda os sinais, encontre o contexto e descubra o que vale conferir em seguida. Explore a experiência Fluxo Atento em uma demonstração interativa.' })
const problems = [
  { icon: MousePointer2, title: 'O botão está lá. Mas funciona?', description: 'Uma página bonita pode esconder um formulário que não envia ou um checkout com falha.' },
  { icon: Code2, title: 'O pixel existe. Mas dispara?', description: 'A presença de um script é só uma parte da história. O comportamento também importa.' },
  { icon: Bell, title: 'Algo mudou. Quem percebeu?', description: 'Compare observações para entender o que merece atenção depois de uma alteração.' }
]
</script>
<template>
  <div>
    <section class="hero container">
      <div class="hero-topline"><span class="release-tag">UM NOVO OLHAR PARA O SEU NEGÓCIO</span></div>
      <h1>Seu cliente chegou.<br><span class="hero-second-line">O próximo passo <span class="hero-accent">funcionou?<svg viewBox="0 0 560 16" fill="none" preserveAspectRatio="none" aria-hidden="true"><path d="M2 13C139 0 330 0 558 9" stroke="currentColor" stroke-width="2" /></svg></span></span></h1>
      <p class="hero-description">Uma página bonita não conta a história toda.<br class="desktop-break"> Entenda os sinais, encontre o contexto e descubra o que vale conferir em seguida.</p>
      <div class="hero-actions"><NuxtLink to="/como-funciona" class="button button-primary">Veja o fluxo acontecer <ArrowRight :size="17" /></NuxtLink><a :href="dashboardAccessUrl('/login')" class="hero-panel-link">Abrir meu painel <ArrowUpRight :size="16" /></a><NuxtLink to="/exemplo" class="hero-panel-link">Ver o painel de exemplo <ArrowUpRight :size="16" /></NuxtLink></div>
      <p class="hero-reassurance"><span><Check :size="13" /> Demonstração guiada, sem cadastro</span><span><Check :size="13" /> Monitoramento HTTP real no painel autenticado</span></p>
      <motion.div :initial="{ opacity: 0, y: 18 }" :animate="{ opacity: 1, y: 0 }" :transition="{ duration: 0.65, delay: 0.15 }" class="hero-stage"><ExperienceStory /></motion.div>
      <div class="hero-footnote"><span class="mono">OBSERVAR. ENTENDER. AGIR.</span><span>A prévia acima usa dados ilustrativos, sem consultar seu site.</span><span class="mono">↓ CONTINUE EXPLORANDO</span></div>
    </section>
    <section id="por-que-fluxo" class="section pain-section">
      <div class="container">
        <div class="section-heading split-heading"><div><p class="eyebrow">01 / O QUE PASSA DESPERCEBIDO</p><h2>O que você não vê<br><span>também afeta seu negócio.</span></h2></div><p>Nem todo problema derruba o site.<br>Alguns só aparecem quando você<br>olha para os sinais certos.</p></div>
        <div class="pain-grid"><article v-for="(problem, i) in problems" :key="problem.title"><span class="feature-icon"><component :is="problem.icon" :size="21" /></span><span class="card-index mono">0{{ i + 1 }}</span><h3>{{ problem.title }}</h3><p>{{ problem.description }}</p></article></div>
      </div>
    </section>
    <section id="como-funciona" class="section how-section container">
      <div class="section-heading"><p class="eyebrow">02 / COMPLICAÇÃO FORA. CLAREZA DENTRO.</p><h2>Não é mais um alerta.<br><span>É entender o que fazer.</span></h2><p>Escolha um exemplo. Veja a evidência. Explore a próxima ação.</p></div>
      <div class="how-grid">
        <article class="how-card"><div class="how-visual signal-visual" aria-hidden="true"><span class="signal-line"><Code2 :size="15" /> script carregado <Check :size="13" /></span><span class="signal-line"><ScanLine :size="15" /> evento esperado <span class="small-dot" /></span><span class="signal-line"><Layers3 :size="15" /> resposta observada <Check :size="13" /></span></div><span class="mono step-kicker">01 — OBSERVAÇÃO</span><h3>Veja além da aparência.</h3><p>O navegador revela scripts, requisições e mudanças que a página sozinha não conta.</p></article>
        <article class="how-card"><div class="how-visual compare-visual" aria-hidden="true"><span>ANTES <strong>200 OK</strong></span><ArrowRight :size="20" /><span>AGORA <strong>500 Error</strong></span><div class="comparison-line" /></div><span class="mono step-kicker">02 — CONTEXTO</span><h3>Entenda o que mudou.</h3><p>Compare o sinal anterior com o atual. Separe evidência de hipótese, sem jargão desnecessário.</p></article>
        <article class="how-card"><div class="how-visual action-visual" aria-hidden="true"><div><span class="small-dot" /> REVISÃO SUGERIDA</div><strong>Confira o envio do formulário</strong><span class="mini-button">Ver evidência <ArrowUpRight :size="13" /></span></div><span class="mono step-kicker">03 — AÇÃO</span><h3>Saiba por onde começar.</h3><p>Leve o achado para o dashboard e revise o próximo passo antes de decidir.</p></article>
      </div>
      <NuxtLink class="text-link" to="/como-funciona">Entenda o fluxo completo <ArrowRight :size="16" /></NuxtLink>
    </section>
    <section id="modulos" class="section modules-section"><div class="container">
      <div class="section-heading split-heading"><div><p class="eyebrow">03 / UM ECOSSISTEMA CONECTADO</p><h2>Um olhar completo.<br><span>Seis frentes de evolução.</span></h2></div><div><p>Monitoramento como ponto de partida.<br>Módulos para ampliar as possibilidades.</p><NuxtLink class="text-link" to="/modulos">Conheça os módulos <ArrowRight :size="15" /></NuxtLink></div></div>
      <div class="platform-module-grid"><ModuleCard v-for="module in modules" :key="module.id" :module="module" /></div>
      <p class="section-note"><ShieldCheck :size="15" /> Os módulos estão em fase inicial. Capacidades e integrações serão liberadas após validação.</p>
    </div></section>
    <section class="section container dashboard-invitation">
      <div><p class="eyebrow">04 / DO SITE PARA A DECISÃO</p><h2>O próximo passo<br><span>já tem um lugar.</span></h2><p>Explore sinais, compare evidências e organize monitores em uma mesma experiência. Sem trocar contexto a cada clique.</p><NuxtLink class="button button-primary" to="/exemplo">Abrir demonstração <ArrowUpRight :size="17" /></NuxtLink><span class="section-note">Dados ilustrativos. Nenhuma integração ativa.</span></div>
      <div class="dashboard-teaser"><div class="teaser-heading"><BrandLogo compact /><span>Seu espaço de clareza</span><span class="demo-badge">DEMO</span></div><div class="teaser-numbers"><div><small>Sites no exemplo</small><strong>01</strong></div><div><small>Pontos de atenção</small><strong>03<span class="small-dot" /></strong></div></div><div class="teaser-row"><span class="feature-icon"><ScanLine :size="18" /></span><div><strong>Evento de compra não observado</strong><small>Veja a evidência antes de decidir.</small></div><ArrowRight :size="17" /></div><div class="teaser-footer"><span class="status-dot" /> Do sinal ao contexto, sem ruído.</div></div>
    </section>
    <section id="planos" class="section container"><PricingPlans compact /></section>
    <section class="final-cta container"><span class="eyebrow">SEU PRÓXIMO PASSO</span><h2>Menos “será que funciona?”.<br><span>Mais clareza para agir.</span></h2><NuxtLink to="/exemplo" class="button button-light">Explore o Fluxo Atento <ArrowRight :size="17" /></NuxtLink><p>Conheça a experiência. Sem cartão. Sem promessas invisíveis.</p></section>
  </div>
</template>
