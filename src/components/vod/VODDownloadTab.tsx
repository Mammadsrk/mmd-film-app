import React from 'react';
import { ExternalLink, CheckCircle2, ShieldCheck, Download, Search } from 'lucide-react';
import { MediaItem, MovieDetailsData, MovieSourceHub } from '../../types';
import { DirectDownloadsSection } from './DirectDownloadsSection';

interface VODDownloadTabProps {
  sources?: any[];
  isSeriesMode?: boolean;
  item?: MediaItem;
  details?: MovieDetailsData | null;
}

export const VODDownloadTab: React.FC<VODDownloadTabProps> = ({
  sources: propSources = [],
  isSeriesMode = false,
  item,
  details,
}) => {
  // Safe extraction of download sources from item, details, or propSources
  const rawSources: any[] = [
    ...((item as any)?.download_sources || []),
    ...((item as any)?.sources || []),
    ...((details as any)?.download_sources || []),
    ...(details?.sources || []),
    ...(Array.isArray(propSources) ? propSources : []),
  ];

  // Deduplicate sources by name or url
  const seen = new Set<string>();
  const sources = rawSources.filter((s) => {
    if (!s) return false;
    const key = (s.name || s.nameFa || '') + (s.url || '');
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  const queryTitle = item?.titleFa || item?.title || details?.titleFa || details?.title || '';

  // Fallback reference search sites if no direct links are available yet
  const fallbackReferenceSites = [
    {
      name: 'دیجی‌موویز',
      domain: 'digimovie.vip',
      url: `https://digimovie.vip/?s=${encodeURIComponent(queryTitle)}`,
      quality: '1080p / 720p / 480p',
      badge: 'نسخه بدون سانسور + زیرنویس چسبیده',
    },
    {
      name: 'زرین‌فیلم',
      domain: 'zarrinfilm.com',
      url: `https://zarrinfilm.com/?s=${encodeURIComponent(queryTitle)}`,
      quality: '1080p / 720p',
      badge: 'دوبله فارسی اختصاصی + صوت دو زبانه',
    },
    {
      name: 'فیلم۲مدیا',
      domain: 'film2media.cam',
      url: `https://www.film2media.cam/?s=${encodeURIComponent(queryTitle)}`,
      quality: 'بلوری 1080p FHD',
      badge: 'لینک پرسرعت نیم‌بها',
    },
    {
      name: 'دوستی‌ها',
      domain: 'doostihaa.com',
      url: `https://www.doostihaa.com/?s=${encodeURIComponent(queryTitle)}`,
      quality: '1080p / 720p / 480p',
      badge: 'نسخه دوبله فارسی و زبان اصلی',
    },
    {
      name: 'زردفیلم',
      domain: 'zardfilm.in',
      url: `https://zardfilm.in/?s=${encodeURIComponent(queryTitle)}`,
      quality: 'Full HD / HD',
      badge: 'آرشیو فیلم و سریال با زیرنویس فارسی',
    },
  ];

  return (
    <div className="space-y-6">
      {/* High-Quality Direct Media Links (Automated Scraper) */}
      <DirectDownloadsSection item={item} details={details} />

      {/* External Reference Portals & Download Sources */}
      <div className="space-y-4 pt-2">
        {/* Header Info */}
        <div className="flex items-center justify-between text-xs text-zinc-400 border-b border-zinc-800 pb-3 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span className="text-zinc-300 font-medium">
              {sources.length > 0
                ? `${sources.length} مرجع دانلود خارجی برای کیفیت‌های وب‌دی‌ال و صوت اختصاصی`
                : 'سایر مراجع معتبر سینمای ایران و جهان'}
            </span>
          </div>
          <span className="text-[11px] text-zinc-500">
            صفحات مرجع بدون نیاز به قندشکن
          </span>
        </div>

      {/* Sources List Container */}
      <div className="sources-list grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {sources.length > 0 ? (
          sources.map((s, idx) => {
            const sourceName = s.name || s.nameFa || 'سایت مرجع';
            const sourceUrl = s.url || '#';
            const sourceQuality = s.quality || '1080p / 720p';
            const sourceDomain = s.domain || (sourceUrl.includes('://') ? sourceUrl.split('/')[2] : '');

            return (
              <a
                key={idx}
                href={sourceUrl.startsWith('http') ? `/api/web-proxy?url=${encodeURIComponent(sourceUrl)}` : sourceUrl}
                target="_blank"
                rel="noreferrer"
                className="source-item tv-focusable p-3.5 rounded-2xl bg-zinc-900/80 hover:bg-zinc-900 border border-amber-500/40 hover:border-amber-400 transition-all flex flex-col justify-between gap-3 shadow-md group cursor-pointer"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-2 overflow-hidden">
                      <div className="w-7 h-7 rounded-lg bg-zinc-800 border border-zinc-700/60 text-amber-400 font-bold text-xs flex items-center justify-center shrink-0">
                        {sourceName.slice(0, 1)}
                      </div>
                      <div className="truncate">
                        <span className="text-xs font-bold text-zinc-100 group-hover:text-amber-300 transition-colors truncate block">
                          {sourceName}
                        </span>
                        {sourceDomain && (
                          <span className="text-[10px] text-zinc-500 font-mono block truncate">
                            {sourceDomain}
                          </span>
                        )}
                      </div>
                    </div>

                    <span className="badge inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-400/15 text-amber-400 border border-amber-400/30 shrink-0">
                      {sourceQuality}
                    </span>
                  </div>

                  {s.badge && (
                    <p className="text-[11px] text-zinc-400 leading-tight line-clamp-1 mt-1">
                      {s.badge}
                    </p>
                  )}
                </div>

                <div className="w-full py-1.5 px-3 rounded-xl bg-amber-400 group-hover:bg-amber-300 text-black text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-sm">
                  <span>ورود به صفحه مرجع</span>
                  <ExternalLink className="w-3 h-3" />
                </div>
              </a>
            );
          })
        ) : (
          fallbackReferenceSites.map((site, idx) => (
            <a
              key={idx}
              href={`/api/web-proxy?url=${encodeURIComponent(site.url)}`}
              target="_blank"
              rel="noreferrer"
              className="source-item tv-focusable p-3.5 rounded-2xl bg-zinc-900/60 hover:bg-zinc-900/90 border border-zinc-800 hover:border-amber-400/50 transition-all flex flex-col justify-between gap-3 group cursor-pointer"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <div className="w-7 h-7 rounded-lg bg-zinc-800 border border-zinc-700/60 text-amber-400 font-bold text-xs flex items-center justify-center shrink-0">
                      {site.name.slice(0, 1)}
                    </div>
                    <div className="truncate">
                      <span className="text-xs font-bold text-zinc-100 group-hover:text-amber-300 transition-colors truncate block">
                        {site.name}
                      </span>
                      <span className="text-[10px] text-zinc-500 font-mono block truncate">
                        {site.domain}
                      </span>
                    </div>
                  </div>

                  <span className="badge inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-zinc-800 text-zinc-300 border border-zinc-700 shrink-0">
                    {site.quality}
                  </span>
                </div>

                <p className="text-[11px] text-zinc-400 leading-tight line-clamp-1 mt-1">
                  {site.badge}
                </p>
              </div>

              <div className="w-full py-1.5 px-3 rounded-xl bg-zinc-800 group-hover:bg-amber-400 group-hover:text-black text-zinc-200 text-xs font-bold flex items-center justify-center gap-1.5 transition-all">
                <Search className="w-3 h-3" />
                <span>جستجو در مرجع {site.name}</span>
                <ExternalLink className="w-3 h-3" />
              </div>
            </a>
          ))
        )}
      </div>

        {/* Fallback Note if no direct sources were passed */}
        {sources.length === 0 && (
          <p className="no-sources-note text-xs text-zinc-400 text-center pt-2">
            لینک‌های مستقیم مراجع پس از بررسی کیفی به‌روزرسانی می‌شوند.
          </p>
        )}
      </div>
    </div>
  );
};
