alter table if exists army_lists
  drop constraint if exists army_lists_selected_detachment_id_fkey;

alter table if exists detachment_stratagems
  drop constraint if exists detachment_stratagems_detachment_id_fkey;

alter table if exists detachment_stratagems
  drop constraint if exists detachment_stratagems_pkey;

alter table if exists detachments
  drop constraint if exists detachments_pkey;

alter table if exists detachments
  alter column id type text using id::text;

alter table if exists detachment_stratagems
  alter column id type text using id::text,
  alter column detachment_id type text using detachment_id::text;

alter table if exists army_lists
  alter column selected_detachment_id type text using selected_detachment_id::text;

alter table if exists detachments
  add constraint detachments_pkey primary key (id);

alter table if exists detachment_stratagems
  add constraint detachment_stratagems_pkey primary key (id);

alter table if exists detachment_stratagems
  add constraint detachment_stratagems_detachment_id_fkey
  foreign key (detachment_id) references detachments(id) on delete cascade;

alter table if exists army_lists
  add constraint army_lists_selected_detachment_id_fkey
  foreign key (selected_detachment_id) references detachments(id) on delete set null;
