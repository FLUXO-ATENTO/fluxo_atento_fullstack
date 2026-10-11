# Publicação e rollback do dashboard na VPS

O app é estático: Nginx serve app.fluxoatento.com.br; a API Node usa o serviço separado fluxo-monitor. Não alterar os sites api, flow, infra nem o agente legado como efeito colateral de publicar o frontend.

## Estado e pré-requisitos

A configuração existente já possui HTTPS. Esta revisão prepara os scripts para a próxima publicação, mas não os executa na VPS. Preservar o ambiente cadastrado pelo responsável; não criar um .env vazio sobre um arquivo existente.

- Checkout e referência Git explicitamente revisados.
- Node 22+, pnpm, git, rsync, nginx, systemd e flock existentes.
- /etc/fluxo-atento/dashboard-build.env: root, 0600, apenas variáveis públicas.
- /etc/fluxo-atento/monitor.env: segredos de servidor, fora do build e do Git.
- Projeto Supabase esperado: qbfmebpzxnzdpalmgtxr.
- Versão anterior do frontend e backup da configuração Nginx disponíveis.

O checkout atual da VPS contém um diretório dist não rastreado. O novo script recusa alterações locais; preservar esse conteúdo e usar um checkout/worktree limpo. Não executar reset --hard ou apagar os arquivos para contornar a proteção.

## Sequência para a próxima publicação

1. Registrar commit aprovado, release atual e estado da API.
2. Gerar o dashboard em checkout limpo com o ambiente público existente.
3. Confirmar dist-dashboard/index.html e dist-dashboard/.nginx-headers.conf.
4. O arquivo .nginx-headers.conf contém hashes dos scripts inline desta build.
   Não copiar hashes de outra versão nem habilitar unsafe-inline para scripts.
5. Na primeira migração para o novo modelo de CSP, preparar também o arquivo
   de cabeçalhos da release anterior com scripts/dashboard-security.mjs,
   para permitir rollback. O helper writeDashboardHeaders recebe o diretório.
6. Conferir o arquivo Nginx realmente habilitado com readlink/nginx -T. Na VPS
   inspecionada ele é fluxo-atento-dashboard; não criar um segundo virtual host
   fluxo-atento-app para o mesmo domínio.
7. Fazer backup desse arquivo antes de adotar nginx-app-https.conf. O include
   aponta para current/.nginx-headers.conf; a release ativa precisa conter o
   arquivo antes de instalar/recarregar a configuração.
8. Publicar via deploy-static-dashboard.sh a referência aprovada, usando
   REF com o SHA completo de 40 caracteres e REPOSITORY_DIR para o checkout
   limpo (clone ou worktree). Não usar nome de branch mutável. O script testa,
   gera a build, prepara
   staging legível pelo Nginx e troca o symlink. Recusa execução concorrente.
9. Executar nginx -t e recarregar. Em falha, restaurar o symlink/configuração
   anterior. Validar HTTPS, CSP, login e a revisão do frontend.
10. A API é uma implantação separada: preservar env/usuário dedicado, testar
    arquivos de servidor, reiniciar somente fluxo-monitor e validar saúde,
    401 sem token, permissão administrativa e consulta de contatos.

A atualização da API não deve ficar implícita no deploy estático. Publicar só
o frontend novo contra API antiga deixa as novas funções indisponíveis.

## Testes após publicação

- /login com sessão de Super Admin abre /admin.
- Conta comum não acessa rotas administrativas, inclusive por HTTP direto.
- Retorno site/app preserva sessão válida; Sair realmente encerra acesso.
- Seleção de tenant mostra apenas o contexto escolhido.
- Contato pode ser cadastrado/consultado, com teste sintético autorizado.
- Chrome não aponta violações CSP de scripts nem erro de inicialização Nuxt.
- Nenhum segredo aparece nos arquivos estáticos ou nos logs.

## Rollback

rollback-static-dashboard.sh recebe uma release existente e valida se fica
dentro do diretório de releases. HTML e .nginx-headers.conf voltam juntos.
Deploy e rollback usam o mesmo lock para impedir execução concorrente.
Não apagar releases anteriores durante a implantação.

Para a API, restaurar a revisão anterior preservada e reiniciar somente seu
serviço. As migrações desta entrega são aditivas; não derrubar tabelas de
contatos/mensagens como rollback de frontend. Mudanças destrutivas no banco
exigem plano e aprovação próprios.

## Limite de garantia

HTTP 200 prova disponibilidade da rota, não uma integração WABA/SMTP ativa.
Nenhum conector deve ser declarado funcional sem teste real autorizado de
envio, recebimento, persistência, duplicatas e isolamento.
