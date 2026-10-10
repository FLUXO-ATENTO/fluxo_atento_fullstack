<script setup lang="ts">
import { ArrowUpRight, RotateCcw, ShieldCheck, MessageSquare, FileCheck2, ShoppingBag, Radar } from '@lucide/vue'
import type { ProductModule } from '~/types/modules'
const props = defineProps<{ module: ProductModule; compact?: boolean; dashboard?: boolean }>()
const icons = { recuperaia: RotateCcw, adsguard: ShieldCheck, atendescore: MessageSquare, contratovivo: FileCheck2, compracerta: ShoppingBag, leadradar: Radar }
const href = computed(() => props.dashboard ? '/dashboard/modulos/' + props.module.id : props.module.route)
</script>
<template>
  <NuxtLink :to="href" class="platform-module-card">
    <div class="module-card-top"><span class="feature-icon"><component :is="icons[module.id]" :size="21" /></span><span class="badge-initial">Fase inicial</span></div>
    <h3>{{ module.name }}</h3><p>{{ module.shortDescription }}</p>
    <span class="module-card-bottom">Conhecer a proposta <ArrowUpRight :size="17" /></span>
  </NuxtLink>
</template>
