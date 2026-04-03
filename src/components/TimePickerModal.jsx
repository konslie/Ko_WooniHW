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
  const [logType, setLogType] = useState('care');
  const [careReason, setCareReason] = useState('');
  const [hasSpecial, setHasSpecial] = useState(false);
  const [specialType, setSpecialType] = useState('체험학습');
  const [specialReason, setSpecialReason] = useState('');
  const [startHour, setStartHour] = useState(4);
  const [startMin, setStartMin] = useState('50');
  const [endHour, setEndHour] = useState(6);
  const [endMin, setEndMin] = useState('50');
  
  // Reset state or load existing log when modal opens
  useEffect(() => {
    if (isOpen) {
      if (existingLog) {
        let parsedCareReason = '';
        let parsedHasSpecial = false;
        let parsedSpecialType = '체험학습';
        let parsedSpecialReason = '';

        const existingMemo = existingLog.memo || '';
        
        if (existingMemo.startsWith('{')) {
          try {
            const parsed = JSON.parse(existingMemo);
            parsedCareReason = parsed.careReason || '';
            if (parsed.special) {
              parsedHasSpecial = true;
              parsedSpecialType = parsed.special.type;
              parsedSpecialReason = parsed.special.text;
            }
          } catch(e) {
            parsedCareReason = existingMemo;
          }
        } else if (existingMemo.startsWith('[SPECIAL]')) {
          parsedHasSpecial = true;
          const contentStr = existingMemo.replace('[SPECIAL]', '').trim();
          const splitIdx = contentStr.indexOf('|');
          if (splitIdx > -1) {
            parsedSpecialType = contentStr.substring(0, splitIdx);
            parsedSpecialReason = contentStr.substring(splitIdx + 1);
          } else {
            parsedSpecialType = '체험학습';
            parsedSpecialReason = contentStr;
          }
        } else {
           parsedCareReason = existingMemo;
        }

        if (existingLog.isNoCare) {
          setLogType('noCare');
        } else {
          setLogType('care');
        }
        
        setCareReason(parsedCareReason);
        setHasSpecial(parsedHasSpecial);
        setSpecialType(parsedSpecialType);
        setSpecialReason(parsedSpecialReason);
        
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
        setLogType('care');
        setCareReason('');
        setHasSpecial(false);
        setSpecialType('체험학습');
        setSpecialReason('');
        setStartHour(4);
        setStartMin('50');
        setEndHour(6);
        setEndMin('50');
      }
    }
  }, [isOpen, existingLog]);

  if (!isOpen || !date) return null;

  const handleSave = () => {
    const memoObj = {
      careReason: logType === 'noCare' ? careReason : '',
      special: hasSpecial ? { type: specialType, text: specialReason } : null
    };

    let finalMemo = '';
    if (hasSpecial) {
      finalMemo = JSON.stringify(memoObj);
    } else {
      finalMemo = logType === 'noCare' ? careReason : '';
    }

    if (logType === 'noCare') {
      onSave({
        date: date.formattedDate,
        isNoCare: true,
        memo: finalMemo,
        startTime: null,
        endTime: null
      });
    } else {
      const sH = startHour === 12 ? 12 : startHour + 12; // Assuming PM
      const eH = endHour === 12 ? 12 : endHour + 12;
      onSave({
        date: date.formattedDate,
        isNoCare: false,
        memo: finalMemo,
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
          <h4 style={{ margin: '0 0 10px 0', fontSize: '1rem', color: 'var(--text-primary)' }}>1. 하원 돌봄 설정</h4>
          <div className="toggle-wrapper" style={{ display: 'flex', gap: '4px' }}>
             <button className={`toggle-btn ${logType === 'care' ? 'active' : ''}`} onClick={() => setLogType('care')}>돌봄 제공</button>
             <button className={`toggle-btn ${logType === 'noCare' ? 'active-no-care' : ''}`} onClick={() => setLogType('noCare')}>돌봄 미제공</button>
          </div>
          
          {logType === 'care' && (
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
          )}
          
          {logType === 'noCare' && (
            <div className="no-care-container">
               <p className="modal-desc">돌봄을 제공하지 않은 사유를 간단히 적어주세요.</p>
               <input 
                 type="text" 
                 className="reason-input" 
                 placeholder="예: 가족 휴가, 명절 결근 등"
                 value={careReason}
                 onChange={(e) => setCareReason(e.target.value)}
                 autoFocus
               />
            </div>
          )}

          <h4 style={{ margin: '24px 0 10px 0', fontSize: '1rem', color: 'var(--text-primary)' }}>2. 등원 특이사항</h4>
          <div className="toggle-wrapper" style={{ display: 'flex', gap: '4px' }}>
             <button className={`toggle-btn ${!hasSpecial ? 'active' : ''}`} onClick={() => setHasSpecial(false)}>특이사항 없음</button>
             <button className={`toggle-btn ${hasSpecial ? 'active-special' : ''}`} onClick={() => setHasSpecial(true)} style={{color: hasSpecial ? '#ffffff' : 'inherit', backgroundColor: hasSpecial ? '#008924' : ''}}>특이사항 있음</button>
          </div>

          {hasSpecial && (
            <div className="no-care-container">
               <p className="modal-desc" style={{color: '#008924', fontWeight: 'bold'}}>운이의 등원 특이사항을 기재해주세요.</p>
               
               <div style={{ display: 'flex', gap: '8px', margin: '4px 0 12px 0' }}>
                 <button 
                   className={`toggle-btn`} 
                   onClick={(e) => { e.preventDefault(); setSpecialType('체험학습'); }} 
                   style={{ 
                     flex: 1, 
                     padding: '8px', 
                     borderRadius: '6px', 
                     border: specialType === '체험학습' ? 'none' : '1px solid #ddd',
                     backgroundColor: specialType === '체험학습' ? '#008924' : '#fff',
                     color: specialType === '체험학습' ? '#fff' : '#666',
                     fontWeight: specialType === '체험학습' ? 'bold' : 'normal'
                   }}>
                   체험학습
                 </button>
                 <button 
                   className={`toggle-btn`} 
                   onClick={(e) => { e.preventDefault(); setSpecialType('특이사항'); }} 
                   style={{ 
                     flex: 1, 
                     padding: '8px', 
                     borderRadius: '6px', 
                     border: specialType === '특이사항' ? 'none' : '1px solid #ddd',
                     backgroundColor: specialType === '특이사항' ? '#008924' : '#fff',
                     color: specialType === '특이사항' ? '#fff' : '#666',
                     fontWeight: specialType === '특이사항' ? 'bold' : 'normal'
                   }}>
                   특이사항
                 </button>
               </div>

               <input 
                 type="text" 
                 className="reason-input" 
                 placeholder="내용 (예: 동우체육복)"
                 value={specialReason}
                 onChange={(e) => setSpecialReason(e.target.value)}
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
