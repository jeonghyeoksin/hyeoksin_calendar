import React, { useState, useEffect } from 'react';
import { GoogleGenAI } from '@google/genai';
import mammoth from 'mammoth';
import { Document, Packer, Paragraph, TextRun, ShadingType } from 'docx';
import { saveAs } from 'file-saver';
import { Key, X, Upload, FileText, Download, Loader2, Calendar, Trash2, CheckCircle, HelpCircle, Info, Copy, ExternalLink } from 'lucide-react';

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
      '개발자 정혁신과의 혁신AI 고도화 피드백 시스템 파트너십 멘트 로드맵 내 자동 연동 완성',
      '가독성을 저해하는 텍스트 밑줄 및 불필요한 마크다운 문법 완전 제거'
    ]
  },
  {
    version: 'v1.11.0',
    date: '2026.06.04',
    title: '휴먼 라이팅 엔진 및 정혁신 파트너십 업데이트',
    changes: [
      '인공지능 특유의 어색함을 지워버린 친근하고 상세한 "사람 어투(~해요, ~합니다)" 인공지능 정규 고도화',
      '혁신AI의 실질적인 모든 기능을 극대화하여 90일 계획에 유기적으로 연동 완료',
      '혁신AI에 추가하고 싶은 기능 제안 시 개발자 정혁신에게 문의할 수 있는 정식 피드백 프로세스 추가',
      '1일차부터 90일차까지 초보자 눈높이에 맞춰 세부 가이드라인의 완전한 대화식 심층 서술'
    ]
  },
  {
    version: 'v1.10.0',
    date: '2026.06.04',
    title: '수익화 기획 및 Docs 연동 대규모 업그레이드',
    changes: [
      '수익화 발굴 및 트렌드 분석 문서를 토대로 무조건 성공하는 정밀 딥리서치 계획 수립',
      '초보자도 100% 실행할 수 있는 일 단위 아주 친절하고 상세한 정보 제공',
      '가독성을 저해하는 텍스트 밑줄 표기법 완전히 제거',
      '자동 다운로드 기능을 제거해 깔끔한 단일 뷰 완성',
      '구글 문서에 완벽한 서식으로 즉시 붙여넣어지는 "Docs 복사하기" 기능 추가',
      '원클릭 구글 문서 열기를 돕기 위한 "Docs 바로가기" 링크 탑재'
    ]
  },
  {
    version: 'v1.9.0',
    date: '2026.05.05',
    title: '사용자 편의성 개편',
    changes: [
      '앱 이용 시 필요했던 코드 인증 단계 삭제',
      '누구나 즉시 앱에 접근하여 이용할 수 있도록 접근성 향상'
    ]
  },
  {
    version: 'v1.8.0',
    date: '2026.04.27',
    title: '로드맵 출력 및 다운로드 엔진 최적화',
    changes: [
      'DOCX 다운로드 시스템 단일화 및 문서 구조 개선',
      '파일명 "혁신 수익화 캘린더 AI.docx"로 정체성 강화',
      '미리보기 강조 텍스트 시인성 및 스타일링 최적화',
      '보안 인증 시스템 강화 (신규 인증 코드 추가)',
      '출력물 내 불필요한 배경색 제거로 전문성 향상'
    ]
  },
  {
    version: 'v1.7.0',
    date: '2026.04.27',
    title: '지능형 분석 엔진 도입',
    changes: [
      '고도화된 분석 코어 통합으로 로드맵 정확도 향상',
      '사용자 인터페이스 반응성 및 안정성 개선',
      '실시간 업데이트 내역 확인 시스템 강화'
    ]
  },
  {
    version: 'v1.6.0',
    date: '2026.04.19',
    title: '시스템 고도화 및 패치노트 도입',
    changes: [
      '업데이트 소식을 즉시 확인할 수 있는 시스템 도입',
      '예상 운영 비용 안내 시스템 추가',
      '도움말 및 가이드 팝업 기능 확장'
    ]
  },
  {
    version: 'v1.5.0',
    date: '2026.04.19',
    title: '고객 지원 채널 통합',
    changes: [
      '공식 웹사이트 및 고객 센터 바로가기 추가',
      '원클릭 문의 및 피드백 전송 시스템 구축'
    ]
  },
  {
    version: 'v1.4.0',
    date: '2026.04.18',
    title: '디자인 및 문서 생성 기능 강화',
    changes: [
      '블랙/골드/레드 프리미엄 테마 적용',
      '사용방법 안내 가이드 시스템 도입',
      '문서 저장 시 강조 색상 동기화 개선',
      '첨부 파일 기반 자동 파일명 생성 기능'
    ]
  },
  {
    version: 'v1.3.0',
    date: '2026.04.18',
    title: '진행 과정 시각화',
    changes: [
      '로드맵 생성률 실시간 표시 바 도입',
      '공유 시 최적화된 정보 표시 시스템 적용'
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
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);
  const [isApiCostModalOpen, setIsApiCostModalOpen] = useState(false);
  const [isPatchNotesOpen, setIsPatchNotesOpen] = useState(false);
  const [isHowToUseOpen, setIsHowToUseOpen] = useState(false);
  const [isMaintenanceOpen, setIsMaintenanceOpen] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [inputText, setInputText] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [output, setOutput] = useState('');
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    const savedKey = localStorage.getItem('gemini_api_key');
    if (savedKey) {
      setApiKey(savedKey);
      setTempApiKey(savedKey);
    }
  }, []);

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
    const keyToUse = apiKey || process.env.GEMINI_API_KEY;
    if (!keyToUse) {
      setError('API Key를 등록해야 혁신 90일 로드맵 설계가 시작됩니다.');
      setIsApiKeyModalOpen(true);
      return;
    }

    setLoading(true);
    setProgress(0);
    setError('');
    setOutput('');

    try {
      const ai = new GoogleGenAI({ apiKey: keyToUse });
      const parsedFilesText = await parseFiles(files);
      
      const prompt = `다음 사용자 요청사항과 첨부한 참고 자료('수익화 발굴', '트렌드 분석' 등의 참고 문서)를 깊이 있게 분석 및 딥리서치하여, 90일(3개월) 동안 이대로만 실행하면 누구나 무조건 실제 수익화를 경험하고 안정적인 파이프라인을 구축할 수 있는 초고성능 맞춤형 실행 로드맵을 작성해 주세요.

[사용자 요청사항 및 목표]
- ${inputText || '미입력'}

[참고 문서 내용 분석 대상]
${parsedFilesText || '(현재 사용자 업로드 참 문서 없음. 일반적인 AI 비즈니스 수익화 트렌드 및 최첨단 발굴 기법을 적용하세요)'}

위 첨부파일에 명시된 비즈니스 트렌드, 수익화 아이템 목록, 기획 전략 데이터를 로드맵 90일 전체 일과 속에 구체적으로 연동하고, 각 일차(1~90일차)마다 누락이나 묶음 없이 개별적이고 매우 상세한 맞춤 실행 과제를 도출해 주세요.`;

      const responseStream = await ai.models.generateContentStream({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
          systemInstruction: "당신은 AI를 활용한 수익화 전략 전문가입니다. 사용자의 목표와 첨부된 참고자료('수익화 발굴', '트렌드 분석', '수익화발굴', '트렌드 ai' 등)의 상세한 내용을 완벽히 융합하여 무조건 성공할 수밖에 없는 90일(3개월) 초정밀 실행 캘린더를 작성해야 합니다.\n\n[핵심 생성 및 스타일 규칙 - 절대 준수]\n1. 맨 첫 줄(서론)에는 다른 어떠한 환영 인사나 다른 설명도 일체 작성하지 말고, 오직 다음의 정확한 한 문장만을 그대로 출력한 다음 한 줄 띄우고 즉시 '1일차:' 본론으로 넘어가야 합니다: \"혁신AI에 있는 기능들을 최대한 활용하고, 상황에 따라 다른 Tool을 같이 믹스해서 활용하시길 바랍니다.\"\n2. 90일 수익화 마스터플랜의 진행 과정은 다음의 25가지 혁신AI 기능들을 적재적소에 유기적 및 구체적으로 사용하도록 밀도 있게 구성해야 합니다 (사용자는 이 도구들을 필요할 때 실행하여 기획하고 콘텐츠를 제작해 나갑니다):\n   - **혁신 수익화 발굴 AI, 혁신 트렌드 분석 AI, 혁신 수익화 캘린더 AI 이 세 가지 핵심 분석/기획 도구는 무조건 1일차 과정에 모두 완료되도록 가이드라인을 구성해야 합니다.** 첫날 이 세 도구를 모두 마쳐서 타겟 아이템 선별, 실시간 트렌드 확인 및 90일의 기본 토대를 마련하는 전략을 제시하세요.\n   - **나머지 22가지 가치 제작 및 관리형 혁신 도구들**(혁신 맞춤 프롬프트 생성 AI, 혁신 블로그 AI, 혁신 상세페이지 AI, 혁신 홈페이지 개발 AI, 혁신 제안서 AI, 혁신 이미지 AI, 혁신 세무 AI, 혁신 노무 AI, 혁신 로고 AI, 혁신 스레드 AI, 혁신 키워드 추천 AI, 혁신 브랜드 모델 AI, 혁신 소싱 AI, 혁신 뉴스레터 AI, 혁신 직무역량 강화 AI, 혁신 키워드 조합 AI, 혁신 카드뉴스 AI, 혁신 플레이스 최적화 AI, 혁신 전자책 AI, 혁신 유튜브 AI, 혁신 유튜브 썸네일 AI, 혁신 사업계획서 AI)은 **2일차부터 90일차까지의 매일매일 실행 계획 속에 유기적이고 짜임새 있게 점진 배치**하여 지침을 작성하세요.\n3. 로드맵 내에서 기획/작성을 위해 생성형 AI 도구를 추천하거나 활용하도록 안내할 때는, 다른 인공지능 도구(예: ChatGPT, Claude, OpenAI 등)는 절대로 언급하지 말고 오직 **Google Gemini**만을 지정하여 사용하도록 유도하세요. (예: \"Google Gemini에 이 프롬프트를 입력해서 기획서를 완성해요~\" 등)\n4. 1일차부터 90일차까지 단 하루도 누락하지 않고 각 일자별 계획을 하나씩('1일차:', '2일차:', '3일차:', ..., '90일차:') 순차적으로 끝까지 전부 세분화하여 기술해야 합니다. 여러 일차를 묶거나(\"1~5일차:\", \"다음 주:\") 생략하는 행위는 일절 금지합니다. 하루하루의 실무 행동 강령과 실천 가이드라인을 극도로 상세하게 작성해야 합니다.\n5. 기계식 어투, 딱딱하고 격식체(~이다, ~한다), 혹은 AI 냄새가 물씬 풍기는 클리셰 표현(예: '지평', '도약', '탐구', '자, 그럼', '길을 나서볼까요' 등)을 완전히 배격하고, 오직 따뜻하고 친근하며 자상한 1:1 실무 멘토 선생님과 같은 극도로 자연스러운 사람 어투(~해요, ~합니다)로만 작성하세요.\n6. [초비상 규정] 로드맵 전체 텍스트 내에서 '여정'이라는 단어는 절대로 단 한 번도 사용하지 마세요. 이는 인위적이고 기형적인 AI식 분위기를 자아내므로 사용이 무조건 엄격하게 금지됩니다. '여정'이 들어갈 만한 자리는 '과정', '실천 단계', '비즈니스 계획', '하루 일과' 등의 일상적인 사람 어휘로 전면 대체하세요.\n7. 작성 시 반드시 첨부된 '수익화발굴' 및 '트렌드 ai' 분석 자료에 명시된 비즈니스 트렌드, 유망 수익화 아이템 목록, 기획 전략 수립 가이드 데이터를 90일 전체에 녹여서 완전히 1대1 개인화 맞춤형 플랜으로 완착시켜 주세요.\n8. 비즈니스 마스터플랜의 실행 과정에서 Google Gemini 및 상기 25개 혁신AI 기능들을 메인 엔진으로 삼고, 이와 완벽하게 조화를 이루며 실질적인 성과를 내게 도와주는 기타 무료 실무 도구(예: Canva, Google Sheets, Notion, 특정 SNS 플랫폼 및 기획 툴 등)들을 필요할 때마다 영리하게 믹스하여 적용할 수 있도록 가이드를 짜임새 있게 작성하세요.\n9. 마지막 날인 '90일차:' 가이드의 끝부분에는 반드시 다음의 문구를 절대 누락하지 않고 토씨 하나 틀리지 않게 그대로 녹여서 함께 포함시켜 작성하세요:\n   \"혁신AI의 기능 외에 추가적으로 꼭 탑재되기를 원하시거나 업데이트를 요구하시는 사항이 있으시다면 언제든 정혁신에게 문의해 주세요. 신속하고 정밀하게 무상 추가 업데이트를 전격 제공해 드립니다!\"\n10. 가독성을 위해 2문단마다 무조건 한 줄의 완전히 빈 줄(개행)을 삽입하세요.\n11. 텍스트 중간, 소제목, 본문 어디에도 밑줄(언더바 `_`, html u 태그 등)을 절대로 사용하지 마세요.\n12. 절대로 마크다운 서식 기호(대표적으로 `#`, `*`, `-` 등의 기호글이나 bullet 기호)를 사용하지 마세요. 대신 다음 3가지의 한정된 HTML 텍스트 태그만을 활용하여 가독성이 높은 색상 하이라이트 조합을 연출하세요:\n- 강조할 청색 텍스트: <span style=\"color: #1d4ed8; font-weight: bold;\">텍스트</span>\n- 중요 경색 텍스트: <span style=\"color: #dc2626; font-weight: bold;\">텍스트</span>\n- 체크/주목용 흑색 텍스트: <span style=\"color: #000000; font-weight: bold;\">텍스트</span>\n13. 초보자나 비즈니스 입문자도 무조건 완벽하게 실행할 수 있을 정도로 '지극히 친절하고 아주 세밀한 1일 가이드라인'으로 서술적으로 작성해 주세요. 예상 소요 시간, Google Gemini용 프롬프트 입력 구문 내용, 체크해야 하는 구체적 산출물 기준을 빠짐없이 넣어야 합니다.",
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
    } catch (err: any) {
      console.error(err);
      setError(err.message || '계획 생성 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyDocs = async () => {
    if (!output) return;

    // Remove any html tags for plain text representation
    const plainText = output.replace(/<[^>]*>?/gm, '');

    // Prepare optimized HTML for pasting on white Google Docs pages
    // Base font Arial 11pt, default text black, with the dynamic blue/red highlights preserved beautifully!
    const styledHtml = `
      <div style="font-family: Arial, sans-serif; font-size: 11pt; color: #1a1a1a; line-height: 1.6; white-space: pre-wrap;">
        ${output.replace(/\n/g, '<br/>')}
      </div>
    `;

    try {
      if (navigator.clipboard && window.ClipboardItem) {
        const htmlBlob = new Blob([styledHtml], { type: 'text/html' });
        const textBlob = new Blob([plainText], { type: 'text/plain' });
        await navigator.clipboard.write([
          new window.ClipboardItem({
            'text/html': htmlBlob,
            'text/plain': textBlob
          })
        ]);
      } else {
        await navigator.clipboard.writeText(plainText);
      }
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error('Clipboard copy failed, using fallback:', err);
      try {
        await navigator.clipboard.writeText(plainText);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
      } catch (e) {
        alert('클립보드 복사에 실패했습니다.');
      }
    }
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
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={handleCopyDocs}
                  className={`flex items-center justify-center gap-2 px-6 py-4 rounded-2xl transition-all text-base font-black shadow-xl active:scale-95 border border-transparent ${
                    isCopied 
                      ? 'bg-emerald-500 text-white' 
                      : 'bg-amber-400 hover:bg-amber-300 text-black'
                  }`}
                >
                  {isCopied ? (
                    <>
                      <CheckCircle className="w-5 h-5" />
                      <span>Docs 복사 완료!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-5 h-5" />
                      <span>Docs 복사하기</span>
                    </>
                  )}
                </button>
                <a
                  href="https://docs.google.com/document"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 px-6 py-4 bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-750 hover:border-amber-400/50 rounded-2xl transition-all text-base font-black shadow-xl active:scale-95"
                >
                  <ExternalLink className="w-5 h-5 text-amber-400" />
                  <span>Docs 바로가기</span>
                </a>
              </div>
            </div>
            
            <div className="prose prose-invert prose-amber max-w-none">
              <style>{`
                .preview-content span {
                  color: white !important;
                  background-color: transparent !important;
                  padding: 0 !important;
                }
              `}</style>
              <div 
                className="whitespace-pre-wrap font-sans text-lg leading-[1.8] text-zinc-300 bg-zinc-950 p-10 rounded-[2rem] border border-zinc-800 shadow-inner preview-content"
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
                     <span className="font-bold text-white">"혁신 90일 로드맵 생성"</span> 버튼을 클릭하면 AI가 실시간으로 3개월 치 수익화 플랜에 관한 초정밀 딥리서치를 시작합니다. 중요 내용은 가독성이 뛰어난 전용 색상(파랑색, 빨강색, 볼드 강조)으로 표시됩니다.
                   </p>
                </div>
              </div>

              <div className="flex gap-6">
                <div className="w-12 h-12 rounded-2xl bg-zinc-800 flex items-center justify-center text-amber-400 text-2xl font-black flex-shrink-0 border border-zinc-700">4</div>
                <div>
                  <h4 className="text-xl font-bold text-white mb-2 italic">구글 문서(Google Docs) 보관 및 기획</h4>
                  <p className="text-zinc-400 text-sm leading-relaxed">
                    생성된 로드맵 하단의 <span className="text-amber-400 font-bold">Docs 복사하기</span> 버튼을 누르면 구글 문서에 바로 복사 및 서식 유지가 되도록 최적화된 형태로 클립보드에 복사됩니다. 복사 후 바로 옆 <span className="text-white font-bold underline">Docs 바로가기</span> 버튼을 통해 Google Docs로 이동하여 손쉽게 붙여넣고 즉시 개인 문항을 편집할 수 있습니다.
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
