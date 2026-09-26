'use client';

import React, { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import AOS from 'aos';
import 'aos/dist/aos.css';

interface AOSProviderProps {
  children: React.ReactNode;
}

export function AOSProvider({ children }: AOSProviderProps) {
  const pathname = usePathname();

  useEffect(() => {
    AOS.init({
      duration: 750,
      easing: 'ease-out-cubic',
      once: true,
      offset: 60,
      delay: 50,
    });
  }, []);

  useEffect(() => {
    // Refresh AOS positions when the route changes
    AOS.refresh();
  }, [pathname]);

  return <>{children}</>;
}
