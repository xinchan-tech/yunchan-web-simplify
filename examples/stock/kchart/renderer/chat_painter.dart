import 'dart:math';
import 'dart:async' show StreamSink;
import 'package:flutter/material.dart';
import 'package:mgjkn/desktop/script_community/editor/script_painter.dart';
import 'package:mgjkn/desktop/settings_widget.dart';
import 'package:mgjkn/desktop/jk_style.dart';
import 'package:mgjkn/desktop/stock/backtest/backtest_menu.dart';
import 'package:mgjkn/desktop/stock/chan_data_manager.dart';
import 'package:mgjkn/desktop/stock/kchart/indicator/indicator_menu.dart';
import 'package:mgjkn/desktop/stock/kchart/kline_data_controller.dart';
import 'package:mgjkn/desktop/stock/kchart/kline_manager.dart';
import 'package:mgjkn/desktop/stock/kchart/renderer/base_chart_renderer.dart';
import 'package:mgjkn/desktop/stock/kchart/state_enum.dart';
import 'package:mgjkn/extensions/extension_widget.dart';
import '../chart_style.dart';
import '../entity/k_line_entity.dart';
import 'package:mgjkn/desktop/stock/kchart/renderer/main_chart_renderer.dart';
import 'secondary_chart_render.dart';
import '../utils/date_format_util.dart';
import '../utils/number_util.dart';
import '../entity/info_window_entity.dart';
import 'dart:ui' as ui;

class ChartPainter extends CustomPainter {
  List<KLineEntity> datas = [];

  double startX = 0;

  double scaleX = 1.0;

  bool isLongPress = true;
  bool isVscroll = false;

  double? lastCandleWidth;
  double sliderWidth = 0.0;
  Offset selectPoint;
  Offset scalePoint;
  late StreamSink<InfoWindowEntity> sink;

  bool isTickChart = false;
  bool isTick5Chart = false;
  bool isTickPreChart = false;
  bool isTickAftChart = false;

  late JKMainLineType mainLineType;
  late Set<IndicatorItem> mainIndicators;
  Map indicatorChartMap = {};
  // late IndicatorItem secondaryIndicator;
  // late IndicatorItem tertiaryIndicator;
  late double candleWidth;
  late double scrollX;

  ChartPainter({
    required this.dataController,
    required this.scaleX,
    required this.isLongPress,
    required this.selectPoint,
    required this.scalePoint,
    required this.sliderWidth,
    required this.sink,
  }) {
    datas = dataController.currentStock.datas.reversed.toList();
    isTickChart = dataController.stockTime == JKStockTimeType.time;
    isTick5Chart = dataController.stockTime == JKStockTimeType.time5;
    isTickPreChart = dataController.stockTime == JKStockTimeType.timePre;
    isTickAftChart = dataController.stockTime == JKStockTimeType.timeAft;
    mainLineType = dataController.mainLineType;
    mainIndicators = dataController.mainIndicator;
    indicatorChartMap = dataController.indicatorChartMap;
    // secondaryIndicator = dataController.secondaryIndicator;
    // tertiaryIndicator = dataController.tertiaryIndicator;
    candleWidth = dataController.candleWidth;
    scrollX = dataController.scrollX;
  }

  KLineDataController dataController;

  //3块区域大小与位置
  late Rect mMainRect;
  late double mDisplayHeight, mWidth;
  MainChartRenderer? mainChartRenderer;

  Map<String, Rect> indicatorChartRectMap = {};
  Map<String, SecondaryChartRenderer> indicatorChartRendererMap = {};

  // SecondaryChartRenderer? secondaryChartRenderer;
  // TertiaryChartRenderer? tertiaryChartRenderer;

  // 长按时候的选中
  int selectIndex = 0;

  //需要绘制的开始和结束下标
  int mStartIndex = 0, mStopIndex = 0;
  //主要区域的最大值，和最小值下标
  int mMainMaxIndex = 0, mMainMinIndex = 0;
  //主要区域
  double mMainMaxValue = -double.maxFinite, mMainMinValue = double.maxFinite;
  // 附图最大小值
  // double mSecondaryMaxValue = -double.maxFinite, mSecondaryMinValue = double.maxFinite;
  // double mTertiaryMaxValue = -double.maxFinite, mTertiaryMinValue = double.maxFinite;

  Map<String, double?> indicatorMaxValueMap = {
        "1": -double.maxFinite,
        "2": -double.maxFinite,
        "3": -double.maxFinite,
        "4": -double.maxFinite,
        "5": -double.maxFinite,
      },
      indicatorMinValueMap = {
        "1": double.maxFinite,
        "2": double.maxFinite,
        "3": double.maxFinite,
        "4": double.maxFinite,
        "5": double.maxFinite,
      };

  // 这个是主股票的最高最低,不计入叠加股票的
  double mMainHighMaxValue = -double.maxFinite, mMainLowMinValue = double.maxFinite;

  List<String> mFormats = [yyyy, '-', mm, '-', dd, ' ', HH, ':', nn]; //格式化时间

  @override
  void paint(Canvas canvas, Size size) {
    // logger.d("ctl: ${dataController.frameId} paint");
    mDisplayHeight = size.height - ChartStyle.topPadding - ChartStyle.bottomDateHigh;
    mWidth = size.width - dataController.paddingRight - dataController.paddingLeft;
    dataController.mWidth = mWidth;
    if (dataController.stockTime == JKStockTimeType.time) {
      candleWidth = mWidth / 390;
    } else if (dataController.stockTime == JKStockTimeType.timePre) {
      candleWidth = mWidth / 330;
      TextPainter tp = TextPainter(
          text: TextSpan(text: "盘前交易", style: TextStyle(color: JKStyle.theme.thumbColor, fontSize: 60)),
          textDirection: TextDirection.ltr);
      tp.layout();
      tp.paint(canvas, Offset(size.width / 2 - tp.width / 2, 200));
    } else if (dataController.stockTime == JKStockTimeType.timeAft) {
      candleWidth = mWidth / 240;
      TextPainter tp = TextPainter(
          text: TextSpan(text: "盘后交易", style: TextStyle(color: JKStyle.theme.thumbColor, fontSize: 60)),
          textDirection: TextDirection.ltr);
      tp.layout();
      tp.paint(canvas, Offset(size.width / 2 - tp.width / 2, 200));
    } else if (dataController.stockTime == JKStockTimeType.time5) {
      candleWidth = mWidth / 390 / 5;
    }

    // var stopWatch = Stopwatch();
    // debugPrint("TTT:--------------------------------");
    // stopWatch.start();
    divisionRect(size);
    // debugPrint("TTT: divisionRect: ${stopWatch.elapsedMicroseconds}");
    // stopWatch.reset();
    calculateValue();
    // debugPrint("TTT: calculateValue: ${stopWatch.elapsedMicroseconds}");
    // stopWatch.reset();
    initRender();
    // debugPrint("TTT: initRender: ${stopWatch.elapsedMicroseconds}");
    // stopWatch.reset();
    drawGrid(canvas);
    if (datas.isNotEmpty) {
      drawScollBar(canvas, size);

      drawGrid(canvas, base: false);
      // debugdebugPrint("TTT: drawGrid: ${stopWatch.elapsedMicroseconds}");
      // stopWatch.reset();
      drawRightText(canvas);

      // debugPrint("TTT: drawRightText: ${stopWatch.elapsedMicroseconds}");
      // stopWatch.reset();
      drawChart(canvas);

      // debugPrint("TTT: drawChart: ${stopWatch.elapsedMicroseconds}");
      // stopWatch.reset();

      // debugPrint("TTT: drawScollBar: ${stopWatch.elapsedMicroseconds}");
      // stopWatch.reset();
      drawDate(canvas, size);

      // debugPrint("TTT: drawDate: ${stopWatch.elapsedMicroseconds}");
      // stopWatch.reset();
      drawMaxAndMin(canvas);

      // debugPrint("TTT: drawMaxAndMin: ${stopWatch.elapsedMicroseconds}");
      // stopWatch.reset();
      if (isLongPress) {
        selectIndex = getIndex(selectPoint.dx).floor();
        var isRange =
            (outRangeIndex(selectIndex) == false && selectPoint.dy < (size.height - ChartStyle.bottomDateHigh));
        // if (BacktestManager.shared.isEnable && BacktestManager.shared.isbackTesting) {
        //   double itemWidth = canleWidth;
        //   if (BacktestManager.shared.startIndex < 0) {
        //     var curX = mWidth - (mStopIndex - mStartIndex) / 2 * itemWidth + canleWidth / 2;
        //     var middle = ((mStopIndex - mStartIndex) / 2).floor();
        //     var index = middle - 1;
        //     // BacktestManager.shared.drawLongPressCrossLine(canvas, size,
        //     // curX: curX, selectedIndex: index, mWidth: mWidth, length: datas.length);
        //   } else {
        //     double curX = (selectIndex - mStartIndex) * itemWidth + startX + canleWidth / 2;
        //     // BacktestManager.shared.drawLongPressCrossLine(canvas, size,
        //     //     curX: curX, selectedIndex: selectIndex, mWidth: mWidth, length: datas.length);
        //   }
        // } else

        if (isRange) {
          drawLongPressCrossLine(canvas, size);
          drawTopText(canvas, datas[selectIndex]);
        }
      } else {
        drawTopText(canvas, datas.first);
      }
      // stopWatch.stop();
      canvas.save();
      mainChartRenderer?.setClipRect(canvas, offset: Offset(dataController.paddingRight, 0));
      // 画线自定义绘图
      if (dataController.showPaint) {
        dataController.paintManager.forEach(
          (element) {
            var sameStockTime = element.stockTime == dataController.stockTime.rawValue.item1.toString();
            if (sameStockTime || element.crossTime) {
              element.drawBase(canvas, size, element.boundingBoxPaint);
            }
          },
        );
      }

      //画 价格报警 线
      if (dataController.currentStock.priceAlarmList.isNotEmpty) {
        for (var item in dataController.currentStock.priceAlarmList) {
          var price = item["condition"]?["rise"] ?? item["condition"]?["fall"] ?? -1;
          if (price > 0) {
            var y = dataController.yFromValue(price.toString());
            canvas.drawDashLine(
              Offset(0, dataController.yFromValue(price.toString())),
              Offset(size.width - dataController.paddingRight, y),
              lineWidth: 1,
              dashWidth: 5,
              spaceWidth: 15,
              color: Colors.grey.shade700,
            );
            var img = ScriptPainter.icons["47"]!;
            var paint = Paint();
            var imageWidth = 14.0;
            final src = ui.Rect.fromLTWH(0, 0, img.width.toDouble(), img.height.toDouble());
            final dst = ui.Rect.fromLTWH(0, y + 2, imageWidth, imageWidth);
            canvas.drawImageRect(img, src, dst, paint);
            canvas.drawText(
                price.toString().asFixed(3), Offset(15, y + 2), const Color.fromARGB(255, 139, 134, 134), 12);
          }
        }
      }

      canvas.restore();
    }
  }

  /// 用于计算当前的范围的矩形框坐标
  void makeDrawPoints(
      double aPointX,
      double stopPointX,
      String aPointDate,
      String stopPointDate,
      double curX,
      String curDate,
      List<String>? beginRaw,
      List<String>? endRaw,
      List<dynamic>? infoRaw,
      DrawInfo drawInfo,
      bool isLast) {
    if (beginRaw == null || endRaw == null || infoRaw == null) {
      return;
    }

    final idxBegin = beginRaw.indexOf(curDate);
    if (idxBegin != -1) {
      drawInfo.begins.add(curX);
      drawInfo.infos.add(infoRaw[idxBegin]);
      if (drawInfo.ends.isEmpty) {
        // -10 防止边界跳动
        drawInfo.ends.add(aPointX - 10);
      }
    }

    final idxEnd = endRaw.indexOf(curDate);
    if (idxEnd != -1) {
      drawInfo.ends.add(curX);
      drawInfo.lastInfo = infoRaw[idxEnd];
    }

    if (isLast) {
      if (drawInfo.ends.length > drawInfo.begins.length) {
        drawInfo.begins.add(stopPointX + 10);
        drawInfo.infos.add(drawInfo.lastInfo);
      } else if (drawInfo.ends.length < drawInfo.begins.length) {
        // Handle the case if needed
      }

      if (drawInfo.begins.isEmpty) {
        // Handle the case if needed
        for (final item in infoRaw) {
          if (item[0].compareTo(aPointDate) <= 0 && stopPointDate.compareTo(item[1]) <= 0) {
            drawInfo.begins.add(aPointX - 10);
            drawInfo.ends.add(stopPointX + 10);
            drawInfo.infos.add(item);
            break;
          }
        }
      }
    }
  }

  // Stopwatch sw = Stopwatch();
  void drawChart(Canvas canvas) async {
    double itemWidth = candleWidth;

    var penCentresDrawInfo = DrawInfo();
    var penExtCentresDrawInfo = DrawInfo();

    var insideCentresDrawInfo = DrawInfo();
    var insideExtCentresDrawInfo = DrawInfo();

    var segmentCentresDrawInfo = DrawInfo();
    var segmentExtCentresDrawInfo = DrawInfo();

    var endX = (mStopIndex - mStartIndex) * itemWidth + startX;
    var startDate = datas.safeAt(mStartIndex)?.date;
    var endDate = datas.safeAt(mStopIndex)?.date;
    if (mStopIndex < 0) {
      endDate = datas.safeAt(mStopIndex.abs())?.date;
    }
    if (startDate == null || endDate == null) {
      return;
    }
    canvas.save();
    if (isTickChart || isTick5Chart || isTickPreChart || isTickAftChart) {
      mStartIndex = 0;
      mStopIndex = datas.length - 1;
      itemWidth = candleWidth;
      startX = 0;
    }
    // sw.start();
    // sw.reset();
    if (BacktestManager.shared.isEnable == false) {
      for (int i = mStartIndex; datas.isNotEmpty && i <= mStopIndex; i++) {
        KLineEntity curpoint = datas[i];
        var isLasted = (i == mStopIndex);
        double curX = (i - mStartIndex) * itemWidth + startX;
        if (mainChartRenderer?.state.contains(ChanDataIndicator.pivot.info.$2) == true) {
          // 提取中枢图数据(实心框)
          makeDrawPoints(
            startX,
            endX,
            startDate,
            endDate,
            curX,
            curpoint.date,
            dataController.currentStock.chanDataManager.penInfoStarts,
            dataController.currentStock.chanDataManager.penInfoEnds,
            dataController.currentStock.chanDataManager.penInfoAll,
            penCentresDrawInfo,
            isLasted,
          );

          // 提取中枢图数据(虚线框)
          makeDrawPoints(
            startX,
            endX,
            startDate,
            endDate,
            curX,
            curpoint.date,
            dataController.currentStock.chanDataManager.extandsStarts,
            dataController.currentStock.chanDataManager.extandsEnds,
            dataController.currentStock.chanDataManager.extands,
            penExtCentresDrawInfo,
            isLasted,
          );
        }
      }

      // debugPrint("TTT AAA: ------------------------");
      // debugPrint("TTT AAA: chan1 : ${sw.elapsedMicroseconds}");
      // sw.reset();
      canvas.save();
      mainChartRenderer?.setClipRect(canvas);
      if (mainChartRenderer?.state.contains(ChanDataIndicator.pivot.info.$2) == true) {
        // 笔中枢

        // 笔拓展中枢
        for (var idx = 0; idx < penExtCentresDrawInfo.begins.length; idx++) {
          var begin = penExtCentresDrawInfo.begins[idx];
          var end = penExtCentresDrawInfo.ends.safeAt(idx);
          var info = penExtCentresDrawInfo.infos.safeAt(idx);

          if (end != null && info != null) {
            mainChartRenderer?.drawExtCentres(canvas, begin, end, info, true);
          }
        }

        for (var idx = 0; idx < penCentresDrawInfo.begins.length; idx++) {
          var begin = penCentresDrawInfo.begins[idx];
          var end = penCentresDrawInfo.ends.safeAt(idx);
          var info = penCentresDrawInfo.infos.safeAt(idx);

          if (end != null && info != null) {
            mainChartRenderer?.drawCentres(canvas, begin, end, info, true);
          }
        }
      }

      if (mainChartRenderer?.state.contains(ChanDataIndicator.pivot.info.$2) == true) {
        for (var idx = 0; idx < segmentCentresDrawInfo.begins.length; idx++) {
          var begin = segmentCentresDrawInfo.begins[idx];
          var end = segmentCentresDrawInfo.ends.safeAt(idx);
          var info = segmentCentresDrawInfo.infos.safeAt(idx);

          if (end != null && info != null) {
            mainChartRenderer?.drawCentres(canvas, begin, end, info, true);
          }
        }

        for (var idx = 0; idx < segmentExtCentresDrawInfo.begins.length; idx++) {
          var begin = segmentExtCentresDrawInfo.begins[idx];
          var end = segmentExtCentresDrawInfo.ends.safeAt(idx);
          var info = segmentExtCentresDrawInfo.infos.safeAt(idx);

          if (end != null && info != null) {
            mainChartRenderer?.drawExtCentres(canvas, begin, end, info, true);
          }
        }

        for (var idx = 0; idx < insideCentresDrawInfo.begins.length; idx++) {
          var begin = insideCentresDrawInfo.begins[idx];
          var end = insideCentresDrawInfo.ends.safeAt(idx);
          var info = insideCentresDrawInfo.infos.safeAt(idx);

          if (end != null && info != null) {
            mainChartRenderer?.drawCentres(canvas, begin, end, info, true);
          }
        }

        for (var idx = 0; idx < insideExtCentresDrawInfo.begins.length; idx++) {
          var begin = insideExtCentresDrawInfo.begins[idx];
          var end = insideExtCentresDrawInfo.ends.safeAt(idx);
          var info = insideExtCentresDrawInfo.infos.safeAt(idx);

          if (end != null && info != null) {
            mainChartRenderer?.drawCentres(canvas, begin, end, info, true);
          }
        }
      }

      canvas.restore();
      for (int i = mStartIndex; datas.isNotEmpty && i <= mStopIndex; i++) {
        KLineEntity curpoint = datas[i];
        double curX = (i - mStartIndex) * itemWidth + startX;

        var chanDataItem = dataController.currentStock.chanDataManager.chanDataEntityList.safeAt(i);
        // 1\2\3 买卖点
        if (chanDataItem?.penSale1.isNotEmpty == true) {
          if (dataController.mainIndicator.contains(ChanDataIndicator.class1.info.$2)) {
            dataController.currentStock.chanDataManager.drawBuySalePoint(
                canvas, mainChartRenderer!, curpoint, curX, chanDataItem!.penSale1, "1", dataController.paddingLeft,
                showReversal: dataController.mainIndicator.contains(ChanDataIndicator.reversal.info.$2));
          }
        }

        if (chanDataItem?.penSale2.isNotEmpty == true) {
          if (chanDataItem?.penSale3.isNotEmpty == true) {
          } else {
            if (dataController.mainIndicator.contains(ChanDataIndicator.class2.info.$2)) {
              dataController.currentStock.chanDataManager.drawBuySalePoint(
                  canvas, mainChartRenderer!, curpoint, curX, chanDataItem!.penSale2, "2", dataController.paddingLeft,
                  showReversal: dataController.mainIndicator.contains(ChanDataIndicator.reversal.info.$2));
            }
          }
        }

        if (chanDataItem?.penSale3.isNotEmpty == true) {
          if (dataController.mainIndicator.contains(ChanDataIndicator.class3.info.$2)) {
            var isPlus = chanDataItem?.penSale2.isNotEmpty == true;
            if (!dataController.mainIndicator.contains(ChanDataIndicator.showOverlap.info.$2)) {
              isPlus = false;
            }
            dataController.currentStock.chanDataManager.drawBuySalePoint(
                canvas, mainChartRenderer!, curpoint, curX, chanDataItem!.penSale3, "3", dataController.paddingLeft,
                plus: isPlus, showReversal: dataController.mainIndicator.contains(ChanDataIndicator.reversal.info.$2));
          }
        }
      }
    }
    // debugPrint("TTT AAA: chan2 : ${sw.elapsedMicroseconds}");
    // sw.reset();
    var catchGapCount = 0;
    var maxGapHigh = double.minPositive;
    var minGapLow = double.maxFinite;

    KLineEntity? tickDataLast;

    for (var i = mStartIndex; i < mStopIndex; i++) {
      var item = datas[i];
      if (item.close > 0) {
        tickDataLast = item;
        break;
      }
    }

    // 绘制主图
    var linePath20 = Path();
    var linePath30 = Path();
    var linePath55 = Path();
    var linePath60 = Path();
    var linePath65 = Path();
    var linePath120 = Path();
    var linePath250 = Path();
    // if (isTickChart || isTick5Chart || isTickPreChart || isTickAftChart) {
    //   for (int i = 0; i <= datas.length; i++) {
    //     if (datas[i].close > 0) {
    //       mStartIndex = i;
    //       break;
    //     }
    //   }
    // }
    for (int i = mStartIndex; datas.isNotEmpty && i <= mStopIndex; i++) {
      KLineEntity curpoint = datas[i];
      KLineEntity? lastpoint;
      if (i != mStartIndex) {
        lastpoint = datas.safeAt(i - 1);
      }

      double curX = (i - mStartIndex) * itemWidth + startX - dataController.paddingLeft;

      if (dataController.mainIndicator.contains(ChanDataIndicator.shortLine.info.$2)) {
        mainChartRenderer!.makeLinePath(
          canvas,
          lastpoint?.MA20Price,
          curpoint.MA20Price,
          curX,
          const Color.fromARGB(255, 186, 64, 127),
          path: linePath20,
          isBegin: curpoint.close > 0,
          isFinish: i == mStopIndex,
          width: 2,
          skip: curpoint.MA20Price <= 0,
        );

        mainChartRenderer!.makeLinePath(
          canvas,
          lastpoint?.MA30Price,
          curpoint.MA30Price,
          curX,
          const Color.fromARGB(255, 156, 171, 232),
          path: linePath30,
          isBegin: curpoint.close > 0,
          isFinish: i == mStopIndex,
          width: 2,
          skip: curpoint.MA30Price <= 0,
        );
      }

      if (dataController.mainIndicator.contains(ChanDataIndicator.mainTrend.info.$2)) {
        mainChartRenderer!.makeLinePath(
          canvas,
          lastpoint?.MA55Price,
          curpoint.MA55Price,
          curX,
          const Color.fromARGB(255, 250, 28, 19),
          path: linePath55,
          isBegin: curpoint.close > 0,
          isFinish: i == mStopIndex,
          width: 2,
          skip: curpoint.MA55Price <= 0,
        );

        mainChartRenderer!.makeLinePath(
          canvas,
          lastpoint?.MA60Price,
          curpoint.MA60Price,
          curX,
          const Color.fromARGB(255, 255, 255, 255),
          path: linePath60,
          isBegin: curpoint.close > 0,
          isFinish: i == mStopIndex,
          width: 2,
          skip: curpoint.MA60Price <= 0,
        );

        mainChartRenderer!.makeLinePath(
          canvas,
          lastpoint?.MA65Price,
          curpoint.MA65Price,
          curX,
          const Color.fromARGB(255, 51, 251, 41),
          path: linePath65,
          isBegin: curpoint.close > 0,
          isFinish: i == mStopIndex,
          width: 2,
          skip: curpoint.MA65Price <= 0,
        );
        mainChartRenderer!.makeLinePath(
          canvas,
          lastpoint?.MA120Price,
          curpoint.MA120Price,
          curX,
          const Color.fromARGB(255, 249, 42, 251),
          path: linePath120,
          isBegin: curpoint.close > 0,
          isFinish: i == mStopIndex,
          width: 4,
          skip: curpoint.MA120Price <= 0,
        );

        mainChartRenderer!.makeLinePath(
          canvas,
          lastpoint?.MA250Price,
          curpoint.MA250Price,
          curX,
          const Color.fromARGB(255, 250, 28, 19),
          path: linePath250,
          isBegin: curpoint.close > 0,
          isFinish: i == mStopIndex,
          width: 6,
          skip: curpoint.MA250Price <= 0,
        );
      }

      // 绘制事件
      for (var event in dataController.infoEventMaps.keys) {
        var dates = dataController.infoEventMaps[event]!;
        if (dates.contains(curpoint.date)) {
          var date = curpoint.date.split(" ").first;
          var content = event;
          var candleX = mWidth - curX - candleWidth / 2;
          TextPainter titleTp = TextPainter(
              text: TextSpan(text: content, style: const TextStyle(color: Colors.black, fontSize: 16)),
              textDirection: TextDirection.ltr);
          titleTp.layout();

          TextPainter dateTp = TextPainter(
              text: TextSpan(text: date, style: const TextStyle(color: Colors.black, fontSize: 16)),
              textDirection: TextDirection.ltr);
          dateTp.layout();

          TextPainter tp = dateTp.width > titleTp.width ? dateTp : titleTp;

          var x = candleX - tp.width / 2;
          var dateHeight = 22.0;
          var fontsize = 14.0;
          canvas.drawRect(Rect.fromLTWH(x, 0, tp.width + 10, dateHeight), Paint()..color = Colors.pink);
          canvas.drawRect(Rect.fromLTWH(x, dateHeight, tp.width + 10, tp.height), Paint()..color = JKStyle.theme.white);
          canvas.drawText(date, Offset(x + 5, (dateHeight - fontsize) / 2 / 2), Colors.white, fontsize);
          canvas.drawText(content, Offset(x + 5, dateHeight + (tp.height - fontsize) / 2 / 2), Colors.black, fontsize);
          canvas.drawDashLine(
              Offset(candleX, dateHeight + tp.height + 5), Offset(candleX, mainChartRenderer!.getY(curpoint.high)),
              color: Colors.grey.shade800);
        }
      }

      // 绘制报警标志
      if (Settings.isShowAlarmNoticeInKLine) {
        List<String> containDates = [];
        for (var date in dataController.currentStock.aiAlarmList.keys) {
          var aaa = curpoint.date.compareTo(date);
          var bbb = lastpoint?.date.compareTo(date);
          if (aaa < 1) {
            if (bbb != null && bbb < 1) continue;
            containDates.add(date);
          }
        }
        if (containDates.isNotEmpty) {
          var paint = Paint();
          var imageWidth = 14.0;
          // var infoList = dataController.currentStock.aiAlarmList[curpoint.date] ?? [];
          var imageId = "47";
          if (containDates.length == 1) {
            var itemList = dataController.currentStock.aiAlarmList[containDates.first] ?? [];
            // var bull = dataController.currentStock.aiAlarmList[containDates.first]["bull"];
            var bull;
            if (itemList.length == 1) {
              bull = itemList.first["bull"];
            }

            if (bull != null) {
              if (Settings.greenUpRedDown) {
                imageId = bull == "1" ? "49" : "48";
              } else {
                imageId = bull == "1" ? "48" : "49";
              }
            }
          }
          var img = ScriptPainter.icons[imageId]!;
          var x = mWidth - curX - candleWidth;
          final src = ui.Rect.fromLTWH(0, 0, img.width.toDouble(), img.height.toDouble());
          final dst = ui.Rect.fromLTWH(
            x + (candleWidth - imageWidth) / 2,
            mainChartRenderer!.chartRect.bottom - 15,
            imageWidth,
            imageWidth,
          );
          dataController.currentStock.aiAlarmDrawRect[curpoint.date] = src;

          canvas.drawImageRect(img, src, dst, paint);
          if (dst.contains(dataController.mouseLocation)) {
            for (var i = 0; i < containDates.length; i++) {
              var itemList = dataController.currentStock.aiAlarmList[containDates[i]];
              for (var ii = 0; ii < itemList.length; ii++) {
                var item = itemList[ii];
                var text = item["indicators"];
                var color = Colors.grey.shade700;
                var bull = item["bull"];
                var time = item["time"];
                if (bull != null) {
                  color = bull == "1" ? JKStyle.riseColor : JKStyle.fallColor;
                }
                canvas.drawText(time + " " + text, Offset(dst.left, dst.bottom - 30 - i * 15 - ii * 15), color, 12,
                    padding: 8, center: false);
              }
            }
          }
        }
      }
      // 绘制最新收盘价虚线

      if (lastpoint != null) {
        minGapLow = min(minGapLow, lastpoint.low);
        maxGapHigh = max(maxGapHigh, lastpoint.high);
        if (Settings.enableCandleGap && catchGapCount < 1 && mainLineType == JKMainLineType.candle) {
          var hasGap = maxGapHigh < curpoint.low || minGapLow > curpoint.high;
          if (hasGap) {
            var top = 0.0;
            var bottom = 0.0;
            if (curpoint.low > maxGapHigh) {
              top = mainChartRenderer!.getY(curpoint.low);
              bottom = mainChartRenderer!.getY(maxGapHigh);
            } else if (minGapLow > curpoint.high) {
              top = mainChartRenderer!.getY(curpoint.high);
              bottom = mainChartRenderer!.getY(minGapLow);
            }

            var height = bottom - top;
            catchGapCount += 1;
            if (top + height > mainChartRenderer!.chartRect.height) {
              height = mainChartRenderer!.chartRect.height - top;
              if (height < 0) height = 0;
            }
            canvas.save();
            mainChartRenderer!.setClipRect(canvas);
            canvas.drawRect(Rect.fromLTWH(mWidth - curX - candleWidth / 2, top, mWidth, height),
                Paint()..color = Colors.grey.shade700.withOpacity(0.3));
            canvas.restore();
          }
        }

        // 绘制5日分割
        if (dataController.stockTime == JKStockTimeType.time5) {
          var color = Colors.grey.shade700;
          var fontsize = 12.0;
          var date = curpoint.date.length > 10 ? curpoint.date.substring(5, 10) : curpoint.date;
          if (i == 1) {
            canvas.drawText(date, Offset(mWidth - curX - 50, 5), color, fontsize);
          } else if (i % 390 == 0) {
            canvas.drawText(date, Offset(mWidth - curX - 50, 5), color, fontsize);
            canvas.drawLine(
                Offset(mWidth - curX, 0), Offset(mWidth - curX, mDisplayHeight), Paint()..color = Colors.grey.shade800);
          }
        }
      }

      var w = mainChartRenderer?.chartRect.width ?? 0;
      Rect clipRect = Rect.fromLTWH(dataController.paddingLeft, 0, w + 5, mDisplayHeight);
      canvas.clipRect(clipRect);
      Color? tickColor;
      if (dataController.stockTime.isTickTime) {
        tickColor = tickDataLast!.close > tickDataLast.preClose ? JKStyle.riseColor : JKStyle.fallColor;
      }
      mainChartRenderer?.drawChart(canvas, lastpoint, curpoint, curX,
          lineType: mainLineType, index: i, color: tickColor);
      indicatorChartRendererMap.forEach((key, value) {
        value.drawChart(canvas, lastpoint, curpoint, curX, index: i, chartIndex: int.parse(key) - 1);
      });
    }
    // debugPrint("TTT AAA: 主图 : ${sw.elapsedMicroseconds}");
    // sw.reset();

    // 绘制主图叠加股票
    // stopWatch.start();
    dataController.compareStocks.forEach((key, value) {
      double? scale;
      if (dataController.yAxisType == JKYAxisType.percent) {
        scale = getOverlayScale(datas, value.datas, mStopIndex);
      }
      var compareLinePath = Path();
      for (int i = mStartIndex; datas.isNotEmpty && i <= mStopIndex; i++) {
        var curpoint2 = value.datas.safeAt(value.datas.length - 1 - i);
        if (curpoint2 != null) {
          double curX = (i - mStartIndex) * itemWidth + startX;
          KLineEntity? lastpoint2;
          if (i != mStartIndex) {
            lastpoint2 = value.datas.safeAt(value.datas.length - 1 - i + 1);
          }
          mainChartRenderer?.makeLinePath(canvas, lastpoint2?.close, curpoint2.close, curX, value.color,
              path: compareLinePath, scale: scale, isBegin: i == mStartIndex, isFinish: i == mStopIndex, isCubic: true);
        }
      }
    });

    // debugPrint("TTT AAA: 叠加 : ${sw.elapsedMicroseconds}");
    // sw.reset();

    // 绘制 脚本线 ////
    ScriptPainter.handleDraw(mainChartRenderer!, indicatorChartRendererMap, canvas, datas, mStartIndex, mStopIndex,
        startX, itemWidth, dataController, mDisplayHeight);
    // debugPrint("TTT AAA: 脚本 : ${sw.elapsedMicroseconds}");
    // sw.reset();
    if (BacktestManager.shared.isEnable) {
      BacktestManager.shared.drawAvgCost(canvas, mainChartRenderer!, 10, 10, 10);
    }

    canvas.restore();

    if (BacktestManager.shared.isEnable == false) {
      // 绘制当前价格线
      var drawStarx = startX;
      KLineEntity curpoint = datas[mStartIndex];
      if (dataController.stockTime.isTickTime) {
        curpoint = tickDataLast ?? curpoint;
        drawStarx = mWidth - dataController.paddingLeft;
      }

      drawText(String text, Color color, double y, {bool isLeft = false}) {
        TextPainter tp = TextPainter(
          text: TextSpan(text: text, style: const TextStyle(color: Colors.white, fontSize: 12)),
          textDirection: TextDirection.ltr,
        );
        tp.layout();

        var paint = Paint()..color = color;
        var dd = dataController.paddingRight - tp.width - 2 + dataController.paddingLeft;
        var offset = Offset(dd + mWidth, y - 11);
        var x = mWidth + dataController.paddingLeft;
        if (isLeft) {
          offset = Offset(0, y - 11);
          x = 0;
        }
        var rect = Rect.fromLTWH(x, offset.dy, dataController.paddingRight, tp.height + 8);
        canvas.drawRRect(RRect.fromRectAndRadius(rect, const Radius.circular(2)), paint);

        tp.paint(canvas, offset + const Offset(1, 4));
      }

      double closeY = mainChartRenderer!.getY(curpoint.close) + 1;
      var color = curpoint.preClose > curpoint.close ? JKStyle.fallColor : JKStyle.riseColor;
      var lastClose =
          dataController.currentStock.datas.safeAt(dataController.currentStock.datas.length - mStopIndex)?.close;
      if (dataController.stockTime.isTickTime) {
        lastClose = dataController.currentStock.datas.first.preClose;
      }
      switch (dataController.yAxisType) {
        case JKYAxisType.percent:
          if (lastClose != null) {
            curpoint.close.toStringAsFixed(3);
            var p = ((curpoint.close - lastClose) / lastClose) * 100;
            color = p > 0 ? JKStyle.riseColor : JKStyle.fallColor;
            drawText("${p.toStringAsFixed(2)}%", color, closeY);
          }
          break;
        case JKYAxisType.both:
          if (lastClose != null) {
            curpoint.close.toStringAsFixed(3);
            var p = ((curpoint.close - lastClose) / lastClose) * 100;
            color = p > 0 ? JKStyle.riseColor : JKStyle.fallColor;
            drawText("${p.toStringAsFixed(2)}%", color, closeY);
            drawText(curpoint.close.toStringAsFixed(3), color, closeY, isLeft: true);
          }
          break;
        default:
          drawText(curpoint.close.toStringAsFixed(3), color, closeY);
      }

      canvas.drawDashLine(
        Offset(mWidth - drawStarx, closeY),
        Offset(mWidth + dataController.paddingLeft, closeY),
        lineWidth: 1,
        color: color,
      );
    }
  }

  double getOverlayScale(List origin, List other, int stopIndex) {
    var mainStopItem = origin.safeAt(mStopIndex);
    var nowStopItem = other.safeAt(other.length - 1 - stopIndex);
    if (mainStopItem == null || nowStopItem == null) return 0.0;
    var scale = 1 + (mainStopItem.close - nowStopItem.close) / nowStopItem.close;
    return scale.toDouble();
  }

  void drawCandleGap() {}

  void drawRightText(Canvas canvas) {
    mainChartRenderer?.drawRightText(canvas, ChartStyle.gridRows);
    // secondaryChartRenderer?.drawRightText(canvas, ChartStyle.gridRows);
    // tertiaryChartRenderer?.drawRightText(canvas, ChartStyle.gridRows);
    indicatorChartRendererMap.forEach((key, value) {
      value.drawRightText(canvas, ChartStyle.gridRows);
    });
  }

  void drawTopText(Canvas canvas, KLineEntity curPoint) {
    // mainChartRenderer?.drawTopText(canvas, curPoint);
    // volChartRenderer?.drawTopText(canvas, curPoint);
    // tertiaryChartRenderer?.drawTopText(canvas, curPoint);
  }

  //计算startIndex和stopIndex
  void calculateValue() {
    double itemWidth = candleWidth;
    if (scrollX <= 0) {
      startX = -scrollX;
    } else {
      double offsetX = 0;
      mStartIndex = (scrollX / itemWidth).floor();
      offsetX = mStartIndex * itemWidth - scrollX;
      startX = offsetX;
    }
    // 计算画布能画多少根 K 线
    int diffIndex = ((mMainRect.width - startX.toDouble()) / itemWidth).ceil();
    // 计算K线停止的位置
    mStopIndex = min(mStartIndex + diffIndex, datas.length - 1);

    if (isTickChart || isTick5Chart || isTickPreChart || isTickAftChart) {
      mStartIndex = 0;
      mStopIndex = datas.length - 1;
    }

    dataController.mStartIndex = mStartIndex;
    dataController.mStopIndex = mStopIndex;
    dataController.startX = startX;
    for (int i = mStartIndex; i <= mStopIndex; i++) {
      getMainMaxMinValue(datas[i], index: i);
      //  获取指标的最大最小值
      dataController.indicatorChartMap.forEach((key, indicatorItem) {
        if (indicatorItem == ChanDataIndicator.bottomSignal.info.$2) {
          final item = dataController.currentStock.chanDataManager.chanDataEntityList.safeAt(i);
          if (item == null) return;
          indicatorMaxValueMap[key] =
              max(indicatorMaxValueMap[key]!, max(item.hdlyVol, max(item.horizonVol, item.monthLineVol)));
          indicatorMinValueMap[key] =
              min(indicatorMinValueMap[key]!, min(item.hdlyVol, min(item.horizonVol, item.monthLineVol)));
          if (mStopIndex - 1 == i) {
            indicatorMaxValueMap[key] = indicatorMaxValueMap[key]! + 25;
          }
        } else if (indicatorItem == ChanDataIndicator.buySalePoint.info.$2) {
          if (datas[i].X0.isFinite) {
            indicatorMaxValueMap[key] = max(indicatorMaxValueMap[key]!, datas[i].X0);
            indicatorMinValueMap[key] = min(indicatorMinValueMap[key]!, datas[i].X0);
          }
        } else {
          var (ma, mi) = indicatorItem.getMaxMin(mStartIndex, mStopIndex, i, datas.length);
          indicatorMaxValueMap[key] = max(indicatorMaxValueMap[key]!, ma);
          indicatorMinValueMap[key] = min(indicatorMinValueMap[key]!, mi);
          if (mStopIndex - 1 == i) {
            indicatorMaxValueMap[key] = indicatorMaxValueMap[key]! * 1.1;
          }
        }
      });
    }

    // 设置右侧Y轴数值宽度
    var c = mMainMaxValue.toStringAsFixed(3);
    if (c.length < 7) {
      dataController.paddingRight = 46;
    } else if (c.length < 9) {
      dataController.paddingRight = 50;
    } else if (c.length < 10) {
      dataController.paddingRight = 58;
    } else if (c.length < 11) {
      dataController.paddingRight = 68;
    } else if (c.length < 12) {
      dataController.paddingRight = 75;
    }
    // 计算叠加股票的最大最小值
    if (dataController.compareStocks.isNotEmpty) {
      dataController.compareStocks.forEach((key, value) {
        double? scale;
        if (dataController.yAxisType == JKYAxisType.percent) {
          scale = getOverlayScale(datas, value.datas, mStopIndex);
        }
        for (int i = mStartIndex; i <= mStopIndex; i++) {
          var item = value.datas.safeAt(value.datas.length - 1 - i);
          if (item == null) {
            continue;
          }
          getMainMaxMinValue(item, scale: scale);
        }
      });
    }
  }

  void getMainMaxMinValue(KLineEntity item, {int? index, double? scale}) {
    if (isTickChart || isTick5Chart || isTickPreChart || isTickAftChart) {
      if (item.close > 0) {
        mMainMaxValue = max(mMainMaxValue, item.close);
        mMainMinValue = min(mMainMinValue, item.close);
      }
    } else {
      double maxPrice = item.high;
      double minPrice = item.low;

      if (scale != null) {
        maxPrice = maxPrice * scale;
        minPrice = minPrice * scale;
      }
      if (mainIndicators.contains(ChanDataIndicator.shortLine.info.$2)) {
        if (item.MA20Price != 0) {
          maxPrice = max(maxPrice, item.MA20Price);
          minPrice = min(minPrice, item.MA20Price);
        }
        if (item.MA30Price != 0) {
          maxPrice = max(maxPrice, item.MA30Price);
          minPrice = min(minPrice, item.MA30Price);
        }
      }

      // if (mainIndicators.contains("波段王")) {
      //   if (item.MA30Price != 0) {
      //     maxPrice = max(maxPrice, item.MA30Price);
      //     minPrice = min(minPrice, item.MA30Price);
      //   }
      //   if (item.MA60Price != 0) {
      //     maxPrice = max(maxPrice, item.MA60Price);
      //     minPrice = min(minPrice, item.MA60Price);
      //   }
      // }

      // if (mainIndicators.contains(ChanDataIndicator.shortLine.info.$2)) {
      //   if (item.MA120Price != 0) {
      //     maxPrice = max(maxPrice, item.MA120Price);
      //     minPrice = min(minPrice, item.MA120Price);
      //   }
      //   if (item.MA250Price != 0) {
      //     maxPrice = max(maxPrice, item.MA250Price);
      //     minPrice = min(minPrice, item.MA250Price);
      //   }
      // }
      if (mainIndicators.contains(ChanDataIndicator.mainTrend.info.$2)) {
        // if (item.MA20Price != 0) {
        //   maxPrice = max(maxPrice, item.MA20Price);
        //   minPrice = min(minPrice, item.MA20Price);
        // }
        if (item.MA55Price != 0) {
          maxPrice = max(maxPrice, item.MA55Price);
          minPrice = min(minPrice, item.MA55Price);
        }
        if (item.MA60Price != 0) {
          maxPrice = max(maxPrice, item.MA60Price);
          minPrice = min(minPrice, item.MA60Price);
        }
        if (item.MA65Price != 0) {
          maxPrice = max(maxPrice, item.MA65Price);
          minPrice = min(minPrice, item.MA65Price);
        }
        if (item.MA120Price != 0) {
          maxPrice = max(maxPrice, item.MA120Price);
          minPrice = min(minPrice, item.MA120Price);
        }
        if (item.MA250Price != 0) {
          maxPrice = max(maxPrice, item.MA250Price);
          minPrice = min(minPrice, item.MA250Price);
        }
      } else if (mainIndicators == "BOLL") {
        if (item.up != 0) {
          maxPrice = max(item.up, item.high);
        }
        if (item.dn != 0) {
          minPrice = min(item.dn, item.low);
        }
      }
      mMainMaxValue = max(mMainMaxValue, maxPrice);
      mMainMinValue = min(mMainMinValue, minPrice);

      if (index != null) {
        if (mMainHighMaxValue < item.high) {
          mMainHighMaxValue = item.high;
          mMainMaxIndex = index;
        }
        if (mMainLowMinValue > item.low) {
          mMainLowMinValue = item.low;
          mMainMinIndex = index;
        }
      }
    }
  }

  void initRender() {
    mainChartRenderer = MainChartRenderer(
        mMainRect, mMainMaxValue, mMainMinValue, ChartStyle.topPadding, candleWidth, 0, dataController);

    dataController.indicatorChartMap.forEach((key, value) {
      indicatorChartRendererMap[key] = SecondaryChartRenderer(
          indicatorChartRectMap[key]!,
          indicatorMaxValueMap[key]!,
          indicatorMinValueMap[key]!,
          ChartStyle.childTopPadding,
          candleWidth <= 0 ? 1 : candleWidth,
          value,
          dataController.stockTime,
          dataController);
    });
  }

  //区分成三大块区域
  void divisionRect(Size size) {
    JKStyle.caculateIndicatorChart(mDisplayHeight, dataController.indicatorChartMap.length);

    double mainHeight = mDisplayHeight - dataController.indicatorChartMap.length * JKStyle.indicatorChartHeight;
    mMainRect = Rect.fromLTWH(dataController.paddingLeft, ChartStyle.topPadding, mWidth, mainHeight);
    indicatorChartRectMap["1"] =
        Rect.fromLTWH(dataController.paddingLeft, mMainRect.bottom, mWidth, JKStyle.indicatorChartHeight);
    indicatorChartRectMap["2"] = indicatorChartRectMap["1"]!;
    indicatorChartRectMap["3"] = indicatorChartRectMap["1"]!;
    indicatorChartRectMap["4"] = indicatorChartRectMap["1"]!;
    indicatorChartRectMap["5"] = indicatorChartRectMap["1"]!;
  }

  //画网格
  void drawGrid(Canvas canvas, {bool base = true}) {
    mainChartRenderer!.gridPaint.color = JKStyle.theme.dividerColorStrong;
    if (base) {
      mainChartRenderer?.drawGrid(canvas, ChartStyle.gridRows, ChartStyle.gridColumns);
      indicatorChartRendererMap.forEach((key, value) {
        value.drawGrid(canvas, ChartStyle.gridRows, ChartStyle.gridColumns, index: int.parse(key) - 1);
      });
    }

    for (var i = mStartIndex; i < mStopIndex; i++) {
      var current = datas[i];
      var shouldDrawGrid = false;
      var dateString = "";
      switch (dataController.gridType) {
        case JKChartGridType.minute30:
          shouldDrawGrid = current.is30MinuteStart;
          dateString = current.date.substring(11, 16);
          break;
        case JKChartGridType.minute:
          shouldDrawGrid = current.isMinuteStart;
          dateString = current.date.substring(11, 16);
          break;
        case JKChartGridType.hour:
          shouldDrawGrid = current.isHourStart;
          dateString = current.date.substring(11, 16);
          break;
        case JKChartGridType.day:
          shouldDrawGrid = current.isDayStart;
          // if (i % 4 == 0) {
          dateString = current.date.substring(5, 10);
          // }
          break;
        case JKChartGridType.mouth:
          shouldDrawGrid = current.isMonthStart;
          dateString = current.date.substring(5, 10);
          break;
        case JKChartGridType.year:
          shouldDrawGrid = current.isYearStart;
          dateString = current.date.substring(0, 4);
          break;
        case JKChartGridType.year5:
          shouldDrawGrid = current.is5YearStart;
          dateString = current.date.substring(0, 4);
          break;
        case JKChartGridType.halfHour:
          shouldDrawGrid = current.isHalfHourStart;
          dateString = current.date.substring(10, 16);
          break;
      }
      if (shouldDrawGrid) {
        var curX = (i - mStartIndex) * candleWidth + startX - dataController.paddingLeft;
        var x = mainChartRenderer!.chartRect.width - curX - candleWidth / 2;
        var height = mainChartRenderer!.chartRect.height +
            dataController.indicatorChartMap.length * JKStyle.indicatorChartHeight;
        canvas.drawLine(Offset(x, 0), Offset(x, height), mainChartRenderer!.gridPaint);

        TextPainter tp = TextPainter(
            text: TextSpan(text: dateString, style: TextStyle(color: JKStyle.theme.white, fontSize: 12)),
            textDirection: TextDirection.ltr);
        tp.layout();
        tp.paint(canvas, Offset(x - tp.width / 2, height + 4));
      }
    }
  }

  // 画滚动条
  void drawScollBar(Canvas canvas, Size size) {
    // 计算额外空余的个数
    var spaceCount = (size.width - dataController.paddingRight - dataController.paddingLeft) * 0.8 / candleWidth;
    var leftX = ((datas.length - mStopIndex) / (datas.length + spaceCount)) * size.width;
    if (leftX > size.width - sliderWidth) {
      leftX = size.width - sliderWidth;
    }
    canvas.drawRRect(
        RRect.fromRectAndRadius(
          Rect.fromLTWH(leftX, size.height - ChartStyle.bottomDateHigh, sliderWidth, ChartStyle.bottomDateHigh),
          const Radius.circular(3),
        ),
        Paint()..color = JKStyle.theme.dividerColorStrong);

    Paint paint = Paint()
      ..color = JKStyle.theme.dividerColor
      ..strokeWidth = 1
      ..isAntiAlias = false;

    canvas.drawLine(
        Offset(leftX + 3, size.height - ChartStyle.bottomDateHigh + 3), Offset(leftX + 3, size.height - 3), paint);
    canvas.drawLine(Offset(leftX + sliderWidth - 3, size.height - ChartStyle.bottomDateHigh + 3),
        Offset(leftX + sliderWidth - 3, size.height - 3), paint);
  }

  //画日期
  void drawDate(Canvas canvas, Size size) {
    var dy = size.height - ChartStyle.bottomDateHigh;
    canvas.drawLine(
      Offset(0, dy),
      Offset(size.width, dy),
      Paint()
        ..color = JKStyle.theme.dividerColor
        ..strokeWidth = 1,
    );

    //绘制边缘线
    // canvas.drawLine(Offset(size.width - dataController.paddingRight, 0),
    //     Offset(size.width - dataController.paddingRight, size.height), Paint());

    // double columnSpace =
    //     (size.width - dataController.paddingRight - dataController.paddingLeft) / ChartStyle.gridColumns;
    // for (var i = 0; i < ChartStyle.gridColumns; ++i) {
    //   int index = getIndex(i * columnSpace).ceil();
    //   if (outRangeIndex(index)) {
    //     continue;
    //   }
    //   double y = 0.0;
    //   var date = datas[index].date;
    //   if (dataController.stockTime.rawValue.item1 < 1440) {
    //     if (date.length >= 16) {
    //       date = date.substring(5, 16);
    //     }
    //   } else if (date.length >= 10) {
    //     date = date.substring(0, 10);
    //   }

    //   TextPainter tp = getTextPainter(date, ChartStyle.getDateTextStyle());
    //   y = size.height - (ChartStyle.bottomDateHigh - tp.height) / 2 - tp.height;
    //   tp.paint(canvas, Offset(columnSpace * i - tp.width / 2 - 8, y));
    // }
  }

  //画最大和最小值的标记
  void drawMaxAndMin(Canvas canvas) {
    if (isTickChart ||
        isTick5Chart ||
        isTickPreChart ||
        isTickAftChart ||
        mainLineType == JKMainLineType.kline ||
        BacktestManager.shared.isEnable) return;
    var y1 = mainChartRenderer?.getY(mMainHighMaxValue);
    double itemWidth = candleWidth;
    var x1 =
        mWidth - ((mMainMaxIndex - mStartIndex) * itemWidth + startX - dataController.paddingLeft + candleWidth / 2);
    if (x1 < mWidth / 2) {
      TextPainter tp = getTextPainter(
          "———${NumberUtil.format(mMainHighMaxValue)}", const TextStyle(fontSize: 10, color: Colors.white));
      tp.paint(canvas, Offset(x1, y1! - tp.height / 2));
    } else {
      TextPainter tp = getTextPainter(
          "${NumberUtil.format(mMainHighMaxValue)}——", const TextStyle(fontSize: 10, color: Colors.white));
      tp.paint(canvas, Offset(x1 - tp.width, y1! - tp.height / 2));
    }

    var y2 = mainChartRenderer?.getY(mMainLowMinValue);
    if (y2?.isNaN == true) {
      return;
    }
    var x2 =
        mWidth - ((mMainMinIndex - mStartIndex) * itemWidth + startX + candleWidth / 2) + dataController.paddingLeft;
    if (x2 < mWidth / 2) {
      TextPainter tp = getTextPainter(
          "———${NumberUtil.format(mMainLowMinValue)}", const TextStyle(fontSize: 10, color: Colors.white));
      tp.paint(canvas, Offset(x2, y2! - tp.height / 2));
    } else {
      TextPainter tp = getTextPainter(
          "${NumberUtil.format(mMainLowMinValue)}——", const TextStyle(fontSize: 10, color: Colors.white));
      tp.paint(canvas, Offset(x2 - tp.width, y2! - tp.height / 2));
    }
  }

  TextPainter getTextPainter(text, style) {
    TextSpan span = TextSpan(text: "$text", style: style);
    TextPainter tp = TextPainter(text: span, textDirection: TextDirection.ltr);
    tp.layout();
    return tp;
  }

  void drawLongPressCrossLine(Canvas canvas, Size size) {
    var index = getIndex(selectPoint.dx).floor();
    if (outRangeIndex(index)) return;
    var point = datas[index];
    double itemWidth = candleWidth;
    double curX = (index - mStartIndex) * itemWidth + startX + candleWidth / 2;

    Paint paintXY = Paint()
      ..color = Colors.white
      ..strokeWidth = ChartStyle.hCrossWidth
      ..isAntiAlias = true;

    double x = (mWidth + dataController.paddingLeft) - curX;
    double y = selectPoint.dy;

    // k线图竖线
    canvas.drawDashLine(
      Offset(selectPoint.dx, ChartStyle.topPadding),
      Offset(selectPoint.dx, size.height - ChartStyle.bottomDateHigh),
      lineWidth: 1,
      color: Colors.grey.shade700,
    );
    // k线图横线
    canvas.drawDashLine(
      Offset(dataController.paddingLeft, y),
      Offset(mWidth + dataController.paddingLeft, y),
      lineWidth: 1,
      color: Colors.grey.shade700,
    );

    if (BacktestManager.shared.isEnable && point.date.compareTo(BacktestManager.shared.startDate) > 0) {
    } else {
      var close = mainChartRenderer?.getY(point.close) ?? 0;
      canvas.drawCircle(Offset(x, close), 2.0, paintXY);
    }

    drawLongPressCrossLineText(canvas, size, y, x, point);

    mainChartRenderer?.drawLongPressIndicatorText(canvas, index);

    indicatorChartRendererMap.forEach((key, value) {
      value.drawLongPressCrossLineText(canvas, index, key, dataController);
    });
  }

  Paint selectPointPaint = Paint()
    ..isAntiAlias = true
    ..strokeWidth = 0.5
    ..color = JKStyle.theme.dividerColorStrong;
  Paint selectorBorderPaint = Paint()
    ..isAntiAlias = true
    ..strokeWidth = 0.5
    ..style = PaintingStyle.stroke
    // ..color = Colors.red;
    ..color = JKStyle.theme.dividerColor;

  void drawLongPressCrossLineText(Canvas canvas, Size size, double y, double curX, KLineEntity entity) {
    double padding = 3;
    bool isLeft = curX > mWidth / 2;
    // 主图Y
    if (mainChartRenderer!.chartRect.height > y) {
      var value = mainChartRenderer?.getValue(y) ?? 0;
      drawText(String text, Color color, {bool isLeft = true}) {
        TextPainter tp = getTextPainter(text, TextStyle(color: color, fontSize: 12));
        double textWidth = tp.width;
        var x = isLeft ? 2.0 + textWidth : mWidth + dataController.paddingLeft + dataController.paddingRight;
        var bgX = isLeft ? 0.0 : mWidth + dataController.paddingLeft;
        var bgWid = isLeft ? dataController.paddingLeft : dataController.paddingRight;
        var dateRect = Rect.fromLTWH(bgX, y - 11, bgWid, 22);
        canvas.drawRRect(RRect.fromRectAndRadius(dateRect, const Radius.circular(2)), selectPointPaint);
        canvas.drawRRect(RRect.fromRectAndRadius(dateRect, const Radius.circular(2)), selectorBorderPaint);
        tp.paint(canvas, Offset(x - textWidth, y - tp.height / 2));
      }

      var text = "";
      var color = JKStyle.theme.white;
      var lastClose = entity.preClose;
      if (dataController.stockTime.isTickTime) {
        lastClose = dataController.currentStock.datas.first.preClose;
      } else {
        lastClose = dataController.currentStock.datas[dataController.currentStock.datas.length - mStopIndex].close;
      }
      switch (dataController.yAxisType) {
        case JKYAxisType.percent:
          var p = (value - lastClose) / lastClose * 100;
          color = p > 0 ? JKStyle.riseColor : JKStyle.fallColor;
          text = "${p.toStringAsFixed(2)}%";
          drawText(text, color, isLeft: false);
          break;
        case JKYAxisType.both:
          var p = (value - lastClose) / lastClose * 100;
          color = p > 0 ? JKStyle.riseColor : JKStyle.fallColor;
          text = "${p.toStringAsFixed(2)}%";
          drawText(value.toStringAsFixed(3), color, isLeft: true);
          drawText(text, color, isLeft: false);
          break;
        default:
          text = value.toStringAsFixed(3);
          drawText(text, color, isLeft: false);
      }
    }

    // else if (mainChartRenderer!.chartRect.height +
    //         secondaryChartRenderer!.chartRect.height +
    //         ChartStyle.bottomDateHigh >
    //     y) {
    //   var value = secondaryChartRenderer!.getValue(y);
    //   if (value.isFinite) {
    //     var str = value.toStringAsFixed(3);
    //     var offsetX = 0;
    //     const t = 0.6;

    //     if (dataController.secondaryIndicator.name == "海底捞月") {
    //       str = "历史大底";
    //       offsetX = -10;
    //       if (value <= 30 * t) {
    //         str = "小底";
    //         offsetX = 0;
    //       } else if (value <= 60 * t) {
    //         str = "中底";
    //         offsetX = 0;
    //       } else if (value <= 90 * t) {
    //         str = "大底";
    //         offsetX = 0;
    //       } else if (value <= 150 * t) {
    //         str = "超大底";
    //         offsetX = 0;
    //       }
    //     }

    //     canvas.drawText(str, Offset(mWidth + 8 + offsetX, y - 8), JKStyle.theme.white, 12,
    //         backgroundColor: const Color.fromARGB(255, 255, 0, 102));
    //   }
    // }

    var date = entity.date;
    if (dataController.stockTime.rawValue.item1 < 1440) {
      if (date.length >= 16) {
        date = date.substring(0, 16);
      }
    } else if (date.length >= 10) {
      date = date.substring(0, 10);
      DateTime dateTime = DateTime.parse(date);
      var weeks = ["周一", "周二", "周三", "周四", "周五", "周六", "周日"];
      var week = weeks[dateTime.weekday - 1];
      date = "$date $week";
    }

    TextPainter dateTp = getTextPainter(date, TextStyle(color: JKStyle.theme.white, fontSize: 12));
    var dateRect = Rect.fromLTRB(curX - dateTp.width / 2 - padding, size.height - ChartStyle.bottomDateHigh,
        curX + dateTp.width / 2 + padding, size.height);
    canvas.drawRRect(RRect.fromRectAndRadius(dateRect, const Radius.circular(2)), selectPointPaint);
    canvas.drawRRect(RRect.fromRectAndRadius(dateRect, const Radius.circular(2)), selectorBorderPaint);
    dateTp.paint(
        canvas,
        Offset(curX - dateTp.width / 2,
            size.height - ChartStyle.bottomDateHigh + ChartStyle.bottomDateHigh / 2 - dateTp.height / 2));

    //长按显示这条数据详情
    sink.add(InfoWindowEntity(entity, isLeft));
  }

  //根据x的位置计算index
  double getIndex(double x) {
    return (mWidth + dataController.paddingLeft - startX - x) / candleWidth + mStartIndex;
  }

  //判断下标是否越界
  bool outRangeIndex(int index) {
    if (index < 0 || index >= datas.length) {
      return true;
    } else {
      return false;
    }
  }

  @override
  bool shouldRepaint(CustomPainter oldDelegate) {
    return true;
  }
}

class DrawInfo {
  List<double> begins = [];
  List<double> ends = [];
  List<dynamic> infos = [];
  List<dynamic> lastInfo = [];
}
