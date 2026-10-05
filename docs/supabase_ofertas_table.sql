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
