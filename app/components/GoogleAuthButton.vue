<script setup lang="ts">
const props = withDefaults(defineProps<{ disabled?: boolean; loading?: boolean }>(), { disabled: false, loading: false })
const emit = defineEmits<{ activate: [] }>()

function activate() {
  if (!props.disabled && !props.loading) emit('activate')
}
</script>

<template>
  <button type="button" class="google-auth-button" :disabled="disabled || loading" :aria-busy="loading" @click="activate">
    <!-- Standard-color Google G, required by Google's Sign in with Google branding guidance. -->
    <svg viewBox="0 0 18 18" aria-hidden="true" focusable="false">
      <path fill="#4285f4" d="M17.64 9.205c0-.638-.057-1.252-.164-1.841H9v3.482h4.844a4.14 4.14 0 0 1-1.796 2.715v2.258h2.908c1.703-1.568 2.684-3.874 2.684-6.614Z" />
      <path fill="#34a853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.258c-.806.54-1.837.859-3.048.859-2.344 0-4.328-1.585-5.036-3.71H.957v2.332A9 9 0 0 0 9 18Z" />
      <path fill="#fbbc05" d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A9 9 0 0 0 0 9c0 1.453.348 2.83.957 4.042l3.007-2.332Z" />
      <path fill="#ea4335" d="M9 3.58c1.322 0 2.508.455 3.44 1.346l2.58-2.58C13.463.89 11.43 0 9 0A9 9 0 0 0 .957 4.958L3.964 7.29C4.672 5.165 6.656 3.58 9 3.58Z" />
    </svg>
    <span>{{ loading ? 'Conectando ao Google…' : 'Continuar com o Google' }}</span>
  </button>
</template>

<style scoped>
.google-auth-button { display:inline-flex;align-items:center;justify-content:center;gap:10px;width:100%;min-height:48px;padding:12px;border:1px solid #8e918f;border-radius:6px;background:#131314;color:#e3e3e3;font-family:'Google Sans',Roboto,Arial,sans-serif;font-size:14px;font-weight:500;line-height:20px;transition:background .15s,border-color .15s; }
.google-auth-button:hover:not(:disabled) { background:#1f1f1f; }
.google-auth-button:focus-visible { outline:2px solid var(--brand);outline-offset:3px; }
.google-auth-button:disabled { opacity:.6; }
.google-auth-button svg { width:18px;height:18px; }
:global(html[data-interface-theme="light"]) .google-auth-button { border-color:#747775;background:#fff;color:#1f1f1f; }
:global(html[data-interface-theme="light"]) .google-auth-button:hover:not(:disabled) { background:#f8fafd; }
</style>
