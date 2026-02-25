import { Entity, Property, Index, ManyToOne } from '@mikro-orm/core';
import { BaseEntityAbstract } from '../../../../libs/mikro-orm/crud/entities/base.entity.abstract';
import { LocationEntity } from '../../../locations/repository/entities/location.entity';

@Entity({ tableName: 'photos' })
export class PhotoEntity extends BaseEntityAbstract {
  @Property({ type: 'varchar', length: 512 })
  originalFilename: string;

  @Property({ type: 'varchar', length: 1024 })
  filePath: string;

  @Property({ type: 'varchar', length: 1024, nullable: true })
  thumbnailPath: string;

  @Property({ type: 'varchar', length: 10 })
  mediaType: string;

  @Property({ type: 'varchar', length: 100 })
  mimeType: string;

  @Property({ type: 'bigint', nullable: true })
  fileSize: string;

  @Property({ type: 'integer', nullable: true })
  width: number;

  @Property({ type: 'integer', nullable: true })
  height: number;

  @Property({ type: 'double', nullable: true })
  latitude: number;

  @Property({ type: 'double', nullable: true })
  longitude: number;

  @Property({ type: 'timestamptz', nullable: true })
  takenAt: Date;

  @Property({ type: 'jsonb', nullable: true })
  exifData: Record<string, any>;

  @ManyToOne(() => LocationEntity, { nullable: true, fieldName: 'location_id' })
  @Index()
  location: LocationEntity;

  @Property({ type: 'integer', default: 0 })
  sortOrder: number;
}
