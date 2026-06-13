import React from 'react';
import { X, HelpCircle } from 'lucide-react';

interface FaqModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function FaqModal({ isOpen, onClose }: FaqModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-zinc-950 border border-zinc-800 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl relative animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-400/10 rounded-xl">
              <HelpCircle className="w-6 h-6 text-amber-400" />
            </div>
            <h2 className="text-xl font-black text-white">FAQ</h2>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-zinc-800 rounded-full transition-colors text-zinc-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="space-y-2">
            <h3 className="text-white font-bold text-lg">Q. 혁신 수익화 캘린더 AI는 어떻게 사용하나요?</h3>
            <p className="text-zinc-400 text-sm leading-relaxed">
              A. 혁신 수익화 캘린더 AI는 <strong className="text-amber-400 font-bold">회원가입(일반/구글) 후 사용</strong>할 수 있습니다.
            </p>
          </div>
          
          <div className="space-y-2">
            <h3 className="text-white font-bold text-lg">Q. 생성된 캘린더는 어떻게 관리하나요?</h3>
            <p className="text-zinc-400 text-sm leading-relaxed">
              A. <strong>마이페이지</strong>에서 90일 수익화 캘린더 현황을 체크하여 관리할 수 있습니다.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
