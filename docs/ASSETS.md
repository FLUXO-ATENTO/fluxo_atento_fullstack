# Inventário de sistemas e responsabilidades

Registro de 15/10/2026. Estado factual em [STATUS](STATUS.md). Este arquivo guarda
referências operacionais, nunca senhas, tokens ou dados de contas de clientes.

| Ativo | Responsabilidade | Estado / acesso |
| --- | --- | --- |
| fluxoatento.com.br e www | Site Nuxt no Netlify, projeto fluxo-atento | Público; exemplo separado da operação real |
| app.fluxoatento.com.br | Dashboard Nuxt servido na VPS | Privado, HTTPS, login e monitor persistido verificados |
| api.fluxoatento.com.br | API Node de workspace e monitoramento | /v1/health e operação autenticada verificados |
| Supabase do produto | Auth, Postgres, associações e RLS | Base de identidade e persistência; não autoriza integrações automaticamente |
| Agente Python na VPS | IA e ferramentas | Serviço existe; chat do produto ainda não conectado de ponta a ponta |
| docs.fluxoatento.com.br | Documentação pública e futura área restrita | Solicitado; destino, DNS e TLS pendentes. Rota /docs preparada nesta revisão |
| agente.fluxoatento.com.br | Página dedicada ao especialista | Nome confirmado; /agente preparada com acesso comum ao app; DNS/TLS e chat real pendentes |
| flow.fluxoatento.com.br | n8n auto-hospedado | Interface acessada; uso adiado pelo proprietário |
| infra.fluxoatento.com.br | Portainer/Docker | Operação interna; não é uma área de tenant |
| GitHub FLUXO-ATENTO/fluxo_atento_fullstack | Código, decisões, CI e documentação canônica | Repositório oficial; PR, CI, revisão e deploy controlado |
| Google Cloud / fluxo-atento | OAuth do app e APIs Google | 82 serviços listados; detalhes e pendências em GOOGLE_SETUP; não hospeda o agente do produto por decisão atual |

## Distinções importantes

- Netlify fluxo-atento-app é legado, não hospeda o dashboard atual. Não restaurar
  registros NETLIFY conflitantes para app.
- /exemplo contém dados ilustrativos. Entrar leva ao autenticador no app.
- /admin é exclusivo da plataforma; / é o espaço privado da empresa.
  Conhecer o endereço ou alterar o navegador não concede privilégio.
- flow e infra não participam do login dos clientes.
- contato@fluxoatento.com.br é o e-mail público autorizado. Mailto não comprova
  entrega nem SMTP; testar recebimento antes do lançamento.

## Infraestrutura observada sem alterações operacionais

Portainer mostrou n8n, Redis e Portainer em execução e um container antigo do
Portainer parado. Nome contendo “backup” não comprova restauração. Nenhum container
foi reiniciado, excluído ou atualizado.

n8n mostrou workflows pessoais e nenhuma credencial listada para a sessão
consultada. New project estava bloqueado por licença. Não foram criados projeto,
pasta ou assinatura. Uso futuro requer revisão de licença, isolamento, versões,
criptografia, filas, retenção e recuperação.

A sessão do terminal da VPS expirou. Firewall, variáveis privadas, bindings e
restauração ainda exigem inspeção operacional. A UI do Portainer não os comprova.

## Responsabilidade pelos dados

| Dado | Destino / regra |
| --- | --- |
| Identidade e sessão | Supabase Auth; navegador somente com chave publicável |
| Empresas e permissões | Postgres e API autorizada; não user_metadata editável |
| Monitores e observações | Supabase isolado por tenant; verificação na VPS |
| Histórico/jornada/IA | Planejado em Postgres, não somente memória da VPS |
| Anexos privados | Storage privado e URLs temporárias, ainda pendente |
| Cache e filas | Serviços internos com prazo; nunca única cópia do histórico |
| Credenciais | Secret do serviço consumidor; jamais frontend ou Git |

O proprietário aprova custos, acessos e produção. Engenharia propõe mudanças
revisáveis. Operação registra versão, teste, backup e rollback. Superadmin é um
papel do produto, não um terminal arbitrário nem um visualizador de secrets.

Não é necessário outro repositório para site/dashboard agora. Verificar origem e
versionamento do agente externo antes de decidir incorporá-lo ou separá-lo.
