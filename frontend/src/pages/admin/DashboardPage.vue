<template>
  <q-page padding>
    <h2 class="q-mb-xl" style="margin-top: 0">{{ t('admin.dashboard') }}</h2>

    <div class="row q-col-gutter-lg">
      <div class="col-12 col-sm-4">
        <q-card class="stat-card" flat>
          <q-card-section class="text-center q-pa-lg">
            <div class="stat-value">{{ locations.length }}</div>
            <div class="stat-label q-mt-sm">{{ t('admin.totalLocations') }}</div>
          </q-card-section>
        </q-card>
      </div>
      <div class="col-12 col-sm-4">
        <q-card class="stat-card" flat>
          <q-card-section class="text-center q-pa-lg">
            <div class="stat-value">{{ photos.length }}</div>
            <div class="stat-label q-mt-sm">{{ t('admin.totalPhotos') }}</div>
          </q-card-section>
        </q-card>
      </div>
      <div class="col-12 col-sm-4">
        <q-card class="stat-card" flat>
          <q-card-section class="text-center q-pa-lg">
            <div class="stat-value">{{ ungroupedCount }}</div>
            <div class="stat-label q-mt-sm">{{ t('admin.ungrouped') }}</div>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <div class="row q-mt-xl q-col-gutter-md">
      <div class="col-12 col-sm-4">
        <q-btn
          unelevated no-caps
          icon="add_photo_alternate"
          :label="t('admin.uploadPhotos')"
          to="/admin/photos"
          class="full-width q-py-sm btn-accent"
        />
      </div>
      <div class="col-12 col-sm-4">
        <q-btn
          unelevated no-caps
          icon="auto_awesome"
          :label="t('admin.autoGroup')"
          :loading="grouping"
          class="full-width q-py-sm btn-outline"
          @click="handleAutoGroup"
        />
      </div>
      <div class="col-12 col-sm-4">
        <q-btn
          unelevated no-caps
          icon="pin_drop"
          label="Fill titles"
          :loading="fillingTitles"
          class="full-width q-py-sm btn-outline"
          @click="handleFillTitles"
        />
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useQuasar } from 'quasar';
import { adminApi, type LocationDto, type PhotoDto } from 'src/services/api.service';

const { t } = useI18n();
const $q = useQuasar();

const locations = ref<LocationDto[]>([]);
const photos = ref<PhotoDto[]>([]);
const grouping = ref<boolean>(false);
const fillingTitles = ref<boolean>(false);

const ungroupedCount = computed<number>(() =>
  photos.value.filter((p: PhotoDto) => !p.location).length,
);

async function handleAutoGroup(): Promise<void> {
  grouping.value = true;
  try {
    const result = await adminApi.autoGroup();
    $q.notify({
      type: 'positive',
      message: `Created ${result.locationsCreated} locations, grouped ${result.photosGrouped} photos`,
    });
    await loadData();
  } catch {
    $q.notify({ type: 'negative', message: 'Auto group failed' });
  } finally {
    grouping.value = false;
  }
}

async function handleFillTitles(): Promise<void> {
  fillingTitles.value = true;
  try {
    const result = await adminApi.fillTitles();
    $q.notify({
      type: 'positive',
      message: `Filled ${result.filled} location title(s) from geocoding`,
    });
    await loadData();
  } catch {
    $q.notify({ type: 'negative', message: 'Fill titles failed' });
  } finally {
    fillingTitles.value = false;
  }
}

async function loadData(): Promise<void> {
  [locations.value, photos.value] = await Promise.all([
    adminApi.getLocations(),
    adminApi.getPhotos(),
  ]);
}

onMounted(() => loadData());
</script>
