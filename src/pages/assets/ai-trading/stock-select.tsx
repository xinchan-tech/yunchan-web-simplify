import { SubscribeSpan, JknIcon, Input, JknVirtualList } from '@/components'
import { stockUtils } from '@/utils/stock'
import { useStockList } from '@/store'
import { JknIcon, Input } from '@/components'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
type TableDataType = ReturnType<typeof stockUtils.toStockWithExt>
import { cn } from '@/utils/style'
import { useEffect, useState } from 'react';
import { useBoolean } from 'ahooks'
import { getColor } from '../const'


type stockType = {
    image?: string;
    name?: string;
    code?: string;
    market?: string;
    price?: string;
    percent?: string;
    isUp?: string;
}

type ItemComponentProps = stockType & TableDataType

const StockSelect = ({ list, row, width = "32rem", onChange, classNmae }: {onChange?: (row: TableDataType) => void, classNmae?: string, width?: string, list: TableDataType[]; row: TableDataType }) => {
    const [selected, setSelected] = useState<TableDataType>(row)    //row 默认值
    const [stockList, setStockList] = useState<ItemComponentProps[]>([])
    const [filteredStockList, setFilteredStockList] = useState<ItemComponentProps[]>([]); // 过滤后的列表
    const [open, { setTrue, setFalse }] = useBoolean(false)
    const listMap = useStockList(s => s.listMap)
    const [stock, setStock] = useState<TableDataType | null>(null)
    const [keyword, setKeyword] = useState<string>('')

    useEffect(() => {
        console.log('list', list)
        if (list.length) {
            const arr = list.map((item) => getStocKInfo(listMap[item.code]))
            setStockList(arr)
            setFilteredStockList(arr)
        }
    }, [list])

    useEffect(() => {
        updateStock()
    }, [row])


    function updateStock() {
        const item = getStocKInfo(listMap[row?.code] || [])
        setStock(item)
    }


    function getStocKInfo(arr: string[]) {
        if (!Array.isArray(arr) || arr.length < 4) return {}
        const [image = '', name = '', code = '', market = ''] = arr
        const row = list.find(i => i.code === name) || {}
        return { ...row, image, name, code, market }
    }

    // 过滤方法
    const filterOption = (keyword: string) => {
        const lowerKeyword = keyword.toLowerCase();
        const filtered = stockList.filter((item) =>
            item.name?.toLowerCase().includes(lowerKeyword)
        );
        setFilteredStockList(filtered); // 更新过滤后的列表
    };

    const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { value } = e.target
        setKeyword(value)
        filterOption(value)
    }



    const handelItemClick = (row: ItemComponentProps) => {
        setStock(row)
        setFalse()
        setSelected(row)
        onChange && onChange(row)
    }

    const onClose = () => {
        setKeyword('')
        filterOption('')
    }

    const ItemComponent: React.FC<{ showIcon?: boolean, row: TableDataType }> = ({ showIcon = false, row = {} }) => {
        return <div className={cn("pb-2.5 py-2 box-border flex justify-between items-center h-[33px] cursor-pointer",
            !showIcon && 'hover:bg-[#3c3c3c]', `w-full`,
        )}
            onClick={() => handelItemClick(row)}>
            <div className='flex w-full max-w-[50%] content-center items-center'>
                {
                    row.image ? <JknIcon stock={row?.image} className="mr-3" style={{ width: 24, height: 24 }} /> : <div className='w-[24px] mr-3'></div>
                }
                <span className='text-[#DBDBDB] text-base  max-w-[30%] text-sm ml-2.5 whitespace-nowrap text-ellipsis overflow-hidden'>{row?.name}</span>
                <span className='text-[#8c8c8c] flex-1 text-sm ml-2.5 whitespace-nowrap text-ellipsis overflow-hidden'>{row?.market}</span>
            </div>
            <div className='flex max-w-[50%] content-center items-center'>
                <span className='text-[#DBDBDB] text-base'>{row?.price}</span>
                <SubscribeSpan.PercentBlink
                    symbol=""
                    subscribe={false}
                    decimal={2}
                    initValue={row.percent}
                    initDirection={row.isUp}
                    nanText="--"
                    className={cn('ml-2.5 min-w-[4rem] inline-block text-right', getColor(row.percent))}
                />
                {
                    showIcon ? <JknIcon.Svg name="arrow-down" size={12} className='ml-2.5' /> : null
                }
            </div>
        </div >
    }



    return <Popover open={open} onOpenChange={show => (show ? setTrue() : setFalse())} >
        <PopoverTrigger asChild >
            <div className={cn("border-[1px] border-solid border-[#3c3c3c] rounded-md p-2.5 box-border w-full", classNmae)}>
                {/* <input type="text" className="bg-[#2e2e2e] border-0 w-full color-[#fff]"/> */}
                {stock && <ItemComponent showIcon={true} row={stock} />}
            </div>
        </PopoverTrigger>
        <PopoverContent className={cn("p-2.5 box-border h-[432]", `w-[${width}]`)}>
            <div className='flex flex-col relative w-auto'>
                <div className="flex items-center border-b-primary px-4 border-[1px] border-solid border-[#3c3c3c] rounded-md bg-[#2e2e2e]">
                    <JknIcon.Svg name="search" className="w-6 h-6 text-tertiary" />
                    <Input
                        className="w-full placeholder:text-tertiary text-secondary border-none"
                        placeholder="请输入股票代码" value={keyword} onChange={onInputChange} />
                    {
                        keyword ? <div className="border-[1px] border-solid border-[#3c3c3c] rounded-full absolute right-2 top-[1.15rem] transform -translate-y-1/2 w-4 h-4 flex items-center justify-center cursor-pointer">
                            <JknIcon.Svg name="close" size={12} onClick={onClose} />
                        </div> : null
                    }
                </div>


                <JknVirtualList
                    className="h-[400px] w-full mt-5 [&>div>div]:[display:block!important]"
                    rowKey="code"
                    data={filteredStockList}
                    itemHeight={60}
                    renderItem={(row) => {
                        return <ItemComponent row={row} />
                    }}
                />
            </div>

        </PopoverContent>
    </Popover>
}


export default StockSelect