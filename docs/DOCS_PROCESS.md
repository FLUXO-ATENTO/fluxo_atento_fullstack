# Processo editorial da documentação do produto

Estado desta entrega: implementação local, ainda sem revisão humana final ou publicação.
Base factual consultada em 15/10/2026. Este registro não comprova deploy.

## Duas fontes, com públicos diferentes

O catálogo `app/data/product-docs.ts` contém somente texto aprovado para leitura
pública: títulos, resumos, passos, limites, estados e links. É versionado junto
com o código do produto e renderizado por `app/pages/docs.vue`. Alterações no
catálogo entram no mesmo fluxo de revisão da funcionalidade correspondente.

Os documentos em `docs/` registram decisões, requisitos, operação, evidências e
planos de evolução para os responsáveis pelo produto. São fontes de trabalho,
não artigos automaticamente publicáveis. A página pública não importa Markdown
de `docs/`, não enumera essa pasta e não transforma registros operacionais em
conteúdo do navegador. Guardar algo em `docs/` também não garante sigilo: o
controle de acesso ao repositório precisa ser adequado e segredos não entram no Git.

`productDocsSnapshot.date` é a data da base factual consultada, não uma data
automática de build, aprovação humana, lançamento ou atualização em produção.
O aviso de interface ainda não publicada deve ser revisto junto com a evidência
da publicação correspondente; nunca removido apenas porque um build passou.

## Fontes e rastreabilidade

Leia primeiro [GOVERNANCE.md](GOVERNANCE.md). As regras de evidência antes de
status, revisão humana e aceite no ambiente correspondente continuam válidas.

| Fonte do repositório | Uso editorial | Limite |
| --- | --- | --- |
| [STATUS.md](STATUS.md) | O que foi verificado e em qual ambiente | Código nesta revisão não equivale a produção |
| [AUTH_ONBOARDING.md](AUTH_ONBOARDING.md) | Acesso, identidade e limites do onboarding | Login existente não prova cadastro, recuperação ou OAuth |
| [REQUIREMENTS.md](REQUIREMENTS.md) | Público, objetivos, vocabulário e capacidades propostas | Requisito não é funcionalidade entregue |
| [ASSETS.md](ASSETS.md) | Confirmar superfícies públicas e contato autorizado | Inventário interno não deve ser copiado para artigos |
| [ROADMAP.md](ROADMAP.md) | Recursos futuros e dependências | Planejamento não promete disponibilidade nem data |

Conferência complementar de comportamento: `app/components/LiveMonitors.vue`,
`app/utils/website.ts`, `app/composables/useDeployment.ts` e as páginas públicas
de exemplo, contato e suporte. Código ajuda a conferir nomes de ações; somente
evidência operacional permite chamar uma capacidade de disponível em produção.

| Slug público estável | Fontes principais |
| --- | --- |
| `primeiros-passos` | STATUS, REQUIREMENTS, ROADMAP |
| `acessar-minha-conta` | STATUS, AUTH_ONBOARDING |
| `exemplo-e-painel` | STATUS, ASSETS, página de exemplo |
| `cadastrar-uma-pagina` | STATUS, REQUIREMENTS, LiveMonitors |
| `entender-um-resultado` | STATUS, REQUIREMENTS, LiveMonitors |
| `resolver-uma-dificuldade` | STATUS, LiveMonitors, validação de endereço |
| `integracoes` | STATUS, AUTH_ONBOARDING, REQUIREMENTS, ROADMAP |
| `ia-e-atendimento` | STATUS, REQUIREMENTS, ROADMAP |
| `planos-e-limites` | STATUS, REQUIREMENTS, ROADMAP |
| `pedir-ajuda` | STATUS, ASSETS, páginas de contato e suporte |
| `privacidade-e-dados` | GOVERNANCE, REQUIREMENTS, rotas públicas de políticas |
| `evolucao-dos-guias` | GOVERNANCE, STATUS, ROADMAP, este processo |

O catálogo público não carrega esse mapa de fontes internas. Referências a
contas, infraestrutura, caminhos operacionais e evidências restritas permanecem
fora dos artigos e de qualquer arquivo servido ao navegador.

## Estados editoriais

| Estado no catálogo | O que comunicar |
| --- | --- |
| `available` / Disponível no produto | Função com evidência de uso no ambiente informado; declarar o limite da validação |
| `review` / Em revisão | Interface ou conteúdo preparado, ainda não publicado |
| `planned` / Planejado | Proposta ou conexão ainda pendente; sem instrução que aparente ativação imediata |
| `guidance` / Orientação | Explicação geral, segurança no uso ou encaminhamento; não é garantia de serviço |

Em 15/10/2026, acesso por senha com conta existente e monitor manual têm evidência
de funcionamento. Isso não valida cadastro, e-mails de recuperação, isolamento
de duas contas ou escala. A nova interface e o portal estão em revisão. OAuth
Google/GitHub, integrações de negócio, IA no painel, chat persistente de suporte
e cobrança comercial não podem receber o estado de disponíveis nesta entrega.

Um artigo pode explicar limites de um recurso futuro ao lado de um recurso
atual. O título, resumo, selo e corpo devem manter a mesma interpretação. O
aviso global não corrige uma promessa falsa escondida em um passo ou botão.

## Como criar ou alterar um guia

1. Identifique a dúvida concreta de uma pessoa não técnica. Confira o
   comportamento e o estado factual nas fontes acima, com ambiente e data.
2. Edite o catálogo manualmente. Escolha grupo, slug estável, título descritivo,
   resumo, estado, palavras de busca, seções e links. Mantenha de três a cinco
   passos curtos quando houver procedimento; use parágrafos para explicações.
3. Confira os rótulos de ações na interface correspondente. Se a nova interface
   não foi publicada, diga isso sem transformar seus menus em prova de produção.
4. Revise os links internos contra rotas existentes. Links externos só entram
   após abrir e verificar a documentação oficial e registrar URL, data e
   finalidade na revisão. Esta versão utiliza somente rotas internas já existentes.
5. Peça revisão humana de conteúdo e produto: precisão, linguagem PT-BR,
   ausência de informações privadas, acessibilidade e coerência de estado.
   Identifique a pessoa responsável e registre a decisão no PR ou registro da mudança.
6. Execute os testes focados. A pessoa que integra a mudança executa builds,
   tipos, CI e validação de navegador de forma coordenada no checkout compartilhado.
7. Publique somente no fluxo autorizado da governança. Após o aceite real,
   atualize a evidência operacional e as afirmações públicas afetadas. Esta
   tarefa de Docs não publica, não altera DNS nem modifica os documentos de status.

Agentes podem ajudar a localizar inconsistências e propor rascunhos. Não devem
converter commits, menus, requisitos ou resultados de testes locais em alegações
automáticas de disponibilidade. Toda mudança pública de estado exige revisão
humana baseada em evidência; não há geração automática de artigos nesta versão.

## Contratos de navegação e busca

- A rota é `/docs?artigo=<slug>`. Sem o parâmetro, abre `primeiros-passos`.
  Valores vazios, desconhecidos ou repetidos mostram um estado recuperável de
  artigo não encontrado; não exibem silenciosamente outro conteúdo.
- Seções usam `/docs?artigo=<slug>#<id-da-secao>`. Preserve slugs e IDs ao
  revisar títulos. Uma renomeação futura exige compatibilidade explícita dos
  endereços antigos e teste de links compartilhados.
- O título e o corpo vêm sempre do artigo selecionado. Digitar na busca não
  muda a seleção nem recorta o corpo. A busca é local, ignora acentos e
  combina termos em títulos, resumos, seções, passos, notas e palavras de busca.
- Anterior/próximo ficam dentro do assunto atual. Guias relacionados fazem
  conexões entre assuntos. Voltar/avançar do navegador usa a seleção na URL.
- O menu móvel é uma expansão dentro da página, com botão, estado anunciado,
  Escape e retorno de foco. Escolher um guia leva o foco ao título. Não é um
  modal e não deve prender o teclado.
- O CTA de autenticação usa `dashboardAccessUrl('/login')`. A centralização do
  destino em `/acessar` pertence ao helper compartilhado, não a URLs duplicadas
  no catálogo ou na página de Docs.

## Separação pública e privada

Tudo importado pelo frontend deve ser tratado como público, inclusive conteúdo
fora de menus, campos não renderizados, índices de busca e dados de pré-renderização.
Não colocar credenciais, identidades de contas privadas, IPs de servidores,
caminhos operacionais, dados de empresas ou conversas no catálogo.

Uma futura documentação restrita exige serviço autenticado, autorização no
servidor por empresa e papel, isolamento verificável, respostas sem cache público
e arquivos privados quando houver anexos. Ocultar um componente, usar CSS,
condicionar a renderização a login ou tirar um link da navegação não protege
documentos que já foram enviados ao navegador. Conteúdo privado não pode entrar
no bundle estático ou no índice de busca público.

## Verificação e evolução

Teste focado, sem build:

```text
node --experimental-strip-types --test tests/unit/product-docs.test.mjs
```

O teste cobre integridade do catálogo, busca com acentos e múltiplos termos,
estabilidade do artigo durante buscas, resolução de parâmetro inválido, links
e navegação contextual. Também verifica o componente Vue em memória e o uso
dos tokens de tema existentes, sem gerar arquivos de build. As verificações de
conteúdo são barreiras de regressão, não auditoria completa de segurança ou
comprovação de uma função em produção.

Verificação desta entrega local em 15/10/2026: **13 testes passaram, sem falhas**.
Build, verificação completa de tipos, CI e validação visual/interativa em
navegador não foram executados nesta tarefa; ficam com a integração coordenada.

Antes de integrar/publicar, conferir em navegador: largura móvel e desktop;
temas claro, escuro e sistema; teclado e foco; anúncio da busca; resultado vazio;
seleção do artigo já aberto; abrir em nova aba; link direto com recarga e âncora;
histórico de voltar/avançar; movimento reduzido; destino do CTA de acesso.

Evoluir por necessidade observada: novos guias quando funções forem aceitas,
sinônimos de busca a partir de dúvidas reais e revisão de artigos por mudança
do produto. Se o catálogo crescer, avaliar indexação e manutenção sem expor
material privado nem introduzir dependências sem necessidade. Um domínio próprio
de Docs, documentos autenticados ou um CMS requerem decisão e trabalho próprios;
esta entrega não cria esses serviços nem anuncia disponibilidade.
