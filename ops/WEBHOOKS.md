# Webhooks globais do FLUXO

Webhooks de Meta, Google e provedores de e-mail pertencem à camada global da
plataforma. Um tenant nunca envia credenciais do provedor pelo navegador.

## Contrato operacional

1. O Nginx encaminha somente rotas `/webhooks/<provedor>` à API Node na
   loopback da VPS.
2. A API limita tamanho do corpo, verifica assinatura usando o segredo privado
   referenciado pelo provedor global e responde `200`/`204` imediatamente.
3. Depois da resposta, o identificador idempotente é colocado na fila de
   processamento. A rotina de fundo grava no Supabase com tenant e provedor
   validados; ela não usa a identidade informada pelo payload como autorização.
4. Falhas de processamento são registradas com identificador de correlação, sem
   corpo de mensagem, token, senha SMTP ou cabeçalho de autorização nos logs.

## Estado desta entrega

O modelo de provedores e conexões está no banco e no painel de superadmin. As
rotas de fornecedores não foram expostas porque ainda não existe uma
credencial WABA/SMTP configurada na VPS nem um contrato assinado de webhook.
Elas só serão publicadas após a validação de assinatura específica de cada
provedor e um teste de entrega com evento não sensível.
