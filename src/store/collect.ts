import { getStockCollectCates } from "@/api"
import { create } from "zustand"
import { createJSONStorage, persist } from "zustand/middleware"

type CollectCate = {
    /**
   * 唯一标识
   */
    id: string

    /**
     * 名称
     */
    name: string
  
    /**
     * 创建时间戳
     */
    create_time: string
  
    /**
     * 激活状态
     */
    active: number
  
    /**
     * 总数
     */
    total: string
}

interface CollectCateStore {
  collects: CollectCate[]
  setCollects: (goldenPool: CollectCate[]) => void
  removeCollect: (id: string) => void
  refresh: () => Promise<void>
}

export const useCollectCates = create<CollectCateStore>()(
  persist((set) => ({
    collects: [],
    setCollects: (collects) => set({ collects }),
    removeCollect: (id) => set((state) => ({
      collects: state.collects.filter(item => item.id !== id)
    })),
    refresh: async () => {
      await getStockCollectCates().then(r => set({ collects: r }))
    }
  }), {
    name: 'collect-cate',
    storage: createJSONStorage(() => localStorage)
  })
)