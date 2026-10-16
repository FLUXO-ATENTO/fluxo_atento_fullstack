# Preview isolado da interface

Este ambiente usa somente dados fictícios. Não conecta Supabase, não envia convites, não executa IA, não altera a VPS e não comprova autenticação real.

No PowerShell, a partir da raiz do repositório:

```powershell
$env:NUXT_PUBLIC_APP_MODE = 'dashboard'
pnpm dev tests/preview --host 127.0.0.1 --port 4174
```

Abra `http://127.0.0.1:4174/login`. Use `qa@example.test` para Superadmin sem tenant, `dual@example.test` para Superadmin com vínculo ao tenant e `tenant@example.test` para um usuário sem acesso global; a senha é sempre fictícia. Não use credenciais reais. As mutações da API de preview são rejeitadas; somente preferências fictícias do perfil são guardadas na sessão local.

A configuração de produção não importa este diretório. O banner permanente identifica o ambiente. Validar nesta camada: disposição, teclado, busca, tema, tour, ajuda e navegação. Validar separadamente em homologação: autenticação, autorização real, convites, persistência no Supabase e isolamento entre duas empresas.

O catálogo de planos, regras por tenant, preferência de gateway e conversas de
suporte têm respostas fictícias de leitura neste preview. Envios e alterações
continuam recusados por desenho; testar a gravação nas suítes de API/banco e,
depois, em homologação com dados próprios de teste.

## Turnstile sem conta real

Para conferir o widget, acrescentar antes de iniciar a prévia:

```powershell
$env:NUXT_PUBLIC_TURNSTILE_ENABLED = 'true'
$env:NUXT_PUBLIC_TURNSTILE_SITE_KEY = '1x00000000000000000000AA'
```

Essa é uma chave **pública de teste oficial**, não uma credencial de produção.
O widget faz a verificação visual via Cloudflare; a fixture continua sem conectar
Supabase. Para simular falha, reiniciar a prévia com `2x00000000000000000000AB`.
Não usar contas, senhas ou chaves reais. Conferir o bloqueio/liberação do botão,
troca entre login/cadastro/recuperação, reset depois do envio, tema e retry.
O backend de Auth é simulado: não constitui aceite de validação CAPTCHA remota.
Não configurar as chaves de teste em produção. Detalhes em
[TURNSTILE_SETUP](../../docs/TURNSTILE_SETUP.md).
