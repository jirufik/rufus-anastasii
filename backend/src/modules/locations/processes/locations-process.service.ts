import { Injectable, Inject } from '@nestjs/common';
import { MikroORM } from '@mikro-orm/core';
import { ConfigService } from '@nestjs/config';
import { BaseService } from '../../../libs/mikro-orm/services/base.service';
import { BasicLocationsActionsService } from './basic-locations-actions/basic-locations-actions.service';
import { BasicPhotosActionsService } from '../../photos/processes/basic-photos-actions/basic-photos-actions.service';
import { PinoLoggerService } from '../../../libs/logger/pino-logger.service';
import { LocationDo } from '../dto/location.do';
import { PhotoDo } from '../../photos/dto/photo.do';
import { Transactional } from '../../../libs/mikro-orm/decorators/transactional.decorator';
import {
  ENV_KEY_GROUPING_PROXIMITY_METERS,
  DEFAULT_GROUPING_PROXIMITY_METERS,
} from '../../../constants/constants';

interface NominatimAddress {
  city?: string;
  town?: string;
  village?: string;
  hamlet?: string;
  municipality?: string;
  county?: string;
  state?: string;
  country?: string;
}

@Injectable()
export class LocationsProcessService extends BaseService {
  private readonly groupingProximityMeters: number;

  constructor(
    orm: MikroORM,
    private readonly basicLocationsActions: BasicLocationsActionsService,
    private readonly basicPhotosActions: BasicPhotosActionsService,
    private readonly configService: ConfigService,
    @Inject(PinoLoggerService)
    private readonly logger: PinoLoggerService,
  ) {
    super(orm);
    this.groupingProximityMeters = Number(
      this.configService.get<number>(ENV_KEY_GROUPING_PROXIMITY_METERS, DEFAULT_GROUPING_PROXIMITY_METERS),
    );
  }

  @Transactional()
  async findAll(): Promise<LocationDo[]> {
    try {
      const locations: LocationDo[] = await this.basicLocationsActions.findAll();
      return locations;
    } catch (error) {
      this.logger.error({
        message: error,
        context: `${this.serviceName}.findAll error`,
      });
      throw error;
    }
  }

  @Transactional()
  async findById(params: { id: string }): Promise<LocationDo | undefined> {
    try {
      const { id } = params;
      const location: LocationDo = await this.basicLocationsActions.findById({ id });
      return location;
    } catch (error) {
      this.logger.error({
        message: error,
        context: `${this.serviceName}.findById error`,
        data: { params },
      });
      throw error;
    }
  }

  @Transactional()
  async createLocation(params: { data: Partial<LocationDo> }): Promise<LocationDo> {
    try {
      const { data } = params;
      const createdLocation: LocationDo = await this.basicLocationsActions.create({ location: data });
      return createdLocation;
    } catch (error) {
      this.logger.error({
        message: error,
        context: `${this.serviceName}.createLocation error`,
        data: { params },
      });
      throw error;
    }
  }

  @Transactional()
  async updateLocation(params: { id: string; data: Partial<LocationDo> }): Promise<LocationDo> {
    try {
      const { id, data } = params;
      const updatedLocation: LocationDo = await this.basicLocationsActions.update({ id, data });
      return updatedLocation;
    } catch (error) {
      this.logger.error({
        message: error,
        context: `${this.serviceName}.updateLocation error`,
        data: { params },
      });
      throw error;
    }
  }

  @Transactional()
  async deleteLocation(params: { id: string }): Promise<void> {
    try {
      const { id } = params;
      await this.basicLocationsActions.delete({ id });
    } catch (error) {
      this.logger.error({
        message: error,
        context: `${this.serviceName}.deleteLocation error`,
        data: { params },
      });
      throw error;
    }
  }

  @Transactional()
  async findAllEnriched(): Promise<LocationDo[]> {
    try {
      const locations: LocationDo[] = await this.basicLocationsActions.findAll();
      const allPhotos: PhotoDo[] = await this.basicPhotosActions.findAll();

      const photosByLocation: Map<string, PhotoDo[]> = new Map();
      for (const photo of allPhotos) {
        if (photo.location) {
          const locId: string = typeof photo.location === 'string' ? photo.location : photo.location.id || photo.location;
          if (!photosByLocation.has(locId)) {
            photosByLocation.set(locId, []);
          }
          photosByLocation.get(locId).push(photo);
        }
      }

      for (const location of locations) {
        const locPhotos: PhotoDo[] = photosByLocation.get(location.id) || [];
        location.photoCount = locPhotos.length;

        if (!location.visitDate && locPhotos.length > 0) {
          const datesWithPhotos: Date[] = locPhotos
            .filter((p: PhotoDo) => p.takenAt != null)
            .map((p: PhotoDo) => new Date(p.takenAt));
          if (datesWithPhotos.length > 0) {
            datesWithPhotos.sort((a: Date, b: Date) => a.getTime() - b.getTime());
            location.visitDate = datesWithPhotos[0];
          }
        }
      }

      return locations;
    } catch (error) {
      this.logger.error({
        message: error,
        context: `${this.serviceName}.findAllEnriched error`,
      });
      throw error;
    }
  }

  @Transactional()
  async findByIdEnriched(params: { id: string }): Promise<{ location: LocationDo; photos: PhotoDo[] } | undefined> {
    try {
      const { id } = params;
      const location: LocationDo = await this.basicLocationsActions.findById({ id });
      if (!location) return;

      const photos: PhotoDo[] = await this.basicPhotosActions.findAll({ locationId: id });

      // Enrich: photo count + fallback visit date from earliest photo
      location.photoCount = photos.length;
      if (!location.visitDate && photos.length > 0) {
        const dates: Date[] = photos
          .filter((p: PhotoDo) => p.takenAt != null)
          .map((p: PhotoDo) => new Date(p.takenAt));
        if (dates.length > 0) {
          dates.sort((a: Date, b: Date) => a.getTime() - b.getTime());
          location.visitDate = dates[0];
        }
      }

      const result: { location: LocationDo; photos: PhotoDo[] } = { location, photos };
      return result;
    } catch (error) {
      this.logger.error({
        message: error,
        context: `${this.serviceName}.findByIdEnriched error`,
        data: { params },
      });
      throw error;
    }
  }

  @Transactional()
  async fillMissingTitles(params: { force?: boolean }): Promise<number> {
    try {
      const { force = false } = params;
      const locations: LocationDo[] = await this.basicLocationsActions.findAll();
      let filled: number = 0;

      for (const location of locations) {
        const hasTitle: boolean = !!(location.titleRu || location.titleEn || location.titleFi);
        if ((!force && hasTitle) || !location.latitude || !location.longitude) continue;

        const nameEn: string | null = await this.reverseGeocode({ lat: location.latitude, lon: location.longitude, lang: 'en' });
        await this.sleep({ ms: 1100 });
        const nameRu: string | null = await this.reverseGeocode({ lat: location.latitude, lon: location.longitude, lang: 'ru' });
        await this.sleep({ ms: 1100 });
        const nameFi: string | null = await this.reverseGeocode({ lat: location.latitude, lon: location.longitude, lang: 'fi' });

        if (nameEn || nameRu || nameFi) {
          await this.basicLocationsActions.update({
            id: location.id,
            data: {
              titleEn: nameEn || nameRu || nameFi,
              titleRu: nameRu || nameEn || nameFi,
              titleFi: nameFi || nameEn || nameRu,
            },
          });
          filled++;
        }

        // Nominatim rate limit: 1 req/sec
        await this.sleep({ ms: 1100 });
      }

      return filled;
    } catch (error) {
      this.logger.error({
        message: error,
        context: `${this.serviceName}.fillMissingTitles error`,
      });
      throw error;
    }
  }

  private async reverseGeocode(params: { lat: number; lon: number; lang: string }): Promise<string | null> {
    try {
      const { lat, lon, lang } = params;
      const url: string = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&zoom=14&accept-language=${lang}`;
      const response = await fetch(url, {
        headers: { 'User-Agent': 'RufusAnastasiiApp/1.0' },
      });

      if (!response.ok) return null;

      const data = await response.json();
      const address: NominatimAddress = data.address || {};
      // Prefer town/village over city for more precise naming (e.g. Kiiminki instead of Oulu)
      const name: string = address.town || address.village || address.hamlet || address.city || address.municipality || address.county || '';
      return name || null;
    } catch (error) {
      this.logger.error({
        message: error,
        context: `${this.serviceName}.reverseGeocode error`,
        data: { params },
      });
      return null;
    }
  }

  private sleep(params: { ms: number }): Promise<void> {
    const { ms } = params;
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  @Transactional()
  async autoGroupPhotos(): Promise<{ locationsCreated: number; photosGrouped: number }> {
    try {
      const ungroupedPhotos: PhotoDo[] = await this.basicPhotosActions.findUngroupedWithGps();

      if (ungroupedPhotos.length === 0) {
        const result: { locationsCreated: number; photosGrouped: number } = {
          locationsCreated: 0,
          photosGrouped: 0,
        };
        return result;
      }

      const existingLocations: LocationDo[] = await this.basicLocationsActions.findAll();

      const locationCenters: Array<{ id: string; latitude: number; longitude: number }> =
        existingLocations.map((loc: LocationDo) => ({
          id: loc.id,
          latitude: loc.latitude,
          longitude: loc.longitude,
        }));

      let locationsCreated: number = 0;
      let photosGrouped: number = 0;

      for (const photo of ungroupedPhotos) {
        let closestLocationId: string | null = null;
        let closestDistance: number = Infinity;

        for (const loc of locationCenters) {
          const distance: number = this.haversineDistance({
            lat1: photo.latitude,
            lon1: photo.longitude,
            lat2: loc.latitude,
            lon2: loc.longitude,
          });
          if (distance < closestDistance) {
            closestDistance = distance;
            closestLocationId = loc.id;
          }
        }

        if (closestLocationId && closestDistance < this.groupingProximityMeters) {
          await this.basicPhotosActions.moveToLocation({
            photoId: photo.id,
            locationId: closestLocationId,
          });
          photosGrouped++;
        } else {
          const newLocation: LocationDo = await this.basicLocationsActions.create({
            location: {
              latitude: photo.latitude,
              longitude: photo.longitude,
              sortOrder: locationCenters.length,
            },
          });

          locationCenters.push({
            id: newLocation.id,
            latitude: newLocation.latitude,
            longitude: newLocation.longitude,
          });

          await this.basicPhotosActions.moveToLocation({
            photoId: photo.id,
            locationId: newLocation.id,
          });

          locationsCreated++;
          photosGrouped++;
        }
      }

      await this.recalculateLocationCenters();
      await this.fillMissingTitles({ force: false });

      const result: { locationsCreated: number; photosGrouped: number } = {
        locationsCreated,
        photosGrouped,
      };
      return result;
    } catch (error) {
      this.logger.error({
        message: error,
        context: `${this.serviceName}.autoGroupPhotos error`,
      });
      throw error;
    }
  }

  @Transactional()
  private async recalculateLocationCenters(): Promise<void> {
    try {
      const locations: LocationDo[] = await this.basicLocationsActions.findAll();

      for (const location of locations) {
        const photos: PhotoDo[] = await this.basicPhotosActions.findAll({ locationId: location.id });

        const gpsPhotos: PhotoDo[] = photos.filter(
          (p: PhotoDo) => p.latitude != null && p.longitude != null,
        );

        if (gpsPhotos.length > 0) {
          const avgLat: number =
            gpsPhotos.reduce((sum: number, p: PhotoDo) => sum + p.latitude, 0) / gpsPhotos.length;
          const avgLng: number =
            gpsPhotos.reduce((sum: number, p: PhotoDo) => sum + p.longitude, 0) / gpsPhotos.length;

          await this.basicLocationsActions.update({
            id: location.id,
            data: { latitude: avgLat, longitude: avgLng },
          });
        }
      }
    } catch (error) {
      this.logger.error({
        message: error,
        context: `${this.serviceName}.recalculateLocationCenters error`,
      });
      throw error;
    }
  }

  haversineDistance(params: {
    lat1: number;
    lon1: number;
    lat2: number;
    lon2: number;
  }): number {
    const { lat1, lon1, lat2, lon2 } = params;
    const R: number = 6371000;
    const toRad = (deg: number): number => (deg * Math.PI) / 180;

    const dLat: number = toRad(lat2 - lat1);
    const dLon: number = toRad(lon2 - lon1);
    const a: number =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c: number = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance: number = R * c;
    return distance;
  }
}
