import React, { useState, useEffect, useRef } from 'react';
import { Star, CheckCircle, XCircle, Play, Film, Volume2, Subtitles, Loader2 } from 'lucide-react';
import { MediaItem, SourceAvailability } from '../types';
import { fetchSourceAvailability, clientAvailabilityCache, getAvailabilityCacheKey } from '../lib/availabilityCache';

interface MovieCardProps {
  item: MediaItem;
  onSelect: (item: MediaItem) => void;
  index: number;
  sliderKey?: string;
  isGrid?: boolean;
  className?: string;
}

export const MovieCard: React.FC<MovieCardProps> = ({
  item,
  onSelect,
  index,
  sliderKey = 'card',
  isGrid = false,
  className = '',
}) => {
  const [isInspecting, setIsInspecting] = useState<boolean>(false);
  const [availability, setAvailability] = useState<SourceAvailability[] | null>(null);
  const [isLoadingAvailability, setIsLoadingAvailability] = useState<boolean>(false);
  const [imgSrc, setImgSrc] = useState<string>(item.posterUrl || '');
  const [hasTriedProxy, setHasTriedProxy] = useState<boolean>(false);
  const [imgError, setImgError] = useState<boolean>(false);

  const debounceTimerRef = useRef<any>(null);
  const tvElementId = `movie-${sliderKey}-${item.id}`;

  useEffect(() => {
    setImgSrc(item.posterUrl || '');
    setHasTriedProxy(false);
    setImgError(false);
  }, [item.posterUrl, item.id]);

  const handleImageError = () => {
    if (!hasTriedProxy && imgSrc && !imgSrc.startsWith('/api/image-proxy')) {
      setHasTriedProxy(true);
      setImgSrc(`/api/image-proxy?url=${encodeURIComponent(imgSrc)}`);
    } else if (item.backdropUrl && imgSrc !== item.backdropUrl && !imgSrc.includes(encodeURIComponent(item.backdropUrl))) {
      setImgSrc(item.backdropUrl);
    } else {
      setImgError(true);
    }
  };

  /**
   * Hover / Focus Inspection with 120ms response time as required.
   * Checks shared client availability cache first.
   */
  const handleInspectStart = () => {
    setIsInspecting(true);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(async () => {
      const cacheKey = getAvailabilityCacheKey(item.title);

      if (clientAvailabilityCache.has(cacheKey)) {
        setAvailability(clientAvailabilityCache.get(cacheKey)!);
        return;
      }

      try {
        setIsLoadingAvailability(true);
        const sources = await fetchSourceAvailability(item.title);
        setAvailability(sources);
      } catch (err) {
        console.warn('Hover check failed:', err);
      } finally {
        setIsLoadingAvailability(false);
      }
    }, 120); // Fast 120ms response
  };

  const handleInspectEnd = () => {
    setIsInspecting(false);
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
  };

  useEffect(() => {
    const handleDismiss = () => {
      setIsInspecting(false);
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };

    window.addEventListener('dismiss-movie-hover', handleDismiss);
    return () => {
      window.removeEventListener('dismiss-movie-hover', handleDismiss);
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  return (
    <div
      className={
        isGrid
          ? `relative group w-full max-w-[240px] mx-auto transition-transform duration-300 hover:scale-[1.02] ${className}`
          : `relative group flex-shrink-0 w-48 sm:w-56 md:w-64 transition-transform duration-300 hover:scale-[1.02] ${className}`
      }
    >
      {/* Ambient Backdrop-Glow Depth - Strictly active on hover, no sticky focus-within hologram */}
      <div
        aria-hidden="true"
        className="absolute -inset-2 rounded-3xl bg-gradient-to-tr from-indigo-600/30 via-rose-600/25 to-amber-500/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none -z-10"
      />

      {/* Main Card Surface */}
      <div
        id={tvElementId}
        data-tv-id={tvElementId}
        tabIndex={0}
        onClick={(e) => {
          e.stopPropagation();
          onSelect(item);
        }}
        onMouseEnter={handleInspectStart}
        onMouseLeave={handleInspectEnd}
        onFocus={handleInspectStart}
        onBlur={handleInspectEnd}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            onSelect(item);
          }
        }}
        /* 
          LG webOS & Smart TV Compatibility:
          1. Explicit height fallback to avoid bare aspect-ratio collapse.
          2. .tv-focusable applies transform scale and clean focus glow.
        */
        className="tv-focusable relative w-full cursor-pointer rounded-2xl bg-[#090a12]/90 border border-white/10 group-hover:border-white/30 overflow-hidden shadow-2xl transition-all duration-300"
        style={{
          minHeight: '350px',
          height: '350px',
        }}
      >
        {/* Poster Media Box */}
        <div
          className="relative w-full overflow-hidden bg-zinc-950 media-card-poster"
          style={{ height: '240px', minHeight: '240px' }}
        >
          {!imgError && imgSrc ? (
            <img
              src={imgSrc}
              alt={item.titleFa || item.title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
              onError={handleImageError}
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-zinc-900 to-zinc-950 p-4 text-center">
              <Film className="w-12 h-12 text-zinc-700 mb-2" />
              <span className="text-xs text-zinc-400 font-persian font-bold">{item.titleFa}</span>
            </div>
          )}

          {/* Top Badges (Rating & Quality) */}
          <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between pointer-events-none z-10">
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-black/80 backdrop-blur-md border border-amber-500/30 text-amber-400 text-xs font-bold shadow-md">
              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
              <span>{item.rating}</span>
            </div>

            <div className="px-2 py-0.5 rounded-lg bg-indigo-600/90 text-white text-[10px] font-extrabold uppercase tracking-wider shadow-md">
              {item.type === 'tv' ? 'سریال' : 'سینمایی'}
            </div>
          </div>

          {/* Bottom Poster Gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#090a12] via-transparent to-black/30 pointer-events-none" />

          {/* Play Overlay Button */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 group-focus:opacity-100 transition-opacity duration-200 bg-black/40 backdrop-blur-[2px]">
            <div className="w-12 h-12 rounded-full bg-white text-black flex items-center justify-center shadow-[0_0_20px_rgba(255,255,255,0.6)] transform scale-90 group-hover:scale-100 transition-transform">
              <Play className="w-6 h-6 fill-black ml-0.5" />
            </div>
          </div>

          {/* Dynamic 120ms Hover/Focus Inspection Availability Overlay */}
          {isInspecting && (
            <div className="absolute inset-x-2 bottom-2 rounded-xl bg-black/90 backdrop-blur-md p-2 border border-zinc-700/80 shadow-2xl animate-in fade-in zoom-in-95 duration-150 z-20">
              <div className="flex items-center justify-between mb-1 pb-1 border-b border-zinc-800">
                <span className="text-[10px] font-bold text-zinc-300 font-persian">وضعیت منابع استریم</span>
                {isLoadingAvailability && <Loader2 className="w-2.5 h-2.5 text-indigo-400 animate-spin" />}
              </div>

              <div className="grid grid-cols-2 gap-1 text-[9px]">
                {availability ? (
                  availability.map((s) => (
                    <div
                      key={s.site}
                      className="flex items-center justify-between px-1.5 py-0.5 rounded bg-zinc-900/80 border border-zinc-800"
                    >
                      <span className="text-zinc-300 font-persian truncate max-w-[65px]">{s.nameFa}</span>
                      {s.available ? (
                        <CheckCircle className="w-3 h-3 text-emerald-400 shrink-0" />
                      ) : (
                        <XCircle className="w-3 h-3 text-zinc-600 shrink-0" />
                      )}
                    </div>
                  ))
                ) : (
                  <div className="col-span-2 py-1 text-center text-[10px] text-zinc-400 font-persian flex items-center justify-center gap-1">
                    <Loader2 className="w-3 h-3 animate-spin text-indigo-400" />
                    <span>بررسی سریع دسترسی...</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Card Metadata Section */}
        <div className="p-3 text-right flex flex-col justify-between" style={{ height: '110px' }}>
          <div>
            {/* Persian Primary Title */}
            <h3 className="text-sm font-bold text-zinc-100 font-persian line-clamp-1 group-hover:text-white transition-colors">
              {item.titleFa}
            </h3>

            {/* English / Original Title & Year */}
            <div className="flex items-center justify-between text-xs text-zinc-400 mt-1">
              <span className="font-medium text-zinc-500 text-[11px]">{item.releaseYear}</span>
              <span className="text-[11px] text-zinc-400 truncate max-w-[130px] font-sans">{item.title}</span>
            </div>
          </div>

          {/* Badges: Audio & Subtitle */}
          <div className="flex items-center justify-between pt-2 border-t border-white/5 text-[10px]">
            <div className="flex items-center gap-1.5">
              {item.hasDubbed && (
                <span className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-950/40 text-amber-300 border border-amber-800/40 font-persian">
                  <Volume2 className="w-2.5 h-2.5" />
                  دوبله
                </span>
              )}
              {item.hasSubbed && (
                <span className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-blue-950/40 text-blue-300 border border-blue-800/40 font-persian">
                  <Subtitles className="w-2.5 h-2.5" />
                  زیرنویس
                </span>
              )}
            </div>

            <span className="text-zinc-500 font-mono text-[10px]">{item.quality.split('/')[0]}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
