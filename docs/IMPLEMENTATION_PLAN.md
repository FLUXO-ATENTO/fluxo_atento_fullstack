# Sequência de implementação do FLUXO

Cada etapa termina com evidência, revisão e rollback. O status factual está em STATUS.md; código existente não comprova conectores em produção.

## Ordem executável

| Etapa | Tarefa do backlog | Entrega necessária para avançar |
| --- | --- | --- |
| 1 Revisar e publicar | FLUXO-01 | PR aprovado, API/frontend compatíveis, versão publicada e jornada homologada |
| 2 Proteger e recuperar | FLUXO-02/03 | MFA/revogação, inventário validado, restauração testada e alertas |
| 3 Receber eventos com segurança | FLUXO-04 | Fila durável, ACK após persistência, worker e testes de falha |
| 4 Ativar canais | FLUXO-05/06 | Envio/recebimento real autorizado, persistência e isolamento por canal |
| 5 Completar dados | FLUXO-07 | Consentimento, importação, histórico, retenção/exportação e opt-out |
| 6 Completar escopo público | FLUXO-08/09/10 | OAuth quando escolhido, monitor recorrente, site map/SEO, oferta e acessibilidade |
| 7 Aceitar lançamento | FLUXO-11 | Piloto end-to-end aprovado e riscos/pendências registrados |

As tarefas completas, funções responsáveis, dependências e checklists estão
em [BACKLOG.md](BACKLOG.md). IDs FLUXO são do plano; as issues externas não
foram criadas porque a integração recusou escrita (403). Etapas de segurança,
operação e canais podem ser preparadas em paralelo, mas seus portões de aceite
não podem ser pulados. O responsável humano define o escopo do piloto.

## 1 Base e identidade

Manter Nuxt estático, Nginx, Node/systemd e Supabase. Alinhar URL/chave publicável ao projeto qbfmebpzxnzdpalmgtxr. Preservar serviços de API legada, flow e infra. Site continua na Netlify.

Aceite: HTTPS do app, processo da API ativo, origens exatas, segredos fora do browser, migrações identificadas. Base implantada anteriormente.

## 2 Administração separada e isolamento

Esta revisão implementa console próprio, entrada com a mesma conta, redirecionamento por permissão, seleção de tenant, convites, permissões transacionais e controle de provedores. API verifica papel em cada solicitação administrativa. RLS protege leituras operacionais e referências compostas evitam vínculos cruzados.

Aceite: testes de usuário comum negado, Super Admin permitido, retorno site/app sem login adicional, logout, mudança de contexto, último proprietário e auditoria. Publicar somente a revisão validada e registrar a versão em execução.

## 3 Contatos e histórico persistido

Esta revisão adiciona cadastro manual, normalização, deduplicação por tenant, leitura paginada e schema de conversas/mensagens. Migração aditiva e testes remotos com rollback já realizados.

Antes de importações em massa: fluxo explícito de revisão/fusão, origem do dado, consentimento, limites, exportação e arquivamento. Não ligar campanhas ao mero cadastro de contato.

## 4 Canais operacionais

Ordem: selecionar um provedor piloto, cadastrar metadados no Super Admin, instalar credenciais na VPS, implementar handshake/assinatura e validação real, vincular tenant e executar envio/recebimento de teste autorizado.

Depois: fila durável, worker com tentativas limitadas, idempotência, tratamento de falhas e checkpoint de histórico. Nenhum botão pode declarar conexão validada sem um teste efetivo. SMTP não substitui Gmail API/IMAP para leitura.

Aceite por canal: enviar, receber, persistir, reprocessar evento duplicado sem duplicar mensagem, negar evento inválido e recuperar de falha sem vazamento entre tenants.

## 5 Segurança e operação de lançamento

Ativar proteção de senhas comprometidas conforme plano; implementar matrícula MFA e exigência de segundo fator para administração; definir expiração/revogação e recuperação administrativa segura.

Testar backup/restauração, retenção de logs e dados, limites de custo/carga, alertas de falha, rollback de frontend/API e revisão de privacidade. Fazer piloto limitado antes de oferecer o conjunto como produto completo.

## Método de entrega

1. Inspecionar estado real e contrato atual.
2. Preparar alteração pequena com critérios de aceite.
3. Validar em testes locais e dados sintéticos.
4. Revisar migração e aplicar somente ao projeto autorizado.
5. Abrir PR com evidências, pendências e rollback.
6. Revisão humana e publicação controlada.
7. Testar a jornada publicada e atualizar STATUS.md.

Mudanças operacionais autorizadas antes de merge devem ser registradas explicitamente no PR; o registro não substitui revisão nem autoriza merge automático.
