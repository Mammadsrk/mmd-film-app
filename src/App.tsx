/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { HeroSearch } from './components/HeroSearch';
import { DiscoverySlider } from './components/DiscoverySlider';
import { SearchResultsGrid } from './components/SearchResultsGrid';
import { VODModal } from './components/VODModal';
import { TVRemoteHelper } from './components/TVRemoteHelper';
import { AmbientBackground } from './components/AmbientBackground';
import { GenreFilterModal, AVAILABLE_GENRES } from './components/GenreFilterModal';
import { MovieCard } from './components/MovieCard';
import { useSpatialNavigation } from './hooks/useSpatialNavigation';
import { MediaItem, SearchResult } from './types';
import { Flame, Tv, Film, Sparkles, ShieldCheck, Loader2, X, Compass, SlidersHorizontal, RotateCcw } from 'lucide-react';

export default function App() {
  const [trendingMovies, setTrendingMovies] = useState<MediaItem[]>([]);
  const [trendingSeries, setTrendingSeries] = useState<MediaItem[]>([]);
  const [latestReleases, setLatestReleases] = useState<MediaItem[]>([]);
  const [isLoadingHome, setIsLoadingHome] = useState<boolean>(true);

  // Search state
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isLoadingSearch, setIsLoadingSearch] = useState<boolean>(false);
  const [selectedHub, setSelectedHub] = useState<string | null>(null);

  // Advanced Filter Modal & Options (Multi-Genre, Multi-Year, Content Type)
  const [isGenreModalOpen, setIsGenreModalOpen] = useState<boolean>(false);
  const [selectedGenreIds, setSelectedGenreIds] = useState<number[]>([]);
  const [selectedYears, setSelectedYears] = useState<string[]>([]);
  const [selectedType, setSelectedType] = useState<'all' | 'movie' | 'tv'>('all');
  const [genreFilteredMovies, setGenreFilteredMovies] = useState<MediaItem[]>([]);
  const [isLoadingGenreFilter, setIsLoadingGenreFilter] = useState<boolean>(false);

  // Modal & Navigation state
  const [activeMedia, setActiveMedia] = useState<MediaItem | null>(null);
  const [isTvHelperOpen, setIsTvHelperOpen] = useState<boolean>(false);
  const [isMobile, setIsMobile] = useState<boolean>(false);

  // Check screen width for mobile adaptation (< 768px)
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Fetch initial home carousels through server-side proxy
  useEffect(() => {
    let isMounted = true;
    setIsLoadingHome(true);

    const loadDiscoveryData = async () => {
      try {
        const [moviesRes, seriesRes, popularRes] = await Promise.allSettled([
          fetch('/api/tmdb/trending-movies').then((r) => r.json()),
          fetch('/api/tmdb/trending-series').then((r) => r.json()),
          fetch('/api/tmdb/popular').then((r) => r.json()),
        ]);

        if (!isMounted) return;

        if (moviesRes.status === 'fulfilled' && moviesRes.value?.results) {
          setTrendingMovies(moviesRes.value.results);
        }
        if (seriesRes.status === 'fulfilled' && seriesRes.value?.results) {
          setTrendingSeries(seriesRes.value.results);
        }
        if (popularRes.status === 'fulfilled' && popularRes.value?.results) {
          setLatestReleases(popularRes.value.results);
        }
      } catch (err) {
        console.error('Failed to load discovery data:', err);
      } finally {
        if (isMounted) setIsLoadingHome(false);
      }
    };

    loadDiscoveryData();

    return () => {
      isMounted = false;
    };
  }, []);

  // Robust server-proxied TMDB Discover fetcher supporting multiple genres and years
  useEffect(() => {
    const hasActiveFilters = selectedGenreIds.length > 0 || selectedYears.length > 0 || selectedType !== 'all';
    if (!hasActiveFilters) {
      setGenreFilteredMovies([]);
      setIsLoadingGenreFilter(false);
      return;
    }

    let isMounted = true;
    setIsLoadingGenreFilter(true);

    const fetchGenreMovies = async () => {
      try {
        const params = new URLSearchParams();
        if (selectedGenreIds.length > 0) {
          params.append('with_genres', selectedGenreIds.join(','));
        }
        if (selectedYears.length > 0) {
          params.append('years', selectedYears.join(','));
        }
        if (selectedType) {
          params.append('type', selectedType);
        }

        const res = await fetch(`/api/tmdb/discover?${params.toString()}`);
        if (res.ok && isMounted) {
          const data = await res.json();
          if (data.success && Array.isArray(data.results)) {
            setGenreFilteredMovies(data.results);
          }
        }
      } catch (err) {
        console.warn('Discover filter fetch failed:', err);
      } finally {
        if (isMounted) setIsLoadingGenreFilter(false);
      }
    };

    fetchGenreMovies();

    return () => {
      isMounted = false;
    };
  }, [selectedGenreIds, selectedYears, selectedType]);

  // Unified Search debouncing
  useEffect(() => {
    if (!searchQuery.trim() && !selectedHub) {
      setSearchResults([]);
      setIsLoadingSearch(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoadingSearch(true);
      try {
        const q = searchQuery.trim() || selectedHub || '';
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
        if (res.ok) {
          const data = await res.json();
          let items: SearchResult[] = data.results || [];
          if (selectedHub) {
            items = items.filter(
              (it) =>
                (it.siteId && it.siteId.toLowerCase() === selectedHub.toLowerCase()) ||
                it.site.toLowerCase() === selectedHub.toLowerCase()
            );
          }
          setSearchResults(items);
        }
      } catch (err) {
        console.error('Search failed:', err);
      } finally {
        setIsLoadingSearch(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, selectedHub]);

  // Spatial Navigation Hook for LG webOS / Tizen / Keyboard
  const handleBackNavigation = useCallback(() => {
    if (activeMedia) {
      setActiveMedia(null);
      return;
    }
    if (isGenreModalOpen) {
      setIsGenreModalOpen(false);
      return;
    }
    if (selectedGenreIds.length > 0) {
      setSelectedGenreIds([]);
      return;
    }
    if (searchQuery || selectedHub) {
      setSearchQuery('');
      setSelectedHub(null);
      setSearchResults([]);
      return;
    }
  }, [activeMedia, isGenreModalOpen, selectedGenreIds, searchQuery, selectedHub]);

  const handleEnterKey = useCallback((targetEl: HTMLElement) => {
    targetEl.click();
  }, []);

  const { currentFocusId, navigateDirection, isTvMode } = useSpatialNavigation({
    active: true,
    onBack: handleBackNavigation,
    onEnter: handleEnterKey,
  });

  const handleSelectMedia = (item: MediaItem) => {
    setActiveMedia(item);
  };

  const handleSelectSearchResult = (result: SearchResult) => {
    const item: MediaItem = {
      id: result.id,
      title: result.title,
      titleFa: result.titleFa || result.title,
      type: 'movie',
      overview: `منبع استخراج‌شده از وب‌سایت ${result.site}`,
      overviewFa: `این عنوان مستقیماً از وب‌سایت ${result.site} استخراج شده و آماده پخش آنلاین یا دانلود است.`,
      posterUrl: result.posterUrl,
      backdropUrl: result.posterUrl,
      rating: 8.2,
      releaseYear: result.year || '2024',
      genres: [result.site, 'سینمایی'],
      quality: result.quality || '1080p Web-DL',
      hasDubbed: result.hasDubbed ?? true,
      hasSubbed: result.hasSubbed ?? true,
      sourceUrl: result.link,
      sourceSite: result.site,
      wpPostId: result.wpPostId,
      isDirectExtractorDisabled: result.isDirectExtractorDisabled,
      siteBadge: result.siteBadge,
      directUrl: result.directUrl || result.link,
    };
    setActiveMedia(item);
  };

  const isSearchActive = Boolean(searchQuery.trim() || selectedHub);

  return (
    <div className="min-h-screen bg-[#020204] text-zinc-100 flex flex-col font-sans selection:bg-indigo-600 selection:text-white relative overflow-x-hidden">
      {/* Interactive Cursor-Tracking Ambient Lighting Atmosphere */}
      <AmbientBackground />

      {/* Top Banner Navigation, Central Frosted Glass Search & 3D Coverflow Carousel Hub */}
      <HeroSearch
        searchQuery={searchQuery}
        onSearchChange={(q) => {
          setSearchQuery(q);
          if (q) setSelectedGenreIds([]);
        }}
        onClearSearch={() => {
          setSearchQuery('');
          setSelectedHub(null);
          setSearchResults([]);
        }}
        isSearchActive={isSearchActive}
        selectedHub={selectedHub}
        onSelectHub={(hubId) => {
          setSelectedHub(hubId);
          if (hubId) setSelectedGenreIds([]);
        }}
        isMobile={isMobile}
        onOpenTvHelper={() => setIsTvHelperOpen(!isTvHelperOpen)}
        isTvMode={isTvMode}
      />

      {/* Main Content Area */}
      <main className="flex-1 pb-16 relative z-10">
        {isSearchActive ? (
          /* Search Results Grid (Multi-source aggregation) */
          <SearchResultsGrid
            query={searchQuery}
            results={searchResults}
            isLoading={isLoadingSearch}
            selectedHub={selectedHub}
            onSelectResult={handleSelectSearchResult}
            onClearFilter={() => {
              setSearchQuery('');
              setSelectedHub(null);
              setSearchResults([]);
            }}
          />
        ) : (
          /* Discovery & Exploration View */
          <div className="space-y-6 sm:space-y-8">
            {/* Sleek Minimalist Advanced Filter Bar with Action Button & Active Badges */}
            <div className="w-full max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
              <button
                id="btn-open-genre-filter"
                data-tv-id="btn-genre-filter"
                type="button"
                onClick={() => setIsGenreModalOpen(true)}
                className="tv-focusable flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-white/[0.05] hover:bg-white/[0.1] active:bg-white/[0.15] text-zinc-200 hover:text-white border border-white/10 hover:border-white/20 backdrop-blur-md shadow-lg transition-all group duration-200"
              >
                <SlidersHorizontal className="w-4 h-4 text-amber-400 group-hover:rotate-90 transition-transform duration-300" />
                <span className="text-xs font-bold font-persian">
                  {selectedGenreIds.length + selectedYears.length + (selectedType !== 'all' ? 1 : 0) > 0
                    ? `فیلتر پیشرفته (${selectedGenreIds.length + selectedYears.length + (selectedType !== 'all' ? 1 : 0)} فیلتر فعال)`
                    : 'فیلتر پیشرفته (ژانر، سال، نوع اثر)'}
                </span>
                {(selectedGenreIds.length > 0 || selectedYears.length > 0 || selectedType !== 'all') && (
                  <span className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.8)] animate-pulse" />
                )}
              </button>

              {/* Active Selected Filter Badges & Quick Clear */}
              {(selectedGenreIds.length > 0 || selectedYears.length > 0 || selectedType !== 'all') && (
                <div className="flex items-center gap-2 flex-wrap justify-center">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {/* Content Type Badge */}
                    {selectedType !== 'all' && (
                      <span className="flex items-center gap-1 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-xs text-amber-200 font-persian">
                        <span>{selectedType === 'movie' ? '🎬 سینمایی' : '📺 سریال'}</span>
                      </span>
                    )}
                    {/* Years Badges */}
                    {selectedYears.map((yr) => (
                      <span
                        key={yr}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-zinc-800/80 border border-zinc-700 text-xs text-zinc-200 font-mono"
                      >
                        <span>{yr === 'classic' ? 'کلاسیک' : yr}</span>
                      </span>
                    ))}
                    {/* Genre Badges */}
                    {selectedGenreIds.map((id) => {
                      const g = AVAILABLE_GENRES.find((item) => item.id === id);
                      if (!g) return null;
                      return (
                        <span
                          key={id}
                          className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-600/20 border border-indigo-500/40 text-xs text-indigo-200 font-persian"
                        >
                          <span>{g.emoji}</span>
                          <span>{g.nameFa}</span>
                        </span>
                      );
                    })}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedGenreIds([]);
                      setSelectedYears([]);
                      setSelectedType('all');
                    }}
                    className="tv-focusable flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-zinc-200 border border-white/10 text-[11px] font-persian transition-colors"
                    title="پاکسازی فیلترها"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>حذف فیلترها</span>
                  </button>
                </div>
              )}
            </div>

            {/* Dynamic View: If filters are selected, render filtered live results; else show curated carousels */}
            {(selectedGenreIds.length > 0 || selectedYears.length > 0 || selectedType !== 'all') ? (
              <section className="w-full max-w-7xl mx-auto px-4 py-2">
                <div className="flex items-center justify-between mb-6 pb-3 border-b border-white/10 px-1">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setSelectedGenreIds([]);
                        setSelectedYears([]);
                        setSelectedType('all');
                      }}
                      className="tv-focusable flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white border border-white/10 text-xs font-persian transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>بازگشت به همه بخش‌ها</span>
                    </button>
                    <span className="text-xs text-zinc-400 font-mono">
                      {genreFilteredMovies.length} عنوان یافت شد
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-right">
                    <div>
                      <h2 className="text-base sm:text-lg font-black text-white font-persian">
                        عناوین فیلتر شده بر اساس فیلترهای انتخابی
                      </h2>
                      <p className="text-[11px] text-zinc-500 font-mono">
                        TMDB Live Discover API
                      </p>
                    </div>
                    <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
                      <Compass className="w-5 h-5" />
                    </div>
                  </div>
                </div>

                {isLoadingGenreFilter ? (
                  <div className="py-20 flex flex-col items-center justify-center gap-3">
                    <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
                    <span className="text-xs text-zinc-400 font-persian">
                      در حال دریافت زنده‌ی آثار منتخب از سرورهای TMDB...
                    </span>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-x-4 sm:gap-x-5 md:gap-x-6 gap-y-6 sm:gap-y-8 justify-items-center py-4">
                    {genreFilteredMovies.map((item, idx) => (
                      <div key={item.id} className="w-full flex justify-center">
                        <MovieCard
                          item={item}
                          onSelect={handleSelectMedia}
                          index={idx}
                          sliderKey={`genre-multi-${idx}`}
                          isGrid={true}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </section>
            ) : (
              /* Default 3 Discovery Sliders with Free-Drag and Bottom-Center Controls */
              <div className="space-y-4 sm:space-y-6">
                {/* Slider 1: Trending Movies */}
                <DiscoverySlider
                  sliderId="trending-movies"
                  titleFa="فیلم‌های داغ و پرطرفدار"
                  titleEn="Trending Movies"
                  subtitleFa="هفته اخیر"
                  items={trendingMovies}
                  icon={<Flame className="w-5 h-5 text-rose-500" />}
                  onSelectMedia={handleSelectMedia}
                />

                {/* Slider 2: Top TV Series */}
                <DiscoverySlider
                  sliderId="top-series"
                  titleFa="برترین سریال‌های روز"
                  titleEn="Top TV Series"
                  subtitleFa="دوبله و زیرنویس"
                  items={trendingSeries}
                  icon={<Tv className="w-5 h-5 text-indigo-400" />}
                  onSelectMedia={handleSelectMedia}
                />

                {/* Slider 3: Latest Releases */}
                <DiscoverySlider
                  sliderId="latest-releases"
                  titleFa="تازه‌ترین عناوین منتخب"
                  titleEn="Latest Releases"
                  subtitleFa="کیفیت 4K و بلوری"
                  items={latestReleases}
                  icon={<Sparkles className="w-5 h-5 text-amber-400" />}
                  onSelectMedia={handleSelectMedia}
                />
              </div>
            )}
          </div>
        )}
      </main>

      {/* TV Bottom Shortcuts Navigation Bar */}
      <footer className="border-t border-white/5 bg-[#04050a]/90 backdrop-blur-md py-4 px-6 relative z-10">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-zinc-500 font-persian">
          <div className="flex items-center gap-4 flex-wrap justify-center">
            <span className="flex items-center gap-1.5 text-zinc-400">
              <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
              <span>اتصال پایدار و تجمیع هوشمند ۷ مرجع سینمایی</span>
            </span>
            <span className="text-zinc-700">•</span>
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
              <span>پروتکل امن HTTPS و سازگار با انواع تلویزیون‌های هوشمند LG و Samsung</span>
            </span>
          </div>

          <div className="flex items-center gap-3 text-[11px] text-zinc-400">
            <span className="px-2 py-0.5 rounded-lg bg-white/5 border border-white/10 font-mono text-zinc-300">
              D-Pad / جهات
            </span>
            <span>پیمایش</span>
            <span className="px-2 py-0.5 rounded-lg bg-white/5 border border-white/10 font-mono text-zinc-300">
              OK / Enter
            </span>
            <span>انتخاب</span>
            <span className="px-2 py-0.5 rounded-lg bg-white/5 border border-white/10 font-mono text-zinc-300">
              Back / Esc
            </span>
            <span>بازگشت</span>
          </div>
        </div>
      </footer>

      {/* Multi-Select Genre & Advanced Filter Modal */}
      <GenreFilterModal
        isOpen={isGenreModalOpen}
        selectedGenreIds={selectedGenreIds}
        selectedYears={selectedYears}
        selectedType={selectedType}
        onClose={() => setIsGenreModalOpen(false)}
        onApply={(ids, years, type) => {
          setSelectedGenreIds(ids);
          setSelectedYears(years);
          setSelectedType(type);
        }}
        onReset={() => {
          setSelectedGenreIds([]);
          setSelectedYears([]);
          setSelectedType('all');
        }}
      />

      {/* Embedded VOD Playback & Detail Modal */}
      {activeMedia && (
        <VODModal
          item={activeMedia}
          onClose={() => setActiveMedia(null)}
        />
      )}

      {/* Virtual TV Remote Helper for Desktop / Remote Testing */}
      <TVRemoteHelper
        isOpen={isTvHelperOpen}
        onClose={() => setIsTvHelperOpen(false)}
        onNavigate={navigateDirection}
        onEnter={() => {
          const focused = document.querySelector<HTMLElement>('.tv-focused');
          if (focused) focused.click();
        }}
        onBack={handleBackNavigation}
        currentFocusId={currentFocusId}
      />
    </div>
  );
}
