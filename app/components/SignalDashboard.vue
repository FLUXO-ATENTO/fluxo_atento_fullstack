<template>
  <div class="dashboard-shell" aria-label="Demonstração ilustrativa do painel Fluxo Atento">
    <div class="dashboard-topbar">
      <div class="browser-controls" aria-hidden="true"><i /><i /><i /></div>
      <span class="dashboard-address">observacao.exemplo</span>
      <span class="status-live"><span /> DEMO</span>
    </div>
    <div class="dashboard-content">
      <div class="dashboard-heading">
        <div>
          <span class="eyebrow">RESUMO DA OBSERVAÇÃO · EXEMPLO</span>
          <h3>Sinais em foco</h3>
        </div>
        <span class="time-label">AMOSTRA</span>
      </div>
      <div class="signal-total"><strong>28</strong><span>sinais ilustrativos<br>nesta demonstração</span></div>
      <div class="signal-bars">
        <div><span class="signal-dot dot-orange" />Tecnologias <b>12</b></div>
        <div><span class="signal-dot dot-blue" />Requisições <b>08</b></div>
        <div><span class="signal-dot dot-violet" />Rastreamento <b>05</b></div>
        <div><span class="signal-dot dot-red" />Erros <b>03</b></div>
      </div>
      <div class="latest-signal">
        <div class="latest-icon" aria-hidden="true">↗</div>
        <div>
          <span class="eyebrow">SINAL DE EXEMPLO</span>
          <p>Uma chamada de rastreamento merece atenção</p>
          <span class="muted-copy">Classificação ilustrativa · nenhum site foi analisado</span>
        </div>
        <span class="signal-indicator" aria-label="Demonstração" />
      </div>
      <div class="dashboard-foot"><span><span class="pulse-dot" /> FLUXO DE OBSERVAÇÃO</span><span>DADOS ILUSTRATIVOS</span></div>
    </div>
  </div>
</template>
