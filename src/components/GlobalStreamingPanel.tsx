import React, { useState } from 'react';
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
  Sliders,
} from 'lucide-react';
import {
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
  isSubtitleEnabled = true,
  onToggleSubtitle,
  mediaTitle,
  title,
  titleFa,
}) => {
  const [copiedHash, setCopiedHash] = useState<string | null>(null);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  const activeDirectIndex = selectedDirectIndex ?? selectedQualityIndex ?? 0;
  const activeMirrorId = selectedMirrorId ?? '';
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
    const fullUrl = `${window.location.origin}/api/global-proxy?url=${encodeURIComponent(url)}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedUrl(url);
    setTimeout(() => setCopiedUrl(null), 2500);
  };

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

  const directStreams = data?.directStreams || [];
  const embedMirrors = data?.embedMirrors || [];
  const torrents = data?.torrents || [];
  const pingMs = data?.serverPingMs || 26;

  return (
    <div className="mt-6 space-y-6">
      {/* 1. Global Streaming Banner & Status Bar */}
      <div className="relative overflow-hidden p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-indigo-950/40 via-[#0a0c16]/80 to-zinc-950/90 border border-indigo-500/40 shadow-[0_8px_32px_rgba(79,70,229,0.15)] backdrop-blur-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <div className="p-1.5 rounded-xl bg-indigo-500/20 border border-indigo-400/40 text-indigo-300">
                <Globe className="w-4 h-4" />
              </div>
              <h3 className="text-base sm:text-lg font-black text-white font-persian">
                شبکه استریم بین‌المللی و تجمیع‌کننده جهانی (Global CDN Engine)
              </h3>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-indigo-500/20 border border-indigo-400/40 text-indigo-300">
                Tier 1 / 2 / 3
              </span>
            </div>
            <p className="text-xs text-zinc-400 font-persian leading-relaxed">
              تماشای مستقیم با نهایت کیفیت بلوری، اتصال پایدار، عبور خودکار از محدودیت‌ها و پشتیبانی هماهنگ از زیرنویس فارسی WebVTT.
            </p>
          </div>

          {/* Telemetry & Subtitle Controls */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-950/50 border border-emerald-500/40 text-emerald-300 text-xs font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>پراکسی هوشمند: {pingMs}ms</span>
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
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-5 pt-4 border-t border-indigo-500/20">
          <button
            type="button"
            onClick={() => onSelectTier('tier1_direct')}
            className={`p-3 rounded-2xl border text-right transition-all cursor-pointer ${
              selectedTier === 'tier1_direct'
                ? 'bg-indigo-600/30 border-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.3)] ring-1 ring-indigo-400/50 text-white'
                : 'bg-zinc-900/40 border-zinc-800/80 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold font-persian">سطح ۱: استریم مستقیم CDN</span>
              <Zap className="w-4 h-4 text-indigo-400" />
            </div>
            <p className="text-[11px] opacity-75 font-persian">کیفیت 4K و 1080p با بافر بالا و زیرنویس هماهنگ</p>
          </button>

          <button
            type="button"
            onClick={() => onSelectTier('tier2_embed')}
            className={`p-3 rounded-2xl border text-right transition-all cursor-pointer ${
              selectedTier === 'tier2_embed'
                ? 'bg-indigo-600/30 border-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.3)] ring-1 ring-indigo-400/50 text-white'
                : 'bg-zinc-900/40 border-zinc-800/80 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold font-persian">سطح ۲: آینه‌های جهانی VidSrc</span>
              <Layers className="w-4 h-4 text-cyan-400" />
            </div>
            <p className="text-[11px] opacity-75 font-persian">سرورهای امبد جهانی با پشتیبانی چندزبانه</p>
          </button>

          <button
            type="button"
            onClick={() => onSelectTier('tier3_torrent')}
            className={`p-3 rounded-2xl border text-right transition-all cursor-pointer ${
              selectedTier === 'tier3_torrent'
                ? 'bg-indigo-600/30 border-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.3)] ring-1 ring-indigo-400/50 text-white'
                : 'bg-zinc-900/40 border-zinc-800/80 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold font-persian">سطح ۳: تورنت و مگنت P2P</span>
              <HardDrive className="w-4 h-4 text-emerald-400" />
            </div>
            <p className="text-[11px] opacity-75 font-persian">لینک مستقیم Magnet با سیدر و لیدر بالا</p>
          </button>
        </div>
      </div>

      {/* 3. TIER 1: Direct CDN Streams */}
      {selectedTier === 'tier1_direct' && (
        <div className="space-y-3.5">
          <div className="flex items-center justify-between text-xs text-zinc-400 font-persian">
            <span>کیفیت‌های آماده پخش و دریافت با سرعت بالا:</span>
            <span className="text-emerald-400 flex items-center gap-1 font-mono">
              <ShieldCheck className="w-3.5 h-3.5" />
              Anti-VPN Bypass Active
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            {directStreams.map((stream, idx) => {
              const isSelected = activeDirectIndex === idx;
              return (
                <div
                  key={idx}
                  className={`p-4 rounded-2xl border transition-all duration-300 flex flex-col justify-between ${
                    isSelected
                      ? 'bg-indigo-950/40 border-indigo-500/70 shadow-lg shadow-indigo-950/30 ring-1 ring-indigo-500/30'
                      : 'bg-zinc-900/60 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900/90'
                  }`}
                >
                  <div className="space-y-2 mb-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-black text-white font-mono">{stream.quality}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/20 text-indigo-300 font-mono">
                        {stream.format.toUpperCase()}
                      </span>
                    </div>

                    <div className="text-[11px] text-zinc-400 space-y-1 font-persian">
                      <p>صدا: <strong className="text-zinc-300 font-sans">{stream.audioLanguage}</strong></p>
                      {stream.bitrate && <p>بیت‌ریت: <strong className="text-zinc-300 font-mono">{stream.bitrate}</strong></p>}
                    </div>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-zinc-800/80">
                    <button
                      type="button"
                      onClick={() => handleSelectDirect(stream, idx)}
                      className="tv-focusable w-full py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold font-persian flex items-center justify-center gap-1.5 transition-all shadow-md cursor-pointer"
                    >
                      <Play className="w-3.5 h-3.5" />
                      <span>پخش آنلاین در پلیر بالا</span>
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleCopyStreamLink(stream.url)}
                        className="tv-focusable flex-1 py-1.5 px-2 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 text-[11px] font-medium font-persian flex items-center justify-center gap-1 transition-all cursor-pointer"
                        title="کپی لینک استریم مستقیم برای استفاده در VLC یا PotPlayer"
                      >
                        {copiedUrl === stream.url ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            <span className="text-emerald-400">لینک کپی شد</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5 text-zinc-400" />
                            <span>کپی لینک استریم</span>
                          </>
                        )}
                      </button>

                      <a
                        href={`/api/global-proxy?url=${encodeURIComponent(stream.url)}&download=true`}
                        download
                        className="tv-focusable px-3 py-1.5 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 hover:text-white text-[11px] font-medium font-persian flex items-center justify-center gap-1 transition-all cursor-pointer"
                        title="دانلود مستقیم فایل"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>دانلود</span>
                      </a>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 4. TIER 2: Embed Mirrors */}
      {selectedTier === 'tier2_embed' && (
        <div className="space-y-3.5">
          <div className="text-xs text-zinc-400 font-persian">
            سرورهای جهانی پخش آنلاین بدون نیاز به فیلترشکن:
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            {embedMirrors.map((mirror) => {
              const isSelected = activeMirrorId === mirror.id;
              return (
                <div
                  key={mirror.id}
                  className={`p-3.5 rounded-2xl border transition-all duration-300 flex flex-col justify-between ${
                    isSelected
                      ? 'bg-cyan-950/40 border-cyan-500/70 shadow-lg shadow-cyan-950/30 ring-1 ring-cyan-500/30'
                      : 'bg-zinc-900/60 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900/90'
                  }`}
                >
                  <div className="mb-3 space-y-1">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-zinc-100 font-persian">{mirror.name}</h4>
                      <span className="w-2 h-2 rounded-full bg-cyan-400" />
                    </div>
                    <p className="text-[11px] text-zinc-400 font-mono">{mirror.provider}</p>
                  </div>

                  <div className="space-y-1.5 pt-2 border-t border-zinc-800/80">
                    <button
                      type="button"
                      onClick={() => handleSelectMirror(mirror)}
                      className="tv-focusable w-full py-1.5 px-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold font-persian flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm"
                    >
                      <Play className="w-3.5 h-3.5" />
                      <span>پخش با این سرور</span>
                    </button>

                    <a
                      href={mirror.url}
                      target="_blank"
                      rel="noreferrer"
                      className="tv-focusable w-full py-1 px-2 rounded-lg bg-zinc-800/60 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 text-[10px] font-persian flex items-center justify-center gap-1 transition-all"
                    >
                      <span>باز کردن در تب جدید</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 5. TIER 3: Torrents & Magnets */}
      {selectedTier === 'tier3_torrent' && (
        <div className="space-y-3.5">
          <div className="flex items-center justify-between text-xs text-zinc-400 font-persian">
            <span>لینک‌های تورنت پرسرعت با سیدر بالا (تست‌شده و فعال):</span>
            <span className="text-emerald-400 font-mono text-[11px]">DHT Network Synced</span>
          </div>

          <div className="space-y-2.5">
            {torrents.map((torrent, idx) => {
              const isCopied = copiedHash === torrent.hash;
              return (
                <div
                  key={idx}
                  className="p-3.5 rounded-2xl bg-zinc-900/60 border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900/90 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-black font-mono">
                        {torrent.quality}
                      </span>
                      <span className="text-xs font-bold text-zinc-200 font-mono">
                        {torrent.type}
                      </span>
                      <span className="text-xs text-zinc-400 font-mono">
                        ({torrent.size})
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-[11px] text-zinc-400 font-mono">
                      <span className="text-emerald-400 font-bold flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {torrent.seeds} Seeds
                      </span>
                      <span className="text-cyan-400 font-bold">
                        {torrent.peers} Peers
                      </span>
                      <span className="text-zinc-500 truncate max-w-[200px]">
                        Hash: {torrent.hash}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    <button
                      type="button"
                      onClick={() => handleCopyMagnet(torrent.magnetUrl, torrent.hash)}
                      className={`tv-focusable px-3.5 py-1.5 rounded-xl text-xs font-bold font-persian flex items-center gap-1.5 transition-all cursor-pointer border ${
                        isCopied
                          ? 'bg-emerald-600 text-white border-emerald-500 shadow-md'
                          : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border-zinc-700'
                      }`}
                    >
                      {isCopied ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>کپی شد!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-zinc-400" />
                          <span>کپی لینک مگنت</span>
                        </>
                      )}
                    </button>

                    <a
                      href={torrent.magnetUrl}
                      className="tv-focusable px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold font-persian flex items-center gap-1 transition-all shadow-md cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>دانلود مستقیم مگنت</span>
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
