<template>
  <div style="height: 100%; width: 100%">
    <l-map
      ref="mapRef"
      :zoom="zoom"
      :center="center"
      :use-global-leaflet="false"
      style="height: 100%; width: 100%"
      @click="onMapClick"
    >
      <l-control-layers position="topright" />

      <l-tile-layer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        layer-type="base"
        name="Map"
        attribution="&copy; OpenStreetMap contributors"
      />
      <l-tile-layer
        url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
        layer-type="base"
        name="Satellite"
        attribution="&copy; Esri, Maxar, Earthstar Geographics"
      />

      <l-marker
        v-for="marker in markers"
        :key="marker.id"
        :lat-lng="[marker.latitude, marker.longitude]"
      >
        <l-popup :options="{ maxWidth: 320, minWidth: 260, className: 'themed-popup' }">
          <div class="map-popup">
            <img
              v-if="marker.coverPhotoId"
              :src="getThumbnailUrl(marker.coverPhotoId)"
              class="map-popup__image"
            />
            <div class="map-popup__body">
              <div class="map-popup__title">{{ marker.title || 'Unnamed' }}</div>
              <div v-if="marker.description" class="map-popup__description">
                {{ marker.description }}
              </div>
              <div class="map-popup__meta">
                <span v-if="marker.photoCount" class="map-popup__count">{{ marker.photoCount }} {{ marker.photoCount === 1 ? 'photo' : 'photos' }}</span>
                <span v-if="marker.visitDate" class="map-popup__date">{{ marker.visitDate }}</span>
              </div>
              <div
                v-if="viewPhotosLabel"
                class="map-popup__link"
                @click="$emit('marker-click', marker.id)"
              >
                {{ viewPhotosLabel }} &rarr;
              </div>
            </div>
          </div>
        </l-popup>
      </l-marker>
    </l-map>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { LMap, LTileLayer, LMarker, LPopup, LControlLayers } from '@vue-leaflet/vue-leaflet';
import { clientApi } from 'src/services/api.service';

export interface MapMarker {
  id: string;
  latitude: number;
  longitude: number;
  title: string;
  description?: string;
  coverPhotoId?: string;
  photoCount?: number;
  visitDate?: string;
}

defineProps<{
  markers: MapMarker[];
  center: [number, number];
  zoom: number;
  viewPhotosLabel?: string;
}>();

const emit = defineEmits<{
  (e: 'marker-click', id: string): void;
  (e: 'map-click', latlng: { lat: number; lng: number }): void;
}>();

const mapRef = ref();

function getThumbnailUrl(photoId: string): string {
  return clientApi.getThumbnailUrl(photoId);
}

function onMapClick(event: any): void {
  if (event?.latlng) {
    emit('map-click', { lat: event.latlng.lat, lng: event.latlng.lng });
  }
}
</script>
