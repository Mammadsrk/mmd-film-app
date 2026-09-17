export interface VibeOption {
  id: string;
  titleFa: string;
  titleEn: string;
  descFa: string;
  emoji: string;
  genres: number[];
  with_genres: number[];
  without_genres?: number[];
  keywords: string[];
  minVote?: number;
}

export interface VibeQuestion {
  key: 'mentalEnergy' | 'pacing' | 'endingTone' | 'setting';
  titleFa: string;
  subtitleFa: string;
  stepNumber: number;
  options: VibeOption[];
}

export const VIBE_QUESTIONS: VibeQuestion[] = [
  {
    key: 'mentalEnergy',
    titleFa: 'انرژی و بار فکری',
    subtitleFa: 'در حال حاضر ذهنتان چقدر کشش و ظرفیت تحلیل داستان دارد؟',
    stepNumber: 1,
    options: [
      {
        id: 'light',
        titleFa: 'سبک و آرامش‌بخش',
        titleEn: 'Light & Chill',
        descFa: 'خستگی را از تن به در کند؛ خنده‌دار، جذاب و بدون درگیری عصبی',
        emoji: '🎈',
        genres: [35, 16, 10751, 14], // Comedy, Animation, Family, Fantasy
        with_genres: [35, 16],
        without_genres: [27, 10752, 99],
        keywords: ['feel-good', 'lighthearted', 'parody', 'friendship', 'wholesome'],
        minVote: 6.5,
      },
      {
        id: 'medium',
        titleFa: 'متعادل و ماجراجویانه',
        titleEn: 'Engaging & Balanced',
        descFa: 'داستان‌محور و هیجان‌انگیز که توجه را جلب کند بدون اینکه سردرد بیاورد',
        emoji: '🍿',
        genres: [28, 12, 14, 878, 53], // Action, Adventure, Fantasy, Sci-Fi, Thriller
        with_genres: [28, 12, 878],
        without_genres: [],
        keywords: ['hero', 'journey', 'adventure', 'spectacle', 'quest'],
        minVote: 6.8,
      },
      {
        id: 'heavy',
        titleFa: 'عمیق و فسفرسوز',
        titleEn: 'Deep & Mind-Bending',
        descFa: 'پیچیده، فلسفی، روان‌شناختی با گره‌های داستانی و تفکربرانگیز',
        emoji: '🧠',
        genres: [18, 9648, 878, 53, 80], // Drama, Mystery, Sci-Fi, Thriller, Crime
        with_genres: [18, 9648],
        without_genres: [10751, 35],
        keywords: ['psychological', 'existential', 'plot-twist', 'mind-bending', 'philosophical', 'neo-noir'],
        minVote: 7.2,
      },
    ],
  },
  {
    key: 'pacing',
    titleFa: 'سرعت و ریتم پیشروی',
    subtitleFa: 'دوست دارید وقایع فیلم با چه سرعتی اتفاق بیفتند؟',
    stepNumber: 2,
    options: [
      {
        id: 'fast',
        titleFa: 'تند و پرآدرنالین',
        titleEn: 'Fast & High Octane',
        descFa: 'بدون لحظه‌ای هدررفت وقت، نفس‌گیر، تعقیب و گریز و وقایع پی‌درپی',
        emoji: '⚡',
        genres: [28, 53, 80],
        with_genres: [28, 53],
        keywords: ['adrenaline', 'chase', 'heist', 'survival', 'ticking-clock'],
      },
      {
        id: 'steady',
        titleFa: 'حساب‌شده و منظم',
        titleEn: 'Steady & Methodical',
        descFa: 'ریتم استاندارد داستانی، تعلیق هوشمندانه و فرصت شناخت عمیق کاراکترها',
        emoji: '⏳',
        genres: [18, 9648, 12],
        with_genres: [18, 9648],
        keywords: ['investigation', 'character-study', 'conspiracy', 'secrets'],
      },
      {
        id: 'slowburn',
        titleFa: 'آرام و اتمسفریک (Slow-burn)',
        titleEn: 'Slow Burn & Atmospheric',
        descFa: 'تدریجی و مدهوش‌کننده، قاب‌های سینمایی گیرا و غرق شدن در حس صحنه',
        emoji: '🕯️',
        genres: [18, 27, 36, 9648],
        with_genres: [18, 36],
        keywords: ['slow-burn', 'atmospheric', 'moody', 'isolation', 'contemplative'],
      },
    ],
  },
  {
    key: 'endingTone',
    titleFa: 'حس پایانی و فرجام داستان',
    subtitleFa: 'می‌خواهید وقتی تیتراژ پایانی پخش می‌شود چه حسی داشته باشید؟',
    stepNumber: 3,
    options: [
      {
        id: 'uplifting',
        titleFa: 'امیدبخش و حال‌خوب‌کن',
        titleEn: 'Uplifting & Inspiring',
        descFa: 'پایان خوش، حس رهایی، انگیزه و لبخند رضایت بعد از سختی‌ها',
        emoji: '✨',
        genres: [35, 10749, 10751, 12],
        with_genres: [35, 10751, 10749],
        without_genres: [27],
        keywords: ['happy-ending', 'uplifting', 'triumph', 'inspiration', 'hope'],
      },
      {
        id: 'bittersweet',
        titleFa: 'واقع‌گرایانه و تلخ و شیرین',
        titleEn: 'Bittersweet & Poignant',
        descFa: 'شبیه زندگی واقعی، عاطفی و احساسی، تامل‌برانگیز و ماندگار در قلب',
        emoji: '🍂',
        genres: [18, 10749, 36],
        with_genres: [18],
        keywords: ['bittersweet', 'melancholy', 'poignant', 'realistic', 'nostalgia'],
      },
      {
        id: 'shocking',
        titleFa: 'شوکه‌کننده و غیرمنتظره',
        titleEn: 'Mind-Blowing Twist',
        descFa: 'پیچش داستانی غافلگیرکننده که دهانتان از تعجب باز بماند',
        emoji: '💥',
        genres: [9648, 53, 80, 27],
        with_genres: [9648, 53],
        without_genres: [10751],
        keywords: ['plot-twist', 'surprise-ending', 'shocking', 'conspiracy', 'betrayal'],
      },
    ],
  },
  {
    key: 'setting',
    titleFa: 'اتمسفر و جهان اثر',
    subtitleFa: 'دوست دارید وارد چه دنیا و حال‌وهوایی شوید؟',
    stepNumber: 4,
    options: [
      {
        id: 'futuristic',
        titleFa: 'آینده‌نگر، فضا و سایبرپانک',
        titleEn: 'Futuristic & Sci-Fi',
        descFa: 'هوش مصنوعی، ایستگاه‌های فضایی، سفینه‌ها و فناوری‌های فردا',
        emoji: '🚀',
        genres: [878, 14],
        with_genres: [878],
        without_genres: [36, 37],
        keywords: ['cyberpunk', 'space', 'dystopia', 'artificial-intelligence', 'future'],
      },
      {
        id: 'gritty_urban',
        titleFa: 'شهری، تاریک و زیرزمینی',
        titleEn: 'Gritty & Neo-Noir',
        descFa: 'خیابان‌های بارانی، کارآگاه‌های خسته، مافیا و کشف راز جنایت‌ها',
        emoji: '🏙️',
        genres: [80, 53, 18],
        with_genres: [80, 53],
        without_genres: [14, 10751],
        keywords: ['underworld', 'detective', 'neo-noir', 'mafia', 'gritty'],
      },
      {
        id: 'nature_historical',
        titleFa: 'طبیعت وحشی و ادوار تاریخی',
        titleEn: 'Wild & Period Epic',
        descFa: 'طبیعت بکر، بقا، تاریخ کهن، شمشیر، تمدن‌های باستان و نبرد',
        emoji: '🏔️',
        genres: [36, 12, 10752, 37],
        with_genres: [36, 12],
        without_genres: [878],
        keywords: ['wilderness', 'period-piece', 'survival', 'historical', 'epic'],
      },
      {
        id: 'cozy_modern',
        titleFa: 'مدرن، صمیمی و کافه‌ای',
        titleEn: 'Cozy & Slice of Life',
        descFa: 'روابط انسانی دلنشین، آپارتمان‌های دنج، دوستی‌ها و حس نزدیکی',
        emoji: '☕',
        genres: [35, 10749, 18],
        with_genres: [35, 10749],
        without_genres: [27, 10752],
        keywords: ['cozy', 'friendship', 'romance', 'coffee', 'lifestyle'],
      },
    ],
  },
];

export const VIBE_MAPPINGS = {
  mentalEnergy: Object.fromEntries(VIBE_QUESTIONS[0].options.map((o) => [o.id, o])),
  pacing: Object.fromEntries(VIBE_QUESTIONS[1].options.map((o) => [o.id, o])),
  endingTone: Object.fromEntries(VIBE_QUESTIONS[2].options.map((o) => [o.id, o])),
  setting: Object.fromEntries(VIBE_QUESTIONS[3].options.map((o) => [o.id, o])),
};

export interface YearRangePreset {
  id: string;
  titleFa: string;
  minYear: number;
  maxYear: number;
  emoji: string;
  descFa: string;
}

export const YEAR_RANGE_PRESETS: YearRangePreset[] = [
  {
    id: 'all',
    titleFa: 'تمام دوران‌ها',
    minYear: 1940,
    maxYear: 2026,
    emoji: '🌐',
    descFa: 'از شاهکارهای کلاسیک تاریخ سینما تا جدیدترین اکران‌های روز',
  },
  {
    id: '2020_2026',
    titleFa: 'جدید و امروزی (۲۰۲۰ تا ۲۰۲۶)',
    minYear: 2020,
    maxYear: 2026,
    emoji: '🚀',
    descFa: 'فیلم‌های ترند، مدرن و پرطرفدار چند سال اخیر با بالاترین کیفیت',
  },
  {
    id: '2010_2019',
    titleFa: 'دهه طلایی ۲۰۱۰ (۲۰۱۰ تا ۲۰۱۹)',
    minYear: 2010,
    maxYear: 2019,
    emoji: '🎬',
    descFa: 'دهه‌ای سرشار از شاهکارهای فلسفی، علمی-تخیلی و اکشن‌های مدرن',
  },
  {
    id: '2000_2009',
    titleFa: 'دهه ۲۰۰۰ (۲۰۰۰ تا ۲۰۰۹)',
    minYear: 2000,
    maxYear: 2009,
    emoji: '📼',
    descFa: 'دوره اوج تریلرهای روان‌شناختی، جنایی و آغاز فرنچایزهای بزرگ',
  },
  {
    id: '1990_1999',
    titleFa: 'دهه نوستالژیک ۹۰ (۱۹۹۰ تا ۱۹۹۹)',
    minYear: 1990,
    maxYear: 1999,
    emoji: '🎞️',
    descFa: 'دوران شاهکارهای ماندگار، نئو-نوآرها و سینمای مستقل بی‌تکرار',
  },
  {
    id: 'classic',
    titleFa: 'کلاسیک‌های سینما (قبل از ۱۹۹۰)',
    minYear: 1940,
    maxYear: 1989,
    emoji: '🏛️',
    descFa: 'آثار جاودانه و بنیادی سینمای جهان از کارگردانان بزرگ',
  },
];

