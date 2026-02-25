<template>
  <q-btn-dropdown flat dense no-caps :label="currentLabel" size="sm" style="font-family: var(--font-sans); font-size: 0.7rem; letter-spacing: 0.1em">
    <q-list dense style="min-width: 80px">
      <q-item v-for="lang in languages" :key="lang.value" clickable v-close-popup @click="setLanguage(lang.value)" dense>
        <q-item-section style="font-size: 0.8rem">{{ lang.label }}</q-item-section>
      </q-item>
    </q-list>
  </q-btn-dropdown>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useSettingsStore } from 'src/stores/settings.store';

const { locale } = useI18n();
const settingsStore = useSettingsStore();

const languages = [
  { value: 'ru', label: 'RU' },
  { value: 'en', label: 'EN' },
  { value: 'fi', label: 'FI' },
];

const currentLabel = computed<string>(() => {
  const found = languages.find((l) => l.value === locale.value);
  return found?.label || 'RU';
});

function setLanguage(value: string): void {
  locale.value = value;
  settingsStore.setLocale(value);
}
</script>
