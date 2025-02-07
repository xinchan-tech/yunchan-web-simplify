import { useState, useEffect } from 'react';

export function usePropValue<T>(controlledValue: T | undefined) {
  const [value, setValue] = useState<T | undefined>(controlledValue);

  useEffect(() => {
    if (controlledValue !== undefined) {
      setValue(controlledValue);
    }

  }, [controlledValue]);

 

  return [value, setValue] as const;
}
