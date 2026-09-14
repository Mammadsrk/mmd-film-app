/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface SourceDefinition {
  id: string;
  name: string;
  nameFa: string;
  domain: string;
  searchEndpoint: string;
  accentColor: string;
  tagline: string;
  iconName: string;
  isDirectExtractorDisabled?: boolean;
  siteBadge?: string;
  directUrl?: string;
}

export interface CleanedTitle {
  titleCleaned: string;
  titleFa: string;
  titleEn?: string;
  year?: string;
  hasDubbed: boolean;
  hasSubbed: boolean;
}

export interface ExtractedStream {
  quality: string;
  url: string;
  format: 'mp4' | 'm3u8' | 'mkv';
  size?: string;
  audio: 'dubbed' | 'subbed' | 'original';
  isDemoPlayable?: boolean;
  isIranOnly?: boolean;
  isUniversal?: boolean;
  sourceServer?: string;
}

/**
 * 6 Target Iranian Streaming/Download Sources + NextMovie Quick-Link Hub
 */
export const TARGET_SOURCES: SourceDefinition[] = [
  {
    id: 'doostihaa',
    name: 'Doostihaa',
    nameFa: 'دوستی‌ها',
    domain: 'doostihaa.com',
    searchEndpoint: 'https://www.doostihaa.com/wp-json/wp/v2/posts?search={query}&per_page=6',
    accentColor: '#3b82f6',
    tagline: 'دوبله فارسی اختصاصی و بدون سانسور',
    iconName: 'Film',
  },
  {
    id: 'zardfilm',
    name: 'Zardfilm',
    nameFa: 'زردفیلم',
    domain: 'zardfilm.in',
    searchEndpoint: 'https://zardfilm.in/wp-json/wp/v2/posts?search={query}&per_page=6',
    accentColor: '#eab308',
    tagline: 'مرجع دانلود فیلم‌های روز با کیفیت 4K',
    iconName: 'PlayCircle',
  },
  {
    id: 'film2movie',
    name: 'Film2Movie',
    nameFa: 'فیلم‌تومووی',
    domain: 'myf2m.net',
    searchEndpoint: 'https://www.myf2m.net/wp-json/wp/v2/posts?search={query}&per_page=6',
    accentColor: '#10b981',
    tagline: 'آرشیو سینمایی و لینک مستقیم پرسرعت',
    iconName: 'Clapperboard',
  },
  {
    id: 'hexdownload',
    name: 'HexDownload',
    nameFa: 'هکس‌دانلود',
    domain: 'hexdownload.co',
    searchEndpoint: 'https://hexdownload.co/wp-json/wp/v2/posts?search={query}&per_page=6',
    accentColor: '#a855f7',
    tagline: 'پخش آنلاین و سرور دانلود اختصاصی',
    iconName: 'Tv',
  },
  {
    id: 'zarinpakhsh',
    name: 'ZarinPakhsh',
    nameFa: 'زرین‌پخش',
    domain: 'zarinpakhsh.ir',
    searchEndpoint: 'https://zarinpakhsh.ir/wp-json/wp/v2/posts?search={query}&per_page=6',
    accentColor: '#ec4899',
    tagline: 'ترافیک نیم‌بها و پخش سریع',
    iconName: 'Video',
  },
  {
    id: 'filmchi',
    name: 'Filmchi',
    nameFa: 'فیلمچی',
    domain: 'filmchi.net',
    searchEndpoint: 'https://filmchi.net/wp-json/wp/v2/posts?search={query}&per_page=6',
    accentColor: '#f97316',
    tagline: 'عناوین پرطرفدار با نسخه‌های کم‌حجم x265',
    iconName: 'Sparkles',
  },
  {
    id: 'nextmovie',
    name: 'NextMovie',
    nameFa: 'نکست‌مووی',
    domain: 'nxmweb.com',
    searchEndpoint: 'https://nxmweb.com/?s={query}',
    accentColor: '#ef4444',
    tagline: 'پایگاه فیلم و سریال NXM',
    iconName: 'Film',
    isDirectExtractorDisabled: true,
    siteBadge: 'مشاهده در سایت مرجع',
    directUrl: 'https://nxmweb.com',
  },
];

/**
 * Standard spoofed headers with Iranian national IP addresses
 * to bypass Geo-blocking and anti-scraping WAFs.
 */
export const IRANIAN_SPOOFED_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  'X-Forwarded-For': '5.200.14.15',
  'X-Real-IP': '5.200.14.15',
  'Client-IP': '5.200.14.15',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/json',
  'Accept-Language': 'fa-IR,fa;q=0.9,en-US;q=0.8,en;q=0.7',
};

/**
 * Force HTTP links to HTTPS to strictly satisfy browser Mixed Content restrictions,
 * preventing blocked video streaming in modern Web browsers and TV engines.
 */
export function forceHttps(urlStr: string): string {
  if (!urlStr) return '';
  return urlStr.replace(/^http:\/\//i, 'https://');
}

/**
 * Clean Persian prefixes and suffixes in movie and series titles.
 * Strips "دانلود فیلم", "سریال", "با زیرنویس چسبیده", "دوبله فارسی", quality tags, etc.
 */
export function cleanPersianTitle(rawTitle: string): CleanedTitle {
  if (!rawTitle) {
    return {
      titleCleaned: '',
      titleFa: '',
      hasDubbed: false,
      hasSubbed: false,
    };
  }

  // Detect Dubbed / Subbed flags
  const hasDubbed = /دوبله|دوبله\s*فارسی|صوت\s*دوبله|dubbed/i.test(rawTitle);
  const hasSubbed = /زیرنویس|زیرنویس\s*چسبیده|softsub|subbed/i.test(rawTitle);

  // Extract year if available (e.g., 2024, 2023, 1402)
  const yearMatch = rawTitle.match(/\b(19\d\d|20\d\d)\b/);
  const year = yearMatch ? yearMatch[1] : undefined;

  // Extract potential English title inside parentheses or after a dash
  let titleEn: string | undefined;
  const enMatch = rawTitle.match(/\(([A-Za-z0-9\s:.-]+)\)/) || rawTitle.match(/([A-Za-z0-9\s:.-]{3,})/);
  if (enMatch && enMatch[1] && !/^(mp4|mkv|1080p|720p|480p|web-dl|bluray)$/i.test(enMatch[1].trim())) {
    titleEn = enMatch[1].trim();
  }

  // Strip standard Persian prefixes
  let cleaned = rawTitle
    .replace(/^دانلود\s*(فیلم|سریال|انیمیشن|مستند|رایگان|سینمایی)?\s*/gi, '')
    .replace(/^(فیلم|سریال|انیمیشن|مستند|سینمایی)\s*/gi, '');

  // Strip standard Persian suffixes and tags
  const tagsToStrip = [
    /با\s*(کیفیت\s*عالی|لینک\s*مستقیم)/gi,
    /با\s*(دوبله\s*فارسی|زیرنویس\s*(فارسی|چسبیده)?)/gi,
    /دوبله\s*(فارسی|پارسی|اختصاصی)?/gi,
    /زیرنویس\s*(فارسی|چسبیده|هماهنگ)?/gi,
    /بدون\s*سانسور/gi,
    /سانسور\s*شده/gi,
    /فصل\s*\d+(\s*قسمت\s*\d+)?/gi,
    /قسمت\s*\d+/gi,
    /کیفیت\s*(1080p|720p|480p|4k|bluray|web-dl)/gi,
    /\b(1080p|720p|480p|4k|x265|x264|hevc|web-dl|bluray|hdtv|remux)\b/gi,
    /\[[^\]]*\]/g,
    /\([^)]*\)/g, // parentheses content
  ];

  for (const tag of tagsToStrip) {
    cleaned = cleaned.replace(tag, ' ');
  }

  // Clean trailing punctuation and whitespaces
  cleaned = cleaned.replace(/[-–—_:|]+/g, ' ').replace(/\s+/g, ' ').trim();

  // If cleaning resulted in an empty string, fallback to rawTitle
  if (!cleaned) {
    cleaned = rawTitle.trim();
  }

  return {
    titleCleaned: cleaned,
    titleFa: cleaned,
    titleEn: titleEn || undefined,
    year,
    hasDubbed,
    hasSubbed,
  };
}

/**
 * Robust WordPress Post Image Fallbacks:
 * 1. Check `post.jetpack_featured_media_url`
 * 2. Check `post.yoast_head_json.og_image[0].url`
 * 3. Regex parse `<img src="...">` inside `content.rendered`
 * 4. Check `post._embedded['wp:featuredmedia'][0].source_url`
 */
export function extractPostImage(post: any): string {
  if (!post) return '';

  // 1. Jetpack featured media url
  if (post.jetpack_featured_media_url && typeof post.jetpack_featured_media_url === 'string') {
    return forceHttps(post.jetpack_featured_media_url);
  }

  // 2. Yoast SEO og_image
  if (post.yoast_head_json?.og_image && Array.isArray(post.yoast_head_json.og_image)) {
    const ogImg = post.yoast_head_json.og_image[0]?.url;
    if (ogImg && typeof ogImg === 'string') {
      return forceHttps(ogImg);
    }
  }

  // 3. Regex parse <img src="..."> in content.rendered
  if (post.content?.rendered && typeof post.content.rendered === 'string') {
    const imgRegex = /<img[^>]+src=["']([^"']+)["']/i;
    const match = post.content.rendered.match(imgRegex);
    if (match && match[1] && !match[1].includes('emoji') && !match[1].includes('avatar')) {
      return forceHttps(match[1]);
    }
  }

  // 4. Embedded WP featured media
  if (post._embedded?.['wp:featuredmedia']?.[0]?.source_url) {
    return forceHttps(post._embedded['wp:featuredmedia'][0].source_url);
  }

  // 5. Better featured image
  if (post.better_featured_image?.source_url) {
    return forceHttps(post.better_featured_image.source_url);
  }

  return '';
}

/**
 * Valid media stream extensions and CDN domains.
 * Excludes social links (Telegram, Instagram) and web page assets.
 */
const VALID_MEDIA_EXTENSIONS = /\.(mp4|mkv|m3u8|webm|avi|m4v|ts)(\?.*)?$/i;
const KNOWN_MEDIA_CDNS = /(upera\.tv|hub\.hxdl\.ir|hxdl\.ir|upera\.org|cdn\d*\.irdanlod\.ir|dl\d*\.doostihaa\.com|dl\d*\.zardfilm\.in|uploadb\.me|subscene|boxera\.tech|boxera\.ir)/i;
const IGNORED_LINK_PATTERNS = /(t\.me|telegram\.me|instagram\.com|twitter\.com|whatsapp\.com|aparat\.com|youtube\.com|wp-content\/themes|wp-content\/plugins|wp-includes|replytocom|#comment|\/category\/|\/tag\/|\/embed\/|\/player\/)/i;

/**
 * Filter out invalid links, keeping only direct streamable media
 */
export function isValidMediaLink(url: string): boolean {
  if (!url || typeof url !== 'string') return false;
  const cleanUrl = url.trim().replace(/&amp;/g, '&');

  // Exclude social and CMS navigation links, as well as HTML embed frames
  if (IGNORED_LINK_PATTERNS.test(cleanUrl)) {
    return false;
  }

  // Check valid extension or known streaming CDN domain
  if (VALID_MEDIA_EXTENSIONS.test(cleanUrl) || KNOWN_MEDIA_CDNS.test(cleanUrl)) {
    return true;
  }

  return false;
}

/**
 * Extract stream metadata (quality, format, audio) from URL and surrounding text
 */
export function categorizeStreamLink(url: string, contextText = ''): ExtractedStream {
  const decodedUrl = url.replace(/&amp;/g, '&');
  const secureUrl = forceHttps(decodedUrl);
  const combined = (decodedUrl + ' ' + contextText).toLowerCase();

  let format: 'mp4' | 'm3u8' | 'mkv' = 'mp4';
  if (combined.includes('.m3u8')) format = 'm3u8';
  else if (combined.includes('.mkv')) format = 'mkv';

  let quality = '1080p FHD';
  if (combined.includes('2160p') || combined.includes('4k') || combined.includes('uhd')) {
    quality = '4K Ultra HD';
  } else if (combined.includes('1080') || combined.includes('fhd')) {
    quality = '1080p FHD';
  } else if (combined.includes('720') || combined.includes('hd')) {
    quality = '720p HD';
  } else if (combined.includes('480') || combined.includes('sd')) {
    quality = '480p SD';
  }

  let audio: 'dubbed' | 'subbed' | 'original' = 'subbed';
  if (/دوبله|dub|farsi\.dub/i.test(combined)) {
    audio = 'dubbed';
  } else if (/زیرنویس|sub|softsub/i.test(combined)) {
    audio = 'subbed';
  }

  let size = format === 'm3u8' ? 'HLS Stream' : '1.5 GB';
  const sizeMatch = combined.match(/(\d+(?:\.\d+)?\s*(?:gb|mb|گیگابایت|مگابایت))/i);
  if (sizeMatch) {
    size = sizeMatch[1].toUpperCase().replace('گیگابایت', 'GB').replace('مگابایت', 'MB');
  }

  // Detect whether link is strictly geo-blocked to Iranian IPs
  const isUpera = secureUrl.toLowerCase().includes('upera.tv');
  const isIranOnly = isUpera;
  const isUniversal = !isUpera;

  let sourceServer = 'سرور مستقیم';
  if (secureUrl.includes('irdanlod.ir')) sourceServer = 'IRDanlod';
  else if (secureUrl.includes('boxera')) sourceServer = 'Boxera CDN';
  else if (secureUrl.includes('hxdl.ir')) sourceServer = 'HexDownload';
  else if (secureUrl.includes('upera.tv')) sourceServer = 'Upera (فقط ایران)';
  else if (secureUrl.includes('doostihaa')) sourceServer = 'Doostihaa';
  else if (secureUrl.includes('zardfilm')) sourceServer = 'Zardfilm';

  const tag = isIranOnly ? ' (مخصوص آی‌پی ایران)' : ' (بین‌الملل و فیلترشکن)';

  return {
    quality: `${quality} ${audio === 'dubbed' ? '(دوبله)' : '(زیرنویس)'}${tag}`,
    url: secureUrl,
    format,
    audio,
    size,
    isDemoPlayable: true,
    isIranOnly,
    isUniversal,
    sourceServer,
  };
}

/**
 * HexDownload Multi-Step Bypass:
 * 1. Extract post_id from post object or HTML
 * 2. POST to: https://hexdownload.co/wp-json/hexpro/v1/cinema-access/v2/{post_id}?hex_access_request={timestamp}-{random11chars}
 * 3. Body: {"check_id": 1, "checked_at": timestamp}
 * 4. Headers with Iranian IP spoofing: X-Forwarded-For: 5.200.14.15, X-Real-IP: 5.200.14.15
 * 5. Parse returned JSON (download_html and hero_html) for media links (upera.tv, hxdl.ir, .mkv, .mp4)
 */
export async function bypassHexDownload(postId: string | number): Promise<ExtractedStream[]> {
  const streams: ExtractedStream[] = [];
  const timestamp = Date.now();
  const randomChars = Math.random().toString(36).substring(2, 13);
  const bypassUrl = `https://hexdownload.co/wp-json/hexpro/v1/cinema-access/v2/${postId}?hex_access_request=${timestamp}-${randomChars}`;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);

    const res = await fetch(bypassUrl, {
      method: 'POST',
      headers: {
        ...IRANIAN_SPOOFED_HEADERS,
        'Content-Type': 'application/json',
        'Referer': `https://hexdownload.co/?p=${postId}`,
        'Origin': 'https://hexdownload.co',
      },
      body: JSON.stringify({
        check_id: 1,
        checked_at: timestamp,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (res.ok) {
      const data = await res.json();
      const combinedHtml = `${data.download_html || ''} ${data.hero_html || ''}`;

      // Extract hrefs from returned HTML
      const hrefRegex = /href=["']([^"']+)["']/gi;
      let match;
      while ((match = hrefRegex.exec(combinedHtml)) !== null) {
        const link = match[1];
        if (isValidMediaLink(link)) {
          streams.push(categorizeStreamLink(link, combinedHtml));
        }
      }
    }
  } catch (err) {
    console.warn(`[HexDownload Bypass] Call failed for post ${postId}:`, err);
  }

  return streams;
}

/**
 * Execute search on a single WordPress target source
 */
export async function searchWordPressSource(
  source: SourceDefinition,
  query: string,
  timeoutMs = 4500
): Promise<any[]> {
  // If source is NextMovie, return direct portal entry point
  if (source.id === 'nextmovie') {
    return [
      {
        id: `nextmovie-${encodeURIComponent(query)}`,
        site: source.name,
        siteId: source.id,
        title: `${query} در ${source.nameFa}`,
        titleFa: query,
        link: `https://${source.domain}/?s=${encodeURIComponent(query)}`,
        posterUrl: 'https://images.unsplash.com/photo-1578849278619-e73505e9610f?auto=format&fit=crop&w=600&q=80',
        quality: 'مرجع فیلم و سریال',
        year: '2024',
        hasDubbed: true,
        hasSubbed: true,
        isDirectExtractorDisabled: true,
        siteBadge: source.siteBadge || 'مشاهده در سایت مرجع',
      },
    ];
  }

  const endpoint = source.searchEndpoint.replace('{query}', encodeURIComponent(query));
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(endpoint, {
      headers: {
        ...IRANIAN_SPOOFED_HEADERS,
        'Referer': `https://${source.domain}/`,
      },
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      return [];
    }

    const posts = await response.json();
    if (!Array.isArray(posts)) return [];

    return posts.slice(0, 6).map((post: any) => {
      const rawTitle = post.title?.rendered || post.title || query;
      const cleaned = cleanPersianTitle(rawTitle);
      const posterUrl = extractPostImage(post);

      return {
        id: `${source.id}-${post.id || post.slug}`,
        wpPostId: post.id,
        site: source.name,
        siteId: source.id,
        title: cleaned.titleEn ? `${cleaned.titleFa} (${cleaned.titleEn})` : cleaned.titleFa,
        titleFa: cleaned.titleFa,
        link: post.link || `https://${source.domain}/?p=${post.id}`,
        posterUrl: posterUrl || 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=600&q=80',
        quality: '1080p Web-DL',
        year: cleaned.year || '2024',
        hasDubbed: cleaned.hasDubbed,
        hasSubbed: cleaned.hasSubbed,
      };
    });
  } catch (err) {
    // Network or timeout failure on upstream source
    return [];
  }
}

/**
 * Universal Media Stream Extractor for all 6 Iranian Target Sources + NextMovie
 */
export async function extractMediaStreams(
  targetUrl: string,
  postId?: string | number
): Promise<{
  success: boolean;
  targetUrl: string;
  title: string;
  streams: ExtractedStream[];
  isDirectExtractorDisabled?: boolean;
  siteBadge?: string;
  directUrl?: string;
}> {
  if (!targetUrl) {
    return {
      success: false,
      targetUrl: '',
      title: '',
      streams: [],
    };
  }

  // 1. NextMovie Check - Disable direct extractor and display badge
  if (targetUrl.includes('nxmweb.com') || targetUrl.includes('nextmovie')) {
    return {
      success: true,
      targetUrl,
      title: 'نکست‌مووی (NextMovie)',
      streams: [],
      isDirectExtractorDisabled: true,
      siteBadge: 'مشاهده در سایت مرجع',
      directUrl: targetUrl.startsWith('http') ? targetUrl : 'https://nxmweb.com',
    };
  }

  const streams: ExtractedStream[] = [];
  const seenUrls = new Set<string>();

  const addStream = (stream: ExtractedStream) => {
    const cleanUrl = forceHttps(stream.url);
    if (!cleanUrl || seenUrls.has(cleanUrl)) return;
    seenUrls.add(cleanUrl);
    streams.push({
      ...stream,
      url: cleanUrl,
    });
  };

  let pageHtml = '';
  let detectedPostId = postId ? String(postId) : '';

  // 2. Fetch page HTML with Iranian IP spoofing and 4s timeout
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);

    const parsedUrl = new URL(targetUrl.startsWith('http') ? targetUrl : `https://${targetUrl}`);
    const res = await fetch(parsedUrl.toString(), {
      headers: {
        ...IRANIAN_SPOOFED_HEADERS,
        Referer: parsedUrl.origin,
      },
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (res.ok) {
      pageHtml = await res.text();
    }
  } catch (err) {
    // Page fetch may fail due to geo-fencing or timeout; continue with postId or fallbacks
  }

  // 3. HexDownload Bypass Execution
  if (targetUrl.includes('hexdownload.co')) {
    // If postId is not provided, try to extract it from URL or HTML
    if (!detectedPostId) {
      const urlPostMatch = targetUrl.match(/[?&]p=(\d+)/);
      if (urlPostMatch) {
        detectedPostId = urlPostMatch[1];
      } else if (pageHtml) {
        const postClassMatch = pageHtml.match(/postid-(\d+)/i) ||
          pageHtml.match(/id=["']post-(\d+)["']/i) ||
          pageHtml.match(/post-(\d+)/i);
        if (postClassMatch) {
          detectedPostId = postClassMatch[1];
        }
      }
    }

    if (detectedPostId) {
      const bypassed = await bypassHexDownload(detectedPostId);
      for (const s of bypassed) {
        addStream(s);
      }
    }
  }

  // 4. Parse direct anchor tags and download tables from HTML
  if (pageHtml) {
    // Match <a href="..." ...>text</a>
    const anchorRegex = /<a\s+[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
    let aMatch;
    while ((aMatch = anchorRegex.exec(pageHtml)) !== null) {
      const href = aMatch[1];
      const text = aMatch[2].replace(/<[^>]+>/g, ' ').trim();

      if (isValidMediaLink(href)) {
        addStream(categorizeStreamLink(href, text));
      }
    }

    // Match raw media URLs in the page text / scripts
    const rawUrlRegex = /https?:\/\/[^\s"'<>]+\.(mp4|mkv|m3u8)(?:\?[^\s"'<>]*)?/gi;
    let rawMatch;
    while ((rawMatch = rawUrlRegex.exec(pageHtml)) !== null) {
      const href = rawMatch[0];
      if (isValidMediaLink(href)) {
        addStream(categorizeStreamLink(href, ''));
      }
    }

    // Match known video CDNs (like upera.tv or hxdl.ir) even without file extensions
    const cdnRegex = /https?:\/\/(?:[a-z0-9-]+\.)?(?:upera\.tv|hxdl\.ir|irdanlod\.ir)\/[^\s"'<>]+/gi;
    let cdnMatch;
    while ((cdnMatch = cdnRegex.exec(pageHtml)) !== null) {
      const href = cdnMatch[0];
      if (isValidMediaLink(href)) {
        addStream(categorizeStreamLink(href, ''));
      }
    }
  }

  // Extract page title from HTML <title> or <h1>
  let pageTitle = '';
  if (pageHtml) {
    const titleMatch = pageHtml.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    if (titleMatch && titleMatch[1]) {
      const cleaned = cleanPersianTitle(titleMatch[1].replace(/<[^>]+>/g, '').trim());
      pageTitle = cleaned.titleFa;
    }
  }

  // Sort streams: Universal CDNs and direct video files come first, followed by geo-locked hosts (Upera)
  streams.sort((a, b) => {
    const aGeo = a.url.toLowerCase().includes('upera.tv');
    const bGeo = b.url.toLowerCase().includes('upera.tv');
    if (aGeo && !bGeo) return 1;
    if (!aGeo && bGeo) return -1;
    return 0;
  });

  return {
    success: true,
    targetUrl,
    title: pageTitle || 'استخراج پیوندهای پخش و دانلود',
    streams,
    isDirectExtractorDisabled: false,
  };
}
