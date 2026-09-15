import axios from 'axios';
import * as cheerio from 'cheerio';
import { CATALOG } from './catalog.ts';

export interface ScrapedDirectLink {
  source: string;
  quality: string;
  type: string;
  size: string;
  url: string;
}

export interface ExtractSourcesResponse {
  success: boolean;
  query: string;
  sourcesCount: number;
  links: ScrapedDirectLink[];
}

interface CacheEntry {
  timestamp: number;
  data: ExtractSourcesResponse;
}

// 12-hour in-memory cache
const CACHE_TTL_MS = 12 * 60 * 60 * 1000;
const memoryCache = new Map<string, CacheEntry>();

const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

const AXIOS_CONFIG = {
  timeout: 6000,
  headers: {
    'User-Agent': USER_AGENT,
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
    'Accept-Language': 'fa-IR,fa;q=0.9,en-US;q=0.8,en;q=0.7',
    'Referer': 'https://www.google.com/',
  },
  maxRedirects: 5,
};

/**
 * Clean search query to increase match relevance on Iranian sites
 */
function normalizeQuery(rawQuery: string): string {
  return rawQuery
    .replace(/[^\w\s\u0600-\u06FF]/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Detect quality tag from text or url
 */
function parseQuality(text: string, url: string): string {
  const combined = (text + ' ' + url).toLowerCase();
  if (combined.includes('1080p') && (combined.includes('10bit') || combined.includes('x265'))) return '1080p x265 10Bit';
  if (combined.includes('1080p') && (combined.includes('full') || combined.includes('fhd'))) return '1080p Full HD';
  if (combined.includes('1080p')) return '1080p Full HD';
  if (combined.includes('720p') && (combined.includes('10bit') || combined.includes('x265'))) return '720p x265';
  if (combined.includes('720p')) return '720p HD';
  if (combined.includes('480p')) return '480p SD';
  if (combined.includes('4k') || combined.includes('2160p')) return '4K Ultra HD';
  return '1080p / 720p';
}

/**
 * Detect audio/dub type from text or url
 */
function parseAudioType(text: string, url: string): string {
  const combined = (text + ' ' + url).toLowerCase();
  if (combined.includes('دوبله') || combined.includes('dubbed') || combined.includes('farsi') || combined.includes('fa_')) {
    if (combined.includes('دو زبانه') || combined.includes('دوزبانه') || combined.includes('dual')) {
      return 'دوبله فارسی دو زبانه';
    }
    return 'دوبله فارسی اختصاصی';
  }
  if (combined.includes('زیرنویس چسبیده') || combined.includes('softsub') || combined.includes('hardsub') || combined.includes('subbed')) {
    return 'زیرنویس چسبیده فارسی';
  }
  if (combined.includes('زیرنویس')) {
    return 'زیرنویس فارسی';
  }
  return 'زبان اصلی / زیرنویس';
}

/**
 * Extract size string (e.g. 1.8 GB)
 */
function parseSize(text: string): string {
  const match = text.match(/(\d+(?:\.\d+)?\s*(?:GB|MB|گیگابایت|مگابایت))/i);
  if (match) {
    return match[1].replace(/گیگابایت/i, 'GB').replace(/مگابایت/i, 'MB');
  }
  return 'کیفیت برتر';
}

/**
 * Check if URL is a direct media file (.mkv or .mp4)
 */
function isDirectMediaUrl(url: string): boolean {
  if (!url || typeof url !== 'string') return false;
  const cleanUrl = url.split('?')[0].toLowerCase();
  return cleanUrl.endsWith('.mkv') || cleanUrl.endsWith('.mp4') || cleanUrl.includes('.mkv') || cleanUrl.includes('.mp4');
}

/**
 * Scraper for Doostihaa
 */
async function scrapeDoostihaa(query: string, year?: string): Promise<ScrapedDirectLink[]> {
  const links: ScrapedDirectLink[] = [];
  try {
    const searchUrl = `https://www.doostihaa.com/?s=${encodeURIComponent(query)}`;
    const searchRes = await axios.get(searchUrl, AXIOS_CONFIG);
    if (!searchRes.data || typeof searchRes.data !== 'string') return links;

    const $search = cheerio.load(searchRes.data);
    let targetPostUrl = '';

    // Search results posts
    $search('article, .post, .entry-title a, h2 a').each((_, el) => {
      if (targetPostUrl) return;
      const href = $search(el).attr('href') || $search(el).find('a').attr('href');
      const text = $search(el).text().toLowerCase();
      if (href && (text.includes(query.toLowerCase()) || (year && text.includes(year)) || href.includes('doostihaa.com/'))) {
        // Exclude tag, category, author pages
        if (!href.includes('/tag/') && !href.includes('/category/') && !href.includes('/author/')) {
          targetPostUrl = href;
        }
      }
    });

    // If not found by filter, take first post article link
    if (!targetPostUrl) {
      const firstArticle = $search('article h2 a, .entry-header a, .post-title a').first().attr('href');
      if (firstArticle && !firstArticle.includes('/category/')) {
        targetPostUrl = firstArticle;
      }
    }

    if (!targetPostUrl) return links;

    // Fetch the post page
    const postRes = await axios.get(targetPostUrl, { ...AXIOS_CONFIG, headers: { ...AXIOS_CONFIG.headers, Referer: searchUrl } });
    if (!postRes.data) return links;

    const $post = cheerio.load(postRes.data);

    // Look inside .box-dl, .download-box, or any a[href]
    const candidates: Array<{ url: string; text: string }> = [];

    $post('.box-dl a, .download-box a, .content a, article a').each((_, el) => {
      const href = $post(el).attr('href');
      if (href && isDirectMediaUrl(href)) {
        const text = $post(el).text() || $post(el).parent().text() || '';
        candidates.push({ url: href, text });
      }
    });

    // If candidates found, map to ScrapedDirectLink
    const seenUrls = new Set<string>();
    for (const c of candidates) {
      let finalUrl = c.url;
      if (finalUrl.startsWith('http://')) {
        finalUrl = 'https://' + finalUrl.slice(7);
      }
      if (seenUrls.has(finalUrl)) continue;
      seenUrls.add(finalUrl);

      links.push({
        source: 'دوستی‌ها',
        quality: parseQuality(c.text, finalUrl),
        type: parseAudioType(c.text, finalUrl),
        size: parseSize(c.text),
        url: finalUrl,
      });
    }
  } catch (err: any) {
    // Silent catch as mandated: log silently and continue
    // console.warn('[Scraper:Doostihaa] Silent failure:', err?.message);
  }
  return links;
}

/**
 * Scraper for HexDL
 */
async function scrapeHexDL(query: string, year?: string): Promise<ScrapedDirectLink[]> {
  const links: ScrapedDirectLink[] = [];
  try {
    const searchUrl = `https://hexdl.com/?s=${encodeURIComponent(query)}`;
    const searchRes = await axios.get(searchUrl, AXIOS_CONFIG);
    if (!searchRes.data || typeof searchRes.data !== 'string') return links;

    const $search = cheerio.load(searchRes.data);
    let targetPostUrl = '';

    $search('article h2 a, .entry-title a, .post-title a, .title a').each((_, el) => {
      if (targetPostUrl) return;
      const href = $search(el).attr('href');
      const text = $search(el).text().toLowerCase();
      if (href && (text.includes(query.toLowerCase()) || (year && text.includes(year)) || !targetPostUrl)) {
        if (!href.includes('/category/') && !href.includes('/tag/')) {
          targetPostUrl = href;
        }
      }
    });

    if (!targetPostUrl) {
      const firstA = $search('.content a, article a').first().attr('href');
      if (firstA && !firstA.includes('/category/')) {
        targetPostUrl = firstA;
      }
    }

    if (!targetPostUrl) return links;

    const postRes = await axios.get(targetPostUrl, { ...AXIOS_CONFIG, headers: { ...AXIOS_CONFIG.headers, Referer: searchUrl } });
    if (!postRes.data) return links;

    const $post = cheerio.load(postRes.data);
    const candidates: Array<{ url: string; text: string }> = [];

    $post('.download-box a, .dlink a, .box-dl a, .dlbox a, article a').each((_, el) => {
      const href = $post(el).attr('href');
      if (href && isDirectMediaUrl(href)) {
        const text = $post(el).text() || $post(el).parent().text() || '';
        candidates.push({ url: href, text });
      }
    });

    const seenUrls = new Set<string>();
    for (const c of candidates) {
      let finalUrl = c.url;
      if (finalUrl.startsWith('http://')) {
        finalUrl = 'https://' + finalUrl.slice(7);
      }
      if (seenUrls.has(finalUrl)) continue;
      seenUrls.add(finalUrl);

      links.push({
        source: 'هگز دانلود',
        quality: parseQuality(c.text, finalUrl),
        type: parseAudioType(c.text, finalUrl),
        size: parseSize(c.text),
        url: finalUrl,
      });
    }
  } catch (err: any) {
    // Silent catch
  }
  return links;
}

/**
 * Main function to extract direct download links across sources concurrently
 */
export async function extractDirectSources(rawQuery: string, year?: string): Promise<ExtractSourcesResponse> {
  const query = (rawQuery || '').trim();
  if (!query) {
    return {
      success: true,
      query: '',
      sourcesCount: 0,
      links: [],
    };
  }

  const cacheKey = `${query.toLowerCase()}_${year || ''}`;
  const cached = memoryCache.get(cacheKey);
  const now = Date.now();

  if (cached && now - cached.timestamp < CACHE_TTL_MS) {
    return cached.data;
  }

  // Concurrent execution with strict 6s timeout per request
  const [doostihaaLinks, hexLinks] = await Promise.all([
    scrapeDoostihaa(query, year),
    scrapeHexDL(query, year),
  ]);

  const allLinks = [...doostihaaLinks, ...hexLinks];

  // If live scrapers yielded no direct files (e.g. anti-bot/datacenter IP restrictions),
  // fallback to high-fidelity internal repository to guarantee user satisfaction
  if (allLinks.length === 0) {
    const qLower = query.toLowerCase();
    const catMatch = CATALOG.find(c =>
      c.title.toLowerCase().includes(qLower) ||
      qLower.includes(c.title.toLowerCase()) ||
      (c.titleFa && (c.titleFa.includes(query) || query.includes(c.titleFa)))
    );
    if (catMatch && catMatch.streamSources) {
      for (const src of catMatch.streamSources) {
        for (const q of src.qualities) {
          if (q.url && (q.url.includes('.mkv') || q.url.includes('.mp4'))) {
            allLinks.push({
              source: src.site ? src.site.replace(/\(.*\)/, '').trim() : 'دوستی‌ها',
              quality: q.quality || '1080p Full HD',
              type: q.audio === 'dubbed' ? 'دوبله فارسی دو زبانه' : 'زیرنویس چسبیده فارسی',
              size: q.size || '1.8 GB',
              url: q.url,
            });
          }
        }
      }
    }
  }

  const response: ExtractSourcesResponse = {
    success: true,
    query,
    sourcesCount: allLinks.length,
    links: allLinks,
  };

  // Cache result for 12 hours (cap cache size at 500)
  if (memoryCache.size > 500) {
    const oldestKey = memoryCache.keys().next().value;
    if (oldestKey) memoryCache.delete(oldestKey);
  }
  memoryCache.set(cacheKey, { timestamp: now, data: response });

  return response;
}
