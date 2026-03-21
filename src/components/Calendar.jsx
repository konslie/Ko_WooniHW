import React from 'react';
import { getCalendarDays } from '../utils/calendar';
import { ChevronLeft, ChevronRight, Unlock, Share } from 'lucide-react';
import { addMonths, subMonths } from 'date-fns';
import './Calendar.css';

const weekDays = ['일', '월', '화', '수', '목', '금', '토'];

export default function Calendar({ currentDate, setCurrentDate, onDateClick, workLogs, isAdmin, onAdminToggle, onShare, isSharing }) {
  const days = getCalendarDays(currentDate);

  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const goToday = () => setCurrentDate(new Date());

  const getDurationText = (startTime, endTime) => {
    if (!startTime || !endTime) return null;
    const [sH, sM] = startTime.split(':').map(Number);
    const [eH, eM] = endTime.split(':').map(Number);
    let diff = (eH * 60 + eM) - (sH * 60 + sM);
    if (diff <= 0) return '0시간 00분';
    
    const h = Math.floor(diff / 60);
    const m = diff % 60;
    return `${h}시간 ${String(m).padStart(2, '0')}분`;
  };

  return (
    <div className="calendar-wrapper">
      <header className="calendar-header">
        <div className="header-left">
          <h2 style={{ userSelect: 'none' }}>
            <span onClick={onAdminToggle} style={{ cursor: 'pointer' }}>🐯</span> 운이의 돌봄 달력 {isAdmin && <Unlock size={18} color="var(--accent-color)" style={{marginLeft: '4px'}} />} • {currentDate.getFullYear()}년 {currentDate.getMonth() + 1}월
          </h2>
          <button onClick={goToday} className="today-button">오늘</button>
          <button onClick={onShare} className="icon-button" disabled={isSharing} title="카카오톡/이미지 공유">
            <Share size={18} />
          </button>
        </div>
        <div className="header-right">
          <button onClick={prevMonth} className="icon-button"><ChevronLeft size={24} /></button>
          <button onClick={nextMonth} className="icon-button"><ChevronRight size={24} /></button>
        </div>
      </header>

      <div className="calendar-grid">
        {/* Weekday headers */}
        {weekDays.map((wd, i) => (
           <div key={`header-${i}`} className={`weekday-header ${i === 0 ? 'sunday' : i === 6 ? 'saturday' : ''}`}>
             {wd}
           </div>
        ))}
        
        {/* Days */}
        {days.map((day) => {
          let extraClasses = [];
          if (!day.isCurrentMonth) extraClasses.push('out-of-month');
          if (day.isToday) extraClasses.push('today');
          
          const dayOfWeek = day.date.getDay();
          if (day.isHoliday || dayOfWeek === 0) extraClasses.push('holiday'); // Red day
          else if (dayOfWeek === 6) extraClasses.push('weekend'); // Saturday

          const log = workLogs && workLogs[day.formattedDate];

          return (
            <div 
              key={day.formattedDate} 
              className={`calendar-cell ${extraClasses.join(' ')}`}
              onClick={() => onDateClick && onDateClick(day)}
            >
              <div className="cell-top">
                <span className="day-number">{day.dayOfMonth}</span>
                {day.holidayName && <span className="holiday-name">{day.holidayName}</span>}
              </div>
              
              <div className="cell-content">
                {log && !log.isNoCare && log.startTime && (
                  <div className="time-log">
                    <span className="duration-badge">{getDurationText(log.startTime, log.endTime)}</span>
                    <span className="time-badge">{log.startTime}-{log.endTime}</span>
                  </div>
                )}
                {log && log.isNoCare && (
                  <div className="time-log no-care-wrap">
                    <span className="no-care-badge">돌봄없는날</span>
                    {log.memo && <span className="no-care-memo">{log.memo}</span>}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
