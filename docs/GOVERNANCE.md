# Governança de implementação e operação

## Princípios obrigatórios

1. **Evidência antes de status.** Um item só é “funcionando” quando há teste
   executado no ambiente correspondente, resultado registrado e critério de
   aceite atendido.
2. **Segredos fora do Git.** O repositório contém nomes, contratos e exemplos;
   tokens, chaves privadas, senhas e configurações secretas ficam somente no
   provedor seguro que os consome.
3. **Menor privilégio.** Navegador usa chave publicável; VPS usa a credencial
   de servidor estritamente necessária; dados são isolados por RLS.
4. **Mudança reversível.** Toda alteração de banco, DNS, VPS e deploy deve ter
   alvo, validação, rollback e janela de observação definidos antes da execução.
5. **Produção não é laboratório.** Testes de contrato e falhas previsíveis
   ocorrem em ambiente controlado antes de envolver contas de clientes.
6. **Uma promessa por módulo.** Tela, plano comercial e proposta de produto
   devem indicar claramente se descrevem uma capacidade ativa ou planejada.

## Fluxo de mudança

```text
Problema ou objetivo
        ↓
Issue / decisão registrada
        ↓
PR de escopo único + testes + risco + rollback
        ↓
CI obrigatório
        ↓
Revisão humana
        ↓
Deploy controlado
        ↓
Teste de aceite no ambiente real
        ↓
Atualização de STATUS.md e evidência
```

## Requisitos de um PR

Todo PR deve declarar:

- objetivo e escopo excluído;
- sistemas afetados: frontend, Netlify, Supabase, VPS, DNS ou documentação;
- risco de segurança, privacidade e indisponibilidade;
- comandos/testes executados e seus resultados;
- critérios de aceite observáveis;
- plano de rollback;
- dependências externas ou decisões que ainda precisam de autorização.

PRs de infraestrutura devem separar, sempre que possível, a mudança de código
da execução em produção. A execução deve registrar data, ambiente, resultado e
qualquer desvio encontrado.

## Governança de ambientes

| Ambiente | Uso permitido | Proibido |
| --- | --- | --- |
| Local | desenvolvimento, testes unitários e E2E com dados controlados | segredos reais em arquivos versionados |
| Preview | revisão de interface e fluxo sem dados de cliente | chave administrativa, dados de produção sem autorização |
| Produção | clientes e dados reais, depois dos portões de aceite | testes destrutivos, mudanças sem rollback |

## Controle de dados e privacidade

- Coletar somente URL, identificadores técnicos de monitoramento e resultados
  necessários para o caso de uso declarado.
- Não registrar corpo integral de páginas, mensagens, credenciais, tokens ou
  dados pessoais não necessários nas verificações.
- Definir retenção, exclusão, exportação e canal de atendimento ao titular
  antes de abrir o produto a clientes.
- Revisar os termos e a política de privacidade com responsável jurídico antes
  do lançamento comercial.

## Resposta a incidente

1. Conter: pausar a rota, serviço ou deploy afetado sem apagar evidências.
2. Preservar: registrar horário, impacto, versões e logs relevantes.
3. Recuperar: aplicar rollback conhecido ou restauração aprovada.
4. Validar: testar saúde, autenticação, isolamento e dados essenciais.
5. Aprender: abrir PR/issue com causa, correção e prevenção.

## Registro de decisão inicial

| Decisão | Motivo | Consequência |
| --- | --- | --- |
| Separar site e dashboard por subdomínio | Reduz confusão entre apresentação e área autenticada | `app.fluxoatento.com.br` exige deploy, domínio e HTTPS próprios |
| Usar Supabase para Auth e Postgres | Acelera autenticação e RLS para MVP individual | Migração e políticas precisam ser aplicadas e testadas remotamente |
| Executar verificações na VPS | Evita segredos e operações de rede sensíveis no navegador | Exige serviço, Nginx, CORS, logs e operação própria |
| Lançar primeiro o monitoramento | Permite validar valor antes de construir muitos módulos | Recursos comerciais avançados permanecem explicitamente planejados |
