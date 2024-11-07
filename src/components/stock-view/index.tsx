
interface StockViewProps {
  code: string
  name: string
}

const StockView = ({ code, name }: StockViewProps) => {
  return (
    <div className="overflow-hidden">
      <div className="text-secondary">{code}</div>
      <div className="text-tertiary text-xs text-ellipsis overflow-hidden whitespace-nowrap w-full">{name}</div>
    </div>
  )
}

export default StockView