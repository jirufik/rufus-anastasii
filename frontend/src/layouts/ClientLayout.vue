<template>
  <q-layout view="hHh lpR fFf">
    <q-header class="app-header">
      <q-toolbar>
        <q-btn flat dense to="/" no-caps class="q-mr-sm">
          <span class="app-title">{{ t('app.title') }}</span>
        </q-btn>
        <q-space />
        <language-switcher />
        <theme-switcher />
        <q-btn flat dense icon="settings" to="/admin" size="sm" />
      </q-toolbar>
    </q-header>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import LanguageSwitcher from 'src/components/common/LanguageSwitcher.vue';
import ThemeSwitcher from 'src/components/common/ThemeSwitcher.vue';

const { t } = useI18n();
</script>
