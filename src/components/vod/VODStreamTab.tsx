import React, { useState } from 'react';
import {
  Play,
  Download,
  Tv,
  Globe,
  Clock,
  ExternalLink,
  Search,
  RefreshCw,
  Layers,
  ChevronLeft,
  ChevronRight,
  Copy,
  Check,
} from 'lucide-react';
import {
  MediaItem,
  MovieDetailsData,
  AparatFullMovie,
  AparatQuality,
  AparatSeriesData,
  AparatSeason,
  AparatEpisode,
} from '../../types';
import { SmartStreamPlayer } from '../SmartStreamPlayer';
import { DirectDownloadsSection } from './DirectDownloadsSection';

interface VODStreamTabProps {
  item: MediaItem;
  details: MovieDetailsData | null;
  fullMovie: AparatFullMovie | null;
  seriesData: AparatSeriesData | null;
  isSeriesMode: boolean;
  selectedSeasonNumber: number;
  onSelectSeason: (seasonNumber: number) => void;
  onPlayEpisode: (episode: AparatEpisode) => void;
  onPlayQuality: (quality: AparatQuality) => void;
  onPlayGlobal: () => void;
  activeEpisodeNumber?: number;
  isSearchingAparat: boolean;
  customAparatQuery: string;
  onSearchAparatChange: (val: string) => void;
  onSearchAparatSubmit: (e: React.FormEvent) => void;
  onCopyStreamLink?: (url: string) => void;
  copiedStreamUrl?: string | null;
  alternateResults?: any[];
  onSelectAlternate?: (item: any) => void;
  searchError?: string | null;
}

export const VODStreamTab: React.FC<VODStreamTabProps> = ({
  item,
  details,
  fullMovie,
  seriesData,
  isSeriesMode,
  selectedSeasonNumber,
  onSelectSeason,
  onPlayEpisode,
  onPlayQuality,
  onPlayGlobal,
  activeEpisodeNumber,
  isSearchingAparat,
  customAparatQuery,
  onSearchAparatChange,
  onSearchAparatSubmit,
  onCopyStreamLink,
  copiedStreamUrl,
  alternateResults = [],
  onSelectAlternate,
  searchError,
}) => {
  const [streamSourceTab, setStreamSourceTab] = useState<'iran' | 'global'>('iran');

  // Seasons and Episodes for series mode
  const currentSeason = seriesData?.seasons?.find(
    (s) => s.seasonNumber === selectedSeasonNumber
  ) || seriesData?.seasons?.[0];

  return (
    <div className="space-y-6">
      {/* Stream Source Selector (Minimal Segment Control) */}
      <div className="flex items-center justify-between border-b border-zinc-800 pb-3 flex-wrap gap-3">
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-zinc-900 border border-zinc-800">
          <button
            type="button"
            onClick={() => setStreamSourceTab('iran')}
            className={`tv-focusable px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              streamSourceTab === 'iran'
                ? 'bg-amber-400 text-black shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Tv className="w-3.5 h-3.5" />
            <span>سرور ایران (نیم‌بها)</span>
          </button>

          <button
            type="button"
            onClick={() => setStreamSourceTab('global')}
            className={`tv-focusable px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              streamSourceTab === 'global'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>سرور جهانی (Global CDN)</span>
          </button>
        </div>

        {/* Status indicator */}
        <span className="text-[11px] text-zinc-400 hidden sm:flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>پخش با حداکثر سرعت و رزولوشن اصلی</span>
        </span>
      </div>

      {/* VIEW A: GLOBAL STREAMING (Automated Smart Resolver) */}
      {streamSourceTab === 'global' && (
        <div className="space-y-3">
          <div className="rounded-2xl overflow-hidden border border-zinc-800 bg-zinc-950 shadow-2xl">
            <SmartStreamPlayer
              item={item}
              isSeries={isSeriesMode}
              seasonNumber={selectedSeasonNumber || 1}
              episodeNumber={activeEpisodeNumber || 1}
            />
          </div>
        </div>
      )}

      {/* VIEW B & C: IRAN SERVER (STREAM & SEARCH) */}
      {streamSourceTab === 'iran' && (
        <div className="space-y-4">
          {/* Aparat Search Capsule - Always Accessible */}
          <div className="p-3.5 rounded-2xl bg-zinc-900/80 border border-zinc-800 focus-within:border-amber-400/70 transition-all space-y-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-bold text-zinc-400 flex items-center gap-1.5">
                <Search className="w-3.5 h-3.5 text-amber-400" />
                <span>جستجوی مستقیم در آپارات (فیلم، سریال، نسخه دوبله یا زیرنویس):</span>
              </span>
              {fullMovie?.provider && (
                <span className="text-[10px] px-2 py-0.5 rounded-md bg-amber-400/10 text-amber-400 font-bold border border-amber-400/20">
                  {fullMovie.providerNameFa || 'آپارات'}
                </span>
              )}
            </div>

            <form onSubmit={onSearchAparatSubmit} className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-zinc-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={customAparatQuery}
                  onChange={(e) => onSearchAparatChange(e.target.value)}
                  placeholder="عنوان فیلم یا سریال را برای جستجو در آپارات بنویسید..."
                  className="w-full bg-zinc-950/80 border border-zinc-800 focus:border-amber-400 rounded-xl pr-9 pl-3 py-2 text-xs text-white placeholder-zinc-500 outline-none transition-all"
                />
              </div>
              <button
                type="submit"
                disabled={isSearchingAparat}
                className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 disabled:opacity-50 text-black text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm shrink-0"
              >
                {isSearchingAparat ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Search className="w-3.5 h-3.5" />
                )}
                <span>جستجو</span>
              </button>
            </form>

            {searchError && (
              <p className="text-[11px] text-rose-400 font-medium pt-1">
                {searchError}
              </p>
            )}
          </div>

          {/* Loading Indicator */}
          {isSearchingAparat && (
            <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800 flex items-center justify-center gap-3">
              <RefreshCw className="w-4 h-4 text-amber-400 animate-spin" />
              <span className="text-xs font-bold text-zinc-200">
                در حال جستجو در سرورهای آپارات...
              </span>
            </div>
          )}

          {/* SERIES EPISODES LIST (IF SERIES MODE) */}
          {isSeriesMode && seriesData?.seasons && seriesData.seasons.length > 0 && !isSearchingAparat && (
            <div className="space-y-4">
              {/* Season Selector */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-zinc-400 block">انتخاب فصل:</span>
                <div className="flex items-center gap-2 overflow-x-auto pb-2 custom-scrollbar">
                  {seriesData.seasons.map((season) => (
                    <button
                      key={season.seasonNumber}
                      type="button"
                      onClick={() => onSelectSeason(season.seasonNumber)}
                      className={`tv-focusable px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                        selectedSeasonNumber === season.seasonNumber
                          ? 'bg-amber-400 text-black shadow-md'
                          : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800'
                      }`}
                    >
                      <span>فصل {season.seasonNumber}</span>
                      <span className="mr-1.5 opacity-80 text-[10px]">
                        ({season.episodes?.length || 0} قسمت)
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Episodes List */}
              {currentSeason && currentSeason.episodes?.length > 0 && (
                <div className="space-y-2">
                  <span className="text-xs font-bold text-zinc-400 block">
                    قسمت‌های فصل {currentSeason.seasonNumber}:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 max-h-[380px] overflow-y-auto pr-1 custom-scrollbar">
                    {currentSeason.episodes.map((ep) => {
                      const isActive = activeEpisodeNumber === ep.episodeNumber;
                      return (
                        <div
                          key={`${ep.seasonNumber}-${ep.episodeNumber}`}
                          className={`p-3 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                            isActive
                              ? 'bg-amber-500/15 border-amber-500/50 shadow-md'
                              : 'bg-zinc-900/60 hover:bg-zinc-800/80 border-zinc-800'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 overflow-hidden">
                            <span className="w-8 h-8 rounded-lg bg-zinc-800 border border-zinc-700/60 text-amber-400 text-xs font-mono font-bold flex items-center justify-center shrink-0">
                              {String(ep.episodeNumber).padStart(2, '0')}
                            </span>
                            <div className="truncate">
                              <h4 className="text-xs font-bold text-zinc-200 truncate">
                                {ep.title || `قسمت ${ep.episodeNumber}`}
                              </h4>
                              {ep.durationFormatted && (
                                <span className="text-[10px] text-zinc-400 flex items-center gap-1 mt-0.5">
                                  <Clock className="w-3 h-3 text-zinc-500" />
                                  <span>{ep.durationFormatted}</span>
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            {onCopyStreamLink && (ep.hlsStreamUrl || ep.embedUrl) && (
                              <button
                                type="button"
                                onClick={() => onCopyStreamLink(ep.hlsStreamUrl || ep.embedUrl)}
                                className={`tv-focusable p-2 rounded-lg border transition-all flex items-center justify-center cursor-pointer ${
                                  copiedStreamUrl === (ep.hlsStreamUrl || ep.embedUrl)
                                    ? 'bg-emerald-600 text-white border-emerald-500'
                                    : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white border-zinc-700/60'
                                }`}
                                title="کپی لینک استریم جهت پخش در پلیر خارجی"
                              >
                                {copiedStreamUrl === (ep.hlsStreamUrl || ep.embedUrl) ? (
                                  <Check className="w-3.5 h-3.5" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5 text-amber-400" />
                                )}
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => onPlayEpisode(ep)}
                              className="tv-focusable p-2 rounded-lg bg-amber-400 hover:bg-amber-300 text-black transition-transform active:scale-95 shrink-0 shadow-sm cursor-pointer"
                              title="پخش این قسمت"
                            >
                              <Play className="w-3.5 h-3.5 fill-black" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* MOVIE QUALITIES (IF AVAILABLE) */}
          {fullMovie && fullMovie.available && !isSearchingAparat && (
            <div className="space-y-3 p-4 rounded-2xl bg-zinc-900/40 border border-zinc-800">
              {/* Active Movie Title & Metadata */}
              <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-zinc-800/80">
                <div className="overflow-hidden">
                  <h4 className="text-xs font-bold text-zinc-100 truncate">
                    {fullMovie.title}
                  </h4>
                  <div className="flex items-center gap-2 text-[10px] text-zinc-400 mt-0.5">
                    {fullMovie.durationFormatted && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-amber-400" />
                        <span>{fullMovie.durationFormatted}</span>
                      </span>
                    )}
                    {fullMovie.senderName && (
                      <span className="opacity-80">کانال: {fullMovie.senderName}</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/20">
                    آماده پخش نیم‌بها
                  </span>
                </div>
              </div>

              {/* Qualities Grid */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-zinc-300 block">
                  کیفیت‌های آماده پخش و دانلود مستقیم:
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
                  {fullMovie.qualities?.map((q, idx) => {
                    const cleanQualityText = q.text.replace(/^با\s+/, '');
                    return (
                      <div
                        key={idx}
                        className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800 hover:border-amber-500/50 transition-all flex flex-col items-center justify-between text-center gap-2 group"
                      >
                        <div>
                          <span className="text-xs font-bold text-zinc-200 block group-hover:text-amber-300 transition-colors">
                            {cleanQualityText}
                          </span>
                          {q.size && (
                            <span className="text-[10px] text-zinc-500 font-mono mt-0.5 block">
                              {q.size}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5 w-full mt-1">
                          <button
                            type="button"
                            onClick={() => onPlayQuality(q)}
                            className="tv-focusable flex-1 py-1.5 px-2 rounded-lg bg-amber-400 hover:bg-amber-300 text-black font-bold text-[11px] flex items-center justify-center gap-1 transition-all shadow-sm cursor-pointer"
                            title="پخش آنلاین"
                          >
                            <Play className="w-3 h-3 fill-black" />
                            <span>پخش</span>
                          </button>
                          {onCopyStreamLink && (
                            <button
                              type="button"
                              onClick={() => onCopyStreamLink(q.url)}
                              className={`tv-focusable p-1.5 rounded-lg border transition-all flex items-center justify-center cursor-pointer ${
                                copiedStreamUrl === q.url
                                  ? 'bg-emerald-600 text-white border-emerald-500'
                                  : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white border-zinc-700/60'
                              }`}
                              title="کپی لینک پخش جهت استفاده در پلیر خارجی (VLC، PotPlayer)"
                            >
                              {copiedStreamUrl === q.url ? (
                                <Check className="w-3 h-3" />
                              ) : (
                                <Copy className="w-3 h-3 text-amber-400" />
                              )}
                            </button>
                          )}
                          <a
                            href={q.url}
                            target="_blank"
                            rel="noreferrer"
                            download
                            className="tv-focusable p-1.5 rounded-lg bg-zinc-800 hover:bg-emerald-600 text-zinc-300 hover:text-white border border-zinc-700/60 transition-all flex items-center justify-center cursor-pointer"
                            title="دانلود مستقیم"
                          >
                            <Download className="w-3 h-3" />
                          </a>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ALTERNATE VIDEO RESULTS (OTHER VERSIONS / UPLOADS FOUND ON APARAT) */}
          {alternateResults && alternateResults.length > 0 && !isSearchingAparat && (
            <div className="space-y-2.5 pt-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-amber-400" />
                  <span>ویدیوهای یافت شده در آپارات:</span>
                </span>
                <span className="text-[10px] text-zinc-500">
                  {alternateResults.length} ویدیو آماده پخش
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[340px] overflow-y-auto pr-1 custom-scrollbar">
                {alternateResults.map((alt) => (
                  <div
                    key={alt.uid || alt.id}
                    onClick={() => onSelectAlternate && onSelectAlternate(alt)}
                    className="p-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800 hover:border-amber-400 hover:bg-zinc-900/90 transition-all flex items-center justify-between gap-3 group cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5 overflow-hidden">
                      {alt.poster ? (
                        <div className="relative w-14 h-10 rounded-lg overflow-hidden shrink-0 bg-zinc-950 border border-zinc-800">
                          <img
                            src={alt.poster}
                            alt={alt.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            referrerPolicy="no-referrer"
                          />
                          <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <Play className="w-3 h-3 fill-amber-400 text-amber-400" />
                          </div>
                        </div>
                      ) : (
                        <div className="w-14 h-10 rounded-lg bg-zinc-800 flex items-center justify-center shrink-0 border border-zinc-700/60">
                          <Tv className="w-4 h-4 text-zinc-500" />
                        </div>
                      )}
                      <div className="truncate">
                        <h5 className="text-[11px] font-bold text-zinc-200 truncate group-hover:text-amber-300 transition-colors">
                          {alt.title}
                        </h5>
                        <div className="flex items-center gap-2 text-[10px] text-zinc-400 mt-0.5 flex-wrap">
                          {alt.durationFormatted && (
                            <span className="flex items-center gap-0.5">
                              <Clock className="w-2.5 h-2.5 text-zinc-500" />
                              <span>{alt.durationFormatted}</span>
                            </span>
                          )}
                          <span className="badge px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-400/15 text-amber-400 border border-amber-400/30">
                            پخش مستقیم
                          </span>
                          {alt.senderName && <span className="opacity-70 truncate max-w-[90px]">{alt.senderName}</span>}
                        </div>
                      </div>
                    </div>

                    {onSelectAlternate && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectAlternate(alt);
                        }}
                        className="tv-focusable px-3 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-black font-bold text-[10px] flex items-center gap-1 transition-all cursor-pointer shrink-0 shadow-sm"
                      >
                        <Play className="w-2.5 h-2.5 fill-black" />
                        <span>پخش</span>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* EMPTY STATE - WHEN NEITHER MOVIE NOR SERIES IS FOUND */}
          {!fullMovie?.available && (!seriesData || !seriesData.available) && (!alternateResults || alternateResults.length === 0) && !isSearchingAparat && (
            <div className="p-5 rounded-2xl bg-zinc-900/40 border border-zinc-800 space-y-3 text-right">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h4 className="text-xs font-bold text-zinc-200">
                    ویدیویی در سرورهای ایرانی آپارات برای این عنوان یافت نشد.
                  </h4>
                  <p className="text-[11px] text-zinc-400 mt-1">
                    می‌توانید عنوان را در کادر جستجوی بالا تغییر دهید یا پخش را از سرور پرسرعت جهانی انجام دهید.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setStreamSourceTab('global')}
                  className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold inline-flex items-center gap-1.5 transition-all self-start sm:self-auto cursor-pointer shrink-0"
                >
                  <Globe className="w-3.5 h-3.5" />
                  <span>پخش از سرور جهانی</span>
                </button>
              </div>
            </div>
          )}

          {/* HIGH-QUALITY DIRECT DOWNLOADS SCRAPER SECTION */}
          <DirectDownloadsSection item={item} details={details} />
        </div>
      )}
    </div>
  );
};
