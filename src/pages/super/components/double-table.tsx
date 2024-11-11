import { getPlateList, getPlateStocks } from "@/api"
import { JknTable, type JknTableProps, NumSpan, ScrollArea } from "@/components"
import { priceToCnUnit } from "@/utils/price"
import { useRequest, useUpdateEffect } from "ahooks"
import { useMemo, useState } from "react"
import { useImmer } from "use-immer"
import PlateStocks from "./plate-stocks"

interface DoubleTableProps {
  type: 1 | 2
}




export default DoubleTable