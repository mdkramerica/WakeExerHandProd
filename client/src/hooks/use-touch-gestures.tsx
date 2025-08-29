import * as React from "react"

export interface SwipeDirection {
  direction: 'left' | 'right' | 'up' | 'down' | null;
  deltaX: number;
  deltaY: number;
  velocity: number;
}

export interface TouchGestureHandlers {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  onTap?: () => void;
  onLongPress?: () => void;
}

const SWIPE_THRESHOLD = 50; // Minimum distance for swipe
const VELOCITY_THRESHOLD = 0.3; // Minimum velocity for swipe
const LONG_PRESS_DURATION = 500; // Milliseconds for long press

export function useTouchGestures(handlers: TouchGestureHandlers) {
  const touchStartRef = React.useRef<{ x: number; y: number; time: number } | null>(null);
  const longPressTimerRef = React.useRef<NodeJS.Timeout | null>(null);

  const handleTouchStart = React.useCallback((e: TouchEvent) => {
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      touchStartRef.current = {
        x: touch.clientX,
        y: touch.clientY,
        time: Date.now()
      };

      // Start long press timer
      if (handlers.onLongPress) {
        longPressTimerRef.current = setTimeout(() => {
          handlers.onLongPress?.();
        }, LONG_PRESS_DURATION);
      }
    }
  }, [handlers.onLongPress]);

  const handleTouchMove = React.useCallback(() => {
    // Cancel long press on move
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  }, []);

  const handleTouchEnd = React.useCallback((e: TouchEvent) => {
    // Cancel long press timer
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }

    if (!touchStartRef.current || e.changedTouches.length !== 1) {
      return;
    }

    const touch = e.changedTouches[0];
    const touchEnd = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now()
    };

    const deltaX = touchEnd.x - touchStartRef.current.x;
    const deltaY = touchEnd.y - touchStartRef.current.y;
    const deltaTime = touchEnd.time - touchStartRef.current.time;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    const velocity = distance / deltaTime;

    // Check for tap (small movement, quick timing)
    if (distance < 10 && deltaTime < 300 && handlers.onTap) {
      handlers.onTap();
      return;
    }

    // Check for swipe
    if (distance > SWIPE_THRESHOLD && velocity > VELOCITY_THRESHOLD) {
      const absDeltaX = Math.abs(deltaX);
      const absDeltaY = Math.abs(deltaY);

      if (absDeltaX > absDeltaY) {
        // Horizontal swipe
        if (deltaX > 0 && handlers.onSwipeRight) {
          handlers.onSwipeRight();
        } else if (deltaX < 0 && handlers.onSwipeLeft) {
          handlers.onSwipeLeft();
        }
      } else {
        // Vertical swipe
        if (deltaY > 0 && handlers.onSwipeDown) {
          handlers.onSwipeDown();
        } else if (deltaY < 0 && handlers.onSwipeUp) {
          handlers.onSwipeUp();
        }
      }
    }

    touchStartRef.current = null;
  }, [handlers]);

  const attachGestures = React.useCallback((element: HTMLElement | null) => {
    if (!element) return;

    element.addEventListener('touchstart', handleTouchStart, { passive: true });
    element.addEventListener('touchmove', handleTouchMove, { passive: true });
    element.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  return { attachGestures };
}

// Higher-order component for easy gesture attachment
export function withTouchGestures<T extends {}>(
  Component: React.ComponentType<T>,
  handlers: TouchGestureHandlers
) {
  return React.forwardRef<HTMLDivElement, T>((props, ref) => {
    const elementRef = React.useRef<HTMLDivElement>(null);
    const { attachGestures } = useTouchGestures(handlers);

    React.useEffect(() => {
      const element = elementRef.current;
      if (element) {
        return attachGestures(element);
      }
    }, [attachGestures]);

    React.useImperativeHandle(ref, () => elementRef.current!);

    return (
      <div ref={elementRef} className="touch-gesture-container">
        <Component {...props} />
      </div>
    );
  });
}
