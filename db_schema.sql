-- Supabase SQL Editor 에서 아래 쿼리를 복사하여 실행해주세요.

-- 1. 근무 시간 기록 테이블 생성 (수정: 돌봄 미제공 로직 반영)
CREATE TABLE public.care_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    date TEXT NOT NULL UNIQUE, -- 'yyyy-MM-dd' 형식, 유니크 제약조건 (하루에 하나의 근무/미근무만 기록)
    is_no_care BOOLEAN DEFAULT FALSE,
    start_time TEXT,  -- NULL 허용 (돌봄 없을 때)
    end_time TEXT,    -- NULL 허용
    memo TEXT,        -- 돌봄 없는 사유 등
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- RLS(Row Level Security) 설정 해제 (간단한 관리를 위해 우선 해제, 필요시 추가 가능)
ALTER TABLE public.care_logs DISABLE ROW LEVEL SECURITY;
