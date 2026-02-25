<template>
  <q-page padding>
    <h2 class="q-mb-lg" style="margin-top: 0">{{ t('admin.locations') }}</h2>

    <div v-if="locations.length > 0" class="row q-col-gutter-lg">
      <div v-for="loc in locations" :key="loc.id" class="col-12 col-sm-6 col-md-4">
        <q-card
          class="location-list-card cursor-pointer"
          flat
          @click="router.push(`/admin/locations/${loc.id}`)"
        >
          <q-img
            v-if="loc.coverPhotoId"
            :src="getThumbnailUrl(loc.coverPhotoId)"
            :ratio="16/10"
            style="filter: saturate(0.92)"
          />
          <div v-else class="flex flex-center" style="height: 140px; background: var(--bg-alt)">
            <q-icon name="place" size="40px" style="color: var(--text-caption)" />
          </div>

          <q-card-section>
            <div style="font-family: var(--font-serif); font-size: 1.1rem; font-weight: 500; color: var(--text)">
              {{ getTitle(loc) || 'Unnamed' }}
            </div>
            <div v-if="getDescription(loc)" class="text-caption q-mt-xs" style="color: var(--text-secondary); max-height: 32px; overflow: hidden">
              {{ getDescription(loc) }}
            </div>
            <div class="text-upper q-mt-sm">
              <span v-if="loc.photoCount != null">{{ loc.photoCount }} {{ loc.photoCount === 1 ? 'photo' : 'photos' }}</span>
              <span v-if="loc.visitDate"> · {{ formatDate(loc.visitDate) }}</span>
              <span> · {{ loc.latitude.toFixed(4) }}, {{ loc.longitude.toFixed(4) }}</span>
            </div>
          </q-card-section>

          <q-card-actions align="right" class="q-pt-none">
            <q-btn flat dense no-caps size="sm" label="Edit" :to="`/admin/locations/${loc.id}`" @click.stop style="color: var(--accent)" />
            <q-btn flat dense no-caps size="sm" label="Delete" color="negative" @click.stop="handleDelete(loc.id)" />
          </q-card-actions>
        </q-card>
      </div>
    </div>

    <div v-else class="text-center q-py-xl" style="color: var(--text-caption)">
      No locations yet
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useQuasar } from 'quasar';
import { adminApi, clientApi, type LocationDto } from 'src/services/api.service';
import { useLocaleTitle } from 'src/composables/useLocaleTitle';

const { t } = useI18n();
const $q = useQuasar();
const router = useRouter();
const { getTitle, getDescription, formatDate } = useLocaleTitle();

const locations = ref<LocationDto[]>([]);

function getThumbnailUrl(photoId: string): string {
  return clientApi.getThumbnailUrl(photoId);
}

async function handleDelete(id: string): Promise<void> {
  $q.dialog({ title: 'Delete location?', message: 'Photos will become ungrouped.', cancel: true })
    .onOk(async () => {
      try {
        await adminApi.deleteLocation(id);
        locations.value = locations.value.filter((l: LocationDto) => l.id !== id);
      } catch {
        $q.notify({ type: 'negative', message: 'Delete failed' });
      }
    });
}

onMounted(async () => {
  locations.value = await adminApi.getLocations();
});
</script>
