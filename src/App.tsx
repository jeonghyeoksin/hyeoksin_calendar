import React, { useState, useEffect } from 'react';
import { GoogleGenAI } from '@google/genai';
import mammoth from 'mammoth';
import { Document, Packer, Paragraph, TextRun, ShadingType } from 'docx';
import { saveAs } from 'file-saver';
import { Key, X, Upload, FileText, Download, Loader2, Calendar, Trash2, CheckCircle, HelpCircle, Info } from 'lucide-react';

export default function App() {
  const [apiKey, setApiKey] = useState('');
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);
  const [isHowToUseOpen, setIsHowToUseOpen] = useState(false);
  const [isMaintenanceOpen, setIsMaintenanceOpen] = useState(false);
  const [isPatchNotesOpen, setIsPatchNotesOpen] = useState(false);
  const [isApiCostModalOpen, setIsApiCostModalOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authCode, setAuthCode] = useState('');
  const [tempApiKey, setTempApiKey] = useState('');
  const [inputText, setInputText] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const storedKey = localStorage.getItem('geminiApiKey');
    if (storedKey) {
      setApiKey(storedKey);
    }
    const storedAuth = localStorage.getItem('appAuthenticated');
    if (storedAuth === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  const handleSaveApiKey = () => {
    localStorage.setItem('geminiApiKey', tempApiKey);
    setApiKey(tempApiKey);
    setIsApiKeyModalOpen(false);
  };

  const handleAuthenticate = () => {
    if (authCode === 'dc5') {
      setIsAuthenticated(true);
      localStorage.setItem('appAuthenticated', 'true');
      setIsAuthModalOpen(false);
      setError('');
    } else {
      alert('인증 코드가 올바르지 않습니다.');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(prev => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const parseFiles = async (filesToParse: File[]) => {
    let combinedText = '';
    for (const file of filesToParse) {
      if (file.name.endsWith('.md') || file.name.endsWith('.txt')) {
        const text = await file.text();
        combinedText += `\n--- 참고 문서: ${file.name} ---\n${text}\n`;
      } else if (file.name.endsWith('.docx')) {
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        combinedText += `\n--- 참고 문서: ${file.name} ---\n${result.value}\n`;
      }
    }
    return combinedText;
  };

  const generatePlan = async () => {
    if (!isAuthenticated) {
      setError('코드 인증이 완료되지 않았습니다. 우측 상단에서 인증을 진행해주세요.');
      setIsAuthModalOpen(true);
      return;
    }

    const keyToUse = apiKey || process.env.GEMINI_API_KEY;
    if (!keyToUse) {
      setError('API Key가 필요합니다. 우측 상단에서 설정해주세요.');
      return;
    }

    if (!inputText.trim() && files.length === 0) {
      setError('로드맵 요청사항을 입력하거나 참고 문서를 첨부해주세요.');
      return;
    }

    setLoading(true);
    setError('');
    setOutput('');
    setProgress(0);

    try {
      const ai = new GoogleGenAI({ apiKey: keyToUse });
      const parsedFilesText = await parseFiles(files);
      
      const prompt = `다음 정보를 바탕으로 2026년 수익화를 위한 90일(3개월) 로드맵을 작성해주세요.

[사용자 요청사항]
- 목표 및 요청사항: ${inputText || '미입력'}

[참고 문서 내용]
${parsedFilesText || '(첨부된 문서 없음)'}

위의 정보들을 종합하여 가장 효과적이고 혁신적인 90일 수익화 캘린더를 제안해주세요.`;

      const responseStream = await ai.models.generateContentStream({
        model: 'gemini-3.1-pro-preview',
        contents: prompt,
        config: {
          systemInstruction: "당신은 AI를 활용한 수익화 전략 전문가입니다. 사용자의 목표와 첨부된 참고 자료를 바탕으로 2026년 수익화를 위한 90일(3개월) 로드맵을 작성해야 합니다.\n\n중요 규칙:\n1. 1일부터 90일까지 하루도 빠짐없이 90일치 계획을 모두 작성하세요. (예: '1일차:', '2일차:' 형식 사용)\n2. 마크다운 문법(*, #, - 등)을 절대 사용하지 마세요.\n3. 가독성을 위해 두 문단마다 반드시 한 줄의 빈 줄(띄어쓰기)을 추가하세요.\n4. 내용 중 핵심 키워드나 강조 사항에는 반드시 HTML 태그를 사용하여 다음 3가지 스타일을 입히세요:\n- 진한 파란색: <span style=\"color: #1d4ed8; font-weight: bold;\">텍스트</span>\n- 중요 빨간색: <span style=\"color: #dc2626; font-weight: bold;\">텍스트</span>\n- 꼭 참조해야 할 사항(노란 배경): <span style=\"background-color: #fef08a; padding: 0 4px; border-radius: 4px;\">텍스트</span>\n5. 각 일차별로 구체적이고 실천 가능한 행동 계획을 제시하세요.",
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
      
      // Automatically trigger download after completion
      setTimeout(() => {
        handleFilesDownload(currentText);
      }, 500);
    } catch (err: any) {
      console.error(err);
      setError(err.message || '계획 생성 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleFilesDownload = (contentOverride?: string) => {
    const textToDownload = contentOverride || output;
    if (!textToDownload) return;

    const baseFileName = files.length > 0 ? files[0].name.split('.')[0] : "로드맵";
    
    // 1. DOCX Generation
    const paragraphs = textToDownload.split('\n').map(line => {
      const runs: TextRun[] = [];
      const parts = line.split(/(<span.*?>.*?<\/span>)/g);
      
      parts.forEach(part => {
        if (part.startsWith('<span')) {
          const colorMatch = part.match(/color:\s*(#[0-9a-fA-F]{6})/);
          const bgColorMatch = part.match(/background-color:\s*(#[0-9a-fA-F]{6})/);
          const textMatch = part.match(/>(.*?)<\/span>/);
          const color = colorMatch ? colorMatch[1].replace('#', '') : undefined;
          const bgColor = bgColorMatch ? bgColorMatch[1].replace('#', '') : undefined;
          const text = textMatch ? textMatch[1] : '';

          runs.push(new TextRun({
            text: text,
            bold: !!color || !!bgColor,
            color: color || "000000",
            shading: bgColor ? { fill: bgColor, type: ShadingType.CLEAR, color: "auto" } : undefined
          }));
        } else if (part) {
          runs.push(new TextRun({ text: part, color: "000000" }));
        }
      });

      return new Paragraph({
        children: runs,
        spacing: { after: 120 }
      });
    });

    const doc = new Document({
      sections: [{
        properties: {},
        children: paragraphs
      }]
    });

    const docxFileName = `혁신 수익화 캘린더AI_${baseFileName}.docx`;
    const mdFileName = `혁신 수익화 캘린더AI_${baseFileName}.md`;

    // Download DOCX
    Packer.toBlob(doc).then(blob => {
      saveAs(blob, docxFileName);
    });

    // Download MD (HTML stripped)
    const cleanOutput = textToDownload.replace(/<[^>]*>?/gm, '');
    const mdBlob = new Blob([cleanOutput], { type: 'text/markdown;charset=utf-8' });
    
    // Tiny timeout to ensure browser allows multiple downloads
    setTimeout(() => {
      saveAs(mdBlob, mdFileName);
    }, 300);
  };

  const hasKey = !!(apiKey || process.env.GEMINI_API_KEY);

  return (
    <div className="min-h-screen bg-black font-sans text-white">
      {/* Header */}
      <header className="bg-zinc-950 border-b border-zinc-800 sticky top-0 z-40 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-amber-400 p-1.5 rounded-lg">
              <Calendar className="w-7 h-7 text-black" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-black tracking-tighter text-white">혁신 수익화 캘린더 <span className="text-amber-400">AI</span></h1>
              <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest leading-none">Powered by 2026 roadmap</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 md:gap-4">
            <button
              onClick={() => setIsApiCostModalOpen(true)}
              className="hidden lg:flex items-center gap-2 px-4 py-2 rounded-full border border-zinc-700 hover:border-amber-400 hover:text-amber-400 transition-all text-sm font-bold bg-zinc-900/50"
            >
              <Info className="w-4 h-4 text-amber-400" />
              <span>API 비용</span>
            </button>

            <button
              onClick={() => setIsPatchNotesOpen(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-full border border-zinc-700 hover:border-amber-400 hover:text-amber-400 transition-all text-sm font-bold bg-zinc-900/50"
            >
              <FileText className="w-4 h-4" />
              <span className="hidden sm:inline">패치노트</span>
            </button>

            <button
              onClick={() => setIsHowToUseOpen(true)}
              className="hidden md:flex items-center gap-2 px-4 py-2 rounded-full border border-zinc-700 hover:border-amber-400 hover:text-amber-400 transition-all text-sm font-bold"
            >
              <HelpCircle className="w-4 h-4" />
              <span>사용방법</span>
            </button>

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
              onClick={() => setIsAuthModalOpen(true)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-all text-sm font-bold ${isAuthenticated ? 'bg-emerald-500/10 border-emerald-500 text-emerald-500' : 'bg-zinc-800 border-zinc-700 hover:border-amber-400'}`}
            >
              <CheckCircle className={`w-4 h-4 ${isAuthenticated ? 'text-emerald-500' : 'text-zinc-500'}`} />
              <span className="hidden sm:inline">{isAuthenticated ? '인증됨' : '코드 인증'}</span>
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

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-20">
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
                className={`w-full group relative overflow-hidden py-6 ${isAuthenticated ? 'bg-amber-400 hover:bg-amber-300' : 'bg-zinc-800 cursor-not-allowed opacity-50'} text-black font-black text-2xl rounded-3xl transition-all shadow-[0_10px_40px_-10px_rgba(251,191,36,0.5)] active:scale-[0.98]`}
              >
                <div className="absolute top-0 left-[-100%] w-full h-full bg-gradient-to-r from-transparent via-white/40 to-transparent group-hover:left-[100%] transition-all duration-700 ease-in-out" />
                <div className="flex items-center justify-center gap-4">
                  {loading ? (
                    <>
                      <Loader2 className="w-8 h-8 animate-spin" />
                      <span>로드맵 설계 중...</span>
                    </>
                  ) : !isAuthenticated ? (
                    <>
                      <CheckCircle className="w-7 h-7 text-zinc-600" />
                      <span>코드 인증 후 사용 가능</span>
                    </>
                  ) : (
                    <>
                      <span>혁신 90일 로드맵 생성</span>
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

        {/* Output Section */}
        {output && (
          <div className="bg-zinc-900 rounded-[2.5rem] border border-zinc-800 p-8 md:p-12 shadow-2xl relative overflow-hidden animate-in fade-in slide-in-from-bottom-12 duration-700">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-600 via-amber-400 to-red-600"></div>
            
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12 border-b border-zinc-800 pb-8">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-red-600/10 text-red-500 text-[10px] font-black tracking-widest rounded-full mb-3 border border-red-500/20">
                  <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-ping"></div>
                  EXCLUSIVE OUTPUT
                </div>
                <h3 className="text-3xl md:text-4xl font-black text-white tracking-tighter">90일 수익화 마스터플랜</h3>
              </div>
              <button
                onClick={handleFilesDownload}
                className="flex items-center justify-center gap-3 px-8 py-4 bg-white hover:bg-zinc-200 text-black rounded-2xl transition-all text-base font-black shadow-xl active:scale-95"
              >
                <Download className="w-5 h-5" />
                <span>DOCX + MD 다운로드</span>
              </button>
            </div>
            
            <div className="prose prose-invert prose-amber max-w-none">
              <div 
                className="whitespace-pre-wrap font-sans text-lg leading-[1.8] text-zinc-300 bg-zinc-950 p-10 rounded-[2rem] border border-zinc-800 shadow-inner"
                dangerouslySetInnerHTML={{ __html: output }}
              />
            </div>

            <div className="mt-12 flex justify-center">
               <div className="text-center">
                 <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest mb-2">Designed for your success</p>
                 <div className="w-16 h-0.5 bg-zinc-800 mx-auto"></div>
               </div>
            </div>
          </div>
        )}
      </main>

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

      {/* Auth Modal */}
      {isAuthModalOpen && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-[120] p-4">
          <div className="bg-zinc-900 rounded-[2.5rem] p-10 w-full max-w-md shadow-2xl border border-zinc-800 relative overflow-hidden text-center">
            <div className="absolute top-0 left-0 w-full h-1 bg-amber-400"></div>
            <div className="bg-amber-400 w-16 h-16 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-8 h-8 text-black" />
            </div>
            <h3 className="text-2xl font-black text-white italic mb-2 tracking-tighter uppercase">Code Authentication</h3>
            <p className="text-zinc-500 text-sm mb-8 font-medium">
              이 앱의 기능을 사용하려면 인증 코드를 입력해야 합니다.
            </p>
            
            <input
              type="text"
              value={authCode}
              onChange={(e) => setAuthCode(e.target.value)}
              placeholder="인증 코드를 입력하세요"
              className="w-full bg-zinc-950 border-2 border-zinc-800 rounded-2xl py-4 px-6 text-center text-xl font-black tracking-[0.5em] focus:border-amber-400 outline-none text-white transition-all mb-6"
            />
            
            <div className="flex flex-col gap-3">
              <button
                onClick={handleAuthenticate}
                className="w-full py-4 bg-amber-400 hover:bg-amber-300 text-black font-black rounded-2xl transition-all shadow-lg active:scale-95"
              >
                인증하기
              </button>
              <button
                onClick={() => setIsAuthModalOpen(false)}
                className="w-full py-2 text-zinc-600 hover:text-zinc-400 transition-colors text-xs font-bold uppercase tracking-widest"
              >
                나중에 하기
              </button>
            </div>
          </div>
        </div>
      )}

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
                type="password"
                value={tempApiKey}
                onChange={(e) => setTempApiKey(e.target.value)}
                placeholder="AIzaSy..."
                className="w-full bg-zinc-800 border-2 border-zinc-700 rounded-2xl py-4 pl-12 pr-6 text-sm focus:border-amber-400 outline-none text-white transition-all font-mono"
              />
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

      {/* API Cost Modal */}
      {isApiCostModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[100] p-4">
          <div className="bg-zinc-900 rounded-[2.5rem] p-8 md:p-12 w-full max-w-md shadow-2xl border border-zinc-800 relative overflow-hidden text-center">
            <div className="absolute top-0 left-0 w-full h-1 bg-amber-400"></div>
            <div className="bg-amber-400 w-16 h-16 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-amber-400/20">
              <Info className="w-8 h-8 text-black" />
            </div>
            <h3 className="text-2xl font-black text-white italic mb-4">ESTIMATED API COST</h3>
            
            <div className="bg-zinc-950 p-6 rounded-3xl border border-zinc-800 mb-6">
              <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest mb-1">Price Range (KRW)</p>
              <p className="text-3xl font-black text-amber-400">₩140 ~ ₩450</p>
              <p className="text-zinc-600 text-[10px] font-bold mt-2 uppercase tracking-wide">Average: ₩250 per generation</p>
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
              <div className="border-l-2 border-amber-400 pl-6 relative">
                 <div className="absolute -left-[9px] top-0 w-4 h-4 bg-amber-400 rounded-full border-4 border-zinc-900"></div>
                 <div className="flex items-center gap-3 mb-2">
                    <span className="text-xs font-black bg-amber-400 text-black px-2 py-0.5 rounded">NEW</span>
                    <span className="text-amber-400 font-bold">v1.6.0</span>
                    <span className="text-zinc-500 text-xs font-medium">2026.04.19</span>
                 </div>
                 <h4 className="text-white font-black text-lg mb-2">시스템 고도화 및 패치노트 도입</h4>
                 <ul className="text-zinc-400 text-sm space-y-2 list-disc list-inside">
                    <li>실시간 업데이트 확인을 위한 패치노트 시스템 도입</li>
                    <li>예상 API 운영 비용 안내 (KRW 표시)</li>
                    <li>기능별 비용 가이드 및 편차 안내 팝업 추가</li>
                 </ul>
              </div>

              <div className="border-l-2 border-zinc-800 pl-6 relative">
                 <div className="absolute -left-[9px] top-0 w-4 h-4 bg-zinc-800 rounded-full border-4 border-zinc-900"></div>
                 <div className="flex items-center gap-2 mb-2">
                    <span className="text-zinc-500 font-bold">v1.5.0</span>
                    <span className="text-zinc-600 text-xs font-medium">2026.04.19</span>
                 </div>
                 <h4 className="text-white font-black text-lg mb-2">지원 채널 통합</h4>
                 <ul className="text-zinc-400 text-sm space-y-2 list-disc list-inside">
                    <li>혁신 AI 공식 웹사이트(hyeoksinai.com) 바로가기 추가</li>
                    <li>오류 및 유지보수 이메일(info@nextin.ai.kr) 원클릭 지원창 추가</li>
                 </ul>
              </div>

              <div className="border-l-2 border-zinc-800 pl-6 relative">
                 <div className="absolute -left-[9px] top-0 w-4 h-4 bg-zinc-800 rounded-full border-4 border-zinc-900"></div>
                 <div className="flex items-center gap-2 mb-2">
                    <span className="text-zinc-500 font-bold">v1.4.0</span>
                    <span className="text-zinc-600 text-xs font-medium">2026.04.18</span>
                 </div>
                 <h4 className="text-white font-black text-lg mb-2">디자인 엔진 및 DOCX 모듈 강화</h4>
                 <ul className="text-zinc-400 text-sm space-y-2 list-disc list-inside">
                    <li>블랙/골드/레드 프리미엄 테마 적용</li>
                    <li>사용방법(How-to) 가이드 시스템 도입</li>
                    <li>DOCX 다운로드 시 강조 색상 매핑 동기화</li>
                    <li>첨부 파일명 기반 동적 파일명 생성 기능</li>
                 </ul>
              </div>

              <div className="border-l-2 border-zinc-800 pl-6 relative">
                 <div className="absolute -left-[9px] top-0 w-4 h-4 bg-zinc-800 rounded-full border-4 border-zinc-900"></div>
                 <div className="flex items-center gap-2 mb-2">
                    <span className="text-zinc-500 font-bold">v1.3.0</span>
                    <span className="text-zinc-600 text-xs font-medium">2026.04.18</span>
                 </div>
                 <h4 className="text-white font-black text-lg mb-2">진행 과정 시각화</h4>
                 <ul className="text-zinc-400 text-sm space-y-2 list-disc list-inside">
                    <li>90일 로드맵 생성률 % 트래킹 바 도입</li>
                    <li>공유 시 메타데이터(혁신 수익화 캘린더 AI) 최적화</li>
                 </ul>
              </div>

              <div className="border-l-2 border-zinc-800 pl-6 relative">
                 <div className="absolute -left-[9px] top-0 w-4 h-4 bg-zinc-800 rounded-full border-4 border-zinc-900"></div>
                 <div className="flex items-center gap-2 mb-2">
                    <span className="text-zinc-500 font-bold">v1.0.0</span>
                    <span className="text-zinc-600 text-xs font-medium">2026.04.18</span>
                 </div>
                 <h4 className="text-white font-black text-lg mb-2">최초 릴리즈</h4>
                 <ul className="text-zinc-400 text-sm space-y-2 list-disc list-inside">
                    <li>Gemini AI 기반 90일 수익화 로드맵 엔진 개발</li>
                    <li>문서 분석 기술(Mammoth) 통합</li>
                 </ul>
              </div>
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
                  <h4 className="text-xl font-bold text-white mb-2 italic">로드맵 생성 및 커스터마이징</h4>
                  <p className="text-zinc-400 text-sm leading-relaxed">
                    <span className="font-bold text-white">"혁신 90일 로드맵 생성"</span> 버튼을 클릭하면 AI가 실시간으로 3개월 치 수익화 플랜을 설계합니다. 중요한 내용은 직관적인 색상(파랑, 빨강, 노랑 배경)으로 표시됩니다.
                  </p>
                </div>
              </div>

              <div className="flex gap-6">
                <div className="w-12 h-12 rounded-2xl bg-zinc-800 flex items-center justify-center text-amber-400 text-2xl font-black flex-shrink-0 border border-zinc-700">4</div>
                <div>
                  <h4 className="text-xl font-bold text-white mb-2 italic">결과물 보관 (DOCX)</h4>
                  <p className="text-zinc-400 text-sm leading-relaxed">
                    생성된 로드맵 하단의 <span className="text-white font-bold underline">DOCX 다운로드</span> 버튼을 통해 워드 문서 형식으로 소장할 수 있습니다. UI에 표시된 강조 색상들이 문서에도 동일하게 반영됩니다.
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
