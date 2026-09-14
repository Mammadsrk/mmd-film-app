import React from 'react';
import { SearchResult, MediaItem } from '../types';
import { Film, Volume2, Subtitles, ExternalLink, Loader2, Play } from 'lucide-react';

interface SearchResultsGridProps {
  query: string;
  results: SearchResult[];
  isLoading: boolean;
  selectedHub: string | null;
  onSelectResult: (result: SearchResult) => void;
  onClearFilter: () => void;
}

export const SearchResultsGrid: React.FC<SearchResultsGridProps> = ({
  query,
  results,
  isLoading,
  selectedHub,
  onSelectResult,
  onClearFilter,
}) => {
  return (
    <section className="w-full max-w-7xl mx-auto px-4 py-6">
      {/* Search status header */}
      <div className="flex items-center justify-between mb-6 pb-3 border-b border-zinc-800">
        <button
          id="btn-clear-search-filter"
          data-tv-id="search-filter-clear"
          onClick={onClearFilter}
          tabIndex={0}
          className="tv-focusable text-xs text-red-400 hover:text-red-300 font-persian"
        >
          بازگشت به صفحه اصلی
        </button>

        <div className="text-right">
          <h2 className="text-lg sm:text-xl font-black text-white font-persian flex items-center justify-end gap-2">
            <span>نتایج جستجو</span>
            {query && <span className="text-[#e50914]">«{query}»</span>}
            {selectedHub && (
              <span className="text-xs px-2 py-0.5 rounded bg-zinc-800 text-zinc-300">
                فیلتر: {selectedHub}
              </span>
            )}
          </h2>
          <p className="text-xs text-zinc-500 font-persian mt-1">
            {isLoading
              ? 'در حال کاوش همزمان در سرورهای ۶ سایت مرجع...'
              : `${results.length} مورد یافت شد (جستجوی موازی سرور)`}
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Loader2 className="w-10 h-10 text-[#e50914] animate-spin mb-3" />
          <p className="text-sm font-persian text-zinc-400">
            ارسال درخواست موازی با جعل هدر و دور زدن محدودیت‌های منطقه‌ای...
          </p>
        </div>
      ) : results.length === 0 ? (
        <div className="text-center py-20 bg-[#0c0c14]/50 rounded-3xl border border-zinc-800/80 p-8">
          <Film className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-zinc-300 font-persian mb-1">
            موردی مطابق با عبارت جستجو یافت نشد
          </h3>
          <p className="text-xs text-zinc-500 font-persian">
            عبارت دیگری را امتحان کنید یا نام انگلیسی فیلم را وارد نمایید.
          </p>
        </div>
      ) : (
        /*
          Screen Size Adaptation:
          Mobile (< 768px): Clean 2-column touch-friendly grid!
          Tablet/Desktop: 3 to 5 columns.
        */
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3.5 sm:gap-4 md:gap-5">
          {results.map((item, index) => {
            const cardId = `search-result-${index}`;
            const targetOutboundUrl = item.link || item.directUrl;
            return (
              <div
                key={item.id}
                id={cardId}
                data-tv-id={cardId}
                tabIndex={0}
                onClick={() => onSelectResult(item)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    onSelectResult(item);
                  }
                }}
                /* 
                  LG webOS TV Compatibility:
                  Explicit poster height and min-height to prevent 0px rendering trap.
                */
                className="tv-focusable group relative flex flex-col justify-between rounded-2xl bg-[#0d0d15] border border-zinc-800/80 hover:border-red-600 cursor-pointer overflow-hidden shadow-lg transition-all"
                style={{ height: '330px', minHeight: '330px' }}
              >
                {/* Poster container with explicit height */}
                <div
                  className="relative w-full overflow-hidden bg-zinc-900"
                  style={{ height: '220px', minHeight: '220px' }}
                >
                  <img
                    src={item.posterUrl}
                    alt={item.title}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    loading="lazy"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src =
                        'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=600&q=80';
                    }}
                  />

                  {/* Hub Tag */}
                  <div className="absolute top-2 right-2 px-2 py-0.5 rounded-lg bg-black/80 backdrop-blur-md border border-zinc-700/60 text-[10px] font-bold text-zinc-200">
                    {item.site}
                  </div>

                  {/* Outbound Link through Domestic Proxy (Anti-VPN Geo-block bypass) */}
                  {targetOutboundUrl && (
                    <a
                      href={`/api/web-proxy?url=${encodeURIComponent(targetOutboundUrl)}`}
                      target="_blank"
                      rel="noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="absolute top-2 left-2 z-20 p-1.5 rounded-lg bg-black/80 hover:bg-[#e50914] text-zinc-300 hover:text-white border border-zinc-700/60 shadow-md transition-all hover:scale-110"
                      title={`مشاهده مستقیم در وب‌سایت ${item.site}`}
                    >
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}

                  {/* Play Overlay */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 group-focus:opacity-100 transition-opacity bg-black/50 backdrop-blur-[2px]">
                    <div className="w-10 h-10 rounded-full bg-[#e50914] text-white flex items-center justify-center shadow-lg">
                      <Play className="w-5 h-5 fill-white ml-0.5" />
                    </div>
                  </div>
                </div>

                {/* Info Container */}
                <div className="p-2.5 text-right flex flex-col justify-between flex-1">
                  <div>
                    <h3 className="text-xs sm:text-sm font-bold text-zinc-100 font-persian line-clamp-2 group-hover:text-red-400 transition-colors">
                      {item.title}
                    </h3>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-zinc-800/50 text-[10px]">
                    <div className="flex items-center gap-1 text-zinc-400">
                      {item.hasDubbed && (
                        <span className="flex items-center gap-0.5 px-1 rounded bg-amber-950/40 text-amber-300 font-persian">
                          <Volume2 className="w-2.5 h-2.5" />
                          دوبله
                        </span>
                      )}
                      {item.hasSubbed && (
                        <span className="flex items-center gap-0.5 px-1 rounded bg-blue-950/40 text-blue-300 font-persian">
                          <Subtitles className="w-2.5 h-2.5" />
                          زیرنویس
                        </span>
                      )}
                    </div>
                    <span className="text-zinc-500 font-mono">{item.quality}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};
