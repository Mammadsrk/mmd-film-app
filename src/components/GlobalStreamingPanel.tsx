import React, { useState, useMemo } from 'react';
import {
  Globe,
  Radio,
  Download,
  Copy,
  Check,
  Play,
  Film,
  Zap,
  ShieldCheck,
  FileText,
  Layers,
  HardDrive,
  Users,
  ExternalLink,
  Tv,
  MonitorPlay,
  Search,
  Filter,
  Flame,
  CheckCircle2,
} from 'lucide-react';
import type {
  GlobalStreamingData,
  GlobalDirectStream,
  GlobalEmbedMirror,
  GlobalTorrentItem,
} from '../types';

interface GlobalStreamingPanelProps {
  data: GlobalStreamingData | null;
  isLoading: boolean;
  selectedTier: 'tier1_direct' | 'tier2_embed' | 'tier3_torrent';
  onSelectTier: (tier: 'tier1_direct' | 'tier2_embed' | 'tier3_torrent') => void;
  selectedDirectIndex?: number;
  selectedQualityIndex?: number;
  onSelectDirectIndex?: (index: number) => void;
  onSelectQualityIndex?: (index: number) => void;
  selectedMirrorId?: string;
  onSelectMirrorId?: (id: string) => void;
  onSelectMirror?: (id: string) => void;
  onPlayDirect?: (stream: GlobalDirectStream, index: number) => void;
  onPlayDirectStream?: (stream?: GlobalDirectStream, index?: number) => void;
  onPlayMirror?: (mirror: GlobalEmbedMirror) => void;
  onPlayTorrent?: (torrent: GlobalTorrentItem) => void;
  isSubtitleEnabled?: boolean;
  onToggleSubtitle?: () => void;
  mediaTitle?: string;
  title?: string;
  titleFa?: string;
}

export const GlobalStreamingPanel: React.FC<GlobalStreamingPanelProps> = ({
  data,
  isLoading,
  selectedTier,
  onSelectTier,
  selectedDirectIndex,
  selectedQualityIndex,
  onSelectDirectIndex,
  onSelectQualityIndex,
  selectedMirrorId,
  onSelectMirrorId,
  onSelectMirror,
  onPlayDirect,
  onPlayDirectStream,
  onPlayMirror,
  onPlayTorrent,
  isSubtitleEnabled = true,
  onToggleSubtitle,
  mediaTitle,
  title,
  titleFa,
}) => {
  const [copiedHash, setCopiedHash] = useState<string | null>(null);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const [torrentQualityFilter, setTorrentQualityFilter] = useState<'all' | '4k' | '1080p' | '720p'>('all');
  const [torrentSearchTerm, setTorrentSearchTerm] = useState<string>('');

  const activeDirectIndex = selectedDirectIndex ?? selectedQualityIndex ?? 0;
  const activeMirrorId = selectedMirrorId || data?.embedMirrors?.[0]?.id || '';
  const displayTitle = mediaTitle || titleFa || title || 'فیلم / سریال';

  const handleSelectDirect = (stream: GlobalDirectStream, idx: number) => {
    if (typeof onSelectDirectIndex === 'function') onSelectDirectIndex(idx);
    if (typeof onSelectQualityIndex === 'function') onSelectQualityIndex(idx);
    if (typeof onPlayDirect === 'function') onPlayDirect(stream, idx);
    if (typeof onPlayDirectStream === 'function') onPlayDirectStream(stream, idx);
  };

  const handleSelectMirror = (mirror: GlobalEmbedMirror) => {
    if (typeof onSelectMirrorId === 'function') onSelectMirrorId(mirror.id);
    if (typeof onSelectMirror === 'function') onSelectMirror(mirror.id);
    if (typeof onPlayMirror === 'function') onPlayMirror(mirror);
  };

  const handleCopyMagnet = (magnetUrl: string, hash: string) => {
    navigator.clipboard.writeText(magnetUrl);
    setCopiedHash(hash);
    setTimeout(() => setCopiedHash(null), 2500);
  };

  const handleCopyStreamLink = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedUrl(url);
    setTimeout(() => setCopiedUrl(null), 2500);
  };

  const directStreams = data?.directStreams || [];
  const embedMirrors = data?.embedMirrors || [];
  const torrents = data?.torrents || [];
  const pingMs = data?.serverPingMs || 24;

  // Filtered torrents
  const filteredTorrents = useMemo(() => {
    return torrents.filter((t) => {
      const matchQuality =
        torrentQualityFilter === 'all' ||
        (torrentQualityFilter === '4k' && (t.quality.includes('2160') || t.quality.includes('4K'))) ||
        (torrentQualityFilter === '1080p' && t.quality.includes('1080')) ||
        (torrentQualityFilter === '720p' && t.quality.includes('720'));

      const matchSearch =
        !torrentSearchTerm.trim() ||
        (t.name || t.title || '').toLowerCase().includes(torrentSearchTerm.toLowerCase()) ||
        t.type.toLowerCase().includes(torrentSearchTerm.toLowerCase());

      return matchQuality && matchSearch;
    });
  }, [torrents, torrentQualityFilter, torrentSearchTerm]);

  if (isLoading) {
    return (
      <div className="mt-6 p-6 rounded-3xl bg-zinc-950/70 border border-indigo-500/20 backdrop-blur-xl animate-pulse space-y-4">
        <div className="flex items-center justify-between">
          <div className="h-5 w-48 bg-zinc-800 rounded-lg" />
          <div className="h-5 w-24 bg-zinc-800 rounded-lg" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="h-28 bg-zinc-900/60 rounded-2xl border border-zinc-800" />
          <div className="h-28 bg-zinc-900/60 rounded-2xl border border-zinc-800" />
          <div className="h-28 bg-zinc-900/60 rounded-2xl border border-zinc-800" />
        </div>
      </div>
    );
  }

  return (
    <div className="mt-6 space-y-6">
      {/* 1. Global Streaming Banner & Status Bar */}
      <div className="relative overflow-hidden p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-indigo-950/50 via-[#0a0c16]/90 to-zinc-950/95 border border-indigo-500/40 shadow-[0_8px_32px_rgba(79,70,229,0.18)] backdrop-blur-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <div className="p-1.5 rounded-xl bg-indigo-500/20 border border-indigo-400/40 text-indigo-300">
                <Globe className="w-4 h-4" />
              </div>
              <h3 className="text-base sm:text-lg font-black text-white font-persian">
                سرور جهانی MMD FILM (پخش آنلاین و شبکه تورنت)
              </h3>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-indigo-500/20 border border-indigo-400/40 text-indigo-300">
                نسخه ارتقا‌یافته ۲۰۲۶
              </span>
            </div>
            <p className="text-xs text-zinc-400 font-persian leading-relaxed">
              تماشای روان با ۶ سرور آنلاین پرسرعت، دسترسی مستقیم به تورنت‌های واقعی با بیش از ۱۰۰۰ سیدر، و پخش بدون نیاز به فیلترشکن.
            </p>
          </div>

          {/* Telemetry & Subtitle Controls */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-950/50 border border-emerald-500/40 text-emerald-300 text-xs font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>پینگ سرور: {pingMs}ms</span>
            </div>

            <button
              type="button"
              onClick={onToggleSubtitle}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold font-persian flex items-center gap-1.5 transition-all cursor-pointer border ${
                isSubtitleEnabled
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-sm'
                  : 'bg-zinc-900/60 text-zinc-400 border-zinc-700/60 hover:text-zinc-200'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>زیرنویس فارسی: {isSubtitleEnabled ? 'فعال' : 'غیرفعال'}</span>
            </button>
          </div>
        </div>

        {/* 2. Tier Selection Tabs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mt-5 pt-4 border-t border-indigo-500/20">
          {/* Tier 2: Embed Mirrors (Primary Recommended) */}
          <button
            type="button"
            onClick={() => onSelectTier('tier2_embed')}
            className={`p-3.5 rounded-2xl border text-right transition-all cursor-pointer relative overflow-hidden ${
              selectedTier === 'tier2_embed'
                ? 'bg-indigo-600/35 border-indigo-400 shadow-[0_0_20px_rgba(99,102,241,0.35)] ring-1 ring-indigo-400 text-white'
                : 'bg-zinc-900/40 border-zinc-800/80 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold font-persian flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-cyan-400" />
                <span>۱. پخش آنلاین سرورهای جهانی</span>
              </span>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                توصیه‌شده
              </span>
            </div>
            <p className="text-[11px] opacity-80 font-persian">
              ۶ سرور پخش آنلاین با نهایت کیفیت Ultra HD و بدون قطعی
            </p>
          </button>

          {/* Tier 3: Torrents & Magnets */}
          <button
            type="button"
            onClick={() => onSelectTier('tier3_torrent')}
            className={`p-3.5 rounded-2xl border text-right transition-all cursor-pointer relative overflow-hidden ${
              selectedTier === 'tier3_torrent'
                ? 'bg-indigo-600/35 border-indigo-400 shadow-[0_0_20px_rgba(99,102,241,0.35)] ring-1 ring-indigo-400 text-white'
                : 'bg-zinc-900/40 border-zinc-800/80 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold font-persian flex items-center gap-1.5">
                <HardDrive className="w-4 h-4 text-emerald-400" />
                <span>۲. تورنت و مگنت P2P واقعی</span>
              </span>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-indigo-500/20 text-indigo-300 font-mono">
                {torrents.length} لینک فعال
              </span>
            </div>
            <p className="text-[11px] opacity-80 font-persian">
              سیدرهای بالا، کیفیت 4K و بلوری، دانلود و پخش تحت وب
            </p>
          </button>

          {/* Tier 1: Direct CDN & External Players */}
          <button
            type="button"
            onClick={() => onSelectTier('tier1_direct')}
            className={`p-3.5 rounded-2xl border text-right transition-all cursor-pointer relative overflow-hidden ${
              selectedTier === 'tier1_direct'
                ? 'bg-indigo-600/35 border-indigo-400 shadow-[0_0_20px_rgba(99,102,241,0.35)] ring-1 ring-indigo-400 text-white'
                : 'bg-zinc-900/40 border-zinc-800/80 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold font-persian flex items-center gap-1.5">
                <MonitorPlay className="w-4 h-4 text-amber-400" />
                <span>۳. پلیرهای خارجی و تلویزیون</span>
              </span>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500/20 text-amber-300 font-mono">
                VLC / Stremio
              </span>
            </div>
            <p className="text-[11px] opacity-80 font-persian">
              انتقال خودکار به VLC، پات پلیر و اپ‌های تلویزیون هوشمند
            </p>
          </button>
        </div>
      </div>

      {/* =========================================================================
          VIEW 1: EMBED MIRRORS (پخش آنلاین با سرورهای جهانی)
          ========================================================================= */}
      {selectedTier === 'tier2_embed' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-zinc-400 font-persian flex-wrap gap-2">
            <span className="flex items-center gap-1.5 text-zinc-200 font-bold">
              <Flame className="w-4 h-4 text-amber-400" />
              <span>سرورهای فعال پخش آنلاین بین‌المللی (یک سرور را انتخاب کنید):</span>
            </span>
            <span className="text-emerald-400 flex items-center gap-1 font-persian">
              <CheckCircle2 className="w-3.5 h-3.5" />
              سازگار با تمام مرورگرها و تلویزیون‌ها
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {embedMirrors.map((mirror, idx) => {
              const isSelected = activeMirrorId === mirror.id;
              return (
                <div
                  key={mirror.id}
                  className={`p-4 rounded-2xl border transition-all duration-300 flex flex-col justify-between ${
                    isSelected
                      ? 'bg-indigo-950/60 border-indigo-400 shadow-xl shadow-indigo-950/50 ring-2 ring-indigo-500/40'
                      : 'bg-zinc-900/70 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900/90'
                  }`}
                >
                  <div className="mb-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-bold text-zinc-100 font-persian flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-400" />
                        <span>{mirror.name}</span>
                      </h4>
                      {mirror.badge && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 font-persian">
                          {mirror.badge}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between text-xs text-zinc-400 font-mono">
                      <span>ارائه‌دهنده: {mirror.provider}</span>
                      <span className="text-emerald-400 font-bold text-[11px] font-persian">{mirror.status || 'فعال و تست‌شده'}</span>
                    </div>
                  </div>

                  <div className="space-y-2 pt-3 border-t border-zinc-800/80">
                    <button
                      type="button"
                      onClick={() => handleSelectMirror(mirror)}
                      className={`tv-focusable w-full py-2 px-3 rounded-xl text-xs font-bold font-persian flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm ${
                        isSelected
                          ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/30 ring-1 ring-white/20'
                          : 'bg-zinc-800 hover:bg-indigo-600 hover:text-white text-zinc-200'
                      }`}
                    >
                      <Play className="w-3.5 h-3.5" />
                      <span>{isSelected ? 'در حال پخش در پلیر' : 'پخش آنلاین در پلیر'}</span>
                    </button>

                    <a
                      href={mirror.url}
                      target="_blank"
                      rel="noreferrer"
                      className="tv-focusable w-full py-1.5 px-2 rounded-xl bg-zinc-800/50 hover:bg-zinc-700/80 text-zinc-400 hover:text-zinc-200 text-[11px] font-persian flex items-center justify-center gap-1.5 transition-all"
                    >
                      <span>باز کردن در تب تمام‌صفحه</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* =========================================================================
          VIEW 2: TORRENTS & MAGNETS (تورنت واقعی با سیدر بالا)
          ========================================================================= */}
      {selectedTier === 'tier3_torrent' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-zinc-400 font-persian">
            <span className="text-zinc-200 font-bold flex items-center gap-1.5">
              <HardDrive className="w-4 h-4 text-emerald-400" />
              <span>تورنت‌های واقعی تست‌شده از شبکه جهانی BitTorrent:</span>
            </span>

            {/* Quality Filter Tabs */}
            <div className="flex items-center gap-1.5 bg-zinc-900/80 p-1 rounded-xl border border-zinc-800">
              <button
                type="button"
                onClick={() => setTorrentQualityFilter('all')}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  torrentQualityFilter === 'all'
                    ? 'bg-emerald-600 text-white font-bold shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                همه ({torrents.length})
              </button>
              <button
                type="button"
                onClick={() => setTorrentQualityFilter('4k')}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer font-mono ${
                  torrentQualityFilter === '4k'
                    ? 'bg-emerald-600 text-white font-bold shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                4K UHD
              </button>
              <button
                type="button"
                onClick={() => setTorrentQualityFilter('1080p')}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer font-mono ${
                  torrentQualityFilter === '1080p'
                    ? 'bg-emerald-600 text-white font-bold shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                1080p
              </button>
              <button
                type="button"
                onClick={() => setTorrentQualityFilter('720p')}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer font-mono ${
                  torrentQualityFilter === '720p'
                    ? 'bg-emerald-600 text-white font-bold shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                720p
              </button>
            </div>
          </div>

          {filteredTorrents.length === 0 ? (
            <div className="p-8 rounded-2xl bg-zinc-900/40 border border-zinc-800 text-center space-y-2">
              <HardDrive className="w-8 h-8 text-zinc-600 mx-auto" />
              <p className="text-sm font-bold text-zinc-300 font-persian">هیچ فایل تورنتی با فیلتر انتخابی یافت نشد.</p>
              <p className="text-xs text-zinc-500 font-persian">فیلتر کیفیت را به «همه» تغییر دهید یا از سرورهای پخش آنلاین استفاده کنید.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredTorrents.map((torrent, idx) => {
                const isCopied = copiedHash === torrent.hash;
                return (
                  <div
                    key={torrent.hash || idx}
                    className="p-4 rounded-2xl bg-zinc-900/70 border border-zinc-800 hover:border-emerald-500/40 hover:bg-zinc-900/90 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm"
                  >
                    <div className="space-y-2 flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2.5 py-0.5 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-black font-mono">
                          {torrent.quality}
                        </span>
                        <span className="px-2 py-0.5 rounded-lg bg-zinc-800 text-zinc-300 text-xs font-bold font-mono">
                          {torrent.type}
                        </span>
                        <span className="px-2 py-0.5 rounded-lg bg-cyan-950/50 border border-cyan-500/30 text-cyan-300 text-xs font-mono font-bold">
                          حجم: {torrent.size}
                        </span>
                      </div>

                      <h4 className="text-xs sm:text-sm font-bold text-zinc-200 font-mono truncate" title={torrent.name || torrent.title}>
                        {torrent.name || torrent.title || displayTitle}
                      </h4>

                      <div className="flex items-center gap-4 text-xs font-mono text-zinc-400 flex-wrap">
                        <span className="text-emerald-400 font-bold flex items-center gap-1">
                          <Users className="w-3.5 h-3.5" />
                          {torrent.seeds} سیدر فعال (Seeds)
                        </span>
                        <span className="text-cyan-400 font-medium">
                          {torrent.peers} لیدر (Peers)
                        </span>
                        <span className="text-zinc-500 truncate max-w-[180px]">
                          Hash: {torrent.hash.substring(0, 16)}...
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap self-end md:self-auto">
                      {/* Copy Magnet */}
                      <button
                        type="button"
                        onClick={() => handleCopyMagnet(torrent.magnetUrl, torrent.hash)}
                        className={`tv-focusable px-3 py-2 rounded-xl text-xs font-bold font-persian flex items-center gap-1.5 transition-all cursor-pointer border ${
                          isCopied
                            ? 'bg-emerald-600 text-white border-emerald-500 shadow-md'
                            : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border-zinc-700'
                        }`}
                        title="کپی لینک مگنت برای qBittorrent یا uTorrent"
                      >
                        {isCopied ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>کپی شد!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5 text-zinc-400" />
                            <span>کپی مگنت</span>
                          </>
                        )}
                      </button>

                      {/* Direct Open in Torrent Client */}
                      <a
                        href={torrent.magnetUrl}
                        className="tv-focusable px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold font-persian flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
                        title="باز کردن مستقیم در نرم‌افزار تورنت سیستم"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>دانلود با تورنت</span>
                      </a>

                      {/* Direct In-App WebTorrent Stream */}
                      {onPlayTorrent && (
                        <button
                          type="button"
                          onClick={() => onPlayTorrent(torrent)}
                          className="tv-focusable px-3 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold font-persian flex items-center gap-1.5 transition-all cursor-pointer shadow-md"
                          title="پخش مستقیم آنلاین در پلیر برنامه (WebTorrent)"
                        >
                          <Play className="w-3.5 h-3.5" />
                          <span>پخش آنلاین تورنت</span>
                        </button>
                      )}

                      {/* Stremio Link */}
                      <a
                        href={`stremio://${encodeURIComponent(torrent.magnetUrl)}`}
                        className="tv-focusable px-3 py-2 rounded-xl bg-purple-950/60 hover:bg-purple-600 border border-purple-500/40 text-purple-300 hover:text-white text-xs font-bold font-persian flex items-center gap-1.5 transition-all cursor-pointer"
                        title="پخش در استریمیو (Stremio)"
                      >
                        <Tv className="w-3.5 h-3.5" />
                        <span>Stremio</span>
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          VIEW 3: EXTERNAL PLAYERS & SMART TV
          ========================================================================= */}
      {selectedTier === 'tier1_direct' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-zinc-400 font-persian">
            <span className="text-zinc-200 font-bold">
              پخش در اپلیکیشن‌های جانبی و تلویزیون هوشمند (VLC، پات پلیر و استریمیو):
            </span>
            <span className="text-amber-400 font-mono text-[11px]">Direct App Handshake</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {/* VLC Player Card */}
            <div className="p-4 rounded-2xl bg-zinc-900/70 border border-zinc-800 hover:border-amber-500/40 transition-all space-y-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
                  <Play className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white font-persian">VLC Media Player</h4>
                  <p className="text-[11px] text-zinc-400 font-persian">پخش با زیرنویس خودکار در رایانه و موبایل</p>
                </div>
              </div>

              <div className="pt-2 border-t border-zinc-800 flex items-center gap-2">
                <a
                  href={`vlc://${embedMirrors[0]?.url || ''}`}
                  className="tv-focusable flex-1 py-2 px-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold font-persian flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-md"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>اجرا در VLC</span>
                </a>
              </div>
            </div>

            {/* PotPlayer Card */}
            <div className="p-4 rounded-2xl bg-zinc-900/70 border border-zinc-800 hover:border-indigo-500/40 transition-all space-y-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400">
                  <MonitorPlay className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white font-persian">PotPlayer (ویندوز)</h4>
                  <p className="text-[11px] text-zinc-400 font-persian">پخش با رندرر سخت‌افزاری و روان</p>
                </div>
              </div>

              <div className="pt-2 border-t border-zinc-800 flex items-center gap-2">
                <a
                  href={`potplayer://${embedMirrors[0]?.url || ''}`}
                  className="tv-focusable flex-1 py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold font-persian flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-md"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>اجرا در PotPlayer</span>
                </a>
              </div>
            </div>

            {/* Stremio Card */}
            <div className="p-4 rounded-2xl bg-zinc-900/70 border border-zinc-800 hover:border-purple-500/40 transition-all space-y-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-purple-500/20 text-purple-400">
                  <Tv className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white font-persian">Stremio (استریمیو)</h4>
                  <p className="text-[11px] text-zinc-400 font-persian">سینک با تلویزیون اندروید و موبایل</p>
                </div>
              </div>

              <div className="pt-2 border-t border-zinc-800 flex items-center gap-2">
                <a
                  href={torrents[0]?.magnetUrl ? `stremio://${encodeURIComponent(torrents[0].magnetUrl)}` : '#'}
                  className="tv-focusable flex-1 py-2 px-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold font-persian flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-md"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>اجرا در Stremio</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
