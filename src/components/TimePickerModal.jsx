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
  const [activeTab, setActiveTab] = useState('care');
  const [logType, setLogType] = useState('care');
  const [careReason, setCareReason] = useState('');
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
        let parsedSpecialType = '체험학습';
        let parsedSpecialReason = '';

        const existingMemo = existingLog.memo || '';
        
        if (existingMemo.startsWith('{')) {
          try {
            const parsed = JSON.parse(existingMemo);
            parsedCareReason = parsed.careReason || '';
            if (parsed.special) {
              parsedSpecialType = parsed.special.type;
              parsedSpecialReason = parsed.special.text;
            }
          } catch(e) {
            parsedCareReason = existingMemo;
          }
        } else if (existingMemo.startsWith('[SPECIAL]')) {
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

        const initialLogType = existingLog.isNoCare ? 'noCare' : (existingLog.startTime ? 'care' : 'none');
        setLogType(initialLogType);
        
        let initialTab = initialLogType;
        if (initialLogType === 'none') {
           initialTab = parsedSpecialReason ? 'special' : 'care';
        }
        setActiveTab(initialTab);
        
        setCareReason(parsedCareReason);
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
        const todayOffset = new Date(new Date().getTime() + 9 * 60 * 60 * 1000); // KST
        const todayStr = todayOffset.toISOString().split('T')[0];
        const isFuture = date.formattedDate > todayStr;

        if (isFuture) {
          setLogType('none');
          setActiveTab('special');
        } else {
          setLogType('care');
          setActiveTab('care');
        }
        
        setCareReason('');
        setSpecialType('체험학습');
        setSpecialReason('');
        setStartHour(4);
        setStartMin('50');
        setEndHour(6);
        setEndMin('50');
      }
    }
  }, [isOpen, existingLog, date]);

  if (!isOpen || !date) return null;

  const handleSave = () => {
    const hasSpecial = specialReason.trim() !== '';
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
    } else if (logType === 'care') {
      const sH = startHour === 12 ? 12 : startHour + 12; // Assuming PM
      const eH = endHour === 12 ? 12 : endHour + 12;
      onSave({
        date: date.formattedDate,
        isNoCare: false,
        memo: finalMemo,
        startTime: `${sH}:${startMin}`,
        endTime: `${eH}:${endMin}`
      });
    } else {
      onSave({
        date: date.formattedDate,
        isNoCare: false,
        memo: finalMemo,
        startTime: null,
        endTime: null
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
          <div className="toggle-wrapper" style={{ display: 'flex', gap: '4px' }}>
             <button 
               className={`toggle-btn ${logType === 'care' ? 'active' : ''}`} 
               onClick={() => { 
                 if (activeTab === 'care') setLogType(logType === 'care' ? 'none' : 'care'); 
                 else { setActiveTab('care'); setLogType('care'); } 
               }}>
               돌봄 제공
             </button>
             <button 
               className={`toggle-btn ${logType === 'noCare' ? 'active-no-care' : ''}`} 
               onClick={() => { 
                 if (activeTab === 'noCare') setLogType(logType === 'noCare' ? 'none' : 'noCare'); 
                 else { setActiveTab('noCare'); setLogType('noCare'); } 
               }}>
               돌봄 미제공
             </button>
             <button 
               className={`toggle-btn ${activeTab === 'special' ? 'active-special' : ''}`} 
               onClick={() => setActiveTab('special')} 
               style={{color: activeTab === 'special' ? '#ffffff' : 'inherit', backgroundColor: activeTab === 'special' ? '#008924' : ''}}>
               특이사항
             </button>
          </div>
          
          {activeTab === 'care' && (
            <>
              {logType === 'care' ? (
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
                <div style={{ textAlign: 'center', margin: '40px 0', fontSize: '14px', color: '#666' }}>
                  🚫 돌봄 시간이 선택되지 않았습니다.<br/><br/>
                  입력하려면 상단의 <strong>[돌봄 제공]</strong> 버튼을 다시 눌러주세요.
                </div>
              )}
            </>
          )}
          
          {activeTab === 'noCare' && (
            <div className="no-care-container">
               {logType === 'noCare' ? (
                 <>
                   <p className="modal-desc">돌봄을 제공하지 않은 사유를 간단히 적어주세요.</p>
                   <input 
                     type="text" 
                     className="reason-input" 
                     placeholder="예: 가족 휴가, 명절 결근 등"
                     value={careReason}
                     onChange={(e) => setCareReason(e.target.value)}
                     autoFocus
                   />
                 </>
               ) : (
                <div style={{ textAlign: 'center', margin: '40px 0', fontSize: '14px', color: '#666' }}>
                  🚫 돌봄 미제공 상태가 아닙니다.<br/><br/>
                  사유를 입력하려면 상단의 <strong>[돌봄 미제공]</strong> 버튼을 다시 눌러주세요.
                </div>
               )}
            </div>
          )}

          {activeTab === 'special' && (
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
