<template>
  <q-page class="flex flex-center" style="background: var(--bg)">
    <q-card class="login-card" style="min-width: 380px">
      <div class="login-card__header text-center q-pa-xl">
        <div style="font-family: var(--font-serif); font-size: 1.5rem; font-weight: 300; color: var(--bg); letter-spacing: 0.1em; text-transform: uppercase">
          {{ t('nav.login') }}
        </div>
      </div>

      <q-card-section class="q-pa-xl">
        <q-form @submit="handleLogin">
          <q-input
            v-model="username"
            :label="t('auth.username')"
            filled dense
            class="q-mb-lg"
          />
          <q-input
            v-model="password"
            :label="t('auth.password')"
            type="password"
            filled dense
            class="q-mb-lg"
          />
          <div v-if="error" class="text-negative text-caption q-mb-md text-center">
            {{ t('auth.loginError') }}
          </div>
          <q-btn
            type="submit"
            :label="t('auth.loginButton')"
            unelevated no-caps
            class="full-width btn-accent q-py-sm"
            :loading="loading"
          />
        </q-form>
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useAuthStore } from 'src/stores/auth.store';

const { t } = useI18n();
const router = useRouter();
const authStore = useAuthStore();

const username = ref<string>('');
const password = ref<string>('');
const error = ref<boolean>(false);
const loading = ref<boolean>(false);

async function handleLogin(): Promise<void> {
  loading.value = true;
  error.value = false;
  const success: boolean = await authStore.login(username.value, password.value);
  loading.value = false;
  if (success) {
    void router.push({ name: 'admin-dashboard' });
  } else {
    error.value = true;
  }
}
</script>
