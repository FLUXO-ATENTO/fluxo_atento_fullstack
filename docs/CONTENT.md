# FLUXO — conteúdo canônico

Revisado em 10/10/2026. Os textos de exemplo abaixo pertencem à demonstração pública, não à conta real. Auth/API/banco já existem; esta copy não comprova publicação das telas novas nem conectores ativos. Status em [STATUS.md](STATUS.md), destinos em [SITE_MAP.md](SITE_MAP.md).

## 1. Como usar

[UX.md](UX.md) define jornadas, destinos, comportamento e critérios de aceite. Este documento define os textos e as condições que autorizam sua exibição. IDs como `hero.title` são referências editoriais, não uma exigência de estrutura do código.

- **Demo atual:** descrição de fatos verificados na leitura ou das limitações declaradas pelo README; pode orientar a revisão imediata da comunicação.
- **UI proposta:** redação pronta para uma tela ou comportamento ainda a implementar; só publicar quando o controle cumprir o que o texto diz.
- **Conceito:** direção solicitada para o produto, sem disponibilidade operacional nem prazo confirmado.
- **Dependência externa:** informações de oferta, canal de atendimento ou escopo funcional que precisam vir do responsável. Não substituir por números, contatos ou funções inventadas.

Nomes de módulos vêm de `app/data/modules.ts`. Valores, cotas e condições comerciais vêm exclusivamente do documento de oferta produzido pelo responsável. Este arquivo não define uma segunda tabela de preços ou limites.

## 2. Voz, clareza e honestidade

Falar com quem vende ou recebe clientes pelo site e pelo WhatsApp. Usar “você”, frases diretas, situações concretas e verbos que explicam o próximo clique. Ser próximo sem excesso de gíria, tom alarmista ou brincadeira com uma dificuldade do negócio.

Separar sempre: o que o exemplo mostra, o que isso pode significar e o que ainda precisa ser conferido. Não afirmar que houve venda perdida, cliente ignorado, anúncio desperdiçado ou problema resolvido com base em uma observação ilustrativa.

| Evitar na primeira leitura | Usar | Nota editorial |
| --- | --- | --- |
| Tracking / pixel disparando | Registro de compras | Detalhes sobre tags e eventos podem aparecer em expansão técnica. |
| Request / HTTP 500 | Falha no envio | Código pode complementar o detalhe técnico; não substituir a explicação. |
| Deploy | Atualização do site | Preservar o termo técnico apenas quando necessário para investigar. |
| Dashboard | Painel | Usar /exemplo para demo; o app é um subdomínio com URLs próprias, conforme SITE_MAP. |
| Mock / dummy / ambiente sandbox | Demonstração / dados de exemplo | Dizer também que nenhum site foi acessado. |
| Engine / ecossistema / inteligência de ponta | Contexto / produto / o que conferir | Explicar a ação, não promover a tecnologia. |
| Monitor, sem explicação | Página acompanhada | Na demo, preferir “Página no exemplo”. |
| A DEFINIR | Em definição | Explicar em uma frase o que ainda não foi confirmado. |
| Em breve / será liberado | Ainda não disponível nesta demonstração | Não sugerir cronograma aprovado. |
| Tudo certo / resolvido | Revisado no exemplo | Só usar após uma ação local de revisão implementada. |

Não usar “garantido”, “sem falhas”, “em tempo real”, “recupere suas vendas”, “nunca mais perca clientes”, “ilimitado”, percentuais de melhoria, depoimentos inventados ou selos de aprovação. Não comparar concorrentes. Não usar “sem cartão” para sugerir um teste comercial que não existe; “sem cadastro para explorar” só descreve a demo aberta.

Usar “IA” acompanhada de “inteligência artificial” na primeira explicação, quando o assunto for a proposta do produto. Não colocar conversa artificial na interface como se fosse um agente conectado.

## 3. Página inicial e navegação

### Hero — UI proposta

| ID / posição | Copy exata |
| --- | --- |
| `hero.eyebrow` | Para quem vende e atende online |
| `hero.title` | Seu cliente chegou ao site. O próximo passo funcionou? |
| `hero.description` | Para quem vende e atende pelo site e pelo WhatsApp: veja exemplos de falhas no envio, registros de compras e mudanças de conteúdo. Entenda o sinal, o contexto e o que conferir em seguida. |
| `hero.primary` | Ver um exemplo |
| `hero.secondary` | Como funciona |
| `hero.disclosure` | Demonstração com dados de exemplo. Nenhum site é acessado e nenhuma mensagem é enviada. |
| `hero.access` | Sem cadastro para explorar. |
| `concept.title` | Monitoramento de sites e seis módulos em uma mesma proposta. |
| `concept.description` | O Fluxo Atento está em desenvolvimento. Os exemplos mostram a proposta de acompanhamento de sites; as funções dos seis módulos ainda estão em definição. |

O CTA principal aponta para `/#exemplo`; o secundário, para `/como-funciona`, quando a rota estiver implementada. Manter `hero.disclosure` visível junto ao exemplo e às ações, inclusive no mobile. A frase conceitual pode aparecer depois da explicação, sem sobrecarregar o hero.

### Dores — exemplos, sem diagnóstico do site da pessoa

| Situação | Título | Apoio |
| --- | --- | --- |
| Envio de contato | O formulário aparece. O envio funciona? | Veja um exemplo em que o envio apresenta falha e descubra o que conferir. |
| Registro de compra | A compra apareceu no acompanhamento? | Explore um caso em que o registro esperado não aparece na observação. |
| Mudança de conteúdo | A página ficou como você combinou? | Compare dois títulos de uma oferta e veja o que mudou no exemplo. |

### Navegação e chamadas

| Local | Rótulo exato | Destino / condição |
| --- | --- | --- |
| Cabeçalho | Como funciona | `/como-funciona`. |
| Cabeçalho | Planos | `/planos`; não implica contratação disponível. |
| Cabeçalho | Ajuda | `/ajuda`. |
| CTA geral | Explorar demonstração | `/exemplo`; abre cenário padrão quando não há seleção anterior. |
| Dentro ou após um exemplo | Ver este exemplo no painel | `/exemplo?scenario=<id>`; preservar a seleção. |
| Navegação de produto | Módulos | `/modulos`. |
| Navegação de produto | Integrações | `/integracoes`. |
| Rodapé | Contato | `/contato`. |
| Rodapé | Suporte | `/suporte`. |
| Retorno do painel | Voltar ao exemplo | `/?scenario=<id>#exemplo`, após implementação da leitura do parâmetro. |
| Acessibilidade | Pular para o conteúdo | Âncora do conteúdo principal. |
| Menu móvel | Abrir menu / Fechar menu | Nome acompanha o estado real do controle. |

Publicar links somente com destinos existentes. Fora da demo, não usar “Ativar”, “Conectar”, “Enviar”, “Contratar” ou “Começar grátis” sem a ação correspondente funcionando.

### Convite ao painel e fechamento

- Título do convite: **“Continue com o mesmo exemplo.”**
- Apoio: “Abra o painel para conferir o sinal, entender o contexto e ver o próximo passo sugerido.”
- Botão: “Ver este exemplo no painel”.
- Nota: “Os dados continuam sendo ilustrativos.”
- Título final: **“Veja o que conferir, passo a passo.”**
- Apoio final: “Explore os exemplos e conheça a proposta do Fluxo Atento.”
- Botão final, havendo cenário selecionado: “Ver este exemplo no painel”. Sem seleção compartilhada: “Explorar demonstração”.

SEO proposto para `/`: título “Fluxo Atento | Exemplos de acompanhamento de sites”; descrição “Explore exemplos de falhas no envio, registros de compras e mudanças em páginas. Conheça a proposta do Fluxo Atento em uma demonstração com dados ilustrativos.” Metadados não podem anunciar análise ativa enquanto o corpo explica que é uma demo.

## 4. Exemplo interativo: sinal → contexto → ação

### Copy comum

| ID | Copy exata |
| --- | --- |
| `example.title` | Veja um exemplo do início ao próximo passo. |
| `example.intro` | Comece pelo envio de um formulário ou escolha outro exemplo. |
| `example.badge` | Dados de exemplo |
| `example.disclosure` | Esta é uma situação ilustrativa. Nenhum site está sendo consultado. |
| `example.selector` | Escolha um exemplo |
| `step.signal.title` | Sinal |
| `step.signal.description` | Veja o que apareceu no exemplo. |
| `step.context.title` | Contexto |
| `step.context.description` | Entenda o que o sinal mostra e o que ainda falta conferir. |
| `step.action.title` | Ação |
| `step.action.description` | Veja uma sugestão do que conferir em seguida. |
| `example.play` | Reproduzir explicação |
| `example.pause` | Pausar explicação |
| `example.next` | Próxima etapa |
| `example.restart` | Rever desde o início |
| `example.details.open` | Ver detalhes técnicos |
| `example.details.close` | Ocultar detalhes técnicos |
| `example.before` | Antes, no exemplo |
| `example.after` | Depois, no exemplo |
| `example.action.label` | O que conferir |

“Rever desde o início” só reinicia a explicação; não apaga revisões locais. “Restaurar demonstração” é uma operação distinta, descrita nos estados. Para movimento reduzido, manter “Próxima etapa”; não chamar essa ação de reprodução se o botão apenas avança uma etapa.

### `errors` — Envio do formulário

| Campo | Copy exata |
| --- | --- |
| Rótulo público | Envio do formulário |
| Situação | O formulário aparece. O envio apresentou falha. |
| Página | `loja.exemplo.com/contato` |
| Sinal | O envio do formulário retornou uma falha. |
| Comparação: rótulo | Resposta ao envio |
| Antes | Resposta sem erro |
| Depois | Resposta com erro |
| Contexto | Neste exemplo, a página abriu, mas a tentativa de enviar o formulário recebeu uma resposta de erro. |
| Limite visível | Essa resposta não explica a causa nem confirma o que aconteceu em outros canais de atendimento. |
| Próxima ação | Conferir o envio do formulário |
| Orientação | Peça à pessoa responsável pelo site para conferir a falha e testar o envio depois de qualquer ajuste. |
| Detalhe técnico opcional | Comparação ilustrativa: resposta anterior HTTP 200; resposta seguinte HTTP 500. Conferir os registros do serviço que recebe o formulário ajuda a investigar a causa. |

Não substituir o limite por “Você perdeu um pedido”. Resposta sem erro também não comprova entrega ou leitura de uma mensagem no WhatsApp.

### `tracking` — Registro de compras

| Campo | Copy exata |
| --- | --- |
| Rótulo público | Registro de compras |
| Situação | O registro esperado da compra não apareceu. |
| Página | `loja.exemplo.com/checkout` |
| Sinal | O registro de compra não foi observado. |
| Comparação: rótulo | Registro esperado |
| Antes | Observado |
| Depois | Não observado |
| Contexto | Neste exemplo, o recurso de acompanhamento está presente, mas o registro esperado da compra não apareceu na observação ilustrativa. |
| Limite visível | Isso não prova que não houve compra nem confirma uma falha no anúncio. |
| Próxima ação | Conferir o registro de compras |
| Orientação | Peça à pessoa responsável pelo site para conferir as permissões e a configuração do registro de compras. |
| Detalhe técnico opcional | O script está presente, mas a chamada esperada do evento de compra não aparece neste exemplo. Conferir consentimento, configuração da tag e condições de disparo antes de concluir que há falha. |

Não usar “O anúncio roda. A conversão fica invisível.” como diagnóstico. O exemplo não mede desempenho de anúncios, faturamento ou vendas atribuídas.

### `changes` — Mudanças na página

| Campo | Copy exata |
| --- | --- |
| Rótulo público | Mudanças na página |
| Situação | O título da oferta mudou. Era isso mesmo? |
| Página | `loja.exemplo.com/oferta` |
| Sinal | O título da oferta está diferente. |
| Comparação: rótulo | Título da oferta |
| Antes | Oferta de outubro |
| Depois | Nova coleção |
| Contexto | Os dois momentos deste exemplo mostram títulos diferentes na mesma página. |
| Limite visível | A diferença pode ser uma atualização esperada. É preciso conferir com quem cuida do conteúdo. |
| Próxima ação | Conferir a mudança na oferta |
| Orientação | Compare os títulos e confirme com a equipe se a mudança estava prevista. |
| Detalhe técnico opcional | O título principal difere entre as duas observações ilustrativas. A comparação não identifica quem alterou o conteúdo nem o motivo. |

Não classificar a mudança como incidente, fraude, queda de vendas ou erro automático. “Outubro” é texto fixo do exemplo, não uma informação atualizada em tempo real.

Todos os três casos conservam as páginas fictícias já usadas em `experience.ts`. Elas servem como identificação visual, não como destinos a abrir ou endereços a consultar. Sem mapeamento confirmado, nenhum cenário deve receber o nome de um dos seis módulos.

## 5. Painel e estados da experiência

### Entrada do painel — UI proposta

| Elemento | Copy exata |
| --- | --- |
| Título geral | Painel de demonstração |
| Aviso persistente | Você está vendo uma demonstração. Os dados são de exemplo; nenhum site foi acessado. |
| Continuidade | Continue com o exemplo que você escolheu. |
| Nome do caso | Usar o rótulo público do cenário recebido, sem reescrever o caso. |
| Blocos | O sinal / O contexto / O que conferir |
| Página do caso | Página no exemplo |
| Indicadores, se corresponderem aos dados exibidos | Páginas no exemplo / Itens para conferir / Itens revisados no exemplo |
| Ação local de revisão | Marcar como revisado no exemplo |
| Aviso junto da revisão | Isso registra apenas sua revisão nesta demonstração. Não corrige nem verifica um site. |
| Histórico local | Atividades nesta demonstração |
| Retorno | Voltar ao exemplo |

A frase de continuidade só aparece quando o cenário da origem foi preservado. Em acesso direto, usar “Explore um exemplo e veja o que conferir.” Não apresentar números como dados de uma conta real nem usar horário de exemplo como “última verificação” recente.

### Estados vazios, de erro e de sucesso

As linhas de ações locais são **copy condicionada à implementação**. O composable existente não comprova que a tela já executa essas ações. Exibir sucesso somente depois de confirmar a alteração local; não anunciar conexão, entrega ou correção real.

| ID / condição | Título exato | Mensagem exata | Ação e efeito esperado |
| --- | --- | --- | --- |
| `empty.pages` — lista local vazia | Nenhuma página neste exemplo | Adicione um endereço para explorar a organização do painel. Ele não será acessado. | “Adicionar página ao exemplo”; abrir somente a entrada local. |
| `empty.activity` — nenhuma ação local | Você ainda não fez alterações no exemplo | As ações feitas nesta demonstração aparecem aqui enquanto você explora. | “Voltar ao exemplo”. |
| `empty.review` — todos os itens locais revisados | Você revisou todos os itens do exemplo | Isso não indica que um site real foi verificado ou corrigido. | “Ver itens revisados”; se houver lista implementada. |
| `empty.search` — filtro sem resultado, se existir | Nenhum item com esse filtro | Ajuste os filtros para ver outros itens do exemplo. | “Limpar filtros”. |
| `error.url` — entrada inválida | Confira o endereço | Digite um endereço completo, como https://loja.exemplo.com/contato. | Manter foco/erro associado ao campo; não limpar a entrada. |
| `error.duplicate` — endereço já presente | Essa página já está no exemplo | Confira a lista de páginas ou informe outro endereço. | “Ver páginas do exemplo”; apenas se a navegação existir. |
| `error.scenario` — parâmetro desconhecido | Este exemplo não foi encontrado | Abrimos o exemplo de envio do formulário para você continuar. | “Ver outros exemplos”; abrir o seletor sem perder o contexto. |
| `error.load` — falha real ao abrir a demo | Não foi possível abrir a demonstração | Tente novamente. Se a dificuldade continuar, consulte a ajuda. | “Tentar novamente” e “Abrir ajuda”. |
| `error.local` — ação local falhou | Não foi possível concluir esta ação | Tente novamente. Nenhuma confirmação foi registrada para esta tentativa. | “Tentar novamente”; preservar entrada e cenário. |
| `success.add` — item inserido localmente | Página adicionada ao exemplo | O endereço foi incluído nesta demonstração. Nenhum site foi acessado. | “Ver páginas do exemplo”. |
| `success.review` — revisão local registrada | Revisão registrada no exemplo | O item foi marcado como revisado. Isso não significa que houve uma correção no site. | Manter o caso visível; oferecer desfazer apenas se implementado. |
| `success.pause` — estado local pausado | Página pausada no exemplo | Essa mudança vale apenas para a demonstração. Nenhum monitoramento real estava ativo. | Permanecer na lista. |
| `success.resume` — estado local retomado | Página retomada no exemplo | Essa mudança vale apenas para a demonstração. Nenhum monitoramento real foi iniciado. | Permanecer na lista. |
| `success.reset` — restauração local concluída | Demonstração restaurada | As alterações locais foram removidas e os dados de exemplo voltaram ao início. | Manter navegação e foco previsíveis. |
| `loading.demo` — carregamento real do conteúdo | Abrindo a demonstração | Estamos preparando os dados de exemplo. | Usar apenas enquanto há trabalho real; sem espera artificial. |

Não usar `empty.review` para dados ausentes ou erro de carregamento. “Não há informação” e “todos os itens revisados” representam situações diferentes. Uma falha mostrada dentro do cenário `errors` é parte da história ilustrativa; não deve disparar uma notificação de falha real da aplicação.

### Campos e restauração — somente se implementados

| Elemento | Copy exata |
| --- | --- |
| Rótulo do campo | Endereço da página |
| Placeholder | https://loja.exemplo.com/contato |
| Ajuda junto do campo | Use um endereço de exemplo. Ele será usado apenas nesta demonstração e não será acessado. |
| Botão de inclusão local | Adicionar ao exemplo |
| Nota sobre estado em memória | As alterações desta demonstração não são salvas em uma conta e podem se perder ao atualizar a página. |
| Abertura da confirmação de restauração | Restaurar demonstração? |
| Explicação da restauração | Isso remove as alterações locais e volta aos dados de exemplo. |
| Confirmar | Restaurar demonstração |
| Cancelar | Manter minhas alterações |

Revalidar a nota sobre memória se o agente principal alterar a forma de armazenamento. Não afirmar que algo foi salvo permanentemente a partir de uma mudança visual na tela.

## 6. Seis módulos, apresentados depois do exemplo

Título da seção: **“Conheça os seis módulos da proposta.”**

Apoio: “Além do acompanhamento de sites, o Fluxo Atento reúne seis módulos em definição. Suas funções ainda não estão confirmadas. Você pode conhecer os nomes e continuar explorando a demonstração.”

Badge de todos os cards: **“Em definição”**. Descrição de todos os cards: **“As funções deste módulo ainda estão em definição.”** Não inventar descrições diferentes apenas para preencher o catálogo. A distinção funcional só pode ser escrita após confirmação de escopo.

| ID em `modules.ts` | Título exato do card | CTA / nome acessível | Rota pública |
| --- | --- | --- | --- |
| `recuperaia` | RecuperaIA | Sobre o RecuperaIA | `/modulos/recuperaia` |
| `adsguard` | AdsGuard | Sobre o AdsGuard | `/modulos/adsguard` |
| `atendescore` | AtendeScore | Sobre o AtendeScore | `/modulos/atendescore` |
| `contratovivo` | ContratoVivo | Sobre o ContratoVivo | `/modulos/contratovivo` |
| `compracerta` | CompraCerta | Sobre o CompraCerta | `/modulos/compracerta` |
| `leadradar` | LeadRadar | Sobre o LeadRadar | `/modulos/leadradar` |

Copy da página individual, substituindo `{nome}` exclusivamente pelo nome oficial:

- Título: “{nome}”.
- Estado: “Em definição”.
- Descrição: “As funções do {nome} ainda estão em definição. Esta página apresenta o módulo, mas não oferece recursos em funcionamento.”
- Nota: “O nome do módulo não confirma suas funções, integrações ou disponibilidade.”
- Ação principal: “Explorar a demonstração do site”, para `/exemplo`.
- Ação secundária: “Ver todos os módulos”, para `/modulos`.

Na área do painel, usar a mesma descrição e estado, com retorno ao painel. Não mostrar listas de recursos inferidas dos nomes: recuperação de vendas, proteção de anúncios, pontuação de atendimento, gestão de contratos, validação de compras ou prospecção não foram confirmadas pelas fontes lidas.

## 7. Planos: copy conceitual, sem valores ou cotas

Título de `/planos`: **“Conheça a proposta dos planos.”**

Introdução: “Gratuito, Essencial e Completo são os três planos previstos para o Fluxo Atento. A contratação ainda não está disponível nesta demonstração.”

Texto comum: “A proposta dos três planos inclui WhatsApp, com uso limitado de inteligência artificial e campanhas. As funções e os limites ainda precisam ser confirmados.”

Texto do Completo: “A proposta do Completo inclui os seis módulos. As funções ainda estão em definição.”

A distribuição de e-mail entre planos não é decidida por esta copy: OFFER contém uma hipótese para todos os planos, pendente de validação comercial em FLUXO-10. Não publicar exclusividade sem decisão.

Aviso junto da apresentação: “Esta página apresenta uma proposta. Nenhum plano é ativado e nenhuma cobrança é feita pela demonstração.”

Usar os nomes **Gratuito**, **Essencial** e **Completo**. Descrições que diferenciem capacidade, valores, cotas, periodicidade, elegibilidade e recursos de cada um devem vir da fonte de oferta do responsável, sem duplicação manual aqui. Não inventar diferenças entre Gratuito e Essencial; não inferir ausência de e-mail ou distribuição de módulos nos demais planos sem confirmação.

CTA atual: “Explorar demonstração”. Link de apoio: “Entender o estado do produto”, para `/ajuda#planos`. Não usar selo de plano atual, “Assinar”, “Fazer upgrade”, desconto, economia ou popularidade nesta etapa.

Se a oferta for publicada antes da operação, manter o aviso de indisponibilidade. Aprovar uma regra comercial não significa disponibilizar checkout, WhatsApp ou recursos dos módulos.

## 8. Copy das rotas desejadas e do modo inicial

### `/como-funciona`

- Título: “Do que apareceu na página ao que vale conferir.”
- Introdução: “Explore três situações de exemplo. Em cada uma, veja o sinal, entenda o contexto e confira uma sugestão de próximo passo.”
- Etapa Sinal: “Veja o que apareceu na observação ilustrativa.”
- Etapa Contexto: “Compare as informações e entenda o que elas permitem concluir.”
- Etapa Ação: “Confira o próximo passo sugerido antes de decidir o que fazer.”
- Limite: “A demonstração não acessa seu site, não envia mensagens e não faz correções.”
- CTA por cenário: “Ver este exemplo no painel”.

### `/integracoes`

- Título: “Saiba onde entram o site, o WhatsApp e o e-mail.”
- Introdução: “Os canais fazem parte da proposta do Fluxo Atento. Nesta demonstração, nenhum deles está conectado.”
- Site — “Os exemplos mostram situações de um site fictício. Não há análise ou acompanhamento real de endereços.”
- WhatsApp — “O WhatsApp está previsto nos três planos. Conexões, inteligência artificial e campanhas não estão disponíveis nesta demonstração.”
- E-mail — “O e-mail faz parte da proposta em validação. Não há envio ou recebimento de mensagens nesta demonstração.”
- CTA: “Entender a demonstração”, para `/ajuda#demonstracao`.

Não exibir logotipos de parceiros como prova de integração ou aprovação. Não listar provedores, sistemas compatíveis ou funções específicas de mensagens sem confirmação.

### `/contato`

- Título: “Quer falar sobre o Fluxo Atento?”
- Texto para a etapa sem canal verificado: “O contato direto ainda não está disponível nesta versão. Você pode consultar a proposta do produto e as respostas na ajuda.”
- Ação principal: “Abrir ajuda”.
- Ação secundária: “Conhecer a proposta”, para `/como-funciona`.

Quando existir um canal verificado, substituir o estado e usar CTA que nomeie o destino. Não inventar telefone, e-mail, horário, pessoa ou prazo. Um formulário de demonstração não deve dizer “Mensagem enviada”.

### `/suporte`

- Título: “Ajuda para explorar a demonstração.”
- Introdução: “Se algo não abrir ou você tiver dúvida sobre um exemplo, comece pelas orientações da ajuda.”
- Orientação: “Tente abrir o exemplo novamente. Se for atualizar a página, lembre que as alterações locais da demonstração podem se perder.”
- Estado: “O atendimento direto de suporte ainda não está conectado nesta versão.”
- Ação principal: “Ver orientações”, para `/ajuda#problemas`.
- Ação secundária: “Voltar à demonstração”, para `/exemplo`.

Não exibir número de chamado, posição de fila ou prazo de retorno sem operação real.

### Login real e configurações da demonstração

No /login do app configurado: “Acesse sua conta.”, com Entrar, Criar conta e Recuperar acesso. Sem configuração: “Acesso em configuração”, com saída para o exemplo. Não pedir credencial sem destino funcional. Sessão válida retorna ao painel permitido sem nova senha.

No console administrativo: “Super Admin”; na operação, mostrar tenant atual e papel. Convite, contato ou configuração só recebem confirmação após sucesso da API. Mensagem não sincronizada não deve aparecer como recuperada.

Para /exemplo/configuracoes: explicar que as preferências são da demonstração; não confundir com /configuracoes da conta no app. O mapa completo é SITE_MAP.md.

Para demais recursos avançados, usar a mesma estrutura com um limite específico. “Modo inicial” é o estado da área, “Em definição” é o estado do escopo de um módulo e “Dados de exemplo” identifica o conteúdo ilustrativo. Não usar os três rótulos como sinônimos.
