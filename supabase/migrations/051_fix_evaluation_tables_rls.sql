-- Migration: Fix RLS policies for evaluation tables
-- Description: Adds missing RLS policies for resumen_evaluacion_alumno and detalle_evaluacion_alumno
--              These tables were created after the unified auth system migration
--              and need policies aligned with the current permission system
-- Date: 2025-01-XX

-- ============================================
-- RESUMEN_EVALUACION_ALUMNO
-- ============================================
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Authenticated users can manage resumen_evaluacion_alumno" ON resumen_evaluacion_alumno;
DROP POLICY IF EXISTS "Coordinators manage resumen" ON resumen_evaluacion_alumno;
DROP POLICY IF EXISTS "Teachers view resumen" ON resumen_evaluacion_alumno;
DROP POLICY IF EXISTS "Teachers manage own resumen" ON resumen_evaluacion_alumno;

-- Coordinadores and directivos can manage all summaries
CREATE POLICY "Coordinators manage resumen" ON resumen_evaluacion_alumno
  FOR ALL TO authenticated
  USING (public.user_role() IN ('coordinador', 'directivo'));

-- Teachers can view summaries (they need to see evaluation data)
CREATE POLICY "Teachers view resumen" ON resumen_evaluacion_alumno
  FOR SELECT TO authenticated
  USING (public.user_role() = 'docente');

-- Teachers can also create/update summaries for evaluations they created
-- (This allows teachers to save their own evaluation summaries)
CREATE POLICY "Teachers manage own resumen" ON resumen_evaluacion_alumno
  FOR ALL TO authenticated
  USING (
    public.user_role() = 'docente'
    AND EXISTS (
      SELECT 1 FROM minutas_evaluacion me
      WHERE me.id_minuta = resumen_evaluacion_alumno.id_minuta
      AND me.created_by = auth.uid()
    )
  )
  WITH CHECK (
    public.user_role() = 'docente'
    AND EXISTS (
      SELECT 1 FROM minutas_evaluacion me
      WHERE me.id_minuta = resumen_evaluacion_alumno.id_minuta
      AND me.created_by = auth.uid()
    )
  );

-- ============================================
-- DETALLE_EVALUACION_ALUMNO
-- ============================================
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Authenticated users can read detalle_evaluacion_alumno" ON detalle_evaluacion_alumno;
DROP POLICY IF EXISTS "Coordinadores and directivos can manage detalle_evaluacion_alumno" ON detalle_evaluacion_alumno;
DROP POLICY IF EXISTS "Coordinators manage detalle" ON detalle_evaluacion_alumno;
DROP POLICY IF EXISTS "Teachers view detalle" ON detalle_evaluacion_alumno;
DROP POLICY IF EXISTS "Teachers manage own detalle" ON detalle_evaluacion_alumno;

-- Coordinadores and directivos can manage all details
CREATE POLICY "Coordinators manage detalle" ON detalle_evaluacion_alumno
  FOR ALL TO authenticated
  USING (public.user_role() IN ('coordinador', 'directivo'));

-- Teachers can view details
CREATE POLICY "Teachers view detalle" ON detalle_evaluacion_alumno
  FOR SELECT TO authenticated
  USING (public.user_role() = 'docente');

-- Teachers can also create/update details for evaluations they created
CREATE POLICY "Teachers manage own detalle" ON detalle_evaluacion_alumno
  FOR ALL TO authenticated
  USING (
    public.user_role() = 'docente'
    AND EXISTS (
      SELECT 1 FROM minutas_evaluacion me
      WHERE me.id_minuta = detalle_evaluacion_alumno.id_minuta
      AND me.created_by = auth.uid()
    )
  )
  WITH CHECK (
    public.user_role() = 'docente'
    AND EXISTS (
      SELECT 1 FROM minutas_evaluacion me
      WHERE me.id_minuta = detalle_evaluacion_alumno.id_minuta
      AND me.created_by = auth.uid()
    )
  );

-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON POLICY "Coordinators manage resumen" ON resumen_evaluacion_alumno IS 'Coordinadores and directivos can manage all evaluation summaries';
COMMENT ON POLICY "Teachers view resumen" ON resumen_evaluacion_alumno IS 'Teachers can view evaluation summaries';
COMMENT ON POLICY "Teachers manage own resumen" ON resumen_evaluacion_alumno IS 'Teachers can manage summaries for evaluations they created';
COMMENT ON POLICY "Coordinators manage detalle" ON detalle_evaluacion_alumno IS 'Coordinadores and directivos can manage all evaluation details';
COMMENT ON POLICY "Teachers view detalle" ON detalle_evaluacion_alumno IS 'Teachers can view evaluation details';
COMMENT ON POLICY "Teachers manage own detalle" ON detalle_evaluacion_alumno IS 'Teachers can manage details for evaluations they created';

