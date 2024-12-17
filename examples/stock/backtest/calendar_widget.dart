import 'package:flutter/material.dart';
import 'package:flutter_smart_dialog/flutter_smart_dialog.dart';
import 'package:intl/intl.dart';
import 'package:mgjkn/desktop/jk_style.dart';
import 'package:mgjkn/extensions/extension_widget.dart';
import 'package:mgjkn/widgets/widget.dart';

class JKCalendarWidget extends StatefulWidget {
  @override
  _JKCalendarWidgetState createState() => _JKCalendarWidgetState();

  const JKCalendarWidget({super.key, this.onSelected, this.minDate, this.maxDate, this.initialDate});

  final DateTime? minDate;
  final DateTime? maxDate;
  final DateTime? initialDate;

  final Function(DateTime)? onSelected;
}

class _JKCalendarWidgetState extends State<JKCalendarWidget> {
  late DateTime _currentDate;

  @override
  void initState() {
    _currentDate = widget.initialDate ?? DateTime.now();
    super.initState();
  }

  @override
  Widget build(BuildContext context) {
    var showNextMonth = true;
    if (widget.maxDate != null) {
      showNextMonth = _currentDate.month <= widget.maxDate!.month;
    }

    return Column(
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            IconButton(
              iconSize: 16,
              color: JKStyle.theme.white,
              icon: const Icon(Icons.arrow_back_ios),
              onPressed: _prevMonth,
            ),
            JKText(DateFormat('yyyy年MM月').format(_currentDate), fontSize: 16, fontWeight: FontWeight.bold),
            showNextMonth
                ? IconButton(
                    iconSize: 16,
                    color: JKStyle.theme.white,
                    icon: const Icon(Icons.arrow_forward_ios),
                    onPressed: _nextMonth,
                  )
                : const SizedBox(width: 40, height: 40),
          ],
        ),
        const SizedBox(height: 16),
        // 星期
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceAround,
          children: [
            for (var day in ['日', '一', '二', '三', '四', '五', '六']) JKText(day, fontWeight: FontWeight.bold),
          ],
        ),
        const SizedBox(height: 8),
        // 日期
        Expanded(
          child: GridView.builder(
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 7,
              childAspectRatio: 1,
            ),
            itemCount: 35,
            itemBuilder: (context, index) {
              final nowDate = DateTime.now();
              final date = _getDateForIndex(index);
              final isCurrentMonth = date.month == _currentDate.month;
              final isToday = date.day == nowDate.day && date.month == nowDate.month && date.year == nowDate.year;
              final isSelecteDay = widget.initialDate?.isAtSameMomentAs(date) ?? false;

              var fw = isSelecteDay ? FontWeight.bold : FontWeight.normal;
              var textColor = JKStyle.theme.white;
              if (isCurrentMonth == false) {
                textColor = JKStyle.theme.white.withOpacity(0.8);
              }
              if (widget.maxDate != null && date.isAfter(widget.maxDate!)) {
                textColor = JKStyle.theme.white.withOpacity(0.1);
              }
              var bgColor = Colors.transparent;
              if (isToday) {
                bgColor = JKStyle.themeColor.withAlpha(50);
              } else if (isSelecteDay) {
                bgColor = JKStyle.themeColor;
              }

              return JKHover(
                      hoverColor: JKStyle.themeColor,
                      child: JKText('${date.day}', color: textColor, fontWeight: fw, center: true)
                          .board(bgColor: bgColor, radius: 2))
                  .action(() {
                if (widget.maxDate != null && date.isAfter(widget.maxDate!)) {
                  var isToday = date.day == widget.maxDate!.day &&
                      date.month == widget.maxDate!.month &&
                      date.year == widget.maxDate!.year;
                  if (isToday) {
                    showToast("选择的时间不能超过今天");
                    return;
                  } else {
                    showToast("选择的时间不能超过${DateFormat('yyyy年MM月dd日').format(widget.maxDate!)}");
                  }
                }
                SmartDialog.dismiss();
                widget.onSelected?.call(date);
              });
            },
          ),
        ),
      ],
    );
  }

  void _prevMonth() {
    setState(() {
      _currentDate = DateTime(_currentDate.year, _currentDate.month - 1);
    });
  }

  void _nextMonth() {
    if (widget.maxDate != null && _currentDate.month > widget.maxDate!.month) return;
    setState(() {
      _currentDate = DateTime(_currentDate.year, _currentDate.month + 1);
    });
  }

  // int _getDaysInMonth() {
  //   final firstDayOfMonth = DateTime(_currentDate.year, _currentDate.month, 1);
  //   final lastDayOfMonth = DateTime(_currentDate.year, _currentDate.month + 1, 0);
  //   return lastDayOfMonth.day + firstDayOfMonth.weekday % 7 + 5;
  // }

  DateTime _getDateForIndex(int index) {
    final firstDayOfMonth = DateTime(_currentDate.year, _currentDate.month, 1);
    final dayOffset = firstDayOfMonth.weekday % 7;
    return DateTime(_currentDate.year, _currentDate.month, 1).add(Duration(days: index - dayOffset));
  }
}
