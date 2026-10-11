# FLUXO — contrato de experiência

Revisado em 10/10/2026 contra as rotas e componentes desta branch. Este
documento define comportamento e aceite; [STATUS.md](STATUS.md) informa o que
está publicado e [VALIDATION.md](../VALIDATION.md) registra testes executados.

## Responsabilidade e fontes

- [SITE_MAP.md](SITE_MAP.md): única referência do mapa de URLs por origem/build.
- [CONTENT.md](CONTENT.md): redação e condições de exibição.
- [OFFER.md](OFFER.md): proposta comercial, nunca prova de capacidade ativa.
- [FULLSTACK.md](FULLSTACK.md): autorização, tenant, sessão e contratos de dados.
- app/data/experience.ts: scenarios errors, tracking, changes.
- app/data/modules.ts: nomes dos seis módulos. Preços/cotas propostos não são
  autorização para construir cobrança ou bloquear usuário como se fossem vigentes.

O registro anterior descrevia o início da demonstração, quando não havia Auth
nem backend. Ele não representa mais o sistema. Auth/API/banco existem; novas
telas de Super Admin e contatos desta revisão ainda aguardam publicação.

## Jornadas distintas

| Pessoa/objetivo | Caminho | Critério |
| --- | --- | --- |
| Conhecer o produto | Site → exemplo → explicação → mesmo cenário no painel de demo | Sem cadastro, dados explicitamente ilustrativos |
| Acessar a conta | Site → /login do app → painel tenant | Identidade Supabase confirmada; somente dados autorizados |
| Administrar o FLUXO | Mesma entrada → /admin | Papel global confirmado no servidor; layout próprio |
| Super Admin abrir empresa | Console global → seleção de tenant → operação | Contexto selecionado visível; identidade administrativa preservada |
| Retornar ao site | Voltar ao site → entrar novamente no app | Sessão válida restaurada; não pedir senha por simples navegação |
| Sair/recuperar | Logout ou recuperação pelo Supabase | Limpar estado, não conservar acesso com sessão revogada |

A animação de transição pode orientar, nunca conceder acesso ou bloquear
navegação até terminar. Sessão não deve ser compartilhada com o domínio público.
Não adicionar segundo cadastro/senha para Super Admin.

## Demonstração pública

A demo usa /exemplo, não /dashboard. Site, página Como funciona e demo devem
preservar o mesmo scenario. Exemplo ausente/inválido volta ao padrão errors
com tratamento claro; erros da aplicação não se confundem com o cenário de erro.

Cada caso contém sinal, comparação, contexto, limite da evidência e próximo
passo. Os exemplos não comprovam falha real, venda perdida, entrega de mensagem
ou resultado de campanha. Revisão local não corrige um site.

| Ação | Comportamento exigido |
| --- | --- |
| Escolher cenário | Atualizar todos os dados e manter foco no controle |
| Abrir exemplo pela landing | Preservar scenario e sua evidência |
| Marcar revisado | Confirmação explícita de ação local, não de correção real |
| Adicionar/pausar na demo | Não efetuar consulta de rede nem alterar tenant |
| Restaurar demo | Confirmação cancelável; não apagar conta ou dados reais |
| Voltar ao exemplo no site | Preservar cenário quando houver parâmetro |

## Painel operacional e Super Admin

O painel comum usa layout dashboard; console global usa layout superadmin.
Não revelar controles globais a usuários comuns. Ocultação da UI complementa,
mas nunca substitui autorização API/RLS. Falha ao confirmar permissão não deve
cair silenciosamente num painel privilegiado ou conservar dados da conta anterior.

- Troca de conta/tenant limpa listas e descarta respostas assíncronas anteriores.
- Tenant atual, papel e saída para o site precisam ficar visíveis também no mobile.
- Contatos: nome, e-mail/telefone válidos, retorno claro para duplicata/conflito,
  paginação e histórico apenas do tenant autorizado.
- Histórico vazio não significa conector sincronizado; explicar ausência de
  mensagens persistidas sem prometer recuperar todo o WhatsApp.
- Administração: paginação de tenants, convites, papéis, catálogo global e
  auditoria com limites visíveis. Nunca oferecer autoelevação a Super Admin.
- Provedor pendente/em configuração não recebe badge validado sem teste real.
- Erro preserva dados de entrada seguros e oferece nova tentativa; não exibir
  sucesso antes de confirmação do servidor.

## Onboarding e canais

Boas-vindas guiadas devem mostrar situação real: conta → contexto → conexão →
validação → operação. Google OAuth, WABA e e-mail têm dependências no backlog.
A tela de configuração não comprova envio/recebimento. Não simular QR code,
conexão, histórico, checkout ou credencial cadastrada.

SMTP é envio. Histórico/recebimento exige conector apropriado. Provedores
globais podem atender tenants somente com vínculo autorizado, sem expor segredo.

## Oferta e conteúdo

Gratuito, Essencial e Completo são propostas; disponibilidade operacional não
decorre do nome ou preço. A distribuição final de e-mail/cotas depende da tarefa
FLUXO-10. Não manter uma tabela concorrente à OFFER nem tratar hipóteses como
decisões aprovadas. Nenhum formulário da demo deve afirmar mensagem enviada.

A página de login funcional só aparece quando o ambiente está configurado.
No app, conta real e demo devem ter linguagem diferente. Avisos comerciais
antigos que descrevem o sistema inteiro como “sem backend” devem ser revisados
no escopo editorial, sem afirmar conectores inexistentes.

## Movimento, acessibilidade e responsividade

Direção visual: fundo preto/grafite, hierarquia legível, contraste, bordas
discretas; console administrativo distingue contexto sem depender só da cor.

Movimento serve à compreensão. Oferecer etapas manuais/pausa, não trocar cenário
sozinho; pausar ao ocultar a aba. Respeitar prefers-reduced-motion na história,
transições e boas-vindas, sem esconder conteúdo ou tornar a ação diferente do
rótulo. Proposta de transição breve: 150–250 ms, sem obrigatoriedade temporal.

Meta de acessibilidade: WCAG 2.2 AA, sujeita a verificação. Referências:
[WCAG quick reference](https://www.w3.org/WAI/WCAG22/quickref/) e
[padrão de tabs](https://www.w3.org/WAI/ARIA/apg/patterns/tabs/).
Não anunciar certificação com base somente em teste automatizado.

- Teclado: Tab/Shift+Tab, Enter/Espaço nos controles; sem hover obrigatório.
- Foco visível, não encoberto, e devolvido após diálogo; Escape fecha quando
  apropriado. Não aprisionar foco fora de modal aberto.
- Rótulos persistentes, ajuda/erro associados, mensagens de estado acessíveis.
- Texto comum com contraste 4,5:1; texto grande/componentes aplicáveis 3:1.
- Texto ampliado 200%, reorganização a 320 CSS px; alvos preferenciais 44×44.
- Testar 320/375/768/1024/1440, sem esconder limite funcional ou gerar overflow.
- Somente ícone decorativo fica fora da leitura assistiva; estados têm texto.
- Dados de clientes nunca vão a métricas/telemetria por padrão.

## Aceite e próximos passos

Resultados reais ficam em VALIDATION, não em checklists marcados por suposição.
Os E2E atuais cobrem navegação pública e três jornadas de acesso nos dois
viewports; não substituem revisão completa por teclado/leitor de tela nem
homologação da nova versão na VPS.

FLUXO-01: publicar/homologar painéis. FLUXO-05/06/07: canais e dados.
FLUXO-10: revisar copy, links, sitemap/SEO e acessibilidade.
FLUXO-11: testar jornada completa com dois tenants e escopo de piloto definido.
Instrumentação e pesquisas de compreensão exigem finalidade/documentação próprias;
clique, rolagem ou duração não são prova de entendimento nem de receita recuperada.
