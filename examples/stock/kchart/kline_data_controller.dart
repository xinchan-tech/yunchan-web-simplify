import 'dart:math';

import 'package:mgjkn/desktop/script_community/editor/script_painter.dart';
import 'package:mgjkn/desktop/logger.dart';
import 'package:mgjkn/desktop/stock/chan_data_manager.dart';
import 'package:mgjkn/desktop/stock/kchart/entity/k_line_entity.dart';
import 'package:mgjkn/desktop/stock/kchart/indicator/indicator_menu.dart';
import 'package:mgjkn/desktop/stock/kchart/state_enum.dart';
import 'package:mgjkn/desktop/stock/panit/paint_manager.dart';
import 'package:mgjkn/desktop/stock/stock_data_manager.dart';
import 'package:mgjkn/notification.dart';
import 'package:mgjkn/network/network.dart';
import 'package:flutter/material.dart';
import 'package:mgjkn/widgets/widget.dart';

enum JKYAxisType { price, percent, both }

enum JKMainLineType { candle, kline }

enum JKChartGridType {
  minute,
  minute30,
  hour,
  halfHour,
  day,
  mouth,
  year,
  year5
}

class KLineDataController extends ChangeNotifier {
  final String frameId;
  late JKStockDataEntity currentStock;

  String stockCode;
  String stockName;
  JKStockTimeType stockTime = JKStockTimeType.day;
  Offset mouseLocation = Offset.zero;

  var infoEventData = [];
  Map<String, List> infoEventMaps = {};

  setInfoEvent(String name, String key,
      {bool isBasic = false, String eventType = ""}) {
    if (infoEventMaps.keys.contains(name)) {
      infoEventMaps.remove(name);
    } else {
      infoEventMaps.clear();
      infoEventMaps[name] = [];
      if (isBasic) {
        network
            .getEventDateList(stockCode: currentStock.stockCode, type: key)
            .then((res) {
          if (res.success) {
            var l = (res.json["data"][key] as List).map((e) {
              String date = e["date"];
              date = date.split(" ").first;
              return "$date 00:00:00";
            }).toList();
            if (infoEventMaps[name] != null) {
              infoEventMaps[name] = l;
            }
            refreshCanvas();
          }
        });
      } else {
        network
            .getInfoEventHistory(
                stockCode: stockCode, eventNames: [key], eventType: eventType)
            .then((res) {
          if (res.success) {
            var l = (res.json["data"][eventType] as List).map((e) {
              String date = e["date"];
              date = date.split(" ").first;
              return "$date 00:00:00";
            }).toList();
            if (infoEventMaps[name] != null) {
              infoEventMaps[name] = l;
            }
            refreshCanvas();
          }
        });
      }
    }
    refreshCanvas();
  }

  setStockInfo({String code = "", String name = "", JKStockTimeType? time}) {
    if (code.isNotEmpty && code != stockCode) {
      currentStock.distroy();
      stockCode = code;
      stockName = name;
      stockTime = time ?? stockTime;
      currentStock = JKStockDataEntity(
        stockCode: code,
        stockTime: stockTime,
        color: Colors.transparent,
        onRefresh: () {
          // print("xxxxx: onRefreshonRefresh3333");
          refreshIndicator();
          refreshCanvas();
        },
      );
      currentStock.getDatasAndSubscribe(getPaint: true);
      currentStock.getPriceAlarmList();
      currentStock.getAIAlarmList();
      // currentStock.getInfoEventList();

      scrollX = 0;
      paintManager.currentPaint = null;
    } else if (time != null) {
      stockTime = time;
      currentStock.setStockTime(time);
      compareStocks.forEach((_, item) {
        item.setStockTime(time);
      });

      yAxisType = time.isTickTime ? JKYAxisType.both : JKYAxisType.price;
      candleWidth = 8.5;
      scrollX = 0;
    }
    refreshIndicator();
    resetGridType();
    refreshCanvas();
  }

  /// 是否显示画线
  bool showPaint = true;

  /// 是否连续画线
  bool paintContinue = false;

  JKYAxisType _yAxisType = JKYAxisType.price;

  JKYAxisType get yAxisType => _yAxisType;

  set yAxisType(JKYAxisType type) {
    _yAxisType = type;
    if (type == JKYAxisType.both) {
      paddingLeft = 50.0;
    } else {
      paddingLeft = 0.0;
    }
  }

  /// 是否跨周期显示画线
  bool isCrossPaint = false;

  /// K线图内容左右边距
  double paddingRight = 50.0, paddingLeft = 0.0;

  /// 显示蜡烛图?
  JKMainLineType _mainLineType = JKMainLineType.candle;

  JKMainLineType get mainLineType {
    if (stockTime.isTickTime) {
      return JKMainLineType.kline;
    }
    return _mainLineType;
  }

  set mainLineType(JKMainLineType type) {
    _mainLineType = type;
  }

  void refreshCanvas() {
    notifyListeners();
    eventBus.fire(StockDataChangeEvent());
  }

  /// 处理推送的股票详情
  double lastOpenValue = -1;
  double lastHighValue = -1;
  double lastLowValue = -1;
  var marketOpenDayMin = 0;
  var dataEmptyKeyData = {};

  late PaintManager paintManager;

  //默认蜡烛宽度
  double _candleWidth = 8;
  double get candleWidth => _candleWidth;
  set candleWidth(double width) {
    _candleWidth = width;
    debugPrint("_candleWidth: $_candleWidth");
    resetGridType();
    // if (width < 2.5) {
    //   var oldIndex = JKChartGridType.values.indexOf(gridType);
    //   gridType = JKChartGridType.values.safeAt(oldIndex + 1) ?? gridType;
    // }
  }

  // 分割线类型
  JKChartGridType gridType = JKChartGridType.mouth;
  resetGridType() {
    switch (stockTime) {
      case JKStockTimeType.time5:
        gridType = JKChartGridType.day;
        break;
      case JKStockTimeType.time:
      case JKStockTimeType.timePre:
      case JKStockTimeType.timeAft:
        gridType = JKChartGridType.minute30;
        break;
      case JKStockTimeType.month6:
      case JKStockTimeType.year:
        gridType = JKChartGridType.year5;
        break;
      case JKStockTimeType.quarter:
      case JKStockTimeType.month:
        gridType = JKChartGridType.year;
        break;
      case JKStockTimeType.week:
        gridType = JKChartGridType.mouth;
        if (_candleWidth < 11) gridType = JKChartGridType.year;
        if (_candleWidth < 1) gridType = JKChartGridType.year5;
        break;
      case JKStockTimeType.day:
        gridType = JKChartGridType.mouth;
        if (_candleWidth < 3) gridType = JKChartGridType.year;
        break;
      case JKStockTimeType.hour4:
      case JKStockTimeType.hour3:
        gridType = JKChartGridType.day;
        if (_candleWidth < 18) gridType = JKChartGridType.mouth;
        if (_candleWidth < 2) gridType = JKChartGridType.year;
        break;
      case JKStockTimeType.hour2:
        gridType = JKChartGridType.day;
        if (_candleWidth <= 12) gridType = JKChartGridType.mouth;
        if (_candleWidth < 1) gridType = JKChartGridType.year;
        break;
      case JKStockTimeType.hour1:
        gridType = JKChartGridType.day;
        if (_candleWidth < 8) gridType = JKChartGridType.mouth;
        break;
      case JKStockTimeType.min30:
      case JKStockTimeType.min45:
        gridType = JKChartGridType.day;
        if (_candleWidth < 4) gridType = JKChartGridType.mouth;
        break;
      case JKStockTimeType.min10:
      case JKStockTimeType.min15:
        gridType = JKChartGridType.hour;
        if (_candleWidth < 10) gridType = JKChartGridType.day;
        if (_candleWidth < 2) gridType = JKChartGridType.mouth;
        break;
      case JKStockTimeType.min3:
      case JKStockTimeType.min5:
        gridType = JKChartGridType.halfHour;
        if (_candleWidth < 9) gridType = JKChartGridType.halfHour;
        if (_candleWidth < 7) gridType = JKChartGridType.hour;
        if (_candleWidth < 3) gridType = JKChartGridType.day;

        break;
      case JKStockTimeType.min1:
      case JKStockTimeType.min2:
        gridType = JKChartGridType.minute;
        if (_candleWidth < 7) gridType = JKChartGridType.minute30;
        if (_candleWidth < 2) gridType = JKChartGridType.hour;
        if (_candleWidth < 1) gridType = JKChartGridType.day;
        break;
    }
  }

  double mDisplayHeight = 0;
  var mStartIndex = 0;
  var mStopIndex = 0;
  double startX = 0;
  double mWidth = 0;
  double scaleY = 0;
  double maxValue = 0;
  double mainRectTop = 0;

  double _scrollX = 0;
  double maxScroll = 0;
  double minScroll = 0;

  //根据x的位置计算index
  double indexFromX(double x) {
    double index = (mWidth - startX - x) / candleWidth + mStartIndex;
    return index;
  }

  double xFromIndex(double index) {
    double itemWidth = candleWidth;
    return -((index - mStartIndex) * (itemWidth) -
        mWidth +
        startX +
        itemWidth * 0.5);
  }

  String valueFromY(double y) =>
      (maxValue - (y - mainRectTop) / scaleY).toString();

  double yFromValue(String value) =>
      scaleY * (maxValue - double.parse(value)) + mainRectTop;

  double get scrollX => _scrollX;
  set scrollX(double value) {
    _scrollX = value;
  }

  List<Color> overlayColors = [
    Colors.amberAccent,
    Colors.blueAccent,
    Colors.pinkAccent,
    Colors.deepPurpleAccent,
    Colors.cyanAccent,
    Colors.deepOrangeAccent,
  ];

  // 股票比较
  final Map<String, JKStockDataEntity> compareStocks = {};
  removeCompareStock(String code) {
    var item = compareStocks[code];
    if (item != null) {
      overlayColors.add(item.color);
      item = compareStocks.remove(code);
      item?.distroy();
      refreshCanvas();
    }
  }

  addCompareStock(String code) {
    if (code == currentStock.stockCode) {
      showToast("相同股票不能进行PK");
      return;
    }
    var item = compareStocks[code];
    if (item == null) {
      yAxisType = JKYAxisType.percent;
      var color = overlayColors.removeAt(0);
      var item = JKStockDataEntity(
          stockCode: code,
          stockTime: stockTime,
          color: color,
          onRefresh: () {
            print("xxxxx: onRefreshonRefresh22222");
            refreshCanvas();
          });
      item.getDatasAndSubscribe(getPaint: false);
      compareStocks[code] = item;
    }
  }

  // 事件标记
  final Set<String> evenState = {};
  changeEvenState(String state) {
    if (evenState.contains(state)) {
      evenState.remove(state);
    } else {
      evenState.add(state);
    }
    refreshCanvas();
  }

  bool get hasChanMenu {
    return hasBasicChanMenu || hasProChanMenu;
  }

  bool get hasBasicChanMenu {
    return mainIndicator.contains(chanBasic);
  }

  bool get hasProChanMenu {
    return mainIndicator.contains(chanPro);
  }

// 主图指标
  final Set<IndicatorItem> mainIndicator = {};
  final chanDataIndicator = {
    "1": ChanDataIndicator.pen.info.$2,
    "2": ChanDataIndicator.pivot.info.$2,
    "227": ChanDataIndicator.class1.info.$2,
    "228": ChanDataIndicator.class2.info.$2,
    "229": ChanDataIndicator.class3.info.$2,
    "230": ChanDataIndicator.pivotPrice.info.$2,
    "231": ChanDataIndicator.pivotSection.info.$2,
    "232": ChanDataIndicator.reversal.info.$2,
    "233": ChanDataIndicator.showOverlap.info.$2,
    "234": ChanDataIndicator.shortLine.info.$2,
    "235": ChanDataIndicator.mainTrend.info.$2,
  };

  final chanBasic = IndicatorItem(name: "标准版", id: "basic", dbType: "local");
  final chanPro = IndicatorItem(name: "专业版", id: "pro", dbType: "local");
  setMainIndicator(IndicatorItem item) {
    if (mainIndicator.contains(item)) {
      mainIndicator.remove(item);
      if (item == chanBasic || item == chanPro) {
        mainIndicator.removeWhere((element) {
          return chanDataIndicator[element.id] != null;
        });
      }
    } else {
      mainIndicator.add(item);

      if (item == chanBasic || item == chanPro) {
        mainIndicator.removeAll(chanDataIndicator.values);
        mainIndicator.remove(item == chanBasic ? chanPro : chanBasic);
        // 添加默认的参数
        for (var i in item.items) {
          if (["1", "2", "227", "228", "229"].contains(i.id)) {
            var id = chanDataIndicator[i.id];
            if (id != null) {
              mainIndicator.add(id);
            }
          }
        }
      }

      if (item.dbType != "local") {
        item.getData(currentStock, onResult: () {
          refreshCanvas();
        });
      }
    }
    refreshCanvas();
  }

  // 设置附图参数

  Map<String, IndicatorItem>? _indicatorChartMap;
  Map<String, IndicatorItem> get indicatorChartMap {
    if (_indicatorChartMap == null) {
      _indicatorChartMap = {};
      var m = CacheManager.shared.storage.getMap('indicatorChartHistory');
      if (m == null) {
        m = {};
        m["1"] = {
          "name": "底部信号",
          "id": "9",
          "type": "2",
          "value": "trade_hdly"
        };
        m["2"] = {
          "name": "买卖点位",
          "id": "10",
          "type": "2",
          "value": "trade_point"
        };
      }
      m.forEach((key, value) {
        _indicatorChartMap?[key] = IndicatorItem.fromJson(value);
      });
    }
    return _indicatorChartMap!;
  }

  set indicatorChartMap(Map<String, IndicatorItem> value) {
    _indicatorChartMap = value;
    Map<String, dynamic> saveMap = {};
    value.forEach((key, value) {
      saveMap[key] = value.toJson();
    });
    CacheManager.shared.storage.setMap('indicatorChartHistory', saveMap);
  }

  setIndicatorChart(String id, IndicatorItem item) {
    indicatorChartMap[id] = item;
    indicatorChartMap = indicatorChartMap;
    refreshCanvas();
    item.getData(currentStock, onResult: () {
      refreshCanvas();
    });
  }

  // 是否多屏显示
  bool _isMulSelected = false;
  bool get isMulSelected {
    return _isMulSelected;
  }

  // configChartMaxMinInfo(double chartWidth) {
  //   // 所有K线绘制的总长度
  //   var dataLength = currentStock.datas.length * candleWidth;
  //   // canvas显示的宽度
  //   var canvasWidth = chartWidth - paddingRight - paddingLeft;

  //   if (dataLength > chartWidth) {
  //     maxScroll = dataLength - canvasWidth;
  //   } else {
  //     maxScroll = -(canvasWidth - dataLength);
  //   }
  //   var datsScroll = canvasWidth - dataLength;
  //   var normalminScroll = -(canvasWidth * 0.85) + candleWidth / 2;
  //   minScroll = min(normalminScroll, -datsScroll);
  // }

  setMulSelected(bool isSelected, {bool notify = true}) {
    _isMulSelected = isSelected;
    logger.d("当前选择 frame : $frameId  $isSelected");
    if (notify) {
      refreshCanvas();
    }
  }

  KLineDataController(
      {required this.frameId,
      this.stockCode = "",
      this.stockName = "",
      this.stockTime = JKStockTimeType.day}) {
    paintManager = PaintManager(dataController: this);
    currentStock = JKStockDataEntity(
        stockCode: stockCode,
        stockTime: stockTime,
        color: Colors.transparent,
        onRefresh: () {
          print("xxxxx: onRefreshonRefresh 11111");
          refreshIndicator();
          refreshCanvas();
        });
    if (stockCode.isNotEmpty) {
      currentStock.getDatasAndSubscribe(getPaint: true);
      currentStock.getPriceAlarmList();
      currentStock.getAIAlarmList();
    }
    network.mainInfoEvent(onResult: (ResultData res) {
      if (res.success) {
        infoEventData = res.json["data"] ?? [];
      }
    });
  }

  var scriptIndicatorData = [];
  getScriptDevData(String script) {
    if (script.isEmpty) return;
    scriptIndicatorData.clear();
    ScriptPainter.ploylineDatasCache.clear();
    ScriptPainter.drawLineDatasCache.clear();
    network.scriptData(stockCode, script).then((res) {
      scriptIndicatorData = res.json["data"]["result"];
      refreshCanvas();
    });
  }

  void refreshIndicator() {
    if (mainIndicator.isNotEmpty) {
      for (IndicatorItem item in mainIndicator) {
        if (item.type == "local") continue;
        item.getData(currentStock, onResult: () {
          refreshCanvas();
        });
      }
    }

    indicatorChartMap.forEach((key, value) {
      if (value.isNotEmpty) {
        value.getData(currentStock, onResult: () {
          refreshCanvas();
        });
      }
    });
  }
}

class KLineDataWidgetController extends StatefulWidget {
  const KLineDataWidgetController(
      {super.key, required this.child, required this.dataController});

  final Widget child;
  final KLineDataController dataController;

  static KLineDataController of(BuildContext context) {
    final _KLineControllerScope scope =
        context.dependOnInheritedWidgetOfExactType<_KLineControllerScope>()
            as _KLineControllerScope;
    return scope.controller;
  }

  @override
  State<StatefulWidget> createState() => _KLineDataWidgetControllerState();
}

class _KLineDataWidgetControllerState extends State<KLineDataWidgetController> {
  late KLineDataController _controller;

  @override
  void initState() {
    super.initState();
    _controller = widget.dataController;
    _controller.currentStock.subscribeStock();
    _controller.addListener(_onController);
  }

  void _onController() {
    // logger.d("_onController : ${_controller.isMulSelected}");
    setState(() {});
  }

  @override
  Widget build(BuildContext context) {
    return _KLineControllerScope(
      controller: _controller,
      child: widget.child,
    );
  }

  @override
  void dispose() {
    _controller.removeListener(_onController);
    widget.dataController.currentStock.unSubscribeStock();
    widget.dataController.compareStocks.forEach((key, item) {
      item.distroy();
    });
    widget.dataController.compareStocks.clear();
    super.dispose();
  }
}

class _KLineControllerScope extends InheritedWidget {
  final KLineDataController controller;

  const _KLineControllerScope({required this.controller, required super.child});

  @override
  bool updateShouldNotify(_KLineControllerScope oldWidget) {
    return true; //  controller != oldWidget.controller;
  }
}
