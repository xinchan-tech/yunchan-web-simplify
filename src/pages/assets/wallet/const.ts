
export const getChartOps = () => {
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
            formatter: (params:any) => {
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
                lineStyle: {
                    color: '#22AB94',
                },
                itemStyle: {
                    color: '#22AB94',
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
                        color: '#dbdbdb', // 平均线颜色
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