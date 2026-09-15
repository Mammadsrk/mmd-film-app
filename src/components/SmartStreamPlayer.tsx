import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  Loader2,
  RefreshCw,
  RotateCcw,
  AlertTriangle,
  ExternalLink,
  CheckCircle2,
  ChevronDown,
  ShieldCheck,
  Globe,
  Radio,
  Tv,
} from 'lucide-react';
import type { MediaItem } from '../types';

export interface StreamCandidate {
  id: string;
  name: string;
  label: string;
  type: 'iframe';
  url: string;
}

interface SmartStreamPlayerProps {
  item: MediaItem | null;
  isSeries?: boolean;
  seasonNumber?: number;
  episodeNumber?: number;
  onFallbackError?: () => void;
  className?: string;
  autoPlay?: boolean;
}

export const SmartStreamPlayer: React.FC<SmartStreamPlayerProps> = ({
  item,
  isSeries = false,
  seasonNumber = 1,
  episodeNumber = 1,
  onFallbackError,
  className = '',
}) => {
  // 1. Identify movie/series identifiers safely
  const resolvedIdentifiers = useMemo(() => {
    if (!item) return { tmdbId: null, imdbId: null };
    const rawTmdb = (item as any).tmdb_id || item.tmdbId || item.id;
    const rawImdb = (item as any).imdb_id || item.imdbId;

    const tmdbId =
      rawTmdb && String(rawTmdb) !== 'undefined' && String(rawTmdb) !== 'null' && String(rawTmdb).trim() !== ''
        ? String(rawTmdb).trim()
        : null;

    const imdbId =
      rawImdb && String(rawImdb) !== 'undefined' && String(rawImdb) !== 'null' && String(rawImdb).trim() !== ''
        ? String(rawImdb).trim()
        : null;

    return { tmdbId, imdbId };
  }, [item]);

  const targetId = resolvedIdentifiers.tmdbId || resolvedIdentifiers.imdbId;

  // 2. Define prioritized candidate streaming endpoints
  const candidates: StreamCandidate[] = useMemo(() => {
    if (!targetId) return [];

    if (isSeries) {
      return [
        {
          id: 'vidsrc_cc',
          name: 'سرور اصلی',
          label: 'سرور ۱',
          type: 'iframe',
          url: `https://vidsrc.cc/v2/embed/tv/${targetId}/${seasonNumber}/${episodeNumber}`,
        },
        {
          id: 'autoembed',
          name: 'سرور کمکی ۱',
          label: 'سرور ۲',
          type: 'iframe',
          url: `https://player.autoembed.cc/embed/tv/${targetId}/${seasonNumber}/${episodeNumber}`,
        },
        {
          id: 'multiembed',
          name: 'سرور کمکی ۲',
          label: 'سرور ۳',
          type: 'iframe',
          url: `https://multiembed.mov/?video_id=${targetId}&tmdb=1&s=${seasonNumber}&e=${episodeNumber}`,
        },
      ];
    }

    return [
      {
        id: 'vidsrc_cc',
        name: 'سرور اصلی',
        label: 'سرور ۱',
        type: 'iframe',
        url: `https://vidsrc.cc/v2/embed/movie/${targetId}`,
      },
      {
        id: 'autoembed',
        name: 'سرور کمکی ۱',
        label: 'سرور ۲',
        type: 'iframe',
        url: `https://player.autoembed.cc/embed/movie/${targetId}`,
      },
      {
        id: 'multiembed',
        name: 'سرور کمکی ۲',
        label: 'سرور ۳',
        type: 'iframe',
        url: `https://multiembed.mov/?video_id=${targetId}&tmdb=1`,
      },
    ];
  }, [targetId, isSeries, seasonNumber, episodeNumber]);

  // Player States
  const [currentCandidateIndex, setCurrentCandidateIndex] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [hasLoadedStream, setHasLoadedStream] = useState<boolean>(false);
  const [allCandidatesFailed, setAllCandidatesFailed] = useState<boolean>(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
  const [attemptsCount, setAttemptsCount] = useState<number>(0);

  const currentCandidate = candidates[currentCandidateIndex] || null;
  const watchdogTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Clear watchdog timer helper
  const clearWatchdog = useCallback(() => {
    if (watchdogTimerRef.current) {
      clearTimeout(watchdogTimerRef.current);
      watchdogTimerRef.current = null;
    }
  }, []);

  // Failover to next candidate in line
  const handleFailoverToNext = useCallback(() => {
    clearWatchdog();
    if (currentCandidateIndex + 1 < candidates.length) {
      const nextIndex = currentCandidateIndex + 1;
      setCurrentCandidateIndex(nextIndex);
      setIsLoading(true);
      setHasLoadedStream(false);
      setAttemptsCount((prev) => prev + 1);
    } else {
      // All candidates exhausted
      setIsLoading(false);
      setAllCandidatesFailed(true);
      if (onFallbackError) {
        onFallbackError();
      }
    }
  }, [currentCandidateIndex, candidates.length, clearWatchdog, onFallbackError]);

  // Restart from Candidate 1
  const handleRetryAll = useCallback(() => {
    clearWatchdog();
    setAllCandidatesFailed(false);
    setCurrentCandidateIndex(0);
    setIsLoading(true);
    setHasLoadedStream(false);
    setAttemptsCount((prev) => prev + 1);
  }, [clearWatchdog]);

  // Switch manually to specific candidate
  const handleSelectCandidate = (index: number) => {
    if (index === currentCandidateIndex) return;
    clearWatchdog();
    setCurrentCandidateIndex(index);
    setIsLoading(true);
    setHasLoadedStream(false);
    setIsDropdownOpen(false);
  };

  // Switch to the single backup server
  const handleSwitchToBackup = () => {
    handleFailoverToNext();
  };

  // When candidate or target changes, start 8-second watchdog timer
  useEffect(() => {
    if (!targetId || candidates.length === 0) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setHasLoadedStream(false);
    setAllCandidatesFailed(false);

    clearWatchdog();

    // 8-second watchdog timer:
    // If the stream doesn't successfully load or triggers an error within 8s,
    // automatically failover to candidate #2, then #3.
    watchdogTimerRef.current = setTimeout(() => {
      handleFailoverToNext();
    }, 8000);

    return () => {
      clearWatchdog();
    };
  }, [targetId, currentCandidateIndex, isSeries, seasonNumber, episodeNumber, clearWatchdog, handleFailoverToNext, candidates.length]);

  // When iframe fires onLoad
  const handleIframeLoad = () => {
    clearWatchdog();
    setIsLoading(false);
    setHasLoadedStream(true);
  };

  // When iframe fails
  const handleIframeError = () => {
    handleFailoverToNext();
  };

  // Case A: Missing TMDB / IMDB ID
  if (!targetId) {
    return (
      <div className={`relative w-full h-full min-h-[300px] flex flex-col items-center justify-center p-6 text-center select-none font-persian bg-zinc-950 rounded-2xl border border-zinc-800 ${className}`}>
        <div className="max-w-md w-full p-6 rounded-3xl bg-zinc-900/90 border border-zinc-800 shadow-2xl space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-white">شناسه بین‌المللی اثر یافت نشد</h3>
          <p className="text-xs text-zinc-400 leading-relaxed">
            در حال حاضر شناسه یکتای TMDB یا IMDb برای این عنوان ثبت نشده است.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col w-full h-full bg-black relative select-none font-persian ${className}`}>
      {/* 1. Video Player Container */}
      <div className="relative w-full flex-1 min-h-[300px] sm:min-h-[420px] bg-black overflow-hidden flex items-center justify-center">
        {/* Full Fallback Error Banner if all candidates exhausted */}
        {allCandidatesFailed ? (
          <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-zinc-950/95 animate-fadeIn">
            <div className="max-w-md w-full p-6 sm:p-8 rounded-3xl bg-zinc-900/90 border border-amber-500/30 shadow-2xl space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400">
                <AlertTriangle className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base sm:text-lg font-black text-white">
                  در حال حاضر سرور پخشی برای این فیلم در دسترس نیست
                </h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  تمامی سرورهای پخش بین‌المللی بررسی شدند اما پاسخی دریافت نشد. می‌توانید دوباره امتحان کنید یا از بخش آپارات / مراجع دانلود استفاده نمایید.
                </p>
              </div>

              <div className="pt-2 flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={handleRetryAll}
                  className="tv-focusable py-2.5 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-lg"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>تلاش مجدد از سرور اول</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* The Unified Video Iframe */}
            {currentCandidate && (
              <iframe
                key={`${currentCandidate.url}-${attemptsCount}`}
                src={currentCandidate.url}
                title={`پخش ${currentCandidate.name}`}
                allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
                allowFullScreen
                sandbox="allow-scripts allow-same-origin allow-forms allow-presentation"
                referrerPolicy="origin"
                className="w-full h-full border-0 absolute inset-0 z-10"
                style={{ width: '100%', height: '100%', border: 'none' }}
                onLoad={handleIframeLoad}
                onError={handleIframeError}
              />
            )}

            {/* Initial & Transitional Loader Overlay */}
            {isLoading && (
              <div className="absolute inset-0 z-30 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center animate-fadeIn">
                <div className="relative mb-5">
                  <div className="w-16 h-16 rounded-full border-4 border-indigo-500/20 border-t-indigo-500 animate-spin" />
                  <div className="absolute inset-0 flex items-center justify-center text-indigo-400">
                    <Globe className="w-6 h-6 animate-pulse" />
                  </div>
                </div>

                <h3 className="text-base font-black text-white tracking-wide">
                  درحال جستجو و اتصال به پایدارترین سرور...
                </h3>
                <p className="text-xs text-zinc-400 mt-2">
                  در حال اتصال به {currentCandidate?.name || 'سرور پخش'}...
                </p>

                {/* Direct quick bypass to next server if user doesn't want to wait 8s */}
                {candidates.length > 1 && currentCandidateIndex + 1 < candidates.length && (
                  <button
                    type="button"
                    onClick={handleFailoverToNext}
                    className="mt-5 py-1.5 px-3.5 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 hover:text-white border border-zinc-700/80 text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>عبور به سرور بعدی</span>
                  </button>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* 2. Subtle Control Bar Below the Player */}
      {!allCandidatesFailed && (
        <div className="w-full bg-zinc-950/95 border-t border-zinc-800/80 px-4 py-2.5 flex items-center justify-between gap-3 flex-wrap">
          {/* Right: Active Server Status Pill */}
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 text-xs text-zinc-300 font-bold">
              <span
                className={`w-2 h-2 rounded-full ${
                  hasLoadedStream ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.7)] animate-pulse' : 'bg-amber-400'
                }`}
              />
              <span>{currentCandidate?.name || 'سرور پخش'}</span>
            </span>

            {hasLoadedStream && (
              <span className="text-[11px] text-emerald-400/90 font-medium px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                <span>متصل و پایدار</span>
              </span>
            )}
          </div>

          {/* Left/Center: Single Backup Server Switcher or Dropdown Toggle */}
          <div className="flex items-center gap-2">
            {/* Subtle Dropdown/Toggle for Servers (Enabled once streams resolved or ready) */}
            <div className="relative">
              <button
                type="button"
                disabled={isLoading}
                onClick={() => setIsDropdownOpen((prev) => !prev)}
                className="tv-focusable px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 disabled:opacity-50 text-zinc-200 border border-zinc-700/80 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                title="تغییر سرور پخش"
              >
                <span>تغییر سرور ({candidates.map((c) => c.label).join(' / ')})</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {isDropdownOpen && (
                <div className="absolute left-0 bottom-full mb-2 w-48 rounded-2xl bg-zinc-900 border border-zinc-700 shadow-2xl p-1.5 z-50 animate-fadeIn">
                  <div className="px-2 py-1 text-[10px] font-bold text-zinc-400 border-b border-zinc-800 mb-1">
                    سرورهای پشتیبان:
                  </div>
                  {candidates.map((candidate, idx) => {
                    const isSelected = idx === currentCandidateIndex;
                    return (
                      <button
                        key={candidate.id}
                        type="button"
                        onClick={() => handleSelectCandidate(idx)}
                        className={`w-full text-right px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-between transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-indigo-600 text-white'
                            : 'text-zinc-300 hover:bg-zinc-800 hover:text-white'
                        }`}
                      >
                        <div className="flex items-center gap-1.5">
                          <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white' : 'bg-zinc-500'}`} />
                          <span>{candidate.name}</span>
                        </div>
                        <span className="text-[10px] opacity-75 font-mono">({candidate.label})</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* ONE verified backup button: "تغییر به سرور کمکی" */}
            {candidates.length > 1 && (
              <button
                type="button"
                disabled={isLoading}
                onClick={handleSwitchToBackup}
                className="tv-focusable px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 disabled:opacity-50 text-amber-300 border border-amber-500/40 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                title="در صورت بروز هرگونه مشکل یا قطعی تصویر، به سرور کمکی تغییر دهید"
              >
                <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                <span>تغییر به سرور کمکی</span>
              </button>
            )}

            {/* Fullscreen breakout tab option */}
            {currentCandidate && (
              <a
                href={currentCandidate.url}
                target="_blank"
                rel="noreferrer"
                className="tv-focusable px-2.5 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white text-xs border border-zinc-800 transition-all flex items-center gap-1 cursor-pointer"
                title="باز کردن در صفحه جداگانه مرورگر"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
