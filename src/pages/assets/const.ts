export const getColor = (value: number | string) => {
    if (value === '') return ''
    return Number(value) >= 0 ? 'text-[#5EDEA0]' : 'text-[#FC43A8]'
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
                lineStyle: {
                    color: '#22AB94',
                },
            },
            axisLabel: {
                color: '#fff',
                fontSize: 14,
            },
            splitLine: {
                show: false
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
                        color: function (params) {
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
            axisPointer: {
                type: 'shadow', // 鼠标悬停时显示阴影
            },
        },
        xAxis: {
            type: 'category',
            data: [
                'AMZN', 'TSLA', 'QQQ', 'AAPL', 'AAL', 'NVDA', 'MSFT', 'MSXT', 'HUD', 'GRDS',
                'HTYD', 'NHYF', 'BGTD', 'HTED', 'NHYF', 'NGG', 'NHY', 'HYD', 'NHYRD', 'MYG',
                'NGTD', 'MUH', 'NHDE', 'JUF', 'HJKI', 'NHG',
            ],
            axisLine: {
                lineStyle: {
                    color: '#DBDBDB', // 坐标轴颜色
                },
            },
            axisLabel: {
                color: '#B8B8B8', // 坐标轴文字颜色
                fontSize: 14,
                show: false,
            },
            axisTick: {
                show: false
            },
        },
        yAxis: {
            type: 'value',
            axisLine: {
                lineStyle: {
                    color: '#1B1B1B', // 坐标轴颜色
                },
            },
            axisLabel: {
                color: '#B8B8B8', // 坐标轴文字颜色
            },
            splitLine: {
                lineStyle: {
                    color: '#1b1b1b', // 网格线颜色
                },
            },
        },
        grid: {
            left: 60,
            right: 30,
            top: 40,
            bottom: 30
        },
        series: [
            {
                name: '盈亏',
                type: 'bar',
                label: {
                    show: true,
                    color: '#DBDBDB', // 标签文字颜色
                    fontSize: 14,
                    formatter: '{b}', // 显示数值
                    position: 'top',
                    offset: [0, -10],
                },
                data: [
                    100, -200, 150, -100, 200, 300, 250, -300, 100, -150,
                    -400, 200, 100, -250, 300, 400, 200, 100, -200, -100,
                    150, 200, -300, -400, 300, 400,
                ],
                itemStyle: {
                    borderRadius: [10],
                    shadowColor: 'rgba(0, 0, 0, 0.5)',
                    shadowBlur: 10,
                    color: (params: any) => ({
                        type: 'linear',
                        x: params.value >= 0 ? 1 : 0,
                        y: params.value >= 0 ? 1 : 0,
                        x2: params.value >= 0 ? 0 : 1,
                        y2: params.value >= 0 ? 0 : 1,
                        colorStops: [
                            {
                                offset: .1, color: '#1A191B'
                            },
                            {
                                offset: 1, color: params.value >= 0 ? '#1C316B' : '#421D2A' // 蓝色为正值，红色为负值 // 100% 处的颜色
                            }
                        ],
                        global: false // 缺省为 false
                        // 根据值动态设置颜色

                    }),
                },
                barWidth: '60', // 柱状图宽度
            },
        ],
    }
}