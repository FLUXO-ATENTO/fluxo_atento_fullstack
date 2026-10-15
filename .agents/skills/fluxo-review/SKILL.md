---
name: fluxo-review
description: Revisar diffs, comportamento, segurança, UI ou documentação do Fluxo Atento somente por leitura, com achados sustentados por código e evidências. Usar para revisão ou diagnóstico delimitado; não implementa correções, publica comentários nem altera contas ou produção.
---

# Revisão com evidências do Fluxo Atento

Leia o [AGENTS.md](../../../AGENTS.md) e as fontes pertinentes à pergunta de
revisão. O contrato de delegação e a matriz de verificação ficam em
[AGENT_OPERATIONS](../../../docs/AGENT_OPERATIONS.md).

## Escopo e autoridade

Identifique os arquivos ou diff, a base de comparação e o risco solicitado.
Inclua arquivos novos da atribuição, sem incorporar mudanças alheias. Se não
houver base explícita, descreva o estado efetivamente inspecionado; não invente
um merge-base nem atribua um defeito preexistente à mudança atual.

Permaneça somente leitura: não edite arquivos, aplique fixes, altere contas,
dados, credenciais ou configurações, nem faça commit, push, merge ou deploy.
Não publique comentários ou aprovações no GitHub. Use leituras e diagnósticos
sem efeitos colaterais e evidências existentes. Não rode instalações, builds,
geradores ou E2E; peça ao responsável evidência faltante. Navegador só entra
quando a delegação autorizar a superfície e a inspeção, sem submeter formulários
ou alterar dados. Não crie novos agentes nem agendamentos por conta própria.

## Investigar o caminho real

- Rastreie a condição de entrada até o resultado afetado e os testes pertinentes.
  Escolha o foco necessário: tenant/segurança, UI/acessibilidade, documentação ou
  correção funcional. Não transforme toda revisão numa auditoria geral.
- Compare promessas com STATUS e com o ambiente em que foram verificadas.
  Presença de código, menu, mock ou saída de scanner não prova operação real,
  isolamento de tenants ou ausência absoluta de segredos.
- Para acesso, confira autorização de servidor, associação ao tenant, troca de
  identidade e destino por papel. Para UI, preserve marca padrão, paleta pessoal,
  teclado e temas; diferencie inspeção de fonte de QA visual executado.
- Para Docs, confronte links e capacidades públicas com a fonte de produto e
  mantenha inventários internos separados. Considere as datas das especificações;
  decisões atuais não devem ser revertidas para propostas antigas.
- Não exponha segredos ou dados de clientes ao apresentar a evidência.

## Relatar e encerrar

Ordene achados acionáveis por impacto. Cada achado deve trazer prioridade,
arquivo e linha/símbolo verificável, condição que dispara o problema, efeito
observável, evidência e direção mínima de correção, sem aplicar a mudança.
Separe defeito demonstrado, hipótese e lacuna de teste; evite achados apenas
estilísticos sem efeito no comportamento ou no aceite.

Use P0 para impacto crítico imediato demonstrado, P1 para alto impacto que impede
o aceite, P2 para defeito que precisa de correção e P3 para impacto menor.
Se não houver achados sustentados, diga isso e liste a cobertura e suas limitações.
Identifique o que foi lido, o que foi executado e o que continua sem teste.
Retorne ao agente principal; a revisão não equivale a aceite humano ou liberação
de produção e não autoriza iniciar correções.
