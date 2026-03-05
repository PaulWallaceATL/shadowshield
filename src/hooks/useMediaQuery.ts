'use client';

import { useState, useEffect } from 'react';

/**
 * Custom hook for handling media queries in React components
 * @param query The media query to check (e.g. '(max-width: 640px)')
 * @returns Boolean indicating if the media query matches
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState<boolean>(false);

  useEffect(() => {
    // Check if window is available (client-side)
    if (typeof window === 'undefined') {
      return;
    }

    const media = window.matchMedia(query);
    
    // Set initial value
    setMatches(media.matches);

    // Define listener function
    const listener = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    // Add event listener
    media.addEventListener('change', listener);
    
    // Clean up function
    return () => {
      media.removeEventListener('change', listener);
    };
  }, [query]); // Re-run effect if query changes

  return matches;
} 