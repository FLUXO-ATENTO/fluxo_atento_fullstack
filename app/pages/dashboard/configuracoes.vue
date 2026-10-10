<script setup lang="ts">
definePageMeta({ layout: 'dashboard' })
useSeoMeta({ title: 'Sua conta · Fluxo Atento', robots: 'noindex, nofollow' })
const { user, signOut } = useAuth()
const error = ref('')
async function exit() { try { await signOut() } catch { error.value = 'Não foi possível sair. Tente novamente.' } }
</script>
<template><div><div class="page-heading"><div><p class="eyebrow">SUA CONTA</p><h1>Você no controle do seu acesso.</h1><p>Os monitores deste espaço pertencem à sua conta individual.</p></div></div><section class="panel"><div class="settings-row"><div><h2>E-mail de acesso</h2><p>{{ user?.email || 'Conferindo sua sessão…' }}</p></div><button class="button button-secondary" @click="exit">Sair da conta</button></div><div class="settings-row"><div><h2>Senha</h2><p>Solicite um link de recuperação pelo seu e-mail.</p></div><NuxtLink to="/login" class="text-link">Recuperar acesso</NuxtLink></div></section><p v-if="error" role="alert" class="form-error">{{ error }}</p><InitialState title="Equipe e permissões: próximo passo." description="Nesta etapa, cada conta possui um espaço individual. Convites, cargos e compartilhamento entre pessoas ainda não estão ativos." :next-steps="['Convites por e-mail', 'Permissões por função', 'Gestão de equipe']" /></div></template>
