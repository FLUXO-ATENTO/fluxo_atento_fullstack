# Webhooks globais do FLUXO

Webhooks de Meta, Google e provedores de e-mail pertencem à camada global da
plataforma. Um tenant nunca envia credenciais do provedor pelo navegador.

## Contrato operacional

1. O Nginx encaminha somente rotas `/webhooks/<provedor>` à API Node na
   loopback da VPS.
2. A API limita o corpo, valida assinatura e identifica o provedor/conexão.
   Persiste o recebimento numa fila durável com chave idempotente. Somente
   após confirmar essa persistência responde `200`/`204` rapidamente. Se a
   persistência falhar, retorna erro para permitir repetição pelo provedor.
3. O processamento pesado ocorre fora da conexão HTTP, com retries e
   controle de duplicatas. A rotina de fundo grava no Supabase com tenant e provedor
   validados; ela não usa a identidade informada pelo payload como autorização.
4. Falhas de processamento são registradas com identificador de correlação, sem
   corpo de mensagem, token, senha SMTP ou cabeçalho de autorização nos logs.

## Estado desta entrega

O modelo de provedores e conexões está no banco e no painel de superadmin. As
rotas de fornecedores não foram expostas porque ainda não existe um
conector WABA/SMTP operacional e validado nem uma fila/worker instalada.
Elas só serão publicadas após a validação de assinatura específica de cada
provedor e um teste de entrega com evento não sensível.
