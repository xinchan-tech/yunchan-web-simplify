import 'dart:convert';
import 'dart:io';
import 'dart:math';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_smart_dialog/flutter_smart_dialog.dart';
import 'package:mgjkn/Util/utils.dart';
import 'package:mgjkn/debug.dart';
import 'package:mgjkn/desktop/jk_style.dart';
import 'package:mgjkn/desktop/logger.dart';
import 'package:mgjkn/desktop/stock/kchart/entity/k_line_entity.dart';
import 'package:mgjkn/desktop/stock/kchart/indicator/indicator_manager.dart';
import 'package:mgjkn/desktop/stock/kchart/kline_data_controller.dart';
import 'package:mgjkn/desktop/stock/stock_data_manager.dart';
import 'package:mgjkn/extensions/extension_widget.dart';
import 'package:mgjkn/network/network.dart';
import 'package:mgjkn/widgets/widget.dart';

class IndicatorItem {
  String id;
  bool authorized;
  String name;
  List param; //公式参数
  String type; // 1主图  2附图
  String dbType; // 后端区分表用
  String formula;
  String value; // 区分服务端计算还是本地计算
  List<IndicatorItem> items;

  List data = [];
  IndicatorItem({
    required this.name,
    required this.id,
    this.type = "",
    required this.dbType,
    this.authorized = false,
    this.items = const [],
    this.formula = "",
    this.value = "",
    this.param = const [],
  });

  factory IndicatorItem.copyFrom(IndicatorItem other) {
    return IndicatorItem(
      name: other.name,
      id: other.id,
      dbType: other.dbType,
      type: other.type,
      authorized: other.authorized,
      value: other.value,
      formula: other.formula,
      param: other.param,
      items: other.items,
    );
  }

  factory IndicatorItem.fromJson(Map<String, dynamic> json) {
    var formula = json["formula"] ?? "";
    if (formula.isNotEmpty) {
      formula = Utils.decoding(formula);
    }
    return IndicatorItem(
      id: json["id"],
      authorized: json["authorized"] == 1,
      name: json["name"],
      items: json["items"] == null ? [] : List<IndicatorItem>.from(json["items"]!.map((x) => IndicatorItem.fromJson(x))),
      type: json["type"] ?? "",
      dbType: json["db_type"] ?? "",
      value: json["value"] ?? "",
      formula: formula,
      param: json["param"] ?? [],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      "id": id,
      "authorized": authorized,
      "name": name,
      "type": type,
      "db_type": dbType,
      "value": value,
      "formula": Utils.encoding(formula),
      "param": param,
      "items": items.map((e) => e.toJson()).toList(),
    };
  }

  bool get isEmpty {
    return id == "-1";
  }

  bool get isNotEmpty {
    return !isEmpty;
  }

  @override
  int get hashCode => name.hashCode;

  @override
  bool operator ==(Object other) {
    return other is IndicatorItem && id == other.id;
  }

  var isLoading = false;

  getMaxMin(int begin, int end, int index, int totalLength) {
    var maxx = -double.maxFinite;
    var minn = double.maxFinite;
    for (var item in data) {
      var val = 0.0;
      String funcName = item["draw"] ?? "";
      if (funcName.isEmpty) {
        var v = (item["data"] as List).reversed.elementAtOrNull(index);
        if (v is String || v == null) {
          continue;
        }
        val = v.toDouble();
        maxx = max(maxx, val);
        minn = min(minn, val);
      } else {
        var m = item["data"];
        if (m != null && m is Map) {
          var idx = totalLength - index;
          var i = m[idx.toString()];
          if (i == null) continue;
          switch (funcName) {
            case "STICKLINE":
              double ma = max(i[0].toDouble(), i[1].toDouble());
              maxx = max(maxx, ma);
              double mi = min(i[0].toDouble(), i[1].toDouble());
              minn = min(minn, mi);
              break;
            case "DRAWBAND":
              double ma = max(i[0].toDouble(), i[2].toDouble());
              maxx = max(maxx, ma);
              double mi = min(i[0].toDouble(), i[2].toDouble());
              minn = min(minn, mi);
            case "DRAWTEXT":
              maxx = max(maxx, i[0].toDouble());
              minn = min(minn, i[0].toDouble());
              break;
            default:
              continue;
          }
        } else {
          continue;
        }
      }
    }
    return (maxx, minn);
  }

  getData(JKStockDataEntity currentStock, {required Function onResult}) async {
    bool useNetwork = value == "svr_policy";
    if (Platform.isMacOS) {
      return;
    }
    if (useNetwork) {
      var startTime = Utils.getStockStartDate(currentStock.stockTime);
      if (startTime.isNotEmpty) {
        startTime = "$startTime 00:00:00";
      }
      network.indicatorData(id: id, stockCode: currentStock.stockCode, stockTime: currentStock.stockTime, startTime: startTime, param: getParameter(), dbType: dbType).then((res) {
        if (res.success) {
          data = res.json["data"]["result"] ?? [];
        } else {
          data = [];
        }
        onResult.call();
      });
    } else {
      if (currentStock.datas.isEmpty || formula.isEmpty) return;
      var localParameter = getParameter();
      var p = "";
      for (var item in localParameter.keys) {
        p += "$item:=${localParameter[item]};";
      }
      if (Debug.enableLocalIndicator == 1) {
        IndicatorManager.shared.calculateData(currentStock, p + formula, onResult: (json) {
          data = jsonDecode(json);
          onResult.call();
        });
      } else {
        IndicatorManager.shared.runInIsolate(currentStock, p + formula, onResult: (json) {
          logger.d("calculateData  end");
          data = jsonDecode(json);
          onResult.call();
        });
      }
    }
  }

  setParameterFor(Map<String, dynamic> value) {
    CacheManager.shared.storage.setMap(id, value);
  }

  Map<String, dynamic> getParameter() {
    var local = CacheManager.shared.storage.getMap(id) ?? {};
    for (var item in param) {
      var key = item[0];
      var defaultValue = item[1];
      if (local[key] == null) {
        local[key] = defaultValue;
      }
    }
    return local;
  }
}

class JKPopupWidget extends StatefulWidget {
  Widget child;
  Widget popupChild;
  Alignment alignment;
  double? width;
  double? height;
  int titleCount;
  Function? onInitWidget;

  JKPopupWidget({required this.child, required this.popupChild, required this.alignment, this.width, this.height, this.titleCount = 0, this.onInitWidget, super.key});

  @override
  _JKPopupWidgetState createState() => _JKPopupWidgetState();
}

class _JKPopupWidgetState extends State<JKPopupWidget> {
  @override
  void initState() {
    super.initState();
    widget.onInitWidget?.call();
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () {
        SmartDialog.showAttach(
            targetContext: context,
            alignment: widget.alignment,
            maskColor: Colors.transparent,
            builder: (_) {
              return widget.popupChild;
            });
      },
      child: widget.child,
    );
  }
}

class IndicatorMenu extends StatefulWidget {
  IndicatorMenu(this.dataController, this.groupValue,
      {required this.chartKey,
      required this.titles,
      required this.contents,
      this.width = 150,
      this.height = 320,
      this.search = true,
      this.isChekcBox = false,
      this.isMainState = true,
      this.isEventState = false,
      this.showSetting = false,
      super.key});

  final KLineDataController dataController;
  final String chartKey;
  IndicatorItem groupValue = IndicatorItem(name: "无", id: "-1", dbType: "local");
  double width;
  double height;
  bool isChekcBox;
  bool isMainState;
  bool isEventState;
  bool search;
  // bool showHide;
  bool showSetting;
  final List<String> titles;
  final List<List<IndicatorItem>> contents;

  @override
  State<IndicatorMenu> createState() => _IndicatorMenuState();
}

class _IndicatorMenuState extends State<IndicatorMenu> {
  var keyword = "";

  @override
  Widget build(BuildContext context) {
    List<dynamic> meunsContents = [];

    for (var elements in widget.contents) {
      var li = [];
      for (var element in elements) {
        if (keyword.isNotEmpty) {
          if (element.name.contains(keyword)) {
            li.add(element);
          }
        } else {
          li.add(element);
        }
      }
      meunsContents.add(li);
    }

    var wid = widget.width * meunsContents.length;
    wid = wid < 150 ? 150 : wid;
    return Column(
      children: [
        widget.search
            ? Row(crossAxisAlignment: CrossAxisAlignment.center, children: [
                Image.asset("assets/images/ic_search.png", width: 14, height: 14).padding(left: 4),
                JKTextField(
                  hintText: "搜索指标",
                  fontSize: 14,
                  onChanged: (value) {
                    var v = value.replaceAll("'", "");
                    keyword = v;
                    setState(() {});
                  },
                ).board(width: wid - 50, height: 30, paddigTop: 3),
                widget.showSetting
                    ? Image.asset("assets/images/ic_settings.png", width: 20, height: 20).padding(right: 4).action(() {
                        showPageSheet(context, const IndicatorSettings(), title: "指标参数编辑", width: 600, height: 620);
                      })
                    : const SizedBox(),
              ])
            : const SizedBox(),
        Row(
            children: List.generate(meunsContents.length, (index) {
          return getCol(widget.titles[index], meunsContents[index], borderRight: index != meunsContents.length - 1, isMainState: widget.isMainState);
        })),
      ],
    ).board(bgColor: JKStyle.theme.bgColor, all: 1, color: JKStyle.theme.dividerColorStrong, width: wid + 2, height: widget.height, radius: 3);
  }

  Widget getCol(
    String title,
    List<dynamic> menus, {
    bool borderRight = true,
    isMainState = true,
  }) {
    return Column(
      children: [
        // Container(
        //   decoration: BoxDecoration(
        //     color: JKStyle.theme.mainMenuColor,
        //     // border: const Border(
        //     //     top: BorderSide(
        //     //   color: Color.fromARGB(255, 68, 68, 68), // 右边框颜色
        //     //   width: 1.0, // 右边框宽度
        //     // )),
        //   ),
        //   height: 30,
        //   width: widget.width,
        //   child: Center(
        //     child: JKText(title, color: JKStyle.theme.white),
        //   ),
        // ),
        JKText(title, color: JKStyle.theme.white, center: true).board(
          bgColor: JKStyle.theme.mainMenuColor,
          height: 30,
          width: widget.width,
          top: 1,
          bottom: 1,
          color: JKStyle.theme.dividerColor,
        ),
        SizedBox(
          height: widget.height - 70,
          width: widget.width,
          child: widget.isChekcBox
              ? JKScrollView(
                  thumbVisibility: true,
                  child: Column(
                    children: List.generate(menus.length, (index) {
                      var item = menus[index];
                      var isSelected = widget.dataController.evenState.contains(item);
                      if (isMainState) {
                        if (widget.isEventState) {
                          isSelected = widget.dataController.infoEventMaps.keys.contains(item.name);
                        } else {
                          isSelected = widget.dataController.mainIndicator.contains(item);
                        }
                      }
                      return JKHover(
                          hoverColor: JKStyle.themeColor,
                          child: GestureDetector(
                            behavior: HitTestBehavior.translucent,
                            onTap: () {
                              if (item.authorized == false) {
                                showToast("暂无相关权限，请联系客服");
                                return;
                              }
                              if (isMainState) {
                                if (widget.isEventState) {
                                  widget.dataController.setInfoEvent(item.name, item.id, eventType: item.type);
                                } else {
                                  widget.dataController.setMainIndicator(item);
                                }
                              } else {
                                widget.dataController.changeEvenState(item);
                              }
                              setState(() {});
                            },
                            child: Row(children: [
                              JKImage("assets/images/checkbox_single_${isSelected ? "sel" : "nor"}.png", size: 20, color: isSelected ? JKStyle.themeColor : Colors.white)
                                  .padding(left: 5, right: 5),
                              Row(
                                children: [
                                  JKText(
                                    item.name,
                                    overflow: TextOverflow.ellipsis,
                                    textAlign: TextAlign.left,
                                    maxLines: 2,
                                  ),
                                  item.authorized ? const SizedBox() : const JKImage("assets/images/ic_lock.png", size: 16).padding(left: 5),
                                ],
                              ).board(width: widget.width - 50),
                            ]),
                          ).padding(top: 8, bottom: 8));
                    }),
                  ))
              : JKScrollView(
                  thumbVisibility: true,
                  child: Column(
                    children: List.generate(menus.length, (index) {
                      var item = menus[index];
                      var isSelected = widget.groupValue == item;
                      if (isMainState) {
                        if (widget.isEventState) {
                          isSelected = widget.dataController.infoEventMaps.keys.contains(item.name);
                        } else {
                          isSelected = widget.dataController.mainIndicator.contains(item);
                        }
                      }
                      var color = isSelected ? JKStyle.themeColor : Colors.white;
                      return JKHover(
                        hoverColor: JKStyle.themeColor,
                        child: Row(children: [
                          JKImage("assets/images/checkbox_single_${isSelected ? "sel" : "nor"}.png", size: 20, color: color).padding(left: 5, right: 5),
                          Row(
                            children: [
                              JKText(
                                item.name,
                                overflow: TextOverflow.ellipsis,
                                textAlign: TextAlign.left,
                                maxLines: 2,
                              ),
                              item.authorized ? const SizedBox() : const JKImage("assets/images/ic_lock.png", size: 16).padding(left: 5),
                            ],
                          ).board(width: widget.width - 50),
                        ]).padding(vertical: 10),
                      ).action(() {
                        if (item.authorized == false) {
                          showToast("暂无相关权限，请联系客服");
                          return;
                        }
                        if (isMainState) {
                          if (widget.isEventState) {
                            widget.dataController.setInfoEvent(item.name, item.id, eventType: item.type);
                          } else {
                            widget.dataController.setMainIndicator(item);
                          }
                        } else {
                          if (widget.chartKey.isNotEmpty) {
                            widget.groupValue = item!;
                            widget.dataController.setIndicatorChart(widget.chartKey, item);
                          }
                        }
                        setState(() {});
                      });
                    }),
                  )).board(right: 1, top: 1, color: Colors.grey.shade800),
        )
      ],
    );
  }
}

class MyDrawer extends StatefulWidget {
  @override
  _MyDrawerState createState() => _MyDrawerState();

  MyDrawer({required this.child, this.width = 0, this.height = 300, this.titleCount = 0, super.key});

  Widget child;
  double width;
  double height;
  int titleCount;
}

class _MyDrawerState extends State<MyDrawer> with SingleTickerProviderStateMixin {
  late AnimationController _animationController;
  bool _isDrawerOpen = false;

  @override
  void initState() {
    super.initState();
    _animationController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 200),
    );

    Future.delayed(const Duration(milliseconds: 50), () {
      _toggleDrawer();
    });
  }

  @override
  void dispose() {
    _animationController.dispose();
    super.dispose();
  }

  void _toggleDrawer() {
    setState(() {
      _isDrawerOpen = !_isDrawerOpen;
      if (_isDrawerOpen) {
        _animationController.forward();
      } else {
        _animationController.reverse();
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    var width = widget.width * widget.titleCount + 2 + widget.titleCount;
    width = width < 100 ? 100 : width;
    return AnimatedContainer(
      // color: Color.f,
      duration: const Duration(milliseconds: 200),
      height: _isDrawerOpen ? widget.height : 0.0,
      curve: Curves.easeInOut,
      child: Container(
        decoration: BoxDecoration(
          color: JKStyle.theme.bgColor,
          border: Border.all(color: Colors.grey.shade700),
          // borderRadius: BorderRadius.circular(5),
        ),
        width: width,
        child: ListView(
          physics: const NeverScrollableScrollPhysics(),
          children: [widget.child],
        ),
      ),
    );
  }
}

class IndicatorSettings extends StatefulWidget {
  const IndicatorSettings({super.key});

  @override
  State<IndicatorSettings> createState() => _IndicatorSettingsState();
}

class _IndicatorSettingsState extends State<IndicatorSettings> {
  var selectedFuncIndex = 0;
  var controller = ScrollController();

  List list = [];
  @override
  void initState() {
    super.initState();
    IndicatorManager.shared.indicatorList["main"].forEach((e) {
      e["indicators"].forEach((i) {
        if (i is Map && i["param"] != null) {
          list.add(i);
        }
      });
    });

    IndicatorManager.shared.indicatorList["secondary"].forEach((e) {
      e["indicators"].forEach((i) {
        if (i is Map && i["param"] != null) {
          list.add(i);
        }
      });
    });
  }

  @override
  Widget build(BuildContext context) {
    var selectedFunc = list[selectedFuncIndex];
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Column(
          mainAxisAlignment: MainAxisAlignment.start,
          children: [
            // const JKTextField().board(all: 1, width: 200, height: 30,p),
            RawScrollbar(
                controller: controller,
                thumbVisibility: true,
                thumbColor: JKStyle.theme.thumbColor,
                child: ListView.builder(
                    controller: controller,
                    itemCount: list.length,
                    itemBuilder: (context, index) {
                      return JKHover(hoverColor: JKStyle.themeColor, child: Align(alignment: Alignment.centerLeft, child: JKText(list[index]["name"]).padding(left: 15)))
                          .board(
                        height: 35,
                        bgColor: selectedFuncIndex == index ? JKStyle.theme.thumbColor : Colors.transparent,
                      )
                          .action(() {
                        selectedFuncIndex = index;
                        setState(() {});
                      });
                    })).board(width: 200, height: 600 - 20)
          ],
        ).board(all: 1),
        JKScrollView(
            child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const JKText("参数列表").padding(bottom: 10),
            Column(
                children: List.generate(selectedFunc["param"].length, (index) {
              var item = selectedFunc["param"][index];
              var funcId = selectedFunc["id"];
              var localValueMap = CacheManager.shared.storage.getMap(funcId) ?? {};
              var paramName = item[0];
              var defaultValue = item[1];
              var minValue = item[3];
              var maxValue = item[2];
              var localParamValue = localValueMap[paramName] ?? defaultValue;
              var textController = TextEditingController()..text = localParamValue.toString();
              return Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(children: [
                    JKText("参数名： $paramName"),
                    JKText(
                      "(默认:$defaultValue, 最小:$minValue, 最大:$maxValue)",
                      fontSize: 12,
                      color: Colors.grey.shade700,
                    ).padding(left: 10),
                  ]),
                  Row(
                    children: [
                      const JKText("参数值："),
                      JKTextField(
                        controller: textController,
                        fontSize: 14,
                        fontColor: JKStyle.theme.white,
                        hintText: "$defaultValue",
                        onChanged: (v) {
                          var vDouble = double.tryParse(v);
                          var maxDouble = double.tryParse(maxValue.toString());
                          var minDouble = double.tryParse(minValue.toString());
                          if (vDouble == null || maxDouble == null || minDouble == null) {
                            return;
                          }
                          var newValue = clampDouble(vDouble, minDouble, maxDouble);
                          localValueMap[paramName] = newValue.toDouble();
                          CacheManager.shared.storage.setMap(funcId, localValueMap);
                        },
                      ).board(bottom: 1, width: 100, paddigbottom: 2),
                    ],
                  ).padding(top: 2),
                ],
              ).padding(bottom: 10);
            })),
          ],
        ).board(width: 380, all: 0, paddigAll: 10).padding(left: 5))
      ],
    );
  }
}
