-- Esquema para llevar el panel a producción con Supabase (PostgreSQL).
-- Ejecuta este archivo en: Supabase → SQL Editor → New query → Run.
-- Cada negocio solo ve sus propios datos gracias a Row Level Security (RLS).

create extension if not exists "pgcrypto";

-- Negocio (un registro por dueño)
create table if not exists negocios (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade default auth.uid(),
  nombre text not null,
  ruc text,
  direccion text,
  telefono text,
  creado_en timestamptz not null default now()
);

create table if not exists productos (
  id uuid primary key default gen_random_uuid(),
  negocio_id uuid not null references negocios (id) on delete cascade,
  nombre text not null,
  categoria text not null default 'General',
  precio numeric(10, 2) not null check (precio >= 0),
  stock integer not null default 0 check (stock >= 0),
  minimo integer not null default 0 check (minimo >= 0),
  unidad text not null default 'und.',
  emoji text default '📦',
  creado_en timestamptz not null default now()
);

create table if not exists clientes (
  id uuid primary key default gen_random_uuid(),
  negocio_id uuid not null references negocios (id) on delete cascade,
  nombre text not null,
  telefono text,
  deuda numeric(10, 2) not null default 0 check (deuda >= 0),
  creado_en timestamptz not null default now()
);

create type metodo_pago as enum ('Efectivo', 'Yape/Plin', 'Tarjeta');

create table if not exists ventas (
  id uuid primary key default gen_random_uuid(),
  negocio_id uuid not null references negocios (id) on delete cascade,
  serie text not null default 'B001',
  numero integer not null,
  fecha timestamptz not null default now(),
  cliente_id uuid references clientes (id) on delete set null,
  metodo metodo_pago not null,
  vendedor text,
  total numeric(10, 2) not null,
  unique (negocio_id, serie, numero)
);

create table if not exists venta_items (
  id uuid primary key default gen_random_uuid(),
  venta_id uuid not null references ventas (id) on delete cascade,
  producto_id uuid not null references productos (id),
  cantidad integer not null check (cantidad > 0),
  precio_unitario numeric(10, 2) not null,
  subtotal numeric(10, 2) not null
);

create table if not exists movimientos_caja (
  id uuid primary key default gen_random_uuid(),
  negocio_id uuid not null references negocios (id) on delete cascade,
  fecha timestamptz not null default now(),
  concepto text not null,
  tipo text not null check (tipo in ('ingreso', 'egreso')),
  monto numeric(10, 2) not null check (monto > 0)
);

create index if not exists ventas_negocio_fecha on ventas (negocio_id, fecha desc);
create index if not exists caja_negocio_fecha on movimientos_caja (negocio_id, fecha desc);

-- ---------- Seguridad: cada dueño solo accede a su negocio ----------
alter table negocios enable row level security;
alter table productos enable row level security;
alter table clientes enable row level security;
alter table ventas enable row level security;
alter table venta_items enable row level security;
alter table movimientos_caja enable row level security;

create policy "dueño gestiona su negocio" on negocios
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

create or replace function es_mi_negocio(n uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from negocios where id = n and owner_id = auth.uid())
$$;

create policy "productos del negocio" on productos for all using (es_mi_negocio(negocio_id)) with check (es_mi_negocio(negocio_id));
create policy "clientes del negocio" on clientes for all using (es_mi_negocio(negocio_id)) with check (es_mi_negocio(negocio_id));
create policy "ventas del negocio" on ventas for all using (es_mi_negocio(negocio_id)) with check (es_mi_negocio(negocio_id));
create policy "caja del negocio" on movimientos_caja for all using (es_mi_negocio(negocio_id)) with check (es_mi_negocio(negocio_id));
create policy "items de mis ventas" on venta_items for all
  using (exists (select 1 from ventas v where v.id = venta_id and es_mi_negocio(v.negocio_id)))
  with check (exists (select 1 from ventas v where v.id = venta_id and es_mi_negocio(v.negocio_id)));

-- ---------- Registrar una venta de forma atómica ----------
-- Inserta la venta, sus ítems, descuenta stock y registra el ingreso en caja si es en efectivo.
-- Uso desde el front: supabase.rpc('registrar_venta', { p_negocio, p_cliente, p_metodo, p_items })
-- p_items = [{ "producto_id": "...", "cantidad": 2 }, ...]
create or replace function registrar_venta(p_negocio uuid, p_cliente uuid, p_metodo metodo_pago, p_items jsonb)
returns ventas language plpgsql security invoker as $$
declare
  v ventas;
  it jsonb;
  prod productos;
  total_venta numeric(10, 2) := 0;
begin
  if not es_mi_negocio(p_negocio) then raise exception 'Sin acceso a este negocio'; end if;

  insert into ventas (negocio_id, numero, cliente_id, metodo, total)
  values (p_negocio, coalesce((select max(numero) from ventas where negocio_id = p_negocio), 0) + 1, p_cliente, p_metodo, 0)
  returning * into v;

  for it in select * from jsonb_array_elements(p_items) loop
    select * into prod from productos where id = (it ->> 'producto_id')::uuid and negocio_id = p_negocio for update;
    if prod.stock < (it ->> 'cantidad')::int then raise exception 'Stock insuficiente: %', prod.nombre; end if;
    update productos set stock = stock - (it ->> 'cantidad')::int where id = prod.id;
    insert into venta_items (venta_id, producto_id, cantidad, precio_unitario, subtotal)
    values (v.id, prod.id, (it ->> 'cantidad')::int, prod.precio, prod.precio * (it ->> 'cantidad')::int);
    total_venta := total_venta + prod.precio * (it ->> 'cantidad')::int;
  end loop;

  update ventas set total = total_venta where id = v.id returning * into v;
  if p_metodo = 'Efectivo' then
    insert into movimientos_caja (negocio_id, concepto, tipo, monto)
    values (p_negocio, 'Venta ' || v.serie || '-' || lpad(v.numero::text, 6, '0'), 'ingreso', total_venta);
  end if;
  return v;
end $$;
