import React, { useState, useEffect } from 'react';
import { GoogleGenAI } from '@google/genai';
import mammoth from 'mammoth';
import { Key, X, Upload, FileText, Download, Loader2, Calendar, Trash2, CheckCircle, HelpCircle, Info, Copy, ExternalLink, Eye, EyeOff, Table, User, LogIn, LogOut, Lock, Link as LinkIcon, Image as ImageIcon, Plus, Edit2, Check } from 'lucide-react';
import { useAuth } from './AuthContext';
import { db } from './firebase';

interface DayMetadata {
  links: string[];
  images: string[];
  remarks?: string;
}

import { doc, getDoc, setDoc, updateDoc, serverTimestamp, collection, query, where, getDocs, addDoc, orderBy, deleteDoc } from 'firebase/firestore';
import { AdminDashboard } from './AdminDashboard';
import { AuthModal } from './AuthModal';
import { FaqModal } from './FaqModal';

interface PatchNote {
  version: string;
  date: string;
  title: string;
  changes: string[];
}

const PATCH_NOTES: PatchNote[] = [
  {
    version: 'v1.17.0',
    date: '2026.06.05',
    title: '1일차 혁신AI 초기 탐색 도구 3종 집중 배치 완료',
    changes: [
      '혁신 수익화 발굴 AI, 혁신 트렌드 분석 AI, 혁신 수익화 캘린더 AI 도구를 1일차에 무조건 집중 배치하여 비즈니스 토대 구축',
      '나머지 22가지 가치 증대 및 마케팅 지침 도구(혁신 블로그, 유튜브, 상세페이지 등)들은 2일차부터 90일차까지 순차적으로 믹스 배치',
      '전체 로드맵 가이드의 Google Gemini 인프라 매칭과 인간 중심적 리드 라이팅 일관성 극대화'
    ]
  },
  {
    version: 'v1.16.0',
    date: '2026.06.05',
    title: '혁신AI 25개 전용 도구 체계 결합 설계 완료',
    changes: [
      '90일 계획 설계 시, 혁신 수익화 발굴/트렌드 분석/스레드 등 사용자 요청 도구 25개 전용 로드맵 연동',
      '문서 최상단에 "혁신AI에 있는 기능들을 최대한 활용하고, 상황에 따라 다른 Tool을 같이 믹스해서 활용하시길 바랍니다." 단독 고정 서론 적용',
      '수익화 마스터 플랜 내 단어 "여정" 절대 사용 금지 및 인공지능식 기계 구문 전면 필터링 유지',
      '프롬프트 처리 및 작성 과정 내 생성형 AI 도구를 Google Gemini 전용으로 완전 한정 조치'
    ]
  },
  {
    version: 'v1.15.0',
    date: '2026.06.04',
    title: '휴먼 라이팅 인공지능 극도의 정제 및 참고 문서 정밀 매핑',
    changes: [
      '수익화 마스터 플랜 내 "여정" 단어의 전면적인 사용 금지 지정 및 기계적 AI 스러운 어투 원천 차단',
      '실제 비즈니스 가이드처럼 자연스럽고 실무 중심적인 사람 어투(~해요, ~합니다)로 전체 90일 고도화',
      '사용자가 제공한 "수익화발굴" 및 "트렌드 AI" 분석 자료에 기재된 아이템과 솔루션을 100% 반영한 고밀도 수익 전술 작성 완성'
    ]
  },
  {
    version: 'v1.14.0',
    date: '2026.06.04',
    title: 'Google Gemini 전용 로드맵 및 서론 가이드 최적화',
    changes: [
      '로드맵 내 생성형 AI 도구를 Google Gemini로 완벽히 일원화하여 통일된 품질 설계',
      '문서 생성 시 고정형 맞춤 서론("혁신AI에 있는 기능들을 최대한 활용하고...")을 최상단에 안정 배치',
      '사용자 트렌드 분석 문서와 Google Docs 복사 프로세스의 연동 안정성 상향'
    ]
  },
  {
    version: 'v1.13.0',
    date: '2026.06.04',
    title: '실전 도구 결합형 수익화 실행 최적화',
    changes: [
      '로드맵 내에서 혁신AI 추천 방식 대신 실제 비즈니스 진행에 필요한 외부 전문 툴(Canva, Google Sheets, ChatGPT 등)을 실습에 적용하도록 가이드 변경',
      '초보자 실천력 향상을 위한 실무 기반 도구 사용 방법 및 프롬프트 가이드 구체화',
      '혁신AI의 신규 기능 및 업데이트 요구에 대비해 마지막 90일차 멘토링 멘트에 개발자 정혁신 상시 피드백 파트너십 안내 통합'
    ]
  },
  {
    version: 'v1.12.0',
    date: '2026.06.04',
    title: '정밀 맞춤형 90일 실행안 직결 고도화',
    changes: [
      '로드맵 시작 시 인사말 및 서론 부을 완전히 생략하고 즉시 1일차 가이드라인부터 직결되도록 개선',
      '1일부터 90일까지 각 일차(1~90) 누락 및 묶음 현상 없이 매일의 맞춤형 실천 방안을 극도로 세분화',
      '수이화 발굴 및 트렌드 분석 등 사용자가 업로드한 참고 문서를 적극 연동한 1:1 개인화 전략 수립',
      '비즈니스 첫걸음을 떼는 이들을 위한 실제 멘토의 인간적이고 친근한 휴먼 라이팅(~해요, ~합니다) 완착',
      '개발자 정혁신 상시 피드백 내용 제거 및 실무 집중력 강화'
    ]
  },
  {
    version: 'v1.5.0',
    date: '2026.04.19',
    title: '고객 지원 채널 통합',
    changes: [
      '공식 웹사이트 및 고객 센터 링크 영구 고정'
    ]
  },
  {
    version: 'v1.0.0',
    date: '2026.04.18',
    title: '최초 릴리즈',
    changes: [
      '수익화 로드맵 생성 엔진 개발',
      '문서 분석 및 자동 요약 기술 통합'
    ]
  }
];

export default function App() {
  const [apiKey, setApiKey] = useState('');
  const [tempApiKey, setTempApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isFaqModalOpen, setIsFaqModalOpen] = useState(false);
  const [isApiCostModalOpen, setIsApiCostModalOpen] = useState(false);
  const [isPatchNotesOpen, setIsPatchNotesOpen] = useState(false);
  const [isHowToUseOpen, setIsHowToUseOpen] = useState(false);
  const [isMaintenanceOpen, setIsMaintenanceOpen] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [inputText, setInputText] = useState('');
  const [currentTab, setCurrentTab] = useState<'create' | 'mypage'>('create');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [output, setOutput] = useState('');
  const [selectedDay, setSelectedDay] = useState<{ day: number; content: string } | null>(null);
  const [completedDays, setCompletedDays] = useState<Record<number, boolean>>({});
  const [dayMetadata, setDayMetadata] = useState<Record<number, DayMetadata>>({});
  const [calendarsInfo, setCalendarsInfo] = useState<{id: string; title: string; createdAt: Date}[]>([]);
  const [currentCalendarId, setCurrentCalendarId] = useState<string | null>(null);
  const [editingCalendarId, setEditingCalendarId] = useState<string | null>(null);
  const [editingCalendarTitle, setEditingCalendarTitle] = useState('');
  const { user, appUser, signIn, signOut } = useAuth();
  const [dataLoading, setDataLoading] = useState(false);
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false);

  const [newLinkUrl, setNewLinkUrl] = useState('');
  const [newImageUrl, setNewImageUrl] = useState('');
  const [activeInput, setActiveInput] = useState<'link' | 'image' | null>(null);
  const [editingRemarks, setEditingRemarks] = useState(false);
  const [remarksText, setRemarksText] = useState('');

  useEffect(() => {
    if (!selectedDay) {
      setNewLinkUrl('');
      setNewImageUrl('');
      setActiveInput(null);
      setEditingRemarks(false);
      setRemarksText('');
    } else {
      setRemarksText(dayMetadata[selectedDay.day]?.remarks || '');
    }
  }, [selectedDay, dayMetadata]);

  useEffect(() => {
    const savedKey = localStorage.getItem('gemini_api_key');
    if (savedKey) {
      setApiKey(savedKey);
      setTempApiKey(savedKey);
    }
  }, []);

  useEffect(() => {
    async function loadUserPlansInfo() {
      if (user) {
        setDataLoading(true);
        try {
          const q = query(
            collection(db, 'calendars'),
            where('userId', '==', user.uid)
          );
          const querySnapshot = await getDocs(q);
          const cals: any[] = [];
          querySnapshot.forEach((docSnap) => {
            const data = docSnap.data();
            let date = new Date();
            if (data.createdAt?.toDate) {
               date = data.createdAt.toDate();
            } else if (data.createdAt) {
               date = new Date(data.createdAt);
            }
            cals.push({
              id: docSnap.id,
              title: data.title || '나의 90일 수익화 캘린더',
              createdAt: date
            });
          });
          
          cals.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
          setCalendarsInfo(cals);

          if (cals.length > 0) {
            // Load the most recent one by default
            const mostRecent = cals[0];
            await loadCalendarData(mostRecent.id);
          } else {
             // check for legacy calendar
             const docRef = doc(db, 'calendars', user.uid);
             const docSnap = await getDoc(docRef);
             if (docSnap.exists()) {
               const data = docSnap.data();
               cals.push({
                  id: user.uid,
                  title: '나의 90일 수익화 캘린더',
                  createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date()
               });
               setCalendarsInfo([...cals]);
               await loadCalendarData(user.uid);
             } else {
               setOutput('');
               setCompletedDays({});
               setCurrentCalendarId(null);
             }
          }
        } catch (err) {
          console.warn("Failed to load user plans from Firestore", err);
          // Fallback logic
          const localData = localStorage.getItem(`calendar_${user.uid}`);
          if (localData) {
             const parsed = JSON.parse(localData);
             setOutput(parsed.output || '');
             setCompletedDays(parsed.completedDays || {});
             setDayMetadata(parsed.dayMetadata || {});
             setCalendarsInfo([{id: 'local', title: '나의 90일 수익화 캘린더', createdAt: new Date()}]);
             setCurrentCalendarId('local');
          } else {
             setOutput('');
             setCompletedDays({});
             setDayMetadata({});
             setCurrentCalendarId(null);
          }
        } finally {
          setDataLoading(false);
        }
      } else {
        setOutput('');
        setCompletedDays({});
        setDayMetadata({});
        setCalendarsInfo([]);
        setCurrentCalendarId(null);
      }
    }
    loadUserPlansInfo();
  }, [user]);

  const loadCalendarData = async (calendarId: string) => {
    if (!user) return;
    if (calendarId === 'local') {
      const localData = localStorage.getItem(`calendar_${user.uid}`);
      if (localData) {
         const parsed = JSON.parse(localData);
         setOutput(parsed.output || '');
         setCompletedDays(parsed.completedDays || {});
         setDayMetadata(parsed.dayMetadata || {});
         setCurrentCalendarId('local');
      }
      return;
    }

    try {
      setDataLoading(true);
      const docRef = doc(db, 'calendars', calendarId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
         const data = docSnap.data();
         setOutput(data.output || '');
         setCompletedDays(data.completedDays || {});
         setDayMetadata(data.dayMetadata || {});
         setCurrentCalendarId(calendarId);
      }
    } catch(err) {
      console.warn("Failed to load calendar data", err);
    } finally {
      setDataLoading(false);
    }
  };

  const saveUserPlan = async (newOutput: string, newCompletedDays: Record<number, boolean>, newDayMetadata: Record<number, DayMetadata> = {}, newTitle: string = '나의 90일 수익화 캘린더') => {
    if (!user) return;
    
    // Always save to local storage as backup
    try {
      localStorage.setItem(`calendar_${user.uid}`, JSON.stringify({
        output: newOutput,
        completedDays: newCompletedDays,
        dayMetadata: newDayMetadata
      }));
    } catch(e) {}

    try {
      if (currentCalendarId && currentCalendarId !== 'local') {
        const docRef = doc(db, 'calendars', currentCalendarId);
        await updateDoc(docRef, {
          output: newOutput,
          completedDays: newCompletedDays,
          dayMetadata: newDayMetadata,
          updatedAt: serverTimestamp()
        });
      } else {
        const docRef = await addDoc(collection(db, 'calendars'), {
          userId: user.uid,
          title: newTitle,
          output: newOutput,
          completedDays: newCompletedDays,
          dayMetadata: newDayMetadata,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
        setCurrentCalendarId(docRef.id);
        setCalendarsInfo(prev => [{id: docRef.id, title: newTitle, createdAt: new Date()}, ...prev].sort((a,b) => b.createdAt.getTime() - a.createdAt.getTime()));
      }
    } catch (err: any) {
      console.warn("Failed to save user plan to Firestore", err);
    }
  };

  const handleUpdateCalendarTitle = async (idToUpdate: string | null) => {
    if (!user || !idToUpdate || idToUpdate === 'local') return;
    if (!editingCalendarTitle.trim()) {
      setEditingCalendarId(null);
      return;
    }

    try {
      await updateDoc(doc(db, 'calendars', idToUpdate), {
        title: editingCalendarTitle.trim()
      });
      setCalendarsInfo(prev => prev.map(c => 
        c.id === idToUpdate ? { ...c, title: editingCalendarTitle.trim() } : c
      ));
      setEditingCalendarId(null);
    } catch(err) {
      console.error("Failed to update calendar title", err);
      alert('일정 이름 변경 중 오류가 발생했습니다.');
    }
  };

  const handleDeleteCalendar = async (idToDelete: string) => {
    if (!user || idToDelete === 'local') return;
    if (!window.confirm('이 캘린더를 삭제하시겠습니까?\n삭제시 영구적으로 삭제되어 복구 불가능합니다.')) return;
    
    try {
      await deleteDoc(doc(db, 'calendars', idToDelete));
      setCalendarsInfo(prev => prev.filter(c => c.id !== idToDelete));
      
      if (currentCalendarId === idToDelete) {
        const remaining = calendarsInfo.filter(c => c.id !== idToDelete);
        if (remaining.length > 0) {
          await loadCalendarData(remaining[0].id);
        } else {
          setOutput('');
          setCompletedDays({});
          setCurrentCalendarId(null);
        }
      }
    } catch (err) {
      console.error("Failed to delete calendar", err);
      alert('일정 삭제 중 오류가 발생했습니다.');
    }
  };

  const handleSaveApiKey = () => {
    localStorage.setItem('gemini_api_key', tempApiKey);
    setApiKey(tempApiKey);
    setIsApiKeyModalOpen(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(prev => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const parseFiles = async (fileList: File[]): Promise<string> => {
    let result = '';
    for (const file of fileList) {
      result += `\n\n--- 파일명: ${file.name} ---\n`;
      try {
        if (file.name.endsWith('.docx')) {
          const arrayBuffer = await file.arrayBuffer();
          const docResult = await mammoth.extractRawText({ arrayBuffer });
          result += docResult.value;
        } else {
          const text = await file.text();
          result += text;
        }
      } catch (err) {
        result += `[파일 읽기 실패: ${err}]`;
      }
    }
    return result;
  };

  const generatePlan = async () => {
    if (!user) {
      setError('수익화 캘린더 생성은 로그인시에만 사용가능합니다.');
      return;
    }

    const keyToUse = apiKey || process.env.GEMINI_API_KEY;
    if (!keyToUse) {
      setError('API Key를 등록해야 혁신 수익화 캘린더 생성이 시작됩니다.');
      setIsApiKeyModalOpen(true);
      return;
    }

    setCurrentTab('mypage');
    setLoading(true);
    setProgress(0);
    setError('');
    setOutput('');
    setCurrentCalendarId(null); // Clear to ensure we create a new one, not overwrite
    setCompletedDays({});

    try {
      const ai = new GoogleGenAI({ apiKey: keyToUse });
      const parsedFilesText = await parseFiles(files);
      
      const prompt = `다음 사용자 요청사항과 첨부한 참고 자료('수익화 발굴', '트렌드 분석' 등의 참고 문서)를 깊이 있게 분석 및 딥리서치하여, 90일(3개월) 동안 이대로만 실행하면 누구나 무조건 실제 수익화를 경험하고 안정적인 파이프라인을 구축할 수 있는 초고성능 맞춤형 실행 로드맵을 작성해 주세요.\n\n[사용자 요청사항 및 목표]\n- ${inputText || '미입력'}\n\n[참고 문서 내용 분석 대상]\n${parsedFilesText || '(현재 사용자 업로드 참 문서 없음. 일반적인 AI 비즈니스 수익화 트렌드 및 최첨단 발굴 기법을 적용하세요)'}\n\n위 첨부파일에 명시된 비즈니스 트렌드, 수익화 아이템 목록, 기획 전략 데이터를 로드맵 90일 전체 일과 속에 구체적으로 연동하고, 각 일차(1~90일차)마다 누락이나 묶음 없이 개별적이고 매우 상세한 맞춤 실행 과제를 도출해 주세요.`;
            const responseStream = await ai.models.generateContentStream({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
          systemInstruction: "당신은 AI를 활용한 수익화 전략 전문가입니다. 사용자의 목표와 첨부된 참고자료('수익화 발굴', '트렌드 분석', '수익화발굴', '트렌드 ai' 등)의 상세한 내용을 완벽히 융합하여 무조건 성공할 수밖에 없는 90일(3개월) 초정밀 실행 캘린더를 작성해야 합니다.\n\n[핵심 생성 및 스타일 규칙 - 절대 준수]\n1. 맨 첫 줄(서론)에는 다른 어떠한 환영 인사나 다른 설명도 일체 작성하지 말고, 오직 다음의 정확한 한 문장만을 그대로 출력한 다음 한 줄 띄우고 즉시 '1일차:' 본론으로 넘어가야 합니다: \"혁신AI에 있는 기능들을 최대한 활용하고, 상황에 따라 다른 Tool을 같이 믹스해서 활용하시길 바랍니다.\"\n2. 90일 수익화 마스터플랜의 진행 과정은 다음의 25가지 혁신AI 기능들을 적재적소에 유기적 및 구체적으로 사용하도록 밀도 있게 구성해야 합니다 (사용자는 이 도구들을 필요할 때 실행하여 기획하고 콘텐츠를 제작해 나갑니다):\n   - **혁신 수익화 발굴 AI, 혁신 트렌드 분석 AI, 혁신 수익화 캘린더 AI 이 세 가지 핵심 분석/기획 도구는 무조건 1일차 과정에 모두 완료되도록 가이드라인을 구성해야 합니다.** 첫날 이 세 도구를 모두 마쳐서 타겟 아이템 선별, 실시간 트렌드 확인 및 90일의 기본 토대를 마련하는 전략을 제시하세요.\n   - **나머지 22가지 가치 제작 및 관리형 혁신 도구들**(혁신 맞춤 프롬프트 생성 AI, 혁신 블로그 AI, 혁신 상세페이지 AI, 혁신 홈페이지 개발 AI, 혁신 제안서 AI, 혁신 이미지 AI, 혁신 세무 AI, 혁신 노무 AI, 혁신 로고 AI, 혁신 스레드 AI, 혁신 키워드 추천 AI, 혁신 브랜드 모델 AI, 혁신 소싱 AI, 혁신 뉴스레터 AI, 혁신 직무역량 강화 AI, 혁신 키워드 조합 AI, 혁신 카드뉴스 AI, 혁신 플레이스 최적화 AI, 혁신 전자책 AI, 혁신 유튜브 AI, 혁신 유튜브 썸네일 AI, 혁신 사업계획서 AI)은 **2일차부터 90일차까지의 매일매일 실행 계획 속에 유기적이고 짜임새 있게 점진 배치**하여 지침을 작성하세요.\n3. 로드맵 내에서 기획/작성을 위해 생성형 AI 도구를 추천하거나 활용하도록 안내할 때는, 혁신AI 기능뿐만 아니라 작업에 적합한 다른 우수한 생성형 AI 도구(예: ChatGPT, Claude, Midjourney 등)도 함께 적극적으로 추천하고 활용법을 안내해 주세요.\n4. 1일차부터 90일차까지 단 하루도 누락하지 않고 각 일자별 계획을 하나씩('1일차:', '2일차:', '3일차:', ..., '90일차:') 순차적으로 끝까지 전부 세분화하여 기술해야 합니다. 여러 일차를 묶거나(\"1~5일차:\", \"다음 주:\") 생략하는 행위는 일절 금지합니다. 하루하루의 실무 행동 강령과 실천 가이드라인을 극도로 상세하게 작성해야 합니다.\n5. 기계식 어투, 딱딱하고 격식체(~이다, ~한다), 혹은 AI 냄새가 물씬 풍기는 클리셰 표현(예: '지평', '도약', '탐구', '자, 그럼', '길을 나서볼까요' 등)을 완전히 배격하고, 오직 따뜻하고 친근하며 자상한 1:1 실무 멘토 선생님과 같은 극도로 자연스러운 사람 어투(~해요, ~합니다)로만 작성하세요.\n6. [초비상 규정] 로드맵 전체 텍스트 내에서 '여정'이라는 단어는 절대로 단 한 번도 사용하지 마세요. 이는 인위적이고 기형적인 AI식 분위기를 자아내므로 사용이 무조건 엄격하게 금지됩니다. '여정'이 들어갈 만한 자리는 '과정', '실천 단계', '비즈니스 계획', '하루 일과' 등의 일상적인 사람 어휘로 전면 대체하세요.\n7. 작성 시 반드시 첨부된 '수익화발굴' 및 '트렌드 ai' 분석 자료에 명시된 비즈니스 트렌드, 유망 수익화 아이템 목록, 기획 전략 수립 가이드 데이터를 90일 전체에 녹여서 완전히 1대1 개인화 맞춤형 플랜으로 완착시켜 주세요.\n8. 비즈니스 마스터플랜의 실행 과정에서 Google Gemini 및 상기 25개 혁신AI 기능들을 메인 엔진으로 삼고, 이와 완벽하게 조화를 이루며 실질적인 성과를 내게 도와주는 기타 무료 실무 도구(예: Canva, Google Sheets, Notion, 특정 SNS 플랫폼 및 기획 툴 등)들을 필요할 때마다 영리하게 믹스하여 적용할 수 있도록 가이드를 짜임새 있게 작성하세요.\n9. 마지막 날인 '90일차:' 가이드의 끝부분에는 반드시 다음의 문구를 절대 누락하지 않고 토씨 하나 틀리지 않게 그대로 녹여서 함께 포함시켜 작성하세요:\n   \"혁신AI의 기능 외에 추가적으로 꼭 탑재되기를 원하시거나 업데이트를 요구하시는 사항이 있으시다면 언제든 정혁신에게 문의해 주세요. 신속하고 정밀하게 무상 추가 업데이트를 전격 제공해 드립니다!\"\n10. 가독성을 위해 2문단마다 무조건 한 줄의 완전히 빈 줄(개행)을 삽입하세요.\n11. 텍스트 중간, 소제목, 본문 어디에도 밑줄(언더바 `_`, html u 태그 등)을 절대로 사용하지 마세요.\n12. 절대로 마크다운 서식 기호(대표적으로 `#`, `*`, `-` 등의 기호글이나 bullet 기호)를 사용하지 마세요. 대신 다음 3가지의 한정된 HTML 텍스트 태그만을 활용하여 가독성이 높은 색상 하이라이트 조합을 연출하세요:\n- 강조할 청색 텍스트: <span style=\"color: #1d4ed8; font-weight: bold;\">텍스트</span>\n- 중요 경색 텍스트: <span style=\"color: #dc2626; font-weight: bold;\">텍스트</span>\n- 체크/주목용 흑색 텍스트: <span style=\"color: #000000; font-weight: bold;\">텍스트</span>\n13. 초보자나 비즈니스 입문자도 무조건 완벽하게 실행할 수 있을 정도로 '지극히 친절하고 아주 세밀한 1일 가이드라인'으로 서술적으로 작성해 주세요. 예상 소요 시간, Google Gemini용 프롬프트 입력 구문 내용, 체크해야 하는 구체적 산출물 기준을 빠짐없이 넣어야 합니다."
        }
      });

      let currentText = '';
      for await (const chunk of responseStream) {
        currentText += chunk.text;
        setOutput(currentText);
        
        const matches = [...currentText.matchAll(/(\d+)\s*일\s*차?/g)];
        if (matches.length > 0) {
          const lastMatch = matches[matches.length - 1];
          const day = parseInt(lastMatch[1], 10);
          if (day > 0 && day <= 90) {
            setProgress(Math.round((day / 90) * 100));
          }
        } else if (currentText.length > 50 && progress === 0) {
          setProgress(2);
        }
      }
      setProgress(100);
      if (user) {
        let title = "나의 90일 수익화 캘린더";
        if (inputText.trim()) {
           const snippet = inputText.trim();
           title = snippet.length > 15 ? snippet.slice(0, 15) + '...' : snippet;
        }
        await saveUserPlan(currentText, {}, {}, title);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || '계획 생성 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const parseCalendarDays = (text: string) => {
    const days: { day: number; content: string }[] = [];
    const plainText = text.replace(/<[^>]*>?/gm, '');
    const regex = /(\d+)\s*일차\s*:(.*?)(?=(?:\d+)\s*일차\s*:|$)/gs;
    let match;
    while ((match = regex.exec(plainText)) !== null) {
      days.push({ day: parseInt(match[1], 10), content: match[2].trim() });
    }
    return days;
  };

  const handleAddMetadata = async (type: 'link' | 'image', day: number) => {
    const val = type === 'link' ? newLinkUrl : newImageUrl;
    if (!val.trim()) {
      setActiveInput(null);
      return;
    }

    const currentMeta = dayMetadata[day] || { links: [], images: [] };
    const newMeta = {
      ...dayMetadata,
      [day]: {
        ...currentMeta,
        links: type === 'link' ? [...currentMeta.links, val] : currentMeta.links,
        images: type === 'image' ? [...currentMeta.images, val] : currentMeta.images
      }
    };
    setDayMetadata(newMeta);
    if (type === 'link') setNewLinkUrl('');
    else setNewImageUrl('');
    setActiveInput(null);

    if (user) {
      await saveUserPlan(output, completedDays, newMeta, calendarsInfo.find(c => c.id === currentCalendarId)?.title);
    }
  };

  const handleSaveRemarks = async (day: number) => {
    const currentMeta = dayMetadata[day] || { links: [], images: [] };
    const newMeta = {
      ...dayMetadata,
      [day]: {
        ...currentMeta,
        remarks: remarksText
      }
    };
    setDayMetadata(newMeta);
    setEditingRemarks(false);

    if (user) {
      await saveUserPlan(output, completedDays, newMeta, calendarsInfo.find(c => c.id === currentCalendarId)?.title);
    }
  };

  const removeMetadata = async (type: 'link' | 'image', day: number, index: number) => {
    const currentMeta = dayMetadata[day];
    if (!currentMeta) return;

    const newMeta = {
      ...dayMetadata,
      [day]: {
        ...currentMeta,
        links: type === 'link' ? currentMeta.links.filter((_, i) => i !== index) : currentMeta.links,
        images: type === 'image' ? currentMeta.images.filter((_, i) => i !== index) : currentMeta.images
      }
    };
    setDayMetadata(newMeta);
    if (user) {
      await saveUserPlan(output, completedDays, newMeta, calendarsInfo.find(c => c.id === currentCalendarId)?.title);
    }
  };

  const toggleDayCompletion = async (day: number) => {
    if (!completedDays[day]) {
      const meta = dayMetadata[day];
      const hasLinks = meta?.links && meta.links.length > 0;
      const hasImages = meta?.images && meta.images.length > 0;
      const hasRemarks = !!meta?.remarks?.trim();

      if (!hasLinks && !hasImages && !hasRemarks) {
        alert("참고 링크, 참고 이미지, 비고란 중 하나라도 작성이 되어야 미션 실행 체크가 가능합니다.\n비고란은 참고 링크, 참고 이미지가 없는 경우 작성해주세요.");
        return;
      }
    }

    const newCompletedDays = {
      ...completedDays,
      [day]: !completedDays[day]
    };
    setCompletedDays(newCompletedDays);
    if (user) {
      await saveUserPlan(output, newCompletedDays, dayMetadata, calendarsInfo.find(c => c.id === currentCalendarId)?.title);
    }
  };

  const hasKey = !!(apiKey || process.env.GEMINI_API_KEY);

  return (
    <div className="min-h-screen bg-black font-sans text-white flex flex-col">
      {/* Header */}
      <header className="bg-zinc-950 border-b border-zinc-800 sticky top-0 z-40 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <button 
            onClick={() => setCurrentTab('create')}
            className="flex items-center gap-3 text-left hover:opacity-80 transition-opacity"
          >
            <div className="bg-amber-400 p-1.5 rounded-lg">
              <Calendar className="w-7 h-7 text-black" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-black tracking-tighter text-white">혁신 수익화 캘린더 <span className="text-amber-400">AI</span></h1>
              <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest leading-none">Powered by 2026 roadmap</p>
            </div>
          </button>
          
          <div className="flex items-center gap-2 md:gap-4">
            <button
              onClick={() => setIsFaqModalOpen(true)}
              className="flex items-center gap-2 px-3 py-2 rounded-full border border-zinc-700 hover:border-amber-400 hover:text-amber-400 bg-zinc-900/50 transition-all text-sm font-bold"
            >
              <HelpCircle className="w-4 h-4" />
              <span className="hidden sm:inline">FAQ</span>
            </button>
            {user && (
              <button
                onClick={() => setCurrentTab(currentTab === 'create' ? 'mypage' : 'create')}
                className={`flex items-center gap-2 px-3 py-2 rounded-full border transition-all text-sm font-bold ${currentTab === 'mypage' ? 'bg-amber-400 text-black border-amber-400' : 'border-zinc-700 hover:border-amber-400 hover:text-amber-400 bg-zinc-900/50'}`}
              >
                {currentTab === 'create' ? <User className="w-4 h-4" /> : <Calendar className="w-4 h-4" />}
                <span className="hidden sm:inline">{currentTab === 'create' ? '마이페이지' : '홈으로'}</span>
              </button>
            )}

            {user ? (
              <div className="flex items-center gap-2 md:gap-3">
                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full border border-zinc-800 bg-zinc-900/50">
                  <User className="w-4 h-4 text-emerald-400" />
                  <span className="text-sm font-bold truncate max-w-[100px] text-zinc-300">{user.displayName || user.email?.split('@')[0]}</span>
                </div>
                <button
                  onClick={signOut}
                  className="flex items-center gap-1 sm:gap-2 px-3 py-2 rounded-full border border-zinc-700 hover:border-red-400 hover:text-red-400 transition-all text-sm font-bold bg-zinc-900/50"
                  title="로그아웃"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden sm:inline">로그아웃</span>
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="flex items-center gap-2 px-3 py-2 rounded-full border border-zinc-700 hover:border-amber-400 hover:text-amber-400 transition-all text-sm font-bold bg-zinc-900/50"
              >
                <LogIn className="w-4 h-4 text-amber-400" />
                <span className="hidden sm:inline">계정 연동</span>
              </button>
            )}
            
            {(appUser?.role === 'admin' || user?.email === 'info@nextin.ai.kr') && (
              <button
                onClick={() => setIsAdminPanelOpen(true)}
                className="flex items-center gap-2 px-3 py-2 rounded-full border border-amber-500/50 hover:border-amber-400 hover:text-amber-400 text-amber-500 transition-all text-sm font-bold bg-amber-900/10"
              >
                <User className="w-4 h-4" />
                <span className="hidden sm:inline">관리자 대시보드</span>
              </button>
            )}

            <button
              onClick={() => {
                setTempApiKey(apiKey);
                setIsApiKeyModalOpen(true);
              }}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 transition-all text-sm font-bold shadow-inner"
            >
              <Key className="w-4 h-4 text-amber-400" />
              <span className="hidden sm:inline">API Key</span>
              <div className={`w-2.5 h-2.5 rounded-full shadow-[0_0_8px_rgba(0,0,0,1)] ${hasKey ? 'bg-emerald-400 shadow-emerald-400/50' : 'bg-red-500 shadow-red-500/50'}`} />
            </button>
            
            <button
              onClick={() => setIsHowToUseOpen(true)}
              className="md:hidden p-2 rounded-full border border-zinc-700"
            >
              <HelpCircle className="w-5 h-5 text-amber-400" />
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      {currentTab === 'create' && (
        <div className="relative w-full aspect-video max-h-[500px] bg-zinc-950 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent z-10" />
          <img 
            src="https://images.unsplash.com/photo-1506784983877-45594efa4cbe?q=80&w=2068&auto=format&fit=crop" 
            alt="Calendar and Planning" 
            className="w-full h-full object-cover opacity-40 scale-105"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center z-20">
            <div className="inline-block px-3 py-1 bg-red-600 text-white text-[10px] font-black tracking-[0.2em] rounded-sm mb-4 animate-pulse">
              LIMITED EDITION 2026
            </div>
            <h2 className="text-5xl md:text-7xl lg:text-8xl font-black text-white tracking-tighter mb-4">
              혁신 수익화 캘린더 <span className="text-amber-400">AI</span>
            </h2>
            <p className="text-lg md:text-2xl text-zinc-300 max-w-2xl font-light italic">
              "미래의 수익은 오늘의 혁신적인 계획에서 시작됩니다"
            </p>
            <div className="w-24 h-1 bg-amber-400 mt-8 rounded-full" />
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-20">
        
        {currentTab === 'create' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-12">
          
          {/* Left Column: Inputs */}
          <div className="lg:col-span-12 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              
              {/* 1. File Upload Section */}
              <div className="bg-zinc-900/50 rounded-3xl border border-zinc-800 p-8 relative overflow-hidden backdrop-blur-sm group hover:border-amber-400/30 transition-all">
                <div className="absolute top-0 left-0 w-2 h-full bg-red-600"></div>
                <h3 className="text-xl font-black text-white mb-4 flex items-center gap-3">
                  <Upload className="w-6 h-6 text-red-500" />
                  1. 참고 문서 첨부 (Premium)
                </h3>
                <div className="bg-zinc-800/50 p-4 rounded-2xl mb-6 border border-zinc-700">
                  <p className="text-sm text-zinc-300 leading-relaxed">
                    <span className="font-bold text-amber-400">첨부 권장 파일:</span> <br/>
                    • 혁신 수익화 발굴 MD파일 <br/>
                    • 혁신 트렌드 AI MD 파일
                  </p>
                  <p className="text-[11px] text-zinc-500 mt-3 italic">
                    * 문서를 첨부하시면 AI가 데이터를 즉시 분석하여 최적화된 로드맵을 설계합니다.
                  </p>
                </div>
                
                <div className="flex flex-col gap-4">
                  <label className="flex items-center justify-center w-full py-4 bg-zinc-800 border-2 border-dashed border-zinc-700 rounded-2xl cursor-pointer hover:bg-zinc-700 hover:border-amber-400 transition-all group">
                    <div className="flex flex-col items-center">
                      <Upload className="w-8 h-8 mb-2 text-zinc-500 group-hover:text-amber-400 transition-colors" />
                      <span className="text-sm font-bold text-zinc-400 group-hover:text-white">파일 드래그 또는 클릭</span>
                    </div>
                    <input
                      type="file"
                      multiple
                      accept=".md,.docx,.txt"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                  
                  {files.length > 0 && (
                    <div className="space-y-2 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                      {files.map((file, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-zinc-800/80 rounded-xl border border-zinc-700">
                          <div className="flex items-center gap-3 overflow-hidden">
                            <FileText className="w-4 h-4 text-amber-400" />
                            <span className="text-xs font-medium truncate">{file.name}</span>
                          </div>
                          <button onClick={() => removeFile(index)} className="p-1 hover:text-red-500 transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* 2. Roadmap Requirements Section */}
              <div className="bg-zinc-900/50 rounded-3xl border border-zinc-800 p-8 relative overflow-hidden backdrop-blur-sm group hover:border-amber-400/30 transition-all">
                <div className="absolute top-0 left-0 w-2 h-full bg-amber-400"></div>
                <h3 className="text-xl font-black text-white mb-4 flex items-center gap-3">
                  <FileText className="w-6 h-6 text-amber-400" />
                  2. 로드맵 요청사항 (선택사항)
                </h3>
                <div className="bg-zinc-800/50 p-4 rounded-2xl mb-6 border border-zinc-700">
                  <p className="text-sm text-zinc-300 leading-relaxed">
                    로드맵에 반영하고 싶은 구체적인 목표나 요청사항이 있다면 자유롭게 입력해주세요. (필수 아님)
                  </p>
                </div>
                <textarea 
                  value={inputText} 
                  onChange={e => setInputText(e.target.value)} 
                  placeholder="AI에게 특별히 요청하고 싶은 전략 방향이나 세부적인 목표를 입력해주세요." 
                  className="w-full bg-zinc-800 border-2 border-zinc-700 rounded-2xl px-6 py-4 text-base focus:border-amber-400 outline-none text-white placeholder:text-zinc-600 transition-all min-h-[160px] resize-none font-medium"
                />
              </div>
            </div>

            {error && (
              <div className="p-4 bg-red-950 border border-red-800 text-red-200 rounded-2xl text-sm font-bold flex items-center gap-3">
                <div className="w-6 h-6 bg-red-600 rounded-full flex items-center justify-center flex-shrink-0 text-white">!</div>
                {error}
              </div>
            )}

            {/* Action Button */}
            <div className="space-y-6">
              <button
                onClick={generatePlan}
                disabled={loading}
                className={`w-full group relative overflow-hidden py-6 bg-amber-400 hover:bg-amber-300 text-black font-black text-2xl rounded-3xl transition-all shadow-[0_10px_40px_-10px_rgba(251,191,36,0.5)] active:scale-[0.98]`}
              >
                <div className="absolute top-0 left-[-100%] w-full h-full bg-gradient-to-r from-transparent via-white/40 to-transparent group-hover:left-[100%] transition-all duration-700 ease-in-out" />
                <div className="flex items-center justify-center gap-4">
                  {loading ? (
                    <>
                      <Loader2 className="w-8 h-8 animate-spin" />
                      <span>로드맵 설계 중...</span>
                    </>
                  ) : (
                    <>
                      <span>혁신 수익화 캘린더 생성</span>
                      <Calendar className="w-7 h-7" />
                    </>
                  )}
                </div>
              </button>

              {loading && (
                <div className="bg-zinc-900 rounded-3xl p-8 border border-zinc-800 shadow-2xl animate-in fade-in zoom-in duration-500">
                  <div className="flex justify-between items-end mb-4">
                    <div>
                      <h4 className="text-amber-400 text-xs font-black uppercase tracking-[0.3em] mb-1">Status Report</h4>
                      <p className="text-2xl font-black text-white">생성 진행도 <span className="text-amber-400">{progress}%</span></p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-zinc-500 font-bold uppercase mb-1">Estimated Time</p>
                      <p className="text-lg font-mono text-white">CALCULATING...</p>
                    </div>
                  </div>
                  <div className="w-full bg-zinc-800 rounded-full h-4 overflow-hidden p-1 shadow-inner ring-1 ring-zinc-700">
                    <div 
                      className="bg-gradient-to-r from-amber-600 via-amber-400 to-amber-300 h-full rounded-full transition-all duration-500 ease-out shadow-[0_0_15px_rgba(251,191,36,0.5)]" 
                      style={{ width: `${Math.max(progress, 2)}%` }}
                    />
                  </div>
                  <div className="mt-6 flex items-center gap-4 text-amber-400/60 font-medium italic text-sm">
                    <div className="flex gap-1">
                      <div className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                      <div className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                      <div className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-bounce"></div>
                    </div>
                    AI가 사용자의 데이터를 분석하여 {progress === 100 ? '최종 검토 중' : `${Math.floor(progress * 0.9)}일차 일정 설계 중`}입니다...
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        )}

        {/* My Page / Output Section */}
        {currentTab === 'mypage' && (
           <div className="mb-12">
             <div className="flex items-center gap-4 mb-8 border-b border-zinc-800 pb-6">
                <User className="w-8 h-8 text-amber-400" />
                <h2 className="text-3xl lg:text-4xl font-black text-white">나의 90일 수익화 캘린더</h2>
             </div>

             <div className="bg-zinc-900/50 border border-amber-400/20 rounded-xl p-4 mb-8 flex gap-3 text-sm">
                <Info className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div className="text-zinc-300 leading-relaxed font-semibold">
                  <p className="font-bold text-amber-400 mb-2">안내사항</p>
                  <p>나의 90일 수익화 캘린더에 모든 일차별 수익화 미션은 참고 링크, 참고 이미지, 비고란 중 하나라도 작성이 되어야 실행 체크가 가능합니다.</p>
                  <p>비고란은 참고 링크, 참고 이미지가 없는 경우 작성해주세요.</p>
                </div>
             </div>

             {calendarsInfo.length > 0 && (
               <div className="mb-8">
                 <div className="flex items-center justify-between mb-4">
                   <h3 className="text-xl font-bold text-white flex items-center gap-2">
                     <Calendar className="w-5 h-5 text-zinc-400" />
                     저장된 캘린더 (게시판)
                   </h3>
                 </div>
                 <div className="flex flex-wrap gap-3">
                   {calendarsInfo.map(cal => (
                     <div
                       key={cal.id}
                       className={`flex-1 min-w-[200px] max-w-[300px] rounded-xl border transition-all relative overflow-hidden group flex flex-col ${
                         currentCalendarId === cal.id 
                           ? 'bg-amber-400/5 border-amber-400/50 text-amber-400' 
                           : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:bg-zinc-800/20'
                       }`}
                     >
                       {currentCalendarId === cal.id && (
                         <div className="absolute top-0 left-0 w-1 h-full bg-amber-400"></div>
                       )}
                       <div className="flex-1 px-5 py-4 flex flex-col justify-center">
                         {editingCalendarId === cal.id ? (
                           <div className="flex items-center gap-2 mb-1.5" onClick={(e) => e.stopPropagation()}>
                             <input
                               type="text"
                               value={editingCalendarTitle}
                               onChange={(e) => setEditingCalendarTitle(e.target.value)}
                               className="flex-1 min-w-0 bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-sm text-white focus:outline-none focus:border-amber-400"
                               autoFocus
                               onKeyDown={(e) => {
                                 if (e.key === 'Enter') handleUpdateCalendarTitle(cal.id);
                                 if (e.key === 'Escape') setEditingCalendarId(null);
                               }}
                             />
                             <button onClick={() => handleUpdateCalendarTitle(cal.id)} className="p-1 text-emerald-400 hover:bg-emerald-400/10 rounded flex-shrink-0">
                               <Check className="w-4 h-4" />
                             </button>
                             <button onClick={() => setEditingCalendarId(null)} className="p-1 text-zinc-500 hover:bg-zinc-800 rounded flex-shrink-0">
                               <X className="w-4 h-4" />
                             </button>
                           </div>
                         ) : (
                           <div className="relative group/title mb-1.5">
                             <button onClick={() => loadCalendarData(cal.id)} className="text-left focus:outline-none w-full block">
                               <div className={`font-bold text-base truncate pr-8 ${currentCalendarId === cal.id ? 'text-amber-400' : 'text-zinc-200'}`}>
                                 {cal.title}
                               </div>
                             </button>
                             {cal.id !== 'local' && (
                               <button 
                                 onClick={(e) => {
                                   e.stopPropagation();
                                   setEditingCalendarId(cal.id);
                                   setEditingCalendarTitle(cal.title);
                                 }}
                                 className="absolute right-0 top-1/2 -translate-y-1/2 p-1.5 opacity-0 group-hover/title:opacity-100 transition-opacity text-zinc-500 hover:text-amber-400 hover:bg-amber-400/10 rounded-md"
                               >
                                 <Edit2 className="w-3.5 h-3.5" />
                               </button>
                             )}
                           </div>
                         )}
                         <div className="text-xs opacity-70 flex items-center justify-between mt-auto pointer-events-none">
                           <span>{cal.createdAt.toLocaleDateString('ko-KR')} 생성</span>
                           {currentCalendarId === cal.id && <span className="px-2 py-0.5 bg-amber-400/20 text-amber-400 rounded-md text-[10px] font-black uppercase">Viewing</span>}
                         </div>
                       </div>
                       <button 
                         onClick={(e) => {
                           e.stopPropagation();
                           handleDeleteCalendar(cal.id);
                         }}
                         className="absolute right-3 top-3 p-1.5 text-zinc-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                       >
                         <Trash2 className="w-4 h-4" />
                       </button>
                     </div>
                   ))}
                 </div>
               </div>
             )}

             {!user ? (
               <div className="text-center py-20 bg-zinc-900/50 rounded-3xl border border-zinc-800 backdrop-blur-sm">
                 <Lock className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
                 <p className="text-xl font-bold text-zinc-400 mb-6">수익화 캘린더 생성 및 보관을 위해 로그인해주세요.</p>
                 <button onClick={() => setIsAuthModalOpen(true)} className="px-8 py-4 bg-amber-400 text-black font-black rounded-xl hover:bg-amber-300">
                   이메일 / Google 로그인
                 </button>
               </div>
             ) : (
                <>
                  {loading && (
                    <div className="bg-zinc-900 rounded-3xl p-8 border border-zinc-800 shadow-2xl mb-8 animate-in fade-in duration-500">
                      <div className="flex justify-between items-end mb-4">
                        <div>
                          <h4 className="text-amber-400 text-xs font-black uppercase tracking-[0.3em] mb-1">Status Report</h4>
                          <p className="text-2xl font-black text-white">생성 진행도 <span className="text-amber-400">{progress}%</span></p>
                        </div>
                      </div>
                      <div className="w-full bg-zinc-800 rounded-full h-4 overflow-hidden p-1 shadow-inner ring-1 ring-zinc-700">
                        <div 
                          className="bg-gradient-to-r from-amber-600 via-amber-400 to-amber-300 h-full rounded-full transition-all duration-500 ease-out shadow-[0_0_15px_rgba(251,191,36,0.5)]" 
                          style={{ width: `${Math.max(progress, 2)}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {!output && !loading ? (
                    <div className="text-center py-20 bg-zinc-900/50 rounded-3xl border border-zinc-800 backdrop-blur-sm">
                       <Calendar className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
                       <p className="text-xl font-bold text-zinc-400 mb-6">아직 생성된 일정이 없습니다.</p>
                       <button onClick={() => setCurrentTab('create')} className="px-8 py-4 bg-amber-400 text-black font-black rounded-xl hover:bg-amber-300">
                         캘린더 생성하러 가기
                       </button>
                    </div>
                  ) : (output && (
                    <div className="bg-zinc-900 rounded-[2.5rem] border border-zinc-800 p-8 md:p-12 shadow-2xl relative overflow-hidden animate-in fade-in slide-in-from-bottom-12 duration-700">
                      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-600 via-amber-400 to-red-600"></div>
            
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12 border-b border-zinc-800 pb-8">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-red-600/10 text-red-500 text-[10px] font-black tracking-widest rounded-full mb-3 border border-red-500/20">
                  <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-ping"></div>
                  EXCLUSIVE OUTPUT
                </div>
                <h3 className="text-3xl md:text-4xl font-black text-white tracking-tighter flex items-center gap-3">
                   <Table className="w-8 h-8 text-amber-400" />
                   {editingCalendarId === currentCalendarId && currentCalendarId !== 'local' ? (
                     <div className="flex items-center gap-3">
                       <input
                         type="text"
                         value={editingCalendarTitle}
                         onChange={(e) => setEditingCalendarTitle(e.target.value)}
                         className="bg-zinc-950 border border-zinc-700 rounded-xl px-4 py-1 text-2xl md:text-3xl text-white outline-none focus:border-amber-400 w-full max-w-sm"
                         autoFocus
                         onKeyDown={(e) => {
                           if (e.key === 'Enter') handleUpdateCalendarTitle(currentCalendarId);
                           if (e.key === 'Escape') setEditingCalendarId(null);
                         }}
                       />
                       <button onClick={() => handleUpdateCalendarTitle(currentCalendarId)} className="p-2 text-emerald-400 hover:bg-emerald-400/10 rounded-xl">
                         <Check className="w-6 h-6" />
                       </button>
                       <button onClick={() => setEditingCalendarId(null)} className="p-2 text-zinc-500 hover:bg-zinc-800 rounded-xl">
                         <X className="w-6 h-6" />
                       </button>
                     </div>
                   ) : (
                     <div className="flex items-center gap-3 group/header">
                       {calendarsInfo.find(c => c.id === currentCalendarId)?.title || '90일 수익화 캘린더'}
                       {currentCalendarId && currentCalendarId !== 'local' && (
                         <button 
                           onClick={() => {
                             setEditingCalendarId(currentCalendarId);
                             setEditingCalendarTitle(calendarsInfo.find(c => c.id === currentCalendarId)?.title || '');
                           }}
                           className="opacity-0 group-hover/header:opacity-100 transition-opacity p-2 text-zinc-500 hover:text-amber-400 hover:bg-zinc-800 rounded-xl"
                         >
                           <Edit2 className="w-5 h-5" />
                         </button>
                       )}
                     </div>
                   )}
                </h3>
                
                {parseCalendarDays(output).length > 0 && (() => {
                   const total = parseCalendarDays(output).length;
                   const compCount = Object.values(completedDays).filter(Boolean).length;
                   const pct = Math.round((compCount / Math.max(1, total)) * 100);
                   return (
                     <div className="mt-4 flex items-center gap-4">
                        <div className="flex-1 w-48 bg-zinc-800 rounded-full h-2.5 overflow-hidden ring-1 ring-zinc-700/50">
                          <div 
                            className="bg-amber-400 h-full rounded-full transition-all duration-700 ease-out shadow-[0_0_10px_rgba(251,191,36,0.3)]"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="text-amber-400 font-black text-sm">
                          {pct}% 완료 <span className="text-zinc-500 font-normal">({compCount}/{total})</span>
                        </span>
                     </div>
                   );
                })()}
              </div>
            </div>
            
            {parseCalendarDays(output).length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
                  {parseCalendarDays(output).map((d, i) => {
                    const isCompleted = completedDays[d.day];
                    return (
                      <div key={i} className={`bg-zinc-950 border ${isCompleted ? 'border-emerald-500/50 bg-emerald-950/20' : 'border-zinc-800'} rounded-2xl p-5 hover:border-amber-400/40 transition-colors flex flex-col h-full shadow-lg group select-none cursor-pointer`} onClick={() => setSelectedDay(d)}>
                        <div className="flex items-center justify-between mb-4">
                          <div className={`border ${isCompleted ? 'bg-emerald-900 border-emerald-700 text-emerald-400' : 'bg-zinc-900 border-zinc-800 text-amber-400 group-hover:border-amber-400/30'} font-black text-sm px-3 py-1.5 rounded-lg w-fit transition-colors`}>
                            {d.day}일차
                          </div>
                          <div 
                            className={`w-6 h-6 rounded flex items-center justify-center border-2 transition-colors ${isCompleted ? 'bg-emerald-500 border-emerald-500 text-zinc-950' : 'border-zinc-700 bg-zinc-900 group-hover:border-amber-400'}`}
                            onClick={(e) => { e.stopPropagation(); toggleDayCompletion(d.day); }}
                          >
                            {isCompleted && <CheckCircle className="w-4 h-4" />}
                          </div>
                        </div>
                        <div className={`text-sm font-medium leading-relaxed line-clamp-[8] flex-grow ${isCompleted ? 'text-zinc-500 line-through' : 'text-zinc-300'}`}>
                          {d.content}
                        </div>
                        {((dayMetadata[d.day]?.links?.length || 0) > 0 || (dayMetadata[d.day]?.images?.length || 0) > 0 || !!dayMetadata[d.day]?.remarks?.trim()) && (
                          <div className="mt-4 pt-4 border-t border-zinc-800/50 flex gap-3 text-xs font-bold text-zinc-500">
                            {(dayMetadata[d.day]?.links?.length || 0) > 0 && (
                              <div className="flex items-center gap-1.5 text-amber-500">
                                <LinkIcon className="w-3.5 h-3.5" />
                                {dayMetadata[d.day].links.length}
                              </div>
                            )}
                            {(dayMetadata[d.day]?.images?.length || 0) > 0 && (
                              <div className="flex items-center gap-1.5 text-amber-500">
                                <ImageIcon className="w-3.5 h-3.5" />
                                {dayMetadata[d.day].images.length}
                              </div>
                            )}
                            {!!dayMetadata[d.day]?.remarks?.trim() && (
                              <div className="flex items-center gap-1.5 text-amber-500">
                                <FileText className="w-3.5 h-3.5" />
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
            )}
          </div>
        ))}
        </>
        )}
        </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto py-8 border-t border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="flex flex-wrap items-center justify-center gap-4 md:gap-6 text-sm text-zinc-400">
            <button
              onClick={() => setIsPatchNotesOpen(true)}
              className="hover:text-amber-400 transition-colors flex items-center gap-2"
            >
              <FileText className="w-4 h-4" />
              패치노트
            </button>
            <div className="w-1 h-1 rounded-full bg-zinc-700"></div>
            <button
              onClick={() => setIsApiCostModalOpen(true)}
              className="hover:text-amber-400 transition-colors flex items-center gap-2"
            >
              <Info className="w-4 h-4" />
              API 비용안내
            </button>
            <div className="w-1 h-1 rounded-full bg-zinc-700"></div>
            <button
              onClick={() => setIsHowToUseOpen(true)}
              className="hover:text-amber-400 transition-colors flex items-center gap-2"
            >
              <HelpCircle className="w-4 h-4" />
              사용방법
            </button>
          </div>
          <div className="text-center mt-6 text-xs text-zinc-600">
            Powered by Nextin AI. All rights reserved.
          </div>
        </div>
      </footer>

      {/* Day Details Modal */}
      {selectedDay && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6 md:p-8 max-w-2xl w-full shadow-2xl relative animate-in zoom-in-95 duration-200">
            <button 
              onClick={() => setSelectedDay(null)}
              className="absolute top-6 right-6 text-zinc-500 hover:text-white transition-colors p-2 hover:bg-zinc-900 rounded-full"
            >
              <X className="w-6 h-6" />
            </button>
            <div className="pr-12">
              <div className="flex items-center gap-4 mb-6">
                <div className="bg-amber-400/10 text-amber-400 px-4 py-2 rounded-xl font-black border border-amber-400/20">
                  {selectedDay.day}일차
                </div>
                <button
                  onClick={() => toggleDayCompletion(selectedDay.day)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold border transition-colors ${
                    completedDays[selectedDay.day] ? 'bg-emerald-500 text-zinc-950 border-emerald-500' : 'bg-transparent text-zinc-400 border-zinc-700 hover:bg-zinc-900 hover:text-zinc-200'
                  }`}
                >
                  <div className={`w-5 h-5 rounded border flex items-center justify-center ${completedDays[selectedDay.day] ? 'border-zinc-950' : 'border-zinc-500'}`}>
                    {completedDays[selectedDay.day] && <CheckCircle className="w-3.5 h-3.5" />}
                  </div>
                  {completedDays[selectedDay.day] ? '실행 완료' : '미실행'}
                </button>
              </div>
              <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-2xl p-6 whitespace-pre-wrap text-zinc-300 leading-relaxed font-medium">
                {selectedDay.content}
              </div>

              {/* Metadata Display and Addition */}
              <div className="mt-8 space-y-6">
                 {/* Links Section */}
                 <div>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-white font-bold flex items-center gap-2">
                        <LinkIcon className="w-4 h-4 text-amber-400" />
                        참고 링크
                      </h4>
                      <button onClick={() => setActiveInput(activeInput === 'link' ? null : 'link')} className="p-1.5 bg-zinc-800 hover:bg-amber-400 hover:text-black rounded-lg text-zinc-400 transition-colors">
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                    {activeInput === 'link' && (
                      <div className="flex gap-2 mb-4 animate-in slide-in-from-top-2">
                        <input
                           type="url"
                           value={newLinkUrl}
                           onChange={(e) => setNewLinkUrl(e.target.value)}
                           placeholder="https://..."
                           className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-4 text-sm outline-none focus:border-amber-400 text-white"
                           onKeyDown={(e) => e.key === 'Enter' && handleAddMetadata('link', selectedDay.day)}
                        />
                        <button onClick={() => handleAddMetadata('link', selectedDay.day)} className="px-4 py-2 bg-amber-400 text-black font-bold rounded-xl text-sm">
                          추가
                        </button>
                      </div>
                    )}
                    <div className="space-y-2">
                      {(dayMetadata[selectedDay.day]?.links || []).map((link, idx) => (
                        <div key={idx} className="flex items-center justify-between bg-zinc-900/50 border border-zinc-800 rounded-xl p-3 group">
                           <a href={link} target="_blank" rel="noopener noreferrer" className="text-amber-400 hover:underline text-sm truncate max-w-[80%]">
                             {link}
                           </a>
                           <button onClick={() => removeMetadata('link', selectedDay.day, idx)} className="text-zinc-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity">
                             <Trash2 className="w-4 h-4" />
                           </button>
                        </div>
                      ))}
                      {(dayMetadata[selectedDay.day]?.links || []).length === 0 && (
                        <div className="text-zinc-500 text-sm italic px-2">등록된 링크가 없습니다.</div>
                      )}
                    </div>
                 </div>

                 {/* Images Section */}
                 <div>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-white font-bold flex items-center gap-2">
                        <ImageIcon className="w-4 h-4 text-amber-400" />
                        참고 이미지
                      </h4>
                      <button onClick={() => setActiveInput(activeInput === 'image' ? null : 'image')} className="p-1.5 bg-zinc-800 hover:bg-amber-400 hover:text-black rounded-lg text-zinc-400 transition-colors">
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                    {activeInput === 'image' && (
                      <div className="flex gap-2 mb-4 animate-in slide-in-from-top-2">
                        <input
                           type="url"
                           value={newImageUrl}
                           onChange={(e) => setNewImageUrl(e.target.value)}
                           placeholder="이미지 URL (https://...)"
                           className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-4 text-sm outline-none focus:border-amber-400 text-white"
                           onKeyDown={(e) => e.key === 'Enter' && handleAddMetadata('image', selectedDay.day)}
                        />
                        <button onClick={() => handleAddMetadata('image', selectedDay.day)} className="px-4 py-2 bg-amber-400 text-black font-bold rounded-xl text-sm">
                          추가
                        </button>
                      </div>
                    )}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {(dayMetadata[selectedDay.day]?.images || []).map((img, idx) => (
                        <div key={idx} className="relative group rounded-xl overflow-hidden border border-zinc-800 aspect-video bg-zinc-900">
                           <img src={img} alt={`Day ${selectedDay.day} attachment`} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).src = 'https://via.placeholder.com/300x200?text=Invalid+Image'; }} />
                           <button onClick={() => removeMetadata('image', selectedDay.day, idx)} className="absolute top-2 right-2 p-1.5 bg-black/70 hover:bg-red-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-all backdrop-blur-sm">
                             <Trash2 className="w-4 h-4" />
                           </button>
                        </div>
                      ))}
                    </div>
                    {(dayMetadata[selectedDay.day]?.images || []).length === 0 && (
                        <div className="text-zinc-500 text-sm italic px-2">등록된 이미지가 없습니다.</div>
                    )}
                 </div>

                 {/* Remarks Section */}
                 <div>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-white font-bold flex items-center gap-2">
                        <FileText className="w-4 h-4 text-amber-400" />
                        비고란
                      </h4>
                      {!editingRemarks && (
                        <button onClick={() => setEditingRemarks(true)} className="p-1.5 bg-zinc-800 hover:bg-amber-400 hover:text-black rounded-lg text-zinc-400 transition-colors">
                          <Edit2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    {editingRemarks ? (
                      <div className="animate-in slide-in-from-top-2">
                        <textarea
                           value={remarksText}
                           onChange={(e) => setRemarksText(e.target.value)}
                           placeholder="비고란은 참고 링크, 참고 이미지가 없는 경우 작성해주세요..."
                           className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-4 text-sm outline-none focus:border-amber-400 text-white min-h-[100px] resize-y mb-3"
                        />
                        <div className="flex justify-end gap-2">
                          <button onClick={() => { setEditingRemarks(false); setRemarksText(dayMetadata[selectedDay.day]?.remarks || ''); }} className="px-4 py-2 text-zinc-400 hover:text-white font-bold text-sm">
                            취소
                          </button>
                          <button onClick={() => handleSaveRemarks(selectedDay.day)} className="px-4 py-2 bg-amber-400 text-black font-bold rounded-xl text-sm flex items-center gap-2">
                            <Check className="w-4 h-4" />
                            저장
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div 
                        className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 text-sm text-zinc-300 min-h-[60px] whitespace-pre-wrap cursor-pointer hover:border-zinc-600 transition-colors"
                        onClick={() => setEditingRemarks(true)}
                      >
                        {dayMetadata[selectedDay.day]?.remarks || <span className="text-zinc-600 italic">비고란은 참고 링크, 참고 이미지가 없는 경우 작성해주세요...</span>}
                      </div>
                    )}
                 </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-zinc-950 border-t border-zinc-900 py-16">
        <div className="max-w-7xl mx-auto px-4 flex flex-col items-center">
          <div className="flex items-center gap-3 mb-6">
            <Calendar className="w-8 h-8 text-amber-400" />
            <span className="text-2xl font-black tracking-tighter">혁신 수익화 캘린더 <span className="text-amber-400">AI</span></span>
          </div>
          <div className="text-zinc-500 text-sm font-medium flex flex-col items-center gap-2">
            <p className="flex items-center gap-2">
              <span className="text-zinc-700">Project Developer:</span> 
              <span className="text-white font-black bg-zinc-900 px-3 py-1 rounded-lg border border-zinc-800 shadow-sm">정혁신</span>
            </p>
            <p className="mt-4">© 2026 혁신 수익화 캘린더 AI. Leading the way in digital monetization.</p>
          </div>
        </div>
      </footer>

      {/* API Key Modal */}
      {isApiKeyModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[100] p-4">
          <div className="bg-zinc-900 rounded-[2.5rem] p-10 w-full max-w-md shadow-2xl border border-zinc-800 relative overflow-hidden">
             <div className="absolute top-0 left-0 w-full h-1 bg-amber-400"></div>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-black text-white italic">SET KEY</h3>
              <button onClick={() => setIsApiKeyModalOpen(false)} className="bg-zinc-800 p-2 rounded-full text-zinc-400 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-zinc-400 text-sm mb-8 leading-relaxed font-medium">
              안전한 데이터 처리를 위해 <span className="text-white font-bold underline decoration-amber-400">Google Gemini API Key</span>가 필요합니다. 입력된 키는 로컬 보안 환경에만 저장됩니다.
            </p>
            <div className="relative mb-8">
              <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 w-5 h-5" />
              <input
                type={showApiKey ? 'text' : 'password'}
                value={tempApiKey}
                onChange={(e) => setTempApiKey(e.target.value)}
                placeholder="AIzaSy..."
                className="w-full bg-zinc-800 border-2 border-zinc-700 rounded-2xl py-4 pl-12 pr-12 text-sm focus:border-amber-400 outline-none text-white transition-all font-mono"
              />
              <button
                type="button"
                onClick={() => setShowApiKey(!showApiKey)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition-colors focus:outline-none"
                title={showApiKey ? "입력 가리기" : "입력 보기"}
              >
                {showApiKey ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            <div className="flex flex-col gap-2">
              <button
                onClick={handleSaveApiKey}
                className="w-full py-4 bg-amber-400 hover:bg-amber-300 text-black font-black rounded-2xl transition-all shadow-lg active:scale-95"
              >
                ACTIVATE KEY
              </button>
              <button
                onClick={() => setIsApiKeyModalOpen(false)}
                className="w-full py-3 text-zinc-500 hover:text-white transition-colors text-xs font-black tracking-widest"
              >
                DISMISS
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Admin Dashboard */}
      {isAdminPanelOpen && (
        <AdminDashboard 
          onClose={() => setIsAdminPanelOpen(false)} 
          onViewCalendar={async (cal) => {
            setCalendarsInfo(prev => {
              if(!prev.some(c => c.id === cal.id)) {
                return [{id: cal.id, title: `[관리자 열람] ${cal.title}`, createdAt: new Date(cal.createdAt?.toMillis() || Date.now())}, ...prev];
              }
              return prev;
            });
            await loadCalendarData(cal.id);
            setCurrentTab('mypage');
            setIsAdminPanelOpen(false);
          }}
        />
      )}

      {/* Auth Modal */}
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />

      {/* FAQ Modal */}
      <FaqModal isOpen={isFaqModalOpen} onClose={() => setIsFaqModalOpen(false)} />

      {/* API Cost Modal */}
      {isApiCostModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[100] p-4">
          <div className="bg-zinc-900 rounded-[2.5rem] p-8 md:p-12 w-full max-w-md shadow-2xl border border-zinc-800 relative overflow-hidden text-center">
            <div className="absolute top-0 left-0 w-full h-1 bg-amber-400"></div>
            <div className="bg-amber-400 w-16 h-16 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-amber-400/20">
              <Info className="w-8 h-8 text-black" />
            </div>
            <h3 className="text-2xl font-black text-white italic mb-2">ESTIMATED API COST</h3>
            <p className="text-zinc-400 text-xs font-bold mb-6">혁신 수익화 캘린더 AI 사용 시 발생 비용</p>
            
            <div className="grid grid-cols-3 gap-2 bg-zinc-950 p-4 rounded-3xl border border-zinc-800 mb-6">
              <div className="bg-zinc-900/80 p-3 rounded-2xl border border-zinc-850/50">
                <p className="text-zinc-500 text-[10px] font-black uppercase tracking-wider mb-1">최소 비용</p>
                <p className="text-sm font-black text-emerald-400">₩140</p>
              </div>
              <div className="bg-zinc-900/80 p-3 rounded-2xl border border-zinc-850/50">
                <p className="text-zinc-500 text-[10px] font-black uppercase tracking-wider mb-1">평균 비용</p>
                <p className="text-sm font-black text-amber-400">₩250</p>
              </div>
              <div className="bg-zinc-900/80 p-3 rounded-2xl border border-zinc-850/50">
                <p className="text-zinc-500 text-[10px] font-black uppercase tracking-wider mb-1">최대 비용</p>
                <p className="text-sm font-black text-red-500">₩450</p>
              </div>
            </div>

            <div className="space-y-4 text-left bg-zinc-800/30 p-6 rounded-2xl border border-zinc-800 mb-8">
              <div className="flex gap-3">
                <div className="w-1.5 h-1.5 bg-amber-400 rounded-full mt-1.5 flex-shrink-0"></div>
                <p className="text-zinc-400 text-xs leading-relaxed">
                  결과물(텍스트 길이)에 따라 비용 편차가 발생할 수 있음을 알려드립니다.
                </p>
              </div>
              <div className="flex gap-3">
                <div className="w-1.5 h-1.5 bg-amber-400 rounded-full mt-1.5 flex-shrink-0"></div>
                <p className="text-zinc-400 text-xs leading-relaxed">
                  Gemini API의 실시간 토큰 사용량에 기반하여 자동 계산된 수치입니다.
                </p>
              </div>
            </div>

            <button 
              onClick={() => setIsApiCostModalOpen(false)}
              className="w-full py-4 bg-zinc-800 hover:bg-zinc-700 text-white font-black rounded-2xl border border-zinc-700 transition-all flex items-center justify-center gap-2"
            >
              확인 (닫기)
            </button>
          </div>
        </div>
      )}

      {/* Patch Notes Modal */}
      {isPatchNotesOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[100] p-4">
          <div className="bg-zinc-900 rounded-[2.5rem] p-8 md:p-12 w-full max-w-2xl shadow-2xl border border-zinc-800 relative my-8">
            <div className="absolute top-0 left-0 w-full h-1 bg-amber-400"></div>
            
            <div className="flex justify-between items-center mb-8">
              <div className="flex items-center gap-3">
                <div className="bg-amber-400 p-2 rounded-xl">
                  <FileText className="w-6 h-6 text-black" />
                </div>
                <h3 className="text-3xl font-black text-white italic tracking-tighter">PATCH NOTES</h3>
              </div>
              <button onClick={() => setIsPatchNotesOpen(false)} className="bg-zinc-800 p-2 rounded-full text-zinc-400 hover:text-white transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-4 custom-scrollbar">
              {PATCH_NOTES.map((note, index) => {
                const patchDate = new Date(note.date.replace(/\./g, '-'));
                const now = new Date();
                const diffTime = Math.abs(now.getTime() - patchDate.getTime());
                const diffDays = diffTime / (1000 * 60 * 60 * 24);
                const isNewPatch = diffDays <= 3;

                return (
                  <div key={note.version} className={`border-l-2 ${index === 0 ? 'border-amber-400' : 'border-zinc-800'} pl-6 relative`}>
                    <div className={`absolute -left-[9px] top-0 w-4 h-4 ${index === 0 ? 'bg-amber-400' : 'bg-zinc-800'} rounded-full border-4 border-zinc-900`}></div>
                    <div className="flex items-center gap-3 mb-2">
                       {isNewPatch && (
                         <span className="text-xs font-black bg-amber-400 text-black px-2 py-0.5 rounded animate-pulse">NEW</span>
                       )}
                       <span className={`${index === 0 ? 'text-amber-400' : 'text-zinc-500'} font-bold`}>{note.version}</span>
                       <span className="text-zinc-600 text-xs font-medium">{note.date}</span>
                    </div>
                    <h4 className="text-white font-black text-lg mb-2">{note.title}</h4>
                    <ul className="text-zinc-400 text-sm space-y-2 list-disc list-inside">
                       {note.changes.map((change, i) => (
                         <li key={i}>{change}</li>
                       ))}
                    </ul>
                  </div>
                );
              })}
            </div>

            <div className="mt-10 pt-8 border-t border-zinc-800">
               <button 
                onClick={() => setIsPatchNotesOpen(false)}
                className="w-full py-4 bg-zinc-800 hover:bg-zinc-700 text-white font-black rounded-2xl border border-zinc-700 transition-all"
              >
                CLOSE
              </button>
            </div>
          </div>
        </div>
      )}

      {/* How to Use Modal */}
      {isHowToUseOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[100] p-4 overflow-y-auto">
          <div className="bg-zinc-900 rounded-[2.5rem] p-8 md:p-12 w-full max-w-2xl shadow-2xl border border-zinc-800 relative my-8">
            <div className="absolute top-0 left-0 w-full h-1 bg-red-600"></div>
            
            <div className="flex justify-between items-center mb-8">
              <div className="flex items-center gap-3">
                <div className="bg-red-600 p-2 rounded-xl">
                  <HelpCircle className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-3xl font-black text-white italic tracking-tighter">HOW TO USE</h3>
              </div>
              <button onClick={() => setIsHowToUseOpen(false)} className="bg-zinc-800 p-2 rounded-full text-zinc-400 hover:text-white transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-8 max-h-[60vh] overflow-y-auto pr-4 custom-scrollbar">
              <div className="flex gap-6">
                <div className="w-12 h-12 rounded-2xl bg-zinc-800 flex items-center justify-center text-amber-400 text-2xl font-black flex-shrink-0 border border-zinc-700">1</div>
                <div>
                  <h4 className="text-xl font-bold text-white mb-2 italic">API Key 활성화</h4>
                  <p className="text-zinc-400 text-sm leading-relaxed">
                    우측 상단의 <span className="text-amber-400 font-bold">API Key</span> 버튼을 클릭하여 Google Gemini API Key를 입력하세요. 키가 정상적으로 설정되면 원형 램프가 초록색으로 변경됩니다.
                  </p>
                </div>
              </div>

              <div className="flex gap-6">
                <div className="w-12 h-12 rounded-2xl bg-zinc-800 flex items-center justify-center text-amber-400 text-2xl font-black flex-shrink-0 border border-zinc-700">2</div>
                <div>
                  <h4 className="text-xl font-bold text-white mb-2 italic">데이터 입력 (문서 또는 직접 입력)</h4>
                  <p className="text-zinc-400 text-sm leading-relaxed mb-4">
                    두 가지 방법 중 하나를 선택하세요:
                  </p>
                  <ul className="space-y-3">
                    <li className="flex gap-2">
                      <div className="w-1.5 h-1.5 bg-red-600 rounded-full mt-1.5 flex-shrink-0"></div>
                      <span className="text-sm text-zinc-300 font-medium"><b>방법 A:</b> 참고 문서(MD, DOCX)를 첨부하여 AI가 비즈니스 정황을 자동으로 파악하게 합니다.</span>
                    </li>
                    <li className="flex gap-2">
                      <div className="w-1.5 h-1.5 bg-red-600 rounded-full mt-1.5 flex-shrink-0"></div>
                      <span className="text-sm text-zinc-300 font-medium"><b>방법 B:</b> 로드맵 요청사항을 직접 작성하여 AI에게 구체적인 방향성을 제시합니다.</span>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="flex gap-6">
                <div className="w-12 h-12 rounded-2xl bg-zinc-800 flex items-center justify-center text-amber-400 text-2xl font-black flex-shrink-0 border border-zinc-700">3</div>
                <div>
                   <h4 className="text-xl font-bold text-white mb-2 italic">로드맵 생성 및 하이라이트</h4>
                   <p className="text-zinc-400 text-sm leading-relaxed">
                     <span className="font-bold text-white">"혁신 수익화 캘린더 생성"</span> 버튼을 클릭하면 AI가 실시간으로 3개월 치 수익화 플랜에 관한 초정밀 딥리서치를 시작합니다. 중요 내용은 가독성이 뛰어난 전용 색상(파랑색, 빨강색, 볼드 강조)으로 표시됩니다.
                   </p>
                </div>
              </div>

              <div className="flex gap-6">
                <div className="w-12 h-12 rounded-2xl bg-zinc-800 flex items-center justify-center text-amber-400 text-2xl font-black flex-shrink-0 border border-zinc-700">4</div>
                <div>
                  <h4 className="text-xl font-bold text-white mb-2 italic">마이페이지 캘린더 관리 및 메타데이터 추가</h4>
                  <p className="text-zinc-400 text-sm leading-relaxed">
                    생성된 로드맵은 마이페이지에 자동으로 저장됩니다. 각 일차의 달성 여부(미실행/실행 완료)를 체크하고, 개별 일정별로 <span className="text-amber-400 font-bold">참고 링크</span> 및 <span className="text-amber-400 font-bold">참고 이미지</span>를 추가하여 진척도를 꼼꼼히 관리할 수 있습니다. 캘린더 이름 변경도 가능합니다.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-10 pt-8 border-t border-zinc-800">
               <button 
                onClick={() => setIsHowToUseOpen(false)}
                className="w-full py-4 bg-zinc-800 hover:bg-zinc-700 text-white font-black rounded-2xl border border-zinc-700 transition-all flex items-center justify-center gap-2"
              >
                확인했습니다 (닫기)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Action Buttons */}
      <div className="fixed bottom-8 right-8 z-40 flex flex-col gap-3">
        <a 
          href="https://hyeoksinai.com" 
          target="_blank" 
          rel="noopener noreferrer"
          className="bg-white hover:bg-zinc-200 text-black px-6 py-3 rounded-2xl font-black text-sm shadow-2xl transition-all flex items-center gap-2 group ring-2 ring-black"
        >
          <span>혁신 AI 바로가기</span>
          <HelpCircle className="w-4 h-4 text-zinc-500 group-hover:text-black" />
        </a>
        <button 
          onClick={() => setIsMaintenanceOpen(true)}
          className="bg-red-600 hover:bg-red-500 text-white px-6 py-3 rounded-2xl font-black text-sm shadow-2xl transition-all flex items-center gap-2 ring-2 ring-black"
        >
          <span>오류 및 유지보수</span>
          <Info className="w-4 h-4" />
        </button>
      </div>

      {/* Maintenance Modal */}
      {isMaintenanceOpen && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-xl flex items-center justify-center z-[110] p-4">
          <div className="bg-zinc-900 rounded-[2.5rem] p-10 w-full max-w-md shadow-2xl border border-zinc-800 relative overflow-hidden text-center">
            <div className="absolute top-0 left-0 w-full h-1 bg-red-600"></div>
            <div className="bg-red-600 w-16 h-16 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-red-600/20">
              <Info className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-2xl font-black text-white italic mb-4">MAINTENANCE & SUPPORT</h3>
            <div className="bg-zinc-950 p-6 rounded-3xl border border-zinc-800 mb-6">
              <p className="text-zinc-400 text-sm font-medium mb-2 uppercase tracking-widest">Contact Email</p>
              <a href="mailto:info@nextin.ai.kr" className="text-xl font-black text-amber-400 hover:underline">info@nextin.ai.kr</a>
            </div>
            <p className="text-zinc-300 text-sm leading-relaxed mb-8 font-medium">
              시스템 오류 제보 및 유지보수 요청사항을 위 이메일로 발송해 주세요. <br/>
              <span className="text-amber-400 font-bold">실시간 확인 후 즉시 피드백</span> 드리겠습니다.
            </p>
            <button 
              onClick={() => setIsMaintenanceOpen(false)}
              className="w-full py-4 bg-zinc-800 hover:bg-zinc-700 text-white font-black rounded-2xl border border-zinc-700 transition-all"
            >
              CLOSE
            </button>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #18181b;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #3f3f46;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #52525b;
        }
      `}} />
    </div>
  );
}
