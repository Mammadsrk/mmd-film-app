import React, { useRef, useEffect, useState, useMemo } from 'react';
import {
  Search,
  X,
  Sparkles,
  Mic,
  MicOff,
  Flame,
  Clock,
  Command,
  SlidersHorizontal,
  Tv,
  Trash2,
  CornerDownLeft,
  Volume2,
  Film,
  Check,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GlassRings } from './GlassRings';

interface HeroSearchProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onClearSearch: () => void;
  isSearchActive: boolean;
  selectedHub: string | null;
  onSelectHub: (hubId: string | null) => void;
  isMobile: boolean;
  onOpenTvHelper?: () => void;
  isTvMode?: boolean;
}

const TRENDING_SEARCHES = [
  { title: 'Dune: Part Two', titleFa: 'تلماسه: بخش دوم', tag: 'داغ‌ترین 4K' },
  { title: 'Shogun', titleFa: 'شوگان', tag: 'سریال برتر' },
  { title: 'Oppenheimer', titleFa: 'اوپنهایمر', tag: 'دوبله اختصاصی' },
  { title: 'Severance', titleFa: 'جداسازی', tag: 'فصل جدید' },
  { title: 'Spider-Man', titleFa: 'مرد عنکبوتی', tag: 'کیفیت بلوری' },
  { title: 'پوست شیر', titleFa: 'پوست شیر', tag: 'ایرانی' },
];

const GENRE_QUICK_FILTERS = [
  { id: 'dubbed', label: 'دوبله فارسی', querySuffix: 'دوبله فارسی' },
  { id: '4k', label: 'کیفیت 4K UHD', querySuffix: '4K' },
  { id: 'action', label: 'اکشن و هیجان‌انگیز', querySuffix: 'اکشن' },
  { id: 'sci-fi', label: 'علمی‌تخیلی', querySuffix: 'علمی تخیلی' },
  { id: 'animation', label: 'انیمیشن', querySuffix: 'انیمیشن' },
];

const STORAGE_KEY = 'mmd_recent_searches_v2';

export const HeroSearch: React.FC<HeroSearchProps> = ({
  searchQuery,
  onSearchChange,
  onClearSearch,
  isSearchActive,
  selectedHub,
  onSelectHub,
  isMobile,
  onOpenTvHelper,
  isTvMode,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [isFocused, setIsFocused] = useState<boolean>(false);
  const [isListening, setIsListening] = useState<boolean>(false);
  const [speechError, setSpeechError] = useState<string | null>(null);
  const [isMac, setIsMac] = useState<boolean>(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [showFilterDrawer, setShowFilterDrawer] = useState<boolean>(false);

  // Load recent searches from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setRecentSearches(parsed.slice(0, 6));
        }
      }
    } catch {
      // Ignore localStorage read errors
    }

    if (typeof window !== 'undefined' && navigator?.platform) {
      setIsMac(/(Mac|iPhone|iPod|iPad)/i.test(navigator.platform));
    }
  }, []);

  const saveSearchTerm = (term: string) => {
    const clean = term.trim();
    if (!clean || clean.length < 2) return;
    setRecentSearches((prev) => {
      const filtered = prev.filter((item) => item.toLowerCase() !== clean.toLowerCase());
      const updated = [clean, ...filtered].slice(0, 6);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch {
        // Ignore write error
      }
      return updated;
    });
  };

  const removeRecentSearch = (e: React.MouseEvent, termToRemove: string) => {
    e.stopPropagation();
    setRecentSearches((prev) => {
      const updated = prev.filter((t) => t !== termToRemove);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch {
        // Ignore
      }
      return updated;
    });
  };

  const clearAllRecent = (e: React.MouseEvent) => {
    e.stopPropagation();
    setRecentSearches([]);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore
    }
  };

  // Keyboard shortcut (⌘K or / to focus search)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in another input/textarea
      const activeTag = document.activeElement?.tagName.toLowerCase();
      if (activeTag === 'input' || activeTag === 'textarea') {
        if (e.key === 'Escape' && isFocused) {
          setIsFocused(false);
          inputRef.current?.blur();
        }
        return;
      }

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        setIsFocused(true);
      } else if (e.key === '/' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        inputRef.current?.focus();
        setIsFocused(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFocused]);

  // Click outside to close suggestion intelligence panel
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Web Speech API Voice Search
  const toggleVoiceSearch = () => {
    setSpeechError(null);
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setSpeechError('مرورگر شما از ورودی صوتی پشتیبانی نمی‌کند.');
      setTimeout(() => setSpeechError(null), 3000);
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'fa-IR'; // Support Persian voice input
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListening(true);
        setSpeechError(null);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results?.[0]?.[0]?.transcript;
        if (transcript) {
          onSearchChange(transcript);
          saveSearchTerm(transcript);
          setIsFocused(false);
        }
        setIsListening(false);
      };

      recognition.onerror = (event: any) => {
        setIsListening(false);
        if (event.error === 'not-allowed') {
          setSpeechError('دسترسی میکروفون مسدود است.');
        } else if (event.error !== 'no-speech') {
          setSpeechError('خطا در دریافت صدا، دوباره تلاش کنید.');
        }
        setTimeout(() => setSpeechError(null), 3500);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch {
      setIsListening(false);
      setSpeechError('امکان فعال‌سازی میکروفون وجود ندارد.');
      setTimeout(() => setSpeechError(null), 3000);
    }
  };

  const handleSelectSuggestion = (term: string) => {
    onSearchChange(term);
    saveSearchTerm(term);
    setIsFocused(false);
    inputRef.current?.blur();
  };

  const handleKeyDownInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      if (searchQuery.trim()) {
        saveSearchTerm(searchQuery);
      }
      setIsFocused(false);
      inputRef.current?.blur();
    } else if (e.key === 'Escape') {
      setIsFocused(false);
      inputRef.current?.blur();
    }
  };

  const isDropdownOpen = isFocused && !isMobile;

  return (
    <section className="relative pt-6 pb-3 sm:pt-12 sm:pb-6 flex flex-col items-center justify-center overflow-visible">
      {/* Cinematic Ambient Glow Background with Subtle Frosted Depth */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-5xl h-72 bg-gradient-to-b from-indigo-950/20 via-slate-900/10 to-transparent blur-3xl pointer-events-none -z-10" />

      {/* Header Branding - Centered with Minimalist Clear Logo (English Only) */}
      <div className="w-full max-w-5xl px-4 relative z-10 flex items-center justify-center mb-6">
        {/* Centered MMD FILM Branding (Click to Return Home) */}
        <button
          type="button"
          onClick={onClearSearch}
          className="flex flex-col items-center justify-center text-center cursor-pointer group focus:outline-none"
          title="بازگشت به صفحه اول"
        >
          <div className="flex items-center gap-3">
            {/* Minimalist, Clear & High-Contrast Logo */}
            <div className="relative w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br from-zinc-900 via-zinc-950 to-black border border-white/15 flex items-center justify-center shadow-[0_0_24px_rgba(255,255,255,0.06)] ring-1 ring-white/10 group-hover:scale-105 transition-transform">
              <div className="absolute inset-0 rounded-2xl bg-radial from-indigo-500/10 via-transparent to-transparent pointer-events-none" />
              <svg
                viewBox="0 0 36 36"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="w-7 h-7 drop-shadow-[0_2px_10px_rgba(255,255,255,0.2)]"
              >
                {/* Modern Minimalist Cinema 'M' and Play Motif */}
                <path
                  d="M6 27V9L13 18L18 12L23 18L30 9V27"
                  stroke="#ffffff"
                  strokeWidth="2.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <polygon
                  points="16,16 22,20 16,24"
                  fill="#6366f1"
                />
              </svg>
            </div>

            {/* Title - English Only & Centered */}
            <div className="flex items-center">
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-widest font-sans">
                MMD <span className="text-indigo-400">FILM</span>
              </h1>
            </div>
          </div>
        </button>
      </div>

      {/* Central Frosted Glass Search Capsule & Dropdown */}
      <div ref={containerRef} className="w-full max-w-3xl px-4 relative z-20">
        {/* Floating Capsule Bar with Ultra-Clean Frosted Glass Look */}
        <div
          className={`relative rounded-3xl transition-all duration-300 shadow-2xl ${
            isFocused || isSearchActive
              ? 'bg-[#0c0d16]/90 border-white/30 ring-1 ring-white/20 shadow-[0_12px_40px_rgba(0,0,0,0.8),0_0_20px_rgba(255,255,255,0.06)]'
              : 'bg-[#0b0c14]/75 hover:bg-[#10121d]/85 border-white/10 hover:border-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.5)]'
          } border backdrop-blur-2xl before:absolute before:inset-x-8 before:top-0 before:h-[1px] before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent before:pointer-events-none overflow-hidden`}
        >
          <div className="flex items-center px-4 py-2.5 sm:py-3.5 gap-2 sm:gap-3">
            {/* Search Icon with Subtle Neutral/Pearl Highlight */}
            <div
              className={`p-2 rounded-2xl transition-all duration-200 shrink-0 ${
                isFocused || isSearchActive
                  ? 'bg-white/15 text-white shadow-sm ring-1 ring-white/20'
                  : 'bg-white/5 text-zinc-400'
              }`}
            >
              <Search className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>

            {/* Input with Persian RTL text detection - No red focus outline */}
            <input
              ref={inputRef}
              id="hero-search-input"
              data-tv-id="search-input"
              type="text"
              dir="auto"
              value={searchQuery}
              onFocus={() => setIsFocused(true)}
              onChange={(e) => onSearchChange(e.target.value)}
              onKeyDown={handleKeyDownInput}
              placeholder="جستجوی فیلم، سریال یا بازیگر... (مثل تلماسه، Shogun، زخم کاری)"
              tabIndex={0}
              className="no-tv-focus-ring w-full bg-transparent text-zinc-100 placeholder-zinc-500 text-sm sm:text-base font-persian focus:outline-none focus:ring-0 border-none py-1 shadow-none"
            />

            {/* Trailing Control Group */}
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              {/* Voice Search (Microphone) with Animated Waveform */}
              <button
                id="search-mic-btn"
                data-tv-id="search-mic"
                type="button"
                tabIndex={0}
                onClick={toggleVoiceSearch}
                className={`relative p-2 sm:px-2.5 rounded-xl text-xs font-persian transition-all flex items-center gap-1.5 border cursor-pointer ${
                  isListening
                    ? 'bg-red-600 text-white border-red-500 animate-pulse shadow-[0_0_15px_rgba(229,9,20,0.7)]'
                    : 'bg-zinc-900/80 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border-zinc-800/80'
                }`}
                title={isListening ? 'در حال شنیدن صدای شما...' : 'جستجوی صوتی به زبان فارسی'}
              >
                {isListening ? (
                  <>
                    <MicOff className="w-4 h-4 text-white" />
                    <span className="hidden sm:inline text-[11px] font-bold">شنیدن...</span>
                    <span className="flex gap-0.5 items-center">
                      <span className="w-1 h-3 bg-white rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-1 h-4 bg-white rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-1 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </span>
                  </>
                ) : (
                  <Mic className="w-4 h-4 hover:text-zinc-200" />
                )}
              </button>

              {/* Clear Button */}
              {searchQuery && (
                <button
                  id="search-clear-btn"
                  data-tv-id="search-clear"
                  type="button"
                  onClick={() => {
                    onClearSearch();
                    inputRef.current?.focus();
                  }}
                  tabIndex={0}
                  className="p-2 rounded-xl text-zinc-400 hover:text-white bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800/80 transition-all hover:rotate-90 duration-200 cursor-pointer"
                  title="پاک کردن جستجو"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Voice Error Notification */}
          {speechError && (
            <div className="px-4 py-1.5 bg-zinc-900/90 border-t border-zinc-800 text-[11px] text-zinc-300 font-persian flex items-center justify-between">
              <span>{speechError}</span>
              <span className="text-[10px] text-zinc-400">از مرورگر Chrome یا Edge استفاده کنید</span>
            </div>
          )}
        </div>

        {/* Pinterest-Inspired Smart Dropdown Drawer */}
        <AnimatePresence>
          {isDropdownOpen && (
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.98 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              className="absolute left-4 right-4 mt-2 p-4 rounded-3xl bg-zinc-950/95 border border-zinc-800/90 backdrop-blur-3xl shadow-[0_20px_50px_rgba(0,0,0,0.85)] z-50 overflow-hidden"
            >
              {/* Quick Genre & Feature Filters */}
              <div className="mb-4 pb-3 border-b border-zinc-800/70">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider font-persian flex items-center gap-1.5">
                    <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-400" />
                    <span>فیلترهای سریع محتوا</span>
                  </span>
                </div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {GENRE_QUICK_FILTERS.map((f) => {
                    const isActive = searchQuery.includes(f.querySuffix);
                    return (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => {
                          if (isActive) {
                            onSearchChange(searchQuery.replace(f.querySuffix, '').trim());
                          } else {
                            const newQuery = searchQuery ? `${searchQuery.trim()} ${f.querySuffix}` : f.querySuffix;
                            onSearchChange(newQuery);
                            saveSearchTerm(newQuery);
                          }
                        }}
                        className={`px-3 py-1 rounded-xl text-xs font-persian transition-all flex items-center gap-1 border ${
                          isActive
                            ? 'bg-indigo-600/30 text-white border-indigo-500/60 shadow-[0_0_12px_rgba(99,102,241,0.25)]'
                            : 'bg-zinc-900/90 text-zinc-300 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800'
                        }`}
                      >
                        {isActive && <Check className="w-3 h-3" />}
                        <span>{f.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Recent Searches Section */}
              {recentSearches.length > 0 && (
                <div className="mb-4 pb-3 border-b border-zinc-800/70">
                  <div className="flex items-center justify-between mb-2.5">
                    <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider font-persian flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-zinc-400" />
                      <span>جستجوهای اخیر</span>
                    </span>
                    <button
                      type="button"
                      onClick={clearAllRecent}
                      className="text-[11px] text-zinc-500 hover:text-zinc-300 font-persian flex items-center gap-1 transition-colors"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>پاک کردن تاریخچه</span>
                    </button>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {recentSearches.map((item) => (
                      <div
                        key={item}
                        onClick={() => handleSelectSuggestion(item)}
                        className="group flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-800/80 hover:border-zinc-700 text-xs text-zinc-300 hover:text-white font-persian cursor-pointer transition-all"
                      >
                        <Clock className="w-3 h-3 text-zinc-500 group-hover:text-zinc-300" />
                        <span>{item}</span>
                        <button
                          type="button"
                          onClick={(e) => removeRecentSearch(e, item)}
                          className="p-0.5 rounded text-zinc-500 hover:text-zinc-300 hover:bg-zinc-700/50 transition-colors ml-0.5"
                          title="حذف"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Trending Searches Section */}
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider font-persian flex items-center gap-1.5">
                    <Flame className="w-3.5 h-3.5 text-amber-500" />
                    <span>داغ‌ترین جستجوها و عناوین برتر هفته</span>
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {TRENDING_SEARCHES.map((item) => (
                    <div
                      key={item.title}
                      onClick={() => handleSelectSuggestion(item.title)}
                      className="flex items-center justify-between p-2.5 rounded-2xl bg-zinc-900/60 hover:bg-zinc-800/90 border border-zinc-800/60 hover:border-white/30 cursor-pointer transition-all group"
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-xl bg-zinc-800 group-hover:bg-white/10 text-zinc-400 group-hover:text-zinc-200 flex items-center justify-center transition-colors">
                          <Film className="w-3.5 h-3.5" />
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-bold text-zinc-200 group-hover:text-white font-persian">
                            {item.titleFa}
                          </p>
                          <p className="text-[10px] text-zinc-500 font-sans tracking-tight">
                            {item.title}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-800/80 group-hover:bg-white/10 text-zinc-400 group-hover:text-zinc-200 border border-zinc-700/50 font-persian">
                          {item.tag}
                        </span>
                        <CornerDownLeft className="w-3 h-3 text-zinc-600 group-hover:text-zinc-300 transition-transform group-hover:-translate-x-0.5" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Footer Tip for Keyboard & Remote Navigation */}
              <div className="mt-3 pt-2.5 border-t border-zinc-900 flex items-center justify-between text-[11px] text-zinc-500 font-persian">
                <span>برای تایید <kbd className="px-1.5 py-0.5 rounded bg-zinc-800 font-mono text-[10px] text-zinc-300">Enter</kbd> یا برای خروج <kbd className="px-1.5 py-0.5 rounded bg-zinc-800 font-mono text-[10px] text-zinc-300">Esc</kbd> را بزنید</span>
                <span className="flex items-center gap-1 text-emerald-400">
                  <Sparkles className="w-3 h-3 text-amber-400" />
                  <span>جستجوی همزمان در ۶ سایت ایرانی</span>
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 6 Target Film Hubs Glass Rings */}
      <GlassRings
        isSearchActive={isSearchActive}
        selectedHub={selectedHub}
        onSelectHub={onSelectHub}
        isMobile={isMobile}
      />
    </section>
  );
};

