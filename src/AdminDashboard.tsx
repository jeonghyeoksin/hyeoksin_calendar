import React, { useEffect, useState } from 'react';
import { db } from './firebase';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { X, Users, RefreshCw, Calendar, CheckSquare } from 'lucide-react';

interface UserData {
  id: string;
  email: string;
  displayName: string;
  role: string;
  createdAt?: { toMillis: () => number };
  lastLoginAt?: { toMillis: () => number };
}

interface CalendarData {
  id: string;
  userId: string;
  title: string;
  completedDays: Record<number, boolean>;
  output: string;
  createdAt?: { toMillis: () => number };
}

export function AdminDashboard({ onClose, onViewCalendar }: { onClose: () => void, onViewCalendar?: (cal: CalendarData) => void }) {
  const [users, setUsers] = useState<UserData[]>([]);
  const [calendars, setCalendars] = useState<CalendarData[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'users' | 'calendars'>('users');

  const fetchData = async () => {
    setLoading(true);
    try {
      const usersQ = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
      const usersSnap = await getDocs(usersQ);
      const fetchedUsers: UserData[] = [];
      usersSnap.forEach((doc) => {
        fetchedUsers.push({ id: doc.id, ...doc.data() } as UserData);
      });
      setUsers(fetchedUsers);

      const calsQ = query(collection(db, 'calendars'), orderBy('createdAt', 'desc'));
      const calsSnap = await getDocs(calsQ);
      const fetchedCals: CalendarData[] = [];
      calsSnap.forEach((doc) => {
        fetchedCals.push({ id: doc.id, ...doc.data() } as CalendarData);
      });
      setCalendars(fetchedCals);
    } catch (err) {
      console.error("Failed to fetch data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const parseCalendarDays = (text: string) => {
    if (!text) return [];
    try {
      const bodyMatch = text.match(/<body>([\s\S]*?)<\/body>/);
      const contentToParse = bodyMatch ? bodyMatch[1] : text;
      const doc = new DOMParser().parseFromString(contentToParse, 'text/html');
      const rows = doc.querySelectorAll('tr');
      const days = [];
      for(let i=0; i<rows.length; i++) {
        const tr = rows[i];
        if(tr.querySelector('th')) continue;
        const tds = tr.querySelectorAll('td');
        if(tds.length === 2 && tds[0].textContent?.includes('일차')) {
          const numMatch = tds[0].textContent.match(/\d+/);
          if(numMatch) {
            days.push({
              day: parseInt(numMatch[0], 10),
              content: tds[1].innerHTML
            });
          }
        }
      }
      return days;
    } catch (e) {
      return [];
    }
  };

  const getProgress = (cal: CalendarData) => {
    const total = parseCalendarDays(cal.output).length;
    const compCount = Object.values(cal.completedDays || {}).filter(Boolean).length;
    const pct = total > 0 ? Math.round((compCount / total) * 100) : 0;
    return { pct, compCount, total };
  };

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex justify-center z-[110] p-4 md:p-8 overflow-y-auto">
      <div className="bg-zinc-950 border border-zinc-800 rounded-3xl w-full max-w-7xl shadow-2xl relative flex flex-col h-full min-h-[600px] max-h-full">
        <div className="flex items-center justify-between p-6 md:p-8 border-b border-zinc-800">
          <div className="flex items-center gap-4">
            <div className="bg-amber-500/20 p-3 rounded-2xl">
              <Users className="w-6 h-6 text-amber-500" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-white">관리자 대시보드</h2>
              <p className="text-zinc-400 font-medium text-sm mt-1">
                전체 가입자 현황 및 모든 회원의 마이페이지(캘린더)를 확인합니다.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-500 hover:text-white transition-colors p-2 hover:bg-zinc-900 rounded-full"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <div className="px-6 md:px-8 pt-4 border-b border-zinc-800 flex gap-4">
           <button 
             onClick={() => setActiveTab('users')}
             className={`px-4 py-3 font-bold border-b-2 transition-colors ${activeTab === 'users' ? 'border-amber-400 text-amber-400' : 'border-transparent text-zinc-400 hover:text-zinc-200'}`}
           >
             가입자 목록
           </button>
           <button 
             onClick={() => setActiveTab('calendars')}
             className={`px-4 py-3 font-bold border-b-2 transition-colors ${activeTab === 'calendars' ? 'border-amber-400 text-amber-400' : 'border-transparent text-zinc-400 hover:text-zinc-200'}`}
           >
             전체 마이페이지 현황 (스프레드시트)
           </button>
        </div>

        <div className="p-6 md:p-8 flex-grow overflow-auto">
          <div className="flex items-center justify-end mb-6">
            <button 
              onClick={fetchData}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-zinc-900 border border-zinc-700 rounded-xl hover:border-amber-400 text-sm font-medium text-zinc-300 hover:text-white transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span>새로고침</span>
            </button>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <RefreshCw className="w-8 h-8 text-amber-500 animate-spin mb-4" />
              <p className="text-zinc-400">데이터를 불러오는 중입니다...</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-zinc-800">
              {activeTab === 'users' ? (
                <table className="w-full text-left text-sm text-zinc-300">
                  <thead className="text-xs text-zinc-400 uppercase bg-zinc-900/50 border-b border-zinc-800 whitespace-nowrap">
                    <tr>
                      <th className="px-6 py-4 font-black">이름</th>
                      <th className="px-6 py-4 font-black">이메일</th>
                      <th className="px-6 py-4 font-black">권한</th>
                      <th className="px-6 py-4 font-black">생성 캘린더 수</th>
                      <th className="px-6 py-4 font-black">가입일</th>
                      <th className="px-6 py-4 font-black">최근 접속일</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-8 text-center text-zinc-500">
                          가입자가 없습니다.
                        </td>
                      </tr>
                    ) : (
                      users.map((u) => {
                        const userCals = calendars.filter(c => c.userId === u.id).length;
                        return (
                          <tr key={u.id} className="border-b border-zinc-800/50 hover:bg-zinc-900/30 transition-colors whitespace-nowrap">
                            <td className="px-6 py-4 font-medium text-white">{u.displayName}</td>
                            <td className="px-6 py-4">{u.email}</td>
                            <td className="px-6 py-4">
                              <span className={`px-2.5 py-1 rounded-md text-xs font-bold ${
                                u.role === 'admin' 
                                  ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' 
                                  : 'bg-zinc-800 text-zinc-400'
                              }`}>
                                {u.role === 'admin' ? '관리자' : '일반'}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-zinc-800/50 text-white font-bold text-xs ring-1 ring-zinc-700">
                                <Calendar className="w-3 h-3 text-amber-400" />
                                {userCals}개
                              </span>
                            </td>
                            <td className="px-6 py-4 text-zinc-500">
                              {u.createdAt ? new Date(u.createdAt.toMillis()).toLocaleString() : '-'}
                            </td>
                            <td className="px-6 py-4 text-zinc-500">
                              {u.lastLoginAt ? new Date(u.lastLoginAt.toMillis()).toLocaleString() : '-'}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              ) : (
                <table className="w-full text-left text-sm text-zinc-300">
                  <thead className="text-xs text-zinc-400 uppercase bg-zinc-900/50 border-b border-zinc-800 whitespace-nowrap">
                    <tr>
                      <th className="px-6 py-4 font-black">회원 이름</th>
                      <th className="px-6 py-4 font-black">회원 이메일</th>
                      <th className="px-6 py-4 font-black">캘린더 이름</th>
                      <th className="px-6 py-4 font-black">진척도</th>
                      <th className="px-6 py-4 font-black">완료된 일정</th>
                      <th className="px-6 py-4 font-black">생성일</th>
                      <th className="px-6 py-4 font-black">관리</th>
                    </tr>
                  </thead>
                  <tbody>
                    {calendars.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-6 py-8 text-center text-zinc-500">
                          생성된 캘린더가 없습니다.
                        </td>
                      </tr>
                    ) : (
                      calendars.map((cal) => {
                        const user = users.find(u => u.id === cal.userId);
                        const progress = getProgress(cal);
                        return (
                          <tr key={cal.id} className="border-b border-zinc-800/50 hover:bg-zinc-900/30 transition-colors whitespace-nowrap">
                            <td className="px-6 py-4 font-medium text-white">{user?.displayName || '알 수 없음'}</td>
                            <td className="px-6 py-4 text-zinc-400">{user?.email || '-'}</td>
                            <td className="px-6 py-4 font-bold text-amber-400">{cal.title}</td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-24 bg-zinc-800 rounded-full h-1.5 overflow-hidden">
                                  <div 
                                    className="bg-amber-400 h-full rounded-full"
                                    style={{ width: `${progress.pct}%` }}
                                  />
                                </div>
                                <span className="font-bold">{progress.pct}%</span>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span className="inline-flex items-center gap-1.5 py-1 px-2.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs font-bold text-white">
                                <CheckSquare className="w-3.5 h-3.5 text-emerald-400" />
                                {progress.compCount} / {progress.total}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-zinc-500">
                              {cal.createdAt ? new Date(cal.createdAt.toMillis()).toLocaleString() : '-'}
                            </td>
                            <td className="px-6 py-4">
                              <button 
                                onClick={() => onViewCalendar && onViewCalendar(cal)}
                                className="px-3 py-1.5 bg-zinc-800 text-zinc-300 hover:text-amber-400 hover:border-amber-400 border border-zinc-700 rounded-lg transition-colors text-xs font-bold whitespace-nowrap"
                              >
                                달력 보기
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

