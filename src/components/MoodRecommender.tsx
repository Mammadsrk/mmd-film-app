import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sparkles,
  X,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Check,
  Star,
  Plus,
  Trash2,
  ThumbsDown,
  Eye,
  Film,
  Play,
  Sliders,
  Bookmark,
  BookmarkCheck,
  TrendingUp,
  Brain,
  Zap,
  Compass,
  ArrowRight,
  Calendar,
  Layers,
  Award,
  Filter,
  RefreshCw,
  EyeOff,
} from 'lucide-react';
import { MoviePosterImage } from './MoviePosterImage';
import {
  MediaItem,
  VibeAnswerState,
  UserTasteVector,
  RecommendedMovie,
  RatedMovieEntry,
  YearRangeSelection,
} from '../types';
import {
  VIBE_QUESTIONS,
  VIBE_MAPPINGS,
  VibeQuestion,
  VibeOption,
  YEAR_RANGE_PRESETS,
  YearRangePreset,
} from '../data/vibeMappings';

interface MoodRecommenderProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectMedia: (item: MediaItem) => void;
}

const TASTE_STORAGE_KEY = 'mmd_user_taste_vector_v1';
const WATCHLIST_STORAGE_KEY = 'mmd_user_watchlist_v1';

export const MoodRecommender: React.FC<MoodRecommenderProps> = ({
  isOpen,
  onClose,
  onSelectMedia,
}) => {
  // Steps:
  // 0, 1, 2, 3: Vibe Questions (Mental Energy, Pacing, Ending Tone, Setting)
  // 4: Year Range Selector (بازه سال ساخت فیلم)
  // 5: Calibration Stage (مرحله ارزیابی و نمره‌دهی ۱۰ فیلم کاندید)
  // 6: Final Results (۵ شاهکار نهایی و دست‌چین‌شده)
  const [currentStep, setCurrentStep] = useState<number>(0);

  const [vibeAnswers, setVibeAnswers] = useState<VibeAnswerState>({
    mentalEnergy: 'medium',
    pacing: 'steady',
    endingTone: 'uplifting',
    setting: 'cozy_modern',
    yearRange: YEAR_RANGE_PRESETS[0], // All years by default
  });

  // Custom year range toggle and values
  const [isCustomYear, setIsCustomYear] = useState<boolean>(false);
  const [customMinYear, setCustomMinYear] = useState<number>(1995);
  const [customMaxYear, setCustomMaxYear] = useState<number>(2024);

  // User Taste Vector persistent state
  const [userTaste, setUserTaste] = useState<UserTasteVector>({
    likedGenres: {},
    dislikedGenres: {},
    likedKeywords: [],
    dislikedKeywords: [],
    ratedMovies: [],
    discardedIds: [],
    savedIds: [],
  });

  // Saved Watchlist
  const [savedMovies, setSavedMovies] = useState<MediaItem[]>([]);
  const [activeTab, setActiveTab] = useState<'flow' | 'watchlist'>('flow');

  // Calibration Phase: 20 movies candidates (4 stages of 5 movies)
  const [calibrationMovies, setCalibrationMovies] = useState<RecommendedMovie[]>([]);
  // Sub-stage in calibration: 'stage1' (1-5), 'stage2' (6-10), 'stage3' (11-15), 'stage4' (16-20), 'all'
  const [calibrationSubStage, setCalibrationSubStage] = useState<'stage1' | 'stage2' | 'stage3' | 'stage4' | 'all'>('stage1');

  // Final Phase: 5 tailored masterpieces
  const [finalRecommendations, setFinalRecommendations] = useState<RecommendedMovie[]>([]);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [feedbackToast, setFeedbackToast] = useState<string | null>(null);
  const [ratingTargetMovieId, setRatingTargetMovieId] = useState<string | null>(null);

  // Load user taste and watchlist on mount
  useEffect(() => {
    try {
      const storedTaste = localStorage.getItem(TASTE_STORAGE_KEY);
      if (storedTaste) {
        setUserTaste(JSON.parse(storedTaste));
      }
      const storedWatchlist = localStorage.getItem(WATCHLIST_STORAGE_KEY);
      if (storedWatchlist) {
        setSavedMovies(JSON.parse(storedWatchlist));
      }
    } catch (e) {
      console.warn('Failed to load local taste storage:', e);
    }
  }, []);

  // Save taste vector helper
  const saveTasteVector = useCallback((newTaste: UserTasteVector) => {
    setUserTaste(newTaste);
    try {
      localStorage.setItem(TASTE_STORAGE_KEY, JSON.stringify(newTaste));
    } catch (e) {
      console.warn('Failed to save user taste to localStorage:', e);
    }
  }, []);

  // Save watchlist helper
  const saveWatchlist = useCallback((newList: MediaItem[]) => {
    setSavedMovies(newList);
    try {
      localStorage.setItem(WATCHLIST_STORAGE_KEY, JSON.stringify(newList));
    } catch (e) {
      console.warn('Failed to save watchlist to localStorage:', e);
    }
  }, []);

  const showToast = (msg: string) => {
    setFeedbackToast(msg);
    setTimeout(() => {
      setFeedbackToast(null);
    }, 3500);
  };

  // Step 1: Fetch 10 candidates for Calibration Phase
  const fetchCalibrationPool = useCallback(
    async (currentVibe: VibeAnswerState, tasteToUse: UserTasteVector) => {
      setIsLoading(true);
      try {
        const res = await fetch('/api/smart-recommendations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            vibeAnswers: currentVibe,
            userTaste: tasteToUse,
            limit: 10,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          if (data.success && Array.isArray(data.results)) {
            const annotated: RecommendedMovie[] = data.results.map((m: RecommendedMovie) => {
              const isSaved = savedMovies.some((s) => s.id === m.id || (m.tmdbId && s.tmdbId === m.tmdbId));
              const rated = tasteToUse.ratedMovies.find((r) => r.id === m.id || (m.tmdbId && r.tmdbId === m.tmdbId));
              return {
                ...m,
                isSaved,
                isWatched: Boolean(rated),
                userRating: rated?.rating,
              };
            });
            setCalibrationMovies(annotated);
            setCurrentStep(5); // Move to calibration phase
            setCalibrationSubStage('stage1');
          }
        }
      } catch (err) {
        console.error('Error fetching calibration movies pool:', err);
        showToast('خطا در دریافت لیست فیلم‌ها. لطفاً مجدداً تلاش کنید.');
      } finally {
        setIsLoading(false);
      }
    },
    [savedMovies]
  );

  // Step 2: Fetch 5 Final Masterpieces based on ratings & refined taste
  const fetchFinalRecommendations = useCallback(
    async (currentVibe: VibeAnswerState, tasteToUse: UserTasteVector) => {
      setIsLoading(true);
      try {
        const res = await fetch('/api/smart-recommendations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            vibeAnswers: currentVibe,
            userTaste: tasteToUse,
            limit: 5,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          if (data.success && Array.isArray(data.results)) {
            const annotated: RecommendedMovie[] = data.results.map((m: RecommendedMovie) => {
              const isSaved = savedMovies.some((s) => s.id === m.id || (m.tmdbId && s.tmdbId === m.tmdbId));
              const rated = tasteToUse.ratedMovies.find((r) => r.id === m.id || (m.tmdbId && r.tmdbId === m.tmdbId));
              return {
                ...m,
                isSaved,
                isWatched: Boolean(rated),
                userRating: rated?.rating,
              };
            });
            setFinalRecommendations(annotated);
            setCurrentStep(6); // Move to final view
          }
        }
      } catch (err) {
        console.error('Error fetching final recommendations:', err);
        showToast('خطا در محاسبه ۵ فیلم نهایی. لطفاً مجدداً تلاش کنید.');
      } finally {
        setIsLoading(false);
      }
    },
    [savedMovies]
  );

  // Handle Option Select in Questionnaire (Steps 0 to 3)
  const handleSelectOption = (key: VibeQuestion['key'], optionId: string) => {
    setVibeAnswers((prev) => ({
      ...prev,
      [key]: optionId,
    }));
  };

  // Handle Year Range Preset Select (Step 4)
  const handleSelectYearPreset = (preset: YearRangePreset) => {
    setIsCustomYear(false);
    setVibeAnswers((prev) => ({
      ...prev,
      yearRange: {
        id: preset.id,
        titleFa: preset.titleFa,
        minYear: preset.minYear,
        maxYear: preset.maxYear,
        emoji: preset.emoji,
        descFa: preset.descFa,
      },
    }));
  };

  // Apply Custom Year Range
  const handleApplyCustomYear = () => {
    const min = Math.min(customMinYear, customMaxYear);
    const max = Math.max(customMinYear, customMaxYear);
    const customSelection: YearRangeSelection = {
      id: 'custom',
      titleFa: `بازه انتخابی (${min} تا ${max})`,
      minYear: min,
      maxYear: max,
      emoji: '📅',
      descFa: `فیلم‌های اکران‌شده بین سال‌های ${min} و ${max}`,
    };
    setVibeAnswers((prev) => ({
      ...prev,
      yearRange: customSelection,
    }));
  };

  // Next step navigation
  const handleNextStep = () => {
    if (currentStep < 3) {
      setCurrentStep((prev) => prev + 1);
    } else if (currentStep === 3) {
      // Move to Step 4: Year Range selection
      setCurrentStep(4);
    } else if (currentStep === 4) {
      // Finished all 5 questions -> Fetch 10 movies for calibration
      fetchCalibrationPool(vibeAnswers, userTaste);
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleResetQuiz = () => {
    setCurrentStep(0);
    setActiveTab('flow');
    setCalibrationSubStage('stage1');
  };

  // 1. Rating in Calibration (1 - 10)
  const handleRateMovie = (movie: RecommendedMovie, ratingValue: number) => {
    const movieGenreIds: number[] = (movie as any).genreIds || [];
    const newLikedGenres = { ...userTaste.likedGenres };
    const newDislikedGenres = { ...userTaste.dislikedGenres };

    if (ratingValue >= 7) {
      const weightBonus = ratingValue >= 9 ? 4 : 2.5;
      movieGenreIds.forEach((gid) => {
        newLikedGenres[gid] = (newLikedGenres[gid] || 0) + weightBonus;
      });
      showToast(`امتیاز ${ratingValue} ثبت شد! تأثیر مثبت روی سبک‌های مورد علاقه شما اعمال شد.`);
    } else if (ratingValue <= 5) {
      const penalty = ratingValue <= 3 ? 3.5 : 2;
      movieGenreIds.forEach((gid) => {
        newDislikedGenres[gid] = (newDislikedGenres[gid] || 0) + penalty;
      });
      showToast(`امتیاز ${ratingValue} ثبت شد. این الگوها در پیشنهادهای نهایی تعدیل می‌شوند.`);
    } else {
      showToast(`امتیاز ${ratingValue} با موفقیت ثبت شد.`);
    }

    const updatedRatedList: RatedMovieEntry[] = [
      ...userTaste.ratedMovies.filter((r) => r.id !== movie.id && (!movie.tmdbId || r.tmdbId !== movie.tmdbId)),
      {
        id: movie.id,
        tmdbId: movie.tmdbId,
        title: movie.title,
        titleFa: movie.titleFa,
        rating: ratingValue,
        ratedAt: Date.now(),
      },
    ];

    const updatedTaste: UserTasteVector = {
      ...userTaste,
      likedGenres: newLikedGenres,
      dislikedGenres: newDislikedGenres,
      ratedMovies: updatedRatedList,
    };

    saveTasteVector(updatedTaste);
    setRatingTargetMovieId(null);

    // Update movie status in calibration list
    setCalibrationMovies((prev) =>
      prev.map((m) =>
        m.id === movie.id ? { ...m, isWatched: true, userRating: ratingValue } : m
      )
    );
  };

  // 2. Add to / Remove from List
  const handleToggleWatchlist = (movie: RecommendedMovie) => {
    const isAlreadySaved = savedMovies.some((s) => s.id === movie.id);
    let updatedList: MediaItem[];

    if (isAlreadySaved) {
      updatedList = savedMovies.filter((s) => s.id !== movie.id);
      showToast('عنوان از لیست تماشای شما حذف شد.');
    } else {
      updatedList = [movie, ...savedMovies];
      showToast('به لیست تماشای شما اضافه شد! ✨');
    }

    saveWatchlist(updatedList);

    const savedIds = updatedList.map((m) => m.id);
    saveTasteVector({ ...userTaste, savedIds });

    setCalibrationMovies((prev) =>
      prev.map((m) => (m.id === movie.id ? { ...m, isSaved: !isAlreadySaved } : m))
    );
    setFinalRecommendations((prev) =>
      prev.map((m) => (m.id === movie.id ? { ...m, isSaved: !isAlreadySaved } : m))
    );
  };

  // 3. Discard / Skip Movie Style
  const handleDiscardMovie = (movie: RecommendedMovie) => {
    const movieGenreIds: number[] = (movie as any).genreIds || [];
    const newDisliked = { ...userTaste.dislikedGenres };

    movieGenreIds.forEach((gid) => {
      newDisliked[gid] = (newDisliked[gid] || 0) + 3;
    });

    const updatedDiscarded = [...userTaste.discardedIds, movie.id];
    if (movie.tmdbId) {
      updatedDiscarded.push(String(movie.tmdbId));
    }

    const updatedTaste: UserTasteVector = {
      ...userTaste,
      dislikedGenres: newDisliked,
      discardedIds: updatedDiscarded,
    };

    saveTasteVector(updatedTaste);
    showToast('سبک فیلم کنار گذاشته شد و در نتایج نهایی حذف می‌شود.');

    // Remove from active list
    setCalibrationMovies((prev) => prev.filter((m) => m.id !== movie.id));
    setFinalRecommendations((prev) => prev.filter((m) => m.id !== movie.id));
  };

  // Active question data for steps 0 to 3
  const currentQuestion: VibeQuestion | undefined = currentStep <= 3 ? VIBE_QUESTIONS[currentStep] : undefined;

  // Active answer summary tags
  const activeMoodSummary = useMemo(() => {
    const tags: { emoji: string; title: string }[] = [];
    if (vibeAnswers.mentalEnergy && VIBE_MAPPINGS.mentalEnergy[vibeAnswers.mentalEnergy]) {
      const opt = VIBE_MAPPINGS.mentalEnergy[vibeAnswers.mentalEnergy];
      tags.push({ emoji: opt.emoji, title: opt.titleFa });
    }
    if (vibeAnswers.pacing && VIBE_MAPPINGS.pacing[vibeAnswers.pacing]) {
      const opt = VIBE_MAPPINGS.pacing[vibeAnswers.pacing];
      tags.push({ emoji: opt.emoji, title: opt.titleFa });
    }
    if (vibeAnswers.endingTone && VIBE_MAPPINGS.endingTone[vibeAnswers.endingTone]) {
      const opt = VIBE_MAPPINGS.endingTone[vibeAnswers.endingTone];
      tags.push({ emoji: opt.emoji, title: opt.titleFa });
    }
    if (vibeAnswers.setting && VIBE_MAPPINGS.setting[vibeAnswers.setting]) {
      const opt = VIBE_MAPPINGS.setting[vibeAnswers.setting];
      tags.push({ emoji: opt.emoji, title: opt.titleFa });
    }
    if (vibeAnswers.yearRange) {
      tags.push({ emoji: vibeAnswers.yearRange.emoji || '📅', title: vibeAnswers.yearRange.titleFa });
    }
    return tags;
  }, [vibeAnswers]);

  // Movies to display in Calibration Phase (sub-stages)
  const visibleCalibrationMovies = useMemo(() => {
    if (calibrationSubStage === 'stage1') {
      return calibrationMovies.slice(0, 5);
    }
    if (calibrationSubStage === 'stage2') {
      return calibrationMovies.slice(5, 10);
    }
    return calibrationMovies;
  }, [calibrationMovies, calibrationSubStage]);

  // Count how many movies have been rated in calibration
  const ratedCountInCalibration = useMemo(() => {
    return calibrationMovies.filter((m) => m.isWatched).length;
  }, [calibrationMovies]);

  if (!isOpen) return null;

  return (
    <div
      id="mood-recommender-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/85 backdrop-blur-2xl overflow-y-auto animate-fade-in"
      dir="rtl"
    >
      {/* Click outside backdrop */}
      <div className="fixed inset-0" onClick={onClose} />

      {/* Main Glassmorphic Container */}
      <div className="relative w-full max-w-5xl bg-[#090a12]/95 border border-white/15 rounded-3xl shadow-[0_25px_70px_rgba(0,0,0,0.9)] overflow-hidden z-10 flex flex-col my-auto max-h-[94vh]">
        {/* Top Header Bar */}
        <div className="px-5 sm:px-8 py-4 border-b border-white/10 flex items-center justify-between bg-white/[0.02] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500/20 to-indigo-500/20 border border-white/20 flex items-center justify-center text-amber-300 shadow-inner">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black text-white font-persian">
                  فیلم‌شناس هوشمند و تنظیم سلیقه
                </h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-persian font-bold">
                  سیستم تطابق روحی و سال ساخت
                </span>
              </div>
              <p className="text-xs text-zinc-400 font-persian">
                کشف هوشمندانه ۵ فیلم برتر بر اساس حس روحی، بازه سال ساخت و نمره‌دهی کالیبره‌شده
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Watchlist toggle in results or calibration view */}
            {currentStep >= 5 && (
              <div className="flex items-center bg-white/5 rounded-xl p-1 border border-white/10 text-xs font-persian">
                <button
                  type="button"
                  onClick={() => setActiveTab('flow')}
                  className={`px-3 py-1 rounded-lg transition-all ${
                    activeTab === 'flow'
                      ? 'bg-indigo-600 text-white shadow'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  {currentStep === 5 ? 'مرحله کالیبراسیون (۱۰ فیلم)' : '۵ فیلم نهایی شما'}
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('watchlist')}
                  className={`px-3 py-1 rounded-lg transition-all flex items-center gap-1.5 ${
                    activeTab === 'watchlist'
                      ? 'bg-indigo-600 text-white shadow'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  <Bookmark className="w-3.5 h-3.5 text-amber-400" />
                  <span>لیست من ({savedMovies.length})</span>
                </button>
              </div>
            )}

            <button
              id="btn-close-mood-recommender"
              type="button"
              onClick={onClose}
              className="tv-focusable p-2 rounded-xl bg-white/5 hover:bg-white/10 active:bg-white/20 text-zinc-400 hover:text-white border border-white/10 transition-colors cursor-pointer"
              title="بستن پنجره"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Dynamic Toast Feedback Notification */}
        <AnimatePresence>
          {feedbackToast && (
            <motion.div
              initial={{ opacity: 0, y: -15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute top-16 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-2xl bg-indigo-900/90 text-white text-xs font-persian border border-indigo-400/40 shadow-2xl flex items-center gap-2 pointer-events-none backdrop-blur-md"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>{feedbackToast}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Body Content Area */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-8">
          {activeTab === 'watchlist' ? (
            /* Watchlist View */
            <div>
              <div className="flex items-center justify-between mb-4 pb-2 border-b border-white/10">
                <h3 className="text-base font-bold text-white font-persian flex items-center gap-2">
                  <Bookmark className="w-4 h-4 text-amber-400" />
                  <span>لیست تماشای ذخیره‌شده شما ({savedMovies.length} عنوان)</span>
                </h3>
                {savedMovies.length > 0 && (
                  <button
                    type="button"
                    onClick={() => saveWatchlist([])}
                    className="text-xs text-rose-400 hover:text-rose-300 font-persian flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>پاک کردن کل لیست</span>
                  </button>
                )}
              </div>

              {savedMovies.length === 0 ? (
                <div className="py-16 text-center text-zinc-400 font-persian">
                  <Bookmark className="w-12 h-12 mx-auto text-zinc-600 mb-3" />
                  <p className="text-sm">هنوز فیلمی به لیست تماشای خود اضافه نکرده‌اید.</p>
                  <p className="text-xs text-zinc-500 mt-1">
                    روی دکمه «ندیدم، به لیستم اضافه کن» در کارت‌های فیلم کلیک کنید.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {savedMovies.map((movie) => (
                    <div
                      key={movie.id}
                      className="bg-white/[0.03] border border-white/10 rounded-2xl p-2.5 flex flex-col justify-between group hover:border-white/25 transition-all"
                    >
                      <div
                        onClick={() => {
                          onSelectMedia(movie);
                          onClose();
                        }}
                        className="cursor-pointer"
                      >
                        <div className="aspect-[2/3] rounded-xl overflow-hidden mb-2 relative bg-zinc-900">
                          <img
                            src={movie.posterUrl}
                            alt={movie.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            loading="lazy"
                          />
                          <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-md text-[10px] text-amber-300 font-mono flex items-center gap-1 border border-white/10">
                            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                            <span>{movie.rating}</span>
                          </div>
                        </div>
                        <h4 className="text-xs font-bold text-white font-persian truncate">
                          {movie.titleFa || movie.title}
                        </h4>
                        <p className="text-[10px] text-zinc-500 font-mono truncate">{movie.title}</p>
                      </div>

                      <div className="mt-2 pt-2 border-t border-white/10 flex items-center justify-between">
                        <button
                          type="button"
                          onClick={() => {
                            onSelectMedia(movie);
                            onClose();
                          }}
                          className="text-[11px] text-indigo-400 hover:text-indigo-300 font-persian flex items-center gap-1"
                        >
                          <Play className="w-3 h-3" />
                          <span>پخش</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleToggleWatchlist(movie as RecommendedMovie)}
                          className="p-1 text-zinc-500 hover:text-rose-400 transition-colors"
                          title="حذف از لیست"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : currentStep <= 3 ? (
            /* ============================================================
               PHASE 1: 4 Vibe Questions
               ============================================================ */
            <div className="max-w-3xl mx-auto flex flex-col justify-between min-h-[460px]">
              {/* Progress Indicator (5 Steps Total: 4 Vibe + 1 Year Range) */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2 text-xs font-persian text-zinc-400">
                  <span className="font-bold text-zinc-200">
                    پرسش {currentStep + 1} از ۵ (روان‌شناسی مود)
                  </span>
                  <span>{currentQuestion?.titleFa}</span>
                </div>
                <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden flex">
                  {[0, 1, 2, 3, 4].map((stepIdx) => (
                    <div
                      key={stepIdx}
                      className={`flex-1 transition-all duration-300 border-r border-black/40 ${
                        stepIdx <= currentStep
                          ? 'bg-gradient-to-r from-amber-400 to-indigo-500'
                          : 'bg-zinc-800'
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* Question Headline */}
              <div className="mb-6 text-center sm:text-right">
                <h3 className="text-xl sm:text-2xl font-black text-white font-persian mb-1.5 flex items-center justify-center sm:justify-start gap-2">
                  <span>{currentQuestion?.options[0]?.emoji}</span>
                  <span>{currentQuestion?.titleFa}</span>
                </h3>
                <p className="text-xs sm:text-sm text-zinc-400 font-persian">
                  {currentQuestion?.subtitleFa}
                </p>
              </div>

              {/* Options Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 mb-8">
                {currentQuestion?.options.map((opt: VibeOption) => {
                  const isSelected = vibeAnswers[currentQuestion.key] === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => handleSelectOption(currentQuestion.key, opt.id)}
                      className={`tv-focusable text-right p-4 sm:p-5 rounded-2xl border transition-all duration-200 flex flex-col justify-between group cursor-pointer relative overflow-hidden ${
                        isSelected
                          ? 'bg-indigo-950/50 border-indigo-400/80 shadow-[0_0_25px_rgba(99,102,241,0.25)] ring-1 ring-indigo-400/40'
                          : 'bg-white/[0.03] hover:bg-white/[0.07] border-white/10 hover:border-white/20'
                      }`}
                    >
                      {isSelected && (
                        <div className="absolute top-3 left-3 w-6 h-6 rounded-full bg-indigo-500 text-white flex items-center justify-center shadow">
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </div>
                      )}

                      <div className="mb-4">
                        <div className="text-3xl sm:text-4xl mb-3">{opt.emoji}</div>
                        <h4 className="text-base font-bold text-white font-persian mb-0.5 group-hover:text-amber-200 transition-colors">
                          {opt.titleFa}
                        </h4>
                        <span className="text-[11px] text-zinc-500 font-mono tracking-tight">
                          {opt.titleEn}
                        </span>
                      </div>

                      <p className="text-xs text-zinc-400 font-persian leading-relaxed mt-2 pt-2 border-t border-white/5">
                        {opt.descFa}
                      </p>
                    </button>
                  );
                })}
              </div>

              {/* Questionnaire Navigation Footer */}
              <div className="pt-4 border-t border-white/10 flex items-center justify-between">
                <button
                  type="button"
                  onClick={handlePrevStep}
                  disabled={currentStep === 0}
                  className={`tv-focusable flex items-center gap-1.5 px-4 py-2.5 rounded-xl border text-xs font-persian transition-all ${
                    currentStep === 0
                      ? 'opacity-30 cursor-not-allowed border-transparent text-zinc-600'
                      : 'bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white border-white/10'
                  }`}
                >
                  <ChevronRight className="w-4 h-4" />
                  <span>مرحله قبلی</span>
                </button>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-zinc-500 font-persian hidden sm:inline">
                    انتخاب شما به طور خودکار ثبت می‌شود
                  </span>

                  <button
                    type="button"
                    onClick={handleNextStep}
                    className="tv-focusable flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-indigo-600 hover:from-amber-400 hover:to-indigo-500 text-white font-bold text-xs font-persian shadow-lg shadow-indigo-500/25 transition-all hover:scale-102 active:scale-98 cursor-pointer"
                  >
                    <span>مرحله بعدی (انتخاب سال ساخت)</span>
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ) : currentStep === 4 ? (
            /* ============================================================
               PHASE 2: Question 5 - Release Year Range Selection (بازه سال ساخت)
               ============================================================ */
            <div className="max-w-3xl mx-auto flex flex-col justify-between min-h-[460px]">
              {/* Progress Indicator */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2 text-xs font-persian text-zinc-400">
                  <span className="font-bold text-zinc-200">
                    پرسش ۵ از ۵: تعیین سال ساخت اثر
                  </span>
                  <span>بازه زمانی و دوران اکران</span>
                </div>
                <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden flex">
                  {[0, 1, 2, 3, 4].map((stepIdx) => (
                    <div
                      key={stepIdx}
                      className="flex-1 transition-all duration-300 border-r border-black/40 bg-gradient-to-r from-amber-400 to-indigo-500"
                    />
                  ))}
                </div>
              </div>

              {/* Headline */}
              <div className="mb-6 text-center sm:text-right">
                <h3 className="text-xl sm:text-2xl font-black text-white font-persian mb-1.5 flex items-center justify-center sm:justify-start gap-2">
                  <Calendar className="w-6 h-6 text-amber-400" />
                  <span>فیلم‌های چه دوره‌ای را ترجیح می‌دهید؟ (سال ساخت)</span>
                </h3>
                <p className="text-xs sm:text-sm text-zinc-400 font-persian">
                  مشخص کنید مایلید پیشنهادها از آثار نوساخت باشند یا شاهکارهای طلایی و کلاسیک تاریخ سینما
                </p>
              </div>

              {/* Presets Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5 mb-6">
                {YEAR_RANGE_PRESETS.map((preset) => {
                  const isSelected = !isCustomYear && vibeAnswers.yearRange?.id === preset.id;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => handleSelectYearPreset(preset)}
                      className={`tv-focusable text-right p-4 rounded-2xl border transition-all duration-200 flex flex-col justify-between group cursor-pointer relative ${
                        isSelected
                          ? 'bg-indigo-950/60 border-indigo-400/80 shadow-[0_0_25px_rgba(99,102,241,0.25)] ring-1 ring-indigo-400/50'
                          : 'bg-white/[0.03] hover:bg-white/[0.07] border-white/10 hover:border-white/20'
                      }`}
                    >
                      {isSelected && (
                        <div className="absolute top-3 left-3 w-5 h-5 rounded-full bg-indigo-500 text-white flex items-center justify-center shadow">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </div>
                      )}

                      <div className="mb-2">
                        <span className="text-2xl mb-1 inline-block">{preset.emoji}</span>
                        <h4 className="text-sm font-bold text-white font-persian group-hover:text-amber-200 transition-colors">
                          {preset.titleFa}
                        </h4>
                        <div className="text-[11px] font-mono text-indigo-300/90 mt-0.5">
                          {preset.minYear} — {preset.maxYear}
                        </div>
                      </div>

                      <p className="text-[11px] text-zinc-400 font-persian leading-relaxed mt-2 pt-2 border-t border-white/5">
                        {preset.descFa}
                      </p>
                    </button>
                  );
                })}
              </div>

              {/* Custom Year Range Option Toggle */}
              <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 mb-8">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-bold text-zinc-200 font-persian">
                      یا تعیین دقیق سال‌ها با اسلایدر دلخواه:
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setIsCustomYear(!isCustomYear);
                      if (!isCustomYear) {
                        handleApplyCustomYear();
                      }
                    }}
                    className={`px-3 py-1 rounded-xl text-xs font-persian border transition-all ${
                      isCustomYear
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 font-bold'
                        : 'bg-white/5 text-zinc-400 hover:text-white border-white/10'
                    }`}
                  >
                    {isCustomYear ? 'حالت سفارشی فعال ✓' : 'فعال‌سازی بازه دلخواه'}
                  </button>
                </div>

                {isCustomYear && (
                  <div className="mt-4 pt-3 border-t border-white/5 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <div className="flex justify-between text-xs font-persian text-zinc-400 mb-1">
                        <span>از سال ساخت:</span>
                        <span className="font-mono text-amber-300">{customMinYear}</span>
                      </div>
                      <input
                        type="range"
                        min="1950"
                        max="2026"
                        value={customMinYear}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setCustomMinYear(val);
                          setVibeAnswers((prev) => ({
                            ...prev,
                            yearRange: {
                              id: 'custom',
                              titleFa: `بازه ${Math.min(val, customMaxYear)} تا ${Math.max(val, customMaxYear)}`,
                              minYear: Math.min(val, customMaxYear),
                              maxYear: Math.max(val, customMaxYear),
                              emoji: '📅',
                            },
                          }));
                        }}
                        className="w-full accent-amber-400 cursor-pointer"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between text-xs font-persian text-zinc-400 mb-1">
                        <span>تا سال ساخت:</span>
                        <span className="font-mono text-indigo-300">{customMaxYear}</span>
                      </div>
                      <input
                        type="range"
                        min="1950"
                        max="2026"
                        value={customMaxYear}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setCustomMaxYear(val);
                          setVibeAnswers((prev) => ({
                            ...prev,
                            yearRange: {
                              id: 'custom',
                              titleFa: `بازه ${Math.min(customMinYear, val)} تا ${Math.max(customMinYear, val)}`,
                              minYear: Math.min(customMinYear, val),
                              maxYear: Math.max(customMinYear, val),
                              emoji: '📅',
                            },
                          }));
                        }}
                        className="w-full accent-indigo-400 cursor-pointer"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Navigation Footer */}
              <div className="pt-4 border-t border-white/10 flex items-center justify-between">
                <button
                  type="button"
                  onClick={handlePrevStep}
                  className="tv-focusable flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white border border-white/10 text-xs font-persian transition-all"
                >
                  <ChevronRight className="w-4 h-4" />
                  <span>مرحله قبلی (تنظیمات محیطی)</span>
                </button>

                <button
                  type="button"
                  onClick={handleNextStep}
                  disabled={isLoading}
                  className="tv-focusable flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-indigo-600 hover:from-amber-400 hover:to-indigo-500 text-white font-bold text-xs font-persian shadow-lg shadow-indigo-500/25 transition-all hover:scale-102 active:scale-98 cursor-pointer"
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 animate-spin" />
                      <span>در حال استخراج ۱۰ فیلم اولیه...</span>
                    </div>
                  ) : (
                    <>
                      <span>دریافت ۱۰ فیلم جهت ارزیابی و کالیبراسیون</span>
                      <ChevronLeft className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : currentStep === 5 ? (
            /* ============================================================
               PHASE 3: Calibration Stage (۱۰ فیلم کاندید برای نمره‌دهی سلیقه)
               ============================================================ */
            <div>
              {/* Calibration Header Info Banner */}
              <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-indigo-950/40 via-purple-950/20 to-zinc-900/50 border border-indigo-500/25 flex flex-col md:flex-row items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Layers className="w-5 h-5 text-indigo-400" />
                    <h3 className="text-sm sm:text-base font-black text-white font-persian">
                      مرحله ارزیابی سلیقه: نمره‌دهی به ۱۰ فیلم منتخب
                    </h3>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-persian font-bold">
                      {ratedCountInCalibration} از ۱۰ فیلم نمره‌دهی شد
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400 font-persian leading-relaxed">
                    فیلم‌هایی که قبلاً دیده‌اید را نمره دهید (یا آن‌هایی که ندیده‌اید را رد کنید). سپس دکمه محاسبه نهایی را بزنید تا ۵ شاهکار بدون نقص تحویل بگیرید!
                  </p>
                </div>

                {/* Sub-Stage Filter Tabs (Stage 1: 1-5, Stage 2: 6-10, All: 10) */}
                <div className="flex items-center gap-2 shrink-0">
                  <div className="flex items-center bg-black/40 rounded-xl p-1 border border-white/10 text-xs font-persian">
                    <button
                      type="button"
                      onClick={() => setCalibrationSubStage('stage1')}
                      className={`px-3 py-1.5 rounded-lg transition-all ${
                        calibrationSubStage === 'stage1'
                          ? 'bg-indigo-600 text-white font-bold shadow'
                          : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      بخش ۱ (فیلم‌های ۱ تا ۵)
                    </button>
                    <button
                      type="button"
                      onClick={() => setCalibrationSubStage('stage2')}
                      className={`px-3 py-1.5 rounded-lg transition-all ${
                        calibrationSubStage === 'stage2'
                          ? 'bg-indigo-600 text-white font-bold shadow'
                          : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      بخش ۲ (فیلم‌های ۶ تا ۱۰)
                    </button>
                    <button
                      type="button"
                      onClick={() => setCalibrationSubStage('all')}
                      className={`px-2.5 py-1.5 rounded-lg transition-all ${
                        calibrationSubStage === 'all'
                          ? 'bg-indigo-600 text-white font-bold shadow'
                          : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      همه (۱۰ فیلم)
                    </button>
                  </div>
                </div>
              </div>

              {/* Action Bar before cards: Finalize trigger */}
              <div className="mb-4 flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-1.5 text-xs text-zinc-400 font-persian">
                  <Calendar className="w-3.5 h-3.5 text-amber-400" />
                  <span>بازه سال ساخت: </span>
                  <span className="text-zinc-200 font-bold font-mono">
                    {vibeAnswers.yearRange?.titleFa || 'همه سال‌ها'}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => fetchFinalRecommendations(vibeAnswers, userTaste)}
                  disabled={isLoading}
                  className="tv-focusable flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 via-rose-500 to-indigo-600 hover:from-amber-400 hover:to-indigo-500 text-white font-black text-xs font-persian shadow-lg shadow-indigo-500/20 transition-all cursor-pointer"
                >
                  <Award className="w-4 h-4 text-amber-200 animate-pulse" />
                  <span>محاسبه و کشف ۵ فیلم نهایی و اختصاصی من ✨</span>
                </button>
              </div>

              {/* Movie Cards Pool (Grid) */}
              {isLoading ? (
                <div className="py-24 flex flex-col items-center justify-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 border border-indigo-400/40 flex items-center justify-center text-indigo-400 animate-spin">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <span className="text-sm font-bold text-white font-persian">
                    در حال پردازش نمرات و اعمال فیلتر سال ساخت...
                  </span>
                </div>
              ) : visibleCalibrationMovies.length === 0 ? (
                <div className="py-16 text-center text-zinc-400 font-persian">
                  <p className="text-sm font-bold text-white mb-2">فیلمی در این بخش یافت نشد.</p>
                  <button
                    type="button"
                    onClick={() => fetchCalibrationPool(vibeAnswers, userTaste)}
                    className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-persian"
                  >
                    دریافت مجدد لیست ۱۰ فیلم
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                  {visibleCalibrationMovies.map((movie, index) => {
                    const globalIndex =
                      calibrationSubStage === 'stage2' ? index + 6 : index + 1;
                    return (
                      <div
                        key={movie.id}
                        className={`bg-white/[0.03] hover:bg-white/[0.05] border rounded-2xl p-3 flex flex-col justify-between transition-all duration-300 relative group ${
                          movie.isWatched
                            ? 'border-emerald-500/50 shadow-[0_0_20px_rgba(16,185,129,0.15)] bg-emerald-950/20'
                            : 'border-white/10 hover:border-white/20'
                        }`}
                      >
                        {/* Number Index Badge */}
                        <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-zinc-900 border border-white/20 text-zinc-300 font-mono text-[11px] font-bold flex items-center justify-center z-10 shadow">
                          {globalIndex}
                        </div>

                        {/* Top Poster */}
                        <div>
                          <div
                            onClick={() => {
                              onSelectMedia(movie);
                              onClose();
                            }}
                            className="aspect-[2/3] rounded-xl overflow-hidden mb-2.5 relative bg-zinc-900 cursor-pointer shadow-md"
                          >
                            <img
                              src={movie.posterUrl}
                              alt={movie.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              loading="lazy"
                            />

                            {/* Release Year Badge */}
                            <div className="absolute top-2 right-2 px-2 py-0.5 rounded-lg bg-black/80 backdrop-blur-md text-[10px] text-zinc-200 font-mono flex items-center gap-1 border border-white/10">
                              <Calendar className="w-2.5 h-2.5 text-amber-400" />
                              <span>{movie.releaseYear}</span>
                            </div>

                            {/* Rating Badge */}
                            <div className="absolute top-2 left-2 px-2 py-0.5 rounded-lg bg-black/80 backdrop-blur-md text-[10px] text-amber-300 font-mono flex items-center gap-1 border border-white/10">
                              <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                              <span>{movie.rating}</span>
                            </div>

                            {/* Watched Status Overlay Badge */}
                            {movie.isWatched && (
                              <div className="absolute inset-x-0 bottom-0 py-1 bg-emerald-600/90 backdrop-blur-sm text-white text-[11px] font-persian font-bold text-center flex items-center justify-center gap-1">
                                <Check className="w-3.5 h-3.5" />
                                <span>دیده‌ام (نمره: {movie.userRating}/۱۰)</span>
                              </div>
                            )}
                          </div>

                          {/* Titles */}
                          <div
                            onClick={() => {
                              onSelectMedia(movie);
                              onClose();
                            }}
                            className="cursor-pointer mb-1.5"
                          >
                            <h4 className="text-xs sm:text-sm font-bold text-white font-persian truncate group-hover:text-amber-200 transition-colors">
                              {movie.titleFa || movie.title}
                            </h4>
                            <p className="text-[10px] text-zinc-500 font-mono truncate">{movie.title}</p>
                          </div>

                          {/* Genres */}
                          <div className="flex items-center gap-1 flex-wrap mb-2">
                            {(movie.genres || []).slice(0, 2).map((g, idx) => (
                              <span
                                key={idx}
                                className="text-[9px] px-1.5 py-0.5 rounded-md bg-white/5 border border-white/10 text-zinc-300 font-persian"
                              >
                                {g}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Interactive Rating & Calibration Bar */}
                        <div className="pt-2 border-t border-white/10 flex flex-col gap-1.5">
                          {ratingTargetMovieId === movie.id ? (
                            /* 1-10 Rating Drawer */
                            <div className="p-2 rounded-xl bg-zinc-900 border border-indigo-500/50 shadow-xl">
                              <div className="flex items-center justify-between mb-1.5 text-[10px] font-persian text-zinc-300">
                                <span className="font-bold text-amber-300">نمره شما (۱ تا ۱۰):</span>
                                <button
                                  type="button"
                                  onClick={() => setRatingTargetMovieId(null)}
                                  className="text-zinc-500 hover:text-white"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                              <div className="grid grid-cols-5 gap-1">
                                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((val) => (
                                  <button
                                    key={val}
                                    type="button"
                                    onClick={() => handleRateMovie(movie, val)}
                                    className={`py-1 rounded text-[11px] font-mono font-bold transition-all cursor-pointer ${
                                      val >= 8
                                        ? 'bg-emerald-600/40 hover:bg-emerald-500 text-emerald-200 hover:text-white'
                                        : val >= 6
                                        ? 'bg-amber-600/40 hover:bg-amber-500 text-amber-200 hover:text-white'
                                        : 'bg-rose-600/40 hover:bg-rose-500 text-rose-200 hover:text-white'
                                    }`}
                                  >
                                    {val}
                                  </button>
                                ))}
                              </div>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setRatingTargetMovieId(movie.id)}
                              className={`tv-focusable w-full py-1.5 px-2 rounded-xl border text-[11px] font-persian flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                                movie.isWatched
                                  ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300 font-bold'
                                  : 'bg-white/5 hover:bg-white/10 border-white/10 text-zinc-300 hover:text-white'
                              }`}
                            >
                              <Star
                                className={`w-3.5 h-3.5 ${
                                  movie.isWatched
                                    ? 'fill-emerald-400 text-emerald-400'
                                    : 'text-amber-400'
                                }`}
                              />
                              <span>
                                {movie.isWatched
                                  ? `تغییر نمره (${movie.userRating})`
                                  : 'دیده‌ام (ثبت نمره ۱-۱۰)'}
                              </span>
                            </button>
                          )}

                          <div className="flex items-center gap-1">
                            {/* Watchlist toggle */}
                            <button
                              type="button"
                              onClick={() => handleToggleWatchlist(movie)}
                              className={`flex-1 py-1 px-1.5 rounded-lg border text-[10px] font-persian flex items-center justify-center gap-1 transition-all ${
                                movie.isSaved
                                  ? 'bg-indigo-600/30 border-indigo-400 text-indigo-200'
                                  : 'bg-white/5 hover:bg-white/10 border-white/5 text-zinc-400 hover:text-white'
                              }`}
                            >
                              {movie.isSaved ? (
                                <>
                                  <BookmarkCheck className="w-3 h-3 text-indigo-400" />
                                  <span>در لیست ✓</span>
                                </>
                              ) : (
                                <>
                                  <Plus className="w-3 h-3 text-zinc-400" />
                                  <span>ندیدم، ذخیره کن</span>
                                </>
                              )}
                            </button>

                            {/* Discard */}
                            <button
                              type="button"
                              onClick={() => handleDiscardMovie(movie)}
                              className="p-1.5 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-colors"
                              title="این سبک رو نمی‌خوام"
                            >
                              <ThumbsDown className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Bottom Flow Footer */}
              <div className="mt-8 pt-4 border-t border-white/10 flex items-center justify-between flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => setCurrentStep(4)}
                  className="tv-focusable flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white border border-white/10 text-xs font-persian transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                  <span>تغییر سال ساخت یا مود</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (calibrationSubStage === 'stage1') {
                        setCalibrationSubStage('stage2');
                      } else {
                        fetchFinalRecommendations(vibeAnswers, userTaste);
                      }
                    }}
                    className="tv-focusable flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-indigo-600 hover:from-amber-400 hover:to-indigo-500 text-white font-bold text-xs font-persian shadow-lg shadow-indigo-500/25 transition-all cursor-pointer"
                  >
                    <span>
                      {calibrationSubStage === 'stage1'
                        ? 'بررسی ۵ فیلم دوم (بخش ۲)'
                        : 'مشاهده ۵ فیلم نهایی و اختصاصی من'}
                    </span>
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* ============================================================
               PHASE 4: Final Results (۵ شاهکار نهایی دست‌چین‌شده)
               ============================================================ */
            <div>
              {/* Vibe Status and Refined Taste Bar */}
              <div className="mb-6 p-4 rounded-2xl bg-white/[0.03] border border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs text-zinc-400 font-persian flex items-center gap-1.5">
                    <Brain className="w-4 h-4 text-indigo-400" />
                    <span className="font-bold text-zinc-200">سلیقه کالیبره‌شده شما:</span>
                  </span>
                  {activeMoodSummary.map((m, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-zinc-200 font-persian flex items-center gap-1"
                    >
                      <span>{m.emoji}</span>
                      <span>{m.title}</span>
                    </span>
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(5)}
                    className="tv-focusable flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white border border-white/10 text-xs font-persian transition-colors"
                  >
                    <Layers className="w-3.5 h-3.5 text-zinc-400" />
                    <span>ویرایش نمرات ۱۰ فیلم قبلی</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleResetQuiz}
                    className="tv-focusable flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white border border-white/10 text-xs font-persian transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-zinc-400" />
                    <span>شروع مجدد کوئیز</span>
                  </button>
                </div>
              </div>

              {/* 5 Final Masterpieces Header */}
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-black text-white font-persian flex items-center gap-2">
                    <Award className="w-5 h-5 text-amber-400" />
                    <span>۵ فیلم برتر و پیشنهادی اختصاصی شما</span>
                  </h3>
                  <p className="text-xs text-zinc-400 font-persian mt-0.5">
                    این آثار بر پایه نمره‌هایی که ثبت کردید، سال ساخت انتخابی و هماهنگی کامل روحی گلچین شده‌اند.
                  </p>
                </div>
              </div>

              {/* The 5 Final Cards */}
              {isLoading ? (
                <div className="py-24 flex flex-col items-center justify-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 border border-indigo-400/40 flex items-center justify-center text-indigo-400 animate-spin">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <span className="text-sm font-bold text-white font-persian">
                    در حال محاسبه ۵ شاهکار نهایی...
                  </span>
                </div>
              ) : finalRecommendations.length === 0 ? (
                <div className="py-16 text-center text-zinc-400 font-persian">
                  <p className="text-sm font-bold text-white mb-2">
                    فیلمی با این ویژگی‌های محدود یافت نشد.
                  </p>
                  <button
                    type="button"
                    onClick={() => setCurrentStep(4)}
                    className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-persian"
                  >
                    تغییر سال ساخت
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                  {finalRecommendations.map((movie) => (
                    <div
                      key={movie.id}
                      className="bg-white/[0.03] hover:bg-white/[0.06] border border-white/15 hover:border-amber-400/40 rounded-2xl p-3.5 flex flex-col justify-between transition-all duration-300 relative group shadow-lg"
                    >
                      {/* Top Poster + Match Badge */}
                      <div>
                        <div
                          onClick={() => {
                            onSelectMedia(movie);
                            onClose();
                          }}
                          className="aspect-[2/3] rounded-xl overflow-hidden mb-3 relative bg-zinc-900 cursor-pointer shadow-md"
                        >
                          <img
                            src={movie.posterUrl}
                            alt={movie.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            loading="lazy"
                          />

                          {/* Glowing Match Badge */}
                          <div className="absolute top-2 right-2 px-2 py-0.5 rounded-lg bg-gradient-to-r from-amber-500/95 to-indigo-600/95 backdrop-blur-md text-[10px] text-white font-persian font-black shadow flex items-center gap-1 border border-white/20">
                            <Sparkles className="w-3 h-3 text-amber-200" />
                            <span>{movie.matchPercentage || 98}٪ تطابق</span>
                          </div>

                          {/* Rating Badge */}
                          <div className="absolute top-2 left-2 px-2 py-0.5 rounded-lg bg-black/80 backdrop-blur-md text-[10px] text-amber-300 font-mono flex items-center gap-1 border border-white/10">
                            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                            <span>{movie.rating}</span>
                          </div>

                          {/* Quick Play Hover Overlay */}
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <div className="p-3 rounded-full bg-indigo-600 text-white shadow-xl transform scale-90 group-hover:scale-100 transition-transform">
                              <Play className="w-5 h-5 fill-white" />
                            </div>
                          </div>
                        </div>

                        {/* Titles */}
                        <div
                          onClick={() => {
                            onSelectMedia(movie);
                            onClose();
                          }}
                          className="cursor-pointer mb-2"
                        >
                          <h4 className="text-sm font-bold text-white font-persian truncate group-hover:text-amber-200 transition-colors">
                            {movie.titleFa || movie.title}
                          </h4>
                          <p className="text-[10px] text-zinc-500 font-mono truncate">{movie.title}</p>
                        </div>

                        {/* Genres / Year */}
                        <div className="flex items-center gap-1 flex-wrap mb-2">
                          {(movie.genres || []).slice(0, 2).map((g, idx) => (
                            <span
                              key={idx}
                              className="text-[9px] px-1.5 py-0.5 rounded-md bg-white/5 border border-white/10 text-zinc-300 font-persian"
                            >
                              {g}
                            </span>
                          ))}
                          <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-indigo-500/15 border border-indigo-500/25 text-indigo-300 font-mono">
                            {movie.releaseYear}
                          </span>
                        </div>

                        {/* Recommendation Reason */}
                        {movie.vibeReason && (
                          <div className="p-2 rounded-xl bg-indigo-950/40 border border-indigo-500/20 text-[10px] text-indigo-200 font-persian mb-2.5 leading-relaxed flex items-start gap-1">
                            <Sparkles className="w-3 h-3 text-amber-300 shrink-0 mt-0.5" />
                            <span>{movie.vibeReason}</span>
                          </div>
                        )}

                        {/* Synopsis */}
                        <p className="text-[11px] text-zinc-400 font-persian leading-relaxed line-clamp-3 mb-3">
                          {movie.overviewFa || movie.overview}
                        </p>
                      </div>

                      {/* Action Buttons for Final Movies */}
                      <div className="pt-3 border-t border-white/10 flex flex-col gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            onSelectMedia(movie);
                            onClose();
                          }}
                          className="tv-focusable w-full py-2 px-3 rounded-xl bg-gradient-to-r from-amber-500 to-indigo-600 hover:from-amber-400 hover:to-indigo-500 text-white font-bold text-xs font-persian shadow flex items-center justify-center gap-1.5 cursor-pointer transition-transform hover:scale-102"
                        >
                          <Play className="w-3.5 h-3.5 fill-white" />
                          <span>پخش آنلاین و سرورها</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleToggleWatchlist(movie)}
                          className={`tv-focusable w-full py-1.5 px-2 rounded-xl border text-[11px] font-persian flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                            movie.isSaved
                              ? 'bg-indigo-600/30 border-indigo-400 text-indigo-200'
                              : 'bg-white/5 hover:bg-white/10 border-white/10 text-zinc-300 hover:text-white'
                          }`}
                        >
                          {movie.isSaved ? (
                            <>
                              <BookmarkCheck className="w-3.5 h-3.5 text-indigo-400" />
                              <span>در لیست تماشا ✓</span>
                            </>
                          ) : (
                            <>
                              <Plus className="w-3.5 h-3.5 text-zinc-400" />
                              <span>افزودن به لیست من</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Bottom Footer Info */}
        <div className="px-6 py-3 border-t border-white/10 bg-white/[0.02] flex items-center justify-between text-xs text-zinc-500 font-persian shrink-0">
          <span className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>الگوریتم فیلم‌شناس بر پایه بردار سلیقه، بازه سال ساخت و نمره‌دهی کالیبراسیون عمل می‌کند.</span>
          </span>
          <span className="text-[11px] text-zinc-400 font-mono hidden sm:inline">
            MMD FILM Smart Vibe & Calibration Engine v3.0
          </span>
        </div>
      </div>
    </div>
  );
};
