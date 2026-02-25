import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useSettingsStore = defineStore(
  'settings',
  () => {
    const locale = ref<string>('ru');
    const darkMode = ref<boolean | 'auto'>('auto');
    const mapProvider = ref<'leaflet' | 'google'>('leaflet');

    function setLocale(value: string): void {
      locale.value = value;
    }

    function setDarkMode(value: boolean | 'auto'): void {
      darkMode.value = value;
    }

    function setMapProvider(value: 'leaflet' | 'google'): void {
      mapProvider.value = value;
    }

    return { locale, darkMode, mapProvider, setLocale, setDarkMode, setMapProvider };
  },
  { persist: true },
);
