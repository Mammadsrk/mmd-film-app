import React, { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import { AlertCircle, RotateCcw, RefreshCw, ExternalLink } from 'lucide-react';

interface HlsVideoPlayerProps {
  src: string;
  poster?: string;
  title?: string;
  subtitlesUrl?: string;
  autoPlay?: boolean;
  onFallback?: () => void;
  className?: string;
}

export const HlsVideoPlayer: React.FC<HlsVideoPlayerProps> = ({
  src,
  poster,
  title,
  subtitlesUrl,
  autoPlay = true,
  onFallback,
  className = 'w-full h-full object-contain',
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [currentSrc, setCurrentSrc] = useState<string>(src);
  const [hasTriedProxy, setHasTriedProxy] = useState<boolean>(src.startsWith('/api/stream-proxy'));
  const [hasError, setHasError] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isRetryingWithProxy, setIsRetryingWithProxy] = useState<boolean>(false);

  useEffect(() => {
    setCurrentSrc(src);
    setHasTriedProxy(src.startsWith('/api/stream-proxy'));
    setHasError(false);
    setErrorMessage('');
    setIsRetryingWithProxy(false);
  }, [src]);

  const triggerProxyFallback = (reason: string) => {
    if (!hasTriedProxy && currentSrc.startsWith('http') && !currentSrc.startsWith('/api/stream-proxy')) {
      console.warn(`[HlsVideoPlayer] ${reason} - Retrying via /api/stream-proxy...`);
      setIsRetryingWithProxy(true);
      setHasTriedProxy(true);
      const proxied = `/api/stream-proxy?url=${encodeURIComponent(currentSrc)}`;
      setCurrentSrc(proxied);
      setTimeout(() => setIsRetryingWithProxy(false), 800);
    } else {
      setHasError(true);
      setErrorMessage(reason);
    }
  };

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !currentSrc) return;

    setHasError(false);
    setErrorMessage('');

    const isHls =
      currentSrc.includes('.m3u8') ||
      currentSrc.includes('application/x-mpegURL') ||
      currentSrc.includes('format=hls');

    if (isHls) {
      if (Hls.isSupported()) {
        const hls = new Hls({
          enableWorker: true,
          lowLatencyMode: true,
          backBufferLength: 90,
        });
        hlsRef.current = hls;

        hls.loadSource(currentSrc);
        hls.attachMedia(video);

        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          if (autoPlay) {
            video.play().catch((err) => {
              console.warn('[Hls autoplays]', err);
            });
          }
        });

        hls.on(Hls.Events.ERROR, (event, data) => {
          if (data.fatal) {
            switch (data.type) {
              case Hls.ErrorTypes.NETWORK_ERROR:
                console.warn('[Hls] Fatal network error, attempting recovery...', data);
                if (!hasTriedProxy) {
                  hls.destroy();
                  triggerProxyFallback('خطای شبکه در بارگذاری فایل manifest یا چانک‌های ویدیو. سوئیچ به پروکسی...');
                } else {
                  hls.startLoad();
                }
                break;
              case Hls.ErrorTypes.MEDIA_ERROR:
                console.warn('[Hls] Fatal media error, recovering...', data);
                hls.recoverMediaError();
                break;
              default:
                console.warn('[Hls] Fatal unrecoverable error:', data);
                hls.destroy();
                triggerProxyFallback('پخش جریان HLS ناموفق بود.');
                break;
            }
          }
        });
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        // Native Safari / iOS HLS
        video.src = currentSrc;
        if (autoPlay) {
          video.play().catch(() => {});
        }
      } else {
        triggerProxyFallback('مرورگر شما از پروتکل HLS پشتیبانی نمی‌کند.');
      }
    } else {
      // Direct MP4 / WebM video stream
      video.src = currentSrc;
      if (autoPlay) {
        video.play().catch(() => {});
      }
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
      if (video) {
        video.removeAttribute('src');
        video.load();
      }
    };
  }, [currentSrc, autoPlay]);

  const handleVideoError = () => {
    const video = videoRef.current;
    let detail = 'خطا در بارگذاری فایل ویدیو.';
    if (video?.error) {
      switch (video.error.code) {
        case MediaError.MEDIA_ERR_ABORTED:
          detail = 'دریافت ویدیو توسط مرورگر یا کاربر لغو شد.';
          break;
        case MediaError.MEDIA_ERR_NETWORK:
          detail = 'خطای شبکه در دریافت جریان ویدیو. دسترسی CDN یا CORS مسدود است.';
          break;
        case MediaError.MEDIA_ERR_DECODE:
          detail = 'خطا در رمزگشایی تصویر. کدک ویدیو (احتمالاً HEVC/x265) در این مرورگر پشتیبانی نمی‌شود.';
          break;
        case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
          detail = 'آدرس یا فرمت فایل ویدیو پشتیبانی نشد یا بدون هدر معتبر CORS رد شد.';
          break;
      }
    }

    triggerProxyFallback(detail);
  };

  if (hasError) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center p-6 bg-zinc-950 text-center font-persian space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
          <AlertCircle className="w-6 h-6" />
        </div>

        <div className="space-y-1.5 max-w-md">
          <p className="text-sm text-zinc-200 font-bold">خطا در پخش مستقیم ویدیو (سطح ۱)</p>
          <p className="text-xs text-zinc-400 leading-relaxed">{errorMessage}</p>
        </div>

        <div className="flex items-center gap-2 flex-wrap justify-center pt-2">
          {!hasTriedProxy && (
            <button
              type="button"
              onClick={() => triggerProxyFallback('تلاش دستی با پروکسی')}
              className="tv-focusable px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>پخش با پروکسی دورزننده فیلتر/CORS</span>
            </button>
          )}

          {onFallback && (
            <button
              type="button"
              onClick={onFallback}
              className="tv-focusable px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>سوئیچ به سرورهای آینه (سطح ۲)</span>
            </button>
          )}

          {currentSrc.startsWith('http') && (
            <a
              href={currentSrc}
              target="_blank"
              rel="noreferrer"
              className="tv-focusable px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium transition-all flex items-center gap-1.5"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>باز کردن لینک در تب جدید</span>
            </a>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full bg-black flex items-center justify-center">
      {isRetryingWithProxy && (
        <div className="absolute inset-0 z-20 bg-black/80 flex items-center justify-center font-persian text-xs text-indigo-300 gap-2">
          <RefreshCw className="w-4 h-4 animate-spin" />
          <span>در حال اتصال مجدد از طریق پروکسی بهینه‌ساز...</span>
        </div>
      )}
      <video
        ref={videoRef}
        controls
        playsInline
        poster={poster}
        crossOrigin="anonymous"
        onError={handleVideoError}
        className={className}
      >
        {subtitlesUrl && (
          <track
            kind="subtitles"
            src={subtitlesUrl}
            srcLang="fa"
            label="زیرنویس فارسی (Persian)"
            default
          />
        )}
        مرورگر شما از پخش ویدیو پشتیبانی نمی‌کند.
      </video>
    </div>
  );
};
