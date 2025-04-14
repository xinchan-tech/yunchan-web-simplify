import 'dart:ffi';
import 'dart:io';
import 'dart:isolate';
import 'package:ffi/ffi.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/services.dart';
import 'package:mgjkn/Util/utils.dart';
import 'package:mgjkn/debug.dart';
import 'package:mgjkn/desktop/logger.dart';
import 'package:mgjkn/desktop/stock/chan_data_manager.dart';
import 'package:mgjkn/desktop/stock/kchart/entity/k_line_entity.dart';
import 'package:mgjkn/desktop/stock/kchart/indicator/indicator_menu.dart';
import 'package:mgjkn/desktop/stock/kchart/kline_manager.dart';
import 'package:mgjkn/desktop/stock/kchart/state_enum.dart';
import 'package:mgjkn/desktop/stock/stock_data_manager.dart';

final class ExResult extends Struct {
  external Pointer<Utf8> name; // 名称
  external Pointer<Utf8> draw; // 绘图数据
  external Pointer<Utf8> color; // 颜色
  external Pointer<Utf8> styleType; // 样式类型

  @Int64()
  external int linethick; // 线条粗细

  @Int64()
  external int len; // 数据长度

  external Pointer<Double> data; // 数据
  external Pointer<Utf8> drawData; // 绘图数据
}

final class CandlestickList extends Struct {
  external Pointer<Candlestick> candlesticks;

  @Int64()
  external int len;

  @Int64()
  external int cap;
}

final class AAAAList extends Struct {
  external Pointer<Int32> data;

  @Int32()
  external int len;

  @Int32()
  external int cap;
}

class IndicatorManager {
  static final IndicatorManager _instance = IndicatorManager();
  static IndicatorManager get shared => _instance;

  bool isPassCheck = false;
  DynamicLibrary? dylib;

  List<IndicatorItem> mainIndicators = [];
  List<IndicatorItem> secondaryIndicators = [];

  // 全部指标的本地缓存
  Map<String, dynamic>? _indicatorList;
  Map<String, dynamic> get indicatorList {
    _indicatorList ??= CacheManager.shared.storage.getMap("mainIndicatorData") ?? {};
    return _indicatorList!;
  }

  set indicatorList(Map<String, dynamic> value) {
    _indicatorList = value;
    var mainList = value["main"] as List? ?? [];
    var ctl = KLineManager.shared.selectedChartController;
    for (var item in mainList) {
      for (var subItem in (item["indicators"] ?? [])) {
        if (subItem["authorized"] == 1) {
          if (subItem["id"] == "pro") {
            if (ctl.hasBasicChanMenu) {
              ctl.setMainIndicator(IndicatorItem.fromJson(subItem));
            }
          } else if (subItem["id"] == "basic") {
            if (ctl.hasChanMenu == false) {
              ctl.setMainIndicator(IndicatorItem.fromJson(subItem));
            }
          }
        }
      }
    }
    CacheManager.shared.storage.setMap("mainIndicatorData", value);
  }

  var libPath = "";
  prepare() async {
    if (dylib == null) {
      var filename = Platform.isWindows ? "policy.dll" : "libpolicy.dylib";
      var path = await CacheManager.desktopBasePath;
      libPath = "$path/$filename";
      if (isPassCheck == false) {
        var pp = await rootBundle.load("assets/dll/$filename");
        var originBytes = pp.buffer.asUint8List();
        if (File(libPath).existsSync()) {
          //读取目标文件数据
          Uint8List destBytes = await File(libPath).readAsBytes();
          if (listEquals(originBytes, destBytes) == false) {
            File(libPath).writeAsBytesSync(originBytes, flush: true);
          }
        } else {
          File(libPath).writeAsBytesSync(originBytes);
        }
        isPassCheck = true;
      }
      if (Utils.isDebug) {
        var devLibPath = "$path/dev.$filename";
        if (File(devLibPath).existsSync()) {
          print("use dylib dev: $devLibPath");
          libPath = devLibPath;
        }
      }
      if (dylib == null) {
        dylib = DynamicLibrary.open(libPath);
        print("init  use dylib: ${dylib.hashCode}");

        // extern char* CheckFormula(char* data);
      }

      // var checkFormula =
      //     dylib!.lookupFunction<Void Function(), void Function()>('PrintLib');
      // checkFormula();
    }
  }

  void calculateData(JKStockDataEntity stockEntity, String formula, {required Function onResult}) async {
    if (stockEntity.datas.isEmpty || formula.isEmpty) return;
    List<KLineEntity> calculateList = [];
    if (stockEntity.stockTime.isTickTime) {
      List<KLineEntity> tickData = [];
      for (var item in stockEntity.datas) {
        if (item.close > 0) tickData.add(item);
      }
      calculateList = tickData;
    } else {
      calculateList = stockEntity.datas;
    }

    Pointer<Candlestick> kLinesPointer = calloc<Candlestick>(calculateList.length);
    for (int i = 0; i < calculateList.length; i++) {
      var e = calculateList[i];
      Pointer<Candlestick> candlestick = calloc<Candlestick>();
      candlestick.ref.time = e.date.toNativeUtf8();
      candlestick.ref.open = e.open.toDouble();
      candlestick.ref.close = e.close.toDouble();
      candlestick.ref.high = e.high.toDouble();
      candlestick.ref.low = e.low.toDouble();
      candlestick.ref.volume = e.vol.toDouble();
      candlestick.ref.amount = e.amount.toDouble();
      kLinesPointer[i] = candlestick.ref;
      calloc.free(candlestick);
    }

    Pointer<CandlestickList> candles = calloc<CandlestickList>(calculateList.length);
    candles.ref.candlesticks = kLinesPointer;
    candles.ref.len = calculateList.length;
    candles.ref.cap = calculateList.length;
    debugPrint("XXXX: call  PolicyExecutePC 1111");
    if (Platform.isWindows) {
      var newFunc11 = dylib!.lookupFunction<Pointer<Utf8> Function(Pointer<Utf8>, Int64, Pointer<Utf8>, Pointer<CandlestickList>),
          Pointer<Utf8> Function(Pointer<Utf8>, int, Pointer<Utf8>, Pointer<CandlestickList>)>('PolicyExecutePC');
      debugPrint("XXXX: call  PolicyExecutePC  22222");
      var result = newFunc11(
        stockEntity.stockCode.toNativeUtf8(),
        stockEntity.stockTime.rawValue.item1,
        formula.toNativeUtf8(),
        candles,
      );

      debugPrint("XXXX: end  PolicyExecutePC");
      calloc.free(kLinesPointer);
      calloc.free(candles);
      var resultStr = "[]";
      if (result.address != 0) {
        resultStr = result.toDartString();
        dylib!.lookupFunction<Void Function(Pointer<Utf8>), void Function(Pointer<Utf8>)>('FreeResultStr')(result);
      }
      onResult.call(resultStr);
      return;
    }
    onResult.call("[]");
  }

  static calculateIsolateData(List args) async {
    print("XXXX: calculateData  11111");
    SendPort sendPort = args[0]; // 获取 SendPort
    // JKStockDataEntity stockEntity = args[1];
    String stockCode = args[1];
    int time = args[2];
    JKStockTimeType stockTime = JKStockTimeTypeExt.getFrom(time)!;
    List data = args[3];
    String formula = args[4];
    String libPath = args[5];

    var dylib = DynamicLibrary.open(libPath);

    List<KLineEntity> calculateList = [];
    // if (stockTime.isTickTime) {
    // List<KLineEntity> tickData = [];
    for (var item in data) {
      if (item[4] > 0) {
        var f = KLineEntity();
        f.date = item[0];
        f.open = item[1];
        f.high = item[2];
        f.low = item[3];
        f.close = item[4];
        f.vol = item[5];
        f.amount = item[6];
        calculateList.add(f);
      }
    }
    //   calculateList = tickData;
    // } else {
    //   calculateList = data;
    // }

    Pointer<Candlestick> kLinesPointer = calloc<Candlestick>(calculateList.length);
    for (int i = 0; i < calculateList.length; i++) {
      var e = calculateList[i];
      Pointer<Candlestick> candlestick = calloc<Candlestick>();
      candlestick.ref.time = e.date.toNativeUtf8();
      candlestick.ref.open = e.open.toDouble();
      candlestick.ref.close = e.close.toDouble();
      candlestick.ref.high = e.high.toDouble();
      candlestick.ref.low = e.low.toDouble();
      candlestick.ref.volume = e.vol.toDouble();
      candlestick.ref.amount = e.amount.toDouble();
      kLinesPointer[i] = candlestick.ref;
      calloc.free(candlestick);
    }

    Pointer<CandlestickList> candles = calloc<CandlestickList>(calculateList.length);
    candles.ref.candlesticks = kLinesPointer;
    candles.ref.len = calculateList.length;
    candles.ref.cap = calculateList.length;

    var newFunc11 = dylib!.lookupFunction<Pointer<Utf8> Function(Pointer<Utf8>, Int64, Pointer<Utf8>, Pointer<CandlestickList>),
        Pointer<Utf8> Function(Pointer<Utf8>, int, Pointer<Utf8>, Pointer<CandlestickList>)>('PolicyExecutePC');
    logger.d("XXXX: perform func");
    var result = newFunc11(
      stockCode.toNativeUtf8(),
      stockTime.rawValue.item1,
      formula.toNativeUtf8(),
      candles,
    );
    logger.d("XXXX: out func");
    calloc.free(kLinesPointer);
    calloc.free(candles);
    var resultStr = "[]";
    if (result.address != 0) {
      resultStr = result.toDartString();
    }
    var freeFunc = dylib!.lookupFunction<Pointer<Void> Function(Pointer<Utf8>), Pointer<void> Function(Pointer<Utf8>)>('FreeResultStr');
    freeFunc(result);
    logger.d("XXXX: End.");
    sendPort.send(resultStr);
    logger.d("XXXX: calculateData  222222");
  }

  void runInIsolate(JKStockDataEntity stockEntity, String formula, {required Function? onResult}) async {
    final receivePort = ReceivePort();
    var rawList = [];
    for (var i = 0; i < stockEntity.datas.length; i++) {
      var item = stockEntity.datas[i];
      rawList.add([item.date, item.open, item.high, item.low, item.close, item.vol, item.amount]);
    }
    await prepare();
    await Isolate.spawn(calculateIsolateData, [receivePort.sendPort, stockEntity.stockCode, stockEntity.stockTime.rawValue.item1, rawList, formula, libPath]);
    final result = await receivePort.first;
    receivePort.close();
    onResult?.call(result);
  }
}
