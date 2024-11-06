import {  FieldValues, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import type { z, ZodRawShape } from "zod"
const useZForm = <T extends z.ZodTypeAny, P extends z.infer<T>>(schema: T, initValues: P) => {
  return useForm<z.infer<T>>({
    resolver: zodResolver(schema),
    defaultValues: initValues,
  })
}

export default useZForm