# Evidências de revisão — 15/10/2026

Esta entrega é **código para revisão**, não publicação nem aceite de produção.
Os fatos anteriores de produção estão em [STATUS](STATUS.md). Nenhum resultado
de fixture comprova permissões de contas reais ou comportamento do banco.

## Ambiente e escopo

- Base remota conferida: `882ba47d7e82e59e035827e9742d1570989261f2`.
- Nuxt 4.6.1, Vue 3.5.43, Nuxt UI 4.11.3; dependências mantidas.
- Site e dashboard gerados separadamente, de forma sequencial.
- Conta de QA sintética, sem tráfego Supabase/Google/produção na prévia isolada.
- Nenhum deploy, DNS, billing, segredo, conta real ou migração remota alterado.

## Conferências locais

| Conferência | Resultado observado | Limite |
| --- | --- | --- |
| Testes unitários e contratos | 103/103 passaram após as correções Google | Serviços externos simulados; não comprova RLS/locks ou OAuth real |
| Regressões focadas Google | 47/47 passaram, incluindo 14 casos novos | HTTP local, store/Google simulados e revisão estática de SQL |
| Tipos Nuxt/TypeScript | Passou | Não comprova comportamento de serviços reais |
| Geração do site | Passou, 76 rotas | Artefato local, não deploy Netlify |
| Geração do dashboard | Passou, 36 rotas | Artefato local, não deploy VPS |
| Scanner do site gerado | 173 arquivos, nenhum padrão privado detectado | Busca por padrões, não garantia de ausência de todo segredo |
| Scanner do dashboard gerado | 89 arquivos, nenhum padrão privado detectado | Mesmo limite |
| Scanner da fonte | 183 arquivos, nenhum padrão privado detectado | Não cobre VPS, logs, contas externas ou histórico completo |
| Links da documentação | Passou em 24 documentos | Valida existência local, não correção editorial |
| Skills do projeto | 2/2 passaram no validador oficial | Não comprova execução autônoma de tarefas |
| Configuração dos agentes | 4 arquivos TOML válidos | Permissões efetivas dependem do executor |
| Whitespace do diff | Passou | Não substitui revisão de código |

Os builds exibiram avisos de tempo dos plugins e de resolução externa de um
utilitário Nitro, mas encerraram com código 0. A prévia autenticada fictícia
também exibiu avisos de hidratação; os fluxos listados abaixo foram conferidos
depois da inicialização. Não declarar o navegador livre de avisos.

## Navegador — resultados observáveis

- Paleta personalizada salva e preservada após recarregar, depois restaurada
  para a marca padrão. Tema escuro conferido.
- Entrada comum pausada com “Preciso de mais tempo”; “Continuar agora” levou a
  `/canais` com a sessão fictícia existente. Os controles agora aguardam a
  inicialização da página para não perder o primeiro clique.
- Google no Superadmin distingue login e integração. Na fixture sem configuração,
  a liberação fica desabilitada e os requisitos aparecem pendentes.
- Google na empresa informa “Aguardando liberação”, sem simular fontes conectadas.
- Conta fictícia da empresa acessando `/admin` recebeu “Acesso reservado à
  administração da plataforma”. Nenhum menu de provedores globais foi mostrado.
  O tour inicial pode se sobrepor ao primeiro acesso; o bloqueio foi conferido
  após dispensá-lo. O teste não substitui o aceite negativo em produção.
- Docs: busca `integracoes` sem acento localizou o guia; abertura e reload
  preservaram o artigo após a inicialização. Tema escuro aplicado.
- Docs em viewport móvel solicitado de 390 px (área útil observada: 375 px):
  largura do documento igual à área útil, sem overflow horizontal; abrir menu,
  escolher guia e recolher navegação funcionaram.
- Página pública do agente explica que o chat está pendente. Seu CTA aponta
  para a entrada comum do app com destino `/assistente`, sem carregar tokens.

## Revisão de segurança Google

Uma revisão independente encontrou três cenários, corrigidos e cobertos por
regressões nesta entrega:

1. Revalidação do autorizador também antes de devolver resultados parciais.
2. Desconexão retorna conflito enquanto a troca de tokens está em andamento,
   sem declarar revogação externa quando não há confirmação.
3. Quota de callback vinculada à tentativa validada, sem penalizar todas as
   pessoas atrás do mesmo proxy por requisições inválidas de terceiros.

O [contrato do backend](GOOGLE_BACKEND_CONTRACT.md) registra testes e limites.
Uma queda de processo pode deixar uma tentativa consumida exigindo reconciliação
operacional; não há desbloqueio automático por relógio nem recuperação pela UI.
As regressões simuladas não substituem testes de concorrência no banco real.

Mesmo com regressões sintéticas aprovadas, **continuam pendentes**:

1. Aplicar SQL em banco isolado e executar grants/RLS/RPCs como cada papel.
2. Concorrência em Postgres e entre processos, com duas contas e dois tenants.
3. Cliente OAuth, consentimento, callbacks e APIs reais no Console Google.
4. Cookie seguro, CORS, autorização/negação, renovação e revogação em HTTPS real.
5. Configuração privada e revisão de logs do proxy/APM antes de habilitar.
6. CI remoto, revisão humana, aprovação operacional e aceite do deploy.

Nenhum teste desta entrega atesta capacidade para milhões de tenants, cobrança
operacional, PageSpeed público, métricas Analytics, Google Ads, BigQuery ou chat
IA/suporte persistente. A descoberta inicial de fontes não é um relatório.

## Publicação da revisão

Na primeira tentativa de envio em 15/10/2026, a integração GitHub conseguiu
ler a branch `main`, mas recusou a criação da árvore Git com HTTP 403,
`Resource not accessible by integration`. Naquela tentativa não foram criados
commit, branch remota ou PR, e o CI remoto não foi iniciado.

O checkout e os 121 arquivos candidatos ao envio foram preservados.
O transporte Git do terminal também havia falhado na autenticação do Windows;
não foram enfraquecidos TLS nem controles de acesso para contornar essas falhas.

Na retomada, a integração continuou recusando escrita, mas o Git já configurado
no computador aceitou `push --dry-run` para a branch de revisão. A base remota
continuava no commit registrado acima. O scanner de fonte e os links dos docs
foram revalidados. Essa simulação não comprova publicação; o envio efetivo e o
PR devem ser conferidos pelos respectivos objetos remotos. Nenhuma credencial
nova, mudança de TLS ou permissão global foi necessária. Merge e deploy não
fazem parte desta publicação de revisão.
