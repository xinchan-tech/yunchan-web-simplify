import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:mgjkn/desktop/settings_widget.dart';
import 'package:mgjkn/desktop/jk_style.dart';
import 'package:mgjkn/desktop/stock/kchart/chart_style.dart';
import 'package:mgjkn/desktop/stock/kchart/indicator/indicator_manager.dart';
import 'package:mgjkn/desktop/stock/kchart/indicator/indicator_menu.dart';
import 'package:mgjkn/desktop/stock/kchart/kchat_widget.dart';
import 'package:mgjkn/desktop/stock/kchart/kline_manager.dart';
import 'package:mgjkn/desktop/stock/kchart/state_enum.dart';
import 'package:mgjkn/desktop/stock/search_field.dart';
import 'package:mgjkn/desktop/stock/stock_left_menu.dart';
import 'package:mgjkn/desktop/user_info/account_info.dart';
import 'package:mgjkn/extensions/extension_widget.dart';
import 'package:mgjkn/desktop/logger.dart';
import 'package:mgjkn/Util/utils.dart';
import 'package:mgjkn/widgets/widget.dart';
import 'kline_data_controller.dart';

var currenSelectedFrame = 0;

class KLineVerticalWidget extends StatefulWidget {
  KLineVerticalWidget(this.frameId, this.width, this.height,
      {super.key,
      this.stockCode = "",
      this.stockName = "",
      this.stockTime = JKStockTimeType.day,
      this.searchTimePicker = true});

  final double width;
  final double height;

  final String frameId;
  String stockCode = "";
  String stockName = "";
  final bool searchTimePicker;
  JKStockTimeType stockTime = JKStockTimeType.day;

  @override
  State<StatefulWidget> createState() {
    return _KLineVerticalWidgetState();
  }
}

class _KLineVerticalWidgetState extends State<KLineVerticalWidget>
    with TickerProviderStateMixin {
  late KLineDataController dataController;

  @override
  void initState() {
    super.initState();
    logger.d("initStateinitState: ${widget.frameId}");
    dataController = KLineManager.shared.dataController(
        widget.stockCode, widget.stockName, widget.stockTime, widget.frameId);

    List ind = IndicatorManager.shared.indicatorList["secondary"] ?? [];
    for (var element in ind) {
      var name = element["name"] as String? ?? "";
      if (name.isEmpty) continue;
      meunsTitles.add(name);
      if (element["indicators"] != null) {
        var sub = (element["indicators"] as List)
            .map((e) => IndicatorItem.fromJson(e))
            .toList();
        meunsContents.add(sub);
      }
    }
  }

  List<String> meunsTitles = [];

  List<List<IndicatorItem>> meunsContents = [];
  @override
  Widget build(BuildContext context) {
    // logger.d("kline refresh");
    return GestureDetector(
      onTap: () {
        if (!dataController.isMulSelected) {
          KLineManager.shared.setFrameSelected(widget.frameId);
          setState(() {});
        }
      },
      child: KLineDataWidgetController(
        dataController: dataController,
        child: Column(
          children: <Widget>[
            Builder(builder: (BuildContext context) {
              var isSelected = dataController.isMulSelected &&
                  KLineManager.shared.isMultipleFrame;
              // logger.d("刷新 frame: ${dataController.frameId}, ${KLineManager.shared.selectedFrameIndex}");
              var selectedBorder =
                  isSelected ? Border.all(color: JKStyle.themeColor) : null;
              var dividerBorder = KLineManager.shared.isMultipleFrame
                  ? Border.all(color: JKStyle.theme.dividerColor)
                  : null;

              return Expanded(
                  child: Stack(
                alignment: Alignment.bottomLeft,
                children: <Widget>[
                  dataController.stockCode.isEmpty
                      ? Container(
                          width: widget.width,
                          height: widget.height,
                          decoration: BoxDecoration(
                            color: JKStyle.theme.bgBlackColor,
                            border: Border.all(
                                color: isSelected
                                    ? JKStyle.themeColor
                                    : const Color.fromARGB(100, 30, 30, 30),
                                width: 0.5),
                          ),
                          child: const JKText("请输入股票代码",
                              color: Colors.white, fontSize: 12, center: true),
                        )
                      : Container(
                          decoration: BoxDecoration(
                              border: selectedBorder ?? dividerBorder),
                          child: KChartWidget(
                            dataController:
                                KLineDataWidgetController.of(context),
                            width: widget.width - 2,
                            height: widget.height,
                          ),
                        ),
                  KLineManager.shared.isMultipleFrame
                      ? Positioned(
                          top: 10,
                          left: 10,
                          child: StockSearchField(
                            stockCode: dataController.stockCode,
                            stockName: dataController.stockName,
                            stockTime: dataController.stockTime,
                            timePicker: widget.searchTimePicker,
                            onSelected: (stock, time) {
                              dataController.setStockInfo(
                                  code: stock.code,
                                  name: stock.name,
                                  time: time);
                              KLineManager.shared
                                  .setFrameSelected(widget.frameId);
                              setState(() {});
                            },
                          ),
                        )
                      : const SizedBox(),
                  Positioned(
                    top: 0,
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: List.generate(
                          dataController.compareStocks.length, (index) {
                        var item = dataController.compareStocks.values
                            .elementAt(index);
                        return OverlayStockLabel(
                          stockCode: item.stockCode,
                          color: item.color,
                          onClosed: () {
                            dataController.removeCompareStock(item.stockCode);
                            setState(() {});
                          },
                        ).padding(right: 10, top: 5);
                      }),
                    ).board(width: widget.width),
                  ),
                  Stack(
                      children: List.generate(
                          dataController.indicatorChartMap.length, (index) {
                    var chartKey =
                        (dataController.indicatorChartMap.length - index)
                            .toString();
                    var indicator = dataController.indicatorChartMap[chartKey];
                    var popupWidgetPaddingLeft =
                        MainLeftMenuWidget.currentWidth.toDouble() + 55;
                    if (Settings.leftMenuShowState == 1) {
                      popupWidgetPaddingLeft -= 55;
                    }
                    return Positioned(
                      bottom: JKStyle.indicatorChartHeight * (index + 1) - 5,
                      left: 5,
                      child: JKPopupWidget(
                          width: 150,
                          titleCount: IndicatorManager
                                  .shared.indicatorList["secondary"]?.length ??
                              0,
                          popupChild: IndicatorMenu(
                            dataController,
                            width: 170,
                            chartKey: chartKey,
                            titles: meunsTitles,
                            contents: meunsContents,
                            indicator!,
                            showSetting: true,
                            isMainState: false,
                          ).padding(left: popupWidgetPaddingLeft),
                          alignment: Alignment.topCenter,
                          child: Container(
                            decoration: BoxDecoration(
                              color: Colors.transparent,
                              borderRadius: BorderRadius.circular(3),
                              border: Border.all(color: Colors.grey.shade800),
                            ),
                            padding: const EdgeInsets.only(left: 5, right: 5),
                            child: JKText(indicator.name,
                                color: Colors.grey.shade600, center: true),
                          )),
                    );
                  }))
                ],
              ));
            }),
          ],
        ),
      ),
    );
  }
}
