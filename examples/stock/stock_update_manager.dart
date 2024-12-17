import 'dart:async';
import 'dart:math';
import 'package:flutter/material.dart';
import 'package:mgjkn/debug.dart';
import 'package:mgjkn/desktop/jk_style.dart';
import 'package:mgjkn/notification.dart';
import 'package:mgjkn/model/model.dart';
import 'package:mgjkn/network/websocket.dart';
import 'package:mgjkn/Util/utils.dart';
import 'package:mgjkn/widgets/jktable.dart';
import 'package:mgjkn/widgets/widget.dart';
import 'package:mgjkn/desktop/logger.dart';
import 'package:timezone/timezone.dart';

class StockUpdateManager {
  StockUpdateManager._();

  static StockUpdateManager? _instance;
  static StockUpdateManager get shared {
    _instance ??= StockUpdateManager._();
    return _instance!;
  }

  Map<String, Set<int>> subscribeStocks = {};
  Map<String, Set<int>> subscribePlates = {};
  Map<String, Set<int>> subscribeVols = {};
  subscribeStock(String code, int hashcode, {market = false}) {
    if (code.isEmpty) return;
    var current = subscribeStocks[code] ?? {};
    current.add(hashcode);
    subscribeStocks[code] = current;
    JKWebsocket.shared.sendSubscribe(codes: [code]);
  }

  unSubscribeStock(String code, int hashcode) {
    if (code.isEmpty) return;
    var current = subscribeStocks[code] ?? {};
    current.remove(hashcode);
    subscribeStocks[code] = current;
    if (current.isEmpty) {
      subscribeStocks.remove(code);
      JKWebsocket.shared.sendUnsubscribe(codes: [code]);
    } else {
      logger.d("unSubscribe break: $code", wirteFile: false);
    }
  }

  subscribePlate(String plateId, int hashcode) {
    if (plateId.isEmpty) return;
    var l = subscribePlates[plateId] ?? {};
    l.add(hashcode);
    subscribePlates[plateId] = l;
    JKWebsocket.shared.sendSubscribe(plate: [plateId]);
  }

  unSubscribePlate(String plateId, int hashcode) {
    if (plateId.isEmpty) return;
    var current = subscribePlates[plateId] ?? {};
    current.remove(hashcode);
    subscribePlates[plateId] = current;
    if (current.isEmpty) {
      subscribePlates.remove(plateId);
      JKWebsocket.shared.sendUnsubscribe(plate: plateId);
    } else {
      logger.d("unSubscribe break: $plateId", wirteFile: false);
    }
  }

  subscribeVol(String code, int hashcode) {
    if (code.isEmpty) return;
    var l = subscribeVols[code] ?? {};
    l.add(hashcode);
    subscribeVols[code] = l;
    JKWebsocket.shared.sendSubscribe(vol: code);
  }

  unSubscribeVol(String code, int hashcode) {
    if (code.isEmpty) return;
    var l = subscribeVols[code] ?? {};
    l.remove(hashcode);
    subscribeVols[code] = l;
    if (l.isEmpty) {
      subscribeVols.remove(code);
      JKWebsocket.shared.sendUnsubscribe(vol: code);
    } else {
      logger.d("unSubscribe Vol break: $code", wirteFile: false);
    }
  }

  var preMarketPrices = {};
  var marketPrices = {};
  var postMarketPrices = {};
  List<dynamic>? getLatestData(JKMarketState marketState, String stockCode) {
    switch (marketState) {
      case JKMarketState.preMarket:
        return preMarketPrices[stockCode];
      case JKMarketState.market:
        return marketPrices[stockCode];
      case JKMarketState.postMarket:
        return postMarketPrices[stockCode];
    }
  }

  updateLatestData(String stockCode, List data,
      {dynamic chanData, List replaceData = const [], dynamic debugData, String debugCount = ""}) {
    var state = Utils.currentMarketState;
    var enableDelay = true;
    String time = data[0];
    if (Debug.usePushMarketTime == 1 && time.length == 19) {
      DateTime? dataTime = DateTime.tryParse(time);
      if (dataTime != null) {
        var pushTime = TZDateTime(
            Utils.locationNewYork, dataTime.year, dataTime.month, dataTime.day, dataTime.hour, dataTime.minute, 0);
        // 盘前中后夜的最后一分钟不做延迟
        if (dataTime.hour == 9 && dataTime.minute == 29) {
          enableDelay = false;
        } else if (dataTime.hour == 15 && dataTime.minute == 59) {
          enableDelay = false;
        } else if (dataTime.hour == 19 && dataTime.minute == 59) {
          enableDelay = false;
        } else if (dataTime.hour == 3 && dataTime.minute == 59) {
          enableDelay = false;
        }
        state = Utils.getMarketState(time: pushTime);
      }
    }

    switch (state) {
      case JKMarketState.preMarket:
        preMarketPrices[stockCode] = data;
        break;
      case JKMarketState.market:
        marketPrices[stockCode] = data;
        break;
      case JKMarketState.postMarket:
        postMarketPrices[stockCode] = data;
        break;
    }

    // 自定义延迟,不要同时更新
    double delay = enableDelay ? Random().nextDouble() * 500.0 : 1;
    Future.delayed(Duration(milliseconds: delay.toInt())).then((value) {
      eventBus.fire(StockDataUpdateEvent(
        stockCode: stockCode,
        latestData: data,
        chanData: chanData,
        debugData: debugData,
        debugCount: debugCount,
        replaceData: replaceData,
        eventMarketState: state,
      ));
    });
  }
}

class StockDataTrackerWidget extends StatefulWidget {
  final String stockCode;
  final String stockName;
  final List initMarketData;
  final List initPreMarketData;
  final List initPostMarketData;
  final Widget Function(BuildContext, List, List, List, JKMarketState) builder;
  final Function(List, List, JKMarketState)? onUpdate;

  const StockDataTrackerWidget({
    required this.stockCode,
    required this.stockName,
    required this.initMarketData,
    required this.builder,
    this.onUpdate,
    this.initPreMarketData = const [],
    this.initPostMarketData = const [],
    super.key,
  });

  @override
  State<StockDataTrackerWidget> createState() => _StockDataTrackerWidgetState();
}

class _StockDataTrackerWidgetState extends State<StockDataTrackerWidget> with WidgetsBindingObserver {
  late List preData;
  late List marketData;
  late List afterData;
  late StreamSubscription<StockDataUpdateEvent> eBus;
  JKMarketState eventMarketState = Utils.currentMarketState;
  @override
  void initState() {
    preData = widget.initPreMarketData;
    marketData = widget.initMarketData;
    afterData = widget.initPostMarketData;
    eBus = eventBus.on<StockDataUpdateEvent>().listen((event) {
      if (mounted && event.stockCode == widget.stockCode) {
        eventMarketState = event.eventMarketState ?? Utils.currentMarketState;
        widget.onUpdate?.call(marketData, event.latestData, eventMarketState);

        switch (eventMarketState) {
          case JKMarketState.preMarket:
            preData = event.latestData;
            break;
          case JKMarketState.postMarket:
            afterData = event.latestData;
            break;
          case JKMarketState.market:
            marketData = event.latestData;
            break;
        }
        setState(() {});
      }
    });
    StockUpdateManager.shared.subscribeStock(widget.stockCode, hashCode);
    super.initState();
  }

  @override
  void deactivate() {
    super.deactivate();
    StockUpdateManager.shared.unSubscribeStock(widget.stockCode, hashCode);
    eBus.cancel();
  }

  @override
  void dispose() {
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    eventMarketState = Utils.currentMarketState;
    if (preData.isEmpty) {
      preData = widget.initPreMarketData;
    }
    if (marketData.isEmpty) {
      marketData = widget.initMarketData;
    }
    if (afterData.isEmpty) {
      afterData = widget.initPostMarketData;
    }
    return widget.builder(context, preData, marketData, afterData, eventMarketState);
  }
}

class StockUpdateRowWidget extends StatefulWidget {
  final JKBaseStockItem initData;
  final Map<String, dynamic>? initJson;
  final int tableIndex;
  final List<double> clounmWidth;
  final List<JKTableColumn> columns;
  final List Function(BuildContext, JKBaseStockItem, List<dynamic>, List<dynamic>, List<dynamic>, int) cellBuilder;
  final List Function(BuildContext, Map<String, dynamic>, List<dynamic>, List<dynamic>, List<dynamic>, int)?
      jsonBuilder;
  final double rowHeight;

  const StockUpdateRowWidget({
    required this.initData,
    required this.cellBuilder,
    required this.tableIndex,
    required this.clounmWidth,
    required this.rowHeight,
    this.columns = const [],
    this.initJson,
    this.jsonBuilder,
    super.key,
  });

  final flashCount = 0;

  @override
  _StockUpdateRowWidgetState createState() => _StockUpdateRowWidgetState();
}

class _StockUpdateRowWidgetState extends State<StockUpdateRowWidget> with SingleTickerProviderStateMixin {
  var compareState = 0;

  @override
  Widget build(BuildContext context) {
    var code = widget.initData.code;
    var name = widget.initData.name;
    return StockDataTrackerWidget(
        stockCode: code,
        stockName: name,
        initMarketData: widget.initData.stock,
        initPreMarketData: widget.initData.extend.stockBefore,
        initPostMarketData: widget.initData.extend.stockAfter,
        key: ValueKey(code),
        builder: (ctx, pre, market, aft, marketState) {
          List cellItem;
          if (widget.initJson != null) {
            cellItem = widget.jsonBuilder!.call(context, widget.initJson!, pre, market, aft, widget.tableIndex);
          } else {
            cellItem = widget.cellBuilder.call(context, widget.initData, pre, market, aft, widget.tableIndex);
          }
          List<Widget> cell = [];
          for (var i = 0; i < cellItem.length; i++) {
            JKTableColumn column = widget.columns[i];
            JKTableRow item = cellItem[i];
            Widget w;
            // 最后一栏padding right 5px ,不让滚动条阻挡
            var wid = widget.clounmWidth[i];
            var child = item.child;
            if ((child is JKFlash) == false) {
              if (column.alignment == Alignment.centerLeft) {
                child = Padding(padding: EdgeInsets.only(left: column.padding), child: child);
              } else if (column.alignment == Alignment.centerRight) {
                child = Padding(padding: EdgeInsets.only(right: column.padding), child: child);
              }
            }

            w = Container(
              height: widget.rowHeight,
              width: wid,
              decoration:
                  BoxDecoration(border: Border(right: BorderSide(color: JKStyle.theme.tableDividerColor, width: 0.5))),
              child: Align(alignment: column.alignment, child: child),
            );
            if (item.ignoreTap) {
              w = GestureDetector(
                  behavior: HitTestBehavior.opaque,
                  onTap: () {
                    logger.d("ignoreTapignoreTapignoreTap");
                  },
                  child: w);
            }
            cell.add(w);
          }

          return Row(children: cell);
        });
  }
}

class JKPlateUpdateRow extends StatefulWidget {
  const JKPlateUpdateRow(
      {required this.initData,
      required this.clounmWidth,
      required this.columns,
      required this.rowHeight,
      this.jsonBuilder,
      required this.tableIndex,
      super.key});
  final List Function(BuildContext, Map<String, dynamic>, String, String, int)? jsonBuilder;
  final Map<String, dynamic> initData;
  final int tableIndex;
  final List<double> clounmWidth;
  final List<JKTableColumn> columns;
  final double rowHeight;

  @override
  State<JKPlateUpdateRow> createState() => _JKPlateUpdateRowState();
}

class _JKPlateUpdateRowState extends State<JKPlateUpdateRow> {
  var eBus;
  var percent = "";
  var amount = "";

  @override
  void initState() {
    super.initState();
    percent = widget.initData["change"].toString();
    amount = widget.initData["amount"].toString();
    eBus = eventBus.on<PlatePercentChangeEvent>().listen((event) {
      if (mounted && event.plateId == widget.initData["id"]) {
        percent = event.percent;
        amount = event.vol;
        setState(() {});
      }
    });
    StockUpdateManager.shared.subscribePlate(widget.initData["id"], hashCode);
  }

  @override
  void dispose() {
    super.dispose();
    eBus.cancel();
    StockUpdateManager.shared.unSubscribePlate(widget.initData["id"], hashCode);
  }

  @override
  Widget build(BuildContext context) {
    List cellItem = widget.jsonBuilder!.call(context, widget.initData, percent, amount, widget.tableIndex);

    List<Widget> cell = [];
    for (var i = 0; i < cellItem.length; i++) {
      JKTableColumn column = widget.columns[i];
      JKTableRow item = cellItem[i];
      Widget w;
      // 最后一栏padding right 5px ,不让滚动条阻挡
      var wid = widget.clounmWidth[i];
      var child = item.child;
      if ((child is JKFlash) == false) {
        if (column.alignment == Alignment.centerLeft) {
          child = Padding(padding: EdgeInsets.only(left: column.padding), child: child);
        } else if (column.alignment == Alignment.centerRight) {
          child = Padding(padding: EdgeInsets.only(right: column.padding), child: child);
        }
      }

      w = Container(
        height: widget.rowHeight,
        width: wid,
        decoration:
            BoxDecoration(border: Border(right: BorderSide(color: JKStyle.theme.tableDividerColor, width: 0.5))),
        child: Align(alignment: column.alignment, child: child),
      );
      if (item.ignoreTap) {
        w = GestureDetector(
            behavior: HitTestBehavior.opaque,
            onTap: () {
              logger.d("ignoreTapignoreTapignoreTap");
            },
            child: w);
      }
      cell.add(w);
    }

    return Row(children: cell);
  }
}
