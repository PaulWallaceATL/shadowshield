'use client';

import { useEffect } from "react";

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Add effect to handle possible CSS initialization
  useEffect(() => {
    // Force a repaint/reflow of the page to ensure styles are applied
    document.documentElement.style.display = 'none';
    document.documentElement.offsetHeight; // Trigger a reflow
    document.documentElement.style.display = '';
    
    // Apply any required classes
    document.documentElement.classList.add('js-enabled');
    
    return () => {
      document.documentElement.classList.remove('js-enabled');
    };
  }, []);
  
  return (
    <div className="min-h-screen w-full bg-[#1a1a1a]">
      {children}
    </div>
  );
}