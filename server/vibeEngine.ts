import { CATALOG } from './catalog.ts';
import { VIBE_MAPPINGS } from '../src/data/vibeMappings.ts';

export interface VibeYearRangeInput {
  id?: string;
  titleFa?: string;
  minYear?: number;
  maxYear?: number;
}

export interface VibeAnswersInput {
  mentalEnergy?: 'light' | 'medium' | 'heavy';
  pacing?: 'fast' | 'steady' | 'slowburn';
  endingTone?: 'uplifting' | 'bittersweet' | 'shocking';
  setting?: 'futuristic' | 'gritty_urban' | 'nature_historical' | 'cozy_modern';
  yearRange?: VibeYearRangeInput;
}

export interface UserTasteInput {
  likedGenres?: Record<number, number>;
  dislikedGenres?: Record<number, number>;
  likedKeywords?: string[];
  dislikedKeywords?: string[];
  ratedMovies?: Array<{ id: string; tmdbId?: number; title: string; titleFa?: string; rating: number }>;
  discardedIds?: string[];
  savedIds?: string[];
  unseenIds?: string[];
  excludedIds?: string[];
}

export interface FetchRecommendationsOptions {
  vibeAnswers?: VibeAnswersInput;
  userTaste?: UserTasteInput;
  limit?: number;
  apiKey: string;
}

const TMDB_GENRE_NAMES: Record<number, string> = {
  28: 'اکشن',
  12: 'ماجراجویی',
  16: 'انیمیشن',
  35: 'کمدی',
  80: 'جنایی',
  99: 'مستند',
  18: 'درام',
  10751: 'خانوادگی',
  14: 'فانتزی',
  36: 'تاریخی',
  27: 'ترسناک',
  10402: 'موزیکال',
  9648: 'معمایی',
  10749: 'عاشقانه',
  878: 'علمی تخیلی',
  10770: 'فیلم تلویزیونی',
  53: 'هیجان انگیز',
  10752: 'جنگی',
  37: 'وسترن',
};

/**
 * Curated Fallback Pool for offline or resilient local matching
 */
const VIBE_CURATED_SEED: any[] = [
  {
    id: 'movie-interstellar-2014',
    tmdbId: 157336,
    title: 'Interstellar',
    titleFa: 'میان‌ستاره‌ای (Interstellar)',
    type: 'movie',
    overview: 'تیمی از کاوشگران با عبور از کرم‌چاله‌ای در فضا، بقای نسل بشر را جستجو می‌کنند.',
    overviewFa: 'شاهکاری احساسی و فسفرسوز در اعماق کیهان درباره فداکاری، عشق و بعد چهارم زمان.',
    posterUrl: 'https://image.tmdb.org/t/p/w600_and_h900_bestv2/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg',
    backdropUrl: 'https://image.tmdb.org/t/p/original/rAiYTsqhk0ndNTPXYLo52E9GeYd.jpg',
    rating: 8.7,
    releaseYear: '2014',
    genres: ['علمی تخیلی', 'درام', 'ماجراجویی'],
    genreIds: [878, 18, 12],
    quality: '1080p Web-DL',
    hasDubbed: true,
    hasSubbed: true,
    keywords: ['space', 'future', 'mind-bending', 'time-travel', 'emotional'],
  },
  {
    id: 'movie-knives-out-2019',
    tmdbId: 546554,
    title: 'Knives Out',
    titleFa: 'چاقوکشی (Knives Out)',
    type: 'movie',
    overview: 'کارآگاه بنوا بلانک درباره مرگ مشکوک نویسنده ثروتمند در جمع خانواده‌اش تحقیق می‌کند.',
    overviewFa: 'معمایی هوشمندانه، پر از پیچش‌های شوکه‌کننده با ریتمی تند و طنز کنایه‌آمیز.',
    posterUrl: 'https://image.tmdb.org/t/p/w600_and_h900_bestv2/pThyQovXQrw2m0s9x82twj48Jq4.jpg',
    backdropUrl: 'https://image.tmdb.org/t/p/original/4HWAQu28e2yaWrtupFPGFkdNU7V.jpg',
    rating: 7.9,
    releaseYear: '2019',
    genres: ['کمدی', 'معمایی', 'جنایی'],
    genreIds: [35, 9648, 80],
    quality: '1080p Web-DL',
    hasDubbed: true,
    hasSubbed: true,
    keywords: ['investigation', 'whodunnit', 'plot-twist', 'wit', 'detective'],
  },
  {
    id: 'movie-arrival-2016',
    tmdbId: 329865,
    title: 'Arrival',
    titleFa: 'ورود (Arrival)',
    type: 'movie',
    overview: 'یک زبان‌شناس ماهر تلاش می‌کند با موجودات بیگانه‌ای که روی زمین فرود آمده‌اند ارتباط برقرار کند.',
    overviewFa: 'روایتی آرام، شاعرانه و به شدت عمیق در باب مفهوم زبان، زمان و انتخاب‌های بشری.',
    posterUrl: 'https://image.tmdb.org/t/p/w600_and_h900_bestv2/x2FJsf1ElAgr63Y3PNPtJrcmpoe.jpg',
    backdropUrl: 'https://image.tmdb.org/t/p/original/yIZ1xendyqKvY3FGeeLOLrOXAJ2.jpg',
    rating: 7.9,
    releaseYear: '2016',
    genres: ['درام', 'علمی تخیلی', 'معمایی'],
    genreIds: [18, 878, 9648],
    quality: '1080p Web-DL',
    hasDubbed: true,
    hasSubbed: true,
    keywords: ['philosophical', 'slow-burn', 'aliens', 'linguistics', 'bittersweet'],
  },
  {
    id: 'movie-mad-max-fury-road-2015',
    tmdbId: 76341,
    title: 'Mad Max: Fury Road',
    titleFa: 'مد مکس: جاده خشم',
    type: 'movie',
    overview: 'در دنیایی پسا-آخرالزمانی، مکس با فیوریوسا برای فرار از دست دیکتاتوری ستمگر همراه می‌شود.',
    overviewFa: 'گردبادی از آدرنالین خالص، تعقیب و گریز بدون توقف و جلوه‌های بصری خیره‌کننده.',
    posterUrl: 'https://image.tmdb.org/t/p/w600_and_h900_bestv2/hA2ple9q4qnwxp3hKVNhroipsir.jpg',
    backdropUrl: 'https://image.tmdb.org/t/p/original/nlCHUW2Y9XWbuEUQauCBgnY8ymF.jpg',
    rating: 8.0,
    releaseYear: '2015',
    genres: ['اکشن', 'ماجراجویی', 'علمی تخیلی'],
    genreIds: [28, 12, 878],
    quality: '1080p Web-DL',
    hasDubbed: true,
    hasSubbed: true,
    keywords: ['adrenaline', 'fast-paced', 'chase', 'post-apocalyptic', 'survival'],
  },
  {
    id: 'movie-the-grand-budapest-hotel-2014',
    tmdbId: 120467,
    title: 'The Grand Budapest Hotel',
    titleFa: 'هتل بزرگ بوداپست',
    type: 'movie',
    overview: 'ماجراهای سردرمدار افسانه‌ای هتلی مجلل و معروف در اروپای میان دو جنگ بزرگ.',
    overviewFa: 'سبک‌بال، پر از رنگ و لبخند، با قاب‌بندی‌های چشم‌نواز وس اندرسون و پایانی دلنشین.',
    posterUrl: 'https://image.tmdb.org/t/p/w600_and_h900_bestv2/eWdyYQreja6JGCzqHWXpWHDrrPo.jpg',
    backdropUrl: 'https://image.tmdb.org/t/p/original/jK65srQczOKTpW62wPxwwKztGgE.jpg',
    rating: 8.1,
    releaseYear: '2014',
    genres: ['کمدی', 'درام'],
    genreIds: [35, 18],
    quality: '1080p Web-DL',
    hasDubbed: true,
    hasSubbed: true,
    keywords: ['feel-good', 'whimsical', 'wit', 'cozy', 'aesthetic'],
  },
  {
    id: 'movie-se7en-1995',
    tmdbId: 807,
    title: 'Se7en',
    titleFa: 'هفت (Se7en)',
    type: 'movie',
    overview: 'دو کارآگاه در شهری بارانی و تاریک در تعقیب قاتلی زنجیره‌ای هستند که بر اساس هفت گناه کبیره دست به قتل می‌زند.',
    overviewFa: 'شاهکار دیوید فینچر با فضایی نئو-نوآر، تعلیق نفس‌گیر و پایانی به شدت شوکه‌کننده.',
    posterUrl: 'https://image.tmdb.org/t/p/w600_and_h900_bestv2/6yoghtyTpznpBik8EngEmJskVUO.jpg',
    backdropUrl: 'https://image.tmdb.org/t/p/original/ba4CpFFZc5d8Cq1v2q7l8Kk2yZ.jpg',
    rating: 8.4,
    releaseYear: '1995',
    genres: ['جنایی', 'معمایی', 'هیجان انگیز'],
    genreIds: [80, 9648, 53],
    quality: '1080p Web-DL',
    hasDubbed: true,
    hasSubbed: true,
    keywords: ['neo-noir', 'gritty', 'detective', 'plot-twist', 'shocking'],
  },
  {
    id: 'movie-the-prestige-2006',
    tmdbId: 1124,
    title: 'The Prestige',
    titleFa: 'پرستیژ (The Prestige)',
    type: 'movie',
    overview: 'رقابت بی‌رحمانه دو تردست قرن نوزدهمی در لندن که حاضرند برای شعبده نهایی همه چیز را قربانی کنند.',
    overviewFa: 'داستانی پر رمز و راز و فسفرسوز از کریستوفر نولان با چندین پیچش داستانی میخکوب‌کننده.',
    posterUrl: 'https://image.tmdb.org/t/p/w600_and_h900_bestv2/Ag2B2KHKQPukjH7WutmgnnSNurZ.jpg',
    backdropUrl: 'https://image.tmdb.org/t/p/original/yaExZh6qE2cfyK3o4kAMEq0mkgy.jpg',
    rating: 8.2,
    releaseYear: '2006',
    genres: ['درام', 'معمایی', 'علمی تخیلی'],
    genreIds: [18, 9648, 878],
    quality: '1080p Web-DL',
    hasDubbed: true,
    hasSubbed: true,
    keywords: ['mind-bending', 'plot-twist', 'rivalry', 'magic', 'period-piece'],
  },
  {
    id: 'movie-spirited-away-2001',
    tmdbId: 129,
    title: 'Spirited Away',
    titleFa: 'شهر اشباح (Spirited Away)',
    type: 'movie',
    overview: 'دختری ۱۰ ساله در دنیایی مرموز از ارواح و خدایان اساطیری گرفتار می‌شود و باید راه نجات خانواده‌اش را بیابد.',
    overviewFa: 'انیمیشنی جادویی و آرامش‌بخش از هایائو میازاکی؛ غرق‌کننده، پر از مهر و امید با پایانی تسلی‌بخش.',
    posterUrl: 'https://image.tmdb.org/t/p/w600_and_h900_bestv2/39wmItIWsg5sZMyRUHLkWBcuVCM.jpg',
    backdropUrl: 'https://image.tmdb.org/t/p/original/Ab8mkHmkYADjU7wQiOkia99GQI.jpg',
    rating: 8.5,
    releaseYear: '2001',
    genres: ['انیمیشن', 'خانوادگی', 'فانتزی'],
    genreIds: [16, 10751, 14],
    quality: '1080p Web-DL',
    hasDubbed: true,
    hasSubbed: true,
    keywords: ['feel-good', 'wholesome', 'magic', 'atmospheric', 'uplifting'],
  },
];

/**
 * Extracts and scores target genres and keywords from vibe answers
 */
function compileVibeParameters(vibeAnswers: VibeAnswersInput = {}) {
  const targetGenreWeights: Record<number, number> = {};
  const excludedGenres = new Set<number>();
  const vibeKeywords: string[] = [];
  const vibeTags: string[] = [];

  const {
    mentalEnergy = 'medium',
    pacing = 'steady',
    endingTone = 'uplifting',
    setting = 'cozy_modern',
    yearRange,
  } = vibeAnswers;

  // 1. Mental Energy
  const mentalOpt = (VIBE_MAPPINGS.mentalEnergy as any)[mentalEnergy];
  if (mentalOpt) {
    mentalOpt.with_genres.forEach((gid: number) => {
      targetGenreWeights[gid] = (targetGenreWeights[gid] || 0) + 3;
    });
    (mentalOpt.without_genres || []).forEach((gid: number) => excludedGenres.add(gid));
    vibeKeywords.push(...mentalOpt.keywords);
    vibeTags.push(mentalOpt.titleFa);
  }

  // 2. Pacing
  const pacingOpt = (VIBE_MAPPINGS.pacing as any)[pacing];
  if (pacingOpt) {
    pacingOpt.with_genres.forEach((gid: number) => {
      targetGenreWeights[gid] = (targetGenreWeights[gid] || 0) + 2.5;
    });
    vibeKeywords.push(...pacingOpt.keywords);
    vibeTags.push(pacingOpt.titleFa);
  }

  // 3. Ending Tone
  const endingOpt = (VIBE_MAPPINGS.endingTone as any)[endingTone];
  if (endingOpt) {
    endingOpt.with_genres.forEach((gid: number) => {
      targetGenreWeights[gid] = (targetGenreWeights[gid] || 0) + 2.5;
    });
    (endingOpt.without_genres || []).forEach((gid: number) => excludedGenres.add(gid));
    vibeKeywords.push(...endingOpt.keywords);
    vibeTags.push(endingOpt.titleFa);
  }

  // 4. Setting
  const settingOpt = (VIBE_MAPPINGS.setting as any)[setting];
  if (settingOpt) {
    settingOpt.with_genres.forEach((gid: number) => {
      targetGenreWeights[gid] = (targetGenreWeights[gid] || 0) + 2;
    });
    (settingOpt.without_genres || []).forEach((gid: number) => excludedGenres.add(gid));
    vibeKeywords.push(...settingOpt.keywords);
    vibeTags.push(settingOpt.titleFa);
  }

  // 5. Release Year Range
  if (yearRange && yearRange.titleFa && yearRange.id !== 'all') {
    vibeTags.push(yearRange.titleFa);
  }

  return { targetGenreWeights, excludedGenres, vibeKeywords, vibeTags, minVote: mentalOpt?.minVote || 6.5 };
}

/**
 * Main function: Fetches, ranks and filters tailored movies (either 10 calibration candidates or 5 final masterpieces)
 */
export async function getSmartRecommendations({
  vibeAnswers = {},
  userTaste = {},
  limit = 5,
  apiKey,
}: FetchRecommendationsOptions) {
  const { targetGenreWeights, excludedGenres, vibeKeywords, vibeTags, minVote } = compileVibeParameters(vibeAnswers);

  const ratedMovies = userTaste.ratedMovies || [];
  const discardedIds = new Set([
    ...(userTaste.discardedIds || []),
    ...(userTaste.excludedIds || []),
    ...(userTaste.unseenIds || []),
  ]);
  const savedIds = new Set(userTaste.savedIds || []);
  const userLikedGenres = userTaste.likedGenres || {};
  const userDislikedGenres = userTaste.dislikedGenres || {};

  // Year range constraints
  const yearRange = vibeAnswers.yearRange;
  const isSpecificYear = Boolean(yearRange && yearRange.id && yearRange.id !== 'all');
  const minYear = yearRange?.minYear;
  const maxYear = yearRange?.maxYear;

  // Find highly rated movies (rating >= 7) to pull recommendations from TMDb
  const highRatedIds = ratedMovies
    .filter((m) => m.rating >= 7 && m.tmdbId)
    .sort((a, b) => b.rating - a.rating)
    .slice(0, 3)
    .map((m) => m.tmdbId!);

  // Find user's top rated film for personalized reasoning in final stage
  const topLovedMovie = ratedMovies
    .filter((m) => m.rating >= 7)
    .sort((a, b) => b.rating - a.rating)[0];

  // Determine top genres to query in discover
  const sortedTargetGenres = Object.entries(targetGenreWeights)
    .sort(([, a], [, b]) => b - a)
    .map(([gid]) => Number(gid));

  const topGenreQuery = sortedTargetGenres.slice(0, 3).join('|');

  const candidates: any[] = [];
  const candidateKeys = new Set<string>();

  const addCandidate = (item: any) => {
    if (!item || !item.id) return;
    const key = String(item.tmdbId || item.id);
    if (candidateKeys.has(key)) return;
    if (discardedIds.has(String(item.id)) || (item.tmdbId && discardedIds.has(String(item.tmdbId)))) return;

    // Filter by year if specific year range is selected
    if (isSpecificYear && (item.releaseYear || item.release_date)) {
      const yearStr = String(item.releaseYear || item.release_date || '').slice(0, 4);
      const parsedYear = parseInt(yearStr, 10);
      if (!isNaN(parsedYear)) {
        if (minYear && parsedYear < minYear) return;
        if (maxYear && parsedYear > maxYear) return;
      }
    }

    candidateKeys.add(key);
    candidates.push(item);
  };

  // 1. Fetch from TMDb Recommendations if user has rated films
  if (highRatedIds.length > 0) {
    try {
      const recPromises = highRatedIds.map(async (tmdbId) => {
        const url = `https://api.themoviedb.org/3/movie/${tmdbId}/recommendations?api_key=${apiKey}&language=en-US&page=1`;
        const res = await fetch(url, { headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(3500) });
        if (res.ok) {
          const data = await res.json();
          return data.results || [];
        }
        return [];
      });
      const recs = await Promise.allSettled(recPromises);
      recs.forEach((r) => {
        if (r.status === 'fulfilled') {
          r.value.forEach((m: any) => {
            const mappedGenres = (m.genre_ids || []).map((gid: number) => TMDB_GENRE_NAMES[gid]).filter(Boolean);
            addCandidate({
              id: `movie-${m.id}`,
              tmdbId: m.id,
              title: m.title || m.original_title,
              titleFa: m.title || m.original_title,
              type: 'movie',
              overview: m.overview || '',
              overviewFa: m.overview || '',
              posterUrl: m.poster_path ? `https://image.tmdb.org/t/p/w600_and_h900_bestv2${m.poster_path}` : '',
              backdropUrl: m.backdrop_path ? `https://image.tmdb.org/t/p/original${m.backdrop_path}` : '',
              rating: Number((m.vote_average || 7.2).toFixed(1)),
              releaseYear: m.release_date ? m.release_date.split('-')[0] : '2023',
              genres: mappedGenres,
              genreIds: m.genre_ids || [],
              quality: '1080p Web-DL',
              hasDubbed: true,
              hasSubbed: true,
              sourceBonus: 20, // High bonus for being recommended by a user-loved film
            });
          });
        }
      });
    } catch (e) {
      console.warn('TMDb movie recommendations fetch failed:', e);
    }
  }

  // 2. Fetch from TMDb Discover with target genres & year range
  try {
    let yearQuery = '';
    if (isSpecificYear) {
      if (minYear) yearQuery += `&primary_release_date.gte=${minYear}-01-01`;
      if (maxYear) yearQuery += `&primary_release_date.lte=${maxYear}-12-31`;
    }

    const pagesToFetch = limit >= 15 ? [1, 2, 3, 4] : limit >= 10 ? [1, 2, 3] : [1, 2];
    const discoverPromises = pagesToFetch.map(async (p) => {
      const discoverUrl = `https://api.themoviedb.org/3/discover/movie?api_key=${apiKey}&with_genres=${topGenreQuery}&sort_by=vote_average.desc&vote_count.gte=180&vote_average.gte=${minVote}${yearQuery}&language=en-US&page=${p}`;
      const res = await fetch(discoverUrl, { headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(4000) });
      if (res.ok) {
        const data = await res.json();
        return data.results || [];
      }
      return [];
    });

    const discoverResults = await Promise.allSettled(discoverPromises);
    discoverResults.forEach((dr) => {
      if (dr.status === 'fulfilled') {
        dr.value.forEach((m: any) => {
          const mappedGenres = (m.genre_ids || []).map((gid: number) => TMDB_GENRE_NAMES[gid]).filter(Boolean);
          addCandidate({
            id: `movie-${m.id}`,
            tmdbId: m.id,
            title: m.title || m.original_title,
            titleFa: m.title || m.original_title,
            type: 'movie',
            overview: m.overview || '',
            overviewFa: m.overview || '',
            posterUrl: m.poster_path ? `https://image.tmdb.org/t/p/w600_and_h900_bestv2${m.poster_path}` : '',
            backdropUrl: m.backdrop_path ? `https://image.tmdb.org/t/p/original${m.backdrop_path}` : '',
            rating: Number((m.vote_average || 7.0).toFixed(1)),
            releaseYear: m.release_date ? m.release_date.split('-')[0] : '2024',
            genres: mappedGenres,
            genreIds: m.genre_ids || [],
            quality: '1080p Web-DL',
            hasDubbed: true,
            hasSubbed: true,
            sourceBonus: 5,
          });
        });
      }
    });
  } catch (e) {
    console.warn('TMDb discover for vibe failed:', e);
  }

  // 3. Add rich seed pool & local catalog to ensure high-quality options
  for (const item of [...VIBE_CURATED_SEED, ...CATALOG.filter((c) => c.type === 'movie')]) {
    addCandidate({
      ...item,
      genreIds: (item as any).genreIds || [],
    });
  }

  // 4. Score every candidate against the psychological taste vector
  const scoredItems = candidates.map((item) => {
    let score = 50; // base score

    // Genre alignment with user's vibe answers
    const itemGenreIds: number[] = item.genreIds || [];
    let matchedGenreCount = 0;
    for (const gid of itemGenreIds) {
      if (excludedGenres.has(gid)) {
        score -= 40; // Heavy penalty for explicitly excluded genres
      }
      if (targetGenreWeights[gid]) {
        score += targetGenreWeights[gid] * 8;
        matchedGenreCount++;
      }
      // Dynamic feedback from userTaste (Positive reinforcement for liked genres)
      if (userLikedGenres[gid]) {
        score += userLikedGenres[gid] * 12;
      }
      // Negative reinforcement for disliked genres
      if (userDislikedGenres[gid]) {
        score -= userDislikedGenres[gid] * 16;
      }
    }

    // Rating quality bonus
    score += (item.rating || 7.0) * 4;

    // Bonus for recommendation source
    if (item.sourceBonus) {
      score += item.sourceBonus;
    }

    // Check if this movie was already rated by the user
    const existingRating = ratedMovies.find((r) => r.id === item.id || (item.tmdbId && r.tmdbId === item.tmdbId));
    if (existingRating) {
      // In the final 5 recommendations stage, we prioritize fresh unrated discoveries
      if (limit === 5 && ratedMovies.length > 0) {
        score -= 1000;
      } else {
        score -= 30;
      }
    }

    // Match percentage normalized between 78% and 99%
    const matchPercentage = Math.min(99, Math.max(76, Math.round(score * 0.48 + matchedGenreCount * 6)));

    // Generate personalized Persian vibe explanation
    let vibeReason = '';
    if (topLovedMovie && existingRating === undefined) {
      vibeReason = `پیشنهاد هوشمند بر اساس امتیاز ${topLovedMovie.rating} شما به «${topLovedMovie.titleFa || topLovedMovie.title}»`;
    } else if (isSpecificYear && yearRange?.titleFa) {
      vibeReason = `متناسب با دوران ${yearRange.titleFa} و حس ${vibeTags.slice(0, 2).join(' • ')}`;
    } else {
      vibeReason = `انتخاب هوشمند متناسب با حس ${vibeTags.slice(0, 2).join(' • ')}`;
    }

    return {
      ...item,
      vibeScore: score,
      matchPercentage,
      vibeReason,
      vibeTags: vibeTags.slice(0, 3),
      isWatched: Boolean(existingRating),
      userRating: existingRating ? existingRating.rating : undefined,
      isSaved: savedIds.has(item.id) || (item.tmdbId ? savedIds.has(String(item.tmdbId)) : false),
    };
  });

  // Sort descending by calculated vibeScore
  scoredItems.sort((a, b) => (b.vibeScore || 0) - (a.vibeScore || 0));

  // Take top `limit` results (e.g., 10 for calibration pool, 5 for final masterpieces)
  const topRecommendations = scoredItems.slice(0, limit);

  return {
    success: true,
    vibeAnswers,
    vibeSummary: {
      tags: vibeTags,
      moodSentence: `مود شما: ${vibeTags.join(' • ')}`,
      yearRange: yearRange?.titleFa || 'تمام دوران‌ها',
    },
    count: topRecommendations.length,
    results: topRecommendations,
  };
}
