<template>
  <q-page class="map-fullscreen">
    <leaflet-map
      v-if="!loading"
      :markers="mapMarkers"
      :center="mapCenter"
      :zoom="6"
      :view-photos-label="t('map.viewPhotos')"
      @marker-click="onMarkerClick"
    />
    <div v-if="loading" class="flex flex-center" style="height: 100%">
      <q-spinner-dots size="40px" color="primary" />
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import LeafletMap, { type MapMarker } from 'src/components/map/LeafletMap.vue';
import { clientApi, type LocationDto } from 'src/services/api.service';
import { useLocaleTitle } from 'src/composables/useLocaleTitle';

const { t } = useI18n();
const router = useRouter();
const { getTitle, getDescription, formatDate } = useLocaleTitle();

const loading = ref<boolean>(true);
const locations = ref<LocationDto[]>([]);

const mapCenter = computed<[number, number]>(() => {
  if (locations.value.length === 0) return [61.5, 24.0];
  const avgLat: number =
    locations.value.reduce((sum, l) => sum + l.latitude, 0) / locations.value.length;
  const avgLng: number =
    locations.value.reduce((sum, l) => sum + l.longitude, 0) / locations.value.length;
  return [avgLat, avgLng];
});

const mapMarkers = computed<MapMarker[]>(() =>
  locations.value.map((loc: LocationDto) => ({
    id: loc.id,
    latitude: loc.latitude,
    longitude: loc.longitude,
    title: getTitle(loc),
    description: getDescription(loc),
    coverPhotoId: loc.coverPhotoId,
    photoCount: loc.photoCount,
    visitDate: formatDate(loc.visitDate),
  })),
);

function onMarkerClick(id: string): void {
  void router.push({ name: 'location-detail', params: { id } });
}

onMounted(async () => {
  try {
    locations.value = await clientApi.getLocations();
  } finally {
    loading.value = false;
  }
});
</script>
