import 'package:flutter/material.dart';
import 'package:mgjkn/desktop/jk_style.dart';
import 'package:mgjkn/desktop/stock/backtest/backtest_menu.dart';
import 'package:mgjkn/desktop/stock/chan_data_manager.dart';
import 'package:mgjkn/desktop/stock/kchart/indicator/indicator_menu.dart';
import 'package:mgjkn/desktop/stock/kchart/kline_data_controller.dart';
import 'package:mgjkn/desktop/stock/kchart/kline_manager.dart';
import 'package:mgjkn/desktop/stock/kchart/state_enum.dart';
import 'package:mgjkn/extensions/extension_widget.dart';

import '../entity/k_line_entity.dart';
import '../chart_style.dart';
import '../utils/number_util.dart';
import 'base_chart_renderer.dart';

class MainChartRenderer extends BaseChartRenderer<KLineEntity> {
  final double _contentPadding = 20.0;
  JKMainLineType lineType = JKMainLineType.candle;
  late Set<IndicatorItem> state;
  // JKStockTimeType? stockTime;
  double preClosePrice = 0.0;
  KLineDataController dataController;

  late Path linePath, lineFillPath;
  Paint linePaint = Paint()
    ..isAntiAlias = true
    ..style = PaintingStyle.stroke
    ..strokeWidth = 2
    ..color = ChartColors.kLineColor;

  late Shader lineFillShader;
  Paint lineFillPaint = Paint()
    ..style = PaintingStyle.fill
    ..isAntiAlias = true;

  MainChartRenderer(
      Rect mainRect,
      double maxValue,
      double minValue,
      double topPadding,
      double candleWidth,
      // this.state,
      // this.lineType,
      // this.stockTime,
      this.preClosePrice,
      this.dataController)
      : super(
          chartRect: mainRect,
          maxValue: maxValue,
          minValue: minValue,
          topPadding: topPadding,
          candleWidth: candleWidth,
        ) {
    state = dataController.mainIndicator;
    lineType = dataController.mainLineType;
    stockTime = dataController.stockTime;

    var diff = maxValue - minValue; //计算差
    var newScaleY = (chartRect.height - _contentPadding - ChartStyle.mainPaddingBottom - ChartStyle.mainPaddingTop) /
        diff; //内容区域高度/差=新的比例
    var newDiff = chartRect.height / newScaleY; //高/新比例=新的差
    var value = (newDiff - diff) / 2; //新差-差/2=y轴需要扩大的值
    if (newDiff > diff) {
      scaleY = newScaleY;
      this.maxValue += value;
      this.minValue -= value;
    }
    dataController.maxValue = this.maxValue;
    dataController.scaleY = scaleY;
    dataController.mainRectTop = chartRect.top;
  }

  @override
  void drawChart(Canvas canvas, KLineEntity? lastpoint, KLineEntity curpoint, double curX,
      {JKMainLineType lineType = JKMainLineType.candle, Color? color, double? scale, bool fill = true, int index = 0}) {
    if (curpoint.close <= 0) return;
    if (lineType == JKMainLineType.candle) {
      drawCandle(canvas, curpoint, curX, scale: scale, fill: fill);
    } else {
      drawKLine(canvas, lastpoint?.close, curpoint.close, curX, color: color, scale: scale);
    }

    canvas.save();
    setClipRect(canvas);
    drawIndicator(canvas, lastpoint, curpoint, curX, index: index);
    canvas.restore();
  }

  void drawLongPressIndicatorText(Canvas canvas, int index) {
    var lastDrawWidth = dataController.paddingLeft + (KLineManager.shared.isMultipleFrame ? 100.0 : 0.0);
    for (var item in dataController.mainIndicator) {
      if (item.dbType != "system") continue;
      for (var itemData in item.data) {
        var name = itemData["name"] ?? "";
        if (name.isEmpty || itemData["draw"].isNotEmpty) continue;

        List data = List.from(itemData["data"]);

        var colorStr = itemData["style"]["color"];
        var color = ColorExtension.fromHex(colorStr) ?? Colors.white;
        var top = chartRect.top + 5;
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

  void drawIndicator(Canvas canvas, KLineEntity? _lastpoint, KLineEntity _curpoint, double curX, {int index = 0}) {
    var lastpoint = dataController.currentStock.chanDataManager.chanDataEntityList.safeAt(index - 1);
    var curpoint = dataController.currentStock.chanDataManager.chanDataEntityList.safeAt(index);
    if (lastpoint == null || curpoint == null || BacktestManager.shared.isEnable) {
      return;
    }

    if (state.contains(ChanDataIndicator.pen.info.$2)) {
      drawPenLine(canvas, lastpoint, curpoint, curX);
    }

    if (state.contains(ChanDataIndicator.pivot.info.$2)) {
      drawSegmentPenLine(canvas, lastpoint, curpoint, curX);
    }

    // if (state.contains("波段王")) {
    //   if (curpoint.MA60Price != 0) {
    //     drawLine(canvas, lastpoint.MA60Price, curpoint.MA60Price, curX, const Color.fromARGB(255, 156, 171, 232),
    //         width: 2);
    //   }

    //   if (curpoint.MA30Price != 0) {
    //     drawLine(canvas, lastpoint.MA30Price, curpoint.MA30Price, curX, const Color.fromARGB(255, 186, 64, 127),
    //         width: 2);
    //   }
    // }

    // if (state.contains("主力三区")) {
    //   if (curpoint.MA120Price != 0) {
    //     drawLine(canvas, lastpoint.MA120Price, curpoint.MA120Price, curX, const Color.fromARGB(255, 0, 158, 202),
    //         width: 2);
    //   }

    //   if (curpoint.MA250Price != 0) {
    //     drawLine(canvas, lastpoint.MA250Price, curpoint.MA250Price, curX, const Color.fromARGB(255, 203, 158, 129),
    //         width: 2);
    //   }
    // }
  }

  void drawCandle(Canvas canvas, KLineEntity curPoint, double curX, {double? scale, bool fill = true}) {
    var high = getY(scale == null ? curPoint.high : curPoint.high * scale);
    var low = getY(scale == null ? curPoint.low : curPoint.low * scale);
    var open = getY(scale == null ? curPoint.open : curPoint.open * scale);
    var close = getY(scale == null ? curPoint.close : curPoint.close * scale);
    var margin = ChartStyle.canldeMargin;

    if (fill) {
      chartPaint.style = PaintingStyle.fill;
    } else {
      chartPaint.style = PaintingStyle.stroke;
    }

    // 回测置灰色
    var riseColor = JKStyle.riseColor;
    var riseMaxColor = ChartColors.upMaxColor;

    var fallColor = JKStyle.fallColor;
    var fallMaxColor = ChartColors.dnMaxColor;
    // 回测颜色显示
    if (BacktestManager.shared.startDate.isNotEmpty) {
      var isAfterChoose = curPoint.date.compareTo(BacktestManager.shared.startDate);
      if (BacktestManager.shared.isEnable && isAfterChoose > 0) {
        var alpha = 0;
        riseColor = riseColor.withAlpha(alpha);
        riseMaxColor = riseMaxColor.withAlpha(alpha);
        fallColor = fallColor.withAlpha(alpha);
        fallMaxColor = fallMaxColor.withAlpha(alpha);
      }
    }

    var center = chartRect.width - curX - candleWidth / 2 - ChartStyle.candleLineWidth / 2 + 1;
    var percent = (curPoint.close - curPoint.preClose) / curPoint.preClose;
    var increase = curPoint.close - curPoint.open;

    var l = chartRect.width - curX - candleWidth + margin;
    var r = chartRect.width - curX - margin;
    if (r - l < 1) {
      r = l + 1;
    }

    if (increase > 0) {
      chartPaint.color = riseColor;
      if (percent >= 0.09) {
        chartPaint.color = riseMaxColor;
      }
      // 特殊处理开收价一样的蜡烛图
      if ((close - open).abs() < 1) {
        open = close + 1;
      }
      canvas.drawRect(Rect.fromLTRB(l, close, r, open), chartPaint);
      canvas.drawLine(Offset(center, high), Offset(center, close), chartPaint);
      canvas.drawLine(Offset(center, low), Offset(center, open), chartPaint);
    } else {
      chartPaint.color = fallColor;
      if (percent <= -0.09) {
        chartPaint.color = fallMaxColor;
      }
      // 特殊处理开收价一样的蜡烛图
      if ((close - open).abs() < 1) {
        open = close + 1;
      }
      canvas.drawRect(Rect.fromLTRB(l, open, r, close), chartPaint);
      chartPaint.style = fill ? PaintingStyle.fill : PaintingStyle.stroke;

      canvas.drawLine(Offset(center, high), Offset(center, open), chartPaint);
      canvas.drawLine(Offset(center, low), Offset(center, close), chartPaint);
    }

    // 绘制回测
    if (BacktestManager.shared.isEnable) {
      BacktestManager.shared
          .drawBuySales(canvas, curPoint.date, chartRect.width - curX - candleWidth + margin, low, high);
    }
  }

  void drawKLine(Canvas canvas, double? lastPrice, double curPrice, double curX, {Color? color, double? scale}) {
    if (lastPrice == null || lastPrice <= 0 || curPrice <= 0) {
      return;
    }

    double lastX = curX - candleWidth;
    double x1 = chartRect.width - lastX - candleWidth / 2;
    if (scale != null) {
      lastPrice = lastPrice * scale;
      curPrice = curPrice * scale;
    }
    double y1 = getY(lastPrice);
    double x2 = chartRect.width - curX - candleWidth / 2;
    double y2 = getY(curPrice);
    linePath = Path();
    linePath.moveTo(x1, y1);
    linePath.cubicTo((x1 + x2) / 2, y1, (x1 + x2) / 2, y2, x2, y2);

    linePaint.color = color ?? ChartColors.kLineColor;

    canvas.drawPath(linePath, linePaint);
    linePath.reset();

    // if (color == null) {
    var fillShader = color ?? ChartColors.kLineShadowColor;
    lineFillShader =
        LinearGradient(begin: Alignment.topCenter, end: Alignment.bottomCenter, tileMode: TileMode.clamp, colors: [
      fillShader.withAlpha(100),
      fillShader.withAlpha(70),
      fillShader.withAlpha(40),
      fillShader.withAlpha(10),
    ]).createShader(chartRect);

    lineFillPaint.shader = lineFillShader;
    lineFillPath = Path();
    lineFillPath.moveTo(x1, chartRect.height + chartRect.top);
    lineFillPath.lineTo(x1, y1);
    lineFillPath.cubicTo((x1 + x2) / 2, y1, (x1 + x2) / 2, y2, x2, y2);
    lineFillPath.lineTo(x2, chartRect.height + chartRect.top);
    lineFillPath.close();
    canvas.drawPath(lineFillPath, lineFillPaint);
    lineFillPath.reset();
    // }
  }

  @override
  void drawRightText(Canvas canvas, int gridRows) {
    double rowSpace = chartRect.height / gridRows;

    drawText(String text, Color color, double value, int i, {bool isLeft = false}) {
      TextSpan span = TextSpan(
        text: text,
        style: TextStyle(fontSize: ChartStyle.rightTextFontSize, color: color),
      );
      TextPainter textPainter = TextPainter(text: span, textDirection: TextDirection.ltr);
      textPainter.layout();
      double y = 0;
      if (i == 0) {
        y = getY(value);
      } else {
        y = getY(value) - textPainter.height;
      }
      var x =
          isLeft ? 0.0 : chartRect.width - textPainter.width + dataController.paddingRight + dataController.paddingLeft;
      textPainter.paint(canvas, Offset(x, y + 6));
    }

    var idx = dataController.currentStock.datas.length - dataController.mStopIndex;
    double? stopClose = dataController.currentStock.datas.safeAt(idx)?.close;
    if (stopClose == null) {
      return;
    }
    for (int i = 0; i <= gridRows; i++) {
      double position = 0;
      position = (gridRows - i) * rowSpace;
      var value = position / scaleY + minValue;
      if (value.isInfinite) {
        return;
      }
      var text = "";
      var color = JKStyle.theme.white;
      if (dataController.yAxisType == JKYAxisType.percent) {
      } else {
        text = value.toStringAsFixed(3);
      }
      if (dataController.stockTime.isTickTime) {
        stopClose = dataController.currentStock.datas.first.preClose;
      }

      switch (dataController.yAxisType) {
        case JKYAxisType.percent:
          var p = (value - stopClose!) / stopClose * 100;
          color = p > 0 ? JKStyle.riseColor : JKStyle.fallColor;
          text = "${p.toStringAsFixed(2)}%";
          drawText(text, color, value, i);
          break;
        case JKYAxisType.both:
          var p = (value - stopClose!) / stopClose * 100;
          color = p > 0 ? JKStyle.riseColor : JKStyle.fallColor;
          text = "${p.toStringAsFixed(2)}%";
          drawText(value.toStringAsFixed(3), color, value, i, isLeft: true);
          drawText(text, color, value, i);
          break;
        default:
          drawText(text, color, value, i);
      }
    }
  }

  ///画网格
  @override
  void drawGrid(Canvas canvas, int gridRows, int gridColums) {
    //画每一行的线
    super.drawGradientBgColor(canvas);
    double rowspace = chartRect.height / gridRows;
    for (int i = 0; i <= gridRows; i++) {
      Offset startOffset = Offset(dataController.paddingLeft, i * rowspace + topPadding);
      Offset endOffset = Offset(chartRect.width + dataController.paddingLeft, i * rowspace + topPadding);
      if (i == gridRows) continue;
      canvas.drawLine(startOffset, endOffset, gridPaint);
    }
    if (stockTime != null && stockTime == JKStockTimeType.time5) {
      // 5日线不画竖线
      return;
    }
    // //画每一列的线
    // double colomspace = chartRect.width / gridColums;
    // for (int i = 0; i < gridColums; i++) {
    //   Offset startOffset = Offset(i * colomspace, 0);
    //   Offset endOffset = Offset(i * colomspace, chartRect.height + topPadding);
    //   canvas.drawLine(startOffset, endOffset, gridPaint);
    // }
  }

  //画 笔
  void drawPenLine(Canvas canvas, ChanDataEntity lastpoint, ChanDataEntity curPoint, double curX) {
    if (curPoint.penDashValue != 0 && lastpoint.penDashValue != 0) {
      drawLine(canvas, lastpoint.penDashValue, curPoint.penDashValue, curX, JKStyle.chanDashPenColor,
          isDash: true, width: 1, paint: chanPenPaint);
    }

    if (curPoint.penLineValue != 0 && lastpoint.penLineValue != 0) {
      drawLine(canvas, lastpoint.penLineValue, curPoint.penLineValue, curX, JKStyle.chanPenColor,
          width: 1, paint: chanPenPaint);
    }
  }

  //画线段笔
  void drawSegmentPenLine(Canvas canvas, ChanDataEntity lastpoint, ChanDataEntity curPoint, double curX) {
    if (curPoint.segmentDashValue != 0 && lastpoint.segmentDashValue != 0) {
      drawLine(canvas, lastpoint.segmentDashValue, curPoint.segmentDashValue, curX, JKStyle.chanSegmentDashPenColor,
          isDash: true, width: 2);
    }

    if (curPoint.segmentLineValue != 0 && lastpoint.segmentLineValue != 0) {
      drawLine(canvas, lastpoint.segmentLineValue, curPoint.segmentLineValue, curX, JKStyle.chanSegmentPenColor,
          width: 2);
    }
  }

  // 画中枢
  void drawCentres(Canvas canvas, double begin, double end, List<dynamic> info, bool isMark) {
    Color centresColor = Colors.white;
    // Color markColor = Colors.white;

    begin = chartRect.width + dataController.paddingLeft - begin - candleWidth / 2;
    end = chartRect.width + dataController.paddingLeft - end - candleWidth / 2;

    final section = info[4];
    if (info[5] > 0) {
      // 小中枢   亮绿九段
      centresColor = section <= 7 ? JKStyle.normalPivotRiseColor : JKStyle.largePivotRiseColor;
    } else {
      centresColor = section <= 7 ? JKStyle.normalPivotFallColor : JKStyle.largePivotFallColor;
    }
    canvas.save();
    final paint = Paint()
      ..style = PaintingStyle.fill
      ..color = centresColor;
    // paint.blendMode = BlendMode.difference;

    final t = getY(info[3]);
    var b = getY(info[2]);
    if (b > chartRect.height) {
      b = chartRect.height - 10;
    }
    // 平方  -> 蓝色;
    canvas.drawRect(Rect.fromLTRB(begin, b, end, t), paint);
    if (isMark) {
      final mark = info[5] > 0 ? "↑" : "↓";
      final symbol = String.fromCharCode(info[6]);
      final squared = section >= 9 ? "²" : "";
      canvas.drawText("$mark$symbol$squared", Offset(end + 2, b - 28), centresColor.withAlpha(255), 28);
    }
    canvas.restore();
  }

  // 画扩展中枢
  void drawExtCentres(Canvas canvas, double begin, double end, List<dynamic> info, bool isMark) {
    final series = info[5].toDouble();
    final labels = ["A0", "A1", "A²", "A³", "A⁴", "A⁵", "A⁶", "A⁷", "A⁸"];
    final m = labels.safeAt(series.toInt()) ?? "";

    var centresColor = const Color(0xffffffff);
    var markPoint = const Offset(0, 0);

    begin = chartRect.width + dataController.paddingLeft - begin - candleWidth / 2;
    end = chartRect.width + dataController.paddingLeft - end - candleWidth / 2;

    final t = getY(info[3].toDouble());
    var b = getY(info[2].toDouble());

    if (b > chartRect.height) {
      b = chartRect.height - 10;
    }

    final direction = info[4].toDouble();
    var directionMark = "";
    if (direction > 0) {
      directionMark = "↑";
      centresColor = series == 2 ? JKStyle.pivot2ExtRiseColor : JKStyle.pivot4ExtRiseColor;
      markPoint = Offset(end + 10, b - 20);
    } else {
      directionMark = "↓";
      centresColor = series == 2 ? JKStyle.pivot2ExtFallColor : JKStyle.pivot4ExtFallColor;
      markPoint = Offset(end + 10, t);
    }
    var centerY = t + (b - t) / 2;
    if ("A²" == m) {
      canvas.drawRect(
        Rect.fromLTRB(begin - 5, b + 5, end + 5, t - 5),
        Paint()
          ..style = PaintingStyle.fill
          ..color = centresColor,
      );

      // canvas.drawDashLine(Offset(begin, centerY), Offset(end + candleWidth * 5, centerY),
      //     lineWidth: 2, spaceWidth: 20, color: centresColor.withAlpha(255));
      // markPoint = Offset(end - 20, centerY) - const Offset(-38, 14 + 5);
    }
    //  else if ("A⁴" == m) {
    //   centresColor = direction > 0 ? JKStyle.pivotExtRiseColor : JKStyle.pivotExtFallColor;
    //   canvas.drawDashLine(Offset(begin, t + (b - t) / 2), Offset(end + candleWidth * 5, t + (b - t) / 2),
    //       lineWidth: 5, spaceWidth: 20, color: centresColor);
    //   markPoint = Offset(markPoint.dx, centerY) - const Offset(-38, 14 + 5);
    // }
    else {
      canvas.drawDashRect(Rect.fromLTRB(begin - 5, b + 5, end + 5, t - 5), 5.0, 10.0, centresColor, lineWidth: 1.5);
    }

    canvas.drawText(directionMark + m, markPoint, centresColor.withAlpha(255), 28);
  }

  //画MA线
  void drawMaLine(Canvas canvas, KLineEntity lastpoint, KLineEntity curPoint, double curX) {
    if (curPoint.MA5Price != 0) {
      drawLine(canvas, lastpoint.MA5Price, curPoint.MA5Price, curX, ChartColors.ma5Color);
    }
    if (curPoint.MA10Price != 0) {
      drawLine(canvas, lastpoint.MA10Price, curPoint.MA10Price, curX, ChartColors.ma10Color);
    }

    if (curPoint.MA30Price != 0) {
      drawLine(canvas, lastpoint.MA30Price, curPoint.MA30Price, curX, ChartColors.ma30Color);
    }
  }

  void drawTopText(Canvas canvas, KLineEntity curPoint) {
    var state = dataController.mainIndicator;
    List<TextSpan> list = [];
    if (state == "MA") {
      if (curPoint.MA5Price != 0) {
        TextSpan spanMa5 = TextSpan(
            text: "MA5:${NumberUtil.format(curPoint.MA5Price)}    ",
            style: const TextStyle(color: ChartColors.ma5Color, fontSize: 10));
        list.add(spanMa5);
      }
      if (curPoint.MA10Price != 0) {
        TextSpan spanMa10 = TextSpan(
            text: "MA10:${NumberUtil.format(curPoint.MA10Price)}    ",
            style: const TextStyle(color: ChartColors.ma10Color, fontSize: 10));
        list.add(spanMa10);
      }
      if (curPoint.MA30Price != 0) {
        TextSpan spanMa30 = TextSpan(
            text: "MA30:${NumberUtil.format(curPoint.MA30Price)}    ",
            style: const TextStyle(color: ChartColors.ma30Color, fontSize: 10));
        list.add(spanMa30);
      }
    } else {
      if (curPoint.mb != 0) {
        TextSpan span = TextSpan(
            text: "BOLL:${NumberUtil.format(curPoint.mb)}    ",
            style: const TextStyle(color: ChartColors.ma5Color, fontSize: 10));
        list.add(span);
      }
      if (curPoint.up != 0) {
        TextSpan span = TextSpan(
            text: "UP:${NumberUtil.format(curPoint.up)}    ",
            style: const TextStyle(color: ChartColors.ma10Color, fontSize: 10));
        list.add(span);
      }
      if (curPoint.dn != 0) {
        TextSpan span = TextSpan(
            text: "LB:${NumberUtil.format(curPoint.mb)}    ",
            style: const TextStyle(color: ChartColors.ma30Color, fontSize: 10));
        list.add(span);
      }
    }
    TextSpan span = TextSpan(children: list);
    TextPainter tpMa5 = TextPainter(text: span, textDirection: TextDirection.ltr);
    tpMa5.layout();
    double y = 6;
    tpMa5.paint(canvas, Offset(10, y));
  }

  //画boll线
  void drawBoLL(Canvas canvas, KLineEntity lastpoint, KLineEntity curPoint, double curX) {
    if (curPoint.up != 0) {
      drawLine(canvas, lastpoint.up, curPoint.up, curX, ChartColors.ma5Color);
    }
    if (curPoint.mb != 0) {
      drawLine(canvas, lastpoint.mb, curPoint.mb, curX, ChartColors.ma10Color);
    }
    if (curPoint.dn != 0) {
      drawLine(canvas, lastpoint.dn, curPoint.dn, curX, ChartColors.ma30Color);
    }
  }

  //根据当前的价格计算出
  // @override
  // double getY(double value) => scaleY * (maxValue - value) + chartRect.top;

  double getValue(double y) => maxValue - (y - chartRect.top) / scaleY;
}
