import { useEffect, useRef, useCallback, useState } from 'react';

const useTouchGestures = ({
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onSwipeDown,
  onPinch,
  onDoubleTap,
  onLongPress,
  swipeThreshold = 50,
  pinchThreshold = 0.1,
  doubleTapDelay = 300,
  longPressDelay = 500,
  enableSwipe = true,
  enablePinch = true,
  enableDoubleTap = true,
  enableLongPress = true,
  preventDefault = true
}) => {
  const elementRef = useRef(null);
  const touchStartRef = useRef(null);
  const touchEndRef = useRef(null);
  const lastTapRef = useRef(0);
  const longPressTimerRef = useRef(null);
  const initialPinchDistanceRef = useRef(0);
  const [isLongPressing, setIsLongPressing] = useState(false);

  // Calculate distance between two touch points
  const getTouchDistance = useCallback((touch1, touch2) => {
    const dx = touch1.clientX - touch2.clientX;
    const dy = touch1.clientY - touch2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }, []);

  // Handle touch start
  const handleTouchStart = useCallback((event) => {
    if (preventDefault) {
      event.preventDefault();
    }

    const touch = event.touches[0];
    touchStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now()
    };

    // Handle pinch gesture
    if (enablePinch && event.touches.length === 2) {
      initialPinchDistanceRef.current = getTouchDistance(event.touches[0], event.touches[1]);
    }

    // Handle long press
    if (enableLongPress && event.touches.length === 1) {
      setIsLongPressing(false);
      longPressTimerRef.current = setTimeout(() => {
        setIsLongPressing(true);
        if (onLongPress) {
          onLongPress({
            x: touch.clientX,
            y: touch.clientY,
            target: event.target
          });
        }
      }, longPressDelay);
    }
  }, [
    preventDefault,
    enablePinch,
    enableLongPress,
    getTouchDistance,
    onLongPress,
    longPressDelay
  ]);

  // Handle touch move
  const handleTouchMove = useCallback((event) => {
    if (preventDefault) {
      event.preventDefault();
    }

    // Clear long press timer on move
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
      setIsLongPressing(false);
    }

    // Handle pinch gesture
    if (enablePinch && event.touches.length === 2 && initialPinchDistanceRef.current > 0) {
      const currentDistance = getTouchDistance(event.touches[0], event.touches[1]);
      const scale = currentDistance / initialPinchDistanceRef.current;
      
      if (Math.abs(scale - 1) > pinchThreshold) {
        if (onPinch) {
          onPinch({
            scale,
            center: {
              x: (event.touches[0].clientX + event.touches[1].clientX) / 2,
              y: (event.touches[0].clientY + event.touches[1].clientY) / 2
            }
          });
        }
      }
    }
  }, [
    preventDefault,
    enablePinch,
    getTouchDistance,
    onPinch,
    pinchThreshold
  ]);

  // Handle touch end
  const handleTouchEnd = useCallback((event) => {
    if (preventDefault) {
      event.preventDefault();
    }

    // Clear long press timer
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }

    if (!touchStartRef.current) return;

    const touch = event.changedTouches[0];
    touchEndRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now()
    };

    const deltaX = touchEndRef.current.x - touchStartRef.current.x;
    const deltaY = touchEndRef.current.y - touchStartRef.current.y;
    const deltaTime = touchEndRef.current.time - touchStartRef.current.time;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    // Handle double tap
    if (enableDoubleTap && distance < 10 && deltaTime < 200) {
      const now = Date.now();
      if (now - lastTapRef.current < doubleTapDelay) {
        if (onDoubleTap) {
          onDoubleTap({
            x: touch.clientX,
            y: touch.clientY,
            target: event.target
          });
        }
        lastTapRef.current = 0; // Reset to prevent triple tap
      } else {
        lastTapRef.current = now;
      }
    }

    // Handle swipe gestures
    if (enableSwipe && distance > swipeThreshold && deltaTime < 1000) {
      const isHorizontal = Math.abs(deltaX) > Math.abs(deltaY);
      
      if (isHorizontal) {
        if (deltaX > 0 && onSwipeRight) {
          onSwipeRight({
            distance: Math.abs(deltaX),
            velocity: Math.abs(deltaX) / deltaTime,
            startPoint: { x: touchStartRef.current.x, y: touchStartRef.current.y },
            endPoint: { x: touchEndRef.current.x, y: touchEndRef.current.y }
          });
        } else if (deltaX < 0 && onSwipeLeft) {
          onSwipeLeft({
            distance: Math.abs(deltaX),
            velocity: Math.abs(deltaX) / deltaTime,
            startPoint: { x: touchStartRef.current.x, y: touchStartRef.current.y },
            endPoint: { x: touchEndRef.current.x, y: touchEndRef.current.y }
          });
        }
      } else {
        if (deltaY > 0 && onSwipeDown) {
          onSwipeDown({
            distance: Math.abs(deltaY),
            velocity: Math.abs(deltaY) / deltaTime,
            startPoint: { x: touchStartRef.current.x, y: touchStartRef.current.y },
            endPoint: { x: touchEndRef.current.x, y: touchEndRef.current.y }
          });
        } else if (deltaY < 0 && onSwipeUp) {
          onSwipeUp({
            distance: Math.abs(deltaY),
            velocity: Math.abs(deltaY) / deltaTime,
            startPoint: { x: touchStartRef.current.x, y: touchStartRef.current.y },
            endPoint: { x: touchEndRef.current.x, y: touchEndRef.current.y }
          });
        }
      }
    }

    // Reset
    touchStartRef.current = null;
    touchEndRef.current = null;
    initialPinchDistanceRef.current = 0;
    setIsLongPressing(false);
  }, [
    preventDefault,
    enableDoubleTap,
    enableSwipe,
    onDoubleTap,
    onSwipeLeft,
    onSwipeRight,
    onSwipeUp,
    onSwipeDown,
    doubleTapDelay,
    swipeThreshold
  ]);

  // Attach event listeners
  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    // Add passive: false to allow preventDefault
    const options = { passive: false };

    element.addEventListener('touchstart', handleTouchStart, options);
    element.addEventListener('touchmove', handleTouchMove, options);
    element.addEventListener('touchend', handleTouchEnd, options);

    return () => {
      element.removeEventListener('touchstart', handleTouchStart, options);
      element.removeEventListener('touchmove', handleTouchMove, options);
      element.removeEventListener('touchend', handleTouchEnd, options);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
      }
    };
  }, []);

  return {
    elementRef,
    isLongPressing,
    // Helper functions
    enableGestures: (element) => {
      if (element && element !== elementRef.current) {
        elementRef.current = element;
      }
    },
    disableGestures: () => {
      elementRef.current = null;
    }
  };
};

export default useTouchGestures;