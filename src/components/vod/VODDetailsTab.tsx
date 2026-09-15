import React, { useState } from 'react';
import {
  Users,
  Calendar,
  Clock,
  Sparkles,
  ExternalLink,
  ChevronDown,
  Film,
  Award,
} from 'lucide-react';
import { MediaItem, MovieDetailsData } from '../../types';

interface VODDetailsTabProps {
  item: MediaItem;
  details: MovieDetailsData | null;
  isSeriesMode: boolean;
}

export const VODDetailsTab: React.FC<VODDetailsTabProps> = ({
  item,
  details,
  isSeriesMode,
}) => {
  const [showEnglishSynopsis, setShowEnglishSynopsis] = useState<boolean>(false);

  const overviewFa = details?.overviewFa || item.overviewFa || details?.overview || item.overview || 'اطلاعات داستانی ثبت نشده است.';
  const overviewEn = details?.overview || item.overview;
  const director = details?.director || 'سینمای بین‌الملل';
  const cast = details?.cast || ['هنرمندان برجسته'];
  const genres = details?.genres || item.genres || [];
  const year = details?.releaseYear || item.releaseYear || '2024';
  const runtime = details?.runtime || (isSeriesMode ? 'مجموعه تلویزیونی' : '۱۲۰ دقیقه');

  return (
    <div className="space-y-6">
      {/* 2-Column Responsive Layout: Synopsis on Right, Specs on Left */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Main Synopsis (2 cols on md+) */}
        <div className="md:col-span-2 space-y-4">
          <div className="p-4 sm:p-5 rounded-2xl bg-zinc-900/50 border border-zinc-800/80 space-y-3">
            <div className="flex items-center justify-between border-b border-zinc-800/80 pb-2.5">
              <h3 className="text-xs sm:text-sm font-bold text-zinc-100 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>خلاصه داستان:</span>
              </h3>
              {overviewEn && overviewEn !== overviewFa && (
                <button
                  type="button"
                  onClick={() => setShowEnglishSynopsis(!showEnglishSynopsis)}
                  className="text-[11px] text-zinc-400 hover:text-zinc-200 flex items-center gap-1 font-mono transition-colors cursor-pointer"
                >
                  <span>{showEnglishSynopsis ? 'مخفی‌سازی متن انگلیسی' : 'متن انگلیسی'}</span>
                  <ChevronDown className={`w-3 h-3 transition-transform ${showEnglishSynopsis ? 'rotate-180' : ''}`} />
                </button>
              )}
            </div>

            <p className="text-xs sm:text-sm text-zinc-200 leading-relaxed font-persian">
              {overviewFa}
            </p>

            {showEnglishSynopsis && overviewEn && (
              <div className="mt-3 pt-3 border-t border-zinc-800 text-left bg-zinc-950/60 p-3 rounded-xl" dir="ltr">
                <span className="text-[10px] text-zinc-500 font-mono block mb-1">English Synopsis:</span>
                <p className="text-xs text-zinc-400 leading-relaxed font-sans">
                  {overviewEn}
                </p>
              </div>
            )}
          </div>

          {/* Cast Chips */}
          {cast && cast.length > 0 && (
            <div className="p-4 sm:p-5 rounded-2xl bg-zinc-900/50 border border-zinc-800/80 space-y-2.5">
              <h3 className="text-xs font-bold text-zinc-300 flex items-center gap-2">
                <Users className="w-3.5 h-3.5 text-zinc-400" />
                <span>بازیگران اصلی:</span>
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {cast.map((actor, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 rounded-lg bg-zinc-800/80 text-zinc-300 text-xs border border-zinc-700/50 font-medium"
                  >
                    {actor}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Technical Specs & Credits (1 col) */}
        <div className="space-y-4">
          <div className="p-4 sm:p-5 rounded-2xl bg-zinc-900/50 border border-zinc-800/80 space-y-3.5 text-xs">
            {/* Director */}
            <div>
              <span className="text-[11px] text-zinc-500 block mb-1">
                {isSeriesMode ? 'سازنده / کارگردان:' : 'کارگردان:'}
              </span>
              <span className="font-bold text-zinc-200 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-blue-400" />
                <span>{director}</span>
              </span>
            </div>

            {/* Year & Format */}
            <div className="pt-2 border-t border-zinc-800/60">
              <span className="text-[11px] text-zinc-500 block mb-1">سال انتشار و مدت:</span>
              <span className="font-bold text-zinc-200 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                <span>{year} • {runtime}</span>
              </span>
            </div>

            {/* Genres */}
            {genres.length > 0 && (
              <div className="pt-2 border-t border-zinc-800/60">
                <span className="text-[11px] text-zinc-500 block mb-1.5">ژانرها:</span>
                <div className="flex flex-wrap gap-1">
                  {genres.map((g) => (
                    <span
                      key={g}
                      className="px-2 py-0.5 rounded-md bg-zinc-800 text-zinc-300 text-[11px] border border-zinc-700/60"
                    >
                      {g}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* External Links */}
            <div className="pt-3 border-t border-zinc-800/60 space-y-1.5">
              {details?.imdbUrl && (
                <a
                  href={details.imdbUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="tv-focusable w-full py-1.5 px-2.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-[11px] font-bold border border-amber-500/30 flex items-center justify-between transition-colors cursor-pointer"
                >
                  <span>صفحه در IMDb</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
              {details?.tmdbUrl && (
                <a
                  href={details.tmdbUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="tv-focusable w-full py-1.5 px-2.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 text-[11px] font-bold border border-blue-500/30 flex items-center justify-between transition-colors cursor-pointer"
                >
                  <span>صفحه در TMDB</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
