import 'dart:ffi';

import 'package:flutter/material.dart';
import 'package:mgjkn/widgets/widget.dart';

class BackTestSetting extends StatefulWidget {
  const BackTestSetting({super.key});

  @override
  State<BackTestSetting> createState() => _BackTestSettingState();
}

class _BackTestSettingState extends State<BackTestSetting> {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
        body: Column(
      children: [
        JKText("选择开始日期"),
        JKButton(
          "2024-11-11",
          onPressed: () async {
            // showTimePicker(context: context, initialTime: TimeOfDay(hour: 9, minute: 30));
            var dd = await showDatePicker(
                context: context,
                firstDate: DateTime.now().subtract(const Duration(days: 30)),
                lastDate: DateTime.now());
          },
        )
        // DatePickerDialog(
        //   firstDate: DateTime.now().subtract(const Duration(days: 30)),
        //   lastDate: DateTime.now(),
        //   initialEntryMode: DatePickerEntryMode.calendarOnly,
        // ),
      ],
    ));
  }
}
