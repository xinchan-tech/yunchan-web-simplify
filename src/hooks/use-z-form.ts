import {  useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import type { z } from "zod"


// biome-ignore lint/suspicious/noExplicitAny: <explanation>
const useZForm = <T extends z.Schema<any, any>, P extends z.infer<T> = unknown>(schema: T, initValues: P) => {
  return useForm<P>({
    resolver: zodResolver(schema),
    defaultValues: initValues,
  })
}

export default useZForm