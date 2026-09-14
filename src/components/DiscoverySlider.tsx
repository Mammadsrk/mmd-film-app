import React, { useRef, useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Flame, ArrowUpRight } from 'lucide-react';
import { MediaItem } from '../types';
import { MovieCard } from './MovieCard';
import { ViewAllModal } from './ViewAllModal';

interface DiscoverySliderProps {
  titleFa: string;
  titleEn: string;
  subtitleFa?: string;
  items: MediaItem[];
  sliderId: string;
  icon?: React.ReactNode;
  onSelectMedia: (item: MediaItem) => void;
}

export const DiscoverySlider: React.FC<DiscoverySliderProps> = ({
  titleFa,
  titleEn,
  subtitleFa,
  items,
  sliderId,
  icon,
  onSelectMedia,
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [isDraggingState, setIsDraggingState] = useState(false);
  const [isViewAllOpen, setIsViewAllOpen] = useState(false);

  // Looped items for continuous uninterrupted streaming (without 1-second gaps)
  const displayTriplets = items.length >= 4 ? [0, 1, 2] : [0];

  // 1:1 Drag & Inertia Momentum Tracking
  const isPointerDown = useRef(false);
  const startX = useRef(0);
  const startScrollLeft = useRef(0);
  const historyRef = useRef<Array<{ x: number; time: number }>>([]);
  const momentumRaf = useRef<number | null>(null);
  const idleDriftRaf = useRef<number | null>(null);
  const hasDragged = useRef(false);
  const totalDragDistance = useRef(0);

  // Stop any active animations
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

  // Initialize scroll position to center triplet so scrolling works both ways seamlessly
  useEffect(() => {
    if (items.length >= 4 && scrollContainerRef.current) {
      const el = scrollContainerRef.current;
      const oneThird = el.scrollWidth / 3;
      if (oneThird > 200 && el.scrollLeft < 50) {
        el.scrollLeft = oneThird;
      }
    }
  }, [items]);

  // Single-card step scroll for the bottom-center glassmorphic buttons (تکی جابه‌جا شدن)
  const handleStepScroll = (direction: 'left' | 'right') => {
    stopAnimations();
    // Dismiss any active hover holograms, tooltips or focus rings immediately
    window.dispatchEvent(new CustomEvent('dismiss-movie-hover'));
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }

    if (!scrollContainerRef.current) return;
    const cardEl = scrollContainerRef.current.querySelector('.discovery-card-wrapper');
    const stepSize = cardEl ? (cardEl as HTMLElement).offsetWidth + 16 : 256;

    scrollContainerRef.current.scrollBy({
      left: direction === 'left' ? -stepSize : stepSize,
      behavior: 'smooth',
    });
  };

  // Continuous, calm stream when idle (~14px/s for smooth, relaxing drift)
  useEffect(() => {
    let lastDriftTimestamp = performance.now();

    const runIdleDrift = (now: number) => {
      const dt = Math.min((now - lastDriftTimestamp) / 1000, 0.05);
      lastDriftTimestamp = now;

      if (!isHovered && !isPointerDown.current && scrollContainerRef.current) {
        const el = scrollContainerRef.current;
        // Calm, relaxed continuous drift (~14px per second)
        el.scrollLeft += 14 * dt;

        // Seamless endless loop wrapping
        const oneThird = el.scrollWidth / 3;
        if (oneThird > 100) {
          if (el.scrollLeft >= oneThird * 2) {
            el.scrollLeft -= oneThird;
          } else if (el.scrollLeft <= 5) {
            el.scrollLeft += oneThird;
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
  }, [isHovered, isDraggingState, items.length]);

  // Pointer Down (Mouse or Touch) for Direct 1:1 Drag
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    stopAnimations();

    window.dispatchEvent(new CustomEvent('dismiss-movie-hover'));
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }

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

  // Pointer Move: Exact 1:1 Mapping with instant response
  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isPointerDown.current || !scrollContainerRef.current) return;

    const deltaX = e.clientX - startX.current;
    totalDragDistance.current = Math.abs(deltaX);

    if (totalDragDistance.current > 14) {
      hasDragged.current = true;
      if (!isDraggingState) setIsDraggingState(true);
      window.dispatchEvent(new CustomEvent('dismiss-movie-hover'));
    }

    if (!hasDragged.current) return;

    // Direct 1:1 movement with cursor
    const el = scrollContainerRef.current;
    el.scrollLeft = startScrollLeft.current - deltaX;

    // Endless wrap during drag
    const oneThird = el.scrollWidth / 3;
    if (oneThird > 100) {
      if (el.scrollLeft >= oneThird * 2) {
        el.scrollLeft -= oneThird;
        startScrollLeft.current -= oneThird;
      } else if (el.scrollLeft <= 5) {
        el.scrollLeft += oneThird;
        startScrollLeft.current += oneThird;
      }
    }

    const now = performance.now();
    historyRef.current.push({ x: e.clientX, time: now });
    if (historyRef.current.length > 5) {
      historyRef.current.shift();
    }
  };

  // Pointer Up: Release & Apply Natural Momentum
  const handlePointerUp = () => {
    if (!isPointerDown.current) return;
    isPointerDown.current = false;

    // If movement was minimal (<= 14px), treat strictly as a tap/click and do not block upcoming click event
    if (totalDragDistance.current <= 14) {
      hasDragged.current = false;
      setIsDraggingState(false);
    } else {
      setTimeout(() => {
        setIsDraggingState(false);
        hasDragged.current = false;
      }, 50);
    }

    if (!scrollContainerRef.current || historyRef.current.length < 2) return;

    const now = performance.now();
    const recent = historyRef.current.filter((p) => now - p.time < 120);
    if (recent.length >= 2) {
      const first = recent[0];
      const last = recent[recent.length - 1];
      const dt = last.time - first.time;
      if (dt > 10) {
        const vx = (last.x - first.x) / dt; // px / ms

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

            const oneThird = el.scrollWidth / 3;
            if (oneThird > 100) {
              if (el.scrollLeft >= oneThird * 2) {
                el.scrollLeft -= oneThird;
              } else if (el.scrollLeft <= 5) {
                el.scrollLeft += oneThird;
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

  const handleCardClick = (item: MediaItem) => {
    if (hasDragged.current) {
      return;
    }
    onSelectMedia(item);
  };

  if (!items || items.length === 0) return null;

  return (
    <>
      <section
        className="relative w-full max-w-7xl mx-auto px-4 py-4 sm:py-5 group/slider select-none"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => {
          setIsHovered(false);
        }}
      >
        {/* Sleek Bilingual Header */}
        <div className="flex items-center justify-between mb-3 px-1">
          {/* Left: English Title & View All */}
          <div className="flex items-center gap-3">
            <span className="text-xs sm:text-sm font-mono text-zinc-400 tracking-widest uppercase font-bold">
              {titleEn}
            </span>

            {/* View All Button */}
            <button
              type="button"
              onClick={() => setIsViewAllOpen(true)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white border border-white/10 text-[11px] font-persian transition-all cursor-pointer"
            >
              <span>مشاهده همه</span>
              <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>

          {/* Right: Persian Title & Icon */}
          <div className="text-right flex items-center gap-2.5">
            <h2 className="text-lg sm:text-xl font-black text-white font-persian tracking-wide">
              {titleFa}
            </h2>
            <div className="p-1.5 rounded-xl bg-white/5 border border-white/10 text-amber-400">
              {icon || <Flame className="w-4 h-4 text-amber-500" />}
            </div>
          </div>
        </div>

        {/* Free-Drag Continuous Stream Carousel Container */}
        <div className="relative">
          {/* Horizontal Free-Drag Scroll Track with 1:1 cursor drag and endless glide */}
          <div
            ref={scrollContainerRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            onScroll={() => window.dispatchEvent(new CustomEvent('dismiss-movie-hover'))}
            className={`flex items-center gap-3 sm:gap-4 overflow-x-auto no-scrollbar py-2.5 px-1 sm:px-2 select-none touch-pan-y ${
              isDraggingState ? 'cursor-grabbing' : 'cursor-grab'
            }`}
            style={{
              scrollSnapType: 'none',
              WebkitOverflowScrolling: 'touch',
            }}
          >
            {displayTriplets.map((copyIdx) =>
              items.map((item, index) => (
                <div
                  key={`${sliderId}-${item.id}-copy-${copyIdx}`}
                  className="discovery-card-wrapper shrink-0"
                  onClick={(e) => {
                    if (totalDragDistance.current > 14) {
                      e.stopPropagation();
                      e.preventDefault();
                      return;
                    }
                    onSelectMedia(item);
                  }}
                >
                  <MovieCard
                    item={item}
                    onSelect={(selectedItem) => {
                      if (totalDragDistance.current <= 14) {
                        onSelectMedia(selectedItem);
                      }
                    }}
                    index={index}
                    sliderKey={`${sliderId}-${copyIdx}`}
                  />
                </div>
              ))
            )}
          </div>

          {/* Subtle edge fades */}
          <div className="absolute left-0 inset-y-0 w-8 bg-gradient-to-r from-[#020204] to-transparent pointer-events-none z-10 hidden sm:block" />
          <div className="absolute right-0 inset-y-0 w-8 bg-gradient-to-l from-[#020204] to-transparent pointer-events-none z-10 hidden sm:block" />
        </div>

        {/* Glassmorphic Navigation Buttons Below Slider (Centered, Single-Card Navigation) */}
        <div className="flex items-center justify-center gap-3 mt-2.5 pt-1">
          {/* Step Left Control (تکی) */}
          <button
            id={`btn-scroll-left-${sliderId}`}
            onClick={() => handleStepScroll('left')}
            tabIndex={0}
            aria-label="پیمایش تکی به چپ"
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/5 hover:bg-white/15 active:bg-white/25 text-zinc-400 hover:text-white border border-white/10 backdrop-blur-md flex items-center justify-center shadow-md transition-all duration-200 cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4 -translate-x-0.5" />
          </button>

          {/* Step Right Control (تکی) */}
          <button
            id={`btn-scroll-right-${sliderId}`}
            onClick={() => handleStepScroll('right')}
            tabIndex={0}
            aria-label="پیمایش تکی به راست"
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/5 hover:bg-white/15 active:bg-white/25 text-zinc-400 hover:text-white border border-white/10 backdrop-blur-md flex items-center justify-center shadow-md transition-all duration-200 cursor-pointer"
          >
            <ChevronRight className="w-4 h-4 translate-x-0.5" />
          </button>
        </div>
      </section>

      {/* View All Modal */}
      <ViewAllModal
        isOpen={isViewAllOpen}
        onClose={() => setIsViewAllOpen(false)}
        titleFa={titleFa}
        titleEn={titleEn}
        items={items}
        onSelectMedia={onSelectMedia}
      />
    </>
  );
};
