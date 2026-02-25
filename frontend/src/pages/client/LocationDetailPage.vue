<template>
  <q-page>
    <div v-if="loading" class="flex flex-center" style="min-height: 60vh">
      <q-spinner-dots size="40px" color="primary" />
    </div>

    <template v-if="!loading && location">
      <!-- Hero -->
      <div v-if="coverPhotoId" class="location-hero">
        <img :src="getPhotoUrl(coverPhotoId)" alt="" />
        <div class="location-hero__overlay">
          <div class="text-upper q-mb-xs" style="color: rgba(245,240,235,0.7)">
            {{ formatDate(location.visitDate) }}
          </div>
          <div class="text-h3">{{ getTitle(location) }}</div>
        </div>
      </div>

      <div style="max-width: 1100px; margin: 0 auto; padding: 0 var(--page-pad)">
        <!-- No-hero title -->
        <div v-if="!coverPhotoId" class="q-pt-xl q-pb-lg">
          <q-btn flat dense icon="arrow_back" size="sm" @click="router.push('/')" class="q-mb-md" style="color: var(--text-secondary)" />
          <h2 style="margin: 0">{{ getTitle(location) }}</h2>
          <div v-if="location.visitDate" class="text-upper q-mt-sm">{{ formatDate(location.visitDate) }}</div>
        </div>

        <div v-else class="q-pb-md">
          <q-btn flat dense icon="arrow_back" size="sm" @click="router.push('/')" style="color: var(--text-secondary)" />
        </div>

        <!-- Description -->
        <p v-if="getDescription(location)" class="text-description q-mb-xl">
          {{ getDescription(location) }}
        </p>

        <!-- Gallery -->
        <div v-if="photos.length > 0" class="photo-masonry q-pb-xl">
          <div
            v-for="(photo, index) in photos"
            :key="photo.id"
            class="photo-masonry-item"
            @click="openPhoto(index)"
          >
            <img :src="getThumbnailUrl(photo.id)" :alt="photo.originalFilename" loading="lazy" />
          </div>
        </div>

        <div v-else class="text-center q-py-xl" style="color: var(--text-caption)">
          {{ t('location.noPhotos') }}
        </div>
      </div>
    </template>

    <!-- Lightbox -->
    <q-dialog v-model="lightboxOpen" maximized transition-show="fade" transition-hide="fade">
      <q-card class="lightbox-card" @click="lightboxOpen = false">
        <div class="absolute-top q-pa-md row items-center" style="z-index: 2">
          <q-space />
          <span class="text-white text-caption q-mr-md" style="opacity: 0.5; font-family: var(--font-sans); letter-spacing: 0.1em">
            {{ currentPhotoIndex + 1 }} / {{ photos.length }}
          </span>
          <q-btn flat round icon="close" color="white" size="sm" class="lightbox-nav-btn" v-close-popup />
        </div>

        <div class="flex flex-center" style="height: 100vh" @click.stop>
          <q-btn
            v-if="currentPhotoIndex > 0"
            flat round icon="chevron_left" color="white" size="sm"
            class="lightbox-nav-btn lightbox-nav-btn--left"
            @click="prevPhoto"
          />
          <img
            v-if="photos[currentPhotoIndex]"
            :src="getPhotoUrl(photos[currentPhotoIndex].id)"
            style="max-width: 92vw; max-height: 92vh; object-fit: contain"
          />
          <q-btn
            v-if="currentPhotoIndex < photos.length - 1"
            flat round icon="chevron_right" color="white" size="sm"
            class="lightbox-nav-btn lightbox-nav-btn--right"
            @click="nextPhoto"
          />
        </div>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { clientApi, type LocationDto, type PhotoDto } from 'src/services/api.service';
import { useLocaleTitle } from 'src/composables/useLocaleTitle';
import { useKeyboardNav } from 'src/composables/useKeyboardNav';

const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const { getTitle, getDescription, formatDate } = useLocaleTitle();

const loading = ref<boolean>(true);
const location = ref<LocationDto | null>(null);
const photos = ref<PhotoDto[]>([]);
const lightboxOpen = ref<boolean>(false);
const currentPhotoIndex = ref<number>(0);

const coverPhotoId = computed<string | undefined>(() => location.value?.coverPhotoId);

function getThumbnailUrl(photoId: string): string {
  return clientApi.getThumbnailUrl(photoId);
}

function getPhotoUrl(photoId: string): string {
  return clientApi.getPhotoUrl(photoId);
}

function openPhoto(index: number): void {
  currentPhotoIndex.value = index;
  lightboxOpen.value = true;
}

function prevPhoto(): void {
  if (currentPhotoIndex.value > 0) currentPhotoIndex.value--;
}

function nextPhoto(): void {
  if (currentPhotoIndex.value < photos.value.length - 1) currentPhotoIndex.value++;
}

// Keyboard navigation: lightbox arrows + escape, page-level escape to go back
useKeyboardNav({
  onEscape: () => {
    if (lightboxOpen.value) {
      lightboxOpen.value = false;
    } else {
      router.push('/');
    }
  },
  onLeft: () => {
    if (lightboxOpen.value) prevPhoto();
  },
  onRight: () => {
    if (lightboxOpen.value) nextPhoto();
  },
});

onMounted(async () => {
  try {
    const id: string = route.params.id as string;
    const data = await clientApi.getLocation(id);
    location.value = data.location;
    photos.value = data.photos;
  } finally {
    loading.value = false;
  }
});
</script>
