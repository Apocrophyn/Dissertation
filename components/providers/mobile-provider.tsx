'use client';

import { createContext, useContext, useEffect, useState } from 'react';

const MobileContext = createContext<boolean>(false);

export function useMobileContext() {
  const context = useContext(MobileContext);
  if (context === undefined) {
    throw new Error('useMobileContext must be used within a MobileProvider');
  }
  return context;
}

export function MobileProvider({ children }: { children: React.ReactNode }) {
  const [isMobile, setIsMobile] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // During SSR and before mounting, provide a default value
  const value = mounted ? isMobile : false;

  return (
    <MobileContext.Provider value={value}>
      {children}
    </MobileContext.Provider>
  );
} 