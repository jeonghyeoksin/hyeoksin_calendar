import React, { useState, useEffect } from 'react';
import { GoogleGenAI } from '@google/genai';
import mammoth from 'mammoth';
import { Document, Packer, Paragraph, TextRun } from 'docx';
import { saveAs } from 'file-saver';
import { Key, X, Upload, FileText, Download, Loader2, Calendar, Trash2 } from 'lucide-react';

export default function App() {
  const [apiKey, setApiKey] = useState('');
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);
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
  }, []);

  const handleSaveApiKey = () => {
    localStorage.setItem('geminiApiKey', tempApiKey);
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
    const keyToUse = apiKey || process.env.GEMINI_API_KEY;
    if (!keyToUse) {
      setError('API Key가 필요합니다. 우측 상단에서 설정해주세요.');
      return;
    }

    if (!inputText.trim() && files.length === 0) {
      setError('목표를 입력하거나 참고 문서를 첨부해주세요.');
      return;
    }

    setLoading(true);
    setError('');
    setOutput('');
    setProgress(0);

    try {
      const ai = new GoogleGenAI({ apiKey: keyToUse });
      const parsedFilesText = await parseFiles(files);
      
      const prompt = `사용자 목표: ${inputText}\n\n참고 문서 내용:\n${parsedFilesText}\n\n위 내용을 바탕으로 2026년 수익화를 위한 90일(3개월) 로드맵을 작성해주세요.`;

      const responseStream = await ai.models.generateContentStream({
        model: 'gemini-3.1-pro-preview',
        contents: prompt,
        config: {
          systemInstruction: "당신은 AI를 활용한 수익화 전략 전문가입니다. 사용자의 목표와 첨부된 참고 자료를 바탕으로 2026년 수익화를 위한 90일(3개월) 로드맵을 작성해야 합니다.\n\n중요 규칙:\n1. 1일부터 90일까지 하루도 빠짐없이 90일치 계획을 모두 작성하세요. (예: '1일차:', '2일차:' 형식 사용)\n2. 마크다운 문법(*, #, - 등)을 절대 사용하지 마세요.\n3. 가독성을 위해 두 문단마다 반드시 한 줄의 빈 줄(띄어쓰기)을 추가하세요.\n4. 내용 중 강조해야 할 핵심 키워드, 중요한 일정, 주의사항 등에는 반드시 HTML 태그를 사용하여 파란색 글씨(<span style=\"color: #2563eb; font-weight: bold;\">...</span>), 빨간색 글씨(<span style=\"color: #dc2626; font-weight: bold;\">...</span>), 노란색 배경(<span style=\"background-color: #fef08a; padding: 0 4px; border-radius: 4px;\">...</span>)을 입혀서 시각적으로 돋보이게 작성하세요.\n5. 각 일차별로 구체적이고 실천 가능한 행동 계획을 제시하세요.",
        }
      });

      let currentText = '';
      for await (const chunk of responseStream) {
        currentText += chunk.text;
        setOutput(currentText);
        
        // 텍스트에서 'X일차' 또는 'X일 차'를 찾아 진행률 계산 (90일 기준)
        const matches = [...currentText.matchAll(/(\d+)\s*일\s*차?/g)];
        if (matches.length > 0) {
          const lastMatch = matches[matches.length - 1];
          const day = parseInt(lastMatch[1], 10);
          if (day > 0 && day <= 90) {
            setProgress(Math.round((day / 90) * 100));
          }
        } else if (currentText.length > 50 && progress === 0) {
          setProgress(2); // 초기 진행률 표시
        }
      }
      setProgress(100);
    } catch (err: any) {
      console.error(err);
      setError(err.message || '계획 생성 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const downloadDocx = () => {
    if (!output) return;

    const cleanOutput = output.replace(/<[^>]*>?/gm, '');
    const paragraphs = cleanOutput.split('\n').map(line => new Paragraph({
      children: [new TextRun(line)],
      spacing: { after: 120 }
    }));

    const doc = new Document({
      sections: [{
        properties: {},
        children: paragraphs
      }]
    });

    Packer.toBlob(doc).then(blob => {
      saveAs(blob, "혁신_수익화_캘린더_90일.docx");
    });
  };

  const hasKey = !!(apiKey || process.env.GEMINI_API_KEY);

  return (
    <div className="min-h-screen bg-neutral-50 font-sans text-neutral-900">
      {/* Header */}
      <header className="bg-white border-b border-neutral-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-6 h-6 text-indigo-600" />
            <h1 className="text-xl font-bold tracking-tight">혁신 수익화 캘린더 AI</h1>
          </div>
          
          <button
            onClick={() => {
              setTempApiKey(apiKey);
              setIsApiKeyModalOpen(true);
            }}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-neutral-200 hover:bg-neutral-50 transition-colors text-sm font-medium"
          >
            <Key className="w-4 h-4 text-neutral-500" />
            <span>API Key</span>
            <div className={`w-2.5 h-2.5 rounded-full ${hasKey ? 'bg-emerald-500' : 'bg-red-500'}`} />
          </button>
        </div>
      </header>

      {/* Hero Image */}
      <div className="relative w-full aspect-video max-h-[400px] bg-neutral-900 overflow-hidden">
        <img 
          src="https://images.unsplash.com/photo-1506784983877-45594efa4cbe?q=80&w=2068&auto=format&fit=crop" 
          alt="Calendar and Planning" 
          className="w-full h-full object-cover opacity-60"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-white tracking-tight drop-shadow-lg mb-4">
            혁신 수익화 캘린더 AI
          </h2>
          <p className="text-lg md:text-xl text-neutral-200 max-w-2xl drop-shadow-md">
            AI를 활용한 2026년 수익화 로드맵을 90일 캘린더로 완성하세요.
          </p>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 p-6 md:p-8 mb-8">
          <h3 className="text-lg font-semibold mb-4">수익화 목표 및 참고 자료 입력</h3>
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                2026년 수익화 목표 (선택사항)
              </label>
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="예: AI 기반 SaaS 서비스를 런칭하여 월 수익 1000만원 달성하기..."
                className="w-full h-32 px-4 py-3 rounded-xl border border-neutral-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                참고 문서 첨부 (MD, DOCX)
              </label>
              <p className="text-xs text-indigo-600 mb-3 font-medium">
                첨부 권장 파일 : 혁신 수익화 발굴 MD파일, 혁신 트렌드 AI MD 파일 첨부 권장
              </p>
              <div className="flex items-center gap-4">
                <label className="flex items-center justify-center px-4 py-2 border border-neutral-300 rounded-lg cursor-pointer hover:bg-neutral-50 transition-colors">
                  <Upload className="w-4 h-4 mr-2 text-neutral-500" />
                  <span className="text-sm font-medium">파일 선택</span>
                  <input
                    type="file"
                    multiple
                    accept=".md,.docx,.txt"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
                <span className="text-sm text-neutral-500">
                  {files.length > 0 ? `${files.length}개의 파일 선택됨` : '선택된 파일 없음'}
                </span>
              </div>
              
              {files.length > 0 && (
                <ul className="mt-4 space-y-2">
                  {files.map((file, index) => (
                    <li key={index} className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg border border-neutral-200">
                      <div className="flex items-center gap-3 overflow-hidden">
                        <FileText className="w-5 h-5 text-indigo-500 flex-shrink-0" />
                        <span className="text-sm truncate">{file.name}</span>
                      </div>
                      <button 
                        onClick={() => removeFile(index)}
                        className="p-1 text-neutral-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {error && (
              <div className="p-4 bg-red-50 text-red-700 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div className="space-y-3">
              <button
                onClick={generatePlan}
                disabled={loading}
                className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition-colors disabled:opacity-70 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>90일 로드맵 생성 중... {progress > 0 ? `(${progress}%)` : ''}</span>
                  </>
                ) : (
                  <span>캘린더 생성하기</span>
                )}
              </button>

              {loading && (
                <div className="w-full bg-neutral-100 rounded-full h-2.5 overflow-hidden border border-neutral-200">
                  <div 
                    className="bg-indigo-600 h-full rounded-full transition-all duration-300 ease-out" 
                    style={{ width: `${Math.max(progress, 2)}%` }}
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Output Section */}
        {output && (
          <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 p-6 md:p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold">90일 수익화 로드맵</h3>
              <button
                onClick={downloadDocx}
                className="flex items-center gap-2 px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg transition-colors text-sm font-medium"
              >
                <Download className="w-4 h-4" />
                <span>DOCX 다운로드</span>
              </button>
            </div>
            
            <div className="prose prose-neutral max-w-none">
              <div 
                className="whitespace-pre-wrap font-sans text-base leading-relaxed text-neutral-800 bg-neutral-50 p-6 rounded-xl border border-neutral-200"
                dangerouslySetInnerHTML={{ __html: output }}
              />
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-neutral-200 py-8 mt-12">
        <div className="max-w-7xl mx-auto px-4 text-center text-neutral-500 text-sm">
          <p>개발자: 정혁신</p>
          <p className="mt-1">© 2026 혁신 수익화 캘린더 AI. All rights reserved.</p>
        </div>
      </footer>

      {/* API Key Modal */}
      {isApiKeyModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">Google API Key 설정</h3>
              <button onClick={() => setIsApiKeyModalOpen(false)} className="text-neutral-400 hover:text-neutral-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-neutral-600 mb-4">
              웹 배포 환경에서도 사용할 수 있도록 직접 발급받은 Gemini API Key를 입력해주세요.
            </p>
            <input
              type="password"
              value={tempApiKey}
              onChange={(e) => setTempApiKey(e.target.value)}
              placeholder="AIzaSy..."
              className="w-full px-4 py-2 border border-neutral-300 rounded-lg mb-4 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setIsApiKeyModalOpen(false)}
                className="px-4 py-2 text-neutral-600 hover:bg-neutral-100 rounded-lg transition-colors text-sm font-medium"
              >
                취소
              </button>
              <button
                onClick={handleSaveApiKey}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors text-sm font-medium"
              >
                저장
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
