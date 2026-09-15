import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  X,
  Play,
  Share2,
  Check,
  Film,
  Tv,
  Globe,
  Loader2,
  ChevronDown,
  Sparkles,
  ArrowRight,
  ChevronRight,
  Copy,
} from 'lucide-react';
import {
  MediaItem,
  MovieDetailsData,
  MovieSourceHub,
  MovieTrailer,
  AparatFullMovie,
  AparatQuality,
  AparatSeriesData,
  AparatEpisode,
} from '../types';
import { SmartStreamPlayer } from './SmartStreamPlayer';
import { HlsVideoPlayer } from './HlsVideoPlayer';
import { VODHero } from './vod/VODHero';
import { VODStreamTab } from './vod/VODStreamTab';
import { VODDownloadTab } from './vod/VODDownloadTab';
import { VODDetailsTab } from './vod/VODDetailsTab';

interface PlayerCopyStreamMenuProps {
  qualities: AparatQuality[];
  primaryUrl: string;
  onCopy: (url: string) => void;
  copiedUrl: string | null;
}

const PlayerCopyStreamMenu: React.FC<PlayerCopyStreamMenuProps> = ({
  qualities,
  primaryUrl,
  onCopy,
  copiedUrl,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  if (!qualities.length && !primaryUrl) return null;

  return (
    <div className={`relative ${isOpen ? 'z-50' : 'z-10'}`} ref={menuRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`tv-focusable flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-md ${
          isOpen
            ? 'bg-amber-400 text-black border border-amber-400'
            : 'bg-zinc-800/90 hover:bg-zinc-700 text-zinc-200 hover:text-white border border-zinc-700/70'
        }`}
        title="کپی لینک پخش برای پلیر خارجی (VLC، PotPlayer)"
      >
        <Copy className={`w-3.5 h-3.5 ${isOpen ? 'text-black' : 'text-amber-400'}`} />
        <span className="hidden sm:inline">کپی لینک پخش</span>
        <ChevronDown className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180 text-black' : 'text-zinc-400'}`} />
      </button>

      {isOpen && (
        <div
          className="absolute left-0 top-full mt-2 w-72 sm:w-80 bg-[#10121a] border border-zinc-700/90 rounded-2xl shadow-[0_25px_60px_rgba(0,0,0,0.95)] p-2.5 z-[100] animate-scale-up space-y-1.5 backdrop-blur-2xl"
          dir="rtl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-2.5 py-1 border-b border-zinc-800 flex items-center justify-between">
            <span className="text-[11px] font-bold text-zinc-100 block">انتخاب کیفیت جهت کپی:</span>
            <span className="text-[9px] text-zinc-400">پلیر خارجی / VLC</span>
          </div>

          {qualities.length > 0 ? (
            <div className="max-h-52 overflow-y-auto space-y-1 custom-scrollbar pr-0.5">
              {qualities.map((q, idx) => {
                const isCopied = copiedUrl === q.url;
                const cleanQualityText = q.text.replace(/^با\s+/, '');
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      onCopy(q.url);
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs transition-all text-right cursor-pointer ${
                      isCopied
                        ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-500/40'
                        : 'hover:bg-zinc-800 text-zinc-300 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-amber-400/80" />
                      <span className="font-bold text-[11px]">{cleanQualityText}</span>
                      {q.size && (
                        <span className="text-[10px] text-zinc-500 font-mono">({q.size})</span>
                      )}
                    </div>
                    <span className="flex items-center gap-1 text-[10px] text-zinc-400">
                      {isCopied ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-emerald-400 font-bold">کپی شد!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3 text-zinc-500" />
                          <span>کپی</span>
                        </>
                      )}
                    </span>
                  </button>
                );
              })}
            </div>
          ) : (
            primaryUrl && (
              <button
                type="button"
                onClick={() => {
                  onCopy(primaryUrl);
                  setIsOpen(false);
                }}
                className="w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs hover:bg-zinc-800 text-zinc-300 hover:text-white transition-all text-right cursor-pointer"
              >
                <span className="font-bold text-[11px]">لینک استریم مستقیم</span>
                <span className="flex items-center gap-1 text-[10px] text-zinc-400">
                  {copiedUrl === primaryUrl ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400 font-bold">کپی شد!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3 text-zinc-500" />
                      <span>کپی</span>
                    </>
                  )}
                </span>
              </button>
            )
          )}
        </div>
      )}
    </div>
  );
};

interface VODModalProps {
  item: MediaItem | null;
  onClose: () => void;
}

export const VODModal: React.FC<VODModalProps> = ({ item, onClose }) => {
  if (!item) return null;

  // Active view states
  const [activeTab, setActiveTab] = useState<'stream' | 'downloads' | 'details'>('stream');
  const [details, setDetails] = useState<MovieDetailsData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Video playback states
  const [isPlayingVideo, setIsPlayingVideo] = useState<boolean>(false);
  const [videoPlayMode, setVideoPlayMode] = useState<'trailer' | 'full_movie' | 'episode' | 'global' | 'embed'>('trailer');
  const [embedUrl, setEmbedUrl] = useState<string | null>(null);
  const [selectedTrailerIndex, setSelectedTrailerIndex] = useState<number>(0);
  const [selectedQualityUrl, setSelectedQualityUrl] = useState<string | null>(null);
  const [selectedQualityProfile, setSelectedQualityProfile] = useState<string | null>(null);

  // Series state
  const [selectedSeasonNumber, setSelectedSeasonNumber] = useState<number>(1);
  const [activePlayingEpisode, setActivePlayingEpisode] = useState<AparatEpisode | null>(null);

  // Aparat & Namasha search state
  const [aparatSearchResult, setAparatSearchResult] = useState<AparatFullMovie | null>(null);
  const [aparatSeriesResult, setAparatSeriesResult] = useState<AparatSeriesData | null>(null);
  const [customAparatQuery, setCustomAparatQuery] = useState<string>('');
  const [isSearchingAparat, setIsSearchingAparat] = useState<boolean>(false);
  const [alternateAparatResults, setAlternateAparatResults] = useState<any[]>([]);
  const [aparatSearchError, setAparatSearchError] = useState<string | null>(null);

  // Clipboard feedback
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [copiedStreamUrl, setCopiedStreamUrl] = useState<string | null>(null);

  const modalRef = useRef<HTMLDivElement>(null);
  const playerContainerRef = useRef<HTMLDivElement>(null);

  const isSeriesMode = item?.type === 'series' || (details?.totalSeasons ? details.totalSeasons > 0 : false);
  const activeMediaIdRef = useRef<string | number | null>(null);

  // Fetch movie details on mount or when itemId changes
  useEffect(() => {
    if (!item) return;

    let isMounted = true;
    const currentItemId = item.id || item.tmdbId || item.title;
    const isNewItem = activeMediaIdRef.current !== currentItemId;
    activeMediaIdRef.current = currentItemId;

    if (isNewItem) {
      setIsLoading(true);
      setIsPlayingVideo(false);
      setAparatSearchResult(null);
      setAparatSeriesResult(null);
      setDetails(null);
    }

    const cleanTitle = (item.title || '').replace(/\s*\(\d{4}\)$/, '').trim();
    const cleanFa = (item.titleFa || item.title || '').replace(/\s*\(\d{4}\)$/, '').trim();
    setCustomAparatQuery(cleanFa || cleanTitle);
    setAlternateAparatResults([]);
    setAparatSearchError(null);

    // Auto-search Aparat when opening a movie
    if (isNewItem) {
      setIsSearchingAparat(true);
      setAparatSearchError(null);
      const searchTitle = cleanFa || cleanTitle;
      fetch(`/api/aparat-search?query=${encodeURIComponent(searchTitle)}`)
        .then((res) => res.json())
        .then((json) => {
          if (!isMounted) return;
          if (json.success && Array.isArray(json.data) && json.data.length > 0) {
            setAlternateAparatResults(json.data);
            const first = json.data[0];
            const fullItem: AparatFullMovie = {
              available: true,
              title: first.title,
              uid: first.uid || first.id,
              pageUrl: first.watchUrl || `https://www.aparat.com/v/${first.uid || first.id}`,
              durationFormatted: first.durationFormatted || '',
              durationSec: first.duration || first.durationSec || 0,
              poster: first.poster,
              senderName: first.senderName || 'آپارات',
              provider: 'Aparat',
              providerNameFa: 'آپارات (سرور داخلی)',
              qualities: [],
              embedUrl: first.embedUrl,
            };
            setAparatSearchResult(fullItem);
          } else {
            setAlternateAparatResults([]);
            setAparatSearchError('ویدیویی در سرورهای ایرانی آپارات برای این عنوان یافت نشد.');
          }
        })
        .catch((err) => {
          if (!isMounted) return;
          console.warn('Auto search Aparat failed:', err);
          setAparatSearchError('ویدیویی در سرورهای ایرانی آپارات برای این عنوان یافت نشد.');
        })
        .finally(() => {
          if (isMounted) setIsSearchingAparat(false);
        });
    }

    const fetchDetails = async () => {
      try {
        const params = new URLSearchParams({
          id: item.id || '',
          tmdbId: String(item.tmdbId || ''),
          title: item.title || '',
          titleFa: item.titleFa || '',
          type: item.type || 'movie',
          sourceUrl: item.sourceUrl || '',
          sourceSite: item.sourceSite || '',
        });

        const res = await fetch(`/api/movie-details?${params.toString()}`);
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data && isMounted) {
            setDetails(json.data);
            if (json.data.aparatFullMovie) {
              setAparatSearchResult(json.data.aparatFullMovie);
            }
            if (json.data.aparatSeries) {
              setAparatSeriesResult(json.data.aparatSeries);
              if (json.data.aparatSeries.seasons?.length > 0) {
                setSelectedSeasonNumber(json.data.aparatSeries.seasons[0].seasonNumber);
                const firstSeason = json.data.aparatSeries.seasons[0];
                if (firstSeason.episodes?.length > 0) {
                  setActivePlayingEpisode(firstSeason.episodes[0]);
                }
              }
            }
            // Default trailer to Aparat or first
            const aparatIdx = json.data.trailers?.findIndex(
              (t: MovieTrailer) => t.isIranAccessible || t.site === 'Aparat'
            );
            if (aparatIdx !== -1 && aparatIdx !== undefined) {
              setSelectedTrailerIndex(aparatIdx);
            }
            setIsLoading(false);
            return;
          }
        }
      } catch (err) {
        console.warn('Failed to fetch movie details:', err);
      }

      if (isMounted) {
        setDetails({
          id: item.id,
          tmdbId: item.tmdbId,
          title: item.title,
          titleFa: item.titleFa,
          type: item.type,
          overview: item.overview || '',
          overviewFa: item.overviewFa || item.overview || 'اطلاعاتی در دسترس نیست.',
          posterUrl: item.posterUrl,
          backdropUrl: item.backdropUrl,
          rating: item.rating,
          releaseYear: item.releaseYear,
          runtime: item.runtime || (item.type === 'tv' ? 'سریال' : '۱۲۰ دقیقه'),
          genres: item.genres || ['فیلم سینمایی'],
          director: 'سینمای بین‌الملل',
          cast: ['ستارگان سینما'],
          certification: item.type === 'tv' ? 'TV-MA' : 'PG-13',
          trailers: [],
          sources: [],
        });
        setIsLoading(false);
      }
    };

    if (isNewItem) {
      fetchDetails();
    }

    return () => {
      isMounted = false;
    };
  }, [item?.id, item?.title]);

  // Handle Escape key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isPlayingVideo) {
          setIsPlayingVideo(false);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlayingVideo, onClose]);

  // Copy share URL
  const handleShare = () => {
    const shareUrl = `${window.location.origin}/#movie-${item.id}`;
    navigator.clipboard.writeText(shareUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  // Copy stream URL for external players
  const handleCopyStreamLink = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedStreamUrl(url);
    setTimeout(() => setCopiedStreamUrl(null), 2500);
  };

  // Search Aparat manually
  const handleSearchAparat = async (e: React.FormEvent) => {
    e.preventDefault();
    const q = customAparatQuery.trim();
    if (!q) return;
    setIsSearchingAparat(true);
    setAparatSearchError(null);
    try {
      const res = await fetch(`/api/aparat-search?query=${encodeURIComponent(q)}`);
      const json = await res.json();
      if (json.success && Array.isArray(json.data) && json.data.length > 0) {
        setAlternateAparatResults(json.data);
        const first = json.data[0];
        const fullItem: AparatFullMovie = {
          available: true,
          title: first.title,
          uid: first.uid || first.id,
          pageUrl: first.watchUrl || `https://www.aparat.com/v/${first.uid || first.id}`,
          durationFormatted: first.durationFormatted || '',
          durationSec: first.duration || first.durationSec || 0,
          poster: first.poster,
          senderName: first.senderName || 'آپارات',
          provider: 'Aparat',
          providerNameFa: 'آپارات (سرور داخلی)',
          qualities: [],
          embedUrl: first.embedUrl,
        };
        setAparatSearchResult(fullItem);
      } else {
        setAlternateAparatResults([]);
        setAparatSearchError('ویدیویی در سرورهای ایرانی آپارات برای این عنوان یافت نشد.');
      }
    } catch (err) {
      console.warn('Aparat search query failed:', err);
      setAparatSearchError('ویدیویی در سرورهای ایرانی آپارات برای این عنوان یافت نشد.');
    } finally {
      setIsSearchingAparat(false);
    }
  };

  // Select video from Aparat results & mount into player
  const handleSelectAlternateVideo = async (alt: any) => {
    if (!alt) return;
    setIsSearchingAparat(true);
    setAparatSearchError(null);

    const uid = alt.uid || alt.id || (alt.watchUrl ? alt.watchUrl.split('/').pop() : '');
    const embedUrl = alt.embedUrl || (uid ? `https://www.aparat.com/video/video/embed/videohash/${uid}/vt/frame` : '');

    // Instantly mount embed in player
    if (embedUrl) {
      setEmbedUrl(embedUrl);
      setVideoPlayMode('embed');
      setIsPlayingVideo(true);
    }

    try {
      if (uid) {
        const res = await fetch(`/api/aparat/episode-links?uid=${encodeURIComponent(uid)}&provider=Aparat`);
        const json = await res.json();
        if (json.success && json.data) {
          const fullItem: AparatFullMovie = {
            available: true,
            title: alt.title,
            uid: uid,
            pageUrl: alt.watchUrl || alt.videoPageUrl || (uid ? `https://www.aparat.com/v/${uid}` : ''),
            durationFormatted: alt.durationFormatted || '',
            durationSec: alt.durationSec || alt.duration || 0,
            poster: alt.poster,
            senderName: alt.senderName || undefined,
            provider: 'Aparat',
            providerNameFa: 'آپارات (سرور داخلی)',
            qualities: json.data.qualities || [],
            embedUrl: json.data.embedUrl || embedUrl,
            hlsStreamUrl: json.data.hlsStreamUrl,
          };
          setAparatSearchResult(fullItem);
          if (fullItem.qualities?.length > 0) {
            handlePlayQuality(fullItem.qualities[0]);
          } else if (fullItem.hlsStreamUrl) {
            setVideoPlayMode('full_movie');
            setIsPlayingVideo(true);
          }
        }
      }
    } catch (err) {
      console.warn('Failed to load alternate video direct links:', err);
    } finally {
      setIsSearchingAparat(false);
    }
  };

  // Primary action: Play Now
  const handlePlayPrimary = () => {
    if (isSeriesMode) {
      // If series, default to global or first episode
      setVideoPlayMode('global');
      setIsPlayingVideo(true);
      setActiveTab('stream');
    } else {
      // If movie has Aparat/Namasha qualities, play highest quality
      const fullMovie = aparatSearchResult || details?.aparatFullMovie;
      if (fullMovie?.available && fullMovie.qualities?.length) {
        setSelectedQualityUrl(fullMovie.qualities[0].url);
        setSelectedQualityProfile(fullMovie.qualities[0].profile || fullMovie.qualities[0].text);
        setVideoPlayMode('full_movie');
        setIsPlayingVideo(true);
      } else {
        // Fallback directly to Global Smart Resolver
        setVideoPlayMode('global');
        setIsPlayingVideo(true);
      }
      setActiveTab('stream');
    }
    if (modalRef.current) modalRef.current.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Play Trailer
  const handlePlayTrailer = () => {
    setVideoPlayMode('trailer');
    setIsPlayingVideo(true);
    setActiveTab('stream');
    if (modalRef.current) modalRef.current.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Open Global server
  const handleOpenGlobal = () => {
    setVideoPlayMode('global');
    setIsPlayingVideo(true);
    setActiveTab('stream');
    if (modalRef.current) modalRef.current.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Play specific episode
  const handlePlayEpisode = (episode: AparatEpisode) => {
    setActivePlayingEpisode(episode);
    if (episode.hlsStreamUrl || episode.embedUrl) {
      setVideoPlayMode('episode');
    } else {
      setVideoPlayMode('global');
    }
    setIsPlayingVideo(true);
    if (modalRef.current) modalRef.current.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Play specific movie quality
  const handlePlayQuality = (quality: AparatQuality) => {
    setSelectedQualityUrl(quality.url);
    setSelectedQualityProfile(quality.profile || quality.text);
    setVideoPlayMode('full_movie');
    setIsPlayingVideo(true);
    if (modalRef.current) modalRef.current.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const fullMovie = aparatSearchResult || details?.aparatFullMovie || null;
  const seriesData = aparatSeriesResult || details?.aparatSeries || null;
  const availableTrailers = details?.trailers || [];
  const currentTrailer = availableTrailers[selectedTrailerIndex] || availableTrailers[0];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/95 backdrop-blur-2xl animate-fade-in overflow-y-auto">
      {/* Click outside backdrop to close */}
      <div className="fixed inset-0" onClick={onClose} />

      {/* Main Modal Shell */}
      <div
        ref={modalRef}
        className="relative w-full max-w-4xl bg-[#090a0f] border border-white/10 rounded-3xl shadow-[0_25px_70px_rgba(0,0,0,0.95)] overflow-hidden z-10 my-auto max-h-[92vh] flex flex-col font-persian"
        dir="rtl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Floating Top Controls (Return to Home & Share) - Rendered ONLY when video is not playing */}
        {!isPlayingVideo && (
          <div className="absolute top-3.5 inset-x-4 z-30 flex items-center justify-between pointer-events-none">
            {/* Return to Home button */}
            <button
              type="button"
              onClick={onClose}
              data-tv-id="modal-close-btn"
              className="tv-focusable pointer-events-auto flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-zinc-900/95 hover:bg-zinc-800 text-zinc-200 hover:text-white border border-white/15 backdrop-blur-md transition-all cursor-pointer shadow-lg text-xs font-bold"
              title="بازگشت به صفحه اول"
            >
              <ChevronRight className="w-4 h-4 text-zinc-400" />
              <span>بازگشت به صفحه اول</span>
            </button>

            {/* Share Button */}
            <div className="pointer-events-auto flex items-center gap-2">
              <button
                type="button"
                onClick={handleShare}
                data-tv-id="modal-share-top-btn"
                className="tv-focusable w-8 h-8 rounded-full bg-zinc-900/90 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-white/10 backdrop-blur-md transition-all flex items-center justify-center cursor-pointer shadow-lg"
                title="اشتراک‌گذاری"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        )}

        {/* Scrollable Modal Body */}
        <div className="overflow-y-auto flex-1 custom-scrollbar">
          {/* TOP SECTION: ACTIVE PLAYER OR SLEEK HERO */}
          {isPlayingVideo ? (
            <div ref={playerContainerRef} className="relative w-full bg-black aspect-video min-h-[300px] sm:min-h-[420px] max-h-[540px] flex flex-col border-b border-zinc-800">
              {/* Minimal Player Navigation Bar */}
              <div className="bg-zinc-950/95 backdrop-blur-md border-b border-zinc-800/80 px-3 sm:px-4 py-2 flex items-center justify-between z-20 flex-wrap gap-2">
                {/* Navigation Buttons: Return to home page + Return to movie details */}
                <div className="flex items-center gap-2 flex-wrap">
                  {/* Button: Return to First Page (صفحه اول) */}
                  <button
                    type="button"
                    onClick={onClose}
                    className="tv-focusable flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-200 hover:text-white border border-zinc-700/80 text-xs font-bold transition-all shadow-sm cursor-pointer"
                    title="بازگشت به صفحه اول"
                  >
                    <ChevronRight className="w-4 h-4 text-zinc-400" />
                    <span>بازگشت به صفحه اول</span>
                  </button>

                  {/* Button: Return to Movie Details (صفحه فیلم) */}
                  <button
                    type="button"
                    onClick={() => setIsPlayingVideo(false)}
                    className="tv-focusable flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-black text-xs font-bold transition-all shadow-md cursor-pointer"
                    title="بازگشت به معرفی فیلم"
                  >
                    <ArrowRight className="w-4 h-4" />
                    <span>صفحه فیلم</span>
                  </button>

                  <div className="hidden sm:flex items-center gap-2 mr-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-xs font-bold text-zinc-200 truncate max-w-[200px]">
                      {videoPlayMode === 'trailer'
                        ? 'پخش تریلر رسمی'
                        : videoPlayMode === 'episode'
                        ? `فصل ${activePlayingEpisode?.seasonNumber || 1} • قسمت ${activePlayingEpisode?.episodeNumber || 1}`
                        : videoPlayMode === 'global'
                        ? 'سرور جهانی هوشمند'
                        : videoPlayMode === 'embed'
                        ? 'پخش مستقیم آپارات'
                        : `فیلم کامل (${selectedQualityProfile || 'کیفیت بالا'})`}
                    </span>
                  </div>
                </div>

                {/* Left side: Copy Stream Link + Mode switches + Close Player */}
                <div className="flex items-center gap-2">
                  {/* Copy Stream Link Dropdown Menu */}
                  <PlayerCopyStreamMenu
                    qualities={fullMovie?.qualities || []}
                    primaryUrl={
                      selectedQualityUrl ||
                      activePlayingEpisode?.hlsStreamUrl ||
                      activePlayingEpisode?.embedUrl ||
                      fullMovie?.qualities?.[0]?.url ||
                      currentTrailer?.embedUrl ||
                      currentTrailer?.url ||
                      item.sourceUrl ||
                      ''
                    }
                    onCopy={handleCopyStreamLink}
                    copiedUrl={copiedStreamUrl}
                  />

                  {/* Mode switch pills */}
                  {availableTrailers.length > 0 && videoPlayMode !== 'trailer' && (
                    <button
                      type="button"
                      onClick={() => setVideoPlayMode('trailer')}
                      className="px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[11px] transition-all cursor-pointer"
                    >
                      تریلر
                    </button>
                  )}
                  {videoPlayMode !== 'global' && (
                    <button
                      type="button"
                      onClick={() => setVideoPlayMode('global')}
                      className="px-2.5 py-1.5 rounded-lg bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 border border-indigo-500/40 text-[11px] font-bold transition-all cursor-pointer"
                    >
                      سرور جهانی
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={onClose}
                    className="p-1.5 rounded-lg bg-zinc-800 hover:bg-red-500/20 text-zinc-400 hover:text-red-300 transition-all cursor-pointer"
                    title="بستن پنجره"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Player Viewport */}
              <div className="relative flex-1 w-full h-full flex items-center justify-center bg-black overflow-hidden">
                {videoPlayMode === 'global' ? (
                  <div className="w-full h-full">
                    <SmartStreamPlayer
                      item={item}
                      isSeries={isSeriesMode}
                      seasonNumber={selectedSeasonNumber || 1}
                      episodeNumber={activePlayingEpisode?.episodeNumber || 1}
                    />
                  </div>
                ) : videoPlayMode === 'embed' && (embedUrl || fullMovie?.embedUrl) ? (
                  <iframe
                    src={embedUrl || fullMovie?.embedUrl}
                    title={item.titleFa || item.title}
                    className="w-full h-full border-0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                    allowFullScreen
                  />
                ) : videoPlayMode === 'trailer' ? (
                  currentTrailer?.embedUrl || currentTrailer?.url ? (
                    <iframe
                      src={currentTrailer.embedUrl || currentTrailer.url}
                      title={currentTrailer.name || 'Trailer'}
                      className="w-full h-full border-0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                      allowFullScreen
                    />
                  ) : (
                    <div className="text-xs text-zinc-400">تریلری در دسترس نیست.</div>
                  )
                ) : (
                  /* Full Movie / Episode HLS or Direct Video Player */
                  <div className="w-full h-full">
                    <HlsVideoPlayer
                      src={
                        selectedQualityUrl ||
                        activePlayingEpisode?.hlsStreamUrl ||
                        activePlayingEpisode?.embedUrl ||
                        fullMovie?.qualities?.[0]?.url ||
                        ''
                      }
                      title={item.titleFa || item.title}
                      autoPlay={true}
                    />
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Minimalist Hero */
            <VODHero
              item={item}
              details={details}
              fullMovie={fullMovie}
              isSeriesMode={isSeriesMode}
              isPlayingVideo={isPlayingVideo}
              onPlayPrimary={handlePlayPrimary}
              onPlayTrailer={handlePlayTrailer}
              onOpenGlobal={handleOpenGlobal}
              onShare={handleShare}
              copiedLink={copiedLink}
              onCopyStreamLink={handleCopyStreamLink}
              copiedStreamUrl={copiedStreamUrl}
            />
          )}

          {/* CHIC SEGMENTED TAB NAVIGATION (طبقه بندی مدرن و مینیمال) */}
          <div className="sticky top-0 z-20 bg-[#090a0f]/95 backdrop-blur-md border-b border-zinc-800/80 px-5 sm:px-8 py-2.5 flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-1.5 p-1 rounded-xl bg-zinc-900/80 border border-zinc-800">
              <button
                type="button"
                onClick={() => setActiveTab('stream')}
                className={`tv-focusable px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'stream'
                    ? 'bg-amber-400 text-black shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Tv className="w-3.5 h-3.5" />
                <span>{isSeriesMode ? 'قسمت‌ها و استریم' : 'کیفیت‌ها و پخش'}</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('downloads')}
                className={`tv-focusable px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'downloads'
                    ? 'bg-amber-400 text-black shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Globe className="w-3.5 h-3.5" />
                <span>مراجع دانلود</span>
                {details?.sources && details.sources.length > 0 && (
                  <span className="text-[10px] opacity-80 px-1 py-0.2 rounded bg-black/20">
                    {details.sources.length}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('details')}
                className={`tv-focusable px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'details'
                    ? 'bg-amber-400 text-black shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>مشخصات و داستان</span>
              </button>
            </div>
          </div>

          {/* ACTIVE TAB CONTENT */}
          <div className="p-5 sm:p-7">
            {activeTab === 'stream' && (
              <VODStreamTab
                item={item}
                details={details}
                fullMovie={fullMovie}
                seriesData={seriesData}
                isSeriesMode={isSeriesMode}
                selectedSeasonNumber={selectedSeasonNumber}
                onSelectSeason={setSelectedSeasonNumber}
                onPlayEpisode={handlePlayEpisode}
                onPlayQuality={handlePlayQuality}
                onPlayGlobal={handleOpenGlobal}
                activeEpisodeNumber={activePlayingEpisode?.episodeNumber}
                isSearchingAparat={isSearchingAparat}
                customAparatQuery={customAparatQuery}
                onSearchAparatChange={setCustomAparatQuery}
                onSearchAparatSubmit={handleSearchAparat}
                onCopyStreamLink={handleCopyStreamLink}
                copiedStreamUrl={copiedStreamUrl}
                alternateResults={alternateAparatResults}
                onSelectAlternate={handleSelectAlternateVideo}
                searchError={aparatSearchError}
              />
            )}

            {activeTab === 'downloads' && (
              <VODDownloadTab
                sources={details?.sources || []}
                isSeriesMode={isSeriesMode}
              />
            )}

            {activeTab === 'details' && (
              <VODDetailsTab
                item={item}
                details={details}
                isSeriesMode={isSeriesMode}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
