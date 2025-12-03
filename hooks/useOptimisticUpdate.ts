import { useState, useCallback } from 'react';

/**
 * Hook para actualizaciones optimistas de UI
 * Actualiza la UI inmediatamente antes de confirmar con el servidor
 */
export function useOptimisticUpdate<T>(
  initialValue: T,
  updateFn: (value: T) => Promise<T>
) {
  const [value, setValue] = useState<T>(initialValue);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const update = useCallback(
    async (optimisticValue: T, rollbackOnError: boolean = true) => {
      // Guardar valor anterior para rollback
      const previousValue = value;
      
      // Actualización optimista inmediata
      setValue(optimisticValue);
      setIsUpdating(true);
      setError(null);

      try {
        // Actualización real en el servidor
        const confirmedValue = await updateFn(optimisticValue);
        setValue(confirmedValue);
        return confirmedValue;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Error desconocido');
        setError(error);
        
        // Rollback si es necesario
        if (rollbackOnError) {
          setValue(previousValue);
        }
        
        throw error;
      } finally {
        setIsUpdating(false);
      }
    },
    [value, updateFn]
  );

  return {
    value,
    update,
    isUpdating,
    error,
    setValue, // Para actualizaciones directas sin optimismo
  };
}

