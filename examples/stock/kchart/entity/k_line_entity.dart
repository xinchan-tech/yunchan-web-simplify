import 'dart:async';
import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:mgjkn/debug.dart';
import 'package:mgjkn/desktop/alarm_widget/stock_alarm_popup.dart';
import 'package:mgjkn/desktop/logger.dart';
import 'package:mgjkn/desktop/stock/chan_data_manager.dart';
import 'package:mgjkn/desktop/stock/kchart/state_enum.dart';
import 'package:mgjkn/desktop/stock/kchart/utils/data_util.dart';
import 'package:mgjkn/desktop/stock/panit/base_paint.dart';
import 'package:mgjkn/desktop/stock/panit/paint_enum.dart';
import 'package:mgjkn/desktop/stock/stock_data_manager.dart';
import 'package:mgjkn/desktop/stock/stock_update_manager.dart';
import 'package:mgjkn/extensions/extension_widget.dart';
import 'package:mgjkn/model.dart';
import 'package:mgjkn/network/network.dart';
import 'package:mgjkn/notification.dart';
import 'package:mgjkn/Util/utils.dart';
import 'package:mgjkn/Util/date_utils.dart' as dateUtils;
import 'package:mgjkn/widgets/widget.dart';

class KLineEntity {
  double open = 0;
  double high = 0;
  double low = 0;
  // double increase = 0;
  double preClose = 0;
  double close = -1;
  double vol = 0;
  double amount = 0;
  double count = 0;
  String date = "";

  double X0 = double.infinity;
  double S1 = double.infinity;

  double MA20Price = 0;
  double MA30Price = 0;
  double MA55Price = 0;
  double MA60Price = 0;
  double MA65Price = 0;
  double MA120Price = 0;
  double MA250Price = 0;

  double MA5Volume = 0;
  double MA10Volume = 0;

  double dea = 0;
  double dif = 0;
  double macd = 0;
  double ema12 = 0;
  double ema26 = 0;

  double MA5Price = 0;
  double MA10Price = 0;
//  上轨线
  double up = 0;
//  中轨线
  double mb = 0;
//  下轨线
  double dn = 0;

  double k = 0;
  double d = 0;
  double j = 0;

  double rsi = 0;
  double rsiABSEma = 0;
  double rsiMaxEma = 0;
  double r = 0;

  // 画线用
  bool isMinuteStart = false;
  bool is30MinuteStart = false;
  bool isHourStart = false;
  bool isHalfHourStart = false;
  bool isDayStart = false;
  bool isMonthStart = false;
  bool isYearStart = false;
  bool is5YearStart = false;
}

class JKStockDataEntity {
  String stockCode;
  Color color;
  JKStockTimeType stockTime;
  List<String> dateIndex = [];
  List<KLineEntity> datas = [];
  bool subscribeChan;

  int lastReceiveTime = 0;
  Timer? refreshTimer;

  Function? onRefresh;
  // 缠论数据管理
  ChanDataManager chanDataManager = ChanDataManager();
  // 绘图数据
  Set<ShapeComponent> paintDatas = {};

  StreamSubscription<StockDataUpdateEvent>? eBus;

  JKStockDataEntity({
    required this.stockCode,
    required this.stockTime,
    this.onRefresh,
    this.subscribeChan = true,
    this.color = Colors.transparent,
  }) {
    if (stockCode.isEmpty) return;
    // debugPrint("init hashCode: $stockCode $stockTime $hashCode");
    refreshTimer = Timer.periodic(const Duration(minutes: 1), (timer) {
      if (!distroyed &&
          shouldUpdateData() &&
          DateTime.now().secondsSinceEpoch - lastReceiveTime > 60) {
        getStockDatas(() {});
      }
    });

    eBus = eventBus.on<StockDataUpdateEvent>().listen((event) {
      if (event.stockCode == subkey &&
          shouldUpdateData(marketState: event.eventMarketState)) {
        lastReceiveTime = DateTime.now().secondsSinceEpoch;
        handleUpdateLatest(datas, event.latestData, event.replaceData,
            keyData: event.chanData,
            debugData: event.debugData,
            debugCount: event.debugCount);
        onRefresh?.call();
      }
    });

    Debug.marketRefreshMap["$stockCode-$stockTime"] = () {
      getDatasAndSubscribe();
    };

    eventBus.on<StockAlarmReceiveEvent>().listen((event) {
      var alarmCode = event.data["symbol"] ?? "";
      if (stockCode != alarmCode) return;
      var alarmTime = JKStockTimeTypeExt.getFrom(event.data["stock_cycle"]);
      if (stockTime != alarmTime) return;
      var alarmDate = event.data["alarm_time"].toString();
      var t = alarmDate.split(" ").last;
      alarmDate = alarmDate.replaceRange(alarmDate.length - 3, null, ":00");
      var indicator = event.data["indicator"] ?? "";
      var hdly = event.data["hdly"] ?? "";
      var indicators = "$indicator $hdly";
      var bull = event.data["bull"] ?? "";
      var li = aiAlarmList[alarmDate] ?? [];
      li.add({"indicators": indicators, "bull": bull, "time": t});
      aiAlarmList[alarmDate] = li;
      onRefresh?.call();
    });
  }
  bool shouldUpdateData({JKMarketState? marketState}) {
    var state = marketState ?? Utils.currentMarketState;
    var isPreMarket = state.isPreMarket && stockTime == JKStockTimeType.timePre;
    var isAftMarket =
        state.isPostMarket && stockTime == JKStockTimeType.timeAft;
    var isMarket = state.isMarket;
    return isPreMarket || isAftMarket || isMarket;
  }

  String get subkey {
    if (stockCode.isEmpty) return "";
    var key = "$stockCode@${stockTime.rawValue.item1}";
    if (subscribeChan) {
      return "$key@C";
    }
    return key;
  }

  subscribeStock() {
    StockUpdateManager.shared.subscribeStock(subkey, hashCode);
  }

  unSubscribeStock() {
    StockUpdateManager.shared.unSubscribeStock(subkey, hashCode);
  }

  var priceAlarmList = [];
  getPriceAlarmList() {
    network.alarmAllList(JKStockAlarmType.price, code: stockCode).then((res) {
      if (res.isError) {
        return;
      }
      priceAlarmList = res.json["data"]["items"];
    });
  }

  Map<String, dynamic> aiAlarmList = {};
  Map<String, dynamic> aiAlarmDrawRect = {};
  getAIAlarmList() {
    aiAlarmList.clear();
    var t = stockTime;
    if (t.isTickTime) {
      t = JKStockTimeType.min1;
    }
    network.alarmAllLogs(null, code: stockCode, time: t).then((res) {
      if (res.isError) {
        return;
      }
      List li = res.json["data"]?["items"] ?? [];
      for (var item in li) {
        var condition = item["condition"];
        var time = item["alarm_time"] as String;
        var t = time.split(" ").last.substring(0, 5);
        time = time.replaceRange(time.length - 3, null, ":00");
        var indicator = condition?["indicators"] ?? "";
        var hdly = condition?["hdly"] ?? "";
        var event = "$indicator $hdly";
        String bull = condition?["bull"] ?? "";
        var li = aiAlarmList[time] ?? [];
        li.add({"indicators": event, "bull": bull, "time": t});
        aiAlarmList[time] = li;
      }
    });
  }

  Map<String, List<String>> infoEventList = {};
  Map<String, dynamic> infoEventDrawRect = {};
  // getInfoEventList() {
  //   network.economicData(1, onResult: (ResultData res) {
  //     if (res.success) {
  //       List li = res.json["data"]?["items"] ?? [];
  //       for (var item in li) {
  //         var date = item["date"] as String;
  //         var event = item["name"] as String;
  //         date = date.split(" ").first;
  //         date = "$date 00:00:00";
  //         List<String> infos = infoEventList[date] ?? [];
  //         infos.add(event);
  //         infoEventList[date] = infos;
  //       }
  //     }
  //   });
  // }

  getPaintDatas() {
    network.userPaints(stockCode).then((res) {
      if (res.isError) {
        return;
      }
      List<dynamic> li = res.json["data"] ?? [];
      Set<ShapeComponent> shapes = {};
      for (var e in li) {
        var path =
            JKUserPathTypeExtension.from(paintId: int.parse(e["plotting_id"]));
        var paint = path.getPath;
        List<dynamic> p = e["points"];
        var f = p.map((e) {
          return [e["x"] as String, e["y"] as String];
        }).toList();
        paint.pointsInfo = f;
        paint.hash = e["hash"];
        paint.text = e["text"];
        paint.stockTime = e["stock_kline_value"];
        paint.crossTime = (e["cross_time"] ?? "0") == "1";
        shapes.add(paint);
      }
      paintDatas = shapes;
    });
  }

  getChanData({int start = 0, int end = 0}) {
    final String code = stockCode;
    final JKStockTimeType time = stockTime;
    network
        .getChanData(code: code, time: time.rawValue.item1, begin: "", end: "")
        .then((ResultData res) async {
      if (code != stockCode || time != stockTime) {
        return;
      }
      if (res.success) {
        var data = res.json["data"]["coiling_data"] ?? {};
        List<KLineEntity> modelDatas = datas.sublist(start, end);
        await chanDataManager.generateData(modelDatas, time, data);
      }
    });
  }

  getStockDatas(Function onResult) {
    final String code = stockCode;
    final JKStockTimeType time = stockTime;
    if (code.isEmpty) return;
    // logger.d("xxxxxx:  00000");
    StockDataCahceManager.shared.get(code, time,
        (ResultData res, bool finish) async {
      if (code != stockCode || time != stockTime) {
        return;
      }
      if (res.success) {
        // logger.d("xxxxxx:  11111");
        List<dynamic> history = res.json["data"]["history"];
        var m = JKStockData(
          md5: "",
          historyData: history,
          coilingData: res.json["data"]["coiling_data"] ?? {},
        );

        List<String> dateIndex = [];
        List<KLineEntity> modelDatas = [];
        var allData = m.historyData;

        // fix tickData
        if (stockTime == JKStockTimeType.timePre && allData.length < 330) {
          allData = allData + Utils.fillMinData(allData.last[0], "09:29:00");
        } else if (stockTime == JKStockTimeType.time && allData.length < 390) {
          allData = allData +
              Utils.fillMinData(
                  (allData.safeAt(allData.length - 1) as List?)?.safeAt(0) ??
                      "",
                  "15:59:00");
        } else if (stockTime == JKStockTimeType.timeAft &&
            allData.length < 240) {
          allData = allData + Utils.fillMinData(allData.last[0], "19:59:00");
        } else if (stockTime == JKStockTimeType.time5 &&
            allData.length < 1950) {
          allData = allData + Utils.fillMinData(allData.last[0], "15:59:00");
        }

        for (int idx = 0; idx < allData.length; idx++) {
          var item = allData[idx];
          dateIndex.insert(0, item[0]);
          KLineEntity model = KLineEntity();
          model.date = item[0];
          model.open = item[1].toDouble();
          model.close = item[2].toDouble();
          model.high = item[3].toDouble();
          model.low = item[4].toDouble();
          model.vol = item[5].toDouble(); // 成交量
          model.amount = item[6].toDouble();
          model.preClose = (item[7] ?? 0).toDouble();
          var lastModel = modelDatas.safeAt(modelDatas.length - 1);
          model.is30MinuteStart =
              ["30", "00"].contains(model.date.substring(14, 16));
          model.isMinuteStart = dateUtils.DateUtils.isSameMinuteString(
              lastModel?.date, model.date);
          model.isHourStart =
              dateUtils.DateUtils.isSameHourString(lastModel?.date, model.date);
          model.isHalfHourStart = dateUtils.DateUtils.isSameHalfHourString(
              lastModel?.date, model.date);
          model.isDayStart =
              dateUtils.DateUtils.isSameDayString(lastModel?.date, model.date);
          model.isMonthStart = dateUtils.DateUtils.isSameMonthString(
              lastModel?.date, model.date);
          model.isYearStart =
              dateUtils.DateUtils.isSameYearString(lastModel?.date, model.date);
          model.is5YearStart = ["0", "5"].contains(model.date.substring(3, 4));
          modelDatas.add(model);
        }
        // logger.d("xxxxxx:  2222");
        await chanDataManager.generateData(modelDatas, time, m.coilingData);
        calculateBuySalePoints(modelDatas);
        DataUtil.calculate(modelDatas);
        datas = modelDatas;
        this.dateIndex = dateIndex;
        // logger.d("xxxxxx:  onResult.call");
        onResult.call();
      } else {
        showToast(res.message);
      }
    });
  }

// 计算买卖点位
  void calculateBuySalePoints(List<KLineEntity> allStockData) {
    var wy1001 = 0.0;
    var first = allStockData.safeAt(0);
    if (first != null) {
      wy1001 = (2 * first.close + first.low + first.high) / 4;
    }
    var wy1002 = wy1001;
    var wy1003 = wy1002;
    var wy1004 = wy1003;
    var x0 = 0.0;
    var n = 4;
    for (var i = 0; i < allStockData.length; i++) {
      var item = allStockData[i];
      if (item.close > 0) {
        wy1001 = (2 * item.close + item.low + item.high) / 4;
        wy1002 = (2 * wy1001 + (n - 1) * wy1002) / (n + 1);
        wy1003 = (2 * wy1002 + (n - 1) * wy1003) / (n + 1);
        var wy1004Ref = wy1004;
        wy1004 = (2 * wy1003 + (n - 1) * wy1004) / (n + 1);

        var x0Ref = x0;
        if (wy1004Ref < 0.001) {
          x0 = 0;
        } else {
          x0 = (wy1004 - wy1004Ref) / wy1004Ref * 100;
        }

        item.X0 = x0;
        item.S1 = (x0Ref + x0) / 2;
      }
    }
  }

  void handleUpdateLatest(
      List<KLineEntity> datas, List latest, List replaceData,
      {dynamic keyData = const {}, dynamic debugData, String debugCount = ""}) {
    if (datas.isEmpty) return;
    KLineEntity model = KLineEntity();
    model.date = latest.time;
    model.open = latest.open.toDouble();
    if (model.open < 0) return;
    model.high = latest.high.toDouble();
    model.low = latest.low.toDouble();
    model.close = latest.close.toDouble();
    model.preClose = latest.lastClose.toDouble();
    model.amount = 0;
    var isReplace = true;
    var timeLastIndex = -1;

    var receivedDate = DateTime.tryParse(model.date);
    if (receivedDate == null) return;
    var isHandleTime = stockTime.isTickTime;
    final debugDate = "${model.date.substring(11)}|$debugCount";
    // 处理替换的数据
    if (replaceData.isNotEmpty) {
      List<KLineEntity> models = [];
      for (var i = 0; i < replaceData.length; i++) {
        List item = replaceData[i];
        KLineEntity m = KLineEntity();
        m.date = item.time;
        m.open = item.open.toDouble();
        if (m.open < 0) return;
        m.high = item.high.toDouble();
        m.low = item.low.toDouble();
        m.close = item.close.toDouble();
        m.preClose = item.lastClose.toDouble();
        models.add(m);
      }
      // 增加最新数据
      models.add(model);
      var firstItem = models.first.date;
      for (var i = datas.length - 1; i > 0; i--) {
        var item = datas[i];
        if (item.date == firstItem) {
          timeLastIndex = i;
          break;
        }
      }

      var endIndex =
          isHandleTime ? timeLastIndex + models.length : datas.length;

      if (timeLastIndex < 0) return;
      var deleteDates = [];
      for (var i = timeLastIndex; i < endIndex; i++) {
        deleteDates.add(datas[i].date);
      }
      datas.removeRange(timeLastIndex, endIndex);
      var addDates = [];
      for (var element in models) {
        addDates.add(element.date);
      }
      if (addDates.length < deleteDates.length && Utils.isDebug) {
        var l =
            "删除(${deleteDates.length}): $deleteDates, 增加(${addDates.length}):  $addDates";
        logger.d(l);
        NotificationCenter.shared.post(NotificationItem("App检测-$stockCode", l));
      } else if (addDates.length > deleteDates.length) {
        //每一次添加都检查序列是否正确
        // var checkLength = 400;
        // var latestTenModel = datas.sublist(datas.length - checkLength);
        // if (isHandleTime && timeLastIndex > 15) {
        //   latestTenModel = datas.sublist(timeLastIndex - 11);
        // }

        // var errMsg = checkData(latestTenModel, isHandleTime);
        // if (errMsg.isNotEmpty) {
        //   logger.d("数据校验序列失败 ❌❌❌: $errMsg | 刷新");
        //   if (Debug.enableStockDataRefresh == 1) {
        //     getStockDatas(() {});
        //   }
        // }
      }
      if (isHandleTime) {
        datas.insertAll(timeLastIndex, models);
      } else {
        datas.addAll(models);
      }
    } else {
      switch (stockTime) {
        case JKStockTimeType.time:
        case JKStockTimeType.time5:
        case JKStockTimeType.timePre:
        case JKStockTimeType.timeAft:
        case JKStockTimeType.min1:
          isHandleTime = true;
          var ignoreEmpty = true;
          if (stockTime == JKStockTimeType.min1) {
            isHandleTime = false;
            ignoreEmpty = false;
            timeLastIndex = datas.length;
          } else if (stockTime == JKStockTimeType.time5) {
            ignoreEmpty = false;
          } else {
            for (var i = 0; i < datas.length; i++) {
              var old = datas[i];
              if (old.close == -1) {
                timeLastIndex = i;
                break;
              }
            }
          }

          var lastTime =
              DateTime.tryParse(datas.safeAt(timeLastIndex - 1)?.date ?? "");
          if (ignoreEmpty && lastTime == null) {
            isReplace = false;
          } else {
            if (lastTime == null) return;
            if (receivedDate.isBefore(lastTime)) return; // 如果传来的时间比已存在的早则丢弃
            isReplace = lastTime.isSameMinute(receivedDate);
          }
          break;
        case JKStockTimeType.min2:
        case JKStockTimeType.min3:
        case JKStockTimeType.min5:
        case JKStockTimeType.min10:
        case JKStockTimeType.min15:
        case JKStockTimeType.min30:
        case JKStockTimeType.min45:
        case JKStockTimeType.hour1:
        case JKStockTimeType.hour2:
        case JKStockTimeType.hour3:
        case JKStockTimeType.hour4:
          var lastTime = DateTime.tryParse(datas.last.date);
          if (lastTime == null) return;
          if (receivedDate.isBefore(lastTime)) return; // 如果传来的时间比已存在的早则丢弃
          var hitTime =
              lastTime.add(Duration(minutes: stockTime.rawValue.item1));
          isReplace = receivedDate.isBefore(hitTime);
          break;
        case JKStockTimeType.day:
          var lastTime = DateTime.tryParse(datas.last.date);
          if (lastTime == null) return;
          if (receivedDate.isBefore(lastTime)) return; // 如果传来的时间比已存在的早则丢弃
          isReplace = receivedDate.isSameDay(lastTime);
          break;
        case JKStockTimeType.month:
          var lastTime = DateTime.tryParse(datas.last.date);
          if (lastTime == null) return;
          if (receivedDate.isBefore(lastTime)) return; // 如果传来的时间比已存在的早则丢弃
          isReplace = receivedDate.isSameMonth(lastTime);
          break;
        case JKStockTimeType.week:
        case JKStockTimeType.month6:
        case JKStockTimeType.quarter:
        case JKStockTimeType.year:
          var isContains = DataUtil.isSameDateComparison(
              datas.last.date, model.date, stockTime);
          if (isContains == null) return;
          isReplace = isContains;
          break;
      }

      if (isReplace) {
        if (isHandleTime) {
          datas[timeLastIndex - 1] = model;
        } else {
          datas[datas.length - 1] = model;
        }
      } else {
        // 当前数据不是最新的,如果改变则表示上一条数据已入库,则需要更新
        if (isHandleTime) {
          datas[timeLastIndex] = model;
        } else {
          datas.add(model);
        }
      }
    }
    if (keyData != null && keyData.length > 3) {
      // var backend = keyData["candlesticks"] as List;
      // var isCompareError = "";

      // if (backend.length == datas.length) {
      //   for (var i = 0; i < backend.length; i++) {
      //     var errorMsg = "";
      //     var backendItem = backend[i];
      //     var clientItem = datas[i];
      //     if (backendItem[0] != clientItem.date) {
      //       errorMsg += "日期不一致 ❌ ${clientItem.date}: ${backendItem[0]} != ${clientItem.date}";
      //     }
      //     if (backendItem[1].toDouble() != clientItem.high.toDouble()) {
      //       errorMsg += "高位不一致 ❌ ${clientItem.date}: ${backendItem[1]} != ${clientItem.high}";
      //     }
      //     if (backendItem[2].toDouble() != clientItem.low.toDouble()) {
      //       errorMsg += "低位不一致 ❌ ${clientItem.date}: ${backendItem[2]} != ${clientItem.low}";
      //     }
      //     if (errorMsg.isNotEmpty) {
      //       isCompareError = errorMsg;
      //       logger.d(errorMsg);
      //     }
      //   }
      // } else {
      //   isCompareError = "长度不一致 ❌ ${backend.length} != ${datas.length}";
      // }

      if (debugData != null && Utils.isDebug) {
        var maxIdx = stockTime.rawValue.item1 >= 1440 ? 10 : 16;
        var remoteLength = debugData["count_end"];
        var remoteFirst = debugData["first_1"].substring(0, maxIdx);
        var remoteLast1 = debugData["last_1"].substring(0, maxIdx);
        var remoteLast2 = debugData["last_2"].substring(0, maxIdx);
        var remoteLast3 = debugData["last_3"].substring(0, maxIdx);
        List remoteLast50 = debugData["last_50_datetime"] ?? [];
        var last50Key = debugData["last_50_key"];

        var localLength = datas.length;
        var localFirst = datas.first.date.substring(0, maxIdx);
        var localLast1 = datas.last.date.substring(0, maxIdx);
        var localLast2 = datas[datas.length - 2].date.substring(0, maxIdx);
        var localLast3 = datas[datas.length - 3].date.substring(0, maxIdx);

        var last50ErrorMsg = "not check";
        if (datas.length > 50 && remoteLast50.isNotEmpty) {
          var localLast50 =
              datas.sublist(datas.length - 50).map((e) => e.date).toList();
          var e = "";
          for (var i = 0; i < remoteLast50.length; i++) {
            if (remoteLast50[i] != localLast50[i]) {
              e += "位置:$i ❌ ${remoteLast50[i]} != ${localLast50[i]}\n";
            }
          }
          if (e.isNotEmpty) {
            last50ErrorMsg = "last_50不一致: ❌ $last50Key\n";
            last50ErrorMsg += e;
          } else {
            last50ErrorMsg = "Last50: ✅";
          }
        }

        var isLengthError = remoteLength != localLength;
        var isFirstError = remoteFirst != localFirst;
        var isLast1Error = remoteLast1 != localLast1;
        var isLast2Error = remoteLast2 != localLast2;
        var isLast3Error = remoteLast3 != localLast3;

        var errorInfo = "";

        errorInfo += "$debugDate: (远程-本地) $stockCode \n";
        errorInfo +=
            "Length: $remoteLength${isLengthError ? "❌" : "✅"}$localLength\n";
        errorInfo +=
            "First: $remoteFirst${isFirstError ? "❌" : "✅"}$localFirst\n";
        errorInfo +=
            "Last1: $remoteLast1${isLast1Error ? "❌" : "✅"}$localLast1\n";
        errorInfo +=
            "Last2: $remoteLast2${isLast2Error ? "❌" : "✅"}$localLast2\n";
        errorInfo +=
            "Last3: $remoteLast3${isLast3Error ? "❌" : "✅"}$localLast3\n";
        errorInfo += "isLast50ErrorMsg: $last50ErrorMsg\n";
        // errorInfo += "Compare: ${isCompareError.isEmpty ? "✅✅✅✅" : "❌❌❌❌: $isCompareError"}\n";

        // logger.d(errorInfo);
        if (isLengthError ||
            isFirstError ||
            isLast1Error ||
            isLast2Error ||
            isLast3Error ||
            last50ErrorMsg.contains("❌")) {
          if (stockTime.rawValue.item1 > 0) {
            logger.d(errorInfo);
            NotificationCenter.shared
                .post(NotificationItem("App检测-$stockCode", errorInfo));
            if (remoteLength != localLength) {
              var totalDate = "";
              for (var i = 0; i < datas.length; i++) {
                totalDate += "${datas[i].date}@";
              }
              logger.logOnce("App检测-$stockCode-$localLast1", totalDate);
            }
          }
        } else {
          logger.d("数据对比正确 ✅✅✅: $remoteLength == $localLength ");
        }
      }
      chanDataManager.generateData(datas, stockTime, keyData!,
          debugStr: debugDate);
      calculateBuySalePoints(datas);
      DataUtil.calculate(datas);
    }
  }

  String checkData(List models, bool isHandleFix) {
    var errorMessage = "";
    var lastTime = DateTime.tryParse(models.first.date);
    if (lastTime == null) {
      return "checkData first null error: ${models.first}";
    }
    var addMinutes = isHandleFix ? 1 : stockTime.rawValue.item1;
    for (var i = 1; i < models.length - 1; i++) {
      KLineEntity m = models[i];
      lastTime = lastTime!.add(Duration(minutes: addMinutes));
      switch (Utils.currentMarketState) {
        case JKMarketState.preMarket:

          // if (!correctDate.isBefore(correctDate.marketOpenTime)) {

          // }
          break;
        case JKMarketState.market:
          if (!lastTime.isBefore(lastTime.marketClosedTime)) {
            lastTime =
                DateTime(lastTime.year, lastTime.month, lastTime.day, 9, 30);
            lastTime = lastTime.add(const Duration(days: 1));
          }
          while (!Utils.isMarketOpen(lastTime!)) {
            lastTime = lastTime.add(const Duration(days: 1));
          }
          break;
        case JKMarketState.postMarket:
          break;
      }

      var correctDateStr = DateFormat('yyyy-MM-dd HH:mm:00').format(lastTime);
      if (m.date != correctDateStr) {
        return "checkData error: ${m.date} != $correctDateStr";
      } else {
        // logger.d("checkData ok: ${m.date} == $correctDateStr");
      }
    }
    return errorMessage;
  }

  setStockTime(JKStockTimeType stockTime) {
    if (this.stockTime != stockTime) {
      // 若切换周期
      // 清空数据
      datas.clear();
      // 取消订阅
      unSubscribeStock();
      // 设置新周期
      this.stockTime = stockTime;
      // 获取新数据
      getDatasAndSubscribe(getPaint: false);
      getAIAlarmList();
      // getInfoEventList();
    }
  }

  getDatasAndSubscribe({bool getPaint = true}) {
    getStockDatas(() {
      if (distroyed == false) {
        subscribeStock();
        onRefresh?.call();
      }
    });
    if (getPaint) {
      getPaintDatas();
    }
  }

  var distroyed = false;
  void distroy() {
    distroyed = true;
    unSubscribeStock();
    eBus?.cancel();
    eBus = null;
    refreshTimer?.cancel();
    refreshTimer = null;
    Debug.marketRefreshMap.remove("$stockCode-$stockTime");
    debugPrint("hashCode distroy: $stockCode $stockTime $hashCode");
  }
}
