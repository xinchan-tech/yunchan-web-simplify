import { useMemo } from "react"
import { useLocation, useNavigate } from "react-router"

export const useQueryParams = <T = NormalizedRecord<any>>(): [T, (params: Partial<T>) => void] => {
  const { search, pathname } = useLocation()
  const navigate = useNavigate()

  const searchParams = useMemo(() => {
    const params = new URLSearchParams(search)
    const result: Record<string, any> = {}
    for (const [key, value] of (params as any).entries()) {
      result[key] = value
    }
    return result as T
  }, [search])

  const setSearch = (params: Partial<T>) => {
    const searchParams = new URLSearchParams(params as any)
  
    navigate(`${pathname}?${searchParams.toString()}`)
    
  }

  return [searchParams, setSearch]
}
