# Identidade, acesso e primeiros passos

Atualização após merge em 15/10: interface publicada na VPS, botão Google
habilitado e sessão existente preservada. A entrada guiada abriu, pausou e
continuou para `/admin` com a conta proprietária já autenticada. O site continua
no modo compatível `login`; nova troca Google em HTTPS e duas contas ainda
precisam de aceite. Evidência e incidente de publicação corrigido em
[DEPLOYMENT_2026-10-15](DEPLOYMENT_2026-10-15.md). Os relatos locais abaixo
permanecem históricos; não representam novos testes de OAuth em produção.

| Endereço | Finalidade |
| --- | --- |
| https://app.fluxoatento.com.br/acessar | Entrada comum publicada; orientação de cinco segundos e pausa |
| https://app.fluxoatento.com.br/login | Autenticador único |
| https://app.fluxoatento.com.br/admin | Administração global, somente conta proprietária autorizada |
| https://app.fluxoatento.com.br/ | Espaço privado da empresa |
| https://fluxoatento.com.br/exemplo | Demonstração pública sem dados reais |

Senhas pertencem a usuários, não a tenants. Não há senha universal de admin.
A conta proprietária representa o superadmin Fluxo Atento. Pode existir também
um tenant piloto Fluxo Atento; usar conta comum separada para testes de cliente.

## Fluxo no código desta revisão

Site, `/agente` e `/docs` usam o mesmo helper de entrada no host do app.
Por compatibilidade com o dashboard publicado, o padrão é `/login/` e destino
inicial `/`, inclusive para links de novos módulos ainda ausentes na VPS.
Após aceite da nova versão, `NUXT_PUBLIC_DASHBOARD_ENTRY_MODE=guided` no build
público ativa `/acessar` com os destinos específicos. No dashboard desta revisão,
a entrada guiada já é local e independe dessa opção do site. Essa página explica o
próximo passo por cinco segundos visíveis, permite continuar imediatamente ou
pausar para leitura. Se já há sessão no app, não pede outra senha. Só aceita
destinos locais permitidos; origem é um rótulo fechado, nunca um endereço de
retorno arbitrário. Não transfere tokens entre subdomínios. `/exemplo` continua
público e não é redirecionado ao login.

1. Supabase autentica por e-mail/senha ou provedor habilitado. O cadastro recebe
   nome; login social aproveita os dados disponíveis, sem prometer dados completos.
2. Nome normalizado alimenta perfil e “Olá”. Sem nome, mostrar “Boas-vindas” e
   orientar completar o perfil, sem chamar qualquer usuário de administrador.
3. API valida identidade, consulta associações e papel global. A rotina existente
   provisiona espaço pessoal idempotente se não houver associação. O nome inicial
   ainda é “Meu espaço”; não inferir razão social do nome da pessoa.
4. Destino padrão: /admin para papel global confirmado, / para empresa.
   Retornos locais válidos são preservados; externos e tokens em URLs rejeitados.
5. Sessão é persistida pelo SDK. Troca de identidade/logout limpa dados visíveis.
6. Painel da empresa não tem alternância nem busca de links para superadmin.
   A autorização real continua no backend mesmo para acesso direto à URL.

Tour de três passos é introdutório e reabrível. Quatro etapas de negócio só são
concluídas por evidência real. Templates, módulos e quotas ainda dependem do serviço
de permissões; a existência de menus não implementa essa regra.

A paleta pessoal (marca, Oceano, Botânico, Violeta ou duas cores personalizadas)
fica nos metadados de apresentação da conta. Ela não muda direitos, alertas
semânticos, identidade do site ou preferências de outro usuário. Claro/escuro/
sistema é uma preferência de aparência deste navegador e host. O padrão do
produto é **Escuro**, inclusive no site, entrada guiada, login, recuperação,
callback, painel da empresa e Superadmin. O modo do dispositivo só influencia
a aparência quando a pessoa escolhe **Sistema**. Sem preferência salva, com
valor inválido ou com armazenamento bloqueado, manter Escuro. Preservar escolhas
explícitas Claro/Sistema já salvas; não apagar preferências para impor a marca.
Não há cookie compartilhado nem sincronização entre hosts nesta correção.

## Proteção contra tentativas automatizadas

O código de proteção por e-mail/cadastro/recuperação usa o widget Turnstile e a
validação do Supabase, conforme [TURNSTILE_SETUP](TURNSTILE_SETUP.md). O código
foi publicado, mas a flag do formulário permanece false e a exigência no
Supabase não foi ativada nesta janela. CAPTCHA não concede papéis nem substitui
OAuth/MFA; código publicado e widget criado não significam proteção ativa.

## Login Google/GitHub

Configuração detalhada, inventário e divisão entre login e dados estão em
[GOOGLE_SETUP](GOOGLE_SETUP.md). O botão de login e a liberação do provedor de
dados no superadmin são independentes.

Na primeira inspeção de 15/10, a UI Supabase mostrou Google/GitHub desligados.
Após o proprietário salvar a credencial nova, a releitura confirmou Google
habilitado e GitHub ainda desligado. Email e confirmação de e-mail continuam
ligados; acesso anônimo e vinculação manual continuam desligados. Facebook fica
exclusivamente nas integrações Meta.

Na continuidade, foi criado **Fluxo Atento - Login** no projeto Google adotado
`empirical-envoy-508802-k0`; o ID público e o retorno estão em GOOGLE_SETUP.
O proprietário inseriu o novo segredo diretamente no Supabase e salvou a ativação.
O ID público foi conferido sem revelar o segredo; `Skip nonce checks` e
`Allow users without an email` estão desligados. Isso confirma a configuração
do provedor; a continuidade do aceite real está registrada abaixo.
O template de build da VPS agora explicita `NUXT_PUBLIC_AUTH_PROVIDERS`, vazio
por padrão; ID/segredo não pertencem a esse arquivo público.

Antes do deploy, o login publicado na VPS era anterior e não tinha botão Google.
A publicação posterior habilitou o botão, sem substituir o aceite OAuth HTTPS.
O teste local foi autorizado pelo proprietário, com retorno temporário
exato `http://127.0.0.1:4175/auth/callback`. Não usar wildcard nem confundir esse
teste com deploy ou aceite em HTTPS. O proprietário concluiu o Google: nome,
empresa e papel de responsável foram exibidos; a sessão persistiu após recarga.
Abrir `/admin` mostrou acesso reservado, sem conteúdo de plataforma. Nenhum
papel foi alterado e não houve teste direto de ataque à API. Ao concluir, o
retorno temporário foi removido e a lista voltou aos dois endereços de produção.
Resultado e limites em GOOGLE_SETUP/STATUS; faltam duas contas e aceite HTTPS.

### Publicação em ordem e recuperação do botão Entrar

Em 15/10, `/acessar?next=%2F&origem=site` respondeu 404 Nginx na VPS; `/login/`
abriu o autenticador anterior. Link novo em preview não comprova que seu destino
em produção existe. Não trocar chaves nem adicionar wildcards para corrigir 404.

1. Publicar o site com `NUXT_PUBLIC_DASHBOARD_ENTRY_MODE=login` (padrão), após
   PR/CI/revisão. Validar os botões Entrar, Docs e agente em nova aba/recarga.
2. Publicar a versão aprovada do dashboard. Antes de promovê-la, conferir que o
   artefato contém `acessar/index.html`, `login/index.html` e `auth/callback/index.html`.
3. Testar `/acessar` por HTTPS, os cinco segundos, pausa/continuação, login,
   retorno, recarga e bloqueio por papel. Google exige também o botão habilitado
   no build do dashboard; a configuração do provedor não o publica sozinha.
4. Só então definir `NUXT_PUBLIC_DASHBOARD_ENTRY_MODE=guided` no build Netlify
   do site e reconstruir. O valor é público e aceita apenas `login` ou `guided`.
5. Se precisar reverter o dashboard, primeiro restaurar o modo `login` e
   reconstruir o site. Depois usar a release anterior conforme o procedimento
   de [VPS](../ops/dashboard-vps/README.md), sem alterar Supabase ou DNS.

O modelo Nginx serve rotas estáticas existentes; um fallback genérico para
`index.html` não adiciona páginas ausentes à versão anterior. Não considerar
um HTTP 200 genérico como aceite da nova entrada. O URL novo já compartilhado
passou a abrir após a publicação registrada em DEPLOYMENT_2026-10-15; a correção
anterior dos links, sozinha, não criava a rota em produção.

Código preparado com signInWithOAuth, PKCE, retorno exato /auth/callback e sem
escopos de anúncios ou repositórios. O SDK compartilhado troca o código ao iniciar;
a página não o troca duas vezes. Não copiar tokens do provedor para outro storage.

### Ativação manual e aceite

1. Criar/configurar Google OAuth de login e GitHub OAuth App sob controle do dono.
2. Copiar o callback exibido pelo Supabase no provedor:
   https://<project-ref>.supabase.co/auth/v1/callback.
3. Guardar Client ID/Client Secret somente no painel seguro do provedor Supabase.
4. Site URL no host app e retorno autorizado exato:
   https://app.fluxoatento.com.br/auth/callback. Configurar recuperação separada.
5. Revisar consentimento, domínios, termos, privacidade e público de teste.
6. No ambiente controlado, habilitar NUXT_PUBLIC_AUTH_PROVIDERS=google,github
   (ou apenas o pronto). Isso ativa o botão, não configura o provedor.
7. Testar sucesso, cancelamento, falha, usuário novo/existente, perfil sem nome,
   duas contas, refresh, isolamento e destino por papel antes de publicar.

O conector GitHub de desenvolvimento não é um OAuth App dos clientes.
Supabase OAuth Server é outra função, não necessária para esses logins. Foi visto
habilitado com caminho de consentimento; sua utilidade/rota deve ser auditada.

Não mesclar contas por e-mail informado pelo cliente. Supabase controla vínculos
de identidades verificadas; e-mails diferentes podem gerar usuários diferentes.
Vinculação manual não foi ativada. Testar duas contas reais e MFA antes de clientes.

A suíte [de banco isolado](DATABASE_VALIDATION.md) exercita RLS entre empresas,
negação de promoção pelo navegador e criação concorrente idempotente do tenant.
Ela usa identidades fictícias em PostgreSQL: não substitui cadastro/login reais,
validação de JWT pelo Supabase nem aceite operacional em HTTPS.

Fontes: [Google](https://supabase.com/docs/guides/auth/social-login/auth-google),
[GitHub](https://supabase.com/docs/guides/auth/social-login/auth-github),
[identidades](https://supabase.com/docs/guides/auth/auth-identity-linking).
