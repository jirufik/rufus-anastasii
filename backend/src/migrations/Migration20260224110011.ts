import { Migration } from '@mikro-orm/migrations';

export class Migration20260224110011 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table "admin_users" ("id" uuid not null default gen_random_uuid(), "created_at" timestamptz(3) not null default now(), "updated_at" timestamptz(3) not null default now(), "deleted_at" timestamptz(3) null, "version" int not null default 0, "username" varchar(100) not null, "password_hash" varchar(255) not null, constraint "admin_users_pkey" primary key ("id"));`);
    this.addSql(`create index "admin_users_created_at_index" on "admin_users" ("created_at");`);
    this.addSql(`create index "admin_users_updated_at_index" on "admin_users" ("updated_at");`);
    this.addSql(`create index "admin_users_deleted_at_index" on "admin_users" ("deleted_at");`);
    this.addSql(`alter table "admin_users" add constraint "admin_users_username_unique" unique ("username");`);

    this.addSql(`create table "locations" ("id" uuid not null default gen_random_uuid(), "created_at" timestamptz(3) not null default now(), "updated_at" timestamptz(3) not null default now(), "deleted_at" timestamptz(3) null, "version" int not null default 0, "latitude" double precision not null, "longitude" double precision not null, "title_ru" varchar(255) null, "title_en" varchar(255) null, "title_fi" varchar(255) null, "description_ru" text null, "description_en" text null, "description_fi" text null, "cover_photo_id" uuid null, "sort_order" int not null default 0, "visit_date" date null, constraint "locations_pkey" primary key ("id"));`);
    this.addSql(`create index "locations_created_at_index" on "locations" ("created_at");`);
    this.addSql(`create index "locations_updated_at_index" on "locations" ("updated_at");`);
    this.addSql(`create index "locations_deleted_at_index" on "locations" ("deleted_at");`);

    this.addSql(`create table "photos" ("id" uuid not null default gen_random_uuid(), "created_at" timestamptz(3) not null default now(), "updated_at" timestamptz(3) not null default now(), "deleted_at" timestamptz(3) null, "version" int not null default 0, "original_filename" varchar(512) not null, "file_path" varchar(1024) not null, "thumbnail_path" varchar(1024) null, "media_type" varchar(10) not null, "mime_type" varchar(100) not null, "file_size" bigint null, "width" int null, "height" int null, "latitude" double precision null, "longitude" double precision null, "taken_at" timestamptz null, "exif_data" jsonb null, "location_id" uuid null, "sort_order" int not null default 0, constraint "photos_pkey" primary key ("id"));`);
    this.addSql(`create index "photos_created_at_index" on "photos" ("created_at");`);
    this.addSql(`create index "photos_updated_at_index" on "photos" ("updated_at");`);
    this.addSql(`create index "photos_deleted_at_index" on "photos" ("deleted_at");`);
    this.addSql(`create index "photos_location_id_index" on "photos" ("location_id");`);

    this.addSql(`alter table "photos" add constraint "photos_location_id_foreign" foreign key ("location_id") references "locations" ("id") on update cascade on delete set null;`);
  }

}
