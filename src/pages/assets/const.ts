export const getColor = (value: number | string | undefined | null) => {
    if (!value) return ''
    if (typeof value === 'string' && !/^-?\d*\.?\d+$/.test(value)) return ''
    if (typeof value !== 'number' && typeof value !== 'string') return ''
    return Number(value) >= 0 ? 'text-[#5EDEA0]' : 'text-[#FC43A8]'
}

export function numberFormat(value: number, coefficient?: number) {
    // 判断是否为数字或数字字符串
    if (typeof value === 'string' && !/^-?\d*\.?\d+$/.test(value)) return '--'
    if (typeof value !== 'number' && typeof value !== 'string') return 0

    let num = +value
    if (isNaN(num)) return 0
    const positive = num > 0 ? '+' : ''
    coefficient && (num = num * coefficient) ? '%' : ''

    return `${positive}${num % 1 === 0 ? num : num.toFixed(2)}${coefficient ? '%' : ''}`
}

export const getLineChartOps = (averageValue = 0, { xArr = [], yArr = [] } = {}) => {

    return {
        tooltip: {
            trigger: 'axis',
            borderColor: '#3B3741',
            backgroundColor: '#2e2e2e',
            position: 'top',
            borderRadius: 12,
            textStyle: {
                color: '#fff',
            },
            formatter: (params: any) => {
                const [series] = params
                return `
                    <div class="flex flex-col" style="min-width: 96px">
                      <div class="text-lg text-left" style="color: #FFFFFF;font-size: 14px ">${series.name}</div> 
                      <div class="text-xs text-left" style="color: #B7DBF9; font-size: 16px;color: ${series.data > averageValue ? '#C1F15F' : '#FC43A8'}">${series.data}</div>
                    </div>`
            },
        },
        xAxis: {
            type: 'category',
            data: xArr,
            axisLine: {
                lineStyle: {
                    color: '#343335',
                },
            },
            nameLocation: 'start',
            nameGap: 20,
            axisLabel: {
                color: '#fff',
                fontSize: 14,
            },
            splitLine: {
                show: false
            },
            axisTick: {
                show: false,
            },
        },
        yAxis: {
            type: 'value',
            axisLine: {
                show: false // 不显示y轴线
            },
            axisLabel: {
                color: '#B8B8B8',
            },
            splitLine: {
                show: true,
                lineStyle: {
                    color: function (value: number) {
                        // 只在y=0时显示虚线
                        return value === 0 ? '#fff' : 'transparent';
                    },
                    type: 'dashed',
                    width: 1,
                    opacity: 0.2
                },
            },
            // max: function (val) {
            //     if (val.max < averageValue) val.max = averageValue
            //     return Math.ceil(val.max)
            // }
        },
        grid: {
            left: 60,
            right: 30,
            top: 40,
            bottom: 30
        },
        dataZoom: [
            {
                type: 'inside',
                start: 0,
                end: 10,
                disabled: yArr.length < 20
            },
        ],
        visualMap: {
            show: false,
            seriesIndex: 0,
            splitNumber: 2,
            dimension: 1, // 按数据的第1个维度（y值）映射
            pieces: [
                { min: 0, max: averageValue, color: "#FC43A8" },
                { min: averageValue, color: "#C1F15F" }
            ],
        },
        series: [
            {
                data: yArr,
                type: 'line',
                smooth: false,
                symbolSize: 12,
                lineStyle: {},
                symbol: 'circle',      // 数据点形状（但默认不显示）
                showSymbol: false,     // 默认隐藏所有数据点
                emphasis: {            // 悬停时的高亮样式
                    showSymbol: true,    // 悬停时显示数据点
                    symbolSize: 8,       // 悬停点的尺寸
                    itemStyle: {
                        color: function (params: { color: string }) {
                            return params.color;
                        },
                        borderWidth: 2, // 圆点的边框宽度
                    }
                },
                itemStyle: {
                    // color: '#38CB97',
                    borderColor: '#fff',
                    borderWidth: 2, // 圆点的边框宽度
                },
                areaStyle: {
                    origin: averageValue,
                    color: {
                        type: 'linear',
                        x: 0,
                        y: 0,
                        x2: 0,
                        y2: 1,
                        colorStops: [
                            {
                                offset: 0,
                                color: 'rgba(34, 171, 148, 0.6)', // 渐变起始颜色
                            },
                            {
                                offset: 1,
                                color: 'rgba(34, 171, 148, 0)', // 渐变结束颜色
                            },
                        ],
                    },
                },
                markLine: {
                    silent: true,
                    data: [
                        {
                            name: '',
                            yAxis: averageValue
                        },
                    ],
                    lineStyle: {
                        color: '#3D3D3D', // 平均线颜色
                        type: 'dashed', // 虚线样式
                    },
                    symbol: [0, 0], // 不显示标记点
                    label: {
                        show: true,
                        formatter: '{c}', // 显示平均值
                        position: 'middle',
                        color: '#3D3D3D',
                    },
                },
            },
        ],
    };
}


export const getBarChartOps = () => {
    const rawData = [
        100, -300, 100, -200, 220, 100, 210, -200, 150, -150,
        -400, 120, 250, -250, 300, 400, 220, 150, -200, -100,
        80, 150, -500, -400, 180, 260,
    ];
    const categories = [
        'AMZN', 'TSLA', 'QQQ', 'AAPL', 'AAL', 'NVDA', 'MSFT', 'MSXT', 'HUD', 'GRDS',
        'HTYD', 'NHYF', 'BGTD', 'HTED', 'NHYF', 'NGG', 'NHY', 'HYD', 'NHYRD', 'MYG',
        'NGTD', 'MUH', 'NHDE', 'JUF', 'HJKI', 'NHG',
    ];

    return {
        backgroundColor: '#18171B',
        tooltip: {
            trigger: 'axis',
            borderColor: '#3B3741',
            backgroundColor: '#2e2e2e',
            position: 'top',
            borderRadius: 12,
            textStyle: { color: '#fff' },
            axisPointer: { type: 'shadow' },
            formatter: (params: any) => {
                const [series] = params
                return `
                    <div class="flex items-center gap-2" style="min-width: 96px; display: flex;">
                      <span style="display:inline-block;margin-right:4px;border-radius:10px;width:10px;height:10px;background-color:#${series.data > 0 ? '2962FF' : 'D61B5F'};"></span>
                      <div class="text-lg" style="color: #FFFFFF;font-size: 14px">${series.name}</div> 
                      <div class="text-xs" style="color: #FFFFFF; font-size: 16px">${series.data}</div>
                    </div>`
            },
        },
        xAxis: {
            type: 'category',
            data: categories,
            axisLine: {
                show: true,
                lineStyle: {
                    color: '#fff',
                    type: 'dashed',
                    width: 1,
                    opacity: 0.2
                }
            },
            axisLabel: {
                color: '#B8B8B8',
                fontSize: 14,
                show: false,
            },
            axisTick: { show: false },
        },
        yAxis: {
            type: 'value',
            axisLine: { show: false },
            axisLabel: { color: '#B8B8B8' },
            splitLine: { show: false },
        },
        grid: { left: 60, right: 30, top: 40, bottom: 30 },
        series: [
            {
                type: 'bar',
                data: rawData,
                label: {
                    show: true,
                    color: '#DBDBDB',
                    fontSize: 14,
                    formatter: '{b}',
                    position: 'outside',
                    distance: 20,
                    align: 'center',
                    verticalAlign: function (params: { value: number }) {
                        return params.value >= 0 ? 'bottom' : 'top';
                    }
                },
                itemStyle: {
                    color: function (params: { value: number }) {
                        if (params.value >= 0) {
                            return {
                                type: 'linear',
                                x: 0, y: 0, x2: 0, y2: 1,
                                colorStops: [
                                    { offset: 0, color: '#1C316B' },
                                    { offset: 1, color: '#1A191B ' }
                                ]
                            }
                        } else {
                            return {
                                type: 'linear',
                                x: 0, y: 1, x2: 0, y2: 0,
                                colorStops: [
                                    { offset: 0, color: '#421D2A' },
                                    { offset: 1, color: '#1A191B' }
                                ]
                            }
                        }
                    },
                    borderRadius: [10],
                },
                barWidth: 32,
            },
            {
                type: 'bar',
                data: rawData.map(value => value > 0 ? value + 6 : value - 6),
                barWidth: 32,
                itemStyle: {
                    color: function (params: { value: number }) {
                        if (params.value >= 0) {
                            return {
                                type: 'linear',
                                x: 0, y: 0, x2: 0, y2: 1,
                                colorStops: [
                                    { offset: 0, color: '#2962FF' },
                                    { offset: 1, color: '#1C316B' }
                                ]
                            }
                        } else {
                            return {
                                type: 'linear',
                                x: 0, y: 1, x2: 0, y2: 0,
                                colorStops: [
                                    { offset: 0, color: '#D61B5F' },
                                    { offset: 1, color: '#421D2A' }
                                ]
                            }
                        }
                    },
                    borderRadius: [10],
                },
                z: 1,
                barGap: '-100%'
            }
        ]
    }
}