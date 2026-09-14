import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Film,
  PlayCircle,
  Clapperboard,
  Tv,
  Video,
  Sparkles,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Globe,
  Radio,
} from 'lucide-react';
import { HubSiteInfo } from '../types';

interface GlassRingsProps {
  isSearchActive: boolean;
  selectedHub: string | null;
  onSelectHub: (hubId: string | null) => void;
  isMobile: boolean;
}

export const HUBS_DATA: (HubSiteInfo & { domainIconUrl?: string; logoText?: string })[] = [
  {
    id: 'doostihaa',
    name: 'Doostihaa',
    nameFa: 'دوستی‌ها',
    domain: 'doostihaa.com',
    tagline: 'دوبله فارسی اختصاصی و بلوری',
    accentColor: '#3b82f6',
    iconName: 'Film',
    logoText: 'DH',
  },
  {
    id: 'zardfilm',
    name: 'Zardfilm',
    nameFa: 'زردفیلم',
    domain: 'zardfilm.in',
    tagline: 'کیفیت‌های 4K و سینمایی',
    accentColor: '#eab308',
    iconName: 'PlayCircle',
    logoText: 'ZF',
  },
  {
    id: 'film2movie',
    name: 'Film2Movie',
    nameFa: 'فیلم‌تومووی',
    domain: 'myf2m.net',
    tagline: 'آرشیو سینمایی و سرعت بالا',
    accentColor: '#10b981',
    iconName: 'Clapperboard',
    logoText: 'F2M',
  },
  {
    id: 'hexdownload',
    name: 'HexDownload',
    nameFa: 'هکس‌دانلود',
    domain: 'hexdownload.co',
    tagline: 'پخش و سرور دانلود اختصاصی',
    accentColor: '#a855f7',
    iconName: 'Tv',
    logoText: 'HEX',
  },
  {
    id: 'zarinpakhsh',
    name: 'ZarinPakhsh',
    nameFa: 'زرین‌پخش',
    domain: 'zarinpakhsh.ir',
    tagline: 'ترافیک نیم‌بها و دانلود آسان',
    accentColor: '#ec4899',
    iconName: 'Video',
    logoText: 'ZP',
  },
  {
    id: 'filmchi',
    name: 'Filmchi',
    nameFa: 'فیلمچی',
    domain: 'filmchi.net',
    tagline: 'نسخه‌های کم‌حجم x265',
    accentColor: '#f97316',
    iconName: 'Sparkles',
    logoText: 'FC',
  },
  {
    id: 'nextmovie',
    name: 'NextMovie',
    nameFa: 'نکست‌مووی',
    domain: 'nxmweb.com',
    tagline: 'درگاه سریع مرجع NXM',
    accentColor: '#ef4444',
    iconName: 'Globe',
    isDirectExtractorDisabled: true,
    siteBadge: 'درگاه اختصاصی',
    directUrl: 'https://nxmweb.com',
    logoText: 'NXM',
  },
];

export const GlassRings: React.FC<GlassRingsProps> = ({
  isSearchActive,
  selectedHub,
  onSelectHub,
  isMobile,
}) => {
  const [isHovered, setIsHovered] = useState<boolean>(false);
  const [isDraggingState, setIsDraggingState] = useState<boolean>(false);
  const [imgErrors, setImgErrors] = useState<Record<string, boolean>>({});

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isPointerDown = useRef<boolean>(false);
  const startX = useRef<number>(0);
  const startScrollLeft = useRef<number>(0);
  const hasDragged = useRef<boolean>(false);
  const totalDragDistance = useRef<number>(0);
  const historyRef = useRef<Array<{ x: number; time: number }>>([]);
  const momentumRaf = useRef<number | null>(null);
  const idleDriftRaf = useRef<number | null>(null);

  // 5 copies for truly endless bidirectional smooth drag without boundary limits
  const displayTriplets = [0, 1, 2, 3, 4];

  const stopAnimations = useCallback(() => {
    if (momentumRaf.current) {
      cancelAnimationFrame(momentumRaf.current);
      momentumRaf.current = null;
    }
    if (idleDriftRaf.current) {
      cancelAnimationFrame(idleDriftRaf.current);
      idleDriftRaf.current = null;
    }
  }, []);

  // Initialize scroll position to center so it wraps effortlessly both directions
  useEffect(() => {
    if (scrollContainerRef.current) {
      const el = scrollContainerRef.current;
      const oneThird = el.scrollWidth / 5;
      if (oneThird > 150 && el.scrollLeft < 50) {
        el.scrollLeft = oneThird * 2;
      }
    }
  }, []);

  // Step scroll for single-card advance
  const handleStepScroll = (direction: 'left' | 'right') => {
    stopAnimations();
    if (!scrollContainerRef.current) return;
    const itemEl = scrollContainerRef.current.querySelector('.hub-source-card');
    const stepSize = itemEl ? (itemEl as HTMLElement).offsetWidth + 12 : 200;

    scrollContainerRef.current.scrollBy({
      left: direction === 'left' ? -stepSize : stepSize,
      behavior: 'smooth',
    });
  };

  // Continuous, smooth stream when idle (~22px/s steady gentle conveyor speed)
  useEffect(() => {
    let lastDriftTimestamp = performance.now();

    const runIdleDrift = (now: number) => {
      const dt = Math.min((now - lastDriftTimestamp) / 1000, 0.05);
      lastDriftTimestamp = now;

      if (!isHovered && !isPointerDown.current && scrollContainerRef.current) {
        const el = scrollContainerRef.current;
        // Calm continuous glide (~22px/s)
        el.scrollLeft += 22 * dt;

        // Endless loop wrapping across 5 triplets
        const segment = el.scrollWidth / 5;
        if (segment > 100) {
          if (el.scrollLeft >= segment * 3.5) {
            el.scrollLeft -= segment * 2;
          } else if (el.scrollLeft <= segment * 0.5) {
            el.scrollLeft += segment * 2;
          }
        }
      }

      idleDriftRaf.current = requestAnimationFrame(runIdleDrift);
    };

    if (!isHovered && !isDraggingState) {
      idleDriftRaf.current = requestAnimationFrame(runIdleDrift);
    }

    return () => {
      if (idleDriftRaf.current) cancelAnimationFrame(idleDriftRaf.current);
    };
  }, [isHovered, isDraggingState]);

  // Pointer Down for 1:1 Direct Drag
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    stopAnimations();

    isPointerDown.current = true;
    hasDragged.current = false;
    totalDragDistance.current = 0;
    startX.current = e.clientX;
    const now = performance.now();
    historyRef.current = [{ x: e.clientX, time: now }];

    if (scrollContainerRef.current) {
      startScrollLeft.current = scrollContainerRef.current.scrollLeft;
    }
  };

  // Pointer Move: 1:1 Tracking with unlimited bidirectional dragging
  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isPointerDown.current || !scrollContainerRef.current) return;

    const deltaX = e.clientX - startX.current;
    totalDragDistance.current = Math.abs(deltaX);

    if (totalDragDistance.current > 10) {
      hasDragged.current = true;
      if (!isDraggingState) setIsDraggingState(true);
    }

    if (!hasDragged.current) return;

    // Direct 1:1 movement with cursor
    const el = scrollContainerRef.current;
    el.scrollLeft = startScrollLeft.current - deltaX;

    // Endless wrap during drag
    const segment = el.scrollWidth / 5;
    if (segment > 100) {
      if (el.scrollLeft >= segment * 3.5) {
        el.scrollLeft -= segment * 2;
        startScrollLeft.current -= segment * 2;
      } else if (el.scrollLeft <= segment * 0.5) {
        el.scrollLeft += segment * 2;
        startScrollLeft.current += segment * 2;
      }
    }

    const now = performance.now();
    historyRef.current.push({ x: e.clientX, time: now });
    if (historyRef.current.length > 5) {
      historyRef.current.shift();
    }
  };

  // Pointer Up: Release & Apply Momentum
  const handlePointerUp = () => {
    if (!isPointerDown.current) return;
    isPointerDown.current = false;

    if (totalDragDistance.current <= 10) {
      hasDragged.current = false;
      setIsDraggingState(false);
    } else {
      setTimeout(() => {
        setIsDraggingState(false);
        hasDragged.current = false;
      }, 60);
    }

    if (!scrollContainerRef.current || historyRef.current.length < 2) return;

    const now = performance.now();
    const recent = historyRef.current.filter((p) => now - p.time < 120);
    if (recent.length >= 2) {
      const first = recent[0];
      const last = recent[recent.length - 1];
      const dt = last.time - first.time;
      if (dt > 10) {
        const vx = (last.x - first.x) / dt;

        if (Math.abs(vx) > 0.15) {
          let currentSpeed = vx * 16;
          const maxSpeed = 40;
          currentSpeed = Math.max(-maxSpeed, Math.min(maxSpeed, currentSpeed));
          const friction = 0.94;

          const stepMomentum = () => {
            if (!scrollContainerRef.current || Math.abs(currentSpeed) < 0.3) {
              momentumRaf.current = null;
              return;
            }

            const el = scrollContainerRef.current;
            el.scrollLeft -= currentSpeed;

            const segment = el.scrollWidth / 5;
            if (segment > 100) {
              if (el.scrollLeft >= segment * 3.5) {
                el.scrollLeft -= segment * 2;
              } else if (el.scrollLeft <= segment * 0.5) {
                el.scrollLeft += segment * 2;
              }
            }

            currentSpeed *= friction;
            momentumRaf.current = requestAnimationFrame(stepMomentum);
          };

          momentumRaf.current = requestAnimationFrame(stepMomentum);
        }
      }
    }
  };

  const handleHubClick = (hub: (typeof HUBS_DATA)[0]) => {
    if (totalDragDistance.current > 10) return;

    if (hub.id === 'nextmovie') {
      if (typeof window !== 'undefined' && hub.directUrl) {
        window.open(`/api/web-proxy?url=${encodeURIComponent(hub.directUrl)}`, '_blank', 'noopener,noreferrer');
      }
      return;
    }

    if (selectedHub === hub.id) {
      onSelectHub(null);
    } else {
      onSelectHub(hub.id);
    }
  };

  const getFallbackIcon = (name: string) => {
    switch (name) {
      case 'Film': return <Film className="w-5 h-5" />;
      case 'PlayCircle': return <PlayCircle className="w-5 h-5" />;
      case 'Clapperboard': return <Clapperboard className="w-5 h-5" />;
      case 'Tv': return <Tv className="w-5 h-5" />;
      case 'Video': return <Video className="w-5 h-5" />;
      case 'Sparkles': return <Sparkles className="w-5 h-5" />;
      case 'Globe': return <Globe className="w-5 h-5" />;
      default: return <Film className="w-5 h-5" />;
    }
  };

  if (isMobile && isSearchActive) {
    return null;
  }

  return (
    <div
      className={`relative w-full max-w-7xl mx-auto px-4 transition-all duration-500 z-30 select-none ${
        isSearchActive ? 'mt-3 mb-2' : 'mt-4 sm:mt-6 mb-3'
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setIsDraggingState(false);
      }}
    >
      {/* Slider Header */}
      <div className="flex items-center justify-between px-2 mb-2">
        {/* Left: Step Navigators */}
        <div className="flex items-center gap-1.5">
          <button
            id="btn-hub-scroll-left"
            data-tv-id="hub-scroll-left"
            onClick={() => handleStepScroll('left')}
            aria-label="پیمایش به چپ"
            title="حرکت به چپ"
            className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 active:scale-95 border border-white/10 text-zinc-400 hover:text-white transition-all shadow-sm"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            id="btn-hub-scroll-right"
            data-tv-id="hub-scroll-right"
            onClick={() => handleStepScroll('right')}
            aria-label="پیمایش به راست"
            title="حرکت به راست"
            className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 active:scale-95 border border-white/10 text-zinc-400 hover:text-white transition-all shadow-sm"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Right: Persian Title & Pulse Indicator */}
        <div className="flex items-center gap-2">
          {selectedHub && (
            <button
              onClick={() => onSelectHub(null)}
              className="text-[11px] text-rose-400 hover:text-rose-300 font-persian underline ml-2 transition-colors"
            >
              (نمایش همه مراجع)
            </button>
          )}
          <span className="text-xs sm:text-sm font-bold text-zinc-300 font-persian">
            مراجع ۷‌گانه استریم و دانلود
          </span>
          <div className="p-1 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
            <Radio className="w-3.5 h-3.5 animate-pulse" />
          </div>
        </div>
      </div>

      {/* Free-Drag Continuous Stream Carousel */}
      <div className="relative">
        <div
          ref={scrollContainerRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          className={`flex items-center gap-3 overflow-x-auto no-scrollbar py-2.5 px-1 select-none touch-pan-y ${
            isDraggingState ? 'cursor-grabbing' : 'cursor-grab'
          }`}
          style={{
            scrollSnapType: 'none',
            WebkitOverflowScrolling: 'touch',
          }}
        >
          {displayTriplets.map((copyIdx) =>
            HUBS_DATA.map((hub) => {
              const isSelected = selectedHub === hub.id;
              const isNextMovie = hub.id === 'nextmovie';
              const faviconUrl = `https://www.google.com/s2/favicons?domain=${hub.domain}&sz=128`;
              const hasImgError = imgErrors[hub.id];

              return (
                <div
                  key={`hub-${hub.id}-copy-${copyIdx}`}
                  className="hub-source-card shrink-0"
                  onClick={() => handleHubClick(hub)}
                >
                  <button
                    id={`hub-pill-${hub.id}-${copyIdx}`}
                    type="button"
                    tabIndex={0}
                    className={`relative group flex items-center gap-3 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-2xl border backdrop-blur-xl transition-all duration-300 text-right ${
                      isSelected
                        ? 'bg-indigo-950/90 border-indigo-400 ring-2 ring-indigo-400/40 shadow-[0_0_25px_rgba(99,102,241,0.35)] scale-[1.03]'
                        : 'bg-[#0a0c16]/80 hover:bg-[#121626]/90 border-white/10 hover:border-white/25 shadow-md hover:scale-[1.02]'
                    }`}
                    style={{
                      minWidth: isMobile ? '160px' : '190px',
                    }}
                    title={isNextMovie ? 'ورود به درگاه اختصاصی نکست‌مووی' : `${hub.nameFa} (${hub.name}) - ${hub.tagline}`}
                  >
                    {/* Brand Colored Accent Glow */}
                    <div
                      className="absolute -inset-0.5 rounded-2xl opacity-0 group-hover:opacity-30 blur transition-opacity pointer-events-none -z-10"
                      style={{ backgroundColor: hub.accentColor }}
                    />

                    {/* Logo / Favicon Visual */}
                    <div
                      className="relative w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center shrink-0 overflow-hidden shadow-inner border transition-transform duration-300 group-hover:scale-105"
                      style={{
                        backgroundColor: `${hub.accentColor}18`,
                        borderColor: `${hub.accentColor}40`,
                      }}
                    >
                      {!hasImgError ? (
                        <img
                          src={faviconUrl}
                          alt={hub.name}
                          className="w-5 h-5 object-contain rounded-sm"
                          onError={() => setImgErrors((prev) => ({ ...prev, [hub.id]: true }))}
                          loading="lazy"
                        />
                      ) : (
                        <div style={{ color: hub.accentColor }}>
                          {getFallbackIcon(hub.iconName)}
                        </div>
                      )}

                      {/* External icon for NextMovie */}
                      {isNextMovie && (
                        <div className="absolute bottom-0 right-0 p-0.5 bg-red-600 rounded-tl text-white">
                          <ExternalLink className="w-2 h-2" />
                        </div>
                      )}
                    </div>

                    {/* Hub Persian & English Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 justify-start">
                        <span className="text-xs sm:text-[13px] font-black text-white font-persian tracking-wide truncate">
                          {hub.nameFa}
                        </span>
                        {isSelected && (
                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-ping shrink-0" />
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] text-zinc-400 truncate tracking-tight font-mono">
                          {hub.domain}
                        </span>
                        {isNextMovie && (
                          <span className="text-[8px] text-red-400 font-bold px-1 rounded bg-red-950/60 border border-red-800/40">
                            ورود
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Subtle Edge Gradients */}
        <div className="absolute left-0 inset-y-0 w-8 bg-gradient-to-r from-[#020204] to-transparent pointer-events-none z-10 hidden sm:block" />
        <div className="absolute right-0 inset-y-0 w-8 bg-gradient-to-l from-[#020204] to-transparent pointer-events-none z-10 hidden sm:block" />
      </div>
    </div>
  );
};
