import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Film,
  Star,
  Calendar,
  Clock,
  Bookmark,
  Share2,
  Check,
  ChevronDown,
  MonitorPlay,
  Copy,
  ExternalLink,
  Layers,
  Sparkles,
} from 'lucide-react';
import { MediaItem, MovieDetailsData, AparatFullMovie } from '../../types';

interface VODHeroProps {
  item: MediaItem;
  details: MovieDetailsData | null;
  fullMovie: AparatFullMovie | null;
  isSeriesMode: boolean;
  isPlayingVideo: boolean;
  onPlayPrimary: () => void;
  onPlayTrailer: () => void;
  onOpenGlobal: () => void;
  onShare: () => void;
  copiedLink: boolean;
  onCopyStreamLink: (url: string) => void;
  copiedStreamUrl: string | null;
}

export const VODHero: React.FC<VODHeroProps> = ({
  item,
  details,
  fullMovie,
  isSeriesMode,
  isPlayingVideo,
  onPlayPrimary,
  onPlayTrailer,
  onOpenGlobal,
  onShare,
  copiedLink,
  onCopyStreamLink,
  copiedStreamUrl,
}) => {
  const [isCopyMenuOpen, setIsCopyMenuOpen] = useState<boolean>(false);
  const [isBookmarked, setIsBookmarked] = useState<boolean>(false);
  const copyMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (copyMenuRef.current && !copyMenuRef.current.contains(e.target as Node)) {
        setIsCopyMenuOpen(false);
      }
    };
    if (isCopyMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isCopyMenuOpen]);

  const titleFa = details?.titleFa || item.titleFa || item.title;
  const titleEn = details?.title || item.title;
  const rating = details?.rating || item.rating || '7.5';
  const year = details?.releaseYear || item.releaseYear || '2024';
  const runtime = details?.runtime || (isSeriesMode ? `${details?.totalSeasons || 1} فصل` : '۱۲۰ دقیقه');
  const overview = details?.overviewFa || item.overviewFa || details?.overview || item.overview || '';
  const backdrop = details?.backdropUrl || item.backdropUrl || details?.posterUrl || item.posterUrl;
  const poster = details?.posterUrl || item.posterUrl;

  const isDubbed = fullMovie?.isDubbed ?? (item.isDubbed || false);
  const isSubbed = fullMovie?.isSubbed ?? (item.isSubbed || false);
  const availableQualities = fullMovie?.qualities || [];
  const primaryStreamLink = availableQualities[0]?.url || fullMovie?.hlsStreamUrl || item.sourceUrl || '';

  return (
    <div className="relative w-full overflow-hidden bg-gradient-to-b from-[#0e1017]/90 via-[#0a0b10] to-[#08090d] border-b border-white/5">
      {/* Background Cinematic Art with Smooth Vignette */}
      <div className="absolute inset-0 pointer-events-none select-none overflow-hidden">
        {backdrop && (
          <img
            src={backdrop}
            alt=""
            className="w-full h-full object-cover object-center opacity-25 filter blur-xl scale-110 transition-opacity duration-700"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#08090d] via-[#08090d]/75 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#08090d] via-transparent to-[#08090d]/80" />
      </div>

      {/* Hero Content Container */}
      <div className="relative z-10 px-5 sm:px-8 pt-12 pb-6 sm:pt-14 sm:pb-8 flex flex-col sm:flex-row items-center sm:items-start gap-5 sm:gap-7">
        {/* Sleek Poster Thumbnail */}
        {poster && (
          <div className="relative shrink-0 w-28 sm:w-36 md:w-40 aspect-[2/3] rounded-2xl overflow-hidden shadow-2xl border border-white/10 hidden sm:block">
            <img
              src={poster}
              alt={titleFa}
              className="w-full h-full object-cover"
              loading="lazy"
            />
            {isDubbed && (
              <span className="absolute bottom-2 inset-x-2 text-center text-[10px] font-bold py-1 bg-amber-500/90 text-black rounded-lg backdrop-blur-md">
                دوبله فارسی
              </span>
            )}
          </div>
        )}

        {/* Text & Primary Actions */}
        <div className="flex-1 w-full text-center sm:text-right">
          {/* Metadata Row: Rating, Year, Runtime, Genres */}
          <div className="flex items-center justify-center sm:justify-start flex-wrap gap-2 text-xs text-zinc-300 mb-2.5">
            {/* Rating */}
            <span className="inline-flex items-center gap-1 font-bold px-2 py-0.5 rounded-md bg-amber-500/15 border border-amber-500/30 text-amber-300">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              <span>{rating}</span>
            </span>

            {/* Year */}
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-zinc-800/60 border border-zinc-700/40 text-zinc-300">
              <Calendar className="w-3 h-3 text-zinc-400" />
              <span>{year}</span>
            </span>

            {/* Runtime / Seasons */}
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-zinc-800/60 border border-zinc-700/40 text-zinc-300">
              <Clock className="w-3 h-3 text-zinc-400" />
              <span>{runtime}</span>
            </span>

            {/* Audio Type */}
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/15 border border-emerald-500/30 text-emerald-300">
              <Bookmark className="w-3 h-3 text-emerald-400" />
              <span>{isDubbed ? 'دوبله فارسی' : isSubbed ? 'زیرنویس فارسی' : 'زبان اصلی'}</span>
            </span>

            {/* Genres */}
            {(details?.genres || item.genres || []).slice(0, 2).map((genre) => (
              <span
                key={genre}
                className="hidden md:inline-flex px-2 py-0.5 rounded-md bg-zinc-800/40 text-zinc-400 border border-zinc-800 text-[11px]"
              >
                {genre}
              </span>
            ))}
          </div>

          {/* Titles */}
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight leading-snug">
            {titleFa}
          </h1>
          {titleEn && titleEn !== titleFa && (
            <p className="text-xs sm:text-sm text-zinc-400 font-sans tracking-wide mt-0.5">
              {titleEn}
            </p>
          )}

          {/* Short Synopsis (2-3 lines max, elegant) */}
          {overview && (
            <p className="text-xs sm:text-sm text-zinc-300/90 leading-relaxed line-clamp-2 max-w-2xl mt-3 mx-auto sm:mx-0">
              {overview}
            </p>
          )}

          {/* Streamlined Action Button Bar (Max 3 clean controls) */}
          <div className="flex items-center justify-center sm:justify-start flex-wrap gap-2.5 mt-5">
            {/* Primary Action Button: Play Now */}
            <button
              type="button"
              onClick={onPlayPrimary}
              data-tv-id="modal-play-primary"
              className="tv-focusable px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-extrabold text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-amber-500/20 hover:scale-102 active:scale-95 transition-all cursor-pointer"
            >
              <Play className="w-4 h-4 fill-black" />
              <span>{isSeriesMode ? 'پخش آنلاین سریال' : 'پخش آنلاین فیلم'}</span>
            </button>

            {/* Secondary Action: Trailer */}
            <button
              type="button"
              onClick={onPlayTrailer}
              data-tv-id="modal-play-trailer"
              className="tv-focusable px-4 py-2.5 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 text-zinc-200 hover:text-white font-medium text-xs sm:text-sm border border-zinc-700/60 flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Film className="w-4 h-4 text-zinc-400" />
              <span>تریلر</span>
            </button>

            {/* Global Server Quick Pill */}
            <button
              type="button"
              onClick={onOpenGlobal}
              data-tv-id="modal-open-global"
              className="tv-focusable px-3.5 py-2.5 rounded-xl bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-300 border border-indigo-500/30 font-medium text-xs flex items-center gap-1.5 transition-all cursor-pointer"
              title="پخش از سرور جهانی (Global CDN)"
            >
              <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
              <span>سرور جهانی</span>
            </button>

            {/* Copy Stream Link Dropdown Menu */}
            {(availableQualities.length > 0 || primaryStreamLink) && (
              <div className="relative" ref={copyMenuRef}>
                <button
                  type="button"
                  onClick={() => setIsCopyMenuOpen(!isCopyMenuOpen)}
                  data-tv-id="modal-copy-menu-btn"
                  className="tv-focusable px-3 py-2.5 rounded-xl bg-zinc-900/80 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                  title="کپی لینک پخش برای پلیرهای خارجی (VLC، PotPlayer)"
                >
                  <Copy className="w-3.5 h-3.5 text-amber-400" />
                  <span>کپی لینک پخش</span>
                  <ChevronDown className={`w-3.5 h-3.5 text-zinc-400 transition-transform ${isCopyMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {isCopyMenuOpen && (
                  <div
                    className="absolute left-0 sm:right-0 mt-2 w-64 bg-zinc-900/95 border border-zinc-700/80 rounded-2xl shadow-2xl p-2 z-50 animate-scale-up space-y-1.5 backdrop-blur-xl"
                    onClick={(e) => e.stopPropagation()}
                    dir="rtl"
                  >
                    <div className="px-2.5 py-1.5 border-b border-zinc-800">
                      <span className="text-[11px] font-bold text-zinc-300 block">انتخاب کیفیت جهت کپی لینک:</span>
                      <span className="text-[9px] text-zinc-500">جهت پخش دستی در VLC، PotPlayer یا دانلودر</span>
                    </div>

                    {availableQualities.length > 0 ? (
                      <div className="max-h-56 overflow-y-auto space-y-1 custom-scrollbar pr-0.5">
                        {availableQualities.map((q, idx) => {
                          const isCopied = copiedStreamUrl === q.url;
                          const cleanQualityText = q.text.replace(/^با\s+/, '');
                          return (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => {
                                onCopyStreamLink(q.url);
                              }}
                              className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs transition-all text-right cursor-pointer ${
                                isCopied
                                  ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-500/40'
                                  : 'hover:bg-zinc-800 text-zinc-300 hover:text-white'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-amber-400/80" />
                                <span className="font-bold text-[11px]">{cleanQualityText}</span>
                                {q.size && (
                                  <span className="text-[10px] text-zinc-500 font-mono">({q.size})</span>
                                )}
                              </div>
                              <span className="flex items-center gap-1 text-[10px] text-zinc-400">
                                {isCopied ? (
                                  <>
                                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                                    <span className="text-emerald-400 font-bold">کپی شد!</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy className="w-3 h-3 text-zinc-500" />
                                    <span>کپی</span>
                                  </>
                                )}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      primaryStreamLink && (
                        <button
                          type="button"
                          onClick={() => onCopyStreamLink(primaryStreamLink)}
                          className="w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs hover:bg-zinc-800 text-zinc-300 hover:text-white transition-all text-right cursor-pointer"
                        >
                          <span className="font-bold text-[11px]">لینک مستقیم استریم</span>
                          <span className="flex items-center gap-1 text-[10px] text-zinc-400">
                            {copiedStreamUrl === primaryStreamLink ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                                <span className="text-emerald-400 font-bold">کپی شد!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3 text-zinc-500" />
                                <span>کپی</span>
                              </>
                            )}
                          </span>
                        </button>
                      )
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Bookmark Pill */}
            <button
              type="button"
              onClick={() => setIsBookmarked(!isBookmarked)}
              data-tv-id="modal-bookmark-btn"
              className={`tv-focusable p-2.5 rounded-xl border transition-all cursor-pointer ${
                isBookmarked
                  ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                  : 'bg-zinc-900/80 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border-zinc-800'
              }`}
              title="نشان‌کردن فیلم"
            >
              <Bookmark className="w-4 h-4" />
            </button>

            {/* Share Pill */}
            <button
              type="button"
              onClick={onShare}
              data-tv-id="modal-share-hero-btn"
              className="tv-focusable p-2.5 rounded-xl bg-zinc-900/80 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-zinc-800 transition-all cursor-pointer"
              title="اشتراک‌گذاری"
            >
              {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
