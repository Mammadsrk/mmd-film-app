import React from 'react';
import { ExternalLink, CheckCircle2, Globe, ShieldCheck } from 'lucide-react';
import { MovieSourceHub } from '../../types';

interface VODDownloadTabProps {
  sources: MovieSourceHub[];
  isSeriesMode: boolean;
}

export const VODDownloadTab: React.FC<VODDownloadTabProps> = ({
  sources,
  isSeriesMode,
}) => {
  if (!sources || sources.length === 0) {
    return (
      <div className="p-8 rounded-2xl bg-zinc-900/40 border border-zinc-800 text-center space-y-2">
        <p className="text-xs sm:text-sm text-zinc-400">
          مرجع دانلودی برای این عنوان ثبت نشده است.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Subtle compact header info */}
      <div className="flex items-center justify-between text-xs text-zinc-400 border-b border-zinc-800 pb-3 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span className="text-zinc-300 font-medium">
            {sources.length} مرجع معتبر ایرانی برای دانلود کیفیت‌های بلوری و صوت دوبله جداگانه
          </span>
        </div>
        <span className="text-[11px] text-zinc-500">
          ارائه لینک‌های مستقیم پرسرعت
        </span>
      </div>

      {/* Modern Compact Bento Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {sources.map((src) => {
          const isAvailable = Boolean(src.available || src.isExactMatch || src.highlighted);
          return (
            <div
              key={src.id}
              className={`p-3.5 rounded-2xl border transition-all flex flex-col justify-between gap-3 ${
                isAvailable
                  ? 'bg-zinc-900/80 border-amber-500/40 hover:border-amber-400/80 shadow-md'
                  : 'bg-zinc-900/40 hover:bg-zinc-900/70 border-zinc-800 hover:border-zinc-700'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <div className="w-7 h-7 rounded-lg bg-zinc-800 border border-zinc-700/60 text-amber-400 font-bold text-xs flex items-center justify-center shrink-0">
                      {src.nameFa.slice(0, 1)}
                    </div>
                    <div className="truncate">
                      <h4 className="text-xs font-bold text-zinc-100 truncate">{src.nameFa}</h4>
                      <span className="text-[10px] text-zinc-500 font-mono block truncate">
                        {src.domain}
                      </span>
                    </div>
                  </div>

                  {isAvailable && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shrink-0">
                      <CheckCircle2 className="w-2.5 h-2.5" />
                      <span>تأییدشده</span>
                    </span>
                  )}
                </div>

                {src.badge && (
                  <p className="text-[11px] text-zinc-400 leading-tight line-clamp-1 mt-1">
                    {src.badge}
                  </p>
                )}
              </div>

              {/* Action Button */}
              <a
                href={`/api/web-proxy?url=${encodeURIComponent(src.url)}`}
                target="_blank"
                rel="noreferrer"
                className={`tv-focusable w-full py-1.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  isAvailable
                    ? 'bg-amber-400 hover:bg-amber-300 text-black shadow-sm'
                    : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700/60'
                }`}
              >
                <span>ورود به صفحه دانلود</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          );
        })}
      </div>
    </div>
  );
};
