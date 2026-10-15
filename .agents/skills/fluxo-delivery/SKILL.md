---
name: fluxo-delivery
description: Implementar mudanças delimitadas no repositório Fluxo Atento, verificar o comportamento afetado e entregar evidências para revisão. Usar para implementação ou correção autorizada; revisões somente leitura pertencem a fluxo-review. Não executa deploy nem alterações de contas.
---

# Entrega verificada do Fluxo Atento

Leia o [AGENTS.md](../../../AGENTS.md) da raiz e as fontes canônicas relacionadas
à tarefa. Use [AGENT_OPERATIONS](../../../docs/AGENT_OPERATIONS.md) para limites
de delegação, seleção de verificações e formato de entrega.

## Delimitar e implementar

1. Identifique o resultado observável, arquivos sob sua responsabilidade,
   exclusões e verificações permitidas. Considere a autorização já dada pelo
   usuário; não peça confirmação para decisões locais rotineiras dentro dela.
2. Inspecione o estado do checkout e os caminhos envolvidos antes de editar.
   Reutilize componentes, contratos e instruções existentes. No checkout
   compartilhado, não reverta nem incorpore mudanças de outro responsável.
   Se precisar editar fora da atribuição, devolva a dependência ao agente principal.
3. Faça a menor mudança completa que satisfaça o aceite. Preserve a marca padrão,
   a preferência pessoal de paleta e a separação de empresa/plataforma. Para
   autenticação, confirme o estado da convergência para `/acessar` e a autorização
   no servidor. Não ative funcionalidades planejadas só para preencher telas.
4. Atualize a documentação correspondente quando estiver no escopo de escrita;
   caso contrário, entregue ao responsável a divergência com evidência. Conteúdo
   público deve seguir a fonte de produto; não copiar inventários operacionais.

## Verificar e entregar

Selecione as verificações da matriz em AGENT_OPERATIONS conforme o risco e o
escopo autorizado, conferindo os scripts atuais de `package.json`. Para mudanças
de aplicação, cubra testes unitários, tipos e scan de fonte; gere site e dashboard
sequencialmente quando builds estiverem autorizados. Não execute processos Nuxt
concorrentes no mesmo checkout. E2E pertence ao CI e ao QA de navegador autorizado.

Teste o comportamento e as falhas relevantes, usando dados controlados. Uma
alteração apenas de instruções pode ser validada por sintaxe, referências e
coerência, sem build da aplicação. Não enfraqueça testes, scanners ou regras de
segurança para obter aprovação. Se houver falha, relacione-a ao diff ou à condição
preexistente; se faltar acesso ou dependência, registre o limite da verificação.

Entregue arquivos alterados, efeito, evidências com comando/ambiente/resultado,
riscos e verificações pendentes. Prepare objetivo, aceite e rollback para o PR
conforme GOVERNANCE; abrir ou publicar o PR exige estar na tarefa autorizada.
Não declare produção validada a partir de evidência local.

Esta skill não autoriza commit, push, merge, deploy, migração remota, operação de
contas/credenciais, mudança de configuração global, permissões/MCPs ou execução
recorrente. Essas operações ficam com o responsável e o escopo próprios; não são
efeito implícito de implementar uma mudança. Ao concluir a atribuição ou encontrar
uma dependência fora dela, retorne ao agente principal sem iniciar outra tarefa.
