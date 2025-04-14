import { zodResolver } from '@hookform/resolvers/zod'
import { FieldValues, useForm } from 'react-hook-form'
import type { ZodRawShape, z } from 'zod'
export const useZForm = <T extends z.ZodTypeAny, P extends z.infer<T>>(schema: T, initValues: P) => {
  return useForm<z.infer<T>>({
    resolver: zodResolver(schema),
    defaultValues: initValues
  })
}
