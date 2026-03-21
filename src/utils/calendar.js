import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, format, isSameMonth, isToday } from 'date-fns';
import { isHoliday } from 'korean-holidays';

export function getCalendarDays(date) {
  const monthStart = startOfMonth(date);
  const monthEnd = endOfMonth(monthStart);
  
  // Start the calendar week from Sunday
  const startDate = startOfWeek(monthStart, { weekStarts: 0 });
  const endDate = endOfWeek(monthEnd, { weekStarts: 0 });

  const dateFormat = "yyyy-MM-dd";
  const days = eachDayOfInterval({
    start: startDate,
    end: endDate
  });

  return days.map(day => {
    const dateStr = format(day, dateFormat);
    const holidayData = isHoliday(day);
    
    let isPublicHoliday = !!holidayData;
    let holidayName = holidayData ? holidayData.nameKo : null;
    
    // Clean up holiday names if necessary to fit the UI
    if (holidayName && holidayName.includes('대체공휴일')) {
       // "대체공휴일 (3·1절)" -> "3·1절 대체"
       holidayName = holidayName.replace('대체공휴일', '').replace('(', '').replace(')', '').trim() + ' 대체';
    }

    return {
      date: day,
      formattedDate: dateStr,
      dayOfMonth: format(day, "d"),
      isCurrentMonth: isSameMonth(day, monthStart),
      isToday: isToday(day),
      isHoliday: isPublicHoliday,
      holidayName
    };
  });
}
