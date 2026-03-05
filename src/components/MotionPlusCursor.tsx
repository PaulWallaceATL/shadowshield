'use client';

import React, { useEffect, useState, useRef } from "react";
// import { Cursor } from "motion-plus-react";
// import * as motion from "motion/react-client";

export function MotionPlusCursor() {
  // Use state to track if component is mounted to prevent SSR hydration issues
  const [isMounted, setIsMounted] = useState(false);
  const cursorDotRef = useRef<HTMLDivElement>(null);
  
  // Only run effects after component is mounted on the client side
  useEffect(() => {
    setIsMounted(true);
    
    // Handle mouse movement to update cursor position
    const handleMouseMove = (e: MouseEvent) => {
      if (cursorDotRef.current) {
        // Update position with smooth animation
        cursorDotRef.current.style.left = `${e.clientX}px`;
        cursorDotRef.current.style.top = `${e.clientY}px`;
        cursorDotRef.current.style.opacity = '1';
      }
    };
    
    // Handle mouse leave
    const handleMouseLeave = () => {
      if (cursorDotRef.current) {
        cursorDotRef.current.style.opacity = '0';
      }
    };
    
    // Handle mouse enter
    const handleMouseEnter = () => {
      if (cursorDotRef.current) {
        cursorDotRef.current.style.opacity = '1';
      }
    };
    
    // Apply cursor hiding styles
    if (typeof document !== 'undefined') {
      document.body.style.cursor = 'none';
      document.body.classList.add('custom-cursor-ready');
    }
    
    // Add event listeners
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseleave', handleMouseLeave);
    document.addEventListener('mouseenter', handleMouseEnter);
    
    // Clean up on unmount
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
      document.removeEventListener('mouseenter', handleMouseEnter);
      
      // Restore default cursor on unmount
      if (typeof document !== 'undefined') {
        document.body.style.cursor = 'auto';
        document.body.classList.remove('custom-cursor-ready');
      }
    };
  }, []);
  
  if (!isMounted) return null;
  
  // Return a custom cursor element that can be styled with CSS
  return (
    <div className="custom-cursor">
      <div ref={cursorDotRef} className="cursor-dot"></div>
    </div>
  );
}

export default MotionPlusCursor; 