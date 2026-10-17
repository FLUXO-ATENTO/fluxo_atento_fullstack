# Fluxo Atento — experiência canônica

Referência de UX para implementação pelo agente principal. Leitura inicial do código em 10/10/2026. Este documento especifica a experiência desejada; não atesta que ela já foi implementada ou testada. O repositório estava em edição paralela durante a leitura.

## 1. Responsabilidade e fontes

- Este documento define jornadas, navegação, comportamento, acessibilidade e critérios de validação.
- [CONTENT.md](CONTENT.md) define a copy pública e as condições para usá-la. Em conflito, UX governa comportamento e CONTENT governa redação; nenhum deles comprova disponibilidade funcional.
- Fontes inspecionadas: `README.md`, `app/pages/index.vue`, `app/data/experience.ts`, `app/data/modules.ts`, `app/components/ExperienceStory.vue`, `app/composables/useDemoWorkspace.ts`, `app/pages/dashboard/index.vue`, `app/components/InitialState.vue`, `app/layouts/default.vue`, `package.json` e inventário de `app/pages/`.
- `app/data/modules.ts` é a referência para nomes e identificadores dos seis módulos. Seus escopos, disponibilidade e distribuição entre planos não estão confirmados.
- Valores, cotas, regras comerciais e comparação detalhada dos planos pertencem ao responsável pela oferta. Consumir sua definição quando publicada; não criar uma tabela comercial paralela nestes documentos.
- Não há implementação de UI, alteração de conta, commit ou publicação associada à criação destes documentos.

## 2. Estado observado e proposta

| Área | Observado na leitura inicial | Proposta de experiência / limite |
| --- | --- | --- |
| Página inicial | Hero, dores, animação interativa, seis módulos e convite ao painel. Há textos como “pixel”, “script”, “dashboard” e “ecossistema”. | Apresentar uma dor cotidiana, um exemplo compreensível e a continuação do mesmo exemplo no painel; apresentar os módulos depois. |
| Exemplos | `tracking`, `errors` e `changes` em `experience.ts`, com endereço, evidência, comparação e próxima ação. O primeiro selecionado é `tracking`. | Preservar IDs; exibir “Registro de compras”, “Envio do formulário” e “Mudanças na página”. Começar por `errors`, por ser reconhecível para comércio e serviços. Essa escolha é uma hipótese de UX a validar. |
| Continuidade | O link do exemplo envia `?scenario=<id>` ao painel. O painel inspecionado usa `dashboardMock` e não lê essa seleção. | O painel deve abrir o cenário recebido, com o mesmo sinal, página, comparação e ação. Essa continuidade ainda precisa ser implementada. |
| Interação local | `useDemoWorkspace.ts` define revisão, inclusão e pausa de páginas fictícias em estado local da aplicação. Sua existência não comprova uso pelas telas. | Só anunciar uma operação depois de ligar e verificar o comportamento. Não apresentar essas operações como monitoramento ou armazenamento real. |
| Movimento | `ExperienceStory.vue` avança automaticamente a cada três segundos, oferece pausa e consulta movimento reduzido/visibilidade. Há órbitas e conexões visuais. | Começar estático; avançar por ação da pessoa. Movimento deve explicar uma mudança de etapa. Preferência de movimento reduzido também deve valer para transições do hero e do conteúdo. |
| Módulos | RecuperaIA, AdsGuard, AtendeScore, ContratoVivo, CompraCerta e LeadRadar; descrições e disponibilidade “A DEFINIR”. | Manter nomes, apresentar estado “Em definição” e explicar o limite sem inferir capacidades pelo nome. |
| Rotas | Existem `/`, `/demo`, `/login`, `/privacy`, `/terms`, `/modulos`, `/modulos/[slug]`, `/dashboard`, `/dashboard/modulos`, `/dashboard/modulos/[slug]`, `/dashboard/planos` e `/dashboard/configuracoes`. | A arquitetura abaixo diferencia páginas existentes e novas. Um link no código não comprova que o destino existe. |
| Novas páginas | `/como-funciona`, `/contato`, `/suporte`, `/ajuda`, `/integracoes` e `/planos` não constavam do inventário inicial. Há links para algumas delas. | Implementar páginas úteis, com conteúdo e estado explícitos, antes de anunciar a navegação como completa. |
| Serviços | O README registra ausência de análise real, monitoramento recorrente, autenticação, armazenamento, pagamentos e agente conectado. Não foi feita auditoria de backend neste trabalho. | A demo continua identificada como ilustrativa. WhatsApp, IA, campanhas, e-mail e módulos não podem aparecer como serviços operando. |
| Base visual | `package.json` já declara Nuxt UI e Motion; a seção de dependências do README descreve uma etapa anterior. | Usar Nuxt UI para controles e Motion para a explicação. A presença das dependências não comprova acessibilidade nem conclusão da migração visual. |

Não transformar o retrato acima em status permanente. Ao implementar, atualizar o registro do que foi verificado e manter as limitações próximas das ações afetadas.

### Registro de implementação — 16/10/2026

Na branch `feat/hero-agent-experience`, ainda não publicada, a página inicial passou
a ter uma única ação principal no hero e uma demonstração contínua de
**sinal → contexto → próxima ação**. O cenário inicial é `errors`; a pessoa escolhe
o cenário e a etapa, e o convite ao painel só aparece ao final do fluxo. A
demonstração permanece identificada como ilustrativa, pausa fora da área visível
e remove transições quando há preferência por movimento reduzido.

A rota `/agente` ganhou uma página dedicada coerente com as orientações do
copiloto: separa fato, hipótese e decisão humana, informa que o chat ainda não
está conectado e não simula resposta de IA. A autenticação mantém somente o
seletor global e discreto de aparência; Escuro continua sendo o padrão, com
Claro e Sistema opcionais. No cabeçalho móvel, links textuais ficam no menu para
evitar competição visual e transbordamento horizontal.

`/como-funciona` continua uma rota normal do site. A implementação de `/agente`
é a origem interna da página destinada a `agente.fluxoatento.com.br`; o alias,
DNS e TLS ainda dependem da configuração de produção. O topo compartilhado usa
um único `UButton` de suporte, “Fale com o agente”, com feedback de pressão pelo
Motion e destino configurável para o subdomínio. O atalho concorrente de módulos
foi retirado do topo; “Como funciona”, “Entrar” e aparência permanecem discretos.

O fluxo visual usa Motion for Vue `2.8.0` com integração Nuxt, `AnimatePresence`,
transição de layout e springs ligados às três etapas. A interação continua
manual, pode ser reproduzida/pausada, suspende fora da tela e respeita
`prefers-reduced-motion`; o movimento não cria uma função que o produto não tem.

Validação local desta implementação: 121 testes unitários/contrato, verificação
de tipos, geração estática de 76 rotas, inspeção do artefato sem padrões privados
e 22 cenários E2E em desktop/mobile aprovados. Publicação e aceite HTTPS são
etapas separadas.

Na ampliação posterior desta mesma branch, o painel global mantém sua navegação
separada do tenant e passa a mostrar Tenants, Planos e Pagamentos. O controle
de uma empresa explicita o que já é efetivo (pausa operacional e bloqueio de
novos pedidos de canal) e o que apenas registra uma política para serviços
futuros (galeria, equipe, provedor por tenant). Planos publicados filtram o
catálogo no painel da empresa, mas não iniciam cobrança. “Pagamentos” não exibe
valores fictícios: informa que falta conciliação com gateway.

O botão de suporte existente no topo dos dois painéis abre a mesma janela de
chat textual, agora vinculada à empresa verificada. No Superadmin há seleção
explícita da empresa; no tenant, a seleção vem da sessão e não pode ser editada.
O histórico é carregado ao abrir e atualizado enquanto a janela está visível;
erro de envio preserva o texto. Anexos/áudio não são apresentados como ativos.
Verificação local da interface e aceite em produção são registrados em STATUS.

## 3. Público e tarefa central

O produto se dirige a pessoas que vendem ou recebem clientes pelo site e pelo WhatsApp. Elas precisam reconhecer o que merece atenção, entender o contexto disponível e escolher um próximo passo. Não exigir vocabulário técnico, escolha de módulo, cadastro ou escolha de plano para compreender essa proposta.

O conceito de produto une monitoramento de sites e seis módulos. WhatsApp faz parte da direção de produto e de oferta; nesta etapa não é um canal conectado. Um exemplo de falha no formulário não demonstra entrega ou leitura de mensagens no WhatsApp.

| Público / situação | Dúvida reconhecível | Caminho recomendado | O que deve compreender ao terminar |
| --- | --- | --- | --- |
| Quem presta serviços e recebe pedidos de orçamento | “A pessoa preencheu o formulário. O pedido chegou?” | Dor de contato → exemplo `errors` → contexto do erro → mesmo exemplo no painel. | O exemplo mostra uma falha de envio; não comprova perda de clientes nem a causa da falha. |
| Quem vende em uma loja online | “A compra apareceu no relatório?” | Dor de registro → exemplo `tracking` → limites da observação → painel do mesmo cenário. | Um registro ausente nesta observação não prova que não houve compra ou que um anúncio falhou. |
| Quem atualiza ofertas e páginas | “A página ficou com o texto combinado?” | Dor de mudança → exemplo `changes` → antes/depois → revisão no painel. | Uma diferença pode ser esperada; a decisão depende de conferência. |
| Quem acompanha o site para outra pessoa ou equipe | “O que preciso conferir e explicar?” | Qualquer cenário → contexto → detalhes técnicos opcionais → próxima ação. | Consegue explicar o achado em linguagem comum e localizar o detalhe necessário para investigar. Não pressupor exportação ou compartilhamento funcional. |
| Quem chega buscando atendimento pelo WhatsApp | “Onde o WhatsApp entra?” | Explicação do conceito → `/integracoes` → exemplo do site → planos conceituais, se desejar. | WhatsApp está previsto; conexão, mensagens, IA e campanhas não estão disponíveis na demo. |

Essas jornadas são hipóteses de compreensão, não segmentos já validados. Não criar um questionário obrigatório de perfil na entrada.

## 4. Sequência principal

1. **Dor reconhecível.** Hero com situação concreta e indicação visível de demonstração. CTA principal “Ver um exemplo”; secundário “Como funciona”.
2. **Exemplo pronto.** A seção `/#exemplo` já abre o cenário de envio do formulário. A pessoa pode ler sem clicar ou escolher outro cenário.
3. **Sinal → contexto → ação.** Mostrar o que aparece no exemplo, o limite dessa evidência e o que conferir. A animação acompanha essa explicação.
4. **Continuidade no painel.** “Ver este exemplo no painel” abre `/dashboard?scenario=errors`, `tracking` ou `changes`, conforme a seleção. Nenhuma escolha de módulo no caminho.
5. **Exploração progressiva.** Depois da explicação e do convite ao painel, apresentar o conceito dos seis módulos e o estado das integrações.
6. **Planos e ajuda.** Quem quiser pode consultar a proposta dos planos, documentação e canais disponíveis. Não bloquear o aprendizado com oferta comercial.

Ordem de seções recomendada para `/`: hero → exemplo → convite ao painel com o mesmo cenário → módulos em definição → resumo de integrações/planos → ajuda e CTA final. Dores complementares podem entrar entre hero e exemplo, desde que não afastem o exemplo para várias telas abaixo.

## 5. Arquitetura da informação

### Navegação pública

Cabeçalho: marca ligada a `/`, “Como funciona”, “Planos”, “Ajuda” e CTA “Explorar demonstração”. Agrupar “Módulos” e “Integrações” em “Produto” se houver espaço e necessidade; o menu deve funcionar por clique e teclado. O link para o catálogo pode existir desde o início, mas não deve ser um passo obrigatório.

Rodapé: Produto (`/como-funciona`, `/modulos`, `/integracoes`, `/planos`); Ajuda (`/ajuda`, `/suporte`, `/contato`); Privacidade e termos nas rotas existentes. No mobile, oferecer os mesmos destinos com hierarquia simples. Enquanto o acesso não funciona, evitar “Entrar” como CTA principal; a página de acesso deve explicar seu estado.

| Rota | Papel e conteúdo mínimo | Estado no inventário inicial | Critério para a página proposta |
| --- | --- | --- | --- |
| `/` | Reconhecer a dor e experimentar o fluxo. | Existe, em edição. | Exemplo visível, estado ilustrativo claro, saída para o mesmo caso no painel. |
| `/como-funciona` | Explicar sinal, contexto, ação, três exemplos e limites. | Não encontrada. | Explicação completa em texto, equivalente à animação, com links para cada exemplo. |
| `/dashboard` | Continuar o exemplo; ver contexto, ação e atividades locais quando implementadas. | Existe, com dados de apresentação. | Preservar `scenario`; manter a etiqueta de demo e distinguir “revisado” de “corrigido”. |
| `/modulos` | Apresentar os seis nomes e o que ainda está em definição. | Existe. | Catálogo informativo, sem exigir seleção para entrar no painel. |
| `/modulos/[slug]` | Explicar o estado de um módulo. | Existe. | Nome canônico, limite funcional, retorno ao catálogo e acesso ao exemplo geral sem atribuí-lo ao módulo. |
| `/integracoes` | Explicar o papel conceitual de site, WhatsApp e e-mail. | Não encontrada. | Estado de cada canal e o que é possível hoje. Sem botão de conexão fictício. |
| `/planos` | Apresentar Gratuito, Essencial e Completo e a definição comercial do responsável. | Não encontrada. | Estado conceitual explícito; nenhum checkout ou contratação simulados. |
| `/ajuda` | Documentação completa da experiência atual, com índice e links diretos. | Não encontrada. | Responder todas as questões listadas abaixo. A documentação da demo deve ser útil mesmo com recursos futuros indefinidos. |
| `/suporte` | Ajudar quem encontrou uma dificuldade ao explorar. | Não encontrada. | Orientação prática, acesso à ajuda e estado real dos canais; sem protocolo ou prazo inventado. |
| `/contato` | Orientar quem quer falar sobre o produto. | Não encontrada. | Exibir somente canal verificado. Sem canal conectado, explicar o limite e oferecer navegação útil. |
| `/dashboard/modulos` e `/dashboard/modulos/[slug]` | Acesso ao catálogo a partir do painel. | Existem. | Modo inicial; sem telas que simulem contratação, execução ou resultados do módulo. |
| `/dashboard/configuracoes` | Configurações futuras. | Existe. | Modo inicial com explicação do que ainda não pode ser configurado e retorno ao painel. |
| `/dashboard/planos` | Oferta a partir do painel. | Existe. | Reutilizar conteúdo de `/planos` ou encaminhar para ela preservando um retorno ao painel. Não manter duas ofertas independentes. |
| `/login` | Acesso futuro. | Existe, sem autenticação funcional declarada. | Não coletar credenciais em formulário sem destino; oferecer a demo aberta. |
| `/demo` | Entrada antiga da demonstração. | Existe. | Unificar a explicação com `/dashboard`; propor encaminhamento apenas na implementação, sem manter narrativas divergentes. |
| `/privacy` e `/terms` | Explicar o estado documental. | Existem como pontos de partida. | Não apresentar os textos como revisados juridicamente. Revisão legal está fora deste trabalho. |

Não substituir todas as novas páginas por um aviso genérico. Modo inicial limita a operação; a explicação e a navegação devem estar completas. Uma rota indisponível precisa de mensagem e caminho de retorno, não de uma confirmação fictícia.

### Conteúdo obrigatório de `/ajuda`

Usar índice com âncoras estáveis; os textos-base estão em [CONTENT.md](CONTENT.md). Cada artigo informa o que funciona hoje, como explorar e o que ainda está em definição.

| Âncora proposta | Pergunta a responder | Conteúdo necessário |
| --- | --- | --- |
| `#primeiros-passos` | Como começo? | Abrir exemplo, ler etapas e continuar no painel; sem cadastro para a demo. |
| `#demonstracao` | Esses dados vêm do meu site? | Dados fictícios, endereço ilustrativo, ausência de consulta e análise reais. |
| `#exemplos` | O que mostram os três exemplos? | Registro de compras, falha de envio e mudança de título; significado e limite de cada um. |
| `#sinal-contexto-acao` | Como interpreto o resultado? | Observação, hipótese e conferência humana; sem causalidade presumida. |
| `#painel` | Como continuo no painel? | Mesmo cenário, retorno ao exemplo e estados de revisão local, quando implementados. |
| `#dados-locais` | O que fica salvo? | Comportamento de memória verificado na implementação; nunca alegar conta ou histórico permanente. |
| `#modulos` | Para que servem os módulos? | Lista dos nomes; funções ainda não confirmadas; não preencher lacunas com inferências. |
| `#integracoes` | Posso conectar site, WhatsApp ou e-mail? | Estado inicial e inexistência de conexão real nesta demo. |
| `#planos` | Posso contratar? | Conceito de três planos; detalhes na fonte comercial; contratação indisponível nesta etapa. |
| `#acessibilidade` | Posso usar sem animação ou sem mouse? | Etapas manuais, preferência de movimento reduzido, navegação por teclado. Publicar instruções apenas após verificação. |
| `#problemas` | O que faço se algo não abrir? | Tentar novamente, voltar ao exemplo e orientação de suporte sem inventar atendimento ativo. |
| `#termos-usados` | O que significam os termos? | Glossário curto de sinal, contexto, próxima ação, página acompanhada e registro de compra. |

## 6. Contrato do exemplo e do painel

### Uma única história

Os dados dos três cenários devem ter uma fonte compartilhada, mantendo os IDs de `experience.ts`. Landing, `/como-funciona` e painel não devem escrever versões incompatíveis do mesmo caso. [CONTENT.md](CONTENT.md) fornece a redação proposta por campo.

Cada cenário precisa de: ID, rótulo público, situação, página fictícia, sinal, antes/depois, contexto, limite da observação, próxima ação e detalhe técnico opcional. Ao escolher outro exemplo, atualizar todos esses elementos, inclusive a miniatura da página. Não deixar uma loja na etapa de pagamento ilustrar um erro de formulário de contato.

| Entrada / ação | Resultado exigido |
| --- | --- |
| Abrir `/#exemplo` pela primeira vez | Cenário `errors`, etapa “Sinal”, leitura disponível sem reprodução. |
| Escolher outro cenário | Pausar a reprodução, selecionar a etapa “Sinal”, manter foco no controle acionado e atualizar os dados associados. |
| Abrir `/dashboard?scenario=tracking` | Abrir “Registro de compras” e a respectiva evidência; não cair em uma lista genérica de módulos. |
| Abrir o painel sem parâmetro | Abrir o cenário padrão `errors`, identificado como exemplo. |
| Receber parâmetro inválido | Usar `errors` e explicar o fallback com a copy de CONTENT. Não quebrar a página. |
| Voltar ao exemplo | Preservar o cenário; proposta de URL `/?scenario=<id>#exemplo`. O botão Voltar do navegador deve manter uma navegação previsível. |
| Recarregar a URL com cenário | Preservar o cenário pela URL. Se houver alterações locais não persistentes, explicar que podem se perder. |
| Marcar como revisado | Só registrar revisão local, caso esse controle esteja implementado. Não alterar a evidência para “corrigido” nem gerar alegação de teste real. |
| Adicionar ou pausar uma página na demo | Se implementado, mostrar confirmação local explícita. Não iniciar consulta, observação recorrente ou mensagens. |
| Restaurar demonstração | Se implementado, explicar a perda das alterações locais e restaurar somente o estado da demo. A confirmação deve permitir cancelar. |

No painel, o primeiro bloco mostra “Você está vendo uma demonstração”, título do cenário, página fictícia, sinal, contexto e próxima ação. Informações técnicas ficam em expansão opcional. Módulos, integrações e planos entram depois, pela navegação secundária. Indicadores só contam itens do exemplo; rótulos como “Conta ativa”, “Módulos contratados” e “Receita recuperada” não correspondem ao estado observado.

### Revelação progressiva

| Camada | Conteúdo visível | Como aprofundar |
| --- | --- | --- |
| 1. Entender | Dor, exemplo pronto, etiqueta de demo e resumo das três etapas. | “Ver um exemplo”. |
| 2. Conferir | Sinal, comparação, limite e próxima ação do cenário escolhido. | Controles das etapas e “Ver este exemplo no painel”. |
| 3. Investigar | Endereço ilustrativo e detalhe técnico, se desejado. | “Ver detalhes técnicos”, com expandir/recolher acessível. |
| 4. Conhecer o produto | Seis módulos, integrações e proposta dos planos. | Links opcionais, com disponibilidade explícita. |
| 5. Usar recursos futuros | Conexões, automações, IA, campanhas, configurações e contratação. | Modo inicial até existir capacidade confirmada e implementação verificável. |

Nunca esconder a natureza ilustrativa, limitações da evidência, indisponibilidade ou informação necessária para uma decisão dentro de um acordeão.

## 7. Direção visual e movimento

### Preto e grafite, com leitura confortável

Decisão do proprietário em 15/10/2026: **Escuro é o padrão**, não Sistema.
Aplicar a mesma regra ao site, Docs/agente, autenticação e aos dois painéis,
sem redesenhar a paleta original. Claro e Sistema continuam opções explícitas
no seletor e uma escolha salva é preservada. O sistema operacional em modo claro
não deve tornar claro um primeiro acesso nem a passagem para a autenticação.
Preferência ausente/inválida ou storage indisponível usa Escuro; não criar uma
preferência persistida só por carregar a página. A evidência de publicação deve
ser registrada separadamente dos testes locais desta correção.

Nas telas de acesso, o seletor de tema usa o formato compacto (Claro, Escuro e
Sistema em uma linha, sem texto explicativo longo), com o mesmo comportamento.

No estado padrão, sem personalização autenticada, todas essas superfícies usam a
mesma origem em `app/assets/css/design.css`: fundo `#090a0b` e laranja de ação
`#eaa176`. As preferências de paleta do usuário autenticado continuam disponíveis
depois do acesso e não alteram esse padrão inicial do produto.

Usar preto/grafite no fundo, superfícies com separação perceptível, texto claro e contraste medido. Evitar neon, halos, brilho contínuo e órbitas decorativas. Cor de estado é discreta e acompanhada de palavra/ícone. Não associar todas as situações a vermelho: mudança pode exigir apenas conferência.

Nuxt UI fornece os controles e seus estados; Motion pode acompanhar a mudança de etapa. Esses são instrumentos de implementação, não assuntos para a copy pública. Tipografia de corpo legível, títulos curtos e hierarquia por tamanho, peso e espaço; fonte monoespaçada somente em detalhes técnicos opcionais. Não reduzir corpo ou contraste para caber texto.

### Movimento com função didática

| Etapa | O que a pessoa lê | O que o movimento pode explicar | O que fica disponível sem movimento |
| --- | --- | --- | --- |
| Sinal | O que aconteceu no exemplo. | Destaque breve no elemento observado: resposta de envio, registro de compra ou título. | Mesmo elemento destacado e texto completo. |
| Contexto | Comparação e limite da evidência. | Transição curta para a comparação; manter os dois valores legíveis. | Antes/depois e explicação lado a lado ou empilhados. |
| Ação | O que conferir em seguida. | Destaque breve no próximo passo, após a leitura do contexto. | Próximo passo e link para o painel. |

Iniciar sem reprodução automática. Oferecer “Reproduzir explicação”, “Pausar explicação”, “Próxima etapa” e seleção direta de etapa. A reprodução opcional percorre a história uma vez e para; não troca cenários sozinha. Qualquer interação manual pausa a reprodução. Ao ocultar a aba ou tirar o exemplo da área visível, pausar; retornar não reinicia sem pedido.

Proposta de transição: 150–250 ms; sem zoom, parallax, giro ou caminhos animados que concorram com a leitura. O intervalo de reprodução deve permitir ler a maior legenda e ser validado com pessoas; não adotar os três segundos atuais como requisito. Conteúdo textual permanece acessível durante e depois da transição; não depender de assistir no tempo certo.

Com `prefers-reduced-motion: reduce`, não há avanço automático nem deslocamento, escala, órbita ou transição de layout. Manter todos os controles manuais e a sequência em texto. Motion e CSS devem respeitar a mesma preferência, inclusive fora do exemplo. Não esconder conteúdo enquanto se espera uma animação aparecer.

## 8. Planos e recursos em modo inicial

A direção conceitual aprovada contém **Gratuito, Essencial e Completo**. Os três contemplam WhatsApp, com IA e campanhas limitadas; o Completo contempla todos os seis módulos e e-mail. Isso descreve a intenção de oferta, não disponibilidade atual. As funções de cada módulo continuam em definição.

Não deduzir desse conceito quantos módulos pertencem aos outros planos, quais ações de IA/campanhas existem, volumes, periodicidade, número de usuários, preço, teste, cobrança ou prazo de lançamento. Essas decisões e a tabela comercial são do responsável pela oferta. Não classificar Essencial como “mais popular” nem Completo como “ilimitado”.

Na etapa atual, apresentar nomes e descrição conceitual, aviso de que a contratação não está disponível e CTA para entender a proposta ou explorar a demo. Somente após a oferta e a operação estarem verificadas, trocar por ações de contratação. Limites confirmados devem aparecer antes da decisão comercial, em linguagem acessível, inclusive no mobile.

Para recursos avançados, o estado inicial precisa responder: “Onde estou?”, “O que posso fazer aqui hoje?” e “Como continuo?”. Usar título específico, limite concreto e saída útil. Não oferecer botão desabilitado sem explicação nem formulário que encerra com sucesso falso. Uma configuração de WhatsApp, por exemplo, pode explicar o estado do canal e apontar a ajuda; não deve simular QR code, conexão ou envio.

## 9. Acessibilidade e responsividade

### Referência e meta

Meta de implementação: WCAG 2.2 AA, sujeita a verificação. Critérios relevantes incluem teclado sem aprisionamento, foco visível e não encoberto, ordem de leitura, rótulos, identificação de erros, mensagens de estado e controles de pausa. Contraste mínimo: 4,5:1 para texto comum, 3:1 para texto grande e componentes visuais aplicáveis. Validar texto ampliado a 200% e reorganização a 320 CSS px. Referência: [W3C — WCAG 2.2 Quick Reference](https://www.w3.org/WAI/WCAG22/quickref/). Não publicar selo de conformidade a partir deste documento ou de uma ferramenta automática isolada.

Os requisitos abaixo traduzem essa meta em verificações do Fluxo Atento e acrescentam decisões de projeto, como alvos preferenciais de 44 × 44 CSS px e animação iniciada manualmente. Não são um relatório de testes já executados.

### Critérios verificáveis

- **Teclado:** percorrer menu, cenários, etapas, reprodução, detalhes e CTAs com Tab/Shift+Tab. Enter ativa links; Enter/Espaço ativam botões. Não exigir hover, arrastar, gesto preciso ou mouse.
- **Seletores:** preferir grupo de botões com nome de grupo e `aria-pressed` para cenário e etapa, coerente com o componente atual. Se forem abas, implementar o padrão completo de `tablist`, `tab`, `tabpanel`, estado e teclas de navegação; não misturar os modelos. Referência específica: [W3C — Tabs Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/tabs/).
- **Foco:** anel claramente visível em todos os controles; nunca coberto por cabeçalho fixo. Troca de cenário mantém foco no botão usado. Navegação de rota atualiza título e leva foco ao início do conteúdo. Link de salto realmente alcança o conteúdo.
- **Menu e diálogos:** ao abrir, foco entra no conteúdo; Escape fecha; ao fechar, foco volta ao acionador. Conter foco somente enquanto o diálogo estiver aberto. Evitar que o fundo continue recebendo cliques ou foco.
- **Expansões:** “Ver detalhes técnicos” anuncia estado expandido e relaciona controle/conteúdo. Conteúdo recolhido não deixa controles ocultos na sequência de foco.
- **Leitura assistiva:** idioma `pt-BR`, títulos hierárquicos, um título principal por página e nomes de controles coerentes com o texto visível. Descrever o exemplo em texto; esconder somente ícones decorativos da leitura assistiva.
- **Atualizações:** anunciar de forma breve seleção, erro ou confirmação pertinente. Usar região de estado discreta para sucesso local; erro urgente quando necessário. Não reler toda a animação a cada passo automático nem deslocar foco para notificações.
- **Formulários locais, se implementados:** rótulo persistente, ajuda associada, mensagem junto ao campo e indicação programática do erro. Preservar o que foi digitado. O placeholder não substitui rótulo; cor sozinha não identifica falha.
- **Movimento reduzido:** testar com a preferência ligada antes de carregar e alterada durante o uso. A história precisa continuar compreensível e operável, sem conteúdo desaparecendo ou botões com ação diferente do nome.
- **Contraste e estado:** medir pares reais de texto/superfície e foco/superfície. “Em definição”, “Revisado no exemplo” e “Precisa de conferência” precisam de palavras; não depender de pontos coloridos.
- **Toque e largura:** adotar alvo preferencial de 44 × 44 CSS px, separação entre controles e quebras de linha. Não esconder a etiqueta de demonstração para ganhar espaço.
- **Falhas:** apresentar erros em texto, com recuperação possível. Ao tentar novamente, preservar cenário e campos. Um aviso deve continuar visível pelo tempo necessário à leitura, sem encerramento automático obrigatório.

### Adaptação de layout

Em telas estreitas, sinal, contexto e ação ficam na ordem vertical de leitura. Setas horizontais decorativas não devem impor rolagem lateral. Os três seletores podem quebrar linha; etapas e CTAs devem ter rótulos completos. O painel abre o caso selecionado antes de indicadores e navegação secundária.

Validar larguras de 320, 375, 768, 1024 e 1440 CSS px, orientações retrato/paisagem e ampliação do navegador. São amostras de teste, não uma lista obrigatória de breakpoints. Não deve haver rolagem horizontal da página; endereços longos devem quebrar linha. Comparações e planos podem virar blocos empilhados, mantendo a associação entre rótulo e valor. Não ocultar diferenças comerciais confirmadas no mobile.

## 10. Validação e métricas sem alegações

### Pesquisa de compreensão

Executar rodadas exploratórias com pessoas que vendem pela internet, recebem pedidos de serviço e acompanham sites para clientes. Não tratar uma rodada pequena como estimativa de toda a população. Registrar perfil, contexto, tarefa, dificuldade e entendimento com as palavras da pessoa.

Tarefas propostas: explicar o produto após ler o hero; explorar um caso e dizer o que aconteceu; identificar o que o exemplo não permite concluir; continuar no painel e reconhecer o mesmo caso; localizar o estado de um módulo e do WhatsApp; encontrar ajuda; repetir o caminho por teclado ou com movimento reduzido, conforme o perfil de uso.

Perguntas abertas: “De onde você acha que vieram esses dados?”, “O que você conferiria agora?”, “O que espera que aconteça ao clicar aqui?” e “O que você conseguiria usar hoje?”. Não perguntar apenas se a pessoa gostou da interface.

### Eventos e leituras propostas

Não há medição de produção verificada neste trabalho. A tabela é um contrato proposto de instrumentação, a ser implementado apenas quando houver decisão sobre coleta e tratamento de dados. Para pesquisa inicial, observação manual já permite avaliar compreensão.

| Pergunta | Evento / evidência proposta | Cálculo ou leitura | Limite de interpretação |
| --- | --- | --- | --- |
| As pessoas chegam ao exemplo? | `demo_example_viewed`, emitido uma vez quando o bloco fica efetivamente visível, não por pré-carregamento. | Sessões que viram o exemplo / sessões que viram a landing. | Rolagem não significa compreensão; definir a regra de visibilidade antes de medir. |
| Exploram a explicação? | `demo_scenario_selected`, `demo_step_selected`, `demo_playback_changed`; registrar `trigger=manual` ou `playback`. | Seleções manuais por cenário; etapas visitadas manualmente. | Reprodução automática/opcional não conta como interesse manual. |
| A passagem ao painel preserva o caso? | `demo_dashboard_opened`, com cenário de origem e cenário renderizado. | Aberturas com cenário correspondente / aberturas originadas no exemplo. | É integridade da experiência, não resultado de negócio. |
| Entendem a limitação? | Registro da resposta à pergunta sobre origem dos dados. | Participantes que identificam dados fictícios / participantes perguntados, com tamanho da amostra. | Não inferir entendimento a partir de clique em aviso ou tempo de tela. |
| Sabem o próximo passo? | Explicação livre após explorar um caso. | Classificar se a pessoa propõe conferência compatível e reconhece incerteza. | Não equivale a correção real ou recuperação de receita. |
| Conseguem se recuperar de um erro? | `demo_local_action`, com tipo e resultado, se houver ação local implementada. | Conclusões após erro / tentativas que apresentaram erro. | Distinguir erro de entrada da pessoa e falha da interface; sem inferir culpa. |
| Encontram documentação útil? | `help_article_opened` e resultado da tarefa de pesquisa. | Artigo encontrado e pergunta respondida na sessão observada. | Visita a artigo não comprova solução. |
| Entendem módulos e planos? | Explicação livre depois de consultar as páginas. | Identificar quais pontos a pessoa entendeu como conceito ou capacidade disponível. | Visitas e cliques não equivalem a contratação ou intenção confirmada. |

Propriedades suficientes: cenário, etapa, origem, tipo de acionamento e resultado local. Não incluir URL real digitada, telefone, e-mail, texto de contato, credenciais ou conteúdo de mensagens. Agregar contagens com regras documentadas; excluir testes internos e não duplicar eventos por remontagem do componente. Duração só deve contar aba visível e jamais ser tratada como prova de leitura.

Primeiro estabelecer uma linha de base; depois definir hipóteses e metas de melhoria. Não inserir percentuais de aumento, economia, conversão, clientes recuperados, disponibilidade ou precisão na landing com base nesses eventos. Se houver relatório, indicar período, amostra, método e limitações. Nada nesta especificação é resultado medido.

## 11. Critérios de aceite para o agente principal

### Necessários antes de apresentar a experiência como pronta para revisão

- [ ] Hero reconhecível para quem vende/atende por site e WhatsApp, com demo explícita e CTA para exemplo.
- [ ] `tracking`, `errors` e `changes` usam rótulos comuns e mantêm os mesmos dados no painel.
- [ ] Acesso direto, parâmetro inválido, atualização da página e retorno pelo navegador têm comportamento definido.
- [ ] A ordem é dor → exemplo → painel; nenhum módulo ou plano é requisito para continuar.
- [ ] Movimento explica as três etapas; reprodução inicia por escolha e a história funciona sem movimento.
- [ ] Preto/grafite sem neon, com leitura e foco verificados nos pares reais de cores.
- [ ] As sete rotas desejadas existem com conteúdo próprio: `/como-funciona`, `/contato`, `/suporte`, `/ajuda`, `/integracoes`, `/planos`, `/dashboard`.
- [ ] `/ajuda` cobre todos os artigos do índice, com âncoras funcionais e limites atuais explícitos.
- [ ] Os seis nomes correspondem a `app/data/modules.ts`; não há função atribuída sem confirmação.
- [ ] Planos usam a definição comercial do responsável; WhatsApp, IA, campanhas, módulos e e-mail mantêm seu estado conceitual.
- [ ] Toda ação local descreve somente o que de fato muda; nenhum sucesso sugere conexão, mensagem, pagamento ou correção real.
- [ ] Rotas avançadas têm modo inicial específico, explicação e retorno; não há becos sem saída ou CTA para destino inexistente.
- [ ] Caminho principal funciona por teclado, com leitor de tela, movimento reduzido e viewport estreita; verificação automática complementa revisão manual.
- [ ] Conteúdo público não usa “A DEFINIR”, “mock”, “engine”, promessa de resultado, comparação com concorrentes ou disponibilidade inventada.

### Pendências que exigem definição, sem bloquear a documentação da demo

Escopo dos seis módulos; limites e valores da oferta; funções de IA e campanhas; condições das integrações; canais reais de contato/suporte; armazenamento e autenticação futuros; modelo de coleta de métricas. Não preencher essas pendências por suposição. A experiência ilustrativa pode ser completa e navegável com esses limites bem explicados.
