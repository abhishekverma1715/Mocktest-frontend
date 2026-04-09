import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Custom hook for exam timer to prevent unnecessary re-renders
 * The timer only triggers re-renders when the display changes,
 * and stores precise timing in refs for accuracy
 */
export function useExamTimer(initialSeconds, onTimeUp) {
  const [displayTime, setDisplayTime] = useState(initialSeconds);
  const timeLeftRef = useRef(initialSeconds);
  const timerRef = useRef(null);
  const onTimeUpRef = useRef(onTimeUp);
  
  // Keep callback ref updated
  useEffect(() => {
    onTimeUpRef.current = onTimeUp;
  }, [onTimeUp]);

  const startTimer = useCallback(() => {
    if (timerRef.current) return; // Already started
    
    timerRef.current = setInterval(() => {
      timeLeftRef.current -= 1;
      
      // Only update display state (triggers re-render only when display changes)
      setDisplayTime(timeLeftRef.current);
      
      if (timeLeftRef.current <= 0) {
        clearInterval(timerRef.current);
        timerRef.current = null;
        onTimeUpRef.current?.();
      }
    }, 1000);
  }, []);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const getTimeLeft = useCallback(() => timeLeftRef.current, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  return {
    displayTime,
    startTimer,
    stopTimer,
    getTimeLeft,
    isLow: displayTime <= 120,
    isCritical: displayTime <= 30,
  };
}

/**
 * Format seconds to HH:MM:SS or MM:SS string
 */
export function formatTime(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  
  if (h > 0) {
    return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export default useExamTimer;
