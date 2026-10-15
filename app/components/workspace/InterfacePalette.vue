<script setup lang="ts">
import { interfacePalettes, normalizePalette, hexColor, paletteVariables, type PalettePreference } from '~/utils/interface-palette'
const auth = useAuth()
const { effectiveTheme } = useInterfacePreferences()
const groupId = useId()
const saved = computed(() => normalizePalette(auth.user.value?.palette))
const customOpen = ref(saved.value.id === 'custom')
const primary = ref(saved.value.primary || '#5399e8')
const accent = ref(saved.value.accent || '#35b5ad')
const busy = ref(false); const error = ref(''); const notice = ref('')
const customValid = computed(() => Boolean(hexColor(primary.value) && hexColor(accent.value)))
const preview = computed(() => paletteVariables({ id: 'custom', primary: primary.value, accent: accent.value }, effectiveTheme.value))
watch(() => auth.user.value?.id, () => { customOpen.value = saved.value.id === 'custom'; primary.value = saved.value.primary || '#5399e8'; accent.value = saved.value.accent || '#35b5ad'; notice.value = ''; error.value = '' })
async function save(palette: PalettePreference) {
  if (busy.value) return
  error.value = ''; notice.value = ''
  if (palette.id === 'custom' && !customValid.value) { error.value = 'Escolha duas cores válidas, como #5399e8.'; return }
  const accountId = auth.user.value?.id
  busy.value = true
  try {
    await auth.updateProfile({ fluxo_palette: normalizePalette(palette) })
    if (auth.user.value?.id === accountId) { customOpen.value = palette.id === 'custom'; notice.value = 'Paleta salva na sua conta.' }
  } catch { error.value = 'Não conseguimos salvar a paleta. Sua escolha anterior foi mantida. Tente novamente.' }
  finally { busy.value = false }
}
</script>
<template>
  <section class="palette-settings" aria-labelledby="palette-title">
    <h3 id="palette-title">Sua combinação de cores</h3>
    <p class="field-help">Mude as cores do seu painel, sem alterar as de outras pessoas. As opções prontas são salvas ao selecionar.</p>
    <fieldset class="palette-picker" :disabled="busy" aria-describedby="palette-guidance">
      <legend class="sr-only">Paleta do painel</legend>
      <label v-for="option in interfacePalettes" :key="option.id" class="palette-option" :class="{ selected: !customOpen && saved.id === option.id }">
        <input type="radio" :name="groupId" :value="option.id" :checked="!customOpen && saved.id === option.id" @change="save({ id: option.id })">
        <span class="palette-swatches" aria-hidden="true"><i :style="{ background: option.primary }" /><i :style="{ background: option.accent }" /><i class="palette-neutral" /></span>
        <strong>{{ option.name }}</strong><small>{{ option.description }}</small>
      </label>
      <label class="palette-option" :class="{ selected: customOpen }">
        <input type="radio" :name="groupId" value="custom" :checked="customOpen" @change="customOpen = true; error = ''; notice = ''">
        <span class="palette-custom-icon" aria-hidden="true"><UIcon name="i-lucide-palette" /></span><strong>Personalizada</strong><small>Escolha duas cores</small>
      </label>
    </fieldset>
    <form v-if="customOpen" class="palette-custom" @submit.prevent="save({ id: 'custom', primary, accent })">
      <div class="palette-color-fields">
        <div class="field"><label :for="groupId + '-primary'">Cor principal</label><div class="color-input-row"><input :value="hexColor(primary) || '#5399e8'" type="color" aria-label="Escolher cor principal" :disabled="busy" @input="primary = ($event.target as HTMLInputElement).value"><input :id="groupId + '-primary'" v-model="primary" maxlength="7" placeholder="#5399e8" autocomplete="off" spellcheck="false" :disabled="busy" required pattern="#[a-fA-F0-9]{6}"></div></div>
        <div class="field"><label :for="groupId + '-accent'">Cor de destaque</label><div class="color-input-row"><input :value="hexColor(accent) || '#35b5ad'" type="color" aria-label="Escolher cor de destaque" :disabled="busy" @input="accent = ($event.target as HTMLInputElement).value"><input :id="groupId + '-accent'" v-model="accent" maxlength="7" placeholder="#35b5ad" autocomplete="off" spellcheck="false" :disabled="busy" required pattern="#[a-fA-F0-9]{6}"></div></div>
      </div>
      <div class="palette-preview" :style="preview" aria-label="Prévia das cores"><span class="palette-preview-nav"><UIcon name="i-lucide-layout-dashboard" />Seu painel</span><span class="palette-preview-action">Ação principal <UIcon name="i-lucide-arrow-right" /></span><span class="palette-preview-highlight">Destaque</span></div>
      <button class="button button-primary" :disabled="busy || !customValid">{{ busy ? 'Salvando…' : 'Salvar cores personalizadas' }}</button>
      <button type="button" class="button button-secondary" :disabled="busy" @click="save({ id: 'brand' })">Restaurar padrão da marca</button>
    </form>
    <p id="palette-guidance" class="field-help">Claro e escuro continuam independentes. Ajustamos a luminosidade das cores para manter a leitura; alertas de erro e sucesso mantêm suas cores. A marca do site não muda.</p>
    <p v-if="error" role="alert" class="form-error">{{ error }}</p><p v-else-if="notice" role="status" class="live-notice">{{ notice }}</p><p v-else-if="busy" role="status" class="field-help">Salvando sua escolha…</p>
  </section>
</template>
