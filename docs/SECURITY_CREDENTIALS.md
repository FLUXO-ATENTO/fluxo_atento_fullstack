# Credenciais, permissões e segurança

Registro de 15/10/2026. Inventário de referências, nunca de valores secretos.
Não copiar chaves em Git, issues, PRs, logs, screenshots ou chat.

| Configuração/credencial | Consumidor e armazenamento | Regra |
| --- | --- | --- |
| URL Supabase + chave publicável | Nuxt, build público | Identifica projeto; Auth, grants e RLS protegem dados |
| Chave Supabase de servidor | API VPS, ambiente privado | Pode contornar RLS; validar usuário, tenant e ação em cada operação |
| OAuth Google/GitHub de login | Provedores Supabase Auth | Client Secret nunca no Nuxt; apenas identidade básica |
| OAuth Google de Analytics/Search/Ads | Backend futuro, por tenant | Escopos mínimos separados do login, expiração e revogação |
| Meta/WABA | Backend futuro, cofre privado | App global separado da autorização de cada empresa |
| PageSpeed | Endpoint controlado futuro | API/quota restritas, segredo no backend |
| OpenAI | Agente/BFF na VPS | Chave privada; modelo, ferramentas e orçamento controlados no servidor |
| SMTP | Supabase Auth ou serviço de e-mail | Separar transacional/marketing; TLS e teste de entrega |
| Webhooks de cobrança | Backend futuro | Assinatura, timestamp, deduplicação e validação no gateway |
| GitHub/Netlify deploy | CI/operador | Escopo mínimo do repositório/site, não reutilizar no login social |
| n8n | Operação futura | Cofre próprio, uso adiado; não replicar todas as chaves |

## Auditoria delimitada desta revisão

- Netlify fluxo-atento: duas variáveis, URL Supabase e chave do tipo publicável.
  Contextos/escopos existentes inspecionados sem expor valores.
- Netlify fluxo-atento-app: nenhuma variável de site retornada.
- Equipe Netlify: nenhuma variável compartilhada retornada.
- 77 arquivos públicos do site e 43 do dashboard: nenhum padrão reconhecido de
  credencial privada encontrado.
- 177 versões de arquivos em 15 commits recuperados: nenhum segredo reconhecido;
  credenciais fictícias de testes não são contas reais.
- Nenhuma rotação, revogação ou alteração de escopo em produção nesta revisão.

Isso não certifica ausência absoluta de segredos: a busca por padrões não cobre
todas as codificações, logs, deploys antigos, commits inalcançáveis ou a VPS.
O conector não autorizou a nova consulta de advisors Supabase; um relatório antigo
não é um atestado de segurança atual.

## Controles adicionados

check-public-env.mjs aceita somente nomes públicos aprovados e valida tipos.
NUXT_PUBLIC_ desconhecido, chave privada, JWT não público ou URL com senha falha
sem imprimir o valor. check-secret-exposure.mjs verifica fonte e artefatos.
CI verifica fonte; builds verificam dist e dist-dashboard. Manter scanners nativos.

Previews Netlify ficam sem Auth/API de produção. Usar projeto de teste separado
para futuros previews autenticados. Ocultar chave publicável não substitui RLS.

## Regras de isolamento

1. user_metadata é somente apresentação (nome/telefone/tour/paleta), nunca autorização.
2. A API valida sessão e associação no servidor. ID enviado pelo cliente não basta.
3. Conta proprietária distinta da conta de teste de tenant; MFA e auditoria.
4. Sem masterkey universal: emergência temporária, aprovada e auditada.
5. Sem cookies de autenticação compartilhados indiscriminadamente com flow/infra.
6. Google/GitHub login não autoriza anúncios, Analytics ou repositórios.
7. Módulos, planos e quotas precisam ser limitados pelo backend, não só pelo menu.

## Operação de credenciais

Registrar finalidade, responsável, ambiente, serviço consumidor, local seguro,
permissão, revisão e data de rotação — nunca o valor.

Rotação: identificar consumidores → substituir no local seguro → testar operação
permitida/negada → revogar antiga → observar → registrar evidência. Em exposição,
conter/revogar conforme risco; remover do Git não invalida a chave.

Fontes: [chaves Supabase](https://supabase.com/docs/guides/getting-started/api-keys),
[RLS](https://supabase.com/docs/guides/database/postgres/row-level-security),
[Netlify Secrets](https://docs.netlify.com/build/environment-variables/secrets-controller/).
