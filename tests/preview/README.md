# Preview isolado da interface

Este ambiente usa somente dados fictícios. Não conecta Supabase, não envia convites, não executa IA, não altera a VPS e não comprova autenticação real.

No PowerShell, a partir da raiz do repositório:

```powershell
$env:NUXT_PUBLIC_APP_MODE = 'dashboard'
pnpm dev tests/preview --host 127.0.0.1 --port 4174
```

Abra `http://127.0.0.1:4174/login`. Use `qa@example.test` e uma senha fictícia para o perfil Superadmin; `tenant@example.test` para testar um usuário sem acesso global. Não use credenciais reais. As mutações da API de preview são rejeitadas; somente preferências fictícias do perfil são guardadas na sessão local.

A configuração de produção não importa este diretório. O banner permanente identifica o ambiente. Validar nesta camada: disposição, teclado, busca, tema, tour, ajuda e navegação. Validar separadamente em homologação: autenticação, autorização real, convites, persistência no Supabase e isolamento entre duas empresas.
