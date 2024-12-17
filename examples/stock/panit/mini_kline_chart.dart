import 'dart:math';
import 'package:flutter/material.dart';
import 'package:mgjkn/desktop/jk_style.dart';
import 'package:mgjkn/desktop/stock/kchart/renderer/base_chart_renderer.dart';
import 'package:mgjkn/extensions/extension_widget.dart';

class JKMiniChart extends StatefulWidget {
  const JKMiniChart(
      {required this.simpleDataRaw,
      this.xAxis = const [],
      this.lastClose = -1,
      this.centerText,
      this.drawLastClose = false,
      super.key});
  final List<dynamic> simpleDataRaw;
  final List<String> xAxis;
  final double lastClose;
  final String? centerText;
  final bool drawLastClose;
  @override
  State<JKMiniChart> createState() => _JKMiniChartState();
}

class _JKMiniChartState extends State<JKMiniChart> {
  bool isLongPress = false;
  Offset selectPoint = Offset.zero;

  @override
  Widget build(BuildContext context) {
    return MouseRegion(
      onEnter: (event) {
        isLongPress = true;
        setState(() {});
      },
      onExit: (event) {
        isLongPress = false;
        setState(() {});
      },
      child: Listener(
        onPointerHover: (event) {
          selectPoint = event.localPosition;
          setState(() {});
        },
        child: RepaintBoundary(
            child: CustomPaint(
          painter: MiniKlineChart(widget.simpleDataRaw,
              selectPoint: selectPoint,
              isLongPress: isLongPress,
              xAxis: widget.xAxis,
              lastClose: widget.lastClose,
              drawLastClose: widget.drawLastClose,
              centerText: widget.centerText),
        )),
      ),
    );
  }
}

class MiniKlineChart extends CustomPainter {
  List<dynamic> simpleDataRaw = [];
  List<double> simpleData = [];
  var maxValue = double.maxFinite;
  var minValue = double.minPositive;
  var valueGap = 0.0;

  var rowCount = 8;
  var columnCount = 11;

  final bool klineOnly;
  final Offset selectPoint;
  final bool isLongPress;
  final List xAxis;
  final double lastClose;
  final bool drawLastClose;
  final String? centerText;

  MiniKlineChart(this.simpleDataRaw,
      {this.lastClose = -1,
      this.klineOnly = false,
      this.selectPoint = Offset.infinite,
      this.isLongPress = false,
      this.drawLastClose = false,
      this.xAxis = const [],
      this.centerText}) {
    maxValue = double.minPositive;
    minValue = double.maxFinite;
    if (simpleDataRaw.isEmpty) {
      maxValue = double.minPositive;
      minValue = double.maxFinite;
    }

    columnCount = xAxis.length - 1;
    simpleData.clear();
    for (var i = 0; i < simpleDataRaw.length; i++) {
      var item = simpleDataRaw[i];
      var value = double.parse(item.toString());
      if (value < 0) {
        simpleData.add(-1);
      } else {
        simpleData.add(value);
        maxValue = max(maxValue, value);
        minValue = min(minValue, value);
      }
    }
    var dx = 40 - simpleData.length;
    if (dx > 0) {
      simpleData.addAll(List.filled(dx, -1.0).toList());
    }
    valueGap = (maxValue - minValue) / rowCount;
  }

  late double reMin;
  late double reMax;
  late double yInterval;
  late Color lineColor;
  calculate(Size size, EdgeInsets padding) {
    reMin = minValue - valueGap;
    reMax = maxValue + valueGap;

    yInterval = (size.height - padding.vertical) / (reMax - reMin);
    if (reMax == reMin) {
      yInterval = (size.height - padding.vertical) / (2);
    }
  }

  drawLeftText(Canvas canvas, Size size, {EdgeInsets padding = EdgeInsets.zero}) {
    // if (simpleData.isEmpty) return;

    // final paint = Paint()
    //   ..color = Colors.grey.shade800
    //   ..strokeWidth = 1;

    final rowHeight = (size.height - padding.vertical) / rowCount;
    final columnWidth = (size.width - padding.horizontal) / columnCount;

    // var dd = (maxValue + valueGap - minValue - valueGap) / (rowCount - 2);
    // 右侧文字
    for (int i = rowCount; i >= 0; i--) {
      var y = size.height - padding.bottom - rowHeight * i;
      double price = yToPrice(y, size, padding: padding);
      if (simpleData.isNotEmpty && price.isNaN == false) {
        var (persent, color) = getPercent(price);
        canvas.drawText(price.toStringAsFixed(2), Offset(1, y - 5), color, 11);
        canvas.drawText(persent, Offset(size.width - padding.left + 3, y - 5), color, 10);
      } else {
        canvas.drawText("-----", Offset(1, y - 5), JKStyle.riseColor, 11);
        canvas.drawText("---- %", Offset(size.width - padding.left + 3, y - 5), JKStyle.riseColor, 10);
      }
    }

    // 下方文字
    for (int i = 0; i < xAxis.length; i++) {
      if (i % 2 != 0) {
        continue;
      }
      final x = i * columnWidth;
      canvas.drawText(xAxis[i], Offset(x + padding.left - 12, size.height - 15), Colors.grey.shade700, 10);
    }
  }

  drawGrid(Canvas canvas, Size size, {EdgeInsets padding = EdgeInsets.zero}) {
    final paint = Paint()
      ..color = JKStyle.theme.dividerColor
      ..strokeWidth = 1;

    final rowHeight = (size.height - padding.vertical) / rowCount;
    final columnWidth = (size.width - padding.horizontal) / columnCount;

    // 绘制横线
    for (int i = 0; i <= rowCount; i++) {
      final y = i * rowHeight;
      canvas.drawLine(
        Offset(padding.left, y + padding.top),
        Offset(size.width - padding.right, y + padding.top),
        paint,
      );
    }

    // 绘制竖线
    for (int i = 0; i <= columnCount; i++) {
      final x = i * columnWidth;
      canvas.drawLine(
          Offset(x + padding.left, padding.top), Offset(x + padding.left, size.height - padding.bottom), paint);
    }
  }

  drawLine(Canvas canvas, Size size, {EdgeInsets padding = EdgeInsets.zero}) {
    if (simpleData.isEmpty) {
      return;
    }

    var lastNumIndex = simpleData.length - 1;
    var dd = simpleData.indexOf(-1) - 1;
    if (dd >= 0) {
      lastNumIndex = dd;
    }

    var isUp = simpleData[lastNumIndex] > lastClose;

    var dataPoints = simpleData.length;
    if (klineOnly) {
      dataPoints = 40;
    }
    final xInterval = (size.width - padding.horizontal) / (dataPoints - 1);

    lineColor = isUp ? JKStyle.riseColor : JKStyle.fallColor;
    final paint = Paint()
      ..color = lineColor
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.5;

    final smoothedPath = Path();
    var first = simpleData[0];
    if (first < 0) {
      first = reMin;
    }
    var dy = ((first - reMin) * yInterval);
    smoothedPath.moveTo(padding.left, size.height - padding.bottom - dy);
    var maxW = 0.0;
    for (int i = 0; i < simpleData.length - 1; i++) {
      if (simpleData[i] <= 0 || simpleData[i + 1] <= 0) continue;
      final p1 = Offset(padding.left + i * xInterval, priceToY(simpleData[i], size, padding: padding));
      final p2 = Offset(padding.left + (i + 1) * xInterval, priceToY(simpleData[i + 1], size, padding: padding));
      final p3 = Offset(padding.left + (i + 1) * xInterval, priceToY(simpleData[i + 1], size, padding: padding));

      final controlPoint1 = Offset(1 + (p1.dx + p2.dx) / 2, p1.dy);
      final controlPoint2 = Offset(1 + (p2.dx + p3.dx) / 2, p3.dy);
      maxW = p2.dx;
      smoothedPath.cubicTo(controlPoint1.dx, controlPoint1.dy, controlPoint2.dx, controlPoint2.dy, p3.dx, p3.dy);
    }

    final gradientColors = [lineColor.withOpacity(0.4), lineColor.withOpacity(0.02)];

    final gradient = LinearGradient(
      colors: gradientColors,
      begin: Alignment.topCenter,
      end: Alignment.bottomCenter,
    );

    final fillPaint = Paint()
      ..shader = gradient.createShader(smoothedPath.getBounds())
      ..style = PaintingStyle.fill;

    final fillPath = Path()..addPath(smoothedPath, Offset.zero);

    fillPath.lineTo(maxW + 0, size.height - padding.bottom + 2);
    fillPath.lineTo(padding.left, size.height - padding.bottom + 2);

    fillPath.close();

    canvas.drawPath(fillPath, fillPaint);
    canvas.drawPath(smoothedPath, paint);

    // 画开盘价
    if (drawLastClose) {
      var y = priceToY(lastClose, size, padding: padding);
      canvas.drawDashLine(Offset(padding.left, y), Offset(size.width - padding.right, y),
          color: Colors.white38, lineWidth: 1);
    }
  }

  drawPressedLine(Canvas canvas, Size size, {EdgeInsets padding = EdgeInsets.zero}) {
    // 画鼠标十字线
    if (isLongPress) {
      if (selectPoint.dx > padding.left &&
          selectPoint.dx < size.width - padding.right &&
          selectPoint.dy < size.height - padding.bottom) {
        canvas.drawDashLine(Offset(padding.left, selectPoint.dy), Offset(size.width - padding.right, selectPoint.dy),
            color: Colors.grey.shade700, lineWidth: 1);
        canvas.drawDashLine(Offset(selectPoint.dx, 0), Offset(selectPoint.dx, size.height - padding.bottom),
            color: Colors.grey.shade700, lineWidth: 1);
        if (simpleData.isNotEmpty) {
          double price = yToPrice(selectPoint.dy, size, padding: padding);
          var (persent, color) = getPercent(price);
          var priceStr = price.isNaN ? "----" : price.toStringAsFixed(2);
          canvas.drawText(priceStr, Offset(1, selectPoint.dy - 5), Colors.white, 11,
              backgroundColor: color, radius: 2, padding: 2, minWidhth: 41);
          canvas.drawText(persent, Offset(size.width - 38, selectPoint.dy - 5), Colors.white, 10,
              backgroundColor: color, radius: 2, padding: 1, minWidhth: 40);
        }
      }
    }
  }

  getPercent(double price) {
    var increase = (price - lastClose) / lastClose * 100;
    if (increase.isNaN) {
      return ("---- %", JKStyle.riseColor);
    }

    var persent = "${increase.toStringAsFixed(2)}%";
    persent = increase > 0 ? "+$persent" : persent;
    var color = increase > 0 ? JKStyle.riseColor : JKStyle.fallColor;
    return (persent, color);
  }

  priceToY(double price, Size size, {EdgeInsets padding = EdgeInsets.zero}) {
    return size.height - padding.bottom - ((price - reMin) * yInterval);
  }

  yToPrice(double y, Size size, {EdgeInsets padding = EdgeInsets.zero}) {
    return (size.height - padding.bottom - y) / yInterval + reMin;
  }

  @override
  void paint(Canvas canvas, Size size) {
    var p = const EdgeInsets.only(left: 40, right: 40, top: 5, bottom: 20);

    if (klineOnly) {
      calculate(size, EdgeInsets.zero);
      drawLine(canvas, size);
      return;
    }
    if (centerText != null) {
      TextPainter tp = TextPainter(
          text: TextSpan(text: centerText, style: TextStyle(color: JKStyle.theme.thumbColor, fontSize: 60)),
          textDirection: TextDirection.ltr);
      tp.layout();
      tp.paint(canvas, Offset(size.width / 2 - tp.width / 2, size.height / 2 - tp.height));
    }

    calculate(size, p);
    drawGrid(canvas, size, padding: p);
    drawLeftText(canvas, size, padding: p);
    drawLine(canvas, size, padding: p);
    drawPressedLine(canvas, size, padding: p);
  }

  @override
  bool shouldRepaint(MiniKlineChart oldDelegate) => true;

  List<double> downsampleData(List<double> data, int targetCount) {
    const dataCount = 390; //data.length;
    final step = dataCount / targetCount;
    final downsampledData = <double>[];

    for (int i = 0; i < targetCount; i++) {
      final index = (i * step).round();
      if (data.length > index) {
        downsampledData.add(data[index]);
      } else {
        downsampledData.add(-1);
      }
    }
    return downsampledData;
  }
}
