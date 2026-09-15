import React, { useEffect, useRef, useState } from 'react';
import {
  Download,
  Copy,
  Check,
  Radio,
  Tv,
  AlertTriangle,
  RotateCcw,
  Layers,
  ArrowRight,
} from 'lucide-react';
import type { GlobalTorrentItem } from '../types';

interface WebTorrentPlayerProps {
  torrent: GlobalTorrentItem;
  title: string;
  onFallbackToMirrors?: () => void;
  onClose?: () => void;
}

// Trackers supporting WebRTC data channels for in-browser streaming
const WEBRTC_TRACKERS = [
  'wss://tracker.openwebtorrent.com',
  'wss://tracker.btorrent.xyz',
  'wss://tracker.fastcast.nz',
  'wss://tracker.files.fm:7073/announce',
];

/**
 * Dynamic WebTorrent loader with fallback and verification
 */
async function getWebTorrentClient(): Promise<any> {
  if (typeof window !== 'undefined' && (window as any).WebTorrent) {
    return new (window as any).WebTorrent({
      tracker: {
        rtcConfig: {
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:global.stun.twilio.com:3478' },
          ],
        },
      },
    });
  }

  return new Promise((resolve, reject) => {
    const existingScript = document.querySelector('script[src*="webtorrent.min.js"]');
    if (existingScript) {
      existingScript.addEventListener('load', () => {
        if ((window as any).WebTorrent) {
          resolve(new (window as any).WebTorrent());
        } else {
          reject(new Error('WebTorrent CDN unavailable'));
        }
      });
      existingScript.addEventListener('error', () => reject(new Error('WebTorrent CDN unavailable')));
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/webtorrent@latest/webtorrent.min.js';
    script.async = true;
    script.onload = () => {
      if ((window as any).WebTorrent) {
        resolve(new (window as any).WebTorrent());
      } else {
        reject(new Error('WebTorrent CDN unavailable'));
      }
    };
    script.onerror = () => reject(new Error('WebTorrent CDN unavailable'));
    document.head.appendChild(script);
  });
}

export const WebTorrentPlayer: React.FC<WebTorrentPlayerProps> = ({
  torrent,
  title,
  onFallbackToMirrors,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const clientRef = useRef<any>(null);
  const activeTorrentRef = useRef<any>(null);

  const [status, setStatus] = useState<
    'initializing' | 'connecting' | 'metadata' | 'buffering' | 'playing' | 'fallback'
  >('initializing');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [numPeers, setNumPeers] = useState<number>(0);
  const [progress, setProgress] = useState<number>(0);
  const [downloadSpeed, setDownloadSpeed] = useState<string>('0 KB/s');
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [showPeerWarning, setShowPeerWarning] = useState<boolean>(false);

  // Format magnet URL to guarantee WebRTC trackers are attached
  const buildWebRtcMagnet = (magnet: string): string => {
    let finalMagnet = magnet;
    for (const tr of WEBRTC_TRACKERS) {
      if (!finalMagnet.includes(encodeURIComponent(tr))) {
        finalMagnet += `&tr=${encodeURIComponent(tr)}`;
      }
    }
    return finalMagnet;
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(torrent.magnetUrl);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2500);
  };

  useEffect(() => {
    let isCancelled = false;
    let peerTimeoutTimer: any = null;
    let peerWarningTimer: any = null;

    const loadAndStartWebTorrent = async () => {
      try {
        setStatus('initializing');
        setShowPeerWarning(false);

        const client = await getWebTorrentClient();
        if (isCancelled) {
          try { client.destroy(); } catch (_) {}
          return;
        }

        clientRef.current = client;
        setStatus('connecting');

        const magnetWithTrackers = buildWebRtcMagnet(torrent.magnetUrl);

        // 12-second watchdog timer: if peers count remains 0, warn the user and suggest external player / direct magnet
        peerWarningTimer = setTimeout(() => {
          if (!isCancelled && (!activeTorrentRef.current || activeTorrentRef.current.numPeers === 0)) {
            setShowPeerWarning(true);
          }
        }, 12000);

        // Total timeout timer: 20 seconds before offering full fallback screen
        peerTimeoutTimer = setTimeout(() => {
          if (!isCancelled && (!activeTorrentRef.current || activeTorrentRef.current.numPeers === 0)) {
            setStatus('fallback');
            setErrorMessage('تعداد پیرهای سازگار با مرورگر (WebRTC) ناکافی است. می‌توانید لینک مگنت را کپی کرده یا با نرم‌افزارهای تورنت/دانلود منیجر باز کنید.');
          }
        }, 20000);

        client.add(magnetWithTrackers, { announce: WEBRTC_TRACKERS }, (torrentInstance: any) => {
          if (isCancelled) return;
          activeTorrentRef.current = torrentInstance;
          setStatus('metadata');

          // Find playable video file (prefer mp4 and webm, then mkv)
          const videoFile =
            torrentInstance.files.find((f: any) => {
              const name = (f.name || '').toLowerCase();
              return name.endsWith('.mp4') || name.endsWith('.webm');
            }) ||
            torrentInstance.files.find((f: any) => {
              const name = (f.name || '').toLowerCase();
              return name.endsWith('.mkv') || name.endsWith('.m4v');
            }) ||
            torrentInstance.files[0];

          if (!videoFile) {
            setStatus('fallback');
            setErrorMessage('فایل ویدیویی سازگار در این تورنت یافت نشد.');
            return;
          }

          setStatus('buffering');

          if (videoRef.current) {
            videoFile.renderTo(
              videoRef.current,
              { autoplay: true, controls: true },
              (err: any) => {
                if (err) {
                  console.warn('[WebTorrent render error]', err);
                  setStatus('fallback');
                  setErrorMessage('فرمت این ویدیو (احتمالاً HEVC/x265) توسط مرورگر پشتیبانی نمی‌شود. لطفاً با نرم‌افزار تورنت دانلود کنید.');
                } else {
                  setStatus('playing');
                }
              }
            );
          }

          // Monitor download speed, progress, and peer count
          torrentInstance.on('download', () => {
            if (isCancelled) return;
            const peers = torrentInstance.numPeers || 0;
            setNumPeers(peers);
            if (peers > 0) {
              setShowPeerWarning(false);
            }
            setProgress(Math.round(torrentInstance.progress * 100));

            const bytesSec = torrentInstance.downloadSpeed;
            if (bytesSec > 1048576) {
              setDownloadSpeed((bytesSec / 1048576).toFixed(1) + ' MB/s');
            } else {
              setDownloadSpeed(Math.round(bytesSec / 1024) + ' KB/s');
            }

            if (peers > 0 && status === 'connecting') {
              setStatus('buffering');
            }
          });

          torrentInstance.on('wire', () => {
            if (isCancelled) return;
            const peers = torrentInstance.numPeers || 0;
            setNumPeers(peers);
            if (peers > 0) setShowPeerWarning(false);
          });

          torrentInstance.on('noPeers', () => {
            if (isCancelled) return;
            setNumPeers(0);
          });
        });

        client.on('error', (err: any) => {
          console.warn('[WebTorrent Client Error]', err);
          if (!isCancelled) {
            setStatus('fallback');
            setErrorMessage(err.message || 'خطا در ارتباط شبکه تورنت');
          }
        });
      } catch (err: any) {
        console.warn('[WebTorrent Init Error]', err);
        if (!isCancelled) {
          setStatus('fallback');
          setErrorMessage(err.message || 'اتصال به موتور تورنت مرورگر با خطا مواجه شد.');
        }
      }
    };

    loadAndStartWebTorrent();

    return () => {
      isCancelled = true;
      if (peerWarningTimer) clearTimeout(peerWarningTimer);
      if (peerTimeoutTimer) clearTimeout(peerTimeoutTimer);
      if (clientRef.current) {
        try {
          clientRef.current.destroy();
        } catch (_) {}
      }
    };
  }, [torrent.magnetUrl]);

  // Fallback UI when WebRTC peers are unreachable or formats cannot be decoded
  if (status === 'fallback') {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center p-6 bg-gradient-to-b from-zinc-950 via-zinc-900 to-black text-center select-none font-persian">
        <div className="max-w-md w-full p-6 rounded-3xl bg-zinc-900/90 border border-zinc-800 shadow-2xl space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400">
            <AlertTriangle className="w-7 h-7" />
          </div>

          <div className="space-y-1.5">
            <h3 className="text-base font-black text-zinc-100">
              پخش مستقیم تورنت در مرورگر میسر نیست
            </h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              {errorMessage ||
                'سیدرهای تحت وب (WebRTC) دردسترس نیستند یا کدک ویدیو (x265/HEVC) نیازمند نرم‌افزار پخش اختصاصی است.'}
            </p>
          </div>

          <div className="p-3 rounded-2xl bg-zinc-950/80 border border-zinc-800 text-right space-y-1 text-xs">
            <div className="text-zinc-300 font-bold font-mono truncate" title={torrent.name}>
              {torrent.name || title}
            </div>
            <div className="flex items-center justify-between text-zinc-400 font-mono text-[11px]">
              <span>کیفیت: {torrent.quality}</span>
              <span>حجم: {torrent.size}</span>
            </div>
          </div>

          {/* Graceful Fallback Action Buttons */}
          <div className="space-y-2.5 pt-2">
            <div className="grid grid-cols-2 gap-2">
              <a
                href={torrent.magnetUrl}
                className="tv-focusable py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md transition-all cursor-pointer"
                title="دانلود با qBittorrent یا uTorrent"
              >
                <Download className="w-4 h-4" />
                <span>دانلود تورنت</span>
              </a>

              <button
                type="button"
                onClick={handleCopy}
                className={`tv-focusable py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all border cursor-pointer ${
                  isCopied
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
                    : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border-zinc-700'
                }`}
              >
                {isCopied ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span>کپی شد!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 text-zinc-400" />
                    <span>کپی مگنت</span>
                  </>
                )}
              </button>
            </div>

            <div className="flex items-center gap-2">
              <a
                href={`stremio://${encodeURIComponent(torrent.magnetUrl)}`}
                className="tv-focusable flex-1 py-2 px-3 rounded-xl bg-purple-950/60 hover:bg-purple-600 border border-purple-500/40 text-purple-300 hover:text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <Tv className="w-3.5 h-3.5" />
                <span>پخش در Stremio</span>
              </a>

              {onFallbackToMirrors && (
                <button
                  type="button"
                  onClick={onFallbackToMirrors}
                  className="tv-focusable flex-1 py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-md"
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>سرورهای آنلاین</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full bg-black flex items-center justify-center overflow-hidden font-persian">
      {/* Video Element rendered by WebTorrent */}
      <video
        ref={videoRef}
        controls
        playsInline
        className={`w-full h-full object-contain ${
          status === 'playing' ? 'block' : 'opacity-0'
        }`}
      />

      {/* Buffering & Peer Progress Overlay */}
      {status !== 'playing' && (
        <div className="absolute inset-0 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-6 space-y-4">
          <div className="relative w-16 h-16 flex items-center justify-center">
            <div className="w-16 h-16 rounded-full border-4 border-emerald-500/20 border-t-emerald-400 animate-spin" />
            <Radio className="w-6 h-6 text-emerald-400 absolute" />
          </div>

          <div className="text-center space-y-1.5 max-w-sm">
            <h4 className="text-sm sm:text-base font-bold text-white">
              {status === 'initializing' && 'در حال راه‌اندازی کلاینت WebTorrent مرورگر...'}
              {status === 'connecting' && 'در حال اتصال به ترکرها و سیدرهای WebRTC...'}
              {status === 'metadata' && 'در حال دریافت متادیتای تورنت...'}
              {status === 'buffering' && 'در حال بافر و آماده‌سازی جریان استریم...'}
            </h4>
            <p className="text-xs text-zinc-400 font-mono truncate max-w-xs mx-auto">
              {torrent.name || title}
            </p>
          </div>

          {/* Active Buffering / Peer Progress State */}
          <div className="w-full max-w-xs space-y-2">
            <div className="flex items-center justify-between text-xs text-zinc-400 font-mono">
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                سیدرهای متصل: {numPeers}
              </span>
              <span>سرعت: {downloadSpeed}</span>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-2 rounded-full bg-zinc-800 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-cyan-400 transition-all duration-300 rounded-full"
                style={{ width: `${Math.max(5, progress)}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-[11px] text-zinc-500 font-mono">
              <span>بافر تورنت: {progress}%</span>
              <span>کیفیت: {torrent.quality}</span>
            </div>
          </div>

          {/* 12-second Peer Discovery Watchdog Warning Banner */}
          {showPeerWarning && (
            <div className="w-full max-w-sm p-3 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-200 text-xs text-right space-y-2 animate-fadeIn">
              <div className="flex items-center gap-1.5 font-bold text-amber-300">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                <span>تعداد پیرهای سازگار با مرورگر ناکافی است</span>
              </div>
              <p className="text-[11px] leading-relaxed text-zinc-300 font-persian">
                سیدرهای مستقیم تحت وب در دسترس نیستند. می‌توانید لینک مگنت را کپی کرده یا با نرم‌افزارهای تورنت/دانلود منیجر باز کنید.
              </p>
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleCopy}
                  className="flex-1 py-1.5 px-2.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-[11px] font-bold flex items-center justify-center gap-1 transition-all cursor-pointer font-persian"
                >
                  <Copy className="w-3 h-3" />
                  <span>{isCopied ? 'کپی شد' : 'کپی لینک مگنت'}</span>
                </button>
                <a
                  href={torrent.magnetUrl}
                  className="flex-1 py-1.5 px-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold flex items-center justify-center gap-1 transition-all font-persian"
                >
                  <Download className="w-3 h-3" />
                  <span>باز کردن در دانلودر</span>
                </a>
              </div>
            </div>
          )}

          {/* Fast Escape: fallback to online mirrors button */}
          <div className="pt-2 flex items-center gap-2">
            {onFallbackToMirrors && (
              <button
                type="button"
                onClick={onFallbackToMirrors}
                className="tv-focusable px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-bold text-zinc-300 hover:text-white flex items-center gap-1.5 transition-all"
              >
                <span>پخش با سرور آنلاین</span>
                <ArrowRight className="w-3.5 h-3.5 rotate-180" />
              </button>
            )}

            <button
              type="button"
              onClick={handleCopy}
              className="tv-focusable px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-700 text-zinc-300 hover:text-white text-xs font-bold flex items-center gap-1.5 transition-all"
            >
              <Copy className="w-3.5 h-3.5 text-zinc-400" />
              <span>{isCopied ? 'کپی شد' : 'کپی مگنت'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
