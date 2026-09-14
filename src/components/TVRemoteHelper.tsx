import React from 'react';
import {
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Undo2,
  X,
  Tv,
} from 'lucide-react';

interface TVRemoteHelperProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (direction: 'up' | 'down' | 'left' | 'right') => void;
  onEnter: () => void;
  onBack: () => void;
  currentFocusId: string | null;
}

export const TVRemoteHelper: React.FC<TVRemoteHelperProps> = ({
  isOpen,
  onClose,
  onNavigate,
  onEnter,
  onBack,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed bottom-4 left-4 z-50 p-3 rounded-2xl bg-zinc-950/95 border border-zinc-800/90 shadow-[0_12px_40px_rgba(0,0,0,0.85)] ring-1 ring-white/10 backdrop-blur-xl w-44 sm:w-48 animate-in fade-in slide-in-from-bottom-3 duration-200">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-zinc-800/80 mb-2.5">
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-[#e50914] animate-pulse" />
          <span className="text-[11px] font-bold text-zinc-200 font-persian">ریموت مجازی TV</span>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-md text-zinc-400 hover:text-white hover:bg-zinc-800/80 transition-colors"
          title="بستن ریموت"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Compact D-Pad Controller */}
      <div className="flex flex-col items-center justify-center gap-1 my-1">
        {/* Up */}
        <button
          onClick={() => onNavigate('up')}
          className="w-8 h-8 rounded-lg bg-zinc-900 hover:bg-zinc-800 active:bg-red-600 text-zinc-300 hover:text-white flex items-center justify-center border border-zinc-800 transition-all shadow-sm active:scale-95"
          title="جهت بالا"
        >
          <ArrowUp className="w-4 h-4" />
        </button>

        {/* Middle Row (Left, OK, Right) */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => onNavigate('left')}
            className="w-8 h-8 rounded-lg bg-zinc-900 hover:bg-zinc-800 active:bg-red-600 text-zinc-300 hover:text-white flex items-center justify-center border border-zinc-800 transition-all shadow-sm active:scale-95"
            title="جهت چپ"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <button
            onClick={onEnter}
            className="w-11 h-8 rounded-lg bg-[#e50914] hover:bg-red-700 active:bg-red-800 text-white font-bold text-xs flex items-center justify-center transition-all shadow-md active:scale-95 shadow-red-950/50"
            title="تایید (OK)"
          >
            OK
          </button>

          <button
            onClick={() => onNavigate('right')}
            className="w-8 h-8 rounded-lg bg-zinc-900 hover:bg-zinc-800 active:bg-red-600 text-zinc-300 hover:text-white flex items-center justify-center border border-zinc-800 transition-all shadow-sm active:scale-95"
            title="جهت راست"
          >
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Down */}
        <button
          onClick={() => onNavigate('down')}
          className="w-8 h-8 rounded-lg bg-zinc-900 hover:bg-zinc-800 active:bg-red-600 text-zinc-300 hover:text-white flex items-center justify-center border border-zinc-800 transition-all shadow-sm active:scale-95"
          title="جهت پایین"
        >
          <ArrowDown className="w-4 h-4" />
        </button>
      </div>

      {/* Back Key */}
      <div className="mt-2.5 pt-2 border-t border-zinc-800/80">
        <button
          onClick={onBack}
          className="w-full py-1.5 px-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white text-[10px] font-persian flex items-center justify-center gap-1.5 transition-colors active:scale-95"
          title="بازگشت (Back)"
        >
          <Undo2 className="w-3 h-3 text-red-500" />
          <span>بازگشت (Back)</span>
        </button>
      </div>
    </div>
  );
};
