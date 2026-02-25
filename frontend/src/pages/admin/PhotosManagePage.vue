<template>
  <q-page padding>
    <div class="row items-center justify-between q-mb-lg">
      <h2 style="margin: 0">{{ t('admin.photos') }}</h2>
      <q-btn
        unelevated no-caps
        icon="add_photo_alternate"
        :label="t('admin.upload')"
        class="btn-accent"
        @click="triggerUpload"
      />
    </div>

    <input
      ref="fileInput"
      type="file"
      multiple
      accept="image/*,video/*,.heic,.heif"
      style="display: none"
      @change="handleFileSelect"
    />

    <div
      class="upload-zone q-mb-lg"
      @click="triggerUpload"
      @dragover.prevent
      @drop.prevent="handleDrop"
    >
      <q-icon name="cloud_upload" size="36px" style="color: var(--text-caption)" />
      <div class="q-mt-sm text-upper">Drop files here</div>
      <div class="text-caption q-mt-xs" style="color: var(--text-caption)">JPG, HEIC, MOV</div>
    </div>

    <q-linear-progress v-if="uploading" indeterminate color="primary" class="q-mb-lg" />

    <q-select
      v-model="selectedLocation"
      :options="locationOptions"
      :label="t('admin.locations')"
      emit-value map-options clearable filled dense
      class="q-mb-lg"
      style="max-width: 360px"
    />

    <div v-if="photos.length > 0" class="photo-grid">
      <div v-for="photo in photos" :key="photo.id" class="photo-card-item">
        <img :src="thumbnailUrl(photo.id)" :alt="photo.originalFilename" loading="lazy" />

        <div class="photo-actions-overlay">
          <q-btn flat round dense size="sm" icon="rotate_right" color="white"
            :loading="rotatingId === photo.id" @click.stop="handleRotate(photo.id)">
            <q-tooltip>Rotate 90°</q-tooltip>
          </q-btn>
          <q-btn flat round dense size="sm" icon="delete" color="white" @click.stop="handleDelete(photo.id)">
            <q-tooltip>Delete</q-tooltip>
          </q-btn>
        </div>

        <div class="q-pa-sm">
          <div class="text-caption ellipsis" style="color: var(--text)">{{ photo.originalFilename }}</div>
          <q-select
            :model-value="photo.location || null"
            :options="moveOptions"
            emit-value map-options dense borderless
            class="q-mt-xs"
            style="font-size: 11px"
            :label="photo.location ? '' : 'Move to...'"
            @update:model-value="(val: string | null) => handleMove(photo.id, val)"
          />
        </div>
      </div>
    </div>

    <div v-else class="text-center q-py-xl" style="color: var(--text-caption)">
      {{ t('location.noPhotos') }}
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useQuasar } from 'quasar';
import { adminApi, clientApi, type LocationDto, type PhotoDto } from 'src/services/api.service';

const { t } = useI18n();
const $q = useQuasar();

const fileInput = ref<HTMLInputElement>();
const photos = ref<PhotoDto[]>([]);
const locations = ref<LocationDto[]>([]);
const selectedLocation = ref<string | null>(null);
const uploading = ref<boolean>(false);
const rotatingId = ref<string | null>(null);

const locationOptions = computed(() => [
  { label: t('admin.ungrouped'), value: '__ungrouped__' },
  ...locations.value.map((loc: LocationDto) => ({
    label: loc.titleRu || loc.titleEn || loc.id.slice(0, 8),
    value: loc.id,
  })),
]);

const moveOptions = computed(() => [
  { label: '— None —', value: null },
  ...locations.value.map((loc: LocationDto) => ({
    label: loc.titleRu || loc.titleEn || loc.id.slice(0, 8),
    value: loc.id,
  })),
]);

function thumbnailUrl(photoId: string): string {
  return clientApi.getThumbnailUrl(photoId) + '?t=' + Date.now();
}

function triggerUpload(): void { fileInput.value?.click(); }

async function handleDrop(event: DragEvent): Promise<void> {
  const files: File[] = Array.from(event.dataTransfer?.files || []);
  if (files.length) await uploadFiles(files);
}

async function handleFileSelect(event: Event): Promise<void> {
  const input = event.target as HTMLInputElement;
  if (!input.files?.length) return;
  await uploadFiles(Array.from(input.files));
  input.value = '';
}

async function uploadFiles(files: File[]): Promise<void> {
  uploading.value = true;
  try {
    await adminApi.uploadPhotos(files);
    $q.notify({ type: 'positive', message: `Uploaded ${files.length} files` });
    await loadPhotos();
  } catch {
    $q.notify({ type: 'negative', message: 'Upload failed' });
  } finally {
    uploading.value = false;
  }
}

async function handleRotate(id: string): Promise<void> {
  rotatingId.value = id;
  try {
    await adminApi.rotatePhoto(id, 90);
    const idx: number = photos.value.findIndex((p: PhotoDto) => p.id === id);
    if (idx >= 0) photos.value[idx] = { ...photos.value[idx] };
  } catch {
    $q.notify({ type: 'negative', message: 'Rotate failed' });
  } finally {
    rotatingId.value = null;
  }
}

async function handleMove(photoId: string, locationId: string | null): Promise<void> {
  try {
    await adminApi.movePhoto(photoId, locationId);
    await loadPhotos();
  } catch {
    $q.notify({ type: 'negative', message: 'Move failed' });
  }
}

async function handleDelete(id: string): Promise<void> {
  $q.dialog({ title: 'Delete photo?', message: 'This cannot be undone.', cancel: true })
    .onOk(async () => {
      try { await adminApi.deletePhoto(id); await loadPhotos(); }
      catch { $q.notify({ type: 'negative', message: 'Delete failed' }); }
    });
}

async function loadPhotos(): Promise<void> {
  const locationId: string | undefined =
    selectedLocation.value === '__ungrouped__' ? undefined : selectedLocation.value || undefined;
  photos.value = await adminApi.getPhotos(locationId);
  if (selectedLocation.value === '__ungrouped__')
    photos.value = photos.value.filter((p: PhotoDto) => !p.location);
}

watch(selectedLocation, () => loadPhotos());

onMounted(async () => {
  locations.value = await adminApi.getLocations();
  await loadPhotos();
});
</script>
