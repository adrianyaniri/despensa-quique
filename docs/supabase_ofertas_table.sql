-- ==============================================================================
-- Tabla de Ofertas Diarias y Combos (Módulo /ofertas)
-- Almacén Quique
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.ofertas (
  id TEXT PRIMARY KEY,
  titulo TEXT NOT NULL,
  descripcion TEXT NOT NULL,
  precio_regular NUMERIC,
  precio_oferta NUMERIC NOT NULL,
  vigencia_hasta TIMESTAMPTZ,
  stock_limite INTEGER,
  activo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Habilitar Row Level Security (RLS)
ALTER TABLE public.ofertas ENABLE ROW LEVEL SECURITY;

-- Política 1: Lectura pública (Cualquier visitante puede consultar las ofertas)
CREATE POLICY "Lectura pública de ofertas"
ON public.ofertas
FOR SELECT
USING (true);

-- Política 2: Escritura/Edición/Eliminación solo para el usuario administrador autenticado
CREATE POLICY "Gestión completa para administradores"
ON public.ofertas
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Datos iniciales de ejemplo (Opcional)
INSERT INTO public.ofertas (id, titulo, descripcion, precio_regular, precio_oferta, vigencia_hasta, stock_limite, activo)
VALUES 
  (
    'combo-picada-amigos',
    'Combo Picada con Amigos',
    '1 Salame Criollo de Campo + 300g Queso Mar del Plata + 1 Paquete de Maní Tostado + 1 Cerveza Quilmes 1L Retornable',
    15500,
    11900,
    timezone('utc'::text, now() + interval '2 days'),
    10,
    true
  ),
  (
    'combo-desayuno-saludable',
    'Combo Desayuno Saludable',
    '500g Granola Artesanal con Frutos Secos + 1 Frasco de Miel Pura 500g + 250g Nueces Mariposa Seleccionadas',
    12800,
    9500,
    timezone('utc'::text, now() + interval '3 days'),
    15,
    true
  ),
  (
    'pack-esenciales-almacen',
    'Pack Almacén Esenciales de la Semana',
    'Yerba Playadito 1kg + Azúcar Ledesma 1kg + Fideos Matarazzo 500g + Aceite Natura 900ml',
    11200,
    8900,
    timezone('utc'::text, now() + interval '1 day'),
    8,
    true
  )
ON CONFLICT (id) DO NOTHING;
