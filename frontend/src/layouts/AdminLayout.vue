<template>
  <q-layout view="hHh lpR fFf">
    <q-header class="app-header">
      <q-toolbar>
        <q-btn flat dense icon="arrow_back" to="/" size="sm" />
        <span class="app-title q-ml-sm">{{ t('nav.admin') }}</span>
        <q-space />
        <template v-if="authStore.isAuthenticated">
          <q-btn flat dense no-caps :label="t('admin.dashboard')" to="/admin" exact size="sm" />
          <q-btn flat dense no-caps :label="t('admin.photos')" to="/admin/photos" size="sm" />
          <q-btn flat dense no-caps :label="t('admin.locations')" to="/admin/locations" size="sm" />
          <q-separator vertical inset class="q-mx-sm" style="opacity: 0.2" />
          <q-btn flat dense icon="logout" size="sm" @click="handleLogout" />
        </template>
        <language-switcher />
        <theme-switcher />
      </q-toolbar>
    </q-header>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useAuthStore } from 'src/stores/auth.store';
import LanguageSwitcher from 'src/components/common/LanguageSwitcher.vue';
import ThemeSwitcher from 'src/components/common/ThemeSwitcher.vue';

const { t } = useI18n();
const router = useRouter();
const authStore = useAuthStore();

function handleLogout(): void {
  authStore.logout();
  void router.push({ name: 'admin-login' });
}
</script>
