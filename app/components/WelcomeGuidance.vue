<script setup lang="ts">
import { motion } from 'motion-v'
import { ArrowRight, Building2, Link2, ShieldCheck } from '@lucide/vue'
const dismissed = useState('welcome-guidance-dismissed', () => false)
const steps = [
  { icon: Building2, title: 'Seu espaço está separado.', text: 'Tudo que você criar pertence ao tenant atual.' },
  { icon: Link2, title: 'Conecte o que faz sentido.', text: 'WhatsApp Business e SMTP usam provedores globais validados.' },
  { icon: ShieldCheck, title: 'Você decide o próximo passo.', text: 'Nada é enviado sem configuração e validação.' }
]
</script>
<template>
  <section v-if="!dismissed" class="welcome-guidance" aria-labelledby="welcome-title">
    <motion.div :initial="{ opacity: 0, y: 16 }" :animate="{ opacity: 1, y: 0 }" :transition="{ duration: 0.45 }">
      <p class="eyebrow">BEM-VINDO AO FLUXO</p><h1 id="welcome-title">Vamos preparar seu primeiro fluxo.</h1>
      <p>Uma orientação rápida para você entender o espaço, as conexões e a próxima ação.</p>
      <ol><li v-for="(step, index) in steps" :key="step.title"><span>{{ String(index + 1).padStart(2, '0') }}</span><component :is="step.icon" :size="18" /><div><strong>{{ step.title }}</strong><p>{{ step.text }}</p></div></li></ol>
      <div class="welcome-actions"><NuxtLink to="/canais" class="button button-primary" @click="dismissed = true">Conhecer conexões <ArrowRight :size="16" /></NuxtLink><button class="text-link" @click="dismissed = true">Ir direto ao painel</button></div>
    </motion.div>
  </section>
</template>
