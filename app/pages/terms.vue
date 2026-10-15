<script setup>
const { marketingUrl } = useDeployment()
useSeoMeta({ title: 'Termos · Fluxo Atento', description: 'Condições iniciais e limites de uso do Fluxo Atento.' })
</script>
<template>
  <section class="section page-section"><div class="container narrow-content">
    <p class="eyebrow">TERMOS · VERSÃO DE 15/10/2026</p><h1>Termos de uso</h1>
    <p>O Fluxo Atento é operado sob o nome empresarial informado <strong>68.661.227 LEANDRO PASSOS DE SANT ANNA</strong>. Contato público: <a class="text-link" href="mailto:contato@fluxoatento.com.br">contato@fluxoatento.com.br</a>.</p>
    <h2>O que está disponível</h2><p>O produto está em implantação inicial. A demonstração pública usa exemplos. O painel autenticado permite o monitoramento HTTP básico de páginas públicas. IA, atendimento, anúncios, automações e planos apresentados como previstos não devem ser considerados serviços já contratados ou ativos.</p>
    <h2>Conta e uso autorizado</h2><p>Proteja suas credenciais, informe dados adequados ao cadastro e use apenas recursos e ativos para os quais possui autorização. Não contorne autenticação, CAPTCHA, limites, bloqueios de acesso ou controles de outras empresas. Não use a plataforma para spam, fraude ou acesso indevido.</p>
    <h2>Como interpretar os resultados</h2><p>Uma resposta HTTP é uma observação técnica naquele momento. Não comprova uma venda, o funcionamento de formulário ou checkout, a segurança integral do site nem o desempenho de campanhas. Resultados podem variar e precisam de contexto antes de decisões comerciais.</p>
    <h2>Integrações e custos</h2><p>Conectar uma conta externa exigirá consentimento específico e as permissões correspondentes. Propostas de preços e cotas ainda não são uma contratação. A ativação de cobranças dependerá de condições claras, informação de custos e aceite. Não há cobrança automática nesta página.</p>
    <h2>Disponibilidade, suporte e dados</h2><p>A implantação pode ter interrupções e recursos incompletos. Não há garantia de disponibilidade contínua ou resultado comercial. Solicitações podem ser encaminhadas ao contato acima; o chat interno ainda não está conectado. Consulte a política de privacidade e as instruções de exclusão.</p>
    <p>Estes termos iniciais precisam de revisão jurídica e das condições comerciais definitivas antes do lançamento pago. Não limitam direitos que a legislação aplicável assegure ao usuário.</p>
    <div class="flex flex-wrap gap-3"><NuxtLink class="button button-secondary" to="/privacy">Privacidade</NuxtLink><a class="button button-secondary" :href="marketingUrl + '/contato'">Contato</a></div>
  </div></section>
</template>
