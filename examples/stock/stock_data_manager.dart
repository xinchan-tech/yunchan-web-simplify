import 'dart:convert';
import 'dart:io';
import 'dart:typed_data';
import 'package:get_storage/get_storage.dart';
import 'package:path/path.dart' as path;
import 'package:flutter/services.dart';
import 'package:mgjkn/desktop/stock/kchart/state_enum.dart';
import 'package:mgjkn/extensions/extension_widget.dart';
import 'package:mgjkn/network/network.dart';
import 'package:mgjkn/Util/utils.dart';
import 'package:path_provider/path_provider.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:synchronized/synchronized.dart';

class CacheManager {
  static CacheManager? _instance;
  static CacheManager get shared {
    _instance ??= CacheManager();
    return _instance!;
  }

  late SharedPreferences storage;

  static String base = "Library";
  static String settingPath = "$base/Settings";
  static String cachePath = "$base/Caches";
  static String stockDatabasePath = "$base/Stocks";
  static GetStorage get oldStorage => GetStorage("storage", settingPath);

  Future<void> prepare() async {
    storage = await SharedPreferences.getInstance();
    getAllstock();
  }

  // static SimpleStorage? ddd;
  static String _desktopBasePath = "";
  static Future<String> get desktopBasePath async {
    if (_desktopBasePath.isEmpty) {
      if (Platform.isWindows) {
        var base = await getApplicationSupportDirectory();
        _desktopBasePath = base.path;
      } else {
        var base = await getApplicationDocumentsDirectory();
        _desktopBasePath = base.path;
      }
    }
    return _desktopBasePath;
  }

  static Map<String, List> allStockMap = {};
  static bool _allStockRequested = false;
  static void getAllstock() async {
    var filepath = "${CacheManager.cachePath}/allstock";
    var content = "[]";
    if (File(filepath).existsSync()) {
      content = await File(filepath).readAsString();
    } else {
      content = await rootBundle.loadString('assets/allstock');
    }
    var currentMd5 = content.MD5String;
    var li = [];
    try {
      li = jsonDecode(content) as List<dynamic>;
    } catch (e) {}

    allStockMap = {for (List item in li) (item.safeAt(1) ?? "--"): item};

    if (_allStockRequested == false) {
      _allStockRequested = true;
      network.allStockInfo(key: currentMd5).then((res) {
        if (res.success) {
          var data = res.json["data"]["data"];
          if (data.isEmpty) return;
          var decodedBytes = base64.decode(data);
          var fileData = gzip.decode(decodedBytes);
          Uint8List myUint8List = Uint8List.fromList(fileData);
          Utils.writeDataToFile(myUint8List, filepath);
          String jsonString = utf8.decode(fileData);
          var li = jsonDecode(jsonString) as List<dynamic>;
          allStockMap = {for (List item in li) (item.safeAt(1) ?? "--"): item};
        }
      });
    }
  }

  static Future<bool> clearStockCachePath() async {
    var path = "THIS_IS_ERROR_PATH";
    if (Platform.isMacOS) {
      var cache = await getTemporaryDirectory();
      var base = cache.parent.parent.path;
      path = "$base/$stockDatabasePath";
    } else if (Platform.isWindows) {
      var base = Directory.current.path;
      path = "$base/$stockDatabasePath";
    }

    Directory dir = Directory(path);
    if (dir.existsSync()) {
      // dir.deleteSync(recursive: true); // 同步删除文件
      for (final file in dir.listSync(recursive: true)) {
        if (file is File) {
          String name = file.path.split(Platform.pathSeparator).last;
          if (name.endsWith(".gs")) {
            name = name.replaceAll(".gs", "");
            // await GetStorage(name).erase();
          }
        }
      }
      return Future.value(true);
    } else {
      return Future.value(false);
    }
  }
}

// class SimpleStorage {
//   final String _filePath;
//   Map<String, dynamic>? rawMap;

//   final _fileLock = Lock(); // 创建一个锁
//   SimpleStorage(this._filePath);

//   Future<void> prepare() async {
//     rawMap = await _readFile();
//     return;
//   }

//   Future<Map<String, dynamic>> _readFile() async {
//     final file = File(_filePath);
//     if (await file.exists()) {
//       String contents = await file.readAsString();
//       return jsonDecode(contents);
//     }
//     return {};
//   }

//   Future<void> _writeFile(Map<String, dynamic>? data) async {
//     if (data != null) {
//       final file = File(_filePath);
//       await file.writeAsString(jsonEncode(data), flush: true);
//     }
//   }

//   Future<void> setItem(String key, dynamic value) async {
//     await _fileLock.synchronized(() async {
//       rawMap?[key] = value;
//       await _writeFile(rawMap);
//     });
//   }

//   dynamic getItem(String key) async {
//     return rawMap?[key];
//   }

//   Future<void> removeItem(String key) async {
//     rawMap?.remove(key);
//     await _writeFile(rawMap);
//   }
// }

class StockDataCahceManager {
  StockDataCahceManager._();
  static final StockDataCahceManager shared = StockDataCahceManager._();

  var enableCache = false;

  get(String code, JKStockTimeType time, Function(ResultData, bool) onResult) async {
    // await GetStorage(
    //         "$code@${time.rawValue.item1}", CacheManager.stockDatabasePath)
    //     .initStorage;

    // var data = GetStorage(
    //         "$code@${time.rawValue.item1}", CacheManager.stockDatabasePath)
    //     .read("data");
    var data = {};
    if (true) {
      //特殊处理分钟时间
      String beginTime = Utils.getStockStartDate(time);
      var res = await network.stockChart(code: code, time: time.rawValue.item1, begin: beginTime, zip: true);

      if (res.isError) {
        onResult.call(res, true);
        return;
      }

      var decodedBytes = base64.decode(res.json["data"]);
      var fileData = gzip.decode(decodedBytes);
      Uint8List myUint8List = Uint8List.fromList(fileData);
      // Utils.writeDataToFile(myUint8List, filepath);
      String jsonString = utf8.decode(fileData);
      var li = jsonDecode(jsonString);

      onResult.call(ResultData({"data": li}, res.message, res.code, res.success), true);
    } else {
      var result = {"status": 1, "msg": "success"};
      List oldDatas = data["stocks"];
      result["data"] = {"history": oldDatas};
      onResult.call(ResultData(result, "success", 200, true), false);

      // 请求新数据
      List lastItem = oldDatas.last;
      String lastDate = lastItem[0];
      var md5 = data["md5"];
      var res = await network.stockChart(code: code, time: time.rawValue.item1, begin: lastDate, md5: md5);
      if (res.isError) {
        onResult.call(res, true);
        return;
      }

      var newData = res.json["data"]["history"];
      // 删除上一条的时间数据
      newData?.removeAt(0);
      if (newData != null && newData.isNotEmpty) {
        oldDatas.addAll(newData);
        var jsonString = jsonEncode(oldDatas);
        var md5New = jsonString.MD5String;
        save(code, time.rawValue.item1, oldDatas, md5New);
      }
    }
  }

  save(String code, int time, dynamic datas, String md5) {
    // GetStorage("$code@$time", "Library/Caches/stocks")
    //     .write("data", {"md5": md5, "stocks": datas});
  }
}

extension SharedPreferencesExt on SharedPreferences {
  Map<String, dynamic>? getMap(String key) {
    var j = getString(key);
    if (j == null) {
      return null;
    }
    return jsonDecode(j);
  }

  Future<bool> setMap(String key, Map<String, dynamic> value) {
    var j = jsonEncode(value);
    return setString(key, j);
  }

  List<dynamic>? getMapList(String key) {
    var j = getStringList(key);
    return j?.map((e) => jsonDecode(e)).toList();
  }

  Future<bool> setMapList(String key, List<dynamic> value) {
    var l = value.map((e) => jsonEncode(e)).toList();
    return setStringList(key, l);
  }
}
