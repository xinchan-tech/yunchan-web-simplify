import 'package:mgjkn/desktop/jk_style.dart';
import 'package:mgjkn/desktop/stock/chan_data_manager.dart';
import 'package:mgjkn/desktop/stock/kchart/entity/k_line_entity.dart';
import 'package:mgjkn/desktop/stock/kchart/indicator/indicator_menu.dart';
import 'package:mgjkn/desktop/stock/kchart/kline_data_controller.dart';
import 'package:mgjkn/desktop/stock/kchart/kline_manager.dart';
import 'package:mgjkn/desktop/stock/kchart/state_enum.dart';
import 'package:mgjkn/extensions/extension_widget.dart';
import 'package:mgjkn/desktop/logger.dart';
import 'base_chart_renderer.dart';
import 'package:flutter/material.dart';
import '../chart_style.dart';
import '../utils/number_util.dart';

class SecondaryChartRenderer extends BaseChartRenderer<KLineEntity> {
  IndicatorItem? indicator;
  JKStockTimeType? stockTime;
  KLineDataController dataController;
  SecondaryChartRenderer(Rect mainRect, double maxValue, double minValue, double topPadding, double candleWidth,
      this.indicator, this.stockTime, this.dataController)
      : super(
            chartRect: mainRect,
            maxValue: maxValue,
            minValue: minValue,
            topPadding: topPadding,
            candleWidth: candleWidth);

  @override
  void drawChart(Canvas canvas, KLineEntity? _lastpoint, KLineEntity _curpoint, double curX,
      {int index = 0, int chartIndex = 0}) {
    var offsetY = chartIndex * JKStyle.indicatorChartHeight;
    if (indicator == ChanDataIndicator.bottomSignal.info.$2) {
      var last = dataController.currentStock.chanDataManager.chanDataEntityList.safeAt(index - 1);
      var cur = dataController.currentStock.chanDataManager.chanDataEntityList.safeAt(index);
      if (cur == null) return;
      if (last != null) {
        if (last.horizonVol != 0) {
          drawLine(canvas, last.horizonVol, cur.horizonVol, curX, Colors.white, offsetY: offsetY);
        }
        if (last.monthLineVol != 0) {
          drawLine(canvas, last.monthLineVol, cur.monthLineVol, curX, const Color.fromARGB(255, 255, 9, 128),
              offsetY: offsetY);
        }
      }
      ChanDataManager.drawHDLYChart(canvas, last, cur, curX, getY(cur.hdlyVol), chartRect, candleWidth,
          offsetY: offsetY);
    } else if (indicator == ChanDataIndicator.buySalePoint.info.$2) {
      if (_curpoint.X0.isInfinite) return;
      var macdY = getY(_curpoint.X0);
      if (macdY.isInfinite) return;
      var zeroY = getY(0);
      var paint = Paint();
      var h = (macdY - zeroY);
      var top = macdY + offsetY;
      if (macdY > zeroY) {
        paint.color = Colors.cyanAccent;
        top = top - h;
      } else {
        paint.color = Colors.purpleAccent;
      }

      paint.style = PaintingStyle.fill;
      canvas.drawRect(Rect.fromLTWH(chartRect.width - curX - candleWidth, top, candleWidth, h.abs()), paint);

      if (_lastpoint != null) {
        drawLine(canvas, _lastpoint.X0, _curpoint.X0, curX, Colors.white, width: 2, offsetY: offsetY);
        drawLine(canvas, _lastpoint.S1, _curpoint.S1, curX, Colors.purpleAccent, width: 2, offsetY: offsetY);
      }
    }
  }

  @override
  void drawGrid(Canvas canvas, int gridRows, int gridColums, {int index = 0}) {
    super.drawGradientBgColor(canvas);
    var offsetY = index * JKStyle.indicatorChartHeight;
    var y = getY(160);
    if (indicator == ChanDataIndicator.bottomSignal.info.$2 && y > chartRect.top) {
      var color = const Color.fromARGB(255, 255, 9, 128);
      canvas.drawDashLine(Offset(dataController.paddingLeft, y + offsetY),
          Offset(chartRect.width + dataController.paddingLeft, y + offsetY),
          color: color, lineWidth: 1);
      canvas.drawText("顶线", Offset(chartRect.width - 22, y - 16 + offsetY), color, 12);
    }

    // 绘制分隔线
    var dividerPaint = Paint()
      ..color = JKStyle.theme.dividerColor
      ..isAntiAlias = false
      ..strokeWidth = 2;

    canvas.drawLine(Offset(dataController.paddingLeft, chartRect.top + offsetY),
        Offset(chartRect.width + dataController.paddingLeft, chartRect.top + offsetY), dividerPaint);

    if (stockTime != null && stockTime == JKStockTimeType.time5) {
      // 5日线不画竖线
      return;
    }

    // double columnSpace = chartRect.width / gridColums;
    // for (int i = 1; i < gridColums; i++) {
    //   canvas.drawLine(Offset(i * columnSpace, chartRect.top - topPadding + offsetY),
    //       Offset(i * columnSpace, chartRect.bottom + offsetY), gridPaint);
    // }
  }

  void drawLongPressCrossLineText(Canvas canvas, int index, String chartKey, KLineDataController dataController) {
    var lists = dataController.indicatorChartMap[chartKey]?.data ?? [];
    var lastDrawWidth = 100.0;
    var chartIndex = int.parse(chartKey) - 1;
    for (var item in lists) {
      var name = item["name"];
      if (name != null && name.isNotEmpty) {
        if (item["draw"].isNotEmpty) continue;
        List data = List.from(item["data"]);
        var colorStr = item["style"]["color"];
        var color = ColorExtension.fromHex(colorStr) ?? Colors.white;
        var top = chartRect.top + chartIndex * JKStyle.indicatorChartHeight;
        if (dataController.stockTime.isTickTime) {
          var need = dataController.currentStock.datas.length - data.length;
          var addList = List.filled(need, null);
          data.addAll(addList);
        }
        var text = data.safeAt(data.length - index - 1);
        if (text is String || text is double || text is int) {
          lastDrawWidth = canvas.drawText("$name: $text", Offset(lastDrawWidth + 10, top + 4), color, 12);
        }
      }
    }
  }

  @override
  void drawRightText(Canvas canvas, int gridRows, {double startClose = -1, double stopClose = -1}) {
    // TextSpan span = TextSpan(text: "${NumberUtil.volFormat(maxValue)}", style: ChartStyle.getRightTextStyle());
    // TextPainter tp = TextPainter(text: span, textDirection: TextDirection.ltr);
    // tp.layout();
    // tp.paint(canvas, Offset(chartRect.width - tp.width + ChartStyle.rightPadding, chartRect.top - topPadding));
  }

  void drawTopText(Canvas canvas, KLineEntity data) {
    TextSpan span = TextSpan(
      children: [
        TextSpan(
            text: "VOL:${NumberUtil.volFormat(data.vol)}    ",
            style: TextStyle(color: ChartColors.volColor, fontSize: 10)),
        TextSpan(
            text: "MA5:${NumberUtil.volFormat(data.MA5Volume)}    ",
            style: TextStyle(color: ChartColors.ma5Color, fontSize: 10)),
        TextSpan(
            text: "MA10:${NumberUtil.volFormat(data.MA10Volume)}    ",
            style: TextStyle(color: ChartColors.ma10Color, fontSize: 10)),
      ],
    );
    TextPainter tp = TextPainter(text: span, textDirection: TextDirection.ltr);
    tp.layout();
    tp.paint(canvas, Offset(10, chartRect.top - topPadding));
  }

  void drawVolChart(Canvas canvas, KLineEntity curpoint, double curX) {
    var right = chartRect.width - curX;
    var left = right - candleWidth * 2;
    logger.d("candleWidth2 $candleWidth");
    var bottom = chartRect.bottom;
    var top = getY(curpoint.vol);
    var rect = Rect.fromLTRB(left, top, right, bottom);
    if (curpoint.close > curpoint.open) {
      chartPaint.color = JKStyle.riseColor;
    } else {
      chartPaint.color = JKStyle.fallColor;
    }
    canvas.drawRect(rect, chartPaint);
  }

  double getValue(double y) => maxValue - (y - chartRect.top) / scaleY;
}
