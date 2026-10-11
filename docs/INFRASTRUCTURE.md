# Estrutura e inventário operacional do FLUXO

Revisão: 10/10/2026 (America/Sao_Paulo; algumas evidências usam 11/10 UTC).
Inventário documental, não varredura completa nem garantia de saúde permanente.
Fonte: código/configuração do repositório, consultas da VPS nesta tarefa e saída
Nginx fornecida pelo responsável. Revalidar antes de qualquer intervenção.

## Destinos e ativos — além do dashboard

| Ativo | Destino/localização | Evidência e limite | Responsável por função |
| --- | --- | --- | --- |
| Site e www | Netlify, fluxoatento.com.br; build dist | Configuração do repo e painel fornecido; novo deploy não executado nesta revisão | Frontend + responsável Netlify |
| Dashboard/Super Admin | app.fluxoatento.com.br, Nginx na VPS | App anterior publicado; nova interface somente no PR | Frontend + VPS |
| API FLUXO /v1 | api.fluxoatento.com.br → 127.0.0.1:8100, serviço fluxo-monitor | Serviço ativo e checkout 882ba47 observado; endpoints novos deste PR ainda não publicados | Backend + VPS |
| API/serviço legado | Demais rotas de api.fluxoatento.com.br → 127.0.0.1:8000; código em /opt/fluxo-atento | Proxy e diretório informados; serviço exato, processo e saúde não recertificados nesta revisão | Responsável legado, a confirmar |
| Serviço flow | flow.fluxoatento.com.br → 127.0.0.1:5678 | Proxy no Nginx fornecido; aplicação, volumes e saúde precisam inventário próprio. A porta sozinha não comprova n8n | Responsável de automações, a confirmar |
| Serviço infra | infra.fluxoatento.com.br → https://127.0.0.1:9443 | Proxy no Nginx fornecido; aplicação, volumes e saúde não confirmados. Não inferir produto só pela porta | Responsável de infraestrutura, a confirmar |
| Auth/Postgres/RLS | Supabase qbfmebpzxnzdpalmgtxr, fora da VPS | Migrações e isolamento consultados/testados; detalhes em STATUS | Banco/Auth |
| DNS/TLS | DNS administrado na Netlify conforme painel fornecido; app TLS na VPS | Não revalidado como inventário DNS completo; não alterar api/flow/infra ao publicar app | Responsável de domínio + VPS |

Servidor informado/inspecionado: **srv1987738**, IPv4 **2.25.230.180**, Hostinger,
Ubuntu 24.04. Banner fornecido sinalizou atualizações e restart pendentes; isso
não é autorização para upgrade/reboot e não comprova que continuam pendentes.

## Onde está cada coisa na VPS

| Caminho/serviço | Finalidade | Regra |
| --- | --- | --- |
| /srv/fluxo-atento-dashboard/repository | Checkout de frontend | Contém dist não rastreado observado; preservar, não resetar |
| /srv/fluxo-atento-dashboard/releases | Releases estáticas | Preservar anterior utilizável, HTML e CSP juntos |
| /srv/fluxo-atento-dashboard/current | Symlink da release servida | Consultar destino antes de trocar; nome de release é variável |
| /etc/fluxo-atento/dashboard-build.env | Configuração pública de build | Root/0600; sem chave administrativa |
| /opt/fluxo-atento-monitor | Checkout da API deste projeto | Processo separado do legado |
| /etc/fluxo-atento/monitor.env | Segredos da API | Root/0600, fora do Git; não imprimir conteúdo |
| fluxo-monitor.service | Node em loopback 8100, usuário fluxo-monitor | Consultar FragmentPath efetivo; template em ops/fluxo-monitor.service |
| /etc/nginx/sites-available/fluxo-atento-dashboard | Virtual host app observado | Conferir symlink habilitado; não criar bloco duplicado |
| /etc/letsencrypt/live/app.fluxoatento.com.br/ | Certificado do app | Apenas referências; nunca copiar private key para Git |
| journald | Stdout/stderr da API | Consulta filtrada e sanitizada; retenção global ainda precisa validação |
| /opt/fluxo-atento | Aplicação legada independente | Fora do escopo de alterações deste repositório |

Contêineres, volumes, agentes legados, snapshots Hostinger, cron, workers, regras
de firewall e backups **não estão integralmente inventariados**. A tarefa
FLUXO-03 exige levantamento somente leitura e aprovação antes de mudanças.
Nenhum worker de webhook, SMTP/WABA operacional ou agente autônomo VPS foi
instalado por este PR.

## Estrutura no repositório

| Local | Conteúdo | Função dona |
| --- | --- | --- |
| app/pages, layouts, components, composables | Site, demo, login, painel tenant e Super Admin | Frontend |
| app/data | Cenários de demonstração, módulos e oferta proposta | Frontend + produto |
| services/monitor-api | HTTP Node, autenticação/autorização, armazenamento Supabase e verificações | Backend |
| supabase/migrations | Histórico versionado de schema, RLS e funções | Banco/Auth |
| ops e scripts | Modelos systemd/Nginx, build, publicação, rollback e contratos futuros | VPS + backend |
| tests/unit, tests/e2e, tests/dashboard, tests/database | Contratos, navegação e isolamento | QA + desenvolvimento |
| .github/workflows | CI; não é prova de deploy VPS | Desenvolvimento |
| AGENTS.md e .github/agents | Regras/perfis para trabalho solicitado | Responsável + desenvolvimento |
| docs e VALIDATION.md | Contratos, governança, fatos, pendências e evidências | Todos, conforme mudança |

## Limites de integração

Navegador → Supabase Auth; navegador autenticado → API /v1; API → Supabase via
HTTPS. Não existe driver SQL Node configurado na porta 6543. Netlify hospeda o
site, mas não é o banco nem o local dos segredos da API. A coexistência dessas
camadas não comprova conectores omnichannel ativos.

Para alterar qualquer item: conferir [governança](GOVERNANCE.md),
[especialista VPS](VPS_AGENT.md) e [estado atual](STATUS.md).
