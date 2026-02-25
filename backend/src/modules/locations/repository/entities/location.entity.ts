import { Entity, Property, OneToMany, Collection } from '@mikro-orm/core';
import { BaseEntityAbstract } from '../../../../libs/mikro-orm/crud/entities/base.entity.abstract';
import { PhotoEntity } from '../../../photos/repository/entities/photo.entity';

@Entity({ tableName: 'locations' })
export class LocationEntity extends BaseEntityAbstract {
  @Property({ type: 'double' })
  latitude: number;

  @Property({ type: 'double' })
  longitude: number;

  @Property({ type: 'varchar', length: 255, nullable: true })
  titleRu: string;

  @Property({ type: 'varchar', length: 255, nullable: true })
  titleEn: string;

  @Property({ type: 'varchar', length: 255, nullable: true })
  titleFi: string;

  @Property({ type: 'text', nullable: true })
  descriptionRu: string;

  @Property({ type: 'text', nullable: true })
  descriptionEn: string;

  @Property({ type: 'text', nullable: true })
  descriptionFi: string;

  @Property({ type: 'uuid', nullable: true })
  coverPhotoId: string;

  @Property({ type: 'integer', default: 0 })
  sortOrder: number;

  @Property({ type: 'date', nullable: true })
  visitDate: Date;

  @OneToMany(() => PhotoEntity, (photo: PhotoEntity) => photo.location)
  photos = new Collection<PhotoEntity>(this);
}
