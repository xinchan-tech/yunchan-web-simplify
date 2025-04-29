import { getPlateList, getStockCollectCates } from '@/api'
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  JknIcon,
  ToggleGroup,
  ToggleGroupItem
} from '@/components'
import { useAuthorized } from '@/hooks'
import { cn } from '@/utils/style'
import { useQuery } from '@tanstack/react-query'
import { useMount, useUnmount } from 'ahooks'
import { useContext, useEffect, useMemo, useRef, useState } from 'react'
import { SuperStockContext } from '../ctx'
import { SuperCarousel } from './super-carousel'
import { CrownIcon, StockTrendIcon } from './super-icon'

const FirstStep = () => {
  const [type, setType] = useState('FeaturedRanking')

  return (
    <div className="w-full">
      <div className="w-full text-[18px] text-[#B8B8B8] font-[500] flex flex-row gap-5 items-center">
        <span>选股范围</span>
        <span className="w-[1px] h-[14px] bg-[#2E2E2E]" />
        <span>
          <DropdownSelector onSelect={setType} selectedType={type} />
        </span>
      </div>

      <div className="mt-8">
        {
          {
            // 特色榜单
            FeaturedRanking: <FeaturedRankingPanel />,
            // 股票金池
            GoldenPool: <GoldenPoolPanel />,
            // 行业板块
            IndustrySector: <SectorPanel type={1} />,
            // 概念板块
            ConceptSector: <SectorPanel type={2} />
          }[type]
        }
      </div>
    </div>
  )
}

interface DropdownSelectorProps {
  onSelect: (type: string) => void
  selectedType: string
}

/**
 * 下拉选择组件
 * @param param0 下拉选择组件参数
 * @param param0.onSelect 选择回调
 * @param param0.selectedType 选中类型
 * @returns 下拉选择组件
 */
const DropdownSelector = ({ onSelect, selectedType }: DropdownSelectorProps) => {
  const options = [
    {
      id: 'FeaturedRanking',
      name: '特色榜单',
      icon: <CrownIcon />
    },
    {
      id: 'GoldenPool',
      name: '我的自选',
      icon: <StockTrendIcon />
    },
    {
      id: 'IndustrySector',
      name: '行业板块',
      icon: <JknIcon.Svg name="industry" size={14} color="#575757" />
    },
    {
      id: 'ConceptSector',
      name: '概念板块',
      icon: <JknIcon.Svg name="concept" size={14} color="#575757" />
    }
  ]

  const selectedOption = options.find(option => option.id === selectedType) || options[0]

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="h-[28px] px-[10px] border-[#808080] text-[#B8B8B8]">
          <div className="flex items-center gap-[6px]">
            {selectedOption.icon}
            {selectedOption.name}
          </div>
          <JknIcon.Svg name="arrow-down" size={8} className="" color="#B8B8B8" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-36 text-base bg-[#1F1F1F] text-[#B8B8B8] [&>*:hover]:bg-[#2E2E2E] border-solid border-[#2E2E2E]">
        {options.map(option => (
          <DropdownMenuItem key={option.id} onClick={() => onSelect(option.id)}>
            <div className="flex items-center gap-[6px]">
              {option.icon}
              {option.name}
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

/**
 * 特色榜单
 */
const FeaturedRankingPanel = () => {
  const ctx = useContext(SuperStockContext)
  const data = (ctx.data?.stock_range?.children?.t_recommend.from_datas ?? []) as unknown as {
    name: string
    value: string
    authorized: 0 | 1
  }[]
  const selection = useRef<string[]>([])

  useMount(() => {
    ctx.register(
      'recommend',
      1,
      () => [...selection.current],
      () => selection.current.length > 0
    )
  })

  useUnmount(() => {
    ctx.unregister('recommend')
    selection.current = []
  })

  const [_, toastNotAuth] = useAuthorized()

  const getIcon = (name: string) => {
    if (name === '首页热门榜') {
      return <JknIcon name="ic_fire_red" />
    } if (name === '小盘黑马榜') {
      return <JknIcon name="ic_diamond" />
    } if (name === '今日股王榜') {
      return <JknIcon name="ic_crown" />
    } if (name === 'TOP1000+强') {
      return <JknIcon name="ic_good" />
    }
    return null
  }

  const hasRecommend = (name: string) => {
    if (name === '首页热门榜') {
      return true
    }if (name === '小盘黑马榜') {
      return true
    }if (name === '今日股王榜') {
      return true
    }if (name === 'TOP1000+强') {
      return true
    }
    return false
  }

  

  return (
    <ToggleGroup
      className="grid grid-cols-4 gap-4"
      type="multiple"
      onValueChange={value => {
        selection.current = value
      }}
      hoverColor="#2E2E2E"
    >
      {data?.map(child =>
        child.name !== '' ? (
          <div key={child.value} onClick={() => !child.authorized && toastNotAuth()} onKeyDown={() => { }}>
            <ToggleGroupItem
              value={child.value}
              disabled={!child.authorized}
              className={cn(
                'w-full h-16 rounded-sm border border-[#2E2E2E] bg-transparent relative group',
                'data-[state=on]:bg-accent data-[state=on]:text-secondary'
              )}
            >
              {!child.authorized && <JknIcon name="ic_lock" className="absolute right-0 top-0 w-3 h-3 rounded-none" />}
              {hasRecommend(child.name) && (
                <div
                  style={{
                    position: 'absolute',
                    top: 8,
                    right: -16,
                    width: 32,
                    fontSize: 10,
                    height: 0,
                    color: 'white',
                    textAlign: 'center',
                    lineHeight: '16px',
                    borderWidth: '0px 16px 16px',
                    borderStyle: 'none solid solid',
                    borderColor: 'transparent transparent #f23645',
                    transform: 'rotate(45deg)'
                  }}
                  className="opacity-60 group-hover:opacity-100 group-data-[state=on]:opacity-100"
                >
                  推荐
                </div>
              )}
              <div className="flex items-center gap-[2px]">
                <span className="flex items-center opacity-60 group-hover:opacity-100 group-data-[state=on]:opacity-100">
                  {getIcon(child.name)}
                </span>
                <span>{child.name}</span>
              </div>
            </ToggleGroupItem>
          </div>
        ) : null
      )}
    </ToggleGroup>
  )
}

/**
 * 股票金池
 */
const GoldenPoolPanel = () => {
  const selection = useRef<string[]>([])
  const [value, setValue] = useState<string[]>([])

  const ctx = useContext(SuperStockContext)
  const collects = useQuery({
    queryKey: [getStockCollectCates.cacheKey],
    queryFn: () => getStockCollectCates()
  })
  useMount(() => {
    ctx.register(
      'collect',
      1,
      () => [...selection.current],
      () => selection.current.length > 0
    )
  })

  useUnmount(() => {
    ctx.unregister('collect')
    selection.current = []
  })

  useEffect(() => {
    selection.current = value
  }, [value])

  const _onValueChange = (e: string[]) => {
    setValue(e)
  }

  return (
    <div className="mt-8 w-full">
      <div className="w-full flex flex-col">
        <div className="flex flex-row">
          <ToggleGroup
            className="flex-grow grid grid-cols-4 gap-[10px]"
            type="multiple"
            value={value}
            hoverColor="#2E2E2E"
            onValueChange={_onValueChange}
          >
            {collects.data?.map(item => (
              <div key={item.id}>
                <ToggleGroupItem
                  value={item.id}
                  className={cn(
                    'w-full h-16 py-5 px-[14px] rounded-sm border border-[#2E2E2E] bg-transparent relative',
                    'data-[state=on]:bg-accent data-[state=on]:text-secondary'
                  )}
                >
                  {item.name}
                </ToggleGroupItem>
              </div>
            ))}
          </ToggleGroup>
        </div>
      </div>
    </div>
  )
}

/**
 * 行业板块 / 概念板块
 * @param props
 * @param props.type 1: 行业板块, 2: 概念板块
 * @returns
 */
const SectorPanel = (props: { type: 1 | 2 }) => {
  // 获取板块数据
  const plateQuery = useQuery({
    queryKey: [getPlateList.cacheKey, props.type],
    queryFn: () => getPlateList(props.type),
    placeholderData: []
  })

  // 状态管理
  const [selectedPlateIds, setSelectedPlateIds] = useState<string[]>([])
  const ctx = useContext(SuperStockContext)
  const selection = useRef<string[]>([])

  // 注册到上下文
  useMount(() => {
    ctx.register(
      'sectors',
      1,
      () => [...selection.current],
      () => selection.current.length > 0
    )
  })

  // 组件卸载时清理
  useUnmount(() => {
    ctx.unregister('sectors')
    selection.current = []
  })

  // 同步选中状态到引用
  useEffect(() => {
    selection.current = selectedPlateIds
  }, [selectedPlateIds])

  // 处理选中状态变化
  const handleSelectionChange = (ids: string[]) => {
    setSelectedPlateIds(ids)
  }

  // 将 PlateDataType 转换为 StockDataItem
  const convertToEconomicData = useMemo(() => {
    if (!plateQuery.data) return []

    return plateQuery.data.map(item => ({
      id: item.id,
      name: item.name,
      amount: item.amount,
      percent: item.change
    }))
  }, [plateQuery.data, selectedPlateIds])

  return (
    <div className="flex flex-col h-full">
      {/* 走马灯组件 */}
      {plateQuery.data && plateQuery.data.length > 0 ? (
        <SuperCarousel
          items={convertToEconomicData}
          preloadPages={2}
          selectedIds={selectedPlateIds}
          onSelectionChange={handleSelectionChange}
        />
      ) : (
        <div className="flex items-center justify-center h-20 rounded-md">
          <span className="#DBDBDB">{plateQuery.isLoading ? '加载中...' : '暂无数据'}</span>
        </div>
      )}
    </div>
  )
}

export default FirstStep
