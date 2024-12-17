import 'package:tuple/tuple.dart';

enum JKStockTimeType {
  timePre, // 盘前
  time, // 盘中分时
  timeAft, // 盘后
  // timeNgt, // 夜盘
  time5, //5日分时
  min1,
  min2,
  min3,
  min5,
  min10,
  min15,
  min30,
  min45,
  hour1,
  hour2,
  hour3,
  hour4,
  day,
  week,
  month,
  quarter,
  month6,
  year
}

extension JKStockTimeTypeExt on JKStockTimeType {
  /// 判断是否是分时周期
  bool get isTickTime {
    switch (this) {
      case JKStockTimeType.timePre:
      case JKStockTimeType.timeAft:
      case JKStockTimeType.time:
      case JKStockTimeType.time5:
        return true;
      default:
        break;
    }

    return false;
  }

  /// 请求ID , 名称
  Tuple2<int, String> get rawValue {
    switch (this) {
      case JKStockTimeType.timePre:
        return const Tuple2(-1, "盘前分时");
      case JKStockTimeType.timeAft:
        return const Tuple2(-2, "盘后分时");
      case JKStockTimeType.time:
        return const Tuple2(0, "盘中分时");
      case JKStockTimeType.time5:
        return const Tuple2(7200, "多日分时");
      case JKStockTimeType.min1:
        return const Tuple2(1, "1分");
      case JKStockTimeType.min2:
        return const Tuple2(2, "2分");
      case JKStockTimeType.min3:
        return const Tuple2(3, "3分");
      case JKStockTimeType.min5:
        return const Tuple2(5, "5分");
      case JKStockTimeType.min10:
        return const Tuple2(10, "10分");
      case JKStockTimeType.min15:
        return const Tuple2(15, "15分");
      case JKStockTimeType.min30:
        return const Tuple2(30, "30分");
      case JKStockTimeType.min45:
        return const Tuple2(45, "45分");
      case JKStockTimeType.hour1:
        return const Tuple2(60, "1小时");
      case JKStockTimeType.hour2:
        return const Tuple2(120, "2小时");
      case JKStockTimeType.hour3:
        return const Tuple2(180, "3小时");
      case JKStockTimeType.hour4:
        return const Tuple2(240, "4小时");
      case JKStockTimeType.day:
        return const Tuple2(1440, "日线");
      case JKStockTimeType.week:
        return const Tuple2(10080, "周线");
      case JKStockTimeType.month:
        return const Tuple2(43200, "月线");
      case JKStockTimeType.quarter:
        return const Tuple2(129600, "季线");
      case JKStockTimeType.month6:
        return const Tuple2(259200, "半年");
      case JKStockTimeType.year:
        return const Tuple2(518400, "年线");
    }
  }

  static JKStockTimeType? getFrom(dynamic id) {
    if (id == null) {
      return null;
    }

    if (id is String) {
      id = int.tryParse(id) ?? id;
    }

    for (var item in JKStockTimeType.values) {
      if (item.rawValue.item1 == id || item.rawValue.item2 == id) {
        return item;
      }
    }
    return null;
  }
}
