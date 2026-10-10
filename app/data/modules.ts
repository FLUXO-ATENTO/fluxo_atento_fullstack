import type { ProductModule } from '~/types/modules'

// Escopos de produto propostos. Nenhum módulo opera serviços externos nesta versão.
export const modules: ProductModule[] = [
  {
    "id": "recuperaia",
    "name": "RecuperaIA",
    "shortDescription": "Retome conversas que ficaram pelo caminho.",
    "category": "Relacionamento",
    "longDescription": "Proposta para preparar retomadas de conversas e orçamentos, sempre com autorização do contato e revisão antes do envio.",
    "minimumPlan": "Essencial",
    "plannedFeatures": [
      "Organizar conversas sem retorno",
      "Preparar rascunhos de mensagens",
      "Revisar antes de enviar"
    ],
    "icon": "",
    "visualColor": "var(--brand)",
    "status": "in_implementation",
    "route": "/modulos/recuperaia",
    "availability": "unavailable"
  },
  {
    "id": "adsguard",
    "name": "AdsGuard",
    "shortDescription": "Veja o que acontece na página do seu anúncio.",
    "category": "Site e anúncios",
    "longDescription": "Proposta para acompanhar alterações e falhas nas páginas indicadas por você. Não gerencia sua verba nem garante resultado de anúncios.",
    "minimumPlan": "Completo",
    "plannedFeatures": [
      "Reunir páginas de campanhas",
      "Comparar mudanças observadas",
      "Conferir falhas e registros de compras"
    ],
    "icon": "",
    "visualColor": "var(--brand)",
    "status": "in_implementation",
    "route": "/modulos/adsguard",
    "availability": "unavailable"
  },
  {
    "id": "atendescore",
    "name": "AtendeScore",
    "shortDescription": "Entenda como andam os atendimentos.",
    "category": "Atendimento",
    "longDescription": "Proposta para organizar conversas e destacar pontos que merecem revisão. Sugestões de inteligência artificial não substituem a avaliação de uma pessoa.",
    "minimumPlan": "Gratuito",
    "plannedFeatures": [
      "Organizar conversas da equipe",
      "Destacar atendimentos para revisão",
      "Sugerir melhorias com contexto"
    ],
    "icon": "",
    "visualColor": "var(--brand)",
    "status": "in_implementation",
    "route": "/modulos/atendescore",
    "availability": "unavailable"
  },
  {
    "id": "contratovivo",
    "name": "ContratoVivo",
    "shortDescription": "Tenha datas e contratos à mão.",
    "category": "Organização",
    "longDescription": "Proposta para organizar documentos e prazos informados pelo seu negócio. Não substitui orientação jurídica nem assina documentos.",
    "minimumPlan": "Completo",
    "plannedFeatures": [
      "Organizar documentos autorizados",
      "Registrar datas importantes",
      "Preparar lembretes de revisão"
    ],
    "icon": "",
    "visualColor": "var(--brand)",
    "status": "in_implementation",
    "route": "/modulos/contratovivo",
    "availability": "unavailable"
  },
  {
    "id": "compracerta",
    "name": "CompraCerta",
    "shortDescription": "Compare cotações antes de decidir.",
    "category": "Compras",
    "longDescription": "Proposta para organizar preço, prazo e condições das cotações que você fornece. Nenhuma compra será feita automaticamente.",
    "minimumPlan": "Completo",
    "plannedFeatures": [
      "Reunir cotações informadas",
      "Comparar preço e prazo",
      "Manter a decisão com você"
    ],
    "icon": "",
    "visualColor": "var(--brand)",
    "status": "in_implementation",
    "route": "/modulos/compracerta",
    "availability": "unavailable"
  },
  {
    "id": "leadradar",
    "name": "LeadRadar",
    "shortDescription": "Organize quem demonstrou interesse.",
    "category": "Contatos",
    "longDescription": "Proposta para reunir interessados que chegaram ao seu site ou WhatsApp com autorização. Não coleta listas de desconhecidos.",
    "minimumPlan": "Gratuito",
    "plannedFeatures": [
      "Organizar contatos autorizados",
      "Registrar o interesse de cada pessoa",
      "Preparar o próximo contato"
    ],
    "icon": "",
    "visualColor": "var(--brand)",
    "status": "in_implementation",
    "route": "/modulos/leadradar",
    "availability": "unavailable"
  }
]

