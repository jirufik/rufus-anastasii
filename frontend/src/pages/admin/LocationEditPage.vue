<template>
  <q-page padding>
    <div v-if="loading" class="flex flex-center" style="min-height: 400px">
      <q-spinner-dots size="40px" color="primary" />
    </div>

    <template v-if="!loading && location">
      <div class="row items-center q-mb-lg">
        <q-btn flat dense icon="arrow_back" size="sm" @click="router.push('/admin/locations')" style="color: var(--text-secondary)" />
        <h2 class="q-ml-sm" style="margin: 0">{{ t('admin.edit') }}</h2>
      </div>

      <!-- Language tabs -->
      <div class="lang-tabs q-mb-md">
        <q-tabs v-model="tab" dense align="left" active-color="primary" indicator-color="primary" no-caps>
          <q-tab name="ru" label="RU" />
          <q-tab name="en" label="EN" />
          <q-tab name="fi" label="FI" />
        </q-tabs>
      </div>

      <q-tab-panels v-model="tab" animated class="q-mb-lg" style="background: transparent">
        <q-tab-panel name="ru" class="q-pa-none">
          <q-input v-model="location.titleRu" :label="t('admin.titleRu')" filled dense class="q-mb-md" />
          <q-input v-model="location.descriptionRu" :label="t('admin.descriptionRu')" filled dense type="textarea" autogrow />
        </q-tab-panel>
        <q-tab-panel name="en" class="q-pa-none">
          <q-input v-model="location.titleEn" :label="t('admin.titleEn')" filled dense class="q-mb-md" />
          <q-input v-model="location.descriptionEn" :label="t('admin.descriptionEn')" filled dense type="textarea" autogrow />
        </q-tab-panel>
        <q-tab-panel name="fi" class="q-pa-none">
          <q-input v-model="location.titleFi" :label="t('admin.titleFi')" filled dense class="q-mb-md" />
          <q-input v-model="location.descriptionFi" :label="t('admin.descriptionFi')" filled dense type="textarea" autogrow />
        </q-tab-panel>
      </q-tab-panels>

      <!-- Coordinates & date -->
      <div class="text-upper q-mb-sm">Coordinates</div>
      <div class="text-caption q-mb-md" style="color: var(--text-caption)">Click on map to set</div>

      <div class="row q-col-gutter-md q-mb-md">
        <div class="col-12 col-sm-4">
          <q-input v-model.number="location.latitude" label="Latitude" filled dense type="number" step="0.0001" />
        </div>
        <div class="col-12 col-sm-4">
          <q-input v-model.number="location.longitude" label="Longitude" filled dense type="number" step="0.0001" />
        </div>
        <div class="col-12 col-sm-4">
          <q-input v-model="location.visitDate" label="Visit date" filled dense type="date" />
        </div>
      </div>

      <div class="map-picker q-mb-xl">
        <leaflet-map :markers="mapMarkers" :center="mapCenter" :zoom="12" @map-click="onMapClick" />
      </div>

      <!-- Photos -->
      <div class="row items-center justify-between q-mb-sm">
        <div class="text-upper">Photos ({{ photos.length }})</div>
        <q-btn flat dense no-caps size="sm" icon="add_photo_alternate" label="Add photos" @click="showPickerDialog = true" style="color: var(--accent)" />
      </div>
      <div class="text-caption q-mb-md" style="color: var(--text-caption)">Click = set cover. Hover = rotate / unbind.</div>

      <div v-if="photos.length > 0" class="photo-grid q-mb-lg">
        <div
          v-for="photo in photos"
          :key="photo.id"
          class="photo-card-item"
          :class="{ 'cover-ring': photo.id === location.coverPhotoId }"
          @click="setCover(photo.id)"
        >
          <img :src="thumbnailUrl(photo.id)" :alt="photo.originalFilename" loading="lazy" />
          <div class="photo-actions-overlay">
            <q-btn flat round dense size="sm" icon="rotate_right" color="white" :loading="rotatingId === photo.id" @click.stop="handleRotate(photo.id)" />
            <q-btn flat round dense size="sm" icon="link_off" color="white" @click.stop="handleUnbind(photo.id)">
              <q-tooltip>Remove from group</q-tooltip>
            </q-btn>
          </div>
          <q-badge v-if="photo.id === location.coverPhotoId" floating style="background: var(--accent); font-size: 10px; letter-spacing: 0.05em">
            COVER
          </q-badge>
        </div>
      </div>
      <div v-else class="q-pa-lg text-center" style="color: var(--text-caption)">
        No photos. <span style="color: var(--accent); cursor: pointer" @click="showPickerDialog = true">Add some.</span>
      </div>

      <q-btn unelevated no-caps :label="t('admin.save')" icon="check" class="q-mt-lg btn-accent q-px-xl q-py-sm" :loading="saving" @click="handleSave" />
    </template>

    <!-- Photo picker -->
    <q-dialog v-model="showPickerDialog" maximized transition-show="slide-up" transition-hide="slide-down">
      <q-card style="background: var(--bg)">
        <q-bar style="background: var(--text); color: var(--bg)">
          <div style="font-family: var(--font-sans); font-size: 0.8rem; letter-spacing: 0.05em; text-transform: uppercase">Add photos</div>
          <q-space />
          <q-btn flat dense round icon="close" size="sm" style="color: var(--bg)" v-close-popup />
        </q-bar>

        <q-card-section>
          <div class="row items-center q-mb-md q-col-gutter-md">
            <div class="col-auto">
              <q-select v-model="pickerFilter" :options="pickerFilterOptions" emit-value map-options filled dense style="min-width: 240px" label="Source" />
            </div>
            <div class="col-auto text-upper">{{ selectedPhotoIds.length }} selected</div>
            <q-space />
            <div class="col-auto">
              <q-btn unelevated no-caps class="btn-accent" :label="`Attach ${selectedPhotoIds.length}`" :disable="selectedPhotoIds.length === 0" :loading="attaching" @click="handleAttachSelected" />
            </div>
          </div>

          <div v-if="availablePhotos.length > 0" class="photo-grid">
            <div
              v-for="photo in availablePhotos"
              :key="photo.id"
              class="photo-card-item"
              :class="{ 'cover-ring': selectedPhotoIds.includes(photo.id) }"
              @click="togglePhotoSelection(photo.id)"
            >
              <img :src="thumbnailUrl(photo.id)" :alt="photo.originalFilename" loading="lazy" />
              <q-icon v-if="selectedPhotoIds.includes(photo.id)" name="check_circle" color="positive" size="20px" class="absolute-top-right q-ma-xs" />
              <div class="q-pa-xs">
                <div class="text-caption ellipsis" style="color: var(--text-secondary)">{{ photo.originalFilename }}</div>
              </div>
            </div>
          </div>
          <div v-else class="text-center q-pa-xl" style="color: var(--text-caption)">No photos in this filter</div>
        </q-card-section>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useQuasar } from 'quasar';
import { adminApi, clientApi, type LocationDto, type PhotoDto } from 'src/services/api.service';
import LeafletMap, { type MapMarker } from 'src/components/map/LeafletMap.vue';
import { useKeyboardNav } from 'src/composables/useKeyboardNav';

const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const $q = useQuasar();

const loading = ref<boolean>(true);
const saving = ref<boolean>(false);
const rotatingId = ref<string | null>(null);
const attaching = ref<boolean>(false);
const tab = ref<string>('ru');
const location = ref<LocationDto | null>(null);
const photos = ref<PhotoDto[]>([]);
const allLocations = ref<LocationDto[]>([]);

const showPickerDialog = ref<boolean>(false);

// Keyboard navigation: Escape to go back (only when dialog is closed)
useKeyboardNav({
  onEscape: () => router.push('/admin/locations'),
  enabled: () => !showPickerDialog.value,
});

const pickerFilter = ref<string>('__ungrouped__');
const allPhotos = ref<PhotoDto[]>([]);
const selectedPhotoIds = ref<string[]>([]);

const locationId = computed<string>(() => route.params.id as string);

const mapCenter = computed<[number, number]>(() =>
  location.value ? [location.value.latitude, location.value.longitude] : [61.5, 24.0],
);

const mapMarkers = computed<MapMarker[]>(() =>
  location.value
    ? [{ id: 'current', latitude: location.value.latitude, longitude: location.value.longitude, title: location.value.titleRu || location.value.titleEn || '' }]
    : [],
);

const pickerFilterOptions = computed(() => [
  { label: 'Ungrouped', value: '__ungrouped__' },
  { label: 'All photos', value: '__all__' },
  ...allLocations.value
    .filter((l: LocationDto) => l.id !== locationId.value)
    .map((l: LocationDto) => ({ label: l.titleRu || l.titleEn || l.id.slice(0, 8), value: l.id })),
]);

const availablePhotos = computed<PhotoDto[]>(() => {
  const ids: Set<string> = new Set(photos.value.map((p: PhotoDto) => p.id));
  if (pickerFilter.value === '__ungrouped__') return allPhotos.value.filter((p: PhotoDto) => !p.location && !ids.has(p.id));
  if (pickerFilter.value === '__all__') return allPhotos.value.filter((p: PhotoDto) => !ids.has(p.id));
  return allPhotos.value.filter((p: PhotoDto) => p.location === pickerFilter.value && !ids.has(p.id));
});

function thumbnailUrl(photoId: string): string {
  return clientApi.getThumbnailUrl(photoId) + '?t=' + Date.now();
}

function setCover(photoId: string): void {
  if (location.value) location.value.coverPhotoId = photoId;
}

function onMapClick(latlng: { lat: number; lng: number }): void {
  if (location.value) {
    location.value.latitude = Math.round(latlng.lat * 10000) / 10000;
    location.value.longitude = Math.round(latlng.lng * 10000) / 10000;
  }
}

function togglePhotoSelection(id: string): void {
  const idx: number = selectedPhotoIds.value.indexOf(id);
  idx >= 0 ? selectedPhotoIds.value.splice(idx, 1) : selectedPhotoIds.value.push(id);
}

async function handleAttachSelected(): Promise<void> {
  attaching.value = true;
  try {
    for (const id of selectedPhotoIds.value) await adminApi.movePhoto(id, locationId.value);
    $q.notify({ type: 'positive', message: `Attached ${selectedPhotoIds.value.length} photo(s)` });
    selectedPhotoIds.value = [];
    showPickerDialog.value = false;
    await reloadPhotos();
  } catch {
    $q.notify({ type: 'negative', message: 'Failed' });
  } finally {
    attaching.value = false;
  }
}

async function handleUnbind(id: string): Promise<void> {
  try { await adminApi.movePhoto(id, null); await reloadPhotos(); }
  catch { $q.notify({ type: 'negative', message: 'Failed' }); }
}

async function handleRotate(id: string): Promise<void> {
  rotatingId.value = id;
  try {
    await adminApi.rotatePhoto(id, 90);
    const idx: number = photos.value.findIndex((p: PhotoDto) => p.id === id);
    if (idx >= 0) photos.value[idx] = { ...photos.value[idx] };
  } catch { $q.notify({ type: 'negative', message: 'Rotate failed' }); }
  finally { rotatingId.value = null; }
}

async function handleSave(): Promise<void> {
  if (!location.value) return;
  saving.value = true;
  try {
    await adminApi.updateLocation(location.value.id, {
      titleRu: location.value.titleRu, titleEn: location.value.titleEn, titleFi: location.value.titleFi,
      descriptionRu: location.value.descriptionRu, descriptionEn: location.value.descriptionEn, descriptionFi: location.value.descriptionFi,
      latitude: location.value.latitude, longitude: location.value.longitude,
      coverPhotoId: location.value.coverPhotoId, visitDate: location.value.visitDate,
    });
    $q.notify({ type: 'positive', message: 'Saved' });
  } catch { $q.notify({ type: 'negative', message: 'Save failed' }); }
  finally { saving.value = false; }
}

async function reloadPhotos(): Promise<void> { photos.value = await adminApi.getPhotos(locationId.value); }

watch(showPickerDialog, async (val: boolean) => {
  if (val) { selectedPhotoIds.value = []; allPhotos.value = await adminApi.getPhotos(); }
});

function toDateInputValue(dateStr?: string | null): string | undefined {
  if (!dateStr) return undefined;
  try {
    const d: Date = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toISOString().slice(0, 10);
  } catch {
    return dateStr;
  }
}

onMounted(async () => {
  try {
    const [locs, locPhotos] = await Promise.all([adminApi.getLocations(), adminApi.getPhotos(locationId.value)]);
    allLocations.value = locs;
    const found: LocationDto | undefined = locs.find((l: LocationDto) => l.id === locationId.value);
    if (found) {
      found.visitDate = toDateInputValue(found.visitDate);
      location.value = found;
    }
    photos.value = locPhotos;
  } finally { loading.value = false; }
});
</script>
