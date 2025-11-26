-- Migration: Add Unique Codes to Indicators
-- Description: Adds codigo_unico field to maestra_indicadores for unique identification
-- Date: 2025-11-26

-- ============================================
-- 1. Add codigo_unico column
-- ============================================
ALTER TABLE maestra_indicadores
ADD COLUMN IF NOT EXISTS codigo_unico VARCHAR(50) UNIQUE;

-- ============================================
-- 2. Create index for fast lookup
-- ============================================
CREATE INDEX IF NOT EXISTS idx_maestra_indicadores_codigo ON maestra_indicadores(codigo_unico);

-- ============================================
-- 3. Create function to generate unique codes
-- ============================================
CREATE OR REPLACE FUNCTION generate_codigo_indicador(
  p_grado TEXT,
  p_materia TEXT,
  p_categoria TEXT
) RETURNS TEXT AS $$
DECLARE
  v_grado_code TEXT;
  v_materia_code TEXT;
  v_tipo_code TEXT;
  v_counter INTEGER;
  v_codigo TEXT;
BEGIN
  -- Extract grade code (e.g., "6to Grado" -> "6G")
  v_grado_code := CASE
    WHEN p_grado LIKE '%Maternal%' THEN 'MAT'
    WHEN p_grado LIKE '%Pre-Kinder%' THEN 'PKI'
    WHEN p_grado LIKE '%Kinder%' THEN 'KIN'
    WHEN p_grado LIKE '%Preparatorio%' THEN 'PRE'
    WHEN p_grado LIKE '1er Grado%' THEN '1G'
    WHEN p_grado LIKE '2do Grado%' THEN '2G'
    WHEN p_grado LIKE '3er Grado%' THEN '3G'
    WHEN p_grado LIKE '4to Grado%' THEN '4G'
    WHEN p_grado LIKE '5to Grado%' THEN '5G'
    WHEN p_grado LIKE '6to Grado%' THEN '6G'
    WHEN p_grado LIKE '1er Año%' THEN '1A'
    WHEN p_grado LIKE '2do Año%' THEN '2A'
    WHEN p_grado LIKE '3er Año%' THEN '3A'
    WHEN p_grado LIKE '4to Año%' THEN '4A'
    WHEN p_grado LIKE '5to Año%' THEN '5A'
    ELSE 'OTR'
  END;

  -- Extract subject code (first 3 letters, uppercase)
  v_materia_code := UPPER(SUBSTRING(REGEXP_REPLACE(p_materia, '[^a-zA-Z]', '', 'g'), 1, 3));
  
  -- Type code: C for Competencia, I for Indicador
  v_tipo_code := CASE
    WHEN p_categoria = 'Competencia' THEN 'C'
    WHEN p_categoria = 'Indicador' THEN 'I'
    ELSE 'X'
  END;

  -- Find next available number
  SELECT COALESCE(MAX(
    CAST(SUBSTRING(codigo_unico FROM '[0-9]+$') AS INTEGER)
  ), 0) + 1
  INTO v_counter
  FROM maestra_indicadores
  WHERE codigo_unico LIKE v_grado_code || '-' || v_materia_code || '-' || v_tipo_code || '-%';

  -- Generate final code
  v_codigo := v_grado_code || '-' || v_materia_code || '-' || v_tipo_code || '-' || LPAD(v_counter::TEXT, 3, '0');

  RETURN v_codigo;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 4. Update existing records with generated codes
-- ============================================
DO $$
DECLARE
  rec RECORD;
  v_codigo TEXT;
  v_clase RECORD;
BEGIN
  FOR rec IN 
    SELECT mi.id_indicador, mi.categoria, c.grado_asignado, c.nombre_materia
    FROM maestra_indicadores mi
    JOIN clases c ON mi.id_clase = c.id_clase
    WHERE mi.codigo_unico IS NULL
    ORDER BY mi.created_at
  LOOP
    -- Generate code
    v_codigo := generate_codigo_indicador(
      rec.grado_asignado,
      rec.nombre_materia,
      rec.categoria
    );
    
    -- Update record
    UPDATE maestra_indicadores
    SET codigo_unico = v_codigo
    WHERE id_indicador = rec.id_indicador;
  END LOOP;
END $$;

-- ============================================
-- 5. Add comment
-- ============================================
COMMENT ON COLUMN maestra_indicadores.codigo_unico IS 'Unique code for identification (e.g., 6G-MAT-C-001)';

-- ============================================
-- 6. Create trigger to auto-generate codes on insert
-- ============================================
CREATE OR REPLACE FUNCTION auto_generate_codigo_indicador()
RETURNS TRIGGER AS $$
DECLARE
  v_clase RECORD;
BEGIN
  -- Only generate if codigo_unico is not provided
  IF NEW.codigo_unico IS NULL THEN
    -- Get class information
    SELECT grado_asignado, nombre_materia
    INTO v_clase
    FROM clases
    WHERE id_clase = NEW.id_clase;
    
    -- Generate code
    NEW.codigo_unico := generate_codigo_indicador(
      v_clase.grado_asignado,
      v_clase.nombre_materia,
      NEW.categoria
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_codigo_indicador
  BEFORE INSERT ON maestra_indicadores
  FOR EACH ROW
  EXECUTE FUNCTION auto_generate_codigo_indicador();
