import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  X,
  Play,
  Download,
  ExternalLink,
  Star,
  Clock,
  Calendar,
  Sparkles,
  Film,
  Users,
  Globe,
  Share2,
  Check,
  CheckCircle2,
  ChevronUp,
  Copy,
  Tv,
  MonitorPlay,
  ChevronDown,
  Search,
  RefreshCw,
  Layers,
  FileVideo,
  Loader2,
  Bookmark,
  Mic,
  FileText,
  Subtitles,
  Server,
  ShieldCheck,
  Activity,
  Database,
  CheckCheck,
  Zap,
  RotateCcw,
  AlertTriangle,
  Radio,
} from 'lucide-react';
import {
  MediaItem,
  MovieDetailsData,
  MovieSourceHub,
  MovieTrailer,
  AparatFullMovie,
  AparatQuality,
  AparatSeriesData,
  AparatSeason,
  AparatEpisode,
  GlobalStreamingData,
  GlobalDirectStream,
  GlobalEmbedMirror,
  GlobalTorrentItem,
} from '../types';
import { GlobalStreamingPanel } from './GlobalStreamingPanel';
import { WebTorrentPlayer } from './WebTorrentPlayer';
import { HlsVideoPlayer } from './HlsVideoPlayer';
import WebTorrent from 'webtorrent';
import {
  fetchSourceAvailability,
  clientAvailabilityCache,
  getAvailabilityCacheKey,
} from '../lib/availabilityCache';

// Public WebRTC trackers that browser clients can connect to via WebSocket
const PUBLIC_WEBRTC_TRACKERS = [
  'wss://tracker.btorrent.xyz',
  'wss://tracker.openwebtorrent.com',
  'wss://tracker.webtorrent.dev',
  'wss://tracker.files.fm:7073/announce',
];

const appendWebRtcTrackers = (magnetUri: string): string => {
  let magnet = magnetUri;
  for (const tr of PUBLIC_WEBRTC_TRACKERS) {
    if (!magnet.includes(encodeURIComponent(tr))) {
      magnet += `&tr=${encodeURIComponent(tr)}`;
    }
  }
  return magnet;
};

interface VODModalProps {
  item: MediaItem | null;
  onClose: () => void;
}

export const VODModal: React.FC<VODModalProps> = ({ item, onClose }) => {
  const [details, setDetails] = useState<MovieDetailsData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isPlayingVideo, setIsPlayingVideo] = useState<boolean>(false);
  const [videoPlayMode, setVideoPlayMode] = useState<'trailer' | 'full_movie' | 'episode' | 'global' | 'torrent'>('trailer');
  const [activePlayingTorrent, setActivePlayingTorrent] = useState<GlobalTorrentItem | null>(null);
  const [selectedTrailerIndex, setSelectedTrailerIndex] = useState<number>(0);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [copiedStreamUrl, setCopiedStreamUrl] = useState<string | null>(null);
  const [showEnglishOverview, setShowEnglishOverview] = useState<boolean>(false);

  // WebTorrent Client & Streaming State
  const torrentVideoRef = useRef<HTMLVideoElement | null>(null);
  const webtorrentClientRef = useRef<any>(null);
  const activeTorrentInstanceRef = useRef<any>(null);
  const [torrentStatus, setTorrentStatus] = useState<
    'idle' | 'connecting' | 'metadata' | 'buffering' | 'playing' | 'failed'
  >('idle');
  const [torrentPeers, setTorrentPeers] = useState<number>(0);
  const [torrentProgress, setTorrentProgress] = useState<number>(0);
  const [torrentDownloadSpeed, setTorrentDownloadSpeed] = useState<string>('0 KB/s');
  const [torrentUploadSpeed, setTorrentUploadSpeed] = useState<string>('0 KB/s');
  const [torrentErrorMessage, setTorrentErrorMessage] = useState<string | null>(null);
  const [torrentCopied, setTorrentCopied] = useState<boolean>(false);
  const [torrentFileName, setTorrentFileName] = useState<string>('');
  const [torrentRetryCount, setTorrentRetryCount] = useState<number>(0);

  // Global streaming state
  const [globalStreamingData, setGlobalStreamingData] = useState<GlobalStreamingData | null>(null);
  const [isLoadingGlobalStreams, setIsLoadingGlobalStreams] = useState<boolean>(false);
  const [selectedGlobalMirrorId, setSelectedGlobalMirrorId] = useState<string>('mirror_vidlink_movie');
  const [selectedGlobalTier, setSelectedGlobalTier] = useState<'tier1_direct' | 'tier2_embed' | 'tier3_torrent'>('tier2_embed');
  const [selectedDirectQualityIndex, setSelectedDirectQualityIndex] = useState<number>(0);
  const [isSubtitleEnabled, setIsSubtitleEnabled] = useState<boolean>(true);
  const [copiedMagnetHash, setCopiedMagnetHash] = useState<string | null>(null);

  // Series Season & Episode state
  const [selectedSeasonNumber, setSelectedSeasonNumber] = useState<number>(1);
  const [expandedEpisodeKey, setExpandedEpisodeKey] = useState<string | null>(null);
  const [episodeDetailsCache, setEpisodeDetailsCache] = useState<Record<string, { qualities: AparatQuality[]; vlcUrl?: string; potPlayerUrl?: string; mxPlayerUrl?: string; hlsStreamUrl?: string }>>({});
  const [loadingEpisodeUid, setLoadingEpisodeUid] = useState<string | null>(null);
  const [activePlayingEpisode, setActivePlayingEpisode] = useState<{
    title: string;
    seasonNumber: number;
    episodeNumber: number;
    streamUrl?: string;
    embedUrl?: string;
  } | null>(null);

  // Aparat custom search state
  const [customAparatQuery, setCustomAparatQuery] = useState<string>('');
  const [isSearchingAparat, setIsSearchingAparat] = useState<boolean>(false);
  const [aparatSearchResult, setAparatSearchResult] = useState<AparatFullMovie | null>(null);
  const [aparatSeriesResult, setAparatSeriesResult] = useState<AparatSeriesData | null>(null);
  const [selectedMovieVersion, setSelectedMovieVersion] = useState<'auto' | 'dubbed' | 'subbed' | 'global'>('auto');

  // Quality & Version selection modal states
  const [isQualityModalOpen, setIsQualityModalOpen] = useState<boolean>(false);
  const [selectedQualityUrl, setSelectedQualityUrl] = useState<string | null>(null);
  const [selectedQualityProfile, setSelectedQualityProfile] = useState<string | null>(null);

  // Helper to detect if any URL or stream is a magnet URI
  const isMagnetUri = (url?: string | null): boolean =>
    typeof url === 'string' && url.trim().toLowerCase().startsWith('magnet:?');

  // Active magnet URI detection logic across all stream providers & modes
  const detectedMagnetUri = useMemo(() => {
    if (activePlayingTorrent?.magnetUrl && isMagnetUri(activePlayingTorrent.magnetUrl)) {
      return activePlayingTorrent.magnetUrl.trim();
    }
    if (isMagnetUri(selectedQualityUrl)) {
      return selectedQualityUrl!.trim();
    }
    if (isMagnetUri(activePlayingEpisode?.streamUrl)) {
      return activePlayingEpisode!.streamUrl!.trim();
    }
    return null;
  }, [activePlayingTorrent, selectedQualityUrl, activePlayingEpisode]);

  const handleCopyMagnet = (magnetUrl?: string | null) => {
    const target = magnetUrl || detectedMagnetUri || activePlayingTorrent?.magnetUrl;
    if (!target) return;
    navigator.clipboard.writeText(target);
    setTorrentCopied(true);
    setTimeout(() => setTorrentCopied(false), 3000);
  };

  // Source availability state for prioritizing verified sources
  const [sourceAvailabilities, setSourceAvailabilities] = useState<Record<string, boolean>>({});
  const [showUnverifiedSources, setShowUnverifiedSources] = useState<boolean>(false);

  // Dynamic scroll listener state for hero backdrop blur and fade transitions
  const [scrollRatio, setScrollRatio] = useState<number>(0);

  const modalRef = useRef<HTMLDivElement>(null);
  const playerContainerRef = useRef<HTMLDivElement>(null);

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isQualityModalOpen) {
          setIsQualityModalOpen(false);
          return;
        }
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, isQualityModalOpen]);

  // Fetch comprehensive movie/series details, Persian overview, trailers, and Aparat data
  useEffect(() => {
    if (!item) return;

    let isMounted = true;
    setIsLoading(true);
    setIsPlayingVideo(false);
    setVideoPlayMode('trailer');
    setSelectedTrailerIndex(0);
    setAparatSearchResult(null);
    setAparatSeriesResult(null);
    setSelectedMovieVersion('auto');
    setIsQualityModalOpen(false);
    setSelectedQualityUrl(null);
    setSelectedQualityProfile(null);
    setExpandedEpisodeKey(null);
    setActivePlayingEpisode(null);
    setSourceAvailabilities({});
    setShowUnverifiedSources(false);

    const cleanTitle = (item.title || 'Film').replace(/[0-9]{4}/g, '').trim();
    const cleanFa = item.titleFa || cleanTitle;
    setCustomAparatQuery(cleanFa);

    // Synchronously check shared availability cache first (from MovieCard hover)
    const cacheKey = getAvailabilityCacheKey(item.title);
    const cachedSources = clientAvailabilityCache.get(cacheKey);
    if (cachedSources) {
      const map: Record<string, boolean> = {};
      cachedSources.forEach((s) => {
        if (s.site) map[s.site.toLowerCase()] = Boolean(s.available);
        if (s.nameFa) map[s.nameFa] = Boolean(s.available);
      });
      setSourceAvailabilities(map);
    }

    // Fetch source availability to ensure cache freshness and consistency
    fetchSourceAvailability(item.title).then((sources) => {
      if (isMounted && sources && Array.isArray(sources)) {
        const map: Record<string, boolean> = {};
        sources.forEach((s) => {
          if (s.site) map[s.site.toLowerCase()] = Boolean(s.available);
          if (s.nameFa) map[s.nameFa] = Boolean(s.available);
        });
        setSourceAvailabilities(map);
      }
    }).catch(() => {});

    // If single movie, automatically search Aparat & Namasha in parallel right on open!
    if (item.type !== 'tv') {
      setIsSearchingAparat(true);
      fetch(`/api/aparat/full-movie?q=${encodeURIComponent(cleanFa)}&en=${encodeURIComponent(cleanTitle)}`)
        .then(res => res.json())
        .then(json => {
          if (isMounted && json.success && json.data) {
            setAparatSearchResult(json.data);
            if (json.data.dubbedVersion) {
              setSelectedMovieVersion('dubbed');
            } else if (json.data.subbedVersion) {
              setSelectedMovieVersion('subbed');
            }
          }
        })
        .catch(err => {
          console.warn('Auto search Aparat on mount failed:', err);
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
                // Expand first episode of first season by default
                const firstSeason = json.data.aparatSeries.seasons[0];
                if (firstSeason.episodes?.length > 0) {
                  const firstEp = firstSeason.episodes[0];
                  setExpandedEpisodeKey(`s${firstSeason.seasonNumber}-e${firstEp.episodeNumber}`);
                  // Preload first episode links
                  preloadEpisodeLinks(firstEp.uid, firstEp.provider, firstEp.pageUrl);
                }
              }
            }

            // Default to Aparat trailer (Iran server) if available
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
        console.warn('Failed to fetch detailed movie info, using fallback data:', err);
      }

      // Fallback details if fetch fails
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
          cast: ['ستارگان برجسته سینما'],
          certification: item.type === 'tv' ? 'TV-MA' : 'PG-13',
          trailers: [
            {
              name: 'پخش تریلر (آپارات)',
              key: 'aparat',
              url: `https://www.aparat.com/search/${encodeURIComponent(cleanFa + ' تریلر')}`,
              embedUrl: `https://www.aparat.com/search/${encodeURIComponent(cleanFa + ' تریلر')}`,
              site: 'Aparat',
              type: 'Trailer',
              isIranAccessible: true,
            },
            {
              name: 'پخش تریلر (یوتیوب)',
              key: 'Way9Dexny3w',
              url: 'https://www.youtube-nocookie.com/embed/Way9Dexny3w?autoplay=1&rel=0',
              embedUrl: 'https://www.youtube-nocookie.com/embed/Way9Dexny3w?autoplay=1&rel=0',
              site: 'YouTube',
              type: 'Trailer',
              isIranAccessible: false,
            },
          ],
          sources: [
            {
              id: 'doostihaa',
              name: 'Doostihaa',
              nameFa: 'دوستی‌ها',
              domain: 'doostihaa.com',
              url: item.sourceSite?.toLowerCase().includes('doosti') && item.sourceUrl
                ? item.sourceUrl
                : `https://www.doostihaa.com/?s=${encodeURIComponent(cleanFa)}`,
              badge: 'دوبله فارسی اختصاصی + ترافیک نیم‌بها',
              description: 'ارائه تمامی کیفیت‌ها با صوت دوبله جداگانه و زیرنویس هماهنگ',
              hasDubbed: true,
              hasSubbed: true,
              isExactMatch: !!item.sourceSite?.toLowerCase().includes('doosti'),
              highlighted: !!item.sourceSite?.toLowerCase().includes('doosti'),
              color: 'amber',
            },
            {
              id: 'nextmovie',
              name: 'NextMovie',
              nameFa: 'نکست‌مووی',
              domain: 'nxmweb.com',
              url: item.sourceSite?.toLowerCase().includes('next') && item.sourceUrl
                ? item.sourceUrl
                : `https://nxmweb.com/?s=${encodeURIComponent(cleanTitle)}`,
              badge: 'کیفیت 4K UHD و 1080p Web-DL',
              description: 'آرشیو جامع با سرورهای پرسرعت داخلی ایران و محاسبه ۵۰٪ تخفیف ترافیک',
              hasDubbed: true,
              hasSubbed: true,
              isExactMatch: !!item.sourceSite?.toLowerCase().includes('next'),
              highlighted: !!item.sourceSite?.toLowerCase().includes('next'),
              color: 'cyan',
            },
            {
              id: 'hexdownload',
              name: 'HexDownload',
              nameFa: 'هگز دانلود',
              domain: 'hexdl.com',
              url: item.sourceSite?.toLowerCase().includes('hex') && item.sourceUrl
                ? item.sourceUrl
                : `https://hexdl.com/?s=${encodeURIComponent(cleanTitle)}`,
              badge: 'دانلود رایگان بدون اشتراک',
              description: 'زیرنویس فارسی چسبیده سافت‌ساب و دوبله دوزبانه بدون سانسور و رایگان',
              hasDubbed: true,
              hasSubbed: true,
              isExactMatch: !!item.sourceSite?.toLowerCase().includes('hex'),
              highlighted: !!item.sourceSite?.toLowerCase().includes('hex'),
              color: 'rose',
            },
            {
              id: 'uptvs',
              name: 'UpTv',
              nameFa: 'آپ‌تی‌وی',
              domain: 'uptvs.com',
              url: item.sourceSite?.toLowerCase().includes('up') && item.sourceUrl
                ? item.sourceUrl
                : `https://www.uptvs.com/?s=${encodeURIComponent(cleanFa)}`,
              badge: 'پخش آنلاین و سرورهای پرسرعت',
              description: 'دانلود فیلم و سریال با کیفیت‌های عالی و ترافیک نیم‌بها در آپ‌تی‌وی',
              hasDubbed: true,
              hasSubbed: true,
              isExactMatch: !!item.sourceSite?.toLowerCase().includes('up'),
              highlighted: !!item.sourceSite?.toLowerCase().includes('up'),
              color: 'blue',
            },
            {
              id: 'film2media',
              name: 'Film2Media',
              nameFa: 'فیلم تو مدیا',
              domain: 'film2media.cam',
              url: item.sourceSite?.toLowerCase().includes('film2') && item.sourceUrl
                ? item.sourceUrl
                : `https://www.film2media.cam/?s=${encodeURIComponent(cleanTitle)}`,
              badge: 'نسخه‌های بلوری و 4K x265',
              description: 'آرشیو غنی سینمایی به همراه زیرنویس چسبیده فارسی و لینک مستقیم',
              hasDubbed: true,
              hasSubbed: true,
              isExactMatch: !!item.sourceSite?.toLowerCase().includes('film2'),
              highlighted: !!item.sourceSite?.toLowerCase().includes('film2'),
              color: 'purple',
            },
            {
              id: 'zarfilm',
              name: 'ZarFilm',
              nameFa: 'زارفیلم',
              domain: 'zarfilm.com',
              url: item.sourceSite?.toLowerCase().includes('zarfilm') && item.sourceUrl
                ? item.sourceUrl
                : `https://zarfilm.com/?s=${encodeURIComponent(cleanTitle)}`,
              badge: 'پخش آنلاین بدون سانسور',
              description: 'تماشا و دانلود جدیدترین آثار با زیرنویس سافت‌ساب و دوبله چندزبانه',
              hasDubbed: true,
              hasSubbed: true,
              isExactMatch: !!item.sourceSite?.toLowerCase().includes('zarfilm'),
              highlighted: !!item.sourceSite?.toLowerCase().includes('zarfilm'),
              color: 'emerald',
            },
            {
              id: 'zardfilm',
              name: 'ZardFilm',
              nameFa: 'زردفیلم',
              domain: 'zardfilm.net',
              url: item.sourceSite?.toLowerCase().includes('zard') && item.sourceUrl
                ? item.sourceUrl
                : `https://zardfilm.net/?s=${encodeURIComponent(cleanFa)}`,
              badge: 'دانلود مستقیم با ترافیک داخلی',
              description: 'آرشیو اختصاصی فیلم و سریال‌های روز دنیا با صوت‌های دوبله فارسی',
              hasDubbed: true,
              hasSubbed: true,
              isExactMatch: !!item.sourceSite?.toLowerCase().includes('zard'),
              highlighted: !!item.sourceSite?.toLowerCase().includes('zard'),
              color: 'amber',
            },
          ],
          imdbUrl: `https://www.imdb.com/find/?q=${encodeURIComponent(cleanTitle)}`,
          aparatUrl: `https://www.aparat.com/search/${encodeURIComponent(cleanFa + ' فیلم کامل')}`,
        });
        setIsLoading(false);
      }
    };

    fetchDetails();

    return () => {
      isMounted = false;
    };
  }, [item]);

  // Parallel Fetch: Tier 1, 2, 3 Global Streaming & Torrent Data (synchronized with Season/Episode)
  useEffect(() => {
    if (!item) return;
    let isMounted = true;
    setIsLoadingGlobalStreams(true);
    const sNum = activePlayingEpisode?.seasonNumber || selectedSeasonNumber || 1;
    const epNum = activePlayingEpisode?.episodeNumber || 1;
    const globalParams = new URLSearchParams({
      title: item.title || '',
      tmdbId: String(item.tmdbId || ''),
      imdbId: String(item.imdbId || ''),
      type: item.type || 'movie',
      season: String(sNum),
      episode: String(epNum),
    });
    fetch(`/api/global-streams?${globalParams.toString()}`)
      .then(res => res.json())
      .then(json => {
        if (isMounted && json.success && json.data) {
          setGlobalStreamingData(json.data);
          if (json.data.embedMirrors?.length > 0) {
            setSelectedGlobalMirrorId(json.data.embedMirrors[0].id);
          }
        }
      })
      .catch(err => {
        console.warn('Failed to fetch global streams:', err);
      })
      .finally(() => {
        if (isMounted) setIsLoadingGlobalStreams(false);
      });

    return () => {
      isMounted = false;
    };
  }, [item, selectedSeasonNumber, activePlayingEpisode?.episodeNumber]);

  // Preload links helper
  const preloadEpisodeLinks = async (uid: string, provider?: string, pageUrl?: string) => {
    if (!uid || episodeDetailsCache[uid]) return;
    try {
      const params = new URLSearchParams({ uid });
      if (provider) params.append('provider', provider);
      if (pageUrl) params.append('pageUrl', pageUrl);
      const res = await fetch(`/api/aparat/episode-links?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          setEpisodeDetailsCache(prev => ({
            ...prev,
            [uid]: {
              qualities: json.data.qualities || [],
              vlcUrl: json.data.vlcUrl,
              potPlayerUrl: json.data.potPlayerUrl,
              mxPlayerUrl: json.data.mxPlayerUrl,
              hlsStreamUrl: json.data.hlsStreamUrl,
            }
          }));
        }
      }
    } catch (e) {
      // ignore
    }
  };

  // Toggle episode accordion & load direct qualities if not cached
  const handleToggleEpisode = async (episode: AparatEpisode) => {
    const key = `s${episode.seasonNumber}-e${episode.episodeNumber}`;
    if (expandedEpisodeKey === key) {
      setExpandedEpisodeKey(null);
      return;
    }

    setExpandedEpisodeKey(key);

    if (!episodeDetailsCache[episode.uid]) {
      setLoadingEpisodeUid(episode.uid);
      try {
        const params = new URLSearchParams({ uid: episode.uid });
        if (episode.provider) params.append('provider', episode.provider);
        if (episode.pageUrl) params.append('pageUrl', episode.pageUrl);
        const res = await fetch(`/api/aparat/episode-links?${params.toString()}`);
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data) {
            setEpisodeDetailsCache(prev => ({
              ...prev,
              [episode.uid]: {
                qualities: json.data.qualities || [],
                vlcUrl: json.data.vlcUrl,
                potPlayerUrl: json.data.potPlayerUrl,
                mxPlayerUrl: json.data.mxPlayerUrl,
                hlsStreamUrl: json.data.hlsStreamUrl,
              }
            }));
          }
        }
      } catch (err) {
        console.warn('Failed to load episode qualities:', err);
      } finally {
        setLoadingEpisodeUid(null);
      }
    }
  };

  // Play a specific episode in modal player
  const handlePlayEpisodeOnline = async (episode: AparatEpisode) => {
    let cached = episodeDetailsCache[episode.uid];
    if (!cached) {
      setLoadingEpisodeUid(episode.uid);
      try {
        const params = new URLSearchParams({ uid: episode.uid });
        if (episode.provider) params.append('provider', episode.provider);
        if (episode.pageUrl) params.append('pageUrl', episode.pageUrl);
        const res = await fetch(`/api/aparat/episode-links?${params.toString()}`);
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data) {
            cached = {
              qualities: json.data.qualities || [],
              vlcUrl: json.data.vlcUrl,
              potPlayerUrl: json.data.potPlayerUrl,
              mxPlayerUrl: json.data.mxPlayerUrl,
              hlsStreamUrl: json.data.hlsStreamUrl,
            };
            setEpisodeDetailsCache(prev => ({ ...prev, [episode.uid]: cached! }));
          }
        }
      } catch (e) {
        // ignore
      } finally {
        setLoadingEpisodeUid(null);
      }
    }

    setActivePlayingEpisode({
      title: episode.title,
      seasonNumber: episode.seasonNumber,
      episodeNumber: episode.episodeNumber,
      streamUrl: cached?.qualities?.[0]?.url,
      embedUrl: episode.embedUrl,
    });
    setVideoPlayMode('episode');
    setIsPlayingVideo(true);

    if (modalRef.current) {
      modalRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  if (!item) return null;

  // Active trailer info
  const availableTrailers = details?.trailers || [];
  const activeTrailer = availableTrailers[selectedTrailerIndex] || availableTrailers[0];
  
  // Series mode is strictly true when item.type is 'tv'
  const isSeriesMode = item.type === 'tv';

  const baseMovie = aparatSearchResult || details?.aparatFullMovie;

  // Resolve active movie version based on user's preference (dubbed or subbed or auto)
  const activeFullMovie: AparatFullMovie | null = useMemo(() => {
    if (!baseMovie) return null;
    if (selectedMovieVersion === 'dubbed' && baseMovie.dubbedVersion) {
      return baseMovie.dubbedVersion;
    }
    if (selectedMovieVersion === 'subbed' && baseMovie.subbedVersion) {
      return baseMovie.subbedVersion;
    }
    return baseMovie;
  }, [baseMovie, selectedMovieVersion]);

  const fullMovie = activeFullMovie;
  const seriesData = null; // Series direct play is removed; series are directed to source hubs

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  const handleCopyStreamLink = (url: string, key: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
      setCopiedStreamUrl(key);
      setTimeout(() => setCopiedStreamUrl(null), 3000);
    }
  };

  // Custom Aparat & Namasha Search Handler for Movies
  const handleSearchAparat = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!customAparatQuery.trim() || isSeriesMode) return;

    setIsSearchingAparat(true);
    try {
      const q = encodeURIComponent(customAparatQuery);
      const en = encodeURIComponent(details?.title || '');
      const movieRes = await fetch(`/api/aparat/full-movie?q=${q}&en=${en}`);

      if (movieRes.ok) {
        const json = await movieRes.json();
        if (json.success && json.data) {
          setAparatSearchResult(json.data);
          setSelectedMovieVersion('auto');
        }
      }
    } catch (err) {
      console.warn('Movie live query failed:', err);
    } finally {
      setIsSearchingAparat(false);
    }
  };

  // Best stream link for external player (Movie)
  const primaryMovieStreamLink = fullMovie?.qualities?.[0]?.url || fullMovie?.hlsStreamUrl || '';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 md:p-8 bg-black/85 backdrop-blur-xl animate-fade-in overflow-y-auto">
      {/* Backdrop click to close */}
      <div className="fixed inset-0" onClick={onClose} />

      {/* Main Modal Container */}
      <div
        ref={modalRef}
        className="relative w-full max-w-5xl bg-[#030305] border border-zinc-800/90 rounded-3xl shadow-[0_25px_80px_rgba(0,0,0,0.95)] overflow-hidden z-15 my-auto max-h-[92vh] flex flex-col font-persian"
        dir="rtl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 1. Persistent Parallax Backdrop (Sticky Frosted Background) */}
        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden select-none">
          <img
            src={details?.backdropUrl || item.backdropUrl || details?.posterUrl || item.posterUrl}
            alt=""
            className="w-full h-full object-cover object-center filter blur-3xl scale-125 opacity-25 transform transition-transform duration-1000"
          />
          {/* Overlay: backdrop-blur-2xl bg-[#030305]/75 combined with a subtle radial gradient mask */}
          <div className="absolute inset-0 backdrop-blur-2xl bg-[#030305]/75" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(245,158,11,0.08),transparent_70%)]" />
          <div className="absolute inset-0 bg-gradient-to-b from-[#030305]/40 via-transparent to-[#030305]/95" />
        </div>

        {/* 2. Top Navigation & Search Capsule */}
        <div className="absolute top-4 inset-x-4 z-30 flex items-center justify-between pointer-events-none">
          {/* Close & Share (Floating Circular Frosted Glass Buttons) */}
          <div className="flex items-center gap-2.5 pointer-events-auto">
            <button
              type="button"
              onClick={onClose}
              data-tv-id="modal-close-btn"
              className="tv-focusable w-9 h-9 rounded-full bg-zinc-900/80 hover:bg-red-500/20 text-zinc-300 hover:text-white border border-white/10 backdrop-blur-xl transition-all shadow-xl hover:scale-105 flex items-center justify-center cursor-pointer"
              title="بستن (Esc)"
            >
              <X className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleShare}
              data-tv-id="modal-share-btn"
              className="tv-focusable w-9 h-9 rounded-full bg-zinc-900/80 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-white/10 backdrop-blur-xl transition-all shadow-xl hover:scale-105 flex items-center justify-center cursor-pointer"
              title="اشتراک‌گذاری"
            >
              {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
            </button>
          </div>

          {/* Unified Pill-shaped Frosted Brand & Search Capsule */}
          <div className="pointer-events-auto rounded-full bg-zinc-900/60 backdrop-blur-xl border border-white/10 px-3.5 sm:px-5 py-2 flex items-center gap-2.5 sm:gap-4 shadow-2xl">
            {/* Integrated Seamless Search Pill Input */}
            <form onSubmit={handleSearchAparat} className="flex items-center gap-1.5 sm:gap-2">
              <div className="relative flex items-center">
                <input
                  type="text"
                  value={customAparatQuery}
                  onChange={(e) => setCustomAparatQuery(e.target.value)}
                  placeholder="جستجو در آپارات..."
                  className="bg-zinc-950/60 border border-zinc-700/60 focus:border-amber-500/80 rounded-full pr-8 pl-3 py-1 text-xs text-white placeholder-zinc-500 focus:outline-none w-28 sm:w-44 md:w-56 transition-all"
                />
                <Search className="w-3.5 h-3.5 text-zinc-400 absolute right-2.5 pointer-events-none" />
              </div>
              <button
                type="submit"
                disabled={isSearchingAparat}
                className="tv-focusable rounded-full px-2.5 sm:px-3 py-1 bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 hover:text-white text-xs border border-zinc-700/60 flex items-center gap-1 transition-all disabled:opacity-50 cursor-pointer"
              >
                {isSearchingAparat ? <RefreshCw className="w-3 h-3 animate-spin text-amber-400" /> : null}
                <span>جستجو</span>
              </button>
            </form>

            <div className="w-[1px] h-4 bg-zinc-700/60 hidden sm:block" />

            {/* Brand identity on the right */}
            <div className="flex items-center gap-2">
              <span className="font-black text-xs sm:text-sm tracking-wider text-amber-400 font-mono">MMD FILM</span>
              <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse hidden sm:block" />
            </div>
          </div>
        </div>

        {/* Scrollable Content Area */}
        <div
          className="relative z-10 overflow-y-auto flex-1 custom-scrollbar"
          onScroll={(e) => {
            const top = e.currentTarget.scrollTop;
            const ratio = Math.min(1, Math.max(0, top / 260));
            setScrollRatio(ratio);
          }}
        >
          {/* 1. HERO BANNER & VIDEO PLAYER */}
          <div ref={playerContainerRef} className="relative w-full bg-[#030305] aspect-[16/9] sm:aspect-[21/9] min-h-[380px] sm:min-h-[460px] max-h-[580px] overflow-hidden">
            {isPlayingVideo ? (
              /* Embedded Video Player (Trailer, Aparat Full Movie, or Aparat Episode) */
              <div className="relative w-full h-full bg-black flex flex-col">
                {/* Control Top Bar */}
                <div className="relative z-20 bg-zinc-900/95 backdrop-blur-md border-b border-zinc-800 px-4 py-2 flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs text-zinc-400 font-medium">حالت پخش:</span>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setVideoPlayMode('trailer')}
                        className={`tv-focusable px-3 py-1 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                          videoPlayMode === 'trailer'
                            ? 'bg-emerald-600 text-white font-bold shadow-sm'
                            : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                        }`}
                      >
                        <Film className="w-3.5 h-3.5" />
                        <span>پخش تریلر</span>
                      </button>

                      {/* Global Mode Button */}
                      <button
                        type="button"
                        onClick={() => {
                          setVideoPlayMode('global');
                          setSelectedMovieVersion('global');
                        }}
                        className={`tv-focusable px-3 py-1 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                          videoPlayMode === 'global'
                            ? 'bg-indigo-600 text-white font-bold shadow-sm'
                            : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                        }`}
                      >
                        <Globe className="w-3.5 h-3.5 text-indigo-400" />
                        <span>سرور جهانی (Global CDN)</span>
                      </button>

                      {/* Episode Mode Button */}
                      {activePlayingEpisode && (
                        <button
                          type="button"
                          onClick={() => setVideoPlayMode('episode')}
                          className={`tv-focusable px-3 py-1 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                            videoPlayMode === 'episode'
                              ? 'bg-amber-600 text-white font-bold shadow-sm'
                              : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                          }`}
                        >
                          <Tv className="w-3.5 h-3.5" />
                          <span>فصل {activePlayingEpisode.seasonNumber} - قسمت {activePlayingEpisode.episodeNumber}</span>
                        </button>
                      )}

                      {/* Movie Mode Button & Quality Chooser */}
                      {fullMovie?.available && !isSeriesMode && (
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setVideoPlayMode('full_movie')}
                            className={`tv-focusable px-3 py-1 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                              videoPlayMode === 'full_movie'
                                ? 'bg-amber-600 text-white font-bold shadow-sm'
                                : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                            }`}
                          >
                            <Tv className="w-3.5 h-3.5" />
                            <span>{fullMovie.isDubbed ? 'دوبله فارسی' : (fullMovie.isSubbed ? 'زیرنویس فارسی' : 'فیلم کامل')}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setIsQualityModalOpen(true)}
                            className="tv-focusable px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 flex items-center gap-1 transition-all"
                            title="تغییر کیفیت یا نسخه فیلم"
                          >
                            <span>{selectedQualityProfile || fullMovie.qualities?.[0]?.profile || fullMovie.qualities?.[0]?.text || 'کیفیت‌ها'}</span>
                            <ChevronDown className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}

                      {/* Torrent Mode Button */}
                      {activePlayingTorrent && (
                        <button
                          type="button"
                          onClick={() => setVideoPlayMode('torrent')}
                          className={`tv-focusable px-3 py-1 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                            videoPlayMode === 'torrent'
                              ? 'bg-cyan-600 text-white font-bold shadow-sm'
                              : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                          }`}
                        >
                          <Play className="w-3.5 h-3.5 text-cyan-300" />
                          <span>تورنت ({activePlayingTorrent.quality || 'P2P'})</span>
                        </button>
                      )}
                    </div>

                    {/* Global controls bar */}
                    {videoPlayMode === 'global' && (
                      <div className="flex items-center gap-1.5 mr-2 pr-2 border-r border-zinc-700 flex-wrap">
                        <span className="text-[11px] font-bold text-zinc-400 font-persian">انتخاب سرور آنلاین:</span>
                        {(globalStreamingData?.embedMirrors || []).map((mirror, mIdx) => {
                          const isCur = selectedGlobalMirrorId === mirror.id;
                          const shortLabel = mirror.name.split(':')[0] || `سرور ${mIdx + 1}`;
                          return (
                            <button
                              key={mirror.id}
                              type="button"
                              onClick={() => {
                                setSelectedGlobalMirrorId(mirror.id);
                                setSelectedGlobalTier('tier2_embed');
                              }}
                              className={`tv-focusable px-2.5 py-0.5 rounded text-[11px] font-bold transition-all flex items-center gap-1 ${
                                isCur
                                  ? 'bg-indigo-600 text-white shadow-sm ring-1 ring-white/30'
                                  : 'bg-zinc-800/90 text-zinc-300 hover:bg-zinc-700 hover:text-white'
                              }`}
                              title={mirror.name}
                            >
                              <span className={`w-1.5 h-1.5 rounded-full ${isCur ? 'bg-emerald-400 animate-pulse' : 'bg-zinc-500'}`} />
                              <span>{shortLabel}</span>
                            </button>
                          );
                        })}

                        {/* Dynamic Fallback Switcher: Cycle to next available mirror */}
                        <button
                          type="button"
                          onClick={() => {
                            const mirrors = globalStreamingData?.embedMirrors || [];
                            if (mirrors.length === 0) return;
                            const curIdx = mirrors.findIndex(m => m.id === selectedGlobalMirrorId);
                            const nextIdx = (curIdx + 1) % mirrors.length;
                            setSelectedGlobalMirrorId(mirrors[nextIdx].id);
                            setSelectedGlobalTier('tier2_embed');
                          }}
                          className="tv-focusable px-2.5 py-0.5 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-[11px] font-bold font-persian flex items-center gap-1 transition-all shadow-sm cursor-pointer ml-1"
                          title="در صورت بروز خطا یا قطع تصویر، به سرور بعدی سوئیچ کنید"
                        >
                          <RotateCcw className="w-3 h-3 text-amber-400" />
                          <span>سرور کار نکرد / سرور بعدی</span>
                        </button>

                        {/* Open current mirror in external full tab */}
                        {(() => {
                          const curMirror = globalStreamingData?.embedMirrors?.find(m => m.id === selectedGlobalMirrorId) || globalStreamingData?.embedMirrors?.[0];
                          const targetUrl = curMirror?.url || (isSeriesMode
                            ? `https://vidsrc.cc/v2/embed/tv/${item.tmdbId || '1396'}/${selectedSeasonNumber || 1}/${activePlayingEpisode?.episodeNumber || 1}`
                            : `https://vidsrc.cc/v2/embed/movie/${item.tmdbId || '438631'}`);
                          return (
                            <a
                              href={targetUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="tv-focusable px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white text-[11px] font-persian flex items-center gap-1 transition-all mr-1"
                              title="باز کردن استریم در تب جدید"
                            >
                              <span>تمام‌صفحه خارجی</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          );
                        })()}
                      </div>
                    )}

                    {/* Server toggle for trailer mode */}
                    {videoPlayMode === 'trailer' && availableTrailers.length > 1 && (
                      <div className="flex items-center gap-1 mr-2 pr-2 border-r border-zinc-700">
                        {availableTrailers.map((tr, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setSelectedTrailerIndex(idx)}
                            className={`tv-focusable px-2.5 py-0.5 rounded text-[11px] font-medium transition-all ${
                              selectedTrailerIndex === idx
                                ? tr.isIranAccessible
                                  ? 'bg-emerald-700 text-white font-bold'
                                  : 'bg-red-700 text-white font-bold'
                                : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                            }`}
                          >
                            {tr.isIranAccessible ? 'پخش تریلر (آپارات)' : 'پخش تریلر (یوتیوب)'}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsPlayingVideo(false)}
                    className="tv-focusable px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs text-zinc-300 hover:text-white flex items-center gap-1"
                  >
                    <Film className="w-3.5 h-3.5 text-zinc-400" />
                    <span>بازگشت به پوستر</span>
                  </button>
                </div>

                {/* Player Frame or HTML5 Video */}
                <div className="relative flex-1 w-full h-full bg-black">
                  {videoPlayMode === 'torrent' && activePlayingTorrent ? (
                    <WebTorrentPlayer
                      torrent={activePlayingTorrent}
                      title={item.titleFa || item.title || ''}
                      onFallbackToMirrors={() => {
                        setVideoPlayMode('global');
                        setSelectedGlobalTier('tier2_embed');
                      }}
                    />
                  ) : videoPlayMode === 'global' ? (
                    selectedGlobalTier === 'tier1_direct' && (globalStreamingData?.directStreams?.length || 0) > 0 ? (
                      <HlsVideoPlayer
                        key={globalStreamingData?.directStreams[selectedDirectQualityIndex]?.proxiedUrl || globalStreamingData?.directStreams[0]?.proxiedUrl}
                        src={globalStreamingData?.directStreams[selectedDirectQualityIndex]?.proxiedUrl || globalStreamingData?.directStreams[0]?.proxiedUrl}
                        poster={details?.backdropUrl || item.backdropUrl}
                        subtitlesUrl={isSubtitleEnabled ? `/api/subtitles/vtt?title=${encodeURIComponent(item.title || '')}` : undefined}
                        onFallback={() => setSelectedGlobalTier('tier2_embed')}
                      />
                    ) : (
                      <div className="relative w-full h-full">
                        {/* Instant Quick-Fallback Button on Player Corner */}
                        <button
                          type="button"
                          onClick={() => {
                            const mirrors = globalStreamingData?.embedMirrors || [];
                            if (mirrors.length === 0) return;
                            const curIdx = mirrors.findIndex(m => m.id === selectedGlobalMirrorId);
                            const nextIdx = (curIdx + 1) % mirrors.length;
                            setSelectedGlobalMirrorId(mirrors[nextIdx].id);
                            setSelectedGlobalTier('tier2_embed');
                          }}
                          className="absolute top-3 left-3 z-30 px-3 py-1.5 rounded-xl bg-black/80 hover:bg-black/95 text-amber-300 hover:text-amber-200 border border-amber-500/40 text-xs font-bold font-persian flex items-center gap-1.5 backdrop-blur-md transition-all shadow-lg cursor-pointer"
                          title="در صورت بروز خطا، تصویر سیاه یا قطعی به سرور آینه بعدی بروید"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>سرور کار نکرد؟ سوئیچ سرور</span>
                        </button>

                        <iframe
                          key={
                            globalStreamingData?.embedMirrors?.find(m => m.id === selectedGlobalMirrorId)?.url ||
                            globalStreamingData?.embedMirrors?.[0]?.url ||
                            'global-stream-player'
                          }
                          className="w-full h-full border-0"
                          src={
                            globalStreamingData?.embedMirrors?.find(m => m.id === selectedGlobalMirrorId)?.url ||
                            globalStreamingData?.embedMirrors?.[0]?.url ||
                            (isSeriesMode
                              ? `https://vidsrc.cc/v2/embed/tv/${item.tmdbId || '1396'}/${selectedSeasonNumber || 1}/${activePlayingEpisode?.episodeNumber || 1}`
                              : `https://vidsrc.cc/v2/embed/movie/${item.tmdbId || '438631'}`)
                          }
                          title="پخش سرور جهانی"
                          sandbox="allow-scripts allow-same-origin allow-forms allow-presentation"
                          allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
                          allowFullScreen
                          referrerPolicy="origin"
                        />
                      </div>
                    )
                  ) : videoPlayMode === 'episode' && activePlayingEpisode ? (
                    activePlayingEpisode.streamUrl ? (
                      <HlsVideoPlayer
                        key={activePlayingEpisode.streamUrl}
                        src={activePlayingEpisode.streamUrl}
                        poster={details?.backdropUrl || item.backdropUrl}
                      />
                    ) : (
                      <iframe
                        className="w-full h-full border-0"
                        src={activePlayingEpisode.embedUrl}
                        title={activePlayingEpisode.title}
                        sandbox="allow-scripts allow-same-origin allow-forms allow-presentation allow-popups"
                        allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
                        allowFullScreen
                      />
                    )
                  ) : videoPlayMode === 'full_movie' && fullMovie ? (
                    (selectedQualityUrl || fullMovie.qualities?.[0]?.url) ? (
                      <HlsVideoPlayer
                        key={selectedQualityUrl || fullMovie.qualities[0].url}
                        src={selectedQualityUrl || fullMovie.qualities[0].url}
                        poster={details?.backdropUrl || item.backdropUrl}
                      />
                    ) : (
                      <iframe
                        className="w-full h-full border-0"
                        src={fullMovie.embedUrl || (fullMovie.provider === 'Namasha' ? `https://www.namasha.com/embed/${fullMovie.uid}` : `https://www.aparat.com/video/video/embed/videohash/${fullMovie.uid}/vt/frame`)}
                        title={fullMovie.title}
                        sandbox="allow-scripts allow-same-origin allow-forms allow-presentation allow-popups"
                        allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
                        allowFullScreen
                      />
                    )
                  ) : activeTrailer ? (
                    <iframe
                      className="w-full h-full border-0"
                      src={activeTrailer.embedUrl || activeTrailer.url}
                      title={activeTrailer.name || 'فیلم تریلر'}
                      sandbox="allow-scripts allow-same-origin allow-forms allow-presentation allow-popups"
                      allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
                      allowFullScreen
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-zinc-400 text-sm">
                      ویدیویی یافت نشد.
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* High-Res Backdrop with Cinematic Glassmorphic Overlay & Scroll Blur Effect */
              <div className="relative w-full h-full overflow-hidden">
                <img
                  src={details?.backdropUrl || item.backdropUrl || details?.posterUrl || item.posterUrl}
                  alt={item.title}
                  className="w-full h-full object-cover object-center transition-all duration-300 ease-out"
                  style={{
                    filter: `brightness(${0.85 - scrollRatio * 0.45}) blur(${scrollRatio * 14}px)`,
                    transform: `scale(${1.05 + scrollRatio * 0.08}) translateY(${scrollRatio * 20}px)`,
                    opacity: 1 - scrollRatio * 0.35,
                  }}
                />

                {/* Deep seamless vignette overlay */}
                {/* Bottom-to-top gradient: transitioning smoothly from pure #030305 at the base to rgba(3,3,5,0.75) in the middle, fading into subtle transparency at the top */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#030305] via-[#030305]/80 to-transparent pointer-events-none" />
                {/* Right-to-left soft horizontal shade (from-[#030305]/90 via-transparent to-transparent) to guarantee high text contrast and legibility in RTL mode */}
                <div className="absolute inset-0 bg-gradient-to-l from-[#030305]/90 via-transparent to-transparent pointer-events-none" />

                {/* Hero Overlay Details with dynamic scroll-out transition */}
                <div
                  className="absolute inset-0 flex flex-col justify-end p-6 sm:p-8 md:p-10 z-10 transition-all duration-200"
                  style={{
                    opacity: 1 - scrollRatio * 0.9,
                    transform: `translateY(-${scrollRatio * 18}px)`,
                  }}
                >
                  {/* 2. Badge & Metadata Pill Row (Refined Glassmorphism) */}
                  <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 mb-3.5">
                    {/* Rating Badge */}
                    <span className="bg-zinc-900/60 backdrop-blur-md border border-zinc-700/50 rounded-xl px-3 py-1.5 text-xs text-zinc-300 font-medium flex items-center gap-1.5 shadow-sm">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400 shrink-0" />
                      <span className="font-mono text-amber-300 font-bold">{details?.rating || item.rating || '7.8'}/10</span>
                    </span>

                    {/* Year Badge */}
                    <span className="bg-zinc-900/60 backdrop-blur-md border border-zinc-700/50 rounded-xl px-3 py-1.5 text-xs text-zinc-300 font-medium flex items-center gap-1.5 shadow-sm">
                      <Calendar className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                      <span className="font-mono">{details?.releaseYear || item.releaseYear || '2024'}</span>
                    </span>

                    {/* Runtime Badge */}
                    <span className="bg-zinc-900/60 backdrop-blur-md border border-zinc-700/50 rounded-xl px-3 py-1.5 text-xs text-zinc-300 font-medium flex items-center gap-1.5 shadow-sm">
                      <Clock className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                      <span>{details?.runtime || (isSeriesMode ? 'مجموعه تلویزیونی' : (fullMovie?.durationFormatted || '۱۴۵ دقیقه'))}</span>
                    </span>

                    {/* Audio/Dub Badge */}
                    <span className="bg-zinc-900/60 backdrop-blur-md border border-zinc-700/50 rounded-xl px-3 py-1.5 text-xs text-zinc-300 font-medium flex items-center gap-1.5 shadow-sm">
                      <Bookmark className="w-3.5 h-3.5 text-amber-400/80 shrink-0" />
                      <span>{(fullMovie?.isDubbed || baseMovie?.isDubbed) ? 'دوبله فارسی' : ((fullMovie?.isSubbed || baseMovie?.isSubbed) ? 'زیرنویس فارسی' : 'دوبله فارسی')}</span>
                    </span>

                    {/* Series Seasons Badge */}
                    {seriesData && seriesData.totalEpisodes > 0 && (
                      <span className="bg-zinc-900/60 backdrop-blur-md border border-zinc-700/50 rounded-xl px-3 py-1.5 text-xs text-emerald-300 font-medium flex items-center gap-1.5 shadow-sm">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                        <span>{seriesData.totalSeasons} فصل • {seriesData.totalEpisodes} قسمت</span>
                      </span>
                    )}
                  </div>

                  {/* 3. Title & Typography Hierarchy */}
                  <h1 className="font-black text-3xl sm:text-4xl text-white tracking-wide drop-shadow-md">
                    {details?.titleFa || item.titleFa || item.title}
                  </h1>
                  <p className="text-sm sm:text-base text-zinc-400 font-sans tracking-wide mt-1 drop-shadow mb-6">
                    {details?.title || item.title}
                  </p>

                  {/* 4. Cinematic Action Button Row */}
                  <div className="flex flex-wrap items-center gap-3">
                    {/* Series: Direct Link to External Source Hubs */}
                    {isSeriesMode ? (
                      <button
                        type="button"
                        data-tv-id="modal-play-full"
                        onClick={() => {
                          const el = document.getElementById('series-sources-section');
                          if (el) el.scrollIntoView({ behavior: 'smooth' });
                        }}
                        className="tv-focusable border-2 border-amber-500/80 bg-zinc-950/80 hover:bg-amber-500 hover:text-black text-amber-400 font-bold px-5 py-2.5 rounded-2xl flex items-center gap-2 transition-all duration-300 shadow-[0_0_20px_rgba(245,158,11,0.15)] hover:shadow-[0_0_25px_rgba(245,158,11,0.4)] cursor-pointer"
                      >
                        <Tv className="w-4 h-4" />
                        <span>مراجع دانلود و تماشای تمامی قسمت‌های سریال</span>
                      </button>
                    ) : (
                      /* Single Movie: Primary Play Button */
                      <button
                        type="button"
                        data-tv-id="modal-play-full"
                        onClick={() => {
                          if (fullMovie?.available) {
                            setIsQualityModalOpen(true);
                          } else if (isSearchingAparat) {
                            // in search
                          } else {
                            const el = document.getElementById('movie-sources-section') || document.getElementById('series-sources-section');
                            if (el) el.scrollIntoView({ behavior: 'smooth' });
                          }
                        }}
                        className="tv-focusable border-2 border-amber-500/80 bg-zinc-950/80 hover:bg-amber-500 hover:text-black text-amber-400 font-bold px-5 py-2.5 rounded-2xl flex items-center gap-2 transition-all duration-300 shadow-[0_0_20px_rgba(245,158,11,0.15)] hover:shadow-[0_0_25px_rgba(245,158,11,0.4)] cursor-pointer"
                      >
                        <Tv className="w-4 h-4" />
                        <span>
                          {fullMovie?.available
                            ? `پخش فیلم کامل در ${fullMovie.providerNameFa || (fullMovie.provider === 'Namasha' ? 'نماشا' : 'آپارات')}${fullMovie.durationFormatted ? ` (${fullMovie.durationFormatted})` : ''}`
                            : (isSearchingAparat ? 'در حال دریافت کیفیت‌های فیلم از آپارات...' : 'پخش فیلم کامل')}
                        </span>
                      </button>
                    )}

                    {/* Secondary Iran Server Trailer ("پخش تریلر - آپارات") */}
                    <button
                      type="button"
                      data-tv-id="modal-trailer-aparat"
                      onClick={() => {
                        const aparatIdx = availableTrailers.findIndex(
                          (t) => t.isIranAccessible || t.site === 'Aparat'
                        );
                        setSelectedTrailerIndex(aparatIdx !== -1 ? aparatIdx : 0);
                        setVideoPlayMode('trailer');
                        setIsPlayingVideo(true);
                      }}
                      className="tv-focusable bg-emerald-950/40 hover:bg-emerald-600 border border-emerald-500/50 hover:border-emerald-400 text-emerald-300 hover:text-white font-semibold px-4 py-2.5 rounded-2xl flex items-center gap-2 transition-all duration-300 cursor-pointer"
                    >
                      <Play className="w-4 h-4" />
                      <span>پخش تریلر (آپارات)</span>
                    </button>

                    {/* Global Streaming Server Button */}
                    <button
                      type="button"
                      data-tv-id="modal-play-global"
                      onClick={() => {
                        setSelectedMovieVersion('global');
                        setVideoPlayMode('global');
                        setIsPlayingVideo(true);
                      }}
                      className="tv-focusable bg-indigo-950/50 hover:bg-indigo-600 border border-indigo-500/50 hover:border-indigo-400 text-indigo-300 hover:text-white font-semibold px-4 py-2.5 rounded-2xl flex items-center gap-2 transition-all duration-300 cursor-pointer shadow-sm"
                    >
                      <Globe className="w-4 h-4 text-indigo-400" />
                      <span>سرور جهانی (Global CDN)</span>
                    </button>

                    {/* Tertiary Global Trailer ("پخش تریلر - یوتیوب") */}
                    <button
                      type="button"
                      data-tv-id="modal-trailer-youtube"
                      onClick={() => {
                        const ytIdx = availableTrailers.findIndex((t) => t.site === 'YouTube');
                        setSelectedTrailerIndex(ytIdx !== -1 ? ytIdx : 0);
                        setVideoPlayMode('trailer');
                        setIsPlayingVideo(true);
                      }}
                      className="tv-focusable bg-zinc-900/60 hover:bg-zinc-800 border border-zinc-700/60 text-zinc-300 hover:text-white font-semibold px-4 py-2.5 rounded-2xl flex items-center gap-2 transition-all duration-300 cursor-pointer"
                    >
                      <Play className="w-4 h-4 text-zinc-400" />
                      <span>پخش تریلر (یوتیوب)</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 2. BODY CONTENT */}
          <div className="p-6 sm:p-8 space-y-8">
            {/* =========================================================
                SECTION 1: APARAT & NAMASHA MOVIE ARCHIVE (DIRECT STREAM & DOWNLOAD)
                Only rendered for Movies (!isSeriesMode)
                Accessible in Iran AND abroad, no VPN needed
               ========================================================= */}
            {!isSeriesMode && (
              <section className="bg-zinc-950/60 backdrop-blur-2xl border border-amber-500/30 rounded-3xl p-5 sm:p-7 shadow-[0_20px_50px_rgba(0,0,0,0.6)] relative overflow-hidden">
                {/* Header Row: TV icon + Title + Green Pill (Right) & Search Bar (Left) */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-zinc-800/80">
                  <div className="flex items-center gap-3.5">
                    <div className="w-11 h-11 rounded-2xl bg-amber-500/10 border border-amber-500/40 text-amber-400 flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(245,158,11,0.15)]">
                      <Tv className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <h3 className="text-base sm:text-lg font-black text-white tracking-wide">
                          تماشای آنلاین و دانلود فیلم کامل ({fullMovie?.providerNameFa || 'آپارات'})
                        </h3>
                        <span className="rounded-full px-3 py-1 bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-xs font-bold flex items-center gap-1.5 shadow-sm">
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                          <span>بدون فیلترشکن • ترافیک نیم‌بها</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Search Input Seamless Capsule (Left side) */}
                  <form onSubmit={handleSearchAparat} className="flex items-center gap-2 w-full lg:w-auto">
                    <div className="relative flex-1 lg:w-64">
                      <input
                        type="text"
                        value={customAparatQuery}
                        onChange={(e) => setCustomAparatQuery(e.target.value)}
                        placeholder="جستجوی عنوان در آپارات..."
                        className="w-full bg-zinc-900/80 border border-zinc-700/80 rounded-xl px-3.5 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500 transition-all"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={isSearchingAparat}
                      className="tv-focusable px-4 py-2 rounded-xl bg-zinc-800/90 hover:bg-zinc-700 text-xs font-bold text-zinc-200 hover:text-white border border-zinc-700/80 flex items-center gap-1.5 transition-all disabled:opacity-50 cursor-pointer shadow-sm"
                      title="جستجوی دوباره در آپارات"
                    >
                      {isSearchingAparat ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-400" />
                      ) : (
                        <Search className="w-3.5 h-3.5 text-zinc-400" />
                      )}
                      <span>جستجو</span>
                    </button>
                  </form>
                </div>

                {/* 3. Movie Version Selector (Floating Pill Matrix) */}
                <div className="mt-5 p-3 rounded-2xl bg-zinc-950/70 border border-zinc-800/80 flex flex-wrap items-center justify-between sm:justify-start gap-3">
                  <span className="text-xs font-bold text-zinc-400 ml-2">نسخه و سرور:</span>

                  <div className="flex flex-wrap items-center gap-2.5">
                    {baseMovie?.dubbedVersion && (() => {
                      const isDubbedActive = selectedMovieVersion === 'dubbed' || (selectedMovieVersion === 'auto' && baseMovie.isDubbed);
                      return (
                        <button
                          type="button"
                          onClick={() => setSelectedMovieVersion('dubbed')}
                          className={`tv-focusable rounded-full px-4 py-2 text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                            isDubbedActive
                              ? 'bg-amber-500/20 border border-amber-500/70 text-amber-300 shadow-[0_0_20px_rgba(245,158,11,0.25)] ring-1 ring-amber-500/40'
                              : 'bg-zinc-900/40 border border-zinc-700/40 text-zinc-400 hover:text-zinc-200 hover:border-zinc-500'
                          }`}
                        >
                          <Mic className="w-3.5 h-3.5 text-amber-400" />
                          <span>دوبله فارسی (سرور ایران)</span>
                          <span className="text-[10px] opacity-80 font-mono px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300">
                            {baseMovie.dubbedVersion.bestQuality || 'HD'}
                          </span>
                        </button>
                      );
                    })()}

                    {baseMovie?.subbedVersion && (() => {
                      const isSubbedActive = selectedMovieVersion === 'subbed' || (selectedMovieVersion === 'auto' && !baseMovie.isDubbed && baseMovie.isSubbed);
                      return (
                        <button
                          type="button"
                          onClick={() => setSelectedMovieVersion('subbed')}
                          className={`tv-focusable rounded-full px-4 py-2 text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                            isSubbedActive
                              ? 'bg-amber-500/20 border border-amber-500/70 text-amber-300 shadow-[0_0_20px_rgba(245,158,11,0.25)] ring-1 ring-amber-500/40'
                              : 'bg-zinc-900/40 border border-zinc-700/40 text-zinc-400 hover:text-zinc-200 hover:border-zinc-500'
                          }`}
                        >
                          <FileText className="w-3.5 h-3.5 text-zinc-400" />
                          <span>زیرنویس فارسی (سرور ایران)</span>
                          <span className="text-[10px] opacity-80 font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300">
                            {baseMovie.subbedVersion.bestQuality || 'HD'}
                          </span>
                        </button>
                      );
                    })()}

                    {/* Global Server Pill */}
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedMovieVersion('global');
                        setVideoPlayMode('global');
                      }}
                      className={`tv-focusable rounded-full px-4 py-2 text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                        selectedMovieVersion === 'global'
                          ? 'bg-indigo-500/25 border border-indigo-500/80 text-indigo-300 shadow-[0_0_20px_rgba(99,102,241,0.3)] ring-1 ring-indigo-500/50'
                          : 'bg-zinc-900/40 border border-zinc-700/40 text-zinc-400 hover:text-zinc-200 hover:border-zinc-500'
                      }`}
                    >
                      <Globe className="w-3.5 h-3.5 text-indigo-400" />
                      <span>سرور جهانی (Global CDN / تورنت)</span>
                      <span className="text-[10px] opacity-90 font-mono px-1.5 py-0.5 rounded bg-indigo-500/30 text-indigo-200">
                        {globalStreamingData?.directStreams?.[0]?.quality || '1080p'}
                      </span>
                    </button>
                  </div>
                </div>

                {selectedMovieVersion === 'global' ? (
                  <div className="mt-5">
                    <GlobalStreamingPanel
                      data={globalStreamingData}
                      isLoading={isLoadingGlobalStreams}
                      selectedTier={selectedGlobalTier}
                      onSelectTier={setSelectedGlobalTier}
                      selectedDirectIndex={selectedDirectQualityIndex}
                      selectedQualityIndex={selectedDirectQualityIndex}
                      onSelectDirectIndex={(idx) => {
                        setSelectedDirectQualityIndex(idx);
                        setVideoPlayMode('global');
                        setIsPlayingVideo(true);
                        if (modalRef.current) modalRef.current.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      onSelectQualityIndex={(idx) => {
                        setSelectedDirectQualityIndex(idx);
                        setVideoPlayMode('global');
                        setIsPlayingVideo(true);
                        if (modalRef.current) modalRef.current.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      onPlayDirect={(stream, idx) => {
                        setSelectedDirectQualityIndex(idx);
                        setVideoPlayMode('global');
                        setIsPlayingVideo(true);
                        if (modalRef.current) modalRef.current.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      onPlayDirectStream={(stream, idx) => {
                        if (typeof idx === 'number') setSelectedDirectQualityIndex(idx);
                        setVideoPlayMode('global');
                        setIsPlayingVideo(true);
                        if (modalRef.current) modalRef.current.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      selectedMirrorId={selectedGlobalMirrorId}
                      onSelectMirrorId={(mirrorId) => {
                        setSelectedGlobalMirrorId(mirrorId);
                        setVideoPlayMode('global');
                        setIsPlayingVideo(true);
                        if (modalRef.current) modalRef.current.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      onSelectMirror={(mirrorId) => {
                        setSelectedGlobalMirrorId(mirrorId);
                        setVideoPlayMode('global');
                        setIsPlayingVideo(true);
                        if (modalRef.current) modalRef.current.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      onPlayMirror={(mirror) => {
                        setSelectedGlobalMirrorId(mirror.id);
                        setVideoPlayMode('global');
                        setIsPlayingVideo(true);
                        if (modalRef.current) modalRef.current.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      onPlayTorrent={(torrent) => {
                        setActivePlayingTorrent(torrent);
                        setVideoPlayMode('torrent');
                        setIsPlayingVideo(true);
                        if (modalRef.current) modalRef.current.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      isSubtitleEnabled={isSubtitleEnabled}
                      onToggleSubtitle={() => setIsSubtitleEnabled(prev => !prev)}
                      mediaTitle={item.titleFa || item.title || ''}
                      title={item.title || ''}
                      titleFa={item.titleFa || ''}
                    />
                  </div>
                ) : fullMovie && fullMovie.available ? (
                  <div className="mt-5 space-y-6">
                    {/* Movie Info on Aparat / Namasha */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-zinc-950/60 p-4 rounded-2xl border border-zinc-800/80 backdrop-blur-md">
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-bold text-amber-400">عنوان فایل در {fullMovie.providerNameFa || (fullMovie.provider === 'Namasha' ? 'نماشا' : 'آپارات')}:</span>
                          <h4 className="text-sm sm:text-base font-bold text-zinc-100">{fullMovie.title}</h4>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-zinc-400 flex-wrap">
                          <span className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-zinc-500" />
                            <span>مدت زمان: <strong className="text-zinc-300">{fullMovie.durationFormatted}</strong></span>
                          </span>
                          {fullMovie.provider === 'Namasha' ? (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold">
                              سرور نماشا
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[10px] font-bold">
                              سرور آپارات
                            </span>
                          )}
                          {fullMovie.senderName && (
                            <span>ناشر: <strong className="text-zinc-300">{fullMovie.senderName}</strong></span>
                          )}
                        </div>
                      </div>

                      <a
                        href={fullMovie.pageUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="tv-focusable px-3.5 py-2 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 hover:text-white text-xs border border-zinc-700/60 flex items-center justify-center gap-2 transition-all self-start sm:self-auto cursor-pointer shadow-sm"
                      >
                        <span>صفحه ویدیو در {fullMovie.providerNameFa || (fullMovie.provider === 'Namasha' ? 'نماشا' : 'آپارات')}</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>

                    {/* 4. Quality & Download Nodes (Circular / Oval Glass Cells) */}
                    <div>
                      <div className="flex items-center gap-2 mb-3.5">
                        <Download className="w-4 h-4 text-emerald-400" />
                        <span className="text-xs sm:text-sm text-zinc-200 font-bold">
                          کیفیت‌های موجود برای پخش و دانلود مستقیم:
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
                        {fullMovie.qualities?.map((q: AparatQuality, qIdx: number) => {
                          const cleanQualityText = q.text.startsWith('با ') ? q.text : `با ${q.text}`;
                          return (
                            <div
                              key={qIdx}
                              className="rounded-3xl bg-zinc-900/40 hover:bg-zinc-900/70 border border-amber-500/30 hover:border-amber-400/80 backdrop-blur-md p-4 sm:p-5 flex flex-col items-center justify-between text-center transition-all duration-300 hover:scale-102 sm:hover:scale-105 shadow-xl group"
                            >
                              <div className="w-full flex flex-col items-center">
                                <span className="text-sm sm:text-base font-bold text-amber-400 tracking-wide block">
                                  {cleanQualityText}
                                </span>
                                {q.size ? (
                                  <span className="text-[11px] text-zinc-400 font-mono mt-1 mb-4 block">
                                    {q.size}
                                  </span>
                                ) : (
                                  <span className="text-[11px] text-zinc-500 font-mono mt-1 mb-4 block">
                                    کیفیت استاندارد
                                  </span>
                                )}
                              </div>

                              <div className="flex items-center gap-2 w-full mt-1">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedQualityUrl(q.url);
                                    setSelectedQualityProfile(q.profile || q.text);
                                    setVideoPlayMode('full_movie');
                                    setIsPlayingVideo(true);
                                    if (modalRef.current) modalRef.current.scrollTo({ top: 0, behavior: 'smooth' });
                                  }}
                                  className="tv-focusable flex-1 py-2.5 px-3 rounded-full bg-amber-500 hover:bg-amber-400 text-black font-black text-xs flex items-center justify-center gap-1.5 shadow-md shadow-amber-950/40 hover:shadow-[0_0_20px_rgba(245,158,11,0.4)] transition-all cursor-pointer"
                                  title="پخش آنلاین با این کیفیت"
                                >
                                  <Play className="w-3.5 h-3.5 fill-black" />
                                  <span>پخش</span>
                                </button>
                                <a
                                  href={q.url}
                                  target="_blank"
                                  rel="noreferrer"
                                  download
                                  className="tv-focusable p-2.5 rounded-full bg-zinc-800/90 hover:bg-emerald-600 text-zinc-300 hover:text-white border border-zinc-700/60 transition-all flex items-center justify-center shadow-sm cursor-pointer"
                                  title="دانلود مستقیم فایل"
                                >
                                  <Download className="w-4 h-4" />
                                </a>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* 5. External Players & Web Play Row (Sleek Horizontal Capsule Bar) */}
                    <div className="pt-4 border-t border-zinc-800/80">
                      <div className="flex items-center gap-2 mb-3">
                        <MonitorPlay className="w-4 h-4 text-blue-400" />
                        <span className="text-xs sm:text-sm text-zinc-300 font-bold">
                          پخش در پلیرهای خارجی (کامپیوتر، موبایل و تلویزیون):
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-2.5">
                        {fullMovie.vlcUrl && (
                          <a
                            href={fullMovie.vlcUrl}
                            className="tv-focusable rounded-full px-4 py-2 bg-zinc-900/50 hover:bg-zinc-800 border border-zinc-700/60 hover:border-amber-400/60 text-xs font-medium text-zinc-300 hover:text-white flex items-center gap-2 transition-all duration-200 shadow-md cursor-pointer"
                            title="باز کردن در VLC Player"
                          >
                            <span className="w-2 h-2 rounded-full bg-orange-400 shadow-[0_0_8px_rgba(251,146,60,0.6)]" />
                            <span>پخش در VLC Player</span>
                          </a>
                        )}

                        {fullMovie.potPlayerUrl && (
                          <a
                            href={fullMovie.potPlayerUrl}
                            className="tv-focusable rounded-full px-4 py-2 bg-zinc-900/50 hover:bg-zinc-800 border border-zinc-700/60 hover:border-amber-400/60 text-xs font-medium text-zinc-300 hover:text-white flex items-center gap-2 transition-all duration-200 shadow-md cursor-pointer"
                            title="باز کردن در PotPlayer"
                          >
                            <span className="w-2 h-2 rounded-full bg-yellow-400 shadow-[0_0_8px_rgba(250,204,21,0.6)]" />
                            <span>پخش در PotPlayer</span>
                          </a>
                        )}

                        {fullMovie.mxPlayerUrl && (
                          <a
                            href={fullMovie.mxPlayerUrl}
                            className="tv-focusable rounded-full px-4 py-2 bg-zinc-900/50 hover:bg-zinc-800 border border-zinc-700/60 hover:border-amber-400/60 text-xs font-medium text-zinc-300 hover:text-white flex items-center gap-2 transition-all duration-200 shadow-md cursor-pointer"
                            title="باز کردن در MX Player اندروید"
                          >
                            <span className="w-2 h-2 rounded-full bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.6)]" />
                            <span>پخش در MX Player (موبایل)</span>
                          </a>
                        )}

                        {primaryMovieStreamLink && (
                          <button
                            type="button"
                            onClick={() => handleCopyStreamLink(primaryMovieStreamLink, 'movie-stream')}
                            className="tv-focusable rounded-full px-4 py-2 bg-zinc-900/50 hover:bg-zinc-800 border border-zinc-700/60 hover:border-amber-400/60 text-xs font-medium text-zinc-300 hover:text-white flex items-center gap-2 transition-all duration-200 shadow-md cursor-pointer"
                            title="کپی لینک استریم جهت درج در KMPlayer، تلویزیون یا Infuse"
                          >
                            {copiedStreamUrl === 'movie-stream' ? (
                              <>
                                <Check className="w-4 h-4 text-emerald-400" />
                                <span className="text-emerald-400 font-bold">لینک استریم کپی شد!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-4 h-4 text-zinc-400" />
                                <span>کپی لینک استریم جهت درج در پلیر یا تلویزیون</span>
                              </>
                            )}
                          </button>
                        )}

                        {/* Browser Direct Play (Highlighted as the primary action pill with vibrant amber border and play icon) */}
                        <button
                          type="button"
                          onClick={() => {
                            setVideoPlayMode('full_movie');
                            setIsPlayingVideo(true);
                            if (modalRef.current) modalRef.current.scrollTo({ top: 0, behavior: 'smooth' });
                          }}
                          className="tv-focusable rounded-full px-5 py-2.5 bg-gradient-to-r from-amber-500/20 to-amber-500/10 hover:from-amber-500/30 hover:to-amber-500/20 text-amber-300 border-2 border-amber-500/80 hover:border-amber-400 text-xs font-black flex items-center gap-2 transition-all duration-200 shadow-[0_0_20px_rgba(245,158,11,0.2)] hover:shadow-[0_0_25px_rgba(245,158,11,0.4)] cursor-pointer"
                        >
                          <Play className="w-4 h-4 fill-amber-300 text-amber-300" />
                          <span>پخش آنلاین همینجا در مرورگر</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ) : isSearchingAparat ? (
                  <div className="mt-5 p-6 rounded-3xl bg-zinc-900/40 border border-zinc-800/80 backdrop-blur-md flex items-center justify-center gap-3">
                    <RefreshCw className="w-5 h-5 text-amber-400 animate-spin" />
                    <span className="text-xs sm:text-sm font-bold text-zinc-300">
                      در حال دریافت و آماده‌سازی کیفیت‌های فیلم از آپارات...
                    </span>
                  </div>
                ) : (
                  /* CASE C: NOT FOUND */
                  <div className="mt-5 p-5 rounded-3xl bg-zinc-900/40 border border-zinc-800/80 backdrop-blur-md flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="space-y-1 text-center sm:text-right">
                      <h4 className="text-xs sm:text-sm font-bold text-zinc-200">
                        ویدیوی کامل در آپارات یافت نشد
                      </h4>
                      <p className="text-xs text-zinc-400">
                        می‌توانید عنوان فیلم را در کادر جستجوی بالا وارد کنید یا در وب‌سایت آپارات جستجو نمایید:
                      </p>
                    </div>
                    <a
                      href={`https://www.aparat.com/search/${encodeURIComponent(customAparatQuery || item.titleFa || item.title)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="tv-focusable px-4 py-2.5 rounded-full bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-xs font-bold border border-amber-500/40 flex items-center gap-1.5 transition-all whitespace-nowrap cursor-pointer shadow-md"
                    >
                      <span>مشاهده در وب‌سایت آپارات</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                )}
              </section>
            )}

          {/* =========================================================
              SERIES GLOBAL STREAMING & TORRENT SECTION
              For Series: High-speed international streaming & episode torrents
             ========================================================= */}
          {isSeriesMode && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-indigo-500/20 border border-indigo-500/40 text-indigo-400">
                    <Globe className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-base sm:text-lg font-black text-zinc-100 font-persian">
                        سرورهای جهانی پخش آنلاین و تورنت سریال
                      </h3>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                        فصل {selectedSeasonNumber || 1}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-400 mt-1 font-persian">
                      پخش آنلاین با ۶ سرور پرسرعت بین‌المللی و دانلود تورنت قسمت‌های این فصل با سیدر بالا
                    </p>
                  </div>
                </div>
              </div>

              <GlobalStreamingPanel
                data={globalStreamingData}
                isLoading={isLoadingGlobalStreams}
                selectedTier={selectedGlobalTier}
                onSelectTier={setSelectedGlobalTier}
                selectedDirectIndex={selectedDirectQualityIndex}
                selectedQualityIndex={selectedDirectQualityIndex}
                onSelectDirectIndex={(idx) => {
                  setSelectedDirectQualityIndex(idx);
                  setVideoPlayMode('global');
                  setIsPlayingVideo(true);
                  if (modalRef.current) modalRef.current.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                onSelectQualityIndex={(idx) => {
                  setSelectedDirectQualityIndex(idx);
                  setVideoPlayMode('global');
                  setIsPlayingVideo(true);
                  if (modalRef.current) modalRef.current.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                selectedMirrorId={selectedGlobalMirrorId}
                onSelectMirrorId={(mirrorId) => {
                  setSelectedGlobalMirrorId(mirrorId);
                  setVideoPlayMode('global');
                  setIsPlayingVideo(true);
                  if (modalRef.current) modalRef.current.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                onSelectMirror={(mirrorId) => {
                  setSelectedGlobalMirrorId(mirrorId);
                  setVideoPlayMode('global');
                  setIsPlayingVideo(true);
                  if (modalRef.current) modalRef.current.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                onPlayMirror={(mirror) => {
                  setSelectedGlobalMirrorId(mirror.id);
                  setVideoPlayMode('global');
                  setIsPlayingVideo(true);
                  if (modalRef.current) modalRef.current.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                onPlayTorrent={(torrent) => {
                  setActivePlayingTorrent(torrent);
                  setVideoPlayMode('torrent');
                  setIsPlayingVideo(true);
                  if (modalRef.current) modalRef.current.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                isSubtitleEnabled={isSubtitleEnabled}
                onToggleSubtitle={() => setIsSubtitleEnabled(prev => !prev)}
                mediaTitle={item.titleFa || item.title || ''}
                title={item.title || ''}
                titleFa={item.titleFa || ''}
              />
            </div>
          )}

          {/* =========================================================
              SECTION 2: IRANIAN SOURCE HUBS (DOWNLOAD WEBSITES)
              For Series: Primary hub for downloading all seasons & episodes
              For Movies: High-bitrate Bluray & 4K download alternatives
             ========================================================= */}
          <section
            id={isSeriesMode ? 'series-sources-section' : 'movie-sources-section'}
            className={`space-y-4 ${
              isSeriesMode
                ? 'p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-zinc-900/95 via-[#161c28] to-zinc-900 border-2 border-amber-500/40 shadow-2xl'
                : ''
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-3">
                <div
                  className={`p-2.5 rounded-xl border ${
                    isSeriesMode
                      ? 'bg-amber-500/20 border-amber-500/40 text-amber-400 shadow-inner'
                      : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                  }`}
                >
                  {isSeriesMode ? <Layers className="w-6 h-6" /> : <Globe className="w-5 h-5" />}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-base sm:text-lg font-black text-zinc-100">
                      {isSeriesMode
                        ? 'مراجع معتبر دانلود و تماشای تمامی قسمت‌های سریال'
                        : 'سایت‌های ارائه‌دهنده و مراجع دانلود فیلم'}
                    </h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      {details?.sources?.length || 7} مرجع جامع
                    </span>
                    {isSeriesMode && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        تمام فصل‌ها و قسمت‌ها
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-zinc-400 mt-1">
                    {isSeriesMode
                      ? 'با توجه به متفرق بودن قسمت‌های سریال‌ها در سرویس‌های اشتراک ویدیو، جهت دانلود تمامی قسمت‌ها و فصل‌ها با کیفیت‌های متنوع (1080p, 720p, 480p)، دوبله فارسی و زیرنویس اختصاصی، از مراجع زیر استفاده کنید:'
                      : 'برای دانلود نسخه‌های اورجینال، کیفیت‌های بلوری Bluray، فرمت‌های 4K و صوت دوبله جداگانه، روی هر یک از سایت‌های زیر کلیک کنید:'}
                  </p>
                </div>
              </div>
            </div>

            {/* Intelligent Prioritization: Verified Available vs Other Sources (Zero Data Mismatch) */}
            {(() => {
              const allSources = details?.sources || [];
              const isSourceVerified = (src: MovieSourceHub) => {
                // Priority 1: Direct available flag from synchronized server endpoint
                if (src.available !== undefined) {
                  return Boolean(src.available);
                }

                // Priority 2: Direct match with current active search result/catalog source
                if (item.sourceSite && (src.name?.toLowerCase().includes(item.sourceSite.toLowerCase()) || src.id?.toLowerCase().includes(item.sourceSite.toLowerCase()) || item.sourceSite.toLowerCase().includes(src.id?.toLowerCase()))) {
                  return true;
                }
                if (item.streamSources && item.streamSources.some(s => s.site?.toLowerCase() === src.id?.toLowerCase() || s.site?.toLowerCase() === src.name?.toLowerCase())) {
                  return true;
                }

                // Priority 3: Synchronized client-side hover availability cache
                const byId = sourceAvailabilities[src.id?.toLowerCase()];
                const byName = sourceAvailabilities[src.name?.toLowerCase()];
                const byFa = sourceAvailabilities[src.nameFa];
                if (byId !== undefined) return Boolean(byId);
                if (byName !== undefined) return Boolean(byName);
                if (byFa !== undefined) return Boolean(byFa);

                return Boolean(src.highlighted || src.isExactMatch);
              };

              // Sort with verified/available sources first
              const sortedSources = [...allSources].sort((a, b) => {
                const aVer = isSourceVerified(a) ? 1 : 0;
                const bVer = isSourceVerified(b) ? 1 : 0;
                return bVer - aVer;
              });

              const verifiedCount = sortedSources.filter(isSourceVerified).length;

              return (
                <div className="space-y-4">
                  {/* Status banner */}
                  <div className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-zinc-900/80 border border-zinc-800 text-xs font-persian flex-wrap">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span className="text-zinc-300">
                        {verifiedCount > 0 ? (
                          <>تأیید دسترسی مستقیم در <strong className="text-emerald-300 font-bold">{verifiedCount} سایت</strong> از مجموع <strong className="text-white font-bold">{sortedSources.length} مرجع</strong></>
                        ) : (
                          <>نمایش جامع تمامی <strong className="text-white font-bold">{sortedSources.length} مرجع معتبر</strong> استریم و دانلود</>
                        )}
                      </span>
                    </div>
                    <span className="text-[11px] text-zinc-400">
                      پشتیبانی از ترافیک نیم‌بها و بای‌پس تحریم CDN با پروکسی هوشمند
                    </span>
                  </div>

                  {/* Primary Grid: All Sources (Sorted by availability) */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                    {sortedSources.map((src: MovieSourceHub) => {
                      const isVerified = isSourceVerified(src);
                      return (
                        <div
                          key={src.id}
                          className={`relative flex flex-col justify-between p-4 rounded-xl border transition-all duration-200 ${
                            isVerified
                              ? isSeriesMode
                                ? 'bg-gradient-to-br from-amber-950/30 via-zinc-900 to-zinc-900 border-amber-500/50 shadow-lg shadow-amber-950/20'
                                : 'bg-gradient-to-br from-emerald-950/40 via-[#0e121a] to-zinc-900 border-emerald-500/50 shadow-lg shadow-emerald-950/30 ring-1 ring-emerald-500/20'
                              : 'bg-zinc-900/60 hover:bg-zinc-900 border-zinc-800 hover:border-zinc-700'
                          }`}
                        >
                          <div>
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <div className="flex items-center gap-2.5">
                                <div
                                  className={`w-9 h-9 rounded-lg border flex items-center justify-center font-black text-sm shadow-inner ${
                                    isVerified
                                      ? isSeriesMode
                                        ? 'bg-amber-900/40 border-amber-500/50 text-amber-300'
                                        : 'bg-emerald-900/40 border-emerald-500/50 text-emerald-300'
                                      : 'bg-zinc-800 border-zinc-700/80 text-zinc-300'
                                  }`}
                                >
                                  {src.nameFa.slice(0, 1)}
                                </div>
                                <div>
                                  <div className="flex items-center gap-1.5">
                                    <h4 className="font-bold text-sm text-zinc-100">{src.nameFa}</h4>
                                    <span className="text-[11px] text-zinc-500 font-mono font-normal">
                                      ({src.domain})
                                    </span>
                                  </div>
                                  <span className="inline-block text-[10px] text-zinc-400 font-persian">
                                    {src.badge}
                                  </span>
                                </div>
                              </div>

                              {isVerified ? (
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 shadow-sm ${
                                  isSeriesMode ? 'bg-amber-400 text-black' : 'bg-emerald-500 text-black'
                                }`}>
                                  <CheckCircle2 className="w-2.5 h-2.5" />
                                  موجود در آرشیو
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-zinc-800 text-zinc-400 border border-zinc-700/50">
                                  جستجوی مستقیم
                                </span>
                              )}
                            </div>

                            <p className="text-xs text-zinc-400 leading-relaxed line-clamp-2 my-2.5">
                              {isSeriesMode
                                ? `دانلود تمامی قسمت‌ها، فصل‌های کامل و صوت‌های دوبله این سریال در ${src.nameFa}`
                                : src.description}
                            </p>
                          </div>

                          <div className="pt-3 border-t border-zinc-800/80 mt-2">
                            <a
                              href={`/api/web-proxy?url=${encodeURIComponent(src.url)}`}
                              target="_blank"
                              rel="noreferrer"
                              className={`tv-focusable w-full py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                                isVerified
                                  ? isSeriesMode
                                    ? 'bg-amber-500 hover:bg-amber-400 text-black font-black shadow-md'
                                    : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md font-black'
                                  : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white border border-zinc-700/70'
                              }`}
                            >
                              <span>{isSeriesMode ? `دانلود قسمت‌های سریال در ${src.nameFa}` : `مشاهده و دانلود در ${src.nameFa}`}</span>
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}
          </section>

            {/* =========================================================
                SECTION 3: FULL DETAILS & STORY IN PERSIAN
               ========================================================= */}
            <section className="space-y-6 pt-4 border-t border-zinc-800/80">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
                  <Film className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-zinc-100">توضیحات و خلاصه داستان اثر به فارسی</h3>
                  <p className="text-xs text-zinc-400">مشخصات داستانی، هنری و عوامل این اثر</p>
                </div>
              </div>

              {/* Two Column Layout: Poster + Genres on right, Story & Specs on left */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Poster & Genres (1 col) */}
                <div className="space-y-4">
                  <div className="relative rounded-xl overflow-hidden border border-zinc-800 shadow-xl aspect-[2/3] max-w-[240px] mx-auto md:max-w-none">
                    <img
                      src={details?.posterUrl || item.posterUrl}
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Genres */}
                  <div>
                    <span className="text-xs text-zinc-400 font-medium block mb-2">ژانرها:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {(details?.genres || item.genres || []).map((genre) => (
                        <span
                          key={genre}
                          className="px-2.5 py-1 rounded-lg bg-zinc-800/90 text-zinc-300 text-xs border border-zinc-700/70"
                        >
                          {genre}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Plot & Crew (2 cols) */}
                <div className="md:col-span-2 space-y-5">
                  {/* Persian Plot Summary */}
                  <div className="bg-zinc-900/70 p-5 rounded-xl border border-zinc-800 space-y-3">
                    <div className="flex items-center justify-between gap-2 border-b border-zinc-800 pb-2.5">
                      <h4 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-amber-400" />
                        <span>خلاصه داستان (ترجمه فارسی):</span>
                      </h4>
                      {details?.overview && details.overview !== details.overviewFa && (
                        <button
                          type="button"
                          onClick={() => setShowEnglishOverview(!showEnglishOverview)}
                          className="text-[11px] text-zinc-400 hover:text-zinc-200 flex items-center gap-1 font-mono transition-colors"
                        >
                          <span>{showEnglishOverview ? 'مخفی‌سازی متن انگلیسی' : 'مشاهده متن انگلیسی'}</span>
                          <ChevronDown className={`w-3 h-3 transition-transform ${showEnglishOverview ? 'rotate-180' : ''}`} />
                        </button>
                      )}
                    </div>
                    <p className="text-sm sm:text-base text-zinc-200 leading-relaxed font-persian font-normal">
                      {details?.overviewFa || item.overviewFa || details?.overview || item.overview}
                    </p>

                    {/* Optional English Synopsis Toggle */}
                    {showEnglishOverview && details?.overview && (
                      <div className="mt-3 pt-3 border-t border-zinc-800/70 text-left bg-zinc-950/60 p-3 rounded-lg" dir="ltr">
                        <span className="text-[11px] text-zinc-500 font-mono block mb-1">Original English Synopsis:</span>
                        <p className="text-xs text-zinc-400 leading-relaxed font-sans">
                          {details.overview}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Director & Release Year */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Director / Creator */}
                    <div className="bg-zinc-900/60 p-4 rounded-xl border border-zinc-800">
                      <span className="text-xs text-zinc-500 font-medium block mb-1">
                        {isSeriesMode ? 'سازنده / کارگردان:' : 'کارگردان:'}
                      </span>
                      <p className="text-sm font-bold text-zinc-100 flex items-center gap-1.5">
                        <Users className="w-4 h-4 text-blue-400" />
                        <span>{details?.director || 'سینمای بین‌الملل'}</span>
                      </p>
                    </div>

                    {/* Release Year & Format */}
                    <div className="bg-zinc-900/60 p-4 rounded-xl border border-zinc-800">
                      <span className="text-xs text-zinc-500 font-medium block mb-1">سال انتشار و فرمت:</span>
                      <p className="text-sm font-bold text-zinc-100 flex items-center gap-1.5">
                        <Calendar className="w-4 h-4 text-emerald-400" />
                        <span>
                          {details?.releaseYear || item.releaseYear} • {isSeriesMode ? 'مجموعه تلویزیونی (سریال)' : 'فیلم سینمایی'}
                        </span>
                      </p>
                    </div>
                  </div>

                  {/* Main Cast */}
                  {details?.cast && details.cast.length > 0 && (
                    <div className="bg-zinc-900/60 p-4 rounded-xl border border-zinc-800">
                      <span className="text-xs text-zinc-400 font-medium block mb-2.5">
                        بازیگران و ستارگان اصلی:
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {details.cast.map((actor, idx) => (
                          <span
                            key={idx}
                            className="px-2.5 py-1 rounded-md bg-zinc-800 text-zinc-200 text-xs border border-zinc-700/60 font-medium flex items-center gap-1"
                          >
                            <Users className="w-3 h-3 text-zinc-400" />
                            <span>{actor}</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* External Reference Links */}
                  <div className="flex flex-wrap items-center gap-3 pt-2">
                    {details?.imdbUrl && (
                      <a
                        href={details.imdbUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="tv-focusable px-4 py-2 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-xs border border-amber-500/30 flex items-center gap-2 font-mono transition-colors"
                      >
                        <span className="font-bold">مشاهده امتیاز و نظرات در IMDb</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                    {details?.tmdbUrl && (
                      <a
                        href={details.tmdbUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="tv-focusable px-4 py-2 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 text-xs border border-blue-500/30 flex items-center gap-2 transition-colors"
                      >
                        <span>اطلاعات کامل در TMDB</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>

      {/* =========================================================
          QUALITY & VERSION SELECTION POPUP MODAL
          Opens when clicking "پخش فیلم کامل در آپارات"
         ========================================================= */}
      {isQualityModalOpen && fullMovie && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in"
          onClick={() => setIsQualityModalOpen(false)}
        >
          <div
            className="w-full max-w-xl bg-zinc-950/90 backdrop-blur-2xl border border-amber-500/40 rounded-3xl shadow-[0_25px_80px_rgba(0,0,0,0.9)] overflow-hidden animate-scale-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-5 bg-gradient-to-r from-zinc-900/80 via-zinc-950/80 to-zinc-900/80 border-b border-zinc-800/80 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center shadow-[0_0_15px_rgba(245,158,11,0.2)]">
                  <Tv className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-white">
                    انتخاب کیفیت و نسخه فیلم
                  </h3>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    {details?.titleFa || item.titleFa || item.title}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsQualityModalOpen(false)}
                className="tv-focusable w-9 h-9 rounded-full bg-zinc-800/80 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors flex items-center justify-center cursor-pointer"
                title="بستن پنجره"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-5 max-h-[70vh] overflow-y-auto custom-scrollbar">
              {/* Version Selector (Dubbed vs Subtitled) */}
              {baseMovie && (baseMovie.dubbedVersion || baseMovie.subbedVersion) && (
                <div className="space-y-2">
                  <span className="text-xs font-bold text-zinc-400 block">انتخاب نسخه صوتی / زیرنویس:</span>
                  <div className="grid grid-cols-2 gap-2.5">
                    {baseMovie.dubbedVersion && (
                      <button
                        type="button"
                        onClick={() => setSelectedMovieVersion('dubbed')}
                        className={`tv-focusable p-3.5 rounded-2xl border text-right transition-all flex flex-col gap-1.5 cursor-pointer ${
                          selectedMovieVersion === 'dubbed' || (selectedMovieVersion === 'auto' && baseMovie.isDubbed)
                            ? 'bg-amber-500/20 border-amber-500/70 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.2)] ring-1 ring-amber-500/40'
                            : 'bg-zinc-900/50 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                        }`}
                      >
                        <span className="text-xs font-black text-white flex items-center gap-1.5">
                          <Mic className="w-3.5 h-3.5 text-amber-400" />
                          <span>دوبله فارسی</span>
                        </span>
                        <span className="text-[11px] text-zinc-400">
                          بالاترین کیفیت: {baseMovie.dubbedVersion.bestQuality || 'HD'}
                        </span>
                      </button>
                    )}

                    {baseMovie.subbedVersion && (
                      <button
                        type="button"
                        onClick={() => setSelectedMovieVersion('subbed')}
                        className={`tv-focusable p-3.5 rounded-2xl border text-right transition-all flex flex-col gap-1.5 cursor-pointer ${
                          selectedMovieVersion === 'subbed' || (selectedMovieVersion === 'auto' && !baseMovie.isDubbed && baseMovie.isSubbed)
                            ? 'bg-amber-500/20 border-amber-500/70 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.2)] ring-1 ring-amber-500/40'
                            : 'bg-zinc-900/50 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                        }`}
                      >
                        <span className="text-xs font-black text-white flex items-center gap-1.5">
                          <FileText className="w-3.5 h-3.5 text-zinc-400" />
                          <span>زیرنویس فارسی</span>
                        </span>
                        <span className="text-[11px] text-zinc-400">
                          بالاترین کیفیت: {baseMovie.subbedVersion.bestQuality || 'HD'}
                        </span>
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Qualities List */}
              <div className="space-y-2.5">
                <span className="text-xs font-bold text-zinc-300 block">
                  کیفیت‌های آماده پخش و دانلود ({fullMovie.providerNameFa || (fullMovie.provider === 'Namasha' ? 'نماشا' : 'آپارات')}):
                </span>

                {fullMovie.qualities && fullMovie.qualities.length > 0 ? (
                  <div className="space-y-2.5">
                    {fullMovie.qualities.map((q: AparatQuality, qIdx: number) => {
                      const isCurrentSelected = selectedQualityUrl === q.url || (!selectedQualityUrl && qIdx === 0);
                      const cleanQualityText = q.text.startsWith('با ') ? q.text : `با ${q.text}`;
                      return (
                        <div
                          key={qIdx}
                          className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                            isCurrentSelected
                              ? 'bg-zinc-900/80 border-amber-500/60 shadow-[0_0_15px_rgba(245,158,11,0.15)]'
                              : 'bg-zinc-900/40 border-zinc-800/80 hover:border-zinc-700'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`p-2.5 rounded-xl ${isCurrentSelected ? 'bg-amber-500 text-black shadow-md' : 'bg-zinc-800 text-zinc-300'}`}>
                              <Tv className="w-4 h-4" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-black text-white">{cleanQualityText}</span>
                                {qIdx === 0 && (
                                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold">
                                    بالاترین کیفیت
                                  </span>
                                )}
                              </div>
                              {q.size && (
                                <span className="text-xs text-zinc-400 font-mono mt-0.5 block">
                                  حجم فایل: {q.size}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedQualityUrl(q.url);
                                setSelectedQualityProfile(q.profile || q.text);
                                setVideoPlayMode('full_movie');
                                setIsPlayingVideo(true);
                                setIsQualityModalOpen(false);
                                if (modalRef.current) {
                                  modalRef.current.scrollTo({ top: 0, behavior: 'smooth' });
                                }
                              }}
                              className="tv-focusable px-4 py-2 rounded-full bg-amber-500 hover:bg-amber-400 text-black font-black text-xs flex items-center gap-1.5 shadow-md transition-all hover:scale-105 cursor-pointer"
                            >
                              <Play className="w-3.5 h-3.5 fill-black" />
                              <span>پخش آنلاین</span>
                            </button>

                            <a
                              href={q.url}
                              target="_blank"
                              rel="noreferrer"
                              download
                              className="tv-focusable p-2.5 rounded-full bg-zinc-800 hover:bg-emerald-600 text-zinc-300 hover:text-white border border-zinc-700 transition-colors flex items-center justify-center cursor-pointer"
                              title="دانلود مستقیم"
                            >
                              <Download className="w-4 h-4" />
                            </a>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-5 rounded-2xl bg-zinc-900/50 border border-zinc-800 text-center">
                    <p className="text-xs text-zinc-400">کیفیت مستقیمی برای این ویدیو یافت نشد.</p>
                    {fullMovie.pageUrl && (
                      <a
                        href={fullMovie.pageUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 mt-2 text-xs text-amber-400 hover:underline"
                      >
                        <span>مشاهده در وب‌سایت {fullMovie.providerNameFa || 'آپارات'}</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-zinc-950/90 border-t border-zinc-800/80 flex items-center justify-between text-xs text-zinc-400">
              <div className="flex items-center gap-3">
                <span>مدت زمان: <strong className="text-zinc-200">{fullMovie.durationFormatted}</strong></span>
                <span>سرور: <strong className="text-emerald-400">ایران (ترافیک نیم‌بها)</strong></span>
              </div>
              <button
                type="button"
                onClick={() => setIsQualityModalOpen(false)}
                className="tv-focusable px-4 py-1.5 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-colors cursor-pointer"
              >
                انصراف
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
