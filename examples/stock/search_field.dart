import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_smart_dialog/flutter_smart_dialog.dart';
import 'package:mgjkn/desktop/jk_style.dart';
import 'package:mgjkn/desktop/settings_widget.dart';
import 'package:mgjkn/desktop/stock/kchart/state_enum.dart';
import 'package:mgjkn/desktop/stock/panit/searchfield.dart';
import 'package:mgjkn/desktop/stock/stock_data_manager.dart';
import 'package:mgjkn/extensions/extension_widget.dart';
import 'package:mgjkn/model/model.dart';
import 'package:mgjkn/Util/utils.dart';
import 'package:mgjkn/widgets/widget.dart';

class StockSearchField extends StatefulWidget {
  @override
  _StockSearchFieldState createState() => _StockSearchFieldState();

  StockSearchField({
    super.key,
    this.stockCode = "",
    this.stockName = "",
    this.stockTime = JKStockTimeType.day,
    this.timePicker = false,
    required this.onSelected,
    // this.focusNode,
  });

  Function(StockInfo, JKStockTimeType) onSelected;
  String stockCode;
  String stockName;
  JKStockTimeType stockTime;
  bool timePicker;
  // focusNode focusNode;
}

class _StockSearchFieldState extends State<StockSearchField> {
  bool isEditing = false;
  FocusNode focusNode = FocusNode(skipTraversal: true);

  // List<dynamic> allCode = [];
  void toggleEdit(TapDownDetails details) {
    RenderBox renderBox = context.findRenderObject() as RenderBox;
    Offset localPosition = renderBox.globalToLocal(details.globalPosition);
    double widgetWidth = renderBox.size.width;
    double distance = widgetWidth - localPosition.dx;
    var textLength = widget.stockTime.rawValue.item2.length * 12 + 12;

    //  判断弹出的菜单距离
    var windowHeight = context.height;
    var clickHeight = details.globalPosition.dy;
    var menuHeight = 26.0 * (JKStockTimeType.values.length) + 2;
    var maxHeight = windowHeight - clickHeight;

    if (menuHeight > maxHeight) {
      menuHeight = maxHeight;
    } else {
      menuHeight = menuHeight + 20;
    }

    if (distance < textLength && widget.timePicker && widget.stockCode.isNotEmpty) {
      SmartDialog.showAttach(
          targetContext: context,
          maskColor: Colors.transparent,
          alignment: FractionalOffset.bottomRight,
          builder: (_) {
            var menu = Column(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: List.generate(
                JKStockTimeType.values.length,
                (index) {
                  var item = JKStockTimeType.values[index];
                  var height = 26.0;
                  return JKButton(
                    item.rawValue.item2,
                    height: height,
                    fontSize: 12,
                    type: JKButtonType.selRectColor,
                    width: 68,
                    onPressed: () {
                      widget.onSelected(StockInfo(code: widget.stockCode, name: widget.stockName), item);
                      SmartDialog.dismiss();
                      setState(() {});
                    },
                    isSelected: item.rawValue.item2 == widget.stockTime.rawValue.item2,
                  ).padding(left: 2.5, right: 2.5);
                },
              ),
            );

            return JKScrollView(child: menu).board(all: 1, bgColor: JKStyle.theme.bgColor, width: 70, height: menuHeight - 20, radius: 4).padding(right: 60);
          });
      return;
    }
    setState(() {
      isEditing = !isEditing;
      if (isEditing) {
        focusNode.requestFocus();
      }
    });
  }

  List<SearchFieldListItem<String>> suggestions = [];
  var lastAllStockMapHash = 0;
  setupSuggestions() {
    if (suggestions.isNotEmpty && CacheManager.allStockMap.hashCode == lastAllStockMapHash) return;
    lastAllStockMapHash = CacheManager.allStockMap.hashCode;
    var keys = CacheManager.allStockMap.keys.toList();
    keys.sort();
    suggestions.clear();
    for (var i = 0; i < keys.length; i++) {
      var key = keys[i];
      var item = CacheManager.allStockMap[key]!;
      var code = item[1];
      var name = Settings.isChineseLanguage ? item.safeAt(3) : item.safeAt(2);
      var s = SearchFieldListItem<String>(
        code,
        item: item.join("@@@"),
        child: JKHover(
            child: Padding(
          padding: const EdgeInsets.only(top: 2, left: 10, right: 5, bottom: 2),
          child: SizedBox(height: 40, child: JKStockName(code, name)),
        )),
      );
      suggestions.add(s);
    }
  }

  @override
  void initState() {
    focusNode ??= FocusNode(skipTraversal: true);
    super.initState();
  }

  void handleOptionChanged(dynamic value) {
    setState(() {
      isEditing = false;
    });
  }

  // @override
  // void deactivate() {
  //   focusNode.dispose();
  //   super.deactivate();
  // }

  final String _historyKey = "stockSearchHistory_fix_bug";
  setHistory(StockInfo item) async {
    List history = CacheManager.shared.storage.getMapList(_historyKey) ?? [];
    Map info = item.toMap();
    history.removeWhere((element) => element["symbol"] == info["symbol"]);
    history.insert(0, info);
    const int maxLength = 20;
    if (history.length > maxLength) {
      history.removeRange(maxLength, history.length);
    }

    CacheManager.shared.storage.setMapList(_historyKey, history);
  }

  Widget? getHistory() {
    List<dynamic> historyMap = CacheManager.shared.storage.getMapList(_historyKey) ?? [];
    if (historyMap.isEmpty) {
      return null;
    }

    if (historyMap.length > 10) {
      historyMap.removeRange(10, historyMap.length);
    }

    var h = historyMap.length * 50.0 + 40;
    return TextFieldTapRegion(
        child: Container(
      decoration:
          BoxDecoration(border: Border.all(color: JKStyle.theme.dividerColorStrong), color: JKStyle.theme.bgColor, borderRadius: const BorderRadius.all(Radius.circular(4))),
      // padding: const EdgeInsets.all(0),
      width: 200,
      height: h,
      child: Column(mainAxisAlignment: MainAxisAlignment.start, children: [
        Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
          const JKText("最近搜索"),
          JKButton(
            "清空搜索记录",
            tooltips: true,
            imageSize: 14,
            type: JKButtonType.imageOnly,
            width: 18,
            image: "assets/images/del.png",
            onPressed: () {
              CacheManager.shared.storage.remove(_historyKey);
              focusNode.unfocus();
            },
          )
        ]).padding(left: 10, right: 10, top: 10, bottom: 5),
        Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: List.generate(
            historyMap.length,
            (index) {
              var info = historyMap[index];
              if (info is String) {
                return const SizedBox();
              }
              var item = StockInfo.fromMap(info);
              return JKHover(
                  child: GestureDetector(
                child: JKStockName(item.code, item.name).board(paddigLeft: 5, height: 50, width: 200, top: 1, color: JKStyle.theme.dividerColorStrong),
                onTap: () {
                  widget.onSelected(item, widget.stockTime);
                  setHistory(item);
                  focusNode.unfocus();
                },
              ));
            },
          ),
        )
      ]),
    ));
  }

  @override
  Widget build(BuildContext context) {
    if (widget.stockCode.isEmpty) {
      isEditing = true;
    }
    setupSuggestions();
    var searchField = SizedBox(
      width: 130,
      height: 50,
      child: Row(
        children: [
          Image.asset("assets/images/ic_search.png", width: 14, height: 14).padding(right: 5, top: 2),
          SizedBox(
            width: 111,
            child: SearchField<String>(
              initWidget: getHistory(),
              marginColor: JKStyle.theme.dividerColorStrong,
              // emptyWidget: Container(
              //   color: Colors.amberAccent,
              //   width: 100,
              //   height: 150,
              //   child: Text("empty View"),
              // ),
              focusNode: focusNode,
              itemHeight: 50,
              autoCorrect: false,
              hint: "搜索股票",
              inputType: TextInputType.emailAddress,
              searchInputDecoration: InputDecoration(
                isDense: true,
                // hintText: hintText,
                labelStyle: TextStyle(color: Colors.grey.shade800, fontSize: 14, height: 1),
                hintStyle: TextStyle(color: Colors.grey.shade700, fontSize: 14),
                enabledBorder: const OutlineInputBorder(borderSide: BorderSide(color: Colors.transparent)),
                focusedBorder: const OutlineInputBorder(borderSide: BorderSide(color: Colors.transparent)),
                contentPadding: const EdgeInsets.only(left: 5, right: 5, top: 0, bottom: 0),
              ),
              searchStyle: TextStyle(color: JKStyle.theme.textGreyColor2, fontSize: 14),
              offset: const Offset(-30, 24),
              maxSuggestionsInViewPort: 10,
              suggestions: suggestions,
              onSuggestionTap: (p0) {
                isEditing = false;
                if (p0.item != null) {
                  var l = p0.item!.split("@@@");
                  var code = l.safeAt(1) ?? "--";
                  var name = Settings.isChineseLanguage ? l.safeAt(3) : l.safeAt(2);
                  var info = StockInfo(code: code, name: name ?? code);
                  widget.onSelected(info, widget.stockTime);
                  setHistory(info);
                }
                setState(() {});
              },
              onDismissed: () {
                isEditing = false;
                Future.delayed(const Duration(milliseconds: 50), () {
                  setState(() {});
                });
              },
              onFocus: () {
                // widget.onTap?.call();
              },
            ),
          )
        ],
      ),
    );

    return GestureDetector(
        behavior: HitTestBehavior.opaque,
        onTapDown: toggleEdit,
        child: Container(
          decoration: BoxDecoration(
            color: JKStyle.theme.dividerColor,
            borderRadius: BorderRadius.circular(4),
            border: Border.all(color: JKStyle.theme.dividerColorStrong),
          ),
          padding: const EdgeInsets.only(left: 10, right: 10, bottom: 2),
          height: 24,
          child: isEditing
              ? searchField
              : IntrinsicWidth(
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.center,
                    children: [
                      Text(
                        widget.stockCode,
                        style: TextStyle(fontSize: 12.0, color: JKStyle.theme.white),
                      ),
                      // Padding(
                      //   padding: const EdgeInsets.only(left: 10, right: 10),
                      //   child: ConstrainedBox(
                      //     constraints: const BoxConstraints(maxWidth: 170),
                      //     child: Text(
                      //       widget.stockName,
                      //       style: const TextStyle(fontSize: 12.0, color: Colors.grey, overflow: TextOverflow.ellipsis),
                      //     ),
                      //   ),
                      // ),
                      const SizedBox(width: 20),
                      Text(
                        widget.stockTime.rawValue.item2,
                        style: const TextStyle(fontSize: 12.0, color: Colors.grey),
                      )
                    ],
                  ),
                ),
        ));
  }
}
