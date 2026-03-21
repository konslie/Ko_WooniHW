import { useState, useEffect, useRef } from 'react';
import Calendar from './components/Calendar';
import Dashboard from './components/Dashboard';
import TimePickerModal from './components/TimePickerModal';
import { supabase } from './lib/supabase';
import html2canvas from 'html2canvas';
import './App.css';

function App() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedDay, setSelectedDay] = useState(null);
  const [workLogs, setWorkLogs] = useState({});
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const appRef = useRef(null);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    const { data, error } = await supabase.from('care_logs').select('*');
    if (!error && data) {
      const logsMap = {};
      data.forEach(item => {
        logsMap[item.date] = {
          startTime: item.start_time,
          endTime: item.end_time,
          isNoCare: item.is_no_care,
          memo: item.memo
        };
      });
      setWorkLogs(logsMap);
    }
  };

  const handleAdminToggle = () => {
    setIsAdmin(!isAdmin);
  };

  const handleDateClick = (day) => {
    if (!isAdmin) {
      alert('열람 전용 모드입니다. 달력의 일정을 추가하거나 변경할 수 없습니다.');
      return;
    }
    setSelectedDay(day);
    setModalOpen(true);
  };

  const handleSaveTime = async ({ date, startTime, endTime, isNoCare, memo }) => {
    // 1. Optimistic UI update
    setWorkLogs(prev => ({
      ...prev,
      [date]: { startTime, endTime, isNoCare, memo }
    }));

    // 2. Save to Supabase (Upsert based on date)
    const payload = {
      date,
      is_no_care: isNoCare || false,
      start_time: startTime,
      end_time: endTime,
      memo: memo || ''
    };

    const { error } = await supabase
      .from('care_logs')
      .upsert(payload, { onConflict: 'date' });
      
    if (error) {
      console.error('Supabase DB 반영 에러:', error);
      alert('데이터베이스 저장 중 오류가 발생했습니다.');
    }
  };

  const handleDeleteTime = async (date) => {
    // 1. Optimistic UI Update
    setWorkLogs(prev => {
      const newLogs = { ...prev };
      delete newLogs[date];
      return newLogs;
    });

    // 2. Delete from Supabase
    const { error } = await supabase.from('care_logs').delete().eq('date', date);
    if (error) {
      console.error('Supabase DB 삭제 에러:', error);
      alert('데이터베이스 삭제 중 오류가 발생했습니다.');
    }
  };

  const handleShare = async () => {
    if (!appRef.current) return;
    try {
      setIsSharing(true);
      // Ensure any sharing state updates beforehand, though it's quick
      setTimeout(async () => {
        try {
          const canvas = await html2canvas(appRef.current, {
            scale: 4, // 4x multiplier for super crisp PNG export
            useCORS: true,
            backgroundColor: '#fcefe3'
          });
          
          canvas.toBlob(async (blob) => {
            if (!blob) {
              setIsSharing(false);
              return;
            }
            const file = new File([blob], `운이의돌봄달력_${currentDate.getFullYear()}년${currentDate.getMonth()+1}월.png`, { type: 'image/png' });
            
            if (navigator.canShare && navigator.canShare({ files: [file] })) {
              try {
                await navigator.share({
                  files: [file],
                  title: '운이의 돌봄 달력',
                  text: `${currentDate.getFullYear()}년 ${currentDate.getMonth()+1}월 돌봄 현황입니다.`,
                });
              } catch (e) {
                console.log('Share canceled or failed', e);
              }
            } else {
              // Fallback to direct download
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `운이의돌봄달력_${currentDate.getFullYear()}년${currentDate.getMonth()+1}월.png`;
              a.click();
              URL.revokeObjectURL(url);
            }
            setIsSharing(false);
          }, 'image/png', 1.0);
        } catch(err) {
          console.error('Canvas error:', err);
          setIsSharing(false);
          alert('화면 캡쳐 중 오류가 발생했습니다.');
        }
      }, 100);
    } catch (err) {
      console.error(err);
      setIsSharing(false);
      alert('공유하기에 실패했습니다.');
    }
  };

  return (
    <div className="app-container" ref={appRef}>
      <main className="calendar-section glass-panel">
        <Calendar 
          currentDate={currentDate} 
          setCurrentDate={setCurrentDate} 
          onDateClick={handleDateClick}
          workLogs={workLogs}
          isAdmin={isAdmin}
          onAdminToggle={handleAdminToggle}
          onShare={handleShare}
          isSharing={isSharing}
        />
      </main>
      
      <aside className="dashboard-section glass-panel">
        <Dashboard 
          currentDate={currentDate} 
          workLogs={workLogs}
        />
      </aside>

      <TimePickerModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        date={selectedDay}
        existingLog={selectedDay ? workLogs[selectedDay.formattedDate] : null}
        onSave={handleSaveTime}
        onDelete={handleDeleteTime}
      />
    </div>
  );
}

export default App;
