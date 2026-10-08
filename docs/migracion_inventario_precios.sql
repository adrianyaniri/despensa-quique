-- ==============================================================================
-- Migración Completa: Inventario Maestro, Categorías, RLS y Precarga de Tickets
-- Almacén Quique
-- ==============================================================================

-- 1. TABLA DE CATEGORÍAS
CREATE TABLE IF NOT EXISTS public.categorias (
  id TEXT PRIMARY KEY,
  nombre TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.categorias ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Lectura pública de categorias" ON public.categorias;
CREATE POLICY "Lectura pública de categorias"
ON public.categorias FOR SELECT USING (true);

DROP POLICY IF EXISTS "Gestión completa de categorias para administradores" ON public.categorias;
CREATE POLICY "Gestión completa de categorias para administradores"
ON public.categorias FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Semilla de Categorías
INSERT INTO public.categorias (id, nombre)
VALUES
  ('bebidas', 'Bebidas'),
  ('cervezas', 'Cervezas'),
  ('vinos', 'Vinos'),
  ('promos', 'Promos'),
  ('picadas', 'Picadas'),
  ('snacks', 'Snacks')
ON CONFLICT (id) DO NOTHING;

-- 2. TABLA DE PRODUCTOS
ALTER TABLE public.productos 
ADD COLUMN IF NOT EXISTS mostrar_en_precios BOOLEAN NOT NULL DEFAULT true;

CREATE INDEX IF NOT EXISTS idx_productos_mostrar_en_precios 
ON public.productos (mostrar_en_precios) 
WHERE mostrar_en_precios = true;

CREATE UNIQUE INDEX IF NOT EXISTS idx_productos_nombre_unico
ON public.productos (lower(trim(nombre)));

-- 3. POLÍTICAS DE ROW LEVEL SECURITY (RLS)
DROP POLICY IF EXISTS "Lectura pública de productos" ON public.productos;
CREATE POLICY "Lectura pública de productos"
ON public.productos
FOR SELECT
USING (mostrar_en_precios = true);

DROP POLICY IF EXISTS "Gestión completa de productos para administradores" ON public.productos;
CREATE POLICY "Gestión completa de productos para administradores"
ON public.productos
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- 4. PRECARGA TOTAL DE PRODUCTOS (Gaseosas, Cervezas, Vinos, Snacks, Picadas)
INSERT INTO public.productos (id, nombre, categoria, precio, descripcion, unidad, disponible, mostrar_en_precios)
VALUES
  ('coca-ret', 'Coca Cola retornable', 'Bebidas', 3500, 'Botella retornable.', 'c/u', true, true),
  ('fanta-ret', 'Fanta retornable', 'Bebidas', 3500, 'Botella retornable.', 'c/u', true, true),
  ('sprite-ret', 'Sprite retornable', 'Bebidas', 3500, 'Botella retornable.', 'c/u', true, true),
  ('coca-1750', 'Coca Cola 1.75 L', 'Bebidas', 4500, 'Botella descartable 1.75 L', 'c/u', true, true),
  ('coca-2250', 'Coca Cola 2.25 L', 'Bebidas', 5500, 'Botella descartable 2.25 L', 'c/u', true, true),
  ('aquarius-1500', 'Aquarius 1.5 L', 'Bebidas', 2700, 'Sabores variados bien fríos', 'c/u', true, true),
  ('aquarius-2250', 'Aquarius 2.25 L', 'Bebidas', 3500, 'Ideal para compartir.', 'c/u', true, true),
  ('seven-up-ret', 'Seven Up retornable', 'Bebidas', 3800, 'Botella retornable.', 'c/u', true, true),
  ('heineken-1000', 'Heineken 1 L', 'Cervezas', 5900, 'Botella 1 L', 'c/u', true, true),
  ('heineken-710', 'Heineken 710 ml', 'Cervezas', 4800, 'Botella 710 ml', 'c/u', true, true),
  ('stella-1000', 'Stella Artois 1 L', 'Cervezas', 5900, 'Cerveza rubia 1 L', 'c/u', true, true),
  ('stella-710', 'Stella Artois 710 ml', 'Cervezas', 5200, 'Botella 710 ml', 'c/u', true, true),
  ('brahma-1000', 'Brahma 1 L', 'Cervezas', 3900, 'Cerveza rubia 1 L', 'c/u', true, true),
  ('andes-473', 'Andes 473 ml (Lata)', 'Cervezas', 2900, 'Lata 473 ml', 'c/u', true, true),
  ('andes-1000', 'Andes 1 L', 'Cervezas', 4500, 'Cerveza rubia 1 L', 'c/u', true, true),
  ('promo-fernet-coca', 'Fernet Branca 750 ml + Coca Cola 1.75 L', 'Promos', 25000, 'El combo clásico listo para disfrutar.', 'c/u', true, true),
  ('picada-4-5', 'Picada para 4 a 5 personas', 'Picadas', 4000, 'Variedad de fiambres, quesos y snacks.', 'c/u', true, true),
  ('papas-55g', 'Papas Americanas tradicionales 55 g', 'Snacks', 1800, 'Crocantes y saladas.', 'c/u', true, true),
  ('papas-420g', 'Papas tradicionales americanas 420 g', 'Snacks', 1300, 'Bolsa grande para compartir.', 'c/u', true, true),
  ('chizitos-60g', 'Chizitos 60 g', 'Snacks', 1400, 'Snack horneado con queso.', 'c/u', true, true),
  ('bastoncitos-60g', 'Bastoncitos 60 g', 'Snacks', 1400, 'Snack salado crocante.', 'c/u', true, true),
  ('chizitos-240g', 'Chizitos 240 g', 'Snacks', 6000, 'Bolsa familiar para compartir.', 'c/u', true, true),
  ('bastoncitos-240g', 'Bastoncitos 240 g', 'Snacks', 6000, 'Bolsa familiar para compartir.', 'c/u', true, true),
  ('7up-pepsi-500', '7Up / Pepsi 500 ml', 'Bebidas', 1400, 'Botella descartable 500 ml', 'c/u', true, true),
  ('coca-2reto', 'Coca Cola 2 L Retornable', 'Bebidas', 3500, 'Botella retornable 2 L', 'c/u', true, true),
  ('coca-600', 'Coca Cola 600 ml', 'Bebidas', 1700, 'Botella personal 600 ml', 'c/u', true, true),
  ('coca-1000', 'Coca Cola 1 L', 'Bebidas', 3100, 'Botella de 1 L', 'c/u', true, true),
  ('coca-2reto-zero', 'Coca Cola Zero 2 L Retornable', 'Bebidas', 2800, 'Botella retornable sin azúcar', 'c/u', true, true),
  ('coca-2250-zero', 'Coca Cola Zero 2.25 L', 'Bebidas', 2500, 'Botella descartable sin azúcar', 'c/u', true, true),
  ('fanta-2reto', 'Fanta 2 L Retornable', 'Bebidas', 2800, 'Botella retornable 2 L', 'c/u', true, true),
  ('fanta-2250', 'Fanta 2.25 L', 'Bebidas', 2500, 'Botella descartable 2.25 L', 'c/u', true, true),
  ('fanta-1750', 'Fanta 1.75 L', 'Bebidas', 3100, 'Botella descartable 1.75 L', 'c/u', true, true),
  ('sprite-2reto', 'Sprite 2 L Retornable', 'Bebidas', 2800, 'Botella retornable 2 L', 'c/u', true, true),
  ('sprite-1750', 'Sprite 1.75 L', 'Bebidas', 3100, 'Botella descartable 1.75 L', 'c/u', true, true),
  ('sprite-2250', 'Sprite 2.25 L', 'Bebidas', 2200, 'Botella descartable 2.25 L', 'c/u', true, true),
  ('crush', 'Crush', 'Bebidas', 1800, 'Gaseosa Crush', 'c/u', true, true),
  ('coca-lata', 'Coca Cola Lata', 'Bebidas', 190, 'Lata 354 ml', 'c/u', true, true),
  ('pepsi-2reto', 'Pepsi 2 L Retornable', 'Bebidas', 3900, 'Botella retornable 2 L', 'c/u', true, true),
  ('pepsi-2250', 'Pepsi 2.25 L', 'Bebidas', 1100, 'Botella descartable 2.25 L', 'c/u', true, true),
  ('pdt-1500-pomelo', 'Paso de los Toros 1.5 L Pomelo', 'Bebidas', 3400, 'Gaseosa pomelo 1.5 L', 'c/u', true, true),
  ('7up-pdt-2450', '7Up / Paso de los Toros 2.45 L', 'Bebidas', 1100, 'Botella descartable', 'c/u', true, true),
  ('7up-lata', '7Up Lata', 'Bebidas', 270, 'Lata 354 ml', 'c/u', true, true),
  ('pepsi-2000-descar', 'Pepsi 2 L Descartable', 'Bebidas', 1100, 'Botella descartable 2 L', 'c/u', true, true),
  ('7up-2450', '7Up 2.45 L', 'Bebidas', 2500, 'Botella descartable 2.45 L', 'c/u', true, true),
  ('schweppes-1500', 'Schweppes 1.5 L', 'Bebidas', 1150, 'Tónica / Pomelo 1.5 L', 'c/u', true, true),
  ('monster-energy', 'Monster Energy', 'Bebidas', 2800, 'Bebida energizante 473 ml', 'c/u', true, true),
  ('mirinda-2250', 'Mirinda 2.25 L', 'Bebidas', 530, 'Gaseosa sabor naranja 2.25 L', 'c/u', true, true),
  ('aime-malbec', 'Aimé Malbec', 'Vinos', 650, 'Vino tinto 750 ml', 'c/u', true, true),
  ('nieto-malbec', 'Nieto Senetiner Malbec', 'Vinos', 1800, 'Vino tinto 750 ml', 'c/u', true, true),
  ('terma-1350', 'Terma 1.35 L', 'Bebidas', 2700, 'Bebida a base de hierbas', 'c/u', true, true),
  ('finca-las-moras', 'Finca Las Moras Malbec', 'Vinos', 5500, 'Vino tinto 750 ml', 'c/u', true, true),
  ('los-arboles-malbec', 'Los Árboles Malbec', 'Vinos', 6800, 'Vino tinto 750 ml', 'c/u', true, true),
  ('alma-mora-malbec', 'Alma Mora Malbec', 'Vinos', 8500, 'Vino tinto 750 ml', 'c/u', true, true),
  ('alaris-malbec', 'Alaris Malbec Trapiche', 'Vinos', 6000, 'Vino tinto 750 ml', 'c/u', true, true),
  ('quilmes-1000', 'Quilmes 1 L', 'Cervezas', 3600, 'Cerveza rubia 1 L', 'c/u', true, true),
  ('heineken-330', 'Heineken 330 ml', 'Cervezas', 290, 'Porrón / Botella 330 ml', 'c/u', true, true),
  ('miller-1000', 'Miller 1 L', 'Cervezas', 5500, 'Cerveza rubia 1 L', 'c/u', true, true),
  ('quilmes-ipa-473', 'Quilmes IPA 473 ml (Lata)', 'Cervezas', 2800, 'Lata 473 ml', 'c/u', true, true),
  ('budweiser-710', 'Budweiser 710 ml', 'Cervezas', 3200, 'Botella 710 ml', 'c/u', true, true),
  ('stella-330', 'Stella Artois 330 ml', 'Cervezas', 3500, 'Porrón 330 ml', 'c/u', true, true),
  ('amstel-1000', 'Amstel Lager 1 L', 'Cervezas', 3800, 'Cerveza rubia 1 L', 'c/u', true, true),
  ('stella-473', 'Stella Artois 473 ml (Lata)', 'Cervezas', 3200, 'Lata 473 ml', 'c/u', true, true),
  ('schneider-710', 'Schneider 710 ml', 'Cervezas', 2900, 'Botella 710 ml', 'c/u', true, true),
  ('brahma-473', 'Brahma 473 ml (Lata)', 'Cervezas', 2300, 'Lata 473 ml', 'c/u', true, true),
  ('schneider-473', 'Schneider 473 ml (Lata)', 'Cervezas', 2000, 'Lata 473 ml', 'c/u', true, true),
  ('patagonia-730', 'Patagonia 730 ml', 'Cervezas', 4500, 'Botella 730 ml', 'c/u', true, true),
  ('corona-710', 'Corona 710 ml', 'Cervezas', 5300, 'Botella 710 ml', 'c/u', true, true),
  ('heineken-473', 'Heineken 473 ml (Lata)', 'Cervezas', 3300, 'Lata 473 ml', 'c/u', true, true),
  ('budweiser-710t', 'Budweiser 710 ml T', 'Cervezas', 3400, 'Botella 710 ml', 'c/u', true, true),
  ('imperial-473', 'Imperial 473 ml (Lata)', 'Cervezas', 2300, 'Lata 473 ml', 'c/u', true, true),
  ('patagonia-4100', 'Patagonia 410 ml', 'Cervezas', 340, 'Lata 410 ml', 'c/u', true, true),
  ('corona-410', 'Corona 410 ml (Lata)', 'Cervezas', 3200, 'Lata 410 ml', 'c/u', true, true),
  ('patagonia-retor', 'Patagonia Retornable', 'Cervezas', 3700, 'Botella retornable', 'c/u', true, true),
  ('corona-330', 'Corona 330 ml', 'Cervezas', 3200, 'Porrón 330 ml', 'c/u', true, true),
  ('andes-ipa-1000', 'Andes IPA 1 L', 'Cervezas', 4500, 'Botella 1 L', 'c/u', true, true),
  ('miller-473', 'Miller 473 ml (Lata)', 'Cervezas', 1000, 'Lata 473 ml', 'c/u', true, true),
  ('stella-gold-330', 'Stella Artois Gold 330 ml', 'Cervezas', 3700, 'Porrón 330 ml', 'c/u', true, true),
  ('salta-cautiva-473', 'Salta Cautiva 473 ml (Lata)', 'Cervezas', 1100, 'Lata 473 ml', 'c/u', true, true),
  ('imperial-golden', 'Imperial Golden 1 L', 'Cervezas', 3500, 'Botella 1 L', 'c/u', true, true),
  ('andes-710', 'Andes 710 ml', 'Cervezas', 3600, 'Botella 710 ml', 'c/u', true, true),
  ('brahma-710', 'Brahma 710 ml', 'Cervezas', 3100, 'Botella 710 ml', 'c/u', true, true)
ON CONFLICT (id) DO UPDATE SET
  nombre = EXCLUDED.nombre,
  categoria = EXCLUDED.categoria,
  precio = EXCLUDED.precio,
  descripcion = EXCLUDED.descripcion,
  unidad = EXCLUDED.unidad,
  disponible = EXCLUDED.disponible,
  mostrar_en_precios = EXCLUDED.mostrar_en_precios;
