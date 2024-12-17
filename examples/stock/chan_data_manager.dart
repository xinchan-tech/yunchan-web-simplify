import 'dart:convert';
import 'dart:ffi';
import 'dart:io';
import 'package:ffi/ffi.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:mgjkn/Util/utils.dart';
import 'package:mgjkn/debug.dart';
import 'package:mgjkn/desktop/jk_style.dart';
import 'package:mgjkn/desktop/logger.dart';
import 'package:mgjkn/desktop/stock/kchart/entity/k_line_entity.dart';
import 'package:mgjkn/desktop/stock/kchart/indicator/indicator_menu.dart';
import 'package:mgjkn/desktop/stock/kchart/renderer/base_chart_renderer.dart';
import 'package:mgjkn/desktop/stock/kchart/renderer/main_chart_renderer.dart';
import 'package:mgjkn/desktop/stock/kchart/state_enum.dart';
import 'package:mgjkn/desktop/stock/stock_data_manager.dart';
import 'package:mgjkn/extensions/extension_widget.dart';
import 'package:mgjkn/notification.dart';
import 'package:tuple/tuple.dart';

class CalculateHelp {
  int lastPointIdx = 0;
  double lastPointVol = 0;
  int nextPointIdx = 0;
  double nextPointVol = 0;
  double k = 0.0;
  double b = 0.0;
  bool isDashLine;
  int hitCount = 0;
  int totalCount;

  CalculateHelp(this.isDashLine, this.totalCount);
}

typedef CoilingCalculateFunction = Pointer<CoilingData> Function(
  Pointer<Candlestick> candlesticks,
  Int32 numCandlesticks,
  Int32 interval,
  Pointer<Utf8> latestCoiling,
  Pointer<Utf8> lastCoiling,
);
typedef CoilingCalculate = Pointer<CoilingData> Function(
    Pointer<Candlestick> candlesticks, // k线数据
    int numCandlesticks, //k线数据个数
    int interval, //周期数
    Pointer<Utf8> latestCoiling, //实时推送的数据的数据, 调用后可能被修改,保存下来给lastCoiling
    Pointer<Utf8> lastCoiling // 传入执行后的 latestCoiling
    );

final class Candlestick extends Struct {
  external Pointer<Utf8> time;

  @Double()
  external double close;

  @Double()
  external double high;

  @Double()
  external double low;

  @Double()
  external double open;

  @Double()
  external double preClose;

  @Double()
  external double volume;

  @Double()
  external double amount;
}

final class EndPoint extends Struct {
  @Int32()
  external int index;
  external Pointer<Utf8> time;

  @Double()
  external double price;
}

final class Pivot extends Struct {
  external Pointer<Utf8> start;
  external Pointer<Utf8> end;

  @Double()
  external double bottom;

  @Double()
  external double top;

  @Int32()
  external int segmentNum;

  @Int32()
  external int direction;

  @Int32()
  external int positive;

  @Int8()
  external int mark;
}

final class SalePoint extends Struct {
  external Pointer<Utf8> time;

  @Double()
  external double price;

  @Bool()
  external bool isLarge;

  @Bool()
  external bool isBuy;

  @Int32()
  external int positive;
}

final class Extand extends Struct {
  external Pointer<Utf8> start;
  external Pointer<Utf8> end;

  @Double()
  external double bottom;

  @Double()
  external double top;

  @Int32()
  external int direction;

  @Int32()
  external int level;
}

final class CoilingData extends Struct {
  @Int32()
  external int numPoints;
  external Pointer<EndPoint> points;

  @Int32()
  external int status;

  @Int32()
  external int numPivots;
  external Pointer<Pivot> pivots;

  @Int32()
  external int numExtands;
  external Pointer<Extand> extands;

  @Int32()
  external int numSale1Points;
  external Pointer<SalePoint> sale1Points;

  @Int32()
  external int numSale2Points;
  external Pointer<SalePoint> sale2Points;

  @Int32()
  external int numSale3Points;
  external Pointer<SalePoint> sale3Points;

  @Int32()
  external int numHdlys;
  external Pointer<Double> hdlys;

  @Int32()
  external int numMonthLines;
  external Pointer<Double> monthLines;

  @Int32()
  external int numHorizons;
  external Pointer<Double> horizons;

  external Pointer<Utf8> coiling_str;

  @Int8()
  external int error;

  external Pointer<Utf8> msg;
}

class ChanDataEntity {
  String time = "";
  double hdlyVol = 0;
  String hdlyLable = "";
  double horizonVol = 0;
  double monthLineVol = 0;

  List<dynamic> penSale1 = [];
  List<dynamic> penSale2 = [];
  List<dynamic> penSale3 = [];
  // List<dynamic>? insideSale1;
  // List<dynamic>? insideSale2;
  // List<dynamic>? insideSale3;
  // List<dynamic>? segmentSale1;
  // List<dynamic>? segmentSale3;

  double penLineValue = 0;
  double penDashValue = 0;
  double segmentLineValue = 0;
  double segmentDashValue = 0;
}

enum ChanDataIndicator {
  pen,
  class1,
  class2,
  class3,
  pivot,
  pivotPrice,
  pivotSection,
  reversal,
  showOverlap,
  shortLine,
  mainTrend,
  buySalePoint, //买卖点位
  bottomSignal, // 底部信号
}

extension ChanDataIndicatorExt on ChanDataIndicator {
  (String name, IndicatorItem indicator) get info {
    switch (this) {
      case ChanDataIndicator.pen:
        return ("笔", IndicatorItem(name: "笔", id: "1", dbType: "local"));
      case ChanDataIndicator.pivot:
        return ("中枢", IndicatorItem(name: "中枢", id: "2", dbType: "local"));
      case ChanDataIndicator.class1:
        return ("1类", IndicatorItem(name: "1类", id: "227", dbType: "local"));
      case ChanDataIndicator.class2:
        return ("2类", IndicatorItem(name: "2类", id: "228", dbType: "local"));
      case ChanDataIndicator.class3:
        return ("3类", IndicatorItem(name: "3类", id: "229", dbType: "local"));
      case ChanDataIndicator.pivotPrice:
        return ("中枢价格", IndicatorItem(name: "中枢价格", id: "230", dbType: "local"));
      case ChanDataIndicator.pivotSection:
        return ("中枢段数", IndicatorItem(name: "中枢段数", id: "231", dbType: "local"));
      case ChanDataIndicator.reversal:
        return ("反转点", IndicatorItem(name: "反转点", id: "232", dbType: "local"));
      case ChanDataIndicator.showOverlap:
        return ("显示重叠", IndicatorItem(name: "显示重叠", id: "233", dbType: "local"));
      case ChanDataIndicator.shortLine:
        return ("短线王", IndicatorItem(name: "短线王", id: "234", dbType: "local"));
      case ChanDataIndicator.mainTrend:
        return ("主力趋势", IndicatorItem(name: "主力趋势", id: "235", dbType: "local"));
      case ChanDataIndicator.buySalePoint:
        return ("买卖点位", IndicatorItem(name: "买卖点位", id: "10", dbType: "local"));
      case ChanDataIndicator.bottomSignal:
        return ("底部信号", IndicatorItem(name: "底部信号", id: "9", dbType: "local"));
    }
  }
}

/// 用于管理绘制缠论指标
class ChanDataManager {
  // 实心矩形中枢
  List<dynamic> get penInfoAll => _penInfoAll;
  set penInfoAll(List<dynamic> value) {
    _penInfoAll = value;
    penInfoStarts.clear();
    penInfoEnds.clear();
    for (var item in value) {
      penInfoStarts.add(item[0]);
      penInfoEnds.add(item[1]);
    }
  }

  List<dynamic> _penInfoAll = [];
  List<String> penInfoStarts = [];
  List<String> penInfoEnds = [];

  // 虚线矩形中枢
  List<dynamic> get extands => _extands;
  set extands(List<dynamic> value) {
    _extands = value;
    extandsStarts.clear();
    extandsEnds.clear();
    for (var item in value) {
      extandsStarts.add(item[0]);
      extandsEnds.add(item[1]);
    }
  }

  List<dynamic> _extands = [];
  List<String> extandsStarts = [];
  List<String> extandsEnds = [];

  List<List<dynamic>> penPoins = [];
  // int penStatus = -1;
  bool isLastPenDash = false;

  var hdlys = [];

  bool isPassCheck = false;
  DynamicLibrary? dylib;
  String lastCoilingData = "";

  prepare() async {
    if (dylib == null) {
      // logger.d("1.0  ${DateTime.now().millisecondsSinceEpoch}");
      // 加载动态库
      var filename = Platform.isWindows ? "coiling.dll" : "libcoiling.dylib";
      var path = await CacheManager.desktopBasePath;
      var libPath = "$path/$filename";
      if (isPassCheck == false) {
        var pp = await rootBundle.load("assets/dll/$filename");

        var originBytes = pp.buffer.asUint8List();
        if (File(libPath).existsSync()) {
          // logger.d("1.2222  ${DateTime.now().millisecondsSinceEpoch}");
          // 读取目标文件数据
          Uint8List destBytes = await File(libPath).readAsBytes();
          if (listEquals(originBytes, destBytes) == false) {
            File(libPath).writeAsBytesSync(originBytes, flush: true);
            // logger.d("1.22333333 ${DateTime.now().millisecondsSinceEpoch}");
          }
        } else {
          // logger.d("1.3333 ${DateTime.now().millisecondsSinceEpoch}");
          File(libPath).writeAsBytesSync(originBytes);
        }
        isPassCheck = true;
      }
      // logger.d("1.44444  ${DateTime.now().millisecondsSinceEpoch}");
      dylib ??= DynamicLibrary.open(libPath);
      logger.d("1.5555  ${DateTime.now().millisecondsSinceEpoch}");
    }
  }

  // Candlestick entityToRef(KLineEntity entity) {
  //   var candlestick = calloc<Candlestick>();
  //   candlestick.ref.time = entity.date.toNativeUtf8();
  //   candlestick.ref.open = entity.open.toDouble();
  //   candlestick.ref.close = entity.close.toDouble();
  //   candlestick.ref.high = entity.high.toDouble();
  //   candlestick.ref.low = entity.low.toDouble();
  //   return candlestick.ref;
  // }

  Future<Map> calculateData(
      {List<KLineEntity> dataList = const [],
      required Map keyData,
      required JKStockTimeType stockTime,
      String debugkey = ""}) async {
    if (keyData.isEmpty || keyData.length < 3) return Future.value({});

    var keyDataString = jsonEncode(keyData);

    await prepare();

    // 绑定 C 函数
    final CoilingCalculate coilingCalculate =
        dylib!.lookupFunction<CoilingCalculateFunction, CoilingCalculate>('coiling_calculate');

    List<KLineEntity> calculateList = [];
    if (stockTime.isTickTime) {
      List<KLineEntity> tickData = [];
      for (var item in dataList) {
        if (item.close > 0) tickData.add(item);
      }
      calculateList = tickData;
    } else {
      calculateList = dataList;
    }

    Pointer<Candlestick> kLinesPointer = calloc<Candlestick>(calculateList.length);
    for (int i = 0; i < calculateList.length; i++) {
      var e = calculateList[i];
      Pointer<Candlestick> candlestick = calloc<Candlestick>();
      var t = e.date.toNativeUtf8();
      candlestick.ref.time = t;
      candlestick.ref.open = e.open.toDouble();
      candlestick.ref.close = e.close.toDouble();
      candlestick.ref.high = e.high.toDouble();
      candlestick.ref.low = e.low.toDouble();
      kLinesPointer[i] = candlestick.ref;
      calloc.free(candlestick);
    }

    int interval = stockTime.rawValue.item1;
    var latestDataP = keyDataString.toNativeUtf8();
    var lastDataP = lastCoilingData.toNativeUtf8();
    final coilingDataPointer = coilingCalculate(kLinesPointer, calculateList.length, interval, latestDataP, lastDataP);
    calloc.free(latestDataP);
    calloc.free(lastDataP);
    calloc.free(kLinesPointer);

    // 获取结构体的成员
    final coilingData = coilingDataPointer.ref;
    lastCoilingData = coilingData.coiling_str.toDartString();
    var hdlyLines = List<double>.generate(coilingData.numHdlys, (index) => coilingData.hdlys[index]);
    var monthLines = List<double>.generate(coilingData.numMonthLines, (index) => coilingData.monthLines[index]);
    var horizonLines = List<double>.generate(coilingData.numHorizons, (index) => coilingData.horizons[index]);

    Map<String, List<dynamic>> sale1PointsMap = {};
    for (int i = 0; i < coilingData.numSale1Points; i++) {
      var item = coilingData.sale1Points[i];
      var date = item.time.toDartString();
      sale1PointsMap[date] = [date, item.price, item.isLarge, item.isBuy, item.positive];
    }

    Map<String, List<dynamic>> sale2PointsMap = {};
    for (int i = 0; i < coilingData.numSale2Points; i++) {
      var item = coilingData.sale2Points[i];
      var date = item.time.toDartString();
      sale2PointsMap[date] = [date, item.price, item.isLarge, item.isBuy, item.positive];
    }

    Map<String, List<dynamic>> sale3PointsMap = {};
    for (int i = 0; i < coilingData.numSale3Points; i++) {
      var item = coilingData.sale3Points[i];
      var date = item.time.toDartString();
      sale3PointsMap[date] = [date, item.price, item.isLarge, item.isBuy, item.positive];
    }

    var pivots = List<dynamic>.generate(coilingData.numPivots, (index) {
      var item = coilingData.pivots[index];
      return [
        item.start.toDartString(),
        item.end.toDartString(),
        item.bottom,
        item.top,
        item.segmentNum,
        item.direction,
        item.mark
      ];
    });

    var extands = List<dynamic>.generate(coilingData.numExtands, (index) {
      var item = coilingData.extands[index];
      return [item.start.toDartString(), item.end.toDartString(), item.bottom, item.top, item.direction, item.level];
    });

    var points = List<List<dynamic>>.generate(coilingData.numPoints, (index) {
      var item = coilingData.points[index];
      return [item.index, item.time.toDartString(), item.price];
    });

    penInfoAll = pivots;
    this.extands = extands;
    isLastPenDash = (coilingData.status == 0);
    penPoins = points;

    var isError = coilingData.error == 1;

    if (isError && Utils.isDebug) {
      var errorMessage = coilingData.msg.toDartString();
      logger.d("$debugkey   Error: $isError, $errorMessage");
      NotificationCenter.shared.post(NotificationItem("缠论检测", errorMessage), merge: true);
    }

    // logger.d(
    //     "xxx 笔 ${penPoins.length} 状态:$penStatus last:${penPoins.safeAt(penPoins.length - 1)}  0: ${penPoins.safeAt(0)} ");
    // logger.d(
    //     "xxx hdly ${monthLines.length} last:${monthLines.safeAt(monthLines.length - 1)}  0: ${monthLines.safeAt(0)}");
    // logger.d("xxx extands ${extands.length} last:${extands.safeAt(extands.length - 1)}  0: ${extands.safeAt(0)}");

    // 释放内存
    dylib!.lookupFunction<Void Function(Pointer<CoilingData>), void Function(Pointer<CoilingData>)>(
        'coiling_free_data')(coilingDataPointer);

    return {
      'hdlyLines': hdlyLines,
      'monthLines': monthLines,
      'horizonLines': horizonLines,
      'sale1Points': sale1PointsMap,
      'sale2Points': sale2PointsMap,
      'sale3Points': sale3PointsMap,
    };
  }

  List<ChanDataEntity> chanDataEntityList = [];
  generateData(List<KLineEntity> allData, JKStockTimeType time, Map<String, dynamic> coilingData,
      {String debugStr = ""}) async {
    List<ChanDataEntity> allChanData = [];
    var useChan = Debug.enableChan == 1 && coilingData.isNotEmpty;
    if (useChan) {
      var val = 0.0;
      var pos = 0;
      var chanData = await calculateData(dataList: allData, keyData: coilingData, stockTime: time, debugkey: debugStr);
      if (chanData.isEmpty) return;
      var penCalculate = CalculateHelp(isLastPenDash, penPoins.length);

      Tuple2<double, double> handlePenLine(int idx, KLineEntity model, List<List<dynamic>> datas, CalculateHelp helps) {
        double lineVol = 0.0;
        double dashVol = 0.0;
        int penIdx = idx;
        if (datas.isNotEmpty && datas.first.length == 3 && penIdx == datas.first.first) {
          helps.hitCount += 1;
          double v = datas.first.last;
          if (helps.hitCount >= penCalculate.totalCount - 1 && helps.isDashLine) {
            dashVol = v;
            lineVol = v;
            // helps.isDashLine = false;
          } else {
            lineVol = v;
          }
          helps.lastPointIdx = penIdx;
          helps.lastPointVol = v;
          datas.removeAt(0);
          // 设置下个点位
          if (datas.isNotEmpty && datas.first.length == 3) {
            var nextIndex = datas.first.first;
            var nextModel = allData.safeAt(nextIndex.toInt());
            if (nextModel != null) {
              var nextPenValue = datas.first.last;
              helps.nextPointIdx = idx;
              helps.nextPointVol = nextPenValue.toDouble();

              helps.k = (nextPenValue - v) / (nextIndex - penIdx).toDouble();
              helps.b = v - helps.k * penIdx.toDouble();
            } else {
              helps.nextPointIdx = 0;
              helps.nextPointVol = 0;
              helps.k = 0;
              helps.b = 0;
            }
          } else {
            helps.nextPointIdx = 0;
            helps.nextPointVol = 0;
            helps.k = 0;
            helps.b = 0;
          }
        } else {
          if (helps.lastPointVol > 0 && helps.nextPointVol > 0) {
            double v = helps.k * idx.toDouble() + helps.b;
            if (helps.hitCount >= penCalculate.totalCount - 1 && helps.isDashLine) {
              dashVol = v;
            } else {
              lineVol = v;
            }
          }
        }
        return Tuple2<double, double>(lineVol, dashVol);
      }

      for (int idx = 0; idx < allData.length; idx++) {
        var model = allData[idx];
        var chanEntity = ChanDataEntity();
        allChanData.add(chanEntity);
        chanEntity.time = model.date;
        var hdlyVol = (chanData["hdlyLines"] as List).safeAt(idx) ?? -1;
        chanEntity.hdlyVol = hdlyVol < 0 ? 0 : hdlyVol;
        if (chanEntity.hdlyVol >= val) {
          val = chanEntity.hdlyVol;
          pos = idx;
        }
        if (val > 0 && (chanEntity.hdlyVol <= 0 || idx == allData.length - 1)) {
          var str = "历史大底";
          var hdlyValue = allChanData.safeAt(pos)?.hdlyVol;
          if (hdlyValue != null) {
            if (hdlyValue < 30) {
              str = "小底";
            } else if (hdlyValue < 60) {
              str = "中底";
            } else if (hdlyValue < 90) {
              str = "大底";
            } else if (hdlyValue < 150) {
              str = "超大底";
            }

            allChanData[pos].hdlyLable = str;
            val = 0;
          }
        }

        var horizonLinesVol = (chanData["horizonLines"] as List).safeAt(idx) ?? -1;
        chanEntity.horizonVol = horizonLinesVol < 0 ? 0 : horizonLinesVol;
        var monthLinesVol = (chanData["monthLines"] as List).safeAt(idx) ?? -1;
        chanEntity.monthLineVol = monthLinesVol < 0 ? 0 : monthLinesVol;
        chanEntity.penSale1 = chanData["sale1Points"][model.date] ?? [];
        chanEntity.penSale2 = chanData["sale2Points"][model.date] ?? [];
        chanEntity.penSale3 = chanData["sale3Points"][model.date] ?? [];

        // 笔
        Tuple2<double, double> penLineValues = handlePenLine(idx, model, penPoins, penCalculate);
        chanEntity.penLineValue = penLineValues.item1;
        chanEntity.penDashValue = penLineValues.item2;
      }
    }
    chanDataEntityList = allChanData.reversed.toList();
  }

  // 画3类买点
  void drawBuySalePoint(Canvas canvas, MainChartRenderer render, KLineEntity point, double curX, List<dynamic> info,
      String type, double contentPaddingLeft,
      {bool plus = false, bool showReversal = false}) {
    double circleDy = 0.0;
    bool isBuy = info[3];
    bool isLarge = info[2];
    double positive = info[4].toDouble();
    double dashLineY = 0.0;
    String text = "";

    Color textBgColor = Colors.white;

    var debugTag = "";
    if (isBuy) {
      circleDy = 40.0;
      dashLineY = render.getY(point.low);
      text = "$type买";
      textBgColor = isLarge ? JKStyle.largeBuyColor : JKStyle.normalBuyColor;
      if (positive == -1) {
        if (showReversal) {
          debugTag = "↑";
        }
        if (plus) {
          debugTag = "↑＋";
        }
      }
    } else {
      circleDy = -40.0;
      dashLineY = render.getY(point.high);
      text = "$type卖";
      textBgColor = isLarge ? JKStyle.largeSaleColor : JKStyle.normalSaleColor;
      if (positive == -1) {
        if (showReversal) {
          debugTag = "↓";
        }
        if (plus) {
          debugTag = "↓＋";
        }
      }
    }

    double y = render.getY(info[1]) + circleDy;
    canvas.save();

    var x = render.chartRect.width + contentPaddingLeft - curX - render.dataController.candleWidth / 2;
    canvas.drawDashLine(Offset(x, dashLineY), Offset(x, dashLineY), color: textBgColor);
    canvas.drawDashLine(Offset(x, y), Offset(x, dashLineY), color: textBgColor);

    // final paintsd = Paint()
    //   ..color = Colors.yellow
    //   ..strokeWidth = 2.0
    //   ..style = PaintingStyle.fill;

    // final arrowSize = 50.0;
    // final arrowHeight = arrowSize * 0.8;
    // final arrowWidth = arrowSize * 0.4;

    // // 箭头的中心点
    // final center = Offset(x / 2, y / 2);

    // // 绘制箭头
    // final path = Path()
    //   ..moveTo(center.dx - arrowWidth, center.dy + arrowHeight / 2)
    //   ..lineTo(center.dx, center.dy - arrowHeight / 2)
    //   ..lineTo(center.dx + arrowWidth, center.dy + arrowHeight / 2)
    //   ..lineTo(center.dx, center.dy + arrowHeight)
    //   ..close();

    // canvas.drawPath(path, paintsd);

    canvas.restore();

    // 绘制 DEBUG tag
    if (debugTag.isNotEmpty) {
      canvas.drawText(debugTag, Offset(x + 20, y - 20), textBgColor, 28);
    }

    // 绘制红色圆形
    double radius = 15;
    Rect circleRect = Rect.fromCenter(center: Offset(x, y), width: 34, height: 34);
    canvas.save();
    Paint paint = Paint();
    paint.color = textBgColor;

    canvas.drawCircle(circleRect.center, radius, paint);
    canvas.restore();

    // 绘制白色数字
    TextStyle textStyle = const TextStyle(fontSize: 16, color: Colors.white);
    TextSpan textSpan = TextSpan(text: text, style: textStyle);
    TextPainter textPainter = TextPainter(text: textSpan, textDirection: TextDirection.ltr);
    textPainter.layout();

    double textX = circleRect.center.dx - textPainter.width / 2;
    double textY = circleRect.center.dy - textPainter.height / 2;

    textPainter.paint(canvas, Offset(textX, textY));

    // var img = ScriptPainter.icons["47"]!;
    // var paint33 = Paint();
    // var imageWidth = 14.0;
    // final src = Rect.fromLTWH(0, 0, img.width.toDouble(), img.height.toDouble());
    // final dst = Rect.fromLTWH(x, y + 2, imageWidth, imageWidth);
    // canvas.drawImageRect(img, src, dst, paint33);
  }

  // 海底捞月柱状图
  static void drawHDLYChart(Canvas canvas, ChanDataEntity? lastPoint, ChanDataEntity curPoint, double curX, double top,
      Rect chartRect, double candleWidth,
      {double offsetY = 0}) {
    if (curPoint.hdlyVol != 0) {
      // double top = getY(curPoint.hdlyVol);
      List<Color> colors = [
        const Color.fromARGB(255, 255, 0, 102),
        const Color.fromARGB(255, 255, 150, 186),
        const Color.fromARGB(255, 255, 0, 102)
      ];
      final gradient = LinearGradient(colors: colors);

      var right = chartRect.width - curX;
      var left = right - candleWidth * 1.5;
      var bottom = chartRect.bottom;
      var rect = Rect.fromLTRB(left, top + offsetY, right, bottom + offsetY);
      final paint = Paint()..shader = gradient.createShader(rect);
      canvas.drawRect(rect, paint);

      if (curPoint.hdlyLable.isNotEmpty) {
        TextPainter tp = TextPainter(
          text: TextSpan(text: curPoint.hdlyLable, style: TextStyle(color: JKStyle.theme.white, fontSize: 12)),
          textDirection: TextDirection.ltr,
        );
        tp.layout();

        var paint = Paint()
          ..color = const Color.fromARGB(255, 255, 0, 102)
          ..isAntiAlias = true;

        var w = tp.width + 5 * 2;

        var left = (right - candleWidth) - w / 2 + candleWidth / 2;
        var offset = Offset(left + 5, top - 18 + offsetY);
        canvas.drawRRect(
            RRect.fromRectAndRadius(Rect.fromLTWH(left, offset.dy - 8, w, tp.height + 4), const Radius.circular(4)),
            paint);
        tp.paint(canvas, offset + const Offset(0, -6));
      }
    }
  }

  // 海底捞月柱状图
  static void drawHDLYChart2(Canvas canvas, ChanDataEntity? lastPoint, ChanDataEntity curPoint, double curX,
      Function(double) getY, Rect chartRect, double candleWidth) {
    if (curPoint.hdlyVol != 0) {
      List<Color> colors = [
        const Color.fromARGB(255, 255, 0, 102),
        const Color.fromARGB(255, 255, 150, 186),
        const Color.fromARGB(255, 255, 0, 102)
      ];
      final gradient = LinearGradient(colors: colors);

      var right = chartRect.width - curX;
      var left = right - candleWidth * 1.5;
      var bottom = chartRect.bottom;

      _draw(Color color, Rect rect) {
        // final paint = Paint()..shader = gradient.createShader(rect);
        final paint = Paint()..color = color;
        canvas.drawRect(rect, paint);
      }

      const t = 1;
      if (curPoint.hdlyVol > 150 * t) {
        var rect = Rect.fromLTRB(left, getY.call(curPoint.hdlyVol), right, bottom);
        _draw(Colors.purple, rect);
        var rect1 = Rect.fromLTRB(left, getY.call(150.0 * t), right, bottom);
        _draw(Colors.blue, rect1);
        var rect2 = Rect.fromLTRB(left, getY.call(90.0 * t), right, bottom);
        _draw(Colors.yellow, rect2);
        var rect3 = Rect.fromLTRB(left, getY.call(60.0 * t), right, bottom);
        _draw(Colors.green, rect3);
        var rect4 = Rect.fromLTRB(left, getY.call(30.0 * t), right, bottom);
        _draw(Colors.white, rect4);
      } else if (curPoint.hdlyVol > 90 * t) {
        var rect1 = Rect.fromLTRB(left, getY.call(curPoint.hdlyVol), right, bottom);
        _draw(Colors.blue, rect1);
        var rect2 = Rect.fromLTRB(left, getY.call(90.0 * t), right, bottom);
        _draw(Colors.yellow, rect2);
        var rect3 = Rect.fromLTRB(left, getY.call(60.0 * t), right, bottom);
        _draw(Colors.green, rect3);
        var rect4 = Rect.fromLTRB(left, getY.call(30.0 * t), right, bottom);
        _draw(Colors.white, rect4);
      } else if (curPoint.hdlyVol > 60 * t) {
        var rect = Rect.fromLTRB(left, getY.call(curPoint.hdlyVol), right, bottom);
        _draw(Colors.yellow, rect);
        var rect1 = Rect.fromLTRB(left, getY.call(60.0 * t), right, bottom);
        _draw(Colors.green, rect1);
        var rect2 = Rect.fromLTRB(left, getY.call(30.0 * t), right, bottom);
        _draw(Colors.white, rect2);
      } else if (curPoint.hdlyVol > 30 * t) {
        var rect = Rect.fromLTRB(left, getY.call(curPoint.hdlyVol), right, bottom);
        _draw(Colors.green, rect);
        var rect2 = Rect.fromLTRB(left, getY.call(30.0 * t), right, bottom);
        _draw(Colors.white, rect2);
      } else {
        var rect = Rect.fromLTRB(left, getY.call(curPoint.hdlyVol), right, bottom);
        _draw(Colors.white, rect);
      }

      if (curPoint.hdlyLable.isNotEmpty) {
        TextPainter tp = TextPainter(
          text: TextSpan(text: curPoint.hdlyLable, style: TextStyle(color: JKStyle.theme.white, fontSize: 12)),
          textDirection: TextDirection.ltr,
        );
        tp.layout();

        var paint = Paint()
          ..color = const Color.fromARGB(255, 255, 0, 102)
          ..isAntiAlias = true;

        var w = tp.width + 5 * 2;

        var l = (right - candleWidth * 1.5) - w / 2 + 4;
        var offset = Offset(l + 5, getY.call(curPoint.hdlyVol) - 18);
        canvas.drawRRect(
            RRect.fromRectAndRadius(Rect.fromLTWH(l, offset.dy - 8, w, tp.height + 4), const Radius.circular(4)),
            paint);
        tp.paint(canvas, offset + const Offset(0, -6));
      }
    }
  }
}
