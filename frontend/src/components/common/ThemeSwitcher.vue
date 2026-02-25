<template>
  <q-btn flat dense round :icon="icon" @click="toggleTheme" />
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useQuasar } from 'quasar';
import { useSettingsStore } from 'src/stores/settings.store';

const $q = useQuasar();
const settingsStore = useSettingsStore();

const icon = computed<string>(() => ($q.dark.isActive ? 'light_mode' : 'dark_mode'));

function toggleTheme(): void {
  const newMode: boolean = !$q.dark.isActive;
  $q.dark.set(newMode);
  settingsStore.setDarkMode(newMode);
}
</script>
