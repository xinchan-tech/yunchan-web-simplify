import 'package:flutter/material.dart';
import 'package:flutter_smart_dialog/flutter_smart_dialog.dart';
import 'package:mgjkn/desktop/jk_style.dart';
import 'package:mgjkn/desktop/stock/backtest/calendar_widget.dart';
import 'package:mgjkn/desktop/stock/kchart/kline_manager.dart';
import 'package:mgjkn/desktop/stock/kchart/state_enum.dart';
import 'package:mgjkn/desktop/user_info/account_info.dart';
import 'package:mgjkn/extensions/extension_widget.dart';

import 'package:mgjkn/Util/utils.dart';
import 'package:mgjkn/widgets/widget.dart';

class LineAlarmWidget extends StatefulWidget {
  const LineAlarmWidget({super.key});

  @override
  State<LineAlarmWidget> createState() => _LineAlarmWidgetState();
}

class _LineAlarmWidgetState extends State<LineAlarmWidget> {
  var conditions = [
    ["仅一次", "警报仅会被触发一次,不会重复"],
    ["每天一次", "每天满足条件时触发一次"],
    ["每天收盘时一次", "每天收盘价满足条件时触发一次"],
    ["每分钟一次", "满足条件时,每分钟仅触发一次"]
  ];
  var selectedConditionIndex = 0;

  var methods = ["穿过", "上穿", "下穿"];
  var selectedMethodIndex = 0;

  var stopDate = DateTime.now().add(const Duration(days: 1));
  var alarmMessage = "";

  @override
  Widget build(BuildContext context) {
    var code = KLineManager.shared.selectedChartController.stockCode;
    var time = KLineManager.shared.selectedChartController.stockTime.rawValue.item2;
    return Column(
      children: [
        Row(
          children: [
            const JKText("触发条件", textAlign: TextAlign.left).board(width: 100),
            Column(
              children: [
                JKText("$code,$time,常规交易时间", center: true).board(all: 1, width: 230, height: 28, radius: 4),
                JKDropButtonNew(
                  items: methods,
                  selectedIndex: selectedMethodIndex,
                  dropWidth: 230,
                  dropBgColor: JKStyle.theme.bgColor,
                  fontsize: 14,
                  onChoosed: (v, idx) {
                    selectedMethodIndex = idx;
                    setState(() {});
                  },
                ).board(all: 1, width: 230, height: 28, radius: 4).padding(top: 5)
              ],
            )
          ],
        ),
        Row(
          children: [
            const JKText("提醒频率", textAlign: TextAlign.left).board(width: 100),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Wrap(
                  spacing: 5,
                  runSpacing: 5,
                  children: List.generate(conditions.length, (index) {
                    double w = index % 2 == 0 ? 120 : 90;
                    return JKButton(
                      conditions[index][0],
                      type: JKButtonType.boardSelColor,
                      width: w,
                      height: 28,
                      normalStyle: JKButtonStyle(borderColor: Colors.transparent),
                      selectedStyle: JKButtonStyle(bgColor: JKStyle.themeColor, fontColor: JKStyle.theme.white),
                      isSelected: selectedConditionIndex == index,
                      onPressed: () {
                        selectedConditionIndex = index;
                        setState(() {});
                      },
                    );
                  }),
                ).board(width: 230, all: 1, paddigAll: 5, radius: 4),
                JKText(conditions[selectedConditionIndex][1], fontSize: 11, color: Colors.grey.shade600).padding(top: 5)
              ],
            )
          ],
        ).padding(vertical: 15),
        Row(
          children: [
            const JKText("到期时间", textAlign: TextAlign.left).board(width: 100),
            JKButton(
              Utils.formatDate(stopDate, format: "yyyy-MM-dd"),
              width: 228,
              height: 28,
              onCtxPressed: (ctx) async {
                SmartDialog.showAttach(
                  targetContext: ctx,
                  alignment: Alignment.bottomCenter,
                  maskColor: Colors.transparent,
                  builder: (_) {
                    return JKCalendarWidget(
                      initialDate: stopDate,
                      minDate: DateTime.now(),
                      onSelected: (date) {
                        stopDate = date;
                        setState(() {});
                      },
                    )
                        .board(
                          width: 300,
                          height: 310,
                          paddigAll: 5,
                          bgColor: JKStyle.theme.bgColor,
                          all: 1,
                          radius: 4,
                        )
                        .padding(bottom: 10);
                  },
                );
                // DateTime? dateTime = await showOmniDateTimePicker(
                //   context: context,
                //   isShowSeconds: false,
                //   type: OmniDateTimePickerType.date,
                // );
                // if (dateTime != null) {
                //   stopDate = dateTime.secondsSinceEpoch;
                //   setState(() {});
                // }
              },
            ).board(all: 1, radius: 4)
          ],
        ),
        Row(
          children: [
            const JKText("报警名称", textAlign: TextAlign.left).board(width: 100),
            const JKTextField(fontSize: 14, borderColor: Colors.transparent)
                .board(all: 1, width: 230, height: 28, radius: 4, paddigTop: 5)
          ],
        ).padding(vertical: 15),
        Row(
          children: [
            const JKText("报警消息", textAlign: TextAlign.left).board(width: 100),
            TextField(
              textAlignVertical: TextAlignVertical.bottom,
              decoration: InputDecoration(
                isDense: true,
                hintStyle: TextStyle(color: Colors.grey.shade800, fontSize: 14),
                enabledBorder: const OutlineInputBorder(borderSide: BorderSide(color: Colors.transparent)),
                focusedBorder: const OutlineInputBorder(borderSide: BorderSide(color: Colors.transparent)),
                contentPadding: const EdgeInsets.only(left: 5, right: 5, top: 5, bottom: 5),
              ),
              style: const TextStyle(color: Colors.grey, fontSize: 14),
              maxLines: null,
              onChanged: (value) {
                alarmMessage = value;
              },
            ).board(all: 1, width: 230, height: 60, radius: 4)
          ],
        ),
        JKButton("确定", type: JKButtonType.boardSelColor, isSelected: true, width: 80, height: 30, onPressed: () {
          if (UserInfo.shared.isLogin == false) {
            showToast("请先登录");
            return;
          }
        }).padding(top: 40)
      ],
    ).padding(vertical: 20, horizontal: 15);
  }
}
