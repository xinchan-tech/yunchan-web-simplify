import 'dart:math';

import 'package:flutter/material.dart';
import 'package:mgjkn/desktop/stock/kchart/state_enum.dart';
import '../chart_style.dart';
import '../utils/number_util.dart';

abstract class BaseChartRenderer<T> {
  double maxValue, minValue;
  double topPadding;
  Rect chartRect;
  double candleWidth;

  JKStockTimeType? stockTime;

  double scaleY = 0;

  Paint gridPaint = Paint()
    ..filterQuality = FilterQuality.high
    ..strokeWidth = 0.3
    ..isAntiAlias = true
    ..color = ChartColors.gridColor;

  final Paint chartPaint = Paint()
    ..isAntiAlias = true
    ..filterQuality = FilterQuality.high
    ..strokeWidth = 1.0
    ..color = Colors.red;

  // 缠论相关 Paint

  final Paint chanPenPaint = Paint()
    ..isAntiAlias = true
    ..filterQuality = FilterQuality.high
    ..strokeWidth = 2.0;

  BaseChartRenderer(
      {required this.chartRect,
      required this.maxValue,
      required this.minValue,
      required this.topPadding,
      required this.candleWidth,
      this.stockTime}) {
    scaleY = chartRect.height / (maxValue - minValue);
    if (scaleY.isInfinite) scaleY = 0;
  }

  //画对应区域里面的图表
  void drawChart(Canvas canvas, T lastpoint, T curpoint, double curX, {int index = 0});

  //画右边的值
  void drawRightText(Canvas canvas, int gridRows);

  void setClipRect(Canvas canvas, {Offset offset = Offset.zero}) {
    canvas.clipRect(
        Rect.fromLTWH(chartRect.left, chartRect.top, chartRect.width + offset.dx, chartRect.height + offset.dy));
  }

  //画网格
  void drawGrid(Canvas canvas, int gridRows, int gridColums);

  void drawGradientBgColor(Canvas canvas) {
    // LinearGradient linerGradient = LinearGradient(
    //     begin: Alignment.topCenter,
    //     end: Alignment.bottomCenter,
    //     tileMode: TileMode.clamp,
    //     colors: ChartColors.kRectShadowColor);
    // Shader shader = linerGradient.createShader(chartRect);
    // Paint paint = Paint()
    //   ..style = PaintingStyle.fill
    //   ..isAntiAlias = true;
    // paint.shader = shader;
    // canvas.drawRect(
    //     Rect.fromLTRB(chartRect.left, chartRect.top - topPadding,
    //         chartRect.right, chartRect.bottom),
    //     paint);
  }

  //画线公用方法
  void drawLine(Canvas canvas, double? lastprice, double curprice, double curX, Color color,
      {isDash = false, double width = 1.0, chanPenPaint, Paint? paint, double offsetY = 0}) {
    curX = curX + candleWidth / 2;
    lastprice = lastprice ?? curprice;
    double lastX = curX - candleWidth;
    double x1 = chartRect.width - lastX;
    double y1 = getY(lastprice);
    double x2 = chartRect.width - curX;
    double y2 = getY(curprice);
    var p = paint ?? chartPaint;
    p.color = color;
    p.strokeWidth = width;
    if (isDash) {
      canvas.drawDashLine(Offset(x1, y1 + offsetY), Offset(x2, y2 + offsetY),
          color: color, spaceWidth: 10, dashWidth: 5, lineWidth: width);
    } else {
      canvas.drawLine(Offset(x1, y1 + offsetY), Offset(x2, y2 + offsetY), p);
    }
  }

  /// 使用 Path 优化绘图速度
  void makeLinePath(
    Canvas canvas,
    double? lastprice,
    double? curprice,
    double curX,
    Color color, {
    required Path path,
    required bool isBegin,
    required bool isFinish,
    isDash = false,
    double width = 1.0,
    double? scale,
    bool isCubic = false,
    Offset offset = Offset.zero,
    bool skip = false,
  }) {
    if (curprice != null && skip == false) {
      lastprice = lastprice ?? curprice;
      if (scale != null) {
        lastprice = lastprice * scale;
        curprice = curprice * scale;
      }

      double x2 = chartRect.width - curX - candleWidth / 2;
      double y2 = getY(curprice) + offset.dy;
      // if (isDash) {
      //   canvas.drawDashLine(Offset(x1, y1), Offset(x2, y2), color: color, spaceWidth: 10, dashWidth: 5, lineWidth: 1);
      // } else {
      //   canvas.drawLine(Offset(x1, y1), Offset(x2, y2), chartPaint);
      // }
      if (isBegin && path.getBounds().width == 0) {
        path.moveTo(x2, y2);
      }
      if (isCubic) {
        double lastX = curX - candleWidth;
        double x1 = chartRect.width - lastX - candleWidth / 2;
        double y1 = getY(lastprice) + offset.dy;
        path.cubicTo((x1 + x2) / 2, y1, (x1 + x2) / 2, y2, x2, y2);
      } else {
        path.lineTo(x2, y2);
      }
    }
    if (isFinish) {
      var paint = Paint()
        ..color = color
        ..strokeWidth = width
        ..style = PaintingStyle.stroke;
      canvas.drawPath(path, paint);
    }
  }

  //根据当前的价格计算出
  double getY(num value) => scaleY * (maxValue - value) + chartRect.top;

  String format(double n) {
    return NumberUtil.format(n);
  }

  TextStyle getTextStyle(Color color) {
    return TextStyle(fontSize: ChartStyle.defaultTextSize, color: color);
  }
}

// extension DashLine on Canvas {
//   void drawDashLine(Offset p1, Offset p2, Color color) {
//     final dashWidth = 5.0;
//     final dashSpace = 3.0;

//     final distance = p2 - p1;
//     final numSegments = (distance.distance / (dashWidth + dashSpace)).floor();
//     final spacePerSegment = distance / numSegments.toDouble();

//     for (var i = 0; i < numSegments; i++) {
//       final dashStart = p1 + spacePerSegment * i.toDouble();
//       final dashEnd = dashStart + Offset.fromDirection(distance.direction, dashWidth);
//       drawLine(dashStart, dashEnd, paint);
//     }
//   }
// }

extension CanvasExt on Canvas {
  ///绘制虚线
  ///[p1] 起点
  ///[p2] 终点
  ///[dashWidth] 实线宽度
  ///[spaceWidth] 空隙宽度
  void drawDashLine(
    Offset p1,
    Offset p2, {
    double lineWidth = 1,
    double dashWidth = 3,
    double spaceWidth = 5,
    Color color = const Color.fromRGBO(255, 215, 0, 1),
    Paint? paint,
  }) {
    assert(dashWidth > 0);
    assert(spaceWidth > 0);

    double radians;

    if (p1.dx == p2.dx) {
      radians = (p1.dy < p2.dy) ? pi / 2 : pi / -2;
    } else {
      radians = atan2(p2.dy - p1.dy, p2.dx - p1.dx);
    }

    this.save();
    this.translate(p1.dx, p1.dy);
    this.rotate(radians);

    var matrix = Matrix4.identity();
    matrix.translate(p1.dx, p1.dy);
    matrix.rotateZ(radians);
    matrix.invert();

    var endPoint = MatrixUtils.transformPoint(matrix, p2);

    double tmp = 0;
    double length = endPoint.dx;
    double delta;

    final p = paint ?? Paint()
      ..color = color
      ..strokeWidth = lineWidth
      ..style = PaintingStyle.stroke
      ..strokeCap = StrokeCap.round
      ..isAntiAlias = false;

    while (tmp < length) {
      delta = (tmp + dashWidth < length) ? dashWidth : length - tmp;
      drawLine(Offset(tmp.roundToDouble(), 0), Offset((tmp + delta).roundToDouble(), 0), p);
      if (tmp + delta >= length) {
        break;
      }

      tmp = (tmp + dashWidth + spaceWidth < length) ? (tmp + dashWidth + spaceWidth) : (length);
    }

    restore();
  }

  ///绘制文字
  ///[p1] 起点
  ///[p2] 终点
  ///[dashWidth] 实线宽度
  ///[spaceWidth] 空隙宽度
  double drawText(
    String text,
    Offset offset,
    Color color,
    double fontsize, {
    bool center = false,
    Color? backgroundColor,
    double padding = 5,
    double radius = 3,
    double minWidhth = 0,
  }) {
    TextPainter tp = TextPainter(
        text: TextSpan(text: text, style: TextStyle(color: color, fontSize: fontsize)),
        textDirection: TextDirection.ltr);
    tp.layout();

    if (backgroundColor != null) {
      var paint = Paint()..color = backgroundColor;
      var w = tp.width + padding * 2;
      if (minWidhth > 0 && w < minWidhth) {
        w = minWidhth;
      }
      var x = offset.dx - padding;
      x = center ? x - tp.size.width / 2 + padding / 2 : x;
      drawRRect(RRect.fromRectAndRadius(Rect.fromLTWH(x, offset.dy, w, tp.height), Radius.circular(radius)), paint);
    }

    if (center) {
      offset = offset - Offset(tp.size.width / 2 - padding / 2, 0);
    }

    tp.paint(this, offset);
    return offset.dx + tp.width;
  }

  ///绘制虚线
  ///[rect] 矩形
  ///[dashWidth] 实线宽度
  ///[spaceWidth] 空隙宽度
  void drawDashRect(Rect rect, double dashWidth, spaceWidth, Color color, {double lineWidth = 1.0}) {
    drawDashLine(rect.topLeft, rect.topRight,
        color: color, spaceWidth: spaceWidth, dashWidth: dashWidth, lineWidth: lineWidth);
    drawDashLine(rect.topRight, rect.bottomRight,
        color: color, spaceWidth: spaceWidth, dashWidth: dashWidth, lineWidth: lineWidth);
    drawDashLine(rect.bottomRight, rect.bottomLeft,
        color: color, spaceWidth: spaceWidth, dashWidth: dashWidth, lineWidth: lineWidth);
    drawDashLine(rect.bottomLeft, rect.topLeft,
        color: color, spaceWidth: spaceWidth, dashWidth: dashWidth, lineWidth: lineWidth);
  }
}
