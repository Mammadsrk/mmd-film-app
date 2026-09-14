import { useEffect, useState, useCallback, useRef } from 'react';

export interface SpatialNavigationOptions {
  active?: boolean;
  onBack?: () => void;
  onEnter?: (element: HTMLElement) => void;
  containerSelector?: string;
  focusableSelector?: string;
}

/**
 * Custom hook for LG webOS / Tizen / Android TV Spatial D-Pad navigation.
 * Uses 2D geometric vector projection to locate nearest focusable neighbor
 * along directional axes (ArrowUp, ArrowDown, ArrowLeft, ArrowRight).
 *
 * TV Compatibility Safeguards:
 * 1. Handles LG webOS Back Button (keyCode 461) and Samsung Tizen Return Button (keyCode 10009).
 * 2. Seamlessly synchronizes with LG Magic Remote (mouse hover) without losing D-Pad state.
 * 3. Gracefully scrolls focused element into view with legacy fallback for older WebKit engines.
 */
export function useSpatialNavigation(options: SpatialNavigationOptions = {}) {
  const {
    active = true,
    onBack,
    onEnter,
    containerSelector = 'body',
    focusableSelector = '.tv-focusable, [data-tv-id]',
  } = options;

  const [currentFocusId, setCurrentFocusId] = useState<string | null>(null);
  const [isTvMode, setIsTvMode] = useState<boolean>(false);
  const lastActiveElementRef = useRef<HTMLElement | null>(null);

  // Focus a specific element by ID or node
  const setFocus = useCallback((target: HTMLElement | string) => {
    let el: HTMLElement | null = null;
    if (typeof target === 'string') {
      el = document.querySelector(`[data-tv-id="${target}"]`) || document.getElementById(target);
    } else {
      el = target;
    }

    if (el && document.body.contains(el)) {
      // Remove class from previous
      if (lastActiveElementRef.current && lastActiveElementRef.current !== el) {
        lastActiveElementRef.current.classList.remove('tv-focused');
      }

      el.focus({ preventScroll: true });
      el.classList.add('tv-focused');
      lastActiveElementRef.current = el;

      const tvId = el.getAttribute('data-tv-id') || el.id;
      setCurrentFocusId(tvId);

      // Safe scrollIntoView for legacy webOS
      try {
        el.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
          inline: 'center',
        });
      } catch (err) {
        // Fallback for older Chromium 38-53 webOS builds
        el.scrollIntoView(false);
      }
    }
  }, []);

  // Geometric Nearest Neighbor Calculation
  const navigateDirection = useCallback(
    (direction: 'up' | 'down' | 'left' | 'right') => {
      const focusables = Array.from(
        document.querySelectorAll<HTMLElement>(focusableSelector)
      ).filter((el) => {
        const style = window.getComputedStyle(el);
        const rect = el.getBoundingClientRect();
        return (
          style.display !== 'none' &&
          style.visibility !== 'hidden' &&
          style.opacity !== '0' &&
          rect.width > 0 &&
          rect.height > 0
        );
      });

      if (focusables.length === 0) return;

      const current = (document.activeElement as HTMLElement) || lastActiveElementRef.current;
      if (!current || !focusables.includes(current)) {
        // Default to first visible element
        setFocus(focusables[0]);
        return;
      }

      const curRect = current.getBoundingClientRect();
      const curCenterX = curRect.left + curRect.width / 2;
      const curCenterY = curRect.top + curRect.height / 2;

      let bestCandidate: HTMLElement | null = null;
      let minDistance = Infinity;

      focusables.forEach((candidate) => {
        if (candidate === current) return;

        const candRect = candidate.getBoundingClientRect();
        const candCenterX = candRect.left + candRect.width / 2;
        const candCenterY = candRect.top + candRect.height / 2;

        const deltaX = candCenterX - curCenterX;
        const deltaY = candCenterY - curCenterY;

        let isValid = false;
        let primaryDist = 0;
        let secondaryDist = 0;

        switch (direction) {
          case 'right':
            // Candidate must be strictly to the right
            isValid = deltaX > 8;
            primaryDist = deltaX;
            secondaryDist = Math.abs(deltaY);
            break;
          case 'left':
            // Candidate must be strictly to the left
            isValid = deltaX < -8;
            primaryDist = -deltaX;
            secondaryDist = Math.abs(deltaY);
            break;
          case 'down':
            // Candidate must be strictly below
            isValid = deltaY > 8;
            primaryDist = deltaY;
            secondaryDist = Math.abs(deltaX);
            break;
          case 'up':
            // Candidate must be strictly above
            isValid = deltaY < -8;
            primaryDist = -deltaY;
            secondaryDist = Math.abs(deltaX);
            break;
        }

        if (isValid) {
          // Weighted Manhattan/Euclidean distance prioritizing primary direction
          const score = primaryDist + secondaryDist * 1.8;
          if (score < minDistance) {
            minDistance = score;
            bestCandidate = candidate;
          }
        }
      });

      if (bestCandidate) {
        setFocus(bestCandidate);
      }
    },
    [focusableSelector, setFocus]
  );

  // Keydown listener for TV physical remote buttons and keyboards
  useEffect(() => {
    if (!active) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const keyCode = e.keyCode || e.which;
      const key = e.key;

      // Detect Smart TV navigation interaction
      setIsTvMode(true);

      // Check if user is typing in an input field
      const isInputActive =
        document.activeElement &&
        (document.activeElement.tagName === 'INPUT' ||
          document.activeElement.tagName === 'TEXTAREA');

      // LG webOS (461) & Tizen (10009) Back button, Escape, Backspace (when not typing)
      if (
        keyCode === 461 ||
        keyCode === 10009 ||
        key === 'Escape' ||
        (!isInputActive && (key === 'Backspace' || keyCode === 8))
      ) {
        e.preventDefault();
        e.stopPropagation();
        if (onBack) {
          onBack();
        }
        return;
      }

      // If user is inside an input, only allow vertical exit unless at text boundaries
      if (isInputActive && (key === 'ArrowLeft' || key === 'ArrowRight')) {
        return;
      }

      switch (key) {
        case 'ArrowUp':
          e.preventDefault();
          navigateDirection('up');
          break;
        case 'ArrowDown':
          e.preventDefault();
          navigateDirection('down');
          break;
        case 'ArrowLeft':
          e.preventDefault();
          navigateDirection('left');
          break;
        case 'ArrowRight':
          e.preventDefault();
          navigateDirection('right');
          break;
        case 'Enter':
          if (document.activeElement instanceof HTMLElement) {
            if (onEnter) {
              onEnter(document.activeElement);
            }
          }
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown, { passive: false });
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [active, navigateDirection, onBack, onEnter]);

  // Magic Remote / Mouse Hover synchronization
  useEffect(() => {
    const handleMouseOver = (e: MouseEvent) => {
      const target = (e.target as HTMLElement)?.closest<HTMLElement>(focusableSelector);
      if (target && target !== lastActiveElementRef.current) {
        if (lastActiveElementRef.current) {
          lastActiveElementRef.current.classList.remove('tv-focused');
        }
        target.classList.add('tv-focused');
        lastActiveElementRef.current = target;
        setCurrentFocusId(target.getAttribute('data-tv-id') || target.id);
      }
    };

    document.addEventListener('mouseover', handleMouseOver);
    return () => {
      document.removeEventListener('mouseover', handleMouseOver);
    };
  }, [focusableSelector]);

  return {
    currentFocusId,
    setFocus,
    isTvMode,
    navigateDirection,
  };
}
