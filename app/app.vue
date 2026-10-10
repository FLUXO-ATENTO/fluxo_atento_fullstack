<script setup lang="ts">
import { MotionConfig } from 'motion-v'
</script>
<template>
  <UApp><MotionConfig reduced-motion="user">
    <NuxtRouteAnnouncer />
    <NuxtLoadingIndicator color="#eaa176" />
    <NuxtLayout><NuxtPage /></NuxtLayout>
  </MotionConfig></UApp>
</template>
