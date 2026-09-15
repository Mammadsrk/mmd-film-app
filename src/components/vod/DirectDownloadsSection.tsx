import React, { useState, useEffect } from 'react';
import { Download, Copy, Check, Sparkles, ExternalLink, HardDrive, Film } from 'lucide-react';
import { MediaItem, MovieDetailsData } from '../../types';

export interface DirectDownloadLink {
  source: string;
  quality: string;
  type: string;
  size: string;
  url: string;
}

interface DirectDownloadsSectionProps {
  item?: MediaItem | null;
  details?: MovieDetailsData | null;
  movieTitle?: string;
  year?: string | number;
}

export const DirectDownloadsSection: React.FC<DirectDownloadsSectionProps> = ({
  item,
  details,
  movieTitle,
  year,
}) => {
  const [links, setLinks] = useState<DirectDownloadLink[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  // Compute search title and year
  const rawTitle =
    movieTitle ||
    item?.title ||
    details?.title ||
    item?.titleFa ||
    details?.titleFa ||
    '';

  const rawYear =
    year ||
    item?.releaseYear ||
    (details?.release_date ? details.release_date.slice(0, 4) : '') ||
    '';

  useEffect(() => {
    let isCancelled = false;

    if (!rawTitle) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const queryParam = encodeURIComponent(rawTitle);
    const yearParam = encodeURIComponent(String(rawYear || ''));

    fetch(`/api/extract-sources?query=${queryParam}&year=${yearParam}`)
      .then((res) => {
        if (!res.ok) throw new Error('Network error');
        return res.json();
      })
      .then((data) => {
        if (!isCancelled) {
          if (data && Array.isArray(data.links)) {
            setLinks(data.links);
          } else {
            setLinks([]);
          }
          setLoading(false);
        }
      })
      .catch(() => {
        if (!isCancelled) {
          setLinks([]);
          setLoading(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [rawTitle, rawYear]);

  const handleCopy = (url: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(url).then(() => {
      setCopiedUrl(url);
      setTimeout(() => setCopiedUrl(null), 2500);
    });
  };

  return (
    <div className="direct-downloads-section" style={{ marginTop: '20px' }}>
      <h4
        style={{
          fontSize: '15px',
          color: '#f8fafc',
          marginBottom: '12px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}
        className="font-bold font-persian"
      >
        <span>📥</span> لینک‌های مستقیم دانلود (کیفیت بالا ۱۰۸۰p / ۷۲۰p)
      </h4>

      <div id="direct-downloads-container">
        {loading ? (
          <div
            className="dl-loader flex items-center gap-2 py-3 px-4 rounded-xl bg-zinc-900/60 border border-zinc-800/80"
            style={{ color: '#94a3b8', fontSize: '13px' }}
          >
            <div className="w-3.5 h-3.5 border-2 border-amber-400/30 border-t-amber-400 rounded-full animate-spin shrink-0" />
            <span>در حال دریافت مستقیم‌ترین لینک‌های دانلود...</span>
          </div>
        ) : links.length > 0 ? (
          <div className="space-y-2.5">
            {links.map((link, idx) => {
              const isCopied = copiedUrl === link.url;
              return (
                <div
                  key={`${link.url}-${idx}`}
                  className="p-3 sm:p-3.5 rounded-2xl bg-zinc-900/70 border border-zinc-800/90 hover:border-amber-400/50 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 backdrop-blur-md shadow-sm group"
                  dir="rtl"
                >
                  {/* Left info: Source, Quality, Audio, Size */}
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-400/15 text-amber-300 border border-amber-400/30">
                      {link.quality || '1080p Full HD'}
                    </span>

                    <span className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-zinc-800 text-zinc-200 border border-zinc-700/60">
                      {link.type || 'دوبله / زیرنویس'}
                    </span>

                    {link.size && link.size !== 'کیفیت برتر' && (
                      <span className="px-2 py-0.5 rounded-md text-[11px] font-mono bg-zinc-800/80 text-zinc-300 flex items-center gap-1">
                        <HardDrive className="w-3 h-3 text-zinc-400" />
                        {link.size}
                      </span>
                    )}

                    {link.source && (
                      <span className="text-[11px] text-zinc-400 flex items-center gap-1 mr-1">
                        <Film className="w-3 h-3 text-amber-400/80" />
                        مرجع: {link.source}
                      </span>
                    )}
                  </div>

                  {/* Right actions: Download + Copy Link */}
                  <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="tv-focusable flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-black text-xs font-bold transition-all shadow-md cursor-pointer"
                      title="دانلود مستقیم با بالاترین سرعت"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>دانلود مستقیم</span>
                    </a>

                    <button
                      type="button"
                      onClick={(e) => handleCopy(link.url, e)}
                      className={`tv-focusable flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                        isCopied
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
                          : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border-zinc-700/70'
                      }`}
                      title="کپی آدرس لینک برای استفاده در دانلود منیجر (IDM) یا پلیرها"
                    >
                      {isCopied ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span>لینک کپی شد!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-amber-400" />
                          <span>کپی لینک</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-4 rounded-xl bg-zinc-900/40 border border-zinc-800/70 text-zinc-400 text-xs text-right leading-relaxed">
            لینک مستقیمی در مراجع بدون اشتراک یافت نشد؛ لطفاً از سرور آپارات یا مراجع خارجی استفاده کنید.
          </div>
        )}
      </div>
    </div>
  );
};
