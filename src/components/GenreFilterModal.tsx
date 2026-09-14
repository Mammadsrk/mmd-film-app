import React, { useState, useEffect } from 'react';
import { SlidersHorizontal, X, Check, RotateCcw, Sparkles, Calendar, Film } from 'lucide-react';

export interface GenreDefinition {
  id: number;
  nameFa: string;
  nameEn: string;
  emoji: string;
}

export const AVAILABLE_GENRES: GenreDefinition[] = [
  { id: 28, nameFa: 'اکشن', nameEn: 'Action', emoji: '💥' },
  { id: 35, nameFa: 'کمدی', nameEn: 'Comedy', emoji: '😂' },
  { id: 16, nameFa: 'انیمیشن و انیمه', nameEn: 'Animation & Anime', emoji: '🎨' },
  { id: 878, nameFa: 'علمی‌تخیلی', nameEn: 'Sci-Fi', emoji: '🚀' },
  { id: 27, nameFa: 'ترسناک و وحشت', nameEn: 'Horror', emoji: '👻' },
  { id: 18, nameFa: 'درام', nameEn: 'Drama', emoji: '🎭' },
  { id: 80, nameFa: 'جنایی', nameEn: 'Crime', emoji: '🕵️' },
  { id: 9648, nameFa: 'معمایی', nameEn: 'Mystery', emoji: '🔍' },
  { id: 12, nameFa: 'ماجراجویی', nameEn: 'Adventure', emoji: '🗺️' },
  { id: 14, nameFa: 'فانتزی', nameEn: 'Fantasy', emoji: '🧙‍♂️' },
  { id: 53, nameFa: 'هیجان‌انگیز', nameEn: 'Thriller', emoji: '⚡' },
  { id: 10749, nameFa: 'عاشقانه', nameEn: 'Romance', emoji: '💖' },
  { id: 10751, nameFa: 'خانوادگی', nameEn: 'Family', emoji: '👨‍👩‍👧‍👦' },
  { id: 36, nameFa: 'تاریخی', nameEn: 'History', emoji: '🏛️' },
  { id: 10752, nameFa: 'جنگی', nameEn: 'War', emoji: '⚔️' },
  { id: 99, nameFa: 'مستند', nameEn: 'Documentary', emoji: '📽️' },
];

export const AVAILABLE_YEARS = [
  { label: '۲۰۲۴ (جدیدترین)', value: '2024' },
  { label: '۲۰۲۳', value: '2023' },
  { label: '۲۰۲۲', value: '2022' },
  { label: '۲۰۲۱', value: '2021' },
  { label: '۲۰۲۰', value: '2020' },
  { label: 'دهه ۲۰۱۰', value: '2019' },
  { label: 'آثار کلاسیک', value: 'classic' },
];

interface GenreFilterModalProps {
  isOpen: boolean;
  selectedGenreIds: number[];
  selectedYears?: string[];
  selectedType?: 'all' | 'movie' | 'tv';
  onClose: () => void;
  onApply: (selectedIds: number[], selectedYears: string[], selectedType: 'all' | 'movie' | 'tv') => void;
  onReset: () => void;
}

export const GenreFilterModal: React.FC<GenreFilterModalProps> = ({
  isOpen,
  selectedGenreIds,
  selectedYears = [],
  selectedType = 'all',
  onClose,
  onApply,
  onReset,
}) => {
  const [localSelectedIds, setLocalSelectedIds] = useState<number[]>(selectedGenreIds);
  const [localSelectedYears, setLocalSelectedYears] = useState<string[]>(selectedYears);
  const [localSelectedType, setLocalSelectedType] = useState<'all' | 'movie' | 'tv'>(selectedType);

  useEffect(() => {
    setLocalSelectedIds(selectedGenreIds);
    setLocalSelectedYears(selectedYears);
    setLocalSelectedType(selectedType);
  }, [selectedGenreIds, selectedYears, selectedType, isOpen]);

  // Handle escape key
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

  const toggleGenre = (id: number) => {
    setLocalSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const toggleYear = (year: string) => {
    setLocalSelectedYears((prev) =>
      prev.includes(year) ? prev.filter((y) => y !== year) : [...prev, year]
    );
  };

  const handleApply = () => {
    onApply(localSelectedIds, localSelectedYears, localSelectedType);
    onClose();
  };

  const handleReset = () => {
    setLocalSelectedIds([]);
    setLocalSelectedYears([]);
    setLocalSelectedType('all');
    onReset();
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-[#0c0e15]/95 border border-white/15 rounded-3xl shadow-[0_25px_70px_rgba(0,0,0,0.9)] overflow-hidden font-persian flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
        dir="rtl"
      >
        {/* Header */}
        <div className="p-5 border-b border-white/10 flex items-center justify-between bg-gradient-to-r from-white/[0.03] to-transparent">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <SlidersHorizontal className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-white">
                فیلتر پیشرفته سینمایی (TMDB & آرشیو)
              </h3>
              <p className="text-xs text-zinc-400 font-sans mt-0.5">
                فیلتر همزمان بر اساس چند ژانر مختلف و سال‌های انتشار
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white border border-white/10 transition-colors cursor-pointer"
            title="بستن پنجره"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto custom-scrollbar flex-1 space-y-5">
          {/* 1. Content Type Switcher */}
          <div>
            <label className="text-xs font-bold text-zinc-300 block mb-2 flex items-center gap-1.5">
              <Film className="w-3.5 h-3.5 text-amber-400" />
              <span>نوع محتوا:</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'همه عناوین', value: 'all' as const },
                { label: 'فیلم‌های سینمایی', value: 'movie' as const },
                { label: 'سریال‌های تلویزیونی', value: 'tv' as const },
              ].map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setLocalSelectedType(t.value)}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                    localSelectedType === t.value
                      ? 'bg-amber-500/20 border-amber-500 text-amber-300 shadow-sm'
                      : 'bg-white/5 border-white/10 text-zinc-400 hover:text-white'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* 2. Years Selection (Multi-Year) */}
          <div>
            <label className="text-xs font-bold text-zinc-300 block mb-2 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-amber-400" />
                <span>سال‌های انتشار (امکان انتخاب همزمان چند سال):</span>
              </span>
              {localSelectedYears.length > 0 && (
                <span className="text-[11px] text-amber-400 font-mono">
                  {localSelectedYears.length} سال انتخاب شده
                </span>
              )}
            </label>
            <div className="flex flex-wrap gap-2">
              {AVAILABLE_YEARS.map((y) => {
                const isSelected = localSelectedYears.includes(y.value);
                return (
                  <button
                    key={y.value}
                    type="button"
                    onClick={() => toggleYear(y.value)}
                    className={`px-3 py-1.5 rounded-xl border text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                      isSelected
                        ? 'bg-amber-500/20 border-amber-500 text-amber-300 shadow-sm font-bold'
                        : 'bg-white/5 border-white/10 text-zinc-400 hover:text-white hover:border-white/20'
                    }`}
                  >
                    <span>{y.label}</span>
                    {isSelected && <Check className="w-3 h-3 text-amber-400" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Genre Selection (Multi-Genre) */}
          <div>
            <div className="flex items-center justify-between text-xs font-bold text-zinc-300 mb-2.5">
              <span>ژانرها (امکان انتخاب همزمان چند ژانر مختلف):</span>
              <span className="font-mono text-amber-400">
                {localSelectedIds.length} ژانر انتخاب شده
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {AVAILABLE_GENRES.map((g) => {
                const isSelected = localSelectedIds.includes(g.id);
                return (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => toggleGenre(g.id)}
                    className={`flex items-center justify-between p-3 rounded-2xl border text-right transition-all duration-200 group cursor-pointer ${
                      isSelected
                        ? 'bg-amber-500/15 border-amber-500/60 text-white shadow-[0_0_15px_rgba(245,158,11,0.2)]'
                        : 'bg-white/[0.03] hover:bg-white/[0.07] border-white/10 text-zinc-300 hover:text-white hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-base">{g.emoji}</span>
                      <div>
                        <span className="text-xs font-bold block">{g.nameFa}</span>
                        <span className="text-[10px] text-zinc-500 font-sans block">
                          {g.nameEn}
                        </span>
                      </div>
                    </div>

                    <div
                      className={`w-5 h-5 rounded-lg flex items-center justify-center transition-all ${
                        isSelected
                          ? 'bg-amber-500 text-black font-bold'
                          : 'bg-white/5 text-transparent border border-white/10 group-hover:border-white/20'
                      }`}
                    >
                      <Check className="w-3.5 h-3.5" />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-white/10 bg-black/40 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleReset}
            disabled={localSelectedIds.length === 0 && localSelectedYears.length === 0 && localSelectedType === 'all'}
            className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-zinc-200 border border-white/10 text-xs font-bold flex items-center gap-1.5 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>پاکسازی فیلترها</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white border border-white/10 text-xs font-bold transition-all cursor-pointer"
            >
              انصراف
            </button>
            <button
              type="button"
              onClick={handleApply}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black text-xs font-black flex items-center gap-2 shadow-[0_4px_20px_rgba(245,158,11,0.35)] transition-all hover:scale-105 active:scale-95 cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>
                {localSelectedIds.length > 0 || localSelectedYears.length > 0
                  ? `اعمال فیلتر (${localSelectedIds.length + localSelectedYears.length} پارامتر)`
                  : 'اعمال فیلتر'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
