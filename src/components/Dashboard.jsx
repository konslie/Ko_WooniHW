import React from 'react';
import { format } from 'date-fns';
import './Dashboard.css';

const WAGE_PER_HOUR = 15000;

export default function Dashboard({ currentDate, workLogs }) {
  const currentMonthStr = format(currentDate, "yyyy-MM");

  let totalMinutes = 0;

  if (workLogs) {
    Object.keys(workLogs).forEach(dateStr => {
      // Only summarize for the currently viewed month
      if (dateStr.startsWith(currentMonthStr)) {
        const log = workLogs[dateStr];
        if (!log.isNoCare && log.startTime && log.endTime) {
          const [sH, sM] = log.startTime.split(':').map(Number);
          const [eH, eM] = log.endTime.split(':').map(Number);
          
          let diff = (eH * 60 + eM) - (sH * 60 + sM);
          if (diff > 0) {
            totalMinutes += diff;
          }
        }
      }
    });
  }

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  
  // Calculate pay without floating point precision issues
  const estimatedPay = Math.floor((totalMinutes / 60) * WAGE_PER_HOUR);

  return (
    <div className="dashboard-wrapper">
      <h3>🌻 운이의 하원 돌봄 현황</h3>
      
      <div className="dashboard-card">
        <div className="dashboard-label">⏰ 이번달 총 돌봄 시간</div>
        <div className="dashboard-value">
          {hours > 0 ? `${hours}시간 ` : ''}{hours === 0 && minutes === 0 ? '0시간 0분' : `${minutes}분`}
        </div>
      </div>

      <div className="dashboard-card highlight">
        <div className="dashboard-label">💰 예상 정산 금액</div>
        <div className="dashboard-value">
          {estimatedPay.toLocaleString()} 원
        </div>
      </div>
      
      <div className="dashboard-actions">
        <button className="action-button">💌 카카오톡 공유</button>
      </div>
    </div>
  );
}
