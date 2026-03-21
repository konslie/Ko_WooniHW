import React, { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import './TimePickerModal.css';

const HOURS = Array.from({ length: 12 }, (_, i) => i + 1);
const MINUTES_5 = Array.from({ length: 12 }, (_, i) => String(i * 5).padStart(2, '0'));

function ScrollColumn({ items, selectedValue, onChange }) {
  const containerRef = useRef(null);

  useEffect(() => {
    if (containerRef.current) {
      const index = items.indexOf(selectedValue);
      if (index !== -1) {
        containerRef.current.scrollTop = index * 40;
      }
    }
  }, []); // Only on mount

  const handleScroll = (e) => {
    const scrollTop = e.target.scrollTop;
    const index = Math.round(scrollTop / 40);
    const newVal = items[Math.min(items.length - 1, Math.max(0, index))];
    if (newVal !== selectedValue) {
      onChange(newVal);
    }
  };

  return (
    <div className="scroll-column">
      <div className="scroll-window" ref={containerRef} onScroll={handleScroll}>
        <div className="scroll-padding"></div>
        {items.map(item => (
          <div key={item} className={`scroll-item ${item === selectedValue ? 'selected' : ''}`}>
            {item}
          </div>
        ))}
        <div className="scroll-padding"></div>
      </div>
    </div>
  );
}

export default function TimePickerModal({ isOpen, onClose, date, onSave, onDelete, existingLog }) {
  const [isNoCare, setIsNoCare] = useState(false);
  const [reason, setReason] = useState('');
  const [startHour, setStartHour] = useState(4);
  const [startMin, setStartMin] = useState('50');
  const [endHour, setEndHour] = useState(6);
  const [endMin, setEndMin] = useState('50');
  
  // Reset state or load existing log when modal opens
  useEffect(() => {
    if (isOpen) {
      if (existingLog) {
        setIsNoCare(existingLog.isNoCare || false);
        setReason(existingLog.memo || '');
        
        if (existingLog.startTime && existingLog.endTime) {
          const [sH, sM] = existingLog.startTime.split(':').map(Number);
          const [eH, eM] = existingLog.endTime.split(':').map(Number);
          
          let stH = sH > 12 ? sH - 12 : sH;
          if (stH === 0) stH = 12; // handle 12 PM
          let enH = eH > 12 ? eH - 12 : eH;
          if (enH === 0) enH = 12;

          setStartHour(stH);
          setStartMin(String(sM).padStart(2, '0'));
          setEndHour(enH);
          setEndMin(String(eM).padStart(2, '0'));
        } else {
          setStartHour(4);
          setStartMin('50');
          setEndHour(6);
          setEndMin('50');
        }
      } else {
        setIsNoCare(false);
        setReason('');
        setStartHour(4);
        setStartMin('50');
        setEndHour(6);
        setEndMin('50');
      }
    }
  }, [isOpen, existingLog]);

  if (!isOpen || !date) return null;

  const handleSave = () => {
    if (isNoCare) {
      onSave({
        date: date.formattedDate,
        isNoCare: true,
        memo: reason,
        startTime: null,
        endTime: null
      });
    } else {
      const sH = startHour === 12 ? 12 : startHour + 12; // Assuming PM
      const eH = endHour === 12 ? 12 : endHour + 12;
      onSave({
        date: date.formattedDate,
        isNoCare: false,
        memo: '',
        startTime: `${sH}:${startMin}`,
        endTime: `${eH}:${endMin}`
      });
    }
    onClose();
  };

  const handleDeleteClick = () => {
    if (window.confirm(`${date.formattedDate} 기록을 정말 삭제하시겠습니까?`)) {
      onDelete(date.formattedDate);
      onClose();
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content glass-panel" onClick={e => e.stopPropagation()}>
        <header className="modal-header">
          <h3>🎒 {date.formattedDate} 하원 기록</h3>
          <button className="close-btn" onClick={onClose}><X size={24} /></button>
        </header>

        <div className="modal-body">
          <div className="toggle-wrapper">
             <button className={`toggle-btn ${!isNoCare ? 'active' : ''}`} onClick={() => setIsNoCare(false)}>돌봄 제공</button>
             <button className={`toggle-btn ${isNoCare ? 'active-no-care' : ''}`} onClick={() => setIsNoCare(true)}>돌봄 미제공</button>
          </div>
          
          {!isNoCare ? (
            <>
              <p className="modal-desc">모든 시간은 <strong>오후(PM)</strong> 기준입니다. 위아래로 스와이프 하세요.</p>
              
              <div className="time-pickers-container">
                {/* Start Time */}
                <div className="time-picker-group">
                  <span className="picker-label">시작 시간</span>
                  <div className="wheels">
                    <ScrollColumn items={HOURS} selectedValue={startHour} onChange={setStartHour} />
                    <span className="colon">:</span>
                    <ScrollColumn items={MINUTES_5} selectedValue={startMin} onChange={setStartMin} />
                  </div>
                </div>

                <div className="time-separator">-</div>

                {/* End Time */}
                <div className="time-picker-group">
                  <span className="picker-label">종료 시간</span>
                  <div className="wheels">
                    <ScrollColumn items={HOURS} selectedValue={endHour} onChange={setEndHour} />
                    <span className="colon">:</span>
                    <ScrollColumn items={MINUTES_5} selectedValue={endMin} onChange={setEndMin} />
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="no-care-container">
               <p className="modal-desc">돌봄을 제공하지 않은 사유를 간단히 적어주세요.</p>
               <input 
                 type="text" 
                 className="reason-input" 
                 placeholder="예: 가족 휴가, 명절 결근 등"
                 value={reason}
                 onChange={(e) => setReason(e.target.value)}
                 autoFocus
               />
            </div>
          )}
        </div>

        <footer className="modal-footer">
          {existingLog && (
            <button className="delete-btn" onClick={handleDeleteClick}>삭제하기</button>
          )}
          <button className="save-btn" onClick={handleSave}>✨ 저장하기</button>
        </footer>
      </div>
    </div>
  );
}
