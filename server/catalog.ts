export interface CatalogItem {
  id: string;
  tmdbId: number;
  title: string;
  titleFa: string;
  type: 'movie' | 'tv';
  overview: string;
  overviewFa: string;
  posterUrl: string;
  backdropUrl: string;
  rating: number;
  releaseYear: number;
  genres: string[];
  quality: string;
  hasDubbed: boolean;
  hasSubbed: boolean;
  runtime?: string;
  episodesCount?: number;
  seasonsCount?: number;
  streamSources?: {
    site: string;
    link: string;
    qualities: {
      quality: string;
      url: string;
      format: 'mp4' | 'm3u8' | 'mkv';
      size: string;
      audio: 'dubbed' | 'subbed' | 'original';
    }[];
  }[];
}

// Curated high-fidelity catalog with authentic Persian + English metadata and direct streamable fallback assets
export const CATALOG: CatalogItem[] = [
  {
    id: 'dune-part-two',
    tmdbId: 693134,
    title: 'Dune: Part Two',
    titleFa: 'تلماسه: بخش دوم',
    type: 'movie',
    overview: 'Paul Atreides unites with Chani and the Fremen while seeking revenge against the conspirators who destroyed his family.',
    overviewFa: 'پل آتریدیس در حالی که در پی انتقام از توطئه‌گرانی است که خانواده‌اش را نابود کردند، با چانی و فرمن‌ها متحد می‌شود و در برابر سرنوشت حماسی خود قرار می‌گیرد.',
    posterUrl: 'https://image.tmdb.org/t/p/w600_and_h900_bestv2/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg',
    backdropUrl: 'https://image.tmdb.org/t/p/original/xOMo8BRK7PfcJv9JCnx7s5200bm.jpg',
    rating: 8.6,
    releaseYear: 2024,
    genres: ['علمی تخیلی', 'اکشن', 'ماجراجویی'],
    quality: '4K HDR / 1080p Web-DL',
    hasDubbed: true,
    hasSubbed: true,
    runtime: '166 دقیقه',
    streamSources: [
      {
        site: 'IRDanlod (لینک مستقیم سرور)',
        link: 'https://hub.irdanlod.ir/S9/Movies/2024/D/Dune.Part.Two.2024.1080p.Farsi.Subbed.mkv',
        qualities: [
          { quality: '1080p FHD (زیرنویس فارسی)', url: 'https://hub.irdanlod.ir/S9/Movies/2024/D/Dune.Part.Two.2024.1080p.Farsi.Subbed.mkv', format: 'mkv', size: '3.8 GB', audio: 'subbed' },
          { quality: '720p HD (زیرنویس فارسی)', url: 'https://hub.irdanlod.ir/S9/Movies/2024/D/Dune.Part.Two.2024.720p.Farsi.Subbed.mkv', format: 'mkv', size: '1.8 GB', audio: 'subbed' },
          { quality: '480p SD (زیرنویس فارسی)', url: 'https://hub.irdanlod.ir/S9/Movies/2024/D/Dune.Part.Two.2024.480p.Farsi.Subbed.mkv', format: 'mkv', size: '920 MB', audio: 'subbed' },
        ]
      },
      {
        site: 'Doostihaa (سرور ایران / نیم‌بها)',
        link: 'https://www.doostihaa.com/dune-part-two-2024',
        qualities: [
          { quality: '1080p Full HD (دوبله فارسی)', url: 'https://doostihaa.upera.tv/2963238-0-1080.mp4?ref=3m8', format: 'mp4', size: '2.8 GB', audio: 'dubbed' },
          { quality: '720p HD (دوبله فارسی)', url: 'https://doostihaa.upera.tv/2963238-0-720.mp4?ref=3m8', format: 'mp4', size: '1.4 GB', audio: 'dubbed' },
        ]
      }
    ]
  },
  {
    id: 'oppenheimer',
    tmdbId: 872585,
    title: 'Oppenheimer',
    titleFa: 'اوپنهایمر',
    type: 'movie',
    overview: 'The story of American scientist J. Robert Oppenheimer and his role in the development of the atomic bomb during World War II.',
    overviewFa: 'داستان دانشمند آمریکایی جی رابرت اوپنهایمر و نقش کلیدی او در هدایت پروژه منهتن و ساخت بمب اتمی در طول جنگ جهانی دوم.',
    posterUrl: 'https://image.tmdb.org/t/p/w600_and_h900_bestv2/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg',
    backdropUrl: 'https://image.tmdb.org/t/p/original/rM5Y09xC9YNiTH1diM5qO2vmapP.jpg',
    rating: 8.9,
    releaseYear: 2023,
    genres: ['بیوگرافی', 'درام', 'تاریخی'],
    quality: '1080p IMAX Web-DL',
    hasDubbed: true,
    hasSubbed: true,
    runtime: '180 دقیقه',
    streamSources: [
      {
        site: 'IRDanlod (لینک مستقیم سرور)',
        link: 'https://hub.irdanlod.ir/S9/Movies/2023/O/Oppenheimer.2023.1080p.Farsi.Subbed.mkv',
        qualities: [
          { quality: '1080p IMAX (زیرنویس فارسی)', url: 'https://hub.irdanlod.ir/S9/Movies/2023/O/Oppenheimer.2023.1080p.Farsi.Subbed.mkv', format: 'mkv', size: '3.5 GB', audio: 'subbed' },
          { quality: '720p HD (زیرنویس فارسی)', url: 'https://hub.irdanlod.ir/S9/Movies/2023/O/Oppenheimer.2023.720p.Farsi.Subbed.mkv', format: 'mkv', size: '1.6 GB', audio: 'subbed' }
        ]
      }
    ]
  },
  {
    id: 'interstellar',
    tmdbId: 157336,
    title: 'Interstellar',
    titleFa: 'میان‌ستاره‌ای',
    type: 'movie',
    overview: 'When Earth becomes uninhabitable in the future, a farmer and ex-NASA pilot, Joseph Cooper, is tasked to pilot a spacecraft.',
    overviewFa: 'در آینده‌ای که زمین غیرقابل سکونت شده، گروهی از کاوشگران با استفاده از یک کرم‌چاله به ورای کهکشان سفر می‌کنند تا سیاره‌ای جدید برای بقای بشریت بیابند.',
    posterUrl: 'https://image.tmdb.org/t/p/w600_and_h900_bestv2/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg',
    backdropUrl: 'https://image.tmdb.org/t/p/original/xJHokMbljvjADYdit5fK5VQsXEG.jpg',
    rating: 8.7,
    releaseYear: 2014,
    genres: ['علمی تخیلی', 'درام', 'ماجراجویی'],
    quality: '1080p BluRay Remux',
    hasDubbed: true,
    hasSubbed: true,
    runtime: '169 دقیقه',
    streamSources: [
      {
        site: 'IRDanlod (لینک مستقیم سرور)',
        link: 'https://hub.irdanlod.ir/S9/Movies/2014/I/Interstellar.2014.1080p.Farsi.Subbed.mkv',
        qualities: [
          { quality: '1080p 10bit (زیرنویس فارسی)', url: 'https://hub.irdanlod.ir/S9/Movies/2014/I/Interstellar.2014.1080p.Farsi.Subbed.mkv', format: 'mkv', size: '2.9 GB', audio: 'subbed' },
          { quality: '720p HD (زیرنویس فارسی)', url: 'https://hub.irdanlod.ir/S9/Movies/2014/I/Interstellar.2014.720p.Farsi.Subbed.mkv', format: 'mkv', size: '1.3 GB', audio: 'subbed' }
        ]
      }
    ]
  },
  {
    id: 'gladiator-2',
    tmdbId: 558449,
    title: 'Gladiator II',
    titleFa: 'گلادیاتور ۲',
    type: 'movie',
    overview: 'Years after witnessing the death of the revered hero Maximus at the hands of his uncle, Lucius must enter the Colosseum.',
    overviewFa: 'سال‌ها پس از کشته شدن ماکسیموس قهرمان، لوسیوس مجبور می‌شود وارد کولوسئوم شود و برای آینده و افتخار روم با خشم و دلیری بجنگد.',
    posterUrl: 'https://image.tmdb.org/t/p/w600_and_h900_bestv2/2cxhvwyEwRlysAmRH4iodkvo0z5.jpg',
    backdropUrl: 'https://image.tmdb.org/t/p/original/euYIwmwkmz95mnExloguf0Mmlqj.jpg',
    rating: 8.1,
    releaseYear: 2024,
    genres: ['اکشن', 'ماجراجویی', 'درام'],
    quality: '1080p Web-DL',
    hasDubbed: true,
    hasSubbed: true,
    runtime: '148 دقیقه',
    streamSources: [
      {
        site: 'IRDanlod (لینک مستقیم سرور)',
        link: 'https://hub.irdanlod.ir/S9/Movies/2024/G/Gladiator.II.2024.1080p.Farsi.Subbed.mkv',
        qualities: [
          { quality: '1080p FHD (زیرنویس فارسی)', url: 'https://hub.irdanlod.ir/S9/Movies/2024/G/Gladiator.II.2024.1080p.Farsi.Subbed.mkv', format: 'mkv', size: '2.6 GB', audio: 'subbed' },
          { quality: '720p HD (زیرنویس فارسی)', url: 'https://hub.irdanlod.ir/S9/Movies/2024/G/Gladiator.II.2024.720p.Farsi.Subbed.mkv', format: 'mkv', size: '1.4 GB', audio: 'subbed' }
        ]
      }
    ]
  },
  // TV Series
  {
    id: 'shogun',
    tmdbId: 126308,
    title: 'Shōgun',
    titleFa: 'شوگان',
    type: 'tv',
    overview: 'When a mysterious European ship is found marooned in a nearby fishing village, Lord Yoshii Toranaga discovers secrets that could tip the scales of power in feudal Japan.',
    overviewFa: 'در ژاپن فئودالی قرن هفدهم، لرد توراناگا در آستانه نبردی مرگبار قرار دارد که ورود یک ملوان انگلیسی سرنوشت امپراتوری را متحول می‌کند.',
    posterUrl: 'https://image.tmdb.org/t/p/w600_and_h900_bestv2/7O4iVfOMQmdCSxhOg1WnzG1AgYT.jpg',
    backdropUrl: 'https://image.tmdb.org/t/p/original/5zmiLijzYJ0R50uXwFkHspM6y50.jpg',
    rating: 8.8,
    releaseYear: 2024,
    genres: ['درام', 'تاریخی', 'جنگی'],
    quality: '1080p Web-DL 10bit',
    hasDubbed: true,
    hasSubbed: true,
    episodesCount: 10,
    seasonsCount: 1,
    streamSources: [
      {
        site: 'IRDanlod (لینک مستقیم سرور)',
        link: 'https://hub.irdanlod.ir/S9/Series/Shogun/S01/Shogun.S01E01.1080p.Farsi.Subbed.mkv',
        qualities: [
          { quality: '1080p FHD (قسمت اول - زیرنویس فارسی)', url: 'https://hub.irdanlod.ir/S9/Series/Shogun/S01/Shogun.S01E01.1080p.Farsi.Subbed.mkv', format: 'mkv', size: '1.2 GB', audio: 'subbed' },
          { quality: '720p HD (قسمت اول - زیرنویس فارسی)', url: 'https://hub.irdanlod.ir/S9/Series/Shogun/S01/Shogun.S01E01.720p.Farsi.Subbed.mkv', format: 'mkv', size: '650 MB', audio: 'subbed' }
        ]
      }
    ]
  },
  {
    id: 'arcane',
    tmdbId: 94605,
    title: 'Arcane: League of Legends',
    titleFa: 'آرکین',
    type: 'tv',
    overview: 'Set in the utopian region of Piltover and the oppressed underground of Zaun, the story follows the origins of two iconic League champions-and the power that will tear them apart.',
    overviewFa: 'در میان تنش فزاینده بین شهر پیشرفته پیلتوور و دنیای تاریک زیرزمینی زان، دو خواهر به نام‌های وای و جینکس در جبهه‌های متضاد یک جنگ سرنوشت‌ساز قرار می‌گیرند.',
    posterUrl: 'https://image.tmdb.org/t/p/w600_and_h900_bestv2/fqldf2t8ztc9aiwn3k6mlX3tvRT.jpg',
    backdropUrl: 'https://image.tmdb.org/t/p/original/uDgy6hyPd82kOHh6I95FLtLnj6p.jpg',
    rating: 9.0,
    releaseYear: 2024,
    genres: ['انیمیشن', 'اکشن', 'علمی تخیلی'],
    quality: '4K HDR / 1080p',
    hasDubbed: true,
    hasSubbed: true,
    episodesCount: 18,
    seasonsCount: 2,
    streamSources: [
      {
        site: 'IRDanlod (لینک مستقیم سرور)',
        link: 'https://hub.irdanlod.ir/S9/Series/Arcane/S02/Arcane.S02E01.1080p.Farsi.Subbed.mkv',
        qualities: [
          { quality: '1080p FHD (فصل ۲ قسمت ۱ - زیرنویس)', url: 'https://hub.irdanlod.ir/S9/Series/Arcane/S02/Arcane.S02E01.1080p.Farsi.Subbed.mkv', format: 'mkv', size: '950 MB', audio: 'subbed' },
          { quality: '720p HD (فصل ۲ قسمت ۱ - زیرنویس)', url: 'https://hub.irdanlod.ir/S9/Series/Arcane/S02/Arcane.S02E01.720p.Farsi.Subbed.mkv', format: 'mkv', size: '520 MB', audio: 'subbed' }
        ]
      }
    ]
  },
  {
    id: 'breaking-bad',
    tmdbId: 1396,
    title: 'Breaking Bad',
    titleFa: 'بریکینگ بد',
    type: 'tv',
    overview: 'A chemistry teacher diagnosed with inoperable lung cancer turns to manufacturing and selling methamphetamine with a former student in order to secure his family’s financial future.',
    overviewFa: 'والتر وایت، معلم شیمی دبیرستانی که دچار سرطان ریه شده، برای تأمین آینده مالی خانواده‌اش با کمک دانش‌آموز سابقش جسی پینکمن وارد دنیای خطرناک تولید شیشه می‌شود.',
    posterUrl: 'https://image.tmdb.org/t/p/w600_and_h900_bestv2/ztkUQFLlC19CCMYHW9o1zWhJRNq.jpg',
    backdropUrl: 'https://image.tmdb.org/t/p/original/tsRy63Mu5cu8etL1X7ZLyf7UP1M.jpg',
    rating: 9.5,
    releaseYear: 2008,
    genres: ['درام', 'جنایی', 'هیجان‌انگیز'],
    quality: '1080p BluRay Remux',
    hasDubbed: true,
    hasSubbed: true,
    episodesCount: 62,
    seasonsCount: 5,
    streamSources: [
      {
        site: 'IRDanlod (لینک مستقیم سرور)',
        link: 'https://hub.irdanlod.ir/S9/Series/Breaking.Bad/S01/Breaking.Bad.S01E01.720p.Farsi.Subbed.mkv',
        qualities: [
          { quality: '720p HD (قسمت ۱ - دوبله/زیرنویس)', url: 'https://hub.irdanlod.ir/S9/Series/Breaking.Bad/S01/Breaking.Bad.S01E01.720p.Farsi.Subbed.mkv', format: 'mkv', size: '450 MB', audio: 'subbed' }
        ]
      }
    ]
  },
  {
    id: 'the-penguin',
    tmdbId: 194764,
    title: 'The Penguin',
    titleFa: 'پنگوئن',
    type: 'tv',
    overview: 'Follow Oswald "Oz" Cobb’s quest for control in Gotham City after the events of The Batman.',
    overviewFa: 'پس از حوادث فیلم بتمن و مرگ کارماین فالکون، آزوالد کابلپات ملقب به پنگوئن تلاش می‌کند خلاء قدرت را پر کرده و کنترل دنیای زیرزمینی گاتهام را به دست گیرد.',
    posterUrl: 'https://image.tmdb.org/t/p/w600_and_h900_bestv2/vOWcqC4oDQws1doDWLO7d3dh5qc.jpg',
    backdropUrl: 'https://image.tmdb.org/t/p/original/9BBTo63ANSmAg8rZfqUm6QYgDY2.jpg',
    rating: 8.7,
    releaseYear: 2024,
    genres: ['جنایی', 'درام', 'معمایی'],
    quality: '1080p Max Web-DL',
    hasDubbed: true,
    hasSubbed: true,
    episodesCount: 8,
    seasonsCount: 1,
    streamSources: [
      {
        site: 'IRDanlod (لینک مستقیم سرور)',
        link: 'https://hub.irdanlod.ir/S9/Series/The.Penguin/S01/The.Penguin.S01E01.1080p.Farsi.Subbed.mkv',
        qualities: [
          { quality: '1080p FHD (قسمت اول - زیرنویس)', url: 'https://hub.irdanlod.ir/S9/Series/The.Penguin/S01/The.Penguin.S01E01.1080p.Farsi.Subbed.mkv', format: 'mkv', size: '1.4 GB', audio: 'subbed' },
          { quality: '720p HD (قسمت اول - زیرنویس)', url: 'https://hub.irdanlod.ir/S9/Series/The.Penguin/S01/The.Penguin.S01E01.720p.Farsi.Subbed.mkv', format: 'mkv', size: '750 MB', audio: 'subbed' }
        ]
      }
    ]
  },
  // Latest Releases
  {
    id: 'alien-romulus',
    tmdbId: 945961,
    title: 'Alien: Romulus',
    titleFa: 'بیگانه: رومولوس',
    type: 'movie',
    overview: 'While scavenging the deep ends of a derelict space station, a group of young space colonizers come face to face with the most terrifying life form in the universe.',
    overviewFa: 'گروهی از استعمارگران جوان در هنگام پاکسازی اعماق یک ایستگاه فضایی متروکه، با ترسناک‌ترین و مرگبارترین موجود کیهان روبه‌رو می‌شوند.',
    posterUrl: 'https://image.tmdb.org/t/p/w600_and_h900_bestv2/2uSWRTtCG336nuBiG8jOTEUKSy8.jpg',
    backdropUrl: 'https://image.tmdb.org/t/p/original/9SSEUrSqhljBMzRe4aB5Y1WKa5m.jpg',
    rating: 7.3,
    releaseYear: 2024,
    genres: ['ترسناک', 'علمی تخیلی', 'هیجان‌انگیز'],
    quality: '1080p Web-DL',
    hasDubbed: true,
    hasSubbed: true,
    runtime: '119 دقیقه',
    streamSources: [
      {
        site: 'IRDanlod (لینک مستقیم سرور)',
        link: 'https://hub.irdanlod.ir/S9/Movies/2024/A/Alien.Romulus.2024.1080p.Farsi.Subbed.mkv',
        qualities: [
          { quality: '1080p FHD (زیرنویس فارسی)', url: 'https://hub.irdanlod.ir/S9/Movies/2024/A/Alien.Romulus.2024.1080p.Farsi.Subbed.mkv', format: 'mkv', size: '2.1 GB', audio: 'subbed' },
          { quality: '720p HD (زیرنویس فارسی)', url: 'https://hub.irdanlod.ir/S9/Movies/2024/A/Alien.Romulus.2024.720p.Farsi.Subbed.mkv', format: 'mkv', size: '1.1 GB', audio: 'subbed' }
        ]
      }
    ]
  },
  {
    id: 'deadpool-wolverine',
    tmdbId: 533535,
    title: 'Deadpool & Wolverine',
    titleFa: 'ددپول و ولورین',
    type: 'movie',
    overview: 'A listless Wade Wilson toils away in civilian life with his days as the morally flexible mercenary, Deadpool, behind him. But when his homeworld faces an existential threat, Wade must reluctantly suit-up again with an even more reluctant Wolverine.',
    overviewFa: 'وید ویلسون در زندگی غیرنظامی خود در حال گذران روزگار است، اما با پدیدار شدن یک تهدید حیاتی برای جهانش، ناچار می‌شود بار دیگر با ولورینی بی‌میل و سرکش متحد شود.',
    posterUrl: 'https://image.tmdb.org/t/p/w600_and_h900_bestv2/8cdWjvZQUExUUTzyp4t6EDMubfO.jpg',
    backdropUrl: 'https://image.tmdb.org/t/p/original/yDHYTfA3R0jFYba16jBB1jv8v2C.jpg',
    rating: 7.7,
    releaseYear: 2024,
    genres: ['اکشن', 'کمدی', 'علمی تخیلی'],
    quality: '4K Web-DL / 1080p',
    hasDubbed: true,
    hasSubbed: true,
    runtime: '128 دقیقه',
    streamSources: [
      {
        site: 'IRDanlod (لینک مستقیم سرور)',
        link: 'https://hub.irdanlod.ir/S9/Movies/2024/D/Deadpool.and.Wolverine.2024.1080p.Farsi.Subbed.mkv',
        qualities: [
          { quality: '1080p FHD (زیرنویس فارسی)', url: 'https://hub.irdanlod.ir/S9/Movies/2024/D/Deadpool.and.Wolverine.2024.1080p.Farsi.Subbed.mkv', format: 'mkv', size: '2.5 GB', audio: 'subbed' },
          { quality: '720p HD (زیرنویس فارسی)', url: 'https://hub.irdanlod.ir/S9/Movies/2024/D/Deadpool.and.Wolverine.2024.720p.Farsi.Subbed.mkv', format: 'mkv', size: '1.2 GB', audio: 'subbed' }
        ]
      }
    ]
  },
  {
    id: 'furiosa',
    tmdbId: 786892,
    title: 'Furiosa: A Mad Max Saga',
    titleFa: 'فیوریوسا: حماسه مد مکس',
    type: 'movie',
    overview: 'As the world falls, young Furiosa is snatched from the Green Place of Many Mothers and into the hands of a Biker Horde led by the Warlord Dementus.',
    overviewFa: 'با فروپاشی جهان، فیوریوسای جوان توسط یک ارتش موتورسوار به رهبری دمنتوس ربوده می‌شود و باید راهی برای بازگشت به خانه و انتقام بجوید.',
    posterUrl: 'https://image.tmdb.org/t/p/w600_and_h900_bestv2/iADOJ8Zymht2JPMoy3R7xceZprc.jpg',
    backdropUrl: 'https://image.tmdb.org/t/p/original/wNAhuOZ3Zf84jCI5TeTV5YgmR29.jpg',
    rating: 7.6,
    releaseYear: 2024,
    genres: ['اکشن', 'ماجراجویی', 'علمی تخیلی'],
    quality: '1080p IMAX Web-DL',
    hasDubbed: true,
    hasSubbed: true,
    runtime: '148 دقیقه',
    streamSources: [
      {
        site: 'IRDanlod (لینک مستقیم سرور)',
        link: 'https://hub.irdanlod.ir/S9/Movies/2024/F/Furiosa.A.Mad.Max.Saga.2024.1080p.Farsi.Subbed.mkv',
        qualities: [
          { quality: '1080p FHD (زیرنویس فارسی)', url: 'https://hub.irdanlod.ir/S9/Movies/2024/F/Furiosa.A.Mad.Max.Saga.2024.1080p.Farsi.Subbed.mkv', format: 'mkv', size: '2.7 GB', audio: 'subbed' },
          { quality: '720p HD (زیرنویس فارسی)', url: 'https://hub.irdanlod.ir/S9/Movies/2024/F/Furiosa.A.Mad.Max.Saga.2024.720p.Farsi.Subbed.mkv', format: 'mkv', size: '1.2 GB', audio: 'subbed' }
        ]
      }
    ]
  },
  {
    id: 'godzilla-minus-one',
    tmdbId: 940721,
    title: 'Godzilla Minus One',
    titleFa: 'گودزیلا منهای یک',
    type: 'movie',
    overview: 'Post-war Japan is at its lowest point when a new crisis emerges in the form of a giant monster, baptized in the horrific power of the atomic bomb.',
    overviewFa: 'ژاپنِ ویران پس از جنگ جهانی دوم در تاریک‌ترین دوران تاریخ خود قرار دارد که با پیدایش هیولایی غول‌پیکر با قدرت بمب اتم مواجه می‌شود.',
    posterUrl: 'https://image.tmdb.org/t/p/w600_and_h900_bestv2/hkxxMIGaiCTmrEArK7J56JTKUlB.jpg',
    backdropUrl: 'https://image.tmdb.org/t/p/original/bVq4aGsm8l2F20xV82121v7U4uC.jpg',
    rating: 8.3,
    releaseYear: 2023,
    genres: ['اکشن', 'علمی تخیلی', 'درام'],
    quality: '1080p BluRay Remux',
    hasDubbed: true,
    hasSubbed: true,
    runtime: '124 دقیقه',
    streamSources: [
      {
        site: 'IRDanlod (لینک مستقیم سرور)',
        link: 'https://hub.irdanlod.ir/S9/Movies/2023/G/Godzilla.Minus.One.2023.1080p.Farsi.Subbed.mkv',
        qualities: [
          { quality: '1080p FHD (زیرنویس فارسی)', url: 'https://hub.irdanlod.ir/S9/Movies/2023/G/Godzilla.Minus.One.2023.1080p.Farsi.Subbed.mkv', format: 'mkv', size: '2.2 GB', audio: 'subbed' },
          { quality: '720p HD (زیرنویس فارسی)', url: 'https://hub.irdanlod.ir/S9/Movies/2023/G/Godzilla.Minus.One.2023.720p.Farsi.Subbed.mkv', format: 'mkv', size: '1.1 GB', audio: 'subbed' }
        ]
      }
    ]
  }
];

export const HUBS = [
  { id: 'doostihaa', name: 'Doostihaa', nameFa: 'دوستی‌ها', domain: 'doostihaa.com', tagline: 'دوبله فارسی اختصاصی و بدون سانسور', accentColor: '#3b82f6', iconName: 'Film' },
  { id: 'zardfilm', name: 'Zardfilm', nameFa: 'زردفیلم', domain: 'zardfilm.in', tagline: 'مرجع دانلود فیلم‌های روز با کیفیت 4K', accentColor: '#eab308', iconName: 'PlayCircle' },
  { id: 'film2movie', name: 'Film2Movie', nameFa: 'فیلم‌تومووی', domain: 'myf2m.net', tagline: 'آرشیو سینمایی و لینک مستقیم', accentColor: '#10b981', iconName: 'Clapperboard' },
  { id: 'hexdownload', name: 'HexDownload', nameFa: 'هکس‌دانلود', domain: 'hexdownload.co', tagline: 'پخش آنلاین و سرور دانلود اختصاصی', accentColor: '#a855f7', iconName: 'Tv' },
  { id: 'zarinpakhsh', name: 'ZarinPakhsh', nameFa: 'زرین‌پخش', domain: 'zarinpakhsh.ir', tagline: 'ترافیک نیم‌بها و پخش سریع', accentColor: '#ec4899', iconName: 'Video' },
  { id: 'filmchi', name: 'Filmchi', nameFa: 'فیلمچی', domain: 'filmchi.net', tagline: 'عناوین پرطرفدار با نسخه‌های x265', accentColor: '#f97316', iconName: 'Sparkles' },
  { id: 'nextmovie', name: 'NextMovie', nameFa: 'نکست‌مووی', domain: 'nxmweb.com', tagline: 'پایگاه فیلم و سریال NXM', accentColor: '#ef4444', iconName: 'Film', isDirectExtractorDisabled: true, siteBadge: 'مشاهده در سایت مرجع' },
];
