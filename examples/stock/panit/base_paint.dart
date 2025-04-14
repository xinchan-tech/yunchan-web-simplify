import 'dart:math';
import 'dart:ui' as ui;
import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:flutter/painting.dart';
import 'package:flutter/rendering.dart';
import 'package:flutter/semantics.dart';
import 'package:flutter/widgets.dart';
import 'package:flutter_smart_dialog/flutter_smart_dialog.dart';
import 'package:mgjkn/desktop/settings_widget.dart';
import 'package:mgjkn/desktop/jk_style.dart';
import 'package:mgjkn/desktop/stock/kchart/kline_data_controller.dart';
import 'package:mgjkn/desktop/stock/kchart/kline_manager.dart';
import 'package:mgjkn/desktop/stock/kchart/line_alarm_widget.dart';
import 'package:mgjkn/desktop/stock/kchart/renderer/base_chart_renderer.dart';
import 'package:mgjkn/desktop/stock/kchart/state_enum.dart';
import 'package:mgjkn/desktop/stock/panit/paint_enum.dart';
import 'package:mgjkn/desktop/stock/stock_left_menu.dart';
import 'package:mgjkn/extensions/extension_widget.dart';
import 'package:mgjkn/desktop/logger.dart';
import 'package:mgjkn/network/network.dart';
import 'package:mgjkn/Util/utils.dart';
import 'package:mgjkn/widgets/widget.dart';
import 'package:uuid/uuid.dart';
import 'package:vector_math/vector_math.dart' as vec;

import 'package:tuple/tuple.dart';
import 'dart:ui' as ui;

abstract class ShapeComponent {
  final boundingBoxPaint = Paint()..isAntiAlias = true;
  late String hash;
  late String stockCode;
  late String stockTime;

  int paintId;
  var text = "";
  String color;
  double lineWidth;
  bool crossTime = KLineManager.shared.selectedChartController.isCrossPaint;
  double slope = 0.0;

  List<List<String>> pointsInfo = [];
  List<String> movePointInfo = [];

  List<List<Offset>> drawPointsInfo = [];

  bool pointInteger = false;
  int maxPoints = 2;

  bool _isSelected = false;
  bool get isSelected => _isSelected;
  set isSelected(bool value) {
    if (_isSelected && value == false) {
      uploadPaint();
    }
    _isSelected = value;
    var paintManager = dataController.paintManager;
    if (value) {
      if (paintManager.currentPaint != this) {
        paintManager.currentPaint?.isSelected = false;
        paintManager.currentPaint = this;
      }
    } else {
      if (paintManager.currentPaint == this) {
        paintManager.currentPaint = null;
      }
    }
  }

  Offset pointFromInfo(List<String> info, {bool isCrossStart = false, bool isCrossEnd = false}) {
    if (info.isEmpty || info.first.isEmpty || info.last.isEmpty) {
      return Offset.infinite;
    }
    return Offset(dataController.paintManager.xFromInfo(info.first), dataController.yFromValue(info.last));
  }

  List<String> infoFromPoint(Offset point, {bool integer = false}) {
    return [dataController.paintManager.infoFromX(point.dx, integer: integer), dataController.valueFromY(point.dy)];
  }

  bool _isPainting = false;
  bool get isPainting => _isPainting;
  set isPainting(bool value) {
    _isPainting = value;
    // if (value == false) {
    //   finishPanit();
    // }
  }

  /// 用来判断两个点是否合适
  void fixPoints() {}

  Offset get movePoint {
    return pointFromInfo(movePointInfo);
  }

  set movePoint(Offset p) {
    movePointInfo = infoFromPoint(p);
  }

  Offset pointAt(int idx) {
    if (idx < pointsInfo.length) {
      return pointFromInfo(pointsInfo[idx]);
    }
    return Offset.infinite;
  }

  /// 获取指定点或者移动点
  Offset pointOrMove(int idx) {
    if (idx < pointsInfo.length) {
      return pointFromInfo(pointsInfo[idx]);
    }
    return movePoint;
  }

  KLineDataController dataController;
  ShapeComponent(
      {required this.dataController,
      required this.paintId,
      String? uuid,
      this.color = "#FFD700",
      this.lineWidth = 1,
      String? stockCode,
      int? stockTime}) {
    boundingBoxPaint.color = ColorExtension.fromHex(color) ?? Colors.white;
    boundingBoxPaint.style = PaintingStyle.stroke;
    boundingBoxPaint.strokeWidth = lineWidth.toDouble();
    if (uuid == null) {
      hash = const Uuid().v4().replaceAll("-", "").substring(0, 16);
    } else {
      hash = uuid;
    }

    if ((this is NoneComponent) == false) {
      debugPrint("NoneComponent");
    }
    this.stockCode = stockCode ?? dataController.stockCode;

    this.stockTime = (stockTime ?? dataController.stockTime.rawValue.item1).toString();
  }

  var lastPointTime = 0;

  bool isSafeClick() {
    int now = DateTime.now().millisecondsSinceEpoch;
    // 防止双击误点
    if (lastPointTime > 0 && now - lastPointTime < 500) return false;
    lastPointTime = now;
    return true;
  }

  bool onMouseRightDown(Offset point, {BuildContext? context}) {
    if (!isSafeClick()) return false;
    // isSelected = isContains(point);
    var isContain = isContains(point);
    if (isSelected || isPainting) {
      isPainting = false;
      isSelected = isContain;
      finishPanit();
      if (!isContain) {
        return true;
      }
    }
    if (isContain) {
      isSelected = true;

      if (KLineManager.shared.isMultipleFrame) {}
      showMenu(
          context: context!,
          color: JKStyle.theme.bgColor,
          shape: RoundedRectangleBorder(
            side: BorderSide(color: Colors.grey.shade700),
            borderRadius: BorderRadius.circular(4), // 设置边框圆角
          ),
          position: RelativeRect.fromLTRB(
            point.dx + 70 + MainLeftMenuWidget.currentWidth,
            point.dy + 100,
            MediaQuery.of(context).size.width,
            MediaQuery.of(context).size.height - point.dy,
          ),
          constraints: const BoxConstraints(maxHeight: 150, maxWidth: 80),
          items: List.generate(3, (index) {
            var title = ["添加报警", "样式设置", "删除画线"][index];
            return PopupMenuItem(
              height: 20,
              padding: const EdgeInsets.only(bottom: 5, left: 2),
              mouseCursor: SystemMouseCursors.basic,
              value: index,
              child: JKHover(
                hoverColor: JKStyle.themeColor,
                child: JKText(title, color: JKStyle.theme.white).board(paddigLeft: 10, paddigRight: 10),
              ),
            );
          })).then((value) {
        switch (value) {
          case 0:
            showPageSheet(
              context,
              const LineAlarmWidget(),
              width: 382,
              height: 500,
              title: "添加画线报警",
            );
            break;
          case 1:
            //     ctl.yAxisType = JKYAxisType.percent;
            //     ctl.paddingLeft = 0.0;
            break;
          case 2:
            // isSelected = false;
            print("datas11:  ${dataController.currentStock.paintDatas.length}");
            dataController.currentStock.paintDatas.remove(this);
            dataController.paintManager.currentPaint = null;
            print("datas22:  ${dataController.currentStock.paintDatas.length}");
            network.deleteUserPaint([hash]).then((res) {});
            Future.delayed(Duration.zero).then((value) {
              dataController.refreshCanvas();
            });

            break;
          default:
            break;
        }
        // ctl.refresh();
      });
      return true;
    }
    return false;
  }

  void onMouseDownBase(Offset point) {
    if (!isSafeClick()) return;
    _onMouseDown(point);
  }

  void onMouseUp(Offset point) {
    if (isPainting) {
      var distance = pointAt(pointsInfo.length - 1).distanceTo(point);
      if (distance < 20) {
        return;
      }
      pointsInfo.add(infoFromPoint(point, integer: pointInteger));
      logger.d("add 2 info");
      movePoint = point;

      if (pointsInfo.length >= maxPoints) {
        finishPanit();
        return;
      }
    }
  }

  void _onMouseDown(Offset point) {
    if (dataController.paintManager.currentPaintType == JKUserPathType.none || pointsInfo.length == maxPoints) {
      isSelected = isContains(point);
      if (isSelected) {
        logger.d("isSelected: ${this}");
      }
    } else {
      if (pointsInfo.isEmpty) {
        isPainting = true;
        var info = infoFromPoint(point, integer: pointInteger);
        logger.d("add 1 info: $info");
        pointsInfo.add(info);
        movePoint = point;
        if (pointsInfo.length >= maxPoints) {
          finishPanit();
          return;
        }
      } else if (isPainting) {
        pointsInfo.add(infoFromPoint(point, integer: pointInteger));
        logger.d("add 2 info");
        movePoint = point;
        if (pointsInfo.length >= maxPoints) {
          finishPanit();
          return;
        }
      } else {
        isSelected = isContains(point);
        if (isSelected) {
          logger.d("isSelected: $runtimeType");
        }
      }
    }
  }

  void onDoubleClick(Offset point) {}
  void onMouseMoveBase(Offset point) {
    if (isPainting) {
      _onMouseMove(point);
    } else {
      // logger.d("onMouseMoveBase");
    }
  }

  void _onMouseMove(Offset point) {
    movePoint = point;
  }

  Offset dragBeginPoint = Offset.zero;
  List<Offset> beginControls = [];
  List<bool> controlsHits = [];
  void onDragBegin(Offset point) {
    dragBeginPoint = point;
    beginControls = [];
    controlsHits = [];

    var hasHit = false;
    for (var i = 0; i < pointsInfo.length; i++) {
      var p = pointAt(i);
      beginControls.add(p);
      var isHit = point.distanceTo(p) < 10;
      if (isHit && hasHit == false) {
        controlsHits.add(true);
        hasHit = true;
      } else {
        controlsHits.add(false);
      }
    }
  }

  void onDragMove(Offset point) {
    if (isSelected) {
      var hasHit = controlsHits.toSet().length == 2;
      if (hasHit) {
        for (var i = 0; i < beginControls.length; i++) {
          if (controlsHits[i]) {
            pointsInfo[i] = infoFromPoint(point);
            break;
          }
        }
      } else {
        if (beginControls.isEmpty) {
          for (var i = 0; i < pointsInfo.length; i++) {
            beginControls.add(pointAt(i));
          }
        }

        var dx = Offset(point.dx - dragBeginPoint.dx, point.dy - dragBeginPoint.dy);
        for (var i = 0; i < beginControls.length; i++) {
          var newPoint = beginControls[i] + dx;
          pointsInfo[i] = infoFromPoint(newPoint);
        }
      }
    } else {
      if (dataController.paintManager.currentPaintType == JKUserPathType.none || pointsInfo.length == maxPoints) {
        isSelected = isContains(point);
        if (isSelected) {
          logger.d("isSelected: ${this}");
        }
      } else {
        if (pointsInfo.isEmpty) {
          isPainting = true;
          var info = infoFromPoint(point, integer: pointInteger);
          logger.d("add 1 info: $info");
          pointsInfo.add(info);
          movePoint = point;
          if (pointsInfo.length >= maxPoints) {
            finishPanit();
            return;
          }
        } else if (isPainting) {
          // if (runtimeType == ParallelComponent) {
          //   if (cPoint.isInfinite) {
          //     bPoint = point;
          //   }
          //   cPoint = point;

          //   if (cPoint.distanceTo(bPoint) > 5) {
          //     isPainting = false;
          //   }
          //   return;
          // }
          // pointsInfo.add(infoFromPoint(point, integer: pointInteger));
          // logger.d("add 2 info");
          movePoint = point;
          // if (pointsInfo.length >= maxPoints) {
          // finishPanit();
          // return;
          // }
        } else {
          isSelected = isContains(point);
          if (isSelected) {
            logger.d("isSelected: $runtimeType");
          }
        }
      }
    }
  }

  void finishPanit() {
    isPainting = false;
    print("添加了: ${this.paintId}");
    dataController.currentStock.paintDatas.add(this);
    dataController.paintManager.currentPaint = null;
    if (dataController.paintContinue) {
      dataController.paintManager.prepare();
    } else {
      dataController.paintManager.currentPaintType = JKUserPathType.none;
    }

    dataController.refreshCanvas();
    uploadPaint();
  }

  void uploadPaint() {
    var points = pointsInfo.map((e) {
      return {"x": e[0], "y": e[1].asFixed(4)};
    }).toList();

    var data = {
      "hash": hash.replaceAll("-", "").substring(0, 16),
      "plotting_id": paintId,
      "symbol": stockCode,
      "kline": stockTime,
      "text": text,
      "cross_time": crossTime ? "1" : "0",
      "slope": slope,
      "points": points,
      "css": {"color": color, "width": lineWidth.toString()}
    };
    network.saveUserPaints(data);
  }

  bool isContains(Offset point) {
    if (pointsInfo.isEmpty) return false;
    for (var e in drawPointsInfo) {
      var hit = pointContains(start: e.first, end: e.last, point: point);
      if (hit) {
        return hit;
      }
    }
    return false;
  }

  void drawBase(Canvas canvas, Size size, Paint paint, {bool isCross = false}) {
    // if (_isPainting || _isSelected) {
    drawPointsInfo.clear();
    _draw(canvas, size, paint);
    // }
  }

  void _draw(Canvas canvas, Size size, Paint paint);

  void _drawControlPoint(Canvas canvas, Size size, {List<List<String>> points = const []}) {
    if (isSelected || isPainting) {
      Paint paint = Paint()..color = Colors.white;

      double radius = 5.0;
      Path path = Path();

      // if (points.isEmpty) {
      //   if (pointsInfo.length >= 2) {
      //     points = [pointsInfo[0], pointsInfo[1]];
      //   } else if (pointsInfo.length == 1) {
      //     points = [pointsInfo[0]];
      //   }

      //   if (runtimeType == HorizontalComponent || runtimeType == VerticalComponent) {
      //     points = [pointsInfo[0]];
      //   }

      //   if (runtimeType == ParallelComponent && pointsInfo.length > 3) {
      //     points.add(pointsInfo[2]);
      //   }
      // }
      var p = [];
      if (points.isEmpty) {
        p.addAll(pointsInfo);
        if (pointsInfo.length != maxPoints) {
          p.add(movePointInfo);
        }
      } else {
        p.addAll(points);
      }

      for (int i = 0; i < p.length; i++) {
        final point = pointFromInfo(p[i]);
        if (point.isFinite) {
          path.addOval(Rect.fromCircle(center: point, radius: radius));
        }
      }

      canvas.drawPath(path, paint);
    }
  }
}

Tuple2 calculateSlope(Offset point1, Offset point2) {
  // logger.d("1:$point1, 2:$point2");
  if (point1.isInfinite || point2.isInfinite) {
    return Tuple2(0, 0);
  }
  double dx = point2.dx - point1.dx;
  double dy = point2.dy - point1.dy;

  if (dx == 0) {
    // 两点的 x 坐标相同，斜率为无穷大
    return Tuple2(0, 0);
  }

  double k = dy / dx;

  double b = point1.dy - k * point1.dx;
  return Tuple2(k, b);
}

bool pointContains({required Offset start, required Offset end, required Offset point}) {
  if (start.isInfinite || end.isInfinite || point.isInfinite) {
    return false;
  }

  double distanceFromStart = point.distanceTo(start);
  double distanceFromEnd = point.distanceTo(end);
  double lineLength = start.distanceTo(end);
  double distanceThreshold = 0.2; // 阈值，用于判断距离误差
  var p = (distanceFromStart + distanceFromEnd - lineLength).abs();
  if (p < distanceThreshold) {
    return true;
  }
  return false;
}

class SegmentComponent extends ShapeComponent {
  SegmentComponent({required super.dataController, required super.paintId});

  @override
  void _draw(Canvas canvas, Size size, Paint paint) {
    var aPoint = pointAt(0);
    var bPoint = pointOrMove(1);
    canvas.drawLine(aPoint, bPoint, paint);
    drawPointsInfo.add([aPoint, bPoint]);
    _drawControlPoint(canvas, size);
  }
}

class ParallelComponent extends ShapeComponent {
  ParallelComponent({required super.dataController, this.count = 1, required super.paintId});

  int count;

  @override
  int get maxPoints => 3;

  @override
  void _draw(Canvas canvas, Size size, Paint paint) {
    var aPoint = pointAt(0);
    var bPoint = pointOrMove(1);
    var cPoint = pointOrMove(2);
    var kb = calculateSlope(aPoint, bPoint);
    if (kb.item1 == 0 && kb.item2 == 0) {
      _drawControlPoint(canvas, size);
      return;
    }

    double wid = size.width;
    double a = 0.0 * kb.item1 + kb.item2;
    double b = wid * kb.item1 + kb.item2;
    canvas.drawLine(Offset(0, a), Offset(wid, b), paint);
    drawPointsInfo.add([Offset(0, a), Offset(wid, b)]);
    if (pointsInfo.length >= 2) {
      var cY = cPoint.dx * kb.item1 + kb.item2;
      var dis = cY - cPoint.dy;
      var c = Offset(0, a - dis);
      var d = Offset(wid, b - dis);
      canvas.drawLine(c, d, paint);
      drawPointsInfo.add([c, d]);

      if (count == 2) {
        var e = Offset(0, a + dis);
        var f = Offset(wid, b + dis);
        canvas.drawLine(e, f, paint);
        drawPointsInfo.add([e, f]);
      } else {
        for (var i = 1; i < count / 2; i++) {
          canvas.drawLine(Offset(0, a + dis * i), Offset(wid, b + dis * i), paint);
          canvas.drawLine(Offset(0, a - dis * i), Offset(wid, b - dis * i), paint);
          drawPointsInfo.add([Offset(0, a + dis * i), Offset(wid, b + dis * i)]);
          drawPointsInfo.add([Offset(0, a - dis * i), Offset(wid, b - dis * i)]);
        }
      }
    }

    _drawControlPoint(canvas, size);
  }
}

class NoneComponent extends ShapeComponent {
  NoneComponent({required super.dataController, required super.paintId});

  @override
  void _draw(Canvas canvas, Size size, Paint paint) {}

  @override
  void uploadPaint() {
    return;
  }
}

class LineComponent extends ShapeComponent {
  LineComponent({required super.dataController, required super.paintId});

  @override
  void _draw(Canvas canvas, Size size, Paint paint) {
    var kb = calculateSlope(pointAt(0), pointOrMove(1));
    if (kb.item1 == 0 && kb.item2 == 0) {
      _drawControlPoint(canvas, size);
      return;
    }

    double wid = size.width;
    double a = 0.0 * kb.item1 + kb.item2;
    double b = wid * kb.item1 + kb.item2;

    canvas.drawLine(Offset(0, a), Offset(wid, b), paint);
    drawPointsInfo.add([Offset(0, a), Offset(wid, b)]);
    _drawControlPoint(canvas, size);
  }
}

class HorizontalComponent extends ShapeComponent {
  HorizontalComponent({required super.dataController, required super.paintId});

  @override
  int get maxPoints => 1;

  @override
  void _draw(Canvas canvas, Size size, Paint paint) {
    var aPoint = pointOrMove(0);
    double wid = size.width;
    canvas.drawLine(Offset(0, aPoint.dy), Offset(wid, aPoint.dy), paint);
    drawPointsInfo.add([Offset(0, aPoint.dy), Offset(wid, aPoint.dy)]);
    _drawControlPoint(canvas, size);
  }
}

class HorizontalWithTextComponent extends ShapeComponent {
  HorizontalWithTextComponent({
    required super.dataController,
    required this.titles,
    required super.paintId,
    this.textBackgroundColor,
  });
  final List<Color>? textBackgroundColor;
  final List<String> titles;
  @override
  int get maxPoints => titles.length;

  @override
  void _draw(Canvas canvas, Size size, Paint paint) {
    for (var i = 0; i < titles.length; i++) {
      var aPoint = pointOrMove(i);
      if (aPoint.dy.isNaN) {
        continue;
      }
      double wid = size.width;

      var textColor = paint.color;
      if (textBackgroundColor != null) {
        var bgColor = textBackgroundColor!.safeAt(i) ?? paint.color;
        paint.color = bgColor;
        canvas.drawRRect(
            RRect.fromRectAndRadius(Rect.fromLTWH(wid - 48, aPoint.dy - 24, 56, 20), const Radius.circular(2)),
            Paint()..color = bgColor);
        textColor = Colors.white;
      }
      canvas.drawLine(Offset(0, aPoint.dy), Offset(wid, aPoint.dy), paint);

      TextPainter tp = TextPainter(
        text: TextSpan(text: titles[i], style: TextStyle(color: textColor, fontSize: 12)),
        textDirection: TextDirection.ltr,
      );
      tp.layout();
      var dx = (50 + tp.size.width) / 2;
      tp.paint(canvas, Offset(wid - dx, aPoint.dy - 21));

      TextPainter valueTp = TextPainter(
        text: TextSpan(
            text: (pointsInfo[i][1]).asFixed(3),
            style: TextStyle(color: textBackgroundColor?.safeAt(i) ?? paint.color, fontSize: 12)),
        textDirection: TextDirection.ltr,
      );
      valueTp.layout();
      valueTp.paint(canvas, Offset(wid - dx - 52, aPoint.dy - 17));

      drawPointsInfo.add([Offset(0, aPoint.dy), Offset(wid, aPoint.dy)]);
      _drawControlPoint(canvas, size);
    }
  }
}

class FirewallComponent extends ShapeComponent {
  FirewallComponent({required super.dataController, required super.paintId});

  @override
  int get maxPoints => 3;

  @override
  void _draw(Canvas canvas, Size size, Paint paint) {
    double wid = size.width;
    var aPoint = pointOrMove(0);
    canvas.drawLine(Offset(0, aPoint.dy), Offset(wid, aPoint.dy), paint);
    canvas.drawText("止盈位", Offset(wid - 35, aPoint.dy - 16), paint.color, 10);
    drawPointsInfo.add([Offset(0, aPoint.dy), Offset(wid, aPoint.dy)]);

    var bPoint = pointOrMove(1);
    canvas.drawLine(Offset(0, bPoint.dy), Offset(wid, bPoint.dy), paint);
    canvas.drawText("买入位", Offset(wid - 35, bPoint.dy - 16), paint.color, 10);
    drawPointsInfo.add([Offset(0, bPoint.dy), Offset(wid, bPoint.dy)]);

    var cPoint = pointOrMove(2);
    canvas.drawLine(Offset(0, cPoint.dy), Offset(wid, cPoint.dy), paint);
    canvas.drawText("止损位", Offset(wid - 35, cPoint.dy - 16), paint.color, 10);
    drawPointsInfo.add([Offset(0, cPoint.dy), Offset(wid, cPoint.dy)]);

    _drawControlPoint(canvas, size);
  }
}

class WaveComponent extends ShapeComponent {
  WaveComponent(
      {required super.dataController, this.waveNum = 0, this.free = true, this.isWm = false, required super.paintId});
  int waveNum;
  bool free;
  bool isWm;

  @override
  int get maxPoints {
    if (waveNum > 0) {
      return free ? waveNum : 2;
    }
    return 999;
  }

  List<List<String>> movePoints = [];
  var waveRate = [0.35, 2.0, 1.6, 2.6, 1.6, 2.2, 1.35];
  var wmRate = [0.35, 2.0, 0.3, 2.0, 0.3];

  List<List<String>> getMovePoints(Offset point) {
    List<List<String>> movePoints = [];
    var startPoint = pointFromInfo(pointsInfo[0]);
    var dx = point.dx - startPoint.dx;
    var dy = point.dy - startPoint.dy;
    if (pointsInfo.length == 1) {
      var p = infoFromPoint(point);
      movePoints.add(p);
    }

    for (var i = 0; i < waveNum - 1; i++) {
      var r = (isWm ? wmRate : waveRate).safeAt(i) ?? 1;
      var p = infoFromPoint(Offset(startPoint.dx + dx * (i + 2), startPoint.dy + dy * r));
      movePoints.add(p);
    }
    return movePoints;
  }

  // @override
  // void _onMouseDown(Offset point) {
  //   super._onMouseDown(point);
  //   if (pointsInfo.length == maxPoints && free == false) {
  //     pointsInfo.addAll(getMovePoints(pointAt(1)));
  //   }
  // }

  @override
  void onMouseUp(Offset point) {
    super.onMouseUp(point);
    if (pointsInfo.length == maxPoints && free == false) {
      pointsInfo.addAll(getMovePoints(pointAt(1)));
    }
  }

  @override
  void _draw(Canvas canvas, Size size, Paint paint) {
    Offset endPoint = Offset.infinite;
    List<List<String>> cachePoints = [];
    cachePoints.addAll(pointsInfo);

    if (free == false && pointsInfo.length < maxPoints) {
      cachePoints.addAll(getMovePoints(movePoint));
    }

    if (cachePoints.isNotEmpty) {
      endPoint = pointFromInfo(cachePoints[0]);
    }
    for (int i = 0; i < cachePoints.length - 1; i++) {
      final startPoint = pointFromInfo(cachePoints[i]);
      endPoint = pointFromInfo(cachePoints[i + 1]);
      if (startPoint.isFinite && endPoint.isFinite) {
        canvas.drawLine(startPoint, endPoint, paint);
        drawPointsInfo.add([startPoint, endPoint]);
      }
    }
    if (movePointInfo.isNotEmpty) {
      var m = pointFromInfo(movePointInfo);
      if (isPainting && free == true) {
        canvas.drawLine(endPoint, m, paint);
      }
    }

    _drawControlPoint(canvas, size, points: cachePoints);
  }
}

class VerticalComponent extends ShapeComponent {
  VerticalComponent({required super.dataController, required super.paintId});
  @override
  int get maxPoints => 1;

  @override
  void _draw(Canvas canvas, Size size, Paint paint) {
    double height = size.height;
    var aPoint = pointOrMove(0);
    canvas.drawLine(Offset(aPoint.dx, 0), Offset(aPoint.dx, height), paint);
    drawPointsInfo.add([Offset(aPoint.dx, 0), Offset(aPoint.dx, height)]);
    _drawControlPoint(canvas, size);
  }
}

/// 等周期线
class PeriodicComponent extends ShapeComponent {
  PeriodicComponent({required super.dataController, required super.paintId});

  @override
  void _onMouseDown(Offset point) {
    if (pointsInfo.isEmpty) {
      isPainting = true;
    }
    if (isPainting) {
      pointsInfo.add(infoFromPoint(point, integer: true));
      if (pointsInfo.length == 2) {
        finishPanit();
      }
    } else {
      isSelected = isContains(point);
    }
  }

  @override
  void _draw(Canvas canvas, Size size, Paint paint) {
    double height = size.height;
    double width = size.width;

    var endPoint = Offset.infinite;
    if (pointsInfo.length == 2) {
      endPoint = pointFromInfo(pointsInfo[1]);
    } else if (isPainting && movePointInfo.isNotEmpty) {
      endPoint = movePoint;
    }

    canvas.drawLine(Offset(endPoint.dx, 0), Offset(endPoint.dx, height), paint);

    if (pointsInfo.isNotEmpty) {
      final startPoint = pointFromInfo(pointsInfo[0]);
      if (endPoint.isInfinite) {
        endPoint = startPoint;
      }
      var offset = endPoint.dx - startPoint.dx;
      for (int i = 0; i < 500; i++) {
        var x = startPoint.dx + offset * i;
        if (offset > 0 && x > width) {
          break;
        }

        if (offset < 0 && x < 0) {
          break;
        }
        canvas.drawLine(Offset(x, 0), Offset(x, height), paint);
        drawPointsInfo.add([Offset(x, 0), Offset(x, height)]);
      }
    }

    _drawControlPoint(canvas, size, points: pointsInfo);
  }
}

const fib = [
  0,
  1,
  1,
  2,
  3,
  5,
  8,
  13,
  21,
  34,
  55,
  89,
  144,
  233,
  377,
  610,
  987,
  1597,
  2584,
  4181,
  6765,
  10946,
  17711,
  28657,
  46368,
  75025,
  121393,
  196418,
  317811,
  514229,
  832040,
  1346269,
  2178309,
  3524578,
  5702887,
  9227465,
  14930352,
  24157817,
  39088169,
  63245986,
  102334155,
  165580141,
  267914296,
  433494437,
  701408733,
  1134903170,
  1836311903,
  2971215073,
  4807526976,
  7778742049
];

class FibonacciComponent extends ShapeComponent {
  FibonacciComponent({required super.dataController, required super.paintId});

  @override
  void _onMouseDown(Offset point) {
    if (pointsInfo.isEmpty) {
      isPainting = true;
    }

    if (isPainting) {
      pointsInfo.add(infoFromPoint(point, integer: true));
      if (pointsInfo.length == 2) {
        finishPanit();
      }
    } else {
      isSelected = isContains(point);
    }
  }

  @override
  void _draw(Canvas canvas, Size size, Paint paint) {
    double height = size.height;
    double width = size.width;

    var endPoint = Offset.infinite;
    if (pointsInfo.length == 2) {
      endPoint = pointFromInfo(pointsInfo[1]);
    } else if (isPainting && movePointInfo.isNotEmpty) {
      endPoint = movePoint;
    }

    canvas.drawLine(Offset(endPoint.dx, 0), Offset(endPoint.dx, height), paint);
    drawPointsInfo.add([Offset(endPoint.dx, 0), Offset(endPoint.dx, height)]);
    if (pointsInfo.isNotEmpty) {
      final startPoint = pointFromInfo(pointsInfo[0]);
      if (endPoint.isInfinite) {
        endPoint = startPoint;
      }
      var offset = endPoint.dx - startPoint.dx;
      for (int i = 0; i < 50; i++) {
        var f = fib[i];
        var x = startPoint.dx + offset * f;
        if (offset > 0 && x > width) {
          break;
        }

        if (offset < 0 && x < 0) {
          break;
        }
        canvas.drawLine(Offset(x, 0), Offset(x, height), paint);
        drawPointsInfo.add([Offset(x, 0), Offset(x, height)]);
      }
    }

    _drawControlPoint(canvas, size, points: pointsInfo);
  }
}

class GoldenComponent extends ShapeComponent {
  GoldenComponent({required super.dataController, required super.paintId});

  @override
  void _onMouseDown(Offset point) {
    if (pointsInfo.isEmpty) {
      isPainting = true;
    }

    if (isPainting) {
      var info = infoFromPoint(point, integer: true);
      pointsInfo.add(info);
      if (pointsInfo.length == 2) {
        finishPanit();
      }
    } else {
      isSelected = isContains(point);
    }
  }

  @override
  void _draw(Canvas canvas, Size size, Paint paint) {
    double width = size.width;

    var endPoint = Offset.infinite;
    if (pointsInfo.length == 2) {
      endPoint = pointAt(1);
    } else if (isPainting && movePointInfo.isNotEmpty) {
      endPoint = movePoint;
    }
    var r = [0.191, 0.382, 0.500, 0.618];
    if (endPoint.isFinite) {
      canvas.drawLine(Offset(0, endPoint.dy), Offset(width, endPoint.dy), paint);
      drawPointsInfo.add([Offset(0, endPoint.dy), Offset(width, endPoint.dy)]);
      var text = movePointInfo[1];
      if (pointsInfo.length == 2) {
        text = pointsInfo[1][1];
      }
      canvas.drawText(text.asFixed(3), Offset(0, endPoint.dy), paint.color, 10);
    }

    if (pointsInfo.isNotEmpty) {
      final startPoint = pointAt(0);
      canvas.drawLine(Offset(0, startPoint.dy), Offset(width, startPoint.dy), paint);
      drawPointsInfo.add([Offset(0, startPoint.dy), Offset(width, startPoint.dy)]);
      canvas.drawText(pointsInfo[0][1].asFixed(3), Offset(0, startPoint.dy), paint.color, 10);
      if (endPoint.isInfinite) {
        endPoint = startPoint;
      }

      var dashColor = paint.color.withAlpha(180);
      var offset = endPoint.dy - startPoint.dy;
      for (int i = 0; i < r.length; i++) {
        var y = startPoint.dy + offset * r[i];
        canvas.drawDashLine(Offset(0, y), Offset(width, y), dashWidth: 2, spaceWidth: 5, color: dashColor);
        drawPointsInfo.add([Offset(0, y), Offset(width, y)]);
        var text = dataController.valueFromY(y).asFixed(3);
        canvas.drawText(text, Offset(0, y), paint.color, 10);
      }

      for (int i = 0; i < r.length; i++) {
        var y = endPoint.dy + offset * r[i];
        canvas.drawDashLine(Offset(0, y), Offset(width, y), dashWidth: 2, spaceWidth: 5, color: dashColor);
        drawPointsInfo.add([Offset(0, y), Offset(width, y)]);

        var text = dataController.valueFromY(y).asFixed(3);
        canvas.drawText(text, Offset(0, y), paint.color, 10);
      }
      // 2.618
      var y = endPoint.dy + offset * 1.618;
      canvas.drawDashLine(Offset(0, y), Offset(width, y), dashWidth: 2, spaceWidth: 5, color: dashColor);
      drawPointsInfo.add([Offset(0, y), Offset(width, y)]);

      var text = dataController.valueFromY(y).asFixed(3);
      canvas.drawText(text, Offset(0, y), paint.color, 10);
    }

    _drawControlPoint(canvas, size, points: pointsInfo);
  }
}

class GannComponent extends ShapeComponent {
  GannComponent({required super.dataController, required super.paintId});

  @override
  void _draw(Canvas canvas, Size size, Paint paint) {
    var aPoint = pointAt(0);
    var bPoint = pointOrMove(1);
    var kb = calculateSlope(aPoint, bPoint);
    if (kb.item1 == 0 && kb.item2 == 0) {
      _drawControlPoint(canvas, size);
      return;
    }

    double wid = size.width;
    double a = 0.0 * kb.item1 + kb.item2;
    double b = wid * kb.item1 + kb.item2;

    var divs = [2, 3, 4, 8];

    for (var e in divs) {
      var wderict = aPoint.dx > bPoint.dx ? -1 : 1;
      var wX = aPoint.dx + wderict * (aPoint.dx - bPoint.dx).abs() / e;
      var wKb = calculateSlope(aPoint, Offset(wX, bPoint.dy));
      var wA = 0.0 * wKb.item1 + wKb.item2;
      var wB = wid * wKb.item1 + wKb.item2;

      var hDerict = aPoint.dy < bPoint.dy ? -1 : 1;
      var hOffset = aPoint.dy - hDerict * (aPoint.dy - bPoint.dy).abs() / e;
      var hKb = calculateSlope(aPoint, Offset(bPoint.dx, hOffset));
      var hA = 0.0 * hKb.item1 + hKb.item2;
      var hB = wid * hKb.item1 + hKb.item2;

      TextPainter tp = TextPainter(
          text: TextSpan(text: "1/$e", style: TextStyle(color: paint.color, fontSize: 12)),
          textDirection: TextDirection.ltr);
      tp.layout();
      tp.paint(canvas, Offset(wX, bPoint.dy - 20));
      tp.paint(canvas, Offset(bPoint.dx - 20, hOffset));
      if (aPoint.dx > bPoint.dx) {
        if (e == 3) {
          canvas.drawDashLine(Offset(0, wA), aPoint);
          canvas.drawDashLine(Offset(0, hA), aPoint);

          drawPointsInfo.add([Offset(0, wA), aPoint]);
          drawPointsInfo.add([Offset(0, hA), aPoint]);
        } else {
          canvas.drawLine(Offset(0, wA), aPoint, paint);
          drawPointsInfo.add([Offset(0, wA), aPoint]);
          if (e == 8) {
            canvas.drawDashLine(Offset(0, hA), aPoint);
            drawPointsInfo.add([Offset(0, hA), aPoint]);
          } else {
            canvas.drawLine(Offset(0, hA), aPoint, paint);
            drawPointsInfo.add([Offset(0, hA), aPoint]);
          }
        }
      } else {
        if (e == 3) {
          canvas.drawDashLine(aPoint, Offset(wid, wB));
          canvas.drawDashLine(aPoint, Offset(wid, hB));
          drawPointsInfo.add([aPoint, Offset(wid, wB)]);
          drawPointsInfo.add([aPoint, Offset(wid, hB)]);
        } else {
          canvas.drawLine(aPoint, Offset(wid, wB), paint);
          drawPointsInfo.add([aPoint, Offset(wid, wB)]);
          if (e == 8) {
            canvas.drawDashLine(aPoint, Offset(wid, hB));
            drawPointsInfo.add([aPoint, Offset(wid, hB)]);
          } else {
            canvas.drawLine(aPoint, Offset(wid, hB), paint);
            drawPointsInfo.add([aPoint, Offset(wid, hB)]);
          }
        }
      }
    }

    if (aPoint.dx > bPoint.dx) {
      canvas.drawLine(Offset(0, a), aPoint, paint);
      drawPointsInfo.add([Offset(0, a), aPoint]);
    } else {
      canvas.drawLine(aPoint, Offset(wid, b), paint);
      drawPointsInfo.add([aPoint, Offset(wid, b)]);
    }
    TextPainter tp = TextPainter(
        text: TextSpan(text: "1/1", style: TextStyle(color: paint.color, fontSize: 12)),
        textDirection: TextDirection.ltr);
    tp.layout();
    tp.paint(canvas, Offset(bPoint.dx - 20, bPoint.dy));
    _drawControlPoint(canvas, size);
  }
}

Path makeArrowPath(Offset start, Offset end, {int arrowSize = 8}) {
  Path path = Path();
  path.moveTo(start.dx, start.dy);
  path.lineTo(end.dx, end.dy);

  // 计算箭头的角度
  double angle = atan2(end.dy - start.dy, end.dx - start.dx);

  // 计算箭头的顶点坐标
  Offset arrowPoint = end - Offset(arrowSize * cos(angle), arrowSize * sin(angle));

  // 计算箭头两边的点坐标
  var ale = pi / 1.8;
  Offset arrowLeftPoint = arrowPoint + Offset(arrowSize * cos(angle - ale), arrowSize * sin(angle - ale));
  Offset arrowRightPoint = arrowPoint + Offset(arrowSize * cos(angle + ale), arrowSize * sin(angle + ale));

  // 绘制箭头
  path.moveTo(arrowLeftPoint.dx, arrowLeftPoint.dy);
  path.lineTo(end.dx, end.dy);
  path.lineTo(arrowRightPoint.dx, arrowRightPoint.dy);
  return path;
}

class ArrowComponent extends ShapeComponent {
  ArrowComponent({required super.dataController, required this.arrowType, required super.paintId});
  int arrowType;

  @override
  void _draw(Canvas canvas, Size size, Paint paint) {
    var start = pointAt(0);
    var end = pointOrMove(1);

    var center = start.getCenterWith(end);

    double arrowWidth = (end.dx - start.dx).abs();
    double arrowHeight = (end.dy - start.dy).abs();

    arrowWidth = arrowWidth.clamp(30, 100);
    arrowHeight = arrowHeight.clamp(30, 100);

    var length = arrowWidth > arrowHeight ? arrowHeight : arrowWidth;

    final p = Paint()
      ..color = paint.color
      ..style = PaintingStyle.fill;
    var path = Path();
    if (arrowType == 0) {
      // 绘制箭头
      path.moveTo(start.dx, start.dy);
      path.lineTo(end.dx, end.dy);
      var arrowSize = 20;
      // 计算箭头的角度
      double angle = atan2(end.dy - start.dy, end.dx - start.dx);

      // 计算箭头的顶点坐标
      Offset arrowPoint = end - Offset(arrowSize * cos(angle), arrowSize * sin(angle));

      // 计算箭头两边的点坐标
      var ale = pi / 1.8;
      Offset arrowLeftPoint = arrowPoint + Offset(arrowSize * cos(angle - ale), arrowSize * sin(angle - ale));
      Offset arrowRightPoint = arrowPoint + Offset(arrowSize * cos(angle + ale), arrowSize * sin(angle + ale));

      // 绘制箭头
      path.moveTo(arrowLeftPoint.dx, arrowLeftPoint.dy);
      path.lineTo(end.dx, end.dy);
      path.lineTo(arrowRightPoint.dx, arrowRightPoint.dy);

      var top = end.getCenterWith(arrowLeftPoint);
      var bottom = end.getCenterWith(arrowRightPoint);
      var d1 = start.distanceTo(end);
      var d2 = top.distanceTo(end);
      //防止空洞
      if (d1 > d2) {
        path.moveTo(start.dx, start.dy);
        path.lineTo(top.dx, top.dy);
        path.lineTo(bottom.dx, bottom.dy);
      }
    }

    if (start.dy > end.dy) {
      var t = end;
      end = start;
      start = t;
    }

    if (arrowType == 1) {
      p.color = Colors.green;
      // 绘制长方体
      final rect = Rect.fromPoints(Offset(center.dx - length / 5, start.dy + length * 0.45 - 2),
          Offset(center.dx + length / 5, start.dy + length));
      canvas.drawRect(rect, p);

      // 绘制箭头

      path.moveTo(center.dx - length / 3, start.dy + length * 0.45);
      path.lineTo(center.dx + length / 3, start.dy + length * 0.45);
      path.lineTo(center.dx, start.dy);
      path.close();
    } else if (arrowType == 2) {
      p.color = Colors.red;
      // 绘制长方体
      final rect = Rect.fromPoints(
          Offset(center.dx - length / 5, end.dy - length * 0.45 + 2), Offset(center.dx + length / 5, end.dy - length));
      canvas.drawRect(rect, p);

      // 绘制箭头
      path.moveTo(center.dx - length / 3, end.dy - length * 0.45);
      path.lineTo(center.dx + length / 3, end.dy - length * 0.45);
      path.lineTo(center.dx, end.dy);
      path.close();
    }
    if (arrowType == 3) {
      p.style = PaintingStyle.stroke;
      p.strokeWidth = 2;
      path = makeArrowPath(pointAt(0), pointOrMove(1), arrowSize: 10);
    }

    canvas.drawPath(path, p);
    drawPointsInfo.add([pointAt(0), pointOrMove(1)]);
    _drawControlPoint(canvas, size);
  }

  @override
  bool isContains(Offset point) {
    if (arrowType == 1 || arrowType == 2) {
      var start = pointAt(0);
      var end = pointOrMove(1);
      return Rect.fromPoints(start, end).contains(point);
    }
    return super.isContains(point);
  }
}

class RayComponent extends ShapeComponent {
  RayComponent({required super.dataController, required super.paintId});

  @override
  void _draw(Canvas canvas, Size size, Paint paint) {
    var aPoint = pointAt(0);
    var bPoint = pointOrMove(1);
    var kb = calculateSlope(aPoint, bPoint);
    if (kb.item1 == 0 && kb.item2 == 0) {
      _drawControlPoint(canvas, size);
      return;
    }

    double wid = size.width;
    double a = 0.0 * kb.item1 + kb.item2;
    double b = wid * kb.item1 + kb.item2;
    if (aPoint.dx > bPoint.dx) {
      canvas.drawLine(Offset(0, a), aPoint, paint);
      drawPointsInfo.add([Offset(0, a), aPoint]);
    } else {
      canvas.drawLine(aPoint, Offset(wid, b), paint);
      drawPointsInfo.add([aPoint, Offset(wid, b)]);
    }

    _drawControlPoint(canvas, size);
  }
}

class RectComponent extends ShapeComponent {
  RectComponent({required super.dataController, required super.paintId});

  @override
  void _draw(Canvas canvas, Size size, Paint paint) {
    var start = pointAt(0);
    var end = pointOrMove(1);
    canvas.drawRect(Rect.fromPoints(start, end), paint);
    drawPointsInfo.add([start, Offset(end.dx, start.dy)]);
    drawPointsInfo.add([start, Offset(start.dx, end.dy)]);
    drawPointsInfo.add([end, Offset(end.dx, start.dy)]);
    drawPointsInfo.add([end, Offset(start.dx, end.dy)]);
    _drawControlPoint(canvas, size);
  }
}

class RulerComponent extends ShapeComponent {
  RulerComponent({required super.dataController, this.isH = false, this.isV = true, required super.paintId});
  bool isH;
  bool isV;

  @override
  void _draw(Canvas canvas, Size size, Paint paint) {
    var startPoint = pointAt(0);
    var endPoint = pointOrMove(1);
    if (isH) {
      canvas.drawLine(startPoint, Offset(startPoint.dx, endPoint.dy), paint);
      canvas.drawLine(Offset(endPoint.dx, startPoint.dy), endPoint, paint);

      drawPointsInfo.add([startPoint, Offset(startPoint.dx, endPoint.dy)]);
      drawPointsInfo.add([Offset(endPoint.dx, startPoint.dy), endPoint]);

      // 箭头
      var dy = (endPoint.dy + startPoint.dy) / 2;
      Path ap;
      if (startPoint.dx < endPoint.dx) {
        ap = makeArrowPath(Offset(startPoint.dx + 5, dy), Offset(endPoint.dx - 5, dy));
      } else {
        ap = makeArrowPath(Offset(endPoint.dx + 5, dy), Offset(startPoint.dx - 5, dy));
      }
      canvas.drawPath(ap, paint);

      var startDateInfo = pointsInfo[0][0].split("@")[0];
      var startIndex = dataController.currentStock.dateIndex.indexOf(startDateInfo);
      startIndex = dataController.currentStock.dateIndex.length - startIndex - 1;
      var endInfo = pointsInfo.length == 2 ? pointsInfo[1][0] : movePointInfo[0];
      var endDateinfo = endInfo.split("@")[0];
      var endIndex = dataController.currentStock.dateIndex.indexOf(endDateinfo);
      endIndex = dataController.currentStock.dateIndex.length - endIndex - 1;

      var minIndex = min(startIndex, endIndex);
      var maxIndex = max(startIndex, endIndex);

      DateTime startDate = DateTime.parse(startDateInfo);
      DateTime endDate = DateTime.parse(endDateinfo);
      Duration difference = endDate.difference(startDate);

      var bottomY = max(startPoint.dy, endPoint.dy);
      var text = "K线数: ${maxIndex - minIndex + 1}, 天数: ${difference.inDays + 1}";
      canvas.drawText(text, Offset(startPoint.dx + 5, bottomY + 5), paint.color, 14);
    }

    if (isV) {
      canvas.drawLine(startPoint, Offset(endPoint.dx, startPoint.dy), paint);
      canvas.drawLine(Offset(startPoint.dx, endPoint.dy), endPoint, paint);

      drawPointsInfo.add([startPoint, Offset(endPoint.dx, startPoint.dy)]);
      drawPointsInfo.add([Offset(startPoint.dx, endPoint.dy), endPoint]);

      // 箭头
      var dx = (endPoint.dx + startPoint.dx) / 2;
      Path ap;
      if (startPoint.dy > endPoint.dy) {
        ap = makeArrowPath(Offset(dx, startPoint.dy - 5), Offset(dx, endPoint.dy + 5));
      } else {
        ap = makeArrowPath(Offset(dx, startPoint.dy + 5), Offset(dx, endPoint.dy - 5));
      }

      canvas.drawPath(ap, paint);

      var startPrice = double.parse(pointsInfo[0][1]);
      var endInfo = pointsInfo.length == 2 ? pointsInfo[1][1] : movePointInfo[1];
      var endPrice = double.parse(endInfo);

      var bottomY = max(startPoint.dy, endPoint.dy);
      var dy = endPrice - startPrice;
      var percent = dy / startPrice * 100;
      var text = "${dy.toStringAsFixed(2)} (${percent.toStringAsFixed(2)}%)";
      var pading = isH ? 25 : 5;

      canvas.drawText(text, Offset(startPoint.dx + 5, bottomY + pading), paint.color, 14);
    }

    // 背景图
    var fill = Paint();
    fill.style = PaintingStyle.fill;
    fill.color = paint.color.withAlpha(50);
    canvas.drawRect(Rect.fromPoints(startPoint, endPoint), fill);

    _drawControlPoint(canvas, size);
  }
}

class AndrewForkComponent extends ShapeComponent {
  AndrewForkComponent({required super.dataController, required super.paintId});

  @override
  int get maxPoints => 3;

  @override
  bool get pointInteger => true;

  @override
  void _draw(Canvas canvas, Size size, Paint paint) {
    List<List<String>> cachePoints = [];
    cachePoints.addAll(pointsInfo);
    if (cachePoints.length < maxPoints) {
      cachePoints.add(movePointInfo);
    }

    for (int i = 0; i < cachePoints.length - 1; i++) {
      final startPoint = pointFromInfo(cachePoints[i]);
      var endPoint = pointFromInfo(cachePoints[i + 1]);
      if (startPoint.isFinite && endPoint.isFinite) {
        canvas.drawLine(startPoint, endPoint, paint);
        drawPointsInfo.add([startPoint, endPoint]);
      }
    }
    // 绘制音叉
    if (pointsInfo.length >= 2) {
      var dashColor = paint.color.withAlpha(150);
      var startA = pointFromInfo(cachePoints[0]);
      var startB = pointFromInfo(cachePoints[1]);
      var move = pointOrMove(2);
      var anchor = Offset((startB.dx + move.dx) / 2, (startB.dy + move.dy) / 2);

      double wid = size.width;
      var kb = calculateSlope(startA, anchor);
      var hA = 0.0 * kb.item1 + kb.item2;
      var hB = wid * kb.item1 + kb.item2;
      if (startA.dx < anchor.dx) {
        canvas.drawLine(startA, Offset(wid, hB), paint);
        drawPointsInfo.add([startA, Offset(wid, hB)]);
      } else {
        canvas.drawLine(Offset(0, hA), startA, paint);
        drawPointsInfo.add([Offset(0, hA), startA]);
      }

      double dx = anchor.dx - startB.dx;
      double dy = anchor.dy - startB.dy;
      double extendLength = sqrt(dx * dx + dy * dy);

      var line0 = extendLine(anchor, startB, extendLength);
      canvas.drawDashLine(startB, line0, color: dashColor);
      drawPointsInfo.add([startB, line0]);

      var line8 = extendLine(anchor, move, extendLength);
      canvas.drawDashLine(move, line8, color: dashColor);
      drawPointsInfo.add([move, line8]);

      // 从上至下依次画线
      var line1 = startB.getCenterWith(line0);
      var line3 = anchor.getCenterWith(startB);
      var line5 = anchor.getCenterWith(move);
      var line7 = move.getCenterWith(line8);
      var lines = [line0, line1, startB, line3, line5, move, line7, line8];
      for (var i = 0; i < lines.length; i++) {
        var p = lines[i];
        var y = hB - (p.dx * kb.item1 + kb.item2) + p.dy;
        var y2 = hA - (p.dx * kb.item1 + kb.item2) + p.dy;
        if (i == 2 || i == 5) {
          if (startA.dx < anchor.dx) {
            canvas.drawLine(p, Offset(wid, y), paint);
            drawPointsInfo.add([p, Offset(wid, y)]);
          } else {
            canvas.drawLine(Offset(0, y2), p, paint);
            drawPointsInfo.add([Offset(0, y2), p]);
          }
        } else {
          if (startA.dx < anchor.dx) {
            canvas.drawDashLine(p, Offset(wid, y), dashWidth: 5, spaceWidth: 10, color: dashColor);
            drawPointsInfo.add([p, Offset(wid, y)]);
          } else {
            canvas.drawDashLine(Offset(0, y2), p, dashWidth: 5, spaceWidth: 10, color: dashColor);
            drawPointsInfo.add([Offset(0, y2), p]);
          }
        }
      }
    }

    _drawControlPoint(canvas, size, points: cachePoints);
  }
}

class RoundComponent extends ShapeComponent {
  RoundComponent({required super.dataController, required super.paintId});

  @override
  void _draw(Canvas canvas, Size size, Paint paint) {
    var start = pointFromInfo(pointsInfo[0]);
    var dis = start.distanceTo(pointOrMove(1));
    canvas.drawCircle(start, dis, paint);
    _drawControlPoint(canvas, size);
  }

  @override
  bool isContains(Offset point) {
    var start = pointFromInfo(pointsInfo[0]);
    var dis = start.distanceTo(pointOrMove(1));
    double distance = sqrt(pow(point.dx - start.dx, 2) + pow(point.dy - start.dy, 2));
    return (distance - dis).abs() < 10 || start.distanceTo(point) < 10;
  }
}

class OvalComponent extends ShapeComponent {
  OvalComponent({required super.dataController, required super.paintId});

  @override
  void _draw(Canvas canvas, Size size, Paint paint) {
    var start = pointAt(0);
    var end = pointOrMove(1);

    canvas.drawOval(Rect.fromPoints(start, end), paint);
    _drawControlPoint(canvas, size);
  }

  @override
  bool isContains(Offset point) {
    var start = pointAt(0);
    var end = pointAt(1);
    double radiusX = (end.dx - start.dx).abs() / 2;
    double radiusY = (end.dy - start.dy).abs() / 2;
    double centerX = start.dx + radiusX;
    double centerY = start.dy + radiusY;

    double f1X = centerX - sqrt(radiusX * radiusX - radiusY * radiusY);
    double f1Y = centerY;
    double f2X = centerX + sqrt(radiusX * radiusX - radiusY * radiusY);
    double f2Y = centerY;

    double distanceToFocus1 = point.distanceTo(Offset(f1X, f1Y));
    double distanceToFocus2 = point.distanceTo(Offset(f2X, f2Y));
    double sumOfDistances = distanceToFocus1 + distanceToFocus2;

    var isSelLine = (sumOfDistances - radiusX * 2).abs() < 10;
    return isSelLine || start.distanceTo(point) < 10 || end.distanceTo(point) < 10;
  }
}

class ArcComponent extends ShapeComponent {
  ArcComponent({required super.dataController, required super.paintId});

  var divs = [0.382, 0.5, 0.618, 1.0];
  @override
  void _draw(Canvas canvas, Size size, Paint paint) {
    var start = pointAt(0);
    var end = pointOrMove(1);
    var radius = start.distanceTo(end);

    canvas.drawDashLine(start, end, color: paint.color, dashWidth: 2, spaceWidth: 4);

    var angle = start.dy < end.dy ? -pi : pi;
    for (var i = 0; i < divs.length; i++) {
      var dy = radius * divs[i] * (start.dy > end.dy ? -1 : 1);
      final rect = Rect.fromCircle(center: start, radius: dy.abs());
      canvas.drawArc(rect, angle, angle, false, paint);
      TextPainter tp = TextPainter(
          text: TextSpan(text: "${divs[i]}", style: TextStyle(color: paint.color, fontSize: 12)),
          textDirection: TextDirection.ltr);
      tp.layout();
      tp.paint(canvas, Offset(start.dx, start.dy + dy - 20));
    }

    _drawControlPoint(canvas, size);
  }

  @override
  bool isContains(Offset point) {
    var start = pointAt(0);
    var end = pointOrMove(1);
    var radius = start.distanceTo(end);
    var dis = start.distanceTo(point);

    for (var i = 0; i < divs.length; i++) {
      var dy = radius * divs[i];
      if ((dy - dis).abs() < 10) {
        return true;
      }
    }

    return start.distanceTo(point) < 10;
  }
}

class WaveRluerComponent extends ShapeComponent {
  WaveRluerComponent({required super.dataController, required super.paintId});

  @override
  int get maxPoints => 3;

  @override
  void _draw(Canvas canvas, Size size, Paint paint) {
    List<List<String>> cachePoints = [];
    cachePoints.addAll(pointsInfo);
    if (cachePoints.length < maxPoints) {
      cachePoints.add(movePointInfo);
    }

    for (int i = 0; i < cachePoints.length - 1; i++) {
      final startPoint = pointFromInfo(cachePoints[i]);
      var endPoint = pointFromInfo(cachePoints[i + 1]);

      if (startPoint.isFinite && endPoint.isFinite) {
        canvas.drawLine(startPoint, endPoint, paint);
        drawPointsInfo.add([startPoint, endPoint]);
      }
    }
    var aPoint = pointAt(0);
    var bPoint = pointOrMove(1);
    var isUp = aPoint.dy > bPoint.dy ? -1 : 1;
    if (pointsInfo.length == 1) {
      var aValue = double.parse(pointsInfo[0][1]);
      canvas.drawText(aValue.toStringAsFixed(2), Offset(aPoint.dx - 15, aPoint.dy + 10), paint.color, 12);

      var bValue = double.parse(movePointInfo[1]);
      canvas.drawText(bValue.toStringAsFixed(2), Offset(bPoint.dx - 15, bPoint.dy + 10), paint.color, 12);
    } else if (pointsInfo.length >= 2) {
      var height = (aPoint.dy - bPoint.dy).abs();
      var cPoint = pointOrMove(2);
      var top = cPoint + Offset(0, height * isUp);
      canvas.drawLine(cPoint, top, paint);
      drawPointsInfo.add([cPoint, top]);

      var aValue = double.parse(pointsInfo[0][1]);
      canvas.drawText(aValue.toStringAsFixed(2), Offset(aPoint.dx - 15, aPoint.dy + 10), paint.color, 12);

      var bValue = double.parse(pointsInfo[1][1]);
      canvas.drawText(bValue.toStringAsFixed(2), Offset(bPoint.dx - 15, bPoint.dy + 10), paint.color, 12);
      double cText;
      if (isUp == -1) {
        cText = ((aPoint.dy - cPoint.dy) - height) / height * 100;
      } else {
        cText = ((cPoint.dy - bPoint.dy)) / height * 100;
      }

      canvas.drawText("${cText.toStringAsFixed(2)}%", Offset(cPoint.dx - 15, cPoint.dy - 20 * isUp), paint.color, 12);

      var dValue = (double.parse(pointsInfo[0][1]) - double.parse(pointsInfo[1][1])).abs();
      var l = [0, 0.382, 0.618, 1.0];
      for (var element in l) {
        var dy = height * element;
        var cValue = double.parse(infoFromPoint(cPoint)[1]);
        canvas.drawLine(
            Offset(cPoint.dx - 10, cPoint.dy + dy * isUp), Offset(cPoint.dx + 10, cPoint.dy + dy * isUp), paint);
        var value = (cValue + dValue * element).toStringAsFixed(2);
        canvas.drawText("${(element * 100).toStringAsFixed(2)}%    $value",
            Offset(cPoint.dx + 15, cPoint.dy + dy * isUp - 10), paint.color, 12);
      }
    }

    _drawControlPoint(canvas, size);
  }
}

class HeadShoulderComponent extends ShapeComponent {
  HeadShoulderComponent({required super.dataController, this.waveNum = 0, required super.paintId});
  int waveNum;

  @override
  int get maxPoints => 7;

  @override
  void _draw(Canvas canvas, Size size, Paint paint) {
    Offset endPoint = Offset.infinite;
    List<List<String>> cachePoints = [];
    cachePoints.addAll(pointsInfo);
    if (cachePoints.length < maxPoints) {
      cachePoints.add(movePointInfo);
    }

    if (cachePoints.isNotEmpty) {
      endPoint = pointFromInfo(cachePoints[0]);
    }
    for (int i = 0; i < cachePoints.length - 1; i++) {
      final startPoint = pointFromInfo(cachePoints[i]);
      endPoint = pointFromInfo(cachePoints[i + 1]);
      if (startPoint.isFinite && endPoint.isFinite) {
        canvas.drawLine(startPoint, endPoint, paint);
        drawPointsInfo.add([startPoint, endPoint]);
      }
    }
    if (movePointInfo.isNotEmpty) {
      var m = pointFromInfo(movePointInfo);
      if (isPainting) {
        canvas.drawLine(endPoint, m, paint);
      }
    }

    if (cachePoints.length >= 5) {
      //填充颜色
      var fillPaint = Paint()
        ..color = paint.color.withAlpha(50)
        ..style = PaintingStyle.fill;
      var path = Path();
      var point1 = pointAt(1);
      var point2 = pointAt(2);
      var point3 = pointAt(3);
      var point4 = pointOrMove(4);
      var point5 = pointOrMove(5);
      var point6 = pointOrMove(6);
      path.addPolygon([point2, point3, point4], true);
      canvas.drawPath(path, fillPaint);

      var kb = calculateSlope(point2, point4);
      double wid = size.width;
      var dashBegin = Offset(0, 0.0 * kb.item1 + kb.item2);
      var dashEnd = Offset(wid, wid * kb.item1 + kb.item2);

      var finalDashBegin = dashBegin;
      var finalDashEnd = dashEnd;
      // 左肩填充
      var cross1 = getIntersection(dashBegin, dashEnd, pointAt(0), point1);
      if (cross1.isFinite) {
        finalDashBegin = cross1;
        var path = Path();
        path.addPolygon([cross1, point1, point2], true);
        canvas.drawPath(path, fillPaint);
      }

      // 右肩填充
      var cross2 = getIntersection(dashBegin, dashEnd, point5, point6);
      if (cross2.isFinite) {
        finalDashEnd = cross2;
        var path = Path();
        path.addPolygon([cross2, point4, point5], true);
        canvas.drawPath(path, fillPaint);
      }
      //画虚线
      canvas.drawDashLine(finalDashBegin, finalDashEnd, dashWidth: 2, spaceWidth: 5, color: paint.color.withAlpha(150));
    }

    _drawControlPoint(canvas, size, points: cachePoints);
  }
}

/// 获取线段交点
Offset getIntersection(Offset p1, Offset p2, Offset p3, Offset p4) {
  var vec1 = vec.Vector2(p1.dx, p1.dy);
  var vec2 = vec.Vector2(p2.dx, p2.dy);
  var vec3 = vec.Vector2(p3.dx, p3.dy);
  var vec4 = vec.Vector2(p4.dx, p4.dy);

  final v1 = vec2 - vec1;
  final v2 = vec4 - vec3;

  final cross = v1.cross(v2);

  if (cross == 0) {
    // 线段平行或共线，无交点
    return Offset.infinite;
  }

  final v3 = vec3 - vec1;
  final t1 = v3.cross(v2) / cross;
  final t2 = v3.cross(v1) / cross;

  if (t1 >= 0 && t1 <= 1 && t2 >= 0 && t2 <= 1) {
    // 两线段相交
    var v = vec1 + v1 * t1;
    return Offset(v.x, v.y);
  }

  return Offset.infinite;
}

class SpeedResistanceComponent extends ShapeComponent {
  SpeedResistanceComponent({required super.dataController, required super.paintId});

  @override
  void _draw(Canvas canvas, Size size, Paint paint) {
    var aPoint = pointAt(0);
    var bPoint = pointOrMove(1);
    var kb = calculateSlope(aPoint, bPoint);
    if (kb.item1 == 0 && kb.item2 == 0) {
      _drawControlPoint(canvas, size);
      return;
    }

    double wid = size.width;
    double a = 0.0 * kb.item1 + kb.item2;
    double b = wid * kb.item1 + kb.item2;

    var divs = [1 / 3, 2 / 3];

    for (var e in divs) {
      var wderict = aPoint.dx > bPoint.dx ? -1 : 1;
      var wX = aPoint.dx + wderict * (aPoint.dx - bPoint.dx).abs() / e;
      var wKb = calculateSlope(aPoint, Offset(wX, bPoint.dy));
      var wA = 0.0 * wKb.item1 + wKb.item2;
      var wB = wid * wKb.item1 + wKb.item2;

      if (aPoint.dx > bPoint.dx) {
        canvas.drawDashLine(Offset(0, wA), aPoint, color: paint.color);
        drawPointsInfo.add([Offset(0, wA), aPoint]);
      } else {
        canvas.drawDashLine(aPoint, Offset(wid, wB), color: paint.color);
        drawPointsInfo.add([aPoint, Offset(wid, wB)]);
      }
    }

    if (aPoint.dx > bPoint.dx) {
      canvas.drawLine(Offset(0, a), aPoint, paint);
      drawPointsInfo.add([Offset(0, a), aPoint]);
    } else {
      canvas.drawLine(aPoint, Offset(wid, b), paint);
      drawPointsInfo.add([aPoint, Offset(wid, b)]);
    }

    _drawControlPoint(canvas, size);
  }
}

class MeasuringLineComponent extends ShapeComponent {
  MeasuringLineComponent({required super.dataController, required super.paintId});

  @override
  void _draw(Canvas canvas, Size size, Paint paint) {
    var startPoint = pointAt(0);
    var endPoint = pointOrMove(1);

    var width = (endPoint.dx - startPoint.dx);
    var finalWidth = width.abs() > 30 ? width : 30;
    if (startPoint.dx > endPoint.dx && width.abs() < 30) {
      finalWidth = finalWidth * -1;
    }

    var textFix = width > 0 ? 0.0 : -40.0;
    canvas.drawLine(startPoint, Offset(startPoint.dx + finalWidth, startPoint.dy), paint);
    drawPointsInfo.add([startPoint, Offset(startPoint.dx + finalWidth, startPoint.dy)]);
    canvas.drawText(pointsInfo[0][1].asFixed(3), startPoint + Offset(textFix, 5), paint.color, 12);

    canvas.drawLine(Offset(startPoint.dx, endPoint.dy), Offset(startPoint.dx + finalWidth, endPoint.dy), paint);
    drawPointsInfo.add([Offset(startPoint.dx, endPoint.dy), Offset(startPoint.dx + finalWidth, endPoint.dy)]);
    canvas.drawText(pointsInfo[1][1].asFixed(3), Offset(startPoint.dx + textFix, endPoint.dy + 5), paint.color, 12);

    var dis = (startPoint.dy - endPoint.dy);
    canvas.drawDashLine(
        Offset(startPoint.dx, endPoint.dy - dis), Offset(startPoint.dx + finalWidth, endPoint.dy - dis));
    // var text1 = infoFromPoint(Offset(startPoint.dx, endPoint.dy - dis))[1].asFixed(3);
    drawPointsInfo
        .add([Offset(startPoint.dx, endPoint.dy - dis), Offset(startPoint.dx + finalWidth, endPoint.dy - dis)]);

    canvas.drawText("100%", Offset(startPoint.dx + textFix, endPoint.dy - dis + 5), paint.color, 12);

    canvas.drawDashLine(
        Offset(startPoint.dx, endPoint.dy - dis * 2), Offset(startPoint.dx + finalWidth, endPoint.dy - dis * 2));
    // var text2 = infoFromPoint(Offset(startPoint.dx, endPoint.dy - dis * 2))[1].asFixed(3);
    drawPointsInfo
        .add([Offset(startPoint.dx, endPoint.dy - dis * 2), Offset(startPoint.dx + finalWidth, endPoint.dy - dis * 2)]);

    canvas.drawText("200%", Offset(startPoint.dx + textFix, endPoint.dy - dis * 2 + 5), paint.color, 12);

    _drawControlPoint(canvas, size);
  }
}

class BoxComponent extends ShapeComponent {
  BoxComponent({required super.dataController, required super.paintId});

  @override
  bool get pointInteger => true;

  @override
  void _draw(Canvas canvas, Size size, Paint paint) {
    var start = pointAt(0);
    var end = pointOrMove(1);
    canvas.drawRect(Rect.fromPoints(start, end), paint);
    var p = Paint()
      ..color = paint.color.withAlpha(50)
      ..style = PaintingStyle.fill;
    canvas.drawRect(Rect.fromPoints(start, end), p);

    var startDate = pointsInfo[0][0].split("@")[0];
    var startIndex = dataController.currentStock.dateIndex.indexOf(startDate);
    startIndex = dataController.currentStock.dateIndex.length - startIndex - 1;
    var endInfo = pointsInfo.length == 2 ? pointsInfo[1][0] : movePointInfo[0];
    var endDate = endInfo.split("@")[0];
    var endIndex = dataController.currentStock.dateIndex.indexOf(endDate);
    endIndex = dataController.currentStock.dateIndex.length - endIndex - 1;

    var minIndex = min(startIndex, endIndex);
    var maxIndex = max(startIndex, endIndex);

    var maxPrice = 0.0;
    var minPrice = double.maxFinite;
    var avgSum = 0.0;
    var amplitudetext = "--";

    for (var i = minIndex; i <= maxIndex; i++) {
      var item = dataController.currentStock.datas[i];
      if (item.high > maxPrice) {
        maxPrice = item.high;
      }
      if (item.low < minPrice) {
        minPrice = item.low;
      }

      avgSum += item.close;
    }

    var preIndex = minIndex - 1;
    var preClose = dataController.currentStock.datas.safeAt(preIndex)?.close;
    if (preClose != null) {
      var amplitude = (maxPrice - minPrice) / preClose * 100;
      amplitudetext = amplitude.toStringAsFixed(2);
    }

    var avg = avgSum / (maxIndex - minIndex + 1);
    var maxY = max(start.dy, end.dy);
    var text =
        "K线数: ${maxIndex - minIndex + 1}  最高价: $maxPrice 最低价: $minPrice 振幅: $amplitudetext%  均价: ${avg.toStringAsFixed(2)}";
    canvas.drawText(text, Offset(start.dx, maxY + 5), paint.color, 14);

    canvas.drawRect(Rect.fromPoints(start, end), paint);
    drawPointsInfo.add([start, Offset(end.dx, start.dy)]);
    drawPointsInfo.add([start, Offset(start.dx, end.dy)]);
    drawPointsInfo.add([end, Offset(end.dx, start.dy)]);
    drawPointsInfo.add([end, Offset(start.dx, end.dy)]);
    _drawControlPoint(canvas, size);
  }
}

class CircumCircleComponent extends ShapeComponent {
  CircumCircleComponent({required super.dataController, required super.paintId});
  @override
  int get maxPoints => 3;

  @override
  void _draw(Canvas canvas, Size size, Paint paint) {
    var aP = pointAt(0);
    var bP = pointOrMove(1);
    var cP = pointOrMove(2);

    if (isPainting || isSelected) {
      canvas.drawLine(aP, bP, paint);
    }

    if (pointsInfo.length >= 2) {
      if (isPainting || isSelected) {
        canvas.drawLine(bP, cP, paint);
        canvas.drawLine(aP, cP, paint);
      }
      Offset center = getCenter();
      final radius = center.distanceTo(aP);
      canvas.drawCircle(center, radius, paint);
    }

    _drawControlPoint(canvas, size);
  }

  getCenter() {
    var aP = pointAt(0);
    var bP = pointOrMove(1);
    var cP = pointOrMove(2);
    final a = bP.dx - aP.dx;
    final b = bP.dy - aP.dy;
    final c = cP.dx - aP.dx;
    final d = cP.dy - aP.dy;
    final e = a * (aP.dx + bP.dx) + b * (aP.dy + bP.dy);
    final f = c * (aP.dx + cP.dx) + d * (aP.dy + cP.dy);
    final g = 2 * (a * (cP.dy - bP.dy) - b * (cP.dx - bP.dx));
    final centerX = (d * e - b * f) / g;
    final centerY = (a * f - c * e) / g;
    return Offset(centerX, centerY);
  }

  @override
  bool isContains(Offset point) {
    Offset center = getCenter();
    var aP = pointAt(0);
    final radius = center.distanceTo(aP);
    var dis = point.distanceTo(center);
    return (dis - radius).abs() < 10;
  }
}

class PriceMarkComponent extends ShapeComponent {
  PriceMarkComponent({required super.dataController, required super.paintId});

  @override
  void _draw(Canvas canvas, Size size, Paint paint) {
    var aPoint = pointAt(0);
    var bPoint = pointOrMove(1);

    canvas.drawDashLine(aPoint, bPoint, color: paint.color.withAlpha(200));
    drawPointsInfo.add([aPoint, bPoint]);
    var priceInfo = pointsInfo[0][1];
    var offset = const Offset(-20, 5);
    if (aPoint.dy > bPoint.dy) {
      offset = const Offset(-20, -25);
    }
    canvas.drawText(priceInfo.asFixed(3), bPoint + offset, paint.color, 14);

    _drawControlPoint(canvas, size);
  }
}

Offset extendLine(Offset pointA, Offset pointB, double distance) {
  double dx = pointB.dx - pointA.dx;
  double dy = pointB.dy - pointA.dy;
  double length = sqrt(dx * dx + dy * dy);
  double extendRatio = distance / length;

  double extendedDx = dx * extendRatio;
  double extendedDy = dy * extendRatio;

  double extendedX = pointB.dx + extendedDx;
  double extendedY = pointB.dy + extendedDy;

  return Offset(extendedX, extendedY);
}

class PencilComponent extends ShapeComponent {
  final points = <Offset>[];

  @override
  int get maxPoints => double.maxFinite.toInt();

  // final List<List<Offset>> oldPaths = [];
  final List<List<List<String>>> historyPoints = [];
  // List<Offset> currentPath = [];
  List<List<String>> currentPoints = [];
  bool _isDrawing = false;
  Offset firstPoint = Offset.infinite;

  PencilComponent({required super.dataController, required super.paintId});

  @override
  void _draw(Canvas canvas, Size size, Paint paint) {
    for (var lists in historyPoints) {
      if (lists.isEmpty) continue;
      final path = Path();
      var firstPoint = pointFromInfo(lists[0]);
      path.moveTo(firstPoint.dx, firstPoint.dy);
      for (int i = 1; i < lists.length; i++) {
        var p = pointFromInfo(lists[i]);
        path.lineTo(p.dx, p.dy);
      }
      canvas.drawPath(path, paint);
    }
    if (currentPoints.isNotEmpty) {
      final path = Path();
      var firstPoint = pointFromInfo(currentPoints[0]);
      path.moveTo(firstPoint.dx, firstPoint.dy);
      for (int i = 1; i < currentPoints.length; i++) {
        var p = pointFromInfo(currentPoints[i]);
        path.lineTo(p.dx, p.dy);
      }
      canvas.drawPath(path, paint);
    }
  }

  @override
  void onMouseUp(Offset point) {
    _isDrawing = false;
    // oldPaths.add(List.from(currentPath));
    historyPoints.add(List.from(currentPoints));
  }

  @override
  void onDragMove(Offset point) {
    isPainting = true;
    if (_isDrawing) {
      // currentPath.add(point);
      currentPoints.add(infoFromPoint(point));
    }
  }

  @override
  void onDragBegin(Offset point) {
    _isPainting = true;
    _isDrawing = true;
    currentPoints.clear();
    var pp = infoFromPoint(point);
    currentPoints.add(pp);
  }
}

class TextComponent extends ShapeComponent {
  TextComponent({required super.dataController, this.background = false, required super.paintId});
  bool _editing = false;
  bool background;
  final TextEditingController _textController = TextEditingController();
  OverlayEntry? _overlayEntry;

  @override
  int get maxPoints => background ? 2 : 1;

  Offset getTextSize() {
    var t = text.isEmpty ? "文字" : text;
    var size = Utils.getTextPainter(t, 16).size;
    double width = size.width < 100 ? 100 : size.width + 20;
    double height = size.height < 36 ? 36 : size.height;

    return Offset(width, height);
  }

  void _showOverlay(Offset start, Offset end) {
    if (dataController.paintManager.context == null) {
      return;
    }

    _editing = true;

    var size = dataController.paintManager.context!.size!;
    var left = start.dx + 50 + MainLeftMenuWidget.currentWidth;
    var top = start.dy + 95 + 5;
    var right = size.width - end.dx - 200;
    var bottom = size.height - end.dy - 30;
    var textColor = background ? boundingBoxPaint.color : boundingBoxPaint.color;
    final overlay = Overlay.of(dataController.paintManager.context!);
    _overlayEntry = OverlayEntry(
      builder: (context) {
        return Material(
          color: Colors.transparent,
          child: GestureDetector(
            behavior: HitTestBehavior.opaque,
            onTap: () {
              text = _textController.text;
              if (text.trim().isEmpty) {
                text = "文字";
              }
              logger.d("2222: $text");
              _hideOverlay();
            },
            child: Container(
              // color: Colors.amberAccent.withAlpha(40),
              padding: EdgeInsets.fromLTRB(left, top, 0, bottom),
              child: Container(
                // decoration: BoxDecoration(borderRadius: BorderRadius.circular(5)),
                padding: const EdgeInsets.only(left: 10, right: 5),
                child: TextField(
                  controller: _textController,
                  autofocus: true,
                  cursorColor: textColor,
                  style: TextStyle(
                    color: textColor,
                    wordSpacing: -1,
                    letterSpacing: 0,
                  ),
                  decoration: InputDecoration(
                    hintText: "文字",
                    border: InputBorder.none,
                    hintStyle: TextStyle(color: textColor),
                  ),
                  maxLines: 1,
                  onChanged: (value) {
                    text = value;
                    dataController.refreshCanvas();
                  },
                ),
              ),
            ),
          ),
        );
      },
    );
    overlay.insert(_overlayEntry!);
  }

  void _hideOverlay() {
    _editing = false;
    _overlayEntry?.remove();
    _overlayEntry = null;
  }

  @override
  void onDoubleClick(ui.Offset point) {
    if (isSelected) {
      _textController.text = text;
      var textSize = getTextSize();
      if (background == false && pointsInfo.length == 1) {
        var a = pointAt(0);

        _showOverlay(a, a + textSize);
      } else if (background && pointsInfo.length == 2) {
        var b = pointOrMove(1);
        _showOverlay(b, b + textSize);
      }
    }
  }

  @override
  void _onMouseDown(Offset point) {
    super._onMouseDown(point);

    if (text.isEmpty && _isPainting == false) {
      text = "文字";
      var textSize = getTextSize();
      var a = point;
      if (background == false && pointsInfo.length == 1) {
        a = pointAt(0);
      } else {
        a = pointAt(1);
      }
      _showOverlay(a, a + textSize);
    }
  }

  @override
  void onMouseUp(Offset point) {
    super.onMouseUp(point);
    if (text.isEmpty && _isPainting == false) {
      text = "文字";
      var textSize = getTextSize();
      var a = pointAt(1);

      _showOverlay(a, a + textSize);
    }
  }

  @override
  void _draw(Canvas canvas, Size size, Paint paint) {
    var start = pointAt(0);
    var textSize = getTextSize();
    var bPoint = pointOrMove(1);
    var textEnd = start + textSize;

    if (background) {
      var p = Path();
      textEnd = bPoint + textSize;
      var bgPaint = Paint()
        ..style = PaintingStyle.fill
        // ..blendMode = BlendMode.srcATop
        ..color = boundingBoxPaint.color.withAlpha(150);
      p.addRRect(RRect.fromRectAndRadius(Rect.fromPoints(bPoint, textEnd), const Radius.circular(4)));

      // canvas.drawRRect(RRect.fromRectAndRadius(Rect.fromPoints(bPoint, textEnd), const Radius.circular(4)), bgPaint);

      // var p = Path();
      var archX = double.infinity;
      var archY = double.infinity;
      if (start.dx < bPoint.dx) {
        archX = bPoint.dx;
      } else if (start.dx > bPoint.dx && start.dx < bPoint.dx + textSize.dx) {
        archX = bPoint.dx + textSize.dx / 2 - 10;
      } else if (start.dx > bPoint.dx) {
        archX = bPoint.dx + textSize.dx - 20;
      }

      if (start.dy < bPoint.dy) {
        archY = bPoint.dy;
      } else if (start.dy > bPoint.dy && start.dy < bPoint.dy + textSize.dy) {
        archY = bPoint.dy + textSize.dy / 2 - 5;
      } else {
        archY = bPoint.dy + textSize.dy;
      }

      p.moveTo(start.dx, start.dy);

      if (start.dy > bPoint.dy + textSize.dy) {
        p.lineTo(archX, archY - 2);
        p.lineTo(archX + 20, archY - 2);
        drawPointsInfo.add([Offset(start.dx, start.dy), Offset(archX, archY - 2)]);
        drawPointsInfo.add([Offset(start.dx, start.dy), Offset(archX + 20, archY - 2)]);
      } else {
        p.lineTo(archX + 20, archY + 10);
        p.lineTo(archX, archY + 2);
        drawPointsInfo.add([Offset(start.dx, start.dy), Offset(archX, archY + 2)]);
        drawPointsInfo.add([Offset(start.dx, start.dy), Offset(archX + 20, archY + 10)]);
      }
      p.close();
      canvas.drawPath(p, bgPaint);
    } else {
      if (isSelected || isPainting || _editing) {
        var rrect = RRect.fromRectAndRadius(Rect.fromPoints(start, textEnd), const Radius.circular(4));
        canvas.drawRRect(rrect, paint);
      }
    }

    if (_editing == false) {
      final paragraphBuilder = ui.ParagraphBuilder(ui.ParagraphStyle(textAlign: TextAlign.left, fontSize: 16));
      paragraphBuilder.pushStyle(ui.TextStyle(color: background ? paint.color : paint.color));
      paragraphBuilder.addText(text);

      final paragraph = paragraphBuilder.build();
      var point = background ? bPoint : start;
      paragraph.layout(ui.ParagraphConstraints(width: (textEnd.dx - point.dx).abs() + 10)); // 指定宽度限制

      canvas.drawParagraph(paragraph, point + const Offset(9, 5));
    }

    _drawControlPoint(canvas, size);
  }

  @override
  bool isContains(Offset point) {
    var textSize = getTextSize();
    var start = background ? pointAt(1) : pointAt(0);
    var textEnd = start + textSize;
    if (Rect.fromPoints(start, textEnd).contains(point)) {
      return true;
    }
    return super.isContains(point);
  }
}
