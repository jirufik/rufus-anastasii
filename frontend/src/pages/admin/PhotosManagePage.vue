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

    <div v-if="uploading" class="q-mb-lg">
      <div class="text-body2 q-mb-xs" style="color: var(--text)">
        {{ uploadStatusText }}
      </div>
      <q-linear-progress
        :value="uploadTotal > 0 ? uploadCurrent / uploadTotal : 0"
        color="primary"
        :indeterminate="uploadCurrent === 0"
      />
    </div>

    <q-select
      v-model="selectedLocation"
      :options="locationOptions"
      :label="t('admin.locations')"
      emit-value map-options clearable filled dense
      class="q-mb-lg"
      style="max-width: 360px"
    />

    <div v-if="photos.length > 0" class="photo-grid">
      <div
        v-for="photo in photos"
        :key="photo.id"
        class="photo-card-item"
        :class="{ 'photo-card-selected': selectedIds.has(photo.id) }"
        @click="handlePhotoClick(photo.id)"
        @pointerdown="startLongPress(photo.id)"
        @pointerup="cancelLongPress"
        @pointerleave="cancelLongPress"
      >
        <div style="position: relative">
          <img :src="thumbnailUrl(photo.id)" :alt="photo.originalFilename" loading="lazy" />

          <q-checkbox
            v-if="selectMode"
            :model-value="selectedIds.has(photo.id)"
            @update:model-value="toggleSelection(photo.id)"
            @click.stop
            color="primary"
            dark
            class="photo-checkbox"
          />
        </div>

        <div v-if="!selectMode" class="photo-actions-overlay">
          <q-btn flat round dense size="sm" icon="rotate_right" color="white"
            :loading="rotatingId === photo.id" @click.stop="handleRotate(photo.id)">
            <q-tooltip>Rotate 90</q-tooltip>
          </q-btn>
          <q-btn flat round dense size="sm" icon="delete" color="white" @click.stop="handleDelete(photo.id)">
            <q-tooltip>Delete</q-tooltip>
          </q-btn>
        </div>

        <div class="q-pa-sm">
          <div class="text-caption ellipsis" style="color: var(--text)">{{ photo.originalFilename }}</div>
          <q-select
            v-if="!selectMode"
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

    <!-- Floating batch actions bar -->
    <q-page-sticky v-if="selectMode" position="bottom" :offset="[0, 18]">
      <q-toolbar class="batch-toolbar shadow-4">
        <span class="text-body2" style="color: var(--text)">
          {{ selectedIds.size }} selected
        </span>
        <q-space />
        <q-btn
          v-if="selectedIds.size > 0"
          flat no-caps
          color="negative"
          icon="delete"
          label="Delete"
          :loading="batchDeleting"
          @click="handleBatchDelete"
        />
        <q-btn
          flat no-caps round
          icon="close"
          style="color: var(--text-secondary)"
          @click="exitSelectMode"
        />
      </q-toolbar>
    </q-page-sticky>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, reactive, onMounted, watch } from 'vue';
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
const uploadCurrent = ref<number>(0);
const uploadTotal = ref<number>(0);
const rotatingId = ref<string | null>(null);
const cacheKey = ref<number>(Date.now());

// Selection mode
const selectMode = ref<boolean>(false);
const selectedIds = reactive<Set<string>>(new Set());
const batchDeleting = ref<boolean>(false);
let longPressTimer: ReturnType<typeof setTimeout> | null = null;

const uploadStatusText = computed((): string => {
  return `Processing ${uploadCurrent.value} / ${uploadTotal.value}`;
});

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
  return clientApi.getThumbnailUrl(photoId) + '?t=' + cacheKey.value;
}

function triggerUpload(): void { fileInput.value?.click(); }

// Long-press to enter selection mode
function startLongPress(id: string): void {
  if (selectMode.value) return;
  longPressTimer = setTimeout(() => {
    selectMode.value = true;
    selectedIds.add(id);
    longPressTimer = null;
  }, 500);
}

function cancelLongPress(): void {
  if (longPressTimer) {
    clearTimeout(longPressTimer);
    longPressTimer = null;
  }
}

function handlePhotoClick(id: string): void {
  if (!selectMode.value) return;
  toggleSelection(id);
}

function exitSelectMode(): void {
  selectMode.value = false;
  selectedIds.clear();
}

function toggleSelection(id: string): void {
  if (selectedIds.has(id)) {
    selectedIds.delete(id);
  } else {
    selectedIds.add(id);
  }
}

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
  uploadCurrent.value = 0;
  uploadTotal.value = files.length;
  let failed = 0;

  const queue: File[] = [...files];
  const CONCURRENCY = 5;

  async function worker(): Promise<void> {
    while (queue.length > 0) {
      const file: File | undefined = queue.shift();
      if (!file) break;
      try {
        await adminApi.uploadPhoto(file);
      } catch {
        failed++;
      }
      uploadCurrent.value++;
      cacheKey.value = Date.now();
      loadPhotos();
    }
  }

  const workers: Promise<void>[] = [];
  for (let i = 0; i < Math.min(CONCURRENCY, files.length); i++) {
    workers.push(worker());
  }
  await Promise.all(workers);

  if (failed > 0) {
    $q.notify({ type: 'warning', message: `Uploaded ${files.length - failed} of ${files.length}, ${failed} failed` });
  } else {
    $q.notify({ type: 'positive', message: `Uploaded ${files.length} files` });
  }

  cacheKey.value = Date.now();
  await loadPhotos();
  uploading.value = false;
}

async function handleRotate(id: string): Promise<void> {
  rotatingId.value = id;
  try {
    await adminApi.rotatePhoto(id, 90);
    cacheKey.value = Date.now();
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

function themedDialog(opts: { title: string; message: string }): ReturnType<typeof $q.dialog> {
  return $q.dialog({
    title: opts.title,
    message: opts.message,
    cancel: { flat: true, noCaps: true, label: 'Cancel', color: 'grey' },
    ok: { flat: true, noCaps: true, label: 'Delete', color: 'negative' },
    class: $q.dark.isActive ? 'themed-dialog-dark' : 'themed-dialog-light',
  });
}

async function handleDelete(id: string): Promise<void> {
  themedDialog({ title: 'Delete photo?', message: 'This cannot be undone.' })
    .onOk(async () => {
      try { await adminApi.deletePhoto(id); await loadPhotos(); }
      catch { $q.notify({ type: 'negative', message: 'Delete failed' }); }
    });
}

async function handleBatchDelete(): Promise<void> {
  const ids: string[] = Array.from(selectedIds);
  themedDialog({
    title: `Delete ${ids.length} photos?`,
    message: 'This cannot be undone.',
  }).onOk(async () => {
    batchDeleting.value = true;
    try {
      await adminApi.deletePhotos(ids);
      $q.notify({ type: 'positive', message: `Deleted ${ids.length} photos` });
      selectedIds.clear();
      selectMode.value = false;
      await loadPhotos();
    } catch {
      $q.notify({ type: 'negative', message: 'Batch delete failed' });
    } finally {
      batchDeleting.value = false;
    }
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

<style scoped>
.photo-card-selected {
  outline: 3px solid var(--q-primary, #1976d2);
  outline-offset: -3px;
  border-radius: 8px;
}

.photo-checkbox {
  position: absolute;
  top: 4px;
  left: 4px;
  z-index: 1;
}

.batch-toolbar {
  background: var(--bg-card);
  padding: 8px 16px;
  min-width: 320px;
  border-radius: 12px;
}
</style>

<style>
.themed-dialog-dark .q-dialog__inner > .q-card {
  background: var(--bg-card, #2A2723);
  color: var(--text, #E0DBD5);
}
.themed-dialog-light .q-dialog__inner > .q-card {
  background: var(--bg-card, #FFFFFF);
  color: var(--text, #2C2824);
}
</style>
