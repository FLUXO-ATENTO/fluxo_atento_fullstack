# Turnstile na autenticação

Registro de 15/10/2026. Implementação para revisão no PR #6; **não ativada no
Supabase nem publicada no dashboard**. A página atual da VPS não envia o token:
ligar a exigência do servidor antes do frontend compatível pode bloquear o acesso.

## Escopo e responsabilidades

| Parte | Responsabilidade |
| --- | --- |
| Cloudflare Turnstile | Emitir um comprovante de verificação para o hostname permitido |
| AuthTurnstile / login Nuxt | Carregar o widget somente no autenticador habilitado e enviar o comprovante com a ação |
| Supabase Auth | Validar o comprovante com a chave secreta e rejeitar a ação se a verificação falhar |
| API / Postgres | Continuar autorizando usuário, empresa e papel; CAPTCHA não substitui RLS/MFA/limites |

O widget foi criado pela UI na conta Cloudflare do proprietário:
**Fluxo Atento — Autenticação**, modo **Gerenciado**, somente
`app.fluxoatento.com.br`, sem pré-liberação. O widget IDGate preexistente foi
preservado. Não foram alterados DNS, proxy, WAF, faturamento ou contas.
O produto continua usando Netlify/VPS: Turnstile não exige mudar a hospedagem.

Cobertura implementada: e-mail/senha, criação de conta e solicitação de recuperação
em `/login`. A tela autenticada de nova senha continua usando o link de recuperação
do Supabase. Os botões Google/GitHub mantêm o OAuth normal; `signInWithOAuth` não
recebe `captchaToken` neste fluxo. Não anunciar que este widget protege OAuth,
campanhas, API de monitoramento, suporte ou todo o site.

## Configuração e destino das chaves

- `NUXT_PUBLIC_TURNSTILE_ENABLED`: `false` por padrão; `true` habilita a UI.
- `NUXT_PUBLIC_TURNSTILE_SITE_KEY`: **chave do site pública** do widget. Usada no
  build do dashboard. Não é a chave secreta.
- **Chave secreta do widget**: somente no campo CAPTCHA do Supabase Auth,
  Authentication → Attack Protection. Não colocar em Nuxt, Netlify do site,
  agente OpenAI, n8n, Git, chat, screenshots ou logs.

O modelo da VPS está em
[dashboard-build.env.example](../ops/dashboard-vps/dashboard-build.env.example).
No deploy, o operador preenche a chave pública no arquivo privado de build já
existente. O segredo deve ser inserido diretamente no painel seguro do Supabase
pelo proprietário na etapa de ativação. Nenhuma credencial foi colada no Git.

A política de build exige uma chave pública quando a UI está habilitada, rejeita
nomes de segredos no namespace público, detecta o formato conhecido do segredo
Turnstile e bloqueia chaves de teste nos comandos de build publicável. Isto é
uma verificação de formato, não prova de que a chave pertence ao widget correto.
Conferir hostname, conta e chave no provedor antes de publicar.

## Comportamento da interface

- Modo gerenciado, português, largura adaptável e tema claro/escuro do produto.
- Carregamento explícito do script oficial; não proxyar, copiar ou cachear api.js.
- Botão de e-mail aguarda o comprovante quando a proteção está habilitada.
- Falha de rede/script/challenge mantém o envio bloqueado e oferece nova tentativa.
- Comprovante fica somente em memória, sem armazenamento ou logs. Limite local
  de 295 segundos, inferior aos 300 segundos do serviço.
- Expiração, erro, troca de modo/tema e saída da tela invalidam o comprovante.
- Após cada tentativa de Auth, remover o comprovante e recriar a verificação;
  inclusive se a senha estiver errada. O servidor aceita cada token uma única vez.
- `captcha_failed` vira uma orientação simples, sem revelar detalhes da conta.

A checagem no navegador melhora a experiência, mas **não é uma barreira de
segurança**. Não basta exibir o widget: a exigência deve estar ligada no Supabase.
Não criar uma Edge Function intermediária para consumir o mesmo token antes do
Auth; a segunda validação falharia por reutilização.

## Publicação e ativação, nesta ordem

1. Concluir PR, CI e revisão humana. Fazer merge não publica automaticamente a
   VPS; seguir o [procedimento de dashboard](../ops/dashboard-vps/README.md).
2. Homologar com projeto Supabase isolado e as chaves oficiais de teste, sem
   dados reais. Verificar token ausente, inválido, expirado e reutilizado contra
   o servidor. Testes de UI/contrato não substituem essas negativas remotas.
3. Configurar **somente a chave pública real** no build do dashboard e `true` no
   flag. Publicar a versão compatível com `/acessar`, `/login` e callbacks.
4. Aplicar a alteração restrita de CSP do modelo HTTPS da VPS: permitir
   `https://challenges.cloudflare.com` em `script-src` e `frame-src`; manter as
   demais restrições. Validar `nginx -t` e o cabeçalho efetivo da resposta HTML.
   O merge não instala o arquivo Nginx na VPS.
5. Conferir o widget por HTTPS e os três modos por e-mail, mobile e tema.
   Até habilitar o backend, o widget é apenas preparação, não proteção completa.
6. Em janela aprovada, inserir a chave secreta correspondente no Supabase Auth,
   selecionar **Cloudflare Turnstile**, habilitar a proteção CAPTCHA e salvar.
   Conferir também outros clientes desse mesmo projeto: a configuração é global.
7. Fazer aceite real controlado de login/cadastro/recuperação, erros e novo token
   após tentativa; conferir que Google continua funcionando e que o isolamento
   e o destino por papel não mudaram. Não criar contas/e-mails reais sem autorização.
8. Registrar versão, data e resultados em STATUS/VALIDATION, sem tokens ou senhas.

Não adicionar `localhost`, IPs locais, domínio raiz ou wildcard ao widget de
produção por conveniência. O autenticador centralizado pertence ao host app.
Netlify previews continuam sem autenticação real, com CAPTCHA desligado.

## Teste local

Usar [preview de dados fictícios](../tests/preview/README.md) com as chaves de
teste oficiais da Cloudflare. A verificação visual usa o serviço Cloudflare,
mas as operações de Auth são simuladas e não alcançam Supabase/produção.
Não tentar vencer um desafio real por automação e não desabilitar proteções para
fazer um teste passar. `pnpm test` cobre contrato de envio e falhas locais;
`pnpm typecheck`, os dois builds sequenciais e scanners cobrem a entrega.

## Recuperação e rollback

Preferir corrigir a chave pública/CSP/hostname e manter a proteção do servidor.
Se a única recuperação aprovada exigir voltar a uma versão sem widget, coordenar
primeiro a política CAPTCHA do Supabase com o responsável: desligá-la reduz a
proteção e requer autorização específica. Não fazê-lo silenciosamente.
Depois restaurar a release e revisar os links públicos conforme
[AUTH_ONBOARDING](AUTH_ONBOARDING.md). Não excluir o widget ou revogar seu segredo
como primeira resposta a uma falha de interface.

## Fontes oficiais consultadas

- [Supabase CAPTCHA](https://supabase.com/docs/guides/auth/auth-captcha).
- [Renderização explícita](https://developers.cloudflare.com/turnstile/get-started/client-side-rendering/).
- [Validação, validade e uso único](https://developers.cloudflare.com/turnstile/get-started/server-side-validation/).
- [CSP](https://developers.cloudflare.com/turnstile/reference/content-security-policy/).
- [Chaves oficiais de teste](https://developers.cloudflare.com/turnstile/troubleshooting/testing/).
