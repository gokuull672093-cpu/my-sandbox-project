-- enums
create type public.availability_status as enum ('available','limited','unavailable','enquiry_only');
create type public.enquiry_status as enum ('new','contact_required','contacted','discussion','confirmed','ready','completed','not_converted');

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  name_ta text,
  experience text,
  emoji text,
  sort int not null default 0,
  created_at timestamptz not null default now()
);
grant select on public.categories to anon;
grant select, insert, update, delete on public.categories to authenticated;
grant all on public.categories to service_role;
alter table public.categories enable row level security;
create policy "categories public read" on public.categories for select to anon using (true);
create policy "categories admin all" on public.categories for all to authenticated using (true) with check (true);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  name_ta text,
  category_id uuid references public.categories(id) on delete set null,
  pack text,
  mrp numeric(10,2),
  price numeric(10,2) not null default 0,
  availability public.availability_status not null default 'available',
  image_url text,
  tags text[] not null default '{}',
  active boolean not null default true,
  created_at timestamptz not null default now()
);
grant select on public.products to anon;
grant select, insert, update, delete on public.products to authenticated;
grant all on public.products to service_role;
alter table public.products enable row level security;
create policy "products public read" on public.products for select to anon using (active);
create policy "products admin all" on public.products for all to authenticated using (true) with check (true);

create table public.combos (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  title_ta text,
  description text,
  indicative_price numeric(10,2) not null default 0,
  image_url text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);
grant select on public.combos to anon;
grant select, insert, update, delete on public.combos to authenticated;
grant all on public.combos to service_role;
alter table public.combos enable row level security;
create policy "combos public read" on public.combos for select to anon using (active);
create policy "combos admin all" on public.combos for all to authenticated using (true) with check (true);

create table public.combo_items (
  id uuid primary key default gen_random_uuid(),
  combo_id uuid not null references public.combos(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  qty int not null default 1
);
grant select on public.combo_items to anon;
grant select, insert, update, delete on public.combo_items to authenticated;
grant all on public.combo_items to service_role;
alter table public.combo_items enable row level security;
create policy "combo_items public read" on public.combo_items for select to anon using (true);
create policy "combo_items admin all" on public.combo_items for all to authenticated using (true) with check (true);

create table public.enquiries (
  id uuid primary key default gen_random_uuid(),
  ref text unique,
  name text not null,
  mobile text not null,
  city text not null,
  fulfilment text,
  contact_method text,
  message text,
  free_text text,
  source text not null default 'direct',
  status public.enquiry_status not null default 'new',
  estimated_value numeric(12,2) not null default 0,
  item_count int not null default 0,
  follow_up_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant insert on public.enquiries to anon;
grant select, insert, update, delete on public.enquiries to authenticated;
grant all on public.enquiries to service_role;
alter table public.enquiries enable row level security;
create policy "enquiries public insert" on public.enquiries for insert to anon with check (true);
create policy "enquiries admin all" on public.enquiries for all to authenticated using (true) with check (true);

create table public.enquiry_items (
  id uuid primary key default gen_random_uuid(),
  enquiry_id uuid not null references public.enquiries(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  product_code text,
  product_name text not null,
  qty int not null default 1,
  unit_price numeric(10,2) not null default 0,
  removed boolean not null default false
);
grant insert on public.enquiry_items to anon;
grant select, insert, update, delete on public.enquiry_items to authenticated;
grant all on public.enquiry_items to service_role;
alter table public.enquiry_items enable row level security;
create policy "enquiry_items public insert" on public.enquiry_items for insert to anon with check (true);
create policy "enquiry_items admin all" on public.enquiry_items for all to authenticated using (true) with check (true);

create table public.enquiry_notes (
  id uuid primary key default gen_random_uuid(),
  enquiry_id uuid not null references public.enquiries(id) on delete cascade,
  note text not null,
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.enquiry_notes to authenticated;
grant all on public.enquiry_notes to service_role;
alter table public.enquiry_notes enable row level security;
create policy "notes admin all" on public.enquiry_notes for all to authenticated using (true) with check (true);

create or replace function public.set_updated_at() returns trigger language plpgsql set search_path = public as $$
begin new.updated_at = now(); return new; end; $$;
create trigger enquiries_updated_at before update on public.enquiries for each row execute function public.set_updated_at();

create sequence public.enquiry_ref_seq start 10001;
grant usage on sequence public.enquiry_ref_seq to anon, authenticated, service_role;
create or replace function public.gen_enquiry_ref() returns trigger language plpgsql set search_path = public as $$
begin
  if new.ref is null or new.ref = '' then
    new.ref := 'UC-26-' || nextval('public.enquiry_ref_seq')::text;
  end if;
  return new;
end; $$;
create trigger enquiries_ref before insert on public.enquiries for each row execute function public.gen_enquiry_ref();

-- seed categories
insert into public.categories (slug, name, name_ta, experience, emoji, sort) values
('sparklers','Sparklers','மத்தாப்பு','sparkle','✨',1),
('ground-chakkars','Ground Chakkars','நிலச் சக்கரம்','colourful','🌀',2),
('flower-pots','Flower Pots','புஷ்வானம்','sparkle','🌸',3),
('rockets','Rockets','ராக்கெட்','sky','🚀',4),
('one-sound','One Sound Crackers','ஒற்றை சத்தம்','traditional','💥',5),
('fancy','Fancy Items','ஃபேன்சி','colourful','🎆',6),
('bombs','Bombs','வெடி','traditional','🧨',7),
('gift-boxes','Gift Boxes','கிஃப்ட் பாக்ஸ்','gift','🎁',8),
('kids','Kids Special','குழந்தைகள்','family','🧒',9);

-- seed products
insert into public.products (code, name, name_ta, category_id, pack, mrp, price, availability, tags)
select v.code, v.name, v.name_ta, c.id, v.pack, v.mrp, v.price, v.avail::public.availability_status, v.tags
from (values
('CRK-001','7cm Electric Sparklers','7செ.மீ எலெக்ட்ரிக் மத்தாப்பு','sparklers','10 pcs',60,24,'available',array['family','kids','variety']),
('CRK-002','15cm Electric Sparklers','15செ.மீ மத்தாப்பு','sparklers','10 pcs',90,36,'available',array['family','kids','variety']),
('CRK-003','30cm Colour Sparklers','30செ.மீ கலர் மத்தாப்பு','sparklers','10 pcs',180,72,'available',array['colourful','family','variety']),
('CRK-004','50cm Golden Sparklers','50செ.மீ கோல்டன் மத்தாப்பு','sparklers','5 pcs',260,104,'limited',array['premium','colourful']),
('CRK-005','Deluxe Ground Chakkar','டீலக்ஸ் நிலச் சக்கரம்','ground-chakkars','10 pcs',210,84,'available',array['family','traditional','variety']),
('CRK-006','Special Ground Chakkar','ஸ்பெஷல் சக்கரம்','ground-chakkars','5 pcs',150,60,'available',array['family','traditional']),
('CRK-007','Asoka Chakkar','அசோகா சக்கரம்','ground-chakkars','10 pcs',320,128,'limited',array['premium','colourful']),
('CRK-008','Flower Pot Small','சின்ன புஷ்வானம்','flower-pots','10 pcs',180,72,'available',array['family','kids','variety']),
('CRK-009','Flower Pot Big','பெரிய புஷ்வானம்','flower-pots','10 pcs',340,136,'available',array['family','colourful','variety']),
('CRK-010','Colour Koti Flower Pot','கலர் கோட்டி புஷ்வானம்','flower-pots','5 pcs',420,168,'available',array['colourful','premium']),
('CRK-011','2 Sound Rocket','2 சவுண்ட் ராக்கெட்','rockets','10 pcs',260,104,'available',array['traditional','variety']),
('CRK-012','Colour Rocket','கலர் ராக்கெட்','rockets','10 pcs',300,120,'available',array['colourful','variety']),
('CRK-013','Whistling Rocket','விசில் ராக்கெட்','rockets','5 pcs',240,96,'limited',array['variety']),
('CRK-014','2 3/4 inch Lakshmi','2 3/4 இன்ச் லக்ஷ்மி','one-sound','10 pcs',150,60,'available',array['traditional']),
('CRK-015','4 inch Lakshmi','4 இன்ச் லக்ஷ்மி','one-sound','10 pcs',240,96,'available',array['traditional','variety']),
('CRK-016','Classic Bijili','கிளாசிக் பிஜிலி','one-sound','1 pkt',110,44,'available',array['traditional']),
('CRK-017','Red Bijili','ரெட் பிஜிலி','one-sound','1 pkt',130,52,'available',array['traditional']),
('CRK-018','Peacock Fancy Fountain','மயில் ஃபவுண்டன்','fancy','1 pc',380,152,'available',array['colourful','premium','kids']),
('CRK-019','Rainbow Fancy Shower','ரெயின்போ ஷவர்','fancy','1 pc',450,180,'available',array['colourful','premium']),
('CRK-020','Butterfly Fancy','பட்டர்ஃபிளை ஃபேன்சி','fancy','5 pcs',290,116,'limited',array['kids','colourful']),
('CRK-021','Twinkling Star Fancy','ட்விங்கிள் ஸ்டார்','fancy','5 pcs',330,132,'available',array['kids','colourful','variety']),
('CRK-022','30 Shots Aerial','30 ஷாட்ஸ்','fancy','1 pc',1200,480,'limited',array['premium','colourful']),
('CRK-023','60 Shots Aerial','60 ஷாட்ஸ்','fancy','1 pc',2400,960,'enquiry_only',array['premium']),
('CRK-024','Hydro Bomb','ஹைட்ரோ பாம்','bombs','10 pcs',420,168,'available',array['traditional']),
('CRK-025','King Bomb','கிங் பாம்','bombs','10 pcs',480,192,'limited',array['traditional']),
('CRK-026','Deluxe Gift Box 25','டீலக்ஸ் கிஃப்ட் பாக்ஸ் 25','gift-boxes','25 items',1600,640,'available',array['gift','family','variety']),
('CRK-027','Premium Gift Box 50','பிரீமியம் கிஃப்ட் பாக்ஸ் 50','gift-boxes','50 items',3200,1280,'available',array['gift','premium','family','variety']),
('CRK-028','Mini Gift Box 12','மினி கிஃப்ட் பாக்ஸ் 12','gift-boxes','12 items',900,360,'available',array['gift','kids','family']),
('CRK-029','Pop Pop Snaps','பாப் பாப்','kids','1 box',60,24,'available',array['kids','family']),
('CRK-030','Ground Snake Tablets','நாக மாத்திரை','kids','1 box',80,32,'available',array['kids','family','traditional']),
('CRK-031','Sparkling Pencil','ஸ்பார்க்கிள் பென்சில்','kids','10 pcs',120,48,'available',array['kids','colourful']),
('CRK-032','Magic Whip','மேஜிக் விப்','kids','1 box',90,36,'available',array['kids'])
) as v(code,name,name_ta,cat,pack,mrp,price,avail,tags)
join public.categories c on c.slug = v.cat;

-- combos
insert into public.combos (slug, title, title_ta, description, indicative_price) values
('family-2999','Family Combo','குடும்ப காம்போ','A balanced family selection of sparklers, flower pots and chakkars.',2999),
('kids-999','Kids Joy Combo','குழந்தைகள் காம்போ','Low-noise, colourful items picked for children with adult supervision.',999),
('premium-7999','Premium Collection','பிரீமியம் தொகுப்பு','Our finest aerial and fancy items for a grand celebration.',7999);

insert into public.combo_items (combo_id, product_id, qty)
select cb.id, p.id, v.qty from (values
('family-2999','CRK-002',2),('family-2999','CRK-003',2),('family-2999','CRK-005',2),('family-2999','CRK-009',2),('family-2999','CRK-012',1),('family-2999','CRK-015',1),
('kids-999','CRK-001',2),('kids-999','CRK-029',2),('kids-999','CRK-030',2),('kids-999','CRK-031',2),
('premium-7999','CRK-022',4),('premium-7999','CRK-019',4),('premium-7999','CRK-027',2),('premium-7999','CRK-004',3)
) as v(combo,code,qty)
join public.combos cb on cb.slug = v.combo
join public.products p on p.code = v.code;