import 'package:flutter/material.dart';
import 'package:mgjkn/desktop/stock/kchart/kline_data_controller.dart';
import 'package:mgjkn/desktop/stock/panit/base_paint.dart';
import 'package:mgjkn/desktop/stock/panit/paint_enum.dart';
import 'package:mgjkn/extensions/extension_widget.dart';
import 'package:mgjkn/desktop/logger.dart';

class PaintManager {
  KLineDataController dataController;
  PaintManager({required this.dataController});
  BuildContext? context;
  JKUserPathType _currentPaintType = JKUserPathType.none;

  JKUserPathType get currentPaintType => _currentPaintType;

  double xFromInfo(String info) {
    List<String> l = info.split("@");
    String date = l.first;
    String offset = l.last;
    int idx = dataController.currentStock.dateIndex.indexOf(date);
    if (idx == -1) {
      for (var i = 0; i < dataController.currentStock.dateIndex.length; i++) {
        var item = dataController.currentStock.dateIndex[i];
        if (item.compareTo(date) == -1) {
          // debugPrint("item+1: ${dataController.currentStock.dateIndex[i + 1]}");
          // debugPrint("item: $item,  date: $date");
          // print("item-1: ${dataController.currentStock.dateIndex[i - 1]}");
          idx = i;
          break;
        }
      }
    }
    if (idx == -1) return 0;
    double x = dataController.xFromIndex(idx.toDouble());
    double itemWidth = dataController.candleWidth;

    var offsetX = double.parse(offset);
    if (offsetX >= 1) {
      return x + offsetX * itemWidth + itemWidth * 0.5;
    } else {
      return x - offsetX * itemWidth + itemWidth * 0.5;
    }
  }

  bool enablePaint = true;

  void clearAll() {
    dataController.currentStock.paintDatas.clear();
    currentPaintType = JKUserPathType.none;
    currentPaint = null;
  }

  String infoFromX(double x, {bool integer = false}) {
    if (x.isInfinite) {
      return '0@0';
    }

    var idx = dataController.indexFromX(x);
    if (idx < 0) {
      var date = dataController.currentStock.dateIndex.safeAt(dataController.mStartIndex);
      if (date == null) {
        return '0@0';
      }
      String i = (idx.abs()).toStringAsFixed(3);

      return integer ? '$date@0.5' : '$date@$i';
    } else {
      var m = dataController.currentStock.dateIndex.safeAt(idx.floor());
      if (m == null) {
        return '0@0';
      }
      String i = (idx.abs() % 1.0).toStringAsFixed(3);
      return integer ? '$m@0.5' : '$m@$i';
    }
  }

  set currentPaintType(JKUserPathType value) {
    if (value != _currentPaintType) {
      _currentPaintType = value;
      logger.d('myProperty has changed to: $value');
      currentPaint = null;
    }
  }

  ShapeComponent? currentPaint;

  void forEach(void Function(ShapeComponent element) action) {
    for (var item in dataController.currentStock.paintDatas) {
      if (item != currentPaint) {
        action(item);
      }
    }
    if (currentPaint != null) {
      action(currentPaint!);
    }
  }

  prepare() {
    currentPaint ??= currentPaintType.getPath;
  }
}
