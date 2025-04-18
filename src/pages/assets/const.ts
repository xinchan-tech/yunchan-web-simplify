export const getLineChartOps = () => {
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
                      <div class="text-xs text-left" style="color: #B7DBF9; font-size: 16px;color: #22AB94">${series.data}</div>
                    </div>`
            },
        },
        xAxis: {
            type: 'category',
            data: ['13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00'],
            axisLine: {
                lineStyle: {
                    color: '#22AB94',
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
                show: false
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
        },
        grid: {
            left: 60,
            right: 30,
            top: 40,
            bottom: 30
        },
        series: [
            {
                data: [3000, 5000, 4000, 5860, 4500, 6000, 7000, 8000, 9000],
                type: 'line',
                smooth: false,
                showSymbol: false,
                symbolSize: 16,
                lineStyle: {
                    color: '#22AB94',
                },
                itemStyle: {
                    color: '#22AB94',
                    borderWidth: 2, // 圆点的边框宽度
                },
                areaStyle: {
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
                            type: 'average', // 平均值
                            name: '',
                        },
                    ],
                    lineStyle: {
                        color: '#d8d8d8', // 平均线颜色
                        type: 'dashed', // 虚线样式
                    },
                    symbol: "none", // 不显示标记点
                    label: {
                        formatter: '{c}', // 显示平均值
                        position: 'middle',
                        color: '#FF0000',
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
                    formatter :'{b}', // 显示数值
                    position: 'top',
                },
                data: [
                    100, -200, 150, -100, 200, 300, 250, -300, 100, -150,
                    -400, 200, 100, -250, 300, 400, 200, 100, -200, -100,
                    150, 200, -300, -400, 300, 400,
                ],
                itemStyle: {
                    color: (params: any) => {
                        // 根据值动态设置颜色
                        return params.value >= 0 ? '#2962FF' : '#D61B5F'; // 蓝色为正值，红色为负值
                    },
                },
                barWidth: '50%', // 柱状图宽度
            },
        ],
    }
}