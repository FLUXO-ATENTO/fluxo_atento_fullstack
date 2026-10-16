<script setup lang="ts">
import { motion } from 'motion-v'

withDefaults(defineProps<{ to?: string; label?: string }>(), {
  to: undefined,
  label: 'Fale com o agente'
})

defineEmits<{ click: [event: MouseEvent] }>()
</script>

<template>
  <motion.div
    class="agent-support-motion"
    :while-hover="{ y: -1 }"
    :while-tap="{ scale: 0.975, y: 0 }"
    :transition="{ type: 'spring', stiffness: 460, damping: 28 }"
  >
    <UButton
      :to="to"
      :type="to ? undefined : 'button'"
      color="neutral"
      variant="ghost"
      class="agent-support-button"
      :aria-label="label"
      @click="$emit('click', $event)"
    >
      <UIcon name="i-lucide-sparkles" aria-hidden="true" />
      <span class="agent-support-label">{{ label }}</span>
      <span class="agent-support-label-short" aria-hidden="true">Agente</span>
      <UIcon name="i-lucide-arrow-up-right" aria-hidden="true" />
    </UButton>
  </motion.div>
</template>
