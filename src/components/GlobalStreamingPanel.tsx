import React from 'react';
import { Globe, Radio, ShieldCheck } from 'lucide-react';
import type { MediaItem, GlobalStreamingData } from '../types';
import { SmartStreamPlayer } from './SmartStreamPlayer';

interface GlobalStreamingPanelProps {
  data?: GlobalStreamingData | null;
  isLoading?: boolean;
  item?: MediaItem | null;
  mediaTitle?: string;
  title?: string;
  titleFa?: string;
  tmdbId?: number | string;
  imdbId?: string;
  isSeries?: boolean;
  seasonNumber?: number;
  episodeNumber?: number;
  // Legacy optional props for backward compatibility
  selectedTier?: any;
  onSelectTier?: any;
  selectedDirectIndex?: any;
  selectedQualityIndex?: any;
  onSelectDirectIndex?: any;
  onSelectQualityIndex?: any;
  selectedMirrorId?: any;
  onSelectMirrorId?: any;
  onSelectMirror?: any;
  onPlayDirect?: any;
  onPlayDirectStream?: any;
  onPlayMirror?: any;
  onPlayTorrent?: any;
  isSubtitleEnabled?: boolean;
  onToggleSubtitle?: any;
}

export const GlobalStreamingPanel: React.FC<GlobalStreamingPanelProps> = ({
  data,
  item,
  mediaTitle,
  title,
  titleFa,
  tmdbId,
  imdbId,
  isSeries = false,
  seasonNumber = 1,
  episodeNumber = 1,
}) => {
  // Construct a safe media item for SmartStreamPlayer if item not directly supplied
  const effectiveItem: MediaItem = item || {
    id: String(tmdbId || data?.tmdbId || '0'),
    title: title || mediaTitle || 'فیلم / سریال',
    titleFa: titleFa || mediaTitle || title || 'فیلم / سریال',
    type: isSeries ? 'series' : 'movie',
    posterUrl: '',
    tmdbId: tmdbId ? Number(tmdbId) : (data?.tmdbId ? Number(data.tmdbId) : undefined),
    imdbId: imdbId || (data as any)?.imdbId,
  };

  return (
    <div className="w-full space-y-4 font-persian">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-400 flex items-center justify-center shrink-0">
            <Globe className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="text-sm sm:text-base font-black text-white">
                پخش آنلاین از سرورهای پایدار جهانی
              </h4>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" />
                <span>اتصال خودکار به سرور فعال</span>
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              سیستم به صورت خودکار سریع‌ترین آدرس پخش را شناسایی و بارگذاری می‌کند.
            </p>
          </div>
        </div>
      </div>

      {/* Unified Smart Stream Player */}
      <div className="rounded-2xl overflow-hidden border border-zinc-800/80 shadow-2xl bg-zinc-950">
        <SmartStreamPlayer
          item={effectiveItem}
          isSeries={isSeries}
          seasonNumber={seasonNumber}
          episodeNumber={episodeNumber}
          className="w-full"
        />
      </div>
    </div>
  );
};
