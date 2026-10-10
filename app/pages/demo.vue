<script setup>
useSeoMeta({
  title: 'Demonstração Fluxo Atento',
  description: 'Página de demonstração conceitual do Fluxo Atento.'
})
</script>

<template>
  <section class="section">
    <div class="container demo-shell">
      <div class="demo-card">
        <p class="eyebrow"><span class="eyebrow-line" /> DEMONSTRAÇÃO CONCEITUAL</p>
        <h1>Fluxo Atento em execução<br><span>modo educação / diagnóstico</span></h1>
        <p class="demo-copy">Este painel é uma simulação da arquitetura concebida para a plataforma. O objetivo é demonstrar a leitura de sinais e a forma como a inteligência traduz observações em contexto.</p>
      </div>
      <div class="demo-grid">
        <article class="demo-panel">
          <h2>Observações</h2>
          <ul>
            <li><span class="demo-status green" aria-hidden="true" /> DOM completo</li>
            <li><span class="demo-status orange" aria-hidden="true" /> 5 requests com comportamento atípico</li>
            <li><span class="demo-status blue" aria-hidden="true" /> 3 scripts carregados</li>
            <li><span class="demo-status red" aria-hidden="true" /> 2 erros de runtime reportados</li>
          </ul>
        </article>
        <article class="demo-panel">
          <h2>Achados</h2>
          <ul>
            <li><strong>TechScan</strong> · stack detectada em evidência</li>
            <li><strong>Tracker Watch</strong> · pixel presente sem disparo consistente</li>
            <li><strong>Error Watch</strong> · falha em requisição de checkout</li>
            <li><strong>Change Watch</strong> · mudança relevante em revisão recente</li>
          </ul>
        </article>
      </div>
      <NuxtLink class="button button-primary" to="/">Voltar à página inicial</NuxtLink>
    </div>
  </section>
</template>
