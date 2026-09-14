import React, { useRef } from 'react';
import {
  Flame,
  Swords,
  Sparkles,
  Rocket,
  Smile,
  Ghost,
  Film,
  ShieldAlert,
  Compass,
  Eye,
  ChevronLeft,
  ChevronRight,
  X,
} from 'lucide-react';

export interface GenreItem {
  id: number;
  nameFa: string;
  nameEn: string;
  icon: React.ReactNode;
}

export const POPULAR_GENRES: GenreItem[] = [
  { id: 28, nameFa: 'اکشن', nameEn: 'Action', icon: <Swords className="w-3.5 h-3.5" /> },
  { id: 16, nameFa: 'انیمیشن و انیمه', nameEn: 'Animation', icon: <Sparkles className="w-3.5 h-3.5" /> },
  { id: 878, nameFa: 'علمی‌تخیلی', nameEn: 'Sci-Fi', icon: <Rocket className="w-3.5 h-3.5" /> },
  { id: 35, nameFa: 'کمدی', nameEn: 'Comedy', icon: <Smile className="w-3.5 h-3.5" /> },
  { id: 27, nameFa: 'ترسناک', nameEn: 'Horror', icon: <Ghost className="w-3.5 h-3.5" /> },
  { id: 18, nameFa: 'درام', nameEn: 'Drama', icon: <Film className="w-3.5 h-3.5" /> },
  { id: 80, nameFa: 'جنایی', nameEn: 'Crime', icon: <ShieldAlert className="w-3.5 h-3.5" /> },
  { id: 12, nameFa: 'ماجراجویی', nameEn: 'Adventure', icon: <Compass className="w-3.5 h-3.5" /> },
  { id: 9648, nameFa: 'معمایی', nameEn: 'Mystery', icon: <Eye className="w-3.5 h-3.5" /> },
  { id: 14, nameFa: 'فانتزی', nameEn: 'Fantasy', icon: <Flame className="w-3.5 h-3.5" /> },
];

interface GenreFilterBarProps {
  selectedGenreId: number | null;
  onSelectGenre: (genre: GenreItem | null) => void;
  isLoading?: boolean;
}

export const GenreFilterBar: React.FC<GenreFilterBarProps> = ({
  selectedGenreId,
  onSelectGenre,
  isLoading = false,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleScroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const amount = 240;
    scrollRef.current.scrollTo({
      left: direction === 'left' ? scrollRef.current.scrollLeft - amount : scrollRef.current.scrollLeft + amount,
      behavior: 'smooth',
    });
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-2 sm:py-3 relative z-20">
      <div className="flex items-center justify-between gap-3 mb-2 px-1">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.8)]" />
          <h3 className="text-xs sm:text-sm font-black text-zinc-200 font-persian">
            دسته‌بندی موضوعی و ژانرها (TMDB زنده)
          </h3>
        </div>

        {selectedGenreId && (
          <button
            onClick={() => onSelectGenre(null)}
            className="tv-focusable flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800/40 text-xs font-persian transition-colors shadow-sm"
          >
            <X className="w-3 h-3" />
            <span>حذف فیلتر و بازگشت</span>
          </button>
        )}
      </div>

      <div className="relative group">
        {/* Scroll Left Button */}
        <button
          onClick={() => handleScroll('left')}
          className="absolute -left-2 top-1/2 -translate-y-1/2 z-10 w-7 h-7 rounded-full bg-black/80 hover:bg-black text-white border border-white/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-md shadow-lg hidden sm:flex"
          title="پیمایش"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {/* Scrollable Pills List */}
        <div
          ref={scrollRef}
          className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1 px-1 scroll-smooth"
        >
          {/* All / Default Button */}
          <button
            id="genre-pill-all"
            data-tv-id="genre-all"
            tabIndex={0}
            onClick={() => onSelectGenre(null)}
            className={`tv-focusable shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border text-xs font-persian transition-all duration-200 ${
              selectedGenreId === null
                ? 'bg-white/15 text-white border-white/30 shadow-[0_0_15px_rgba(255,255,255,0.1)] font-bold'
                : 'bg-[#0b0c14]/70 hover:bg-[#131522] text-zinc-400 hover:text-zinc-200 border-white/10'
            }`}
          >
            <span>همه عناوین</span>
          </button>

          {POPULAR_GENRES.map((genre) => {
            const isSelected = selectedGenreId === genre.id;
            return (
              <button
                key={genre.id}
                id={`genre-pill-${genre.id}`}
                data-tv-id={`genre-${genre.id}`}
                tabIndex={0}
                onClick={() => onSelectGenre(isSelected ? null : genre)}
                className={`tv-focusable shrink-0 flex items-center gap-2 px-3.5 py-1.5 rounded-xl border text-xs font-persian transition-all duration-200 ${
                  isSelected
                    ? 'bg-indigo-600/90 hover:bg-indigo-500 text-white border-indigo-400 shadow-[0_0_20px_rgba(99,102,241,0.5)] font-bold scale-105'
                    : 'bg-[#0b0c14]/70 hover:bg-[#131522] text-zinc-300 hover:text-white border-white/10 hover:border-white/20'
                }`}
              >
                <span className={isSelected ? 'text-white' : 'text-indigo-400'}>
                  {genre.icon}
                </span>
                <span>{genre.nameFa}</span>
                <span className="text-[10px] text-zinc-500 font-sans opacity-75 hidden md:inline">
                  {genre.nameEn}
                </span>
              </button>
            );
          })}
        </div>

        {/* Scroll Right Button */}
        <button
          onClick={() => handleScroll('right')}
          className="absolute -right-2 top-1/2 -translate-y-1/2 z-10 w-7 h-7 rounded-full bg-black/80 hover:bg-black text-white border border-white/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-md shadow-lg hidden sm:flex"
          title="پیمایش"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
