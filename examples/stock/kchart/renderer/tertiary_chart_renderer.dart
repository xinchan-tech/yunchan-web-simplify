import 'package:mgjkn/desktop/jk_style.dart';
import 'package:mgjkn/desktop/stock/chan_data_manager.dart';
import 'package:mgjkn/desktop/stock/kchart/entity/k_line_entity.dart';
import 'package:mgjkn/desktop/stock/kchart/indicator/indicator_menu.dart';
import 'package:mgjkn/desktop/stock/kchart/kline_data_controller.dart';
import 'package:mgjkn/desktop/stock/kchart/state_enum.dart';
import 'package:mgjkn/extensions/extension_widget.dart';

import 'base_chart_renderer.dart';
import 'package:flutter/material.dart';
import '../chart_style.dart';
import '../utils/number_util.dart';

class TertiaryChartRenderer extends BaseChartRenderer<KLineEntity> {
  double mMACDWidth = ChartStyle.macdWidth;
  IndicatorItem? indicator;
  JKStockTimeType? stockTime;
  KLineDataController dataController;

  TertiaryChartRenderer(Rect mainRect, double maxValue, double minValue, double topPadding, double candleWidth,
      this.indicator, this.stockTime, this.dataController)
      : super(
            chartRect: mainRect,
            maxValue: maxValue,
            minValue: minValue,
            topPadding: topPadding,
            candleWidth: candleWidth);

  @override
  void drawChart(Canvas canvas, KLineEntity? lastpoint, KLineEntity curpoint, double curX, {int index = 0}) {
    if (indicator?.name == "MACD") {
      drawMACD(canvas, lastpoint, curpoint, curX);
    } else if (indicator?.name == "KDJ" && lastpoint != null) {
      if (lastpoint.k != 0) drawLine(canvas, lastpoint.k, curpoint.k, curX, ChartColors.kColor);
      if (lastpoint.d != 0) drawLine(canvas, lastpoint.d, curpoint.d, curX, ChartColors.dColor);
      if (lastpoint.j != 0) drawLine(canvas, lastpoint.j, curpoint.j, curX, ChartColors.jColor);
    } else if (indicator?.name == "RSI" && lastpoint != null) {
      if (lastpoint.rsi != 0) drawLine(canvas, lastpoint.rsi, curpoint.rsi, curX, ChartColors.rsiColor);
    } else if (indicator?.name == "WR" && lastpoint != null) {
      if (lastpoint.r != 0) drawLine(canvas, lastpoint.r, curpoint.r, curX, ChartColors.wrColor);
    } else if (indicator == ChanDataIndicator.bottomSignal.info.$2) {
      var last = dataController.currentStock.chanDataManager.chanDataEntityList.safeAt(index - 1);
      var cur = dataController.currentStock.chanDataManager.chanDataEntityList.safeAt(index)!;

      if (last != null) {
        if (last.horizonVol != 0) {
          drawLine(canvas, last.horizonVol, cur.horizonVol, curX, Colors.white);
        }
        if (last.monthLineVol != 0) {
          drawLine(canvas, last.monthLineVol, cur.monthLineVol, curX, const Color.fromARGB(255, 255, 9, 128));
        }
      }
      ChanDataManager.drawHDLYChart2(canvas, last, cur, curX, getY, chartRect, candleWidth);
    }
  }

  void drawMACD(Canvas canvas, KLineEntity? lastPoint, KLineEntity curPoint, double curX) {
    double macdCenterX = (chartRect.width - (curX + candleWidth / 2));
    double macdY = getY(curPoint.macd);
    double r = candleWidth / 2;
    double zeroy = getY(0);
    if (curPoint.macd > 0) {
      canvas.drawRect(
          Rect.fromLTRB(macdCenterX - r, macdY, macdCenterX + r, zeroy), chartPaint..color = JKStyle.riseColor);
    } else {
      canvas.drawRect(
          Rect.fromLTRB(macdCenterX - r, zeroy, macdCenterX + r, macdY), chartPaint..color = JKStyle.fallColor);
    }
    if (lastPoint != null) {
      if (lastPoint.dif != 0) {
        drawLine(canvas, lastPoint.dif, curPoint.dif, curX, Colors.white);
      }
      if (lastPoint.dea != 0) {
        drawLine(canvas, lastPoint.dea, curPoint.dea, curX, Colors.yellow);
      }
    }
  }

  @override
  void drawGrid(Canvas canvas, int gridRows, int gridColums) {
    super.drawGradientBgColor(canvas);
    canvas.drawLine(Offset(dataController.paddingLeft, chartRect.bottom),
        Offset(chartRect.width + dataController.paddingLeft, chartRect.bottom), gridPaint);
    double columnSpace = chartRect.width / gridColums;
    if (stockTime != null && stockTime == JKStockTimeType.time5) {
      // 5日线不画竖线
      return;
    }
    for (int i = 0; i < gridColums; i++) {
      canvas.drawLine(
          Offset(i * columnSpace, chartRect.top - topPadding), Offset(i * columnSpace, chartRect.bottom), gridPaint);
    }
  }

  @override
  void drawRightText(Canvas canvas, int gridRows, {double startClose = -1, double stopClose = -1}) {
    if (maxValue == -double.maxFinite || minValue == double.maxFinite) {
      return;
    }
    TextPainter maxTp = TextPainter(
        text: TextSpan(
            text: NumberUtil.format(maxValue), style: const TextStyle(color: ChartColors.yAxisTextColor, fontSize: 12)),
        textDirection: TextDirection.ltr);
    maxTp.layout();
    TextPainter minTp = TextPainter(
        text: TextSpan(
            text: "${NumberUtil.format(minValue)}",
            style: const TextStyle(color: ChartColors.yAxisTextColor, fontSize: 12)),
        textDirection: TextDirection.ltr);
    minTp.layout();
    maxTp.paint(
        canvas,
        Offset(chartRect.width - maxTp.width + dataController.paddingRight + dataController.paddingLeft,
            chartRect.top - topPadding));
    minTp.paint(
        canvas,
        Offset(chartRect.width - minTp.width + dataController.paddingRight + dataController.paddingLeft,
            chartRect.bottom - minTp.height));
  }

  void drawTopText(Canvas canvas, KLineEntity data) {
    List<TextSpan> children = [];
    switch (indicator?.name ?? "") {
      case "MACD":
        children.add(TextSpan(text: "MACD(12,26,9)    ", style: getTextStyle(ChartColors.yAxisTextColor)));
        if (data.macd != 0)
          children.add(TextSpan(text: "MACD:${format(data.macd)}    ", style: getTextStyle(ChartColors.macdColor)));
        if (data.dif != 0)
          children.add(TextSpan(text: "DIF:${format(data.dif)}    ", style: getTextStyle(ChartColors.difColor)));
        if (data.dea != 0)
          children.add(TextSpan(text: "DEA:${format(data.dea)}    ", style: getTextStyle(ChartColors.deaColor)));
        break;
      case "KDJ":
        children.add(TextSpan(text: "KDJ(14,1,3)    ", style: getTextStyle(ChartColors.yAxisTextColor)));
        if (data.k != 0)
          children.add(TextSpan(text: "K:${format(data.k)}    ", style: getTextStyle(ChartColors.kColor)));
        if (data.d != 0)
          children.add(TextSpan(text: "D:${format(data.d)}    ", style: getTextStyle(ChartColors.dColor)));
        if (data.j != 0)
          children.add(TextSpan(text: "J:${format(data.j)}    ", style: getTextStyle(ChartColors.jColor)));
        break;
      case "RSI":
        children.add(TextSpan(text: "RSI(14):${format(data.rsi)}    ", style: getTextStyle(ChartColors.rsiColor)));

        break;
      case "WR":
        children.add(TextSpan(text: "WR(14):${format(data.r)}    ", style: getTextStyle(ChartColors.wrColor)));
        break;
      default:
        break;
    }
    TextPainter tp = TextPainter(text: TextSpan(children: children ?? []), textDirection: TextDirection.ltr);
    tp.layout();
    tp.paint(canvas, Offset(10, chartRect.top - topPadding));
  }
}
