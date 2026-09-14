import React, { useEffect } from 'react';
import { X, Film, Sparkles } from 'lucide-react';
import { MediaItem } from '../types';
import { MovieCard } from './MovieCard';

interface ViewAllModalProps {
  isOpen: boolean;
  onClose: () => void;
  titleFa: string;
  titleEn: string;
  items: MediaItem[];
  onSelectMedia: (item: MediaItem) => void;
}

export const ViewAllModal: React.FC<ViewAllModalProps> = ({
  isOpen,
  onClose,
  titleFa,
  titleEn,
  items,
  onSelectMedia,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-xl animate-fade-in font-persian"
      dir="rtl"
    >
      {/* Backdrop */}
      <div className="fixed inset-0" onClick={onClose} />

      {/* Modal Surface */}
      <div
        className="relative w-full max-w-6xl max-h-[90vh] bg-[#07080e]/95 border border-zinc-800 rounded-3xl shadow-2xl overflow-hidden z-10 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800/80 bg-zinc-900/60 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <Film className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg sm:text-xl font-black text-white">{titleFa}</h3>
                <span className="text-xs font-mono text-zinc-400 font-normal">({titleEn})</span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                نمایش تمام عناوین منتخب این مجموعه ({items.length} اثر)
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 hover:text-white border border-zinc-700/60 flex items-center justify-center transition-all cursor-pointer"
            title="بستن (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Content Grid with Spacious Layout */}
        <div className="overflow-y-auto p-4 sm:p-6 flex-1 custom-scrollbar">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6 justify-items-center">
            {items.map((item, idx) => (
              <div key={`viewall-${item.id}-${idx}`} className="w-full flex justify-center">
                <MovieCard
                  item={item}
                  onSelect={(selected) => {
                    onClose();
                    onSelectMedia(selected);
                  }}
                  index={idx}
                  sliderKey="viewall"
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
