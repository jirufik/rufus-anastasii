import { api } from 'src/boot/axios';

export interface LocationDto {
  id: string;
  latitude: number;
  longitude: number;
  titleRu?: string;
  titleEn?: string;
  titleFi?: string;
  descriptionRu?: string;
  descriptionEn?: string;
  descriptionFi?: string;
  coverPhotoId?: string;
  sortOrder: number;
  visitDate?: string;
  photoCount?: number;
}

export interface PhotoDto {
  id: string;
  originalFilename: string;
  filePath: string;
  thumbnailPath?: string;
  mediaType: string;
  mimeType: string;
  fileSize: string;
  width?: number;
  height?: number;
  latitude?: number;
  longitude?: number;
  takenAt?: string;
  location?: string;
  sortOrder: number;
}

export const clientApi = {
  async getLocations(): Promise<LocationDto[]> {
    const response = await api.get('/api/v1/client/locations');
    return response.data;
  },

  async getLocation(id: string): Promise<{ location: LocationDto; photos: PhotoDto[] }> {
    const response = await api.get(`/api/v1/client/locations/${id}`);
    return response.data;
  },

  getThumbnailUrl(photoId: string): string {
    const baseUrl: string = process.env.API_URL || 'http://localhost:3000';
    return `${baseUrl}/api/v1/client/photos/${photoId}/thumbnail`;
  },

  getPhotoUrl(photoId: string): string {
    const baseUrl: string = process.env.API_URL || 'http://localhost:3000';
    return `${baseUrl}/api/v1/client/photos/${photoId}/file`;
  },
};

export const adminApi = {
  async uploadPhoto(file: File): Promise<PhotoDto[]> {
    const formData = new FormData();
    formData.append('files', file);
    const response = await api.post('/api/v1/admin/photos/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  async getPhotos(locationId?: string): Promise<PhotoDto[]> {
    const params: Record<string, string> = {};
    if (locationId) params.locationId = locationId;
    const response = await api.get('/api/v1/admin/photos', { params });
    return response.data;
  },

  async updatePhoto(id: string, data: Partial<PhotoDto>): Promise<PhotoDto> {
    const response = await api.put(`/api/v1/admin/photos/${id}`, data);
    return response.data;
  },

  async deletePhoto(id: string): Promise<void> {
    await api.delete(`/api/v1/admin/photos/${id}`);
  },

  async deletePhotos(ids: string[]): Promise<void> {
    await api.post('/api/v1/admin/photos/delete-batch', { ids });
  },

  async movePhoto(id: string, locationId: string | null): Promise<PhotoDto> {
    const response = await api.put(`/api/v1/admin/photos/${id}/move`, { locationId });
    return response.data;
  },

  async rotatePhoto(id: string, degrees: number): Promise<PhotoDto> {
    const response = await api.put(`/api/v1/admin/photos/${id}/rotate`, { degrees });
    return response.data;
  },

  async getLocations(): Promise<LocationDto[]> {
    const response = await api.get('/api/v1/admin/locations');
    return response.data;
  },

  async createLocation(data: Partial<LocationDto>): Promise<LocationDto> {
    const response = await api.post('/api/v1/admin/locations', data);
    return response.data;
  },

  async updateLocation(id: string, data: Partial<LocationDto>): Promise<LocationDto> {
    const response = await api.put(`/api/v1/admin/locations/${id}`, data);
    return response.data;
  },

  async deleteLocation(id: string): Promise<void> {
    await api.delete(`/api/v1/admin/locations/${id}`);
  },

  async autoGroup(): Promise<{ locationsCreated: number; photosGrouped: number }> {
    const response = await api.post('/api/v1/admin/locations/auto-group');
    return response.data;
  },

  async fillTitles(): Promise<{ filled: number }> {
    const response = await api.post('/api/v1/admin/locations/fill-titles');
    return response.data;
  },
};
