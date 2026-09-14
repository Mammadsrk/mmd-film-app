export type MediaType = 'movie' | 'tv';

export interface MediaItem {
  id: string;
  tmdbId?: number;
  title: string;
  titleFa: string;
  type: MediaType;
  overview: string;
  overviewFa: string;
  posterUrl: string;
  backdropUrl: string;
  rating: number;
  releaseYear: number | string;
  genres: string[];
  quality: string;
  hasDubbed: boolean;
  hasSubbed: boolean;
  runtime?: string;
  episodesCount?: number;
  seasonsCount?: number;
  sourceUrl?: string;
  sourceSite?: string;
  wpPostId?: string | number;
  isDirectExtractorDisabled?: boolean;
  siteBadge?: string;
  directUrl?: string;
}

export interface SearchResult {
  id: string;
  site: string;
  siteId?: string;
  title: string;
  titleFa?: string;
  link: string;
  posterUrl: string;
  quality: string;
  year?: string | number;
  hasDubbed?: boolean;
  hasSubbed?: boolean;
  wpPostId?: string | number;
  isDirectExtractorDisabled?: boolean;
  siteBadge?: string;
  directUrl?: string;
}

export interface StreamAsset {
  quality: string; // e.g. "1080p FHD", "720p HD", "480p SD"
  url: string; // Forced to https://
  format: 'mp4' | 'm3u8' | 'mkv';
  size?: string;
  audio: 'dubbed' | 'subbed' | 'original';
  encoder?: string;
  isDemoPlayable?: boolean;
  isIranOnly?: boolean;
  isUniversal?: boolean;
  sourceServer?: string;
}

export interface ExtractedMediaData {
  title: string;
  sourceUrl: string;
  site: string;
  streams: StreamAsset[];
  synopsis?: string;
  isDirectExtractorDisabled?: boolean;
  siteBadge?: string;
  directUrl?: string;
}

export interface MovieSourceHub {
  id: string;
  name: string;
  nameFa: string;
  domain: string;
  url: string;
  badge: string;
  description: string;
  hasDubbed: boolean;
  hasSubbed: boolean;
  available?: boolean;
  isExactMatch?: boolean;
  highlighted?: boolean;
  color: string;
}

export interface MovieTrailer {
  name: string;
  key?: string;
  url?: string;
  site?: 'Aparat' | 'YouTube' | string;
  type?: string;
  isIranAccessible?: boolean;
  embedUrl?: string;
}

export interface AparatQuality {
  text: string;
  size: string;
  profile: string;
  url: string;
}

export interface AparatEpisode {
  episodeNumber: number;
  seasonNumber: number;
  title: string;
  uid: string;
  durationFormatted: string;
  durationSec: number;
  pageUrl: string;
  embedUrl: string;
  provider?: 'Aparat' | 'Namasha' | string;
  providerNameFa?: string;
  qualities?: AparatQuality[];
  hlsStreamUrl?: string;
  vlcUrl?: string;
  potPlayerUrl?: string;
  mxPlayerUrl?: string;
}

export interface AparatSeason {
  seasonNumber: number;
  title: string;
  episodes: AparatEpisode[];
}

export interface AparatSeriesData {
  isSeries: boolean;
  totalSeasons: number;
  totalEpisodes: number;
  seasons: AparatSeason[];
  providersSummary?: string;
}

export interface AparatFullMovie {
  available: boolean;
  title: string;
  uid: string;
  pageUrl: string;
  durationFormatted: string;
  durationSec: number;
  poster?: string;
  provider?: 'Aparat' | 'Namasha' | string;
  providerNameFa?: string;
  embedUrl?: string;
  qualities: AparatQuality[];
  hlsStreamUrl?: string;
  senderName?: string;
  vlcUrl?: string;
  potPlayerUrl?: string;
  mxPlayerUrl?: string;
  isDubbed?: boolean;
  isSubbed?: boolean;
  versionType?: 'dubbed' | 'subbed' | 'original';
  maxQualityScore?: number;
  dubbedVersion?: AparatFullMovie;
  subbedVersion?: AparatFullMovie;
  alternateMovie?: AparatFullMovie;
}

export interface MovieDetailsData {
  id: string;
  tmdbId?: number;
  imdbId?: string;
  title: string;
  titleFa: string;
  type: 'movie' | 'tv';
  overview: string;
  overviewFa: string;
  posterUrl: string;
  backdropUrl: string;
  rating: number;
  voteCount?: number;
  releaseYear: string | number;
  runtime?: string;
  genres: string[];
  director?: string;
  cast: string[];
  certification?: string;
  trailers: MovieTrailer[];
  sources: MovieSourceHub[];
  imdbUrl?: string;
  tmdbUrl?: string;
  aparatUrl?: string;
  aparatEmbedUrl?: string;
  aparatFullMovie?: AparatFullMovie;
  aparatSeries?: AparatSeriesData;
}

export interface SourceAvailability {
  site: string;
  siteId?: string;
  nameFa: string;
  available: boolean;
  quality?: string;
  dubbed?: boolean;
  subbed?: boolean;
  link?: string;
  siteBadge?: string;
  isDirectExtractorDisabled?: boolean;
}

export interface HubSiteInfo {
  id: string;
  name: string;
  nameFa: string;
  domain: string;
  tagline: string;
  accentColor: string;
  iconName: string;
  isDirectExtractorDisabled?: boolean;
  siteBadge?: string;
  directUrl?: string;
}

export interface GlobalDirectStream {
  quality: string;
  url: string;
  proxiedUrl: string;
  format: 'mp4' | 'hls';
  bitrate?: string;
  audioLanguage: string;
  latencyMs?: number;
}

export interface GlobalEmbedMirror {
  id: string;
  name: string;
  url: string;
  provider: string;
  badge?: string;
  status?: string;
  isDefault?: boolean;
}

export interface GlobalTorrentItem {
  name?: string;
  title?: string;
  quality: string;
  type: string;
  size: string;
  seeds: number;
  peers: number;
  magnetUrl: string;
  torrentFileUrl?: string;
  webStreamUrl?: string;
  hash: string;
  dateUploaded?: string;
}

export interface GlobalSubtitleTrack {
  id: string;
  lang: string;
  label: string;
  url: string;
  isDefault?: boolean;
}

export interface GlobalStreamingData {
  tmdbId?: number;
  imdbId?: string;
  title: string;
  directStreams: GlobalDirectStream[];
  embedMirrors: GlobalEmbedMirror[];
  torrents: GlobalTorrentItem[];
  subtitles: GlobalSubtitleTrack[];
  activeResolution: string;
  audioInfo: string;
  serverPingMs: number;
}
