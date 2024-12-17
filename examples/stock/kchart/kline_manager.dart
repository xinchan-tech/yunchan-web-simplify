import 'package:mgjkn/desktop/logger.dart';
import 'package:mgjkn/desktop/stock/kchart/entity/k_line_entity.dart';
import 'package:mgjkn/desktop/stock/kchart/indicator/indicator_menu.dart';
import 'package:mgjkn/desktop/stock/kchart/kline_data_controller.dart';
import 'package:mgjkn/desktop/stock/kchart/state_enum.dart';
import 'package:mgjkn/network/network.dart';
import 'package:mgjkn/notification.dart';

class KLineManager {
  static KLineManager? _instance;

  static KLineManager get shared {
    _instance ??= KLineManager._();
    return _instance!;
  }

  KLineManager._() {
    makeFirstFrame();
  }

  final Map<String, KLineDataController> _chartControllers = {};

  bool get isMultipleFrame {
    return _chartControllers.values.length > 1;
  }

  // 多图选择的参数
  var selectedFrameIndex = 0;
  var preferenceMultiple2Frames = 0;
  var preferenceMultiple3Frames = 0;

  dataController(String code, String name, JKStockTimeType time, String frameId) {
    if (!_chartControllers.containsKey(frameId)) {
      var firstCtl = _chartControllers.values.first;
      if (code.isEmpty) {
        code = firstCtl.stockCode;
        name = firstCtl.stockName;
        time = firstCtl.stockTime;
        var ctl = KLineDataController(frameId: frameId, stockCode: code, stockName: name, stockTime: time);
        for (var item in firstCtl.mainIndicator) {
          var ind = IndicatorItem.copyFrom(item);
          ctl.mainIndicator.add(ind);
        }

        for (var key in firstCtl.indicatorChartMap.keys) {
          var item = firstCtl.indicatorChartMap[key];
          if (item == null) continue;
          var ind = IndicatorItem.copyFrom(item);
          ctl.indicatorChartMap[key] = ind;
        }
        _chartControllers[frameId] = ctl;
      } else {
        _chartControllers[frameId] =
            KLineDataController(frameId: frameId, stockCode: code, stockName: name, stockTime: time);
      }
    }
    return _chartControllers[frameId]!;
  }

  makeFirstFrame() {
    _chartControllers["0"] = KLineDataController(frameId: "0");
  }

  setFrameSelected(String frameId) {
    logger.d("frameSelected $frameId");
    for (var element in _chartControllers.values) {
      if (element.isMulSelected) {
        element.setMulSelected(false, notify: false);
        break;
      }
    }
    _chartControllers[frameId]?.setMulSelected(true);
    eventBus.fire(_chartControllers[frameId]);
  }

  KLineDataController get selectedChartController {
    for (var element in _chartControllers.values) {
      if (element.isMulSelected) {
        return element;
      }
    }
    return _chartControllers.values.first;
  }

  removeDataController(List<String> frameIds) {
    var resetSelected = false;
    frameIds.forEach((element) {
      if (_chartControllers.containsKey(element)) {
        if (_chartControllers[element]!.isMulSelected) {
          resetSelected = true;
        }
        _chartControllers.remove(element);
      }
    });

    if (resetSelected) {
      setFrameSelected("0");
    }
  }
}
